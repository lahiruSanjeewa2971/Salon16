# 📅 Service Booking Feature - Implementation Plan

## 📋 Overview

This plan outlines the complete implementation of the **Service Booking Bottom Sheet** feature, which allows customers to book salon services by selecting a date and time slot based on salon operating hours.

### 🎯 Core Objectives
- Display service information (name in header, price and duration in body, description)
- Enable date selection based on salon hours availability
- Generate time slots dynamically based on salon operating hours and service duration
- Prevent booking conflicts (existing bookings, closed days, disabled booking days)
- Maintain 20-minute buffer gap between consecutive bookings
- Handle customer delays (15-minute grace period with admin cancellation/delay options)
- Provide smooth, intuitive UX for booking completion
- Handle edge cases and error scenarios gracefully

---

## 🏗️ Technical Architecture

### **Data Flow**
```
User clicks "Book Now" → Bottom Sheet Opens
  ↓
Load Service Details (name, price, duration, description)
  ↓
Fetch Salon Hours for Date Range (next 30 days)
  ↓
Filter Available Dates (exclude: closed, holidays, disableBookings=true)
  ↓
User Selects Date
  ↓
Fetch Salon Hours for Selected Date
  ↓
Generate Time Slots (based on openTime, closeTime, service duration, 20min buffer)
  ↓
Check Existing Bookings for Conflicts (with 20min gap requirement)
  ↓
User Selects Time Slot
  ↓
Place Booking (create booking document)
  ↓
Show Success/Error Feedback
```

### **Component Structure**
```
ServiceBookingBottomSheet
├── Service Header Section
│   └── Service Name (Large, Bold)
├── Service Info Section (Body)
│   ├── Service Price & Duration
│   └── Service Description
├── Date Selection Section
│   ├── Section Title "Select Date"
│   ├── Horizontal Scrollable Date Cards
│   ├── Available Date Indicators
│   └── Selected Date Highlight
├── Time Selection Section
│   ├── Section Title "Select Time"
│   ├── Operating Hours Display
│   ├── Time Slot Grid (Modern Card Design)
│   ├── Available/Unavailable Indicators
│   └── Selected Time Highlight
├── Booking Summary Section
│   ├── Selected Date & Time
│   ├── Service Details
│   └── Total Price
└── Action Section
    ├── Place Booking Button
    └── Cancel Button
```

---

## 📊 Data Requirements

### **Service Object Structure**
```javascript
{
  id: "PfbG8bgzgcLnEnf7pnlX",
  name: "Ear piercing",
  description: "Professional ear piercing",
  price: 150,
  duration: 10, // in minutes
  category: {
    name: "Beauty",
    id: "YvJEEU8citm6uOAQ6LbP"
  },
  color: "#6C2A52",
  icon: "star-outline",
  image: "https://res.cloudinary.com/...",
  popular: false,
  isActive: true
}
```

