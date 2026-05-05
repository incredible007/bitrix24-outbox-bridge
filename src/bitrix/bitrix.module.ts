import { Module } from '@nestjs/common'

import { LeadFactory } from '@/bitrix/factory/lead.factory'

@Module({
    providers: [LeadFactory],
    controllers: [],
    imports: [],
    exports: [LeadFactory],
})
export class BitrixModule {}
