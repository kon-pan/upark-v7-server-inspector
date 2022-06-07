import db from '../db/db.config';

export default class Card {
  static async inspect(licensePlate: string): Promise<boolean> {
    try {
      const result = await db.query(
        `
      SELECT * FROM active_cards WHERE license_plate=$1 
      `,
        [licensePlate]
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
