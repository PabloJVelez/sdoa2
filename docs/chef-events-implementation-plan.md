# Chef Event Management Implementation Plan

## Overview
This implementation plan creates a comprehensive chef event management system that mirrors the existing menu management structure to maintain consistency across the admin interface.

## Current State Analysis

### ✅ Already Implemented
- Chef event model with comprehensive fields
- Basic chef event service
- SDK with DTOs and API methods
- Admin hooks with React Query
- Links between products and chef events

### ❌ Missing for Event Management
- Workflows (create, update, delete)
- API routes
- Admin UI components (form, list, page)
- Validation schemas

## Implementation Requirements

### User Experience Decisions
- **Form Structure**: Tab-based approach similar to menus for consistency
- **Field Management**: All fields editable through admin initially
- **Validation Rules**: 
  - Events must be scheduled in the future
  - Party size max 50
  - Required field validation
- **Status Management**: Simple updates with transition restrictions
- **Product Integration**: Link events to specific menus
- **Admin Routes**: Follow `/app/chef-events` pattern with detail pages

## 1. Workflows (`src/workflows/`)

Create three workflow files following the menu pattern:

### `create-chef-event.ts`
```typescript
import { 
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse
} from "@medusajs/workflows-sdk"
import { CHEF_EVENT_MODULE } from "../modules/chef-event"

type CreateChefEventWorkflowInput = {
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  requestedDate: string
  requestedTime: string
  partySize: number
  eventType: 'cooking_class' | 'plated_dinner' | 'buffet_style'
  templateProductId?: string
  locationType: 'customer_location' | 'chef_location'
  locationAddress: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  notes?: string
  totalPrice?: number
  depositPaid?: boolean
  specialRequirements?: string
  estimatedDuration?: number
}

const createChefEventStep = createStep(
  "create-chef-event-step",
  async (input: CreateChefEventWorkflowInput, { container }: { container: any }) => {
    const chefEventModuleService = container.resolve(CHEF_EVENT_MODULE)
    
    const chefEvent = await chefEventModuleService.createChefEvents({
      ...input,
      requestedDate: new Date(input.requestedDate),
      totalPrice: input.totalPrice || 0,
      depositPaid: input.depositPaid || false
    })
    
    return new StepResponse(chefEvent)
  }
)

export const createChefEventWorkflow = createWorkflow(
  "create-chef-event-workflow",
  function (input: CreateChefEventWorkflowInput) {
    const chefEvent = createChefEventStep(input)
    
    return new WorkflowResponse({
      chefEvent
    })
  }
)
```

### `update-chef-event.ts`
```typescript
import { 
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse
} from "@medusajs/workflows-sdk"
import { CHEF_EVENT_MODULE } from "../modules/chef-event"

type UpdateChefEventWorkflowInput = {
  id: string
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  requestedDate?: string
  requestedTime?: string
  partySize?: number
  eventType?: 'cooking_class' | 'plated_dinner' | 'buffet_style'
  templateProductId?: string
  locationType?: 'customer_location' | 'chef_location'
  locationAddress?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  notes?: string
  totalPrice?: number
  depositPaid?: boolean
  specialRequirements?: string
  estimatedDuration?: number
}

const updateChefEventStep = createStep(
  "update-chef-event-step",
  async (input: UpdateChefEventWorkflowInput, { container }: { container: any }) => {
    const chefEventModuleService = container.resolve(CHEF_EVENT_MODULE)
    
    const updateData = { ...input }
    if (input.requestedDate) {
      updateData.requestedDate = new Date(input.requestedDate)
    }
    
    const chefEvent = await chefEventModuleService.updateChefEvents(updateData)
    
    return new StepResponse(chefEvent)
  }
)

export const updateChefEventWorkflow = createWorkflow(
  "update-chef-event-workflow",
  function (input: UpdateChefEventWorkflowInput) {
    const chefEvent = updateChefEventStep(input)
    
    return new WorkflowResponse({
      chefEvent
    })
  }
)
```

