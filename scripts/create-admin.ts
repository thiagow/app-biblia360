import "dotenv/config";
import { db } from "../src/db/index";
import { users } from "../src/db/schema";
import bcrypt from "bcryptjs";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

async function createAdmin() {
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash },
    })
    .returning({ id: users.id, email: users.email });

  console.log(`✅ Admin created: ${user.email}`);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
