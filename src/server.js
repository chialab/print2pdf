const http = require('http');
const url = require('url');
const Ajv = require('ajv');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
const validator = ajv.compile(require('./schema.json'));
const print = require('./print');
const uuid = require('./uuid');

/**
 * Request body.
 *
 * @typedef {Object} RequestBody
 * @property {string} url URL to be printed.
 * @property {string} file_name File name to save.
 */

/**
 * Parse and validate request body.
 *
 * @param {string} body Request body.
 * @returns {RequestBody}
 * @throws {SyntaxError} Throws an error upon encountering an invalid request body.
 */
const parseBody = (body) => {
    body = JSON.parse(body);
    if (!validator(body)) {
        console.error(validator.errors);
        throw new SyntaxError('Invalid JSON payload');
    }

    return body;
};

/**
 * Send a generic response.
 *
 * @param {http.ServerResponse} res Server response.
 * @param {number} statusCode Status code.
 * @param {Object|undefined} body Response body data.
 * @param {Object} headers Response headers.
 * @returns {Promise<void>}
 */
const sendResponse = (res, statusCode, body, headers = {}) => {
    return new Promise((resolve) => {
        headers['Content-Type'] = 'application/json';
        res.writeHead(statusCode, headers);
        if (body !== undefined) {
            res.end(JSON.stringify(body), resolve);
        } else {
            res.end(resolve);
        }
    });
}

/**
 * Send an error.
 *
 * @param {http.ServerResponse} res Server response.
 * @param {number} statusCode Status code.
 * @param {Object} details Additional details.
 * @returns {Promise<void>}
 */
const sendError = (res, statusCode, details = {}) => {
    const body = {
        statusCode,
        message: http.STATUS_CODES[statusCode],
        details,
    };

    return sendResponse(res, statusCode, body);
};

/**
 * Process a single request.
 *
 * @param {http.ServerResponse} res Server response.
 * @param {string} requestMethod Request method.
 * @param {url.Url} requestUrl Parsed request URL.
 * @param {Object} requestHeaders Request headers.
 * @param {string} requestBody Request body.
 * @param {{s3base: url.URL}} options Additional options.
 * @returns {Promise<void>}
 */
const processRequest = (res, requestMethod, requestUrl, requestHeaders, requestBody, options) => {
    switch (requestUrl.pathname) {
        case '/status':
            switch (requestMethod) {
                case 'GET':
                    return sendResponse(res, 200, { status: true });

                default:
                    return sendError(res, 405);
            }

        case '/print':
            const corsHeaders = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
            };

            switch (requestMethod) {
                case 'OPTIONS':
                    return sendResponse(res, 200, undefined, corsHeaders);

                case 'POST':
                    try {
                        const body = parseBody(requestBody);
                        const source = url.parse(body.url);
                        const dest = new url.URL(`${uuid()}/${body.file_name}`, options.s3base.href);

                        return print(source, dest, body)
                            .then((url) => sendResponse(res, 200, { url }, corsHeaders))
                            .catch((err) => {
                                console.error('Error!', err);
                                return sendError(res, 500, { message: err.message });
                            });
                    } catch (err) {
                        console.error('Error!', err);
                        if (err instanceof SyntaxError) {
                            return sendError(res, 400, { message: err.message });
                        }

                        return sendError(res, 500, { message: err.message });
                    }

                default:
                    return sendError(res, 405);
            }

        default:
            return sendError(res, 404);
    }
};

/**
 * Run server.
 *
 * @param {{s3base: url.URL}} options Additional options.
 * @returns {http.Server}
 */
module.exports = (options) => {
    const server = http.createServer((req, res) => {
        console.log(`Received ${req.method} ${req.url}...`);
        const requestMethod = req.method;
        const requestUrl = url.parse(req.url);
        const requestHeaders = req.headers;
        let requestBody = '';
        req.on('readable', () => {
            const chunk = req.read();
            if (chunk) {
                requestBody += chunk;
            }
        });
        req.on('end', () => {
            processRequest(res, requestMethod, requestUrl, requestHeaders, requestBody, options)
                .then(() => {
                    console.log(`Responded ${res.statusCode}`);
                });
        });
    });
    server.on('clientError', (err, socket) => {
        console.error(err);
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

    return server;
};
