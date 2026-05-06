import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { desc, eq } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

import { bitrixConfig } from '@/config/bitrix.config'
import { DB_DRIZZLE } from '@/database/database.module'
import * as schema from '@/database/schema'

const updateTokenSchema = createUpdateSchema(schema.bitrixTokens)
type UpdateTokenDto = z.infer<typeof updateTokenSchema>

export type BitrixToken = typeof schema.bitrixTokens.$inferSelect

@Injectable()
export class TokenRepository {
    constructor(
        @Inject(DB_DRIZZLE)
        private readonly db: PostgresJsDatabase<typeof schema>,
        @Inject(bitrixConfig.KEY)
        private readonly config: ConfigType<typeof bitrixConfig>,
    ) {}

    async fetchCurrToken(): Promise<typeof schema.bitrixTokens.$inferSelect> {
        const [token] = await this.db
            .select()
            .from(schema.bitrixTokens)
            .where(eq(schema.bitrixTokens.domain, this.config.domain))
            .orderBy(desc(schema.bitrixTokens.updatedAt))
            .limit(1)

        return token
    }

    async updateToken(dto: UpdateTokenDto): Promise<typeof schema.bitrixTokens.$inferSelect> {
        const [token] = await this.db
            .update(schema.bitrixTokens)
            .set(dto)
            .where(eq(schema.bitrixTokens.domain, this.config.domain))
            .returning()

        return token
    }
}
