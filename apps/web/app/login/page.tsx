import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-neon-cyan">
          NeonForge Hub
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Sign in to manage your coder.
        </h1>
        <p className="mb-6 mt-3 text-sm leading-6 text-white/65">
          Your NeonKey, billing state, and remote CLI rules live behind your
          Supabase account.
        </p>
        <AuthForm />
      </div>
    </main>
  );
}
