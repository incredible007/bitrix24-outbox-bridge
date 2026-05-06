import { type BitrixLeadPayload } from '@/outbox/interfaces/bitrix-lead-payload.interface'

export interface BitrixLeadJobPayloadInterface {
    payload: BitrixLeadPayload
    outboxId: number
    retryAfter?: number
}
