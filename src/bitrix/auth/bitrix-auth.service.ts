import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'

import { BitrixToken, TokenRepository } from '@/bitrix/auth/token.repository'
import { BitrixRefreshResponse } from '@/bitrix/interfaces/bitrix-refresh-response.interface'
import { bitrixConfig } from '@/config/bitrix.config'

@Injectable()
export class BitrixAuthService {
    constructor(
        private readonly tokenRepo: TokenRepository,
        @Inject(bitrixConfig.KEY)
        private readonly config: ConfigType<typeof bitrixConfig>,
    ) {}

    async getValidToken(): Promise<{ accessToken: string; domain: string }> {
        const token = await this.tokenRepo.fetchCurrToken()

        if (token.expiresAt > new Date()) {
            return { accessToken: token.accessToken, domain: token.domain }
        }

        return this.refresh(token)
    }

    private async refresh(token: BitrixToken) {
        const response = await fetch(
            `https://oauth.bitrix.info/oauth/token/?grant_type=refresh_token` +
                `&client_id=${this.config.clientId}` +
                `&client_secret=${this.config.clientSecret}` +
                `&refresh_token=${token.refreshToken}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5_000),
            },
        )

        const data = (await response.json()) as BitrixRefreshResponse

        if (data.error) {
            throw new Error(`Token refresh failed: ${data.error} — ${data.error_description}`)
        }

        const updated = await this.tokenRepo.updateToken({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
        })

        return { accessToken: updated.accessToken, domain: updated.domain }
    }
}
