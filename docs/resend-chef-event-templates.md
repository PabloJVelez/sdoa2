# Chef Event Email Templates for Resend

This document provides detailed email templates for the chef event system using Resend and React Email components.

## Template Structure

All templates follow a consistent structure:
- Header with branding
- Main content section
- Action buttons/links
- Footer with contact information

## 1. Chef Event Requested Template

### File: `src/modules/resend/emails/chef-event-requested.tsx`

```typescript
import { 
  Text, 
  Column, 
  Container, 
  Heading, 
  Html, 
  Row, 
  Section, 
  Tailwind, 
  Head, 
  Preview, 
  Body, 
  Link, 
  Button,
} from "@react-email/components"

type ChefEventRequestedEmailProps = {
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  booking: {
    date: string
    time: string
    menu: string
    event_type: string
    location_type: string
    location_address: string
    party_size: number
    notes: string
  }
  event: {
    status: string
    total_price: string
    conflict: boolean
  }
  requestReference: string
  chefContact: {
    email: string
    phone: string
  }
  emailType: "customer_confirmation" | "chef_notification"
}

function ChefEventRequestedEmailComponent({ 
  customer, 
  booking, 
  event, 
  requestReference, 
  chefContact,
  emailType 
}: ChefEventRequestedEmailProps) {
  const isCustomerEmail = emailType === "customer_confirmation"
  
  return (
    <Tailwind>
      <Html className="font-sans bg-gray-100">
        <Head />
        <Preview>
          {isCustomerEmail 
            ? "Your chef event request has been received" 
            : "New chef event request received"
          }
        </Preview>
        <Body className="bg-white my-10 mx-auto w-full max-w-2xl">
          {/* Header */}
          <Section className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-4">
            <Container>
              <Row>
                <Column>
                  <Heading className="text-2xl font-bold m-0">
                    🍳 Chef Elena Rodriguez
                  </Heading>
                  <Text className="text-orange-100 m-0">
                    Private Chef & Culinary Experiences
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* Main Content */}
          <Container className="p-6">
            {isCustomerEmail ? (
              <>
                <Heading className="text-2xl font-bold text-gray-800 mb-4">
                  Thank you for your event request!
                </Heading>
                <Text className="text-gray-600 mb-6">
                  Hi {customer.first_name}, we've received your request for a private chef experience. 
                  We'll review your details and get back to you within 24-48 hours.
                </Text>
              </>
            ) : (
              <>
                <Heading className="text-2xl font-bold text-gray-800 mb-4">
                  New Event Request Received
                </Heading>
                <Text className="text-gray-600 mb-6">
                  You have a new chef event request that requires your review.
                </Text>
              </>
            )}

            {/* Event Details */}
            <Section className="bg-gray-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Event Details
              </Heading>
              
              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Date & Time</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.date} at {booking.time}</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Event Type</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.event_type}</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Party Size</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.party_size} guests</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Location</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">
                    {booking.location_type} - {booking.location_address}
                  </Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Menu</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.menu}</Text>
                </Column>
              </Row>

              {booking.notes && (
                <Row className="mb-3">
                  <Column className="w-1/3">
                    <Text className="font-semibold text-gray-700">Special Notes</Text>
                  </Column>
                  <Column className="w-2/3">
                    <Text className="text-gray-600">{booking.notes}</Text>
                  </Column>
                </Row>
              )}

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Total Price</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600 font-bold">${event.total_price}</Text>
                </Column>
              </Row>
            </Section>

            {/* Customer Information */}
            <Section className="bg-blue-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Customer Information
              </Heading>
              
              <Row className="mb-2">
                <Text className="text-gray-600">
                  <strong>Name:</strong> {customer.first_name} {customer.last_name}
                </Text>
              </Row>
              
              <Row className="mb-2">
                <Text className="text-gray-600">
                  <strong>Email:</strong> {customer.email}
                </Text>
              </Row>
              
              <Row className="mb-2">
                <Text className="text-gray-600">
                  <strong>Phone:</strong> {customer.phone}
                </Text>
              </Row>
            </Section>

            {/* Reference Number */}
            <Section className="text-center mb-6">
              <Text className="text-sm text-gray-500">
                Reference: <strong>{requestReference}</strong>
              </Text>
            </Section>

            {/* Action Buttons */}
            {!isCustomerEmail && (
              <Section className="text-center mb-6">
                <Row>
                  <Column>
                    <Button 
                      href={`${process.env.ADMIN_BACKEND_URL}/admin/events/${requestReference}/accept`}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold mr-4"
                    >
                      Accept Request
                    </Button>
                    <Button 
                      href={`${process.env.ADMIN_BACKEND_URL}/admin/events/${requestReference}/reject`}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      Decline Request
                    </Button>
                  </Column>
                </Row>
              </Section>
            )}

            {/* Next Steps */}
            {isCustomerEmail && (
              <Section className="bg-green-50 rounded-lg p-6 mb-6">
                <Heading className="text-lg font-semibold text-gray-800 mb-4">
                  What happens next?
                </Heading>
                <Text className="text-gray-600 mb-3">
                  1. We'll review your request within 24-48 hours
                </Text>
                <Text className="text-gray-600 mb-3">
                  2. You'll receive an email with our decision
                </Text>
                <Text className="text-gray-600 mb-3">
                  3. If accepted, you'll get a secure payment link
                </Text>
                <Text className="text-gray-600">
                  4. We'll confirm all details before your event
                </Text>
              </Section>
            )}
          </Container>

          {/* Footer */}
          <Section className="bg-gray-50 p-6">
            <Container>
              <Row>
                <Column>
                  <Text className="text-center text-gray-500 text-sm mb-4">
                    Questions? Contact us at {chefContact.email} or {chefContact.phone}
                  </Text>
                  <Text className="text-center text-gray-400 text-xs">
                    © {new Date().getFullYear()} Chef Elena Rodriguez. All rights reserved.
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  )
}

export const chefEventRequestedEmail = (props: ChefEventRequestedEmailProps) => (
  <ChefEventRequestedEmailComponent {...props} />
)
```