### **Salon Hours Document Structure** (from Firestore)
```javascript
{
  date: "2025-10-22", // Document ID
  openTime: "09:30", // Format: "HH:mm"
  closeTime: "21:00", // Format: "HH:mm"
  dayOfWeek: 3, // 0 = Sunday, 3 = Wednesday
  disableBookings: false, // Critical: if true, no bookings allowed
  isClosed: false, // If true, salon is closed
  isHoliday: false, // If true, treat as holiday
  notes: "", // Optional admin notes
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **Booking Document Structure** (to be created)
```javascript
{
  customerId: "user_uid",
  serviceId: "service_id",
  serviceName: "Ear piercing", // Snapshot for historical reference
  servicePrice: 150,
  serviceDuration: 10, // in minutes
  date: "2025-10-22", // Format: "YYYY-MM-DD"
  time: "14:30", // Format: "HH:mm"
  status: "pending", // pending | accepted | rejected | completed | cancelled
  createdAt: Timestamp,
  updatedAt: Timestamp,
  // Optional fields
  notes: "", // Customer special requests
  staffId: null, // To be assigned by admin
  rescheduleCount: 0
}
```

---

## 🎨 UI/UX Design

### **Visual Layout**

#### **1. Service Header Section**
```
┌─────────────────────────────────────┐
│  Service Name (Large, Bold)         │
└─────────────────────────────────────┘
```

**Design Elements:**
- **Service Name**: Large, bold white text (24px, font-weight: 700)
- **No Image**: Service image removed from bottom sheet
- **Header Border**: Subtle bottom border for separation

#### **1b. Service Info Section (Body)**
```
┌─────────────────────────────────────┐
│  💰 $150        ⏰ 10 min            │
│  Professional ear piercing...         │
└─────────────────────────────────────┘
```

**Design Elements:**
- **Price & Duration**: Displayed side-by-side in body (18px, semi-bold)
  - Price: `$150` with currency icon in accent color
  - Duration: `10 min` with clock icon in white
- **Description**: Smaller text below (14px, line-height: 20px, opacity: 0.9)
- **Spacing**: Generous padding around info section

#### **2. Date Selection Section**
```
┌─────────────────────────────────────┐
│ Select Date                         │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │Today│ │Tomor│ │Wed  │ │Thu  │   │
│ │  22 │ │ 23  │ │ 24  │ │ 25  │   │
│ │ ✓   │ │ ✓   │ │ ✓   │ │ ✓   │   │
│ └─────┘ └─────┘ └─────┘ └─────┘   │
│ (scrollable →)                      │
└─────────────────────────────────────┘
```

**Design Elements:**
- **Horizontal Scrollable Date Cards**: Individual cards for each date
- **Date Card Design**:
  - Card style with rounded corners (borderRadius: 12px)
  - Semi-transparent background (rgba(255, 255, 255, 0.1))
  - Border: 1px solid rgba(255, 255, 255, 0.2)
  - Card width: ~80px, padding: 12px
  - Shadow: subtle elevation
- **Available Dates**: 
  - Normal state: White text on semi-transparent card
  - Available indicator: Green checkmark icon or dot
  - Selected: Accent color background with white text, border highlight
- **Unavailable Dates**:
  - Grayed out card (opacity: 0.4)
  - Red X icon or "Closed" badge
  - Disabled interaction (no touch feedback)
- **Date Format**: 
  - "Today" / "Tomorrow" for first two days
  - "Mon 22", "Tue 23", etc. for other dates
  - Day number prominently displayed
- **Card Layout**:
  - Day name (small, top)
  - Date number (large, center)
  - Status indicator (icon, bottom)

#### **3. Time Selection Section**

**Two Display Modes:**

##### **3a. Mode 1: No Bookings (Free Time Picker)**
```
┌─────────────────────────────────────┐
│ Select Time (9:30 AM - 9:00 PM)    │
│                                     │
│     ┌─────────────────────┐        │
│     │                     │        │
│     │   Beautiful Time    │        │
│     │      Picker         │        │
│     │   (Clock/Wheel UI)  │        │
│     │                     │        │
│     └─────────────────────┘        │
│                                     │
│  Operating Hours: 9:30 AM - 9:00 PM│
└─────────────────────────────────────┘
```

**Design Elements:**
- **Time Picker Component**: Beautiful, intuitive time picker (wheel/clock style)
- **Full Range Selection**: Customer can select any time within salon operating hours
- **Visual Design**: 
  - Modern time picker UI (iOS/Android native style or custom wheel)
  - Smooth scrolling/selection animation
  - Clear AM/PM indicators
  - Selected time highlighted prominently
- **Validation**: 
  - Time must be within salon hours
  - Service duration must fit before closing time
  - Real-time validation feedback

##### **3b. Mode 2: Has Bookings (Time Slot Cards)**
```
┌─────────────────────────────────────┐
│ Select Time (9:30 AM - 9:00 PM)    │
│                                     │
│ ℹ️ Today has bookings. Please       │
│    select your preferred time       │
│    among these available slots.     │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ 9:30 │ │10:00 │ │10:30 │         │
│ │  AM  │ │  AM  │ │  AM  │         │
│ │ ✓    │ │ ✓    │ │ ✗    │         │
│ └──────┘ └──────┘ └──────┘         │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │11:00 │ │11:30 │ │12:00 │         │
│ │  AM  │ │  AM  │ │  PM  │         │
│ │ ✓    │ │ ✓    │ │ ✓    │         │
│ └──────┘ └──────┘ └──────┘         │
│ ... (more time slots, scrollable)  │
└─────────────────────────────────────┘
```

**Design Elements:**
- **Info Message**: 
  - Prominent informational text at top
  - "Today has bookings. Please select your preferred time among these available slots."
  - Info icon (ℹ️) with subtle background
  - White text, semi-transparent background
- **Time Slot Card Grid**: 3 columns (responsive), scrollable
- **Time Slot Card Design**:
  - Card style with rounded corners (borderRadius: 12px)
  - Semi-transparent background (rgba(255, 255, 255, 0.1))
  - Border: 1px solid rgba(255, 255, 255, 0.2)
  - Card padding: 16px
  - Shadow: subtle elevation
  - Card height: ~80px
- **Available Slots**: 
  - White text on semi-transparent card
  - Time prominently displayed (18px, bold)
  - AM/PM indicator (14px, opacity: 0.8)
  - Available indicator: Green checkmark or dot
  - Hover/press: Scale animation, border highlight
  - Selected: Accent color background with white text, border highlight (2px)
- **Unavailable Slots**:
  - Grayed out card (opacity: 0.4)
  - Red X icon or "Booked" label
  - Disabled interaction (no touch feedback)
- **Time Format**: 
  - "9:30 AM", "10:00 AM", "2:30 PM", etc.
  - Large time number, smaller AM/PM indicator
- **Gap Indicators**: 
  - Visual indication of 20-minute buffer between slots
  - Subtle spacing between cards

#### **4. Booking Summary Section**
```
┌─────────────────────────────────────┐
│ Booking Summary                     │
│ ┌─────────────────────────────────┐ │
│ │ 📅 Wednesday, October 22, 2025  │ │
│ │ ⏰ 2:30 PM                      │ │
│ │ ✂️ Ear piercing                │ │
│ │ 💰 $150                         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### **5. Action Buttons**
```
┌─────────────────────────────────────┐
│ [Place Booking] (Primary, Large)   │
│ [Cancel] (Secondary, Small)         │
└─────────────────────────────────────┘
```

