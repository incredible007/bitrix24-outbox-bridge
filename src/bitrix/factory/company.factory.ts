import { Injectable } from '@nestjs/common'

import { type CreateCompanyDto } from '@/outbox/dto/create-company.dto'
import { type BitrixCreateCompanyPayload } from '@/outbox/interfaces/bitrix-create-company-payload.interface'

function toEmployeesEnum(count: number): BitrixCreateCompanyPayload['fields']['EMPLOYEES'] {
    if (count <= 1) return 'EMPLOYEES_1'
    if (count <= 5) return 'EMPLOYEES_2'
    if (count <= 10) return 'EMPLOYEES_3'
    if (count <= 50) return 'EMPLOYEES_4'
    if (count <= 100) return 'EMPLOYEES_5'
    if (count <= 500) return 'EMPLOYEES_6'
    return 'EMPLOYEES_7'
}

@Injectable()
export class CompanyFactory {
    toCreatePayload(dto: CreateCompanyDto): BitrixCreateCompanyPayload {
        const hasBankDetails = dto.bankName || dto.bankAccount || dto.bankBik || dto.bankCorrAccount

        return {
            fields: {
                TITLE: dto.title,
                PHONE: dto.phone ? [{ VALUE: dto.phone, VALUE_TYPE: 'WORK' }] : undefined,
                EMAIL: dto.email ? [{ VALUE: dto.email, VALUE_TYPE: 'WORK' }] : undefined,
                WEB: dto.website ? [{ VALUE: dto.website, VALUE_TYPE: 'WEB' }] : undefined,
                ADDRESS: dto.address,
                REVENUE: dto.annualRevenue,
                EMPLOYEES: dto.employeesCount ? toEmployeesEnum(dto.employeesCount) : undefined,
                COMMENTS: dto.comment,
            },
            requisiteFields: {
                RQ_INN: dto.inn,
                RQ_KPP: dto.kpp,
                RQ_OGRN: dto.ogrn,
                ADDRESS: dto.legalAddress,
            },
            bankDetailFields: hasBankDetails
                ? {
                      RQ_BANK_NAME: dto.bankName,
                      RQ_ACC_NUM: dto.bankAccount,
                      RQ_BIK: dto.bankBik,
                      RQ_COR_ACC_NUM: dto.bankCorrAccount,
                  }
                : undefined,
        }
    }
}
