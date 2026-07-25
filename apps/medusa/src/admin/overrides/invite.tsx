import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Button, Heading, Hint, Input, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { decodeToken } from "react-jwt"
import { Link, useSearchParams } from "react-router-dom"
import * as z from "zod"

import loginBrandMarkUrl from "../../assets/chefhat.jpg"
import { Form } from "~dashboard/components/common/form"

const DOC_TITLE = "Sushidoa Admin"

const CreateAccountSchema = z
  .object({
    email: z.string().email(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    password: z.string().min(1, "Password is required"),
    repeat_password: z.string().min(1, "Repeat password is required"),
  })
  .superRefine(({ password, repeat_password }, ctx) => {
    if (password !== repeat_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["repeat_password"],
      })
    }
  })

type CreateAccountValues = z.infer<typeof CreateAccountSchema>

type DecodedInvite = {
  id: string
  jti: string
  exp: number
  iat: number
  email?: string
}

class InviteRequestError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "InviteRequestError"
    this.status = status
  }
}

function isExistingIdentityError(error: unknown) {
  return (
    error instanceof InviteRequestError &&
    error.status === 401 &&
    error.message.toLowerCase().includes("identity with email already exists")
  )
}

async function parseInviteResponse(response: Response) {
  const result = (await response.json().catch(() => null)) as {
    token?: string
    message?: string
  } | null

  if (!response.ok) {
    throw new InviteRequestError(
      response.status,
      result?.message ?? "Server error - Try again later.",
    )
  }

  return result
}

