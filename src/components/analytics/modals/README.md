# Analytics & Reporting Modals

A comprehensive collection of 15 smart, sliding modals for analytics and reporting actions in the MTDRB Fit Admin Dashboard.

## 🎯 Overview

Each modal features:
- **Apple-inspired UI**: Clean, modern design with soft borders and elevated layouts
- **Sliding animations**: Smooth slide-in from the right with `max-w-4xl` width
- **Smart functionality**: AI-powered insights, real-time validation, and Pro features
- **Responsive design**: Works seamlessly across all device sizes
- **Accessibility**: Full keyboard navigation and screen reader support

## 📋 Modal Categories

### 1. Report Generation (7 modals)
Core reporting functionality for creating and managing various types of reports.

#### `GenerateReportModal`
- **Purpose**: Create comprehensive reports with smart filtering
- **Features**: 
  - Report type selection (Member, Class, Trainer, Billing, VAT)
  - Date range picker with smart defaults
  - Advanced filters (Branch, Status, Gender, Plan)
  - Export format selection (CSV, Excel, PDF, JSON)
  - Smart scheduling for recurring reports
  - Live preview with top metrics
- **Props**: `open`, `onClose`, `memberId?`, `classId?`, `trainerId?`, `dateRange?`, `reportType?`, `onSuccess?`, `isPro?`

#### `CreateCustomReportModal`
- **Purpose**: Build custom reports with drag-and-drop sections
- **Features**:
  - Drag-and-drop report sections
  - Live preview with chart placeholders
  - Template saving for future use
  - AI recommendations for optimal sections
  - Pro-only features (Retention Score analysis)
- **Props**: `open`, `onClose`, `onSuccess?`, `isPro?`

#### `ExportReportModal`
- **Purpose**: Export saved reports with smart data detection
- **Features**:
  - Saved report selection with metadata
  - File format options with descriptions
  - Visual/data-only export toggle
  - Smart detection of stale data
  - Report refresh functionality
- **Props**: `open`, `onClose`, `onSuccess?`, `isPro?`

#### `ScheduleReportModal`
- **Purpose**: Set up automated report delivery
- **Features**:
  - Report template selection
  - Frequency options (Daily, Weekly, Monthly, Quarterly)
  - Delivery methods (Email, Slack, WhatsApp)
  - Smart scheduling recommendations
  - Upcoming delivery preview
- **Props**: `open`, `onClose`, `onSuccess?`, `isPro?`

#### `DownloadReportModal`
- **Purpose**: Manage and download generated reports
- **Features**:
  - Available downloads with status badges
  - Quick filters (Type, Date, Creator)
  - Archive management for old reports
  - Bulk operations
- **Props**: `open`, `onClose`, `onSuccess?`, `isPro?`

#### `ShareReportModal`
- **Purpose**: Share reports with team members
- **Features**:
  - Smart share links with permissions
  - Expiration date settings
  - Recipient autocomplete
  - Pro-only advanced sharing options
- **Props**: `open`, `onClose`, `reportId?`, `reportName?`, `onSuccess?`, `isPro?`

#### `PrintReportModal`
- **Purpose**: Print reports with custom layouts
- **Features**:
  - PDF-style preview
  - Layout options (Summary, Detailed, Grid)
  - Smart print recommendations
  - Orientation and content options
- **Props**: `open`, `onClose`, `reportId?`, `reportName?`, `onSuccess?`, `isPro?`

### 2. Financial Reports (2 modals)
Specialized modals for financial and tax reporting.

#### `GenerateVATReportModal`
- **Purpose**: Create VAT reports for tax compliance
- **Features**:
  - Quarter selection or custom date range
  - Invoice and expense inclusion options
  - Auto-calculated totals and due amounts
  - Visual summary before export
  - Smart compliance recommendations
- **Props**: `open`, `onClose`, `onSuccess?`, `isPro?`

#### `CreateFinancialReportModal`
- **Purpose**: Comprehensive financial analysis
- **Features**:
  - Revenue, Expenses, Profit, VAT sections
  - Member Lifetime Value analysis
  - Smart badges for insights
  - Template saving and scheduling
- **Props**: `open`, `onClose`, `onSuccess?`, `isPro?`

### 3. Specific Reports (3 modals)
Targeted reports for different entities.

#### `GenerateMemberReportModal`
- **Purpose**: Individual member analysis
- **Features**:
  - Member selection and overview
  - Attendance, payment, progress tracking
  - AI insights for member behavior
  - Export and email options
- **Props**: `open`, `onClose`, `memberId?`, `memberName?`, `onSuccess?`, `isPro?`

#### `GenerateTrainerReportModal`
- **Purpose**: Trainer performance analysis
- **Features**:
  - Session analytics and client management
  - Performance ratings and retention metrics
  - AI insights for trainer optimization
  - Date range filtering
- **Props**: `open`, `onClose`, `trainerId?`, `trainerName?`, `onSuccess?`, `isPro?`

#### `GenerateClassReportModal`
- **Purpose**: Class performance analysis
- **Features**:
  - Attendance percentages and no-show rates
  - Capacity utilization analysis
  - Smart alerts for high demand
  - Class comparison graphs
- **Props**: `open`, `onClose`, `classId?`, `className?`, `onSuccess?`, `isPro?`

### 4. AI Insights (3 modals)
Advanced AI-powered analytics and recommendations.

#### `ViewAIInsightsModal`
- **Purpose**: Pro-only AI insights dashboard
- **Features**:
  - Dropout prediction analysis
  - Revenue forecasting
  - Churn risk assessment
  - Smart CTAs for actions
  - Category filtering
