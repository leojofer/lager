import type { FileDiffContentsLoader, FileDiffMetadata } from "@pierre/diffs"
import { FileDiff as PatchFileDiff } from "@pierre/diffs/react"
import { Link } from "@tanstack/react-router"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

import {
  fetchBlob,
  useDiffFile,
  type ChangedFile,
  type Changes,
} from "@/lib/api"
import { href } from "@/lib/paths"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { codeOptions, codeStyle, headerOnly, parsePatch } from "./diff"
import { DiffTree } from "./diff-tree"

type DiffStyle = "unified" | "split"

/** A file with more changed lines shows them on request. */
const LARGE_LINES = 2000
/** Files this far outside the view are drawn already, in pixels. */
const AHEAD = 1500
/** The heights that stand in for a file not drawn yet, in pixels. */
const HEADER_HEIGHT = 44
const LINE_HEIGHT = 20
const NOTE_HEIGHT = 56

function useDiffStyle() {
  const [style, setStyle] = useState<DiffStyle>(() =>
    localStorage.getItem("diff-style") === "split" ? "split" : "unified"
  )
  const set = (s: DiffStyle) => {
    localStorage.setItem("diff-style", s)
    setStyle(s)
  }
  return [style, set] as const
}

/**
 * The files changed between two revisions, with a count of changed lines.
 * A file is drawn when it comes near the view, and one that the patch
 * leaves out loads then. Expanding unchanged lines loads both whole
 * files. With `tree`, a tree of the files, drawn into that element
 * elsewhere on the page, leads to each.
 */
export function ChangedFiles({
  repo,
  changes,
  oldRev,
  newRev,
  note,
  tree,
}: {
  repo: string
  changes: Changes
  /** Absent for a root commit. */
  oldRev: string | undefined
  newRev: string
  /** Appended to the summary. */
  note?: string
  /** Where the tree of the files goes; absent for no tree. */
  tree?: HTMLElement | null
}) {
  const { files } = changes
  const patches = useMemo(() => {
    const parsed = parsePatch(changes.diff)
    // A cut patch ends inside its last file.
    if (changes.truncated) parsed.pop()
    return new Map(parsed.map((d) => [d.name, d]))
  }, [changes.diff, changes.truncated])
  const [diffStyle, setDiffStyle] = useDiffStyle()
  const loadDiffFiles = useCallback<FileDiffContentsLoader>(
    async (d) => {
      const text = async (rev: string | undefined, path: string) => {
        if (!rev) throw new Error("no such revision")
        const b = await fetchBlob(repo, rev, path)
        if (b.text === null) throw new Error(`${path} is not shown as text`)
        return { name: path, contents: b.text }
      }
      const newFile = await text(newRev, d.name)
      if (d.type === "rename-pure") return { oldFile: null, newFile }
      return {
        oldFile: await text(oldRev, d.prevName ?? d.name),
        newFile,
      }
    },
    [repo, oldRev, newRev]
  )
  const adds = files.reduce((n, f) => n + f.adds, 0)
  const dels = files.reduce((n, f) => n + f.dels, 0)

  const views = useRef<(HTMLDivElement | null)[]>([])
  const [current, setCurrent] = useCurrentFile(views, files)
  const near = useNear(views, files)

  const summary = (
    <>
      <p className="text-sm text-muted-foreground">
        {files.length} {files.length === 1 ? "file" : "files"} changed,{" "}
        <span className="font-mono text-xs text-added">+{adds}</span>{" "}
        <span className="font-mono text-xs text-removed">−{dels}</span>
        {note}
      </p>
      <Tabs
        value={diffStyle}
        onValueChange={(v) => setDiffStyle(v as DiffStyle)}
        className="ml-auto"
      >
        <TabsList>
          <TabsTrigger value="unified">Unified</TabsTrigger>
          <TabsTrigger value="split">Split</TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  )
  const diffs = (
    <div className="grid grid-cols-1 gap-6">
      {files.map((f, i) => (
        <div
          key={f.path}
          ref={(el) => {
            views.current[i] = el
          }}
          // Below the sticky page header.
          className="scroll-mt-14"
        >
          <FileView
            repo={repo}
            file={f}
            patch={patches.get(f.path)}
            near={near.has(i)}
            oldRev={oldRev}
            newRev={newRev}
            diffStyle={diffStyle}
            loadDiffFiles={loadDiffFiles}
          />
        </div>
      ))}
      {changes.files_truncated && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          More files changed than can be listed.
        </p>
      )}
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-center gap-3">{summary}</div>
      {diffs}
      {tree &&
        createPortal(
          <DiffTree
            files={files}
            current={current}
            onSelect={(i) => {
              // The last files may not reach the top, so mark the choice.
              setCurrent(i)
              views.current[i]?.scrollIntoView({ block: "start" })
            }}
          />,
          tree
        )}
    </div>
  )
}

