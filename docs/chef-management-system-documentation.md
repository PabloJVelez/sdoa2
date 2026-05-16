# Chef Management System Documentation

## Overview

This Medusa v2 application implements a comprehensive chef/catering business management system that allows chefs to:
- Create and manage menu templates with hierarchical structure (menus → courses → dishes → ingredients)
- Handle customer booking requests (chef events) with full lifecycle management
- Link menu templates to bookings for standardized service offerings
- Manage business operations through a custom admin interface

## Business Model

### Core Entities

**Menus** = Service offerings/templates that chefs create to showcase their culinary services
**Chef Events** = Customer booking requests that reference menu templates and track the booking lifecycle

### Workflow
```
Menu Creation → Customer Discovery → Event Request → Confirmation → Service Delivery
```

## System Architecture

### Module Structure
The system is built using Medusa v2's modular architecture with two core modules:

```
apps/medusa/src/modules/
├── menu/                 # Menu management module
│   ├── models/          # Data models (Menu, Course, Dish, Ingredient)
│   ├── service.ts       # Business logic layer
│   ├── migrations/      # Database schema changes
│   └── index.ts         # Module definition
└── chef-event/          # Chef event management module
    ├── models/          # Data models (ChefEvent)
    ├── service.ts       # Business logic layer
    ├── migrations/      # Database schema changes
    └── index.ts         # Module definition
```

### Data Models

#### Menu Hierarchy
```typescript
// apps/medusa/src/modules/menu/models/menu.ts
Menu {
  id: string
  name: string
  description?: string
  isActive: boolean
  estimatedCost?: number
  estimatedServingTime?: number
  courses: Course[]        // One-to-many relationship
}

// apps/medusa/src/modules/menu/models/course.ts
Course {
  id: string
  name: string
  description?: string
  order: number
  menu_id: string
  dishes: Dish[]          // One-to-many relationship
}

// apps/medusa/src/modules/menu/models/dish.ts
Dish {
  id: string
  name: string
  description?: string
  course_id: string
  ingredients: Ingredient[] // One-to-many relationship
}

// apps/medusa/src/modules/menu/models/ingredient.ts
Ingredient {
  id: string
  name: string
  quantity?: string
  unit?: string
  notes?: string
  dish_id: string
}
```

#### Chef Event Model
```typescript
// apps/medusa/src/modules/chef-event/models/chef-event.ts
ChefEvent {
  id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  requestedDate: Date
  requestedTime: string
  partySize: number
  eventType: 'cooking_class' | 'plated_dinner' | 'buffet_style'
  templateProductId?: string    // Reference to Menu template
  locationType: 'customer_location' | 'chef_location'
  locationAddress: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  notes?: string
  totalPrice?: number
  depositPaid: boolean
  specialRequirements?: string
  estimatedDuration?: number
}
```

### Service Layer

Both modules use Medusa v2's Service Factory pattern for automatic CRUD operations:

```typescript
// apps/medusa/src/modules/menu/service.ts
class MenuModuleService extends MedusaService({
  Menu, Course, Dish, Ingredient
}) {
  // Automatically generates:
  // - createMenus, retrieveMenu, listMenus, updateMenus, deleteMenus
  // - createCourses, retrieveCourse, listCourses, updateCourses, deleteCourses
  // - createDishes, retrieveDish, listDishes, updateDishes, deleteDishes
  // - createIngredients, retrieveIngredient, listIngredients, updateIngredients, deleteIngredients
}

// apps/medusa/src/modules/chef-event/service.ts
class ChefEventModuleService extends MedusaService({
  ChefEvent
}) {
  // Automatically generates:
  // - createChefEvents, retrieveChefEvent, listChefEvents, updateChefEvents, deleteChefEvents
}
```

## API Layer

### REST Endpoints

#### Menu APIs
```typescript
// apps/medusa/src/api/admin/menus/route.ts
GET    /admin/menus           # List all menus with pagination
POST   /admin/menus           # Create new menu

// apps/medusa/src/api/admin/menus/[id]/route.ts
GET    /admin/menus/:id       # Retrieve specific menu
POST   /admin/menus/:id       # Update menu
DELETE /admin/menus/:id       # Delete menu
```

#### Chef Event APIs
```typescript
// apps/medusa/src/api/admin/chef-events/route.ts
GET    /admin/chef-events     # List events with filtering (status, type, location, search)
POST   /admin/chef-events     # Create new chef event

// apps/medusa/src/api/admin/chef-events/[id]/route.ts
GET    /admin/chef-events/:id # Retrieve specific event
POST   /admin/chef-events/:id # Update event
DELETE /admin/chef-events/:id # Delete event
```

### Response Formats

All APIs return data wrapped in response objects:

```typescript
// Single entity responses
{ chefEvent: ChefEventDTO }
{ menu: MenuDTO }

// List responses
{ 
  chefEvents: ChefEventDTO[], 
  count: number, 
  limit: number, 
  offset: number 
}
{
  menus: MenuDTO[],
  count: number,
  limit: number,
  offset: number
}
```

## Workflow Layer

### Chef Event Workflows
```typescript
// apps/medusa/src/workflows/create-chef-event.ts
createChefEventWorkflow()     # Validates and creates new chef events

// apps/medusa/src/workflows/update-chef-event.ts  
updateChefEventWorkflow()     # Handles updates with date conversion

// apps/medusa/src/workflows/delete-chef-event.ts
deleteChefEventWorkflow()     # Soft delete with existence validation
```

