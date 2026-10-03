import * as React from "react"
import { cn } from "cn"

function H1({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("scroll-m-20 text-3xl font-semibold tracking-tight", className)} {...props} />
}

function H2({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight", className)} {...props} />
}

function H3({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)} {...props} />
}

function H4({ className, ...props }: React.ComponentProps<"h4">) {
  return <h4 className={cn("scroll-m-20 text-base font-semibold tracking-tight", className)} {...props} />
}

function Lead({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-lg text-muted-foreground", className)} {...props} />
}

function Large({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-lg font-semibold", className)} {...props} />
}

function Small({ className, ...props }: React.ComponentProps<"small">) {
  return <small className={cn("text-sm leading-none font-medium", className)} {...props} />
}

function Muted({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function InlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return <code className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", className)} {...props} />
}

export { H1, H2, H3, H4, InlineCode, Large, Lead, Muted, Small }
