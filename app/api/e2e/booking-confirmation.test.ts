import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock de l'envoi d'emails (Resend)
vi.mock('@/lib/mailer', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    timeSlot: {
      upsert: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Import API handlers
import * as bookingsRoute from '../bookings/route';
import * as adminConfirmRoute from '../admin/bookings/[id]/confirm/route';
import * as adminBookingsRoute from '../admin/bookings/route';
import * as profileBookingsRoute from '../profile/bookings/route';

describe('E2E booking confirmation flow (API-level)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a booking, driver confirms it, and status is visible to admin and user', async () => {
    const payload = {
      firstName: 'Alice',
      lastName: 'Dupont',
      phoneNumber: '0612345678',
      email: 'alice@example.com',
      departureAddress: '1 Rue de Test, Paris',
      destinationAddress: '2 Rue de Demo, Paris',
      departureLat: 48.8566,
      departureLng: 2.3522,
      destinationLat: 48.8570,
      destinationLng: 2.3530,
      date: new Date().toISOString().split('T')[0],
      timeSlot: '10:00-10:30',
      isRecurring: false,
      additionalServices: [],
    };

    const createdBooking = {
      id: 'booking-1',
      ...payload,
      distance: 1.23,
      price: 12.34,
      status: 'PENDING',
      date: new Date(payload.date),
      driverNotified: false,
      customerNotified: false,
      tripStarted: false,
    };

    // Mock session for booking creation (logged-in user)
    (getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', email: 'alice@example.com' } });

    // Mock prisma create/upsert
    ((prisma as any).booking.create as any).mockResolvedValueOnce(createdBooking);
    ((prisma as any).timeSlot.upsert as any).mockResolvedValueOnce({});

    // Call POST to create booking
    const createRes = await bookingsRoute.POST({ json: async () => payload } as any);
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.id).toBe('booking-1');

    // Mock admin session and prisma.findMany for admin bookings
    (getServerSession as any).mockResolvedValueOnce({ user: { id: 'driver-1', email: 'driver@example.com' } });
    ((prisma as any).booking.findMany as any).mockResolvedValueOnce([createdBooking]);

    const adminRes = await adminBookingsRoute.GET({} as any);
    expect(adminRes.status).toBe(200);
    const adminData = await adminRes.json();
    expect(adminData.bookings.some((b: any) => b.id === 'booking-1' && b.status === 'PENDING')).toBe(true);

    // Mock admin session for confirm endpoint and prisma methods
    (getServerSession as any).mockResolvedValueOnce({ user: { id: 'driver-1' } });
    ((prisma as any).booking.findUnique as any).mockResolvedValueOnce(createdBooking);
    const updatedBooking = { ...createdBooking, status: 'CONFIRMED' };
    ((prisma as any).booking.update as any).mockResolvedValueOnce(updatedBooking);

    const confirmRes = await adminConfirmRoute.POST({} as any, { params: { id: 'booking-1' } } as any);
    expect(confirmRes.status).toBe(200);
    const confirmData = await confirmRes.json();
    expect(confirmData.booking.status).toBe('CONFIRMED');

    // Mock profile session and booking.findMany to return confirmed booking
    (getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', email: 'alice@example.com' } });
    ((prisma as any).booking.findMany as any).mockResolvedValueOnce([updatedBooking]);

    const profileRes = await profileBookingsRoute.GET({} as any);
    expect(profileRes.status).toBe(200);
    const profileData = await profileRes.json();
    expect(profileData.bookings[0].status).toBe('CONFIRMED');
  });
});
