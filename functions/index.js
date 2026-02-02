// functions/index.js

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
try {
    admin.initializeApp();
} catch (error) {
    console.warn('Firebase Admin initialization failed:', error);
}

/**
 * Helper: normalize booking date into YYYY-MM-DD based on salon offset (minutes)
 * - bookingDate can be: 'YYYY-MM-DD' string, Firestore Timestamp object, { seconds }, or Date
 * - salonOffsetMinutes: default 330 (IST +5:30). Can be set via env var SALON_UTC_OFFSET_MINUTES
 */
function normalizeDateToSalonYMD(bookingDate, salonOffsetMinutes = 330) {
    if (!bookingDate) return null;

    // If string in YYYY-MM-DD form => return as-is (trusted)
    if (typeof bookingDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
        return bookingDate;
    }

    // If Firestore Timestamp-like object (has seconds)
    let dateObj = null;
    if (bookingDate && typeof bookingDate === 'object') {
        if (typeof bookingDate.toDate === 'function') {
            dateObj = bookingDate.toDate();
        } else if (typeof bookingDate.seconds === 'number') {
            dateObj = new Date(bookingDate.seconds * 1000);
        } else if (bookingDate instanceof Date) {
            dateObj = bookingDate;
        }
    }

    if (!dateObj) {
        // Unable to parse
        return null;
    }

    // Adjust to salon timezone by adding offset minutes
    const offsetMs = (typeof salonOffsetMinutes === 'string' ? parseInt(salonOffsetMinutes, 10) : salonOffsetMinutes) * 60 * 1000;
    const adjusted = new Date(dateObj.getTime() + offsetMs);

    // Return YYYY-MM-DD
    return adjusted.toISOString().split('T')[0];
}

/**
 * Compute current date in salon timezone
 */
function getSalonTodayYMD(salonOffsetMinutes = 330) {
    const now = new Date();
    const offsetMs = (typeof salonOffsetMinutes === 'string' ? parseInt(salonOffsetMinutes, 10) : salonOffsetMinutes) * 60 * 1000;
    const adjusted = new Date(now.getTime() + offsetMs);
    return adjusted.toISOString().split('T')[0];
}

/**
 * Cloud function: Notify admin on new booking
 * Triggers when a new booking is created in Firestore
 */
exports.notifyAdminOnBooking = onDocumentCreated('bookings/{bookingId}', async (event) => {
    const booking = event.data?.data();
    if (!booking) {
        console.warn('No booking data found');
        return null;
    }

    const salonOffsetMinutes = process.env.SALON_UTC_OFFSET_MINUTES ? parseInt(process.env.SALON_UTC_OFFSET_MINUTES, 10) : 330;

    const bookingYMD = normalizeDateToSalonYMD(booking.date, salonOffsetMinutes);
    if (!bookingYMD) {
        console.log('Unable to normalize booking date', booking.date);
        return null;
    }

    const todayYMD = getSalonTodayYMD(salonOffsetMinutes);
    if (bookingYMD !== todayYMD) {
        console.log('Booking is not for today, skipping notification:', bookingYMD);
        return null;
    }

    // Compose notification body
    const timeText = booking.time || booking.startTime || 'unknown time';
    const payload = {
        notification: {
            title: 'New Booking Today!',
            body: `Hey, today we have a new booking at ${timeText}`
        }
    };

    try {
        // First try sending to topic "admins"
        const response = await admin.messaging().sendToTopic('admins', payload);
        console.log('notifyAdminsOnBooking: sent to topic "admins":', response);
    } catch (error) {
        console.warn('NotifyAdminOnBooking topic send failed:', error);

        // Fallback: query admin users for tokens
        try {
            const usersSnap = await admin.firestore().collection('users')
                .where('role', '==', 'admin')
                .get();

            const tokens = [];
            usersSnap.forEach(doc => {
                const data = doc.data();
                if (data?.fcmToken) {
                    if (Array.isArray(data.fcmToken)) tokens.push(...data.fcmToken);
                    else tokens.push(data.fcmToken);
                }
                if (Array.isArray(data?.fcmTokens)) tokens.push(...data.fcmTokens);
            });

            const uniqueTokens = [...new Set(tokens)].filter(Boolean);
            if (uniqueTokens.length === 0) {
                console.log('notifyAdminsOnBooking: no admin tokens found for fallback');
                return null;
            }

            // FCM limits: send in batches of 500 tokens
            for (let i = 0; i < uniqueTokens.length; i += 500) {
                const batch = uniqueTokens.slice(i, i + 500);
                const res = await admin.messaging().sendMulticast({
                    tokens: batch,
                    notification: payload.notification
                });
                console.log('notifyAdminsOnBooking: sent multicast batch', res.successCount, 'successes,', res.failureCount, 'failures');
            }

        } catch (fallbackErr) {
            console.error('notifyAdminsOnBooking: fallback send failed:', fallbackErr);
        }
    }

    return null;
});
