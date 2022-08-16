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
const dotenv = require('dotenv')

dotenv()

const privateKey = process.env.PRIVATE_KEY

const invoice = new Invoice({
  seller: {
    name: 'Maël Gangloff',
    identifier: 'SIRET 000 000 000 00000',
    contact: 'contact@maelgangloff.fr',
    address: {
      street: '4 RUE DES FLEURS',
      city: 'PARIS',
      zip: '75000'
    }
  },
  client: {
    name: 'John Doe'
  },
  reference: 'MG202200000',
  date: new Date(),
  dueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1e3 ),
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
    }
  ],
  currency: 'EUR',
  language: 'en_US',
  isPaid: false
}, privateKey)
```