import { Inject, Injectable } from '@nestjs/common'
import { and, eq, inArray, lt } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { DEFAULT_BATCH_SIZE, DEFAULT_PAGE } from '@/common/constants'
import { PaginationOptions } from '@/common/dto/pagination-options.dto'
import { DB_DRIZZLE } from '@/database/database.module'
import * as schema from '@/database/schema'
import { EventStates, EventVariants } from '@/database/types'
import {
    Bitrix24OutboxItem,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'

@Injectable()
export class OutboxRepository implements OutboxRepositoryInterface {
    constructor(
        @Inject(DB_DRIZZLE)
        private readonly db: PostgresJsDatabase<typeof schema>,
    ) {}

    async claimPendingBatch(pagination?: PaginationOptions): Promise<Bitrix24OutboxItem[]> {
        return await this.db.transaction(async (tx) => {
            const res = await tx
                .select()
                .from(schema.bitrix24Outbox)
                .where(eq(schema.bitrix24Outbox.eventState, 'PENDING'))
                .limit(pagination?.limit ?? DEFAULT_BATCH_SIZE)
                .offset(pagination?.page ?? DEFAULT_PAGE)
                .for('update', { skipLocked: true })

            if (res.length === 0) return []

            const oids = res.map((i) => i.boid)

            await tx
                .update(schema.bitrix24Outbox)
                .set({
                    eventState: 'PROCESSING',
                    processingAt: new Date(),
                })
                .where(inArray(schema.bitrix24Outbox.boid, oids))

            return res
        })
    }

    async insertEvent(
        variant: EventVariants,
        payload: Record<string, unknown>,
        idempotencyKey: string,
    ): Promise<Bitrix24OutboxItem | undefined> {
        const [inserted] = await this.db
            .insert(schema.bitrix24Outbox)
            .values({
                idempotencyKey,
                eventVariant: variant,
                payload,
                eventState: 'PENDING',
            })
            .onConflictDoNothing()
            .returning()

        return inserted
    }

    async updateStatus(boid: number, status: EventStates): Promise<void> {
        await this.db
            .update(schema.bitrix24Outbox)
            .set({ eventState: status })
            .where(eq(schema.bitrix24Outbox.boid, boid))
    }

    async markProcessed(boid: number): Promise<void> {
        await this.db
            .update(schema.bitrix24Outbox)
            .set({
                eventState: 'SUCCEEDED',
                processedAt: new Date(),
            })
            .where(eq(schema.bitrix24Outbox.boid, boid))
    }

    async updateError(oid: number, errorMessage: string): Promise<void> {
        await this.db
            .update(schema.bitrix24Outbox)
            .set({
                eventState: 'FAILED',
                errorMessage,
            })
            .where(eq(schema.bitrix24Outbox.boid, oid))
    }

    async resetStuckJobs(timeoutMinutes: number): Promise<void> {
        const timeout = new Date(Date.now() - timeoutMinutes * 60 * 1000)

        await this.db
            .update(schema.bitrix24Outbox)
            .set({
                eventState: 'PENDING',
                processingAt: null,
            })
            .where(
                and(
                    eq(schema.bitrix24Outbox.eventState, 'PROCESSING'),
                    lt(schema.bitrix24Outbox.processingAt, timeout),
                ),
            )
    }
}
