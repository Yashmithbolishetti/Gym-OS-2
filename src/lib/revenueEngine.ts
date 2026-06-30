import { Member, Payment } from "../types";

export interface RevenueMetrics {
  todaysRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalRevenue: number;
  mrr: number;
  arr: number;
  renewalRevenue: number;
  membershipRevenue: number;
  revenueGrowthPercentage: number;
  averageRevenuePerMember: number;
}

export function isPaymentValid(p: any): boolean {
  if (!p) return false;
  if (p.amount === undefined || p.amount === null || isNaN(p.amount) || p.amount <= 0) return false;
  
  // Exclude cancelled, refunded, failed, suspended transactions
  const status = (p.status || "").toLowerCase();
  if (
    status === "cancelled" || 
    status === "refunded" || 
    status === "failed" || 
    status === "suspended" ||
    status === "refund" ||
    status === "fail" ||
    status === "cancel" ||
    status === "suspend"
  ) {
    return false;
  }
  return true;
}

export function calculateRevenueEngine(payments: Payment[], members: Member[]): RevenueMetrics {
  const validPayments = payments.filter(isPaymentValid);
  const totalReceived = validPayments.reduce((sum, p) => sum + p.amount, 0);

  // Active memberships only - exclude expired, suspended, archived, cancelled
  const activeMembers = members.filter(m => {
    if (m.is_archived) return false;
    const status = (m.status || "").toLowerCase();
    if (status === "expired" || status === "suspended" || status === "cancelled") {
      return false;
    }
    // Filter out expired by date
    if (m.expiry_date) {
      const expiry = new Date(m.expiry_date);
      const today = new Date();
      expiry.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      if (expiry.getTime() < today.getTime()) {
        return false;
      }
    } else {
      return false; // No expiry date means invalid subscription
    }
    return true;
  });

  // Dates parsing helpers
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 7);
  const startOfWeekTime = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate()).getTime();

  const currentMonthNum = today.getMonth();
  const currentYearNum = today.getFullYear();

  // 1. Today's Revenue
  const todaysRevenue = validPayments
    .filter(p => {
      const pDate = new Date(p.date);
      return (
        pDate.getFullYear() === today.getFullYear() &&
        pDate.getMonth() === today.getMonth() &&
        pDate.getDate() === today.getDate()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // 2. Weekly Revenue (last 7 days)
  const weeklyRevenue = validPayments
    .filter(p => {
      const pTime = new Date(p.date).getTime();
      return pTime >= startOfWeekTime;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // 3. Monthly Revenue (this calendar month)
  const monthlyRevenue = validPayments
    .filter(p => {
      const pDate = new Date(p.date);
      return pDate.getFullYear() === currentYearNum && pDate.getMonth() === currentMonthNum;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // 4. Yearly Revenue (this calendar year)
  const yearlyRevenue = validPayments
    .filter(p => {
      const pDate = new Date(p.date);
      return pDate.getFullYear() === currentYearNum;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // 5. Total Revenue
  const totalRevenue = totalReceived;

  // 6. MRR (Monthly Recurrent Revenue)
  // Dynamic formula across active subscriptions in the active member pool:
  // Monthly plan = full price, Quarterly plan = price/3, Yearly plan = price/12
  const mrr = activeMembers.reduce((sum, m) => {
    const price = m.membership_price || 0;
    const plan = (m.membership_plan || "").toLowerCase();
    
    if (plan.includes("monthly") || plan === "monthly") {
      return sum + price;
    } else if (plan.includes("quarter") || plan === "quarterly") {
      return sum + (price / 3);
    } else if (plan.includes("year") || plan.includes("annual") || plan === "yearly") {
      return sum + (price / 12);
    } else if (
      plan.includes("trial") || 
      plan.includes("day") || 
      plan.includes("week") || 
      plan.includes("one-time") || 
      plan.includes("pass")
    ) {
      return sum; // non-recurring trial, no MRR
    }
    return sum + price; // fallback
  }, 0);

  // 7. ARR (Annualized Recurrent Revenue)
  const arr = mrr * 12;

  // 8. Renewal Revenue
  // Computed as payments that occurred after the member's joining date (i.e. repeat transactions),
  // or payments from members with active status that are renewals.
  let renewalSum = 0;
  const memberGroup: Record<string, Payment[]> = {};
  validPayments.forEach(p => {
    if (!memberGroup[p.member_id]) {
      memberGroup[p.member_id] = [];
    }
    memberGroup[p.member_id].push(p);
  });

  // For each member, sort payments by date. The first is "Joining Revenue", subsequent are "Renewal Revenue"
  Object.values(memberGroup).forEach(pmts => {
    const sorted = [...pmts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length > 1) {
      // Add all except the first payment to renewalSum
      for (let i = 1; i < sorted.length; i++) {
        renewalSum += sorted[i].amount;
      }
    }
  });
  const renewalRevenue = renewalSum;

  // 9. Membership Revenue (all collections made via standard membership receipts)
  const membershipRevenue = totalReceived;

  // 10. Revenue Growth %
  // Growth comparing previous calendar month with current calendar month
  const prevMonthNum = currentMonthNum === 0 ? 11 : currentMonthNum - 1;
  const prevMonthYear = currentMonthNum === 0 ? currentYearNum - 1 : currentYearNum;

  const prevMonthRevenue = validPayments
    .filter(p => {
      const pDate = new Date(p.date);
      return pDate.getFullYear() === prevMonthYear && pDate.getMonth() === prevMonthNum;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const revenueGrowthPercentage = prevMonthRevenue > 0 
    ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
    : monthlyRevenue > 0 ? 100 : 0;

  // 11. Average Revenue Per Member (ARPU)
  const totalAuditedMembers = members.filter(m => !m.is_archived).length;
  const averageRevenuePerMember = totalAuditedMembers > 0 ? totalReceived / totalAuditedMembers : 0;

  return {
    todaysRevenue,
    weeklyRevenue,
    monthlyRevenue,
    yearlyRevenue,
    totalRevenue,
    mrr,
    arr,
    renewalRevenue,
    membershipRevenue,
    revenueGrowthPercentage,
    averageRevenuePerMember
  };
}
