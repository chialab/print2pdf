const url = require('url');

require('yargs')
    .usage('$0 <cmd> [args]')
    .env(true)
    .showHelpOnFail(false)
    .option('base', {
        type: 'string',
        describe: 'The destination S3 base URL',
        coerce: (base) => url.parse(base),
        required: true,
    })
    .command(
        'print <source> <file-name>',
        'Print URL to PDF and store to S3',
        (yargs) => {
            yargs
                .positional('source', {
                    type: 'string',
                    description: 'The source URL to print',
                    coerce: (source) => url.parse(source),
                })
                .positional('file-name', {
                    type: 'string',
                    description: 'The destination file name',
                })
                .option('media', {
                    type: 'string',
                    description: 'The media to be emulated while printing',
                    default: 'print',
                    choices: ['print', 'screen'],
                })
                .option('format', {
                    type: 'string',
                    description: 'The format of the PDF',
                    default: 'A4',
                    choices: ['Letter', 'Legal', 'Tabload', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
                })
                .option('background', {
                    type: 'boolean',
                    description: 'Enable or disable background graphics in the PDF',
                    default: true,
                })
                .option('layout', {
                    type: 'string',
                    description: 'Page layout',
                    default: 'portrait',
                    choices: ['portrait', 'landscape'],
                })
                .option('scale', {
                    type: 'number',
                    description: 'Scale',
                    default: 1,
                });
        },
        async (argv) => {
            const print = require('./print');
            const uuid = require('./uuid');

            const dest = new url.URL(`${uuid()}/${argv.fileName}`, argv.base.href);

            await print(argv.source, dest, {
                media: argv.media,
                format: argv.format,
                background: argv.background,
                layout: argv.layout,
                scale: argv.scale,
            });
        }
    )
    .command(
        'server',
        'Listen for requests to print',
        (yargs) => {
            yargs
                .option('port', {
                    type: 'number',
                    default: 8080,
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
