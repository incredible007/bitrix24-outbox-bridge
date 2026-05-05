import { Module } from '@nestjs/common'

import { CommonConfigModule } from '@/config/common-config.module'
import { DatabaseModule } from '@/database/database.module'

@Module({
    imports: [DatabaseModule, CommonConfigModule],
})
export class AppModule {}
