import { type PaginationOptions } from '@/common/dto/pagination-options.dto'
import type * as schema from '@/database/schema'
import { type EventStates, type EventVariants } from '@/database/types'

export type Bitrix24OutboxItem = typeof schema.bitrix24Outbox.$inferSelect

export interface OutboxRepositoryInterface {
    claimPendingBatch(pagination?: PaginationOptions): Promise<Bitrix24OutboxItem[]>
    insertEvent(
        variant: EventVariants,
        payload: object,
        idempotencyKey: string,
    ): Promise<Bitrix24OutboxItem | undefined>
    updateStatus(boid: number, status: EventStates): Promise<void>
    markProcessed(boid: number, bitrixId: string): Promise<void>
    updateError(boid: number, errorMessage: string): Promise<void>
    resetStuckJobs(timeoutMinutes: number): Promise<void>
    fetchEvent(boid: number): Promise<Bitrix24OutboxItem>
}

export const OUTBOX_REPOSITORY = Symbol.for('OutboxRepositoryInterface')
