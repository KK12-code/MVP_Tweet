// This file sets up the backend server for the Twitter clone using Node.js and Express.
// It handles user authentication (registration, login), post creation, and fetching posts/users.

// Import necessary modules
const express = require('express'); // Express.js framework for building web applications
const path = require('path');     // Utility for working with file and directory paths
const db = require('./database.js'); // Custom module for database interactions
const bcrypt = require('bcrypt');   // Library for hashing passwords
const jwt = require('jsonwebtoken'); // Library for creating and verifying JSON Web Tokens (JWTs)
const cors = require('cors');     // Middleware to enable Cross-Origin Resource Sharing (CORS)

// Initialize the Express application
const app = express();
// Define the port the server will listen on. Uses environment variable PORT or defaults to 8080.
const PORT = process.env.PORT || 8080;
// Secret key for signing and verifying JWTs. IMPORTANT: In a production environment,
// this should be stored securely as an environment variable, not hardcoded.
const JWT_SECRET = 'your_jwt_secret';

// In-memory store for active users.
// NOTE: This is not a robust solution for a production environment.
// A more persistent store like a database or a cache (e.g., Redis) should be used.
let activeUsers = [];

// Middleware setup
app.use(cors()); // Enable CORS for all routes, allowing requests from different origins
app.use(express.json()); // Parse incoming JSON requests, making req.body available

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Root route to serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ message: 'Email, username, and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (email, username, password) VALUES (?,?,?)';
        const params = [email, username, hashedPassword];

        db.run(sql, params, function(err) {
            if (err) {
                res.status(400).json({ message: 'Email or username already taken' });
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
            console.log('Login failed: User not found');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('User found:', user);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            console.log('Login failed: Password mismatch');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        // Add user to active users list if not already there
        if (!activeUsers.includes(username)) {
            activeUsers.push(username);
        }

        res.json({ message: 'Logged in successfully', token });
    });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    const { username } = req.body;
    activeUsers = activeUsers.filter(user => user !== username);
    res.json({ message: 'Logged out successfully' });
});


// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Create a post endpoint
app.post('/api/posts', authenticateToken, (req, res) => {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    const sql = 'INSERT INTO posts (user_id, content) VALUES (?,?)';
    db.run(sql, [userId, content], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        res.status(201).json({ message: 'Post created', postId: this.lastID });
    });
});

// Get all posts endpoint
app.get('/api/posts', (req, res) => {
    const sql = `
        SELECT p.id, u.username, p.content, p.timestamp 
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.timestamp DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        res.json(rows);
    });
});

// Get all users (usernames) endpoint
app.get('/api/users', (req, res) => {
    const sql = 'SELECT username FROM users';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        res.json(rows.map(row => row.username));
    });
});

// Endpoint to get active users
app.get('/api/active-users', (req, res) => {
    res.json(activeUsers);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
