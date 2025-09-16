const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = "db.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username text UNIQUE, 
            password text, 
            CONSTRAINT username_unique UNIQUE (username)
            )`,
        (err) => {
            if (err) {
                // Table already created
            }else{
                // Table just created, creating some rows
                var insert = 'INSERT INTO users (username, password) VALUES (?,?)'
                // Passwords should be hashed in a real app, this is just for initial setup
                db.run(insert, ["admin", "admin"])
                db.run(insert, ["user", "user"])
            }
        });  
    }
});


module.exports = db
