# MTDRB Modal Style Specification

## 🧱 Structure

### Core Requirements
- **Slide-in modal** (from the right)
- **Max width**: `max-w-4xl` (default)
- **Clean white background**
- **Subtle rounded borders**
- **Soft inner shadows**
- **Fixed header**
- **Scrollable content**
- **Smart form sections**

## 🎨 Design System

### Modal Container
```tsx
// Fixed positioning with z-index
className="fixed inset-0 z-50 overflow-hidden"
```

### Backdrop
```tsx
// Frosted glass effect
className="fixed inset-0 bg-black/40 backdrop-blur-sm"
```

### Modal Panel
```tsx
// Slide from right with max width
className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl"
```

### Header
```tsx
// Sticky header with border
className="sticky top-0 z-10 bg-white border-b border-gray-200/50 px-8 py-6"
```

### Content
```tsx
// Scrollable content area
className="flex-1 overflow-y-auto px-8 py-6"
```

### Footer
```tsx
// Sticky footer with actions
className="sticky bottom-0 bg-white border-t border-gray-200/50 px-8 py-6"
```

## 🚀 Implementation

### Basic Usage
```tsx
import { MTDRBModal } from '@/components/ui';

<MTDRBModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  subtitle="Optional subtitle"
  maxWidth="4xl"
>
  <div>Modal content goes here</div>
</MTDRBModal>
```

### With Smart Form Sections
```tsx
import { 
  MTDRBModal, 
  FormSection, 
  FormField, 
  FormGrid, 
  FullWidthField, 
  Toggle 
} from '@/components/ui';

<MTDRBModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add New Member"
  subtitle="Create a new member profile"
>
  <FormSection
    title="Personal Information"
    description="Basic member details"
  >
    <FormGrid>
      <FormField label="First Name" required>
        <input type="text" className="form-input" />
      </FormField>
      
      <FormField label="Last Name" required>
        <input type="text" className="form-input" />
      </FormField>
    </FormGrid>
  </FormSection>
</MTDRBModal>
```

## 📋 Component API

### MTDRBModal Props
```tsx
interface MTDRBModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  className?: string;
}
```

### FormSection Props
```tsx
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}
```

### FormField Props
```tsx
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  help?: string;
  required?: boolean;
  className?: string;
}
```

### Toggle Props
```tsx
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}
```

## 🎯 Smart Form Components

### FormGrid
- Responsive 2-column grid layout
- Automatically stacks on mobile
- Consistent spacing and alignment

### FullWidthField
- Spans full width across both columns
- Perfect for textareas, long inputs, or important fields

### Toggle Switch
- Modern toggle switch component
- Smooth animations
- Accessible with proper ARIA attributes

## 🎨 Styling Guidelines

### Colors
- **Background**: `bg-white`
- **Borders**: `border-gray-200/50` (subtle)
- **Text**: `text-gray-900` (primary), `text-gray-600` (secondary)
- **Focus**: `ring-blue-500` (blue focus ring)

### Spacing
- **Header/Footer**: `px-8 py-6`
- **Content**: `px-8 py-6`
- **Form sections**: `p-6 mb-6`
- **Field groups**: `space-y-4`

### Shadows
- **Modal**: `shadow-2xl` (strong shadow)
- **Cards**: `shadow-lg` (medium shadow)
- **Hover effects**: `hover:shadow-xl`

### Border Radius
- **Modal**: `rounded-2xl` (large radius)
- **Inputs**: `rounded-xl` (medium radius)
- **Buttons**: `rounded-xl` (medium radius)

## 🔧 Animation Classes

### Slide Animations
```tsx
// Slide in from right
enterFrom="transform translate-x-full"
enterTo="transform translate-x-0"
leaveFrom="transform translate-x-0"
leaveTo="transform translate-x-full"
```

### Transition Timing
```tsx
// Smooth transitions
enter="ease-out duration-300"
leave="ease-in duration-200"
```

## 📱 Responsive Behavior

