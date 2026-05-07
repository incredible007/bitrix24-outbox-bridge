import { Injectable } from '@nestjs/common'
import { UnrecoverableError } from 'bullmq'

import { BitrixAuthService } from '@/bitrix/auth/bitrix-auth.service'
import { BitrixClientError } from '@/bitrix/errors/bitrix-client.error'
import { BitrixRateLimitError } from '@/bitrix/errors/bitrix-rate-limit.error'
import { BitrixApiResponse } from '@/bitrix/interfaces/bitrix-api-response.interface'
import { BitrixCreateContactPayload } from '@/outbox/interfaces/bitrix-create-contact-payload.interface'
import { BitrixCreateLeadPayload } from '@/outbox/interfaces/bitrix-create-lead-payload.interface'

@Injectable()
export class BitrixHttpClient {
    constructor(private readonly authService: BitrixAuthService) {}

    async createLead(payload: BitrixCreateLeadPayload): Promise<string> {
        return this.post('crm.lead.add', payload)
    }

    async createContact(payload: BitrixCreateContactPayload): Promise<string> {
        return this.post('crm.contact.add', payload)
    }

    private async post(method: string, payload: unknown): Promise<string> {
        const { accessToken, domain } = await this.authService.getValidToken()

        const url = `https://${domain}/rest/${method}.json`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5_000),
        })

        if (response.status === 429) {
            const retryAfter = Number(response.headers.get('Retry-After') ?? 1)
            throw new BitrixRateLimitError(retryAfter)
        }

        if (response.status >= 400 && response.status < 500) {
            throw new BitrixClientError(
                response.status,
                `Bitrix24 client error: HTTP ${response.status}`,
            )
        }

        if (!response.ok) {
            throw new Error(`Bitrix24 server error: HTTP ${response.status}`)
        }

        const data = (await response.json()) as BitrixApiResponse

        if (data.error) {
            throw new UnrecoverableError(
                `Bitrix24 error: ${data.error} — ${data.error_description}`,
            )
        }

        return String(data.result)
    }
}
