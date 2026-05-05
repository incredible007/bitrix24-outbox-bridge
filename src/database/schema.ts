import { sql } from 'drizzle-orm'
import {
    bigint,
    check,
    index,
    jsonb,
    pgEnum,
    pgTable,
    smallint,
    text,
    timestamp,
    unique,
    varchar,
} from 'drizzle-orm/pg-core'

export const eventStates = pgEnum('event_states', ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'])
export const eventVariants = pgEnum('event_variants', [
    'CRM_CONTACT_ADD',
    'CRM_LEAD_ADD',
    'CRM_COMPANY_ADD',
    'CRM_DEAL_ADD',
])

export const bitrix24Outbox = pgTable(
    'bitrix24_outbox',
    {
        // You can use { mode: "bigint" } if numbers are exceeding js number limitations
        boid: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity({
            name: 'bitrix24_outbox_boid_seq',
            startWith: 1,
            increment: 1,
            minValue: 1,
            maxValue: '9223372036854775807',
            cache: 1,
        }),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
        processedAt: timestamp('processed_at', { withTimezone: true, mode: 'date' }),
        processingAt: timestamp('processing_at', { withTimezone: true, mode: 'date' }),
        payload: jsonb().notNull(),
        attempts: smallint().default(0).notNull(),
        eventState: eventStates('event_state').default('PENDING').notNull(),
        eventVariant: eventVariants('event_variant').notNull(),
        errorMessage: text('error_message'),
        idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
        bitrixId: varchar('bitrix_id', { length: 50 }),
    },
    (table) => [
        index('idx_outbox_created_at').using(
            'btree',
            table.createdAt.asc().nullsLast().op('timestamptz_ops'),
        ),
        index('idx_outbox_event_state_pending')
            .using('btree', table.eventState.asc().nullsLast().op('enum_ops'))
            .where(sql`(event_state = 'PENDING'::event_states)`),
        unique('bitrix24_outbox_idempotency_key_key').on(table.idempotencyKey),
        check('chk_outbox_attempts_positive', sql`attempts >= 0`),
    ],
)

export const bitrixTokens = pgTable(
    'bitrix_tokens',
    {
        // You can use { mode: "bigint" } if numbers are exceeding js number limitations
        btid: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity({
            name: 'bitrix_tokens_btid_seq',
            startWith: 1,
            increment: 1,
            minValue: 1,
            maxValue: '9223372036854775807',
            cache: 1,
        }),
        accessToken: text('access_token').notNull(),
        refreshToken: text('refresh_token').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
        domain: varchar({ length: 200 }).notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        check(
            'chk_bitrix_tokens_expires_in_1_hour',
            sql`expires_at > (now() + '01:00:00'::interval)`,
        ),
    ],
)
