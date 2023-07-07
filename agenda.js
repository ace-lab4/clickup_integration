const { google } = require('googleapis');
const { Client } = require('pg');
const servidor = require('../server/server.js'); 

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'calendar_clickup',
  password: '122113',
  port: 5432,
});

async function watchEvents(calendarId) {
  try {
    const credentials = {
      client_id: '974279755161-1qjf6heheh5ltu25ahlc2ptlt33bqcq2.apps.googleusercontent.com',
      client_secret: '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',
    };

   // const auth = new google.auth.OAuth2(
  //  credentials.client_id,
  //    credentials.client_secret,
  //   'http://localhost:8000/', 
  //);

    const auth = new google.auth.OAuth2().generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],

    })
    console.log(auth);
    const calendar = google.calendar({ version: 'v3', auth });
}finally {
  await client.end();
}
}

watchEvents();

  /*  const watchResponse = await calendar.events.watch({
    calendarId,
    resource: {
      type: 'web_hook',
      address: 'http://localhost:8000/callback',
    },
  }); 

  console.log('Assinatura criada com sucesso para o calendário', calendarId);


   const query = 'SELECT user_id_clickup FROM base WHERE calendar_id = $1';
   const result = await client.query(query, [calendarId]);

   if (result.rows.length > 0) {
     const user_id_clickup = result.rows[0].user_id_clickup;
     console.log('user_id_clickup:', user_id_clickup);
   }
 } catch (error) {
   console.error('Erro:', error);
 }
}

async function watchCalendars() {
  try {

    await client.connect();

    const query = 'SELECT calendar_id FROM base';
    const result = await client.query(query);

    if (result.rowCount === 0) {
      throw new Error('Nenhum calendário encontrado');
    }

    // Iterar sobre cada calendário 
    for (const row of result.rows) {
      const calendarId = row.calendar_id;
      await watchEvents(calendarId);
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}


watchCalendars();



útil: google.calendar(version:'v3', auth).events.watch() */
