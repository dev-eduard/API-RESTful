const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT;
connectDB();

app.listen(PORT, () => {
  console.clear();
  console.log(`\x1b[32m✔  API rodando em http://localhost:${PORT}\x1b[0m`);
});
