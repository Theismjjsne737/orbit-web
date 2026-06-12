import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  // Apple requires an Apple Developer account ($99/year).
  // Set APPLE_ID and APPLE_SECRET env vars to enable it.
  // See: https://authjs.dev/getting-started/providers/apple
  ...(process.env.APPLE_ID
    ? [Apple({ clientId: process.env.APPLE_ID!, clientSecret: process.env.APPLE_SECRET! })]
    : []),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async session({ session }) {
      return session;
    },
  },
});
