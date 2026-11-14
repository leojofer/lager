# 33. Syncing new GitHub repositories

Status: accepted; implemented in `crates/core/src/github.rs`,
`Github::check_new` in `crates/server/src/github.rs`, and
`web/src/routes/[-].settings.github.tsx`. Date: November 13, 2026.

## Context

Users who mirror all their GitHub work have to come back to settings after
each repository they create on GitHub. They want new repositories to
follow without asking.

## Decision

**Switch.** A connected account has **Sync new repositories**
(`github_auto` on the live connection, `on` true or false). Turning it on
reads the user's newest repository on GitHub and keeps its `created_at`;
repositories that exist then are not new, so turning it on mirrors
nothing at once.

**What is new.** A repository the user owns (`GET /user/repos`,
`affiliation=owner`), forks included, whose `created_at` is later than the
newest one seen. Organisation repositories and repositories of others the
user collaborates on are left out. A repository transferred to the user,
which keeps its creation time, is not new.

**Checking.** Every server with `[github]` looks every ten seconds for
accounts that are due, and takes one with `UPDATE … FOR UPDATE SKIP
LOCKED` that moves its due time ten minutes ahead, as for mirrors. A check
lists the user's repositories newest first until one is not new (at most
ten pages of 100), mirrors the new ones oldest first like a pick in
settings, moves the newest one seen ahead, and makes the account due in
five minutes. Each repository is handled once: one whose name is taken
here is skipped for good and listed on the settings page; after another
failure, such as GitHub not answering, the next check starts again from
the last repository mirrored. A check that started before the user
turned the switch off or on again records nothing.

**Data.** PostgreSQL, schema version 12: `lager_github_accounts` gains
`auto`, `auto_since` (GitHub's `created_at` text), `auto_next_at`,
`auto_error`, and `auto_skipped`. Connecting another GitHub account turns
the switch off; connecting the same one again keeps it.

## Consequences

- A new repository arrives within about five minutes; GitHub has no
  webhook for repositories an OAuth app's user creates.
- An account with the switch on costs one API call per five minutes.
- **Stop syncing** or deleting a mirror that arrived this way does not
  bring it back: it is no longer new.
- Servers before this decision do not know schema version 12; upgrade
  every server first.
