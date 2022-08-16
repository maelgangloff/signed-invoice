import { WriteStream } from 'fs'
import PDFKit from 'pdfkit'
import Invoice from './index'
import translation from './translation.json'

async function generateHeader (doc: PDFKit.PDFDocument, invoice: Invoice) {
  const lang = translation[invoice.invoice.language]
  const { seller, logoPath } = invoice.invoice

  if(logoPath) doc.image(logoPath, 0, 40, { width: 80 })

  doc.fillColor('#444444')
    .fontSize(20)
    .text(seller.name, 90, 57)
    .fontSize(10)
    .text(seller.address.street, 90, 80)
    .text(`${seller.address.zip} ${seller.address.city} ${seller.address.state ?? ''}`, 90, 95)
    .text(`${seller.contact}`, 90, 110)
    .image(await invoice.createQRCode(), 470, 30, { align: 'right', width: 100 })
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(lang.signedInvoice, 470, 130, { align: 'center' })
    .moveDown()
}

function generateHr (doc: PDFKit.PDFDocument, y: number) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(30, y).lineTo(550, y).stroke()
}

function formatDate (date: Date) {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return day + '/' + month + '/' + year
}

const formatCurrency = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`

function generateCustomerInformation (doc: PDFKit.PDFDocument, invoice: Invoice) {
  const lang = translation[invoice.invoice.language]
  const { reference, dueDate, currency, client } = invoice.invoice

  doc.fillColor('#444444').fontSize(20).text(lang.invoice.toUpperCase(), 30, 160)
  generateHr(doc, 185)
  const customerInformationTop = 200
  doc
    .fontSize(10)
    .text(`${lang.reference}:`, 30, customerInformationTop)
    .font('Helvetica-Bold')
    .text(reference, 130, customerInformationTop)
    .font('Helvetica')
    .text(`${lang.dueDate}: `, 30, customerInformationTop + 15)
    .text(formatDate(dueDate), 130, customerInformationTop + 15)
    .text(`${lang.amountDue}: `, 30, customerInformationTop + 30)
    .text(formatCurrency(invoice.amountDue, currency), 130, customerInformationTop + 30)
    .font('Helvetica-Bold')
    .text(client.name, 280, customerInformationTop)
    .font('Helvetica')
    .text(client.address ? client.address.street : '', 280, customerInformationTop + 15)
    .text(client.address ? `${client.address.zip} ${client.address.city}` : '', 280, customerInformationTop + 30)
    .moveDown()

  generateHr(doc, 252)
}

function generateTableRow(doc: PDFKit.PDFDocument, y: number, c1: string, c2: string, c3: string, c4: string|number, c5: string) {
	doc.fontSize(10)
		.text(c1, 30, y)
		.text(c2, 130, y)
		.text(c3, 280, y, { width: 90, align: 'right' })
		.text(c4.toString(), 370, y, { width: 90, align: 'right' })
		.text(c5, 0, y, { align: 'right' });
}

function generateInvoiceTable (doc: PDFKit.PDFDocument, invoice: Invoice) {
  let i
  const invoiceTableTop = 330
  const lang = translation[invoice.invoice.language]

  doc.font('Helvetica-Bold')
  generateTableRow(
    doc,
    invoiceTableTop,
    lang.item, lang.description, lang.unitPrice, lang.quantity, lang.total)
  generateHr(doc, invoiceTableTop + 20)
  doc.font('Helvetica')

  const items = invoice.invoice.lines
  const { currency } = invoice.invoice
  const { subtotalWithoutTax, amountDue } = invoice

  for (i = 0; i < items.length; i++) {
    const item = items[i]
    const position = invoiceTableTop + (i + 1) * 30
    generateTableRow(
      doc,
      position,
      item.item,
      item.description ?? '',
      formatCurrency(item.unitPrice * (1 + item.tax), currency),
      item.quantity,
      formatCurrency(item.quantity * item.unitPrice * (1 + item.tax), currency)
    )

    generateHr(doc, position + 20)
  }

  generateTableRow(doc, invoiceTableTop + (i + 1) * 30 + 10, '', '', lang.subtotalWithoutTax, '', formatCurrency(subtotalWithoutTax, currency))
  generateTableRow(doc, invoiceTableTop + (i + 2) * 30, '', '', lang.amountDue, '', formatCurrency(amountDue, currency))
}

function generateFooter (doc: PDFKit.PDFDocument, invoice: Invoice) {
  const {seller} = invoice.invoice
  doc.fontSize(10).text(`${seller.name} - ${seller.identifier}${seller.vatNumber ? ' - ' + seller.vatNumber : ''}`, 50, 800, { align: 'left', width: 500 })
}

export async function invoicePDF (invoice: Invoice, stream: WriteStream) {
  const doc = new PDFKit({ margin: 30, size: 'A4' })
  await generateHeader(doc, invoice)
  generateCustomerInformation(doc, invoice)
  generateInvoiceTable(doc, invoice)
  generateFooter(doc, invoice)
  doc.end()
  doc.pipe(stream)
}
