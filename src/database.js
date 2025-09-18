const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const DBSOURCE = "db.sqlite";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }
    console.log('Connected to the SQLite database.');

    db.serialize(() => {
        // Create the users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            CONSTRAINT username_unique UNIQUE (username),
            CONSTRAINT email_unique UNIQUE (email)
        )`, (err) => {
            if (err) {
                return console.error('Error creating users table:', err.message);
            }
            // Check if the users table is empty
            db.get(`SELECT count(*) as count FROM users`, async (err, row) => {
                if (err) {
                    return console.error('Error counting users:', err.message);
                }
                if (row.count === 0) {
                    // Insert dummy users if the table is empty
                    console.log('Users table is empty, inserting dummy data.');
                    const saltRounds = 10;
                    const adminPassword = await bcrypt.hash('admin', saltRounds);
                    const userPassword = await bcrypt.hash('user', saltRounds);
                    const insert = 'INSERT INTO users (username, email, password) VALUES (?,?,?)';
                    db.run(insert, ["admin", "admin@example.com", adminPassword]);
                    db.run(insert, ["user", "user@example.com", userPassword]);
                }
            });
        });

        // Create the posts table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);
    });
});

module.exports = db;