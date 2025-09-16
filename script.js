document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    const getUsers = () => {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    };

    const saveUsers = (users) => {
        localStorage.setItem('users', JSON.stringify(users));
    };

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = signupForm.username.value;
            const password = signupForm.password.value;

            const users = getUsers();

            if (users.find(user => user.username === username)) {
                alert('Username already exists!');
                return;
            }

            users.push({ username, password });
            saveUsers(users);

            alert('Registration successful! Please log in.');
            window.location.href = 'index.html';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            const users = getUsers();

            const user = users.find(user => user.username === username && user.password === password);

            if (user) {
                alert('Login successful!');
                // You can redirect to a dashboard or another page here
            } else {
                alert('Invalid username or password!');
            }
        });
    }
});
