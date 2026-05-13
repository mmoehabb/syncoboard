const fs = require('fs');

let c = fs.readFileSync('packages/api/src/error.ts', 'utf8');
c = c.replace(/as CustomError/g, ''); // in case
c = c.replace(/\{ name: "APIError", statusCode: 400, message \} as const;/g, '{ name: "APIError", statusCode: 400, message };');
c = c.replace(/\{ name: "APIError", statusCode: 401, message \} as const;/g, '{ name: "APIError", statusCode: 401, message };');
c = c.replace(/\{ name: "APIError", statusCode: 403, message \} as const;/g, '{ name: "APIError", statusCode: 403, message };');
c = c.replace(/\{ name: "APIError", statusCode: 404, message \} as const;/g, '{ name: "APIError", statusCode: 404, message };');
c = c.replace(/\{ name: "APIError", statusCode: 429, message \} as const;/g, '{ name: "APIError", statusCode: 429, message };');
c = c.replace(/\{ name: "APIError", statusCode: 500, message \} as const;/g, '{ name: "APIError", statusCode: 500, message };');
fs.writeFileSync('packages/api/src/error.ts', c);

c = fs.readFileSync('packages/payment/src/constants/paypal.ts', 'utf8');
c = c.replace(/as const;/g, ';');
fs.writeFileSync('packages/payment/src/constants/paypal.ts', c);

c = fs.readFileSync('packages/payment/src/providers/paypal/api.ts', 'utf8');
c = c.replace(/as unknown as \{ response\?: \{ data\?: unknown \} \}/g, '');
fs.writeFileSync('packages/payment/src/providers/paypal/api.ts', c);

c = fs.readFileSync('packages/payment/src/providers/paypal/index.ts', 'utf8');
c = c.replace(/as unknown as "MONTH" \| "YEAR"/g, '');
c = c.replace(/as \.\[\]/g, '');
fs.writeFileSync('packages/payment/src/providers/paypal/index.ts', c);

c = fs.readFileSync('packages/shared/__tests__/tab-completion.test.ts', 'utf8');
c = c.replace(/as unknown as string/g, '');
c = c.replace(/as unknown/g, '');
fs.writeFileSync('packages/shared/__tests__/tab-completion.test.ts', c);
