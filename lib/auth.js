import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDb } from "@/config/db.config";
import bcrypt from "bcryptjs";
import User from "@/models/user.model";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        try {
          await connectDb();
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error("No user found with this email");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error("Invalid password");
          }

          return { id: user._id.toString(), email: user.email }; //changed here
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || user._id.toString(); //changed here
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      if (account.provider === "google" || account.provider === "github") {
        try {
          await connectDb();

          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // If user doesn't exist, create a new one
            const newUser = new User({
              email: user.email || "",
              name: user.name,
              provider: account.provider,  // Storing the provider type (Google/GitHub)
              providerId: profile.id,     // Storing the provider's unique ID
            });
            await newUser.save();
            user.id = newUser._id.toString();
          } else {
            // User already exists
            user.id = existingUser._id.toString();
          }
          return true; // User creation or check successful, proceed with sign-in
        } catch (error) {
          console.error("Error saving user:", error);
          return false; // Prevent sign-in if an error occurs
        }
      }

      return true; // Allow sign-in for credential-based logins
    },
  },
  
  pages: {
    signIn: "/auth/login",  // Custom login page URL
    error: "/auth/login",   // Error handling page URL
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