### `delete-chef-event.ts`
```typescript
import { 
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse
} from "@medusajs/workflows-sdk"
import { CHEF_EVENT_MODULE } from "../modules/chef-event"

type DeleteChefEventWorkflowInput = {
  id: string
}

const deleteChefEventStep = createStep(
  "delete-chef-event-step",
  async (input: DeleteChefEventWorkflowInput, { container }: { container: any }) => {
    const chefEventModuleService = container.resolve(CHEF_EVENT_MODULE)
    
    const chefEvent = await chefEventModuleService.retrieveChefEvent(input.id)
    
    if (!chefEvent) {
      throw new Error(`Chef event with id ${input.id} not found`)
    }
    
    await chefEventModuleService.deleteChefEvents(input.id)
    
    return new StepResponse({ 
      id: input.id,
      deleted: true 
    })
  }
)

export const deleteChefEventWorkflow = createWorkflow(
  "delete-chef-event-workflow",
  function (input: DeleteChefEventWorkflowInput) {
    const result = deleteChefEventStep(input)
    
    return new WorkflowResponse({
      result
    })
  }
)
```

## 2. API Routes (`src/api/admin/chef-events/`)

### `route.ts` - List and Create Endpoints
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { createChefEventWorkflow } from "../../../workflows/create-chef-event"
import { CHEF_EVENT_MODULE } from "../../../modules/chef-event"

const createChefEventSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
  requestedDate: z.string(),
  requestedTime: z.string(),
  partySize: z.number().min(1).max(50),
  eventType: z.enum(['cooking_class', 'plated_dinner', 'buffet_style']),
  templateProductId: z.string().optional(),
  locationType: z.enum(['customer_location', 'chef_location']),
  locationAddress: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  totalPrice: z.number().optional(),
  depositPaid: z.boolean().optional(),
  specialRequirements: z.string().optional(),
  estimatedDuration: z.number().optional()
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const chefEventModuleService = req.scope.resolve(CHEF_EVENT_MODULE)
  
  const { limit = 20, offset = 0, q, status, eventType, locationType } = req.query
  
  const filters: any = {}
  if (q) filters.q = q
  if (status) filters.status = status
  if (eventType) filters.eventType = eventType
  if (locationType) filters.locationType = locationType
  
  const [chefEvents, count] = await chefEventModuleService.listAndCountChefEvents(filters, {
    take: limit,
    skip: offset,
    order: { requestedDate: 'ASC' }
  })
  
  res.json({
    chefEvents,
    count,
    limit,
    offset
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = createChefEventSchema.parse(req.body)
  
  const { result } = await createChefEventWorkflow(req.scope).run({
    input: validatedBody
  })
  
  res.status(201).json({ chefEvent: result.chefEvent })
}
```

### `[id]/route.ts` - Retrieve, Update, Delete Endpoints
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { updateChefEventWorkflow } from "../../../../workflows/update-chef-event"
import { deleteChefEventWorkflow } from "../../../../workflows/delete-chef-event"
import { CHEF_EVENT_MODULE } from "../../../../modules/chef-event"

const updateChefEventSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  requestedDate: z.string().optional(),
  requestedTime: z.string().optional(),
  partySize: z.number().min(1).max(50).optional(),
  eventType: z.enum(['cooking_class', 'plated_dinner', 'buffet_style']).optional(),
  templateProductId: z.string().optional(),
  locationType: z.enum(['customer_location', 'chef_location']).optional(),
  locationAddress: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  totalPrice: z.number().optional(),
  depositPaid: z.boolean().optional(),
  specialRequirements: z.string().optional(),
  estimatedDuration: z.number().optional()
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const chefEventModuleService = req.scope.resolve(CHEF_EVENT_MODULE)
  const { id } = req.params
  
  const chefEvent = await chefEventModuleService.retrieveChefEvent(id)
  
  if (!chefEvent) {
    return res.status(404).json({ message: "Chef event not found" })
  }
  
  res.json({ chefEvent })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const validatedBody = updateChefEventSchema.parse(req.body)
  
  const { result } = await updateChefEventWorkflow(req.scope).run({
    input: {
      id,
      ...validatedBody
    }
  })
  
  res.json({ chefEvent: result.chefEvent })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  
  const { result } = await deleteChefEventWorkflow(req.scope).run({
    input: { id }
  })
  
  res.json({ deleted: result.deleted })
}
```

## 3. Validation Schemas (`src/admin/routes/chef-events/schemas.ts`)

```typescript
import { z } from "zod"

export const chefEventSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
  requestedDate: z.string().refine(
    (date) => {
      const eventDate = new Date(date)
      const now = new Date()
      now.setHours(0, 0, 0, 0) // Reset to start of day for comparison
      return eventDate >= now
    },
    "Event date must be today or in the future"
  ),
  requestedTime: z.string().regex(
    /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    "Time must be in HH:MM format"
  ),
  partySize: z.number().min(1, "Party size must be at least 1").max(50, "Party size cannot exceed 50"),
  eventType: z.enum(['cooking_class', 'plated_dinner', 'buffet_style']),
  templateProductId: z.string().optional(),
  locationType: z.enum(['customer_location', 'chef_location']),
  locationAddress: z.string().min(1, "Location address is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  totalPrice: z.number().min(0, "Total price cannot be negative").optional(),
  depositPaid: z.boolean().optional(),
  specialRequirements: z.string().optional(),
  estimatedDuration: z.number().min(30, "Duration must be at least 30 minutes").optional()
})

export const chefEventUpdateSchema = chefEventSchema.partial()

// Status transition validation
export const getValidStatusTransitions = (currentStatus: string) => {
  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    cancelled: [], // Final state
    completed: [] // Final state
  }
  return transitions[currentStatus] || []
}

export const validateStatusTransition = (from: string, to: string) => {
  const validTransitions = getValidStatusTransitions(from)
  return validTransitions.includes(to)
}
```

## 4. Admin UI Components

### Main Page (`src/admin/routes/chef-events/page.tsx`)
```typescript
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, FocusModal, toast } from "@medusajs/ui"
import { ChefEventList } from "./components/chef-event-list"
import { ChefEventForm } from "./components/chef-event-form"
import { useAdminCreateChefEventMutation } from "../../hooks/chef-events"
import { useState } from "react"
import type { AdminCreateChefEventDTO } from "../../../sdk/admin/admin-chef-events"

const ChefEventsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const createChefEvent = useAdminCreateChefEventMutation()

  const handleCreateChefEvent = async (data: AdminCreateChefEventDTO) => {
    try {
      await createChefEvent.mutateAsync(data)
      setShowCreateModal(false)
      toast.success("Chef Event Created", {
        description: "The chef event has been created successfully.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error creating chef event:", error)
      toast.error("Creation Failed", {
        description: "There was an error creating the chef event. Please try again.",
        duration: 5000,
      })
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Chef Events</Heading>
      </div>
      
      <ChefEventList onCreateEvent={() => setShowCreateModal(true)} />
      
      {showCreateModal && (
        <FocusModal open onOpenChange={setShowCreateModal}>
          <FocusModal.Content>
            <FocusModal.Header>
              <FocusModal.Title>Create Chef Event</FocusModal.Title>
            </FocusModal.Header>
            <FocusModal.Body>
              <ChefEventForm 
                onSubmit={handleCreateChefEvent}
                isLoading={createChefEvent.isPending}
                onCancel={() => setShowCreateModal(false)}
              />
            </FocusModal.Body>
          </FocusModal.Content>
        </FocusModal>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Chef Events",
})

export default ChefEventsPage
```

### Detail Page (`src/admin/routes/chef-events/[id]/page.tsx`)
```typescript
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, toast } from "@medusajs/ui"
import { useParams } from "react-router-dom"
import { ChefEventForm } from "../components/chef-event-form"
import { useAdminRetrieveChefEvent, useAdminUpdateChefEventMutation } from "../../../hooks/chef-events"
import type { AdminUpdateChefEventDTO } from "../../../../sdk/admin/admin-chef-events"

const ChefEventDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: chefEvent, isLoading } = useAdminRetrieveChefEvent(id!)
  const updateChefEvent = useAdminUpdateChefEventMutation(id!)

  const handleUpdateChefEvent = async (data: AdminUpdateChefEventDTO) => {
    try {
      await updateChefEvent.mutateAsync(data)
      toast.success("Chef Event Updated", {
        description: "The chef event has been updated successfully.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error updating chef event:", error)
      toast.error("Update Failed", {
        description: "There was an error updating the chef event. Please try again.",
        duration: 5000,
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!chefEvent) {
    return <div>Chef event not found</div>
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">
          Edit Chef Event - {chefEvent.firstName} {chefEvent.lastName}
        </Heading>
      </div>
      
      <ChefEventForm 
        initialData={chefEvent}
        onSubmit={handleUpdateChefEvent}
        isLoading={updateChefEvent.isPending}
        onCancel={() => window.history.back()}
      />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Chef Event Details",
})

export default ChefEventDetailPage
```

## 5. Form Component Structure

### Form Component (`src/admin/routes/chef-events/components/chef-event-form.tsx`)

**Tab Structure:**
1. **General Info**: Basic event details (date, time, party size, event type)
2. **Contact**: Customer contact information
3. **Location**: Location type and address
4. **Details**: Additional details (notes, special requirements, pricing)

**Key Features:**
- Status transition validation
- Date/time validation
- Party size limits
- Menu integration dropdown
- Form state management with react-hook-form
- Error handling and display

## 6. List Component Features

### List Component (`src/admin/routes/chef-events/components/chef-event-list.tsx`)

**Primary Columns:**
- Customer Name (firstName + lastName)
- Event Date & Time
- Event Type
- Party Size
- Status (with status badge)
- Location Type
- Created At

**Filtering Options:**
- Status dropdown
- Event type dropdown
- Date range picker
- Location type dropdown
- Search by customer name/email

**Actions:**
- View/Edit event
- Delete event
- Quick status change

## 7. File Structure

```
src/
├── workflows/
│   ├── create-chef-event.ts
│   ├── update-chef-event.ts
│   └── delete-chef-event.ts
├── api/admin/chef-events/
│   ├── route.ts
│   └── [id]/route.ts
├── admin/routes/chef-events/
│   ├── page.tsx
│   ├── [id]/page.tsx
│   ├── components/
│   │   ├── chef-event-form.tsx
│   │   └── chef-event-list.tsx
│   └── schemas.ts
```

## 8. Implementation Order

1. **Workflows** - Create the business logic layer
2. **API Routes** - Implement the REST endpoints
3. **Validation Schemas** - Define form validation
4. **List Component** - Create the events listing page
5. **Form Component** - Build the create/edit form
6. **Main Pages** - Wire everything together
7. **Menu Integration** - Add menu linking functionality

## 9. Menu Integration Points

- Add menu selection dropdown in the form using existing `useAdminListMenus` hook
- Use existing `AdminMenusResponse` type from menu SDK
- Display linked menu information in the list view
- Add menu details in the event detail view
- Link to menu detail page from event form

## 10. Status Management

**Status Transitions:**
- `pending` → `confirmed` | `cancelled`
- `confirmed` → `completed` | `cancelled`
- `cancelled` → (final state)
- `completed` → (final state)

**Implementation in Form:**
```typescript
const validateStatusTransition = (from: string, to: string) => {
  const validTransitions = getValidStatusTransitions(from)
  return validTransitions.includes(to)
}
```

## 11. Additional Features

### Status Badges
- Color-coded status indicators
- Tooltip with status descriptions
- Visual status progression

### Data Validation
- Future date validation
- Email format validation
- Phone number formatting
- Time format validation

### User Experience
- Loading states
- Error handling
- Success notifications
- Confirmation dialogs for destructive actions

## 12. Testing Considerations

### Unit Tests
- Form validation
- Status transition logic
- Date/time validation
- API endpoint testing

### Integration Tests
- Workflow execution
- Database operations
- API request/response cycles

### E2E Tests
- Complete event creation flow
- Event editing and status changes
- List filtering and search

This implementation plan provides a comprehensive chef event management system that maintains consistency with the existing menu management while providing all necessary functionality for managing chef events through the admin interface. 