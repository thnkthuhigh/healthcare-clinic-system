# OTP (Quên mật khẩu) — cấu hình gửi email

Hướng dẫn nhanh để bật gửi OTP qua Gmail SMTP.

1. Tạo App Password (Google)
   - Bật 2-step verification cho tài khoản Google của bạn.
   - Tạo App Password (chọn App = Mail, Device = Other) và sao chép mật khẩu 16 ký tự.

2. Thêm cấu hình vào `application.yml` hoặc dùng file mẫu `application-mail.example.yml`.

Ví dụ (thêm vào `src/main/resources/application.yml` hoặc cấu hình môi trường):

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your@gmail.com
    password: <APP_PASSWORD_FROM_GOOGLE>
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

3. (Tuỳ chọn) Nếu bạn chỉ muốn gửi tới 1 địa chỉ test, set biến môi trường `OTP_TEST_RECIPIENT`:

PowerShell:

```powershell
$env:OTP_TEST_RECIPIENT = "youremail@gmail.com"
# restart backend after setting env
```

4. Khởi động lại backend và kiểm tra:

```bash
#maven
mvn -f apps/backend spring-boot:run
```

5. Gửi OTP thử:

```bash
curl -X POST http://localhost:4000/api/v1/auth/forgot/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"0912345678"}'
```

Nếu SMTP đúng cấu hình, email sẽ đến inbox; nếu không, OTP sẽ được in vào logs để dễ test.
