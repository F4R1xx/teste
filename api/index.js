/*************************************
 * index.js (dentro da pasta "api/")
 *************************************/
const serverless = require('serverless-http');
const admin = require('firebase-admin');
const express = require('express');

// 1. Importa a chave da conta de serviço
// Supondo que o arquivo "serviceAccountKey.json" esteja na raiz do projeto
const serviceAccount = require(serviceAccountKey);

// 2. Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 3. Cria a aplicação Express
const app = express();

// Para ler dados de formulários via POST (urlencoded)
app.use(express.urlencoded({ extended: true }));
// Para ler dados em JSON (se usar fetch/axios no front)
app.use(express.json());

/**
 * Rota principal:
 * Retorna um HTML com formulários para cada operação de CRUD.
 */
app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>CRUD de Usuários com Firebase</title>
    </head>
    <body>
      <h1>CRUD de Usuários com Firebase</h1>

      <!-- CRIAR USUÁRIO -->
      <h2>Criar Usuário</h2>
      <form action="/create" method="POST">
        <label>Email: <input type="email" name="email" required></label><br>
        <label>Senha: <input type="password" name="password" required></label><br>
        <label>Display Name: <input type="text" name="displayName"></label><br>
        <button type="submit">Criar</button>
      </form>

      <!-- BUSCAR USUÁRIO (READ) -->
      <h2>Buscar Usuário</h2>
      <form action="/get" method="GET">
        <label>UID: <input type="text" name="uid" required></label>
        <button type="submit">Buscar</button>
      </form>

      <!-- LISTAR USUÁRIOS -->
      <h2>Listar Usuários</h2>
      <form action="/list" method="GET">
        <button type="submit">Listar</button>
      </form>

      <!-- ATUALIZAR USUÁRIO -->
      <h2>Atualizar Usuário</h2>
      <form action="/update" method="POST">
        <label>UID: <input type="text" name="uid" required></label><br>
        <label>Novo Display Name: <input type="text" name="displayName"></label><br>
        <button type="submit">Atualizar</button>
      </form>

      <!-- DELETAR USUÁRIO -->
      <h2>Deletar Usuário</h2>
      <form action="/delete" method="POST">
        <label>UID: <input type="text" name="uid" required></label><br>
        <button type="submit">Deletar</button>
      </form>
    </body>
  </html>
  `;
  res.send(html);
});

/**
 * Rota para criar usuário (CREATE)
 */
app.post('/create', async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    });

    res.send(`
      <p>Usuário criado com sucesso: ${userRecord.uid}</p>
      <p><strong>Email:</strong> ${userRecord.email}</p>
      <p><strong>Criado em:</strong> ${userRecord.metadata.creationTime}</p>
      <p><a href="/">Voltar</a></p>
    `);
  } catch (error) {
    res.send(`<p>Erro ao criar usuário: ${error.message}</p><p><a href="/">Voltar</a></p>`);
  }
});

/**
 * Rota para buscar usuário individual (READ)
 */
app.get('/get', async (req, res) => {
  const { uid } = req.query;
  try {
    const userRecord = await admin.auth().getUser(uid);
    const { email, displayName, metadata } = userRecord;

    res.send(`
      <p><strong>UID:</strong> ${uid}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Display Name:</strong> ${displayName || 'N/A'}</p>
      <p><strong>Criado em:</strong> ${metadata.creationTime}</p>
      <p><strong>Último acesso:</strong> ${metadata.lastSignInTime || 'N/A'}</p>
      <p><a href="/">Voltar</a></p>
    `);
  } catch (error) {
    res.send(`<p>Erro ao buscar usuário: ${error.message}</p><p><a href="/">Voltar</a></p>`);
  }
});

/**
 * Rota para listar todos os usuários (READ múltiplos)
 */
app.get('/list', async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    let html = '<h2>Lista de Usuários</h2><ul>';

    listUsersResult.users.forEach((user) => {
      html += `
        <li>
          <strong>UID:</strong> ${user.uid} | 
          <strong>Email:</strong> ${user.email} | 
          <strong>Display Name:</strong> ${user.displayName || 'N/A'}<br>
          Criado em: ${user.metadata.creationTime} | 
          Último acesso: ${user.metadata.lastSignInTime || 'N/A'}
        </li><br>
      `;
    });

    html += '</ul><p><a href="/">Voltar</a></p>';
    res.send(html);
  } catch (error) {
    res.send(`<p>Erro ao listar usuários: ${error.message}</p><p><a href="/">Voltar</a></p>`);
  }
});

/**
 * Rota para atualizar usuário (UPDATE)
 */
app.post('/update', async (req, res) => {
  const { uid, displayName } = req.body;
  try {
    const userRecord = await admin.auth().updateUser(uid, { displayName });
    res.send(`
      <p>Usuário atualizado com sucesso: ${userRecord.uid}</p>
      <p><strong>Nome:</strong> ${userRecord.displayName}</p>
      <p><a href="/">Voltar</a></p>
    `);
  } catch (error) {
    res.send(`<p>Erro ao atualizar usuário: ${error.message}</p><p><a href="/">Voltar</a></p>`);
  }
});

/**
 * Rota para deletar usuário (DELETE)
 */
app.post('/delete', async (req, res) => {
  const { uid } = req.body;
  try {
    await admin.auth().deleteUser(uid);
    res.send(`
      <p>Usuário deletado com sucesso: ${uid}</p>
      <p><a href="/">Voltar</a></p>
    `);
  } catch (error) {
    res.send(`<p>Erro ao deletar usuário: ${error.message}</p><p><a href="/">Voltar</a></p>`);
  }
});

// Exporta a aplicação como uma função serverless
module.exports.handler = serverless(app);
