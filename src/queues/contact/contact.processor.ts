import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job, Queue, UnrecoverableError } from 'bullmq'

import { BitrixHttpClient } from '@/bitrix/client/bitrix-http.client'
import { ContactFactory } from '@/bitrix/factory/contact.factory'
import { CreateContactDto } from '@/outbox/dto/create-contact.dto'
import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'
import {
    CONTACT_DLQ,
    CONTACT_DLQ_JOB,
    CONTACT_QUEUE,
    ContactCreatePayload,
    ContactDlqJobPayload,
} from '@/queues/contact/contact.queue'
import { handleBitrixJobError } from '@/queues/handle-job-error'

@Processor(CONTACT_QUEUE)
export class ContactProcessor extends WorkerHost {
    private readonly logger = new Logger(ContactProcessor.name)

    constructor(
        @InjectQueue(CONTACT_DLQ)
        private readonly dlQueue: Queue<ContactDlqJobPayload>,
        @Inject(OUTBOX_REPOSITORY)
        private readonly outboxRepo: OutboxRepositoryInterface,
        private readonly contactFactory: ContactFactory,
        private readonly bitrixClient: BitrixHttpClient,
    ) {
        super()
    }

    async process(job: Job<ContactCreatePayload>, token?: string): Promise<any> {
        const event = await this.outboxRepo.fetchEvent(job.data.outboxId)

        if (event.bitrixId) {
            throw new UnrecoverableError(
                `Event ${event.boid} already processed: bitrixId=${event.bitrixId}`,
            )
        }

        const payload = this.contactFactory.toCreatePayload(event.payload as CreateContactDto)

        try {
            const bitrixId = await this.bitrixClient.createContact(payload)
            await this.outboxRepo.markProcessed(event.boid, bitrixId)
        } catch (error) {
            await handleBitrixJobError(
                job,
                error,
                event.boid,
                CONTACT_DLQ_JOB,
                this.dlQueue,
                this.outboxRepo,
                this.logger,
            )
        }
    }
}
