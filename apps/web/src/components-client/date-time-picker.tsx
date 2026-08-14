"use client";

import { useState } from "react";
import { Calendar } from "@aloysius-web/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@aloysius-web/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { Checkbox } from "@aloysius-web/ui/components/checkbox";
import { Button } from "@aloysius-web/ui/components/button";
import { IconCalendar, IconClock } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import {
  format,
  parseISO,
  startOfDay,
  isBefore,
  isSameDay,
  setHours,
  setMinutes,
  isValid,
} from "date-fns";

interface DateTimePickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  minDate?: Date;
  minTime?: { hours: number; minutes: number };
  allDay?: boolean;
  placeholder?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

const MINUTES = Array.from({ length: 12 }, (_, i) => ({
  value: String(i * 5).padStart(2, "0"),
  label: String(i * 5).padStart(2, "0"),
}));

function parseDateTime(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  try {
    const d = parseISO(value);
    return isValid(d) ? d : undefined;
  } catch {
    return undefined;
  }
}

export function DateTimePicker({
  value,
  onChange,
  label,
  required,
  minDate,
  minTime,
  allDay = false,
  placeholder = "Pick a date",
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const date = parseDateTime(value);

  const hours = date ? String(date.getHours()).padStart(2, "0") : "00";
  const minutes = date ? String(date.getMinutes()).padStart(2, "0") : "00";

  const isDateDisabled = (day: Date) => {
    if (minDate && isBefore(startOfDay(day), startOfDay(minDate))) return true;
    return false;
  };

  const isTimeDisabled = (h: number, m: number) => {
    if (!minTime || !date) return false;
    const minDate = setHours(setMinutes(new Date(), minTime.minutes ?? 0), minTime.hours ?? 0);
    if (!isSameDay(date, minDate)) return false;
    const timeVal = h * 60 + m;
    const minVal = (minTime.hours ?? 0) * 60 + (minTime.minutes ?? 0);
    return timeVal < minVal;
  };

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return;
    const current = date ?? new Date();
    let h = current.getHours();
    let m = current.getMinutes();
    if (minTime) {
      const minDate = setHours(setMinutes(new Date(), minTime.minutes ?? 0), minTime.hours ?? 0);
      if (isSameDay(selected, minDate)) {
        const minVal = (minTime.hours ?? 0) * 60 + (minTime.minutes ?? 0);
        if (h * 60 + m < minVal) {
          h = minTime.hours ?? 0;
          m = minTime.minutes ?? 0;
        }
      }
    }
    const result = setMinutes(setHours(selected, h), m);
    onChange(format(result, "yyyy-MM-dd'T'HH:mm"));
    setOpen(false);
  };

  const handleHourChange = (h: string | null) => {
    if (!h) return;
    const current = date ?? new Date();
    const newDate = setHours(current, parseInt(h));
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleMinuteChange = (m: string | null) => {
    if (!m) return;
    const current = date ?? new Date();
    const newDate = setMinutes(current, parseInt(m));
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const displayText = date
    ? allDay
      ? format(date, "MMM d, yyyy")
      : format(date, "MMM d, yyyy 'at' h:mm a")
    : placeholder;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium leading-none">
          {label} {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <div className="flex gap-2 items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className={cn(
                  "min-w-0 flex-1 justify-start text-left font-normal truncate",
                  !date && "text-muted-foreground",
                )}
              />
            }
          >
            <IconCalendar className="mr-2 size-4 shrink-0" />
            {displayText}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
            />
          </PopoverContent>
        </Popover>

        {!allDay && (
          <div className="flex items-center gap-1">
            <IconClock className="size-4 text-muted-foreground shrink-0" />
            <Select value={hours} onValueChange={handleHourChange}>
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem
                    key={h.value}
                    value={h.value}
                    disabled={isTimeDisabled(parseInt(h.value), parseInt(minutes))}
                  >
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select value={minutes} onValueChange={handleMinuteChange}>
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    disabled={isTimeDisabled(parseInt(hours), parseInt(m.value))}
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

export function AllDayToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="all-day" checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <label htmlFor="all-day" className="text-sm font-medium leading-none cursor-pointer">
        All day event
      </label>
    </div>
  );
}