async function registerEmailPassForInvite(email: string, password: string) {
  const response = await fetch("/auth/user/emailpass/register", {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  const result = await parseInviteResponse(response)

  if (!result?.token) {
    throw new Error("Unable to create an auth session for this invite.")
  }

  return result.token
}

async function signInEmailPassForInvite(email: string, password: string) {
  const response = await fetch("/auth/user/emailpass", {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  const result = await parseInviteResponse(response)

  if (!result?.token) {
    throw new InviteRequestError(response.status, "Unauthorized")
  }

  return result.token
}

async function acceptInviteForInvite(
  inviteToken: string,
  authToken: string,
  user: Pick<CreateAccountValues, "email" | "first_name" | "last_name">,
) {
  const response = await fetch(
    `/admin/invites/accept?token=${encodeURIComponent(inviteToken)}`,
    {
      method: "POST",
      credentials: "omit",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    },
  )

  await parseInviteResponse(response)
}

export const Invite = () => {
  const [searchParams] = useSearchParams()
  const [success, setSuccess] = useState(false)

  const token = searchParams.get("token")
  const invite = token ? decodeToken<DecodedInvite>(token) : null
  const isValidInvite = invite && validateDecodedInvite(invite)

  useEffect(() => {
    const previousTitle = document.title
    document.title = DOC_TITLE
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center p-4">
      <div className="flex w-full max-w-[280px] flex-col items-center">
        <img
          src={loginBrandMarkUrl}
          alt="Sushidoa"
          className="shadow-elevation-card-rest mb-4 h-[50px] w-[50px] shrink-0 rounded-xl object-cover"
        />
        {isValidInvite ? (
          success ? (
            <SuccessView />
          ) : (
            <CreateView
              invite={invite}
              token={token!}
              onSuccess={() => setSuccess(true)}
            />
          )
        ) : (
          <InvalidView />
        )}
      </div>
    </div>
  )
}

const LoginLink = () => (
  <div className="flex w-full flex-col items-center">
    <div className="my-6 h-px w-full border-b border-dotted" />
    <Link
      key="login-link"
      to="/login"
      className="txt-small text-ui-fg-base transition-fg hover:text-ui-fg-base-hover focus-visible:text-ui-fg-base-hover font-medium outline-none"
    >
      Back to login
    </Link>
  </div>
)

const InvalidView = () => (
  <div className="flex w-full flex-col items-center">
    <div className="mb-4 flex flex-col items-center">
      <Heading>Invalid invite</Heading>
      <Text size="small" className="text-ui-fg-subtle text-center">
        This invite is invalid or has expired.
      </Text>
    </div>
    <LoginLink />
  </div>
)

const CreateView = ({
  invite,
  token,
  onSuccess,
}: {
  invite: DecodedInvite
  token: string
  onSuccess: () => void
}) => {
  const form = useForm<CreateAccountValues>({
    resolver: zodResolver(CreateAccountSchema),
    defaultValues: {
      email: invite.email || "",
      first_name: "",
      last_name: "",
      password: "",
      repeat_password: "",
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true)

    try {
      let authToken: string | undefined

      try {
        authToken = await registerEmailPassForInvite(data.email, data.password)
      } catch (error) {
        if (!isExistingIdentityError(error)) {
          throw error
        }

        authToken = await signInEmailPassForInvite(data.email, data.password)
      }

      if (!authToken) {
        throw new Error("Unable to create an auth session for this invite.")
      }

      await acceptInviteForInvite(token, authToken, {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      })

      toast.success("Invite accepted")
      onSuccess()
    } catch (error) {
      if (
        error instanceof InviteRequestError &&
        error.status === 400 &&
        error.message.toLowerCase().includes("already authenticated")
      ) {
        form.setError("root", {
          type: "manual",
          message: "This account already exists. Sign in from the login page.",
        })
        return
      }

      if (error instanceof InviteRequestError && error.status === 400) {
        form.setError("root", {
          type: "manual",
          message: "This invite is invalid or has expired.",
        })
        return
      }

      const message =
        error instanceof Error ? error.message : "Server error - Try again later."

      form.setError("root", {
        type: "manual",
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  })

  const serverError = form.formState.errors.root?.message
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message ||
    form.formState.errors.repeat_password?.message ||
    form.formState.errors.first_name?.message ||
    form.formState.errors.last_name?.message

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-4 flex flex-col items-center">
        <Heading>Sushidoa Admin</Heading>
        <Text size="small" className="text-ui-fg-subtle text-center">
          Create your account to manage events.
        </Text>
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <Input
                      autoComplete="email"
                      {...field}
                      className="bg-ui-bg-field-component"
                      placeholder="Email"
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <Input
                      autoComplete="given-name"
                      {...field}
                      className="bg-ui-bg-field-component"
                      placeholder="First Name"
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <Input
                      autoComplete="family-name"
                      {...field}
                      className="bg-ui-bg-field-component"
                      placeholder="Last Name"
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="password"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <Input
                      autoComplete="new-password"
                      type="password"
                      {...field}
                      className="bg-ui-bg-field-component"
                      placeholder="Password"
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="repeat_password"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <Input
                      autoComplete="off"
                      type="password"
                      {...field}
                      className="bg-ui-bg-field-component"
                      placeholder="Repeat Password"
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            {validationError && (
              <div className="mt-6 text-center">
                <Hint className="inline-flex" variant="error">
                  {validationError}
                </Hint>
              </div>
            )}
            {serverError && (
              <Alert
                className="bg-ui-bg-base items-center p-2"
                dismissible
                variant="error"
              >
                {serverError}
              </Alert>
            )}
          </div>
          <Button
            className="w-full"
            type="submit"
            isLoading={isSubmitting}
          >
            Create account
          </Button>
        </form>
      </Form>
      <LoginLink />
    </div>
  )
}

const SuccessView = () => (
  <div className="flex w-full flex-col items-center gap-y-6">
    <div className="flex flex-col items-center gap-y-1">
      <Heading className="text-center">Your account is ready</Heading>
      <Text size="small" className="text-ui-fg-subtle text-center">
        Sign in to continue to Sushidoa Admin.
      </Text>
    </div>
    <Button variant="secondary" asChild className="w-full">
      <Link to="/login" replace>
        Back to login
      </Link>
    </Button>
  </div>
)

const InviteSchema = z.object({
  id: z.string(),
  jti: z.string(),
  exp: z.number(),
  iat: z.number(),
})

const validateDecodedInvite = (decoded: unknown): decoded is DecodedInvite => {
  return InviteSchema.safeParse(decoded).success
}

export { Invite as Component }
export default Invite
