import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BitrixModule } from '@/bitrix/bitrix.module'
import { OutboxModule } from '@/outbox/outbox.module'
import { LeadDlqHandler } from '@/queues/lead/lead.dlq.handler'
import { LeadProcessor } from '@/queues/lead/lead.processor'
import { leadDlqConfig, leadQueueConfig } from '@/queues/lead/lead.queue'

@Module({
    imports: [
        BitrixModule,
        BullModule.registerQueue(leadQueueConfig),
        BullModule.registerQueue(leadDlqConfig),
        OutboxModule,
        LeadDlqHandler,
    ],
    providers: [LeadProcessor],
})
export class QueuesModule {}
