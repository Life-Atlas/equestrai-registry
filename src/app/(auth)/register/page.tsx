"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    preferred_lang: "en",
    farm_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          preferred_lang: form.preferred_lang,
          farm_name: form.farm_name,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a3a5c]">EquestRai</h1>
          <p className="mt-1 text-sm text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />

          <Input
            label="Farm / Stable Name"
            value={form.farm_name}
            onChange={(e) => update("farm_name", e.target.value)}
          />

          <Select
            label="Preferred Language"
            value={form.preferred_lang}
            onChange={(e) => update("preferred_lang", e.target.value)}
            options={[
              { value: "en", label: "English" },
              { value: "es", label: "Español" },
            ]}
          />

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-medium text-[#1a3a5c] hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
