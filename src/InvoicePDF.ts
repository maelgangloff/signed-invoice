import PDFKit from 'pdfkit'
import wrap from 'word-wrap'
import { Invoice } from './index'
import translation from './translation.json'

export class InvoicePDF {
  private formatCurrency = (amount: number, currency: string) => `${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${currency}`
  private doc: PDFKit.PDFDocument = new PDFKit({
    margins: {
      top: 30, left: 30, right: 30, bottom: 10
    },
    size: 'A4'
  })

  constructor (private invoice: Invoice) {
    return this
  }

  private async generateHeader () {
    const lang = translation[this.invoice.invoice.language]
    const { seller, logoPath } = this.invoice.invoice

    if (logoPath) this.doc.image(logoPath, 10, 40, { width: 80 })

    const x = logoPath ? 100 : 30
    this.doc.fillColor('#444444')
      .font('Helvetica')
      .fontSize(20)
      .text(seller.name, x, 57)
      .fontSize(10)
      .text(seller.address.street, x, 80)
      .text(`${seller.address.zip} ${seller.address.city} ${seller.address.state ?? ''}`, x, 95)
      .text(`${seller.contact}`, x, 110)
      .image(await this.invoice.createQRCodeBuffer(), 450, 30, { align: 'right', width: 120 })
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(lang.signedInvoice, 450, 150, { align: 'center' })
      .moveDown()
  }

  private generateHr (y: number) {
    this.doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(30, y).lineTo(550, y).stroke()
  }

  private formatDate (date: Date) {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return day + '/' + month + '/' + year
  }

  private generateCustomerInformation () {
    const lang = translation[this.invoice.invoice.language]
    const { reference, dueDate, currency, client } = this.invoice.invoice

    this.doc.fillColor('#444444').fontSize(20).text(lang.invoice.toUpperCase(), 30, 160)
    this.generateHr(185)
    const customerInformationTop = 200
    this.doc.fontSize(10)
      .text(`${lang.reference}:`, 30, customerInformationTop)
      .font('Helvetica-Bold')
      .text(reference, 130, customerInformationTop)
      .font('Helvetica')
      .text(`${lang.dueDate}: `, 30, customerInformationTop + 15)
      .text(this.formatDate(dueDate), 130, customerInformationTop + 15)
      .text(`${lang.amountDue}: `, 30, customerInformationTop + 30)
      .text(this.formatCurrency(this.invoice.amountDue, currency), 130, customerInformationTop + 30)
      .font('Helvetica-Bold')
      .text(client.name, 280, customerInformationTop)
      .font('Helvetica')
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

  private async generateInvoiceTable () {
    let i
    let invoiceTableTop = 270
    const lang = translation[this.invoice.invoice.language]

    this.doc.font('Helvetica-Bold')
    this.generateTableRow(
      invoiceTableTop,
      lang.item, lang.description, lang.unitPrice, lang.quantity, lang.total)
    this.generateHr(invoiceTableTop + 20)
    this.doc.font('Helvetica')

    const items = this.invoice.invoice.lines
    const { currency, terms, isPaid, date } = this.invoice.invoice
    const { subtotalWithoutTax, amountDue } = this.invoice

    let position = invoiceTableTop
    let page = 1
    for (i = 0; i < items.length; i++) {
      const item = items[i]
      position += 25

      const itemName = wrap(item.item, { width: 18, indent: '', trim: true })
      const itemDescription = wrap(item.description ?? '', { width: 40, indent: '', trim: true })

      const d1 = (itemName.match(/\n/g) || []).length
      const d2 = (itemDescription.match(/\n/g) || []).length

      const positionEnd = position + (d1 >= d2 ? d1 * 10 : d2 * 10) + 22

      if (positionEnd >= 750) {
        invoiceTableTop = 50
        this.doc.addPage()
        this.generateHr(70)
        page++
        this.generateFooter(page)
        position = invoiceTableTop + 25
      }

      this.generateTableRow(
        position,
        itemName,
        itemDescription,
        this.formatCurrency(item.unitPrice, currency),
        item.quantity,
        this.formatCurrency(item.quantity * item.unitPrice, currency)
      )

      position += d1 >= d2 ? d1 * 10 : d2 * 10
      this.generateHr(position + 22)
    }
    if (position >= 650) {
      invoiceTableTop = 50
      this.doc.addPage()
      page++
      this.generateFooter(page)
      position = invoiceTableTop
    }

    this.generateHr(position + 21)
    this.generateTableRow(position + 35, '', '', lang.subtotalWithoutTax, '', this.formatCurrency(subtotalWithoutTax, currency))
    this.generateTableRow(position + 55, '', '', lang.tax, '', this.formatCurrency(amountDue - subtotalWithoutTax, currency))
    this.doc.font('Helvetica-Bold')
    this.generateTableRow(position + 85, '', '', lang.amountDue, '', this.formatCurrency(amountDue, currency))
    this.doc.font('Helvetica').text(`${this.formatDate(date)}: ${isPaid ? lang.paid : lang.waitingForPayment}`, 30, position + 35).text(terms ?? '', 30, 750)
  }

  private generateFooter (page = 1) {
    const lang = translation[this.invoice.invoice.language]
    const { seller } = this.invoice.invoice
    this.doc.font('Helvetica-Bold').fontSize(10).text(`${seller.name} - ${seller.identifier}${seller.vatNumber ? ' - ' + seller.vatNumber : ''}`, 30, 810)
      .text(`${lang.page} ${page}`, 520, 810).font('Helvetica')
  }

  public async generate () {
    await this.generateHeader()
    this.generateCustomerInformation()
    this.generateFooter()
    await this.generateInvoiceTable()
    this.doc.end()
    return this.doc
  }
}
