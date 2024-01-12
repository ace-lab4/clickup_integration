const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const axios = require('axios');
const fetch = require('node-fetch');
const querystring = require('querystring');
const cors = require('cors');
const moment = require('moment-timezone');
const { DateTime } = require("luxon");
const dotenv = require('dotenv');
const { isNull } = require('util');
dotenv.config();

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: '142.93.62.43',
  database: 'postgres',
  password: '@Cortex@2023',
  port: 5432,
});

const app = express();

app.use(bodyParser.json());
app.use(cors());
// Configurar headers CORS no servidor
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://integracaocc.onrender.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID, 
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,  
  redirectUri: 'https://integracao-cc.onrender.com/oauth2callback'// substituir
};

const oAuth2Client = new google.auth.OAuth2(
  googleConfig.clientId,
  googleConfig.clientSecret,
  googleConfig.redirectUri
);

const scopes = ['https://www.googleapis.com/auth/calendar'];

// Rota para receber o código de autorização e obter o token de acesso
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    process.env.ACCESS_TOKEN = accessToken;
    process.env.ACCESS_TOKEN_EXPIRATION = tokens.expires_in;

    setInterval(async () => {
      const currentTime = Date.now();
      const expirationTime = process.env.ACCESS_TOKEN_EXPIRATION;

      if (currentTime > expirationTime - 86399000) {
        // Renove o token de acesso
        const newTokens = await oAuth2Client.refreshToken({
          refresh_token: refreshToken
        });

        // Atualize os tokens armazenados
        localStorage.setItem('accessToken', newTokens.access_token);
        localStorage.setItem('accessTokenExpiration', newTokens.expires_in);
      }
    }, 60000);

    await axios.post('https://integracao-cc.onrender.com/auth-success', { success: true, accessToken, refreshToken });

    res.send(`
    <script>
      window.opener.postMessage({ 
        access_token: '${accessToken}', 
        refresh_token: '${refreshToken}' 
      }, 'https://integracaocc.onrender.com');
      window.close();
    </script>
    `);
  } catch (error) {
    console.error('Erro ao obter token de acesso:', error);
    res.status(500).send('Erro ao obter token de acesso.');
  }
});


// Rota para iniciar o processo de autorização
app.get('/authorize', (req, res) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  res.redirect(authorizeUrl);
});

app.post('/auth-success', (req, res) => {
  // Enviar uma resposta simples para indicar sucesso
  res.send({ success: true });
});

//códigos de acesso clickup
const clientIDCK = process.env.CLIENT_ID_CK;  
const clientSecretCK = process.env.CLIENT_SECRET_CK; 
const redirectURI = `https://integracao-cc.onrender.com/callback` // substituir

//autorização clickup
app.get('/clickupAuth', (req, res) => {
  try {
    res.redirect(`https://app.clickup.com/api?client_id=${clientIDCK}&redirect_uri=${redirectURI}`);
  } catch (error) {
    console.error('Erro ao redirecionar para a página de autorização do ClickUp:', error);
    res.status(500).send('Ocorreu um erro ao redirecionar para a página de autorização do ClickUp.');
  }
});

//callback clickup
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post('https://api.clickup.com/api/v2/oauth/token', querystring.stringify({
      client_id: clientIDCK,
      client_secret: clientSecretCK,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectURI,
    }));

    res.send(`Token de acesso: ${tokenResponse.data.access_token}`);
  } catch (error) {
    console.error('Erro ao trocar código de autorização por token de acesso:', error.message);
    res.status(500).send('Ocorreu um erro ao obter o token de acesso.');
  }
});

