const { Client } = require("pg");
require("dotenv").config();

const db_client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
        rejectUnauthorized: false
    }
});

db_client.connect((error) => {
    if (error) {
        console.error(error);
    } else {
        console.log("Ansluten till databasen");
    }
});

db_client.query(`
    DROP TABLE IF EXISTS Courses;
    DROP TABLE IF EXISTS Progressions;

    CREATE TABLE Progressions(
        progressID SERIAL PRIMARY KEY,
        progression VARCHAR(1)
    );

    CREATE TABLE Courses(
        courseID SERIAL PRIMARY KEY,
        courseCode VARCHAR(10),
        courseName VARCHAR(50),
        syllabus VARCHAR(100),
        progressID INT REFERENCES Progressions(progressID)
    );
`);

db_client.query(`
    INSERT INTO Progressions (progression)
    VALUES ($1)
`, ["A"]);

db_client.query(`
    INSERT INTO Progressions (progression)
    VALUES ($1)
`, ["B"]);

db_client.query(`
    INSERT INTO Progressions (progression)
    VALUES ($1)
`, ["C"]);