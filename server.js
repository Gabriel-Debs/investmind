const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração da conexão MySQL (Ajuste usuário e senha)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234', // Coloque a senha do seu MySQL se houver
  database: 'investmind_db',
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err.message);
  } else {
    console.log('Conectado ao MySQL com sucesso!');
  }
});

// GET /api/alertas - Listar Alertas
app.get('/api/alertas', (req, res) => {
  const query = 'SELECT * FROM alertas ORDER BY id DESC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(results);
  });
});

// POST /api/alertas - Criar Alerta
app.post('/api/alertas', (req, res) => {
  const { codigo_ativo, preco_alvo, tipo_alerta } = req.body;
  const query = 'INSERT INTO alertas (codigo_ativo, preco_alvo, tipo_alerta, status) VALUES (?, ?, ?, "PENDENTE")';
  
  db.query(query, [codigo_ativo, preco_alvo, tipo_alerta], (err, result) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json({ sucesso: true, id: result.insertId });
  });
});

// DELETE /api/alertas/:id - Deletar Alerta
app.delete('/api/alertas/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM alertas WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json({ sucesso: true });
  });
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});