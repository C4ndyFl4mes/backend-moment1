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
    db_client.query(`SELECT * FROM Courses INNER JOIN Progressions ON Courses.progressID = Progressions.progressID;`, (error, result) => {
        if (error) {
            console.log(error);
        } else {
            res.render("index", {
                courses: result.rows
            });
        }
    });
});

/**
 * Raderar vald kurs.
 */
app.post("/", async (req, res) => {
    const id = req.body.courseid;
    try {
        const result = await db_client.query(`
            DELETE FROM Courses WHERE courseID = $1;
        `, [id]);
        res.redirect("/");
    } catch (error) {
        console.error(error);
    }
});

/**
 * Ser till att formData inte är undefined när användaren går in på courseform.
 */
app.get("/courseform", async (req, res) => {
    res.render("courseform", { errors: [], formData: { code: "", name: "", progression: "", syllabus: "" } });
});

/**
 * Validerar inmatningsfält och därefter lägger till en ny kurs i tabellen Courses.
 * Om ett inmatningsfält har fel i sig, laddas sidan om, fyller i fälten och lägger till tydliga felmeddelanden.
 */
app.post("/courseform", async (req, res) => {
    const formData = {
        code: req.body.coursecode,
        name: req.body.coursename,
        progression: req.body.progression,
        syllabus: req.body.courseurl
    };
    const progressions = ["A", "B", "C"]; // Jag gör så här enbart för latheten.
    const errors = [];

    const fieldsEmpty = emptyFields(formData); // Lagrar tommafält error eller null vid inga tomma fält.
    const tooManyCharsFields = tooManyCharacters(formData); // Lagrar för många tecken error eller null vid inga för många tecken.

    // Kollar om det finns errors lagrade.
    if (fieldsEmpty) {
        errors.push(fieldsEmpty);
    }
    if (tooManyCharsFields) {
        errors.push(tooManyCharsFields);
    }

    // Kollar om kurskoden är unik.
    if (await isCodeUnique(formData.code)) {
        errors.push({
            name: "Kurskod är inte unikt",
            message: `Kurskoder måste vara unika, en kurs med kurskoden ${formData.code} existrerar redan!`
        });
    }

    // Kollar om det är ett korrekt värde i progression.
    if (progressions.indexOf(req.body.progression) === -1 && req.body.progression != "") {
        errors.push({
            name: "Otillåtet värde i progression",
            message: `Det otillåtna värdet, ${req.body.progression}, måste vara antigen A, B eller C!`
        });
    }


    // Kollar att errors är tom innan det läggs in i tabellen. 
    // Om den inte är tom, skickas inte informationen utan den returnerar felmeddelanden och den inmatade informationen till formulärsidan.
    if (errors.length == 0) {
        const progressID = progressions.indexOf(formData.progression) + 1;
        try {
            const result = await db_client.query(`
                INSERT INTO Courses (courseCode, courseName, syllabus, progressID)
                VALUES($1, $2, $3, $4)
                `, [formData.code, formData.name, formData.syllabus, progressID]);
            return res.redirect("/");
        } catch (error) {
            console.error(error);
            return res.render("courseform", { errors: [{name: "Fel på databasen", message: "Kunde inte lägga till ny kurs!"}], formData: formData });
        }
    } else {
        return res.render("courseform", { errors: errors, formData: formData });
    }
});

/**
 * Kollar av ifall egenskaperna till formulärinformationen har för många tecken.
 * @param {object} dataFrom - formulärinformation
 * @returns {object | null} error meddelande.
 */
function tooManyCharacters(dataFrom) {
    const fields = [];
    let fieldsText = "";

    if (dataFrom.code.length > 10) {
        fields.push(`Kurskod [${dataFrom.code.length}/10]`);
    }
    if (dataFrom.name.length > 50) {
        fields.push(`Kursnamn [${dataFrom.name.length}/50]`);
    }
    if (dataFrom.syllabus.length > 100) {
        fields.push(`Länk [${dataFrom.syllabus.length}/100]`);
    }

    if (fields.length > 0) {
        for (let i = 0; i < fields.length; i++) {
            if (i == 0) {
                fieldsText += fields[i];
            } else if (i == 1 && i < fields.length - 1) {
                fieldsText += `, ${fields[i]}`;
            } else if (i == fields.length - 1) {
                fieldsText += ` och ${fields[i]}!`;
            }
        }

        return {
            name: "För många tecken",
            message: `Följande fält har för många tecken: ${fieldsText}`
        };
    } else {
        return null;
    }
}

/**
 * Kollar av ifall egenskaperna till formulärinformationen är tomma strängar.
 * @param {object} dataForm - formulärinformation
 * @returns {object | null} - error meddelande.
 */
