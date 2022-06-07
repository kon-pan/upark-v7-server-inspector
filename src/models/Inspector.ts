import { IPostgresInspector } from '../interfaces/interface.db';
import db from '../db/db.config';
import { IInspector } from '../interfaces/interface.main';

export default class Inspector {
  static async findOne(
    col: string,
    value: string | number
  ): Promise<IPostgresInspector> {
    switch (col) {
      case 'email':
        try {
          const result = await db.query(
            'SELECT * FROM inspectors WHERE email=$1',
            [value]
          );

          if (result.rowCount === 0) {
            return {} as IPostgresInspector; // email does not exist
          }

          const row: IPostgresInspector = result.rows[0];
          return row;
        } catch (error) {
          console.log(error);
        }

        break;

      case 'id':
        try {
          const result = await db.query(
            'SELECT * FROM inspectors WHERE id=$1',
            [value]
          );

          if (result.rowCount === 0) {
            return {} as IPostgresInspector; // user id does not exist
          }

          const row: IPostgresInspector = result.rows[0];
          return row;
        } catch (error) {
          console.log(error);
        }

        break;

      default:
        break;
    }
  }

  static async updatePassword(inspectorId: number, password: string) {
    try {
      const result = await db.query(
        `
      UPDATE 
        inspectors 
      SET 
        password = $1
      WHERE 
        id = $2
      `,
        [password, inspectorId]
      );

      if (result.rowCount > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }
}
