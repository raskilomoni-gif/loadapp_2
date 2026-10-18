export type UserRole = 'shipper' | 'driver';

export interface UserProfile {
  userId: string;
  role: UserRole;
  displayName: string;
  companyName?: string;
  phone?: string;
  whatsapp?: string;
  email: string;
  idNumber?: string;
  idPhotoUrl?: string;
  maxListings: number;
  homeLat?: number;
  homeLng?: number;
  homeAddress?: string;
}
