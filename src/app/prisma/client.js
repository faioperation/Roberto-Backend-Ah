import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

// Create a new pool
const pool = new Pool({ connectionString });

// Create the Prisma Client with the adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma
  .$connect()
  .then(() => console.log("✅ Prisma connected to PostgreSQL"))
  .catch((err) => console.error("❌ Prisma connection error:", err));

export default prisma;
