import { Router } from "express";
import UserController from '../controllers/user.controller.js'
import {authenticateToken} from '../../src/middlewares/auth.middleware.js'
import { loginValidator } from "../validators/auth.validators.js";
import { validationResult } from "express-validator";

const UserRouter = Router();

// UserRouter.post('/login', loginValidator , (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   return UserController.login(req, res);
// });

UserRouter.post('/getUsers', UserController.getUsers);

UserRouter.post('/deleteUser', UserController.deleteUser);

UserRouter.post('/createUser', UserController.createUser);

UserRouter.post('/updateUser', UserController.updateUser);

UserRouter.post('/updatePassword', UserController.updatePassword);

UserRouter.post('/login',UserController.login);

UserRouter.post('/recoverPassword',authenticateToken, UserController.recoverPassword);
UserRouter.get('/refresh', UserController.refreshToken)
UserRouter.get('/me',authenticateToken, UserController.me)


export default UserRouter;

