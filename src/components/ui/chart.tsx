
"use client"

import * as React from "react"
import {
  Label,
  Pie,
  PieChart as RechartsPieChart,
  Sector,
  Tooltip as RechartsTooltip,
} from "recharts"
import type {
  ChartConfig,
  ChartContainerProps,
  ChartStyleConfig,
  ChartTooltipContentProps,
  ChartTooltipProps,
} from "recharts-extend"
import {
  chartTooltipContent,
  chartContainer,
  chartStyle,
  chartTooltip,
} from "recharts-extend"
 
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  ChartContainerProps
>(({ id, className, ...props }, ref) => {
  const chartId = React.useId()
  const finalId = id || chartId
  return (
    <chartContainer.div
      {...props}
      id={finalId}
      ref={ref}
      className={className}
    />
  )
})
ChartContainer.displayName = "Chart"
 
const ChartTooltip = React.forwardRef<
  React.ElementRef<typeof RechartsTooltip>,
  ChartTooltipProps
>((props, ref) => {
  return <chartTooltip.Component {...props} ref={ref} />
})
ChartTooltip.displayName = "ChartTooltip"
 
const ChartTooltipContent = React.forwardRef<
  React.ElementRef<"div">,
  ChartTooltipContentProps
>((props, ref) => <chartTooltipContent.Component {...props} ref={ref} />)
ChartTooltipContent.displayName = "ChartTooltipContent"
 
const ChartStyle = React.forwardRef<
  React.ElementRef<"style">,
  React.ComponentProps<typeof chartStyle>
>(({ id, ...props }, ref) => {
  const chartId = React.useId()
  const finalId = id || chartId
  return <chartStyle {...props} id={finalId} ref={ref} />
})
ChartStyle.displayName = "ChartStyle"
 
const PieChart = RechartsPieChart
 
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartStyle,
  PieChart,
}
