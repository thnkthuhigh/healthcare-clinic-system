# OTP Forgot Password

The forgot-password flow already exists. The backend stores the OTP in
`password_reset_tokens` and then tries to notify the user.

## Twilio SMS

Recommended for local testing:

1. Copy `.env.example` to `.env` in the repo root.
2. Fill these values:

```env
SMS_PROVIDER=twilio
SMS_BRAND_NAME=Healthcare Clinic
SMS_DEFAULT_COUNTRY_CODE=84
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

3. Restart the containers:

```bash
docker compose up -d --build backend web
```

4. Trigger OTP:

```bash
curl -X POST http://localhost:4000/api/v1/auth/forgot/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"0766517276"}'
```

Notes:

- `TWILIO_FROM_NUMBER` must be a Twilio phone number in E.164 format, for example `+15017122661`.
- If the account is still on Twilio trial, the destination number must be verified on Twilio first.
- If SMS config is missing or Twilio fails, the backend falls back to logging the OTP for local debugging.

## Email Fallback

You can still use email for debugging with:

```powershell
$env:OTP_TEST_RECIPIENT = "you@example.com"
```

Then restart the backend.
