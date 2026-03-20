export type UserRole = 'resident' | 'guard' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  societyId: string;
  houseNumber?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface PreApproval {
  id: string;
  residentUid: string;
  societyId: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  vehicleNumber: string;
  vehicleType: 'car' | 'bike' | 'other' | 'none';
  expectedArrival: string;
  isRecurring: boolean;
  numberOfPeople: number;
  status: 'pending' | 'used' | 'cancelled';
  createdAt: string;
}

export interface VisitorLog {
  id: string;
  societyId: string;
  preApprovalId?: string;
  visitorName: string;
  visitorPhone: string;
  vehicleNumber: string;
  vehicleType: string;
  houseNumber: string;
  residentUid: string;
  entryTime: string;
  exitTime?: string;
  photoUrl?: string;
  guardUid: string;
  status: 'in' | 'out';
}

export interface Society {
  id: string;
  name: string;
  location: string;
  adminUid: string;
}
