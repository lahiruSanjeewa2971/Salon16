// functions/index.js

require('dotenv').config();
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin SDK
try {
    admin.initializeApp();
} catch (error) {
    console.warn('Firebase Admin initialization failed:', error);
}

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

    // const todayYMD = getSalonTodayYMD(salonOffsetMinutes);
    // if (bookingYMD !== todayYMD) {
    //     console.log('Booking is not for today, skipping notification:', bookingYMD);
    //     return null;
    // }

    // Compose notification body
    const timeText = booking.time || booking.startTime || 'unknown time';
    const payload = {
        notification: {
            title: 'New Booking!',
            body: `Hey, we have a new booking at ${timeText}`
        }
    };

    try {
        // First try sending to topic "admins"
        const message = {
            topic: 'admins',
            notification: payload.notification,
        };

        const response = await admin.messaging().send(message);
        console.log('notifyAdminsOnBooking: sent to topic "admins":', response);

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

/**
 * Format time from HH:MM to 12-hour format
 */
function formatTime(time) {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Format date from YYYY-MM-DD to readable format
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Email template for accepted bookings
 */
function getAcceptedEmailTemplate(bookingData) {
    const { customer, date, time, service } = bookingData;
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(time);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%); padding: 30px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                    ✨ SALON16 ✨
                                </h1>
                                <p style="margin: 10px 0 0 0; color: #1a1a1a; font-size: 14px; opacity: 0.9;">
                                    Premium Salon Services
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Status Badge -->
                        <tr>
                            <td style="padding: 30px 40px 20px 40px; text-align: center;">
                                <div style="display: inline-block; background-color: #10B981; color: white; padding: 12px 30px; border-radius: 25px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
                                    ✓ BOOKING ACCEPTED
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <p style="color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                    Dear <strong style="color: #D4AF37;">${customer || 'Valued Customer'}</strong>,
                                </p>
                                
                                <p style="color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                    This is a confirmation from the <strong style="color: #D4AF37;">Salon16 Admin Team</strong>. Your booking has been <strong style="color: #10B981;">ACCEPTED</strong>!
                                </p>
                                
                                <!-- Booking Details Card -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.1); border-radius: 12px; border: 1px solid rgba(212,175,55,0.3); margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="padding: 10px 0;">
                                                        <span style="color: rgba(255,255,255,0.6); font-size: 14px; display: block; margin-bottom: 5px;">📅 Date</span>
                                                        <strong style="color: #D4AF37; font-size: 18px;">${formattedDate}</strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.1);">
                                                        <span style="color: rgba(255,255,255,0.6); font-size: 14px; display: block; margin-bottom: 5px;">⏰ Time</span>
                                                        <strong style="color: #D4AF37; font-size: 18px;">${formattedTime}</strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.1);">
                                                        <span style="color: rgba(255,255,255,0.6); font-size: 14px; display: block; margin-bottom: 5px;">💇 Service</span>
                                                        <strong style="color: white; font-size: 16px;">${service || 'Salon Service'}</strong>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Important Notice -->
                                <div style="background-color: rgba(212,175,55,0.15); border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; line-height: 1.6; margin: 0;">
                                        <strong style="color: #D4AF37;">⚠️ Important:</strong> Please arrive at the salon <strong>at least 5 minutes before</strong> your scheduled time to ensure a smooth service experience.
                                    </p>
                                </div>
                                
                                <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                                    We look forward to serving you!
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: rgba(0,0,0,0.3); padding: 20px 40px; text-align: center; border-top: 1px solid rgba(212,175,55,0.3);">
                                <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                                    © ${new Date().getFullYear()} Salon16. All rights reserved.
                                </p>
                                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                                    This is an automated message from Salon16 Admin
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

/**
 * Email template for rejected bookings
 */
