import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { createHash } from 'node:crypto'

import { ContactFactory } from '@/bitrix/factory/contact.factory'
import { LeadFactory } from '@/bitrix/factory/lead.factory'
import { EventVariantValues } from '@/database/types'
import { CreateContactDto } from '@/outbox/dto/create-contact.dto'
import { CreateLeadDto } from '@/outbox/dto/create-lead.dto'
import { OutboxService } from '@/outbox/outbox.service'

@ApiTags('outbox')
@Controller('outbox')
@ApiSecurity('x-api-key')
export class OutboxController {
    constructor(
        private readonly outboxService: OutboxService,
        private readonly leadFactory: LeadFactory,
        private readonly contactFactory: ContactFactory,
    ) {}

    @Post('create_lead')
    @HttpCode(202)
    @ApiHeader({ name: 'x-api-key', required: true })
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({
        summary: 'Enqueue a Bitrix24 creation lead',
        description:
            'Помещает создание лида в очередь. Доставка гарантирована через Outbox Pattern + BullMQ.',
    })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        description: 'Лид принят в очередь',
        schema: {
            example: { queued: true },
        },
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Неверный или отсутствующий API ключ',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Невалидные данные запроса',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Лид с такими признаками уже существует',
    })
    async createLead(@Body() dto: CreateLeadDto) {
        const idempotencyKey = createHash('sha256')
            .update(
                `${EventVariantValues.CRM_LEAD_ADD}_${dto.email}_${new Date().toISOString().slice(0, 10)}`,
            )
            .digest('hex')
        const payload = this.leadFactory.toCreatePayload(dto)
        await this.outboxService.enqueue(EventVariantValues.CRM_LEAD_ADD, payload, idempotencyKey)
        return { status: 'accepted' }
    }

    @Post('create_contact')
    @HttpCode(202)
    @ApiHeader({ name: 'x-api-key', required: true })
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({
        summary: 'Enqueue a Bitrix24 creation contact',
        description:
            'Помещает создание контакта в очередь. Доставка гарантирована через Outbox Pattern + BullMQ.',
    })
    @ApiResponse({
        status: HttpStatus.ACCEPTED,
        description: 'Контакт принят в очередь',
        schema: {
            example: { queued: true },
        },
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Неверный или отсутствующий API ключ',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Невалидные данные запроса',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Контакт с такими признаками уже существует',
    })
    async createContact(@Body() dto: CreateContactDto) {
        const idempotencyKey = createHash('sha256')
            .update(
                `${EventVariantValues.CRM_CONTACT_ADD}_${dto.email}_${new Date().toISOString().slice(0, 10)}`,
            )
            .digest('hex')
        const payload = this.contactFactory.toCreatePayload(dto)
        await this.outboxService.enqueue(
            EventVariantValues.CRM_CONTACT_ADD,
            payload,
            idempotencyKey,
        )
        return { status: 'accepted' }
    }
}
