import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { appConfig } from '@/config/app.config'
import { bitrixConfig } from '@/config/bitrix.config'
import { envSchema } from '@/config/env.schema'
import { redisConfig } from '@/config/redis.config'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, redisConfig, bitrixConfig],
            validate: (env) => {
                const result = envSchema.safeParse(env)
                if (!result.success) {
                    console.error('❌ Invalid env:', result.error.flatten().fieldErrors)
                    process.exit(1)
                }
                return result.data
            },
        }),
    ],
    exports: [],
})
export class CommonConfigModule {}
