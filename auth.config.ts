import type { NextAuthConfig } from "next-auth";

// This file must be edge-compatible (no Mongoose/Node.js specific imports) but shareable logic
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig;