/** The index of the topmost file diff in view, until another is chosen. */
function useCurrentFile(
  views: React.RefObject<(HTMLDivElement | null)[]>,
  files: ChangedFile[]
) {
  const [current, setCurrent] = useState<number>()
  useEffect(() => {
    const visible = new Set<number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = views.current.indexOf(e.target as HTMLDivElement)
          if (e.isIntersecting) visible.add(i)
          else visible.delete(i)
        }
        setCurrent(visible.size ? Math.min(...visible) : undefined)
      },
      // Not under the sticky page header.
      { rootMargin: "-56px 0px 0px 0px" }
    )
    for (const el of views.current.slice(0, files.length)) {
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [views, files])
  return [current, setCurrent] as const
}

/** The element whose scrolling moves `el`; null for the page. */
function scroller(el: HTMLElement) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(p).overflowY)) return p
  }
  return null
}

/** The indices of the files that have come near the view. */
function useNear(
  views: React.RefObject<(HTMLDivElement | null)[]>,
  files: ChangedFile[]
) {
  const [near, setNear] = useState<ReadonlySet<number>>(() => new Set())
  useEffect(() => {
    setNear(new Set())
    const els = views.current.slice(0, files.length)
    const first = els.find((el) => el)
    if (!first) return
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting)
        if (seen.length === 0) return
        setNear((old) => {
          const next = new Set(old)
          for (const e of seen) {
            next.add(views.current.indexOf(e.target as HTMLDivElement))
            // A file stays drawn.
            io.unobserve(e.target)
          }
          return next
        })
      },
      { root: scroller(first), rootMargin: `${AHEAD}px 0px` }
    )
    for (const el of els) {
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [views, files])
  return near
}

const FileView = memo(function FileView({
  repo,
  file,
  patch,
  near,
  oldRev,
  newRev,
  diffStyle,
  loadDiffFiles,
}: {
  repo: string
  file: ChangedFile
  /** The file's part of the patch, if the patch has it. */
  patch: FileDiffMetadata | undefined
  near: boolean
  oldRev: string | undefined
  newRev: string
  diffStyle: DiffStyle
  loadDiffFiles: FileDiffContentsLoader
}) {
  const large = file.adds + file.dels > LARGE_LINES
  const [open, setOpen] = useState(!large)
  const show = near && open && !file.binary
  const q = useDiffFile(repo, oldRev, newRev, file, show && !patch)
  const loaded = useMemo(
    () =>
      q.data && !q.data.too_large ? parsePatch(q.data.diff)[0] : undefined,
    [q.data]
  )
  const diff = show ? (patch ?? loaded) : undefined
  const header = useMemo(() => headerOnly(file), [file])
  // The options must keep their identity: new ones render the diff again.
  const options = useMemo(
    () => ({ ...codeOptions, diffStyle, loadDiffFiles }),
    [diffStyle, loadDiffFiles]
  )
  if (!near) {
    const lines =
      !open || file.binary
        ? 0
        : patch
          ? diffStyle === "split"
            ? patch.splitLineCount
            : patch.unifiedLineCount
          : file.adds + file.dels
    return (
      <div
        className="rounded-[9px] border"
        style={{
          height: HEADER_HEIGHT + (lines ? lines * LINE_HEIGHT : NOTE_HEIGHT),
        }}
      />
    )
  }
  const lines = file.adds + file.dels
  const note = file.binary ? (
    "Binary file changed."
  ) : !open ? (
    <span className="flex items-center gap-3">
      {lines.toLocaleString()} changed lines.
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Show
      </Button>
    </span>
  ) : q.error ? (
    <span className="text-destructive">{q.error.message}</span>
  ) : q.data?.too_large ? (
    <span className="flex items-center gap-3">
      This diff is too large to show.
      {file.status !== "deleted" && (
        <Button asChild variant="outline" size="sm">
          <Link
            to="/$"
            params={{ _splat: href(repo, "blob", newRev, file.path) }}
          >
            View file
          </Link>
        </Button>
      )}
    </span>
  ) : !diff ? (
    q.data ? (
      "No content changes."
    ) : (
      <Skeleton className="h-16" />
    )
  ) : diff.hunks.length > 0 ? null : diff.type === "rename-pure" ? (
    "File renamed without changes."
  ) : diff.prevMode && diff.prevMode !== diff.mode ? (
    `File mode changed from ${diff.prevMode} to ${diff.mode}.`
  ) : (
    "No content changes."
  )
  return (
    <div className="overflow-hidden rounded-[9px] border">
      <PatchFileDiff
        // A new one for the changes: the header alone is another diff.
        key={diff ? "diff" : "header"}
        fileDiff={diff ?? header}
        options={options}
        style={codeStyle}
      />
      {note && (
        <div className="border-t p-4 text-sm text-muted-foreground">{note}</div>
      )}
    </div>
  )
})
