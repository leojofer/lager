# 34. Landing page for signed-out visitors of lager.sh

Status: accepted; implemented in `web/src/components/landing.tsx` and
`web/src/routes/__root.tsx`. Date: November 14, 2026.

## Context

lager.sh showed a signed-out visitor the list of public repositories,
inside the frame of the interface. Nothing said what lager is.

## Decision

**Where.** At `/`, a visitor who is not signed in sees a landing page
instead of the frame, on `lager.sh`, its subdomains, and the development
server. Other installations keep the list of public repositories. Every
other address is unchanged, and a signed-in user never sees the page.

**Pitch.** A forge for agents and people: one list of pull requests from
both, no reloads, two-way GitHub sync. Storage is one layer of the stack,
not the headline. What is not built yet (issues, Actions-compatible CI,
the agent SDK) is marked as next or soon.

**Part of the interface.** The page is a component of the single-page
application, in its type, colours, and row style; there is no second site
to deploy.

**No flash.** The shell is prerendered with the frame. A script in the
head hides the body where the landing page will replace it, and the
browser remembers in `localStorage` (`lager:signed-in`) that a user is
signed in, so that the frame shows at once on the next visit.

## Consequences

- The page is drawn in the browser; crawlers that run no scripts see only
  the title and the description.
- The host names are fixed in `__root.tsx`.
- After signing out in another browser profile, or clearing storage, a
  signed-in user sees the landing page until the live connection answers.
