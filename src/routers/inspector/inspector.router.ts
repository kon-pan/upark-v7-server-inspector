//NPM packages imports
import express from 'express';

// Controllers
import * as inspectorController from '../../controllers/inspector/inspector.controller';

import updatePasswordValidator from '../../utils/validators/inspector/forms/update-password.form.validator';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                                 GET ROUTES                                 */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                 POST ROUTES                                */
/* -------------------------------------------------------------------------- */
router.post('/inspect', inspectorController.getInspectionResult);
router.post(
  '/:inspectorId/account/password/update',
  updatePasswordValidator,
  inspectorController.updatePassword
);

export { router as inspectorMainRouter };
