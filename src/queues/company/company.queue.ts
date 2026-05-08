import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { JobsOptions, Queue } from 'bullmq'

import { BitrixCreateCompanyPayload } from '@/outbox/interfaces/bitrix-create-company-payload.interface'

export const COMPANY_QUEUE = 'company-queue'
export const COMPANY_CREATE_JOB = 'company-create-job'
export const COMPANY_UPDATE_JOB = 'company-update-job'

export const companyQueueConfig = {
    name: COMPANY_QUEUE,
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

export interface CompanyCreatePayload {
    payload: BitrixCreateCompanyPayload
    outboxId: number
    retryAfter?: number
}

interface CompanyJobMap {
    [COMPANY_CREATE_JOB]: CompanyCreatePayload
    [COMPANY_UPDATE_JOB]: CompanyCreatePayload
}

@Injectable()
export class CompanyQueue {
    constructor(@InjectQueue(COMPANY_QUEUE) private queue: Queue) {}

    add<K extends keyof CompanyJobMap>(name: K, data: CompanyJobMap[K], opts?: JobsOptions) {
        return this.queue.add(name, data, opts)
    }
}

export const COMPANY_DLQ = 'company-dlq'
export const COMPANY_DLQ_JOB = 'company-dlq-job'

export interface CompanyDlqJobPayload {
    originalJob: {
        outboxId: number
        payload: BitrixCreateCompanyPayload
    }
    reason: string
    failedAt: Date
}

export const companyDlqConfig = {
    name: COMPANY_DLQ,
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 500,
        removeOnFail: false,
    },
}
