# Hardcoded Values Audit Report

This document lists all hardcoded information, data, and numbers found throughout the project that should be moved to configuration files or environment variables.

## 🔴 Critical: Hardcoded URLs & Endpoints

### Production URLs (Should be in environment variables)
- **DEPLOYMENT_SUCCESS.md:5**: `https://mtdrb-admin-webapp-rbagaakb9-m4ahmed7-4321s-projects.vercel.app`
- **DEPLOYMENT_SUCCESS.md:7**: `https://vercel.com/m4ahmed7-4321s-projects/mtdrb-admin-webapp/969UFiNhGdeo4smjfobpYmHAi7oR`
- **DEPLOYMENT_SUCCESS.md:24**: `https://vercel.com/m4ahmed7-4321s-projects/mtdrb-admin-webapp/settings/environment-variables`

### API Endpoints
- **src/components/settings/IntegrationSettings.tsx:25**: `https://api.mtdrb.com/webhooks/stripe`
- **src/components/settings/IntegrationSettings.tsx:43**: `https://api.mtdrb.com/webhooks/twilio`
- **src/pages/Settings.tsx:878**: Placeholder `https://your-domain.com/webhook`

### Social Media URLs
- **src/lib/constants/landingPage.ts:282**: `https://twitter.com/mtdrb`
- **src/lib/constants/landingPage.ts:283**: `https://linkedin.com/company/mtdrb`
- **src/lib/constants/landingPage.ts:284**: `https://instagram.com/mtdrb`

### External Service URLs
- **src/components/trainers/TrainerProfile.tsx:413,678**: `https://ui-avatars.com/api/` (avatar generation)

## 🔴 Critical: Hardcoded API Keys & Secrets

### Masked API Keys (Still hardcoded)
- **src/components/settings/IntegrationSettings.tsx:24**: `sk_test_*********************` (Stripe test key pattern)
- **src/components/settings/IntegrationSettings.tsx:42**: `AC***********************` (Twilio account SID pattern)

**⚠️ Note**: These appear to be masked/example values, but the pattern suggests hardcoded structure.

## 🟡 Configuration: Default Country/Location Settings

### Hardcoded Default Country
- **src/pages/Onboarding.tsx:35**: `country: "Saudi Arabia"` (default)
- **src/pages/Onboarding.tsx:524**: Country list: `["Saudi Arabia", "UAE", "Bahrain", "Kuwait", "Oman", "Qatar", "Egypt", "Jordan", "Lebanon"]`

### Hardcoded Default Timezone
- **src/pages/Onboarding.tsx:40**: `timezone: "Asia/Riyadh"` (default)
- **src/api/settings.ts:133**: `timezone: "Asia/Riyadh"` (default)
- **src/hooks/useSettings.ts:59**: `timezone: "Asia/Riyadh"` (default)
- **src/components/settings/SystemSettings.tsx:21**: `timezone: "America/New_York"` (inconsistent default)
- **src/components/settings/UserPreferences.tsx:22**: `timezone: "America/New_York"` (inconsistent default)

### Hardcoded Default Currency
- **src/pages/Onboarding.tsx:39**: `currency: "SAR"` (default)
- **src/api/settings.ts:134**: `currency: "SAR"` (default)
- **src/hooks/useSettings.ts:60**: `currency: "SAR"` (default)
- **src/components/settings/SystemSettings.tsx:23**: `currency: "USD"` (inconsistent default)

### Hardcoded Default Language
- **src/pages/Onboarding.tsx:36**: `language: "English"` (default)
- **src/api/settings.ts:135**: `language: "English"` (default)
- **src/hooks/useSettings.ts:61**: `language: "English"` (default)
- **src/components/members/MemberFormModal.tsx:458**: `language: "English"` (default)

## 🟡 Configuration: Default Operating Hours

### Hardcoded Operating Hours
- **src/pages/Onboarding.tsx:48-54**: 
  - Weekdays: `open: "06:00", close: "22:00"`
  - Weekends: `open: "08:00", close: "20:00"`

