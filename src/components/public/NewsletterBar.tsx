"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PROSE_WIDTH } from "@/lib/layout";

export function NewsletterBar() {
	const [email, setEmail] = useState("");

	return (
		<div className={`flex flex-col gap-4 ${PROSE_WIDTH} mx-auto w-full`}>
			<p className="text-3xl text-black text-center font-title">
				Stay in the know — join the newsletter
			</p>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					setEmail("");
				}}
				className="flex flex-col sm:flex-row"
			>
				<Input
					type="email"
					placeholder="your@email.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className="flex-1"
				/>
				<Button
					variant="dark"
					rightIcon={<SendHorizontal size={16} />}
					className="-mt-px sm:mt-0 sm:-ml-px"
				>
					Subscribe
				</Button>
			</form>
			<p className="text-sm text-body/90 text-center">Don&apos;t worry, we won&apos;t spam you!</p>
		</div>
	);
}
