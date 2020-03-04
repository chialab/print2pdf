const { URL } = require('url');
const { v4: uuid4 } = require('uuid');
const print = require('./print.js');

const BUCKET = process.env.BUCKET;
const CORS_ALLOWED_HOSTS = process.env.CORS_ALLOWED_HOSTS;

exports.handler = async ({ body, headers: reqHeaders }) => {
    const json = JSON.parse(body);
    const origin = reqHeaders.origin || reqHeaders.Origin;

    const sourceUrl = json.url;
    const fileName = json.file_name;
    const options = Object.assign({}, json);
    delete options.url;
    delete options.file_name;

    const headers = {
        'Content-Type': 'application/json',
    };

    if (CORS_ALLOWED_HOSTS && origin) {
        if (CORS_ALLOWED_HOSTS === '*') {
            headers['Access-Control-Allow-Origin'] = '*';
        } else {
            const hosts = CORS_ALLOWED_HOSTS.split(',');
            if (hosts.includes(origin)) {
                headers['Access-Control-Allow-Origin'] = origin;
            }
        }
    }

    try {
        const source = new URL(sourceUrl);
        const dest = new URL(`s3://${BUCKET}/${uuid4()}/${fileName}`);
        const url = await print(source, dest, options);

        return { statusCode: 200, headers, body: JSON.stringify({ url }) };
    } catch (err) {
        if (err instanceof SyntaxError || err instanceof TypeError) {
            console.log('Client Error', err);

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: err.message }),
            };
        }

        // Re-throw unhandled exceptions.
        throw err;
    }
};