## 🟡 Configuration: Default Brand Colors

### Hardcoded Brand Colors
- **src/pages/Onboarding.tsx:68-69**: 
  - `primaryColor: "#155FD9"`
  - `secondaryColor: "#489BFA"`
- **src/index.css:8-9**: CSS variables with same colors
- **src/contexts/ThemeContext.tsx:12-13**: Default theme colors
- **src/theme/index.ts:5-7**: Theme configuration colors

## 🟡 Configuration: Default Pricing & Financial Values

### Hardcoded Pricing (Landing Page)
- **src/lib/constants/landingPage.ts:152-153**: Starter plan: `monthlyPrice: 79, yearlyPrice: 59`
- **src/lib/constants/landingPage.ts:168-169**: Pro plan: `monthlyPrice: 109, yearlyPrice: 89`
- **src/lib/constants/landingPage.ts:158**: `"+$20 USD per extra location"`
- **src/lib/constants/landingPage.ts:173**: `"$10 USD per extra location"`

### Hardcoded Service Prices (Automation Engine)
- **src/components/members/AutomationEngine.tsx:795**: `"$80/session"` (Personal Training)
- **src/components/members/AutomationEngine.tsx:800**: `"$120/month"` (Nutrition Coaching)
- **src/components/members/AutomationEngine.tsx:805**: `"$40/session"` (Group Training)
- **src/components/members/AutomationEngine.tsx:810**: `"$25/class"` (Yoga/Pilates)
- **src/components/members/AutomationEngine.tsx:815**: `"$100/session"` (Sports Specific)
- **src/components/members/AutomationEngine.tsx:820**: `"$60/session"` (Recovery Services)

### Hardcoded Revenue Examples
- **src/components/classes/SmartClassFormModal.tsx:164-214**: Multiple hardcoded revenue values:
  - `"$45"`, `"$50"`, `"$35"`, `"$25"`, `"$42"`, `"$48"`, `"$45"`, `"$38"`
- **src/components/billing/BillingKPICards.tsx:15**: `"$45,230"`
- **src/components/billing/BillingKPICards.tsx:24**: `"$12,450"`
- **src/components/billing/SmartBillingAnalytics.tsx:31-33**: `current: 45280, previous: 40120, target: 50000`
- **src/components/billing/SmartBillingAnalytics.tsx:55-57**: `current: 3200, previous: 4800, target: 2000`

### Hardcoded Billing Plan
- **src/api/settings.ts:147**: `current_plan: "Premium Plan - $99/month"`
- **src/hooks/useSettings.ts:79**: `currentPlan: "Premium Plan - $99/month"`
- **src/components/ProFeatureGate.tsx:82**: `"Starting at $29/month"`

## 🟡 Configuration: Default User/Member Settings

### Hardcoded Default Values (Member Form)
- **src/components/members/MemberFormModal.tsx:452**: `gender: "Male"` (default)
- **src/components/members/MemberFormModal.tsx:459**: `membership_status: "active"` (default)
- **src/components/members/MemberFormModal.tsx:462**: `membership_type: "Monthly"` (default)
- **src/components/members/MemberFormModal.tsx:475**: `payment_method: "cash"` (default)
- **src/components/members/MemberFormModal.tsx:481**: `fitness_level: "Beginner"` (default)
- **src/components/members/MemberFormModal.tsx:486**: `goal_timeline: "3_months"` (default)
- **src/components/members/MemberFormModal.tsx:487**: `workout_frequency_goal: 3` (default)
- **src/components/members/MemberFormModal.tsx:490**: `access_level: "Basic"` (default)
- **src/components/members/MemberFormModal.tsx:491**: `membership_duration: "1_month"` (default)
- **src/components/members/MemberFormModal.tsx:492**: `billing_cycle: "monthly"` (default)

