# Task Management Modals

A comprehensive collection of smart, sliding modals for task management in MTDRB Fit Admin Dashboard. Each modal features Apple-inspired design, smooth animations, and intelligent automation features.

## 🎯 Overview

This package provides 12 task management modals with the following features:

- **Apple-inspired UI** with clean design and smooth animations
- **Smart automation** with AI-powered suggestions
- **Pro feature gating** for advanced functionality
- **Real-time validation** and error handling
- **Modular structure** for easy customization
- **TypeScript support** with full type safety

## 📦 Modal Components

### Task Management Modals

#### 1. `AddTaskModal`
Creates new tasks with smart defaults and AI suggestions.

**Features:**
- Task name, type, description, priority, deadline, assignee
- Smart defaults based on task type
- AI suggestions for assignee and deadline
- Pro-only automation features

**Props:**
```typescript
interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  assignedTo?: string;
  contextMemberId?: string;
  originPage?: string;
  isPro?: boolean;
}
```

#### 2. `EditTaskModal`
Edits existing tasks with history tracking and smart warnings.

**Features:**
- Pre-filled form data
- Task history display
- Smart warnings for overdue tasks
- AI suggestions for improvements

**Props:**
```typescript
interface EditTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}
```

#### 3. `DeleteTaskModal`
Deletes or archives tasks with automation warnings.

**Features:**
- Confirmation dialog with archive option
- Smart flags for linked automation
- Pro-only advanced deletion options

**Props:**
```typescript
interface DeleteTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}
```

#### 4. `StartTaskModal`
Starts tasks with timer and status transition options.

**Features:**
- Quick-start with optional timer
- Status transition suggestions
- Optional comment before starting
- Smart status recommendations

**Props:**
```typescript
interface StartTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}
```

#### 5. `CompleteTaskModal`
Marks tasks as complete with outcome tracking.

**Features:**
- Completion confirmation
- Outcome summary and comments
- File upload support
- Smart logic for late completions

**Props:**
```typescript
interface CompleteTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}
```

#### 6. `PauseTaskModal`
Pauses tasks with reasons and smart reminders.

**Features:**
- Pause reason selection
- Optional notes
- Smart reminder toggles
- Auto-resume suggestions

**Props:**
```typescript
interface PauseTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}
```

#### 7. `AssignTaskModal`
Assigns tasks with smart suggestions and role filtering.

**Features:**
- Smart assignee suggestions
- Search and filter by role
- Workload-based recommendations
- Self-assignment option

**Props:**
```typescript
interface AssignTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}
```

#### 8. `ExportTaskDataModal`
Exports task data with filters and smart insights.

**Features:**
- Multiple export formats (CSV, Excel, JSON)
- Advanced filtering options
- Smart insights for overdue tasks
- Pro-only advanced analytics

**Props:**
```typescript
interface ExportTaskDataModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}
```

### Task Automation Modals

#### 9. `SetupTaskAutomationModal`
Creates automated task workflows with templates.

**Features:**
- Recurring, triggered, and scheduled automation
- Pre-built templates
- Smart preview of upcoming tasks
- Pro-only advanced automation

**Props:**
```typescript
interface SetupTaskAutomationModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}
```

#### 10. `EnableAutoAssignmentModal`
Configures automatic task assignment logic.

**Features:**
- Round-robin, availability, and role-based assignment
- Visual preview of assignment queue
- Override options
- Pro-only advanced algorithms

**Props:**
```typescript
interface EnableAutoAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}
```

#### 11. `EnablePrioritySortingModal`
Auto-sorts tasks based on deadlines and impact.

**Features:**
- Multiple sorting factors
- Weight-based scoring
- Pro-only AI weight scoring
- Real-time preview

**Props:**
```typescript
interface EnablePrioritySortingModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}
```

#### 12. `EnableDeadlineRemindersModal`
Configures deadline notifications and smart detection.

**Features:**
- Multiple delivery methods (App, Email, WhatsApp)
- Customizable message templates
- Smart detection of missing deadlines
- Pro-only advanced features

**Props:**
```typescript
interface EnableDeadlineRemindersModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}
```

## 🛠️ Usage

### Basic Usage

```tsx
import { AddTaskModal } from '../components/tasks/modals';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Add Task
      </button>
      
      <AddTaskModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isPro={true}
      />
    </div>
  );
}
```

