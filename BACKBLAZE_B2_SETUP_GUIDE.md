# Backblaze B2 Setup Guide for Faculty Portal

This guide shows how to configure Backblaze B2 as an S3-compatible file store for the Faculty Portal website and wire it into your existing backend which already supports S3-compatible endpoints.

Overview
- We'll use Backblaze B2's S3-compatible API so the existing `@aws-sdk/client-s3` usage in `backend/routes/upload.js` works with minimal or no code changes.
- You will create a bucket, generate application (S3) credentials, and set environment variables on Render.

Prerequisites
- A Backblaze account (create at https://www.backblaze.com/)
- Access to your Render dashboard to set environment variables and redeploy

Steps

1) Create a Backblaze account
- Go to https://www.backblaze.com/ and sign up.
- Verify email and complete any required billing setup.

2) Create a Bucket
- In the Backblaze web console, go to **Buckets** (under B2 Cloud Storage).
- Click **Create a Bucket**.
- Choose a unique bucket name (e.g. `facultyportal-uploads`).
- Choose **Private** or **Public** depending on how you'll serve files:
  - Private: files require your backend to generate signed URLs or stream files.
  - Public: files are directly accessible via URL (easier for static assets).
- Click **Create Bucket** and note the bucket name.

3) Create Application Keys (S3-compatible)
- In the Backblaze console, go to **App Keys** (or **Buckets** → **App Keys**).
- Click **Add a New Application Key**.
- For easiest integration with the AWS SDK, create an S3-compatible key:
  - Give it a friendly name like `facultyportal-app-key`.
  - (Important) If offered, select the option to create an **S3 Compatible** key or to restrict to a specific bucket. If you can restrict, choose the bucket you created and grant **read** and **write** permissions.
- Create the key and copy the generated credentials:
  - `Key ID` (this will act like `AWS_ACCESS_KEY_ID`)
  - `Application Key` (this will act like `AWS_SECRET_ACCESS_KEY`)
- Download or securely store them — you will not be able to view the secret again.

Notes about credentials
- Backblaze provides both native B2 keys and S3-compatible credentials. For the `@aws-sdk/client-s3` client, use the S3-compatible credentials and endpoint.

4) Determine the S3-compatible endpoint and region
- Backblaze S3-compatible endpoints follow the pattern: `https://s3.<region>.backblazeb2.com`.
- Common region: `us-west-002` (the region id depends on your account and selection).
- Example endpoint: `https://s3.us-west-002.backblazeb2.com` and region `us-west-002`.

5) Add environment variables on Render
- Open https://render.com and sign in.
- Open your backend service (`facultyportalwebsite`).
- Go to **Settings → Environment** and add the following environment variables (replace placeholders):

```
S3_BUCKET_NAME=facultyportal-uploads
AWS_ACCESS_KEY_ID=YOUR_BACKBLAZE_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_BACKBLAZE_APPLICATION_KEY
AWS_REGION=us-west-002
S3_ENDPOINT=https://s3.us-west-002.backblazeb2.com
```

- Save changes and let Render redeploy your service.

6) Optional: Configure CORS / Public URLs
- If you create a **public** bucket, you can serve files directly at URLs like `https://<bucket>.s3.<region>.backblazeb2.com/<object-key>` (S3-compatible URL).
- If you keep the bucket private, your backend (using the AWS SDK) should generate signed URLs or stream files on request.

7) Test uploading
- From your local machine, test the upload endpoint (example using your existing deployed API):

```powershell
curl.exe -X POST -F "image=@C:\Users\user\Downloads\joy.jpg" -F "folder=uploads" "https://facultyportalwebsite-3.onrender.com/api/upload"
```

- Expected JSON response when S3-compatible upload succeeds:

```json
{
  "url": "https://facultyportal-uploads.s3.us-west-002.backblazeb2.com/uploads/1782857381055-joy.jpg",
  "storage": "s3"
}
```

(The exact URL pattern depends on how your S3 client is configured. If your backend constructs the public URL differently, check Render logs or code to confirm.)

8) Troubleshooting
- `AccessDenied` or `InvalidAccessKeyId`: verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` were copied correctly and the key has permissions for the bucket.
- `BucketNotFound`: confirm `S3_BUCKET_NAME` exactly matches the bucket name in Backblaze and that the key has access.
- Network / TLS errors: ensure `S3_ENDPOINT` is correct and uses `https://`.
- Still falling back to `local-fallback` in responses: check Render logs for S3 client errors, and confirm env vars are present in the running deploy.

Security best practices
- Restrict application keys to only the necessary bucket whenever possible.
- Don't commit keys to git; use Render environment variables.
- Rotate application keys periodically.

Notes for the `backend/routes/upload.js` in this repo
- The project already supports S3 with optional `S3_ENDPOINT`. No code changes should be required if you set the environment variables above.
- If you see different object URLs in responses, inspect the upload code to confirm how URLs are built (the AWS SDK `getSignedUrl` or manual URL composition).

Would you like me to:
- (A) Add exact Render environment variable values for you (paste credentials here), or
- (B) Walk you through creating the bucket and app key step-by-step while you do it, or
- (C) Configure an S3-compatible test using a temporary Backblaze key I can create for a live test? (I will not store any secrets.)

