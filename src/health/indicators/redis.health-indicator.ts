import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus'

import { LeadQueue } from '@/queues/lead/lead.queue'

@Injectable()
export class RedisHealthIndicator {
    constructor(
        private readonly queue: LeadQueue,
        private readonly healthIndicatorService: HealthIndicatorService,
    ) {}

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const indicator = this.healthIndicatorService.check(key)
        try {
            const client = await this.queue.bullQueue.client
            await client.ping()
            return indicator.up()
        } catch {
            return indicator.down({ message: 'Redis unreachable' })
        }
    }
}
