const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
]
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

/** "3 hours ago" for a Unix time in seconds. */
export function ago(unix: number) {
  const secs = Math.round(unix - Date.now() / 1000)
  for (const [unit, size] of units) {
    if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit)
  }
  return "just now"
}

export function fullDate(unix: number) {
  return new Date(unix * 1000).toLocaleString()
}

export function bytes(n: number) {
  if (n < 1024) return `${n} B`
  const u = ["KiB", "MiB", "GiB"]
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${u[i]}`
}

export function short(oid: string) {
  return oid.slice(0, 8)
}

/** "2h", "3d", or "now" for a Unix time in seconds: for rows with little room. */
export function since(unix: number) {
  const secs = Math.max(0, Date.now() / 1000 - unix)
  for (const [unit, size] of units) {
    if (secs >= size) return `${Math.floor(secs / size)}${unitShort[unit]}`
  }
  return "now"
}

const unitShort: Partial<Record<Intl.RelativeTimeFormatUnit, string>> = {
  year: "y",
  month: "mo",
  week: "w",
  day: "d",
  hour: "h",
  minute: "m",
}
