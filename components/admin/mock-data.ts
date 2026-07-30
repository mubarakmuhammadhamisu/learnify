// Mock data for admin dashboard — all hardcoded for now.
// Will be replaced with real Supabase API calls when backend is fully integrated.
// All interfaces are 100% swappable with the real Supabase schema.

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  lastLogin: string;
  enrollmentCount: number;
  amountPaid: number;
  referralCount: number;
  isBanned: boolean;
  credit_balance: number;
  lifetime_points: number;
  referrals_sent: number;
  referrals_converted: number;
  total_commission_earned: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  premiumPrice?: number;
  enrolledCount: number;
  totalRevenue: number;
  published: boolean;
  lessonsCount: number;
  completionRate: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  dateEnrolled: string;
  progress: number;
  completionDate?: string;
  couponUsed?: string;
  paymentType: 'free' | 'paid';
  status: 'in-progress' | 'completed' | 'dropped';
  learning_points: number;
  referral_triggered: boolean;
  referrer_name: string | null;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  amount: number;
  currency: string;
  reference: string;
  coupon?: string;
  date: string;
  status: 'success' | 'failed' | 'pending';
  credits_applied: number;
  credits_value_ngn: number;
  net_amount: number;
  referral_id: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  timesUsed: number;
  maxUses: number;
  expiryDate: string;
  active: boolean;
  createdDate: string;
}

export interface Leaderboard {
  id: string;
  position: number;
  studentName: string;
  studentId: string;
  lifetime_points: number;
  credit_balance: number;
  courses_completed: number;
  courses_in_progress: number;
  learning_points: number;
  points: number;
  coursesCompleted: number;
}

export type ReferralStatus = 'pending' | 'converted';

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referrer_name: string;
  referee_id: string;
  referee_name: string;
  referee_email: string;
  referral_code: string;
  created_at: string;
  status: ReferralStatus;
  converted_at: string | null;
  commission_credits: number;
  triggering_payment_id: string | null;
  triggering_payment_amount: number | null;
  admin_notes: string | null;
  manually_converted: boolean;
}

export type PointTxnType =
  | 'referral_commission'
  | 'manual_credit'
  | 'manual_deduction'
  | 'redemption'
  | 'expiry';

export interface PointTransaction {
  id: string;
  student_id: string;
  type: PointTxnType;
  amount: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  created_at: string;
  created_by: string;
}

