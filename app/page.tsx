import Link from "next/link";
import { Car, Calendar, Shield, Clock, Zap } from "lucide-react";
import Button from "@/components/ui/Button";
import Header from "@/components/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
            Votre chauffeur privé en quelques clics
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8 text-balance">
            Service VTC professionnel, ponctuel et confortable. Réservez jusqu'à 3 mois à l'avance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reserver">
              <Button size="lg" className="w-full sm:w-auto">
                Réserver maintenant
              </Button>
            </Link>
            <Link href="/course-immediate">
              <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2 border-yellow-500 text-yellow-400 hover:bg-yellow-600/10">
                <Zap className="w-4 h-4" />
                Course en direct
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 border-t border-dark-gray">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-effect rounded-2xl p-6 hover:bg-dark-anthracite transition">
            <Calendar className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Réservation flexible</h3>
            <p className="text-gray-400">
              Réservez jusqu'à 3 mois à l'avance avec des créneaux horaires personnalisés
            </p>
          </div>
          <div className="glass-effect rounded-2xl p-6 hover:bg-dark-anthracite transition">
            <Clock className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ponctualité garantie</h3>
            <p className="text-gray-400">
              Service fiable avec confirmation immédiate et rappel avant le trajet
            </p>
          </div>
          <div className="glass-effect rounded-2xl p-6 hover:bg-dark-anthracite transition">
            <Shield className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sécurité maximale</h3>
            <p className="text-gray-400">
              Chauffeurs professionnels certifiés et véhicules régulièrement contrôlés
            </p>
          </div>
          <div className="glass-effect rounded-2xl p-6 hover:bg-dark-anthracite transition">
            <Car className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tarifs transparents</h3>
            <p className="text-gray-400">
              En plus des meilleurs tarifs du marché, bénéficiez de promotions régulières pour récompenser votre fidélité
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 border-t border-dark-gray">
        <div className="max-w-3xl mx-auto text-center glass-effect rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-4">Prêt à partir ?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Réservez votre prochain trajet en moins de 2 minutes
          </p>
          <Link href="/reserver">
            <Button size="lg">Réserver maintenant</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-gray mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">Sama Confort</span>
              </div>
              <p className="text-gray-400">
                Service de réservation de chauffeur VTC professionnel
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/reserver" className="hover:text-primary transition">
                    Réserver
                  </Link>
                </li>
                <li>
                  <Link href="/tarifs" className="hover:text-primary transition">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-primary transition">
                    Services
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Informations</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/faq" className="hover:text-primary transition">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="hover:text-primary transition">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="/cgu" className="hover:text-primary transition">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="hover:text-primary transition">
                    Confidentialité
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: afatahallah84@gmail.com</li>
                <li>Tél: +33 6 49 09 56 66</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-dark-gray mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Sama Confort. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
