// NPM packages imports
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

// Models imports
import Inspector from '../../models/Inspector';
import Card from '../../models/Card';

export const getInspectionResult = async (req: Request, res: Response) => {
  const licensePlate = req.body.licensePlate;
  const result = await Card.inspect(licensePlate);

  res.send({ active: result });
};

export const updatePassword = async (req: Request, res: Response) => {
  // Finds the validation errors in this request and wraps them in an object
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    let response = {
      err: {
        currentPassword: '',
        newPassword: '',
      },
      success: false,
    };

    for (const error of errors.array()) {
      switch (error.param) {
        case 'currentPassword':
          response.err.currentPassword = error.msg;
          break;

        case 'newPassword':
          response.err.newPassword = error.msg;
          break;

        default:
          break;
      }
    }

    res.send(response);
    return;
  }

  // All input fields had valid values
  // Encrypt the new password
  const newPasswordHash = await bcrypt.hash(req.body.newPassword, 10);
  const result = await Inspector.updatePassword(
    parseInt(req.params.inspectorId),
    newPasswordHash
  );

  res.send({ success: result });
};
