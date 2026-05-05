import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { createHash } from 'node:crypto'

import { EventVariantValues } from '@/database/types'
import { CreateLeadDto } from '@/outbox/dto/create-lead.dto'
import { OutboxService } from '@/outbox/outbox.service'

@Controller()
export class OutboxController {
    constructor(private readonly outboxService: OutboxService) {}

    @Post('create_lead')
    @HttpCode(202)
    async createLead(@Body() dto: CreateLeadDto) {
        const idempotencyKey = createHash('sha256')
            .update(
                `${EventVariantValues.CRM_LEAD_ADD}_${dto.email}_${new Date().toISOString().slice(0, 10)}`,
            )
            .digest('hex')

        await this.outboxService.enqueue(EventVariantValues.CRM_LEAD_ADD, dto, idempotencyKey)
        return { status: 'accepted' }
    }
}
