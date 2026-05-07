export interface BitrixCreateLeadPayload {
    fields: {
        TITLE: string
        NAME?: string
        LAST_NAME?: string
        PHONE?: Array<{ VALUE: string; VALUE_TYPE: 'WORK' | 'MOBILE' }>
        EMAIL?: Array<{ VALUE: string; VALUE_TYPE: 'WORK' }>
        COMMENTS?: string
        SOURCE_ID?: string // WEB, CALL, EMAIL и т.д.
    }
}
