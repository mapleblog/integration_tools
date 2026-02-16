## 1. Project Vision & Identity

**Project Name:** VersaTools

**Core Philosophy:** A "Zero-Friction" personal integrated tool hub. It must feel extremely fast, secure, and visually responsive.

**Target User:** Personal use + Publicly shared (Custom Domain ready).

**The Vibe:** High-end SaaS aesthetic with heavy emphasis on **micro-interactions**. Every click should feel tactile and rewarded with smooth animations.

------

## 2. Technical Stack (The RCC Constraint)

- **Framework:** Next.js (App Router)
- **Authentication:** Auth.js (NextAuth) with Google Provider.
- **Database/ORM:** Prisma (PostgreSQL/Supabase recommended for cloud).
- **Styling:** Tailwind CSS + Lucide React + Framer Motion (for the Vibe).
- **Safety:** Rate Limiting (via Upstash/Redis or Middleware) to prevent API abuse.
- **Deployment:** Vercel-ready.

------

## 3. Core Features (The First Wave)

### 3.1 Tool Suite (Cloud-Processed)

1. **PDF Merger:** Combine multiple PDF files into one.
2. **Background Remover:** AI-powered background removal for images.
3. **Image Compressor:** Smart compression with quality/size balance.
4. **File Compressor:** ZIP creation for multiple file types.

### 3.2 User System & History

- **Google Login:** Seamless OAuth via Auth.js.
- **Processing History:** A dedicated dashboard or sidebar showing the last 10 processed tasks for quick re-downloading.
- **Cloud-to-Local Flow:** Files are processed server-side and automatically triggered for local download upon completion.

------

## 4. System Architecture (The SCF Frame)

### 4.1 Plug-and-Play Tool Pattern

The project must follow a strict modular structure. Each tool is a standalone module:

- `src/tools/configs.ts`: Central registry of all tools.
- `src/tools/[tool-id]/`: Each folder contains its own logic, UI components, and API route.
- *Adding a new tool should only require adding a folder and registering it in the config.*

### 4.2 Database Schema (Prisma)

Code snippet

```
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  accounts      Account[]
  history       History[]
}

model History {
  id          String   @id @default(cuid())
  userId      String
  toolName    String   // e.g., "PDF Merger"
  fileName    String   // Original or Result filename
  fileUrl     String?  // Cloud storage link (if temporary storage is used)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

------

## 5. Visual & Interaction Guidelines (The Vibe Code)

- **Design Language:** Bento Grid layout for the homepage. Each tool is a "Card."
- **Micro-interactions:**
  - **Drag & Drop:** Use a high-quality drop zone with a "magnetic" hover effect.
  - **Loading States:** Instead of simple spinners, use progress bars with "Processing..." status messages and skeleton pulses.
  - **Success Feedback:** A slight haptic-like bounce or confetti when a file is ready.
- **Themed:** Support Dark/Light mode natively using `next-themes`.

------

## 6. Security & Guardrails

- **Rate Limiting:** Maximum 5 tool executions per minute per user to prevent bill spikes.
- **Auth Guard:** All tool APIs must check for a valid session via `auth()` (Auth.js v5).
- **File Handling:** Ensure server-side temporary files are cleaned up after processing to prevent disk overflow.

------

## 7. Developer Implementation Rules (For AI Coding)

1. **Code Consistency:** Use Functional Components with TypeScript. No `any`.
2. **Performance:** Optimize images and use `next/font`. Ensure LCP (Largest Contentful Paint) is under 1.2s.
3. **Separation of Concerns:** UI in `components/`, business logic in `lib/` or `tools/`, and API routes in `app/api/`.
4. **Error Handling:** Every tool must have a `try-catch` block and display a user-friendly Toast notification on failure.