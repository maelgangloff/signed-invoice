import PDFKit from 'pdfkit'
import wrap from 'word-wrap'
import path from 'node:path'
import { Invoice } from './index'
import { i18n } from 'i18next'

export class InvoicePDF {
  private static readonly formatCurrency = (amount: number, currency: string) => `${currency} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
  private readonly formatDate = (date: Date) => date.toLocaleDateString(this.invoice.invoice.language)
  private readonly generateHr = (y: number) => this.doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(30, y).lineTo(550, y).stroke()
  private readonly invoice: Invoice
  private readonly i18n: i18n
  private readonly doc: PDFKit.PDFDocument

  public constructor (invoice: Invoice, i18next: i18n) {
    this.invoice = invoice
    this.i18n = i18next

    this.doc = new PDFKit({
      margins: {
        top: 30, left: 30, right: 30, bottom: 10
      },
      size: 'A4'
    })
    this.doc.registerFont('OpenSans-Bold', path.join(__dirname, '../ttf/OpenSans-Bold.ttf'))
    this.doc.registerFont('OpenSans-Regular', path.join(__dirname, '../ttf/OpenSans-Regular.ttf'))
  }

  private async generateHeader () {
    const { seller, logoPath } = this.invoice.invoice

    if (logoPath) this.doc.image(logoPath, 10, 40, { width: 80 })

    const x = logoPath ? 100 : 30
    this.doc.fillColor('#444444')
      .font('OpenSans-Regular')
      .fontSize(20)
      .text(seller.name, x, 57)
      .fontSize(10)
      .text(seller.address.street, x, 80)
      .text(`${seller.address.zip} ${seller.address.city} ${seller.address.state ?? ''}`, x, 95)
      .text(`${seller.contact}`, x, 110)
      .image(await this.invoice.createQRCodeBuffer(), 450, 30, { align: 'right', width: 120 })
      .font('OpenSans-Bold')
      .fontSize(8)
      .text(this.i18n.t('signedInvoice'), 450, 150, { align: 'center' })
      .moveDown()
  }

  private generateCustomerInformation () {
    const { reference, dueDate, currency, client } = this.invoice.invoice

    this.doc.fillColor('#444444').fontSize(20).text(this.i18n.t('invoice').toUpperCase(), 30, 160)
    this.generateHr(185)
    const customerInformationTop = 200
    this.doc.fontSize(10)
      .text(`${this.i18n.t('reference')}:`, 30, customerInformationTop)
      .font('OpenSans-Bold')
      .text(reference, 130, customerInformationTop)
      .font('OpenSans-Regular')
      .text(`${this.i18n.t('dueDate')}: `, 30, customerInformationTop + 15)
      .text(this.formatDate(dueDate), 130, customerInformationTop + 15)
      .text(`${this.i18n.t('amountDue')}: `, 30, customerInformationTop + 30)
      .text(InvoicePDF.formatCurrency(this.invoice.amountDue, currency), 130, customerInformationTop + 30)
      .font('OpenSans-Bold')
      .text(client.name, 280, customerInformationTop)
      .font('OpenSans-Regular')
      .text(client.address ? client.address.street : '', 280, customerInformationTop + 15)
      .text(client.address ? `${client.address.zip} ${client.address.city}` : '', 280, customerInformationTop + 30)
      .moveDown()

    this.generateHr(252)
  }

  private generateTableRow (y: number, c1: string, c2: string, c3: string, c4: string|number, c5: string) {
    this.doc.fontSize(10)
      .text(c1, 30, y)
      .text(c2, 130, y)
      .text(c3, 280, y, { width: 90, align: 'right' })
      .text(c4.toString(), 370, y, { width: 90, align: 'right' })
      .text(c5, 0, y, { align: 'right' })
  }

  private generateInvoiceTable () {
    let invoiceTableTop = 270

    this.doc.font('OpenSans-Bold')
    this.generateTableRow(
      invoiceTableTop,
      this.i18n.t('item'), this.i18n.t('description'), this.i18n.t('unitPrice'), this.i18n.t('quantity'), this.i18n.t('total'))
    this.generateHr(invoiceTableTop + 20)
    this.doc.font('OpenSans-Regular')

    const items = this.invoice.invoice.lines
    const { currency, terms, payment, date } = this.invoice.invoice
    const { subtotalWithoutTax, amountDue } = this.invoice

    let position = invoiceTableTop
    let page = 1
    for (const item of items) {
      position += 25
      const itemName = wrap(item.item, { width: 18, indent: '', trim: true })
      const itemDescription = wrap(item.description ?? '', { width: 40, indent: '', trim: true })

      const d1 = (itemName.match(/\n/g) || []).length
      const d2 = (itemDescription.match(/\n/g) || []).length

      const positionEnd = position + (d1 >= d2 ? d1 * 10 : d2 * 10) + 22

      if (positionEnd >= 750) {
        page++
        invoiceTableTop = 50
        this.doc.addPage()
        this.generateHr(70)
        this.generateFooter(page)
        position = invoiceTableTop + 25
      }

      this.generateTableRow(
        position,
        itemName,
        itemDescription,
        InvoicePDF.formatCurrency(item.unitPrice, currency),
        item.quantity,
        InvoicePDF.formatCurrency(item.quantity * item.unitPrice, currency)
      )

      position += d1 >= d2 ? d1 * 10 : d2 * 10
      this.generateHr(position + 22)
    }
    if (position >= 650) {
      page++
      invoiceTableTop = 50
      this.doc.addPage()
      this.generateFooter(page)
      position = invoiceTableTop
    }

    this.generateHr(position + 21)
    this.generateTableRow(position + 35, '', '', this.i18n.t('subtotalWithoutTax'), '', InvoicePDF.formatCurrency(subtotalWithoutTax, currency))
    this.generateTableRow(position + 55, '', '', this.i18n.t('tax'), '', InvoicePDF.formatCurrency(amountDue - subtotalWithoutTax, currency))
    this.doc.font('OpenSans-Bold')
    this.generateTableRow(position + 85, '', '', this.i18n.t('amountDue'), '', InvoicePDF.formatCurrency(amountDue, currency))
    this.doc.font('OpenSans-Regular').text(`${this.formatDate(date)}: ${payment === false ? this.i18n.t('waitingForPayment') : this.i18n.t('paid')}`, 30, position + 35).text(terms ?? '', 30, 750)
  }

  private generateFooter (page = 1) {
    const { seller } = this.invoice.invoice
    this.doc.font('OpenSans-Bold').fontSize(10).text(`${seller.name} - ${seller.identifier}${seller.vatNumber ? ' - ' + seller.vatNumber : ''}`, 30, 810)
      .text(`${this.i18n.t('page')} ${page}`, 500, 810).font('OpenSans-Regular')
  }

  /**
   * Generate the PDF file corresponding to the invoice
   * @returns {PDFKit.PDFDocument} A PDFKit document
   */
  public async generate (): Promise<PDFKit.PDFDocument> {
    await this.generateHeader()
    this.generateCustomerInformation()
    this.generateFooter()
    this.generateInvoiceTable()
    this.doc.end()
    return this.doc
  }
}
