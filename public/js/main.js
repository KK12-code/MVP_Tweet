// This file contains the client-side JavaScript logic for the Twitter clone application.
// It handles user authentication (login, signup, logout), post creation, and displaying posts and users.

// Ensure the DOM is fully loaded before executing scripts.
document.addEventListener('DOMContentLoaded', () => {
    // Get references to various DOM elements.
    const loginForm = document.getElementById('login-form');       // The login form element.
    const signupForm = document.getElementById('signup-form');     // The signup form element.
    const userInfo = document.getElementById('user-info');         // Element displaying user info on dashboard.
    const postButton = document.getElementById('post-button');     // Button to submit a new post.
    const postContent = document.getElementById('post-content');   // Textarea for post content.
    const feed = document.getElementById('feed');                 // Div where posts are displayed.
    const totalUsersSpan = document.getElementById('total-users'); // Span to display total user count.
    const userListUl = document.getElementById('user-list');       // Unordered list for active users.

    // Helper function to retrieve the JWT token from local storage.
    const getToken = () => localStorage.getItem('token');

    // Function to display the logged-in user's information on the dashboard.
    const displayUserInfo = () => {
        const token = getToken();
        if (token) {
            try {
                // Decode the JWT token to get the username from its payload.
                const payload = JSON.parse(atob(token.split('.')[1]));
                document.getElementById('welcome-username').textContent = `Welcome, ${payload.username}`;
            } catch (e) {
                // If token is invalid, log error and redirect to login page.
                console.error('Invalid token');
                window.location.href = '/';
            }
        } else {
            // If no token is found, redirect to the login page.
            window.location.href = '/';
        }
    };

    // Function to fetch all posts from the server and display them in the feed.
    const fetchAndDisplayPosts = async () => {
        const res = await fetch('/api/posts'); // Fetch posts from the backend API.
        const posts = await res.json();       // Parse the JSON response.
        feed.innerHTML = '';                  // Clear existing posts in the feed.
        // Iterate over each post and create HTML elements to display them.
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('tweet-card');
            postElement.innerHTML = `
                <p><strong>${post.username}</strong></p>
                <p>${post.content}</p>
                <small>${new Date(post.timestamp).toLocaleString()}</small>
            `;
            feed.appendChild(postElement); // Add the post to the feed.
        });
    };

    // Function to fetch all registered users from the server and display them.
    const fetchAndDisplayUsers = async () => {
        console.log('Attempting to fetch and display users...');
        try {
            const res = await fetch('/api/users'); // Fetch users from the backend API.
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const users = await res.json(); // Parse the JSON response.
            console.log('Fetched users:', users);
            totalUsersSpan.textContent = users.length; // Update total user count.
            userListUl.innerHTML = '';                  // Clear existing user list.
            // Iterate over each username and add it to the user list.
            users.forEach(username => {
                const userLi = document.createElement('li');
                userLi.textContent = `• ${username}`;
                userListUl.appendChild(userLi);
            });
        } catch (error) {
            console.error('Error fetching or displaying users:', error);
        }
    };

    // If the user info element exists (i.e., on the dashboard page), display user info and fetch data.
    if (userInfo) {
        displayUserInfo();
        fetchAndDisplayPosts();
        fetchAndDisplayUsers(); // Call this function when dashboard loads
    }

    // Event listener for the post button (on the dashboard page).
    if (postButton) {
        postButton.addEventListener('click', async () => {
            const content = postContent.value; // Get content from the textarea.
            if (!content) return;             // Do nothing if content is empty.

            const token = getToken(); // Get the authentication token.
            // Send a POST request to create a new post.
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Include JWT for authentication.
                },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                postContent.value = ''; // Clear the textarea.
                fetchAndDisplayPosts(); // Refresh the posts feed.
            } else {
                const data = await res.json();
                alert(data.message); // Show error message.
            }
        });
    }

    // Event listener for the login form submission (on the login page).
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission.
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            // Send a POST request to the login API.
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token); // Store the received JWT token.
                window.location.href = '/dashboard.html'; // Redirect to the dashboard.
            } else {
                alert(data.message); // Show error message.
            }
        });
    }

    // Event listener for the signup form submission (on the signup page).
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission.
            const email = signupForm.email.value;
            const username = signupForm.username.value;
            const password = signupForm.password.value;

            // Send a POST request to the registration API.
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Registration successful! Please log in.');
                window.location.href = '/'; // Redirect to the login page.
            } else {
                alert(data.message); // Show error message.
            }
        });
    }

    // Event listener for the logout button (on the dashboard page).
    if (document.getElementById('logout-button')) {
        document.getElementById('logout-button').addEventListener('click', () => {
            localStorage.removeItem('token'); // Remove the JWT token from local storage.
            window.location.href = '/';      // Redirect to the login page.
        });
    }

    // Dark mode toggle functionality
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }

        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }
});