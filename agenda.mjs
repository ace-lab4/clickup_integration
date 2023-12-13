const { google } = require('googleapis');
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
  clientId: process.env.GOOGLE_CLIENT_ID, 
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
  apiKey: process.env.GOOGLE_API_KEY,
};

export async function watchCalendar(client, calendarId, accessToken, refreshToken) {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret,
      'https://integracao-cc.onrender.com'  // substituir por url de redirecionamento
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
        address: 'https://integracao-cc.onrender.com/webhook',
      }
    });

    console.log('Watch response for calendar', calendarId, ':', watchResponse);

    const resourceId = watchResponse.data.resourceId;

    // Update the database with the resource ID
    const updateQuery = 'UPDATE base SET resource_id = $1 WHERE calendar_id = $2';
    await client.query(updateQuery, [resourceId, calendarId]);
  } catch (error) {
    console.error('Erro ao assistir o calendário:', error);
  }
}