export interface StudentPointSummary {
  student_id: string;
  student_name: string;
  credit_balance: number;
  lifetime_points: number;
  learning_points: number;
  transactions: PointTransaction[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function deriveLearningPoints(progress: number): number {
  if (progress === 100) return 800;
  if (progress > 0) return 200;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

export const mockStudents: Student[] = [
  { id: '1',  name: 'Amina Hassan',     email: 'amina.hassan@email.com',     joinDate: '2024-01-15', lastLogin: '2024-04-20', enrollmentCount: 3, amountPaid: 45000, referralCount: 2, isBanned: false, credit_balance: 3000,  lifetime_points: 5000,  referrals_sent: 3, referrals_converted: 2, total_commission_earned: 5000 },
  { id: '2',  name: 'Ibrahim Musa',     email: 'ibrahim.musa@email.com',     joinDate: '2024-01-20', lastLogin: '2024-02-10', enrollmentCount: 2, amountPaid: 30000, referralCount: 0, isBanned: false, credit_balance: 0,     lifetime_points: 0,     referrals_sent: 0, referrals_converted: 0, total_commission_earned: 0 },
  { id: '3',  name: 'Zainab Adeyemi',   email: 'zainab.adeyemi@email.com',   joinDate: '2024-02-10', lastLogin: '2024-04-18', enrollmentCount: 4, amountPaid: 60000, referralCount: 3, isBanned: false, credit_balance: 7500,  lifetime_points: 10000, referrals_sent: 5, referrals_converted: 4, total_commission_earned: 10000 },
  { id: '4',  name: 'Chukwu Okonkwo',  email: 'chukwu.okonkwo@email.com',   joinDate: '2024-02-15', lastLogin: '2024-01-15', enrollmentCount: 1, amountPaid: 15000, referralCount: 1, isBanned: false, credit_balance: 1500,  lifetime_points: 1500,  referrals_sent: 2, referrals_converted: 1, total_commission_earned: 1500 },
  { id: '5',  name: 'Fatima Mohammed',  email: 'fatima.mohammed@email.com',  joinDate: '2024-03-01', lastLogin: '2024-04-19', enrollmentCount: 3, amountPaid: 45000, referralCount: 2, isBanned: false, credit_balance: 2500,  lifetime_points: 2500,  referrals_sent: 2, referrals_converted: 1, total_commission_earned: 2500 },
  { id: '6',  name: 'Chisom Eze',       email: 'chisom.eze@email.com',       joinDate: '2024-03-10', lastLogin: '2024-03-20', enrollmentCount: 2, amountPaid: 30000, referralCount: 0, isBanned: false, credit_balance: 0,     lifetime_points: 0,     referrals_sent: 0, referrals_converted: 0, total_commission_earned: 0 },
  { id: '7',  name: 'Aisha Bello',      email: 'aisha.bello@email.com',      joinDate: '2024-03-15', lastLogin: '2024-04-22', enrollmentCount: 5, amountPaid: 75000, referralCount: 4, isBanned: false, credit_balance: 12000, lifetime_points: 15000, referrals_sent: 6, referrals_converted: 5, total_commission_earned: 15000 },
  { id: '8',  name: 'Tunde Oluwafemi', email: 'tunde.oluwafemi@email.com',  joinDate: '2024-03-20', lastLogin: '2024-02-05', enrollmentCount: 2, amountPaid: 30000, referralCount: 1, isBanned: false, credit_balance: 500,   lifetime_points: 1000,  referrals_sent: 1, referrals_converted: 1, total_commission_earned: 1000 },
  { id: '9',  name: 'Mariam Suleiman',  email: 'mariam.suleiman@email.com',  joinDate: '2024-04-01', lastLogin: '2024-04-21', enrollmentCount: 3, amountPaid: 45000, referralCount: 2, isBanned: false, credit_balance: 4000,  lifetime_points: 4000,  referrals_sent: 2, referrals_converted: 2, total_commission_earned: 4000 },
  { id: '10', name: 'Eze Nwankwo',      email: 'eze.nwankwo@email.com',      joinDate: '2024-04-05', lastLogin: '2024-04-10', enrollmentCount: 1, amountPaid: 15000, referralCount: 0, isBanned: true,  credit_balance: 0,     lifetime_points: 0,     referrals_sent: 0, referrals_converted: 0, total_commission_earned: 0 },
  { id: '11', name: 'Halima Abdullahi', email: 'halima.abdullahi@email.com', joinDate: '2024-04-10', lastLogin: '2024-04-23', enrollmentCount: 4, amountPaid: 60000, referralCount: 3, isBanned: false, credit_balance: 6000,  lifetime_points: 7500,  referrals_sent: 4, referrals_converted: 3, total_commission_earned: 7500 },
  { id: '12', name: 'Segun Adebayo',    email: 'segun.adebayo@email.com',    joinDate: '2024-04-15', lastLogin: '2024-03-10', enrollmentCount: 2, amountPaid: 30000, referralCount: 1, isBanned: false, credit_balance: 0,     lifetime_points: 2500,  referrals_sent: 1, referrals_converted: 1, total_commission_earned: 2500 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK COURSES
// ─────────────────────────────────────────────────────────────────────────────

export const mockCourses: Course[] = [
  { id: '1', slug: 'intro-web-development',     title: 'Introduction to Web Development',        description: 'Learn the basics of HTML, CSS, and JavaScript',    price: 15000, enrolledCount: 234, totalRevenue: 3510000, published: true,  lessonsCount: 24, completionRate: 78 },
  { id: '2', slug: 'advanced-react-mastery',     title: 'Advanced React.js Mastery',              description: 'Master advanced React patterns and optimization',   price: 25000, enrolledCount: 156, totalRevenue: 3900000, published: true,  lessonsCount: 32, completionRate: 82 },
  { id: '3', slug: 'fullstack-nextjs',           title: 'Full-Stack Web Development with Next.js',description: 'Build modern full-stack applications',              price: 30000, enrolledCount: 89,  totalRevenue: 2670000, published: true,  lessonsCount: 40, completionRate: 71 },
  { id: '4', slug: 'mobile-react-native',        title: 'Mobile App Development with React Native',description: 'Create cross-platform mobile applications',        price: 28000, enrolledCount: 67,  totalRevenue: 1876000, published: true,  lessonsCount: 36, completionRate: 65 },
  { id: '5', slug: 'data-science-python',        title: 'Data Science with Python',               description: 'Learn data analysis and machine learning basics',   price: 35000, enrolledCount: 45,  totalRevenue: 1575000, published: true,  lessonsCount: 28, completionRate: 58 },
  { id: '6', slug: 'devops-cloud-deployment',    title: 'DevOps and Cloud Deployment',            description: 'Master Docker, Kubernetes, and AWS',               price: 32000, enrolledCount: 34,  totalRevenue: 1088000, published: false, lessonsCount: 30, completionRate: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK ENROLLMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const mockEnrollments: Enrollment[] = [
  { id: '1',  studentId: '1', studentName: 'Amina Hassan',    courseId: '1', courseName: 'Introduction to Web Development',         dateEnrolled: '2024-01-20', progress: 100, completionDate: '2024-03-15', couponUsed: 'SAVE10',     paymentType: 'paid', status: 'completed',  learning_points: deriveLearningPoints(100), referral_triggered: false, referrer_name: null },
  { id: '2',  studentId: '1', studentName: 'Amina Hassan',    courseId: '2', courseName: 'Advanced React.js Mastery',               dateEnrolled: '2024-03-20', progress: 65,                                                        paymentType: 'paid', status: 'in-progress', learning_points: deriveLearningPoints(65),  referral_triggered: false, referrer_name: null },
  { id: '3',  studentId: '2', studentName: 'Ibrahim Musa',    courseId: '1', courseName: 'Introduction to Web Development',         dateEnrolled: '2024-01-25', progress: 45,                               couponUsed: 'WELCOME20', paymentType: 'paid', status: 'in-progress', learning_points: deriveLearningPoints(45),  referral_triggered: true,  referrer_name: 'Zainab Adeyemi' },
  { id: '4',  studentId: '3', studentName: 'Zainab Adeyemi',  courseId: '2', courseName: 'Advanced React.js Mastery',               dateEnrolled: '2024-02-15', progress: 100, completionDate: '2024-04-10',                           paymentType: 'paid', status: 'completed',  learning_points: deriveLearningPoints(100), referral_triggered: false, referrer_name: null },
  { id: '5',  studentId: '3', studentName: 'Zainab Adeyemi',  courseId: '3', courseName: 'Full-Stack Web Development with Next.js', dateEnrolled: '2024-04-11', progress: 80,                               couponUsed: 'SAVE10',     paymentType: 'paid', status: 'in-progress', learning_points: deriveLearningPoints(80),  referral_triggered: false, referrer_name: null },
  { id: '6',  studentId: '4', studentName: 'Chukwu Okonkwo', courseId: '1', courseName: 'Introduction to Web Development',         dateEnrolled: '2024-02-20', progress: 30,                                                        paymentType: 'free', status: 'in-progress', learning_points: deriveLearningPoints(30),  referral_triggered: true,  referrer_name: 'Aisha Bello' },
  { id: '7',  studentId: '5', studentName: 'Fatima Mohammed', courseId: '4', courseName: 'Mobile App Development with React Native', dateEnrolled: '2024-03-05', progress: 100, completionDate: '2024-04-12', couponUsed: 'LEARNING50', paymentType: 'paid', status: 'completed',  learning_points: deriveLearningPoints(100), referral_triggered: false, referrer_name: null },
  { id: '8',  studentId: '6', studentName: 'Chisom Eze',      courseId: '5', courseName: 'Data Science with Python',                dateEnrolled: '2024-03-15', progress: 50,                                                        paymentType: 'paid', status: 'in-progress', learning_points: deriveLearningPoints(50),  referral_triggered: false, referrer_name: null },
  { id: '9',  studentId: '7', studentName: 'Aisha Bello',     courseId: '2', courseName: 'Advanced React.js Mastery',               dateEnrolled: '2024-03-20', progress: 100, completionDate: '2024-04-18',                           paymentType: 'paid', status: 'completed',  learning_points: deriveLearningPoints(100), referral_triggered: false, referrer_name: null },
  { id: '10', studentId: '7', studentName: 'Aisha Bello',     courseId: '3', courseName: 'Full-Stack Web Development with Next.js', dateEnrolled: '2024-04-19', progress: 35,                               couponUsed: 'SAVE10',     paymentType: 'paid', status: 'in-progress', learning_points: deriveLearningPoints(35),  referral_triggered: false, referrer_name: null },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const mockPayments: Payment[] = [
  { id: '1',  studentId: '1', studentName: 'Amina Hassan',    courseId: '1', courseName: 'Introduction to Web Development',          amount: 15000, currency: 'NGN', reference: 'PSK_001', coupon: 'SAVE10',     date: '2024-01-20', status: 'success', credits_applied: 1500, credits_value_ngn: 1500, net_amount: 13500, referral_id: null },
  { id: '2',  studentId: '1', studentName: 'Amina Hassan',    courseId: '2', courseName: 'Advanced React.js Mastery',                amount: 25000, currency: 'NGN', reference: 'PSK_002',                       date: '2024-03-20', status: 'success', credits_applied: 0,    credits_value_ngn: 0,    net_amount: 25000, referral_id: null },
  { id: '3',  studentId: '2', studentName: 'Ibrahim Musa',    courseId: '1', courseName: 'Introduction to Web Development',          amount: 15000, currency: 'NGN', reference: 'PSK_003', coupon: 'WELCOME20', date: '2024-01-25', status: 'success', credits_applied: 0,    credits_value_ngn: 0,    net_amount: 12000, referral_id: 'ref-002' },
  { id: '4',  studentId: '3', studentName: 'Zainab Adeyemi',  courseId: '2', courseName: 'Advanced React.js Mastery',                amount: 25000, currency: 'NGN', reference: 'PSK_004',                       date: '2024-02-15', status: 'success', credits_applied: 0,    credits_value_ngn: 0,    net_amount: 25000, referral_id: null },
  { id: '5',  studentId: '3', studentName: 'Zainab Adeyemi',  courseId: '3', courseName: 'Full-Stack Web Development with Next.js',  amount: 30000, currency: 'NGN', reference: 'PSK_005', coupon: 'SAVE10',     date: '2024-04-11', status: 'success', credits_applied: 3000, credits_value_ngn: 3000, net_amount: 27000, referral_id: null },
  { id: '6',  studentId: '4', studentName: 'Chukwu Okonkwo', courseId: '1', courseName: 'Introduction to Web Development',          amount: 0,     currency: 'NGN', reference: 'FREE_001',                      date: '2024-02-20', status: 'success', credits_applied: 0,    credits_value_ngn: 0,    net_amount: 0,     referral_id: 'ref-001' },
  { id: '7',  studentId: '5', studentName: 'Fatima Mohammed', courseId: '4', courseName: 'Mobile App Development with React Native', amount: 28000, currency: 'NGN', reference: 'PSK_006', coupon: 'LEARNING50', date: '2024-03-05', status: 'success', credits_applied: 2500, credits_value_ngn: 2500, net_amount: 14000, referral_id: null },
  { id: '8',  studentId: '6', studentName: 'Chisom Eze',      courseId: '5', courseName: 'Data Science with Python',                amount: 35000, currency: 'NGN', reference: 'PSK_007',                       date: '2024-03-15', status: 'success', credits_applied: 0,    credits_value_ngn: 0,    net_amount: 35000, referral_id: null },
  { id: '9',  studentId: '7', studentName: 'Aisha Bello',     courseId: '2', courseName: 'Advanced React.js Mastery',                amount: 25000, currency: 'NGN', reference: 'PSK_008',                       date: '2024-03-20', status: 'success', credits_applied: 0,    credits_value_ngn: 0,    net_amount: 25000, referral_id: null },
  { id: '10', studentId: '7', studentName: 'Aisha Bello',     courseId: '3', courseName: 'Full-Stack Web Development with Next.js',  amount: 30000, currency: 'NGN', reference: 'PSK_009', coupon: 'SAVE10',     date: '2024-04-19', status: 'success', credits_applied: 0,    credits_value_ngn: 0,    net_amount: 27000, referral_id: null },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK COUPONS
// ─────────────────────────────────────────────────────────────────────────────

export const mockCoupons: Coupon[] = [
  { id: '1', code: 'SAVE10',      discountPercentage: 10, timesUsed: 45, maxUses: 100, expiryDate: '2024-12-31', active: true, createdDate: '2024-01-01' },
  { id: '2', code: 'WELCOME20',   discountPercentage: 20, timesUsed: 28, maxUses: 50,  expiryDate: '2024-06-30', active: true, createdDate: '2024-01-01' },
  { id: '3', code: 'LEARNING50',  discountPercentage: 50, timesUsed: 12, maxUses: 25,  expiryDate: '2024-05-31', active: true, createdDate: '2024-02-01' },
  { id: '4', code: 'EARLYBIRD',   discountPercentage: 30, timesUsed: 67, maxUses: 100, expiryDate: '2024-12-31', active: true, createdDate: '2024-01-15' },
  { id: '5', code: 'STUDENTDEAL', discountPercentage: 25, timesUsed: 34, maxUses: 80,  expiryDate: '2024-08-31', active: true, createdDate: '2024-02-15' },
  { id: '6', code: 'NEWLAUNCHED', discountPercentage: 15, timesUsed: 8,  maxUses: 200, expiryDate: '2024-09-30', active: true, createdDate: '2024-04-01' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK LEADERBOARD
// learning_points = (courses_completed × 800) + (courses_in_progress × 200)
// ─────────────────────────────────────────────────────────────────────────────

export const mockLeaderboard: Leaderboard[] = [
  { id: '7',  position: 1,  studentId: '7',  studentName: 'Aisha Bello',      lifetime_points: 15000, credit_balance: 12000, courses_completed: 2, courses_in_progress: 1, learning_points: 1800, points: 15000, coursesCompleted: 2 },
  { id: '3',  position: 2,  studentId: '3',  studentName: 'Zainab Adeyemi',   lifetime_points: 10000, credit_balance: 7500,  courses_completed: 2, courses_in_progress: 1, learning_points: 1800, points: 10000, coursesCompleted: 2 },
  { id: '11', position: 3,  studentId: '11', studentName: 'Halima Abdullahi', lifetime_points: 7500,  credit_balance: 6000,  courses_completed: 1, courses_in_progress: 2, learning_points: 1200, points: 7500,  coursesCompleted: 1 },
  { id: '1',  position: 4,  studentId: '1',  studentName: 'Amina Hassan',     lifetime_points: 5000,  credit_balance: 3000,  courses_completed: 1, courses_in_progress: 1, learning_points: 1000, points: 5000,  coursesCompleted: 1 },
  { id: '9',  position: 5,  studentId: '9',  studentName: 'Mariam Suleiman',  lifetime_points: 4000,  credit_balance: 4000,  courses_completed: 0, courses_in_progress: 2, learning_points: 400,  points: 4000,  coursesCompleted: 0 },
  { id: '5',  position: 6,  studentId: '5',  studentName: 'Fatima Mohammed',  lifetime_points: 2500,  credit_balance: 2500,  courses_completed: 1, courses_in_progress: 0, learning_points: 800,  points: 2500,  coursesCompleted: 1 },
  { id: '12', position: 7,  studentId: '12', studentName: 'Segun Adebayo',    lifetime_points: 2500,  credit_balance: 0,     courses_completed: 0, courses_in_progress: 1, learning_points: 200,  points: 2500,  coursesCompleted: 0 },
  { id: '4',  position: 8,  studentId: '4',  studentName: 'Chukwu Okonkwo',  lifetime_points: 1500,  credit_balance: 1500,  courses_completed: 0, courses_in_progress: 1, learning_points: 200,  points: 1500,  coursesCompleted: 0 },
  { id: '8',  position: 9,  studentId: '8',  studentName: 'Tunde Oluwafemi', lifetime_points: 1000,  credit_balance: 500,   courses_completed: 0, courses_in_progress: 1, learning_points: 200,  points: 1000,  coursesCompleted: 0 },
  { id: '6',  position: 10, studentId: '6',  studentName: 'Chisom Eze',       lifetime_points: 0,     credit_balance: 0,     courses_completed: 0, courses_in_progress: 1, learning_points: 200,  points: 0,     coursesCompleted: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK REFERRALS
// ─────────────────────────────────────────────────────────────────────────────

export const mockReferrals: ReferralRecord[] = [
  { id: 'ref-001', referrer_id: '7',  referrer_name: 'Aisha Bello',      referee_id: '4',  referee_name: 'Chukwu Okonkwo',  referee_email: 'chukwu.okonkwo@email.com',   referral_code: 'AISH-B7K2', created_at: '2024-02-18T09:00:00Z', status: 'converted', converted_at: '2024-02-20T11:30:00Z', commission_credits: 1500, triggering_payment_id: '6',  triggering_payment_amount: 15000, admin_notes: null,                                            manually_converted: false },
  { id: 'ref-002', referrer_id: '3',  referrer_name: 'Zainab Adeyemi',   referee_id: '2',  referee_name: 'Ibrahim Musa',    referee_email: 'ibrahim.musa@email.com',     referral_code: 'ZAIN-A3P7', created_at: '2024-01-22T14:10:00Z', status: 'converted', converted_at: '2024-01-25T10:00:00Z', commission_credits: 1500, triggering_payment_id: '3',  triggering_payment_amount: 15000, admin_notes: null,                                            manually_converted: false },
  { id: 'ref-003', referrer_id: '1',  referrer_name: 'Amina Hassan',     referee_id: '9',  referee_name: 'Mariam Suleiman', referee_email: 'mariam.suleiman@email.com',   referral_code: 'AMIN-H1Q4', created_at: '2024-03-28T16:00:00Z', status: 'pending',   converted_at: null,                   commission_credits: 0,    triggering_payment_id: null, triggering_payment_amount: null,  admin_notes: 'Registered but no purchase yet.',               manually_converted: false },
  { id: 'ref-004', referrer_id: '7',  referrer_name: 'Aisha Bello',      referee_id: '5',  referee_name: 'Fatima Mohammed', referee_email: 'fatima.mohammed@email.com',   referral_code: 'AISH-B7K2', created_at: '2024-02-28T08:00:00Z', status: 'converted', converted_at: '2024-03-05T09:00:00Z', commission_credits: 2800, triggering_payment_id: '7',  triggering_payment_amount: 28000, admin_notes: null,                                            manually_converted: false },
  { id: 'ref-005', referrer_id: '11', referrer_name: 'Halima Abdullahi', referee_id: '6',  referee_name: 'Chisom Eze',      referee_email: 'chisom.eze@email.com',       referral_code: 'HALI-A4M8', created_at: '2024-03-12T10:00:00Z', status: 'converted', converted_at: '2024-03-15T11:00:00Z', commission_credits: 3500, triggering_payment_id: '8',  triggering_payment_amount: 35000, admin_notes: null,                                            manually_converted: false },
  { id: 'ref-006', referrer_id: '3',  referrer_name: 'Zainab Adeyemi',   referee_id: '12', referee_name: 'Segun Adebayo',   referee_email: 'segun.adebayo@email.com',    referral_code: 'ZAIN-A3P7', created_at: '2024-04-12T07:00:00Z', status: 'pending',   converted_at: null,                   commission_credits: 0,    triggering_payment_id: null, triggering_payment_amount: null,  admin_notes: null,                                            manually_converted: false },
  { id: 'ref-007', referrer_id: '7',  referrer_name: 'Aisha Bello',      referee_id: '8',  referee_name: 'Tunde Oluwafemi', referee_email: 'tunde.oluwafemi@email.com',  referral_code: 'AISH-B7K2', created_at: '2024-03-18T12:00:00Z', status: 'converted', converted_at: '2024-03-20T15:00:00Z', commission_credits: 2500, triggering_payment_id: '9',  triggering_payment_amount: 25000, admin_notes: 'Manually converted after device-switch issue.', manually_converted: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK POINT TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const mockStudentPoints: StudentPointSummary[] = [
  {
    student_id: '7', student_name: 'Aisha Bello',
    credit_balance: 12000, lifetime_points: 15000, learning_points: 1800,
    transactions: [
      { id: 'txn-001', student_id: '7', type: 'referral_commission', amount: 1500,  balance_after: 1500,  description: 'Commission: Chukwu Okonkwo enrolled in Intro to Web Dev',      reference_id: 'ref-001', created_at: '2024-02-20T11:30:00Z', created_by: 'system' },
      { id: 'txn-002', student_id: '7', type: 'referral_commission', amount: 2800,  balance_after: 4300,  description: 'Commission: Fatima Mohammed enrolled in Mobile App Dev',         reference_id: 'ref-004', created_at: '2024-03-05T09:00:00Z', created_by: 'system' },
      { id: 'txn-003', student_id: '7', type: 'referral_commission', amount: 2500,  balance_after: 6800,  description: 'Commission: Tunde Oluwafemi enrolled in Advanced React.js',      reference_id: 'ref-007', created_at: '2024-03-20T15:00:00Z', created_by: 'system' },
      { id: 'txn-004', student_id: '7', type: 'referral_commission', amount: 5000,  balance_after: 11800, description: 'Commission: Mariam Suleiman enrolled in Full-Stack Next.js',     reference_id: 'ref-010', created_at: '2024-04-05T08:00:00Z', created_by: 'system' },
      { id: 'txn-005', student_id: '7', type: 'referral_commission', amount: 3200,  balance_after: 15000, description: 'Commission: Halima Abdullahi enrolled in Advanced React.js',     reference_id: 'ref-009', created_at: '2024-03-25T10:00:00Z', created_by: 'system' },
      { id: 'txn-006', student_id: '7', type: 'redemption',          amount: -3000, balance_after: 12000, description: 'Credits applied to Full-Stack Web Development enrollment',        reference_id: '10',      created_at: '2024-04-19T09:00:00Z', created_by: 'system' },
    ],
  },
  {
    student_id: '3', student_name: 'Zainab Adeyemi',
    credit_balance: 7500, lifetime_points: 10000, learning_points: 1800,
    transactions: [
      { id: 'txn-007', student_id: '3', type: 'referral_commission', amount: 1500,  balance_after: 1500,  description: 'Commission: Ibrahim Musa enrolled in Intro to Web Dev',          reference_id: 'ref-002', created_at: '2024-01-25T10:00:00Z', created_by: 'system' },
      { id: 'txn-008', student_id: '3', type: 'referral_commission', amount: 3000,  balance_after: 4500,  description: 'Commission: Segun Adebayo enrolled in Full-Stack Next.js',       reference_id: 'ref-006', created_at: '2024-04-15T14:00:00Z', created_by: 'system' },
      { id: 'txn-009', student_id: '3', type: 'manual_credit',       amount: 2000,  balance_after: 6500,  description: 'Manual credit: referral dispute — Eze Nwankwo registration',     reference_id: null,      created_at: '2024-04-18T10:30:00Z', created_by: 'Admin' },
      { id: 'txn-010', student_id: '3', type: 'redemption',          amount: -3000, balance_after: 3500,  description: 'Credits applied to Full-Stack Web Dev enrollment',                reference_id: '5',       created_at: '2024-04-11T08:00:00Z', created_by: 'system' },
      { id: 'txn-011', student_id: '3', type: 'referral_commission', amount: 4000,  balance_after: 7500,  description: 'Commission: Halima Abdullahi enrolled in Data Science',           reference_id: 'ref-011', created_at: '2024-04-20T11:00:00Z', created_by: 'system' },
    ],
  },
  {
    student_id: '1', student_name: 'Amina Hassan',
    credit_balance: 3000, lifetime_points: 5000, learning_points: 1000,
    transactions: [
      { id: 'txn-012', student_id: '1', type: 'referral_commission', amount: 4500,  balance_after: 4500,  description: 'Commission: Mariam Suleiman enrolled in Advanced React.js',      reference_id: 'ref-003', created_at: '2024-04-02T14:00:00Z', created_by: 'system' },
      { id: 'txn-013', student_id: '1', type: 'redemption',          amount: -1500, balance_after: 3000,  description: 'Credits applied to Intro to Web Dev enrollment',                  reference_id: '1',       created_at: '2024-01-20T09:00:00Z', created_by: 'system' },
    ],
  },
  {
    student_id: '11', student_name: 'Halima Abdullahi',
    credit_balance: 6000, lifetime_points: 7500, learning_points: 1200,
    transactions: [
      { id: 'txn-014', student_id: '11', type: 'referral_commission', amount: 3500, balance_after: 3500,  description: 'Commission: Chisom Eze enrolled in Data Science with Python',     reference_id: 'ref-005', created_at: '2024-03-15T11:00:00Z', created_by: 'system' },
      { id: 'txn-015', student_id: '11', type: 'referral_commission', amount: 4000, balance_after: 7500,  description: 'Commission: Tunde Oluwafemi enrolled in Full-Stack Next.js',      reference_id: 'ref-012', created_at: '2024-04-10T09:00:00Z', created_by: 'system' },
      { id: 'txn-016', student_id: '11', type: 'redemption',          amount: -1500,balance_after: 6000,  description: 'Credits applied toward Advanced React.js enrollment',              reference_id: '9',       created_at: '2024-04-22T14:00:00Z', created_by: 'system' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA
// ─────────────────────────────────────────────────────────────────────────────

export const mockRevenueData = [
  { date: 'Apr 1',  revenue: 125000 }, { date: 'Apr 2',  revenue: 98000  },
  { date: 'Apr 3',  revenue: 156000 }, { date: 'Apr 4',  revenue: 142000 },
  { date: 'Apr 5',  revenue: 189000 }, { date: 'Apr 6',  revenue: 167000 },
  { date: 'Apr 7',  revenue: 201000 }, { date: 'Apr 8',  revenue: 176000 },
  { date: 'Apr 9',  revenue: 145000 }, { date: 'Apr 10', revenue: 198000 },
  { date: 'Apr 11', revenue: 213000 }, { date: 'Apr 12', revenue: 184000 },
  { date: 'Apr 13', revenue: 156000 }, { date: 'Apr 14', revenue: 167000 },
  { date: 'Apr 15', revenue: 234000 },
];

export const mockReferralConversions = [
  { date: 'Apr 9',  conversions: 1 }, { date: 'Apr 10', conversions: 3 },
  { date: 'Apr 11', conversions: 2 }, { date: 'Apr 12', conversions: 4 },
  { date: 'Apr 13', conversions: 1 }, { date: 'Apr 14', conversions: 5 },
  { date: 'Apr 15', conversions: 3 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const getRecentPayments = (limit = 5): Payment[] =>
  mockPayments.slice(0, limit);

export const getMetrics = () => {
  const totalRevenue = mockPayments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalStudents        = mockStudents.length;
  const activeEnrollments    = mockEnrollments.filter((e) => e.status === 'in-progress').length;
  const completedEnrollments = mockEnrollments.filter((e) => e.status === 'completed').length;
  const creditsIssuedThisMonth = mockReferrals
    .filter((r) => r.status === 'converted')
    .reduce((sum, r) => sum + r.commission_credits, 0);
  const pendingReferrals = mockReferrals.filter((r) => r.status === 'pending').length;

  return {
    totalRevenue,
    totalStudents,
    activeEnrollments,
    completedEnrollments,
    creditsIssuedThisMonth,
    pendingReferrals,
    referralConversionsLast7Days: mockReferralConversions,
  };
};
