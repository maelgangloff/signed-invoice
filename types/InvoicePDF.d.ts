/// <reference types="node" />
import { WriteStream } from 'fs';
import Invoice from './index';
export declare function invoicePDF(invoice: Invoice, stream: WriteStream): Promise<void>;
