import { Link } from "@tanstack/react-router"
import { ArrowRight, Bot, GitBranch, Radio, Zap } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DiffStat, rowList } from "@/components/frame"
import { GithubMark } from "@/components/github-mark"
import { LagerMark } from "@/components/lager-mark"
import { Avatar } from "@/components/repo/avatar"
import { StageTrack } from "@/components/repo/pulls"

// What lager.sh shows at / to a visitor who is not signed in
// (docs/decisions/0034-landing-page.md).

const source = "https://github.com/leopoldj4/lager"
const column = "mx-auto w-full max-w-[1080px] px-5 md:px-8"
const ring = "shadow-[0_0_0_1px_var(--border),0_1px_2px_#0000000a]"

const pulls = [
  {
    n: 131,
    state: "open",
    title: "Fix session refresh",
    branch: "agent/fix-login",
    adds: 42,
    dels: 7,
    time: "now",
  },
  {
    n: 130,
    state: "open",
    title: "Review interface",
    branch: "leo/review-ui",
    by: "Leo",
    adds: 318,
    dels: 96,
    time: "2m",
  },
  {
    n: 129,
    state: "merged",
    title: "Test ref rules",
    branch: "agent/tests",
    adds: 204,
    dels: 0,
    time: "14m",
  },
  {
    n: 128,
    state: "merged",
    title: "Keep the author",
    branch: "alex/squash",
    by: "Alex",
    adds: 31,
    dels: 12,
    time: "1h",
  },
  {
    n: 127,
    state: "closed",
    title: "Retry lost pushes",
    branch: "agent/retry-push",
    adds: 88,
    dels: 40,
    time: "3h",
  },
] as const

const numbers = [
  { value: "0", label: "Reloads" },
  { value: "2-way", label: "GitHub sync" },
]

const agents = [
  { icon: Zap, label: "No clone" },
  { icon: Radio, label: "Events, not polling" },
  { icon: GitBranch, label: "A branch per task" },
]

const stack = [
  { name: "Realtime interface", tag: "Live updates" },
  { name: "Git engine", tag: "Rust" },
  { name: "Object storage", tag: "S3-compatible" },
]

const plan = [
  { name: "Git over HTTPS and SSH", done: true },
  { name: "Pull requests", done: true },
  { name: "Two-way GitHub sync", done: true },
  { name: "Passkeys", done: true },
  { name: "Issues" },
  { name: "Actions-compatible CI" },
  { name: "Agent SDK" },
]

