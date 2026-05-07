import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'

import { DatabaseHealthIndicator } from '@/health/indicators/database.health-indicator'
import { RedisHealthIndicator } from '@/health/indicators/redis.health-indicator'

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly db: DatabaseHealthIndicator,
        private readonly redis: RedisHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.isHealthy('database'),
            () => this.redis.isHealthy('redis'),
        ])
    }
}
