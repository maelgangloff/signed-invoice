/// <reference types="node" />
/// <reference types="pdfkit" />
import { Company, Person } from './Entity';
import { Line } from './Line';
import translation from './translation.json';
import { InvoiceSignedPayload } from './InvoiceSignedPayload';
export default class Invoice {
    invoice: {
        logoPath?: string;
        seller: Company;
        client: Company | Person;
        date: Date;
        reference: string;
        dueDate: Date;
        lines: Line[];
        currency: string;
        language: keyof typeof translation;
        isPaid: boolean;
    };
    private privateKey;
    readonly subtotalWithoutTax: number;
    readonly amountDue: number;
    constructor(invoice: {
        logoPath?: string;
        seller: Company;
        client: Company | Person;
        date: Date;
        reference: string;
        dueDate: Date;
        lines: Line[];
        currency: string;
        language: keyof typeof translation;
        isPaid: boolean;
    }, privateKey: string);
    static signJwt(signedPayload: InvoiceSignedPayload, privateKey: string): string;
    createJwt(): string;
    createQRCodeBuffer(): Promise<Buffer>;
    generatePDF(): Promise<PDFKit.PDFDocument>;
}
