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
}

export interface BookingConfirmation {
  confirmationId: string;
  propertyId: string;
  userContact: string;
  moveInDate: string;
  status: string;
  createdAt: string;
}
