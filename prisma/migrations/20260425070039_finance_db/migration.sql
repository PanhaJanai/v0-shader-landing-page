/*
  Warnings:

  - You are about to drop the `UnlockedThemes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `unlockedAvatars` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `Theme` on the `FinanceUser` table. All the data in the column will be lost.
  - Added the required column `unlockedAvatars` to the `FinanceUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unlockedThemes` to the `FinanceUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UnlockedThemes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "unlockedAvatars";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Themes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Avatars" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FinanceUser" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT 'cat',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "unlockedAvatars" JSONB NOT NULL,
    "unlockedThemes" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_FinanceUser" ("avatar", "createdAt", "email", "level", "password", "points", "streak", "username", "xp") SELECT "avatar", "createdAt", "email", "level", "password", "points", "streak", "username", "xp" FROM "FinanceUser";
DROP TABLE "FinanceUser";
ALTER TABLE "new_FinanceUser" RENAME TO "FinanceUser";
CREATE UNIQUE INDEX "FinanceUser_email_key" ON "FinanceUser"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