## 2. Chef Event Accepted Template

### File: `src/modules/resend/emails/chef-event-accepted.tsx`

```typescript
import { 
  Text, 
  Column, 
  Container, 
  Heading, 
  Html, 
  Row, 
  Section, 
  Tailwind, 
  Head, 
  Preview, 
  Body, 
  Link, 
  Button,
} from "@react-email/components"

type ChefEventAcceptedEmailProps = {
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  booking: {
    date: string
    time: string
    event_type: string
    location_type: string
    location_address: string
    party_size: number
    notes: string
  }
  event: {
    status: string
    total_price: string
    price_per_person: string
  }
  product: {
    id: string
    handle: string
    title: string
    purchase_url: string
  }
  chef: {
    name: string
    email: string
    phone: string
  }
  requestReference: string
  acceptanceDate: string
  chefNotes: string
  emailType: "customer_acceptance"
}

function ChefEventAcceptedEmailComponent({ 
  customer, 
  booking, 
  event, 
  product, 
  chef, 
  requestReference, 
  acceptanceDate,
  chefNotes 
}: ChefEventAcceptedEmailProps) {
  
  return (
    <Tailwind>
      <Html className="font-sans bg-gray-100">
        <Head />
        <Preview>Great news! Your chef event has been accepted</Preview>
        <Body className="bg-white my-10 mx-auto w-full max-w-2xl">
          {/* Header */}
          <Section className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4">
            <Container>
              <Row>
                <Column>
                  <Heading className="text-2xl font-bold m-0">
                    🎉 Event Accepted!
                  </Heading>
                  <Text className="text-green-100 m-0">
                    Your chef event request has been confirmed
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* Main Content */}
          <Container className="p-6">
            <Heading className="text-2xl font-bold text-gray-800 mb-4">
              Congratulations, {customer.first_name}!
            </Heading>
            <Text className="text-gray-600 mb-6">
              We're excited to confirm your chef event! Your request has been accepted and we're looking forward to creating an amazing culinary experience for you.
            </Text>

            {/* Chef Message */}
            <Section className="bg-green-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Message from Chef Elena
              </Heading>
              <Text className="text-gray-600 italic">
                "{chefNotes}"
              </Text>
            </Section>

            {/* Event Details */}
            <Section className="bg-gray-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Confirmed Event Details
              </Heading>
              
              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Date & Time</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.date} at {booking.time}</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Event Type</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.event_type}</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Party Size</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.party_size} guests</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Location</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">
                    {booking.location_type} - {booking.location_address}
                  </Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Price per Person</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">${event.price_per_person}</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Total Price</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600 font-bold text-lg">${event.total_price}</Text>
                </Column>
              </Row>
            </Section>

            {/* Payment Section */}
            <Section className="bg-blue-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Complete Your Booking
              </Heading>
              <Text className="text-gray-600 mb-4">
                To secure your event, please complete your payment using the link below. 
                Your booking will be confirmed once payment is received.
              </Text>
              
              <Row className="text-center">
                <Column>
                  <Button 
                    href={product.purchase_url}
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
                  >
                    Pay Now - ${event.total_price}
                  </Button>
                </Column>
              </Row>
              
              <Text className="text-center text-gray-500 text-sm mt-4">
                Secure payment powered by Stripe
              </Text>
            </Section>

            {/* Reference Number */}
            <Section className="text-center mb-6">
              <Text className="text-sm text-gray-500">
                Reference: <strong>{requestReference}</strong>
              </Text>
              <Text className="text-sm text-gray-500">
                Accepted on: {acceptanceDate}
              </Text>
            </Section>

            {/* Important Information */}
            <Section className="bg-yellow-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Important Information
              </Heading>
              <Text className="text-gray-600 mb-3">
                • Payment is required within 48 hours to secure your booking
              </Text>
              <Text className="text-gray-600 mb-3">
                • Cancellations must be made at least 72 hours before the event
              </Text>
              <Text className="text-gray-600 mb-3">
                • Chef Elena will contact you 24 hours before the event
              </Text>
              <Text className="text-gray-600">
                • Please ensure your kitchen is clean and ready for the chef
              </Text>
            </Section>
          </Container>

          {/* Footer */}
          <Section className="bg-gray-50 p-6">
            <Container>
              <Row>
                <Column>
                  <Text className="text-center text-gray-500 text-sm mb-4">
                    Questions? Contact Chef Elena at {chef.email} or {chef.phone}
                  </Text>
                  <Text className="text-center text-gray-400 text-xs">
                    © {new Date().getFullYear()} Chef Elena Rodriguez. All rights reserved.
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  )
}

export const chefEventAcceptedEmail = (props: ChefEventAcceptedEmailProps) => (
  <ChefEventAcceptedEmailComponent {...props} />
)
```

