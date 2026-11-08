import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    ride: {
      findMany: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

describe('GET /api/profile/rides', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null);
    
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns rides for authenticated user', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-123', name: 'Test User' },
    });

    const mockRides = [
      {
        id: 'ride-1',
        date: new Date('2025-11-01'),
        price: 10,
        boltPrice: 12,
        uberPrice: 13,
        userId: 'user-123',
      },
    ];

    ((prisma as any).ride.findMany as any).mockResolvedValue(mockRides);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rides).toHaveLength(1);
    expect(data.rides[0].id).toBe('ride-1');
    expect((prisma as any).ride.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-123' },
    }));
  });
});
