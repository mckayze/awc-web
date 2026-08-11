// Replaces react-router's per-route `handle.title`, which TopBar read via
// `useMatches()`. Next has no equivalent, so titles live in one ordered list
// matched against the pathname — most specific first.
//
// Mirrors the old router table, so screens ported later already have a title.

const ROUTE_TITLES: [RegExp, string][] = [
	[/^\/admin\/?$/, "Dashboard"],
	[/^\/admin\/posts\/create\/?$/, "New post"],
	[/^\/admin\/posts\/[^/]+\/edit\/?$/, "Edit post"],
	[/^\/admin\/posts\/?$/, "Posts"],
	[/^\/admin\/pages\/[^/]+\/edit\/?$/, "Edit page"],
	[/^\/admin\/pages\/?$/, "Pages"],
	[/^\/admin\/categories\/create\/?$/, "New category"],
	[/^\/admin\/categories\/[^/]+\/edit\/?$/, "Edit category"],
	[/^\/admin\/categories\/?$/, "Categories"],
	[/^\/admin\/media\/?$/, "Media"],
	[/^\/admin\/comments\/?$/, "Comments"],
	[/^\/admin\/users\/create\/?$/, "New user"],
	[/^\/admin\/users\/[^/]+\/edit\/?$/, "Edit user"],
	[/^\/admin\/users\/?$/, "Users"],
	[/^\/admin\/settings\/?$/, "Settings"],
];

export function routeTitle(pathname: string): string {
	return ROUTE_TITLES.find(([pattern]) => pattern.test(pathname))?.[1] ?? "";
}