app.post('/watchCalendar', async (req, res) => {
  console.log('Recebendo requisição para /watchCalendar');

  try {

    const { email, calendarId, accessToken, refreshToken, initialDate } = req.body;

    console.log("data:", email, calendarId, accessToken, refreshToken, initialDate)



    console.log("Passou");
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', 'https://integracaocc.onrender.com');
    res.header('Access-Control-Allow-Methods', 'POST, FETCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    // Start watching the calendar
    const googleConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,  
      key: process.env.GOOGLE_API_KEY, 
    };

    const oAuth2Client = new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret,
      googleConfig.key,
      'https://integracao-cc.onrender.com', // substituir por url de redirecionamento
    );

    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });


    const watchResponse = await calendar.events.watch({
      calendarId: calendarId,
      auth: oAuth2Client,
      key: oAuth2Client.apiKey,
      requestBody: {
        id: uuidv4(),
        type: 'webhook',
        params: {
          ttl: '2592000' // 1 a 2 meses
        },
        address: 'https://integracao-cc.onrender.com/webhook',
      },
    })

    const created = watchResponse.data.created

    console.log(created)

      console.log('Watch response for calendar', calendarId, ':', watchResponse.data);
      const resourceId = watchResponse.data.resourceId;

    // Save tokens and calendar ID to the database
    const checkQuery = `
    SELECT * FROM base
    WHERE calendar_id = $1;
  `;
  
  const checkResult = await pool.query(checkQuery, [calendarId]);
  
  if (checkResult.rows.length > 0) {
    // Se existir, faz um update nos tokens
    const updateQuery = `
    UPDATE base
    SET access_token = $1,
        token_refresh = $2,
        resource_id = $3,
        initial_date = $4
    WHERE calendar_id = $5;
    `;
   await pool.query(updateQuery, [accessToken, refreshToken, resourceId, initialDate, calendarId]);
  } else {
    // Se não existir, salva um novo registro
    const saveQuery = `
      INSERT INTO base (email, calendar_id, access_token, token_refresh, initial_date, resource_id)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
    await pool.query(saveQuery, [email, calendarId, accessToken, refreshToken, initialDate, resourceId]);
  }


    res.status(200).send('Operação concluída com sucesso');

  } catch (error) {
    console.error('Erro ao assistir ao calendário:', error);
    res.status(500).send('Erro ao iniciar o monitoramento do calendário');
  }
});


// Rota para solicitações do webhook
app.post('/webhook', async (req, res) => {
  res.status(200).end();

  const resourceId = req.headers['x-goog-resource-id'];

  const query = 'SELECT access_token, token_refresh, calendar_id, email, user_id_clickup, token_clickup, initial_date FROM base WHERE resource_id = $1';
  const values = [resourceId];

  let result;

  try {
    result = await pool.query(query, values);
    // Process the result
   // console.log(result);
  } catch (error) {
    // Handle the error
    console.error('Error executing query:', error);
  }

  if (result && result.rows.length > 0) {
    const accessToken = result.rows[0].access_token;
    const refreshToken = result.rows[0].token_refresh;
    const calendarId = result.rows[0].calendar_id;
    const user_id_clickup = result.rows[0].user_id_clickup;
    const tokenClickup = result.rows[0].token_clickup;
    const email = result.rows[0].email;

    const googleConfig = {
      clientId:'1068704478160-s12miv13jg9rvkp043b3o5rqp8sa3i67.apps.googleusercontent.com',
      clientSecret: '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', 
      apiKey: 'AIzaSyBWusB_45ahZtNE-7TJQR2hF0X9cz547rE',
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

    const date = new Date();

    const start_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    
    const formated_date = DateTime.fromJSDate(start_date, { zone: 'America/Sao_Paulo' });
    
    const initial_date = formated_date.toUTC().toISO();

   //console.log('data inicial do filtro:', initial_date);

    calendar.events.list({
      calendarId: calendarId,
      singleEvents: true,
      orderBy: 'updated',
      q: '#cc',
      timeZone: 'America/Sao_Paulo',
      showDeleted: true,
      updatedMin: initial_date,
      auth: oAuth2Client, 
    }, async (err, response) => {
      if (err) return console.log('Error: ' + err);

      const events = response.data.items;

      
     // console.log(events)

      const cancelledEvents = events.filter(event => event.status === 'cancelled');

      if (events.length) {
        await processEvents(events, user_id_clickup, tokenClickup, email, calendarId, initial_date, cancelledEvents);
      }
    });
  }
});

const processingTasksMap = new Map();
const activeRequests = new Set();

// função de processo de notificação e extração de dados para tarefa
async function processEvents(events, user_id_clickup, tokenClickup, email, calendarId, initial_date, cancelledEvents) {
  for (const event of events) {
    const eventId = event.id;
    const eventName = event.summary;
    const recurringEventId  = event.recurringEventId;

    if (recurringEventId) {
      // console.log(`Evento é recorrente (recurringEventId: ${recurringEventId}), não será criada nenhuma tarefa.`);
      return null;
    }
    if (!event.description) {
      // console.log(`Este evento não tem tem descrição ${eventId} com nome ${eventName}. Pulando evento.`);
      continue;
    }
    const titleParts = event.description ? event.description.split(' - ') : [];
    let spaceName, projectId, listCustom;
    
    if (titleParts.length > 3) {
      spaceName = titleParts[0];
      projectId = titleParts.slice(1, 3).join(' - ');
      listCustom = titleParts.slice(3).join(' - ');
    } else {
        spaceName = titleParts[0];
        projectId = titleParts[1];
        listCustom = titleParts[2];
    }
    const created = event.created;
    const status = event.status;
    const updated = event.updated;
    const guests = event.attendees ? event.attendees.filter(guest => guest.email.endsWith('goace.vc')) : [];
    const guestEmails = guests.map(guest => guest.email);
    const hasGoaceVcGuests = guests.length > 0;
    const dueDateTime = event.end.dateTime;
    const startDateTime = event.start.dateTime;
    const dueDate = event.end.date;
    const startDate = event.start.date;
    const declinedGuests = event.attendees ? event.attendees.filter(attendee => attendee.responseStatus === 'declined') : [];    const startDateTimeBrasilia = moment(event.start.dateTime).tz('America/Sao_Paulo');
    const dueDateTimeBrasilia = moment(event.end.dateTime).tz('America/Sao_Paulo');
    const timeDifferenceInMilliseconds = dueDateTimeBrasilia.diff(startDateTimeBrasilia, 'milliseconds');
    const timeEstimateInt32 = Math.min(timeDifferenceInMilliseconds, 2147483647);

    const eventData = {
      folderName: projectId,
      spaceName: spaceName,
      eventId: eventId,
      listCustom:listCustom,
      recurringEventId: recurringEventId,
      name: eventName,
      hasGoaceVcGuests: hasGoaceVcGuests,
      eventOwnerClickupId: user_id_clickup,
      attendeesClickupIds: [],
      attendees: (event.attendees || event.attendee || []).map(attendee => ({ email: attendee.email })),
      declinedAttendees: [],
      dueDateTime: dueDateTime,
      startDateTime: startDateTime,
      timeEstimate: timeEstimateInt32,
      dueDate: dueDate,
      startDate: startDate,
      tokenClickup: tokenClickup,
      email: email,
      status: status,
    };
    //console.log('time:', timeEstimateInt32)
    //console.log(declinedGuests);

    // buscar clickup Id 
    try {
      if (!activeRequests.has(email)) {
        activeRequests.add(email);

        const ownerResult = await pool.query('SELECT user_id_clickup FROM base WHERE email = $1', [email]);
        if (ownerResult.rows.length > 0 && ownerResult.rows[0].user_id_clickup) {
          eventData.eventOwnerClickupId = ownerResult.rows[0].user_id_clickup;
        } else {
          eventData.eventOwnerClickupId = await getOwnerClickUpIdByEmail(email, tokenClickup);
  
          const updateQuery = 'UPDATE base SET user_id_clickup = $1 WHERE email = $2';
          const updateValues = [eventData.eventOwnerClickupId, email];
          await pool.query(updateQuery, updateValues);
        }

        const guests = eventData.attendees
        ? eventData.attendees.filter(guest => guest.email.endsWith('goace.vc'))
        : [];
      
        if (guests.length > 0) {
          const emails = guests.map(guest => guest.email);
          const guestIds = await getGuestIdsFromClickUp(emails);
          await saveGuestsToDatabase(guestIds);
          console.log('ID recuperados:', guestIds);
          eventData.attendeesClickupIds = guestIds.map(guest => guest.id);
          console.log('attendeesClickupIds:', eventData.attendeesClickupIds);
        } 
        if (declinedGuests.length > 0) {
          const declinedGuestIdsToRemove = [];
          for (const declinedGuest of declinedGuests) {
            const declinedEmail = declinedGuest.email;
            const result = await pool.query('SELECT id_clickup FROM guests WHERE email = $1', [declinedEmail]);
            
            if (result.rows.length > 0) {
              const guestIdToRemove = result.rows[0].id_clickup;
              declinedGuestIdsToRemove.push(guestIdToRemove);
              console.log(`declinedes to remove ${eventId}:`,declinedGuestIdsToRemove)
            }
          }
          eventData.declinedAttendees = declinedGuestIdsToRemove;
        }
        activeRequests.delete(email);
      }
    } catch (error) {
      console.error(`Error processing event with email "${email}": ${error.message}`);
    }


    const eventExists = await checkEventExistence(eventId);
    const existingTask = await checkTaskExistence(eventId);
    

    console.log('updated do evento:', updated, eventName, initial_date)

    if (status === 'cancelled' && eventExists) {
      console.log('Evento cancelado, deletando a task.');
      await deleteTask(eventId);
    } else if(!eventExists && status !== 'cancelled'){
      await saveEvent(eventId, created, status, updated);
      console.log('Evento salvo:', eventId, created, status, updated);
    }else if (eventExists){
      console.log('Evento já existe, buscando atualização:', eventId);
      await checkEventChanges(eventId, updated);
      await updateTaskClickup(existingTask, eventData);
    }    
  
    if (!processingTasksMap.has(eventId)) {
      processingTasksMap.set(eventId, true);
    
      try {
        const existingTaskId = await checkTaskExistence(eventId);
        const eventExists = await checkEventExistence(eventId);

        if (existingTaskId) {
          console.log(`Tarefa já criada para o evento ${eventId}.`);
          return null;
        } else if (eventExists){

          const createdTaskId = await createTaskClickup(eventData, eventExists);
    
          console.log(`Tarefa criada para o evento ${eventId}: ${createdTaskId}, ${eventName}`);
          
          if (createdTaskId) {
            await updateEventWithTaskId(eventId, createdTaskId, eventExists);
            console.log(`Tarefa atualizada para o evento ${eventId}: ${createdTaskId}`);
          }
        }
        if (!eventExists){
          console.log('evento nâo foi salvo', eventName)
        }

      } catch (error) {
        console.error(`Ocorreu um erro ao executar a tarefa: ${error}`);
      } finally {
        processingTasksMap.delete(eventId);
      }
    }
  }}


// Funções para criação e manipulação da agenda e clickup

//Criação de task
async function createTaskClickup(eventData, eventExists) {
  const { folderName, spaceName, eventId, hasGoaceVcGuests, eventOwnerClickupId,
  attendeesClickupIds, name, recurringEventId, tokenClickup, attendees, listCustom, timeEstimate, dueDate, startDate, status } = eventData;

  const isAllDayEvent = !eventData.dueDateTime && !eventData.startDateTime;

  const startDateInt64 = isAllDayEvent
    ? convertDateTimeEventToInt64(dueDate)
    : convertDateTimeEventToInt64(eventData.startDateTime || startDate);

  const dueDateTimeInt64 = isAllDayEvent
    ? convertDateTimeEventToInt64(dueDate)
    : convertDateTimeEventToInt64(eventData.dueDateTime || dueDate);

  const timeEstimateInt32 = isAllDayEvent ? 8 * 3600000 : timeEstimate;
  
  if (recurringEventId) {
    console.log(`Evento é recorrente (recurringEventId: ${recurringEventId}), não será criada nenhuma tarefa.`);
    return null;
  }

  try {

    const spaceId = await getSpaceIdFromTeam(spaceName,tokenClickup);

    const folderId = await getFolderIdFromName(spaceId, folderName,tokenClickup);

    const listId = await getListIdFromFolder(folderId, folderName, tokenClickup, listCustom);

    const query = 'SELECT id_task FROM eventos WHERE id_evento = $1';
    const values = [eventId];
    const result = await pool.query(query, values);
    const existingTaskId = result.rows[0].id_task;

    if (existingTaskId) {
      console.log(`Tarefa já criada para o evento ${eventId}.`);
      return existingTaskId;
    }

    const assignees = [eventOwnerClickupId];

    if (attendeesClickupIds && attendeesClickupIds.length > 0) {
      assignees.push(...attendeesClickupIds); 
    }

   // console.log('convidados:', assignees);
    
    
    const resp = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task`,
      {
        method: 'POST',
        headers: {
          'Authorization': `18926083_add53b40790275ba0e3ea1ac9ae9f250a6f07695`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          assignees: assignees,
          start_date_time: false,
          due_date_time: false,
          start_date: startDateInt64 ,
          due_date: dueDateTimeInt64 ,
          time_estimate: timeEstimateInt32,
        }),
      }
    );

    const data = await resp.json();
   // console.log('API Response Data:', data); // Add this line to check the entire response data
    const createdTaskId = data.id;
    console.log('Created Task ID:', createdTaskId); 
    return createdTaskId;

  } catch (error) {
    console.error(`Erro ao criar a tarefa para o evento ${eventId}: ${error.message}`);
    return null;
  }
}

