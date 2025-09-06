/**
 * Salon 16 - Icon System
 * Service-specific icons and UI icons
 */

import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';

// Service category icons
export const ServiceIcons = {
  // Hair services
  haircut: {
    name: 'scissors',
    type: 'Ionicons',
    size: 24,
  },
  coloring: {
    name: 'color-palette',
    type: 'Ionicons',
    size: 24,
  },
  styling: {
    name: 'brush',
    type: 'Ionicons',
    size: 24,
  },
  treatment: {
    name: 'spa',
    type: 'MaterialIcons',
    size: 24,
  },
  
  // Beauty services
  manicure: {
    name: 'hand-holding-heart',
    type: 'FontAwesome5',
    size: 20,
  },
  pedicure: {
    name: 'foot-prints',
    type: 'FontAwesome5',
    size: 20,
  },
  massage: {
    name: 'hands',
    type: 'FontAwesome5',
    size: 20,
  },
  piercing: {
    name: 'gem',
    type: 'FontAwesome5',
    size: 20,
  },
  
  // General services
  consultation: {
    name: 'chatbubbles',
    type: 'Ionicons',
    size: 24,
  },
  package: {
    name: 'gift',
    type: 'Ionicons',
    size: 24,
  },
  special: {
    name: 'star',
    type: 'Ionicons',
    size: 24,
  },
};

// UI icons
export const UIIcons = {
  // Navigation
  home: {
    name: 'home',
    type: 'Ionicons',
    size: 24,
  },
  bookings: {
    name: 'calendar',
    type: 'Ionicons',
    size: 24,
  },
  reviews: {
    name: 'star',
    type: 'Ionicons',
    size: 24,
  },
  profile: {
    name: 'person',
    type: 'Ionicons',
    size: 24,
  },
  
  // Actions
  add: {
    name: 'add',
    type: 'Ionicons',
    size: 24,
  },
  edit: {
    name: 'create',
    type: 'Ionicons',
    size: 24,
  },
  delete: {
    name: 'trash',
    type: 'Ionicons',
    size: 24,
  },
  save: {
    name: 'save',
    type: 'Ionicons',
    size: 24,
  },
  cancel: {
    name: 'close',
    type: 'Ionicons',
    size: 24,
  },
  confirm: {
    name: 'checkmark',
    type: 'Ionicons',
    size: 24,
  },
  
  // Booking actions
  book: {
    name: 'bookmark',
    type: 'Ionicons',
    size: 24,
  },
  reschedule: {
    name: 'refresh',
    type: 'Ionicons',
    size: 24,
  },
  cancelBooking: {
    name: 'close-circle',
    type: 'Ionicons',
    size: 24,
  },
  complete: {
    name: 'checkmark-circle',
    type: 'Ionicons',
    size: 24,
  },
  
  // Status icons
  pending: {
    name: 'time',
    type: 'Ionicons',
    size: 24,
  },
  accepted: {
    name: 'checkmark-circle',
    type: 'Ionicons',
    size: 24,
  },
  rejected: {
    name: 'close-circle',
    type: 'Ionicons',
    size: 24,
  },
  completed: {
    name: 'checkmark-done-circle',
    type: 'Ionicons',
    size: 24,
  },
  cancelled: {
    name: 'ban',
    type: 'Ionicons',
    size: 24,
  },
  
  // Communication
  notification: {
    name: 'notifications',
    type: 'Ionicons',
    size: 24,
  },
  message: {
    name: 'chatbubble',
    type: 'Ionicons',
    size: 24,
  },
  call: {
    name: 'call',
    type: 'Ionicons',
    size: 24,
  },
  email: {
    name: 'mail',
    type: 'Ionicons',
    size: 24,
  },
  
  // Media
  camera: {
    name: 'camera',
    type: 'Ionicons',
    size: 24,
  },
  gallery: {
    name: 'images',
    type: 'Ionicons',
    size: 24,
  },
  image: {
    name: 'image',
    type: 'Ionicons',
    size: 24,
  },
  
  // Settings
  settings: {
    name: 'settings',
    type: 'Ionicons',
    size: 24,
  },
  preferences: {
    name: 'options',
    type: 'Ionicons',
    size: 24,
  },
  logout: {
    name: 'log-out',
    type: 'Ionicons',
    size: 24,
  },
  
  // Time and date
  clock: {
    name: 'time',
    type: 'Ionicons',
    size: 24,
  },
  calendar: {
    name: 'calendar',
    type: 'Ionicons',
    size: 24,
  },
  today: {
    name: 'today',
    type: 'Ionicons',
    size: 24,
  },
  
  // Rating and reviews
  star: {
    name: 'star',
    type: 'Ionicons',
    size: 24,
  },
  starOutline: {
    name: 'star-outline',
    type: 'Ionicons',
    size: 24,
  },
  starHalf: {
    name: 'star-half',
    type: 'Ionicons',
    size: 24,
  },
  heart: {
    name: 'heart',
    type: 'Ionicons',
    size: 24,
  },
  heartOutline: {
    name: 'heart-outline',
    type: 'Ionicons',
    size: 24,
  },
  
  // Location and contact
  location: {
    name: 'location',
    type: 'Ionicons',
    size: 24,
  },
  phone: {
    name: 'call',
    type: 'Ionicons',
    size: 24,
  },
  website: {
    name: 'globe',
    type: 'Ionicons',
    size: 24,
  },
  
  // Payment and pricing
  price: {
    name: 'cash',
    type: 'Ionicons',
    size: 24,
  },
  discount: {
    name: 'pricetag',
    type: 'Ionicons',
    size: 24,
  },
  offer: {
    name: 'gift',
    type: 'Ionicons',
    size: 24,
  },
  
  // Admin specific
  dashboard: {
    name: 'grid',
    type: 'Ionicons',
    size: 24,
  },
  analytics: {
    name: 'analytics',
    type: 'Ionicons',
    size: 24,
  },
  users: {
    name: 'people',
    type: 'Ionicons',
    size: 24,
  },
  services: {
    name: 'list',
    type: 'Ionicons',
    size: 24,
  },
  reports: {
    name: 'document-text',
    type: 'Ionicons',
    size: 24,
  },
};

// Icon component factory
export const createIcon = (iconConfig, color, size) => {
  const { name, type, size: defaultSize } = iconConfig;
  const iconSize = size || defaultSize;
  
  switch (type) {
    case 'Ionicons':
      return <Ionicons name={name} size={iconSize} color={color} />;
    case 'MaterialIcons':
      return <MaterialIcons name={name} size={iconSize} color={color} />;
    case 'FontAwesome5':
      return <FontAwesome5 name={name} size={iconSize} color={color} />;
    default:
      return <Ionicons name="help" size={iconSize} color={color} />;
  }
};

// Service icon helper
export const getServiceIcon = (serviceType, color, size) => {
  const iconConfig = ServiceIcons[serviceType] || ServiceIcons.consultation;
  return createIcon(iconConfig, color, size);
};

// UI icon helper
export const getUIIcon = (iconName, color, size) => {
  const iconConfig = UIIcons[iconName] || UIIcons.help;
  return createIcon(iconConfig, color, size);
};

export default {
  ServiceIcons,
  UIIcons,
  createIcon,
  getServiceIcon,
  getUIIcon,
};
