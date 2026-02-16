# Role: Senior Full-Stack Engineer & Vibe Code Specialist

# Context: 
You are initializing "VersaTools," a high-end, modular personal tool hub. 
The goal is to build a "Zero-Friction" ecosystem using Next.js 14+ (App Router). 
The aesthetic is "High-end SaaS" with a Bento Grid layout, tactile micro-interactions, and a dark/light mode setup.

# Constraints & Technical Stack:
- Framework: Next.js (App Router, TypeScript).
- UI/Styling: Tailwind CSS + shadcn/ui + Lucide React.
- Animations: Framer Motion (using physics-based springs: stiffness 300, damping 30).
- Font: Geist (Sans and Mono).
- Auth: Auth.js (NextAuth v5) with Google Provider.
- Database: Prisma ORM with Supabase (PostgreSQL).
- Storage: Supabase Storage (for temporary file processing, 30MB limit).
- Security: IP-based Rate Limiting via Upstash/Redis.
- Middleware: Implement a 'bouncer' layer to handle Auth guards and Upstash rate limits.
- Logic: Use Server Actions and `revalidatePath` for data syncing. No client-side state managers (Redux/Zustand) unless absolutely necessary.
- Tool Pattern: Strict modular structure in `src/tools/[tool-id]`.

# Task:
1. Initialize the project structure and install core dependencies.
2. Setup the `shadcn/ui` base and the Bento Grid homepage layout.
3. Configure Prisma with the provided schema and Auth.js v5.
4. Create a `.env.example` including placeholders for Supabase, Google Auth, Upstash, and Remove.bg.
5. Setup a global `framer-motion` transition config to ensure a consistent "vibe."
6. Implement Husky and Lint-staged for git commit hooks.

# Output:
Provide the shell commands for installation and the core boilerplate code for the layout and middleware.
2. Infrastructure Configuration Details
2.1 File Structure (The Modular Framework)
The project will follow this architecture to ensure "Plug-and-Play" tool addition:

Plaintext
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Login/Signup routes
│   ├── (dashboard)/      # Protected tool routes
│   └── api/              # Tool-specific API routes (if needed)
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── shared/           # Header, Sidebar, BentoGrid
│   └── tools/            # Reusable tool-specific UI components
├── lib/
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # Auth.js config
│   └── utils.ts          # Tailwind merge & global helpers
├── tools/                # THE CORE MODULES
│   ├── config.ts         # Registry of all tools (Metadata, Icons, Slugs)
│   └── [tool-id]/        # logic.ts, UI components, types.ts
├── middleware.ts         # Rate limiting & Auth guards
└── styles/               # Global CSS & Framer Motion themes
2.2 Security & Middleware (The Bouncer)
Since you were unsure about the Middleware, here is the implementation logic:

Purpose: It acts as a gatekeeper. Before a user hits a "heavy" API route (like AI Background Removal), the middleware checks:

Auth: Is the user logged in? (Redirect to /login if not).

Rate Limit: Has this IP address sent more than 5 requests in the last minute? (Return 429 Too Many Requests via Upstash).

2.3 Storage Flow (30MB Limit)
To handle the 30MB file limit securely:

Upload: User drops a file -> Uploaded to a temp-uploads bucket in Supabase Storage.

Process: Server Action fetches the file -> Processes via Cloud API (e.g., Remove.bg) -> Returns a result.

Cleanup: Use a Supabase Edge Function or a CRON job to delete files in the temp-uploads bucket every 24 hours.

3. Environment Variables (.env.example)
Bash
# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Auth.js (v5)
AUTH_SECRET="run-npx-auth-secret-to-generate"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Upstash (Rate Limiting)
UPSTASH_REDIS_REST_URL="your-url"
UPSTASH_REDIS_REST_TOKEN="your-token"

# AI Tools
REMOVE_BG_API_KEY="your-api-key"

# Storage
SUPABASE_URL="your-project-url"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
4. Visual "Vibe" Constants
To achieve the High-end SaaS feel, we use these framer-motion constants across the app:

TypeScript
// src/lib/motion-variants.ts
export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

export const bentoItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: springTransition },
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
};