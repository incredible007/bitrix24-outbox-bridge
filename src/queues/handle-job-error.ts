import { type Logger } from '@nestjs/common'
import { DelayedError, type Job, type Queue, UnrecoverableError } from 'bullmq'

import { BitrixClientError } from '@/bitrix/errors/bitrix-client.error'
import { BitrixRateLimitError } from '@/bitrix/errors/bitrix-rate-limit.error'
import { EventStatesValues } from '@/database/types'
import { type OutboxRepositoryInterface } from '@/outbox/interfaces/outbox-repository.interface'

export async function handleBitrixJobError(
    job: Job<unknown>,
    error: unknown,
    boid: number,
    dlqJobName: string,
    dlQueue: Queue,
    outboxRepo: OutboxRepositoryInterface,
    logger: Logger,
): Promise<never> {
    if (error instanceof BitrixRateLimitError) {
        logger.warn(`Rate limited, retry after ${error.retryAfter}s, job ${job.id}`)
        await job.moveToDelayed(Date.now() + error.retryAfter * 1_000)
        throw new DelayedError()
    }

    const isUnrecoverable = error instanceof BitrixClientError
    const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 0)

    if (isUnrecoverable || isLastAttempt) {
        const reason = isUnrecoverable
            ? `Client error (${error.status}): ${(error as Error).message}`
            : `Exhausted all ${job.opts.attempts} attempts`

        logger.error(`Job ${job.id} going to DLQ: ${reason}`)
        await outboxRepo.updateStatus(boid, EventStatesValues.FAILED)
        await dlQueue.add(dlqJobName, {
            originalJob: job.data,
            reason,
            failedAt: new Date(),
        })

        if (isUnrecoverable) throw new UnrecoverableError((error as Error).message)
    }

    throw error as Error
}
