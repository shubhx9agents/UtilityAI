# UtilityAI - Next.js + TypeScript + Supabase

A modern AI-powered utility platform built with Next.js 15, TypeScript, and Supabase.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **AI Integration**: Google Gemini API
- **Form Handling**: React Hook Form + Zod

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- Google Gemini API key (free)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to **Project Settings** → **API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (keep this secure!)

### 3. Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20260127_initial_schema.sql`
4. Paste and run the SQL script
5. Verify all tables were created in **Table Editor**

### 4. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your environment variables in `.env.local`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Google Gemini AI
   GEMINI_API_KEY=your-gemini-api-key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
utilityai-nextjs/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── admin/
│   │   ├── agents/
│   │   ├── canvas/
│   │   ├── flows/
│   │   ├── library/
│   │   ├── notes/
│   │   ├── onboarding/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── agents/
│   │   ├── flows/
│   │   ├── canvas/
│   │   ├── notes/
│   │   └── library/
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utilities
│   ├── supabase/                 # Supabase clients
│   ├── ai/                       # AI service
│   └── utils.ts
├── types/                        # TypeScript types
├── hooks/                        # Custom React hooks
├── contexts/                     # React contexts
├── supabase/                     # Database migrations
│   └── migrations/
├── middleware.ts                 # Next.js middleware
└── .env.local                    # Environment variables
```

## 🗄️ Database Schema

The application uses the following main tables:

- **profiles**: User profiles (extends Supabase auth.users)
- **onboarding_progress**: User onboarding state
- **flows**: Business flow conversations
- **canvases**: Visual canvas data
- **notes**: User notes with rich content
- **library_items**: File storage metadata

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## 🔐 Authentication

The app uses Supabase Auth with email/password authentication:

- **Sign Up**: `/register`
- **Sign In**: `/login`
- **Protected Routes**: Automatically redirect to login if not authenticated
- **Session Management**: Handled by middleware with automatic refresh

## 🤖 AI Agents

The platform includes 10 specialized AI agents:

1. **Business Snapshot**: Business profile creation
2. **Ad Copy**: Ad campaign generation
3. **Graphics**: Image prompt generation
4. **Sales Script**: Sales call scripts
5. **Landing Page**: Landing page copy
6. **Email Sequence**: Email campaign design
7. **Social Media**: Social media content
8. **SEO**: SEO and content strategy
9. **Pricing**: Pricing and packaging
10. **Growth**: Growth and CRO optimization

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 Development

### Adding New UI Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

### Database Changes

To modify the database schema:

1. Create a new migration file in `supabase/migrations/`
2. Run the SQL in Supabase SQL Editor
3. Update TypeScript types in `types/index.ts`

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