## 3. Chef Event Rejected Template

### File: `src/modules/resend/emails/chef-event-rejected.tsx`

```typescript
import { 
  Text, 
  Column, 
  Container, 
  Heading, 
  Html, 
  Row, 
  Section, 
  Tailwind, 
  Head, 
  Preview, 
  Body, 
  Link, 
  Button,
} from "@react-email/components"

type ChefEventRejectedEmailProps = {
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  booking: {
    date: string
    time: string
    event_type: string
    location_type: string
    location_address: string
    party_size: number
    notes: string
  }
  rejection: {
    reason: string
    chefNotes: string
  }
  chef: {
    name: string
    email: string
    phone: string
  }
  requestReference: string
  rejectionDate: string
  emailType: "customer_rejection"
}

function ChefEventRejectedEmailComponent({ 
  customer, 
  booking, 
  rejection, 
  chef, 
  requestReference, 
  rejectionDate 
}: ChefEventRejectedEmailProps) {
  
  return (
    <Tailwind>
      <Html className="font-sans bg-gray-100">
        <Head />
        <Preview>Update regarding your chef event request</Preview>
        <Body className="bg-white my-10 mx-auto w-full max-w-2xl">
          {/* Header */}
          <Section className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-4">
            <Container>
              <Row>
                <Column>
                  <Heading className="text-2xl font-bold m-0">
                    Event Request Update
                  </Heading>
                  <Text className="text-gray-100 m-0">
                    Important information about your booking
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* Main Content */}
          <Container className="p-6">
            <Heading className="text-2xl font-bold text-gray-800 mb-4">
              Hi {customer.first_name},
            </Heading>
            <Text className="text-gray-600 mb-6">
              Thank you for your interest in our chef services. After careful consideration, 
              we regret to inform you that we are unable to accommodate your event request at this time.
            </Text>

            {/* Rejection Details */}
            <Section className="bg-red-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Request Details
              </Heading>
              
              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Date & Time</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.date} at {booking.time}</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Event Type</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.event_type}</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Party Size</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">{booking.party_size} guests</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-1/3">
                  <Text className="font-semibold text-gray-700">Location</Text>
                </Column>
                <Column className="w-2/3">
                  <Text className="text-gray-600">
                    {booking.location_type} - {booking.location_address}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Rejection Reason */}
            <Section className="bg-yellow-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Reason for Decline
              </Heading>
              <Text className="text-gray-600 mb-4">
                {rejection.reason}
              </Text>
              
              {rejection.chefNotes && (
                <>
                  <Text className="font-semibold text-gray-700 mb-2">
                    Additional Notes from Chef Elena:
                  </Text>
                  <Text className="text-gray-600 italic">
                    "{rejection.chefNotes}"
                  </Text>
                </>
              )}
            </Section>

            {/* Alternative Options */}
            <Section className="bg-blue-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Alternative Options
              </Heading>
              <Text className="text-gray-600 mb-4">
                We'd love to work with you in the future. Here are some alternatives:
              </Text>
              
              <Row className="mb-3">
                <Text className="text-gray-600">
                  • Consider a different date or time
                </Text>
              </Row>
              
              <Row className="mb-3">
                <Text className="text-gray-600">
                  • Explore our other event types
                </Text>
              </Row>
              
              <Row className="mb-3">
                <Text className="text-gray-600">
                  • Check our availability for smaller groups
                </Text>
              </Row>
              
              <Row>
                <Text className="text-gray-600">
                  • Contact us for custom arrangements
                </Text>
              </Row>
            </Section>

            {/* Reference Number */}
            <Section className="text-center mb-6">
              <Text className="text-sm text-gray-500">
                Reference: <strong>{requestReference}</strong>
              </Text>
              <Text className="text-sm text-gray-500">
                Updated on: {rejectionDate}
              </Text>
            </Section>

            {/* Contact Information */}
            <Section className="bg-gray-50 rounded-lg p-6 mb-6">
              <Heading className="text-lg font-semibold text-gray-800 mb-4">
                Get in Touch
              </Heading>
              <Text className="text-gray-600 mb-4">
                We're here to help you plan the perfect event. Feel free to reach out with any questions or to discuss alternative arrangements.
              </Text>
              
              <Row className="mb-3">
                <Text className="text-gray-600">
                  <strong>Email:</strong> {chef.email}
                </Text>
              </Row>
              
              <Row className="mb-3">
                <Text className="text-gray-600">
                  <strong>Phone:</strong> {chef.phone}
                </Text>
              </Row>
              
              <Row>
                <Text className="text-gray-600">
                  <strong>Website:</strong> www.chefelenar.com
                </Text>
              </Row>
            </Section>
          </Container>

          {/* Footer */}
          <Section className="bg-gray-50 p-6">
            <Container>
              <Row>
                <Column>
                  <Text className="text-center text-gray-500 text-sm mb-4">
                    Thank you for considering Chef Elena Rodriguez for your event
                  </Text>
                  <Text className="text-center text-gray-400 text-xs">
                    © {new Date().getFullYear()} Chef Elena Rodriguez. All rights reserved.
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  )
}

export const chefEventRejectedEmail = (props: ChefEventRejectedEmailProps) => (
  <ChefEventRejectedEmailComponent {...props} />
)
```

