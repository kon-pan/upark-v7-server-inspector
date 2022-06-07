import http from 'http';

// NPM package imports
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from 'passport';

import cron from 'node-cron';

import Inspector from './models/Inspector';

// Routers imports

import { inspectorAuthRouter } from './routers/inspector/auth.router';
import { inspectorMainRouter } from './routers/inspector/inspector.router';

// Interfaces imports
import { IPostgresInspector } from './interfaces/interface.db';

import db from './db/db.config';
import localAuth from './utils/passport/passport.local';

/* -------------------------------------------------------------------------- */
/*                                 CRON TASKS                                 */
/* -------------------------------------------------------------------------- */
cron.schedule('*/10 * * * * *', async () => {
  try {
    console.time('db-cron');
    // Check for active-inactive parking cards
    await db.query(`
    WITH inactive AS (
      DELETE FROM 
        active_cards 
      WHERE 
        expires_at < NOW() RETURNING *
    ) INSERT INTO inactive_cards(
      license_plate, vehicle_name, duration, 
      cost, starts_at, expires_at, expired, cancelled, driver_id, 
      address_id
    ) 
    SELECT 
      license_plate, 
      vehicle_name, 
      duration, 
      cost, 
      starts_at, 
      expires_at, 
      true as expired, 
      false as cancelled, 
      driver_id, 
      address_id 
    FROM 
      inactive;
    `);

    // Update address occupancy
    await db.query(`
    UPDATE 
      addresses 
    SET 
      occupied = t.occupied 
    FROM 
      (
        SELECT 
          addresses.id, 
          COALESCE(tmp.counter, 0) as occupied 
        FROM 
          addresses 
          LEFT JOIN (
            SELECT 
              address_id, 
              count(*) as counter 
            FROM 
              active_cards
            GROUP BY 
              address_id
          ) tmp ON addresses.id = tmp.address_id
      ) t 
    WHERE 
      addresses.id = t.id
    `);
    console.timeEnd('db-cron');
  } catch (error) {
    console.log(error);
  }
});
/* -------------------------------------------------------------------------- */

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4002;

app.set('trust proxy', 1);
/* -------------------------------------------------------------------------- */
/*                          MIDDLEWARE CONGFIGURATION                         */
/* -------------------------------------------------------------------------- */
app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      // bypass the requests with no origin (like curl requests, mobile apps, etc )
      if (!origin) return callback(null, true);

      if ([process.env.CLIENT_INSPECTOR_HOSTNAME].indexOf(origin) === -1) {
        var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(
  session({
    secret: 'secretcode',
    resave: true,
    name: 'connect.sid',
    saveUninitialized: true,
    cookie:
      process.env.NODE_ENV === 'development'
        ? { httpOnly: false }
        : {
            sameSite: 'none',
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // One Week
            httpOnly: false,
          },
  })
);

app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
passport.use(localAuth);

passport.serializeUser(
  (user: IPostgresInspector & { role: string }, done: any) => {
    done(null, { id: user.id, role: user.role });
  }
);

passport.deserializeUser(
  async (serializedUser: { id: number; role: string }, done: any) => {
    // Inspector
    if (serializedUser.role === 'inspector') {
      try {
        const inspector = await Inspector.findOne('id', serializedUser.id);

        let { password, ...sanitizedUser }: any = inspector;

        // Add role field
        sanitizedUser['role'] = serializedUser.role;

        done(null, sanitizedUser);
      } catch (error) {
        console.log(error);
      }
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                                   ROUTING                                  */
/* -------------------------------------------------------------------------- */
app.use('/inspector', inspectorMainRouter);
app.use('/inspector/auth', inspectorAuthRouter);

server.listen(port, async () => {
  console.log(`App is running on port ${port}`);
  const result = await db.query(`SELECT NOW()`);
  console.log(`[db] ${result.rows[0].now}`);
});
