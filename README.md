# Server-baserad Webbutveckling Moment 1

En webbplats som använder Express och EJS för att visa innehåll och med PostgreSQL för att hantera databasen. En användare kan lägga till, ändra och radera en kurs genom formulär.
Validering av formulär sker på server sidan och skickar tillbaka felmeddelanden vid inkorrekt inmatning. Exempelvis en funktion som kontrollerar att kurskoder är unika genom att gå igenom tabellen, leta matchande rader och därefter returnera en boolean.
