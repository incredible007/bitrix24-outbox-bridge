export interface BitrixRefreshResponse {
    access_token: string
    refresh_token: string
    expires_in: number
    domain: string
    error?: string
    error_description?: string
}
