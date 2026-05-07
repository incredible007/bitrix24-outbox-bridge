import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BitrixModule } from '@/bitrix/bitrix.module'
import { OutboxModule } from '@/outbox/outbox.module'
import { ContactDlqHandler } from '@/queues/contact/contact.dlq.handler'
import { contactDlqConfig, ContactQueue, contactQueueConfig } from '@/queues/contact/contact.queue'
import { LeadDlqHandler } from '@/queues/lead/lead.dlq.handler'
import { LeadProcessor } from '@/queues/lead/lead.processor'
import { leadDlqConfig, LeadQueue, leadQueueConfig } from '@/queues/lead/lead.queue'

@Module({
    imports: [
        BitrixModule,
        BullModule.registerQueue(leadQueueConfig),
        BullModule.registerQueue(leadDlqConfig),
        BullModule.registerQueue(contactQueueConfig),
        BullModule.registerQueue(contactDlqConfig),
        OutboxModule,
    ],
    providers: [LeadProcessor, LeadQueue, ContactQueue, ContactDlqHandler, LeadDlqHandler],
    exports: [LeadQueue, ContactQueue],
})
export class QueuesModule {}
