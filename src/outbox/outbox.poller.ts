import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

import { EventVariantValues } from '@/database/types'
import type { BitrixLeadPayload } from '@/outbox/interfaces/bitrix-lead-payload.interface'
import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'
import { LEAD_CREATE_JOB, LeadQueue } from '@/queues/lead/lead.queue'

@Injectable()
export class OutboxPoller implements OnModuleDestroy, OnModuleInit {
    private readonly logger = new Logger(OutboxPoller.name)

    private isRunning = true

    constructor(
        @Inject(OUTBOX_REPOSITORY)
        private readonly outboxRepo: OutboxRepositoryInterface,
        private readonly leadQueue: LeadQueue,
    ) {}

    async onModuleInit() {
        await this.scheduleNextPoll()
    }

    onModuleDestroy() {
        this.isRunning = false
    }

    private async scheduleNextPoll() {
        try {
            await this.poll()
        } finally {
            if (this.isRunning) {
                setTimeout(() => this.scheduleNextPoll(), 2000)
            }
        }
    }

    private async poll() {
        try {
            await this.outboxRepo.resetStuckJobs(5)

            const res = await this.outboxRepo.claimPendingBatch()

            for (const item of res) {
                const opts = { jobId: `BITRIX-${item.idempotencyKey}` }

                switch (item.eventVariant) {
                    case EventVariantValues.CRM_COMPANY_ADD:
                        await this.leadQueue.add(
                            LEAD_CREATE_JOB,
                            {
                                payload: item.payload as BitrixLeadPayload,
                                outboxId: item.boid,
                            },
                            opts,
                        )
                        break
                    default:
                        this.logger.warn(`Unknown event variant: ${item.eventVariant}`)
                }
            }
        } catch (err) {
            this.logger.error('Poll error', err)
        }
    }
}
