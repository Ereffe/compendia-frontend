import { withAuth } from "next-auth/middleware";

// Next 16 renamed the `middleware` file convention to `proxy`.
export default withAuth({
	callbacks: {
		authorized: ({ token }) => Boolean(token?.accessToken) && token?.error !== "RefreshAccessTokenError",
	},
	pages: {
		signIn: "/",
	},
});

export const config = {
	// Public: landing page ("/"), /login, /session-expired, next-auth endpoints and static assets.
	matcher: ["/((?!$|login(?:/|$)|session-expired(?:/|$)|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
