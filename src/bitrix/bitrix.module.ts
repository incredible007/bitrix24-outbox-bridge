import { Module } from '@nestjs/common'

import { BitrixAuthService } from '@/bitrix/auth/bitrix-auth.service'
import { TokenRepository } from '@/bitrix/auth/token.repository'
import { BitrixHttpClient } from '@/bitrix/client/bitrix-http.client'
import { CompanyFactory } from '@/bitrix/factory/company.factory'
import { ContactFactory } from '@/bitrix/factory/contact.factory'
import { LeadFactory } from '@/bitrix/factory/lead.factory'

@Module({
    providers: [
        LeadFactory,
        BitrixAuthService,
        TokenRepository,
        BitrixHttpClient,
        ContactFactory,
        CompanyFactory,
    ],
    controllers: [],
    imports: [],
    exports: [LeadFactory, BitrixHttpClient, ContactFactory, CompanyFactory],
})
export class BitrixModule {}
