# 🏗️ Salon Booking App - Database Schema

## 📋 Table Overview

| Table Name   | Primary Key          | Description                 | Foreign Keys |
|--------------|----------------------|-----------------------------|--------------|
| `users`      | `user_id`            | Customer and staff accounts | - |
| `staff`      | `staff_id`           | Salon employees/stylists    | `user_id` |
| `services`   | `service_id`         | Available salon services    | `category_id` |
| `categories` | `category_id`        | Service categories          | - |
| `bookings`   | `booking_id`         | Customer appointments       | `user_id`, `staff_id`, `service_id` |
| `time_slots` | `slot_id`            | Available time slots        | `staff_id` |
| `reviews`    | `review_id`          | Customer reviews            | `user_id`, `booking_id` |
| `payments`   | `payment_id`         | Payment transactions        | `user_id`, `booking_id` |
| `notifications` | `notification_id` | System notifications        | `user_id` |
| `salon_settings` | `setting_id`     | App configuration           | - |

---

## 🗂️ Detailed Table Structures

### 1. 👥 **users** Table
```sql
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,           -- Firebase UID
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    profile_image_url TEXT,
    user_type ENUM('customer', 'staff', 'admin') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

### 2. 👨‍💼 **staff** Table
```sql
CREATE TABLE staff (
    staff_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,              -- FK to users
    employee_id VARCHAR(20) UNIQUE,
    position VARCHAR(50),                      -- Stylist, Receptionist, Manager
    specialization TEXT,                       -- Hair, Nails, Facial, etc.
    experience_years INT DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT TRUE,
    working_hours JSON,                        -- {"monday": "9:00-18:00", ...}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### 3. 🏷️ **categories** Table
```sql
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),                          -- Icon name for UI
    color VARCHAR(7),                          -- Hex color code
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. ✂️ **services** Table
```sql
CREATE TABLE services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,                  -- FK to categories
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INT NOT NULL,             -- Service duration in minutes
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);
```

### 5. 📅 **bookings** Table
```sql
CREATE TABLE bookings (
    booking_id VARCHAR(20) PRIMARY KEY,        -- BK001234 format
    user_id VARCHAR(50) NOT NULL,              -- FK to users
    staff_id VARCHAR(50) NOT NULL,             -- FK to staff
    service_id INT NOT NULL,                   -- FK to services
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,                                -- Special requests
    is_reschedule_pending BOOLEAN DEFAULT FALSE,
    reschedule_count INT DEFAULT 0,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE RESTRICT,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT
);
```

### 6. ⏰ **time_slots** Table
```sql
CREATE TABLE time_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL,             -- FK to staff
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_break BOOLEAN DEFAULT FALSE,            -- Lunch break, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
    UNIQUE KEY unique_slot (staff_id, slot_date, start_time)
);
```

### 7. ⭐ **reviews** Table
```sql
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,              -- FK to users
    booking_id VARCHAR(20) NOT NULL,           -- FK to bookings
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,         -- Verified purchase
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking_review (user_id, booking_id)
);
```

### 8. 💳 **payments** Table
```sql
CREATE TABLE payments (
    payment_id VARCHAR(50) PRIMARY KEY,        -- Payment gateway transaction ID
    user_id VARCHAR(50) NOT NULL,              -- FK to users
    booking_id VARCHAR(20) NOT NULL,           -- FK to bookings
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method ENUM('card', 'cash', 'bank_transfer', 'wallet') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    gateway_transaction_id VARCHAR(100),
    gateway_response JSON,                      -- Payment gateway response
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refund_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);
```

### 9. 🔔 **notifications** Table
```sql
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,              -- FK to users
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking_confirmation', 'reminder', 'cancellation', 'promotion', 'system') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP,                    -- For scheduled notifications
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### 10. ⚙️ **salon_settings** Table
```sql
CREATE TABLE salon_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,           -- Can be accessed by customers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔗 Foreign Key Relationships

### **Primary Relationships:**

| Parent Table | Child Table | Foreign Key | Relationship Type | Cascade Rule |
|--------------|-------------|-------------|-------------------|--------------|
| `users` | `staff` | `user_id` | One-to-One | CASCADE |
| `users` | `bookings` | `user_id` | One-to-Many | CASCADE |
| `users` | `reviews` | `user_id` | One-to-Many | CASCADE |
| `users` | `payments` | `user_id` | One-to-Many | CASCADE |
| `users` | `notifications` | `user_id` | One-to-Many | CASCADE |
| `staff` | `bookings` | `staff_id` | One-to-Many | RESTRICT |
| `staff` | `time_slots` | `staff_id` | One-to-Many | CASCADE |
| `categories` | `services` | `category_id` | One-to-Many | RESTRICT |
| `services` | `bookings` | `service_id` | One-to-Many | RESTRICT |
| `bookings` | `reviews` | `booking_id` | One-to-One | CASCADE |
| `bookings` | `payments` | `booking_id` | One-to-One | CASCADE |

---

## 📊 Indexes for Performance

### **Primary Indexes:**
- All Primary Keys (automatically indexed)
- All Foreign Keys (for JOIN performance)

### **Additional Recommended Indexes:**
```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Bookings table
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_staff_id ON bookings(staff_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_user_date ON bookings(user_id, booking_date);

-- Time slots table
CREATE INDEX idx_time_slots_staff_date ON time_slots(staff_id, slot_date);
CREATE INDEX idx_time_slots_available ON time_slots(is_available, slot_date);

-- Reviews table
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- Notifications table
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at);
```

---

## 🎯 Sample Data Relationships

### **Example Booking Flow:**
1. **Customer** (`users`) books a **Service** (`services`)
2. **Staff** (`staff`) is assigned to the booking
3. **Time Slot** (`time_slots`) is reserved
4. **Booking** (`bookings`) record is created
5. **Payment** (`payments`) is processed
6. **Notification** (`notifications`) is sent
7. After service, **Review** (`reviews`) can be submitted

### **Key Constraints:**
- One user can have multiple bookings
- One staff member can handle multiple bookings
- One service can be booked multiple times
- One booking can have one review and one payment
- Time slots are unique per staff member per date/time

---

## 🚀 Scalability Considerations

### **Partitioning Strategy:**
- Partition `bookings` table by `booking_date` (monthly)
- Partition `notifications` table by `created_at` (monthly)
- Partition `time_slots` table by `slot_date` (monthly)

### **Archiving Strategy:**
- Archive completed bookings older than 2 years
- Archive read notifications older than 6 months
- Archive old time slots (keep only current + 3 months)

---

## 📝 Notes

- **Firebase Integration**: `user_id` uses Firebase UID format
- **Booking ID Format**: `BK` + 6-digit number (e.g., BK001234)
- **Payment ID**: Uses payment gateway transaction ID
- **JSON Fields**: Store complex data like working hours and gateway responses
- **Timestamps**: All tables include created_at and updated_at for audit trails
- **Soft Deletes**: Use `is_active` flags instead of hard deletes where appropriate

This schema provides a solid foundation for your salon booking app with proper relationships, constraints, and performance optimizations! 🎯✨
