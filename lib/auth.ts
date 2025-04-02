import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "./db";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Adapter } from "next-auth/adapters";
import { accounts, SelectSchool, sessions, users, verificationTokens } from "./schema";
import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@school.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email)
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
          role: user.role
        };
      }
    })
  ],
  pages: {
    signIn: `/login`,
    verifyRequest: `/login`,
    error: "/login", // Error code passed in query string as ?error=
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
        domain: VERCEL_DEPLOYMENT
          ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
          : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.user = user;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        // @ts-expect-error
        id: token.sub,
        // @ts-expect-error
        role: token?.user?.role || "user",
        // @ts-expect-error
        username: token?.user?.username,
      };
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions) as Promise<{
    user: {
      id: string;
      name: string;
      username: string;
      email: string;
      image: string;
      role: string;
    };
  } | null>;
}

// Helper function to create a new user with hashed password
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: string = "user"
) {
  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  // Hash the password
  const hashedPassword = await hash(password, 10);

  // Create the user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      name,
      role,
    })
    .returning();

  return newUser;
}

export function withSiteAuth(action: any) {
  return async (
    formData: FormData | null,
    siteId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session) {
      return {
        error: "Not authenticated",
      };
    }

    const site = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.id, siteId),
    });

    if (!site || site.adminId !== session.user.id) {
      return {
        error: "Not authorized",
      };
    }

    return action(formData, site, key);
  };
}

export function withPostAuth(action: any) {
  return async (
    formData: FormData | null,
    postId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }

    const post = await db.query.schoolContent.findFirst({
      where: (posts, { eq }) => eq(posts.id, postId),
      with: {
        school: true,
      },
    });

    if (!post || post.authorId !== session.user.id) {
      return {
        error: "Content not found",
      };
    }

    return action(formData, post, key);
  };
}

export function withAdminAuth(action: any) {
  return async (formData: FormData | null, id?: string) => {
    const session = await getSession();
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }

    if (session.user.role !== "admin") {
      return {
        error: "Not authorized - Admin access required",
      };
    }

    return action(formData, id, session);
  };
}

export function withSchoolAuth(action: any) {
  return async (formData: FormData | null, school: SelectSchool, key: string | null) => {
    const session = await getSession();
    console.log({"User":session?.user})
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }
    console.log({"TYPE OF =": typeof(school)})
    console.log({"school ID": school.id})
    console.log({school})
    console.log({key})
    console.log({formData})
    if (school.adminId !== session.user.id) {
      console.log({"School adminID": school.adminId, "userId": session.user.id})
      return {
        error: "Not authorized",
      };
    }

    return action(formData, school, key);
  };
}

export function withStudentAuth(action: any) {
  return async (formData: FormData | null, student: any, key: string | null) => {
    const session = await getSession();
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }

    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.adminId, session.user.id),
    });

    if (!school || student.schoolId !== school.id) {
      return {
        error: "Not authorized",
      };
    }

    return action(formData, student, key);
  };
}

export function withStaffAuth(action: any) {
  return async (formData: FormData | null, staffMember: any, key: string | null) => {
    const session = await getSession();
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }

    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.adminId, session.user.id),
    });

    if (!school || staffMember.schoolId !== school.id) {
      return {
        error: "Not authorized",
      };
    }

    return action(formData, staffMember, key);
  };
}

export function withClassAuth(action: any) {
  return async (formData: FormData | null, classData: any, key: string | null) => {
    const session = await getSession();
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }

    const school = await db.query.schools.findFirst({
      where: (schools, { eq }) => eq(schools.adminId, session.user.id),
    });

    if (!school || classData.schoolId !== school.id) {
      return {
        error: "Not authorized",
      };
    }

    return action(formData, classData, key);
  };
}