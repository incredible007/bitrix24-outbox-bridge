export class BitrixRateLimitError extends Error {
    constructor(public readonly retryAfter: number) {
        super('QUERY_LIMIT_EXCEEDED')
    }
}
