-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('NORMAL', 'STUCK', 'DELAYED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "origin_country" TEXT NOT NULL,
    "destination_country" TEXT NOT NULL,
    "shipped_date" TIMESTAMP(3) NOT NULL,
    "last_update_date" TIMESTAMP(3),
    "days_passed" INTEGER NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'NORMAL',
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_name" TEXT,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT,
    "customer_address" TEXT,
    "carrier" TEXT,
    "carrier_url" TEXT,
    "shipping_type" TEXT,
    "analysis_note" TEXT,
    "user_id" TEXT NOT NULL,
    "aftership_id" TEXT,
    "aftership_status" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "transit_time" INTEGER,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "origin_country" TEXT NOT NULL,
    "destination_country" TEXT NOT NULL,
    "carrier" TEXT,
    "shipping_type" TEXT,
    "min_days" INTEGER NOT NULL,
    "max_days" INTEGER NOT NULL,
    "stuck_days" INTEGER NOT NULL DEFAULT 3,
    "custom_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_tracking_number_user_id_key" ON "orders"("tracking_number", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
