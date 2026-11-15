// Diffs and highlighted files, rendered by @pierre/diffs (diffs.com) with
// its Shiki highlighter.

import { parsePatchFiles, type FileDiffMetadata } from "@pierre/diffs"
import type { CSSProperties } from "react"

import type { ChangedFile } from "@/lib/api"

/** Splits `git diff --patch` output into files. */
export function parsePatch(patch: string): FileDiffMetadata[] {
  return parsePatchFiles(patch).flatMap((p) => p.files)
}

/** A file without its changes: only the header of its diff. */
export function headerOnly(file: ChangedFile): FileDiffMetadata {
  return {
    name: file.path,
    prevName: file.old_path ?? undefined,
    type: (
      {
        added: "new",
        deleted: "deleted",
        modified: "change",
        renamed: file.adds + file.dels > 0 ? "rename-changed" : "rename-pure",
      } as const
    )[file.status],
    hunks: [],
    splitLineCount: 0,
    unifiedLineCount: 0,
    isPartial: true,
    deletionLines: [],
    additionLines: [],
  }
}

/** Options shared by diffs and files: system color scheme, the app's font. */
export const codeOptions = {
  themeType: "system",
  overflow: "scroll",
  // Code lives in a shadow root, so the app's scrollbar width cannot reach it.
  unsafeCSS: `[data-code] { scrollbar-width: thin; }`,
} as const

export const codeStyle = {
  // The library defaults to always showing a horizontal scrollbar.
  "--diffs-overflow-override": "auto",
  "--diffs-font-family": "var(--font-mono)",
  "--diffs-header-font-family": "var(--font-sans)",
  "--diffs-font-size": "13px",
  "--diffs-line-height": "20px",
} as CSSProperties
