import { type PaginationOptions } from '@/common/dto/pagination-options.dto'
import type * as schema from '@/database/schema'
import { type EventStates, type EventVariants } from '@/database/types'

export type Bitrix24OutboxItem = typeof schema.bitrix24Outbox.$inferSelect

export interface OutboxRepositoryInterface {
    claimPendingBatch(pagination?: PaginationOptions): Promise<Bitrix24OutboxItem[]>
    insertEvent(variant: EventVariants, payload: unknown): Promise<Bitrix24OutboxItem | undefined>
    updateStatus(oid: number, status: EventStates): Promise<void>
    markProcessed(oid: number): Promise<void>
    updateError(oid: number, errorMessage: string): Promise<void>
    resetStuckJobs(timeoutMinutes: number): Promise<void>
}

export const OUTBOX_REPOSITORY = Symbol.for('OutboxRepositoryInterface')
