type BitrixEmployees =
    | 'EMPLOYEES_1' // 1
    | 'EMPLOYEES_2' // 2–5
    | 'EMPLOYEES_3' // 6–10
    | 'EMPLOYEES_4' // 11–50
    | 'EMPLOYEES_5' // 51–100
    | 'EMPLOYEES_6' // 101–500
    | 'EMPLOYEES_7' // 500+

export interface BitrixCreateCompanyPayload {
    fields: {
        TITLE: string
        PHONE?: Array<{ VALUE: string; VALUE_TYPE: 'WORK' | 'MOBILE' }>
        EMAIL?: Array<{ VALUE: string; VALUE_TYPE: 'WORK' }>
        WEB?: Array<{ VALUE: string; VALUE_TYPE: 'WEB' }>
        ADDRESS?: string
        REVENUE?: number
        EMPLOYEES?: BitrixEmployees
        COMMENTS?: string
    }
    requisiteFields: {
        RQ_INN: string
        RQ_KPP?: string
        RQ_OGRN?: string
        ADDRESS?: string
    }
    bankDetailFields?: {
        RQ_BANK_NAME?: string
        RQ_ACC_NUM?: string
        RQ_BIK?: string
        RQ_COR_ACC_NUM?: string
    }
}
