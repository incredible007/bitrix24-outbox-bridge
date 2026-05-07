import { ConflictException, Inject, Injectable } from '@nestjs/common'

import { EventVariants } from '@/database/types'
import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'

type BitrixPayload = { fields: Record<string, unknown> }

@Injectable()
export class OutboxService {
    constructor(
        @Inject(OUTBOX_REPOSITORY) private readonly outboxRepo: OutboxRepositoryInterface,
    ) {}

    async enqueue(eventVariant: EventVariants, payload: BitrixPayload, idempotencyKey: string) {
        const inserted = await this.outboxRepo.insertEvent(eventVariant, payload, idempotencyKey)

        if (!inserted) {
            throw new ConflictException(`Webhook with key ${idempotencyKey} already exists`)
        }
    }
}
