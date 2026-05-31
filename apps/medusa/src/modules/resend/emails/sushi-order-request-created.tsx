import { Text, Column, Row, Section } from "@react-email/components"
import { TransactionalEmailLayout } from "./transactional-email-layout"
import { layoutStyles } from "./transactional-email-layout-styles"

export type SushiOrderRequestCreatedEmailProps = {
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  order: {
    scheduled_at: string
    delivery_address: string
    subtotal: string
    status: string
  }
  chef: {
    name: string
    email: string
    phone: string
  }
  requestReference: string
  emailType: "customer_confirmation" | "chef_notification"
  adminReviewUrl?: string
}

function row(label: string, value: string) {
  return (
    <Row style={{ marginBottom: "0.5rem" }}>
      <Column style={{ width: "38%" }}>
        <Text style={layoutStyles.lineItemDescription}>{label}</Text>
      </Column>
      <Column style={{ width: "62%" }}>
        <Text style={layoutStyles.lineItemSubtext}>{value}</Text>
      </Column>
    </Row>
  )
}

function SushiOrderRequestCreatedEmailComponent({
  customer,
  order,
  chef,
  requestReference,
  emailType,
  adminReviewUrl,
}: SushiOrderRequestCreatedEmailProps) {
  const isCustomer = emailType === "customer_confirmation"

  const billToContent = (
    <>
      <Text style={layoutStyles.billToLabel}>BILL TO</Text>
      <Text style={layoutStyles.billToText}>
        {customer.first_name} {customer.last_name}
      </Text>
      <Text style={{ ...layoutStyles.metaText, margin: "0.25rem 0 0 0" }}>
        {customer.email}
      </Text>
      <Text style={{ ...layoutStyles.metaText, margin: "0.25rem 0 0 0" }}>
        {customer.phone}
      </Text>
    </>
  )

  const metaContent = (
    <>
      <Text style={layoutStyles.metaText}>Reference #{requestReference}</Text>
      <Text style={{ ...layoutStyles.metaText, margin: 0 }}>
        Status: {order.status}
      </Text>
    </>
  )

  const bodyContent = (
    <>
      <Section style={layoutStyles.lineItemsSection}>
        <Text style={layoutStyles.lineItemDescription}>
          {isCustomer
            ? "We received your sushi delivery request. Our chef will review it and email you a payment link once confirmed."
            : "A new sushi delivery request needs your review."}
        </Text>
      </Section>

      <Section style={layoutStyles.lineItemsSection}>
        <Text
          style={{
            ...layoutStyles.lineItemDescription,
            fontWeight: 700,
            marginBottom: "0.75rem",
          }}
        >
          Order details
        </Text>
        {row("Scheduled", order.scheduled_at)}
        {row("Deliver to", order.delivery_address)}
        {row("Food subtotal", order.subtotal)}
      </Section>

      {!isCustomer && adminReviewUrl ? (
        <Section style={layoutStyles.lineItemsSection}>
          <Text style={layoutStyles.lineItemSubtext}>
            Review in admin: {adminReviewUrl}
          </Text>
        </Section>
      ) : null}
    </>
  )

  return (
    <TransactionalEmailLayout
      preview={
        isCustomer
          ? "Your sushi delivery request was received"
          : "New sushi delivery request"
      }
      brandName={chef.name}
      headerLabel={isCustomer ? "REQUEST RECEIVED" : "NEW DELIVERY REQUEST"}
      billToContent={billToContent}
      metaContent={metaContent}
      thankYouText={
        isCustomer
          ? "Thank you for your order."
          : "Please confirm delivery fee and send payment when ready."
      }
      brandContact={chef}
    >
      {bodyContent}
    </TransactionalEmailLayout>
  )
}

SushiOrderRequestCreatedEmailComponent.PreviewProps = {
  customer: {
    first_name: "Alex",
    last_name: "Rivera",
    email: "alex@example.com",
    phone: "+1 555-0100",
  },
  order: {
    scheduled_at: "Friday, May 31, 2026 at 6:00 PM",
    delivery_address: "123 Main St, Austin, TX",
    subtotal: "$48.00",
    status: "PENDING REVIEW",
  },
  chef: {
    name: "Chef John Doe",
    email: "chef@example.com",
    phone: "+1 555-0199",
  },
  requestReference: "A1B2C3D4",
  emailType: "customer_confirmation",
} satisfies SushiOrderRequestCreatedEmailProps

export default SushiOrderRequestCreatedEmailComponent

export const sushiOrderRequestCreatedEmail = (
  props: SushiOrderRequestCreatedEmailProps,
) => <SushiOrderRequestCreatedEmailComponent {...props} />
