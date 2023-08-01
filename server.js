const { parseISO, getYear, getMonth, getDate, startOfDay, endOfDay } = require('date-fns');
const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

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

const googleConfig = {
  clientId: '998930018535-2lh1765ss4lm6204qbnv8tjesr678gba.apps.googleusercontent.com',
  clientSecret: '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',
  redirectUri: 'http://localhost:8000/oauth2callback'
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

    console.log('Token de acesso:', accessToken);
    console.log('Token de atualização:', refreshToken);


    res.send('Autorização concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao obter token de acesso:', error);
    res.send('200');
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

// Rota para solicitações do webhook
app.post('/webhook', async (req, res) => {
  res.status(200).end();

  const resourceId = req.headers['x-goog-resource-id'];

  const query = 'SELECT acess_token, token_refresh, calendar_id, user_id_clickup FROM base WHERE resource_id = $1';
  const values = [resourceId];
  const result = await pool.query(query, values);

  if (result.rows.length > 0) {
    const accessToken = result.rows[0].acess_token;
    const refreshToken = result.rows[0].token_refresh;
    const calendarId = result.rows[0].calendar_id;
    const user_id_clickup = result.rows[0].user_id_clickup;

    const googleConfig = {
      clientId: '998930018535-2lh1765ss4lm6204qbnv8tjesr678gba.apps.googleusercontent.com',
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
    }, async (err, response) => {
      if (err) return console.log('Error: ' + err);

      const events = response.data.items;

      if (events.length) {
        await processEvents(events, user_id_clickup);
      }
    });
  }
});

const processingTasksMap = new Map();

// função de processo de notificação e extração de dados para tarefa
async function processEvents(events, user_id_clickup) {
  for (const event of events) {
    const eventId = event.id;
    const titleParts = event.summary.split(' - ');
    const eventName = titleParts[0];
    const folderId = titleParts[1];
    const listName = titleParts[2];
    const created = event.created;
    const status = event.status;
    const updated = event.updated;
    const guests = event.attendees ? event.attendees.filter(guest => guest.email.endsWith('goace.vc')) : [];
    const hasGoaceVcGuests = guests.length > 0;
    const dueDateTime = event.end.dateTime;
    const startDateTime = event.start.dateTime;
    const dueDate = event.end.date;
    const startDate = event.start.date;
    const recurringEventId  = event.recurringEventId;

    const eventData = {
      folderId: folderId,
      listName: listName,
      eventId: eventId,
      recurringEventId: recurringEventId,
      name: eventName,
      hasGoaceVcGuests: hasGoaceVcGuests,
      user_id_clickup: user_id_clickup,
      attendees: (event.attendees || event.attendee || []).map(attendee => ({ email: attendee.email })),
      dueDateTime: dueDateTime,
      startDateTime: startDateTime,
      dueDate: dueDate,
      startDate: startDate,
    };

    if (recurringEventId) {
      console.log(`Evento é recorrente (recurringEventId: ${recurringEventId}), não será criada nenhuma tarefa.`);
      return null;
    }
    
    const eventExists = await checkEventExistence(eventId);
    const existingTask = await checkTaskExistence(eventId);

    if (!eventExists) {
      await saveEvent(eventId, created, status, updated);
      console.log('Evento salvo:', eventId, created, status, updated);
    } else {
      console.log('Evento já existe,buscando atualização: ', eventId);
      await checkEventChanges(eventId, updated);
      await updateTaskClickup(existingTask, eventData);

      if (!processingTasksMap.has(eventId)) {
        processingTasksMap.set(eventId, true);

        const existingTaskId = await checkTaskExistence(eventId);

        if (existingTaskId) {
          console.log(`Tarefa já criada para o evento ${eventId}.`);
        } else {
          const createdTaskId = await createTaskClickup(eventData);
          if (createdTaskId) {
            await updateEventWithTaskId(eventId, createdTaskId);
            console.log(`Tarefa criada para o evento ${eventId}: ${createdTaskId}`);
          } else {
            console.log(`Tarefa não encontrada para o evento ${eventId}.`);
          }
        processingTasksMap.delete(eventId);
        }
      }
    }
  }
}

