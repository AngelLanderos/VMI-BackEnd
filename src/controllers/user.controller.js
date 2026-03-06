import UserModel from "../models/user.model.js";
import { generatePassword } from "../helpers/helpers.js";
import { sendEmail, requestWMSToken, hashEmail } from "../helpers/helpers.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserController = {};

UserController.createUser = async (req, res) => {
  try {
    // const { user } = req.body;
    const {
      username,
      email,
      area,
      rol,
      isNewUser,
      isValid,
      customer,
      currentValidationCode,
    } = req.body;

    console.log({
      username,
      email,
      area,
      rol,
      isNewUser,
      isValid,
      customer,
      currentValidationCode,
    });

    const passOptions = {
      mayus: true,
      minus: true,
      numbers: true,
      symbols: false,
    };

    const randomPassword = generatePassword(15, passOptions);

    const encryptEmail = hashEmail(email);

    const userCreated = await UserModel.create({
      username,
      email,
      // password: randomPassword, //!!!!!!!!!
      password: "",
      encryptEmail,
      area,
      position: rol,
      isNewUser,
      customer,
      isValid,
      currentValidationCode,
    });

    // const mailOptions = {
    //   from: 'Sistema de tickets <systems.support@wmsvantec.com.mx>',
    //   to: email,
    //   subject: `Cuenta creada: ${username}`,
    //   text: `Utilice esta contraseña para ingresar por primera vez al sistema: ${randomPassword}`,
    // }

    //  await sendEmail(mailOptions)

    return res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal error creating user" });
  }
};

UserController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userFind = await UserModel.findOne({ email });

    if (!userFind) {
      return res.status(404).json("User not found");
    }

    const isValidPassword = await userFind.comparePassword(password);

    if (!isValidPassword) {
      return res.status(400).json("Wrong password");
    }

    if (userFind.isNewUser) {
      return res.status(201).json({
        message: "Is new user",
        isNewUser: true,
      });
    }

    const payload = {
      id: userFind._id,
      role: userFind.role,
    };

    const token = jwt.sign(payload, "6QrfbTcyLnFcjBzG4NXth7YjzCktNj", {
      expiresIn: "30m",
    });

    const refreshToken = jwt.sign(
      { id: userFind._id },
      "6QrfbTcyLnFcjBzG4NXth7YjzCktNj",
      { expiresIn: "7d" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.status(200).json({
      token,
      isNewUser: false,
    });
  } catch (error) {
    return res.status(500).json({
      msg: `Internal error in login process ${error}`,
    });
  }
};

UserController.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(
    refreshToken,
    "6QrfbTcyLnFcjBzG4NXth7YjzCktNj",
    async (err, payload) => {
      if (err) return res.sendStatus(403);

      const user = await UserModel.findById(payload.id);
      if (!user) return res.sendStatus(404);

      const newAccessToken = jwt.sign(
        { id: user._id, role: user.role },
        "6QrfbTcyLnFcjBzG4NXth7YjzCktNj",
        { expiresIn: "7d" },
      );

      res.json({ token: newAccessToken });
    },
  );
};

UserController.me = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const VMIToken = await requestWMSToken();

    res.json({
      username: user.username,
      role: user.role,
      area: user.area,
      customer: user.customer,
      VMIToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

UserController.logout = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

UserController.getUsers = async (req, res) => {
  try {
    const { filter } = req.body;

    const usersFind = await UserModel.find(filter);

    return res.status(200).json(usersFind);
  } catch (error) {
    return res.status(500).json(error);
  }
};

UserController.deleteUser = async (req, res) => {
  try {
    const { employeeId } = req.body;

    await UserModel.deleteOne({ employeeId: employeeId });

    return res.status(200).json("Exito");
  } catch (error) {
    return res.status(500).json("Error");
  }
};

UserController.updatePassword = async (req, res) => {
  try {
    const { newPassword, email } = req.body;

    const cryptPassword = await bcrypt.hash(newPassword, 10);

    await UserModel.updateOne(
      { email },
      { $set: { password: cryptPassword, isNewUser: false } },
    );

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
};

UserController.updateUser = async (req, res) => {
  try {
    const { employeeId, user } = req.body,
      { username, email, area, rol } = user;

    await UserModel.updateOne(
      { employeeId },
      { $set: { username, email, area, rol } },
    );

    return res.status(200).json("Success");
  } catch (error) {
    return res.status(500).json(error);
  }
};

UserController.recoverPassword = async (req, res) => {
  try {
    const { recoverEmail } = req.body;

    const userFind = await UserModel.findOne({
      email: recoverEmail,
    });

    if (!userFind) {
      return res
        .status(404)
        .json("There is no user associated with this email address.");
    }

    const passOptions = {
      mayus: true,
      minus: true,
      numbers: true,
      symbols: false,
    };

    const randomPassword = generatePassword(15, passOptions);

    const mailOptions = {
      from: "Sistema de tickets <systems.support@wmsvantec.com.mx>",
      to: recoverEmail,
      subject: `Contraseña de recuperación`,
      text: `Utilice esta contraseña temporal para recuperar su acceso ${randomPassword}`,
    };

    await sendEmail(mailOptions);

    return res.status(200).json({
      message: "Recover email send successfully",
      validUser: true,
      randomPassword,
    });
  } catch (error) {
    return res.status(500).json("");
  }
};

export default UserController;
