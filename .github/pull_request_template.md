# Mục tiêu

<!-- Mô tả ngắn gọn PR này làm gì và vì sao cần làm -->

## Thay đổi chính

-

## Cách test (bắt buộc)

```bash
npm run check
npm run dev
```

Nếu PR liên quan database/backend:

```bash
npm run db:up
npm run dev:backend
```

## Checklist (bắt buộc)

- [ ] PR nhỏ, tập trung 1 mục tiêu
- [ ] Đã chạy `npm run check`
- [ ] Không commit secrets (API keys, passwords, tokens)
- [ ] Nếu thay đổi DB: có migration Flyway mới trong `apps/backend/src/main/resources/db/migration`
- [ ] Nếu thay đổi API/UI: đã test manual tối thiểu
- [ ] Nếu thay đổi hành vi hệ thống: đã cập nhật `README.md` hoặc `ARCHITECTURE.md`

## AI usage (nếu có)

- Công cụ AI:
- Prompt/tóm tắt yêu cầu đã đưa AI:
- Files thay đổi chính:
- Rủi ro/giả định:
