const express = require("express");
const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(express.static("public"));

// Routing
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/courseform", (req, res) => {
    res.render("courseform");
});

app.get("/about", (req, res) => {
    res.render("about");
});

// Starta
app.listen(port, () => {
    console.log("Server started on port: " + port);
});