### Hardcoded Default Values (Settings)
- **src/api/settings.ts:132**: `gym_name: "MTDRB Gym"` (default)
- **src/api/settings.ts:142**: `password_expiry: 90` (days)
- **src/api/settings.ts:143**: `session_timeout: 30` (minutes)
- **src/api/settings.ts:144**: `min_password_length: 8`
- **src/api/settings.ts:145**: `require_special_chars: true`
- **src/api/settings.ts:146**: `lockout_threshold: 5`
- **src/api/settings.ts:148**: `payment_method: "Visa ending in 4242"` (test card)
- **src/api/settings.ts:149**: `auto_renewal: true`
- **src/api/settings.ts:150**: `billing_cycle: "monthly"`

## 🟡 Configuration: Default Trainer Specializations

### Hardcoded Specializations
- **src/pages/Onboarding.tsx:64**: `trainerSpecialization: "General Fitness"` (default)
- **src/pages/Onboarding.tsx:750-752**: Specialization list:
  - `["General Fitness", "Weight Training", "Cardio", "Yoga", "Pilates", "CrossFit", "Swimming", "Martial Arts", "Nutrition", "Rehabilitation"]`

## 🟡 Test Data: Hardcoded UUIDs & Test Records

### Development Test Data
- **src/utils/debugAuth.ts:110**: Test tenant ID: `"550e8400-e29b-41d4-a716-446655440000"`
- **src/utils/debugAuth.ts:144**: Test trainer ID: `"770e8400-e29b-41d4-a716-446655440001"`
- **src/utils/debugAuth.ts:148**: Test phone: `"+1234567890"`
- **src/utils/debugAuth.ts:153**: Test trainer ID: `"770e8400-e29b-41d4-a716-446655440002"`
- **src/utils/debugAuth.ts:157**: Test phone: `"+1234567891"`
- **src/utils/debugAuth.ts:170**: Test class ID: `"660e8400-e29b-41d4-a716-446655440001"`
- **src/utils/debugAuth.ts:146**: Test email: `"sarah.johnson@testgym.com"`
- **src/utils/debugAuth.ts:156**: Test email: `"mike.chen@testgym.com"`

### Mock User Data
- **src/contexts/AuthContext.tsx:29**: Mock user ID: `"mock-user-localhost"`
- **src/contexts/AuthContext.tsx:32**: Mock email: `"dev@localhost.local"`
- **src/contexts/AuthContext.tsx:39**: Mock tenant ID: `"00000000-0000-0000-0000-000000000000"`

## 🟡 Magic Numbers: Time Intervals

### Hardcoded Time Calculations (Days)
- **Multiple files**: `30 * 24 * 60 * 60 * 1000` (30 days in milliseconds) - appears 20+ times
- **Multiple files**: `7 * 24 * 60 * 60 * 1000` (7 days) - appears 10+ times
- **Multiple files**: `365 * 24 * 60 * 60 * 1000` (1 year) - appears in Members.tsx
- **src/pages/Members.tsx:188**: `365 * 24 * 60 * 60 * 1000` (1 year default end date)

### Hardcoded Time Calculations (Hours/Minutes)
- **src/components/classes/SmartClassFormModal.tsx:176**: `24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000` (tomorrow 8 AM)
- **src/components/classes/SmartClassFormModal.tsx:179**: `24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000` (tomorrow 9 AM)
- **src/components/classes/SmartClassFormModal.tsx:190**: `24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000` (tomorrow 6 PM)
- **src/components/classes/SmartClassFormModal.tsx:193**: `24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000` (tomorrow 7 PM)

### Hardcoded Polling Intervals
- **src/components/TopBar.tsx:124**: `30000` (30 seconds - notification polling)
- **src/components/NetworkStatus.tsx:59**: `30000` (30 seconds - health check)
- **src/components/dashboard/LiveKPITracker.tsx:142**: `30000` (30 seconds - live data)

