# Navigation Hooks & Components

## 📚 Usage Guide

### Navigation Hooks

#### `useDoctorNavigation()`

Custom hook for navigating within Doctor module.

**Example:**

```tsx
import { useDoctorNavigation } from '../../../hooks/useNavigation';

function MyDoctorComponent() {
  const { goToDashboard, goToQueue, goToConsultation, goBack } = useDoctorNavigation();

  return (
    <div>
      <button onClick={goToDashboard}>Go to Dashboard</button>
      <button onClick={() => goToQueue(123)}>Go to Queue #123</button>
      <button onClick={() => goToConsultation(456)}>Go to Consultation #456</button>
      <button onClick={goBack}>Go Back</button>
    </div>
  );
}
```

**Available methods:**

- `goToDashboard()` - Navigate to `/doctor/dashboard`
- `goToQueue(shiftId?)` - Navigate to `/doctor/queue/:shiftId`
- `goToConsultation(bookingId, state?)` - Navigate to `/doctor/consultation/:bookingId`
- `goToSchedule()` - Navigate to `/doctor/schedule`
- `goToPatients()` - Navigate to `/doctor/patients`
- `goToSettings()` - Navigate to `/doctor/settings`
- `goBack()` - Go back to previous page
- `isActive(path)` - Check if path is active
- `currentPath` - Current pathname
- `state` - Current location state

#### `useAppNavigation()`

Hook for general app navigation across all modules.

**Example:**

```tsx
import { useAppNavigation } from '../../../hooks/useNavigation';

function MyComponent() {
  const { goToHome, goToLogin, goToDoctorPortal } = useAppNavigation();

  return (
    <div>
      <button onClick={goToHome}>Home</button>
      <button onClick={goToLogin}>Login</button>
      <button onClick={goToDoctorPortal}>Doctor Portal</button>
    </div>
  );
}
```

**Available methods:**

- `goToHome()` - Navigate to `/` (trang chủ công khai)
- `goToPatientHome()` - Navigate to `/mainpage` (trang chủ sau đăng nhập)
- `goToLogin()` - Navigate to `/login`
- `goToDoctorPortal()` - Navigate to `/doctor`
- `goToReceptionistPortal()` - Navigate to `/receptionist`
- `goToPharmacistPortal()` - Navigate to `/pharmacist`
- `goToAdminPortal()` - Navigate to `/admin`

---

### Navigation Components

#### `<NavLinkButton />`

Button-styled navigation link with icon support.

**Props:**

- `to: string` (required) - Target path
- `label: string` (required) - Button text
- `icon?: string` - Material icon name
- `variant?: 'primary' | 'secondary' | 'outline' | 'ghost'` - Button style
- `size?: 'sm' | 'md' | 'lg'` - Button size

**Example:**

```tsx
import { NavLinkButton } from '../../../components/Navigation';

function MyComponent() {
  return (
    <div>
      <NavLinkButton
        to="/doctor/dashboard"
        icon="grid_view"
        label="Go to Dashboard"
        variant="primary"
        size="md"
      />

      <NavLinkButton to="/doctor/queue" label="View Queue" variant="outline" />
    </div>
  );
}
```

#### `<BackButton />`

Back button with customizable label.

**Props:**

- `label?: string` - Button text (default: "Back")
- `onClick?: () => void` - Click handler (default: navigate(-1))

**Example:**

```tsx
import { BackButton } from '../../../components/Navigation';
import { useDoctorNavigation } from '../../../hooks/useNavigation';

function MyComponent() {
  const { goToQueue } = useDoctorNavigation();

  return (
    <div>
      {/* Default back navigation */}
      <BackButton />

      {/* Custom label */}
      <BackButton label="Return to Queue" />

      {/* Custom onClick */}
      <BackButton label="Back to Queue" onClick={() => goToQueue()} />
    </div>
  );
}
```

---

## 🎯 Common Use Cases

### 1. Navigate from Dashboard to Queue

```tsx
import { useDoctorNavigation } from '../../../hooks/useNavigation';

function ShiftCard({ shift }) {
  const { goToQueue } = useDoctorNavigation();

  return (
    <div onClick={() => goToQueue(shift.id)}>
      <h3>{shift.period}</h3>
      <p>Click to view queue</p>
    </div>
  );
}
```

### 2. Navigate from Queue to Consultation

