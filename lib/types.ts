export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  rooms: number;
  petsAllowed: boolean;
  images: string[];
  ownerId: string;
}

export interface PropertyDetails extends Property {
  description: string;
  amenities: string[];
  rules: string[];
  availabilityDate: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  bookings: BookingConfirmation[];
}

export interface OwnerMessage {
  id: string;
  ownerId: string;
  propertyId: string;
  question: string;
  sessionId: string;
  status?: string;
  ownerReply?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface OwnerStatistics {
  properties: {
    overall: number;
  };
  bookings: {
    overall: number;
    pending: number;
    booked: number;
    cancelled: number;
  };
}

export interface SearchPayload {
  location?: string;
  maxPrice?: number;
  rooms?: number;
  petsAllowed?: boolean;
  limit?: number;
}

export interface BookingPayload {
  propertyId: string;
  userContact: string;
  moveInDate: string;
  moveOutDate: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface BookingConfirmation {
  confirmationId: string;
  propertyId: string;
  userContact: string;
  moveInDate: string;
  moveOutDate: string;
  status: BookingStatus;
  createdAt: string;
  userId?: string | null;
  userName?: string | null;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type BookingTimelineCategory =
  | "pending"
  | "upcoming"
  | "current"
  | "past"
  | "cancelled";

export interface BookingListItem {
  confirmationId: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyImage: string;
  propertyPrice?: number;
  propertyRooms?: number;
  propertyPetsAllowed?: boolean;
  propertyAvailabilityDate?: string;
  userContact: string;
  moveInDate: string;
  moveOutDate: string;
  status: BookingStatus;
  createdAt: string;
  userId?: string | null;
  userName?: string | null;
}

export interface OwnerBookingSummary extends BookingListItem {
  bookingId: string;
}

export type UserRole = "USER" | "OWNER";
