// NPM package imports
import passportLocal from 'passport-local';
import bcrypt from 'bcryptjs';

// Models imports
import Inspector from '../../models/Inspector';

// Interfaces imports
import { IPostgresInspector } from 'src/interfaces/interface.db';

import { isObjectEmpty } from '../utils';
/* -------------------------------------------------------------------------- */

const LocalStrategy = passportLocal.Strategy;

const localAuth = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  async function (username, password, done) {
    try {
      let inspector: IPostgresInspector & { role?: string } =
        await Inspector.findOne('email', username);

      // Check if the returned user or admin object is empty
      if (isObjectEmpty(inspector)) {
        // Email doesn't match any database entry in either users or admins table

        return done(null, false);
      } else {
        // Email matched a database entry

        if (!isObjectEmpty(inspector)) {
          // Email matches an inspector
          // Compare provided password with stored password
          const match = await bcrypt.compare(password, inspector.password); // true/false

          if (!match) {
            return done(null, false);
          }

          // Add user role before serialization
          inspector['role'] = 'inspector';
          return done(null, inspector);
        }
      }
    } catch (error) {
      return done(error);
    }
  }
);

export default localAuth;
