import { Inject, Injectable } from '@nestjs/common'

import { EventVariants } from '@/database/types'
import {
    OUTBOX_REPOSITORY,
    OutboxRepositoryInterface,
} from '@/outbox/interfaces/outbox-repository.interface'

@Injectable()
export class OutboxService {
    constructor(
        @Inject(OUTBOX_REPOSITORY) private readonly outboxRepo: OutboxRepositoryInterface,
    ) {}

    async enqueue(eventVariant: EventVariants, payload: unknown) {}
}
