import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

import { EventVariantValues } from '@/database/types'
import { BitrixCreateContactPayload } from '@/outbox/interfaces/bitrix-create-contact-payload.interface'
import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'
import { CONTACT_CREATE_JOB, ContactQueue } from '@/queues/contact/contact.queue'
import { LEAD_CREATE_JOB, LeadQueue } from '@/queues/lead/lead.queue'

import type { BitrixCreateLeadPayload } from './interfaces/bitrix-create-lead-payload.interface'

@Injectable()
export class OutboxPoller implements OnModuleDestroy, OnModuleInit {
    private readonly logger = new Logger(OutboxPoller.name)

    private isRunning = true

    constructor(
        @Inject(OUTBOX_REPOSITORY)
        private readonly outboxRepo: OutboxRepositoryInterface,
        private readonly leadQueue: LeadQueue,
        private readonly contactQueue: ContactQueue,
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
                    case EventVariantValues.CRM_LEAD_ADD:
                        await this.leadQueue.add(
                            LEAD_CREATE_JOB,
                            {
                                payload: item.payload as BitrixCreateLeadPayload,
                                outboxId: item.boid,
                            },
                            opts,
                        )
                        break
                    case EventVariantValues.CRM_CONTACT_ADD:
                        await this.contactQueue.add(
                            CONTACT_CREATE_JOB,
                            {
                                payload: item.payload as BitrixCreateContactPayload,
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
