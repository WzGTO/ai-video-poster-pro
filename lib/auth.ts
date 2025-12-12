import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        refreshToken?: string;
        error?: string;
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
        error?: string;
    }
}

const config: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: [
                        "openid",
                        "email",
                        "profile",
                        "https://www.googleapis.com/auth/drive.file",
                        "https://www.googleapis.com/auth/drive.appdata",
                    ].join(" "),
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Initial sign in - save tokens from Google
            if (account) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    accessTokenExpires: account.expires_at
                        ? account.expires_at * 1000
                        : Date.now() + 3600 * 1000,
                };
            }

            // Return previous token if the access token has not expired yet
            if (Date.now() < (token.accessTokenExpires ?? 0)) {
                return token;
            }

            // Access token has expired, try to refresh it
            try {
                const response = await fetch("https://oauth2.googleapis.com/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        client_id: process.env.GOOGLE_CLIENT_ID!,
                        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                        grant_type: "refresh_token",
                        refresh_token: token.refreshToken!,
                    }),
                });

                const tokens = await response.json();

                if (!response.ok) {
                    throw tokens;
                }

                return {
                    ...token,
                    accessToken: tokens.access_token,
                    accessTokenExpires: Date.now() + tokens.expires_in * 1000,
                    // Keep the same refresh token
                    refreshToken: tokens.refresh_token ?? token.refreshToken,
                };
            } catch (error) {
                console.error("Error refreshing access token:", error);
                return {
                    ...token,
                    error: "RefreshAccessTokenError",
                };
            }
        },
        async session({ session, token }) {
            // Send encrypted access token to client
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.error = token.error;

            if (token.sub) {
                session.user.id = token.sub;
            }

            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
