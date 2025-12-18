import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import codect from "bcryptjs"; // Changed import to avoid namespace collision issues if any, usually import { compare } is fine but let's be safe or just use destructured.
import { compare } from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        await connectToDatabase();

        const user = await User.findOne({
          username: credentials.username as string,
        });

        if (!user) {
          throw new Error("User not found.");
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
        };
      },
    }),
  ],
});

