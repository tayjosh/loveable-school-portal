"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import logo from "@/assets/logo.png";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui-components/controls/form";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  signInSchema,
  type SignInFormValues,
} from "@/features/auth/components/SignInValidationSchema";

export default function SignInPage() {
  const router = useRouter();
  const { membership, loading, signIn } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && membership) router.replace("/dashboard");
  }, [membership, loading, router]);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setBusy(true);
    const res = await signIn(values.email, values.password);
    setBusy(false);
    if (!res.ok) {
      toast.error("Sign in failed", { description: res.message });
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 p-8">
          <div className="space-y-2 text-center">
            <Image src={logo} alt="AviHire" className="mx-auto h-10 w-auto" priority />
            <h1 className="text-2xl font-semibold text-[#1E3A5F]">School Portal</h1>
            <p className="text-sm text-slate-500">
              Sign in with your partner school admin account.
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-[#1E3A5F]" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
