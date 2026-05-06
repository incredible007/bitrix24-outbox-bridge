import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { DelayedError, Job, Queue, UnrecoverableError } from 'bullmq'

import { BitrixHttpClient } from '@/bitrix/client/bitrix-http.client'
import { BitrixClientError } from '@/bitrix/errors/bitrix-client.error'
import { BitrixRateLimitError } from '@/bitrix/errors/bitrix-rate-limit.error'
import { LeadFactory } from '@/bitrix/factory/lead.factory'
import { EventStatesValues } from '@/database/types'
import { CreateLeadDto } from '@/outbox/dto/create-lead.dto'
import { BitrixLeadJobPayloadInterface } from '@/outbox/interfaces/bitrix-lead-job-payload.interface'
import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'
import { LEAD_DLQ, LEAD_DLQ_JOB, LEAD_QUEUE, LeadDlqJobPayload } from '@/queues/lead/lead.queue'

@Processor(LEAD_QUEUE)
export class LeadProcessor extends WorkerHost {
    private readonly logger = new Logger(LeadProcessor.name)

    constructor(
        @InjectQueue(LEAD_DLQ)
        private readonly dlQueue: Queue<LeadDlqJobPayload>,
        @Inject(OUTBOX_REPOSITORY)
        private readonly outboxRepo: OutboxRepositoryInterface,
        private readonly leadFactory: LeadFactory,
        private readonly bitrixClient: BitrixHttpClient,
    ) {
        super()
    }

    async process(job: Job<BitrixLeadJobPayloadInterface>): Promise<void> {
        const event = await this.outboxRepo.fetchEvent(job.data.outboxId)

        if (event.bitrixId) {
            throw new UnrecoverableError(
                `Event ${event.boid} already processed: bitrixId=${event.bitrixId}`,
            )
        }

        const payload = this.leadFactory.toCreatePayload(event.payload as CreateLeadDto)

        try {
            const bitrixId = await this.bitrixClient.createLead(payload)
            await this.outboxRepo.markProcessed(event.boid, bitrixId)
        } catch (error) {
            if (error instanceof BitrixRateLimitError) {
                this.logger.warn(`Rate limited, retry after ${error.retryAfter}s, job ${job.id}`)
                await job.moveToDelayed(Date.now() + error.retryAfter * 1_000)
                throw new DelayedError()
            }

            const isUnrecoverable = error instanceof BitrixClientError
            const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 0)

            if (isUnrecoverable || isLastAttempt) {
                const reason = isUnrecoverable
                    ? `Client error (${error.status}): ${error.message}`
                    : `Exhausted all ${job.opts.attempts} attempts`

                this.logger.error(`Job ${job.id} going to DLQ: ${reason}`)
                await this.outboxRepo.updateStatus(event.boid, EventStatesValues.FAILED)
                await this.dlQueue.add(LEAD_DLQ_JOB, {
                    originalJob: job.data,
                    reason,
                    failedAt: new Date(),
                })

                if (isUnrecoverable) throw new UnrecoverableError(error.message)
            }

            throw error
        }
    }
}
