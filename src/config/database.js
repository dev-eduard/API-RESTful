const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('\x1b[32m✔  Banco de dados conectado com sucesso\x1b[0m');
  } catch (err) {
    console.error('\x1b[31m❌  Erro ao conectar ao banco de dados\x1b[0m\n\n', err);
    process.exit(1);
  }
};

module.exports = connectDB;
