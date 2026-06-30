import { Member, Gym, ActivityLog, Payment } from "../types";
import { addDays, subDays, format } from "date-fns";

const today = new Date();

export const mockGym: Gym = {
  id: "gym-1",
  name: "Elite Fitness Studios",
  owner_id: "owner-1",
  status: "approved",
  created_at: subDays(today, 365).toISOString(),
  subscription_status: "active",
  subscription_end_date: addDays(today, 180).toISOString(),
};

export const mockMembers: Member[] = [
  {
    id: "mem-1",
    gym_id: "gym-1",
    name: "Marcus Johnson",
    email: "marcus.j@example.com",
    phone: "+1 555-0101",
    age: 28,
    gender: "Male",
    height: 180,
    weight: 85,
    joining_date: subDays(today, 120).toISOString(),
    membership_plan: "monthly",
    membership_price: 99,
    expiry_date: addDays(today, 20).toISOString(),
    status: "active",
  },
  {
    id: "mem-2",
    gym_id: "gym-1",
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    phone: "+1 555-0102",
    age: 32,
    gender: "Female",
    height: 165,
    weight: 62,
    joining_date: subDays(today, 300).toISOString(),
    membership_plan: "yearly",
    membership_price: 990,
    expiry_date: addDays(today, 3).toISOString(),
    status: "expiring_soon",
  },
  {
    id: "mem-3",
    gym_id: "gym-1",
    name: "Michael Chen",
    email: "michael.c@example.com",
    phone: "+1 555-0103",
    age: 45,
    gender: "Male",
    height: 175,
    weight: 78,
    joining_date: subDays(today, 60).toISOString(),
    membership_plan: "quarterly",
    membership_price: 250,
    expiry_date: subDays(today, 2).toISOString(),
    status: "expired",
  },
  {
    id: "mem-4",
    gym_id: "gym-1",
    name: "Emma Davis",
    email: "emma.d@example.com",
    phone: "+1 555-0104",
    age: 24,
    gender: "Female",
    height: 170,
    weight: 65,
    joining_date: subDays(today, 15).toISOString(),
    membership_plan: "monthly",
    membership_price: 99,
    expiry_date: addDays(today, 15).toISOString(),
    status: "active",
  },
  {
    id: "mem-5",
    gym_id: "gym-1",
    name: "David Smith",
    email: "david.s@example.com",
    phone: "+1 555-0105",
    age: 36,
    gender: "Male",
    height: 185,
    weight: 92,
    joining_date: subDays(today, 180).toISOString(),
    membership_plan: "quarterly",
    membership_price: 250,
    expiry_date: addDays(today, 5).toISOString(),
    status: "expiring_soon",
  }
];

export const mockActivities: ActivityLog[] = [
  {
    id: "act-1",
    gym_id: "gym-1",
    action: "New Member Added",
    description: "Emma Davis joined the gym",
    created_at: subDays(today, 0).toISOString(),
  },
  {
    id: "act-2",
    gym_id: "gym-1",
    action: "Payment Received",
    description: "$250 received from David Smith via Card",
    created_at: subDays(today, 1).toISOString(),
  },
  {
    id: "act-3",
    gym_id: "gym-1",
    action: "Membership Expired",
    description: "Michael Chen's membership expired",
    created_at: subDays(today, 2).toISOString(),
  },
];

export const mockPayments: Payment[] = [
  {
    id: "pay-1",
    gym_id: "gym-1",
    member_id: "mem-1",
    amount: 99,
    payment_method: "card",
    date: subDays(today, 10).toISOString(),
  },
  {
    id: "pay-2",
    gym_id: "gym-1",
    member_id: "mem-2",
    amount: 990,
    payment_method: "bank_transfer",
    date: subDays(today, 362).toISOString(),
  },
  {
    id: "pay-3",
    gym_id: "gym-1",
    member_id: "mem-5",
    amount: 250,
    payment_method: "card",
    date: subDays(today, 85).toISOString(),
  }
];

// Revenue data for charts
export const revenueData = [
  { name: 'Jan', revenue: 4200 },
  { name: 'Feb', revenue: 4800 },
  { name: 'Mar', revenue: 5100 },
  { name: 'Apr', revenue: 4900 },
  { name: 'May', revenue: 5600 },
  { name: 'Jun', revenue: 6200 },
  { name: 'Jul', revenue: 7500 }, // current month
];
