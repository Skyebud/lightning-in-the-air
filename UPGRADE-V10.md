# Upgrade an existing GitHub repository to Version 10

Use the update ZIP rather than deleting the whole repository folder.

1. Close VS Code and GitHub Desktop only if a file is currently locked.
2. Extract `lightning-in-the-air-v10-update.zip`.
3. Copy its contents into the existing local repository and allow Windows to replace matching files.
4. Leave `.git` untouched.
5. Leave your existing `js/firebase-config.js` untouched. The update ZIP does not contain it.
6. In Firebase Console, publish the updated `firestore.rules`.
7. Publish `storage.rules` if Storage is enabled.
8. Commit with a message such as `Add live updates and image focal controls`.
9. Push origin.
