import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { type } from "os";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    email: { type: String, required: 
      true, 
      unique: true 
    },
    password: { type: String},
    encryptEmail: {type: String, required: true},
    isNewUser: {type: Boolean, required: true},
    position: {type: String},
    currentValidationCode: {type: String},
    isValid: {type: Boolean, required: true},
    customer : [{
      type: String,
      required: true,
    }]
  },
  { 
    timestamps: false,
    versionKey: false
   }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// UserSchema.methods.cryptPassword = function (password) {
//   const salt = bcrypt.genSalt(10);
//   return bcrypt.hash(password,salt);
// };

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", UserSchema, "Users");
