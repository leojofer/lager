# 35. Stacked pull requests

Status: accepted; implemented in `crates/core/src/pulls.rs`,
`crates/server/src/pulls.rs`, `crates/server/src/github/changes.rs`, and
`web/src/components/repo/pull.tsx`. Date: November 15, 2026.

## Context

Large changes are easier to review as pull requests that build on each
other. Decision 19 allowed any branch as a target, so such pull requests
could be opened, but no page showed that they belong together, and a
target could not be changed afterwards.

## Decision

**A stack is derived, not stored.** Open pull requests form a stack where
the target branch of one is the source branch of another. The read `pull`
answers `stack`: the open pull requests from the top down to the one on
the base branch, the asked one among them, or nothing for one alone.
Where two pull requests continue a stack, the one with the lower number
does. Pull requests copied from GitHub stack the same way.

**Changing the target.** `pull_retarget {number, target}` moves an open
pull request to another target branch: its author or a user with write
access, as for closing. The rules of opening one apply (two branches, a
shared history, commits the target lacks, no other open pull request for
the two branches). It records the new target commit and merge base and
adds `retargeted` to the timeline, whose `old_oid` and `oid` hold the old
and new branch name. It is schema version 13: the event kind. For a
mirror the change goes to GitHub (its base branch), and an import that
finds another target adds the same event.

**Web interface.** On the page of a pull request, the stack is a column
of cards on a rail that ends at the base branch; the card of the open
page holds its commits. **Add layer** above it opens the compare page
with the top branch as the target. **Into** in the properties is a
picker for those who may change it. A change to any pull request of the
repository refreshes the open page, because its stack may have changed.

## Consequences

- Merged and closed pull requests show no stack: their branches no
  longer say where they were.
- Merging a pull request does not move the ones above it to its target.
  They keep the merged branch as their target until someone changes it.
- Servers before this decision do not know schema version 13; upgrade
  every server before the first change of a target.
