# Digitally signed invoice generator

This library allows you to generate invoices digitally signed by a QR Code.  
This digital signature stamp contains general invoice information (issuer, recipient, invoice reference, due date, invoice date, number of items, number of lines, net amount payable, payment currency and status).  
This information is signed using the invoice issuer's private cryptographic key, thus the invoice cannot be falsified by a third party.

![Example invoice](docs/example.png?raw=true)

## Key signing ceremony

Warning: this operation should be performed, if possible, on a newly installed computer disconnected from the internet, with openssl installed.

To generate the private key used to sign the QR code's data, execute the following command:
```bash
openssl ecparam -name prime256v1 -genkey -out privatekey.pem
```

Now to generate the key allowing anyone to verify the authenticity of the QR code's data, execute this command:  
```bash
openssl ec -in privatekey.pem -pubout -out publickey.pem
```

Keep these keys on a safe backup medium.

## Integrate this library into your application

Save your private key in an environment variable and share the public key to the people who will need to authenticate your generated documents.
```js
const { Invoice } = require('signed-invoice')
const fs = require('fs')
const dotenv = require('dotenv')

dotenv()

const privateKey = process.env.PRIVATE_KEY

const invoice = new Invoice({
  logoPath: 'logo.png',
  seller: {
    name: "My company",
    identifier: 'SIREN 000 000 000',
    contact: 'contact@maelgangloff.fr',
    address: {street: '4 RUE DES FLEURS', city: 'PARIS', zip: '75000'}
  },
  client: {name: 'John Doe'},
  reference: 'MG202200000',
  date: new Date(),
  dueDate: new Date('2022-08-20'),
  lines: [
    {
      item: 'Coffee',
      quantity: 24,
      unitPrice: 2,
      tax: 0.1,
      description: 'One coffee per hour'
    },
    {
      item: 'Pizza',
      quantity: 2,
      unitPrice: 7,
      tax: 0.1,
      description: 'Margherita'
    }, {
      item: 'Soda',
      quantity: 3,
      unitPrice: 2,
      tax: 0.1
    },
    {
      item: 'Hot-dog',
      quantity: 1,
      unitPrice: 5,
      tax: 0.1
    },
    {
      item: 'Salad',
      quantity: 1,
      unitPrice: 8,
      tax: 0.1,
      description: 'Caesar'
    },{
      item: 'Pasta',
      quantity: 4,
      unitPrice: 6,
      tax: 0.1,
      description: 'A plate of bolognese pasta'
    },
    {
      item: 'Quiche Lorraine',
      quantity: 6,
      unitPrice: 10,
      tax: 0.1,
      description: 'Cream, eggs, and bacon'
    }
  ],
  terms: 'We hope you had a good time and would be happy to welcome you again',
  currency: 'EUR',
  language: 'en_US',
  isPaid: true
}, privateKey)

invoice.generatePDF().then(doc => doc.pipe(fs.createWriteStream('invoice.pdf')))

```