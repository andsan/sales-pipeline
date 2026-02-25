import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../types/index';

const router = Router();

// ---------------------------------------------------------------------------
// Mock user store — replace with DB / Azure AD in production
// Passwords are pre-hashed; generate with: bcrypt.hash('yourpassword', 10)
// ---------------------------------------------------------------------------
const USERS: Record<string, User> = {
  admin: {
    username: 'admin',
    passwordHash: '$2b$10$aFqzGH0ttuuaJnxVh7OY2.mvejc.zPBbXXOTZoh1p2aUTdYTNJuDi', // password123
    role: 'admin' as UserRole,
  },
};

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }

  const user = USERS[username.toLowerCase()];
  if (!user) {
    // Constant-time comparison even for unknown users to prevent username enumeration
    await bcrypt.compare(password, '$2b$10$invalid.hash.to.prevent.timing.attack.padding');
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  const token = jwt.sign(
    { username: user.username, role: user.role },
    secret,
    { expiresIn: '8h' },
  );

  res.json({ token, username: user.username, role: user.role });
});

router.post('/logout', (_req: Request, res: Response): void => {
  // JWT is stateless — client discards the token.
  // Add token blocklist here if needed.
  res.json({ message: 'Logged out' });
});

export default router;
