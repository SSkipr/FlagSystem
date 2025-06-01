# SSkipr Flag System Discord Bot

A Discord bot for managing user notes, categories, and flags, with rich user info display using the DiscordLookup API.

---

## Features

- **Add Notes**: Attach notes to any user by Discord mention or user ID.
- **Categorize Users**: Assign categories (e.g., chill, annoying) to users.
- **View Notes**: See all notes you've made about a user, with their Discord profile info (avatar, badges, etc.).
- **View All Notes**: Paginated view of all notes you've made, with user info for each.
- **Delete Notes**: Remove notes for a user.
- **Rich Embeds**: User info is displayed in Discord embeds, including:
  - Username and global name
  - Profile picture (avatar)
  - Badges
  - Accent color

---

## Commands

| Command         | Description                                      |
|-----------------|--------------------------------------------------|
| `/note`         | Add a note and categorize a user                 |
| `/viewnotes`    | View all notes you have made about a user        |
| `/allnotes`     | Print all notes you have made, for all users     |
| `/deletenote`   | Delete a note for a user                         |

---

## Usage

1. **Invite the Bot**  
   [Click here to invite the bot to your server.](https://discord.com/oauth2/authorize?client_id=1378495069275029615)

2. **Add a Note**
   - Use `/note` and select a user or provide a user ID.
   - Enter your note and select a category.

3. **View Notes**
   - Use `/viewnotes` and select a user or provide a user ID.
   - The bot will show all your notes for that user, with their profile info.

4. **View All Notes**
   - Use `/allnotes` to see a paginated list of all notes you've made, with user info for each.

5. **Delete a Note**
   - Use `/deletenote` and select a user or provide a user ID.

---

## Setup & Installation (install Locally)

1. **Clone the repository**
   ```sh
   git clone https://github.com/sskipr/sskipr-flag-system.git
   cd sskipr-flag-system
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file with your bot token:
     ```
     BOT_TOKEN=your_discord_bot_token
     CLIENT_ID=your_discord_client_id
     ```

4. **Run the bot**
   ```sh
   node index.js
   ```

---

## Notes Storage

- Notes are stored in a local `notes.json` file.
- Each note is associated with the user who created it and the target user.

---

## API Usage

- This bot uses the [DiscordLookup API](https://discordlookup.mesalytic.moe/) to fetch user profile information for display in embeds.

---

## Credits

- [discord.js](https://discord.js.org/)
- [DiscordLookup API](https://discordlookup.mesalytic.moe/) 
