import { Injectable } from '@nestjs/common'

import { CreateContactDto } from '@/outbox/dto/create-contact.dto'
import { BitrixCreateContactPayload } from '@/outbox/interfaces/bitrix-create-contact-payload.interface'

@Injectable()
export class ContactFactory {
    toCreatePayload(dto: CreateContactDto): BitrixCreateContactPayload {
        return {
            fields: {
                NAME: dto.firstName,
                LAST_NAME: dto.lastName,
                PHONE: [{ VALUE: dto.phone, VALUE_TYPE: 'MOBILE' }],
                EMAIL: [{ VALUE: dto.email, VALUE_TYPE: 'WORK' }],
                COMMENTS: dto.comment,
            },
        }
    }
}
