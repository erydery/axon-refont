import { createClerkClient } from '@clerk/express';
import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { db } from '../db/client.js';
import { users, type User } from '../db/schema.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const clerkClient = process.env.CLERK_SECRET_KEY
  ? createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    })
  : null;

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const bearer = req.get('authorization');
  if (!bearer?.startsWith('Bearer ') || !clerkClient) return next();

  try {
    const frontendOrigin = req.get('origin') ?? process.env.CLIENT_URL ?? 'http://localhost:5173';
    const authorizedParties = [
      frontendOrigin,
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter((origin): origin is string => Boolean(origin));
    const clerkRequest = new Request(`${frontendOrigin}/api${req.path}`, {
      headers: { Authorization: bearer },
    });
    // The current development machine clock is about 29 minutes behind Clerk.
    // Keep production verification strict; allow an explicit dev-only override.
    const clockSkewInMs = Number(
      process.env.CLERK_CLOCK_SKEW_MS ??
        (process.env.NODE_ENV === 'production' ? 5_000 : 2_100_000),
    );
    const authState = await clerkClient.authenticateRequest(clerkRequest, {
      authorizedParties,
      clockSkewInMs,
    });
    if (!authState.isSignedIn) {
      console.warn(
        `Clerk a refusé le jeton (${authState.reason ?? 'cause inconnue'}): ${authState.message ?? 'aucun détail'}`,
      );
      return next();
    }

    const clerkUser = await clerkClient.users.getUser(authState.toAuth().userId);
    const email =
      clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return next();

    const normalizedEmail = email.toLowerCase();
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (existing) {
      req.user = existing;
      return next();
    }

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      clerkUser.username ||
      normalizedEmail.split('@')[0];
    const [created] = await db
      .insert(users)
      .values({ email: normalizedEmail, name, hasOnboarded: false })
      .onConflictDoNothing()
      .returning();
    if (created) req.user = created;
    else {
      const [racedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
      req.user = racedUser;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentification requise' });
  next();
}
