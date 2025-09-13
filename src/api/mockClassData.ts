import { Class, ClassBooking, Trainer, Member } from "../types";

export const mockClasses: Class[] = [
  {
    id: "class-1",
    tenant_id: "t1",
    name: "Morning Yoga",
    type: "Yoga",
    start_time: "2024-06-01T08:00:00Z",
    end_time: "2024-06-01T09:00:00Z",
    location: "Studio A",
    trainer: "Alice Trainer",
    trainer_id: "trainer-1",
    capacity: 20,
    price: 15,
    created_at: "2024-05-01T10:00:00Z",
    description: "A relaxing yoga class to start your day.",
    color: "#A3E635",
  },
  {
    id: "class-2",
    tenant_id: "t1",
    name: "HIIT Blast",
    type: "Cardio",
    start_time: "2024-06-01T10:00:00Z",
    end_time: "2024-06-01T11:00:00Z",
    location: "Studio B",
    trainer: "Bob Coach",
    trainer_id: "trainer-2",
    capacity: 15,
    price: 20,
    created_at: "2024-05-02T10:00:00Z",
    description: "High-intensity interval training for all levels.",
    color: "#38BDF8",
  },
  {
    id: "class-3",
    tenant_id: "t1",
    name: "Strength 101",
    type: "Strength",
    start_time: "2024-06-01T12:00:00Z",
    end_time: "2024-06-01T13:00:00Z",
    location: "Studio C",
    trainer: "Charlie Strong",
    trainer_id: "trainer-3",
    capacity: 12,
    price: 18,
    created_at: "2024-05-03T10:00:00Z",
    description: "Build foundational strength with expert guidance.",
    color: "#FBBF24",
  },
];

export const mockBookings: ClassBooking[] = [
  {
    id: "booking-1",
    class_id: "class-1",
    member_id: "member-1",
    status: "booked",
    created_at: "2024-05-30T10:00:00Z",
  },
  {
    id: "booking-2",
    class_id: "class-2",
    member_id: "member-2",
    status: "attended",
    created_at: "2024-05-30T11:00:00Z",
  },
  {
    id: "booking-3",
    class_id: "class-3",
    member_id: "member-3",
    status: "cancelled",
    created_at: "2024-05-30T12:00:00Z",
  },
];

export const mockTrainers: Trainer[] = [
  {
    id: "trainer-1",
    tenant_id: "t1",
    name: "Alice Trainer",
    email: "alice@fit.com",
    phone: "+1234567890",
    status: "active",
    specialties: ["Yoga"],
    bio: "Certified yoga instructor with 10 years experience.",
    profile_image_url: "",
    hourly_rate: 40,
    rating: 4.9,
    created_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "trainer-2",
    tenant_id: "t1",
    name: "Bob Coach",
    email: "bob@fit.com",
    phone: "+1234567891",
    status: "active",
    specialties: ["Cardio", "HIIT"],
    bio: "HIIT and cardio specialist.",
    profile_image_url: "",
    hourly_rate: 45,
    rating: 4.7,
    created_at: "2024-01-02T10:00:00Z",
  },
  {
    id: "trainer-3",
    tenant_id: "t1",
    name: "Charlie Strong",
    email: "charlie@fit.com",
    phone: "+1234567892",
    status: "active",
    specialties: ["Strength"],
    bio: "Strength coach and powerlifter.",
    profile_image_url: "",
    hourly_rate: 50,
    rating: 4.8,
    created_at: "2024-01-03T10:00:00Z",
  },
];

export const mockMembers: Member[] = [
  {
    id: "member-1",
    tenant_id: "t1",
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1111111111",
    status: "active",
    membership_type: "Premium",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-05-01T10:00:00Z",
  },
  {
    id: "member-2",
    tenant_id: "t1",
    name: "John Smith",
    email: "john@example.com",
    phone: "+2222222222",
    status: "active",
    membership_type: "Standard",
    created_at: "2024-01-02T10:00:00Z",
    updated_at: "2024-05-02T10:00:00Z",
  },
  {
    id: "member-3",
    tenant_id: "t1",
    name: "Emily Lee",
    email: "emily@example.com",
    phone: "+3333333333",
    status: "inactive",
    membership_type: "Basic",
    created_at: "2024-01-03T10:00:00Z",
    updated_at: "2024-05-03T10:00:00Z",
  },
];

// Mock billing summary data
export const mockBillingData = {
  totalRevenue: 12000,
  monthlyRevenue: 2500,
  pendingInvoices: 3,
  totalExpenses: 4200,
  revenueGrowth: 8.5,
  expenseGrowth: 2.1,
};

// Mock invoices
export const mockInvoices = [
  { amount: 1000, status: "paid", created_at: "2024-06-01T10:00:00Z" },
  { amount: 1200, status: "paid", created_at: "2024-06-10T10:00:00Z" },
  { amount: 800, status: "pending", created_at: "2024-06-15T10:00:00Z" },
  { amount: 500, status: "paid", created_at: "2024-05-20T10:00:00Z" },
  { amount: 700, status: "pending", created_at: "2024-06-18T10:00:00Z" },
  { amount: 900, status: "paid", created_at: "2024-05-10T10:00:00Z" },
];

// Mock expenses
export const mockExpenses = [
  { amount: 400, created_at: "2024-06-02T10:00:00Z" },
  { amount: 600, created_at: "2024-06-12T10:00:00Z" },
  { amount: 300, created_at: "2024-05-22T10:00:00Z" },
  { amount: 500, created_at: "2024-06-16T10:00:00Z" },
  { amount: 700, created_at: "2024-05-12T10:00:00Z" },
  { amount: 800, created_at: "2024-06-20T10:00:00Z" },
];
