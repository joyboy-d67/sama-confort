import { test, expect } from '@playwright/test';

test.describe('Flux complet de réservation VTC', () => {
  test('Client crée une réservation et chauffeur la confirme', async ({ page, context }) => {
    // Étape 1: Créer un compte/se connecter en tant que client
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Attendre la redirection après connexion
    await page.waitForURL(/\/(profile|$)/);
    
    // Étape 2: Aller sur la page de réservation
    await page.goto('/reserver');
    await expect(page.locator('h1')).toContainText('Réserver un trajet');
    
    // Étape 3: Remplir le formulaire de réservation
    // Les champs personnel devraient être pré-remplis si connecté
    await expect(page.locator('input[name="firstName"]')).not.toBeEmpty();
    
    // Sélectionner les adresses (simuler l'autocomplete)
    await page.fill('input[placeholder*="départ"]', 'Place Kléber, Strasbourg');
    await page.waitForTimeout(1000); // Attendre le debounce
    // Cliquer sur le premier résultat si disponible
    const firstResult = page.locator('ul li').first();
    if (await firstResult.isVisible()) {
      await firstResult.click();
    }
    
    await page.fill('input[placeholder*="arrivée"]', 'Gare de Strasbourg');
    await page.waitForTimeout(1000);
    const firstDestResult = page.locator('ul li').first();
    if (await firstDestResult.isVisible()) {
      await firstDestResult.click();
    }
    
    // Sélectionner une date (demain)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateString);
    
    // Sélectionner un créneau horaire
    await page.click('button:has-text("09:00")');
    
    // Étape 4: Soumettre la réservation
    await page.click('button[type="submit"]:has-text("Confirmer")');
    
    // Étape 5: Vérifier que le modal de confirmation apparaît
    await expect(page.locator('text=Réservation créée')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Numéro de réservation')).toBeVisible();
    
    // Vérifier le statut "En attente"
    await expect(page.locator('text=En attente')).toBeVisible();
    
    // Récupérer l'ID de la réservation
    const bookingIdText = await page.locator('text=#').textContent();
    const bookingId = bookingIdText?.replace('#', '').trim();
    
    // Fermer le modal
    await page.click('button:has-text("compris")');
    
    // Étape 6: Vérifier que la réservation apparaît dans le profil
    await page.goto('/profile');
    await expect(page.locator('text=Mes courses à venir')).toBeVisible();
    await expect(page.locator('text=En attente')).toBeVisible();
    
    // Étape 7: Ouvrir un nouvel onglet pour le chauffeur
    const driverPage = await context.newPage();
    
    // Se connecter en tant que chauffeur/admin
    await driverPage.goto('/admin/chauffeur');
    
    // Si pas connecté, se connecter
    if (driverPage.url().includes('/login')) {
      await driverPage.fill('input[name="email"]', 'test@example.com');
      await driverPage.fill('input[name="password"]', 'password123');
      await driverPage.click('button[type="submit"]');
      await driverPage.waitForURL('/admin/chauffeur');
    }
    
    // Attendre que les réservations se chargent
    await driverPage.waitForTimeout(2000);
    
    // Étape 8: Vérifier que la réservation PENDING apparaît
    await expect(driverPage.locator('text=En attente').first()).toBeVisible({ timeout: 15000 });
    
    // Étape 9: Confirmer la réservation
    const confirmButton = driverPage.locator('button:has-text("Confirmer la réservation")').first();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    
    // Attendre la confirmation
    await expect(driverPage.locator('text=Réservation confirmée')).toBeVisible({ timeout: 5000 });
    
    // Étape 10: Retourner sur la page client et vérifier le changement de statut
    await page.reload();
    await page.waitForTimeout(6000); // Attendre le refresh SSE ou polling
    
    // Vérifier que le statut est passé à "Confirmée"
    await expect(page.locator('text=Confirmée')).toBeVisible({ timeout: 10000 });
    
    // Étape 11: Tester le bouton "Aller chercher le client" sur le dashboard chauffeur
    await driverPage.reload();
    await driverPage.waitForTimeout(2000);
    
    const pickupButton = driverPage.locator('button:has-text("Aller chercher")').first();
    if (await pickupButton.isVisible()) {
      await pickupButton.click();
      // Vérifier que le statut change à "En route"
      await expect(driverPage.locator('text=En route')).toBeVisible({ timeout: 5000 });
    }
    
    // Cleanup: fermer les pages
    await driverPage.close();
  });

  test('Modal de confirmation affiche toutes les informations', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(profile|$)/);
    
    await page.goto('/reserver');
    
    // Remplir rapidement le formulaire
    await page.fill('input[placeholder*="départ"]', 'Strasbourg');
    await page.waitForTimeout(600);
    const first = page.locator('ul li').first();
    if (await first.isVisible()) await first.click();
    
    await page.fill('input[placeholder*="arrivée"]', 'Colmar');
    await page.waitForTimeout(600);
    const dest = page.locator('ul li').first();
    if (await dest.isVisible()) await dest.click();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);
    
    await page.click('button:has-text("10:00")');
    await page.click('button[type="submit"]:has-text("Confirmer")');
    
    // Vérifications du modal
    await expect(page.locator('text=Réservation créée')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Numéro de réservation')).toBeVisible();
    await expect(page.locator('text=#')).toBeVisible();
    await expect(page.locator('text=Statut')).toBeVisible();
    await expect(page.locator('text=Départ')).toBeVisible();
    await expect(page.locator('text=Arrivée')).toBeVisible();
    await expect(page.locator('text=Date & Heure')).toBeVisible();
    await expect(page.locator('text=Prix')).toBeVisible();
    
    // Vérifier le bouton de fermeture
    const closeButton = page.locator('button:has-text("compris")');
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    
    // Le modal doit se fermer
    await expect(page.locator('text=Réservation créée')).not.toBeVisible();
  });
});
