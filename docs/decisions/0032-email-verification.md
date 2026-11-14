# 32. Email verification

Status: accepted; implemented in `crates/server/src/mail.rs`,
`crates/server/src/web/emails.rs`, and `PgUsers::email_token`,
`verify_email`, and `owners` in `crates/core/src/identity/postgres.rs`.
Date: November 13, 2026.

## Context

A user could add any email address by hand, and nothing checked it
(decision 29): the server sent no mail. That was harmless while an address
only added commits to the claimer's own count. Since commit authors link to
profiles, an unchecked address lets a user put their name on someone
else's commits. Only addresses from GitHub were verified.

## Decision

**Mail.** `LAGER_SMTP_URL` turns on mail (`smtps://user:password@host`, or
`smtp://` with `?tls=required` for STARTTLS), with `LAGER_MAIL_FROM` as the
sender. It needs `LAGER_DOMAIN`: the links in mails lead there. The server
sends over SMTP with `lettre`, so any provider works. Without the variable
nobody can add an address by hand; GitHub's still arrive.

**Only verified addresses count.** An address is verified by `github` or
by `mail`, or not at all. An unverified one counts nowhere: not on the
profile, and commits do not link to its user.

**The link.** Adding an address mails it a link,
`/-/settings/emails?verify=<token>`. The token is 32 random bytes; the
database holds its SHA-256, and it works for 24 hours, once. A new mail
replaces the earlier link. The link verifies the address only for the
signed-in user who added it, and the page sends it as a POST from the
site. So someone who adds a stranger's address gains nothing when the
stranger opens the mail: the stranger is not signed in as them. The mail
names the user who asked.

**Limits**, fixed in `limits.rs`: one mail a minute and five a day to one
address, whoever asks; twenty mails a day for one user; five unverified
addresses per user. They keep the form from flooding a mailbox. Mails sent
are counted in `lager_email_mails` and forgotten after a day.

**One user per verified address**, kept by a unique index. A mailbox can
change hands: when another user verifies the same address by mail, the
earlier user's copy becomes unverified. GitHub's sync never takes an
address that another user verified; that user keeps it. Among users whose
GitHub accounts brought the same address before this decision, the first
keeps it.

Schema version 11.

## Consequences

- Addresses added by hand before this decision are unverified and stop
  counting until their user verifies them; **Resend** sends the link.
- A server without mail has only GitHub's addresses.
- The mail is plain text in English.
- A user who verified an address by mail keeps it even if another user's
  GitHub account lists it too.
- The SMTP password is in the environment, as the other secrets
  (decision 24).
- Servers before this decision do not know schema version 11; upgrade
  every server.
