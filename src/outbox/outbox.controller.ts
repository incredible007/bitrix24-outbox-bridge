import { Body, Controller, HttpCode, Post } from '@nestjs/common'

import { EventVariantValues } from '@/database/types'
import { CreateLeadDto } from '@/outbox/dto/create-lead.dto'
import { OutboxService } from '@/outbox/outbox.service'

@Controller()
export class OutboxController {
    constructor(private readonly outboxService: OutboxService) {}

    @Post('create_lead')
    @HttpCode(202)
    async createLead(@Body() dto: CreateLeadDto) {
        await this.outboxService.enqueue(EventVariantValues.CRM_LEAD_ADD, dto)
        return { status: 'accepted' }
    }
}
