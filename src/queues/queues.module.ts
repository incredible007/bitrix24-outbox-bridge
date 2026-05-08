import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BitrixModule } from '@/bitrix/bitrix.module'
import { OutboxModule } from '@/outbox/outbox.module'
import { CompanyDqlHandler } from '@/queues/company/company.dql.handler'
import { CompanyProcessor } from '@/queues/company/company.processor'
import { companyDlqConfig, CompanyQueue, companyQueueConfig } from '@/queues/company/company.queue'
import { ContactDlqHandler } from '@/queues/contact/contact.dlq.handler'
import { ContactProcessor } from '@/queues/contact/contact.processor'
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
        BullModule.registerQueue(companyQueueConfig),
        BullModule.registerQueue(companyDlqConfig),
        OutboxModule,
    ],
    providers: [
        LeadProcessor,
        LeadQueue,
        LeadDlqHandler,
        ContactQueue,
        ContactProcessor,
        ContactDlqHandler,
        CompanyQueue,
        CompanyProcessor,
        CompanyDqlHandler,
    ],
    exports: [LeadQueue, ContactQueue],
})
export class QueuesModule {}
