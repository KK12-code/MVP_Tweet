
// This script is for a one-time cleanup of the database.
// It removes all users who do not have an email address, along with their posts.
// The user 'thor' is exempt from this cleanup.

const db = require('./database.js');

const cleanup = () => {
    // Find all users who do not have an email and are not named 'thor'.
    const findUsersSql = "SELECT id, username FROM users WHERE email IS NULL AND username != 'thor'";

    db.all(findUsersSql, [], (err, users) => {
        if (err) {
            console.error("Error finding users to delete:", err.message);
            return;
        }

        if (users.length === 0) {
            console.log("No users to delete.");
            return;
        }

        const userIdsToDelete = users.map(user => user.id);
        const usernamesToDelete = users.map(user => user.username);

        console.log("Users to delete:", usernamesToDelete.join(', '));

        // Delete posts by these users.
        const deletePostsSql = `DELETE FROM posts WHERE user_id IN (${userIdsToDelete.join(',')})`;
        db.run(deletePostsSql, [], function(err) {
            if (err) {
                console.error("Error deleting posts:", err.message);
                return;
            }
            console.log(`Deleted ${this.changes} posts.`);

            // Delete the users.
            const deleteUsersSql = `DELETE FROM users WHERE id IN (${userIdsToDelete.join(',')})`;
            db.run(deleteUsersSql, [], function(err) {
                if (err) {
                    console.error("Error deleting users:", err.message);
                    return;
                }
                console.log(`Deleted ${this.changes} users.`);
            });
        });
    });
};

cleanup();