## Template Usage

### In Subscribers

Update your subscribers to use the new template names:

```typescript
// In chef-event-requested.ts
await notificationService.createNotifications({
  to: chefEvent.email,
  channel: "email",
  template: "chef-event-requested",
  data: {
    customer: { /* customer data */ },
    booking: { /* booking data */ },
    event: { /* event data */ },
    requestReference: chefEvent.id.slice(0, 8).toUpperCase(),
    chefContact: { /* chef contact info */ },
    emailType: "customer_confirmation"
  }
} as CreateNotificationDTO)

// In chef-event-accepted.ts
await notificationService.createNotifications({
  to: chefEvent.email,
  channel: "email",
  template: "chef-event-accepted",
  data: {
    customer: { /* customer data */ },
    booking: { /* booking data */ },
    event: { /* event data */ },
    product: { /* product data */ },
    chef: { /* chef data */ },
    requestReference: chefEvent.id.slice(0, 8).toUpperCase(),
    acceptanceDate: DateTime.now().toFormat('LLL d, yyyy'),
    chefNotes: chefEvent.chefNotes || "Looking forward to creating an amazing experience for you!",
    emailType: "customer_acceptance"
  }
} as CreateNotificationDTO)

// In chef-event-rejected.ts
await notificationService.createNotifications({
  to: chefEvent.email,
  channel: "email",
  template: "chef-event-rejected",
  data: {
    customer: { /* customer data */ },
    booking: { /* booking data */ },
    rejection: { /* rejection data */ },
    chef: { /* chef data */ },
    requestReference: chefEvent.id.slice(0, 8).toUpperCase(),
    rejectionDate: DateTime.now().toFormat('LLL d, yyyy'),
    emailType: "customer_rejection"
  }
} as CreateNotificationDTO)
```

## Testing Templates

### Development Testing

1. Install React Email CLI:
```bash
npm install -D react-email
```

2. Add test data to each template file:
```typescript
// Add at the end of each template file
const mockData = {
  customer: {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "(555) 123-4567"
  },
  // ... other mock data
}

export default () => <ChefEventRequestedEmailComponent {...mockData} />
```

3. Test templates locally:
```bash
npm run dev:email
```

### Production Testing

1. Send test emails through your application
2. Verify email delivery in Resend dashboard
3. Check email rendering across different email clients
4. Test with real customer data

## Customization

### Branding

Update colors, fonts, and styling to match your brand:

```typescript
// Update gradient colors
className="bg-gradient-to-r from-your-primary to-your-secondary"

// Update logo and branding
<Heading className="text-2xl font-bold m-0">
  Your Brand Name
</Heading>
```

### Content

Customize email content for your specific needs:

- Update chef contact information
- Modify pricing structure
- Add custom terms and conditions
- Include additional branding elements

### Styling

Use Tailwind classes to customize the appearance:

```typescript
// Custom button styling
className="bg-your-brand-color text-white px-6 py-3 rounded-lg"

// Custom section backgrounds
className="bg-your-accent-color rounded-lg p-6"
```

These templates provide a complete email notification system for your chef event management system using Resend and React Email components. 