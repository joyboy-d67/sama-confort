"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { Loader2, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la création du compte");
      }

      // Success - redirect to login
      router.push("/login?success=account-created");
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      <Header>
        <Link href="/login">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Connexion
          </Button>
        </Link>
      </Header>

      <main className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[80vh]">
        <div className="w-full max-w-md glass-effect p-8 rounded-2xl border border-dark-gray">
          <h1 className="text-2xl font-bold mb-6 text-center">Créer un compte</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Prénom <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                  placeholder="Jean"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nom <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email <span className="text-primary">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                placeholder="jean.dupont@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Téléphone <span className="text-primary">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                pattern="^(\+33|0)[1-9](\d{2}){4}$"
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                placeholder="+33 6 12 34 56 78"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: +33 6 12 34 56 78 ou 06 12 34 56 78</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mot de passe <span className="text-primary">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                placeholder="Min. 6 caractères"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Confirmer le mot de passe <span className="text-primary">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                placeholder="Confirmez votre mot de passe"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Créer mon compte"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
