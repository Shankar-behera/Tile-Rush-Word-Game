const express = require('express');
const cors = require('cors');
const gameRoutes = require('./routes/gameRoutes');
const { size: dictionarySize } = require('./db/dictionary');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dictionary_words: dictionarySize });
});

app.use('/api', gameRoutes);

// Central error handler - keeps error responses consistent JSON, not raw stack traces.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => {
  console.log(`Word game API running on http://localhost:${PORT}`);
  console.log(`Dictionary loaded with ${dictionarySize} words`);
});
