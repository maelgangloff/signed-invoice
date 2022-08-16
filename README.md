# Digitally signed invoice generator

This library allows you to generate invoices digitally signed by a QR Code.  
This digital signature stamp contains the general invoice information (issuer, recipient, invoice reference, due date, invoice date, number of items, number of lines, net amount payable, payment currency and status). This information is signed using the invoice issuer's private cryptographic key. Thus, the invoice cannot be falsified by a third party.

## Key signing ceremony

Warning: this operation should be performed if possible on a newly installed computer disconnected from the internet.  
To generate the cryptographic key pair we will use openssl software.  

```bash
openssl ecparam -name prime256v1 -genkey -out privatekey.pem
```
You have just generated the private key used to sign the data contained in the QR Code.  
We will now generate the derived key: the public key. This key will allow anyone to verify the authenticity of the data contained in the QR Code.  

```bash
openssl ec -in privatekey.pem -pubout -out publickey.pem
```

Keep these keys on a backup medium and put this backup in a safe place.

## Integrate this library into your application

Save your private key in an environment variable of your production system and share the public key with the people who will need to be able to authenticate the documents you issue.

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
      item: 'TEST',
      quantity: 2,
      unitPrice: 10,
      tax: 0.2,
      description: 'Product of test'
    }
  ],
  currency: 'EUR',
  language: 'fr_FR',
  isPaid: false
}, privateKey)

```