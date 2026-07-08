import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency based on selected setting
export const formatCurrency = (amount: number, customCurrency?: string) => {
  const currency = customCurrency || localStorage.getItem("gymos_currency") || "USD";
  
  let locale = "en-US";
  if (currency === "INR") locale = "en-IN";
  else if (currency === "EUR") locale = "de-DE";
  else if (currency === "GBP") locale = "en-GB";
  else if (currency === "AED") locale = "ar-AE";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Retrieve currency symbol
export const getCurrencySymbol = (customCurrency?: string) => {
  const currency = customCurrency || localStorage.getItem("gymos_currency") || "USD";
  switch (currency) {
    case "INR": return "₹";
    case "EUR": return "€";
    case "GBP": return "£";
    case "AED": return "د.إ";
    default: return "$";
  }
};

// Format date
export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(dateString));
};
