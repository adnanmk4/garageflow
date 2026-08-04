"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { useAuthSubmit } from "@/lib/auth/useAuthSubmit";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const t = useTranslations("auth");
  const { submit, error, isSubmitting } = useAuthSubmit("/api/auth/login");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t("login")}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(submit)}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="03XXXXXXXXX"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-sm text-danger">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-danger">{errors.password.message}</p>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {t("loginButton")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-primary underline underline-offset-4">
              {t("signUpLink")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