### **Color Scheme**
- **Primary Background**: Gradient (primary → primaryDark → accent)
- **Date/Time Cards**: Semi-transparent white (rgba(255, 255, 255, 0.1))
- **Card Borders**: White with low opacity (rgba(255, 255, 255, 0.2))
- **Available Indicators**: Green (#10B981)
- **Unavailable Indicators**: Red (#EF4444)
- **Selected State**: Accent color (#EC4899) with white text
- **Selected Border**: Accent color with 2px width
- **Disabled State**: Gray (#6B7280) with 40% opacity

### **Typography**
- **Service Name**: 24px, Bold, White
- **Price**: 20px, SemiBold, Accent color
- **Date/Time Labels**: 14px, Medium, White (opacity: 0.9)
- **Time Slots**: 16px, Medium, White
- **Button Text**: 16px, SemiBold, White

---

## 🔧 Implementation Logic

### **1. Date Availability Logic**

```javascript
/**
 * Determine if a date is available for booking
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} salonHours - Salon hours document for the date
 * @returns {Object} - { isAvailable: boolean, reason: string }
 */
function isDateAvailable(date, salonHours) {
  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  if (selectedDate < today) {
    return { isAvailable: false, reason: 'Past date' };
  }

  // Check if salon is closed
  if (salonHours.isClosed) {
    return { isAvailable: false, reason: 'Salon is closed' };
  }

  // Check if it's a holiday
  if (salonHours.isHoliday) {
    return { isAvailable: false, reason: 'Holiday' };
  }

  // Check if bookings are disabled
  if (salonHours.disableBookings) {
    return { isAvailable: false, reason: 'Bookings disabled' };
  }

  // Check if it's Tuesday (default closure)
  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 2 && !salonHours.openTime) {
    // Tuesday and no custom hours set
    return { isAvailable: false, reason: 'Tuesday closure' };
  }

  return { isAvailable: true, reason: 'Available' };
}
```

### **2. Time Selection Logic (Conditional Display)**

```javascript
/**
 * Determine time selection mode based on existing bookings
 * @param {Array} existingBookings - Existing bookings for the date
 * @returns {Object} - { mode: 'picker' | 'slots', hasBookings: boolean }
 */
function determineTimeSelectionMode(existingBookings) {
  const hasBookings = existingBookings && existingBookings.length > 0;
  
  return {
    mode: hasBookings ? 'slots' : 'picker',
    hasBookings: hasBookings
  };
}
```

### **3. Time Slot Generation (with 20-minute Buffer)**

**Note**: This function is only used when `hasBookings === true`

```javascript
/**
 * Generate available time slots for a date (when bookings exist)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} salonHours - Salon hours for the date
 * @param {number} serviceDuration - Service duration in minutes (from selected service)
 * @param {Array} existingBookings - Existing bookings for the date
 * @param {number} bufferMinutes - Buffer time between bookings (default: 20)
 * @returns {Array} - Array of time slot objects
 */
function generateTimeSlots(date, salonHours, serviceDuration, existingBookings, bufferMinutes = 20) {
  const slots = [];
  
  // Parse open and close times
  const [openHour, openMinute] = salonHours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = salonHours.closeTime.split(':').map(Number);
  
  const openTime = new Date(date);
  openTime.setHours(openHour, openMinute, 0, 0);
  
  const closeTime = new Date(date);
  closeTime.setHours(closeHour, closeMinute, 0, 0);
  
  // Generate slots every 30 minutes (or configurable interval)
  const slotInterval = 30; // minutes
  const currentTime = new Date(openTime);
  
  while (currentTime < closeTime) {
    const slotEndTime = new Date(currentTime);
    slotEndTime.setMinutes(slotEndTime.getMinutes() + serviceDuration);
    
    // Check if slot ends before closing time (accounting for service duration)
    if (slotEndTime <= closeTime) {
      const timeString = formatTime(currentTime);
      
      // Check if slot conflicts with existing bookings (including buffer)
      // Buffer is applied: 20 minutes before and after each existing booking
      const isAvailable = !isSlotBooked(
        currentTime, 
        slotEndTime, 
        existingBookings, 
        bufferMinutes
      );
      
      slots.push({
        time: timeString,
        time24: formatTime24(currentTime),
        isAvailable: isAvailable,
        startTime: new Date(currentTime),
        endTime: slotEndTime
      });
    }
    
    // Move to next slot
    currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
  }
  
  return slots;
}

/**
 * Check if a time slot conflicts with existing bookings (with buffer)
 * @param {Date} startTime - Slot start time
 * @param {Date} endTime - Slot end time
 * @param {Array} existingBookings - Existing bookings
 * @param {number} bufferMinutes - Buffer time in minutes (default: 20)
 * @returns {boolean} - True if slot is booked/unavailable
 */
function isSlotBooked(startTime, endTime, existingBookings, bufferMinutes = 20) {
  return existingBookings.some(booking => {
    const bookingStart = new Date(`${booking.date}T${booking.time}`);
    const bookingEnd = new Date(bookingStart);
    bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.serviceDuration);
    
    // Add buffer time: 20 minutes before and after each booking
    const bookingStartWithBuffer = new Date(bookingStart);
    bookingStartWithBuffer.setMinutes(bookingStartWithBuffer.getMinutes() - bufferMinutes);
    
    const bookingEndWithBuffer = new Date(bookingEnd);
    bookingEndWithBuffer.setMinutes(bookingEndWithBuffer.getMinutes() + bufferMinutes);
    
    // Check for overlap (including buffer zones)
    // Slot is unavailable if it overlaps with booking + buffer
    return (startTime < bookingEndWithBuffer && endTime > bookingStartWithBuffer);
  });
}

/**
 * Format time for display (12-hour format)
 */
function formatTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Format time for storage (24-hour format)
 */
function formatTime24(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
```

### **3. Booking Creation**

```javascript
/**
 * Create a new booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise<Object>} - Created booking
 */
async function createBooking(bookingData) {
  const { user } = useAuth(); // Get current user
  
  const booking = {
    customerId: user.uid,
    customerName: user.displayName || `${user.firstName} ${user.lastName}`,
    serviceId: bookingData.service.id,
    serviceName: bookingData.service.name,
    servicePrice: bookingData.service.price,
    serviceDuration: bookingData.service.duration,
    categoryId: bookingData.service.category?.id,
    categoryName: bookingData.service.category?.name,
    date: bookingData.date, // YYYY-MM-DD
    time: bookingData.time, // HH:mm
    status: 'pending',
    notes: bookingData.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    rescheduleCount: 0
  };
  
  try {
    const result = await bookingService.createBooking(booking);
    return { success: true, booking: result };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 📱 User Experience Flow

### **Step-by-Step Flow**

1. **User clicks "Book Now" on service card**
   - Bottom sheet animates in from bottom
   - Service details are displayed immediately

2. **Date Selection**
   - User sees calendar with available dates highlighted
   - Unavailable dates are grayed out with reason tooltip
   - User scrolls horizontally to see more dates
   - User taps on an available date
   - Selected date is highlighted with accent color

3. **Time Selection** (Conditional Based on Bookings)
   
   **Scenario A: No Bookings Exist**
   - System detects no bookings for selected date
   - Beautiful time picker is displayed
   - User can select any time within salon operating hours
   - Real-time validation ensures service duration fits before closing
   - Smooth picker interaction with clear AM/PM indicators
   
   **Scenario B: Bookings Exist**
   - System detects at least one booking for selected date
   - Informational message displayed: "Today has bookings. Please select your preferred time among these available slots."
   - Time slots are generated based on:
     - Selected service duration
     - Existing bookings
     - 20-minute buffer gaps before and after each booking
   - User sees grid of available time slot cards
   - Unavailable slots show "Booked" label or are grayed out
   - User taps on an available time slot
   - Selected time is highlighted with accent color

4. **Booking Summary**
   - Summary section shows selected date, time, service, and price
   - User can review before placing booking

5. **Place Booking**
   - User taps "Place Booking" button
   - Loading state is shown
   - Booking is created in Firestore
   - Success toast is shown
   - Bottom sheet closes
   - User is redirected to bookings screen (optional)

6. **Error Handling**
   - If date becomes unavailable: Show error, refresh date list
   - If time slot is booked: Show error, refresh time slots
   - If network error: Show retry option
   - If validation fails: Show specific error message

---

## 🛠️ Technical Implementation Details

### **1. Service Data Loading**
```javascript
// Service data is already passed as prop
// No additional loading needed
const { service } = props; // Already available
```

### **2. Salon Hours Fetching**
```javascript
// Fetch salon hours for date range (next 30 days)
const [salonHoursData, setSalonHoursData] = useState({});
const [loadingHours, setLoadingHours] = useState(false);

useEffect(() => {
  if (visible && service) {
    loadSalonHoursRange();
  }
}, [visible, service]);

async function loadSalonHoursRange() {
  setLoadingHours(true);
  try {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    
    const startDateStr = formatDate(today);
    const endDateStr = formatDate(endDate);
    
    const hoursData = await salonHoursService.getSalonHoursRange(
      startDateStr,
      endDateStr
    );
    
    // Convert to map for easy lookup
    const hoursMap = {};
    hoursData.forEach(hours => {
      hoursMap[hours.date] = hours;
    });
    
    setSalonHoursData(hoursMap);
  } catch (error) {
    console.error('Error loading salon hours:', error);
    showErrorToast('Failed to load available dates');
  } finally {
    setLoadingHours(false);
  }
}
```

### **3. Existing Bookings Check**
```javascript
// Fetch existing bookings for selected date
const [existingBookings, setExistingBookings] = useState([]);

async function loadExistingBookings(date) {
  try {
    const bookings = await bookingService.getBookingsByDate(date);
    setExistingBookings(bookings);
  } catch (error) {
    console.error('Error loading bookings:', error);
    // Don't block booking if this fails, just log error
  }
}

useEffect(() => {
  if (selectedDate) {
    loadExistingBookings(selectedDate);
  }
}, [selectedDate]);
```

### **4. Time Selection State Management**
```javascript
// Time selection mode and state
const [timeSelectionMode, setTimeSelectionMode] = useState(null); // 'picker' | 'slots'
const [timeSlots, setTimeSlots] = useState([]);
const [selectedTime, setSelectedTime] = useState(null); // For time picker mode

// Determine mode when date is selected and bookings are loaded
useEffect(() => {
  if (selectedDate && service && existingBookings !== null) {
    const modeInfo = determineTimeSelectionMode(existingBookings);
    setTimeSelectionMode(modeInfo.mode);
    
    if (modeInfo.hasBookings) {
      // Generate time slots with service duration and buffer
      const hours = salonHoursData[selectedDate];
      if (hours) {
        const slots = generateTimeSlots(
          selectedDate,
          hours,
          service.duration, // Use selected service duration
          existingBookings,
          20 // 20-minute buffer
        );
        setTimeSlots(slots);
      }
    } else {
      // Clear time slots, show picker instead
      setTimeSlots([]);
      setSelectedTime(null);
    }
  }
}, [selectedDate, salonHoursData, service, existingBookings]);

// Time picker validation (for picker mode)
const validateTimePickerSelection = (selectedTime) => {
  if (!selectedDate || !service) return false;
  
  const hours = salonHoursData[selectedDate];
  if (!hours) return false;
  
  // Parse selected time
  const [hour, minute] = selectedTime.split(':').map(Number);
  const selectedDateTime = new Date(selectedDate);
  selectedDateTime.setHours(hour, minute, 0, 0);
  
  // Parse salon hours
  const [openHour, openMinute] = hours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = hours.closeTime.split(':').map(Number);
  
  const openTime = new Date(selectedDate);
  openTime.setHours(openHour, openMinute, 0, 0);
  
  const closeTime = new Date(selectedDate);
  closeTime.setHours(closeHour, closeMinute, 0, 0);
  
  // Check if selected time is within salon hours
  if (selectedDateTime < openTime || selectedDateTime >= closeTime) {
    return { valid: false, error: 'Selected time is outside salon hours' };
  }
  
  // Check if service duration fits before closing
  const serviceEndTime = new Date(selectedDateTime);
  serviceEndTime.setMinutes(serviceEndTime.getMinutes() + service.duration);
  
  if (serviceEndTime > closeTime) {
    return { valid: false, error: 'Service duration exceeds closing time' };
  }
  
  return { valid: true };
};
```

---

## ✅ Validation Rules

### **Date Validation**
- ✅ Date must not be in the past
- ✅ Date must have salon hours available
- ✅ Date must not have `disableBookings: true`
- ✅ Date must not have `isClosed: true`
- ✅ Date must not be a holiday (`isHoliday: true`)

### **Time Validation**

**For Time Picker Mode (No Bookings):**
- ✅ Time must be within salon operating hours
- ✅ Service duration must fit within remaining time before closing
- ✅ Real-time validation feedback

**For Time Slot Mode (Has Bookings):**
- ✅ Time must be within salon operating hours
- ✅ Time slot must not conflict with existing bookings
- ✅ **20-minute buffer** must be maintained before and after each booking
- ✅ Service duration must fit within remaining time before closing (including buffer)
- ✅ Selected service duration is considered in buffer calculation

### **Booking Validation**
- ✅ User must be authenticated
- ✅ Service must be active
- ✅ Date and time must be selected
- ✅ No conflicting bookings exist

---

## 🚨 Error Handling

### **Error Scenarios**

1. **Salon Hours Not Found**
   - **Scenario**: Date doesn't have salon hours document
   - **Solution**: Use default schedule or show "Unavailable" message
   - **UX**: Gray out date, show tooltip "Hours not set"

2. **Date Becomes Unavailable**
   - **Scenario**: Admin disables bookings while user is selecting
   - **Solution**: Refresh date availability, show error if selected date becomes unavailable
   - **UX**: Show error toast, clear selection

3. **Time Slot Booked**
   - **Scenario**: Another user books the same slot
   - **Solution**: Refresh time slots, disable conflicting slot
   - **UX**: Show "Booked" label, disable slot

4. **Network Error**
   - **Scenario**: Failed to fetch salon hours or create booking
   - **Solution**: Show retry button, cache last successful state
   - **UX**: Show error toast with retry option

5. **Validation Error**
   - **Scenario**: Invalid booking data
   - **Solution**: Show specific error message
   - **UX**: Highlight invalid field, show error message

6. **Buffer Conflict**
   - **Scenario**: Time slot too close to existing booking (within 20-minute buffer)
   - **Solution**: Mark slot as unavailable, show "Too close to another booking"
   - **UX**: Disable slot, show tooltip explaining buffer requirement

---

## ⏱️ Delay Handling System

### **15-Minute Grace Period Policy**

When a customer is delayed:
- **Grace Period**: 15 minutes after scheduled time
- **Admin Actions**:
  1. **Cancel Booking**: If customer doesn't arrive within 15 minutes
  2. **Delay Booking**: Move booking to later time (if available)

### **Delay Handling Logic**

```javascript
/**
 * Check if a booking can be delayed to a new time
 * @param {string} bookingId - Booking ID to delay
 * @param {string} newTime - New time in HH:mm format
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} existingBookings - All bookings for the date
 * @returns {Object} - { canDelay: boolean, reason: string, suggestedTimes: Array }
 */
function canDelayBooking(bookingId, newTime, date, existingBookings) {
  // Get the booking to be delayed
  const bookingToDelay = existingBookings.find(b => b.id === bookingId);
  if (!bookingToDelay) {
    return { canDelay: false, reason: 'Booking not found' };
  }
  
  const bufferMinutes = 20;
  const serviceDuration = bookingToDelay.serviceDuration;
  
  // Parse new time
  const [newHour, newMinute] = newTime.split(':').map(Number);
  const newStartTime = new Date(date);
  newStartTime.setHours(newHour, newMinute, 0, 0);
  
  const newEndTime = new Date(newStartTime);
  newEndTime.setMinutes(newEndTime.getMinutes() + serviceDuration);
  
  // Check all other bookings (excluding the one being delayed)
  const otherBookings = existingBookings.filter(b => b.id !== bookingId);
  
  // Check if new time conflicts with other bookings (including buffer)
  const hasConflict = otherBookings.some(booking => {
    const bookingStart = new Date(`${booking.date}T${booking.time}`);
    const bookingEnd = new Date(bookingStart);
    bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.serviceDuration);
    
    // Add buffer
    const bookingStartWithBuffer = new Date(bookingStart);
    bookingStartWithBuffer.setMinutes(bookingStartWithBuffer.getMinutes() - bufferMinutes);
    
    const bookingEndWithBuffer = new Date(bookingEnd);
    bookingEndWithBuffer.setMinutes(bookingEndWithBuffer.getMinutes() + bufferMinutes);
    
    // Check for overlap
    return (newStartTime < bookingEndWithBuffer && newEndTime > bookingStartWithBuffer);
  });
  
  if (hasConflict) {
    // Find available times near the requested time
    const suggestedTimes = findAvailableTimes(
      date,
      newStartTime,
      serviceDuration,
      otherBookings,
      bufferMinutes
    );
    
    return {
      canDelay: false,
      reason: 'Time conflicts with another booking',
      suggestedTimes: suggestedTimes
    };
  }
  
  return { canDelay: true, reason: 'Available' };
}

/**
 * Find available times near a requested time for delay
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Date} requestedTime - Requested new time
 * @param {number} serviceDuration - Service duration in minutes
 * @param {Array} existingBookings - Other bookings for the date
 * @param {number} bufferMinutes - Buffer time in minutes
 * @returns {Array} - Array of available time strings
 */
function findAvailableTimes(date, requestedTime, serviceDuration, existingBookings, bufferMinutes = 20) {
  const suggestions = [];
  const slotInterval = 30; // minutes
  const maxSuggestions = 5;
  
  // Check times before and after requested time
  for (let offset = -slotInterval; offset <= slotInterval * maxSuggestions; offset += slotInterval) {
    const checkTime = new Date(requestedTime);
    checkTime.setMinutes(checkTime.getMinutes() + offset);
    
    const checkEndTime = new Date(checkTime);
    checkEndTime.setMinutes(checkEndTime.getMinutes() + serviceDuration);
    
    // Check if this time is available
    const isAvailable = !isSlotBooked(checkTime, checkEndTime, existingBookings, bufferMinutes);
    
    if (isAvailable) {
      suggestions.push(formatTime24(checkTime));
      if (suggestions.length >= maxSuggestions) break;
    }
  }
  
  return suggestions;
}
```

### **Admin Delay Workflow**

1. **Customer arrives late** (15+ minutes past booking time)
2. **Admin opens booking management**
3. **Admin sees delay options**:
   - Cancel booking
   - Delay booking (move to new time)
4. **If delay selected**:
   - System checks available times for the day
   - Shows suggested times (considering 20-minute buffer)
   - Admin selects new time
   - System validates new time doesn't conflict
   - Booking is updated with new time
5. **If cancel selected**:
   - Booking status changed to "cancelled"
   - Time slot becomes available for other customers

### **Delay Considerations**

- **Check all bookings** for the day when delaying
- **Maintain 20-minute buffer** before and after all bookings
- **Suggest nearest available times** if requested time is unavailable
- **Update booking document** with new time and delay reason
- **Notify customer** (if notification system implemented)

---

## 🔑 Key Decision Logic

### **Time Selection Mode Decision Tree**

```
User Selects Date
  ↓
Fetch Existing Bookings for Selected Date
  ↓
Are there any bookings? (existingBookings.length > 0)
  ↓
  ├─ NO → Show Time Picker Mode
  │        ├─ Display beautiful time picker
  │        ├─ Allow selection of any time within salon hours
  │        ├─ Validate service duration fits before closing
  │        └─ Real-time validation feedback
  │
  └─ YES → Show Time Slot Cards Mode
           ├─ Display info message: "Today has bookings. Please select your preferred time among these available slots."
           ├─ Generate time slots considering:
           │   ├─ Selected service duration (CRITICAL)
           │   ├─ Existing bookings
           │   └─ 20-minute buffer before/after each booking
           ├─ Display time slot cards in grid (3 columns)
           ├─ Mark unavailable slots (grayed out, "Booked" label)
           └─ Allow selection of available slots only
```

### **Critical Implementation Points**

1. **Service Duration Usage**: Always use `service.duration` (from selected service) when:
   - Calculating time slot end times
   - Checking if service fits before closing
   - Applying buffer zones around existing bookings

2. **Buffer Calculation**: When bookings exist, apply 20-minute buffer:
   - **Before booking**: 20 minutes before existing booking start
   - **After booking**: 20 minutes after existing booking end (which includes booking duration)
   - **Example**: If booking is 10:00 AM - 10:30 AM (30 min service):
     - Buffer zone: 9:40 AM - 10:50 AM
     - New bookings cannot start in this range

3. **Mode Switching**: Mode should update dynamically when:
   - Date selection changes
   - Bookings are loaded/fetched
   - Service is changed (if allowed)

---

## 📝 Implementation Checklist

### **Phase 1: Service Display**
- [ ] Display service name in header (large, bold)
- [ ] Display service price and duration in body (side-by-side)
- [ ] Display service description in body
- [ ] Style service header section (no image)
- [ ] Style service info section in body

### **Phase 2: Date Selection**
- [ ] Create horizontal scrollable date card component
- [ ] Design date cards with modern card style
- [ ] Fetch salon hours for date range (next 30 days)
- [ ] Implement date availability logic
- [ ] Display available/unavailable dates with card design
- [ ] Handle date selection
- [ ] Show selected date highlight (accent color, border)

### **Phase 3: Time Selection**
- [ ] Determine time selection mode (picker vs slots) based on existing bookings
- [ ] Implement time picker component for no-bookings mode
  - [ ] Beautiful time picker UI (wheel/clock style)
  - [ ] Smooth scrolling/selection animation
  - [ ] Real-time validation feedback
  - [ ] Service duration validation
- [ ] Implement time slot cards mode for has-bookings scenario
  - [ ] Display info message: "Today has bookings. Please select your preferred time among these available slots."
  - [ ] Generate time slots based on salon hours
  - [ ] Implement 20-minute buffer logic between bookings (considering selected service duration)
  - [ ] Fetch existing bookings for selected date
  - [ ] Check slot conflicts with existing bookings (including buffer)
  - [ ] Design time slot cards with modern card style
  - [ ] Display time slot grid (3 columns, scrollable)
  - [ ] Show available/unavailable slots with card design
  - [ ] Handle time slot selection
  - [ ] Show selected time highlight (accent color, border)

### **Phase 4: Booking Summary**
- [ ] Display selected date (formatted)
- [ ] Display selected time (formatted)
- [ ] Display service details
- [ ] Display total price
- [ ] Style summary section

### **Phase 5: Booking Creation**
- [ ] Implement booking creation logic
- [ ] Add validation before submission
- [ ] Show loading state during booking
- [ ] Handle success/error responses
- [ ] Show success toast
- [ ] Close bottom sheet on success
- [ ] Redirect to bookings screen (optional)

### **Phase 6: Error Handling**
- [ ] Handle network errors
- [ ] Handle validation errors
- [ ] Handle conflict errors
- [ ] Show appropriate error messages
- [ ] Implement retry logic

### **Phase 7: Polish & UX**
- [ ] Add loading states
- [ ] Add animations
- [ ] Add haptic feedback
- [ ] Add tooltips for unavailable dates/times
- [ ] Optimize performance
- [ ] Test edge cases

---

## 🎯 Success Criteria

### **Functional Requirements**
- ✅ User can view complete service details
- ✅ User can select an available date
- ✅ User can select an available time slot
- ✅ User can place a booking successfully
- ✅ Booking conflicts are prevented
- ✅ Unavailable dates/times are clearly indicated

### **UX Requirements**
- ✅ Booking flow is intuitive and easy to follow
- ✅ Loading states provide clear feedback
- ✅ Error messages are helpful and actionable
- ✅ Success feedback is clear
- ✅ UI is responsive and performs well

### **Technical Requirements**
- ✅ Code is well-structured and maintainable
- ✅ Error handling is comprehensive
- ✅ Performance is optimized (no unnecessary re-renders)
- ✅ Data fetching is efficient (caching where appropriate)

---

## 📚 Additional Considerations

### **Future Enhancements**
1. **Staff Selection**: Allow customers to choose specific staff member
2. **Multiple Services**: Allow booking multiple services in one appointment
3. **Recurring Bookings**: Allow weekly/monthly recurring bookings
4. **Booking Notes**: Allow customers to add special requests
5. **Payment Integration**: Process payment at booking time
6. **Booking Reminders**: Send notifications before appointment
7. **Delay Management UI**: Admin interface for handling customer delays
8. **Auto-Delay Suggestions**: System suggests best available times when delaying

### **Performance Optimization**
- Cache salon hours data for date range
- Debounce time slot generation
- Lazy load calendar dates
- Optimize re-renders with React.memo

### **Accessibility**
- Add ARIA labels for screen readers
- Ensure keyboard navigation works
- Maintain proper contrast ratios
- Support large text sizes

---

## 🔗 Related Files

### **Components**
- `components/ui/ServiceBookingBottomSheet.jsx` - Main booking component
- `components/sections/AllServicesGrid.jsx` - Service grid with "Book Now" button

### **Services**
- `services/firebaseService.js` - Contains `salonHoursService` and `bookingService`

### **Contexts**
- `contexts/AuthContext.js` - User authentication state

### **Hooks**
- `hooks/useAuth.js` - Authentication hooks

---

## 📖 Implementation Notes

1. **Date Format**: Always use `YYYY-MM-DD` format for consistency
2. **Time Format**: Store as `HH:mm` (24-hour), display as `h:mm AM/PM` (12-hour)
3. **Service Duration**: Always in minutes - **CRITICAL**: Use selected service duration for time slot calculation
4. **Time Slot Interval**: 30 minutes (configurable)
5. **Date Range**: Show next 30 days by default (configurable)
6. **Buffer Time**: 20 minutes between bookings (configurable)
7. **Grace Period**: 15 minutes delay tolerance before admin can cancel/delay
8. **Card Design**: Modern card-based UI for dates and time slots
9. **No Service Image**: Service image removed from bottom sheet (displayed in service grid only)
10. **Price & Duration**: Displayed in body section, not header
11. **Conditional Time Selection**: 
    - **No Bookings**: Show beautiful time picker (full time range within salon hours)
    - **Has Bookings**: Show info message + time slot cards (with 20-minute buffer gaps)
12. **Service Duration Consideration**: When calculating time slots, always use the selected service's duration to ensure proper buffer spacing

---

**This plan provides a comprehensive roadmap for implementing the service booking feature with a focus on user experience, error handling, and technical excellence.** 🚀✨

