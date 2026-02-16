# Role: Senior Full-Stack Engineer & Database Architect

# Context:
You are implementing the database and storage layer for "VersaTools," a modular SaaS tool hub. 
The stack is Next.js 14, Prisma ORM, and Supabase (PostgreSQL). 
We need a schema that supports "Zero-Friction" file processing, temporary storage management, and usage analytics.

# Constraints & Logic:
1. **Schema Design**: 
   - Use `Prisma` with `postgresql` provider.
   - Implement a `History` model with a `status` Enum (PENDING, PROCESSING, COMPLETED, FAILED).
   - Use a `JSONB` field called `metadata` in the `History` model to store tool-specific data (e.g., compression ratio, PDF page count).
   - Include an `expiresAt` DateTime field for automatic cleanup logic.
   - Add a `Statistics` model to track global and per-tool usage counts.
2. **Performance**: Configure the connection string to use Supabase Connection Pooling (`pgbouncer=true`).
3. **Security**: 
   - Ensure `onDelete: Cascade` is set for User-to-History relations.
   - Provide the SQL snippets to enable Row Level Security (RLS) in Supabase for the `History` and `Statistics` tables.
4. **Data Seed**: Create a `prisma/seed.ts` file that populates the DB with dummy history records to showcase the Bento Grid UI.
5. **Naming Convention**: Use CamelCase for Prisma models and map them to snake_case in PostgreSQL using `@@map`.

# Task:
1. Generate the complete `schema.prisma` file.
2. Create the `lib/prisma.ts` singleton client with edge-compatibility (using Prisma Accelerate if recommended, or standard pooling).
3. Write a `seed.ts` script for a "filled" dashboard vibe.
4. Provide a SQL migration script for Supabase RLS.

# Output:
Provide the code files and the terminal commands to run the migrations and seeding.
2. Technical Specification & Schema Design
2.1 Prisma Schema (schema.prisma)
This schema implements the modularity required for VersaTools. The metadata JSONB field allows us to add new tools (like a Video Converter) without changing the database structure.

Code snippet
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Used for migrations
}

enum ProcessStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  history       History[]
  stats         Stats?

  @@map("users")
}

model History {
  id           String        @id @default(cuid())
  userId       String
  toolId       String        // e.g., "pdf-merger", "bg-remover"
  toolName     String
  status       ProcessStatus @default(PENDING)
  inputFileName String
  outputFileName String?
  fileUrl      String?       // Temporary Supabase Storage URL
  metadata     Json?         // Tool-specific data: { "compressionRatio": "40%", "pages": 5 }
  expiresAt    DateTime
  createdAt    DateTime      @default(now())

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("history")
}

model Stats {
  id          String   @id @default(cuid())
  userId      String   @unique
  totalUsed   Int      @default(0)
  toolsBreakdown Json?   // { "pdf-merger": 10, "bg-remover": 2 }
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_stats")
}
2.2 Supabase RLS Policy (SQL)
To ensure the "Vibe" is backed by industrial-grade security, we enable RLS so users can only see their own history.

SQL
-- Enable RLS
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own history records
CREATE POLICY "Users can view own history" ON history
FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can only delete their own history records
CREATE POLICY "Users can delete own history" ON history
FOR DELETE USING (auth.uid()::text = user_id);
2.3 Edge-Ready Connection Pool
In src/lib/db.ts, we handle the connection to prevent the "Too many clients" error common in Serverless/Vercel environments.

TypeScript
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'],
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const db = globalThis.prisma ?? prismaClientSingleton()

export default db

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db
3. Deployment & Execution Plan
Step 1: Environment Setup
Ensure your .env has both the Transaction and Direct URLs from Supabase:

DATABASE_URL: postgres://...:6543/postgres?pgbouncer=true (Transaction Mode)

DIRECT_URL: postgres://...:5432/postgres (Session Mode for Migrations)

Step 2: Push Schema
Run the following to sync your schema with Supabase:

Bash
npx prisma migrate dev --name init_db_architecture
Step 3: Seed for "Vibe Check"
Execute the seed script to fill your Bento Grid with sample data:

Bash
npx prisma db seed
Step 4: Storage Cleanup Automation
To handle the Hard Delete requirement for the 30MB files:

Go to Supabase Dashboard -> Edge Functions.

Create a function cleanup-storage that runs every 24h.

The function should query the History table for expiresAt < NOW(), delete the file from the Storage Bucket, and then delete the record from the DB.