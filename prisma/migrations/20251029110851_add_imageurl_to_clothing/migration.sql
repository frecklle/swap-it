/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Clothing` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ClothingImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "clothingId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClothingImage_clothingId_fkey" FOREIGN KEY ("clothingId") REFERENCES "Clothing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clothing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Clothing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Clothing" ("category", "createdAt", "description", "id", "name", "ownerId") SELECT "category", "createdAt", "description", "id", "name", "ownerId" FROM "Clothing";
DROP TABLE "Clothing";
ALTER TABLE "new_Clothing" RENAME TO "Clothing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ClothingImage_clothingId_idx" ON "ClothingImage"("clothingId");