- **Props**: `open`, `onClose`, `onSuccess?`, `isPro?`

#### `ApplyRecommendationModal`
- **Purpose**: Implement AI recommendations
- **Features**:
  - Selected insight display
  - Auto-apply or customize options
  - Action scheduling
  - Smart recommendations
- **Props**: `open`, `onClose`, `insightId?`, `insightTitle?`, `insightDescription?`, `onSuccess?`, `isPro?`

#### `LearnMoreInsightModal`
- **Purpose**: Deep dive into AI logic
- **Features**:
  - AI algorithm details
  - Supporting metrics and trends
  - "Why this matters" explanations
  - Data quality indicators
- **Props**: `open`, `onClose`, `insightId?`, `insightTitle?`, `onSuccess?`, `isPro?`

## 🛠️ Technical Implementation

### Base Components

#### `SmartAnalyticsModal`
The base modal component with:
- Sliding animation from right
- Sticky header with title and close button
- Scrollable content area
- Escape key and backdrop click handling
- Responsive design with `max-w-4xl` width

#### `useSmartAnalyticsModal`
Custom hook providing:
- Analytics filters and state management
- Report generation and export functions
- AI insights and recommendations
- Template saving and scheduling
- Real-time validation and alerts

### Key Features

#### 🎨 Design System
- **Colors**: Apple-inspired palette with semantic colors
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent 8px grid system
- **Shadows**: Subtle elevation for depth
- **Animations**: Smooth transitions with Framer Motion

#### 🔧 Smart Functionality
- **Real-time validation**: Form validation with instant feedback
- **Loading states**: Skeleton screens and progress indicators
- **Error handling**: Comprehensive error states and recovery
- **Success feedback**: Confirmation messages and badges
- **Pro features**: Gated functionality with upgrade prompts

#### 📊 Data Integration
- **Mock data**: Comprehensive mock data for development
- **API ready**: Structured for easy API integration
- **Type safety**: Full TypeScript support
- **State management**: Centralized state with React hooks

## 🚀 Usage Examples

### Basic Modal Usage
```tsx
import { GenerateReportModal } from '../components/analytics/modals';

function MyComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>
        Generate Report
      </button>
      
      <GenerateReportModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => console.log('Report generated!')}
        isPro={true}
      />
    </>
  );
}
```

### With Context Data
```tsx
<GenerateMemberReportModal
  open={open}
  onClose={handleClose}
  memberId="123"
  memberName="Sarah Johnson"
  onSuccess={handleSuccess}
  isPro={isProUser}
/>
```

### Pro Feature Handling
```tsx
<ViewAIInsightsModal
  open={open}
  onClose={handleClose}
  onSuccess={handleSuccess}
  isPro={userSubscription === 'pro'}
/>
```

## 📁 File Structure

```
src/components/analytics/modals/
├── SmartAnalyticsModal.tsx          # Base modal component
├── useSmartAnalyticsModal.ts        # Custom hook for analytics
├── index.ts                         # Export all modals
├── README.md                        # This documentation
├── GenerateReportModal.tsx          # Main report generation
├── CreateCustomReportModal.tsx      # Custom report builder
├── ExportReportModal.tsx            # Report export
├── ScheduleReportModal.tsx          # Automated scheduling
├── DownloadReportModal.tsx          # Download management
├── ShareReportModal.tsx             # Report sharing
├── PrintReportModal.tsx             # Print functionality
├── GenerateVATReportModal.tsx       # VAT reporting
├── CreateFinancialReportModal.tsx   # Financial analysis
├── GenerateMemberReportModal.tsx    # Member reports
├── GenerateTrainerReportModal.tsx   # Trainer reports
├── GenerateClassReportModal.tsx     # Class reports
├── ViewAIInsightsModal.tsx          # AI insights dashboard
├── ApplyRecommendationModal.tsx     # Recommendation actions
└── LearnMoreInsightModal.tsx       # AI logic deep dive
```

## 🎯 Demo Page

Visit `/analytics-modals-demo` to see all modals in action with:
- Interactive buttons for each modal
- Pro feature toggle
- Category organization
- Statistics and overview

## 🔧 Customization

### Styling
All modals use Tailwind CSS classes and can be customized by:
- Modifying the base `SmartAnalyticsModal` component
- Updating color schemes in the design system
- Adjusting spacing and typography

### Functionality
Extend functionality by:
- Adding new sections to existing modals
- Creating new modal types following the pattern
- Integrating with your API endpoints
- Adding custom validation rules

### Pro Features
Implement Pro feature gating by:
- Checking user subscription status
- Showing upgrade prompts for Pro features
- Providing alternative functionality for free users

## 📈 Performance

- **Lazy loading**: Modals only render when opened
- **Optimized animations**: Hardware-accelerated transitions
- **Efficient re-renders**: Proper React optimization
- **Memory management**: Cleanup on unmount

## 🧪 Testing

Each modal includes:
- Comprehensive TypeScript types
- Error boundary handling
- Loading and error states
- Accessibility features
- Responsive design testing

## 🔮 Future Enhancements

- **Real-time collaboration**: Multi-user editing
- **Advanced AI**: More sophisticated recommendations
- **Mobile optimization**: Enhanced mobile experience
- **Offline support**: Local caching and sync
- **Integration APIs**: Third-party service connections

---

**Built with ❤️ for MTDRB Fit Admin Dashboard** 