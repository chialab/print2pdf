const { URL } = require('url');
const uuid4 = require('uuid/v4');
const print = require('./print.js');

const BUCKET = process.env.BUCKET;
const CORS_ALLOWED_HOST = process.env.CORS_ALLOWED_HOST;

exports.handler = async ({ body }) => {
    const json = JSON.parse(body);

    const sourceUrl = json.url;
    const fileName = json.file_name;
    const options = Object.assign({}, json);
    delete options.url;
    delete options.file_name;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': CORS_ALLOWED_HOST,
    };
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
