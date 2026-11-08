"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { Loader2, UserPlus } from "lucide-react";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "account-created") {
      setSuccess("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else {
        router.push("/profile");
        router.refresh();
      }
    } catch (error) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      <Header>
        <Link href="/signup">
          <Button variant="ghost">
            <UserPlus className="w-4 h-4 mr-2" />
            Créer un compte
          </Button>
        </Link>
      </Header>
      
      <main className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[80vh]">
        <div className="w-full max-w-md glass-effect p-8 rounded-2xl border border-dark-gray">
          <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>
          
          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                placeholder="test@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-gray rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                placeholder="password123"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>
              Pas encore de compte ?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500 border-t border-dark-gray pt-4">
            <p className="font-medium mb-1">Compte de test :</p>
            <p>Email: test@example.com</p>
            <p>Password: password123</p>
          </div>
        </div>
      </main>
    </div>
  );
}
