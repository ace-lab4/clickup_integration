const express = require('express');

const app = express();
const PORT = 8000;

app.get('/callback', (req, res) => {
  // Aqui você pode manipular o redirecionamento recebido
  console.log('Redirecionamento recebido:', req.query);

  // Enviar uma resposta de confirmação
  res.send('Redirecionamento recebido com sucesso!');
});

app.listen(PORT, () => {
  console.log(`Servidor de teste em execução em http://localhost:${PORT}`);
});
