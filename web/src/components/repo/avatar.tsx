import { cn } from "@/lib/utils"

/** A hue from 0 to 359 that stays the same for a name. */
export function hue(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

/** Initials on a soft gradient derived from the name; no external images. */
export function Avatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const h = hue(name)
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, oklch(0.8 0.07 ${h}), oklch(0.56 0.12 ${h}))`,
      }}
      aria-hidden
    >
      {initials || "?"}
    </span>
  )
}

/** Identity colours for repositories: muted, never the accent blue. */
const repoColors = [
  "#9A5A2B",
  "#E07A5F",
  "#3FA37A",
  "#C08A22",
  "#8B6BB8",
  "#4A9DB5",
  "#B5536B",
  "#6B8E3D",
]

export function repoColor(name: string) {
  return repoColors[hue(name) % repoColors.length]
}

/** A small square in the repository's colour. */
export function RepoDot({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <span
      className={cn("size-2 shrink-0 rounded-[2px]", className)}
      style={{ backgroundColor: repoColor(name) }}
      aria-hidden
    />
  )
}
