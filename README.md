# Print to PDF

A REST API to generate PDFs from Web pages.

Just make your HTML document available at a public URL, and generate a PDF out
of it adjusting options like paper or margins, without installing any paid
library or software.

Resulting PDFs are uploaded to an S3 bucket where they can be downloaded.

## As a Serverless application

You can deploy this repository as a serverless application using an AWS CloudFormation
Template to create an AWS API Gateway that invokes Lambda functions to serve requests.

> [**Launch this stack on AWS**](https://console.aws.amazon.com/cloudformation/home#/stacks/new?stackName=MathApi&templateURL=https://chialab-cloudformation-templates.s3-eu-west-1.amazonaws.com/chialab/print2pdf/master/template.yml)

## Endpoints

### `POST /print`

> Export a publicly available HTML page as a PDF.

**Headers**:

 * `Content-Type: application/json`

**Body parameters**:

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

**Examples**:

```http
POST /print HTTP/1.1
Content-Type: application/json

{
    "url": "http://example.com/my-page/",
    "file_name": "my-friendly-file-name.pdf"
}
```

```http
POST /print HTTP/1.1
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

**Responses**:

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

> Check application status.

**Responses**:

 * **200 OK**

    ```http
    HTTP/1.1 200 OK
    Content-Type: application/json

    {
        "ok": true
    }
    ```

## Development

_All the following instructions assume you have at least [NodeJS](https://nodejs.org/) and [Yarn](https://yarnpkg.com/) installed._

**Start a simulated AWS API Gateway** (_provided you have AWS SAM Local and Docker installed_):
> `yarn run api-gateway`

**Validate CloudFormation template** (_provided you have AWS CLI installed_)
> `make validate`

**Package CloudFormation template** (_provided you have AWS CLI and Docker installed_)
> `make layers` (_this is needed only the first time, then when updating Puppeteer version_)
> `make package`

**Deploy CloudFormation template** (_provided you have AWS CLI and Docker installed_)
> `make deploy`
> `make deploy ENVIRONMENT=Production`
