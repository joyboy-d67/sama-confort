import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/Header";

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-dark">
      <Header>
        <Link href="/">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
      </Header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Nos Tarifs</h1>
          <p className="text-xl text-gray-400 mb-12">
            Des prix transparents et compétitifs pour tous vos trajets
          </p>

          <div className="space-y-8">
            <Card variant="glass">
              <h2 className="text-3xl font-semibold mb-6">Tarification Simple</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Trajets courts (moins de 10km)</h3>
                    <p className="text-gray-400 mb-2">Forfait unique de 13€</p>
                    <p className="text-sm text-gray-500">
                      Idéal pour vos déplacements rapides en ville
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Trajets moyens et longs (plus de 10km)</h3>
                    <p className="text-gray-400 mb-2">1,35€ par kilomètre</p>
                    <p className="text-sm text-gray-500">
                      Prix dégressif pour vos longs trajets
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card variant="glass">
              <h2 className="text-3xl font-semibold mb-6">Exemples de Tarifs</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-dark-gray">
                  <span className="text-gray-300">Trajet de 5 km</span>
                  <span className="text-xl font-bold text-primary">13,00 €</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dark-gray">
                  <span className="text-gray-300">Trajet de 15 km</span>
                  <span className="text-xl font-bold text-primary">20,25 €</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dark-gray">
                  <span className="text-gray-300">Trajet de 30 km</span>
                  <span className="text-xl font-bold text-primary">40,50 €</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-300">Trajet de 50 km</span>
                  <span className="text-xl font-bold text-primary">67,50 €</span>
                </div>
              </div>
            </Card>

            <Card variant="glass">
              <h2 className="text-3xl font-semibold mb-6">Ce qui est inclus</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Véhicule confortable et climatisé",
                  "Chauffeur professionnel et courtois",
                  "Assistance bagages",
                  "Eau et rafraîchissements",
                  "Chargeurs téléphone",
                  "WiFi à bord",
                  "Paiement par carte ou espèces",
                  "Assurance tous risques",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="text-center pt-8">
              <Link href="/reserver">
                <Button size="lg">Réserver maintenant</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
