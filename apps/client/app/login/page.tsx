"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers/auth-provider";
import { loginSchema, type LoginInput } from "@taskflow/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading: authLoading } = useAuth();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const onSubmit = async (data: LoginInput) => {
    setServerError("");
    try {
      await login(data);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setServerError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to sign in. Please check your credentials."
        );
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-foreground">
            <CheckCircle2 className="size-7 text-primary" />
            <span>TaskFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Track tasks and monitor your productive time in real time
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in with your email and password to access your dashboard
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {serverError && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium">
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isSubmitting}
                  autoFocus
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full font-medium cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setValue("email", "johndoe@test.com", { shouldValidate: true });
                  setValue("password", "Test@1234", { shouldValidate: true });
                }}
                className="w-full py-1.5 px-2 rounded-lg border border-dashed border-border/80 bg-muted/30 hover:bg-muted/70 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-center"
              >
                Evaluating project? <span className="font-semibold text-foreground underline underline-offset-2">Auto-fill demo credentials</span>
              </button>

              <div className="text-center text-sm text-muted-foreground pt-1">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
