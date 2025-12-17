# Job Platform Frontend

Modern job board frontend built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Features

- **Authentication**: Complete auth flow with email/password and Google OAuth
- **Job Listings**: Browse, search, and filter thousands of jobs
- **Company Profiles**: Explore companies with detailed information, reviews, and benefits
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark Mode**: Full dark mode support
- **Type Safe**: Full TypeScript coverage
- **Modern UI**: Built with Radix UI and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running on `http://localhost:8080`

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
- `NEXT_PUBLIC_API_URL`: Your backend API URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth client ID

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── (public)/       # Public pages (jobs, companies)
│   │   ├── (auth)/         # Auth pages (login, register)
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   ├── layout/        # Layout components
│   │   ├── auth/          # Auth components
│   │   ├── jobs/          # Job-related components
│   │   ├── companies/     # Company-related components
│   │   ├── home/          # Home page components
│   │   └── shared/        # Shared components
│   ├── lib/               # Utilities and configurations
│   │   ├── api/          # API client and endpoints
│   │   ├── utils.ts      # Utility functions
│   │   ├── constants.ts  # App constants
│   │   └── validations.ts # Form validations
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   └── providers/        # React context providers
├── public/               # Static assets
└── package.json
```

## Key Features Implementation

### Authentication

- Email/password login and registration
- Google OAuth integration
- JWT token management with automatic refresh
- Protected routes with auth guards
- Password reset flow
- Email verification

### Job Listings

- Advanced search and filtering
- Pagination
- Job detail pages
- Save/bookmark jobs
- One-click apply

### Company Profiles

- Company information and about
- Open job positions
- Office locations
- Employee benefits
- Company reviews
- Follow companies

### UI/UX

- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Loading states and skeletons
- Error handling
- Toast notifications
- Accessible components

## Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# App Metadata
NEXT_PUBLIC_APP_NAME=jobsworld
NEXT_PUBLIC_APP_DESCRIPTION=Find your dream job
```

## API Integration

The frontend integrates with the backend API using axios. All API calls are centralized in `src/lib/api/`:

- `client.ts` - Axios instance with interceptors
- `auth.ts` - Authentication endpoints
- `jobs.ts` - Job listings endpoints
- `companies.ts` - Company endpoints

### Authentication Flow

1. User logs in or registers
2. Backend returns access token and refresh token
3. Tokens stored in Zustand store (persisted to localStorage)
4. Access token sent with every API request
5. On 401, automatically refresh token
6. On refresh failure, logout and redirect to login

## Building for Production

```bash
npm run build
npm run start
```

The production build is optimized with:
- Code splitting
- Image optimization
- Font optimization
- CSS minification
- Dead code elimination

## Contributing

1. Follow the existing code structure
2. Use TypeScript for all new code
3. Follow the component naming conventions
4. Add proper types for all props and functions
5. Test on multiple screen sizes

## License

MIT
# joblisting-frontend