### Hardcoded Timeouts
- **src/components/AuthSetup.tsx:30**: `5000` (5 second timeout)
- **src/components/AuthSetup.tsx:315**: `1500` (1.5 second reload delay)
- **Multiple files**: Various `setTimeout` delays (1000, 1500, 2000, 4000, 6000, 8000 ms)

## 🟡 Magic Numbers: Thresholds & Limits

### Hardcoded Thresholds
- **src/components/members/AutomationEngine.tsx:741**: `80+ points` (Prime Candidate threshold)
- **src/components/members/AutomationEngine.tsx:749**: `60-79 points` (Good Prospect threshold)
- **src/components/members/AutomationEngine.tsx:757**: `40-59 points` (Early Stage threshold)
- **src/components/members/AutomationEngine.tsx:770**: `defaultValue={60}` (Minimum Score for Offers)
- **src/components/dashboard/SmartDashboardAnalytics.tsx:288**: `50000` (revenue target)
- **src/components/dashboard/SmartDashboardAnalytics.tsx:289**: `1300` (member target)
- **src/components/billing/modals/useSmartBillingModal.ts:79**: `100000` (high amount threshold)
- **src/components/billing/modals/useSmartBillingModal.ts:295**: `50000` (total threshold)
- **src/components/billing/AddInvoiceModal.tsx:213**: `10 * 1024 * 1024` (10MB file size limit)

### Hardcoded Capacity/Count Limits
- **src/components/classes/SmartClassFormModal.tsx:233**: `max(50)` (max class capacity)
- **src/components/classes/SmartClassFormModal.tsx:228**: `max(180)` (max duration in minutes)
- **src/components/classes/SmartClassFormModal.tsx:227**: `min(15)` (min duration in minutes)

## 🟡 Hardcoded Colors (UI/Charts)

### Chart Colors
- **src/components/classes/SmartClassFormModal.tsx:144-154**: Class type colors:
  - Yoga: `"#10B981"`, HIIT: `"#EF4444"`, Pilates: `"#8B5CF6"`, Cardio: `"#F59E0B"`, Strength: `"#3B82F6"`, Spin: `"#EC4899"`
- **src/components/trainers/TrainerPerformanceDashboard.tsx:92-97**: Chart color palette
- **src/components/billing/FinancialInsightsDashboard.tsx:113-118**: Chart color palette
- **Multiple files**: Various hardcoded hex colors for charts and UI elements

## 🟡 Hardcoded Phone Number Patterns

### Placeholder Phone Numbers
- **src/pages/Onboarding.tsx:658**: `"+966 50 123 4567"` (Saudi Arabia placeholder)
- **src/pages/Onboarding.tsx:796**: `"+966 50 123 4567"` (Saudi Arabia placeholder)
- **src/pages/Onboarding.tsx:856**: `"+966 50 123 4567"` (Saudi Arabia placeholder)
- **src/components/trainers/modals/TrainerModalsDemo.tsx:31**: `"+973 1234 5678"` (Bahrain placeholder)

## 🟡 Hardcoded Analytics/Metrics Values

### Mock Analytics Data
- **src/components/members/tabs/AnalyticsTab.tsx:74**: `activeMembers: 1247`
- **src/components/members/tabs/AnalyticsTab.tsx:80**: `sessionsBooked: 3421`
- **src/components/members/tabs/AnalyticsTab.tsx:116**: `totalRevenue: 98750`
- **src/components/members/tabs/AnalyticsTab.tsx:122-125**: Monthly active members data
- **src/components/members/tabs/AnalyticsTab.tsx:134-137**: Monthly revenue data

### Hardcoded Statistics (Landing Page)
- **src/lib/constants/landingPage.ts:238-242**: 
  - `"500+"` Gyms
  - `"50K+"` Members
  - `"99.9%"` Uptime
  - `"4.8/5"` Rating

## 🟡 Hardcoded Class/Revenue Examples

