require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const email = 'admin@admin.com';
  const password = 'admin123';
  const name = 'Admministrador';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('\x1b[31m❌  Este admin já existe\x1b[0m');
    process.exit(0);
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: 'admin',
  });
  console.log('\x1b[32m✔  Admin criado com sucesso\x1b[0m');
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('\x1b[31m❌  Erro ao criar admin\x1b[0m\n\n', err);
  process.exit(1);
});