function emptyFields(dataForm) {
    const fields = [];
    let fieldsText = "";

    if (dataForm.code == "") {
        fields.push("Kurskod");
    }
    if (dataForm.name == "") {
        fields.push("Kursnamn");
    }
    if (dataForm.progression == "") {
        fields.push("Progression");
    }
    if (dataForm.syllabus == "") {
        fields.push("Länk");
    }

    if (fields.length > 0) {
        for (let i = 0; i < fields.length; i++) {
            if (i == 0) {
                fieldsText += fields[i];
            } else if (i == 1 && i < fields.length - 1) {
                fieldsText += `, ${fields[i]}`;
            } else if (i == fields.length - 1) {
                fieldsText += ` och ${fields[i]}!`;
            }
        }
        return {
            name: "Tomma fält",
            message: `Följande fält är tomma: ${fieldsText}`
        };
    } else {
        return null;
    }

}

/**
 * Kollar om kurskoden är unik.
 * @param {string} code - kurskod
 * @returns {boolean} om kurskoden är unik eller inte.
 */
async function isCodeUnique(code) {
    const result = await db_client.query(`
        SELECT courseCode FROM Courses WHERE courseCode = $1;    
    `, [code]);
    return result.rows.length != 0;
}

/**
 * Kollar om kurskoden är unik och att den tillåter att kurskoden kan vara samma för en och samma rad.
 * Alltså den hamnar inte i en konflikt med sig själv.
 * @param {string} code - kurskod
 * @param {number} id - id på raden som är påväg att uppdateras.
 * @returns {void}
 */
async function isCodeUniqueAndNotSameRow(code, id) {
    try {
        const result = await db_client.query(`
            SELECT courseCode FROM Courses WHERE courseCode = $1 AND courseID != $2;    
        `, [code, id]);
        console.log(result.rows.length !== 0);
        return result.rows.length !== 0;
    } catch (error) {
        console.error(error);
    }
}

/**
 * Den skickar användaren till uppdateringsformuläret och fyller i uppgifterna i inmatningsfälten.
 */
app.post("/updateform", async (req, res) => {
    const progressions = ["A", "B", "C"];
    const id = req.body.courseid;
    try {
        const result = await db_client.query(`
            SELECT * FROM Courses WHERE courseid = $1;
        `, [id]);
    const formData = {
        id: id,
        code: result.rows[0].coursecode,
        name: result.rows[0].coursename,
        progression: progressions[result.rows[0].progressid - 1],
        syllabus: result.rows[0].syllabus
    };
    return res.render("updateform", { errors: [], formData: formData });
    } catch (error) {
        console.error(error);
        return res.render("updateform", { errors: [{name: "Fel på databasen", message: "Kunde inte hämta kursinformation!"}], formData: formData });
    }
});

app.post("/update", async (req, res) => {
    const progressions = ["A", "B", "C"];
    const formData = {
        id: req.body.courseid,
        code: req.body.coursecode,
        name: req.body.coursename,
        progression: req.body.progression,
        syllabus: req.body.courseurl
    };
    const errors = [];

    const fieldsEmpty = emptyFields(formData); // Lagrar tommafält error eller null vid inga tomma fält.
    const tooManyCharsFields = tooManyCharacters(formData); // Lagrar för många tecken error eller null vid inga för många tecken.

    // Kollar om det finns errors lagrade.
    if (fieldsEmpty) {
        errors.push(fieldsEmpty);
    }
    if (tooManyCharsFields) {
        errors.push(tooManyCharsFields);
    }

    // Kollar om kurskoden är unik.
    if (await isCodeUniqueAndNotSameRow(formData.code, formData.id)) {
        errors.push({
            name: "Kurskod är inte unikt",
            message: `Kurskoder måste vara unika, en kurs med kurskoden ${formData.code} existrerar redan!`
        });
    }
    // Kollar om det är ett korrekt värde i progression.
    if (progressions.indexOf(formData.progression) === -1 && formData.progression != "") {
        errors.push({
            name: "Otillåtet värde i progression",
            message: `Det otillåtna värdet, ${req.body.progression}, måste vara antigen A, B eller C!`
        });
    }
    if (errors.length == 0) {
        const progressID = progressions.indexOf(formData.progression) + 1;
        try {
            await db_client.query(`
                UPDATE Courses SET coursecode = $1, coursename = $2, progressID = $3, syllabus = $4 WHERE courseid = $5;
            `, [formData.code, formData.name, progressID, formData.syllabus, formData.id]);
            return res.redirect("/");
        } catch (error) {
            console.error(error);
            return res.render("updateform", { errors: [{name: "Fel på databasen", message: "Kunde inte uppdatera kursen!"}], formData: formData });
        }
        
    } else {
        return res.render("updateform", { errors: errors, formData: formData });
    }
});

app.get("/about", async (req, res) => {
    res.render("about");
});

// Starta
app.listen(process.env.PORT, () => {
    console.log("Server started on port: " + process.env.PORT);
});