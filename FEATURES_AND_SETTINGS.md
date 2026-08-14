# MTDRB Admin — Features & Settings Reference

Complete product documentation for every feature, setting, permission, and workflow in the MTDRB Admin webapp.

**MTDRB Admin** (also branded **Idara** on the landing page) is a multi-tenant gym management platform for the GCC region. It provides member CRM, class scheduling, trainer management, billing with VAT compliance, analytics, task management, and multi-branch operations — all behind role-based access control with English and Arabic UI support.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Authentication & Onboarding](#2-authentication--onboarding)
3. [Navigation & Routes](#3-navigation--routes)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Subscription Plans (SaaS)](#5-subscription-plans-saas)
6. [Dashboard](#6-dashboard)
7. [Members](#7-members)
8. [Classes](#8-classes)
9. [Trainers](#9-trainers)
10. [Billing & Finance](#10-billing--finance)
11. [Analytics & Reports](#11-analytics--reports)
12. [Tasks](#12-tasks)
13. [Branches](#13-branches)
14. [Membership Plans (Member-Facing)](#14-membership-plans-member-facing)
15. [Settings](#15-settings)
16. [Profile](#16-profile)
17. [Internationalization (i18n)](#17-internationalization-i18n)
18. [Automation, Realtime & AI](#18-automation-realtime--ai)
19. [Design & UI System](#19-design--ui-system)
20. [Data Model & API](#20-data-model--api)
21. [Environment & Development Mode](#21-environment--development-mode)
22. [Implementation Notes & Gaps](#22-implementation-notes--gaps)

---

## 1. Platform Overview

| Area | Description |
|------|-------------|
| **Target users** | Gym owners, managers, front-desk staff, trainers |
| **Architecture** | React + TypeScript SPA (Vite), Supabase backend (PostgreSQL, Auth, Storage, Realtime) |
| **Tenancy** | Each gym is a `tenant`; all data is scoped by `tenant_id` with Row Level Security |
| **Default region** | GCC-focused — SAR currency, VAT support, Arabic RTL |
| **Design language** | Apple-inspired — rounded cards, pill buttons, slide-in modals, light/dark themes |

### Core capabilities at a glance

- Member lifecycle management (CRUD, import/export, trainer assignment, analytics)
- Class scheduling with calendar, waitlist, bookings, and capacity tracking
- Trainer roster, performance dashboards, and schedule management
- Invoicing, expenses, profit/loss analytics, and VAT reporting
- Cross-module analytics with smart/AI-style insights
- Staff task tracking tied to members
- Multi-branch gym locations
- Configurable gym settings, security policies, and integrations
- Bilingual UI (English / Arabic)

---

## 2. Authentication & Onboarding

### User journey

```
Landing (/) → Sign Up → Subscribe → Onboarding → Dashboard
              ↘ Login ─────────────────────────────┘
```

### Login (`/login`)

- Email + password via Supabase Auth
- Redirects authenticated users to dashboard (or prior destination)
- Unpaid users are sent to `/subscribe`
- On **localhost**, auth is bypassed with a mock admin user (see [§21](#21-environment--development-mode))

### Sign Up (`/signup`)

Collects:

- Full name
- Email
- Password
- Gym name

On success:

1. Creates Supabase auth user
2. Calls `create_tenant_with_membership` RPC to create tenant + admin membership
3. Redirects to `/subscribe`

### Subscribe (`/subscribe`)

Gym selects an MTDRB SaaS plan before using the app.

| Plan | Price | Key limits |
|------|-------|------------|
| **Starter** | $99/month | Up to 100 members, basic management, scheduling, payments, email support |
| **Pro** | $199/month | Unlimited members, advanced analytics, automation, PT tools, VAT reporting, priority support, custom branding, API access |

Sets `paid`, `subscription_tier`, and `subscription_start` in user metadata.  
If onboarding is incomplete → `/onboarding`; otherwise → `/dashboard`.

> **Note:** Payment is metadata-based today — no live Stripe checkout in the subscribe flow.

### Onboarding (`/onboarding`)

Four-step wizard:

| Step | Content |
|------|---------|
| 1. Gym Info | Gym name, contact details, timezone |
| 2. Branch Setup | First branch location |
| 3. Staff Setup | Initial trainer/staff records |
| 4. Branding | Logo and visual identity |

Persists tenant, branch, and staff to Supabase. Sets `onboarding_completed: true` and navigates to dashboard with a welcome message.

### Auth infrastructure

| Component | Purpose |
|-----------|---------|
| `AuthProvider` | Session state, role metadata, sign-in/out, permission checks |
| `AuthSetup` | Bootstraps membership on protected routes; verifies tenant linkage |
| `PermissionGuard` | Route-level role enforcement |

### Automatic redirects

| Condition | Destination |
|-----------|-------------|
| Not authenticated on protected route | `/login` |
| Authenticated but unpaid (past trial) | `/subscribe` |
| Paid but onboarding incomplete | `/onboarding` |
| Sign out | `/` (landing) |

---

## 3. Navigation & Routes

### Sidebar (primary navigation)

| Item | Route | Min role |
|------|-------|----------|
| Dashboard | `/dashboard` | trainer |
| Members | `/dashboard/members` | employee |
| Classes | `/dashboard/classes` | trainer |
| Trainers | `/dashboard/trainers` | employee |
| Billing | `/dashboard/billing` | employee |
| Analytics | `/dashboard/analytics` | employee |
| Tasks | `/dashboard/tasks` | trainer |
| Branches | `/dashboard/branches` | admin |
| Settings | `/dashboard/settings` | admin |

### Additional routes (not in sidebar)

| Route | Purpose | Min role |
|-------|---------|----------|
| `/dashboard/profile` | User profile scaffold | trainer |
| `/dashboard/plans` | Membership plan management | admin |
| `/dashboard/reports` | Redirects to `/dashboard/analytics?tab=reports` | employee |

### Legacy redirects

`/members`, `/classes`, `/trainers`, `/analytics`, `/billing`, `/settings`, etc. → `/dashboard/...`

### Demo / development routes

| Route | Purpose |
|-------|---------|
| `/modals-demo` | Member modal showcase |
| `/class-modals-demo` | Class modal showcase |

### Public pages

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing page (PremiumLanding) |
| `*` | 404 Not Found |

---

## 4. User Roles & Permissions

### Role hierarchy

```
admin (level 2)  >  employee (level 1)  >  trainer (level 0)
```

| Role | Display name | Description |
|------|--------------|-------------|
| **admin** | Administrator | Full access including settings, branches, plans |
| **employee** | Employee | Members, trainers, billing, analytics — no admin settings |
| **trainer** | Trainer | Dashboard, classes, tasks, own profile |

### Permission strings

| Role | Permissions |
|------|-------------|
| admin | `all` |
| employee | `read`, `write`, `manage_staff` |
| trainer | `read`, `write_classes` |

### `usePermissions` hook helpers

`canCreate`, `canEdit`, `canDelete`, `canView`, `canManageStaff`, `canManageClasses`, `isAdmin`, `isEmployee`, `isTrainer`

### Route access matrix

| Route / Module | trainer | employee | admin |
|----------------|:-------:|:--------:|:-----:|
| Dashboard | ✓ | ✓ | ✓ |
| Profile | ✓ | ✓ | ✓ |
| Classes | ✓ | ✓ | ✓ |
| Tasks | ✓ | ✓ | ✓ |
| Members | | ✓ | ✓ |
| Trainers | | ✓ | ✓ |
| Billing | | ✓ | ✓ |
| Analytics | | ✓ | ✓ |
| Branches | | | ✓ |
| Settings | | | ✓ |
| Plans | | | ✓ |

> Sidebar shows all items to every authenticated user; `PermissionGuard` enforces access at the route level.

---

## 5. Subscription Plans (SaaS)

### MTDRB platform tiers (gym pays MTDRB)

See [Subscribe](#subscribe-subscribe) for Starter vs Pro details.

Stored in **user metadata**: `paid`, `subscription_tier` (`starter` / `pro` / `enterprise`), `subscription_start`.

### Pro feature gating (`SubscriptionContext`)

When `isPro` is true, these flags unlock:

| Feature flag | Description |
|--------------|-------------|
| `deepAnalytics` | Advanced analytics views |
| `advancedReports` | Report generation & scheduling |
| `automationEngine` | Workflow automation |
| `memberInsights` | AI/smart member insights |
| `bulkOperations` | Bulk member operations |
| `customBranding` | Custom gym branding |
| `apiAccess` | API access |

Pro is determined by active `subscriptions` table record, demo/test email patterns, or localhost dev mode.

---

## 6. Dashboard

**Route:** `/dashboard`  
**Tabs:** Overview | Analytics

### Overview tab

| Component | Features |
|-----------|----------|
| `DashboardHeader` | Page title, manual refresh |
| `DashboardOverview` / `SmartDashboardOverview` | KPI summary cards |
| `LiveKPITracker` | Live revenue, members, classes, satisfaction metrics |
| `BusinessOverview` | Revenue trends, member growth, class utilization |
| `MemberEngagement` | Engagement scores, at-risk members |
| `TrainerPerformancePanel` | Top trainer metrics |
| `LiveActivityFeed` | Recent gym activity stream |
| `SmartWidgets` | Today's schedule, new members, trainer performance, recent bookings |
| `SetTargetsModal` | Set targets for revenue, members, attendance, satisfaction |

### Analytics tab

| Component | Features |
|-----------|----------|
| `SmartDashboardAnalytics` | Deeper dashboard-level charts and trends |

---

## 7. Members

**Route:** `/dashboard/members`  
**Min role:** employee  
**Tabs:** Dashboard | Member List | Analytics

### Member List features

- Search by name, email
- Filter by status, membership type
- Advanced multi-criteria filtering (`AdvancedFilterModal`)
- Sortable columns
- Pagination
- Export to CSV, Excel, PDF

### Member data fields

| Field | Description |
|-------|-------------|
| Personal | First name, last name, email, phone |
| Membership | Type (`basic` / `premium` / `vip`), status |
| Assignment | Trainer, branch |
| Dates | Join date, created/updated timestamps |

### Modals & actions

| Modal | Action |
|-------|--------|
| `AddMemberModal` | Create new member |
| `EditMemberModal` | Update member details |
| `DeleteMemberModal` | Remove member |
| `ViewMemberProfileModal` | Read-only profile view |
| `ImportMembersModal` | Bulk CSV import |
| `AssignTrainerModal` | Link member to trainer |
| `CancelMembershipModal` | Cancel membership *(component exists, not wired to page)* |
| `AdvancedFilterModal` | Complex filter builder |

### Analytics tab

- Member growth and churn
- Membership type breakdown
- Retention metrics
- Engagement scoring
- Branch-level member distribution

### Automation (component exists)

`AutomationEngine` — workflows for onboarding, retention, engagement, upsell, reactivation, and payment reminders.

---

## 8. Classes

**Route:** `/dashboard/classes`  
**Min role:** trainer  
**Tabs:** Dashboard | Calendar | Analytics | Management

### Dashboard tab

- Class KPI cards (today's classes, capacity, bookings)
- Upcoming sessions
- Quick actions

### Calendar tab

- Full calendar view (`ClassCalendar` — FullCalendar / React Big Calendar)
- Month/week/day views
- Click to view or edit sessions

### Management tab

- `ClassTable` — searchable, filterable class list
- `ClassDetailsDrawer` — inline detail panel
- Status management (scheduled, in progress, completed, cancelled)

### Class data fields

| Field | Description |
|-------|-------------|
| Name, description | Class identity |
| Trainer | Assigned trainer |
| Schedule | Start time, end time, recurrence |
| Capacity | Max attendees, current bookings |
| Type | yoga, hiit, strength, pilates, cardio, other |
| Price | Per-session price |
| Status | scheduled / in_progress / completed / cancelled |

### Modals & actions

| Modal | Action |
|-------|--------|
| `AddClassModal` | Create class |
| `EditClassModal` | Update class |
| `DeleteClassModal` | Delete class |
| `ScheduleClassModal` | Schedule new session |
| `CancelClassModal` | Cancel session |
| `ViewClassDetailsModal` | View details |
| `AssignTrainerModal` | Assign/reassign trainer |
| `ProcessWaitlistModal` | Promote waitlisted members |
| `ExportClassDataModal` | Export class data |
| `UpdateClassSettingsModal` | Class-level settings |
| `SendClassPromotionModal` | Send promotional message |
| `WaitlistModal` | Manage waitlist entries |

### Waitlist API

- `addToWaitlist`, `removeFromWaitlist`, `promoteFromWaitlist`
- Position tracking and notification status

### Bookings

- Book, cancel, check-in via `class_bookings` table
- Attendance tracking
- Capacity enforcement

### Automation (component exists)

`ClassAutomationEngine` — automated reminders, capacity alerts, waitlist promotion.

---

## 9. Trainers

**Route:** `/dashboard/trainers`  
**Min role:** employee  
**Tabs:** Dashboard | Analytics | Trainer List

### Trainer List features

- Search and filter trainers
- Status management (active, inactive, on leave)
- Performance ratings

### Trainer data fields

| Field | Description |
|-------|-------------|
| Personal | First name, last name, email, phone |
| Professional | Specialties, hourly rate, bio |
| Metrics | Rating, total classes, member count |
| Status | active / inactive / on_leave |

### Modals & actions

| Modal | Action |
|-------|--------|
| `AddTrainerModal` | Create trainer |
| `EditTrainerModal` | Update trainer |
| `DeleteTrainerModal` | Remove trainer |
| `ViewTrainerProfileModal` | View profile |
| `AssignClassesModal` | Assign classes to trainer |
| `UpdateTrainerStatusModal` | Change status |
| `ExportTrainerDataModal` | Export trainer data |
| `TrainerScheduleModal` | View/edit schedule |
| `TrainerPaymentsModal` | Payment records |
| `TrainerAnalyticsModal` | Per-trainer analytics |
| `TrainerNotesModal` | Internal notes |
| `TrainerAutomationModal` | Trainer-specific automations |
| `TrainerRequestsModal` | Trainer requests queue |

### Analytics tab

- `TrainerPerformanceDashboard` — KPIs per trainer
- `SmartTrainerAnalytics` — trends, comparisons, member growth per trainer

### Automation (component exists, not rendered)

`TrainerAutomationEngine` — imported but not currently shown on the page.

---

## 10. Billing & Finance

**Route:** `/dashboard/billing`  
**Min role:** employee  
**Tabs:** Overview | Invoices | Expenses | Analytics | VAT Reports | Settings

### Overview tab

| Component | Metrics |
|-----------|---------|
| `BillingKPICards` | Revenue, expenses, profit, overdue invoices |
| `SmartBillingDashboard` | Financial snapshot |
| Recent transactions list | Latest invoices and payments |

### Invoices tab

| Feature | Details |
|---------|---------|
| Invoice types | membership, class, personal_training, product, other |
| Statuses | draft, pending, paid, overdue, cancelled |
| Line items | Description, quantity, unit price, VAT |
| Modals | `AddInvoiceModal`, `NewInvoiceModal`, `ViewInvoiceModal`, `GenerateInvoiceModal`, `ProcessPaymentModal` |

### Expenses tab

| Feature | Details |
|---------|---------|
| Categories | Filterable expense categories |
| Approval | pending / approved / rejected |
| Receipts | Receipt attachment support |
| Modals | `AddExpenseModal`, `ViewExpenseModal` |

### Analytics tab

| Component | Features |
|-----------|----------|
| `FinancialInsightsDashboard` | P&L, revenue change, expense breakdown |
| `SmartBillingAnalytics` | Trend analysis |
| `InsightsSection` | Actionable financial insights |

### VAT Reports tab

| Feature | Details |
|---------|---------|
| `SmartVatDashboard` | VAT collected vs paid, compliance score |
| GCC VAT rates | Country-specific rate lookup |
| VAT returns | Generate, submit, track deadlines |
| Modals | `GenerateVATReportModal`, `VatReportModal` |
| Compliance audit | Automated compliance checks |

### Billing Settings tab

- Auto-invoicing toggle
- Payment reminder configuration
- VAT enabled toggle and rate

### Additional billing components

| Component | Purpose |
|-----------|---------|
| `BillingAutomationEngine` | Invoice reminders, payment collection workflows |
| `AddSubscriptionModal` | Member subscription management |
| `ManagePlansModal` | Plan pricing management |
| `ExportBillingDataModal` | Export billing data (Pro-gated) |

---

## 11. Analytics & Reports

**Route:** `/dashboard/analytics`  
**Min role:** employee  
**Tabs:** Overview | Members | Revenue | Classes | Insights

### Filters (global)

- Date range: last 7 / 30 / 90 days, this year
- Branch filter (multi-branch gyms)

### Tab details

| Tab | Component | Metrics |
|-----|-----------|---------|
| **Overview** | Stat cards | Total members, revenue, bookings, growth % |
| **Members** | `MemberAnalytics` | Growth, retention, demographics, branch breakdown |
| **Revenue** | `RevenueOverview` | Revenue trends, invoice breakdown, VAT totals |
| **Classes** | Placeholder UI | Class utilization (partial implementation) |
| **Insights** | `SmartInsightCards`, `AIInsights` | Smart insights from `smart_insights` table; Pro-gated actions |

### Report modals

| Modal | Purpose |
|-------|---------|
| `ExportReportModal` | Export analytics data |
| `DownloadReportModal` | Download formatted report |
| `PrintReportModal` | Print-friendly report |
| `ShareReportModal` | Share report via link/email |
| `ScheduleReportModal` | Schedule recurring reports |
| `CreateCustomReportModal` | Build custom report |
| `GenerateReportModal` | General report generator |
| `GenerateMemberReportModal` | Member-specific report |
| `GenerateTrainerReportModal` | Trainer-specific report |
| `GenerateClassReportModal` | Class-specific report |
| `CreateFinancialReportModal` | Financial report |
| `GenerateVATReportModal` | VAT compliance report |
| `ViewAIInsightsModal` | View smart/AI insights |
| `ApplyRecommendationModal` | Apply an insight recommendation |
| `LearnMoreInsightModal` | Insight detail drill-down |

### Report templates (`ReportGenerator` component)

- Monthly Revenue Summary
- Member Engagement
- Trainer Performance
- Class Utilization
- Financial Forecast
- Member Health Dashboard

Categories: financial, member, trainer, operational

### Database analytics RPCs

- `get_analytics_overview`
- `get_member_metrics`
- `get_trainer_metrics`
- `get_class_metrics`
- `get_financial_metrics`

---

## 12. Tasks

**Route:** `/dashboard/tasks`  
**Min role:** trainer  
**Tabs:** Overview | Analytics

### Task features

- Task list with status, priority, assignee, due date
- Create, edit, complete, pause, assign tasks
- Tied to members via `member_tasks` table
- Export task data

### Task modals

| Modal | Action |
|-------|--------|
| `AddTaskModal` | Create task *(wired)* |
| `EditTaskModal` | Update task |
| `DeleteTaskModal` | Delete task |
| `StartTaskModal` | Mark in progress |
| `CompleteTaskModal` | Mark complete |
| `PauseTaskModal` | Pause task |
| `AssignTaskModal` | Reassign task |
| `ExportTaskDataModal` | Export tasks |
| `SetupTaskAutomationModal` | Configure automation |
| `EnableAutoAssignmentModal` | Auto-assign rules |
| `EnablePrioritySortingModal` | Priority sorting |
| `EnableDeadlineRemindersModal` | Deadline reminders |

### Analytics tab

`SmartTaskAnalytics` — completion rates, overdue tasks, average completion time, assignee workload.

### Automation (component exists)

`TaskAutomationEngine` — auto-assignment, deadline reminders, priority sorting.

---

## 13. Branches

**Route:** `/dashboard/branches`  
**Min role:** admin  
**Tab:** List

### Features

- View all gym locations
- Filter active / inactive branches
- Full CRUD via `BranchTable` and modals

### Branch data fields

| Field | Description |
|-------|-------------|
| Name | Branch name |
| Address | Street, city, country |
| Contact | Phone, email |
| Status | `is_active` flag |

### Modals

| Modal | Action |
|-------|--------|
| `AddBranchModal` | Create branch |
| `EditBranchModal` | Update branch |
| `DeleteBranchModal` | Delete branch |
| `ViewBranchModal` | View details |

---

## 14. Membership Plans (Member-Facing)

**Route:** `/dashboard/plans`  
**Min role:** admin  
**Not in sidebar** — accessible via direct URL

### Features

- CRUD for membership plans sold to gym members
- Plan types: Membership, Personal Training, Class Pack, Online
- Billing cycles: Weekly, Monthly, Annually
- KPI cards (total plans, active plans, revenue)
- Search, status filter, price filter, duration filter

### Related tables

- `plans` — plan definitions (price, duration, features, status)
- `subscriptions` — member subscriptions to plans

---

## 15. Settings

**Route:** `/dashboard/settings`  
**Min role:** admin

### Active tabs in Settings page

#### General

| Setting | Description | Default |
|---------|-------------|---------|
| Gym name | Display name for the gym | — |
| Timezone | Operating timezone | `Asia/Riyadh` |
| Currency | Financial currency | `SAR` |
| Language preference | Gym language (EN, AR, ES, FR listed) | `English` |
| Dark mode | Toggle light/dark theme | off |
| Language switcher | UI language toggle (EN / AR) | — |

#### Profile

| Setting | Description |
|---------|-------------|
| First name | Admin first name |
| Last name | Admin last name |
| Email | Contact email |
| Phone | Contact phone |
| Profile picture | Upload to Supabase Storage (`profile-pictures` bucket) |

#### Security

| Setting | Description | Default |
|---------|-------------|---------|
| Two-factor authentication | 2FA toggle | off |
| Password expiry | Days until password expires (30–365) | 90 |
| Session timeout | Minutes until session expires (5–120) | 30 |
| Min password length | Characters (6–20) | 8 |
| Require special characters | Password complexity | on |
| Lockout threshold | Failed attempts before lockout | 5 |
| Change password | Modal to update password via Supabase | — |
| Login history | View recent login events | — |

#### Billing (SaaS subscription)

| Setting | Description |
|---------|-------------|
| Current plan | Display active MTDRB tier |
| Upgrade / manage plan | Navigate to subscription management |
| Cancel subscription | `CancelSubscriptionModal` |
| Payment method | Display stored payment method |
| Auto-renewal | Toggle auto-renewal |
| Billing cycle | monthly / annual |
| Billing history | View past invoices |

### Settings data model (full — includes fields not all exposed in UI tabs)

Defined in `useSettings` hook and persisted to `gym_settings` table:

#### Integrations *(model exists; dedicated UI component not mounted on Settings page)*

| Setting | Description | Default |
|---------|-------------|---------|
| Google Calendar | Sync classes to Google Calendar | off |
| Stripe Payments | Enable Stripe payment processing | on |
| Slack Notifications | Send alerts to Slack | off |
| Webhook URL | Custom webhook endpoint | — |

#### Gym Operations *(model exists; may not have dedicated UI tab)*

| Setting | Description | Default |
|---------|-------------|---------|
| VAT enabled | Enable VAT on invoices | on |
| VAT rate | Percentage rate | 5.0% |

### Standalone settings components (built, not mounted on Settings page)

| Component | Features |
|-----------|----------|
| `NotificationSettings` | Email, SMS, push, in-app channels; quiet hours; frequency; preferences for member updates, class reminders, payment alerts |
| `IntegrationSettings` | Stripe, Mailgun, Twilio, Zapier connection UI |

### Settings UX

- Per-section save with unsaved-changes tracking
- Per-section reset
- Validation before save
- Browser `beforeunload` warning for unsaved changes

---

## 16. Profile

**Route:** `/dashboard/profile`  
**Min role:** trainer

Minimal scaffold page showing user name and email. Richer profile editing is available under **Settings → Profile**.

---

## 17. Internationalization (i18n)

### Supported UI languages

| Code | Language | RTL |
|------|----------|-----|
| `en` | English | No |
| `ar` | Arabic | Yes |

### Behavior

- Language detection: `localStorage` → browser `ar*` → English fallback
- RTL layout applied via `document.documentElement.dir` and `useRTL` hook
- `LanguageSwitcher` component in Settings and auth pages
- ~3,000+ translation keys in `src/i18n.ts`

### Gym language preference vs UI language

Settings lists English, Arabic, Spanish, French as **gym preference** options. Only English and Arabic have full UI translations.

---

## 18. Automation, Realtime & AI

### Realtime service (`realtimeService.ts`)

Supabase Realtime subscriptions for:

| Channel | Trigger | Recipients |
|---------|---------|------------|
| Notifications | Insert on `notifications` table | Role/user-targeted |
| Class capacity | ≥80% utilization | Staff |
| Member check-ins | `class_bookings` status change | Assigned trainers |

Notification types: `member_checkin`, `class_capacity_alert`, `new_assignment`, `urgent_task`, `payment_received`

### Automation engines (components built)

| Engine | Domain | Workflows |
|--------|--------|-----------|
| `AutomationEngine` | Members | Onboarding, retention, engagement, upsell, reactivation, payment |
| `ClassAutomationEngine` | Classes | Reminders, capacity, waitlist |
| `TrainerAutomationEngine` | Trainers | Schedule, performance alerts |
| `BillingAutomationEngine` | Billing | Invoice reminders, collections |
| `TaskAutomationEngine` | Tasks | Auto-assign, deadlines, priority |
| `ReportAutomationEngine` | Reports | Scheduled report delivery |

### Automation API (`api/automation.ts`)

- Workflow CRUD on `automation_workflows`
- Settings on `automation_settings`
- Smart insight types: `critical_alert`, `opportunity`, `trend`, `automation_suggestion`
- Class intelligence: `class_categories`, `class_analytics`

### AI / Smart features

| Feature | Location |
|---------|----------|
| Smart Insights | Analytics → Insights tab |
| AI Insights panel | `AIInsights.tsx` |
| Smart dashboards | `Smart*` components across billing, trainers, classes, dashboard |
| Insight actions | Apply recommendation, learn more modals |
| Pro gating | Deep analytics, automation, member insights require Pro |

---

## 19. Design & UI System

### Visual principles

- Apple Human Interface Guidelines
- Pill-shaped buttons with `bg-blue-50` default
- Cards with `rounded-3xl` corners and subtle shadows
- Modals slide in from the right
- Framer Motion page transitions
- Dark mode via `ThemeContext`

### Shared UI components (`src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `SmartModal` / `UnifiedModal` / `MTDRBModal` | Modal containers |
| `SmartKpiCard` / `StatCard` | Metric display |
| `ChartCard` | Chart wrapper |
| `TabsNav` | Tab navigation |
| `FilterButton` / `AdvancedFilterModal` | Filtering |
| `SmartFormComponents` | Form inputs |
| `SkeletonScreens` | Loading states |
| `DesignSystem` | `SmartButton` and design tokens |

### Page theming

`PageThemeContext` + `PageThemeDetector` apply per-module color accents (dashboard, members, classes, billing, etc.).

---

## 20. Data Model & API

### Core database tables

| Table | Purpose |
|-------|---------|
| `tenants` | Gym organizations |
| `memberships` | User ↔ tenant role mapping |
| `gym_settings` | Per-tenant configuration |
| `branches` | Multi-location gyms |
| `members` | Gym members |
| `trainers` | Staff/trainers |
| `plans` | Membership plans |
| `subscriptions` | Member plan subscriptions |
| `classes` | Scheduled sessions |
| `trainer_schedule` | Trainer availability |
| `class_bookings` | Reservations and attendance |
| `class_waitlist` | Waitlist queue |
| `invoices` | Billing invoices |
| `expenses` | Business expenses |
| `vat_returns` | VAT filing records |
| `member_tasks` | CRM tasks |
| `activities` | Activity feed |
| `notifications` | In-app notifications |

### API layers

| Layer | File | Purpose |
|-------|------|---------|
| Main API | `api/client.ts` | Direct Supabase CRUD for all entities |
| Secure API | `api/secureClient.ts` | Auth + tenant + rate limit + Zod validation |
| Settings API | `api/settings.ts` | Gym settings CRUD with validation |
| VAT API | `api/vat.ts` | VAT dashboard, returns, compliance |
| Class API | `api/class.ts` | Classes, bookings, reviews, analytics |
| Automation API | `api/automation.ts` | Workflows, insights, settings |
| Waitlist API | `api/waitlist.ts` | Waitlist management |
| Validation | `api/validation.ts` | Zod schemas for all entities |

### Context providers

| Provider | State |
|----------|-------|
| `AuthProvider` | User, tenant, role, auth actions |
| `SubscriptionProvider` | Pro tier, feature flags |
| `UIProvider` | Tabs, dark mode, sidebar, loading, drawer |
| `ThemeProvider` | Light/dark theme |
| `PageThemeProvider` | Per-page color theme |
| `WorkoutPlansProvider` | Cached workout plans (5-min TTL) |

---

## 21. Environment & Development Mode

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Production | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Production | Supabase anon key |
| `VITE_APP_URL` | Production | Public app URL |
| `SUPABASE_URL` | Server-side | Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side | Admin operations (never client) |
| `VITE_FORCE_REAL_CLIENT` | Optional | Force real Supabase in dev |

### Localhost development mode

When running on `localhost`, `127.0.0.1`, or `[::1]`:

| Behavior | Detail |
|----------|--------|
| Auth bypass | Mock admin user with enterprise tier |
| Backend skipped | No Supabase health checks or AuthSetup calls |
| Pro features | All Pro features unlocked |
| Subscription | Mock enterprise subscription |

Mock user metadata: `role: admin`, `paid: true`, `onboarding_completed: true`, `tenant_id: 00000000-0000-0000-0000-000000000000`

Individual pages may still attempt Supabase queries and show empty data.

---

## 22. Implementation Notes & Gaps

Features that exist as components but are **not fully integrated**:

| Item | Status |
|------|--------|
| `NotificationSettings` | Built, not mounted on Settings page |
| `IntegrationSettings` | Built, not mounted on Settings page |
| `CancelMembershipModal` | Built, not wired in Members page |
| `TrainerAutomationEngine` | Imported in Trainers page but not rendered |
| Member/Class/Billing/Task automation engines | Built, not integrated into parent pages |
| `realtimeService` | Defined, limited direct usage in pages |
| `Insights.tsx`, `Mtdrb.tsx` | Pages exist, no routes |
| Analytics Classes tab | Placeholder UI |
| `/dashboard/reports` | Redirects to analytics; reports tab not in tab list |
| Subscribe flow | No live payment processor — metadata only |
| Pro gating models | Inconsistent between `SubscriptionContext`, auth metadata, and Subscribe page |
| Schema drift | Some API tables (`automation_workflows`, `vat_transactions`, `profiles`, etc.) referenced in code but absent from `complete_schema.sql` |

---

## Quick Reference Card

```
PUBLIC          AUTH              PROTECTED (/dashboard/*)
──────          ────              ─────────────────────────
/               /login            Dashboard      (trainer+)
Landing         /signup           Members        (employee+)
                /subscribe        Classes        (trainer+)
                /onboarding       Trainers       (employee+)
                                  Billing        (employee+)
                                  Analytics      (employee+)
                                  Tasks          (trainer+)
                                  Branches       (admin)
                                  Settings       (admin)
                                  Plans          (admin)
                                  Profile        (trainer+)
```

---

*Last updated: June 2026 — generated from codebase analysis of `mtdrb-admin-webapp`.*
