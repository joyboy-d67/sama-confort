# Guide de Test - Fonctionnalité Course Immédiate

## ✅ Fonctionnalités Implémentées

### Backend
- ✅ Modèle LiveRide dans Prisma avec tous les champs nécessaires
- ✅ API POST `/api/live-rides` - Créer une demande de course
- ✅ API GET `/api/live-rides` - Lister les courses (pour chauffeur)
- ✅ API PATCH `/api/live-rides/[id]/accept` - Chauffeur accepte la course
- ✅ API PATCH `/api/live-rides/[id]/location` - Mise à jour position chauffeur
- ✅ SSE `/api/live-rides/stream/driver` - Notifications chauffeur
- ✅ SSE `/api/live-rides/stream/client` - Notifications client

### Frontend
- ✅ Page `/course-immediate` - Interface de demande
- ✅ Composant `LiveRideRequest` - Gestion état de la course
- ✅ Composant `DriverLiveRidePanel` - Panneau chauffeur
- ✅ Animation d'attente avec pulse effect
- ✅ Bouton "Course immédiate" dans le header (utilisateurs connectés)
- ✅ Intégration dans le dashboard chauffeur

## 🧪 Comment Tester

### 1. Prérequis
```bash
# Le serveur doit être lancé
npm run dev

# Vérifier que la base est à jour
npx prisma migrate dev
```

### 2. Créer un compte client
1. Aller sur http://localhost:3000/signup
2. Créer un compte avec email/mot de passe
3. Se connecter

### 3. Tester la demande de course (Client)
1. Cliquer sur le bouton jaune "⚡ Course immédiate" dans le header
2. Entrer une adresse de départ (ex: "Place Kléber, Strasbourg")
3. Optionnel: Entrer une destination
4. Cliquer sur "Demander une course"
5. Observer l'animation d'attente avec le message "Recherche d'un chauffeur disponible..."

### 4. Tester la notification chauffeur
1. Ouvrir un nouvel onglet (ou navigateur privé)
2. Aller sur http://localhost:3000/admin/chauffeur
3. Observer l'apparition d'une notification rouge en bas à droite
4. Cliquer sur la notification pour voir le panneau avec les détails:
   - Nom et téléphone du client
   - Adresse de départ
   - Destination (si fournie)
   - Boutons "Accepter" / "Refuser"

### 5. Tester l'acceptation
1. En tant que chauffeur, cliquer sur "Accepter"
2. Retourner dans l'onglet client
3. Observer que l'interface change et affiche:
   - "🚗 Chauffeur en route"
   - Les adresses de départ/destination
   - Message "Position du chauffeur mise à jour en temps réel"

### 6. Tester les SSE (Temps Réel)
**Client → Chauffeur:**
- Ouvrir la console navigateur sur `/admin/chauffeur`
- Demander une course depuis `/course-immediate`
- Observer dans Network > EventStream les événements SSE

**Chauffeur → Client:**
- Ouvrir la console sur `/course-immediate` après demande
- Accepter depuis le panel chauffeur
- Observer la mise à jour en temps réel du statut

## ⏳ Fonctionnalités Restantes

### Geolocalisation Continue (Todo #6)
**À implémenter:**
```typescript
// Dans DriverLiveRidePanel après acceptation
if (navigator.geolocation) {
  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Calculer ETA avec OSRM
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${ride.departureLng},${ride.departureLat}?overview=false`
      );
      const data = await response.json();
      const etaMinutes = Math.round(data.routes[0].duration / 60);
      
      // Envoyer au serveur
      await fetch(`/api/live-rides/${rideId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverLat: latitude,
          driverLng: longitude,
          estimatedArrival: etaMinutes,
          status: 'DRIVER_EN_ROUTE'
        })
      });
    },
    (error) => console.error('Geolocation error:', error),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
  );
  
  // Nettoyer au démontage
  return () => navigator.geolocation.clearWatch(watchId);
}
```

### Carte Interactive
- Afficher carte Leaflet avec marqueurs
- Marqueur client (départ) en vert
- Marqueur chauffeur avec icône voiture
- Ligne de route OSRM entre chauffeur et client
- Auto-centrage pour voir les deux marqueurs

### Notifications Push
- Service Worker pour notifications navigateur
- Notification même si page pas ouverte
- Son de notification

### États Supplémentaires
- ARRIVED: Chauffeur arrivé au point de départ
- IN_PROGRESS: Course en cours
- COMPLETED: Course terminée
- Boutons pour transitions d'état

## 🐛 Dépannage

### Le bouton "Course immédiate" n'apparaît pas
- Vérifier que vous êtes connecté (`session` existe)
- Le bouton n'apparaît que dans le header pour les utilisateurs authentifiés

### La notification chauffeur n'apparaît pas
- Ouvrir la console et vérifier les erreurs
- Vérifier que `/api/live-rides/stream/driver` est connecté (Network tab)
- Vérifier que la course est bien en statut REQUESTED dans la DB

### SSE se déconnecte
- Comportement normal après ~30s d'inactivité
- Le client se reconnecte automatiquement
- En production, utiliser un service comme Pusher/Ably

### Pas de mise à jour en temps réel
- Vérifier que les deux EventSource sont actifs
- Regarder Network > EventStream dans DevTools
- Le polling SSE est toutes les 2-3 secondes

## 📊 Structure de la Base de Données

```prisma
model LiveRide {
  id                  String          @id @default(cuid())
  userId              String
  clientName          String
  clientPhone         String
  
  // Addresses
  departureAddress    String
  departureLat        Float
  departureLng        Float
  destinationAddress  String?
  destinationLat      Float?
  destinationLng      Float?
  
  // Driver tracking
  driverId            String?
  driverLat           Float?
  driverLng           Float?
  estimatedArrival    Int?           // minutes
  
  // Status tracking
  status              LiveRideStatus @default(REQUESTED)
  requestedAt         DateTime       @default(now())
  acceptedAt          DateTime?
  completedAt         DateTime?
  
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  @@index([status])
  @@index([driverId])
}

enum LiveRideStatus {
  REQUESTED
  ACCEPTED
  DRIVER_EN_ROUTE
  ARRIVED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## 🔗 URLs Importantes

- Client: http://localhost:3000/course-immediate
- Chauffeur: http://localhost:3000/admin/chauffeur
- Login: http://localhost:3000/login
- Signup: http://localhost:3000/signup

## 📝 Notes Techniques

### SSE vs WebSockets
- SSE choisi pour simplicité (unidirectionnel serveur → client)
- Pas besoin de WebSocket pour ce cas d'usage
- SSE nativement supporté par les navigateurs
- Reconnexion automatique en cas de déconnexion

### Polling Frequency
- Driver stream: 3 secondes
- Client stream: 2 secondes
- Compromis entre réactivité et charge serveur

### Sécurité
- Toutes les API routes vérifient `session`
- Client ne peut voir que sa propre course
- Chauffeur ne peut accepter que les courses REQUESTED
- Chauffeur ne peut update que les courses qu'il a acceptées
