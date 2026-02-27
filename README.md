# QuickConnect BD 🇧🇩

A lightweight, privacy-first real-time messenger built with Next.js 14 and Supabase. Connect with anyone using a unique **9-digit ID** — no phone number, no public directory.

---

## ✨ Features

- 🔒 **Private by design** — Connect only via unique `XXX-XXX-XXX` IDs
- ⚡ **Real-time messaging** via Supabase Realtime
- 🖼️ **Image sharing** with automatic client-side compression (saves mobile data)
- 🌙 **Dark & Light mode** with system preference detection
- 🈶 **Bengali (Bangla) + English** font support
- 📱 **Mobile-first** responsive design

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database & Auth | Supabase |
| Real-time | Supabase Realtime |
| Icons | Lucide React |
| Image Compression | browser-image-compression |

---

## 🚀 Quick Setup

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### 2. Clone & Install

```bash
git clone <your-repo>
cd quickconnect-bd
npm install
```

### 3. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **SQL Editor** → **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql` and click **Run**
4. In your Supabase dashboard, go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 4. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
quickconnect-bd/
├── app/
│   ├── layout.tsx                  # Root layout with ThemeProvider
│   ├── page.tsx                    # Landing page
│   ├── globals.css                 # Global styles + CSS variables
│   ├── auth/
│   │   ├── layout.tsx              # Auth page wrapper
│   │   ├── login/page.tsx          # Login form
│   │   └── signup/page.tsx         # Signup + unique ID generation
│   ├── chat/
│   │   ├── layout.tsx              # Chat shell (server, fetches auth)
│   │   ├── page.tsx                # Empty state
│   │   └── [id]/page.tsx           # Individual conversation
│   └── api/
│       └── auth/callback/route.ts  # OAuth callback handler
├── components/
│   ├── ui/
│   │   └── ThemeProvider.tsx       # Dark/light mode context
│   └── chat/
│       ├── ChatShell.tsx           # Sidebar + contacts list
│       └── ConversationView.tsx    # Message thread + input
├── lib/
│   ├── utils.ts                    # ID generation, image compression, helpers
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       ├── server.ts               # Server Supabase client
│       └── middleware.ts           # Auth middleware session handling
├── middleware.ts                   # Route protection
├── types/index.ts                  # TypeScript interfaces
├── supabase-schema.sql             # Full DB schema + RLS policies
└── .env.local.example              # Environment variable template
```

---

## 🔐 How the Unique ID System Works

1. When a user signs up, a cryptographically random **9-digit ID** (`XXX-XXX-XXX`) is generated in the browser
2. This ID is stored in the `profiles` table and is **immutable**
3. To connect with someone, you enter their 9-digit ID — no username search, no directory
4. The app checks if a conversation already exists; if not, it creates one
5. Both parties see the chat in their sidebar immediately (real-time)

---

## 🖼️ Image Sharing

Images are compressed **before upload** using `browser-image-compression`:
- Max size: 500KB
- Max dimensions: 1280px
- Format: WebP (better compression than JPEG)

This is especially important for users on mobile data in Bangladesh.

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Production Checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Enable email confirmations in Supabase Auth settings (optional)
- [ ] Set up Supabase storage CORS for your domain
- [ ] Configure Supabase Auth redirect URLs to include your production domain

---

## 📝 License

MIT — Built with ❤️ for Bangladesh and the world.
