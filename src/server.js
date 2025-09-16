const express = require('express');
const path = require('path');
const db = require('./database.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = 'your_jwt_secret'; // In a real app, use an environment variable for this

app.use(cors());
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Root route to serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password) VALUES (?,?)';
        const params = [username, hashedPassword];

        db.run(sql, params, function(err) {
            if (err) {
                res.status(400).json({ message: 'Username already taken' });
                return;
            }
            res.status(201).json({ message: 'User created', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Logged in successfully', token });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
