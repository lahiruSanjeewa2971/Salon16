# 🔐 Admin User Setup Guide

## 📋 Overview

This guide explains how to set up the admin user for Salon 16 booking system. The admin user will have full access to manage bookings, services, customers, and salon settings.

## 🚀 Quick Setup

### Prerequisites
- Node.js installed on your system
- Firebase project configured
- Internet connection

### Step 1: Run the Setup Script

```bash
# Navigate to the project directory
cd salon16

# Run the admin setup script
npm run setup-admin
```

### Step 2: Verify Setup

The script will create:
- ✅ Admin user in Firebase Authentication
- ✅ Admin user document in Firestore
- ✅ Salon settings configuration
- ✅ Sample service categories
- ✅ Sample services

## 🔑 Admin Credentials

After running the setup script, you can login with:

- **Email**: `salon16admin@gmail.com`
- **Password**: `Abcd@1234`

## 📊 What Gets Created

### 1. Firebase Authentication
- Admin user account with email/password authentication
- Email verification sent to admin email
- Display name set to "Salon 16 Admin"

### 2. Firestore Database

#### Users Collection
```javascript
users/rathne1997@gmail.com {
  email: "rathne1997@gmail.com",
  displayName: "Rathne Admin",
  firstName: "Rathne",
  lastName: "Admin",
  phone: "+1234567890",
  profileImage: "",
  role: "admin",
  isEmailVerified: false,
  preferences: {
    notifications: true,
    preferredServices: [],
    theme: "light"
  }
}
```

#### Settings Collection
```javascript
settings/salon {
  salonName: "Salon 16",
  address: "123 Main Street, City, State 12345",
  phone: "+1234567890",
  workingHours: { /* 7 days of operation */ },
  timeSlotDuration: 30,
  advanceBookingDays: 90
}
```

#### Categories Collection
- Hair Services
- Nail Services  
- Facial Services
- Spa Services

#### Services Collection
- Hair Cut & Style ($85, 60 min)
- Hair Coloring ($150, 120 min)
- Manicure & Pedicure ($65, 75 min)
- Deep Facial Treatment ($120, 90 min)

## 🔧 Troubleshooting

### Common Issues

#### 1. "Email already in use"
```bash
# The admin user already exists. You can:
# - Use existing credentials to login
# - Delete the user from Firebase Console and run script again
# - Change the email in setupAdminUser.js
```

#### 2. "Firebase configuration error"
```bash
# Check that:
# - Firebase project is active
# - Authentication is enabled
# - Firestore is enabled
# - Internet connection is working
```

#### 3. "Permission denied"
```bash
# Ensure your Firebase project has:
# - Authentication enabled
# - Firestore rules allow writes
# - Correct project ID in firebase.config.js
```

### Manual Setup (Alternative)

If the script fails, you can manually create the admin user:

1. **Firebase Console** → **Authentication** → **Users** → **Add User**
2. **Email**: `salon16admin@gmail.com`
3. **Password**: `Abcd@1234`
4. **Firestore** → **Create Document** in `users` collection
5. **Add fields** as shown in the user data structure above

## 🎯 Next Steps

After successful setup:

1. **Login to the app** using admin credentials
2. **Verify admin access** - you should see admin-specific screens
3. **Configure salon settings** as needed
4. **Add more services** through the admin interface
5. **Set up staff members** if needed

## 📱 Testing Admin Login

1. Open the Salon 16 app
2. Go to Login screen
3. Enter credentials:
   - Email: `salon16admin@gmail.com`
   - Password: `Abcd@1234`
4. You should be redirected to admin dashboard

## 🔒 Security Notes

- **Change the password** after first login
- **Enable 2FA** for additional security
- **Keep credentials secure** - don't commit to version control
- **Regular backups** of Firestore data
- **Monitor admin access** through Firebase Console

## 📞 Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify Firebase project configuration
3. Ensure all required services are enabled
4. Check internet connectivity
5. Review Firebase Console for any restrictions

---

**Ready to start managing your salon? Run `npm run setup-admin` and begin your admin journey! 🎉**