// função para salvar o evento 
async function saveEvent(eventId, created, status, updated) {
  const eventExists = await checkEventExistence(eventId);
  if (!eventExists) {
    const query = 'INSERT INTO eventos (id_evento, id_task, created, status, updated) VALUES ($1, $2, $3, $4, $5)';
    const values = [eventId, null, created, status, updated];
    await pool.query(query, values);
  } else {
    const updateQuery = 'UPDATE eventos SET created = $2, status = $3, updated = $4 WHERE id_evento = $1';
    const updateValues = [eventId, created, status, updated];
    await pool.query(updateQuery, updateValues);
  }
}

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

  const storedUpdated = result.rows[0].updated;
  const storedStatus = result.rows[0].status;

  if (storedUpdated !== updated) {
    const updateQuery = 'UPDATE eventos SET updated = $1, status = $2 WHERE id_evento = $3';
    const updateValues = [updated, storedStatus, eventId];
    await pool.query(updateQuery, updateValues);
    return true;
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

//criação de da tarefa no clickup
async function createTaskClickup(eventData) {
  const { folderId, listName, eventId, hasGoaceVcGuests, user_id_clickup, name, recurringEventId} = eventData;
  
  const isAllDayEvent = !eventData.dueDateTime && !eventData.startDateTime;

  const dueDateTimeInt64 = isAllDayEvent ? convertDateTimeEventToInt64(eventData.dueDate) : convertDateTimeEventToInt64(eventData.dueDateTime || eventData.dueDate);
  const startDateTimeInt64 = isAllDayEvent ? convertDateTimeEventToInt64(eventData.startDate) : convertDateTimeEventToInt64(eventData.startDateTime || eventData.startDate);
 
  if (recurringEventId) {
    console.log(`Evento é recorrente (recurringEventId: ${recurringEventId}), não será criada nenhuma tarefa.`);
    return null;
  }

  try {
    const query = 'SELECT id_task FROM eventos WHERE id_evento = $1';
    const values = [eventId];
    const result = await pool.query(query, values);
    const existingTaskId = result.rows[0].id_task;

    if (existingTaskId) {
      console.log(`Tarefa já criada para o evento ${eventId}.`);
      return existingTaskId;
    }

    const assignees = [user_id_clickup];

    const listId = await getListIdFromName(folderId, listName);

    if (hasGoaceVcGuests) {
      const goaceVcGuests = eventData.attendees.filter(guest => guest.email.endsWith('goace.vc'));
      const goaceVcUserIds = await Promise.all(goaceVcGuests.map(async guest => {
        const goaceVcEmail = guest.email;
        return await findUserIdByGoaceEmail(goaceVcEmail);
      }));
      assignees.push(...goaceVcUserIds.filter(id => id !== null));
    }

    const resp = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'pk_44248054_AIOJURUIS2YVAX00VNWMAVY7MPGP7P3J',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          status: 'In progress',
          assignees: assignees,
          start_date_time: false,
          due_date_time: false,
          start_date: startDateTimeInt64 ,
          due_date: dueDateTimeInt64 ,
        }),
      }
    );

    const data = await resp.json();
    const createdTaskId = data.id;
    return createdTaskId;

  } catch (error) {
    console.error(`Erro ao criar a tarefa para o evento ${eventId}: ${error.message}`);
    return null;
  }
}

async function getListIdFromName(folderId, listName) {
  try {
    const resp = await fetch(
      `https://api.clickup.com/api/v2/folder/${folderId}/list`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'pk_44248054_AIOJURUIS2YVAX00VNWMAVY7MPGP7P3J',
          'Content-Type': 'application/json',
        },
      }
    );

    if (resp.ok) {
      const data = await resp.json();
      const list = data.lists.find(list => list.name === listName);
      if (list) {
        return list.id;
      } else {
        throw new Error(`List with name "${listName}" not found in folder with ID "${folderId}".`);
      }
    } else {
      throw new Error(`Error fetching lists from folder with ID "${folderId}": ${await resp.text()}`);
    }
  } catch (error) {
    console.error(`Error getting listId from name for folderId "${folderId}" and listName "${listName}": ${error.message}`);
    throw error;
  }
}

// atualização de tarefas no clickup
async function updateTaskClickup(taskId, eventData) {
  const {hasGoaceVcGuests, user_id_clickup, name, recurringEventId } = eventData;

  const isAllDayEvent = !eventData.dueDateTime && !eventData.startDateTime;

  const dueDateTimeInt64 = isAllDayEvent ? convertDateTimeEventToInt64(eventData.dueDate) : convertDateTimeEventToInt64(eventData.dueDateTime || eventData.dueDate);
  const startDateTimeInt64 = isAllDayEvent ? convertDateTimeEventToInt64(eventData.startDate) : convertDateTimeEventToInt64(eventData.startDateTime || eventData.startDate);
  
  if (recurringEventId) {
    console.log(`Evento é recorrente (recurringEventId: ${recurringEventId}), não será criada nenhuma tarefa.`);
    return null;
  }

  try {
    const assignees = [user_id_clickup];

    if (hasGoaceVcGuests) {
      const goaceVcGuests = eventData.attendees.filter(guest => guest.email.endsWith('goace.vc'));
      const goaceVcUserIds = await Promise.all(goaceVcGuests.map(async guest => {
        const goaceVcEmail = guest.email;
        return await findUserIdByGoaceEmail(goaceVcEmail);
      }));
      assignees.push(...goaceVcUserIds.filter(id => id !== null));
    }

    const resp = await fetch(
      `https://api.clickup.com/api/v2/task/${taskId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': 'pk_44248054_AIOJURUIS2YVAX00VNWMAVY7MPGP7P3J',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          assignees: assignees,
          start_date_time: false,
          due_date_time: false,
          start_date: startDateTimeInt64,
          due_date: dueDateTimeInt64,
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


const port = 8000;
app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});



