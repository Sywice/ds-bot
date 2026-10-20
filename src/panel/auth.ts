import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Client } from 'discord.js';

export function setupPassport(client: Client): void {
  const ADMIN_IDS = (process.env.ADMIN_IDS ?? '').split(',').map((id) => id.trim());

  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.CLIENT_ID!,
        clientSecret: process.env.CLIENT_SECRET!,
        callbackURL: process.env.OAUTH2_CALLBACK_URL ?? 'http://localhost:3000/auth/discord/callback',
        scope: ['identify', 'guilds'],
      },
      (_accessToken, _refreshToken, profile, done) => {
        // Only allow whitelisted admins
        if (!ADMIN_IDS.includes(profile.id)) {
          return done(null, false);
        }
        return done(null, profile);
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user as Express.User));
}
