import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/modules/shadcn/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-2!", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-2!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon
      />
      <span className="sr-only">More pages</span>
    </span>
  )
}

// ───────────────────────────────────────────────────────────────────────────
// Numbered pagination (figma "<  1  2  3  ...  6  >") — built on the
// primitives above so existing prev/next consumers still work.
// ───────────────────────────────────────────────────────────────────────────

function getPaginationRange(
  current: number,
  total: number,
  siblings = 1,
): (number | "ellipsis")[] {
  // Show every page when there's no need to truncate
  const compactCount = siblings * 2 + 5 // first + last + current + 2*siblings + 2 ellipses
  if (total <= compactCount) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const start = Math.max(2, current - siblings)
  const end = Math.min(total - 1, current + siblings)
  const showLeftEllipsis = start > 2
  const showRightEllipsis = end < total - 1
  const pages: (number | "ellipsis")[] = [1]
  if (showLeftEllipsis) pages.push("ellipsis")
  for (let p = start; p <= end; p++) pages.push(p)
  if (showRightEllipsis) pages.push("ellipsis")
  pages.push(total)
  return pages
}

interface PaginationNumbersProps extends React.ComponentProps<"nav"> {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Number of sibling pages shown on each side of the current page. */
  siblings?: number
}

function PaginationNumbers({
  currentPage,
  totalPages,
  onPageChange,
  siblings = 1,
  className,
  ...props
}: PaginationNumbersProps) {
  if (totalPages <= 1) return null
  const pages = getPaginationRange(currentPage, totalPages, siblings)
  const navButton =
    "flex size-6 items-center justify-center rounded text-foreground transition-colors hover:bg-black/5 disabled:pointer-events-none disabled:opacity-40"
  const numberButton =
    "flex size-6 items-center justify-center rounded text-sm leading-5 transition-colors"
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("flex items-center", className)}
      {...props}
    >
      <button
        type="button"
        aria-label="Go to previous page"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={cn(navButton, "cursor-pointer")}
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            aria-hidden
            className="flex size-6 items-center justify-center text-sm text-foreground"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Go to page ${p}`}
            aria-current={p === currentPage ? "page" : undefined}
            onClick={() => onPageChange(p)}
            className={cn(
              numberButton,
              "cursor-pointer",
              p === currentPage
                ? "bg-primary/15 font-medium text-primary"
                : "text-foreground hover:bg-black/5",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Go to next page"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={cn(navButton, "cursor-pointer")}
      >
        <ChevronRightIcon className="size-4" />
      </button>
    </nav>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNumbers,
  PaginationPrevious,
}
