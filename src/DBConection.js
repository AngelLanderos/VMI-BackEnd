import mongoose from "mongoose";

const DBConection = () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017/VMI")
    .then(() => {
      console.log("Conexión exitosa");
    })
    .catch((error) => {
      console.log("Error de conexión", error);
    });
};

export default DBConection;
