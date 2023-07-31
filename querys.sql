CREATE TABLE base (
    id SERIAL PRIMARY KEY,
    user_id_clickup VARCHAR(255)
    calendar_id VARCHAR(255),
    email VARCHAR(255),
    access_token VARCHAR(255),
    token_refresh TEXT,
    resource_id VARCHAR(255),
    token_clickup(255)
);

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    id_evento VARCHAR(255)
    id_task VARCHAR(255),
    created VARCHAR(255),
    status VARCHAR(255),
    updated VARCHAR(255),
);

CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    email VARCHAR(250),
	id_clickup VARCHAR(250),
    role INT(50) , /* necessario futuramente */
);
