import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import { Client } from 'discord.js';
import { setupPassport } from './auth';
import { setupApiRoutes } from './routes/api';

export function startPanel(client: Client): void {
  const app = express();
  const PORT = parseInt(process.env.PANEL_PORT ?? '3000');

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'changeme-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days
    })
  );

  // Passport OAuth2
  setupPassport(client);
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.get('/auth/discord', passport.authenticate('discord'));
  app.get(
    '/auth/discord/callback',
    passport.authenticate('discord', {
      failureRedirect: '/login?error=1',
      successRedirect: '/',
    })
  );
  app.get('/auth/logout', (req, res) => {
    req.logout(() => res.redirect('/login'));
  });

  // Static files (admin panel frontend)
  app.use('/static', express.static(path.join(__dirname, 'public')));

  // Login page (no auth needed)
  app.get('/login', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });

  // Auth guard middleware
  function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
  }

  // Admin panel SPA
  app.get('/', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // API routes (protected)
  app.use('/api', requireAuth, setupApiRoutes(client));

  app.listen(PORT, () => {
    console.log(`[PANEL] Admin panel running at http://localhost:${PORT}`);
  });
}
