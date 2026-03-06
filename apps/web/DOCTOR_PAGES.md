# Doctor Module - Pages Overview

## 📄 Available Pages

### ✅ Implemented Pages

#### 1. DoctorDashboardPage

**Path**: `/doctor/dashboard`

**Features**:

- Display shift statistics (today's appointments, waiting room, completed)
- List all active shifts with progress bars
- Show shift details (time, slots, status)
- Navigate to queue management per shift

**Key Components**:

- Stats cards with real numbers
- Shift cards with click-to-navigate
- Real-time status badges

**Navigation**:

```tsx
const { goToDashboard } = useDoctorNavigation();
goToDashboard();
```

---

#### 2. PatientQueuePage

**Path**: `/doctor/queue/:shiftId?`

**Features**:

- Display patient list for selected shift
- Smart priority queue ordering (Logic B)
- Status filter (All, Waiting, In Consultation, Completed, etc.)
- Search by patient name or ID
- Real-time status updates with animation
- Start/Continue consultation actions

**URL Params**:

- `shiftId` (optional): Filter by specific shift

**Key Components**:

- Filter tabs
- Search bar
- Patient table with priority sorting
- Action buttons

**Navigation**:

```tsx
const { goToQueue } = useDoctorNavigation();
goToQueue(shiftId); // With shiftId
goToQueue(); // Without shiftId
```

---

#### 3. ConsultationPage

**Path**: `/doctor/consultation/:bookingId`

**Features**:

- Patient info card (demographics, vitals, allergies)
- Medical history timeline (History/Lab/Vitals tabs)
- Examination form (symptoms, diagnosis, conclusion)
- Prescription builder (add/remove medications)
- Drug stock validation
- Actions: Cancel, Send to Lab, Save Draft, Save & Complete

**URL Params**:

- `bookingId` (required): The booking to consult

**Key Components**:

- Patient info card
- History timeline with tabs
- Examination form
- Prescription builder with dynamic rows
- Action buttons

**Navigation**:

```tsx
const { goToConsultation } = useDoctorNavigation();
goToConsultation(bookingId, { shiftId }); // with state
```

---

### 🚧 Placeholder Pages (Coming Soon)

#### 4. DoctorSchedulePage

**Path**: `/doctor/schedule`

**Planned Features**:

- View monthly/weekly calendar
- Create new shifts
- Edit shift configuration
- Set availability
- Block dates
- Recurring shifts setup

**Status**: Placeholder with "Coming Soon" notice

---

#### 5. DoctorPatientsPage

**Path**: `/doctor/patients`

**Planned Features**:

- Search patient database
- View patient profiles
- Browse medical history
- View all past consultations
- Patient statistics
- Export patient reports

**Status**: Placeholder with "Coming Soon" notice

---

#### 6. DoctorSettingsPage

**Path**: `/doctor/settings`

**Planned Features**:

- Update profile information
- Change password
- Notification preferences
- Display preferences (theme, language)
- Signature setup
- Connected devices

**Status**: Placeholder with settings categories preview

---

## 🔄 Page Navigation Flow

```
DoctorDashboardPage (/)
  ├─ Click shift card → PatientQueuePage (/queue/:shiftId)
  │   └─ Click "Start Consultation" → ConsultationPage (/consultation/:bookingId)
  │       ├─ Save & Complete → Back to Queue
  │       └─ Cancel → Back to Queue
  │
  ├─ Sidebar: Dashboard → DoctorDashboardPage
  ├─ Sidebar: Queue → PatientQueuePage
  ├─ Sidebar: Schedule → DoctorSchedulePage (Coming soon)
  ├─ Sidebar: Patients → DoctorPatientsPage (Coming soon)
  └─ Sidebar: Settings → DoctorSettingsPage (Coming soon)
```