```tsx
import { useDoctorNavigation } from '../../../hooks/useNavigation';

function PatientRow({ booking }) {
  const { goToConsultation } = useDoctorNavigation();

  return (
    <tr>
      <td>{booking.patientName}</td>
      <td>
        <button onClick={() => goToConsultation(booking.id)}>Start Consultation</button>
      </td>
    </tr>
  );
}
```

### 3. Navigate Back with State

```tsx
import { useDoctorNavigation } from '../../../hooks/useNavigation';

function ConsultationPage() {
  const { goToQueue, state } = useDoctorNavigation();
  const fromShiftId = state?.shiftId;

  const handleComplete = async () => {
    await saveConsultation();
    // Go back to the queue we came from
    goToQueue(fromShiftId);
  };

  return (
    <div>
      {/* consultation form */}
      <button onClick={handleComplete}>Complete</button>
    </div>
  );
}
```

### 4. Conditional Navigation

```tsx
import { useDoctorNavigation } from '../../../hooks/useNavigation';

function ActionButton({ booking }) {
  const { goToConsultation, isActive } = useDoctorNavigation();

  if (booking.status === 'COMPLETED') {
    return <span>Completed</span>;
  }

  if (isActive(`/doctor/consultation/${booking.id}`)) {
    return <span>Current</span>;
  }

  return (
    <button onClick={() => goToConsultation(booking.id)}>
      {booking.status === 'IN_CONSULTATION' ? 'Continue' : 'Start'}
    </button>
  );
}
```

### 5. Using NavLinkButton in Cards

```tsx
import { NavLinkButton } from '../../../components/Navigation';

function DashboardStats() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="card">
        <h3>Waiting Room</h3>
        <p className="text-3xl">8</p>
        <NavLinkButton
          to="/doctor/queue"
          icon="list_alt"
          label="View Queue"
          variant="outline"
          size="sm"
        />
      </div>
    </div>
  );
}
```

---

## 🔄 Navigation Patterns

### Pattern 1: Dashboard → Queue → Consultation

```tsx
// DashboardPage
function DashboardPage() {
  const { goToQueue } = useDoctorNavigation();

  return <ShiftCard onClick={() => goToQueue(shiftId)} />;
}

// QueuePage
function QueuePage() {
  const { goToConsultation } = useDoctorNavigation();

  return <PatientRow onClick={() => goToConsultation(bookingId, { shiftId })} />;
}

// ConsultationPage
function ConsultationPage() {
  const { goToQueue, state } = useDoctorNavigation();

  const handleComplete = () => {
    // Go back to queue
    goToQueue(state?.shiftId);
  };
}
```

### Pattern 2: Direct Access via URL

```tsx
// User can access directly:
// http://localhost:3000/doctor/consultation/123

function ConsultationPage() {
  const { bookingId } = useParams();
  const { goToQueue } = useDoctorNavigation();

  // Load booking data
  // If booking not found or no permission, redirect
  if (!booking) {
    goToQueue(); // Fallback to queue
  }
}
```

### Pattern 3: Protected Navigation

```tsx
import { useDoctorNavigation } from '../../../hooks/useNavigation';
import { useAuth } from '../../../hooks/useAuth';

function ProtectedAction() {
  const { goToConsultation } = useDoctorNavigation();
  const { user, hasPermission } = useAuth();

  const handleStart = () => {
    if (!hasPermission('START_CONSULTATION')) {
      alert('Permission denied');
      return;
    }
    goToConsultation(bookingId);
  };

  return <button onClick={handleStart}>Start</button>;
}
```

---

## 🛠 Best Practices

### ✅ DO

- Use navigation hooks for programmatic navigation
- Pass state when needed for context
- Use `NavLinkButton` for prominent CTAs
- Use regular `Link` for inline/text links
- Handle navigation errors gracefully
- Validate params before navigating

### ❌ DON'T

- Don't use `window.location.href` for internal navigation
- Don't hardcode paths, use constants or hooks
- Don't forget to handle loading states
- Don't navigate without validation

---

## 🔮 Future Enhancements

- [ ] Add navigation middleware for auth checks
- [ ] Implement route prefetching
- [ ] Add loading spinners for page transitions
- [ ] Create breadcrumb component
- [ ] Add route analytics
- [ ] Implement deep linking
- [ ] Add route-based permissions
