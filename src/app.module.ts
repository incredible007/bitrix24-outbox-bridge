import { Module } from '@nestjs/common'

import { BitrixModule } from '@/bitrix/bitrix.module'
import { CommonConfigModule } from '@/config/common-config.module'
import { DatabaseModule } from '@/database/database.module'

@Module({
    imports: [DatabaseModule, CommonConfigModule, BitrixModule],
})
export class AppModule {}
