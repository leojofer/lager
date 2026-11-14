# 31. Sign-in with GitHub

Status: accepted; implemented in `crates/server/src/web/github.rs`,
`crates/core/src/identity/passkeys.rs`, `crates/core/src/github.rs`, and
`web/src/routes/[-].sign-up_.github.tsx`. Date: November 13, 2026.

## Context

Most users have a GitHub account, and many connect it for mirrors anyway
(decision 20). Signing in with it needs no password and no passkey, and
signing up with it is one click and a name. The OAuth app of `[github]`
already exists, but asks for `repo`: full access to every private
repository, far too much to ask only to sign in.

## Decision

**Identity apart from the mirror token.** PostgreSQL schema version 10 adds
`lager_github_logins`: a GitHub user ID and the lager user it signs in,
each unique, and GitHub's login for display. It is apart from
`lager_github_accounts`, whose token mirrors need. Sign-in matches the
numeric ID only, never the login, which GitHub lets users change and
others reuse, and never an email address. The migration links every
connected account, the latest one where two users connected the same.
Connecting for mirrors links the account too, unless the user or the
GitHub account is linked already.

**Flow.** `GET /-/api/github/sign-in?next=…` sends the browser to GitHub
with no scope, so the grant reads only public information, and a random
state in a ten-minute cookie (`lager_github_sign_in`, path `/-/api/github`,
`SameSite=Lax`) with where to go afterwards; `next` follows the rules of
the sign-in page. The callback URL is the one of decision 20: the callback
tells the flows apart by which cookie holds the state. It exchanges the
code, reads `/user`, and revokes the token, as GitHub keeps only ten
tokens per user, app, and scope; a token that a connected account holds is
never revoked. Then:

- Without a session, a linked GitHub account signs its user in, as a
  password does, and the browser goes to `next` or `/`.
- With a session, the GitHub account is linked to the signed-in user, and
  the browser goes to `next` or the settings. An account linked to another
  user is refused, as is a user linked to another account.
- Without a session and a link, with `LAGER_SIGN_UP`, the browser goes to
  `/-/sign-up/github` with the GitHub ID and login sealed with the session
  secret in a ten-minute cookie (`lager_github_sign_up`). The page shows the
  login and offers it as the name; `POST /-/api/github/sign-up` takes the
  name, checks it as other sign-ups do (user name rules, any case, catalog
  records under it), and creates the account and its link in one
  transaction under the sign-up lock. Without `LAGER_SIGN_UP`, the sign-in
  page shows an error.

**No password.** A GitHub sign-up has the hash `!no-password$` and random
bytes, as passkey sign-up (decision 23). An account without a password
keeps its last way to sign in: unlinking GitHub (`github_unlink`) and
removing the last passkey are refused while the other is missing. Both
lock the user's row first.

`GET /-/api/signup` answers `github` when `[github]` is set, so the pages
offer the buttons.

## Consequences

- Anyone with a GitHub account can create an account where sign-up is on;
  the limits of decision 25 apply.
- A user can be signed in by one GitHub account and mirror with another;
  **Settings → GitHub** shows both.
- Disconnecting GitHub for mirrors keeps sign-in, and unlinking keeps
  mirrors.
- A GitHub account deleted or taken away leaves an account without a
  password that only its passkeys or an administrator can open.
- Servers before this decision ignore the links; upgrade every server
  before offering the button.
