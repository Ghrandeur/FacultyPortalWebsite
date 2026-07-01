# AWS S3 Setup Guide for Faculty Portal

Complete step-by-step instructions to set up AWS S3 for file uploads.

---

## Step 1: Create an AWS Account

### 1.1 Go to AWS Sign-Up
- Open your browser and navigate to: https://aws.amazon.com/
- Click the **"Create an AWS Account"** button (top-right)

### 1.2 Enter Your Email and Account Name
- **Email address**: Enter your email (use one you have access to)
- **AWS account name**: Enter a name for your account (e.g., "facultyportal")
- Click **"Verify email address"**

### 1.3 Verify Your Email
- Check your email inbox for a verification code from AWS
- Enter the code in the prompt
- Click **"Verify"**

### 1.4 Create Your Password
- Enter a strong password
- Confirm the password
- Click **"Continue"**

### 1.5 Add Contact Information
- **Full name**: Your full name
- **Phone number**: Your phone number
- **Country**: Select your country
- Check the **AWS Customer Agreement** checkbox
- Click **"Continue"**

### 1.6 Add Billing Information
- Enter your **credit card information**
- Enter your **billing address**
- Click **"Continue"**
- AWS will charge $0 for free tier (they verify your card with a small charge)

### 1.7 Verify Your Phone Number
- AWS will send you a verification code via SMS or call
- Enter the code
- Click **"Verify"**

### 1.8 Select Support Plan
- Choose **"Basic Support (Free)"**
- Click **"Continue"**

### 1.9 Confirmation
- You'll see "Congratulations! You have successfully created your AWS account."
- Click **"Go to the AWS Management Console"** or wait for redirect

---

## Step 2: Create an S3 Bucket

### 2.1 Open the S3 Dashboard
- In the AWS Management Console search bar at the top, search for **"S3"**
- Click **"S3"** from the results
- This opens the S3 dashboard

### 2.2 Create a New Bucket
- Click the **"Create bucket"** button (orange button, right side)

### 2.3 Configure Bucket Details
- **Bucket name**: Enter a unique name (e.g., `facultyportal-uploads-[yourname]`)
  - Names must be globally unique across all AWS accounts
  - Use only lowercase letters, numbers, and hyphens
  - Example: `facultyportal-uploads-john123`
- **Region**: Select the region closest to you (e.g., **us-east-1** for US East)
- Leave other settings as default for now
- Click **"Create bucket"**

### 2.4 Wait for Bucket Creation
- You'll see "Bucket created successfully" message
- Your bucket is now ready

### 2.5 Note Your Bucket Name
- **Write down your bucket name** (you'll need it for environment variables)
- Example: `facultyportal-uploads-john123`

---

## Step 3: Create an IAM User with S3 Permissions

### 3.1 Open IAM Dashboard
- In the AWS Management Console search bar, search for **"IAM"**
- Click **"IAM"** from the results
- This opens the IAM (Identity and Access Management) dashboard

### 3.2 Navigate to Users
- In the left sidebar, click **"Users"** (under "Access management")

### 3.3 Create a New User
- Click **"Create user"** button (top-right)

### 3.4 Enter User Details
- **User name**: Enter a name (e.g., `facultyportal-app-user`)
- Leave other options as default
- Click **"Next"**

### 3.5 Set Permissions
- Select **"Attach policies directly"** (this option should be selected)
- In the "Permissions policies" section, search for **"S3"**
- Find and check **"AmazonS3FullAccess"**
  - This gives the user full S3 access (appropriate for file uploads)
- Click **"Next"**

### 3.6 Review and Create
- Review the settings
- Click **"Create user"**
- You'll see "User created successfully"

---

## Step 4: Create Access Keys

### 4.1 Open the User Details
- Click on the user you just created (e.g., `facultyportal-app-user`)
- This opens the user's detail page

### 4.2 Navigate to Security Credentials
- Click the **"Security credentials"** tab

### 4.3 Create Access Key
- Scroll down to **"Access keys"** section
- Click **"Create access key"**

### 4.4 Select Use Case
- Select **"Application running outside AWS"** (or similar option)
- Check the acknowledgment checkbox if present
- Click **"Next"** or **"Create access key"**

### 4.5 View and Save Access Key
You'll see a screen showing:
- **Access key ID** (looks like: `AKIAIOSFODNN7EXAMPLE`)
- **Secret access key** (looks like: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

### 4.6 Copy and Save Credentials
- **IMPORTANT**: Click **"Download .csv file"** to download your credentials
- Or manually copy and save these values somewhere secure:
  - Access key ID
  - Secret access key
- **Never share these credentials or commit them to git**

### 4.7 Confirm Creation
- Click **"Done"** or **"Close"**

---

## Step 5: Summary of Values Needed

After completing all steps, you should have:

1. **S3 Bucket Name** (e.g., `facultyportal-uploads-john123`)
2. **AWS Access Key ID** (e.g., `AKIAIOSFODNN7EXAMPLE`)
3. **AWS Secret Access Key** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
4. **AWS Region** (e.g., `us-east-1`)

---

## Step 6: Set Environment Variables on Render

Once you have the above values, go to your Render backend service:

1. Open https://render.com and login
2. Find your `facultyportalwebsite` service
3. Go to **Settings** → **Environment**
4. Add these variables:

```
S3_BUCKET_NAME=facultyportal-uploads-john123
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
```

5. Click **"Save Changes"**
6. Render will automatically redeploy your service

---

## Step 7: Test S3 Upload

Once deployed, test your S3 upload:

```powershell
curl.exe -X POST -F "image=@C:\Users\user\Downloads\joy.jpg" -F "folder=uploads" "https://facultyportalwebsite-3.onrender.com/api/upload"
```

Expected response:
```json
{
  "url": "https://facultyportal-uploads-john123.s3.amazonaws.com/uploads/1782857381055-joy.jpg",
  "storage": "s3"
}
```

If you see `"storage": "s3"`, your S3 setup is working! ✅

---

## Troubleshooting

**Q: Bucket name not globally unique**
- A: Bucket names must be unique across all AWS accounts. Add a random string or timestamp to make it unique.

**Q: Access denied errors**
- A: Make sure your IAM user has `AmazonS3FullAccess` policy attached. Check in IAM → Users → Your user → Permissions.

**Q: Still getting "local-fallback" in response**
- A: Check Render logs for S3 errors. Make sure all 3 env vars (bucket name, access key, secret key) are set correctly with no typos.

**Q: Upload times out**
- A: Large files may take longer. Increase timeout on frontend or test with smaller files first.

---

## Security Best Practices

1. **Never commit credentials to git** - they're already in environment variables on Render, not in code
2. **Rotate access keys periodically** - AWS recommends every 90 days
3. **Use least privilege** - the S3FullAccess policy is broad; you can restrict to specific bucket later
4. **Monitor S3 usage** - check AWS billing to avoid unexpected charges (though file uploads are typically low-cost)

