/*
  Warnings:

  - You are about to drop the column `message` on the `FinanceUser` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `FinanceUser` table. All the data in the column will be lost.
  - Added the required column `password` to the `FinanceUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `FinanceUser` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FinanceUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_FinanceUser" ("createdAt", "email", "id") SELECT "createdAt", "email", "id" FROM "FinanceUser";
DROP TABLE "FinanceUser";
ALTER TABLE "new_FinanceUser" RENAME TO "FinanceUser";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
