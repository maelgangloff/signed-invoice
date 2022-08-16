export interface InvoiceSignedPayload {
    iss: string
    sub: string
    iat: number
    dueDate: number
    amount: number
    currency: string
    quantity: number
    lines: number
    jti: string
    isPaid: boolean
}
