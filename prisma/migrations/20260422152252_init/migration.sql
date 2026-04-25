/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `FinanceUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FinanceUser_email_key" ON "FinanceUser"("email");
