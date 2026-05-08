import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job, Queue, UnrecoverableError } from 'bullmq'

import { BitrixHttpClient } from '@/bitrix/client/bitrix-http.client'
import { CompanyFactory } from '@/bitrix/factory/company.factory'
import { RATE_LIMIT_DURATION_MS, RATE_LIMIT_MAX } from '@/common/constants'
import { exponentialBackoffWithJitter } from '@/common/utils/backoff.utils'
import type { CreateCompanyDto } from '@/outbox/dto/create-company.dto'
import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'
import {
    COMPANY_DLQ,
    COMPANY_DLQ_JOB,
    COMPANY_QUEUE,
    CompanyCreatePayload,
    CompanyDlqJobPayload,
} from '@/queues/company/company.queue'
import { handleBitrixJobError } from '@/queues/handle-job-error'

@Processor(COMPANY_QUEUE, {
    limiter: {
        max: RATE_LIMIT_MAX,
        duration: RATE_LIMIT_DURATION_MS,
    },
    settings: {
        backoffStrategy: exponentialBackoffWithJitter,
    },
})
export class CompanyProcessor extends WorkerHost {
    private readonly logger = new Logger(CompanyProcessor.name)

    constructor(
        @InjectQueue(COMPANY_DLQ)
        private readonly dlQueue: Queue<CompanyDlqJobPayload>,
        @Inject(OUTBOX_REPOSITORY)
        private readonly outboxRepo: OutboxRepositoryInterface,
        private readonly companyFactory: CompanyFactory,
        private readonly bitrixClient: BitrixHttpClient,
    ) {
        super()
    }

    async process(job: Job<CompanyCreatePayload>, token?: string): Promise<any> {
        const event = await this.outboxRepo.fetchEvent(job.data.outboxId)

        if (event.bitrixId) {
            throw new UnrecoverableError(
                `Event ${event.boid} already processed: bitrixId=${event.bitrixId}`,
            )
        }

        const payload = this.companyFactory.toCreatePayload(event.payload as CreateCompanyDto)

        try {
            const bitrixId = await this.bitrixClient.createCompany(payload)
            await this.outboxRepo.markProcessed(event.boid, bitrixId)
        } catch (error) {
            await handleBitrixJobError(
                job,
                error,
                event.boid,
                COMPANY_DLQ_JOB,
                this.dlQueue,
                this.outboxRepo,
                this.logger,
            )
        }
    }
}
