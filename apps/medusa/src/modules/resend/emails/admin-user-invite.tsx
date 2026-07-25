import { Button, Section, Text } from "@react-email/components"
import { TransactionalEmailLayout } from "./transactional-email-layout"
import { layoutColors, layoutStyles } from "./transactional-email-layout-styles"

export type AdminUserInviteEmailProps = {
  email: string
  inviteUrl: string
  expiresAt?: string
  chef: {
    name: string
    email: string
    phone: string
  }
}

function AdminUserInviteEmailComponent({
  email,
  inviteUrl,
  expiresAt,
  chef,
}: AdminUserInviteEmailProps) {
  const billToContent = (
    <>
      <Text style={layoutStyles.billToLabel}>INVITED USER</Text>
      <Text style={layoutStyles.billToText}>{email}</Text>
    </>
  )

  const metaContent = (
    <>
      <Text style={layoutStyles.metaText}>Status: PENDING</Text>
      {expiresAt ? (
        <Text style={{ ...layoutStyles.metaText, margin: 0 }}>
          Expires: {expiresAt}
        </Text>
      ) : null}
    </>
  )

  return (
    <TransactionalEmailLayout
      preview="You've been invited to join Sushidoa Admin"
      brandName={chef.name}
      headerLabel="ADMIN INVITE"
      billToContent={billToContent}
      metaContent={metaContent}
      thankYouText="Welcome to the team."
      brandContact={chef}
    >
      <Section style={layoutStyles.lineItemsSection}>
        <Text style={layoutStyles.lineItemDescription}>
          You have been invited to manage Sushidoa. Accept the invite to create
          your admin account.
        </Text>
      </Section>

      <Section style={{ ...layoutStyles.lineItemsSection, textAlign: "center" as const }}>
        <Button
          href={inviteUrl}
          style={{
            backgroundColor: layoutColors.accentGreen,
            borderRadius: "6px",
            color: layoutColors.white,
            display: "inline-block",
            fontSize: "0.9375rem",
            fontWeight: 700,
            padding: "0.75rem 1rem",
            textDecoration: "none",
          }}
        >
          Accept invite
        </Button>
      </Section>

      <Section style={layoutStyles.lineItemsSection}>
        <Text style={layoutStyles.lineItemSubtext}>
          If the button does not work, paste this link into your browser:
        </Text>
        <Text style={layoutStyles.lineItemSubtext}>{inviteUrl}</Text>
      </Section>
    </TransactionalEmailLayout>
  )
}

AdminUserInviteEmailComponent.PreviewProps = {
  email: "teammate@example.com",
  inviteUrl: "https://api.sushidoa.com/invite?token=invite-token",
  expiresAt: "Aug 1, 2026",
  chef: {
    name: "Sushidoa",
    email: "support@example.com",
    phone: "",
  },
} satisfies AdminUserInviteEmailProps

export default AdminUserInviteEmailComponent

export const adminUserInviteEmail = (props: AdminUserInviteEmailProps) => (
  <AdminUserInviteEmailComponent {...props} />
)
