PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT,
    "userContact" TEXT NOT NULL,
    "moveInDate" TEXT NOT NULL,
    "moveOutDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Booking" ("id", "propertyId", "userId", "userContact", "moveInDate", "moveOutDate", "status", "createdAt")
SELECT "id", "propertyId", "userId", "userContact", "moveInDate", date("moveInDate", '+1 day'), "status", "createdAt"
FROM "Booking";

DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";

CREATE INDEX "Booking_propertyId_idx" ON "Booking"("propertyId");
CREATE INDEX "Booking_propertyId_moveInDate_moveOutDate_idx" ON "Booking"("propertyId", "moveInDate", "moveOutDate");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

PRAGMA foreign_keys=ON;