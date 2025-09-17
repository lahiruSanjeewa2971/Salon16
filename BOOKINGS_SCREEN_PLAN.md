# Bookings Screen - Detailed Implementation Plan

## 📋 Overview

The Bookings screen serves as the **primary booking management hub** for customers to view, manage, and interact with all their salon appointments. 

### 🎯 Core Purpose
- **View all bookings** (past, upcoming, cancelled)
- **Manage appointments** (reschedule, cancel, modify)
- **Track booking status** and history
- **Quick actions** for booking-related tasks
- **Integration** with other app features

---

## 🏗️ Technical Architecture

### **Screen Structure**
```
Bookings Screen
├── Header Section
│   ├── Title & Subtitle
│   ├── Filter Tabs (Upcoming, Past, All)
│   └── Search Bar
├── Content Section
│   ├── Empty State (when no bookings)
│   ├── Booking List (scrollable)
│   └── Loading State (skeleton loader)
└── Action Section
    ├── Quick Actions
    └── Floating Action Button (New Booking)
```

### **Component Hierarchy**
```
BookingsScreen
├── BookingsHeader
│   ├── BookingsTitle
│   ├── FilterTabs
│   └── SearchBar
├── BookingsContent
│   ├── EmptyState
│   ├── BookingList
│   │   └── BookingCard[]
│   └── LoadingState
└── BookingsActions
    ├── QuickActions
    └── FloatingActionButton
```

---

## 🎨 UI/UX Design

### **Visual Design System**

