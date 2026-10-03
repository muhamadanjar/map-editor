"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "cn"

type ComboboxOption = {
  value: string
  label: string
  keywords?: string[]
  disabled?: boolean
}

type ComboboxProps = {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: React.ReactNode
  disabled?: boolean
  className?: string
  popoverClassName?: string
}

function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No option found.",
  disabled,
  className,
  popoverClassName,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0", popoverClassName)} align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={[option.label, ...(option.keywords ?? [])].join(" ")}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange(option.value === value ? undefined : option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                  <CheckIcon
                    className={cn("ml-auto size-4", value === option.value ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
export type { ComboboxOption, ComboboxProps }
