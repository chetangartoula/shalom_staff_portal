"use client"

import * as React from "react"
import {
  Tooltip as RechartsTooltip,
} from "recharts"

import { cn } from "@/lib/utils"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: Record<string, any>
  }
>(({ children, className, config, ...props }, ref) => {
  return (
    <div
      data-chart=""
      ref={ref}
      className={cn(
        "flex aspect-video justify-center gap-4 [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer:focus-visible]:outline-none [&_.recharts-polar-axis-tick_text]:fill-muted-foreground [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-radial-bar-sector]:(stroke,fill)-[var(--color)] [&_.recharts-reference-line-line]:stroke-border [&_.recharts-sector[path-stroke='#fff']]:stroke-transparent [&_.recharts-sector]:(stroke,fill)-[var(--color)] [&_.recharts-surface]:[-webkit-tap-highlight-color:transparent] [&_.recharts-tooltip-cursor]:fill-muted/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ChartContainer.displayName = "Chart"

const ChartTooltip = RechartsTooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    React.ComponentProps<typeof RechartsTooltip> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      label,
      labelFormatter,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      if (label) {
        return label
      }

      if (labelFormatter) {
        return labelFormatter(payload[0].payload[labelKey || "name"], payload)
      }

      return payload[0].payload[labelKey || "name"]
    }, [label, labelFormatter, payload, hideLabel, labelKey])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel && tooltipLabel ? (
          <div className="font-medium">{tooltipLabel}</div>
        ) : null}
        <div className="grid gap-1.5">
          {payload.map((item, i) => {
            const key = `${nameKey || item.name || "value"}`
            const itemColor = color || item.color || "hsl(var(--chart-1))"
            const value =
              !formatter || typeof item.value !== "number"
                ? item.value
                : formatter(item.value, key, item, i, payload)

            if (item.value === null) {
              return null
            }

            return (
              <div
                key={item.dataKey}
                className={cn("flex w-full items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground")}
              >
                {formatter ? (
                  <div
                    className="w-full flex-1"
                  >
                    {nestLabel && tooltipLabel ? (
                      <div className="grid gap-1.5">
                        <span className="font-medium">{tooltipLabel}</span>
                        <div
                          className="flex items-center gap-2"
                        >
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                            style={
                              {
                                "--color-bg": itemColor,
                                "--color-border": itemColor,
                              } as React.CSSProperties
                            }
                          />
                          <div
                            className={cn(
                              "flex-1",
                            )}
                          >
                            <div
                              className="font-medium"
                            >
                              {value}
                            </div>
                            <div className="text-muted-foreground">
                              {key}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2"
                      >
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                          style={
                            {
                              "--color-bg": itemColor,
                              "--color-border": itemColor,
                            } as React.CSSProperties
                          }
                        />
                        <div className="flex-1 text-right">{value}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: itemColor,
                      }}
                    />
                    <div className="flex flex-1 justify-between leading-none">
                      <p className="text-muted-foreground">{key}</p>
                      <p className="font-medium">
                        {value}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
