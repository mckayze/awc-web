"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { Container } from "./Container";

type NavLink = {
	label: string;
	href: string;
};

type NavbarProps = {
	leftLinks: NavLink[];
	rightLinks: NavLink[];
	logo?: React.ReactNode;
};

export function Navbar({ leftLinks, rightLinks, logo = "A Woman's Confidence" }: NavbarProps) {
	const [open, setOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [visible, setVisible] = useState(true);
	const [query, setQuery] = useState("");
	const navRef = useRef<HTMLElement>(null);
	const lastScrollY = useRef(0);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const allLinks = [...leftLinks, ...rightLinks];
	const router = useRouter();

	function handleSearch() {
		if (!query.trim()) return;
		router.push(`/blog?q=${encodeURIComponent(query.trim())}`);
		setSearchOpen(false);
		setQuery("");
	}

	// Lock body scroll when menu or search is open
	useEffect(() => {
		document.body.style.overflow = open || searchOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open, searchOpen]);

	// Focus input when search opens
	useEffect(() => {
		if (searchOpen) {
			setTimeout(() => searchInputRef.current?.focus(), 50);
		}
	}, [searchOpen]);

	// Close search on ESC
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setSearchOpen(false);
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, []);

	// Hide navbar on scroll down, show on scroll up
	useEffect(() => {
		const handleScroll = () => {
			if (open) return;
			const currentScrollY = window.scrollY;
			const navHeight = navRef.current?.offsetHeight ?? 0;

			if (currentScrollY < navHeight) {
				setVisible(true);
			} else {
				setVisible(currentScrollY < lastScrollY.current);
			}

			lastScrollY.current = currentScrollY;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [open]);

	useEffect(() => {
		if (open) setVisible(true);
	}, [open]);

	return (
		<>
			<nav
				ref={navRef}
				className={`bg-background border-b border-border fixed top-0 left-0 right-0 z-40 py-4 transition-transform duration-300 ${visible ? "translate-y-0" : "-translate-y-full"}`}
			>
				<Container>
					{/* Desktop layout */}
					<div className="hidden md:flex items-center justify-between py-4">
						<div className="flex items-center gap-12">
							{leftLinks.map((link) => (
								<Link
									key={link.label}
									href={link.href}
									className="text-[20px] font-medium text-zinc-700 hover:text-body"
								>
									{link.label}
								</Link>
							))}
						</div>

						<Link
							href="/"
							className="text-[40px] font-bold text-slate-950 px-4 leading-none"
							style={{ fontFamily: "var(--font-title)" }}
						>
							{logo}
						</Link>

						<div className="flex items-center gap-12">
							{rightLinks.map((link) =>
								link.label.toLowerCase() === "search" ? (
									<button
										key={link.label}
										onClick={() => setSearchOpen(true)}
										className="text-[20px] font-medium text-zinc-700 hover:text-body cursor-pointer"
									>
										{link.label}
									</button>
								) : (
									<Link
										key={link.label}
										href={link.href}
										className="text-[20px] font-medium text-zinc-700 hover:text-body"
									>
										{link.label}
									</Link>
								),
							)}
						</div>
					</div>

					{/* Mobile layout — icons take their natural width, logo gets the rest.
					    grid-cols-3 squashed the logo into a third of the viewport. */}
					<div className="md:hidden grid grid-cols-[auto_1fr_auto] items-center gap-1 py-4">
						<button
							className="justify-self-start p-2"
							onPointerDown={() => setOpen(!open)}
							aria-label="Toggle menu"
						>
							{open ? (
								<X size={28} strokeWidth={2} className="text-body" />
							) : (
								<Menu size={28} strokeWidth={2} className="text-body" />
							)}
						</button>

						<Link
							href="/"
							className="justify-self-center text-lg sm:text-2xl font-bold text-slate-950 text-center bg-brand px-2 py-1 leading-tight font-title whitespace-nowrap"
						>
							{logo}
						</Link>

						<button
							className="justify-self-end p-2"
							aria-label="Search"
							onClick={() => setSearchOpen(true)}
						>
							<Search size={28} strokeWidth={2} className="text-body" />
						</button>
					</div>
				</Container>

				{/* Mobile menu */}
				{open &&
					createPortal(
						<div
							className="md:hidden bg-nav fixed inset-x-0 bottom-0 z-50 overflow-y-auto"
							style={{ top: navRef.current?.offsetHeight ?? 0 }}
						>
							<Container>
								<div className="flex flex-col py-4">
									{allLinks.map((link) => (
										<Link
											key={link.label}
											href={link.href}
											className="text-[28px] font-medium text-body hover:text-black py-3 border-b border-body/10 last:border-0"
											onClick={() => setOpen(false)}
										>
											{link.label}
										</Link>
									))}
								</div>
							</Container>
						</div>,
						document.body,
					)}
			</nav>

			{/* Search overlay */}
			{searchOpen &&
				createPortal(
					<div className="fixed inset-0 z-50 bg-white animate-fade-in">
						<div className="absolute inset-0 bg-brand/20">
							{/* Close button — absolutely positioned, outside the column */}
							<button
								onClick={() => setSearchOpen(false)}
								className="absolute top-6 right-4 sm:right-8 text-body hover:text-black transition-colors cursor-pointer"
								aria-label="Close search"
							>
								<X size={28} strokeWidth={2} />
							</button>

							{/* Centered content */}
							<div className="flex items-center justify-center w-full h-full px-4 sm:px-8">
								<div className="flex flex-col gap-8 w-full max-w-3xl">
									<h2 className="text-5xl md:text-7xl text-slate-950 text-center font-title">
										Search the blog
									</h2>
									<form
										onSubmit={(e) => {
											e.preventDefault();
											handleSearch();
										}}
									>
										<div className="relative border border-border rounded-md overflow-hidden">
											<Search
												size={20}
												className="absolute left-4 top-1/2 -translate-y-1/2 text-black pointer-events-none"
											/>
											<input
												ref={searchInputRef}
												type="text"
												value={query}
												onChange={(e) => setQuery(e.target.value)}
												placeholder="Search..."
												className="w-full bg-white pl-12 pr-4 min-h-14 text-lg text-body placeholder:text-body/40 focus:outline-none shadow-[0_0_8px_-3px_rgba(0,0,0,0.2)]"
											/>
										</div>
									</form>
								</div>
							</div>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
