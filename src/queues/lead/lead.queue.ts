import { type BitrixLeadPayload } from '@/outbox/interfaces/bitrix-lead-payload.interface'

export const LEAD_QUEUE = 'lead-queue'
export const LEAD_QUEUE_JOB = 'lead-queue-job'

export const leadQueueConfig = {
    name: LEAD_QUEUE,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
}

export const LEAD_DLQ = 'lead-dlq'
export const LEAD_DLQ_JOB = 'lead-dlq-job'

export interface LeadDlqJobPayload {
    originalJob: {
        outboxId: number
        payload: BitrixLeadPayload
    }
    reason: string
    failedAt: Date
}

export const leadDlqConfig = {
    name: LEAD_DLQ,
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 500,
        removeOnFail: false,
    },
}
