/// <reference types="node" />
import { Company, Person } from './Entity';
import { Line } from './Line';
import translation from './translation.json';
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
    createJwt(): string;
    createQRCode(): Promise<Buffer>;
    generatePDF(): Promise<void>;
}
