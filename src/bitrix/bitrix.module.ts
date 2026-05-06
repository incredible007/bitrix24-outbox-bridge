import { Module } from '@nestjs/common'

import { BitrixAuthService } from '@/bitrix/auth/bitrix-auth.service'
import { TokenRepository } from '@/bitrix/auth/token.repository'
import { BitrixHttpClient } from '@/bitrix/client/bitrix-http.client'
import { LeadFactory } from '@/bitrix/factory/lead.factory'

@Module({
    providers: [LeadFactory, BitrixAuthService, TokenRepository, BitrixHttpClient],
    controllers: [],
    imports: [],
    exports: [LeadFactory, BitrixHttpClient],
})
export class BitrixModule {}
