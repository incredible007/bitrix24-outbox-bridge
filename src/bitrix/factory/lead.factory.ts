import { Injectable } from '@nestjs/common'

import { CreateLeadDto } from '@/outbox/dto/create-lead.dto'
import { BitrixLeadPayload } from '@/outbox/interfaces/bitrix-lead-payload.interface'

@Injectable()
export class LeadFactory {
    toCreatePayload(dto: CreateLeadDto): BitrixLeadPayload {
        return {
            fields: {
                TITLE: dto.title ?? `Заявка от ${dto.firstName} ${dto.lastName}`,
                NAME: dto.firstName,
                LAST_NAME: dto.lastName,
                PHONE: dto.phone ? [{ VALUE: dto.phone, VALUE_TYPE: 'MOBILE' }] : undefined,
                EMAIL: dto.email ? [{ VALUE: dto.email, VALUE_TYPE: 'WORK' }] : undefined,
                COMMENTS: dto.comment,
                SOURCE_ID: 'WEB',
            },
        }
    }
}
