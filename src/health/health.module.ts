import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'

import { HealthController } from '@/health/health.controller'
import { DatabaseHealthIndicator } from '@/health/indicators/database.health-indicator'
import { RedisHealthIndicator } from '@/health/indicators/redis.health-indicator'
import { QueuesModule } from '@/queues/queues.module'

@Module({
    imports: [TerminusModule, QueuesModule],
    controllers: [HealthController],
    providers: [DatabaseHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
