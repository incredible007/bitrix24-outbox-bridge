import { Module } from '@nestjs/common'

import { BitrixModule } from '@/bitrix/bitrix.module'
import { OUTBOX_REPOSITORY } from '@/outbox/interfaces/outbox-repository.interface'
import { OutboxController } from '@/outbox/outbox.controller'
import { OutboxRepository } from '@/outbox/outbox.repository'
import { OutboxService } from '@/outbox/outbox.service'

@Module({
    providers: [{ provide: OUTBOX_REPOSITORY, useClass: OutboxRepository }, OutboxService],
    imports: [BitrixModule],
    controllers: [OutboxController],
    exports: [OutboxRepository],
})
export class OutboxModule {}
