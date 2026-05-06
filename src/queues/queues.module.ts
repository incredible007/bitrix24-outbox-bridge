import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BitrixModule } from '@/bitrix/bitrix.module'
import { OutboxModule } from '@/outbox/outbox.module'
import { LeadProcessor } from '@/queues/lead/lead.processor'
import { leadQueueConfig } from '@/queues/lead/lead.queue'

@Module({
    imports: [BitrixModule, BullModule.registerQueue(leadQueueConfig), OutboxModule],
    providers: [LeadProcessor],
})
export class QueuesModule {}
