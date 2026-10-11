/**
 * Loads .env BEFORE any other module is imported. Import this first in every
 * entrypoint so modules that read process.env at import time (Stripe, JWT
 * secret) see the configured values.
 */
import dotenv from 'dotenv';

dotenv.config();
