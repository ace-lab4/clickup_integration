const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'calendar_clickup',
  password: '122113',
  port: 5432,
});

const googleConfig = {
  clientId: '998930018535-59frbc5c30bs6pf8h4gkued9m0kkrif4.apps.googleusercontent.com',
  clientSecret: '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',
  redirectUri: 'http://localhost:8000/oauth2callback'
};

const oAuth2Client = new google.auth.OAuth2(
  googleConfig.clientId,
  googleConfig.clientSecret,
  googleConfig.redirectUri
);


const scopes = ['https://www.googleapis.com/auth/calendar'];

const app = express();


app.use(bodyParser.json());

// Rota para receber o código de autorização e obter o token de acesso
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    console.log('Token de acesso:', accessToken);
    console.log('Token de atualização:', refreshToken);


    res.send('Autorização concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao obter token de acesso:', error);
    res.send('200');
  }
});

// Rota para iniciar o processo de autorização
app.post('/authorize', (req, res) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  res.redirect(authorizeUrl);
});

// Rota para solicitações do webhook
app.post('/webhook', async (req, res) => {
  res.status(200).end();

  const resourceId = req.headers['x-goog-resource-id'];

  const query = 'SELECT acess_token, token_refresh, calendar_id FROM base WHERE resource_id = $1';
  const values = [resourceId];
  const result = await pool.query(query, values);

  if (result.rows.length > 0) {
    const accessToken = result.rows[0].acess_token;
    const refreshToken = result.rows[0].token_refresh;
    const calendarId = result.rows[0].calendar_id;

    const googleConfig = {
      clientId: '998930018535-59frbc5c30bs6pf8h4gkued9m0kkrif4.apps.googleusercontent.com',
      clientSecret: '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',
      apiKey: 'AIzaSyD1KXWd0RFfjvadaVmWRXUm6Ae8yU8Lxqg' 
    };

    const oAuth2Client = new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret
    );

    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    calendar.events.list({
      calendarId: calendarId,
      singleEvents: true,
      orderBy: 'updated',

    }, (err, response) => {

      if (err) return console.log('error: ' + err);
      const events = response.data.items;
    
      if (events.length) {
        for (const event of events) {

          console.log(`Event ID: ${event.id}`);
        }
      } else {
        console.log('No events found.');
      }
    })
}});




const port = 8000;
app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});

