require('dotenv').config(); 
const mysql = require('mysql2/promise');

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
}


async function insertGeneration(title, topic, template, userId, type) {
    const connection = await mysql.createConnection(config);
    try {
        const [result] = await connection.execute(
            'INSERT INTO ebooks_generated (title, topic, template, user, type) VALUES (?, ?, ?, ?, ?)',
            [title, topic, template, userId, type]
        );
        await connection.end();
        return result;
    } catch (error) {
        await connection.end();
        throw error;
    }
}

 module.exports = {
    insertGeneration
};
 






/*
CREATE DATABASE ebookgendb;

USE ebookgendb;

CREATE TABLE ebooks_generated (
id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
user VARCHAR(255),
date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
topic VARCHAR(255) NOT NULL,
template VARCHAR(255) NOT NULL
);

'INSERT INTO ebooks_generated (id, user, date, topic, template)
 VALUES 'fred', NOW(), 'how to sell books', 'romance.docx');'
 
SELECT * FROM ebooks_generated;*/