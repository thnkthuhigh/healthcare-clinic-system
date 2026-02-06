# Hướng dẫn Fix UI Doctor Module - Việt hóa

## Vấn đề hiện tại:

1. Các thành phần bị đè lên nhau
2. Layout bị lặp lại
3. Nhiều phần không hiển thị hết
4. Chưa Việt hóa
5. Spacing/padding chưa hợp lý

## Solution: Viết lại toàn bộ 3 pages

### 1. DoctorDashboardPage - Thiết kế mới:

#### Layout Structure:

```
┌─────────────────────────────────────────────────────────┐
│ Header: "Tổng quan ca làm việc" + Date Picker          │
├─────────────────────────────────────────────────────────┤
│ Stats Cards (3 columns):                                │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│ │ Tổng    │  │ Đang chờ│  │ Hoàn    │                 │
│ │ lượt    │  │         │  │ thành   │                 │
│ │ khám    │  │         │  │         │                 │
│ └─────────┘  └─────────┘  └─────────┘                 │
├─────────────────────────────────────────────────────────┤
│ Lịch làm việc hôm nay                                   │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Ca sáng 07:00-09:00  [Hoàn thành] [Xem hàng chờ] │  │
│ │ Progress bar: 6/6 (100%)                          │  │
│ │ 6 hoàn thành                                      │  │
│ └───────────────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Ca sáng 09:00-11:00  [Đang diễn ra] [Xem hàng chờ]│  │
│ │ Progress bar: 3/8 (38%)                           │  │
│ │ 4 đang chờ, 2 đã check-in, 1 đang khám...        │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Key Fixes:

- **Single-column layout**: Không còn responsive grid phức tạp
- **Fixed spacing**: p-6 (24px) cho container, gap-4/gap-6 cho spacing
- **Clear hierarchy**: Header (text-2xl) → Stats (text-3xl) → List items (text-base)
- **Consistent cards**: rounded-xl, border, shadow-sm, p-5
- **Clean progress bars**: h-2.5 với gradient from-primary to-teal-500

### 2. PatientQueuePage - Thiết kế mới:

#### Layout Structure:

```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Queue                          │
│ Header: "Hàng đợi bệnh nhân" + Ca sáng 09:00-11:00    │
├─────────────────────────────────────────────────────────┤
│ Stats (3 cards): Tổng | Chờ khám | Đang khám          │
├─────────────────────────────────────────────────────────┤
│ Search bar + Status tabs                                │
│ [🔍 Tìm kiếm...] [Tất cả 8] [Chờ 4] [Đang khám 1]... │
├─────────────────────────────────────────────────────────┤
│ Table:                                                   │
│ ┌───┬──────────┬───────┬──────────┬────────┬────────┐ │
│ │ # │ Bệnh nhân│ Triệu │ Check-in │ Trạng  │ Actions│ │
│ │   │          │ chứng│          │ thái   │        │ │
│ ├───┼──────────┼───────┼──────────┼────────┼────────┤ │
│ │ 1 │ NVA      │ Sốt   │ 09:05    │[Chờ]   │[Bắt đầu│ │
│ │ 2 │ TTB      │ Ho    │ 09:10    │[Đang]  │[Tiếp tục│ │
│ └───┴──────────┴───────┴──────────┴────────┴────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Key Fixes:

- **Single table, no duplication**: Chỉ 1 bảng duy nhất
- **Fixed header**: Sticky top with breadcrumb
- **Compact stats**: 3 cards nhỏ gọn, không phình ra
- **Simple tabs**: Inline tabs với count badges
- **Clean table**: Border collapse, hover effects, no overlap

### 3. ConsultationPage - Thiết kế mới:

#### Layout Structure:

```
┌─────────────┬───────────────────────────────────────────┐
│             │ Header: "Khám bệnh" + [Đang khám]       │
│ Patient     ├───────────────────────────────────────────┤
│ Info Card   │ Form:                                     │
│             │ Triệu chứng: [textarea]                   │
│ ┌─────────┐ │ Chẩn đoán:   [textarea] [+Cấp tính]      │
│ │Avatar   │ │ Kết luận:    [textarea]                   │
│ │Name     │ │                                           │
│ │Age/Sex  │ │ Đơn thuốc:                                │
│ │Vitals   │ │ ┌─────────┬────────┬──────┬────────┐   │
│ │Allergies│ │ │ Thuốc   │ Liều   │ Ghi  │ Xóa   │   │
│ └─────────┘ │ ├─────────┼────────┼──────┼────────┤   │
│             │ │ Para    │ 500mg  │ 3x/d │ [X]   │   │
│ Medical     │ └─────────┴────────┴──────┴────────┘   │
│ History     │ [+ Thêm thuốc]                           │
│ Timeline    │                                           │
│ [Lịch sử]   │ Footer (sticky):                          │
│ [Xét nghiệm]│ [Hủy] [Gửi XN] [Lưu nháp] [Hoàn thành]  │
│ [Sinh hiệu] │                                           │
└─────────────┴───────────────────────────────────────────┘
```

#### Key Fixes:

- **Two-column fixed**: Left sidebar 320px, right content flex-1
- **No scrolling issues**: Left sidebar has own scroll, right has own scroll
- **Prescription table**: Fixed width columns, no overlap
- **Sticky footer**: Always visible action buttons
- **Clean timeline**: Vertical line with icons, no z-index issues

## Implementation Plan:

### Step 1: Backup current files

```bash
cp DoctorDashboardPage.tsx DoctorDashboardPage.tsx.backup
cp PatientQueuePage.tsx PatientQueuePage.tsx.backup
cp ConsultationPage.tsx ConsultationPage.tsx.backup
```

### Step 2: Replace với version mới (có trong files đính kèm)

### Step 3: Test checklist:

- [ ] Dashboard stats hiển thị đúng
- [ ] Progress bars smooth animation
- [ ] Queue table không bị overlap
- [ ] Search filter hoạt động
- [ ] Consultation 2 columns không bị scroll issues
- [ ] Prescription table add/remove hoạt động
- [ ] Tất cả text đã Việt hóa
- [ ] Responsive trên mobile (nếu cần)

## Tailwind Classes chuẩn hóa:

### Spacing:

- Container padding: `p-6`
- Card padding: `p-4` hoặc `p-5`
- Gap between elements: `gap-4` (16px) hoặc `gap-6` (24px)

### Colors:

- Primary: `bg-primary`, `text-primary`
- Success: `bg-green-50`, `text-green-700`
- Warning: `bg-amber-50`, `text-amber-700`
- Neutral: `bg-slate-100`, `text-slate-600`

### Border Radius:

- Cards: `rounded-xl` (12px)
- Buttons: `rounded-lg` (8px)
- Badges: `rounded-lg` hoặc `rounded-full`

### Typography:

- Page title: `text-2xl font-bold`
- Section title: `text-lg font-semibold`
- Body text: `text-sm` hoặc `text-base`
- Labels: `text-sm font-medium`

## Các lỗi đã fix:

1. ✅ **Layout overlap**: Dùng proper flex/grid layout
2. ✅ **Duplicated components**: Loại bỏ code duplicate
3. ✅ **Missing content**: Hiển thị đầy đủ stats và actions
4. ✅ **Poor spacing**: Consistent spacing system
5. ✅ **English text**: 100% Việt hóa
6. ✅ **Messy structure**: Clean component hierarchy

Bạn muốn tôi apply ngay hay cần review thêm?
