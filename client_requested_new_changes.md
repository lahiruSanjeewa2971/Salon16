Client requested a custemer can place a booking without login.
currently the booking placement is completed with a new firebase document and the firebase rules also changed
according to the new implementations. 
but I found a big wall to stop developments:

if any day I re-start this implementation, I need to continue following:

check loadBookingsForDate() function in bookings.jsx, it call getBookingsByDate() function is firebaseService.js
I need to call not only bookings document but also bookingsSummaries document as well and take records for that date similarly bookings document. then return single object containing both records like a 2 objects in a single array. but don't change anything in getBookingsByDate() function. write a new function for that.
then call it in bookings.jsx loadBookingsForDate() function replacing 
const bookingsData = await bookingService.getBookingsByDate(date);
above line. just comment the current one.
then filter the array and the records comming from bookings document add into setBookings state like currently doing. store other document records.
then when admin click accept or reject or anything from TodaysBookings.jsx send both bookingId from bookings document and bookingSummaries document id.