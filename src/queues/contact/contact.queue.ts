import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { JobsOptions, Queue } from 'bullmq'

import { BitrixCreateContactPayload } from '@/outbox/interfaces/bitrix-create-contact-payload.interface'

export const CONTACT_QUEUE = 'contact-queue'
export const CONTACT_CREATE_JOB = 'contact-create-job'
export const CONTACT_UPDATE_JOB = 'contact-update-job'

export const contactQueueConfig = {
    name: CONTACT_QUEUE,
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

export interface ContactCreatePayload {
    payload: BitrixCreateContactPayload
    outboxId: number
    retryAfter?: number
}

interface ContactJobMap {
    [CONTACT_CREATE_JOB]: ContactCreatePayload
    [CONTACT_UPDATE_JOB]: ContactCreatePayload
}

@Injectable()
export class ContactQueue {
    constructor(@InjectQueue(CONTACT_QUEUE) private queue: Queue) {}

    add<K extends keyof ContactJobMap>(name: K, data: ContactJobMap[K], opts?: JobsOptions) {
        return this.queue.add(name, data, opts)
    }
}

export const CONTACT_DLQ = 'contact-dlq'
export const CONTACT_DLQ_JOB = 'contact-dlq-job'

export interface ContactDlqJobPayload {
    originalJob: {
        outboxId: number
        payload: BitrixCreateContactPayload
    }
    reason: string
    failedAt: Date
}

export const contactDlqConfig = {
    name: CONTACT_DLQ,
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 500,
        removeOnFail: false,
    },
}
