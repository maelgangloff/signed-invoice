import { Company, Person } from './Entity'
import { Line } from './Line'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import fs from 'fs'
import { invoicePDF } from './InvoicePDF'
import translation from './translation.json'

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

  public createJwt (): string {
    const { seller, client, lines, currency, reference, isPaid, date, dueDate } = this.invoice
    return jwt.sign({
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
    }, this.privateKey, {
      algorithm: 'ES256'
    })
  }

  public async createQRCode (): Promise<Buffer> {
    return QRCode.toBuffer(this.createJwt())
  }

  public async generatePDF () {
    invoicePDF(this, fs.createWriteStream('doc.pdf'))
  }
}
