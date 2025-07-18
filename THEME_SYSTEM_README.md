# MTDRB Admin - Page-Specific Theme System

## Overview

The MTDRB Admin dashboard now features a unique, consistent color theme for each page that reflects its purpose and improves user navigation and recognition. Each page uses a distinct color palette while maintaining harmony with the global brand colors and Apple-inspired design system.

## Color Themes by Page

### 🏠 Dashboard - Sky Blue
- **Primary Color**: `#0ea5e9` (Sky Blue)
- **Purpose**: Overview and key metrics
- **Represents**: Clarity, overview, and comprehensive view
- **Use Case**: Main dashboard with KPIs and overview cards

### 👥 Members - Emerald Green
- **Primary Color**: `#10b981` (Emerald Green)
- **Purpose**: Member management and profiles
- **Represents**: Growth, community, and people
- **Use Case**: Member lists, profiles, and member-related actions

### 📅 Classes - Amber Orange
- **Primary Color**: `#f59e0b` (Amber Orange)
- **Purpose**: Class scheduling and management
- **Represents**: Energy, activity, and scheduling
- **Use Case**: Class calendars, schedules, and class management

### 🏋️ Trainers - Fuchsia Pink
- **Primary Color**: `#d946ef` (Fuchsia Pink)
- **Purpose**: Trainer management and performance
- **Represents**: Expertise, personal attention, and performance
- **Use Case**: Trainer profiles, performance metrics, and trainer management

### 💰 Billing - Green
- **Primary Color**: `#22c55e` (Green)
- **Purpose**: Financial management and invoicing
- **Represents**: Money, success, and financial health
- **Use Case**: Invoices, payments, and financial reports

### 📊 Analytics - Blue
- **Primary Color**: `#3b82f6` (Blue)
- **Purpose**: Data insights and reporting
- **Represents**: Intelligence, data, and insights
- **Use Case**: Charts, reports, and data visualization

### 🎁 Promotions - Purple
- **Primary Color**: `#a855f7` (Purple)
- **Purpose**: Marketing campaigns and offers
- **Represents**: Creativity, marketing, and special offers
- **Use Case**: Promotional campaigns, discount codes, and marketing

### 📋 Reports - Slate Gray
- **Primary Color**: `#64748b` (Slate Gray)
- **Purpose**: Data reports and insights
- **Represents**: Professionalism, documentation, and reports
- **Use Case**: Report generation, exports, and documentation

### ✅ Tasks - Orange
- **Primary Color**: `#f97316` (Orange)
- **Purpose**: Task management and automation
- **Represents**: Action, productivity, and workflow
- **Use Case**: Task lists, automation, and workflow management

### ⚙️ Settings - Gray
- **Primary Color**: `#6b7280` (Gray)
- **Purpose**: System configuration and preferences
- **Represents**: Neutrality, configuration, and system settings
- **Use Case**: System settings, preferences, and configuration

### 🧠 Insights - Sky Blue
- **Primary Color**: `#0ea5e9` (Sky Blue)
- **Purpose**: AI-powered insights and recommendations
- **Represents**: Intelligence, AI, and smart recommendations
- **Use Case**: AI insights, recommendations, and smart features

## How to Use the Theme System

### 1. Using the Page Theme Context

```tsx
import { usePageThemeContext } from '../contexts/PageThemeContext';

const MyComponent = () => {
  const { theme, getButtonClasses, getCardClasses } = usePageThemeContext();
  
  return (
    <div>
      <button className={getButtonClasses('primary')}>
        Primary Button
      </button>
      <div className={getCardClasses('accent')}>
        Accent Card
      </div>
    </div>
  );
};
```

### 2. Direct Theme Access

```tsx
const { theme } = usePageThemeContext();

// Access theme properties
const primaryColor = theme.accent;
const iconColor = theme.icon;
const buttonStyle = theme.button;
```

### 3. Available Theme Utilities

#### Button Classes
```tsx
getButtonClasses('primary')    // Primary theme button
getButtonClasses('secondary')  // Secondary button
getButtonClasses('outline')    // Outline button
```

