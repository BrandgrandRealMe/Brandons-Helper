# 🤖 Discord Docs Bot

A Discord bot that answers `/ask` commands using content from a Docusaurus-powered documentation site. It uses [HercAI](https://hercai.onrender.com/v1/chat/completions) to provide accurate, context-aware responses strictly based on your `/docs` pages.

---

## 🚀 Features

- 🧭 Automatically scrapes `/docs/*` pages using your site's `sitemap.xml`
- 🕐 Keeps docs up-to-date with hourly cron sync
- 💬 Slash command `/ask` to query your documentation
- ✨ Uses HercAI to generate helpful answers
- 🔒 Enforces Discord's 2000 character message limit
- 🛡️ Graceful error handling and prompt truncation

---

## 📦 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/discord-docs-bot.git
cd discord-docs-bot
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```env
DISCORD_TOKEN=your-discord-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-test-guild-id
BASE_URL=https://your-docusaurus-site.com
```

### 4. Deploy Slash Command

```bash
npm run deploy
```

### 5. Run the Bot

```bash
npm start
```

---

## 💡 How It Works

* **`fetchDocs.js`**: Scrapes the latest `/docs/*` content using your site's sitemap.
* **`cron-fetch.js`**: Schedules hourly updates of the documentation.
* **`index.js`**: Listens for `/ask` and responds with AI-generated answers using the HercAI API.
* **`deploy-commands.js`**: Registers your bot’s slash commands.

---

## 📁 Project Structure

```
discord-docs-bot/
├── .env.example         # Environment variable template
├── .gitignore           # Ignore node_modules, .env, and docs.txt
├── README.md            # You are here
├── index.js             # Main bot logic
├── fetchDocs.js         # Scraper from sitemap
├── cron-fetch.js        # Hourly docs sync
├── deploy-commands.js   # Slash command registration
├── docs.txt             # Auto-generated scraped content
├── package.json         # Project manifest
```

---

## 🛠️ Scripts

* `npm run deploy` — Registers the `/ask` command.
* `npm start` — Starts the bot and scheduler.
* `npm run fetch-docs` — Manually refresh the documentation.

---

## 🤝 Contributing

Pull requests are welcome! Please:

* Follow existing code style
* Write clear commit messages
* Test before pushing

---

## 📄 License

This project is MIT licensed. See `LICENSE` for details.