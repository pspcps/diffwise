const fs = require('node:fs');
const path = require('node:path');
const qr = require('qrcode-generator')(0, 'M');
// A local static asset: no network request or tracking redirect is needed to scan.
const url = 'https://psdevtool.online/portfolio/';
qr.addData(url); qr.make();
const output = path.resolve(__dirname, '../public/resume/portfolio-qr.svg');
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, qr.createSvgTag({cellSize: 4, margin: 16, scalable: true, alt: 'Prakash Choudhary portfolio QR code', title: url}));
console.log('Generated portfolio QR:', url);
