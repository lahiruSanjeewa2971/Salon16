# Expired Bookings Auto-Cleanup Plan

## Overview
Automatically delete bookings that are:
- Status: `pending`
- Booking time has passed
- More than 2 hours have elapsed since booking time

## Implementation Options

### Option A: Firebase Cloud Functions (Recommended)
- **Location**: `functions/index.js`
- **Trigger**: Scheduled (every hour)
- **Pros**: Reliable, server-side, runs automatically
- **Cons**: Requires Firebase Functions setup

### Option B: Client-Side Check
- **Location**: Admin dashboard/bookings screen on load
- **Pros**: Simple, no extra infrastructure
- **Cons**: Only runs when app is open

## Logic Flow

1. Query all bookings where `status == 'pending'`
2. For each booking:
   - Parse `date` (YYYY-MM-DD) + `time` (HH:MM)
   - Create booking datetime: `new Date(date + 'T' + time)`
   - Calculate: `(currentTime - bookingTime) > 2 hours`
   - Check: `currentTime > bookingTime`
3. If both conditions met → Delete booking

## Code Structure

### Service Function
```javascript
// services/firebaseService.js
deleteExpiredPendingBookings: async () => {
  // Query pending bookings
  // Filter expired (> 2 hours past booking time)
  // Batch delete
}
```

### Query Logic
```javascript
const pendingBookings = await firestoreService.query('bookings', [
  { field: 'status', operator: '==', value: 'pending' }
]);

const expiredBookings = pendingBookings.filter(booking => {
  const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
  const now = new Date();
  const hoursDiff = (now - bookingDateTime) / (1000 * 60 * 60);
  return hoursDiff > 2 && now > bookingDateTime;
});
```

## Considerations

- **Performance**: Add Firestore index on `status` + `date`
- **Timezone**: Use consistent timezone (UTC recommended)
- **Logging**: Log deleted bookings for audit trail
- **Error Handling**: Retry logic for network failures
- **Security**: Ensure Firestore rules allow admin deletion

## Testing

1. Create test bookings with past dates/times
2. Verify deletion after 2+ hours
3. Verify non-expired bookings remain
4. Test timezone edge cases