### With Smart Hook

```tsx
import { useSmartTaskModal } from '../components/tasks/modals';

function MyComponent() {
  const {
    loading,
    task,
    createTask,
    alerts,
  } = useSmartTaskModal({ taskId: '123', isPro: true });

  const handleCreateTask = async (taskData) => {
    const result = await createTask(taskData);
    if (result.success) {
      // Handle success
    }
  };

  return (
    <div>
      {/* Your component */}
    </div>
  );
}
```

## 🎨 Customization

### Styling

All modals use Tailwind CSS classes and can be customized by modifying the base `SmartTaskModal` component:

```tsx
// Custom modal styling
<SmartTaskModal
  open={open}
  onClose={onClose}
  maxWidth="max-w-5xl" // Custom width
  title="Custom Title"
  subtitle="Custom subtitle"
>
  {/* Your content */}
</SmartTaskModal>
```

### Pro Features

Pro features are automatically gated based on the `isPro` prop:

```tsx
// Pro features will be disabled
<AddTaskModal isPro={false} />

// Pro features will be enabled
<AddTaskModal isPro={true} />
```

### Animation Customization

Modals use Framer Motion for animations. Customize by modifying the `SmartTaskModal` component:

```tsx
// Custom animation variants
const customVariants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  exit: { x: '100%' }
};
```

## 📁 File Structure

```
src/components/tasks/modals/
├── SmartTaskModal.tsx          # Base modal component
├── useSmartTaskModal.ts        # Smart hook for task operations
├── AddTaskModal.tsx           # Add task modal
├── EditTaskModal.tsx          # Edit task modal
├── DeleteTaskModal.tsx        # Delete task modal
├── StartTaskModal.tsx         # Start task modal
├── CompleteTaskModal.tsx      # Complete task modal
├── PauseTaskModal.tsx         # Pause task modal
├── AssignTaskModal.tsx        # Assign task modal
├── ExportTaskDataModal.tsx    # Export task data modal
├── SetupTaskAutomationModal.tsx # Setup automation modal
├── EnableAutoAssignmentModal.tsx # Auto assignment modal
├── EnablePrioritySortingModal.tsx # Priority sorting modal
├── EnableDeadlineRemindersModal.tsx # Deadline reminders modal
├── index.ts                   # Export all modals
└── README.md                  # This file
```

## 🧪 Testing

### Demo Page

Use the demo page to test all modals:

```tsx
import TaskModalsDemo from '../pages/TaskModalsDemo';

// Navigate to /task-modals-demo
```

### Unit Testing

```tsx
import { render, screen } from '@testing-library/react';
import { AddTaskModal } from '../components/tasks/modals';

test('AddTaskModal renders correctly', () => {
  render(
    <AddTaskModal
      open={true}
      onClose={() => {}}
      isPro={false}
    />
  );
  
  expect(screen.getByText('Create New Task')).toBeInTheDocument();
});
```

## 🚀 Performance

### Optimization Tips

1. **Lazy Loading**: Import modals only when needed
2. **Memoization**: Use React.memo for modal components
3. **Debouncing**: Debounce form inputs for better performance
4. **Virtual Scrolling**: For large lists in modals

### Bundle Size

- Base modal: ~15KB
- Each task modal: ~8-12KB
- Total package: ~150KB (uncompressed)

## 🔧 Configuration

### Environment Variables

```env
# Enable/disable features
REACT_APP_ENABLE_TASK_AUTOMATION=true
REACT_APP_ENABLE_AI_SUGGESTIONS=true
REACT_APP_PRO_FEATURES_ENABLED=true
```

### Theme Configuration

```tsx
// Custom theme for modals
const modalTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
  spacing: {
    modalPadding: '24px',
    borderRadius: '12px',
  },
};
```

## 🤝 Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Navigate to `/task-modals-demo`

### Adding New Modals

1. Create new modal component
2. Add to `index.ts` exports
3. Update demo page
4. Add tests
5. Update documentation

### Code Style

- Use TypeScript for all components
- Follow Apple design guidelines
- Use Tailwind CSS for styling
- Implement proper error handling
- Add comprehensive tests

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the demo page for examples
- Review the TypeScript definitions
- Consult the inline documentation

---

**Built with ❤️ for MTDRB Fit Admin Dashboard** 