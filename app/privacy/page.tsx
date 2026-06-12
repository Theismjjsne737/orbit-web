import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Orbit",
  description: "How Orbit handles your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-violet-400 hover:text-violet-300 mb-8 inline-block">
        ← Back to Orbit
      </Link>

      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-white/40 mb-10">Last updated: June 2026</p>

      <section className="space-y-8 text-white/70 leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">What Orbit is</h2>
          <p>
            Orbit is an AI subscription tracker. It helps you see what AI tools you're paying for,
            how often you use them, and what's worth keeping. Orbit is a client-side web app —
            your subscription data lives entirely on your device.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Data we collect</h2>
          <p>
            Orbit stores your subscription list, usage dates, and preferences in your browser's
            <code className="mx-1 px-1 rounded bg-white/10 text-white/90 text-sm">localStorage</code>.
            This data never leaves your device and is not sent to any server. Clearing your browser
            data or uninstalling the app permanently deletes it.
          </p>
          <p className="mt-3">
            When you sign in with Google or Apple, we receive your name and email address to
            identify your account session. We do not store this on our servers beyond what your
            OAuth provider manages.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Payments</h2>
          <p>
            Orbit uses <strong className="text-white">Stripe</strong> for Pro plan payments.
            Your card details are handled entirely by Stripe and never touch our servers.
            You can review Stripe's privacy policy at{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:underline"
            >
              stripe.com/privacy
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Cookies</h2>
          <p>
            Orbit uses session cookies only for authentication (Google/Apple OAuth). No tracking
            cookies. No analytics. No advertising.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Third-party services</h2>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Google OAuth — sign-in only</li>
            <li>Apple OAuth — sign-in only</li>
            <li>Stripe — payment processing for Pro plan</li>
          </ul>
          <p className="mt-3">
            We do not use Google Analytics, Meta Pixel, or any other behavioral tracking service.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Deleting your data</h2>
          <p>
            Because your subscription data is stored locally, you can delete it at any time by
            clearing your browser's localStorage for this site, or by using the "Delete all data"
            option in Orbit's settings. To revoke OAuth access, remove Orbit from your Google or
            Apple account's connected apps.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
          <p>
            Questions about this policy?{" "}
            <a
              href="mailto:privacy@orbitapp.io"
              className="text-violet-400 hover:underline"
            >
              privacy@orbitapp.io
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
