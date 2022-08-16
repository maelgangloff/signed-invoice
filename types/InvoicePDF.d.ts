/// <reference types="pdfkit" />
import Invoice from './index';
export declare function invoicePDF(invoice: Invoice): Promise<PDFKit.PDFDocument>;
