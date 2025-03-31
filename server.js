const { Client } = require("pg");
require("dotenv").config();
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

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


// Routing
app.get("/", async (req, res) => {
    res.render("index");
});

app.get("/courseform", async (req, res) => {
    res.render("courseform", { errors: [], formData: {code: "", name: "", progression: "", syllabus: ""} });
});

app.post("/courseform", async (req, res) => {
    const formData = {
        code: req.body.coursecode,
        name: req.body.coursename,
        progression: req.body.progression,
        syllabus: req.body.courseurl
    };
    const progressions = ["A", "B", "C"]; // Jag gör så här enbart för latheten.
    const errors = [];
    if (progressions.indexOf(req.body.progression) === -1) {
        errors.push({
            name: "Otillåtet värde i progression",
            message: `Det otillåtna värdet, ${req.body.progression}, måste vara antigen A, B eller C!`
        });
    }


    if (errors.length == 0) {
        const progressID = progressions.indexOf(formData.progression) + 1; 
        
        
        const result = await db_client.query(`
            INSERT INTO Courses (courseCode, courseName, syllabus, progressID)
            VALUES($1, $2, $3, $4)
            `, [formData.code, formData.name, formData.syllabus, progressID]);
        res.render("courseform", { errors: [], formData: {code: "", name: "", progression: "", syllabus: ""} });
        res.redirect("/");
    } else {
        return res.render("courseform", { errors: errors, formData: formData });
    }
    
});

app.get("/about", async (req, res) => {
    res.render("about");
});

// Starta
app.listen(process.env.PORT, () => {
    console.log("Server started on port: " + process.env.PORT);
});