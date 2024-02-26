import jwt, { Secret } from 'jsonwebtoken'
import QRCode from 'qrcode'
import { InvoicePDF } from './InvoicePDF'
import { InvoiceSignedPayload } from './InvoiceSignedPayload'
import { InvoiceInterface } from './InvoiceInterface'
import i18next from 'i18next'
import filesystemBackend from 'i18next-fs-backend'

export class Invoice {
  public readonly subtotalWithoutTax: number = 0
  public readonly amountDue: number = 0

  /**
   * @param {InvoiceInterface} invoice Invoice information
   * @param {Secret} privateKey prime256v1 private key
   */
  public constructor (public invoice: InvoiceInterface, private privateKey: string) {
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
    const { seller, client, lines, currency, reference, date, dueDate, payment } = this.invoice
    return Invoice.signJwt({
      iss: `${seller.name} (${seller.identifier})`,
      sub: client.name,
      iat: Math.floor(date.getTime() / 1e3),
      dueDate: Math.floor(dueDate.getTime() / 1e3),
      amt: this.amountDue,
      curr: currency,
      qty: lines.reduce((q, l) => q + l.quantity, 0),
      line: lines.length,
      ref: reference,
      pay: payment
    }, this.privateKey)
  }

  /**
   * Generate a signed token and convert it to a QR Code PNG image
   * @return {Promise<Buffer>}
   */
  public async createQRCodeBuffer (): Promise<Buffer> {
    return QRCode.toBuffer(this.createJwt(), { errorCorrectionLevel: 'L' })
  }

  /**
   * Generate the final PDF file containing the cryptographic stamp of authenticity
   * @return {Promise<PDFKit.PDFDocument>}
   */
  public async generatePDF (): Promise<PDFKit.PDFDocument> {
    await i18next.use(filesystemBackend).init({
      lng: this.invoice.language,
      fallbackLng: 'en',
      backend: {
        loadPath: __dirname + '/langs/{{lng}}.json',
        jsonIndent: 2
      }
    })
    return new InvoicePDF(this, i18next).generate()
  }
}
