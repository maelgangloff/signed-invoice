import { Company, Person } from './Entity'
import { Line } from './Line'
import { PaymentMethod } from './InvoiceSignedPayload'

export interface InvoiceInterface {
    logoPath?: string
    seller: Company
    client: Company | Person
    date: Date
    reference: string
    dueDate: Date
    lines: Line[]
    currency: string
    language: string
    payment: PaymentMethod | boolean,
    terms?: string
  }
