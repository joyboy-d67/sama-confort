import Link from "next/link";
import { Car, CheckCircle, Calendar, MapPin, Clock, Euro } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Réservation Confirmée !
          </h1>
          <p className="text-xl text-gray-400">
            Votre réservation a été enregistrée avec succès
          </p>
        </div>

        <Card variant="glass" className="mb-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-anthracite rounded-full">
              <span className="text-gray-400">Numéro de réservation:</span>
              <span className="font-mono font-semibold text-primary">
                #{id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <p className="text-gray-300 leading-relaxed">
              Un email de confirmation a été envoyé à notre équipe.
              <br />
              Vous recevrez une confirmation définitive dans les plus brefs délais.
            </p>
          </div>
        </Card>

        <Card variant="glass" className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Prochaines étapes
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Confirmation de la réservation</h3>
                <p className="text-sm text-gray-400">
                  Notre équipe va vérifier votre réservation et vous envoyer une confirmation par email
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Rappel avant le trajet</h3>
                <p className="text-sm text-gray-400">
                  Vous recevrez un rappel 24h avant votre trajet avec les coordonnées de votre chauffeur
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Jour du trajet</h3>
                <p className="text-sm text-gray-400">
                  Votre chauffeur vous attendra à l'adresse indiquée à l'heure prévue
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Informations importantes</h2>
          <div className="space-y-3 text-gray-300">
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Vous pouvez annuler ou modifier votre réservation jusqu'à 24h avant le trajet sans frais
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Votre chauffeur vous attendra 15 minutes gratuitement en cas de retard
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Pour toute question, n'hésitez pas à nous contacter au +33 6 49 09 56 66
              </span>
            </p>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              Retour à l'accueil
            </Button>
          </Link>
          <Link href="/reserver">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Nouvelle réservation
            </Button>
          </Link>
        </div>

        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Des questions ? Contactez-nous</p>
          <div className="flex justify-center gap-6 mt-2">
            <a href="mailto:contact@vtc-booking.com" className="hover:text-primary transition">
              Email
            </a>
            <a href="tel:+33123456789" className="hover:text-primary transition">
              Téléphone
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
