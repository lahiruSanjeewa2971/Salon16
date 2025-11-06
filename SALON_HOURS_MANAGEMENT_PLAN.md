# 🕒 Salon Hours Management Bottom Sheet - Implementation Plan

## 📋 Overview
Enhance the existing `AdminCalendarBottomSheet` to include salon hours management functionality when a day is long-pressed in the admin bookings calendar.

## 🎯 Core Features

### 1. **Salon Hours Display & Management**
- Display current salon open/close times (8:30 AM - 9:00 PM)
- Allow manual editing of open/close times
- Time picker components for easy time selection
- Real-time validation of time ranges

### 2. **Day-Specific Status Management**
- **Tuesday Closure**: Display "Salon Closed" message for Tuesdays
- **Custom Closure**: Option to mark any day as closed
- **Booking Status**: Separate toggle for booking availability vs salon operation

### 3. **Visual Status Indicators**
- Color-coded status badges (Open/Closed/Booking Only)
- Clear visual hierarchy for different states
- Consistent with app theme and design patterns

## 🎨 UI/UX Design Sketch

```
┌─────────────────────────────────────────┐
│  📅 Tuesday, October 15, 2024          │ ← Header with date
│  ✕                                     │ ← Close button
├─────────────────────────────────────────┤
│                                         │
│  🏪 SALON STATUS                        │
│  ┌─────────────────────────────────────┐ │
│  │  🔴 Salon Closed                    │ │ ← Status badge
│  │  Tuesday is our weekly closure day  │ │ ← Status message
│  └─────────────────────────────────────┘ │
│                                         │
│  ⏰ OPERATING HOURS                     │
│  ┌─────────────────────────────────────┐ │
│  │  Open Time:  [8:30 AM] ▼           │ │ ← Time picker
│  │  Close Time: [9:00 PM] ▼           │ │ ← Time picker
│  └─────────────────────────────────────┘ │
│                                         │
│  📋 DAY SETTINGS                        │
│  ┌─────────────────────────────────────┐ │
│  │  ☐ Salon Closed Today               │ │ ← Checkbox
│  │  ☐ Disable Bookings Only            │ │ ← Checkbox
│  │  ☐ Mark as Holiday                  │ │ ← Checkbox
│  └─────────────────────────────────────┘ │
│                                         │
│  📝 NOTES                               │
│  ┌─────────────────────────────────────┐ │
│  │  [Optional notes for this day...]   │ │ ← Text input
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │           💾 SAVE CHANGES            │ │ ← Save button
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### 1. **Component Structure**
```javascript
// Enhanced AdminCalendarBottomSheet props
{
  visible: boolean,
  selectedDate: string,
  mode: 'service' | 'day' | 'salon-hours', // New mode
  salonHours: {
    openTime: string,    // "08:30"
    closeTime: string,   // "21:00"
    isClosed: boolean,
    disableBookings: boolean,
    isHoliday: boolean,
    notes: string
  },
  onClose: () => void,
  onSave: (hoursData) => void
}
```

### 2. **State Management**
```javascript
const [salonHours, setSalonHours] = useState({
  openTime: '08:30',
  closeTime: '21:00',
  isClosed: false,
  disableBookings: false,
  isHoliday: false,
  notes: ''
});

const [isEditing, setIsEditing] = useState(false);
const [showTimePicker, setShowTimePicker] = useState(null); // 'open' | 'close' | null
```

### 3. **Day-Specific Logic**
```javascript
// Determine if it's Tuesday (weekly closure)
const isTuesday = new Date(selectedDate).getDay() === 2;

