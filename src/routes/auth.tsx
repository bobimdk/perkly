import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, defaultRouteForRole, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, User, Store, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";
import { signUpConfirmed } from "@/lib/signup.functions";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Perkly" },
      { name: "description", content: "Sign in or join Perkly — modern employee benefits marketplace." },
    ],
  }),
  validateSearch: searchSchema,
  component: AuthPage,
});

const ROLES: { value: Exclude<AppRole, "admin">; label: string; desc: string; icon: typeof User }[] = [
  { value: "employee", label: "Employee", desc: "I want to use perks at work", icon: User },
  { value: "employer", label: "Employer", desc: "I run benefits for a team", icon: Briefcase },
  { value: "provider", label: "Provider", desc: "I offer services & deals", icon: Store },
];

function AuthPage() {
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");

  useEffect(() => {
    if (!loading && user) {
      const target = search.redirect ?? defaultRouteForRole(roles[0], roles);
      navigate({ to: target, replace: true });
    }
  }, [user, loading, roles, navigate, search.redirect]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-warm-gradient">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="my-8 text-center">
          <div className="mx-auto mb-4 inline-block">
            <Logo size="lg" />
          </div>
          <h1 className="font-display text-3xl font-bold">Welcome to Perkly</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Benefits employees actually want.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to Perkly's Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot?
          </Link>
        </div>
        <PasswordInput id="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [role, setRole] = useState<AppRole>("employee");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signUpConfirmed({
        data: { email, password, firstName, lastName, phone, role },
      });
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      toast.success("Account created! You're in.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label className="mb-2 block">I am a…</Label>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                role === r.value
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <r.icon className={`h-5 w-5 ${role === r.value ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs font-medium">{r.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" /> Admins are added internally
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="fn">First name</Label>
          <Input id="fn" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ln">Last name</Label>
          <Input id="ln" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+355 …" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-pw">Password</Label>
        <PasswordInput id="su-pw" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Creating account…" : "Create my account"}
      </Button>
    </form>
  );
}
