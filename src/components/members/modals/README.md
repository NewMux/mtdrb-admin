# MTDRB Member Management Modals

A comprehensive collection of smart, sliding modals for member management in the MTDRB Fit admin system. Each modal features Apple-inspired design, AI-powered recommendations, and real-time validation.

## 🎯 Features

### Design & UX
- **Apple-inspired sliding animations** from the right side
- **Sticky header and footer** with dynamic content
- **Responsive design** that works on all screen sizes
- **Real-time validation** with inline error messages
- **Loading states** and proper error handling
- **Keyboard navigation** (ESC to close)

### AI & Smart Features
- **AI-powered recommendations** for Pro users
- **Smart defaults** based on member data
- **Predictive analytics** and insights
- **Automated workflows** and suggestions
- **Template system** with dynamic placeholders

### Functionality
- **Multi-step processes** with progress tracking
- **Drag & drop file upload** for bulk operations
- **Real-time preview** of messages and data
- **Form validation** with immediate feedback
- **Context-aware suggestions** and warnings

## 📋 Modal Components

### 1. AddMemberModal
**Purpose**: Create new member profiles with smart defaults and AI recommendations

**Features**:
- Personal information collection
- Membership plan selection with AI suggestions
- Trainer assignment with availability preview
- Health & fitness profile setup
- Onboarding options configuration
- Real-time validation and smart defaults

**Usage**:
```tsx
<AddMemberModal
  isOpen={isOpen}
  onClose={onClose}
  onSuccess={handleSuccess}
  isPro={true}
/>
```

### 2. EditMemberModal
**Purpose**: Update existing member information with change tracking

**Features**:
- Pre-filled form with member data
- History badges showing member activity
- Real-time change detection
- AI suggestions for improvements
- Comprehensive member profile editing

**Usage**:
```tsx
<EditMemberModal
  isOpen={isOpen}
  onClose={onClose}
  memberId="member-123"
  onSuccess={handleSuccess}
  isPro={true}
/>
```

### 3. DeleteMemberModal
**Purpose**: Safely remove members with smart warnings and confirmation

**Features**:
- Smart warnings based on member activity
- Comprehensive deletion checklist
- Reason for deletion tracking
- Final confirmation with checkbox
- Activity-based risk assessment

**Usage**:
```tsx
<DeleteMemberModal
  isOpen={isOpen}
  onClose={onClose}
  memberId="member-123"
  onSuccess={handleSuccess}
/>
```

### 4. ImportMembersModal
**Purpose**: Bulk import members from CSV with smart column mapping

**Features**:
- Drag & drop CSV file upload
- Automatic column mapping
- Data preview (first 5 rows)
- Import options configuration
- Smart validation and error handling

**Usage**:
```tsx
<ImportMembersModal
  isOpen={isOpen}
  onClose={onClose}
  onSuccess={handleSuccess}
  isPro={true}
/>
```

### 5. ViewMemberProfileModal
**Purpose**: Comprehensive member profile view with multiple tabs

**Features**:
- Tabbed interface (Overview, Attendance, Progress, Payments, Notes)
- Member statistics and quick stats
- Attendance history with details
- Progress tracking with visual indicators
- Payment history and status
- Notes and communication history

**Usage**:
```tsx
<ViewMemberProfileModal
  isOpen={isOpen}
  onClose={onClose}
  memberId="member-123"
  isPro={true}
/>
```

### 6. AssignTrainerModal
**Purpose**: AI-powered trainer matching with availability preview

**Features**:
- AI recommendation scores based on member profile
- Trainer availability and capacity tracking
- Specialization matching
- Availability preview
- Assignment notes and instructions

**Usage**:
```tsx
<AssignTrainerModal
  isOpen={isOpen}
  onClose={onClose}
  memberId="member-123"
  onSuccess={handleSuccess}
  isPro={true}
/>
```

### 7. SendMemberNotificationModal
**Purpose**: Multi-channel messaging with templates and preview

**Features**:
- Multiple channels (Email, SMS, WhatsApp)
- Template system with placeholders
- Message preview with dynamic content
- Scheduling options
- Delivery tracking

**Usage**:
```tsx
<SendMemberNotificationModal
  isOpen={isOpen}
  onClose={onClose}
  memberId="member-123"
  onSuccess={handleSuccess}
  isPro={true}
/>
```

## 🛠️ Technical Implementation

### Base Components

#### SmartModal
The foundation modal component with:
- Sliding animation from right
- Sticky header with title and close button
- Scrollable content area
- Sticky footer with dynamic buttons
- Pro feature indicators

#### useSmartMemberModal Hook
Custom hook providing:
- Member data fetching and caching
- Real-time validation
- AI recommendation generation
- Form state management
- API integration

#### Form Components
Reusable form elements:
- `FormField`: Text inputs with validation
- `SelectField`: Dropdown selections
- `TextAreaField`: Multi-line text input
- `CheckboxField`: Boolean inputs
- `FormSection`: Grouped form sections
- `ValidationSummary`: Error display
- `SuccessMessage`: Success feedback

### Styling
- **TailwindCSS** for utility-first styling
- **Framer Motion** for smooth animations
- **React Icons** for consistent iconography
- **Apple-inspired design** with clean lines and subtle shadows

### State Management
- **React hooks** for local state
- **Custom hooks** for complex logic
- **Context providers** for global state
- **Real-time validation** with immediate feedback

## 🚀 Getting Started

### Installation
The modals are already integrated into the MTDRB admin system. To use them:

1. **Import the modal**:
```tsx
import { AddMemberModal } from './components/members/modals';
```

2. **Set up state**:
```tsx
const [isModalOpen, setIsModalOpen] = useState(false);
```

3. **Render the modal**:
```tsx
<AddMemberModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={handleSuccess}
  isPro={true}
/>
```

### Demo
Visit `/modals-demo` to see all modals in action with interactive examples.

## 🎨 Customization

### Theming
Modals use the global theme system. Customize colors in `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      }
    }
  }
}
```

### Pro Features
Pro features are controlled by the `isPro` prop:
- AI recommendations
- Advanced analytics
- Smart suggestions
- Premium templates

### Validation
Custom validation rules can be added to the `useSmartMemberModal` hook:
```tsx
const validateField = (field: string, value: any) => {
  // Add custom validation logic
};
```

## 📱 Responsive Design

All modals are fully responsive:
- **Mobile**: Full-width with optimized touch targets
- **Tablet**: Optimized layout with side-by-side sections
- **Desktop**: Full modal width with rich interactions

## 🔧 Development

### Adding New Modals
1. Create the modal component in `src/components/members/modals/`
2. Export it from `src/components/members/modals/index.ts`
3. Add to the demo page in `MemberModalsDemo.tsx`
4. Document in this README

### Testing
- All modals include proper error handling
- Loading states for async operations
- Validation feedback for user input
- Accessibility features (keyboard navigation, screen readers)

## 📄 License

This component library is part of the MTDRB Fit admin system and follows the same licensing terms.

## 🤝 Contributing

When adding new modals:
1. Follow the existing design patterns
2. Include proper TypeScript types
3. Add comprehensive documentation
4. Test on multiple screen sizes
5. Include Pro feature indicators where applicable 