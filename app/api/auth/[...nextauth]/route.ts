import NextAuth, { AuthOptions, Session, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";

interface Credentials {
  email: string;
  password: string;
}

interface CustomUser extends AdapterUser {
  role: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface CustomToken extends JWT {
  role?: string;
  id?: string;
}

interface CustomSession extends Session {
  user: {
    id?: string;
    role?: string;
    name?: string | null;
    email?: string | null;
  };
}

// Define cookie settings for different environments
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;
const cookiePrefix = useSecureCookies ? '__Secure-' : '';
const hostName = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000').hostname;

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"email" | "password", string> | undefined): Promise<any> {
        try {
          await connectDB();
          const { email, password } = credentials ?? {};
          if (!email || !password)
            throw new Error("Email and password are required.");
          const user = await User.findOne({ email }).select("+password +role");
          if (!user) throw new Error("Invalid email or password.");
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) throw new Error("Invalid email or password.");
          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.firstName + " " + user.lastName,
          };
        } catch (err: any) {
          throw new Error(err.message || "Internal server error");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // CSRF protection
        path: '/',
        secure: useSecureCookies,
        domain: hostName === 'localhost' ? undefined : '.' + hostName // Include subdomains for production
      }
    }
  },
  callbacks: {
    async jwt({ token, user }: { token: CustomToken; user?: any }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      // Ensure session.user exists
      session.user = session.user || {};
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
      }
      return session;
      return session;
    },
    async signIn({
      user,
      account,
      profile,
      email,
      credentials,
    }: {
      user?: NextAuthUser;
      account?: any;
      profile?: any;
      email?: any;
      credentials?: Record<string, unknown>;
    }) {
      // Optionally add more checks here
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
