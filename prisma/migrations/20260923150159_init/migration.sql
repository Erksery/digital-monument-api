-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "otp_type" AS ENUM ('email_verification', 'password_reset', 'two_factor');

-- CreateEnum
CREATE TYPE "profile_visibility_type" AS ENUM ('public', 'private', 'selected');

-- CreateEnum
CREATE TYPE "profile_purchase_type" AS ENUM ('premium', 'monument');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "login" VARCHAR(50) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "password" TEXT NOT NULL,
    "registration_time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_time" TIMESTAMPTZ(6),
    "is_verified" BOOLEAN DEFAULT false,
    "role" "user_role" NOT NULL DEFAULT 'user',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "avatar" TEXT,
    "fullName" VARCHAR(255) NOT NULL,
    "birthDate" DATE,
    "deathDate" DATE,
    "quote" TEXT,
    "quoteAuthor" VARCHAR(255),
    "birthPlace" VARCHAR(255),
    "deathPlace" VARCHAR(255),
    "spouse" VARCHAR(255),
    "children" TEXT[],
    "citizenship" VARCHAR(100),
    "education" TEXT,
    "occupation" TEXT,
    "awards" TEXT[],
    "contentMarkdown" TEXT NOT NULL,
    "photoGallery" TEXT[],
    "burialAddress" TEXT,
    "burialCoordinates" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" TEXT NOT NULL,
    "authorRole" VARCHAR(100) NOT NULL,
    "customName" VARCHAR(255),
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "profileId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profile_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_visibility_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "visibility" "profile_visibility_type" NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profile_visibility_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_visibility_user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "settingsId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "profile_visibility_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_editors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_editors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_purchases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "profileId" UUID,
    "type" "profile_purchase_type" NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'RUB',
    "invoiceId" TEXT NOT NULL,
    "transactionId" TEXT,
    "payload" JSONB,
    "paidAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profile_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_code" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "type" "otp_type" NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "profile_visibility_settings_profileId_key" ON "profile_visibility_settings"("profileId");

-- CreateIndex
CREATE INDEX "profile_visibility_user_settingsId_idx" ON "profile_visibility_user"("settingsId");

-- CreateIndex
CREATE INDEX "profile_visibility_user_userId_idx" ON "profile_visibility_user"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_visibility_user_settingsId_userId_key" ON "profile_visibility_user"("settingsId", "userId");

-- CreateIndex
CREATE INDEX "profile_editors_profileId_idx" ON "profile_editors"("profileId");

-- CreateIndex
CREATE INDEX "profile_editors_userId_idx" ON "profile_editors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_editors_profileId_userId_key" ON "profile_editors"("profileId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_purchases_invoiceId_key" ON "profile_purchases"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_purchases_transactionId_key" ON "profile_purchases"("transactionId");

-- CreateIndex
CREATE INDEX "profile_purchases_userId_idx" ON "profile_purchases"("userId");

-- CreateIndex
CREATE INDEX "profile_purchases_status_idx" ON "profile_purchases"("status");

-- CreateIndex
CREATE INDEX "profile_purchases_invoiceId_idx" ON "profile_purchases"("invoiceId");

-- CreateIndex
CREATE INDEX "otp_code_userId_type_idx" ON "otp_code"("userId", "type");

-- CreateIndex
CREATE INDEX "otp_code_expiresAt_idx" ON "otp_code"("expiresAt");

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_comments" ADD CONSTRAINT "profile_comments_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_comments" ADD CONSTRAINT "profile_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_visibility_settings" ADD CONSTRAINT "profile_visibility_settings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_visibility_user" ADD CONSTRAINT "profile_visibility_user_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "profile_visibility_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_visibility_user" ADD CONSTRAINT "profile_visibility_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_editors" ADD CONSTRAINT "profile_editors_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_editors" ADD CONSTRAINT "profile_editors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_purchases" ADD CONSTRAINT "profile_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_purchases" ADD CONSTRAINT "profile_purchases_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_code" ADD CONSTRAINT "otp_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
