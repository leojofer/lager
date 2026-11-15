# 36. Large diffs

Status: accepted; implemented in `crates/server/src/web/read.rs`,
`crates/server/src/web/pulls.rs`, and `web/src/components/repo/changes.tsx`.
Date: November 15, 2026.

## Context

`commit` and `compare` answered one patch of at most 2 MiB (decision 14).
A larger diff ended there, in the middle of a file, with "The diff is too
large to show completely": the files after the cut, their counts, and
their place in the tree of files were missing. The page drew and
highlighted every file of the patch at once, so a diff near the limit
kept the browser busy for seconds.

## Decision

**The list of files is complete.** `commit` and `compare` also answer
`files`: every changed file with its path, the old path of a renamed one,
whether it was added, deleted, modified, or renamed, its added and
deleted lines, and whether it is binary. It comes from a second run of
Git (`--raw --numstat -z`), cut after 4 MiB of output
(`files_truncated`). Counts and the tree of files come from this list,
not from the patch.

**The patch is the start.** `diff` stays the patch of the whole diff, cut
at 2 MiB. The page uses the files it holds completely and asks for each
other one with the new read `diff_file {repo, base?, head, path,
old_path?}`: the patch of one file between two commits, `base` absent for
a root commit. Paths are names, not patterns (`--literal-pathspecs`). A
patch of one file above 2 MiB is not sent (`too_large`); the page links
to the file instead.

**Files are drawn when they come near.** A file is drawn and highlighted
when it comes within 1500 pixels of the view, and stays drawn. Until then
a box of about its height holds its place, so the tree of files can lead
to any file. A file that the patch leaves out loads at the same moment.
A file with more than 2000 changed lines shows them on request.

## Consequences

- A diff costs two runs of Git where it cost one.
- The heights of the boxes are estimates. Browsers without scroll
  anchoring may move the page a little when a file above the view is
  drawn.
- Files stay drawn after they leave the view, so a reader who scrolls
  through a very large diff ends with all of it in the page.
- `diff_file` is one request per file. Each takes a Git process slot and
  counts against the request limit like every read.
