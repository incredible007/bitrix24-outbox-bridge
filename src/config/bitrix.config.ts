import { registerAs } from '@nestjs/config'

export const bitrixConfig = registerAs('bitrix', () => ({
    clientId: process.env.BITRIX_CLIENT_ID!,
    clientSecret: process.env.BITRIX_CLIENT_SECRET!,
    redirectUri: process.env.BITRIX_REDIRECT_URI!,
    domain: process.env.BITRIX_DOMAIN!,
}))
