-- CreateTable
CREATE TABLE "UnlockedThemes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    CONSTRAINT "UnlockedThemes_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "FinanceUser" ("email") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "unlockedAvatars" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    CONSTRAINT "unlockedAvatars_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "FinanceUser" ("email") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FinanceUser" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT 'cat',
    "Theme" TEXT NOT NULL DEFAULT 'light',
    "points" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_FinanceUser" ("createdAt", "email", "password", "username") SELECT "createdAt", "email", "password", "username" FROM "FinanceUser";
DROP TABLE "FinanceUser";
ALTER TABLE "new_FinanceUser" RENAME TO "FinanceUser";
CREATE UNIQUE INDEX "FinanceUser_email_key" ON "FinanceUser"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