### Menu Workflows
```typescript
// apps/medusa/src/workflows/create-menu.ts
createMenuWorkflow()          # Creates menus with validation

// apps/medusa/src/workflows/delete-menu.ts
deleteMenuWorkflow()          # Handles menu deletion
```

## Admin Interface

### Component Architecture

#### Chef Events Management
```typescript
// apps/medusa/src/admin/routes/chef-events/page.tsx
- Main listing page with filtering and search
- Create modal integration
- Status-based filtering (pending, confirmed, cancelled, completed)

// apps/medusa/src/admin/routes/chef-events/[id]/page.tsx  
- Detail/edit page for individual events
- Form integration with validation

// apps/medusa/src/admin/routes/chef-events/components/
├── chef-event-form.tsx       # Tabbed form (General, Contact, Location, Details)
├── chef-event-list.tsx       # Table with filtering and actions
└── menu-details.tsx          # Menu template display component
```

#### Menu Management
```typescript
// apps/medusa/src/admin/routes/menus/page.tsx
- Menu listing and management interface

// apps/medusa/src/admin/routes/menus/[id]/page.tsx
- Menu detail and editing interface

// apps/medusa/src/admin/routes/menus/components/
├── menu-form.tsx             # Menu creation/editing forms
└── menu-list.tsx             # Menu listing component
```

### Form Validation

Uses Zod schemas for runtime validation:

```typescript
// apps/medusa/src/admin/routes/chef-events/schemas.ts
chefEventSchema               # Complete validation for new events
chefEventUpdateSchema         # Partial validation for updates
statusTransitionValidation    # Business rule enforcement

// apps/medusa/src/admin/routes/menus/schemas.ts  
menuSchema                    # Menu validation rules
```

### State Management

#### React Query Integration
```typescript
// apps/medusa/src/admin/hooks/chef-events.ts
useAdminListChefEvents()      # List with filtering
useAdminRetrieveChefEvent()   # Single event retrieval
useAdminCreateChefEventMutation()   # Create mutations
useAdminUpdateChefEventMutation()   # Update mutations

// apps/medusa/src/admin/hooks/menus.ts
useAdminListMenus()           # Menu listing
useAdminRetrieveMenu()        # Single menu retrieval
useAdminCreateMenuMutation()  # Create mutations
useAdminUpdateMenuMutation()  # Update mutations
```

#### Form State Management
React Hook Form with Zod validation:
- Automatic form validation
- Error handling and display
- Form reset on data changes
- Status transition validation

## SDK Integration

### Type-Safe Client
```typescript
// apps/medusa/src/sdk/admin/admin-chef-events.ts
AdminChefEventsResource {
  list(query)                 # Filtered listing
  retrieve(id)                # Single entity retrieval  
  create(data)                # Creation
  update(id, data)            # Updates
  delete(id)                  # Deletion
}

// apps/medusa/src/sdk/admin/admin-menus.ts
AdminMenusResource {
  list(query)                 # Menu listing
  retrieve(id)                # Single menu retrieval
  create(data)                # Menu creation
  update(id, data)            # Menu updates  
  delete(id)                  # Menu deletion
}
```

### Response Unwrapping
SDK handles API response unwrapping automatically:
```typescript
// API returns: { chefEvent: {...} }
// SDK returns: {...} (unwrapped chef event)
```

## Data Relationships

### Menu-Chef Event Integration
```typescript
// Chef events can reference menu templates
ChefEvent.templateProductId -> Menu.id

// This enables:
// 1. Using menus as starting templates for events
// 2. Tracking which menus are most popular
// 3. Standardizing service offerings
// 4. Providing cost estimates based on menu complexity
```

### Product Linking
```typescript
// apps/medusa/src/links/product-menu.ts
// apps/medusa/src/links/product-chefEvent.ts
// Links establish relationships between core entities and Medusa products
```

## Key Features

### Chef Event Lifecycle Management
1. **Pending**: New customer requests
2. **Confirmed**: Chef has accepted and confirmed details
3. **Completed**: Service has been delivered
4. **Cancelled**: Request was cancelled

### Business Intelligence
- Event status tracking and reporting
- Menu template usage analytics
- Customer information management
- Revenue tracking through pricing fields

### Customization Support
- Menu templates provide starting points
- Events can be customized per customer needs
- Special requirements and notes fields
- Flexible pricing and duration

## Technical Patterns

### Medusa v2 Best Practices
- **Modules**: Self-contained domain logic
- **Service Factory**: Automatic CRUD generation
- **Workflows**: Complex business operations
- **Type Safety**: Full TypeScript coverage
- **Validation**: Zod schemas for runtime safety
- **Error Handling**: Consistent error responses
- **Admin SDK**: Type-safe client integration

### Frontend Architecture
- **React Query**: Server state management
- **React Hook Form**: Form state and validation
- **Medusa UI**: Consistent design system
- **TypeScript**: End-to-end type safety

## Development Guidelines

### Adding New Features
1. Start with data model in modules/
2. Add workflows for business logic
3. Create API routes following REST patterns
4. Update SDK with new endpoints
5. Build admin components with validation
6. Add comprehensive error handling

### Testing Strategy
- Unit tests for services and workflows
- Integration tests for API endpoints
- Component tests for admin interface
- End-to-end tests for critical user flows

## Future Storefront Integration

### Potential Customer-Facing Features
- Browse available menu templates
- Request chef events with menu selection
- Real-time availability checking
- Customer portal for booking management
- Review and rating system
- Online payment integration

### Data Already Available
- Complete menu catalog with detailed ingredients
- Event types and pricing information
- Chef location and service area data
- Availability and scheduling data

This system provides a solid foundation for both chef administration and future customer-facing storefront development. 