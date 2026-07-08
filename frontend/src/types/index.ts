export type UserRole = 'super_admin' | 'gym_owner';

export type GymStatus = 'pending' | 'approved' | 'suspended';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  gym_id?: string;
  created_at: string;
}

export interface Gym {
  id: string;
  name: string;
  owner_id: string;
  status: GymStatus;
  created_at: string;
  subscription_status: 'active' | 'expired' | 'suspended';
  subscription_end_date: string;
}

export interface Member {
  id: string;
  gym_id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  height: number; // cm
  weight: number; // kg
  joining_date: string;
  membership_plan: 'monthly' | 'quarterly' | 'yearly' | 'custom' | string;
  membership_duration?: string; // duration in months or text
  membership_price: number;
  start_date?: string;
  expiry_date: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'suspended';
  profile_photo_url?: string;
  notes?: string;
  emergency_contact?: string;
  address?: string;
  medical_notes?: string;
  additional_notes?: string;
  is_archived?: boolean;
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  amount: number;
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer';
  date: string;
}

export interface ActivityLog {
  id: string;
  gym_id: string;
  action: string;
  description: string;
  created_at: string;
}
