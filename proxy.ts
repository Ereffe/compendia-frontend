import { withAuth } from "next-auth/middleware";

export default withAuth({
	callbacks: {
		authorized: ({ token }) => Boolean(token?.accessToken) && token?.error !== "RefreshAccessTokenError",
	},
	pages: {
		signIn: "/",
	},
});

export const config = {
	matcher: ["/((?!$|login(?:/|$)|session-expired(?:/|$)|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
