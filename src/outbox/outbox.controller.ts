import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { createHash } from 'node:crypto'

import { ContactFactory } from '@/bitrix/factory/contact.factory'
import { LeadFactory } from '@/bitrix/factory/lead.factory'
import { EventVariantValues } from '@/database/types'
import { CreateContactDto } from '@/outbox/dto/create-contact.dto'
import { CreateLeadDto } from '@/outbox/dto/create-lead.dto'
import { OutboxService } from '@/outbox/outbox.service'

@Controller()
export class OutboxController {
    constructor(
        private readonly outboxService: OutboxService,
        private readonly leadFactory: LeadFactory,
        private readonly contactFactory: ContactFactory,
    ) {}

    @Post('create_lead')
    @HttpCode(202)
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
