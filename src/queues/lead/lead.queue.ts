import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
import { JobsOptions } from 'bullmq'

import { type BitrixLeadPayload } from '@/outbox/interfaces/bitrix-lead-payload.interface'

export const LEAD_QUEUE = 'lead-queue'
export const LEAD_CREATE_JOB = 'lead-create-job'
export const LEAD_UPDATE_JOB = 'lead-update-job'

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

export interface LeadCreatePayload {
    payload: BitrixLeadPayload
    outboxId: number
    retryAfter?: number
}

interface LeadJobMap {
    [LEAD_CREATE_JOB]: LeadCreatePayload
    [LEAD_UPDATE_JOB]: LeadCreatePayload
}

@Injectable()
export class LeadQueue {
    constructor(@InjectQueue(LEAD_QUEUE) private queue: Queue) {}

    add<K extends keyof LeadJobMap>(name: K, data: LeadJobMap[K], opts?: JobsOptions) {
        return this.queue.add(name, data, opts)
    }
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