### Class Revenue Examples
- **src/components/classes/SmartClassFormModal.tsx:159-216**: Optimal time slots with hardcoded:
  - Times: `"06:00"`, `"07:00"`, `"09:00"`, `"12:00"`, `"17:00"`, `"18:00"`, `"19:00"`, `"20:00"`
  - Demand levels: `"High"`, `"Very High"`, `"Medium"`, `"Low"`
  - Popularity scores: `85, 95, 65, 45, 85, 92, 89, 72`

## 🟡 Hardcoded Discount/Percentage Values

### Default Discount
- **src/components/classes/modals/SendClassPromotionModal.tsx:51**: `discountPercentage: 15` (default 15%)

## 🟡 Hardcoded Date Examples

### Mock Dates
- **src/components/classes/modals/ViewClassDetailsModal.tsx:80-116**: Multiple hardcoded dates:
  - `"2024-01-10T09:00:00Z"`, `"2024-01-12T14:30:00Z"`, etc.
- **src/components/classes/modals/ProcessWaitlistModal.tsx:80-100**: Hardcoded waitlist dates
- **src/components/members/AutomationEngine.tsx:1736-1740**: Hardcoded date strings: `"2024-01-15"`, `"2024-01-14"`, etc.

## 🟡 Hardcoded Invoice/Expense Examples

### Default Invoice Values
- **src/components/billing/modals/ViewInvoiceModal.tsx:177**: `currency: "USD"` (default)
- **src/components/billing/modals/ViewExpenseModal.tsx:105**: `currency: "USD"` (default)
- **src/components/billing/modals/GenerateInvoiceModal.tsx:72**: `unitPrice: 1200` (default)

## 🟡 Hardcoded Automation Settings

### Default Automation Thresholds
- **src/api/automation.ts:515**: `reminderTime: 24` (hours)
- **src/api/automation.ts:762**: `threshold: 90` (capacity alert threshold)
- **src/api/automation.ts:768**: `reminderTime: 24` (hours)

## 🟡 Hardcoded Error Codes

### PostgreSQL Error Codes
- **src/services/errorHandler.ts:215-219**: Hardcoded error code mappings:
  - `"23505"`, `"23503"`, `"23514"`, `"23502"`, `"42501"`

## 📋 Recommendations

### High Priority
1. **Move all URLs to environment variables** (production URLs, API endpoints, webhooks)
2. **Remove or properly mask API keys** (even test keys should not be hardcoded)
3. **Create configuration file for default country/timezone/currency** based on user selection or IP geolocation
4. **Move pricing information to database or configuration** (plans, service prices)
5. **Extract magic numbers to constants** (time intervals, thresholds, limits)

### Medium Priority
1. **Create constants file for default values** (member defaults, settings defaults)
2. **Move color schemes to theme configuration** (make them tenant-customizable)
3. **Extract hardcoded lists to configuration** (countries, specializations, currencies)
4. **Create date utility functions** instead of hardcoded date calculations
5. **Move test data to separate test fixtures** file

### Low Priority
1. **Extract chart colors to theme** (make them consistent)
2. **Move placeholder text to i18n** (phone number formats, placeholders)
3. **Create configuration for polling intervals** (make them adjustable)
4. **Extract timeout values to constants**

## 🔧 Suggested File Structure

```
src/
  config/
    constants.ts          # Magic numbers, thresholds, limits
    defaults.ts           # Default values for forms, settings
    timeIntervals.ts      # Time calculations (30 days, etc.)
    colors.ts             # Color palettes
  constants/
    countries.ts          # Country lists
    currencies.ts         # Currency lists
    timezones.ts          # Timezone lists
    specializations.ts    # Trainer specializations
  fixtures/
    testData.ts           # Test UUIDs, mock data (dev only)
```

## ⚠️ Security Notes

1. **Never commit real API keys** - even masked patterns should be removed
2. **Production URLs** should be in environment variables only
3. **Test data** should be clearly marked and only used in development
4. **Default passwords or secrets** should never be hardcoded
