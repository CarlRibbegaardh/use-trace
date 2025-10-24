# Todo Example App

A complete todo application built with modern web technologies, following Domain-Driven Design (DDD) principles and clean code practices.

## Features

- ✅ Add new todos with title and optional description
- ✅ Mark todos as completed/pending
- ✅ Delete todos
- ✅ Filter todos by status (All, Pending, Completed)
- ✅ Responsive Material-UI design
- ✅ State management with Redux Toolkit
- ✅ Comprehensive E2E testing with Playwright
- ✅ Integration with the tracing library for component tracking

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Testing**: Playwright for E2E tests
- **Build Tool**: Vite
- **Architecture**: Domain-Driven Design (DDD)

## Architecture

The application follows DDD principles with clear separation of concerns:

### Domain Layer (`src/domain/`)
- `Todo.ts` - Todo entity and value objects (TodoId, TodoTitle, TodoDescription)
- `TodoService.ts` - Business logic and commands (Create, Update, Toggle, Delete)

### Infrastructure Layer (`src/infrastructure/`)
- `InMemoryTodoRepository.ts` - Data persistence (in-memory implementation)

### Application Layer (`src/store/`)
- `todoSlice.ts` - Redux slice with async thunks
- `store.ts` - Redux store configuration

### Presentation Layer (`src/components/`)
- `AddTodoForm.tsx` - Form for creating new todos
- `TodoItem.tsx` - Individual todo item component
- `TodoList.tsx` - List of todos with filtering

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# The app will be available at http://localhost:5174
```

### Testing

```bash
# Run E2E tests (headless)
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests in headed mode
pnpm test:e2e:headed
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── AddTodoForm.tsx
│   ├── TodoItem.tsx
│   └── TodoList.tsx
├── domain/             # Domain layer (entities, value objects, business logic)
│   ├── Todo.ts
│   └── TodoService.ts
├── infrastructure/     # Infrastructure layer (repositories, external services)
│   └── InMemoryTodoRepository.ts
├── store/             # Application layer (Redux state management)
│   ├── store.ts
│   └── todoSlice.ts
├── hooks/             # Custom React hooks
│   └── redux.ts
├── App.tsx           # Main application component
└── main.tsx          # Application entry point

tests/
└── todo.spec.ts      # Playwright E2E tests
```

## Testing Scenarios

The E2E test suite covers:

1. **Initial State**: Empty state display
2. **Todo Creation**: Adding todos with validation
3. **Todo Management**: Toggling completion status
4. **Todo Deletion**: Removing todos
5. **Filtering**: Filter by All/Pending/Completed
6. **Edge Cases**: Empty filtered results, form validation

## Integration with Tracing Library

This app demonstrates the use of the `useAutoTrace` hook from the tracing library:

- Components are automatically tracked for render analysis
- Helps identify performance bottlenecks and unnecessary re-renders
- Provides insights into component lifecycle and state changes

## Design Decisions

### Domain-Driven Design
- **Value Objects**: TodoId, TodoTitle, TodoDescription with validation
- **Entities**: Todo with business rules
- **Services**: TodoService encapsulates business logic
- **Repository Pattern**: Abstract data access layer

### State Management
- Redux Toolkit for predictable state management
- Async thunks for handling side effects
- Proper error handling and loading states

### UI/UX
- Material-UI for consistent, accessible design
- Responsive layout for mobile and desktop
- Intuitive user interactions with immediate feedback

### Testing Strategy
- Comprehensive E2E tests covering user workflows
- Test-driven approach with data-testid attributes
- Cross-browser testing support

## Future Enhancements

- [ ] Persistence layer (localStorage, database)
- [ ] Todo editing functionality
- [ ] Due dates and priorities
- [ ] Categories and tags
- [ ] Search functionality
- [ ] Drag and drop reordering
- [ ] Unit tests for domain logic
- [ ] Integration tests for Redux slices
