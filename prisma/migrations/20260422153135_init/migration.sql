/*
  Warnings:

  - The primary key for the `FinanceUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `FinanceUser` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FinanceUser" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_FinanceUser" ("createdAt", "email", "password", "username") SELECT "createdAt", "email", "password", "username" FROM "FinanceUser";
DROP TABLE "FinanceUser";
ALTER TABLE "new_FinanceUser" RENAME TO "FinanceUser";
CREATE UNIQUE INDEX "FinanceUser_email_key" ON "FinanceUser"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
