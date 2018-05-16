const puppeteer = require('puppeteer');
const AWS = require('aws-sdk');
const { URL } = require('url');

/**
 * Upload a buffer to 
 * 
 * @param {Buffer} Body Object's buffer.
 * @param {URL} Dest Destination.
 */
function uploadBuffer (Body, Dest) {
    const Bucket = Dest.hostname;
    const Key = Dest.pathname.substr(1);

    return new Promise((resolve, reject) => {
        const s3 = new AWS.S3();

        s3.putObject({ Body, Bucket, Key }, (error, data) => {
            if (error) {
                reject(error);
            }
            resolve(data);
        });
    });
}

/**
 * Print a PDF and upload to S3.
 * 
 * @param {URL} source URL to be printed.
 * @param {URL} dest Destination S3 path.
 * @param {string} format PDF format.
 * @returns {Promise<void>}
 */
module.exports = async (source, dest, format) => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]
    });
    console.log('Done!');
    
    console.log('Opening new page...');
    const page = await browser.newPage();
    console.log('Done!');
    
    console.log(`Fetching page ${source.href}...`);
    await page.goto(source.href, { waitUntil: 'networkidle2' });
    console.log('Done!');

    console.log('Exporting page as PDF...');
    const buffer = await page.pdf({ format });
    console.log('Done!');
    
    console.log(`Uploading PDF to ${dest.href}...`);
    await uploadBuffer(buffer, dest);
    console.log('Done!');
    
    console.log('Closing browser...');
    browser.close();
    console.log('Done!');
};