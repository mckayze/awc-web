import type { Metadata } from "next";
import { DM_Sans, Roboto, Space_Grotesk } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
	subsets: ["latin"],
	weight: ["400", "500", "700"],
	variable: "--font-roboto",
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "700"],
	variable: "--font-dm-sans",
});

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	weight: ["400", "500", "700"],
	variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
	title: "AWC",
	description: "AWC",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${roboto.variable} ${dmSans.variable} ${spaceGrotesk.variable}`}>
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className="min-h-screen bg-background antialiased">{children}</body>
		</html>
	);
}
