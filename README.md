# Print to PDF

This repository contains a Docker image used to print a publicly available
HTML page to PDF and upload the result to an S3 bucket.

## API

### `POST /print`

Export a publicly available HTML page as a PDF.

#### Request

##### Headers

 * `Content-Type: application/json`

##### Body parameters

 * `url` (**required**): the publicly available URL of the page you want to
    print as PDF.
 * `file_name` (**required**): friendly file name for the exported PDF.
    It **MUST** end with `.pdf` and **MUST NOT** contain any slash, non-ASCII or
    non-printable character (except plain spaces).
 * `media` (_optional_): media to be emulated when printing to PDF. Can be
    either "print" or "screen". Defaults to "print".
 * `format` (_optional_): paper format of PDF. Can be one of "Letter", "Legal",
    "Tabload", "Ledger", "A0", "A1", "A2", "A3", "A4", "A5". Defaults to "A4".
 * `background` (_optional_): enable or disable background graphics in printed
    PDF. Defaults to `true`.
 * `layout` (_optional_): page layout of printed PDF. Can be either "portrait"
    or "landscape". Defaults to "portrait".
 * `margin` (_optional_): page margin of printed PDF. Is an object containing
    four keys (top, bottom, left, right) with values expressed as distance units
    (e.g.: "1cm").
 * `scale` (_optional_): print scale. Can be any positive decimal number.
    Defaults to 1 (1 means 100%, 0.5 means 50%, 2 means 200%, …).

##### Examples

```http
Content-Type: application/json

{
    "url": "http://example.com/my-page/",
    "file_name": "my-friendly-file-name.pdf"
}
```

```http
Content-Type: application/json

{
    "url": "http://example.com/my-page/",
    "file_name": "my-friendly-file-name.pdf",
    "media": "screen",
    "format": "A5",
    "background": false,
    "layout": "landscape",
    "margin": {
        "top": "1cm",
        "bottom": "1.5cm",
        "left": "1cm",
        "right": "1cm",
    },
    "scale": 0.94
}
```

#### Responses

 * **200 OK**

    ```http
    HTTP/1.1 200 OK
    Content-Type: application/json

    {
        "url": "https://s3.amazonaws.com/example-bucket/your-file.pdf"
    }
    ```

 * **400 Bad Request**

    ```http
    HTTP/1.1 200 OK
    Content-Type: application/json

    {
        "status": 400,
        "message": "Bad Request",
        "details": {
            "message": "Some hopefully helpful message"
        }
    }
    ```

 * **500 Internal Server Error**

    ```http
    HTTP/1.1 200 OK
    Content-Type: application/json

    {
        "status": 500,
        "message": "Internal Server Error",
        "details": {
            "message": "Something really bad happened"
        }
    }
    ```

### `GET /status`

Check application status.

#### Responses

 * **200 OK**

    ```http
    HTTP/1.1 200 OK
    Content-Type: application/json

    {
        "ok": true
    }
    ```

## Deployment

### AWS

A CloudFormation template is provided to help provision and configure all the
required AWS resources, such as the S3 bucket and the IAM user with permissions
to upload files exclusively on that bucket.

You may create a new stack using the CloudFormation template in
`cform-template.yml` and you should be ready to go.

### Heroku

This Docker image has been developed keeping Heroku in mind. If you wish to
deploy this app on Heroku, simply create an app, and run:

```bash
# Set config variables:
$ heroku config:set --app your-app-name AWS_ACCESS_KEY_ID=AKIA000000000EXAMPLE
$ heroku config:set --app your-app-name AWS_SECRET_ACCESS_KEY=SECRETKEYFROMAWS
$ heroku config:set --app your-app-name AWS_DEFAULT_REGION=your-region-of-choice
$ heroku config:set --app your-app-name BASE=s3://your-s3-bucket/optional-prefix

# Login on Heroku private Docker registry (only once):
$ heroku container:login

# Build and push the image to deploy:
$ heroku container:push web --app your-app-name
```

## Development

### Building the image

```bash
$ docker build -t chialab/print2pdf .
```

### Running the container

1. (Recommended) Create a `.env` file containing your AWS credentials:
    ```bash
    # AWS IAM credentials
    AWS_ACCESS_KEY_ID=AKIA000000000EXAMPLE
    AWS_SECRET_ACCESS_KEY=SECRETKEYFROMAWS

    # Set bucket region if different from us-east-1:
    AWS_DEFAULT_REGION=eu-west-1

    # Pass S3 base URL
    BASE=s3://your-bucket-name/some-optional-prefix
    ```

2. Run Docker container:
    ```bash
    # As a server bound to your local port 3000:
    $ docker run --rm --env-file .env -p 3000:8080 chialab/print2pdf

    # As a CLI command to export a single page:
    $ docker run --rm --env-file .env chialab/print2pdf npm run print -- https://www.chialab.io/ chialabio.pdf
    ```

### Listing available options

```bash
$ docker run --rm chialab/print2pdf npm start -- --help
$ docker run --rm chialab/print2pdf npm run print -- --help
$ docker run --rm chialab/print2pdf npm run serve -- --help
```
