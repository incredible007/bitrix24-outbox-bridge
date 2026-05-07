// Calculates delay before the next retry attempt. Delay grows exponentially (1s, 2s, 4s, 8s...)
// and we add a small random jitter on top to avoid all workers retrying at the exact same time
// when something goes down (thundering herd). Returns delay in ms.
export const exponentialBackoffWithJitter = (attemptsMade: number): number => {
    const base = Math.pow(2, attemptsMade) * 1000
    const jitter = Math.random() * 1000
    return base + jitter
}
