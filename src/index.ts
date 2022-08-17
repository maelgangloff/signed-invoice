import { Company, Person } from './Entity'
import { Line } from './Line'
import jwt, { Secret } from 'jsonwebtoken'
import QRCode from 'qrcode'
import { invoicePDF } from './InvoicePDF'
import translation from './translation.json'
import { InvoiceSignedPayload } from './InvoiceSignedPayload'

export class Invoice {
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
        isPaid: boolean,
        terms?: string
    }, private privateKey: string) {
    for (const line of this.invoice.lines) {
      this.subtotalWithoutTax += line.quantity * line.unitPrice
      this.amountDue += line.quantity * line.unitPrice * (1 + line.tax)
    }
  }

  /**
   * Sign payload containing invoice information with private key
   * @param {InvoiceSignedPayload} signedPayload The payload to be signed
   * @param {Secret} privateKey The secret key to use
   * @return {string} The signed JWT token
   */
  public static signJwt (signedPayload: InvoiceSignedPayload, privateKey: Secret): string {
    return jwt.sign(signedPayload, privateKey, { algorithm: 'ES256' })
  }

  /**
   * Prove the authenticity of a token by verifying its signature
   * @param {string} token The token to be verified
   * @param {Secret} key The issuer's public key
   * @return {InvoiceSignedPayload} The verified payload
   */
  public static verifyJwt (token: string, key: Secret): InvoiceSignedPayload {
    return jwt.verify(token, key, { algorithms: ['ES256'] }) as unknown as InvoiceSignedPayload
  }

  /**
   * Generate a signed token containing the instance information
   * @return {string} The signed JWT token
   */
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

  /**
   * Generate a signed token and convert it to a QR Code PNG image
   * @return {Promise<Buffer>}
   */
  public async createQRCodeBuffer (): Promise<Buffer> {
    return QRCode.toBuffer(this.createJwt())
  }

  /**
   * Generate the final PDF file containing the cryptographic stamp of authenticity
   * @return {Promise<PDFKit.PDFDocument>}
   */
  public async generatePDF (): Promise<PDFKit.PDFDocument> {
    return invoicePDF(this)
  }
}
