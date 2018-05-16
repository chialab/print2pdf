Print HTML to PDF and upload to S3
=================================

This repository contains a Docker image used to print a publicly available
HTML page to PDF and upload the result to an S3 bucket.

Building the image
------------------

```bash
$ docker build -t chialab/print2pdf2s3 .
```

Running the container
---------------------

1. (Recommended) Prepare a `.env` file containing your AWS credentials:
    ```dotenv
    # AWS IAM credentials
    AWS_ACCESS_KEY_ID=AKIA000000000EXAMPLE
    AWS_SECRET_ACCESS_KEY=SECRETKEYFROMAWS

    # Set bucket region if different from us-east-1:
    AWS_DEFAULT_REGION=eu-west-1
    ```
2. Run Docker container:
    ```bash
    $ docker run --rm --env-file .env chialab/print2pdf2s3 node index.js print https://www.chialab.io s3://yourbucketname/your/file.pdf
    ```

Listing available options
-------------------------

```bash
$ docker run --rm chialab/print2pdf2s3 node index.js print --help
```