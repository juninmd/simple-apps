# Webhook Deployment Guide for Serverless Functions

This guide provides step-by-step instructions for deploying the **CNPJ Validation Bot** as a serverless function on **AWS Lambda** and **Google Cloud Functions (Gen 2)** using webhook mode.

---

## Table of Contents

1. [Overview & Prerequisites](#overview--prerequisites)
2. [Environment Variables](#environment-variables)
3. [AWS Lambda Deployment](#aws-lambda-deployment)
   - [Option A: AWS Console & Lambda Function URL](#option-a-aws-console--lambda-function-url)
   - [Option B: AWS API Gateway Integration](#option-b-aws-api-gateway-integration)
4. [Google Cloud Functions Deployment](#google-cloud-functions-deployment)
   - [Deployment via `gcloud` CLI](#deployment-via-gcloud-cli)
   - [Deployment via GCP Console](#deployment-via-gcp-console)
5. [Setting Up Telegram Webhook](#setting-up-telegram-webhook)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting & Best Practices](#troubleshooting--best-practices)

---

## Overview & Prerequisites

When deploying as a serverless function, the bot operates in **Webhook mode** instead of long-polling. Telegram sends HTTP `POST` requests to your function's endpoint whenever a user interacts with the bot.

### Prerequisites

- A Telegram Bot Token obtained from [@BotFather](https://t.me/BotFather).
- A secret token string generated for request verification (e.g., `openssl rand -hex 32`).
- An active AWS account or Google Cloud Project with billing enabled.
- AWS CLI or Google Cloud SDK (`gcloud` CLI) installed and configured locally (optional, if using CLI).

---

## Environment Variables

Configure the following environment variables in your serverless provider:

| Variable Name | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Token provided by Telegram's @BotFather. |
| `TELEGRAM_SECRET_TOKEN` | Yes | Secret token used to validate incoming HTTP requests from Telegram (`X-Telegram-Bot-Api-Secret-Token`). |
| `LOG_LEVEL` | No | Log verbosity (e.g., `INFO`, `DEBUG`). Default is `INFO`. |

---

## AWS Lambda Deployment

### Option A: AWS Console & Lambda Function URL

1. **Create the Lambda Function:**
   - Open the AWS Lambda Console and click **Create function**.
   - Choose **Author from scratch**.
   - Set Function name: `cnpj-validation-bot`.
   - Select Runtime (e.g., Python 3.11+ or Node.js 18+ depending on runtime implementation).
   - Click **Create function**.

2. **Upload Code Package:**
   - Package application dependencies and code into a `.zip` archive or build container image.
   - Upload the `.zip` file via the Lambda Console under **Code source** -> **Upload from**.

3. **Configure Environment Variables:**
   - Go to **Configuration** -> **Environment variables**.
   - Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_SECRET_TOKEN`.

4. **Enable Function URL:**
   - Go to **Configuration** -> **Function URL** -> **Create function URL**.
   - Auth type: **NONE** (Telegram needs to invoke the public endpoint; security is handled via `X-Telegram-Bot-Api-Secret-Token`).
   - Copy the generated Function URL (e.g., `https://<unique-id>.lambda-url.<region>.on.aws/`).

---

### Option B: AWS API Gateway Integration

1. Create a REST API or HTTP API in Amazon API Gateway.
2. Create a `/webhook` resource with a `POST` method pointing to your Lambda function.
3. Deploy the API to a stage (e.g., `prod`).
4. Note the invoke URL (e.g., `https://<api-id>.execute-api.<region>.amazonaws.com/prod/webhook`).

---

## Google Cloud Functions Deployment

### Deployment via `gcloud` CLI

1. **Set your GCP project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Deploy Gen 2 Function:**
   ```bash
   gcloud functions deploy cnpj-validation-bot \
     --gen2 \
     --runtime=python311 \
     --region=us-central1 \
     --source=. \
     --entry-point=webhook_handler \
     --trigger-http \
     --allow-unauthenticated \
     --set-env-vars TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN",TELEGRAM_SECRET_TOKEN="YOUR_SECRET_TOKEN"
   ```

3. Note the HTTPS trigger URL output upon successful deployment.

---

### Deployment via GCP Console

1. Navigate to **Cloud Functions** in the GCP Console and click **Create Function**.
2. Select **Cloud Functions (2nd gen)**.
3. Set Function name to `cnpj-validation-bot` and select your region.
4. Set Trigger type to **HTTPS** and check **Allow unauthenticated invocations**.
5. Under **Runtime environment variables**, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_SECRET_TOKEN`.
6. Click **Next**, choose runtime, set entry point, and click **Deploy**.

---

## Setting Up Telegram Webhook

Once your serverless function is deployed and you have its HTTPS URL, register the webhook with Telegram.

### Register Webhook via `curl`

Execute the following command in your terminal:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "YOUR_SERVERLESS_FUNCTION_URL",
    "secret_token": "YOUR_TELEGRAM_SECRET_TOKEN"
  }'
```

### Verify Webhook Status

Verify that Telegram successfully registered the webhook:

```bash
curl -s "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/getWebhookInfo" | jq .
```

Confirm that `has_custom_certificate` and `pending_update_count` parameters match expected values and `last_error_message` is null.

---

## Monitoring & Logging

### AWS Lambda
- Access logs via **Amazon CloudWatch Logs** under `/aws/lambda/cnpj-validation-bot`.
- Set up CloudWatch Alarms for error rates or high latency.

### Google Cloud Functions
- Access logs via **GCP Cloud Logging** (Log Explorer).
- View execution metrics, latency, and invocation counts under Cloud Functions dashboard.

---

## Troubleshooting & Best Practices

1. **Request Timeout:**
   - Serverless functions should respond quickly (within 3 seconds) to Telegram webhook requests.
   - For long-running CNPJ lookups, acknowledge the webhook immediately or ensure execution completes within Telegram's timeout limits.

2. **Security & Request Verification:**
   - Always validate the `X-Telegram-Bot-Api-Secret-Token` header in incoming requests to ensure requests originate from Telegram.

3. **Cold Starts:**
   - If initial requests experience higher latency, consider setting provisioned concurrency (AWS) or minimum instances (GCP) if high responsiveness is required.
