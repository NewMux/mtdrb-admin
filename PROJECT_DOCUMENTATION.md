# MTDRB Admin Webapp - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Design System & Aesthetics](#design-system--aesthetics)
4. [Color System](#color-system)
5. [Component Patterns](#component-patterns)
6. [API Functions](#api-functions)
7. [Utility Functions](#utility-functions)
8. [Styling Guidelines](#styling-guidelines)
9. [File Structure](#file-structure)
10. [Key Features](#key-features)

---

## Project Overview

**MTDRB Admin** is a comprehensive gym management system built with React, TypeScript, and Supabase. It provides a modern, Apple-inspired interface for managing members, classes, trainers, billing, analytics, and more.

### Core Principles
- **Apple-style Design**: Clean, minimal, elegant UI with smooth animations
- **Type Safety**: Full TypeScript with strict mode
- **Real-time Sync**: Supabase subscriptions for live data updates
- **Multi-tenant**: Row-level security with tenant isolation
- **Role-based Access**: Trainer, Employee, Admin permission levels
- **Responsive**: Desktop-first, mobile-friendly design

---

## Architecture & Tech Stack

### Frontend Stack
- **Framework**: React 18.2+ with TypeScript
- **Build Tool**: Vite 7.0
- **Routing**: React Router v6.22
- **State Management**: React Context API
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Headless UI, React Icons (Feather)
- **Animations**: Framer Motion 11.18
- **Forms**: React Hook Form 7.58 + Zod validation
- **Charts**: Chart.js 4.5, Recharts 2.15
- **Calendar**: FullCalendar 6.1, React Big Calendar 1.18
- **Notifications**: React Hot Toast 2.5
- **i18n**: i18next 25.2 + react-i18next 15.5

### Backend Stack
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions
- **Row Level Security**: Supabase RLS policies

### Development Tools
- **Linting**: ESLint with TypeScript plugin
- **Formatting**: Prettier
- **Testing**: Vitest 3.2 + React Testing Library
- **Type Checking**: TypeScript 5.3

---

## Design System & Aesthetics

### Design Philosophy
The application follows **Apple's Human Interface Guidelines** with:
- **Minimalism**: Clean interfaces with plenty of white space
- **Clarity**: Clear hierarchy and readable typography
- **Depth**: Subtle shadows and layering
- **Motion**: Smooth, natural animations
- **Consistency**: Unified patterns across all pages

### Visual Style

#### Border Radius
- **Small**: `rounded-lg` (0.5rem) - Buttons, small cards
- **Medium**: `rounded-xl` (1rem) - Inputs, medium cards
- **Large**: `rounded-2xl` (1.5rem) - Large cards, containers
- **Extra Large**: `rounded-3xl` (2rem) - Hero sections, major containers
- **Full**: `rounded-full` (9999px) - Pills, avatars, circular buttons

#### Shadows
- **Small**: `shadow-sm` - Subtle elevation
- **Medium**: `shadow-md` - Cards, modals
- **Large**: `shadow-lg` - Elevated cards
- **Extra Large**: `shadow-xl`, `shadow-2xl` - Major overlays

#### Spacing Scale
- **XS**: 0.5rem (8px)
- **SM**: 1rem (16px)
- **MD**: 1.5rem (24px)
- **LG**: 2rem (32px)
- **XL**: 3rem (48px)

#### Typography
- **Font Family**: 
  - Primary: `Inter`, `Cairo` (Arabic), `system-ui`, `sans-serif`
  - Arabic: `Cairo`, `Inter`, `system-ui`, `sans-serif`
  - Apple: `-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `SF Pro Text`
- **Font Sizes**:
  - `xs`: 0.75rem (12px)
  - `sm`: 0.875rem (14px)
  - `base`: 1rem (16px)
  - `lg`: 1.125rem (18px)
  - `xl`: 1.25rem (20px)
  - `2xl`: 1.5rem (24px)
  - `3xl`: 1.875rem (30px)
  - `4xl`: 2.25rem (36px)
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

#### Animations
- **Duration**:
  - Fast: 150ms
  - Normal: 300ms
  - Slow: 500ms
- **Easing**:
  - Ease: `cubic-bezier(0.4, 0, 0.2, 1)`
  - Ease In: `cubic-bezier(0.4, 0, 1, 1)`
  - Ease Out: `cubic-bezier(0, 0, 0.2, 1)`
- **Transitions**: All interactive elements use `transition-all duration-300`

### Component Patterns

#### Buttons
- **Shape**: Pill-shaped (`rounded-full`)
- **Default Background**: `bg-blue-50` (#EBF5FF)
- **Hover States**: Smooth color transitions
- **Minimum Height**: 44px (touch-friendly)
- **Variants**:
  - Primary: `bg-blue-600 hover:bg-blue-700`
  - Secondary: `bg-gray-100 hover:bg-gray-200`
  - Success: `bg-emerald-600 hover:bg-emerald-700`
  - Warning: `bg-orange-600 hover:bg-orange-700`
  - Ghost: `bg-transparent hover:bg-gray-100`

#### Cards
- **Shape**: `rounded-2xl` or `rounded-3xl`
- **Background**: White with subtle shadows
- **Hover**: `hover:shadow-md hover:border-gray-200`
- **Interactive**: `hover:scale-[1.02] active:scale-[0.98]`

#### Modals
- **Animation**: Slide in from right
- **Width**: Max-width `2xl` (672px) by default
- **Overlay**: `bg-black bg-opacity-50 backdrop-blur-sm`
- **Container**: Fixed right-side panel with shadow

#### Forms
- **Inputs**: `rounded-xl` with focus rings
- **Focus Ring**: `focus:ring-2 focus:ring-sky-500`
- **Labels**: `text-sm font-medium` with spacing

---

## Color System

### Primary Color Palette

#### MTDRB Brand Colors
```typescript
mtdrb: {
  50: '#f0f9ff',   // Lightest
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#7DCCFF',  // Primary brand color
  600: '#0E5EF2',  // Primary dark
  700: '#002D9C',
  800: '#001f6b',
  900: '#00123a',  // Darkest
}
```

#### Apple Blue
```typescript
appleBlue: {
  DEFAULT: '#0071E3',
  50: '#E6F2FF',
  100: '#CCE5FF',
  200: '#99CBFF',
  300: '#66B1FF',
  400: '#3397FF',
  500: '#0071E3',  // Apple's signature blue
  600: '#005AB8',
  700: '#00438C',
  800: '#002C61',
  900: '#001535',
}
```

### Semantic Colors

#### Success (Emerald)
```typescript
success: {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',  // Primary success
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
}
```

#### Error (Red)
```typescript
error: {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',  // Primary error
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
}
```

#### Warning (Amber/Orange)
```typescript
warning: {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',  // Primary warning
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
}
```

#### Info (Blue)
```typescript
info: {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',  // Primary info
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
}
```

### Accent Colors

#### Sky Blue
```typescript
sky: {
  500: '#60A5FA',  // Primary accent
  600: '#0284c7',
  700: '#0369a1',
}
```

#### Rose (Pink)
```typescript
rose: {
  500: '#F472B6',  // Primary accent
  600: '#e11d48',
  700: '#be123c',
}
```

#### Emerald (Green)
```typescript
emerald: {
  500: '#34D399',  // Primary accent
  600: '#059669',
  700: '#047857',
}
```

#### Gold (Yellow)
```typescript
gold: {
  500: '#FBBF24',  // Primary accent
  600: '#d97706',
  700: '#b45309',
}
```

### Background & Surface Colors

#### Light Theme
```typescript
background: '#FAFAFA'      // Main background
surface: '#F2F2F5'         // Card/surface background
surfaceHover: '#E8E8EB'    // Hover state
```

#### Dark Theme
```typescript
background: '#111827'      // Main background
surface: '#1F2937'         // Card/surface background
surfaceHover: '#374151'    // Hover state
```

### Text Colors

#### Light Theme
```typescript
primary: '#1A1A1A'        // Main text
secondary: '#6B6B6B'      // Secondary text
tertiary: '#9CA3AF'       // Tertiary/muted text
```

#### Dark Theme
```typescript
primary: '#F9FAFB'        // Main text
secondary: '#D1D5DB'      // Secondary text
tertiary: '#9CA3AF'       // Tertiary/muted text
```

### Page-Specific Themes

Each page has its own color theme for visual distinction:

#### Dashboard
- **Accent**: Sky Blue (`#0ea5e9`)
- **Gradient**: `from-sky-400 to-blue-500`
- **Icon**: `text-sky-600`
- **Button**: `bg-sky-500 hover:bg-sky-600`
- **Card**: `border-sky-200 bg-sky-50/30`
- **Badge**: `bg-sky-100 text-sky-800`

#### Members
- **Accent**: Emerald Green (`#10b981`)
- **Gradient**: `from-emerald-400 to-green-500`

#### Classes
- **Accent**: Amber Orange (`#f59e0b`)
- **Gradient**: `from-amber-400 to-orange-500`

#### Trainers
- **Accent**: Fuchsia Pink (`#d946ef`)
- **Gradient**: `from-fuchsia-400 to-pink-500`

#### Billing
- **Accent**: Green (`#22c55e`)
- **Gradient**: `from-green-400 to-emerald-500`

#### Analytics
- **Accent**: Blue (`#3b82f6`)
- **Gradient**: `from-blue-400 to-indigo-500`

#### Promotions
- **Accent**: Purple (`#a855f7`)
- **Gradient**: `from-purple-400 to-violet-500`

#### Reports
- **Accent**: Slate Gray (`#64748b`)
- **Gradient**: `from-slate-400 to-gray-500`

#### Tasks
- **Accent**: Orange (`#f97316`)
- **Gradient**: `from-orange-400 to-red-500`

#### Settings
- **Accent**: Gray (`#6b7280`)
- **Gradient**: `from-gray-400 to-slate-500`

#### Insights
- **Accent**: Sky Blue (`#0ea5e9`)
- **Gradient**: `from-sky-400 to-cyan-500`

### Brand Colors (Customizable)
Users can customize primary and secondary brand colors:
- **Default Primary**: `#155FD9`
- **Default Secondary**: `#489BFA`
- Stored in Supabase tenant metadata
- Applied via CSS variables: `--brand-primary`, `--brand-secondary`

---

## Component Patterns

### Layout Components

#### Layout
- **Location**: `src/components/Layout.tsx`
- **Structure**: Sidebar + TopBar + Main Content
- **Features**: Page theme detection, route transitions

#### Sidebar
- **Location**: `src/components/Sidebar.tsx`
- **Features**: Navigation, role-based menu items, active state

#### TopBar
- **Location**: `src/components/TopBar.tsx`
- **Features**: User menu, notifications, theme toggle

### UI Components

#### Buttons
- **Location**: `src/components/ui/button.tsx`
- **Variants**: Primary, Secondary, Success, Warning, Ghost
- **Props**: `variant`, `size`, `loading`, `disabled`

#### Cards
- **Pattern**: `rounded-2xl bg-white shadow-sm`
- **Interactive**: Hover scale and shadow transitions
- **Variants**: Default, Success, Alert, Error, Analytics, Revenue

#### Modals
- **MTDRBModal**: `src/components/ui/MTDRBModal.tsx`
  - Slide-in from right
  - Backdrop blur
  - Form sections support
- **UnifiedModal**: `src/components/ui/UnifiedModal.tsx`
  - Configurable slide direction
  - Pro feature gating
- **SmartModal**: `src/components/ui/SmartModal.tsx`
  - Enhanced with animations
  - Loading states

#### Forms
- **SmartFormComponents**: `src/components/ui/SmartFormComponents.tsx`
  - `FormField`: Text inputs
  - `SelectField`: Dropdowns
  - `TextAreaField`: Multi-line text
  - `CheckboxField`: Checkboxes
  - `FormSection`: Grouped fields
  - `ValidationSummary`: Error display
  - `SuccessMessage`: Success feedback

#### Tables
- **SmartTable**: `src/components/ui/DesignSystem.tsx`
- **Features**: Sorting, filtering, pagination
- **Styling**: Hover states, striped rows

#### Loading States
- **SmartLoading**: Skeleton screens
- **SkeletonScreens**: `src/components/ui/SkeletonScreens.tsx`
  - Card skeletons
  - Table skeletons
  - List skeletons

### Feature Components

#### Member Management
- **Location**: `src/components/members/`
- **Components**: MemberList, MemberCard, MemberForm, MemberModals
- **Features**: CRUD operations, search, filters, export

#### Class Management
- **Location**: `src/components/classes/`
- **Components**: ClassCalendar, ClassList, ClassForm, ClassModals
- **Features**: Calendar view, scheduling, recurrence

#### Trainer Management
- **Location**: `src/components/trainers/`
- **Components**: TrainerList, TrainerCard, TrainerForm, TrainerSchedule
- **Features**: Performance tracking, availability, ratings

#### Billing
- **Location**: `src/components/billing/`
- **Components**: InvoiceList, ExpenseList, VATReports, PaymentTracking
- **Features**: Invoicing, expense tracking, VAT compliance

#### Analytics
- **Location**: `src/components/analytics/`
- **Components**: Charts, Metrics, Dashboards
- **Features**: Revenue, member, trainer, class analytics

---

## API Functions

### Client API (`src/api/client.ts`)

#### Authentication
```typescript
api.auth.signUp(email, password, name)
api.auth.signIn(email, password)
api.auth.signOut()
api.auth.getUser()
api.auth.getSession()
```

#### Members
```typescript
api.members.getAll()
api.members.getById(id)
api.members.create(data)
api.members.update(id, data)
api.members.delete(id)
api.members.search(query)
```

#### Classes
```typescript
api.classes.getAll()
api.classes.getById(id)
api.classes.create(data)
api.classes.update(id, data)
api.classes.delete(id)
api.classes.getByDateRange(start, end)
```

#### Invoices
```typescript
api.invoices.getAll()
api.invoices.getById(id)
api.invoices.create(data)
api.invoices.update(id, data)
api.invoices.delete(id)
```

#### Bookings
```typescript
api.bookings.getAll()
api.bookings.getByClassId(classId)
api.bookings.create(data)
api.bookings.update(id, data)
api.bookings.delete(id)
```

#### Trainers
```typescript
api.trainers.getAll()
api.trainers.getById(id)
api.trainers.create(data)
api.trainers.update(id, data)
api.trainers.delete(id)
api.trainers.getPerformance(id)
api.trainers.getSchedule(id, startDate, endDate)
api.trainers.updateAvailability(id, availability)
```

#### Analytics
```typescript
api.analytics.getOverview()
api.analytics.getMemberMetrics(period)
api.analytics.getTrainerMetrics(period)
api.analytics.getClassMetrics(period)
api.analytics.getFinancialMetrics(period)
```

#### Tasks
```typescript
api.tasks.getAll()
api.tasks.create(data)
api.tasks.update(id, data)
api.tasks.delete(id)
api.tasks.getByMember(memberId)
api.tasks.getByAssignee(assigneeId)
```

#### Expenses
```typescript
api.expenses.getAll()
api.expenses.getById(id)
api.expenses.create(data)
api.expenses.update(id, data)
api.expenses.delete(id)
api.expenses.getByDateRange(start, end)
api.expenses.getByCategory(category)
```

#### VAT Returns
```typescript
api.vatReturns.getAll()
api.vatReturns.getById(id)
api.vatReturns.create(data)
api.vatReturns.update(id, data)
api.vatReturns.delete(id)
api.vatReturns.getByPeriod(start, end)
api.vatReturns.submit(id)
```

#### Branches
```typescript
api.branches.getAll()
api.branches.getById(id)
api.branches.create(data)
api.branches.update(id, data)
api.branches.delete(id)
api.branches.getActive()
```

#### Automation
```typescript
api.automation.getWorkflows()
api.automation.createWorkflow(data)
api.automation.updateWorkflow(id, data)
api.automation.deleteWorkflow(id)
api.automation.getSettings()
api.automation.updateSettings(data)
```

### Specialized API Modules

#### Member API (`src/api/member.ts`)
```typescript
getAllMembers(tenantId): Promise<Member[]>
```

#### Class API (`src/api/class.ts`)
- Class-specific operations

#### VAT API (`src/api/vat.ts`)
- VAT transaction management
- VAT return generation
- Compliance tracking

#### Settings API (`src/api/settings.ts`)
- Gym settings management
- Tenant configuration

#### Validation API (`src/api/validation.ts`)
- Input validation helpers
- Schema validation

#### Secure Client (`src/api/secureClient.ts`)
- Authenticated API calls
- Tenant isolation
- Error handling

---

## Utility Functions

### Logger (`src/utils/logger.ts`)
Development-only logging utility:
```typescript
logger.log(message, data?, options?)
logger.warn(message, data?, options?)
logger.error(message, error?, options?)
logger.info(message, data?, options?)
logger.debug(message, data?, options?)
logger.group(label, fn)
logger.time(label, fn)
logger.table(data, options?)
```

### Route Preservation (`src/utils/routePreservation.ts`)
Preserves route state (tabs, filters, pagination, search):
```typescript
useRoutePreservation(path)
  - saveState(state)
  - getState()
  - saveTab(tab)
  - getTab()
  - saveFilters(filters)
  - getFilters()
  - saveSort(field, direction)
  - getSort()
  - savePagination(page, limit)
  - getPagination()
  - saveSearch(search)
  - getSearch()
  - initializeFromURL()
```

### Export Data (`src/utils/exportData.ts`)
Data export utilities:
```typescript
exportToCSV(data, filename)
exportToExcel(data, filename)
exportToPDF(data, filename)
```

### Date Validation (`src/utils/dateValidation.ts`)
Date validation and formatting helpers

### Sanitize Input (`src/utils/sanitizeInput.ts`)
XSS protection and input sanitization

### Navigation (`src/utils/navigation.ts`)
Navigation helpers and utilities

### Debug Auth (`src/utils/debugAuth.ts`)
Authentication debugging utilities (dev only)

---

## Styling Guidelines

### Tailwind CSS Usage

#### Class Naming
- Use Tailwind utility classes directly
- Prefer composition over custom classes
- Use design tokens from `src/theme/index.ts`

#### Responsive Design
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Hide/show: `hidden lg:block`

#### Dark Mode
- Use `dark:` prefix for dark mode styles
- Example: `bg-white dark:bg-gray-800`

#### Hover States
- Always include hover states for interactive elements
- Use `hover:` prefix
- Example: `hover:bg-gray-100 hover:shadow-md`

#### Transitions
- Use `transition-all duration-300` for smooth animations
- Faster transitions: `duration-150`
- Slower transitions: `duration-500`

### Design Tokens

#### Using Theme Colors
```typescript
import { pageThemes, getPageTheme } from '@/theme';

const theme = getPageTheme('dashboard');
// theme.accent, theme.gradient, theme.button, etc.
```

#### Using Design Tokens
```typescript
import { designTokens } from '@/theme';

// Cards
className={designTokens.card.base + ' ' + designTokens.card.hover}

// Buttons
className={designTokens.button.base + ' ' + designTokens.button.primary}

// Forms
className={designTokens.form.input}
```

### Component Styling Patterns

#### Card Component
```tsx
<div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 
                hover:shadow-md hover:border-gray-200 
                transition-all duration-300">
  {content}
</div>
```

#### Button Component
```tsx
<button className="rounded-full px-6 py-3 font-medium 
                   bg-blue-600 hover:bg-blue-700 text-white 
                   transition-all duration-300 
                   flex items-center justify-center space-x-2
                   min-h-[44px]">
  {children}
</button>
```

#### Input Component
```tsx
<input className="w-full px-4 py-3 rounded-xl 
                 border border-gray-200 bg-white 
                 text-gray-900 placeholder-gray-500 
                 focus:ring-2 focus:ring-sky-500 focus:border-transparent 
                 transition-all duration-300" />
```

#### Modal Component
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40">
  <div className="fixed top-0 right-0 h-full w-full max-w-2xl 
                  bg-white shadow-2xl z-50">
    {content}
  </div>
</div>
```

---

## File Structure

```
mtdrb-admin-webapp/
├── public/                 # Static assets
│   ├── mockups/           # Design mockups
│   └── *.png              # Screenshots
├── src/
│   ├── api/               # API client functions
│   │   ├── client.ts      # Main API client
│   │   ├── member.ts      # Member API
│   │   ├── class.ts       # Class API
│   │   ├── vat.ts         # VAT API
│   │   └── ...
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── members/      # Member management
│   │   ├── classes/      # Class management
│   │   ├── trainers/     # Trainer management
│   │   ├── billing/      # Billing components
│   │   ├── analytics/    # Analytics components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── auth/         # Authentication
│   │   └── ...
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── UIContext.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── usePermissions.ts
│   │   ├── usePageTheme.ts
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Members.tsx
│   │   ├── Classes.tsx
│   │   └── ...
│   ├── services/         # Business logic services
│   │   ├── errorHandler.ts
│   │   ├── realtimeService.ts
│   │   └── ...
│   ├── theme/            # Design system
│   │   └── index.ts      # Theme configuration
│   ├── types/            # TypeScript types
│   │   ├── index.ts
│   │   ├── member.ts
│   │   └── roles.ts
│   ├── utils/            # Utility functions
│   │   ├── logger.ts
│   │   ├── exportData.ts
│   │   └── ...
│   ├── App.tsx           # Main app component
│   ├── main.tsx         # Entry point
│   └── supabaseClient.ts # Supabase client
├── supabase/             # Supabase migrations
├── scripts/              # Utility scripts
├── tailwind.config.js    # Tailwind configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies
```

---

## Key Features

### 1. Multi-Tenant Architecture
- Row-level security (RLS) for data isolation
- Tenant-specific branding
- Branch management

### 2. Role-Based Access Control
- **Trainer**: Basic access, own classes
- **Employee**: Full member/class management
- **Admin**: System settings, billing, analytics

### 3. Real-Time Synchronization
- Supabase Realtime subscriptions
- Live updates across clients
- Optimistic UI updates

### 4. Member Management
- Complete CRUD operations
- Search and filtering
- Membership tracking
- Payment history
- Task management

### 5. Class Management
- Calendar view (FullCalendar)
- Recurring classes
- Capacity management
- Booking system
- Attendance tracking

### 6. Trainer Management
- Performance metrics
- Schedule management
- Availability tracking
- Rating system
- Revenue tracking

### 7. Billing & Finance
- Invoice generation
- Expense tracking
- VAT compliance (GCC)
- Payment tracking
- Financial reports

### 8. Analytics & Reporting
- Revenue analytics
- Member metrics
- Trainer performance
- Class utilization
- Custom date ranges
- Export capabilities

### 9. Task Management
- Member follow-ups
- Payment reminders
- Renewal tracking
- Priority levels
- Assignment system

### 10. Automation
- Workflow system
- Trigger-based actions
- Notification preferences
- Schedule management

### 11. Settings & Configuration
- Gym settings
- Branding customization
- User preferences
- Branch management
- System configuration

### 12. Internationalization
- i18next integration
- Arabic (RTL) support
- Multi-language ready

---

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode, explicit types
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Comments**: JSDoc for all functions and components

### Best Practices
1. **Type Safety**: Avoid `any`, use proper types
2. **Error Handling**: Use error boundaries and try/catch
3. **Performance**: Use memoization (`React.memo`, `useMemo`)
4. **Accessibility**: ARIA labels, keyboard navigation
5. **Security**: Input sanitization, XSS protection
6. **Testing**: Unit tests for utilities, integration tests for components

### Component Structure
```tsx
/**
 * Component description
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="...">
      {content}
    </div>
  );
};
```

### API Call Pattern
```typescript
const fetchData = async () => {
  try {
    const { data, error } = await api.members.getAll();
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to fetch members', error);
    throw error;
  }
};
```

---

## Environment Variables

Required environment variables (see `.env.template`):
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- Additional variables as needed

---

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint errors
- `npm run format`: Format code with Prettier
- `npm run test`: Run tests
- `npm run typecheck`: Type check without emitting

---

## Conclusion

This documentation provides a comprehensive overview of the MTDRB Admin Webapp project. For specific implementation details, refer to the source code and inline comments. The project follows modern React best practices with a focus on type safety, user experience, and maintainability.

For questions or contributions, please refer to the project's contribution guidelines and code of conduct.
