# 30. Interface redesign: no tabs, sections in the sidebar

Status: accepted; implemented in `web/src/styles.css`,
`web/src/components/frame.tsx`, `web/src/components/app-sidebar.tsx`, and
the pages under `web/src/components/repo/`. Date: November 14, 2026.
Design rules: `.claude/skills/lager-design`.

## Context

The interface used shadcn's neutral defaults: Geist, grey on white, tabs
for the pages of a repository and of a pull request, and cards around
every list. The design in Paper (file "lager.sh") gives lager its own
look: calm, light, and dense, with one accent colour.

## Decision

**Look.** Inter for the interface, Bricolage Grotesque for names, titles,
and big numbers, JetBrains Mono for hashes, branches, paths, and section
labels. Blue (`#2B63E6`) is the only accent; green and red mark added and
removed lines and merge state. Lists are rows split by hairlines, not
cards. The colours are CSS variables in `styles.css`, with a dark set.

**Frame.** The sidebar and the page are adjacent, split by one hairline.
The sidebar holds the wordmark, a button for a new repository, search
("Jump to anything", `⌘K`), Repositories and Settings, and the
repositories, each with a colour dot and its count of open pull requests.
Every page draws a 48px header: crumbs and, on code pages, the branch, on
the left; at most two actions on the right. On phones the header opens the
sidebar.

**No tabs.** The pages of the open repository (Overview, Code, Pull
requests, Commits, Settings) are listed under it in the sidebar. A pull
request shows its commits as a stack from the head down to the target
branch, then the conversation and the changed files one below the other,
and its state and properties beside them; `/pull/<n>/commits` and `/files`
scroll to their section. Addresses are unchanged.

**Overview.** A hero (tile, name, visibility, branch, last update, Clone),
a strip of numbers (open pull requests, branches, latest tag, commits of
the last 30 days with a bar per day), then pull requests, recent commits,
and the README, with branch counts, people, and recent branches beside
them. The commit count reads up to ten pages of history.

**State marks.** A pull request's state is a track of four bars instead
of a coloured icon: open is the third bar in blue, merged is all ink,
closed is all grey.

## Consequences

- The Paper design also shows issues with stages, stacked layers,
  Inbox, and To check. The server has none of them yet; the interface
  shows only what the server answers, and still says "pull request".
- Repositories have no logo or description; the tile shows the first
  letter in the repository's colour.
- The overview reads more history than before when a branch has many
  commits in the last 30 days.
