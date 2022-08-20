export type PaymentMethod = 'CASH' | 'CARD' | 'BANK' | 'CHQ' | 'CRYPTO' | string

export interface InvoiceSignedPayload {
    /** Invoice issuer */
    iss: string
    /** Invoice recipient */
    sub: string
    /** Invoice issue date */
    iat: number
    /** Invoice due date */
    dueDate: number
    /** Total amount of the invoice with taxes */
    amt: number
    /** The ISO 4217 code designating the currency used for invoicing */
    curr: string
    /** Total number of items/services sold */
    qty: number
    /** Number of different items/services (number of lines) on the invoice */
    line: number
    /** Issuer invoice reference */
    ref: string
    /** Method of payment to pay the invoice. If `false`, the invoice is declared unpaid by the issuer */
    pay: PaymentMethod | boolean
}
