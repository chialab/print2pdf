const print = require('./print.js');
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
        async (argv) => await print(argv.source, argv.dest, argv.format, argv.media)
    )
    .argv;
