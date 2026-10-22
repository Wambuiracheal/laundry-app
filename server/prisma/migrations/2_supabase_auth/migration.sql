-- Sign-in moves to Supabase Auth: users are linked by their Supabase user id, passwords live in
-- Supabase, and the app's own refresh tokens are no longer issued.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "auth_id" TEXT;
ALTER TABLE "User" ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_auth_id_key" ON "User"("auth_id");

-- DropTable
DROP TABLE "RefreshToken";
