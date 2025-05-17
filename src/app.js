require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('API funcionando!');
});

app.use('/api/users', require('./routes/userRoutes'));

module.exports = app;
