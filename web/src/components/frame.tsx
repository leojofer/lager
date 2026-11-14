import { Link } from "@tanstack/react-router"
import { GitBranch } from "lucide-react"
import { Fragment, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"

// The parts every page shares: the header above the page, its crumbs, and
// labelled sections of rows. Design rules: .claude/skills/lager-design.

/** The 48px bar above a page: crumbs on the left, at most two actions on the right. */
export function PageHeader({
  children,
  actions,
}: {
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2.5 border-b border-hairline bg-background px-3 md:px-5">
      <SidebarTrigger className="-ml-1 md:hidden" />
      <div className="flex min-w-0 flex-1 items-center gap-2.5">{children}</div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  )
}

export interface Crumb {
  label: ReactNode
  /** The splat of the page it links to; the last crumb needs none. */
  to?: string
  mono?: boolean
}

/** owner / repo / page: earlier crumbs muted, the last in ink. */
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium"
    >
      {items.map((c, i) => {
        const last = i === items.length - 1
        const cls = cn(
          "truncate",
          c.mono && "font-mono text-xs",
          last ? "text-ink" : "text-label",
          // The owner and repository are not truncated before the rest.
          i < 2 ? "shrink-0" : "min-w-0"
        )
        return (
          <Fragment key={i}>
            {i > 0 && (
              <span className={cn("text-stage-off", i === 1 && "px-1")}>/</span>
            )}
            {c.to && !last ? (
              <Link
                to="/$"
                params={{ _splat: c.to }}
                className={cn(cls, "hover:text-ink")}
              >
                {c.label}
              </Link>
            ) : (
              <span className={cls} aria-current={last ? "page" : undefined}>
                {c.label}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

/** A branch name in a hairline chip. */
export function BranchChip({
  name,
  className,
}: {
  name: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 min-w-0 shrink-0 items-center gap-1.25 rounded-[5px] border px-2 font-mono text-[11px] text-body",
        className
      )}
    >
      <GitBranch className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{name}</span>
    </span>
  )
}

/** The padding of a page's content below its header. */
export function PageBody({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("w-full px-4 py-6 md:px-10 md:py-8", className)}>
      {children}
    </div>
  )
}

/** A big title in display type, with a short muted note beside it. */
export function PageTitle({
  children,
  note,
}: {
  children: ReactNode
  note?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="font-display text-[34px] leading-9 text-ink">
        {children}
      </h1>
      {note && <span className="text-sm text-muted-foreground">{note}</span>}
    </div>
  )
}

/** A mono caps label with a muted count, and a link on the right. */
export function SectionHead({
  title,
  note,
  count,
  more,
  className,
}: {
  title: ReactNode
  /** Muted, after a middle dot. */
  note?: ReactNode
  count?: number
  more?: { label: string; to: string }
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2 pb-2", className)}>
      <h2 className="label-caps">
        {title}
        {note && <span className="font-normal text-label"> · {note}</span>}
      </h2>
      {count !== undefined && (
        <span className="font-mono text-[11px] leading-3.5 font-medium text-label">
          {count}
        </span>
      )}
      {more && (
        <Link
          to="/$"
          params={{ _splat: more.to }}
          className="ml-auto text-xs font-medium text-label hover:text-ink"
        >
          {more.label}
        </Link>
      )}
    </div>
  )
}

/** Rows separated by hairlines, under a section head. */
export const rowList = "[&>*]:border-t [&>*]:border-hairline"

/** Text that says a list is empty, in place of its rows. */
export function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <p className="border-t border-hairline px-1 py-4 text-[13px] text-muted-foreground">
      {children}
    </p>
  )
}

/** Added and removed line counts in mono, green and red. */
export function DiffStat({ adds, dels }: { adds: number; dels: number }) {
  return (
    <span className="shrink-0 font-mono text-[11px] whitespace-nowrap">
      <span className="text-added">+{adds}</span>{" "}
      <span className="text-removed">−{dels}</span>
    </span>
  )
}
