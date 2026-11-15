import { useMemo, useState } from "react"
import {
  ChevronRight,
  FileMinus,
  FilePen,
  FilePlus,
  FileSymlink,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { ChangedFile } from "@/lib/api"
import { indent, row } from "./file-tree"

interface Dir {
  kind: "dir"
  /** One or more path segments: directories with one child are merged. */
  name: string
  path: string
  children: Entry[]
}

interface Leaf {
  kind: "file"
  name: string
  /** The file's index in the diff. */
  index: number
  file: ChangedFile
}

type Entry = Dir | Leaf

/** The changed files as directories, sorted as in a file manager. */
function build(files: ChangedFile[]): Entry[] {
  const root: Dir = { kind: "dir", name: "", path: "", children: [] }
  files.forEach((file, index) => {
    const parts = file.path.split("/")
    let dir = root
    for (const part of parts.slice(0, -1)) {
      const path = dir.path ? `${dir.path}/${part}` : part
      let next = dir.children.find(
        (c): c is Dir => c.kind === "dir" && c.name === part
      )
      if (!next) {
        next = { kind: "dir", name: part, path, children: [] }
        dir.children.push(next)
      }
      dir = next
    }
    dir.children.push({ kind: "file", name: parts.at(-1)!, index, file })
  })
  const tidy = (entries: Entry[]): Entry[] =>
    entries
      .map((e) => {
        if (e.kind === "file") return e
        let d = e
        while (d.children.length === 1 && d.children[0].kind === "dir") {
          const c = d.children[0]
          d = { ...c, name: `${d.name}/${c.name}` }
        }
        return { ...d, children: tidy(d.children) }
      })
      .sort(
        (a, b) =>
          Number(b.kind === "dir") - Number(a.kind === "dir") ||
          a.name.localeCompare(b.name)
      )
  return tidy(root.children)
}

const icons = {
  added: { icon: FilePlus, className: "text-added", label: "Added" },
  deleted: { icon: FileMinus, className: "text-removed", label: "Deleted" },
  renamed: { icon: FileSymlink, className: "text-label", label: "Renamed" },
  modified: { icon: FilePen, className: "text-label", label: "Changed" },
}

/**
 * The files of a diff as a tree; following a file scrolls to its diff.
 * Every directory starts open.
 */
export function DiffTree({
  files,
  current,
  onSelect,
}: {
  files: ChangedFile[]
  /** The index of the file in view. */
  current: number | undefined
  onSelect: (index: number) => void
}) {
  const entries = useMemo(() => build(files), [files])
  const [closed, setClosed] = useState(() => new Set<string>())
  const toggle = (dir: string) =>
    setClosed((c) => {
      const n = new Set(c)
      if (!n.delete(dir)) n.add(dir)
      return n
    })
  const list = (entries: Entry[], depth: number) => (
    <ul>
      {entries.map((e) =>
        e.kind === "dir" ? (
          <li key={e.path}>
            <button
              type="button"
              onClick={() => toggle(e.path)}
              className={cn(row, "w-full text-left")}
              style={indent(depth)}
              aria-expanded={!closed.has(e.path)}
            >
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 text-muted-foreground transition-transform",
                  !closed.has(e.path) && "rotate-90"
                )}
              />
              <span className="truncate text-ink">{e.name}</span>
            </button>
            {!closed.has(e.path) && list(e.children, depth + 1)}
          </li>
        ) : (
          <li key={e.index}>
            <FileRow
              leaf={e}
              depth={depth}
              active={e.index === current}
              onSelect={onSelect}
            />
          </li>
        )
      )}
    </ul>
  )
  return (
    <nav aria-label="Changed files" className="text-[13px]">
      {list(entries, 0)}
    </nav>
  )
}

function FileRow({
  leaf,
  depth,
  active,
  onSelect,
}: {
  leaf: Leaf
  depth: number
  active: boolean
  onSelect: (index: number) => void
}) {
  const { status, old_path, adds, dels } = leaf.file
  const kind = icons[status]
  const title = old_path ? `${kind.label} from ${old_path}` : kind.label
  return (
    <button
      type="button"
      onClick={() => onSelect(leaf.index)}
      className={cn(
        row,
        "w-full text-left",
        active && "bg-tint font-medium text-ink hover:bg-tint"
      )}
      style={indent(depth)}
      title={title}
      aria-current={active ? "location" : undefined}
    >
      <span className="size-3.5 shrink-0" />
      <kind.icon className={cn("size-4 shrink-0", kind.className)} />
      <span className="min-w-0 flex-1 truncate">{leaf.name}</span>
      {(adds > 0 || dels > 0) && (
        <span className="shrink-0 font-mono text-[11px] font-normal">
          {adds > 0 && <span className="text-added">+{adds}</span>}
          {adds > 0 && dels > 0 && " "}
          {dels > 0 && <span className="text-removed">−{dels}</span>}
        </span>
      )}
    </button>
  )
}
