import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job, Queue, UnrecoverableError } from 'bullmq'

import { BitrixHttpClient } from '@/bitrix/client/bitrix-http.client'
import { LeadFactory } from '@/bitrix/factory/lead.factory'
import { RATE_LIMIT_DURATION_MS, RATE_LIMIT_MAX } from '@/common/constants'
import { exponentialBackoffWithJitter } from '@/common/utils/backoff.utils'
import { CreateLeadDto } from '@/outbox/dto/create-lead.dto'
import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'
import { handleBitrixJobError } from '@/queues/handle-job-error'
import {
    LEAD_DLQ,
    LEAD_DLQ_JOB,
    LEAD_QUEUE,
    LeadCreatePayload,
    LeadDlqJobPayload,
} from '@/queues/lead/lead.queue'

@Processor(LEAD_QUEUE, {
    limiter: {
        max: RATE_LIMIT_MAX,
        duration: RATE_LIMIT_DURATION_MS,
    },
    settings: {
        backoffStrategy: exponentialBackoffWithJitter,
    },
})
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

    async process(job: Job<LeadCreatePayload>): Promise<void> {
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
            await handleBitrixJobError(
                job,
                error,
                event.boid,
                LEAD_DLQ_JOB,
                this.dlQueue,
                this.outboxRepo,
                this.logger,
            )
        }
    }
}
