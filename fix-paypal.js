const fs = require('fs');

let c = fs.readFileSync('packages/payment/src/providers/paypal/api.ts', 'utf8');
c = c.replace(/return accessToken as string;/g, 'return String(accessToken);');
fs.writeFileSync('packages/payment/src/providers/paypal/api.ts', c);

c = fs.readFileSync('packages/payment/src/providers/paypal/index.ts', 'utf8');
c = c.replace(/price.interval as unknown,/g, 'price.interval,');
c = c.replace(/return parsedBody as PayPalWebhookEvent;/g, 'return parsedBody;');
fs.writeFileSync('packages/payment/src/providers/paypal/index.ts', c);
