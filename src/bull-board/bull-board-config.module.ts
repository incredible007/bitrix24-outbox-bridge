import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { BullBoardModule } from '@bull-board/nestjs'
import * as expressBasicAuth from 'express-basic-auth'

import { CONTACT_DLQ, CONTACT_QUEUE } from '@/queues/contact/contact.queue'
import { LEAD_DLQ, LEAD_QUEUE } from '@/queues/lead/lead.queue'

const BITRIX24_LOGO_URL = 'https://www.bitrix24.com/images/bitrix24-logo-en.svg'
const BITRIX24_FAVICON_URL = 'https://www.bitrix24.com/favicon.ico'

const uiConfig = {
    boardTitle: 'Bitrix24 Outbox Bridge',
    boardLogo: { path: BITRIX24_LOGO_URL, width: 120, height: 30 },
    favIcon: { default: BITRIX24_FAVICON_URL, alternative: BITRIX24_FAVICON_URL },
    miscLinks: [{ text: 'Swagger', url: '/api-doc' }],
}

@Module({
    imports: [
        BullBoardModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                route: '/queues',
                adapter: ExpressAdapter,
                middleware: expressBasicAuth({
                    users: {
                        [configService.getOrThrow('app.bullBoardUser')]:
                            configService.getOrThrow('app.bullBoardPassword'),
                    },
                    challenge: true,
                }),
                options: { uiConfig },
            }),
            inject: [ConfigService],
        }),

        BullBoardModule.forFeature({
            name: LEAD_QUEUE,
            adapter: BullMQAdapter,
        }),

        BullBoardModule.forFeature({
            name: LEAD_DLQ,
            adapter: BullMQAdapter,
        }),

        BullBoardModule.forFeature({
            name: CONTACT_QUEUE,
            adapter: BullMQAdapter,
        }),

        BullBoardModule.forFeature({
            name: CONTACT_DLQ,
            adapter: BullMQAdapter,
        }),
    ],
})
export class BullBoardConfigModule {}
