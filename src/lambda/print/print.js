const { URL } = require('url');
const AWS = require('aws-sdk');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const getBrowser = () => chromium.executablePath
    .then((executablePath) => puppeteer.launch({ executablePath, args: chromium.args }));

/** Browser instance. */
let browser = getBrowser();

const getPage = async () => {
    try {
        const context = await browser;

        return await context.newPage();
    } catch (err) {
        // Restart browser.
        try {
            await context.close();
        } catch (err) {
            console.error(err);
        }
        browser = getBrowser();

        // Retry opening page.
        const context = await browser;

        return await context.newPage();
    }
};

const timeout = (time) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), time);
    });
};

/**
 * @typedef {"screen"|"print"} PrintMedia
 * @typedef {"Letter"|"Legal"|"Tabload"|"Ledger"|"A0"|"A1"|"A2"|"A3"|"A4"|"A5"} PrintFormat
 * @typedef {"portrait"|"landscape"} PrintLayout
 * @typedef {{ top: string, bottom: string, left: string, right: string }} PrintMargins
 * @typedef {{ media: PrintMedia, format: PrintFormat, background: boolean, layout: PrintLayout, margin: PrintMargins, scale: number }} PrintOptions
 */

/**
 * Get a buffer representing a Web page in PDF format.
 *
 * @param {URL} source Page URL.
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

    console.time('Opening new page');
    // const context = await (await browser).createIncognitoBrowserContext();
    const page = await getPage();
    console.timeEnd('Opening new page');
    try {
        console.time(`Navigating to ${source}`);
        await page.goto(source.href, { waitUntil: 'networkidle2' });
        console.timeEnd(`Navigating to ${source}`);

        await timeout(1000);

        console.time(`Exporting as PDF with options ${JSON.stringify(options)}`);
        await page.emulateMedia(media);
        const buffer = await page.pdf({ format, printBackground, landscape, margin, scale });
        console.timeEnd(`Exporting as PDF with options ${JSON.stringify(options)}`);

        return buffer;
    } finally {
        console.time('Closing page');
        await page.close();
        // await context.close();
        console.timeEnd('Closing page');
    }
};

/**
 * Upload a buffer to S3.
 *
 * @param {Buffer} Body Object's buffer.
 * @param {URL} Dest Destination.
 * @returns {Promise<URL>}
 */
const uploadBuffer = async (Body, Dest) => {
    const Bucket = Dest.hostname;
    const Key = Dest.pathname.substr(1);
    const region = Dest.searchParams.get('region') || process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
    const s3 = new AWS.S3({ apiVersion: '2006-03-01', region });

    let baseUrl = `https://${Bucket}.s3.amazonaws.com/`;
    if (region !== 'us-east-1') {
        baseUrl = `https://${Bucket}.s3-${region}.amazonaws.com/`;
    }

    console.log(`Uploading ${Body.byteLength} bytes to ${Dest} using region ${region}`);
    await s3.putObject({ Body, Bucket, Key, ContentType: 'application/pdf', ContentDisposition: 'attachment' }).promise();

    return new URL(Key, baseUrl);
};

/**
 * Print a PDF and upload to S3.
 *
 * @param {URL} source URL to be printed.
 * @param {URL} dest Destination S3 path.
 * @param {Partial<PrintOptions>} options Print options.
 * @returns {Promise<string>}
 */
module.exports = async (source, dest, options = {}) => {
    console.time(`Printing ${source}`);
    const buffer = await getBuffer(source, options);
    console.timeEnd(`Printing ${source}`);

    console.time(`Uploading PDF to ${dest}`);
    const pdfUrl = await uploadBuffer(buffer, dest);
    console.timeEnd(`Uploading PDF to ${dest}`);

    console.log(`Object available at ${pdfUrl}`);

    return pdfUrl;
};
