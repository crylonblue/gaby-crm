# S3/Cloudflare R2 Troubleshooting Guide

## AccessDenied Error

If you're getting an `AccessDenied` error when uploading invoices, follow these steps:

### 1. Verify Cloudflare R2 API Token Permissions

1. Go to Cloudflare Dashboard → R2 → Your bucket (`gaby`)
2. Click on "Manage R2 API Tokens"
3. Find your API token (the one matching your `S3_ACCESS_KEY`)
4. Verify it has these permissions:
   - ✅ **Object Read**
   - ✅ **Object Write**
   - ✅ Access to bucket: `gaby`

### 2. Check Your Environment Variables

Make sure your `.env` file has:
```env
S3_BUCKET_NAME=gaby
S3_ACCESS_KEY=your_access_key_here
S3_SECRET_KEY=your_secret_key_here
S3_ENDPOINT=https://97ffb7df18e8eb1b21bde1082ab21ee6.eu.r2.cloudflarestorage.com
S3_REGION=auto
```

### 3. Verify Bucket Name

- The bucket name must match exactly (case-sensitive)
- Check in Cloudflare R2 dashboard that the bucket `gaby` exists

### 4. Test S3 Connection (Optional)

You can temporarily disable S3 uploads for testing by adding to your `.env`:
```env
SKIP_S3_UPLOAD=true
```

This will allow invoices to be created without PDF uploads.

### 5. Create a New API Token (If Needed)

If your current token doesn't work:

1. Cloudflare Dashboard → R2 → Your bucket
2. Settings → API Tokens
3. Create API Token
4. Permissions:
   - Object Read: ✅
   - Object Write: ✅
   - Bucket: Select `gaby`
5. Copy the Access Key ID and Secret Access Key
6. Update your `.env` file

### Common Issues

- **Wrong bucket name**: Bucket name is case-sensitive
- **Token expired**: Create a new API token
- **Wrong permissions**: Token needs Object Write permission
- **Wrong endpoint**: Should be your R2 S3 API endpoint (not the public URL)

### Still Having Issues?

The invoice will still be created in the database even if S3 upload fails. Check the server logs for detailed error information.
