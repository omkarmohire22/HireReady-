import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

// Server-side: needs full absolute URL to reach FastAPI directly
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000/api";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${BACKEND_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: token.email,
              name: token.name,
              avatar_url: token.picture,
              google_id: account.providerAccountId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.access_token;
          } else {
            console.error("Backend google auth failed:", await res.text());
          }
        } catch (err) {
          console.error("Backend google sync error:", err);
        }
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).backendToken = token.backendToken ?? null;
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  secret: process.env.NEXTAUTH_SECRET || "hireready_super_secret_key_change_this_in_production_32chars",
  debug: true,
  logger: {
    error(code, metadata) {
      console.error("NEXTAUTH_ERROR:", code, metadata);
      try {
        require("fs").appendFileSync(
          "nextauth-error.log",
          JSON.stringify({ code, metadata, time: new Date().toISOString() }, null, 2) + "\n"
        );
      } catch(e) {}
    },
    warn(code) { console.warn("NEXTAUTH_WARN:", code); },
    debug(code, metadata) { console.log("NEXTAUTH_DEBUG:", code, metadata); }
  }
};

export default NextAuth(authOptions);
