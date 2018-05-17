const url = require('url');

require('yargs')
    .usage('$0 <cmd> [args]')
    .command(
        'print [source] [dest]',
        'Print URL to PDF and store to S3',
        (yargs) => {
            yargs
                .positional('source', {
                    type: 'string',
                    describe: 'The source URL to print',
                    coerce: (source) => url.parse(source),
                })
                .positional('dest', {
                    type: 'string',
                    describe: 'The destination S3 URL',
                    coerce: (dest) => url.parse(dest),
                })
                .option('format', {
                    type: 'string',
                    describe: 'The format of the PDF',
                    default: 'A4',
                    choices: ['A4', 'Letter'],
                })
                .option('media', {
                    type: 'string',
                    describe: 'The media to be emulated while printing',
                    default: 'print',
                    choices: ['print', 'screen'],
                });
        },
        async (argv) => {
            const print = require('./print.js');

            await print(argv.source, argv.dest, argv.format, argv.media);
        }
    )
    .command(
        'server',
        'Listen for requests to print',
        (yargs) => {
            yargs
                .env(true)
                .option('port', {
                    type: 'number',
                    default: 8080,
                })
                .option('base', {
                    type: 'string',
                    describe: 'The destination S3 base URL',
                    coerce: (base) => url.parse(base),
                    required: true,
                });
        },
        (argv) => {
            const server = require('./server')({ s3base: argv.base });

            server.listen(argv.port, () => {
                console.log(`Listening on port ${argv.port}...`);
            });
        }
    )
    .argv;
