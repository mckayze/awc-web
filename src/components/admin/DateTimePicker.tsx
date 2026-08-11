"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { twMerge } from "@/lib/twMerge";

// An inline date + time picker themed to the admin palette. Drop-in replacement
// for <input type="datetime-local">: value/onChange use the same local
// "YYYY-MM-DDTHH:mm" string format.
export function DateTimePicker({
	value,
	onChange,
	placeholder = "Pick a date & time",
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const selected = useMemo(() => parseLocalInput(value), [value]);
	// Calendar month currently on screen. Follows the selected date when present.
	const [view, setView] = useState(() => startOfMonth(selected ?? new Date()));

	useEffect(() => {
		if (open) setView(startOfMonth(selected ?? new Date()));
	}, [open, selected]);

	useEffect(() => {
		if (!open) return;
		function onDown(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	// Every edit works off the current selection (or now, on first touch) so the
	// other half of the timestamp is preserved.
	function pickDay(day: Date) {
		const base = selected ?? new Date();
		const next = new Date(day);
		next.setHours(base.getHours(), base.getMinutes(), 0, 0);
		onChange(toLocalInput(next));
	}

	function setTime(hours: number, minutes: number) {
		const next = new Date(selected ?? new Date());
		next.setHours(hours, minutes, 0, 0);
		onChange(toLocalInput(next));
	}

	const time = selected ?? new Date();
	const cells = useMemo(() => monthCells(view), [view]);
	const viewMonth = view.getMonth();

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="border-border flex min-h-11 w-full items-center justify-between gap-2 border bg-white px-3 py-1.5 text-left text-sm"
			>
				<span className={selected ? "text-body" : "text-body/40"}>
					{selected ? displayLabel(selected) : placeholder}
				</span>
				<Calendar className="text-body/50 h-4 w-4 shrink-0" aria-hidden="true" />
			</button>

			{open && (
				<div className="border-border absolute z-30 mt-1 w-72 border bg-white p-3 shadow-lg">
					{/* Month header */}
					<div className="flex items-center justify-between">
						<button
							type="button"
							aria-label="Previous month"
							onClick={() => setView(addMonths(view, -1))}
							className="hover:bg-nav text-body/60 flex h-7 w-7 items-center justify-center"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<span className="text-body text-sm font-medium">
							{view.toLocaleString("en-GB", { month: "long", year: "numeric" })}
						</span>
						<button
							type="button"
							aria-label="Next month"
							onClick={() => setView(addMonths(view, 1))}
							className="hover:bg-nav text-body/60 flex h-7 w-7 items-center justify-center"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>

					{/* Weekday row */}
					<div className="text-body/40 mt-2 grid grid-cols-7 text-center text-xs">
						{WEEKDAYS.map((d) => (
							<span key={d} className="py-1">
								{d}
							</span>
						))}
					</div>

					{/* Days */}
					<div className="grid grid-cols-7">
						{cells.map((day) => {
							const inMonth = day.getMonth() === viewMonth;
							const isSelected = selected != null && isSameDay(day, selected);
							const isToday = isSameDay(day, new Date());
							return (
								<button
									key={day.toISOString()}
									type="button"
									onClick={() => pickDay(day)}
									className={twMerge(
										"flex h-9 items-center justify-center text-sm",
										inMonth ? "text-body" : "text-body/30",
										!isSelected && "hover:bg-nav",
										isToday && !isSelected && "text-brand-dark font-medium",
										isSelected && "bg-body font-medium text-white",
									)}
								>
									{day.getDate()}
								</button>
							);
						})}
					</div>

					{/* Time */}
					<div className="border-border mt-3 flex items-center gap-2 border-t pt-3">
						<Clock className="text-body/50 h-4 w-4 shrink-0" aria-hidden="true" />
						<select
							aria-label="Hour"
							value={time.getHours()}
							onChange={(e) => setTime(Number(e.target.value), time.getMinutes())}
							className="border-border text-body border bg-white px-2 py-1 text-sm focus:outline-none"
						>
							{HOURS.map((h) => (
								<option key={h} value={h}>
									{pad(h)}
								</option>
							))}
						</select>
						<span className="text-body/50">:</span>
						<select
							aria-label="Minute"
							value={time.getMinutes()}
							onChange={(e) => setTime(time.getHours(), Number(e.target.value))}
							className="border-border text-body border bg-white px-2 py-1 text-sm focus:outline-none"
						>
							{MINUTES.map((m) => (
								<option key={m} value={m}>
									{pad(m)}
								</option>
							))}
						</select>
						<button
							type="button"
							onClick={() => onChange(toLocalInput(new Date()))}
							className="hover:bg-nav text-body/60 ml-auto px-2 py-1 text-xs"
						>
							Now
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const pad = (n: number) => String(n).padStart(2, "0");

function parseLocalInput(value: string): Date | null {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

function toLocalInput(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
}

function displayLabel(d: Date): string {
	return d.toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function startOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
	return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

// Full weeks (Monday-first) covering the month, padded with adjacent-month days.
function monthCells(view: Date): Date[] {
	const year = view.getFullYear();
	const month = view.getMonth();
	const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const cells: Date[] = [];
	for (let i = startOffset; i > 0; i--) cells.push(new Date(year, month, 1 - i));
	for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
	let next = 1;
	while (cells.length % 7 !== 0) cells.push(new Date(year, month + 1, next++));
	return cells;
}
