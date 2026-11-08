import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/Header";

export default function MentionsLegalesPage() {
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
          <h1 className="text-5xl font-bold mb-6">Mentions Légales</h1>
          <p className="text-gray-400 mb-12">Dernière mise à jour : novembre 2025</p>

          <div className="space-y-8">
            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Éditeur du site</h2>
              <div className="text-gray-300 space-y-2">
                <p><strong>Raison sociale :</strong> Sama Confort</p>
                <p><strong>Forme juridique :</strong> [À compléter]</p>
                <p><strong>Capital social :</strong> [À compléter]</p>
                <p><strong>Siège social :</strong> [Adresse à compléter]</p>
                <p><strong>SIRET :</strong> [Numéro à compléter]</p>
                <p><strong>Email :</strong> afatahallah84@gmail.com</p>
                <p><strong>Téléphone :</strong> +33 6 49 09 56 66</p>
              </div>
            </Card>

            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Directeur de publication</h2>
              <p className="text-gray-300">[Nom du directeur de publication]</p>
            </Card>

            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Hébergement</h2>
              <div className="text-gray-300 space-y-2">
                <p><strong>Hébergeur :</strong> [Nom de l'hébergeur]</p>
                <p><strong>Adresse :</strong> [Adresse de l'hébergeur]</p>
              </div>
            </Card>

            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Propriété intellectuelle</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés.
                </p>
                <p>
                  Les éléments graphiques, textuels, logiciels et tout autre contenu du site sont la propriété exclusive de Sama Confort. Toute reproduction, représentation, utilisation ou adaptation, sous quelque forme que ce soit, est interdite sans l'autorisation écrite préalable de Sama Confort.
                </p>
              </div>
            </Card>

            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Responsabilité</h2>
              <div className="text-gray-300 space-y-3">
                <p>
                  Sama Confort ne pourra être tenu responsable des dommages directs et indirects causés au matériel de l'utilisateur, lors de l'accès au site, et résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications, soit de l'apparition d'un bug ou d'une incompatibilité.
                </p>
                <p>
                  Sama Confort ne pourra également être tenu responsable des dommages indirects consécutifs à l'utilisation du site.
                </p>
              </div>
            </Card>

            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Liens hypertextes</h2>
              <p className="text-gray-300">
                Des liens hypertextes peuvent être présents sur le site. L'utilisateur est informé qu'en cliquant sur ces liens, il sortira du site Sama Confort. Ce dernier n'a pas de contrôle sur les pages web vers lesquelles ces liens renvoient et ne saurait être responsable de leur contenu.
              </p>
            </Card>

            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Droit applicable et juridiction</h2>
              <p className="text-gray-300">
                Tout litige en relation avec l'utilisation du site Sama Confort est soumis au droit français. Il est fait attribution exclusive de juridiction aux tribunaux compétents de Paris.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