// Determine salon status
const getSalonStatus = () => {
  if (salonHours.isClosed || salonHours.isHoliday) return 'closed';
  if (isTuesday) return 'closed';
  if (salonHours.disableBookings) return 'bookings-disabled';
  return 'open';
};
```

## 📱 Component Sections

### 1. **Header Section**
- Date display with day name
- Close button (existing)
- Status indicator badge

### 2. **Salon Status Section**
- Current status display
- Status-specific messaging
- Visual status indicators

### 3. **Operating Hours Section**
- Time picker for open time
- Time picker for close time
- Time validation (open < close)
- Quick preset buttons (8AM-8PM, 9AM-9PM, etc.)

### 4. **Day Settings Section**
- Salon Closed Today checkbox
- Disable Bookings Only checkbox
- Mark as Holiday checkbox
- Conditional rendering based on day type

### 5. **Notes Section**
- Optional text input for day-specific notes
- Character limit (200 chars)
- Placeholder text suggestions

### 6. **Action Section**
- Save Changes button
- Cancel/Reset button
- Loading states during save

## 🎨 Design Specifications

### **Colors & Theme**
- **Open Status**: Green gradient (`colors.success`)
- **Closed Status**: Red gradient (`colors.error`)
- **Bookings Disabled**: Orange gradient (`colors.warning`)
- **Tuesday Closure**: Purple gradient (`colors.primary`)

### **Typography**
- **Header**: `ThemedText` with `fontSize: 20, fontWeight: 'bold'`
- **Status**: `ThemedText` with `fontSize: 16, fontWeight: '600'`
- **Labels**: `ThemedText` with `fontSize: 14, fontWeight: '500'`
- **Notes**: `ThemedText` with `fontSize: 12, fontWeight: '400'`

### **Spacing & Layout**
- **Section Spacing**: `spacing.lg` (16px)
- **Item Spacing**: `spacing.md` (12px)
- **Padding**: `spacing.xl` (20px)
- **Border Radius**: `borderRadius.lg` (12px)

## 🔄 Data Flow

### 1. **Initial Load**
```
User long-presses day → Bottom sheet opens → Fetch current salon hours → Display current settings
```

### 2. **Time Editing**
```
User taps time → Time picker opens → User selects time → Validate time range → Update state
```

### 3. **Status Changes**
```
User toggles checkbox → Update state → Recalculate status → Update UI → Show validation
```

### 4. **Save Process**
```
User taps Save → Validate data → Show loading → Save to Firestore → Show success → Close sheet
```

## 🗄️ Database Schema

### **Salon Hours Collection**
```javascript
// Collection: salonHours
{
  id: string,                    // Document ID
  date: string,                 // "2024-10-15"
  openTime: string,             // "08:30"
  closeTime: string,            // "21:00"
  isClosed: boolean,            // Salon closed
  disableBookings: boolean,      // Bookings disabled
  isHoliday: boolean,           // Holiday status
  notes: string,                // Optional notes
  createdAt: timestamp,
  updatedAt: timestamp
}

// Default weekly schedule
{
  id: "default",
  monday: { openTime: "08:30", closeTime: "21:00", isClosed: false },
  tuesday: { openTime: "08:30", closeTime: "21:00", isClosed: true }, // Weekly closure
  wednesday: { openTime: "08:30", closeTime: "21:00", isClosed: false },
  // ... other days
}
```

## 🚀 Implementation Phases

### **Phase 1: Core Structure**
- [ ] Add `salon-hours` mode to AdminCalendarBottomSheet
- [ ] Create salon hours state management
- [ ] Implement basic UI layout
- [ ] Add day-specific logic (Tuesday closure)

### **Phase 2: Time Management**
- [ ] Implement time picker components
- [ ] Add time validation logic
- [ ] Create quick preset buttons
- [ ] Handle time range validation

### **Phase 3: Status Management**
- [ ] Implement status checkboxes
- [ ] Add status calculation logic
- [ ] Create status indicators
- [ ] Handle conditional rendering

### **Phase 4: Data Persistence**
- [ ] Create Firestore service functions
- [ ] Implement save/load functionality
- [ ] Add error handling
- [ ] Create loading states

### **Phase 5: Polish & Testing**
- [ ] Add animations and transitions
- [ ] Implement form validation
- [ ] Add success/error feedback
- [ ] Test all scenarios

## 🧪 Testing Scenarios

### **Day Types**
- [ ] Regular weekday (Monday, Wednesday-Friday)
- [ ] Tuesday (weekly closure)
- [ ] Weekend (Saturday, Sunday)
- [ ] Holiday (custom closure)
- [ ] Special day (bookings disabled)

### **Time Scenarios**
- [ ] Valid time ranges (8:30 AM - 9:00 PM)
- [ ] Invalid time ranges (close before open)
- [ ] Same open/close time
- [ ] Midnight crossover (11 PM - 1 AM)

### **Status Combinations**
- [ ] Open with bookings enabled
- [ ] Open with bookings disabled
- [ ] Closed salon
- [ ] Holiday closure
- [ ] Tuesday closure

## 📊 Success Metrics

- [ ] **Functionality**: All time pickers work correctly
- [ ] **Validation**: Time ranges are properly validated
- [ ] **Persistence**: Changes save to Firestore successfully
- [ ] **UI/UX**: Smooth animations and intuitive interactions
- [ ] **Error Handling**: Graceful error states and recovery
- [ ] **Performance**: Fast loading and responsive interactions

## 🔮 Future Enhancements

### **Advanced Features**
- **Recurring Patterns**: Set weekly/monthly schedules
- **Staff Scheduling**: Assign staff to specific hours
- **Break Times**: Add lunch breaks and rest periods
- **Seasonal Hours**: Different hours for holidays/seasons
- **Multi-location**: Support for multiple salon locations

### **Analytics**
- **Usage Tracking**: Monitor which days are frequently modified
- **Booking Patterns**: Analyze booking vs. operating hours
- **Revenue Impact**: Track revenue changes from hour modifications

---

## 📝 Implementation Notes

1. **Reusability**: The bottom sheet should work for both service booking and salon hours management
2. **Accessibility**: Ensure all interactive elements are accessible
3. **Offline Support**: Handle offline scenarios gracefully
4. **Performance**: Optimize for smooth animations and quick data loading
5. **Error Recovery**: Provide clear error messages and recovery options

This plan provides a comprehensive foundation for implementing salon hours management while maintaining the existing functionality and design consistency of the app.
