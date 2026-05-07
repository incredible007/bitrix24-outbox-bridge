import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { BitrixModule } from '@/bitrix/bitrix.module'
import { CommonConfigModule } from '@/config/common-config.module'
import { DatabaseModule } from '@/database/database.module'
import { HealthModule } from '@/health/health.module'
import { OutboxModule } from '@/outbox/outbox.module'
import { QueuesModule } from '@/queues/queues.module'

@Module({
    imports: [
        BullModule.forRootAsync({
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get<string>('redis.host'),
                    port: config.get<number>('redis.port'),
                },
            }),
            inject: [ConfigService],
        }),
        DatabaseModule,
        CommonConfigModule,
        BitrixModule,
        QueuesModule,
        OutboxModule,
        HealthModule,
    ],
})
export class AppModule {}
