import { useEffect, useRef, useState, type ReactNode } from "react"
import { PanelLeft } from "lucide-react"
import {
  useDefaultLayout,
  type PanelImperativeHandle,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ModKey } from "@/components/omnibar"

/**
 * A resizable side panel of files beside the main view, edge to edge below
 * the page header, shown and hidden with a button at the start of the
 * toolbar or Mod+\. On phones the panel opens in a sheet.
 */
export function SidePanelLayout({
  id,
  title,
  toolbar,
  side,
  children,
}: {
  /** Keeps the panel's width across visits. */
  id: string
  title: string
  /** Placed after the toggle button. */
  toolbar: ReactNode
  /** Given a callback that closes the sheet around it on phones. */
  side: (onNavigate?: () => void) => ReactNode
  children: ReactNode
}) {
  const mobile = useIsMobile()
  const [sheet, setSheet] = useState(false)
  const panel = useRef<PanelImperativeHandle>(null)
  // A hidden panel leaves no divider and no gap beside the main view.
  const [collapsed, setCollapsed] = useState(false)
  const layout = useDefaultLayout({ id })
  const toggle = () => {
    if (mobile) return setSheet((s) => !s)
    const p = panel.current
    if (p?.isCollapsed()) p.expand()
    else p?.collapse()
  }
  // The latest toggle, for the shortcut, which is bound once.
  const toggleRef = useRef(toggle)
  toggleRef.current = toggle
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "\\" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleRef.current()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const bar = (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-hairline px-3 md:px-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={toggle}
            aria-label={`Show or hide ${title.toLowerCase()}`}
          >
            <PanelLeft />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {title}{" "}
          <KbdGroup>
            <Kbd>
              <ModKey />
            </Kbd>
            <Kbd>\</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
      {toolbar}
    </div>
  )

  if (mobile) {
    return (
      <>
        {bar}
        {children}
        <Sheet open={sheet} onOpenChange={setSheet}>
          <SheetContent side="left" className="w-72 gap-0 p-0">
            <SheetHeader className="border-b">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto px-2">
              {side(() => setSheet(false))}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }
  // Edge to edge below the page header; both sides scroll on their own, so
  // the panel stays in view. The group sets its own height to 100%, so the
  // wrapper sizes it.
  return (
    <div className="h-[calc(var(--frame-height)-3rem)] min-h-96">
      <ResizablePanelGroup
        id={id}
        defaultLayout={layout.defaultLayout}
        onLayoutChanged={layout.onLayoutChanged}
      >
        <ResizablePanel
          id="files"
          panelRef={panel}
          onResize={(size) => setCollapsed(size.inPixels === 0)}
          collapsible
          defaultSize={248}
          minSize={180}
          maxSize="40"
        >
          <div className="h-full overflow-y-auto px-2.5 py-2">{side()}</div>
        </ResizablePanel>
        <ResizableHandle className={cn(collapsed && "bg-transparent")} />
        <ResizablePanel id="preview" minSize="40">
          <div className="flex h-full flex-col">
            {bar}
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