### Mobile (< 768px)
- Full width modal
- Single column form layout
- Reduced padding
- Touch-friendly buttons

### Tablet (768px - 1024px)
- Max width: `max-w-4xl`
- Two-column form layout
- Standard padding
- Hover effects

### Desktop (> 1024px)
- Max width: `max-w-4xl`
- Two-column form layout
- Full padding
- All interactive effects

## ♿ Accessibility Features

### Keyboard Navigation
- **Escape key**: Closes modal
- **Tab navigation**: Focus management
- **Enter/Space**: Activates buttons

### Screen Reader Support
- **ARIA labels**: Proper labeling
- **Role attributes**: Semantic roles
- **Focus indicators**: Visible focus states

### Color Contrast
- **Text**: WCAG AA compliant
- **Focus indicators**: High contrast
- **Error states**: Clear visual feedback

## 🚀 Best Practices

### Content Organization
1. **Group related fields** in FormSections
2. **Use FormGrid** for two-column layouts
3. **Use FullWidthField** for long inputs
4. **Provide clear labels** and help text

### User Experience
1. **Keep forms short** and focused
2. **Provide clear validation** messages
3. **Use progressive disclosure** for complex forms
4. **Include loading states** for async operations

### Performance
1. **Lazy load** modal content when possible
2. **Prevent body scroll** when modal is open
3. **Clean up event listeners** on unmount
4. **Optimize re-renders** with proper memoization

## 🔄 Migration Guide

### From Old Modal System
```tsx
// Old way
<UnifiedModal slideFrom="right" maxWidth="4xl">
  <div className="px-8 py-6">
    <h2>Title</h2>
    <div>Content</div>
  </div>
</UnifiedModal>

// New way
<MTDRBModal title="Title" maxWidth="4xl">
  <div>Content</div>
</MTDRBModal>
```

### From Basic HTML
```tsx
// Old way
<div className="fixed inset-0 bg-black/50">
  <div className="fixed right-0 top-0 h-full w-96 bg-white">
    <div className="p-6">
      <h2>Title</h2>
      <div>Content</div>
    </div>
  </div>
</div>

// New way
<MTDRBModal title="Title" maxWidth="4xl">
  <div>Content</div>
</MTDRBModal>
```

## 📚 Examples

### Simple Modal
```tsx
<MTDRBModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Simple Modal"
>
  <p>This is a simple modal with basic content.</p>
</MTDRBModal>
```

### Form Modal
```tsx
<MTDRBModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add Member"
  subtitle="Create a new member profile"
  footer={
    <div className="flex space-x-3">
      <button onClick={() => setIsOpen(false)}>Cancel</button>
      <button onClick={handleSubmit}>Save</button>
    </div>
  }
>
  <FormSection title="Personal Information">
    <FormGrid>
      <FormField label="Name" required>
        <input type="text" />
      </FormField>
      <FormField label="Email" required>
        <input type="email" />
      </FormField>
    </FormGrid>
  </FormSection>
</MTDRBModal>
```

### Settings Modal
```tsx
<MTDRBModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Settings"
>
  <FormSection title="Notifications">
    <Toggle
      checked={notifications}
      onChange={setNotifications}
      label="Receive email notifications"
    />
  </FormSection>
  
  <FormSection title="Privacy">
    <Toggle
      checked={marketing}
      onChange={setMarketing}
      label="Allow marketing communications"
    />
  </FormSection>
</MTDRBModal>
```

## 🎨 Design Tokens

All modal styling is centralized in the design system:

```tsx
// From src/lib/constants/designSystem.ts
export const MODAL_STYLES = {
  container: 'fixed inset-0 z-50 overflow-hidden',
  backdrop: 'fixed inset-0 bg-black/40 backdrop-blur-sm',
  panel: {
    base: 'fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl',
    slide: 'transform transition-transform duration-300 ease-in-out',
    slideIn: 'translate-x-0',
    slideOut: 'translate-x-full',
  },
  // ... more styles
};
```

This ensures consistency across all modals in the application. 