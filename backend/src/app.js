require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDB } = require('./services/dbService');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/snippets', require('./routes/snippets'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'CodeSnippet' }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

initDB();
app.listen(PORT, () => console.log(`CodeSnippet API on http://localhost:${PORT}`));
module.exports = app;