export function Landing() {
  const start = (
    <Button variant="default" size="lg" className="px-4" asChild>
      <Link to="/-/sign-up">
        Sign up
        <ArrowRight />
      </Link>
    </Button>
  )

  return (
    <div className="min-h-svh bg-background text-body">
      <header className="sticky top-0 z-10 border-b border-hairline bg-background/85 backdrop-blur">
        <div className={cn(column, "flex h-14 items-center gap-1")}>
          <a href="#top" className="mr-auto flex items-center gap-2.25">
            <span className="flex size-6.5 items-center justify-center rounded-md bg-[#F3ECE2]">
              <LagerMark className="size-5" />
            </span>
            <span className="font-display text-[19px] leading-6 text-ink">
              lager
            </span>
          </a>
          <a
            href={source}
            aria-label="Source"
            title="Source"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-ink"
          >
            <GithubMark className="size-4" />
          </a>
          <Button variant="ghost" asChild>
            <Link to="/-/sign-in">Sign in</Link>
          </Button>
          <Button variant="ink" asChild>
            <Link to="/-/sign-up">Sign up</Link>
          </Button>
        </div>
      </header>

      <main id="top">
        <section
          className={cn(
            column,
            "grid items-center gap-x-14 gap-y-12 pt-16 pb-20 md:pt-24 md:pb-28 lg:grid-cols-[1fr_1.1fr]"
          )}
        >
          <div>
            <h1 className="font-display text-[46px] leading-[0.96] text-ink sm:text-[64px]">
              A forge for agents and people.
            </h1>
            <p className="mt-6 text-[17px] leading-7">
              Instant, realtime, and in sync with GitHub.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              {start}
              <Button variant="outline" size="lg" className="px-4" asChild>
                <a href={source}>
                  <GithubMark />
                  Source
                </a>
              </Button>
            </div>
          </div>
          <Pulls />
        </section>

        <section className="border-y border-hairline">
          <dl
            className={cn(
              column,
              "grid divide-hairline max-sm:divide-y sm:grid-cols-2 sm:divide-x"
            )}
          >
            {numbers.map((n) => (
              <div
                key={n.label}
                className="flex flex-col-reverse gap-1 py-8 sm:px-8 sm:py-10 sm:first:pl-0"
              >
                <dt className="text-sm text-muted-foreground">{n.label}</dt>
                <dd className="font-display text-[44px] leading-none text-ink">
                  {n.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className={cn(
            column,
            "grid items-center gap-x-14 gap-y-10 py-20 md:py-28 lg:grid-cols-[1fr_1.1fr]"
          )}
        >
          <div>
            <h2 className="flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-[34px] leading-[1.05] text-ink sm:text-[40px]">
              Agents are users.
              <Soon />
            </h2>
            <ul className="mt-8 grid gap-3.5">
              {agents.map((a) => (
                <li
                  key={a.label}
                  className="flex items-center gap-3 text-[15px] font-medium text-ink"
                >
                  <a.icon className="size-4 text-muted-foreground" />
                  {a.label}
                </li>
              ))}
            </ul>
          </div>
          <Sdk />
        </section>

        <section className="border-t border-hairline">
          <div
            className={cn(
              column,
              "grid divide-hairline max-lg:divide-y lg:grid-cols-2 lg:divide-x"
            )}
          >
            <div className="py-16 md:py-20 lg:pr-14">
              <h2 className="font-display text-[28px] leading-8 text-ink">
                Built to scale out.
              </h2>
              <ol className="mt-7 grid gap-1.5">
                {stack.map((s) => (
                  <li
                    key={s.name}
                    className={cn(
                      "flex h-12 items-center justify-between gap-3 rounded-lg bg-card px-4",
                      ring
                    )}
                  >
                    <span className="text-sm font-medium text-ink">
                      {s.name}
                    </span>
                    <span className="label-caps font-medium text-label">
                      {s.tag}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="py-16 md:py-20 lg:pl-14">
              <h2 className="font-display text-[28px] leading-8 text-ink">
                Plan
              </h2>
              <ul className={cn(rowList, "mt-5 border-b border-hairline")}>
                {plan.map((p) => (
                  <li key={p.name} className="flex h-10 items-center gap-3.5">
                    <span className="flex shrink-0 items-center gap-0.5">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-3 w-1.5 rounded-[2px]",
                            p.done ? "bg-body" : "bg-stage-off"
                          )}
                        />
                      ))}
                    </span>
                    <span
                      className={cn(
                        "text-[13px] font-medium",
                        p.done ? "text-ink" : "text-muted-foreground"
                      )}
                    >
                      {p.name}
                    </span>
                    <span className="ml-auto font-mono text-[11px] text-label">
                      {p.done ? "shipped" : "next"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-hairline bg-sidebar">
          <div
            className={cn(
              column,
              "flex flex-wrap items-center justify-between gap-6 py-14"
            )}
          >
            <h2 className="font-display text-[30px] leading-9 text-ink">
              Push something.
            </h2>
            {start}
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div
          className={cn(
            column,
            "flex items-center gap-6 py-6 text-xs text-muted-foreground"
          )}
        >
          <span className="mr-auto">Lager is German for warehouse.</span>
          <a href={source} className="hover:text-ink">
            Source
          </a>
          <Link to="/-/sign-in" className="hover:text-ink">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}

function Soon() {
  return (
    <span className="rounded-[5px] bg-tint px-1.75 py-0.5 font-mono text-[11px] leading-4 font-medium tracking-normal text-tint-foreground ring-1 ring-tint-ring">
      soon
    </span>
  )
}

/** Pull requests of agents and people in one list, as the interface shows them. */
function Pulls() {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-[9px] bg-card", ring)}>
      <div className="flex h-10 items-center gap-2 px-4">
        <span className="label-caps">Pull requests</span>
        <span className="font-mono text-[11px] font-medium text-label">
          {pulls.length}
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-added">
          <span className="size-1.5 rounded-full bg-added" />
          live
        </span>
      </div>
      <ul className={rowList}>
        {pulls.map((p) => (
          <li key={p.n} className="flex h-11 items-center gap-3 px-4">
            <StageTrack state={p.state} />
            <span className="w-8 shrink-0 font-mono text-[11px] text-label">
              #{p.n}
            </span>
            {"by" in p ? (
              <Avatar name={p.by} className="size-5" />
            ) : (
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-background"
                title="Agent"
              >
                <Bot className="size-3" />
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
              {p.title}
            </span>
            <span className="hidden truncate font-mono text-[11px] text-muted-foreground sm:inline">
              {p.branch}
            </span>
            <span className="hidden w-16 text-right sm:inline">
              <DiffStat adds={p.adds} dels={p.dels} />
            </span>
            <span className="w-7 shrink-0 text-right text-xs text-label">
              {p.time}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const k = "text-[#8fb0f7]"
const s = "text-[#8fcfa8]"
const c = "text-[#6f6f78]"

/** The planned SDK; dark in both colour schemes. */
function Sdk() {
  return (
    <div className="min-w-0 overflow-hidden rounded-[9px] bg-[#1c1c21] shadow-[0_0_0_1px_#2a2a30]">
      <div className="border-b border-[#2a2a30] px-4 py-2.5 font-mono text-[11px] text-[#9a9aa3]">
        agent.ts
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-6 text-[#ededf0]">
        <span className={k}>const</span> repo = lager.repo(
        <span className={s}>"acme/api"</span>){"\n"}
        <span className={k}>const</span> branch ={" "}
        <span className={k}>await</span> repo.branch(
        <span className={s}>"agent/fix-login"</span>){"\n\n"}
        <span className={k}>await</span> branch.commit(
        <span className={s}>"Fix session refresh"</span>, files){"\n"}
        <span className={k}>const</span> pull = <span className={k}>await</span>{" "}
        branch.openPullRequest(){"\n\n"}
        <span className={k}>for await</span> (<span className={k}>const</span>{" "}
        event <span className={k}>of</span> pull.events()) {"{\n"}
        {"  "}
        <span className={c}>// reviews and checks, as they happen</span>
        {"\n}"}
      </pre>
    </div>
  )
}
