import { Text, Column, Row, Section, Button } from "@react-email/components"
import { TransactionalEmailLayout } from "./transactional-email-layout"
import { layoutStyles } from "./transactional-email-layout-styles"

export type SushiOrderRequestConfirmedEmailProps = {
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  order: {
    scheduled_at: string
    delivery_address: string
    food_subtotal: string
    delivery_fee: string
    total: string
    status: string
  }
  payment: {
    checkout_url: string
  }
  chef: {
    name: string
    email: string
    phone: string
  }
  requestReference: string
  acceptanceDate: string
  emailType: "customer_acceptance"
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

function SushiOrderRequestConfirmedEmailComponent({
  customer,
  order,
  payment,
  chef,
  requestReference,
  acceptanceDate,
}: SushiOrderRequestConfirmedEmailProps) {
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
      <Text style={layoutStyles.metaText}>Confirmed: {acceptanceDate}</Text>
      <Text style={{ ...layoutStyles.metaText, margin: 0 }}>
        Status: {order.status}
      </Text>
    </>
  )

  const bodyContent = (
    <>
      <Section style={layoutStyles.lineItemsSection}>
        <Text style={layoutStyles.lineItemDescription}>
          Your sushi delivery order is confirmed. Complete payment using the
          button below.
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
        {row("Food subtotal", order.food_subtotal)}
        {row("Delivery fee", order.delivery_fee)}
        {row("Total due", order.total)}
      </Section>

      <Section style={{ ...layoutStyles.lineItemsSection, textAlign: "center" as const }}>
        <Button
          href={payment.checkout_url}
          style={{
            backgroundColor: "#16a34a",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "6px",
            fontWeight: 600,
          }}
        >
          Pay now
        </Button>
      </Section>
    </>
  )

  return (
    <TransactionalEmailLayout
      preview="Your sushi delivery order is confirmed"
      brandName={chef.name}
      headerLabel="ORDER CONFIRMED"
      billToContent={billToContent}
      metaContent={metaContent}
      thankYouText="We look forward to preparing your order."
      brandContact={chef}
    >
      {bodyContent}
    </TransactionalEmailLayout>
  )
}

SushiOrderRequestConfirmedEmailComponent.PreviewProps = {
  customer: {
    first_name: "Alex",
    last_name: "Rivera",
    email: "alex@example.com",
    phone: "+1 555-0100",
  },
  order: {
    scheduled_at: "Friday, May 31, 2026 at 6:00 PM",
    delivery_address: "123 Main St, Austin, TX",
    food_subtotal: "$48.00",
    delivery_fee: "$12.00",
    total: "$60.00",
    status: "CONFIRMED",
  },
  payment: {
    checkout_url: "https://example.com/sushi/checkout?order_request_id=req_1",
  },
  chef: {
    name: "Chef John Doe",
    email: "chef@example.com",
    phone: "+1 555-0199",
  },
  requestReference: "A1B2C3D4",
  acceptanceDate: "May 31, 2026",
  emailType: "customer_acceptance",
} satisfies SushiOrderRequestConfirmedEmailProps

export default SushiOrderRequestConfirmedEmailComponent

export const sushiOrderRequestConfirmedEmail = (
  props: SushiOrderRequestConfirmedEmailProps,
) => <SushiOrderRequestConfirmedEmailComponent {...props} />
