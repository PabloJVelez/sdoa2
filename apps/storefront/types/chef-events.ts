// Import chef event types from the data layer for consistency
import type {
  StoreChefEventDTO,
  StoreCreateChefEventDTO,
  StoreChefEventResponse,
  ChefEventError,
  PRICING_STRUCTURE,
} from '@libs/util/server/data/chef-events.server';

// Re-export for external use
export type {
  StoreChefEventDTO,
  StoreCreateChefEventDTO,
  StoreChefEventResponse,
  ChefEventError,
};

// Export pricing structure
export { PRICING_STRUCTURE } from '@libs/util/server/data/chef-events.server';

// Event type information for UI display
export interface EventTypeInfo {
  id: keyof typeof PRICING_STRUCTURE;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  idealFor: string[];
}

// Form step types for multi-step event request form
export type EventRequestStep = 
  | 'menu-selection'
  | 'event-type'
  | 'date-time'
  | 'party-size'
  | 'location'
  | 'contact-details'
  | 'special-requests'
  | 'review';

export interface EventRequestFormData extends StoreCreateChefEventDTO {
  // Additional form-specific fields that don't go to the API
  agreedToTerms?: boolean;
  marketingConsent?: boolean;
  estimatedTotal?: number;
}

export interface EventRequestFormState {
  currentStep: EventRequestStep;
  data: Partial<EventRequestFormData>;
  errors: Record<string, string[]>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Step validation schemas
export interface StepValidation {
  step: EventRequestStep;
  validate: (data: Partial<EventRequestFormData>) => string[];
  isRequired: boolean;
}

// Event type selection props
export interface EventTypeCardProps {
  eventType: EventTypeInfo;
  selected?: boolean;
  onSelect?: (eventType: keyof typeof PRICING_STRUCTURE) => void;
  partySize?: number;
  showPricing?: boolean;
}

// Date and time selection props
export interface DateTimeFormProps {
  selectedDate?: string;
  selectedTime?: string;
  onDateChange?: (date: string) => void;
  onTimeChange?: (time: string) => void;
  minDate?: string;
  errors?: string[];
}

// Party size selector props
export interface PartySizeSelectorProps {
  value?: number;
  onChange?: (size: number) => void;
  min?: number;
  max?: number;
  eventType?: keyof typeof PRICING_STRUCTURE;
  showPricing?: boolean;
}

// Location form props
export interface LocationFormProps {
  locationType?: 'customer_location' | 'chef_location';
  locationAddress?: string;
  onLocationTypeChange?: (type: 'customer_location' | 'chef_location') => void;
  onAddressChange?: (address: string) => void;
  errors?: string[];
}

// Contact details form props
export interface ContactDetailsFormProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  onFieldChange?: (field: string, value: string) => void;
  errors?: Record<string, string[]>;
}

// Special requests form props
export interface SpecialRequestsFormProps {
  notes?: string;
  specialRequirements?: string;
  onNotesChange?: (notes: string) => void;
  onSpecialRequirementsChange?: (requirements: string) => void;
}

// Review and summary props
export interface EventRequestSummaryProps {
  data: EventRequestFormData;
  eventTypeInfo?: EventTypeInfo;
  estimatedTotal?: number;
  onEdit?: (step: EventRequestStep) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

// Success page props
export interface EventRequestSuccessProps {
  chefEvent: StoreChefEventDTO;
  message: string;
}

// Pricing calculation utilities
export interface PricingBreakdown {
  eventType: keyof typeof PRICING_STRUCTURE;
  pricePerPerson: number;
  partySize: number;
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
}

// Event request status for tracking
export type EventRequestStatus = 'draft' | 'submitting' | 'submitted' | 'error';

// Form navigation utilities
export interface FormNavigation {
  currentStep: EventRequestStep;
  steps: EventRequestStep[];
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToStep: (step: EventRequestStep) => void;
  goToNext: () => void;
  goToPrevious: () => void;
} 