import { Text, Column, Row, Section } from "@react-email/components"
import { TransactionalEmailLayout } from "./transactional-email-layout"
import { layoutStyles } from "./transactional-email-layout-styles"

export type SushiOrderRequestRejectedEmailProps = {
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  order: {
    scheduled_at: string
    delivery_address: string
    status: string
  }
  rejection: {
    reason: string
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

function SushiOrderRequestRejectedEmailComponent({
  customer,
  order,
  rejection,
  chef,
  requestReference,
  rejectionDate,
}: SushiOrderRequestRejectedEmailProps) {
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
      <Text style={layoutStyles.metaText}>Updated: {rejectionDate}</Text>
      <Text style={{ ...layoutStyles.metaText, margin: 0 }}>
        Status: {order.status}
      </Text>
    </>
  )

  const bodyContent = (
    <>
      <Section style={layoutStyles.lineItemsSection}>
        <Text style={layoutStyles.lineItemDescription}>
          Thank you for your interest. We are unable to fulfill this sushi
          delivery request at this time.
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
          Request details
        </Text>
        {row("Scheduled", order.scheduled_at)}
        {row("Deliver to", order.delivery_address)}
      </Section>

      <Section style={layoutStyles.lineItemsSection}>
        <Text
          style={{
            ...layoutStyles.lineItemDescription,
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          Message from the chef
        </Text>
        <Text style={layoutStyles.lineItemSubtext}>{rejection.reason}</Text>
      </Section>
    </>
  )

  return (
    <TransactionalEmailLayout
      preview="Update on your sushi delivery request"
      brandName={chef.name}
      headerLabel="REQUEST UPDATE"
      billToContent={billToContent}
      metaContent={metaContent}
      thankYouText="We hope to serve you again soon."
      brandContact={chef}
    >
      {bodyContent}
    </TransactionalEmailLayout>
  )
}

SushiOrderRequestRejectedEmailComponent.PreviewProps = {
  customer: {
    first_name: "Alex",
    last_name: "Rivera",
    email: "alex@example.com",
    phone: "+1 555-0100",
  },
  order: {
    scheduled_at: "Friday, May 31, 2026 at 6:00 PM",
    delivery_address: "123 Main St, Austin, TX",
    status: "NOT AVAILABLE",
  },
  rejection: {
    reason: "We are fully booked for this time slot.",
  },
  chef: {
    name: "Chef John Doe",
    email: "chef@example.com",
    phone: "+1 555-0199",
  },
  requestReference: "A1B2C3D4",
  rejectionDate: "May 31, 2026",
  emailType: "customer_rejection",
} satisfies SushiOrderRequestRejectedEmailProps

export default SushiOrderRequestRejectedEmailComponent

export const sushiOrderRequestRejectedEmail = (
  props: SushiOrderRequestRejectedEmailProps,
) => <SushiOrderRequestRejectedEmailComponent {...props} />