function getRejectedEmailTemplate(bookingData) {
    const { customer, date, time, adminNotes } = bookingData;
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(time);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%); padding: 30px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                    ✨ SALON16 ✨
                                </h1>
                                <p style="margin: 10px 0 0 0; color: #1a1a1a; font-size: 14px; opacity: 0.9;">
                                    Premium Salon Services
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Status Badge -->
                        <tr>
                            <td style="padding: 30px 40px 20px 40px; text-align: center;">
                                <div style="display: inline-block; background-color: #EF4444; color: white; padding: 12px 30px; border-radius: 25px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
                                    ✗ BOOKING REJECTED
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <p style="color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                    Dear <strong style="color: #D4AF37;">${customer || 'Valued Customer'}</strong>,
                                </p>
                                
                                <p style="color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                    This is a notification from the <strong style="color: #D4AF37;">Salon16 Admin Team</strong>. Unfortunately, your booking has been <strong style="color: #EF4444;">REJECTED</strong>.
                                </p>
                                
                                <!-- Booking Details Card -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.1); border-radius: 12px; border: 1px solid rgba(239,68,68,0.3); margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="padding: 10px 0;">
                                                        <span style="color: rgba(255,255,255,0.6); font-size: 14px; display: block; margin-bottom: 5px;">📅 Date</span>
                                                        <strong style="color: rgba(255,255,255,0.8); font-size: 18px;">${formattedDate}</strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.1);">
                                                        <span style="color: rgba(255,255,255,0.6); font-size: 14px; display: block; margin-bottom: 5px;">⏰ Time</span>
                                                        <strong style="color: rgba(255,255,255,0.8); font-size: 18px;">${formattedTime}</strong>
                                                    </td>
                                                </tr>
                                                ${adminNotes ? `
                                                <tr>
                                                    <td style="padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.1);">
                                                        <span style="color: rgba(255,255,255,0.6); font-size: 14px; display: block; margin-bottom: 5px;">📝 Reason</span>
                                                        <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 5px 0 0 0; line-height: 1.5;">${adminNotes}</p>
                                                    </td>
                                                </tr>
                                                ` : ''}
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Notice -->
                                <div style="background-color: rgba(212,175,55,0.15); border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; line-height: 1.6; margin: 0;">
                                        <strong style="color: #D4AF37;">💡 Tip:</strong> You can try booking another available time slot that works better for both parties.
                                    </p>
                                </div>
                                
                                <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                                    We apologize for any inconvenience and hope to serve you soon!
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: rgba(0,0,0,0.3); padding: 20px 40px; text-align: center; border-top: 1px solid rgba(212,175,55,0.3);">
                                <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                                    © ${new Date().getFullYear()} Salon16. All rights reserved.
                                </p>
                                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                                    This is an automated message from Salon16 Admin
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

/**
 * Send email notification
 */
async function sendEmail(to, subject, htmlContent) {
    try {
        const mailOptions = {
            from: `"Salon16 Admin" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Cloud function: Send email when booking status changes
 * Triggers when a booking is updated in Firestore
 */
exports.onBookingStatusChange = onDocumentUpdated('bookings/{bookingId}', async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
        console.warn('Missing booking data');
        return null;
    }

    // Only proceed if status changed
    if (before.status === after.status) {
        console.log('Status unchanged, skipping email');
        return null;
    }

    const { status, customerId, customerName, customer, date, time, service, adminNotes } = after;
    let customerEmail = after.customerEmail;

    // If no email in booking, fetch from users collection using customerId
    if (!customerEmail && customerId) {
        console.log('No email in booking, fetching from users collection for customerId:', customerId);
        
        try {
            const userDoc = await admin.firestore().collection('users').doc(customerId).get();
            if (userDoc.exists) {
                customerEmail = userDoc.data().email;
                console.log('Found customer email from users collection:', customerEmail);
            } else {
                console.error('User document not found for customerId:', customerId);
            }
        } catch (err) {
            console.error('Error fetching user document:', err);
        }
    }

    // If still no email, try bookingSummaries as fallback
    if (!customerEmail) {
        console.warn('No customer email found, trying to fetch from bookingSummary');
        
        try {
            const bookingId = event.params.bookingId;
            const summaryDoc = await admin.firestore().collection('bookingSummaries').doc(bookingId).get();
            if (summaryDoc.exists && summaryDoc.data().customerEmail) {
                customerEmail = summaryDoc.data().customerEmail;
                console.log('Found customer email from bookingSummaries:', customerEmail);
            } else {
                console.error('No email found in bookingSummaries either, cannot send email');
                return null;
            }
        } catch (err) {
            console.error('Error fetching bookingSummary:', err);
            return null;
        }
    }

    // Final check - we must have an email to proceed
    if (!customerEmail) {
        console.error('Unable to find customer email, cannot send notification');
        return null;
    }

    console.log(`Booking status changed from ${before.status} to ${status} for ${customerEmail}`);

    // Use customerName or customer for display
    const customerDisplayName = customerName || customer || 'Valued Customer';

    // Send email based on new status
    if (status === 'accepted') {
        const emailHtml = getAcceptedEmailTemplate({ 
            customer: customerDisplayName, 
            date, 
            time, 
            service 
        });
        await sendEmail(
            customerEmail,
            '✅ Booking Accepted - Salon16',
            emailHtml
        );
    } else if (status === 'rejected') {
        const emailHtml = getRejectedEmailTemplate({ 
            customer: customerDisplayName, 
            date, 
            time, 
            adminNotes 
        });
        await sendEmail(
            customerEmail,
            '❌ Booking Update - Salon16',
            emailHtml
        );
    }

    return null;
});

