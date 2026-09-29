import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { clearSession, hashPassword, issueSession, requireAuth, verifyPassword } from '../lib/auth.js';
import { asyncHandler, HttpError, parse, z } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

// Constant-time-ish: always run bcrypt so response time doesn't reveal whether the email exists
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword('not-a-real-password'));

authRouter.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = parse(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    const ok = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
    if (!user || !ok || !user.active) throw new HttpError(401, 'Incorrect email or password.');

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    issueSession(res, user);
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }),
);

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ success: true });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ?? null });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, 'Use at least 10 characters').max(200),
});

authRouter.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = parse(changePasswordSchema, req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new HttpError(400, 'Current password is incorrect.');
    }
    // Bumping tokenVersion signs out every other device
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword), tokenVersion: { increment: 1 } },
    });
    issueSession(res, updated);
    res.json({ success: true });
  }),
);
