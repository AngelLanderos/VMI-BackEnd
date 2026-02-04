import mongoose from "mongoose";

const DBConection = () => {
  mongoose.connect("mongodb://127.0.0.1:27017/VMI", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Conexión exitosa');
  })
  .catch(error => {
    console.log('Error de conexión', error);
  });
};

export default DBConection;