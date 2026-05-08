export interface BitrixCreateContactPayload {
    fields: {
        NAME: string
        LAST_NAME: string
        PHONE: Array<{ VALUE: string; VALUE_TYPE: 'WORK' | 'MOBILE' }>
        EMAIL: Array<{ VALUE: string; VALUE_TYPE: 'WORK' }>
        COMMENTS?: string
    }
}
