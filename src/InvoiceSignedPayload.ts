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
    /** Currency corresponding to the amount */
    curr: string
    /** Total number of items/services sold */
    qty: number
    /** Number of different items/services (number of lines) on the invoice */
    line: number
    /** Issuer invoice reference */
    ref: string
    /** If true, the invoice is declared paid by the issuer */
    paid: boolean
}
