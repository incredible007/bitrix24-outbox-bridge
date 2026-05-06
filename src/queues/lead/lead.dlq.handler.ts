import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'
import { LEAD_DLQ, LeadDlqJobPayload } from '@/queues/lead/lead.queue'

@Processor(LEAD_DLQ)
export class LeadDlqHandler extends WorkerHost {
    private readonly logger = new Logger(LeadDlqHandler.name)

    constructor(
        @Inject(OUTBOX_REPOSITORY)
        private readonly outboxRepo: OutboxRepositoryInterface,
    ) {
        super()
    }

    async process(job: Job<LeadDlqJobPayload>): Promise<void> {
        const { originalJob, reason, failedAt } = job.data

        this.logger.error(
            `DLQ: Lead outbox#${originalJob.outboxId} failed — ${reason} at ${failedAt}`,
            JSON.stringify(originalJob.payload),
        )

        await this.outboxRepo.updateError(originalJob.outboxId, reason)
    }
}