// atualização de tarefas no clickup
async function updateTaskClickup(taskId, eventData) {
  const {hasGoaceVcGuests,eventOwnerClickupId, attendeesClickupIds, name, recurringEventId, tokenClickup, declinedAttendees, timeEstimate, dueDate, startDate, status, eventId} = eventData;

  const isAllDayEvent = !eventData.dueDateTime && !eventData.startDateTime;

  const startDateInt64 = isAllDayEvent
    ? convertDateTimeEventToInt64(dueDate)
    : convertDateTimeEventToInt64(eventData.startDateTime || startDate);

  const dueDateTimeInt64 = isAllDayEvent
    ? convertDateTimeEventToInt64(dueDate)
    : convertDateTimeEventToInt64(eventData.dueDateTime || dueDate);

  const timeEstimateInt32 = isAllDayEvent ? 8 * 3600000 : timeEstimate;

  if (recurringEventId) {
    console.log(`Evento é recorrente (recurringEventId: ${recurringEventId}), não será criada nenhuma tarefa.`);
    return null;
  }


  if (status === 'cancelled') {
    console.log(`O evento com ID ${eventId} foi cancelado. Chamando a função para excluir a tarefa.`);
    await deleteTask(eventId);
    return null  }


  try {

    const Newassignees = [eventOwnerClickupId]; 

    if (hasGoaceVcGuests) {
      Newassignees.push(...attendeesClickupIds);
    }

   // console.log(`Assignees for ${taskId}:`, Newassignees);

    const resp = await fetch(
      `https://api.clickup.com/api/v2/task/${taskId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `18926083_add53b40790275ba0e3ea1ac9ae9f250a6f07695`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          assignees: {
            add: Newassignees,
            rem:declinedAttendees,
          },
          start_date_time: false,
          due_date_time: false,
          start_date: startDateInt64,
          due_date: dueDateTimeInt64,
          time_estimate: timeEstimateInt32,
        }),
      }
    );

    if (resp.ok) {
      console.log(`Tarefa atualizada com sucesso: ${taskId}`);
    } else {
      const errorMessage = await resp.text();
      console.error(`Erro ao atualizar tarefa ${taskId}: ${errorMessage}`);
    }
  } catch (error) {
    console.error(`Erro ao atualizar tarefa ${taskId}: ${error.message}`);
  }
}

// Função para buscar o id_clickup do convidado com base no email
async function getGuestIdsFromClickUp(emails, eventData) {
  try {
    const emailList = Array.isArray(emails) ? emails : [emails];
    const userIds = [];
    const guestsWithRole4 = [];

    // Buscar informações da equipe (team) do ClickUp
    const respTeam = await fetch(
      `https://api.clickup.com/api/v2/team`,
      {
        method: 'GET',
        headers: {
          'Authorization': '18926083_add53b40790275ba0e3ea1ac9ae9f250a6f07695',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!respTeam.ok) {
      console.error(`Error fetching team information from ClickUp: ${await respTeam.text()}`);
      return [];
    }

    const teamData = await respTeam.json();
    const membersData = teamData.teams[0].members;

    const emailToUserIdMap = new Map();

    for (const memberObj of membersData) {
      const member = memberObj.user;
      if (member.email) {
        emailToUserIdMap.set(member.email, member.id);
      }
      if (member.role === 4) {
        guestsWithRole4.push({ email: member.email, id: member.id });
      }

    }

    // Buscar o id_clickup do convidado para cada email na lista
    for (const email of emailList) {
      const userId = emailToUserIdMap.get(email);
      if (userId) {
        userIds.push({ email, id: userId });
        console.log('Convidado id:', userIds);
        return userIds;
      } else {
        console.warn(`User with email "${email}" not found in ClickUp.`);
      }
    }

    console.log('Guests with role 4:', guestsWithRole4);
    return guestsWithRole4;
  } catch (error) {
    console.error(`Error getting guest ids from ClickUp: ${error.message}`);
    throw error;
  }
}

//Busca o id clickup do criador do evento
async function getOwnerClickUpIdByEmail(email, tokenClickup) {
  try {
    const ownerResult = await pool.query('SELECT user_id_clickup FROM base WHERE email = $1', [email]);

    if (ownerResult.rows.length > 0 && ownerResult.rows[0].user_id_clickup) {
      return ownerResult.rows[0].user_id_clickup;
    } else {
      const respTeam = await fetch(
        `https://api.clickup.com/api/v2/team`,
        {
          method: 'GET',
          headers: {
            'Authorization': '18926083_add53b40790275ba0e3ea1ac9ae9f250a6f07695',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!respTeam.ok) {
        throw new Error(`Error fetching team information from ClickUp: ${await respTeam.text()}`);
      }

      const teamData = await respTeam.json();
      const membersData = teamData.teams[0].members;

      for (const memberObj of membersData) {
        const member = memberObj.user;
        if (member.email === email) {
          return member.id;
        }
      }

      throw new Error(`User with email "${email}" not found in ClickUp.`);
    }
  } catch (error) {
    console.error(`Error getting owner's ClickUp ID from email "${email}": ${error.message}`);
    throw error;
  }
}

// função para salvar o evento 
async function saveEvent(eventId, created, status, updated) {
  try {
    const checkExistenceQuery = 'SELECT * FROM eventos WHERE id_evento = $1';
    const checkExistenceValues = [eventId];
    const result = await pool.query(checkExistenceQuery, checkExistenceValues);

    if (result.rows.length === 0) {
      const insertQuery = 'INSERT INTO eventos (id_evento, created, status, updated) VALUES ($1, $2, $3, $4)';
      const insertValues = [eventId, created, status, updated];
      await pool.query(insertQuery, insertValues);
      console.log(`Event ${eventId} saved to the database.`);
    } else {
      console.log(`Event ${eventId} already exists in the database. Skipping insertion.`);
    }
  } catch (error) {
    console.error(`Error saving event ${eventId} to the database: ${error.message}`);
    throw error;
  }
}


// Salva os emails e seus respectivos userIds na tabela guests
async function saveGuestsToDatabase(userIds) {
  try {
    const insertQuery = 'INSERT INTO guests (email, id_clickup) VALUES ($1, $2)';
    const selectQuery = 'SELECT * FROM guests WHERE email = $1 AND id_clickup = $2';

    for (const user of userIds) {
      const { email, id } = user;

      const existingGuest = await pool.query(selectQuery, [email, id]);

      if (existingGuest.rows.length === 0) {
        await pool.query(insertQuery, [email, id]);
      }
    }
  } catch (error) {
    console.error(`Error saving guests to database: ${error.message}`);
    throw error;
  }
}

// Deletar task
async function deleteTask(eventId) {
  try {
  console.log('evento a ser excluido:', eventId)
  const selectQuery = 'SELECT id_task FROM eventos WHERE id_evento = $1';

  // Execute a consulta no banco de dados
  const result = await pool.query(selectQuery, [eventId]);

  // Verifique se há resultados da consulta
  if (result.rows.length > 0) {
    // Obtenha a taskId a partir dos resultados da consulta
    const taskId = result.rows[0].id_task;

    console.log('task a ser excluida:', taskId)
    
    const query = new URLSearchParams({
      custom_task_ids: 'false',
      team_id: '12926935'
    }).toString();

    // Faça a solicitação para excluir a tarefa no ClickUp
    const resp = await fetch(
    `https://api.clickup.com/api/v2/task/${taskId}?${query}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': '18926083_add53b40790275ba0e3ea1ac9ae9f250a6f07695',
          'Content-Type': 'application/json',
        }
      }
    );
    if (resp.ok) {
      // Exclusão bem-sucedida
      removeEventFromDatabase(eventId);
      const data = await resp.text();
      console.log('Excluído:', data);
    } else {
      // Tratar erro na exclusão
      console.error('Erro ao excluir a tarefa:', resp.statusText);
    }
  } 
  } 
  catch (error) {
    console.error('Erro na requisição para excluir a tarefa:', error.message);
  }
}


// Atribuir tarefa a convidados do espaço
 /* async function addGuestToTask(createdTaskId, query, tokenClickup) {
  const guestsWithRole4 = await getGuestIdsFromClickUp(emails);

 try {
    for (const guest of guestsWithRole4) {
    const guestID = guest.id;     

    const resp = await fetch(
      `https://api.clickup.com/api/v2/task/${createdTaskId}/guest/${guestID}?${query}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenClickup}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!resp.ok) {
      console.error(`Error adding guest ${guestId} to task ${createdTaskId}: ${await resp.text()}`);
    } else {
      console.log(`Guest ${guestId} added to task ${createdTaskId}.`);
    }
  }
  } catch (error) {
    console.error(`Error adding guest ${guestId} to task ${createdTaskId}: ${error.message}`);
  }
}*/


// Funções para hierarquização de pastas, spaces e listas do clickup

async function getSpaceIdFromTeam(spaceName, tokenClickup) {
  try {
    // team id ace: 
    const teamId = '12926935';

    const resp = await fetch(
      `https://api.clickup.com/api/v2/team/12926935/space`,
      {
        method: 'GET',
        headers: {
          'Authorization': '18926083_add53b40790275ba0e3ea1ac9ae9f250a6f07695',
          'Content-Type': 'application/json',
        },
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      const space = data.spaces.find(space => space.name.trim().toLowerCase() === spaceName.trim().toLowerCase());
      if (space) {
        return space.id;
      } else {
        throw new Error(`Space with name "${spaceName}" not found in team with ID "12926935".`);
      }
    } else {
      throw new Error(`Error fetching spaces from team with ID "12926935": ${await resp.text()}`);
    }
  } catch (error) {
    console.error(`Error getting spaceId from name for team "12926935" and spaceName "${spaceName}": ${error.message}`);
    throw error;
  }
}

async function getFolderIdFromName(spaceId, folderName, tokenClickup) {
  try {
    const resp = await fetch(
      `https://api.clickup.com/api/v2/space/${spaceId}/folder`,
      {
        method: 'GET',
        headers: {
          'Authorization': '18926083_add53b40790275ba0e3ea1ac9ae9f250a6f07695',
          'Content-Type': 'application/json',
        },
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      let folderId;

      const folder = data.folders.find(folder => {
        if (/\d/.test(folderName)) {
          const code = folder.name.match(/\d+/);
          return code && code[0] === folderName;
        } else {
          return folder.name.trim().toLowerCase() === folderName.trim().toLowerCase();
        }
      });

      if (folder) {
        folderId = folder.id;
      } else {
        throw new Error(`Folder with name "${folderName}" not found in space with ID "${spaceId}".`);
      }
      return folderId;
      
    } else {
      throw new Error(`Error fetching folders from space with ID "${spaceId}": ${await resp.text()}`);
    }
  } catch (error) {
    console.error(`Error getting folderId from name for spaceId "${spaceId}" and folderName "${folderName}": ${error.message}`);
    throw error;
  }
}


async function getListIdFromFolder(folderId, folderName, tokenClickup, listCustom) {
  const defaultListName = /\d/.test(folderName) ? 'cronograma' : 'calendario';
  
  // If listCustom is not provided or empty, use the default list name
  const listNameToSearch = listCustom && listCustom.trim() ? listCustom.toLowerCase() : defaultListName;
  
  // console.log('token de acesso', tokenClickup);
  return await getListIdFromName(folderId, listNameToSearch, tokenClickup);
}



async function getListIdFromName(folderId, listNameToSearch, tokenClickup) {
  try {
    if (!listNameToSearch) {
      throw new Error('List name to search is missing or null.');
    }

    const resp = await fetch(
      `https://api.clickup.com/api/v2/folder/${folderId}/list`,
      {
        method: 'GET',
        headers: {
          'Authorization': '18926083_add53b40790275ba0e3ea1ac9ae9f250a6f07695',
          'Content-Type': 'application/json',
        },
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      
      // Find the list using a case-insensitive and whitespace-trimmed comparison
      const list = data.lists.find(list => list.name.trim().toLowerCase() === listNameToSearch.trim().toLowerCase());
      
      if (list) {
        return list.id;
      } else {
        throw new Error(`List with name "${listNameToSearch}" not found in folder with ID "${folderId}".`);
      }
    } else {
      throw new Error(`Error fetching lists from folder with ID "${folderId}": ${await resp.text()}`);
    }
  } catch (error) {
    console.log('token:', tokenClickup);
    console.error(`Error getting listId from name for folderId "${folderId}" and listName "${listNameToSearch}": ${error.message}`);
    throw error;
  }
}


//  Update e mudanças em eventos e tarefas

// checar existência de evento
async function checkEventExistence(eventId) {
  const query = 'SELECT * FROM eventos WHERE id_evento = $1';
  const values = [eventId];
  const result = await pool.query(query, values);
  return !!result.rows.length;
}

//checar mudança de eventos
async function checkEventChanges(eventId, updated) {
  const query = 'SELECT updated, status FROM eventos WHERE id_evento = $1';
  const values = [eventId];
  const result = await pool.query(query, values);

  if (result.rows.length > 0) {
    const storedUpdated = result.rows[0].updated;
    const storedStatus = result.rows[0].status;

    if (storedUpdated !== updated) {
      const updateQuery = 'UPDATE eventos SET updated = $1, status = $2 WHERE id_evento = $3';
      const updateValues = [updated, storedStatus, eventId];
      await pool.query(updateQuery, updateValues);
      return true;
    }
  } else {
    console.log(`Evento com id_evento ${eventId} não encontrado.`);
  }

  return false;
}



// conversão de data para int<int64>
function convertDateTimeEventToInt64(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const int64Date = date.getTime();
  return int64Date;
}

async function updateEventWithTaskId(eventId, taskId) {
  const query = 'UPDATE eventos SET id_task = $1 WHERE id_evento = $2';
  const values = [taskId, eventId];
  await pool.query(query, values);
}

async function findUserIdByGoaceEmail(email) {
  const query = 'SELECT user_id_clickup FROM base WHERE email = $1';
  const values = [email];
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? result.rows[0].user_id_clickup : null;
}

async function checkTaskExistence(eventId) {
  const query = 'SELECT id_task FROM eventos WHERE id_evento = $1';
  const values = [eventId];
  const result = await pool.query(query, values);

  if (result.rows.length > 0) {
    return result.rows[0].id_task;
  }

  return null; 
}

async function removeEventFromDatabase(eventId) {
  try {
    const deleteQuery = 'DELETE FROM eventos WHERE id_evento = $1';
    await pool.query(deleteQuery, [eventId]);
    console.log(`Task e evento excluidos do banco: ${eventId}`);
  } catch (error) {
    console.error(`Erro ao remover evento do banco: ${error.message}`);
    throw error;
  }
}

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor iniciado em https://integracao-cc.onrender.com`);
});
/* 
app.listen(port, () => {
  console.log(`Servidor iniciado em https://integracao-cc.onrender.com/`);
})
 */
