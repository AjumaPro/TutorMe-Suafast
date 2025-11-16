-- Add withdrawal_requests table for tutor withdrawal requests
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tutorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "frequency" TEXT NOT NULL, -- 'WEEKLY' or 'MONTHLY'
    "status" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "paymentMethod" TEXT, -- 'BANK_TRANSFER', 'MOBILE_MONEY', etc.
    "accountDetails" TEXT, -- JSON string with account information
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "withdrawal_requests_tutorId_fkey" 
        FOREIGN KEY ("tutorId") REFERENCES "tutor_profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "withdrawal_requests_tutorId_idx" ON "withdrawal_requests"("tutorId");
CREATE INDEX IF NOT EXISTS "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");
CREATE INDEX IF NOT EXISTS "withdrawal_requests_requestedAt_idx" ON "withdrawal_requests"("requestedAt");

-- Add comment
COMMENT ON TABLE "withdrawal_requests" IS 'Tutor withdrawal requests with weekly/monthly frequency options';

