const puppeteer = require('puppeteer');
const AWS = require('aws-sdk');
const url = require('url');
const process = require('process');

/**
 * Browser instance.
 */
const browser = puppeteer.launch({
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
    ],
});

/**
 * Print options.
 *
 * @typedef {Object} PrintOptions
 * @property {("screen"|"print")} media Media to be emulated when printing.
 * @property {("Letter"|"Legal"|"Tabload"|"Ledger"|"A0"|"A1"|"A2"|"A3"|"A4"|"A5")} format Paper format.
 * @property {boolean} background Enable or disable background in printed PDF.
 * @property {("portrait"|"landscape")} layout Page layout.
 * @property {{top: string, bottom: string, left: string, right: string}} margin Margins.
 * @property {number} scale Scale.
 */

/**
 * Get a buffer representing a Web page in PDF format.
 *
 * @param {url.URL} source Page URL.
 * @param {Partial<PrintOptions>} options Print options.
 * @returns {Promise<Buffer>}
 */
const getBuffer = async (source, options) => {
    const format = options.format || 'A4';
    const media = options.media || 'print';
    const printBackground = 'background' in options ? options.background : true;
    const landscape = options.layout === 'landscape';
    const margin = options.margin;
    const scale = options.scale || 1;

    console.log(`Fetching page ${source.href}...`);
    const context = await browser; // TODO: when new version of Puppeteer is released, use `createIncognitoBrowserContext()`.
    const page = await context.newPage();
    await page.goto(source.href, { waitUntil: 'networkidle2' });

    console.log(`Exporting page as PDF (${JSON.stringify(options)})...`);
    await page.emulateMedia(media);
    const buffer = await page.pdf({ format, printBackground, landscape, margin, scale });

    page.close(); // TODO: when new version of Puppeteer is released, close context.

    return buffer;
};

/**
 * Upload a buffer to S3.
 *
 * @param {Buffer} Body Object's buffer.
 * @param {url.URL} Dest Destination.
 * @returns {Promise<string>}
 */
const uploadBuffer = (Body, Dest) => {
    const dest = url.parse(Dest.href, true);
    const Bucket = dest.hostname;
    const Key = dest.pathname.substr(1);
    const region = dest.query.region || process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

    let baseUrl = `https://s3.amazonaws.com/${Bucket}/`;
    if (region !== 'us-east-1') {
        baseUrl = `https://s3-${region}.amazonaws.com/${Bucket}/`;
    }

    return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({ region });

        console.log(`Uploading PDF to s3://${Bucket}/${Key}...`);
        s3.putObject({ Body, Bucket, Key }, (error, data) => {
            if (error) {
                reject(error);

                return;
            }

            const pdfUrl = url.resolve(baseUrl, Key);
            console.log(`Object available at ${pdfUrl}`);

            resolve(pdfUrl);
        });
    });
};

/**
 * Print a PDF and upload to S3.
 *
 * @param {url.URL} source URL to be printed.
 * @param {url.URL} dest Destination S3 path.
 * @param {Partial<PrintOptions>} options Print options.
 * @returns {Promise<string>}
 */
module.exports = async (source, dest, options = {}) => {
    const buffer = await getBuffer(source, options);
    const pdfUrl = await uploadBuffer(buffer, dest);

    return pdfUrl;
};
