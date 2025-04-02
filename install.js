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

db_client.query(`
    INSERT INTO Courses (coursecode, coursename, progressID, syllabus) VALUES
('dt057g', 'Webbutveckling I', 1, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT057G/'),
('dt084g', 'Introduktion till programmering i JavaScript', 1, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT084G/'),
('dt200g', 'Grafisk teknik för webb', 1, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT200G/'),
('dt068g', 'Webbanvändbarhet', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT068G/'),
('dt003g', 'Databaser', 1, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT003G/'),
('dt211g', 'Frontend-baserad webbutveckling', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT211G/'),
('dt207g', 'Backend-baserad webbutveckling', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT207G/'),
('dt208g', 'Programmering i TypeScript', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT208G/'),
('ik060g', 'Projektledning', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/IK060G/'),
('dt071g', 'Programmering i C#.net', 1, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT071G/'),
('dt193g', 'Fullstacks-utveckling med ramverk', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT193G/'),
('dt209g', 'Webbutveckling för WordPress', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT209G/'),
('dt191g', 'Webbutveckling med .NET', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT191G/'),
('dt210g', 'Fördjupad frontend-utveckling', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT210G/'),
('dt140g', 'Självständigt arbete', 2, 'https://www.miun.se/utbildning/kursplaner-och-utbildningsplaner/DT140G/');
`);