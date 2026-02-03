# Contributing

## Nguyên tắc chung

- Tập trung phát triển feature mới ở `apps/backend` (Spring Boot). `apps/api` giữ lại để tham chiếu trong giai đoạn migrate.
- Ưu tiên thay đổi nhỏ, dễ review.

## Bộ role trong nhóm (đề xuất)

- 1) Tech lead / Maintainer (bạn):
  - merge vào `main`
  - duyệt PR, giữ kiến trúc và chất lượng
  - chia task, chốt scope
- 2) Backend owner:
  - thiết kế API + migrations (Flyway)
  - đảm bảo không phá schema
- 3) Frontend owner:
  - pages/components, routing
  - gọi API đúng base url + xử lý loading/error
- 4) QA / Tester:
  - test theo checklist (manual)
  - verify `npm run check` trước khi PR được merge
- 5) Docs / PM:
  - viết issue rõ ràng (mục tiêu, AC)
  - cập nhật README/ARCHITECTURE khi thay đổi lớn

Quy tắc: mọi thay đổi (kể cả nhỏ) đều đi qua PR, và có ít nhất 1 người review (ưu tiên Tech lead/Owner).

## Quy trình Git bắt buộc (siêu đơn giản)

- Không ai commit trực tiếp lên `main`.
- Mỗi task = 1 branch + 1 PR (nhỏ, dễ review).

### Flow chuẩn (copy/paste)

```bash
git checkout main
git pull

git checkout -b feat/<ten-ngan>

# code...
npm run check

git status
git add -A
git commit -m "feat: <mo-ta-ngan>"
git push -u origin feat/<ten-ngan>
```

Sau đó mở Pull Request và điền theo template.

### Quy tắc đặt tên branch

- `feat/<...>`: tính năng
- `fix/<...>`: sửa lỗi
- `chore/<...>`: chỉnh cấu hình/tooling
- `docs/<...>`: tài liệu

## Quy tắc dùng AI (bắt buộc)

- Chỉ làm 1 mục tiêu/1 PR. Không “refactor toàn repo”.
- Khi nhờ AI code:
  - nói rõ folder nào được phép sửa (vd: `apps/web/...` hoặc `apps/backend/...`)
  - yêu cầu AI giải thích rủi ro, và liệt kê file đã thay đổi
- Luôn tự kiểm tra:
  - chạy `npm run check`
  - đọc lại diff trước khi commit
- Tuyệt đối không dán secrets/API keys vào prompt.

## Setup

Xem `README.md`.

## Code quality

Trước khi mở PR, bắt buộc chạy:

```bash
npm run check
```

Nếu PR có thay đổi build system hoặc backend Java, nên chạy thêm:

```bash
npm run check:all
```

Pre-commit hook sẽ tự chạy `npm run check`.

## Backend (Spring Boot)

- Source code: `apps/backend/src/main/java/com/clinic/backend`
- Config: `apps/backend/src/main/resources/application.yml`
- Migrations: `apps/backend/src/main/resources/db/migration`

### Thêm migration mới

- Tạo file theo format: `V{N}__short_description.sql`
- Migrations phải:
  - idempotent (an toàn khi re-run ở local)
  - không phá vỡ dữ liệu hiện có

### Run tests (backend)

```bash
npm run test -w apps/backend
```

## Frontend (web)

```bash
npm run dev -w apps/web
```

## Legacy Node API

- Chỉ dùng tham khảo trong giai đoạn migrate.
- Nếu cần chạy song song với Spring Boot backend, đổi port (xem `README.md`).
