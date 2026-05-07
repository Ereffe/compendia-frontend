import { withAuth } from "next-auth/middleware";

export default withAuth({
	callbacks: {
		authorized: ({ token }) => Boolean(token?.accessToken),
	},
	pages: {
		signIn: "/",
	},
});

export const config = {
	matcher: [
		"/((?!$|api/auth|_next/static|_next/image|favicon.ico).*)",
	],
};
