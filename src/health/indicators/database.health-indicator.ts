import { Inject, Injectable } from '@nestjs/common'
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus'
import { sql } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { DB_DRIZZLE } from '@/database/database.module'
import * as schema from '@/database/schema'

@Injectable()
export class DatabaseHealthIndicator {
    constructor(
        @Inject(DB_DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
        private readonly healthIndicatorService: HealthIndicatorService,
    ) {}

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const indicator = this.healthIndicatorService.check(key)
        try {
            await this.db.execute(sql`SELECT 1`)
            return indicator.up()
        } catch {
            return indicator.down({ message: 'Database unreachable' })
        }
    }
}
