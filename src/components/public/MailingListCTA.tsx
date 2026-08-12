"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";

export function MailingListCTA() {
	const [email, setEmail] = useState("");

	return (
		<div className="flex flex-col md:flex-row gap-12 items-center">
			{/* Left — content */}
			<div className="flex flex-col gap-12 flex-1">
				<div className="flex flex-col gap-3">
					<Heading as="h1" className="text-5xl font-bold text-black font-title">
						One letter, every Sunday. No noise.
					</Heading>
					<p className="text-xl text-black/70">
						A short note from the bathroom counter — what we&apos;re testing, what we&apos;re
						tossing, and the one thing worth your attention this week.
					</p>
				</div>
			</div>

			{/* Right  */}
			<div className="flex-1 flex flex-col justify-center">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						setEmail("");
					}}
					className="flex flex-col gap-2 sm:flex-row mb-2"
				>
					<Input
						type="email"
						placeholder="your@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="flex-1"
					/>
					<Button variant="dark" type="submit" className="sm:w-auto w-full">
						Subscribe
					</Button>
				</form>
				<p className="text-base text-black/50 text-center">
					Unsubscribe anytime. We&apos;ll never sell your address — we don&apos;t even like ours.
				</p>
			</div>
		</div>
	);
}
