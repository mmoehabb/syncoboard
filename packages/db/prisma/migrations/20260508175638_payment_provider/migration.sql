-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYPAL', 'DODO');

-- AlterTable
ALTER TABLE "Price" ADD COLUMN     "providerPlanId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "provider" "PaymentProvider",
ADD COLUMN     "providerSubscriptionId" TEXT;
