export interface InvoiceSignedPayload {
    iss: string
    sub: string
    iat: number
    dueDate: number
    amount: number
    currency: string
    quantity: number
    line: number
    jti: string
    isPaid: boolean
}
