/* const { google } = require('googleapis');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// db config 
 //substituir
 const dbConfig = {
  user: 'postgres',
  host: '142.93.62.43',
  database: 'postgres',
  password: '@Cortex@2023',
  port: 5432,
};

// google credentials config
const googleConfig = {
  clientId: '1068704478160-s12miv13jg9rvkp043b3o5rqp8sa3i67.apps.googleusercontent.com', 
  clientSecret: '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', 
  apiKey: 'AIzaSyBWusB_45ahZtNE-7TJQR2hF0X9cz547rE',
};

async function watchCalendar(client, calendarId, accessToken, refreshToken) {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret,
     // 'https://integracao-cc.onrender.com'
     'https://dbb3a7466258-10788679143900993082.ngrok-free.app' // substituir por url de redirecionamento
    );

    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const watchResponse = await calendar.events.watch({
      calendarId: calendarId,
      requestBody: {
        id: uuidv4(),
        type: 'webhook', 
        address: 'https://dbb3a7466258-10788679143900993082.ngrok-free.app/webhook',
      }
    });

    console.log('Watch response for calendar', calendarId, ':', watchResponse);

    const resourceId = watchResponse.data.resourceId;

    const updateQuery = 'UPDATE base SET resource_id = $1 WHERE calendar_id = $2';
    await client.query(updateQuery, [resourceId, calendarId]);
  } catch (error) {
    console.error('Erro ao assistir o calendário:', error);
  }
}

async function loopWatch(client) {
  try {
    const query = 'SELECT calendar_id, access_token, token_refresh FROM base';
    const result = await client.query(query);

    for (const row of result.rows) {
      const calendarId = row.calendar_id;
      const accessToken = row.access_token;
      const refreshToken = row.token_refresh;

      await watchCalendar(client, calendarId, accessToken, refreshToken);
    }
  } catch (error) {
    console.error('Erro no loop de watch:', error);
  }
}

async function main() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    await loopWatch(client);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error('Erro na execução principal:', error);
});
*/