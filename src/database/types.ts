import { type eventStates, type eventVariants } from './schema'

export type EventVariants = (typeof eventVariants.enumValues)[number]
export type EventStates = (typeof eventStates.enumValues)[number]

export const EventVariantValues = {
    CRM_CONTACT_ADD: 'CRM_CONTACT_ADD',
    CRM_LEAD_ADD: 'CRM_LEAD_ADD',
    CRM_COMPANY_ADD: 'CRM_COMPANY_ADD',
    CRM_DEAL_ADD: 'CRM_DEAL_ADD',
} as const satisfies Record<EventVariants, EventVariants>

export const EventStatesValues = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SUCCEEDED: 'SUCCEEDED',
    FAILED: 'FAILED',
} as const satisfies Record<EventStates, EventStates>
