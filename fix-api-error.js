const fs = require('fs');

let c = fs.readFileSync('packages/api/src/error.ts', 'utf8');
c = c.replace(/ as ApiErrorDefinition/g, '');
fs.writeFileSync('packages/api/src/error.ts', c);

c = fs.readFileSync('packages/payment/src/providers/paypal/api.ts', 'utf8');
c = c.replace(/as PaypalErrorResponse/g, '');
fs.writeFileSync('packages/payment/src/providers/paypal/api.ts', c);

c = fs.readFileSync('packages/payment/src/providers/paypal/index.ts', 'utf8');
c = c.replace(/as Partial<PaypalSubscription>/g, '');
c = c.replace(/as const/g, '');
fs.writeFileSync('packages/payment/src/providers/paypal/index.ts', c);
