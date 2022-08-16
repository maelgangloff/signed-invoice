import { Company, Person } from './Entity'
import { Line } from './Line'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import { invoicePDF } from './InvoicePDF'
import translation from './translation.json'
import { InvoiceSignedPayload } from './InvoiceSignedPayload'
import { createWriteStream, readFileSync } from 'fs'

export default class Invoice {
  public readonly subtotalWithoutTax: number = 0
  public readonly amountDue: number = 0

  public constructor (public invoice: {
        logoPath?: string,
        seller: Company
        client: Company | Person
        date: Date
        reference: string
        dueDate: Date
        lines: Line[]
        currency: string
        language: keyof typeof translation
        isPaid: boolean
    }, private privateKey: string) {
    for (const line of this.invoice.lines) {
      this.subtotalWithoutTax += line.quantity * line.unitPrice
      this.amountDue += line.quantity * line.unitPrice * (1 + line.tax)
    }
  }

  public static signJwt (signedPayload: InvoiceSignedPayload, privateKey: string): string {
    return jwt.sign(signedPayload, privateKey, { algorithm: 'ES256' })
  }

  public createJwt (): string {
    const { seller, client, lines, currency, reference, isPaid, date, dueDate } = this.invoice
    return Invoice.signJwt({
      iss: `${seller.name} (${seller.identifier})`,
      sub: client.name,
      iat: Math.floor(date.getTime() / 1e3),
      dueDate: Math.floor(dueDate.getTime() / 1e3),
      amount: this.amountDue,
      currency,
      quantity: lines.reduce((q, l) => q + l.quantity, 0),
      lines: lines.length,
      jti: reference,
      isPaid
    }, this.privateKey)
  }

  public async createQRCodeBuffer (): Promise<Buffer> {
    return QRCode.toBuffer(this.createJwt())
  }

  public async generatePDF (): Promise<PDFKit.PDFDocument> {
    return invoicePDF(this)
  }
}
