"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength (minimum 6 characters)
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Create user with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error("Auth error details:", authError);
        throw authError;
      }
      
      console.log("User creation successful:", data);

      // Show success message
      setSuccess(true);

      // After successful signup, redirect or show success message
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (error: unknown) {
      console.error("Signup error:", error);
      const errorWithMessage = error as { message?: string; details?: string };
      setError(errorWithMessage.message || errorWithMessage.details || "An error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            Account created successfully! Please check your email to verify your account.
            You will be redirected to the sign-in page shortly.
          </div>
        )}

        {!success && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  label="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                />

                <FormInput
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  label="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>

              <FormInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                label="Email address"
                value={formData.email}
                onChange={handleChange}
              />

              <FormInput
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                label="Password"
                helpText="Password must be at least 6 characters long"
                value={formData.password}
                onChange={handleChange}
              />

              <FormInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                label="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Create account
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}