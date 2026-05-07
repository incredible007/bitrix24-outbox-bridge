import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'
import { CONTACT_DLQ } from '@/queues/contact/contact.queue'
import { LeadDlqJobPayload } from '@/queues/lead/lead.queue'

@Processor(CONTACT_DLQ)
export class ContactDlqHandler extends WorkerHost {
    private readonly logger = new Logger(ContactDlqHandler.name)

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
