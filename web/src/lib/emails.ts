async function request(path: string, init?: RequestInit) {
  const response = await fetch(`/-/api/emails${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.message ?? `Email request failed (${response.status})`
    )
  }
  if (response.status === 204) return
  return response.json()
}

export interface EmailInfo {
  email: string
  /**
   * How the address was verified: by the connected GitHub account, which
   * keeps it in step, or by a link in a mail. Unverified ones count nowhere.
   */
  verified: "github" | "mail" | null
}

export interface EmailList {
  /** The server sends mail, so addresses added here can be verified. */
  mail: boolean
  emails: EmailInfo[]
}

export function listEmails(): Promise<EmailList> {
  return request("")
}

/** Adds an address and mails it a link that verifies it. */
export function addEmail(
  email: string
): Promise<{ email: string; sent: boolean }> {
  return request("", { method: "POST", body: JSON.stringify({ email }) })
}

export function sendVerification(email: string) {
  return request(`/${encodeURIComponent(email)}/send`, { method: "POST" })
}

export function verifyEmail(token: string): Promise<{ email: string }> {
  return request("/verify", { method: "POST", body: JSON.stringify({ token }) })
}

export function removeEmail(email: string) {
  return request(`/${encodeURIComponent(email)}`, { method: "DELETE" })
}
