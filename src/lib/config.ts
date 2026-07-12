/**
 * Application configuration.
 *
 * Bank transfer details and other settings are pulled from environment
 * variables so they can be updated without code changes.
 */
export const config = {
  bank: {
    name: process.env.NEXT_PUBLIC_BANK_NAME ?? "PalmPay",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "Qudus Olatunbosun",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "9164606486",
  },
  ownerEmail: process.env.OWNER_EMAIL ?? "owner@ybdclothing.com",
  resendFrom: process.env.RESEND_FROM_EMAIL ?? "noreply@ybdclothing.com",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348000000000",
  storage: {
    receiptsBucket: "receipts",
    productImagesBucket: "product-images",
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    allowedFileTypes: ["image/png", "image/jpeg", "image/webp"] as string[],
  },
} as const;