#### Card Classes
```tsx
getCardClasses('default')      // Default card style
getCardClasses('accent')       // Accent card with theme colors
getCardClasses('hover')        // Interactive card with hover effects
```

#### Badge Classes
```tsx
getBadgeClasses('default')     // Theme-colored badge
getBadgeClasses('success')     // Success badge (green)
getBadgeClasses('warning')     // Warning badge (yellow)
getBadgeClasses('error')       // Error badge (red)
```

#### Tab Classes
```tsx
getTabClasses(true)            // Active tab with theme colors
getTabClasses(false)           // Inactive tab
```

#### Icon Classes
```tsx
getIconClasses('sm')           // Small icon with theme color
getIconClasses('md')           // Medium icon with theme color
getIconClasses('lg')           // Large icon with theme color
```

#### Status Classes
```tsx
getStatusClasses('active')     // Active status indicator
getStatusClasses('inactive')   // Inactive status indicator
getStatusClasses('pending')    // Pending status indicator
getStatusClasses('completed')  // Completed status indicator
getStatusClasses('error')      // Error status indicator
```

### 4. Gradient Utilities

```tsx
const { getGradient } = usePageThemeContext();

// Different gradient directions
getGradient('to-r')           // Right gradient
getGradient('to-l')           // Left gradient
getGradient('to-t')           // Top gradient
getGradient('to-b')           // Bottom gradient
getGradient('to-tr')          // Top-right gradient
getGradient('to-tl')          // Top-left gradient
getGradient('to-br')          // Bottom-right gradient
getGradient('to-bl')          // Bottom-left gradient
```

## Automatic Theme Detection

The system automatically detects the current page from the URL and applies the appropriate theme:

- `/dashboard` → Dashboard theme (Sky Blue)
- `/members` → Members theme (Emerald Green)
- `/classes` → Classes theme (Amber Orange)
- `/trainers` → Trainers theme (Fuchsia Pink)
- `/billing` → Billing theme (Green)
- `/analytics` → Analytics theme (Blue)
- `/promotions` → Promotions theme (Purple)
- `/reports` → Reports theme (Slate Gray)
- `/tasks` → Tasks theme (Orange)
- `/settings` → Settings theme (Gray)
- `/insights` → Insights theme (Sky Blue)

## Theme Structure

Each theme includes:

```typescript
{
  name: string,              // Page name
  description: string,       // Page description
  primary: {                // Color palette (50-900 shades)
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ... more shades
    900: '#0c4a6e'
  },
  accent: string,           // Primary accent color
  gradient: string,         // Gradient classes
  icon: string,            // Icon color class
  button: string,          // Button style class
  card: string,            // Card style class
  badge: string,           // Badge style class
  tab: string              // Tab style class
}
```

## Accessibility Considerations

- All color combinations meet WCAG 2.1 AA contrast requirements
- Color themes maintain readability in both light and dark modes
- Semantic colors (success, warning, error) are consistent across themes
- Focus states and hover effects are preserved

## Best Practices

1. **Consistency**: Use theme utilities rather than hardcoded colors
2. **Semantic Meaning**: Choose colors that reflect the page's purpose
3. **Accessibility**: Ensure sufficient contrast ratios
4. **Dark Mode**: All themes work seamlessly in dark mode
5. **Performance**: Theme detection is automatic and efficient

## Example Implementation

See `src/components/ThemeExample.tsx` for a comprehensive example of how to use all theme features.

## Migration Guide

To update existing components to use the new theme system:

1. Import the theme context:
   ```tsx
   import { usePageThemeContext } from '../contexts/PageThemeContext';
   ```

2. Replace hardcoded colors with theme utilities:
   ```tsx
   // Before
   className="bg-blue-500 text-white"
   
   // After
   className={getButtonClasses('primary')}
   ```

3. Use theme-aware components:
   ```tsx
   // Before
   <div className="bg-sky-50 border-sky-200">
   
   // After
   <div className={getCardClasses('accent')}>
   ```

The theme system provides a consistent, maintainable, and visually appealing way to differentiate pages while maintaining the overall design coherence of the MTDRB Admin dashboard. 