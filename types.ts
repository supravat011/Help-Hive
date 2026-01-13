export enum UrgencyLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum HelpType {
  MEDICAL = 'Medical Assistance',
  TRANSPORT = 'Emergency Transport',
  SHELTER = 'Shelter & Safety',
  SUPPLIES = 'Food & Supplies',
  OTHER = 'Other'
}

export enum RequestStatus {
  OPEN = 'OPEN',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface HelpRequest {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  type: HelpType;
  urgency: UrgencyLevel;
  locationName: string;
  coordinates: Coordinates;
  distance?: number; // Calculated client-side for display
  createdAt: number;
  expiresAt: number;
  status: RequestStatus;
  volunteerId?: string;
}

export interface User {
  id: string;
  name: string;
  isVolunteer: boolean;
}
