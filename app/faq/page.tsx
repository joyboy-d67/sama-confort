import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/Header";

const faqs = [
  {
    question: "Comment réserver un trajet ?",
    answer:
      "Il vous suffit de cliquer sur 'Réserver' dans le menu, de renseigner vos informations, l'adresse de départ et d'arrivée, ainsi que la date et l'heure souhaitées. Vous recevrez une confirmation immédiate par email.",
  },
  {
    question: "Puis-je réserver à l'avance ?",
    answer:
      "Oui, vous pouvez réserver jusqu'à 3 mois à l'avance. C'est idéal pour planifier vos déplacements importants comme les rendez-vous médicaux, les aéroports, etc.",
  },
  {
    question: "Comment sont calculés les tarifs ?",
    answer:
      "Pour les trajets de moins de 10 km, nous appliquons un forfait de 13€. Au-delà de 10 km, le tarif est de 1,35€ par kilomètre. Le prix est calculé automatiquement lors de votre réservation.",
  },
  {
    question: "Puis-je annuler ou modifier ma réservation ?",
    answer:
      "Oui, vous pouvez annuler ou modifier votre réservation jusqu'à 24 heures avant le trajet sans frais. Passé ce délai, des frais d'annulation de 50% peuvent s'appliquer.",
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les paiements par carte bancaire (Visa, Mastercard), espèces, et virements. Le paiement peut être effectué à bord ou en ligne lors de la réservation.",
  },
  {
    question: "Les chauffeurs sont-ils certifiés ?",
    answer:
      "Oui, tous nos chauffeurs possèdent la carte professionnelle VTC obligatoire, un casier judiciaire vierge, et suivent régulièrement des formations. Ils sont également assurés pour le transport de personnes.",
  },
  {
    question: "Puis-je demander un chauffeur en particulier ?",
    answer:
      "Si vous avez déjà voyagé avec l'un de nos chauffeurs et souhaitez le même, vous pouvez le mentionner dans les notes lors de votre réservation. Nous ferons de notre mieux pour répondre à votre demande.",
  },
  {
    question: "Que se passe-t-il en cas de retard ?",
    answer:
      "Nos chauffeurs sont ponctuels et suivent le trafic en temps réel. En cas de retard de votre part, merci de nous prévenir. Une attente de 15 minutes est offerte, au-delà un supplément de 10€ par tranche de 15 minutes sera appliqué.",
  },
  {
    question: "Proposez-vous des trajets vers les aéroports ?",
    answer:
      "Oui, nous assurons les transferts aéroports 24h/24 et 7j/7. Nous suivons votre vol en temps réel pour nous adapter en cas de retard ou d'avance.",
  },
  {
    question: "Combien de passagers peuvent voyager ?",
    answer:
      "Nos véhicules standards peuvent accueillir jusqu'à 4 passagers avec bagages. Pour des groupes plus importants, contactez-nous pour des solutions adaptées.",
  },
];

export default function FAQPage() {
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
          <h1 className="text-5xl font-bold mb-6">Questions Fréquentes</h1>
          <p className="text-xl text-gray-400 mb-12">
            Trouvez rapidement les réponses à vos questions
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} variant="glass">
                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer list-none">
                    <h3 className="text-lg font-semibold pr-8">{faq.question}</h3>
                    <ChevronDown className="w-5 h-5 text-primary transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-gray-400 leading-relaxed">{faq.answer}</p>
                </details>
              </Card>
            ))}
          </div>

          <Card variant="glass" className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Vous ne trouvez pas votre réponse ?</h2>
            <p className="text-gray-400 mb-6">
              Notre équipe est disponible pour répondre à toutes vos questions
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="mailto:contact@vtc-booking.com">
                <Button variant="outline">Nous contacter par email</Button>
              </a>
              <a href="tel:+33123456789">
                <Button variant="outline">Appelez-nous</Button>
              </a>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
