# Checklist Khắc Phục Lỗi - Healthcare Clinic System

## 🔴 Vấn Đề Hiện Tại

Lỗi: `'mvn' is not recognized as an internal or external command`

**Nguyên nhân**: Maven chưa được cài đặt hoặc chưa được thêm vào PATH của Windows.

---

## ✅ Checklist Cần Làm

### 1. Kiểm Tra Java

- [ ] Mở PowerShell/Command Prompt
- [ ] Chạy lệnh: `java -version`
- [ ] Kiểm tra phiên bản Java >= 17
  - ✅ Nếu có Java 17+: Chuyển sang bước 2
  - ❌ Nếu chưa có hoặc phiên bản < 17: Cài đặt Java 17

**Cách cài Java 17:**

1. Tải về từ: https://adoptium.net/temurin/releases/?version=17
2. Chọn Windows x64 MSI installer
3. Cài đặt và chọn "Add to PATH" trong quá trình cài
4. Khởi động lại PowerShell và kiểm tra lại `java -version`

---

### 2. Cài Đặt Maven

- [ ] Tải Maven từ: https://maven.apache.org/download.cgi
- [ ] Chọn file `apache-maven-3.9.x-bin.zip` (binary zip archive)
- [ ] Giải nén vào thư mục, ví dụ: `C:\Program Files\Apache\maven`

---

### 3. Cấu Hình Biến Môi Trường (Environment Variables)

#### 3.1. Thêm MAVEN_HOME

- [ ] Nhấn `Win + X` → chọn "System"
- [ ] Chọn "Advanced system settings" → "Environment Variables"
- [ ] Trong "System variables", nhấn "New"
- [ ] Tạo biến mới:
  - **Variable name**: `MAVEN_HOME`
  - **Variable value**: `C:\Program Files\Apache\maven` (đường dẫn thư mục Maven của bạn)

#### 3.2. Thêm Maven vào PATH

- [ ] Trong "System variables", tìm biến `Path`
- [ ] Nhấn "Edit"
- [ ] Nhấn "New" và thêm: `%MAVEN_HOME%\bin`
- [ ] Nhấn "OK" để lưu tất cả

---

### 4. Kiểm Tra Maven

- [ ] **Đóng tất cả cửa sổ PowerShell/CMD đang mở**
- [ ] Mở PowerShell mới
- [ ] Chạy lệnh: `mvn -version`
- [ ] Kiểm tra kết quả hiển thị thông tin Maven và Java

**Kết quả mong đợi:**

```
Apache Maven 3.9.x
Maven home: C:\Program Files\Apache\maven
Java version: 17.x.x
```

---

### 5. Kiểm Tra Docker (cho PostgreSQL)

- [ ] Chạy lệnh: `docker --version`
- [ ] Nếu chưa có Docker:
  - Tải Docker Desktop: https://www.docker.com/products/docker-desktop/
  - Cài đặt và khởi động Docker Desktop
  - Đảm bảo Docker đang chạy (icon Docker ở system tray)

---

### 6. Cài Dependencies của Project

- [ ] Mở PowerShell tại thư mục project: `E:\DEVcodon\Projects\healthcare-clinic-system`
- [ ] Chạy lệnh: `npm install`
- [ ] Đợi quá trình cài đặt hoàn tất

---

### 7. Khởi Động Database

- [ ] Chạy lệnh: `npm run db:up`
- [ ] Kiểm tra Docker Desktop để xác nhận container PostgreSQL đang chạy
- [ ] Hoặc chạy: `docker ps` để xem danh sách container

---

### 8. Chạy Ứng Dụng

#### Option 1: Chạy cả Backend và Web cùng lúc

- [ ] Chạy lệnh: `npm run dev`
- [ ] Kiểm tra:
  - Web: http://localhost:3000
  - Backend health: http://localhost:4000/api/v1/health
  - Swagger UI: http://localhost:4000/swagger-ui

#### Option 2: Chạy riêng từng phần (để debug dễ hơn)

- [ ] Terminal 1 - Backend: `npm run dev:backend`
- [ ] Terminal 2 - Web: `npm run dev:web`

---

## 🔧 Troubleshooting

### Nếu vẫn lỗi "mvn not recognized" sau khi cài Maven:

1. **Kiểm tra PATH:**

   ```powershell
   $env:Path -split ';' | Select-String maven
   ```

   Phải thấy đường dẫn đến Maven\bin

2. **Khởi động lại máy tính** (đôi khi cần thiết để Windows nhận biến môi trường mới)

3. **Kiểm tra MAVEN_HOME:**
   ```powershell
   echo $env:MAVEN_HOME
   ```
   Phải hiển thị đường dẫn đến thư mục Maven

### Nếu lỗi kết nối Database:

- [ ] Kiểm tra Docker Desktop đang chạy
- [ ] Chạy: `docker compose logs postgres` để xem logs
- [ ] Kiểm tra file `.env` trong `apps/backend/` có đúng thông tin kết nối không

### Nếu port 4000 đã được sử dụng:

- [ ] Tìm process đang dùng port: `netstat -ano | findstr :4000`
- [ ] Hoặc đổi port trong file `.env` của backend

---

## 📝 Tóm Tắt Các Lệnh Cần Chạy

```powershell
# 1. Kiểm tra Java
java -version

# 2. Kiểm tra Maven (sau khi cài)
mvn -version

# 3. Kiểm tra Docker
docker --version

# 4. Cài dependencies
npm install

# 5. Khởi động database
npm run db:up

# 6. Chạy ứng dụng
npm run dev
```

---

## ✨ Sau Khi Hoàn Thành

Khi tất cả checklist đã xong, bạn sẽ có:

- ✅ Java 17 đã cài và hoạt động
- ✅ Maven đã cài và có trong PATH
- ✅ Docker Desktop đang chạy
- ✅ PostgreSQL container đang chạy
- ✅ Backend (Spring Boot) chạy trên port 4000
- ✅ Frontend (React + Vite) chạy trên port 3000

---

## 📞 Nếu Cần Hỗ Trợ

Sau khi làm theo checklist, nếu vẫn gặp lỗi, hãy cung cấp:

1. Kết quả của `java -version`
2. Kết quả của `mvn -version`
3. Kết quả của `docker --version`
4. Screenshot lỗi cụ thể khi chạy `npm run dev`
