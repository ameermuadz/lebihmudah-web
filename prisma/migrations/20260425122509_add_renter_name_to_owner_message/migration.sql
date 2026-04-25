-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OwnerMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "renterName" TEXT NOT NULL DEFAULT 'Renter',
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ownerReply" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "OwnerMessage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OwnerMessage" ("createdAt", "id", "ownerId", "ownerReply", "propertyId", "question", "resolvedAt", "sessionId", "status") SELECT "createdAt", "id", "ownerId", "ownerReply", "propertyId", "question", "resolvedAt", "sessionId", "status" FROM "OwnerMessage";
DROP TABLE "OwnerMessage";
ALTER TABLE "new_OwnerMessage" RENAME TO "OwnerMessage";
CREATE INDEX "OwnerMessage_propertyId_idx" ON "OwnerMessage"("propertyId");
CREATE INDEX "OwnerMessage_status_idx" ON "OwnerMessage"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
