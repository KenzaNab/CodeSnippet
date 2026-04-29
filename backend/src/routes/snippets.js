const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../services/dbService');
const router = express.Router();

const auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'No token.' });
  try { req.userId = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Invalid token.' }); }
};

const parse = (row) => row ? { ...row, tags: JSON.parse(row.tags || '[]'), is_public: !!row.is_public } : null;

// Public snippets — no auth needed
router.get('/public', (req, res) => {
  const { lang, search } = req.query;
  let q = "SELECT s.*, u.name as author FROM snippets s JOIN users u ON s.user_id = u.id WHERE s.is_public = 1";
  const params = [];
  if (lang) { q += ' AND s.language = ?'; params.push(lang); }
  if (search) { q += ' AND (s.title LIKE ? OR s.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  q += ' ORDER BY s.created_at DESC LIMIT 50';
  res.json(getDB().prepare(q).all(...params).map(parse));
});

router.use(auth);

router.get('/', (req, res) => {
  const { lang, search, tag } = req.query;
  let rows = getDB().prepare('SELECT * FROM snippets WHERE user_id = ? ORDER BY created_at DESC').all(req.userId).map(parse);
  if (lang) rows = rows.filter(s => s.language === lang);
  if (search) rows = rows.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || (s.description||'').toLowerCase().includes(search.toLowerCase()));
  if (tag) rows = rows.filter(s => s.tags.includes(tag));
  res.json(rows);
});

router.post('/', (req, res) => {
  const { title, code, language, description, tags, is_public } = req.body;
  if (!title || !code || !language) return res.status(400).json({ error: 'title, code, language required.' });
  const id = uuidv4();
  getDB().prepare('INSERT INTO snippets (id,user_id,title,code,language,description,tags,is_public) VALUES (?,?,?,?,?,?,?,?)').run(id, req.userId, title, code, language, description||null, JSON.stringify(tags||[]), is_public ? 1 : 0);
  res.status(201).json(parse(getDB().prepare('SELECT * FROM snippets WHERE id = ?').get(id)));
});

router.put('/:id', (req, res) => {
  const { title, code, language, description, tags, is_public } = req.body;
  const info = getDB().prepare(`
    UPDATE snippets SET
      title=COALESCE(?,title), code=COALESCE(?,code), language=COALESCE(?,language),
      description=COALESCE(?,description), tags=COALESCE(?,tags), is_public=COALESCE(?,is_public)
    WHERE id=? AND user_id=?
  `).run(title, code, language, description, tags ? JSON.stringify(tags) : null, is_public !== undefined ? (is_public?1:0) : null, req.params.id, req.userId);
  if (!info.changes) return res.status(404).json({ error: 'Not found.' });
  res.json(parse(getDB().prepare('SELECT * FROM snippets WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', (req, res) => {
  const info = getDB().prepare('DELETE FROM snippets WHERE id=? AND user_id=?').run(req.params.id, req.userId);
  if (!info.changes) return res.status(404).json({ error: 'Not found.' });
  res.status(204).send();
});

module.exports = router;