#### **Color Scheme (Based on Theme)**
- **Primary**: Deep plum (#6C2A52) for headers and accents
- **Secondary**: Burgundy (#8E3B60) for secondary elements
- **Accent**: Gold (#D4AF37) for highlights and CTAs
- **Status Colors**:
  - **Pending**: Orange (#F59E0B)
  - **Accepted**: Green (#10B981)
  - **Rejected**: Red (#EF4444)
  - **Completed**: Blue (#3B82F6)
  - **Cancelled**: Gray (#6B7280)

#### **Typography**
- **Headings**: Montserrat Bold (24px, 20px, 18px)
- **Body Text**: Roboto Regular (16px, 14px)
- **Labels**: Inter Medium (12px, 10px)
- **Status Text**: Inter SemiBold (12px)

#### **Spacing & Layout**
- **8px Grid System**: Consistent spacing throughout
- **Card Padding**: 16px (spacing.lg)
- **Section Margins**: 20px (spacing.xl)
- **Border Radius**: 12px for cards, 8px for buttons

### **Responsive Design**
- **Mobile-First**: Optimized for mobile devices
- **Touch Targets**: Minimum 44px for interactive elements
- **Swipe Actions**: Swipe left/right for quick actions
- **Pull-to-Refresh**: Update booking data

---

## 📱 Screen Layout & Components

### **1. Header Section**

#### **BookingsTitle Component**
```javascript
// Title and subtitle with user context
<ThemedText variant="heading1">My Bookings</ThemedText>
<ThemedText variant="body">Manage your appointments</ThemedText>
```

#### **FilterTabs Component**
```javascript
// Tab-based filtering system
const tabs = [
  { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
  { id: 'past', label: 'Past', count: pastCount },
  { id: 'all', label: 'All', count: totalCount }
];
```

#### **SearchBar Component**
```javascript
// Search functionality
<ThemedInput
  placeholder="Search by service, date, or booking ID"
  value={searchQuery}
  onChangeText={setSearchQuery}
  icon="search"
/>
```

### **2. Content Section**

#### **EmptyState Component**
```javascript
// When no bookings exist
<View style={styles.emptyState}>
  <Ionicons name="calendar-outline" size={64} color={colors.muted} />
  <ThemedText variant="heading2">No Bookings Yet</ThemedText>
  <ThemedText variant="body">Book your first appointment to get started</ThemedText>
  <ThemedButton title="Book Now" onPress={handleBookNow} />
</View>
```

#### **BookingCard Component**
```javascript
// Individual booking card
<ThemedCard variant="booking">
  <BookingHeader
    serviceName={booking.serviceName}
    date={booking.date}
    time={booking.time}
    status={booking.status}
  />
  <BookingDetails
    stylist={booking.stylist}
    duration={booking.duration}
    price={booking.price}
  />
  <BookingActions
    onReschedule={handleReschedule}
    onCancel={handleCancel}
    onViewDetails={handleViewDetails}
  />
</ThemedCard>
```

#### **LoadingState Component**
```javascript
// Skeleton loader while data loads
<BookingSkeletonLoader />
```

### **3. Action Section**

#### **QuickActions Component**
```javascript
// Quick action buttons
<View style={styles.quickActions}>
  <ThemedButton
    title="Book New Appointment"
    icon="add"
    onPress={handleNewBooking}
  />
  <ThemedButton
    title="View Calendar"
    icon="calendar"
    onPress={handleViewCalendar}
  />
</View>
```

---

## 🔧 Core Features Implementation

### **1. Booking Status Management**

#### **Status Types (From PROJECT_PLAN.md)**
```javascript
const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};
```

#### **Status Indicators**
```javascript
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return colors.warning;
    case 'accepted': return colors.success;
    case 'rejected': return colors.error;
    case 'completed': return colors.info;
    case 'cancelled': return colors.muted;
    default: return colors.muted;
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending': return 'time-outline';
    case 'accepted': return 'checkmark-circle-outline';
    case 'rejected': return 'close-circle-outline';
    case 'completed': return 'checkmark-done-outline';
    case 'cancelled': return 'ban-outline';
    default: return 'help-circle-outline';
  }
};
```

### **2. Filtering & Search System**

#### **Filter Implementation**
```javascript
const [activeFilter, setActiveFilter] = useState('upcoming');
const [searchQuery, setSearchQuery] = useState('');

const filteredBookings = useMemo(() => {
  let filtered = bookings;
  
  // Filter by status
  if (activeFilter !== 'all') {
    filtered = filtered.filter(booking => {
      if (activeFilter === 'upcoming') {
        return ['pending', 'accepted'].includes(booking.status) && 
               new Date(booking.date) >= new Date();
      }
      if (activeFilter === 'past') {
        return ['completed', 'cancelled', 'rejected'].includes(booking.status) || 
               new Date(booking.date) < new Date();
      }
      return true;
    });
  }
  
  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(booking =>
      booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.date.includes(searchQuery)
    );
  }
  
  return filtered;
}, [bookings, activeFilter, searchQuery]);
```

### **3. Reschedule System (Business Rules)**

#### **Reschedule Logic**
```javascript
const canReschedule = (booking) => {
  const now = new Date();
  const bookingDate = new Date(booking.date);
  const timeDiff = bookingDate - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return (
    booking.status === 'accepted' &&
    hoursDiff >= 2 && // Must be at least 2 hours before
    booking.rescheduleCount < 2 && // Max 2 attempts per day
    !booking.isReschedulePending
  );
};

const handleReschedule = (booking) => {
  if (!canReschedule(booking)) {
    showToast('error', 'Cannot reschedule this booking');
    return;
  }
  
  // Navigate to reschedule screen
  router.push(`/reschedule/${booking.id}`);
};
```

### **4. Cancellation System**

#### **Cancellation Logic**
```javascript
const canCancel = (booking) => {
  const now = new Date();
  const bookingDate = new Date(booking.date);
  const timeDiff = bookingDate - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return (
    ['pending', 'accepted'].includes(booking.status) &&
    hoursDiff >= 2 // Must be at least 2 hours before
  );
};

const handleCancel = (booking) => {
  if (!canCancel(booking)) {
    showToast('error', 'Cannot cancel this booking');
    return;
  }
  
  // Show confirmation dialog
  Alert.alert(
    'Cancel Booking',
    'Are you sure you want to cancel this appointment?',
    [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: () => cancelBooking(booking.id) }
    ]
  );
};
```

---

## 📊 Data Management

### **State Management**
```javascript
const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [activeFilter, setActiveFilter] = useState('upcoming');
const [searchQuery, setSearchQuery] = useState('');
```

### **Data Fetching**
```javascript
const fetchBookings = async () => {
  try {
    setLoading(true);
    const userBookings = await bookingService.getUserBookings(user.uid);
    setBookings(userBookings);
  } catch (error) {
    showToast('error', 'Failed to load bookings');
  } finally {
    setLoading(false);
  }
};

const refreshBookings = async () => {
  try {
    setRefreshing(true);
    await fetchBookings();
  } finally {
    setRefreshing(false);
  }
};
```

### **Real-time Updates**
```javascript
useEffect(() => {
  const unsubscribe = bookingService.subscribeToUserBookings(
    user.uid,
    (updatedBookings) => {
      setBookings(updatedBookings);
    }
  );
  
  return unsubscribe;
}, [user.uid]);
```

---

## 🎭 User Interactions

### **Swipe Actions**
```javascript
const renderSwipeActions = (booking) => {
  const actions = [];
  
  if (canReschedule(booking)) {
    actions.push({
      icon: 'refresh',
      label: 'Reschedule',
      color: colors.warning,
      onPress: () => handleReschedule(booking)
    });
  }
  
  if (canCancel(booking)) {
    actions.push({
      icon: 'close',
      label: 'Cancel',
      color: colors.error,
      onPress: () => handleCancel(booking)
    });
  }
  
  return actions;
};
```

### **Pull-to-Refresh**
```javascript
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refreshBookings}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  }
>
  {/* Booking content */}
</ScrollView>
```

### **Infinite Scroll (if needed)**
```javascript
const handleLoadMore = () => {
  if (!loading && hasMoreBookings) {
    loadMoreBookings();
  }
};
```

---

## 🔗 Navigation & Integration

### **Navigation Flow**
```javascript
// To other screens
const handleViewDetails = (booking) => {
  router.push(`/booking-details/${booking.id}`);
};

const handleNewBooking = () => {
  router.push('/book-appointment');
};

const handleViewCalendar = () => {
  router.push('/calendar');
};

const handleRateService = (booking) => {
  router.push(`/review/${booking.id}`);
};
```

### **Deep Linking**
```javascript
// Handle deep links to specific bookings
useEffect(() => {
  const handleDeepLink = (url) => {
    if (url.includes('/booking/')) {
      const bookingId = url.split('/booking/')[1];
      router.push(`/booking-details/${bookingId}`);
    }
  };
  
  // Set up deep link listener
}, []);
```

---

## 🎨 Animation & Transitions

### **Screen Animations**
```javascript
// Fade in animation for booking cards
const cardAnimatedStyle = useAnimatedStyle(() => ({
  opacity: fadeAnim.value,
  transform: [{ translateY: slideUpAnim.value }]
}));

// Staggered animation for booking list
useEffect(() => {
  const animateCards = () => {
    filteredBookings.forEach((_, index) => {
      fadeAnim.value = withDelay(
        index * 100,
        withTiming(1, { duration: 300 })
      );
      slideUpAnim.value = withDelay(
        index * 100,
        withSpring(0, { damping: 15 })
      );
    });
  };
  
  animateCards();
}, [filteredBookings]);
```

### **Micro-interactions**
```javascript
// Button press animations
const buttonPressAnim = useSharedValue(1);

const handleButtonPress = () => {
  buttonPressAnim.value = withSequence(
    withTiming(0.95, { duration: 100 }),
    withSpring(1, { damping: 15 })
  );
};
```

---

## 📱 Responsive Design

### **Screen Size Adaptations**
```javascript
const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isTablet = width > 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
  },
  bookingCard: {
    marginBottom: isSmallScreen ? spacing.sm : spacing.md,
  },
  // ... other responsive styles
});
```

### **Orientation Handling**
```javascript
const [orientation, setOrientation] = useState('portrait');

useEffect(() => {
  const subscription = Dimensions.addEventListener('change', ({ window }) => {
    setOrientation(window.width > window.height ? 'landscape' : 'portrait');
  });
  
  return () => subscription?.remove();
}, []);
```

---

## 🧪 Testing Strategy

### **Unit Tests**
```javascript
// Component rendering tests
describe('BookingCard', () => {
  it('renders booking information correctly', () => {
    // Test implementation
  });
  
  it('shows correct status indicator', () => {
    // Test implementation
  });
  
  it('handles reschedule action', () => {
    // Test implementation
  });
});
```

### **Integration Tests**
```javascript
// Booking flow tests
describe('BookingsScreen', () => {
  it('loads and displays user bookings', () => {
    // Test implementation
  });
  
  it('filters bookings by status', () => {
    // Test implementation
  });
  
  it('handles search functionality', () => {
    // Test implementation
  });
});
```

### **User Acceptance Tests**
- **Booking Management**: User can view, reschedule, and cancel bookings
- **Filtering**: User can filter by status and search by service
- **Responsive Design**: Works on different screen sizes
- **Performance**: Smooth scrolling and quick loading

---

## 🚀 Performance Optimization

### **List Performance**
```javascript
// Virtualized list for large datasets
import { FlatList } from 'react-native';

<FlatList
  data={filteredBookings}
  renderItem={renderBookingCard}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

### **Image Optimization**
```javascript
// Lazy loading for service images
const ServiceImage = ({ serviceId, imageUrl }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <Image
      source={{ uri: imageUrl }}
      onLoad={() => setLoaded(true)}
      style={[styles.serviceImage, !loaded && styles.imagePlaceholder]}
    />
  );
};
```

### **Memory Management**
```javascript
// Cleanup subscriptions
useEffect(() => {
  return () => {
    // Cleanup any subscriptions or timers
    clearTimeout(refreshTimer);
  };
}, []);
```

---

## 🔒 Error Handling

### **Error States**
```javascript
const [error, setError] = useState(null);

const handleError = (error) => {
  console.error('Bookings error:', error);
  setError(error.message);
  showToast('error', 'Something went wrong. Please try again.');
};

// Error boundary component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <ErrorFallback onRetry={() => setHasError(false)} />;
  }
  
  return children;
};
```

### **Offline Support**
```javascript
// Offline data handling
const [isOffline, setIsOffline] = useState(false);

useEffect(() => {
  const handleConnectivityChange = (isConnected) => {
    setIsOffline(!isConnected);
    if (isConnected) {
      refreshBookings();
    }
  };
  
  // Set up connectivity listener
}, []);
```

---

## 📊 Analytics & Tracking

### **User Actions Tracking**
```javascript
const trackBookingAction = (action, bookingId) => {
  analytics.track('booking_action', {
    action,
    bookingId,
    userId: user.uid,
    timestamp: new Date().toISOString()
  });
};

// Track when user views bookings
useEffect(() => {
  analytics.track('screen_view', {
    screen_name: 'bookings',
    user_id: user.uid
  });
}, []);
```

### **Performance Metrics**
```javascript
// Track loading times
const trackLoadingTime = (startTime) => {
  const loadTime = Date.now() - startTime;
  analytics.track('bookings_load_time', {
    loadTime,
    bookingCount: bookings.length
  });
};
```

---

## 🎯 Success Metrics

### **User Engagement**
- **Booking View Rate**: % of users who view their bookings
- **Action Completion Rate**: % of users who complete reschedule/cancel actions
- **Search Usage**: % of users who use search functionality
- **Filter Usage**: % of users who use filter tabs

### **Performance Metrics**
- **Load Time**: Average time to load bookings
- **Scroll Performance**: FPS during scrolling
- **Error Rate**: % of failed actions
- **Crash Rate**: % of app crashes on this screen

### **Business Metrics**
- **Reschedule Rate**: % of bookings that get rescheduled
- **Cancellation Rate**: % of bookings that get cancelled
- **User Satisfaction**: Rating from user feedback
- **Support Tickets**: Number of support requests related to bookings

---

## 🚀 Future Enhancements

### **Phase 2 Features**
- **Calendar Integration**: Sync with device calendar
- **Push Notifications**: Real-time booking updates
- **Advanced Filtering**: Filter by service type, stylist, date range
- **Bulk Actions**: Select multiple bookings for batch operations

### **Advanced Features**
- **AI Recommendations**: Suggest optimal booking times
- **Recurring Bookings**: Set up regular appointments
- **Booking Templates**: Quick booking for frequent services
- **Social Features**: Share bookings with friends

---

## 📝 Implementation Checklist

### **Phase 1: Core Functionality**
- [ ] Set up screen structure and navigation
- [ ] Implement basic booking list display
- [ ] Add status indicators and filtering
- [ ] Create booking card component
- [ ] Add search functionality

### **Phase 2: Advanced Features**
- [ ] Implement reschedule system
- [ ] Add cancellation functionality
- [ ] Create swipe actions
- [ ] Add pull-to-refresh
- [ ] Implement empty states

### **Phase 3: Polish & Optimization**
- [ ] Add animations and transitions
- [ ] Implement responsive design
- [ ] Add error handling
- [ ] Optimize performance
- [ ] Add analytics tracking

### **Phase 4: Testing & Launch**
- [ ] Write unit tests
- [ ] Perform integration testing
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Bug fixes and refinements

---

*This comprehensive plan ensures the Bookings screen provides an excellent user experience while meeting all business requirements and technical standards.*
