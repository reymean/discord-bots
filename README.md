# Discord bots for a community server

Two bots I built with **Claude** to set up and run the Discord server for HUB.ea, a Dallas-area community for young Eurasian professionals that I co-founded.

| Bot | What it does | Needs |
|---|---|---|
| [`ai-channel-builder/`](ai-channel-builder) | Type a request in plain English and Claude designs the channels | Discord token + Anthropic API key |
| [`server-admin-bot/`](server-admin-bot) | 23 slash commands for channels, access, roles, announcements and moderation | Discord token only |

## Why two versions

I first wanted to describe the server I wanted and have it built for me. Version 1 does that by sending the request to the Claude API. I didn't have an API key at the time, so I had Claude rebuild it as version 2: a full admin bot with slash commands that doesn't need any AI service, and covers much more than creating channels.

## 1. AI channel builder

```
!build create a category called Events with an announcements channel and a voice lounge
```

1. The bot sends the request to Claude with instructions to return **only JSON**: a list of channels with a name and a type (text, voice or category).
2. It checks the reply: removes code fences if the model added them, keeps only valid channel types, and caps the number of channels at 15.
3. It creates the channels, putting each one under the category mentioned before it, and replies with what it created.
4. Only members with the **Manage Channels** permission can use it.

## 2. Server admin bot

| Area | Commands |
|---|---|
| Channels | `/add-text` `/add-voice` `/add-category` `/delete-channel` `/rename-channel` |
| Access | `/lock` `/unlock` `/private` `/slowmode` |
| Server | `/server-rename` `/server-icon` `/server-banner` `/server-info` |
| Roles | `/add-role` `/delete-role` `/give-role` `/remove-role` |
| Messages | `/announce` `/purge` |
| Members | `/user-info` `/kick` `/ban` |
| Help | `/help` |

Every command that changes the server checks the user's Discord permission first (Manage Channels, Manage Roles, Manage Server, Kick or Ban Members).

## Setup

1. Install [Node.js](https://nodejs.org) (LTS).
2. Create an application at the [Discord Developer Portal](https://discord.com/developers/applications), add a bot, copy its token, and turn on the **Server Members** and **Message Content** intents.
3. Invite it with the `bot` and `applications.commands` scopes.
4. In the bot's folder:

```bash
npm install
export DISCORD_TOKEN=your_token
export CLIENT_ID=your_application_id      # server-admin-bot
export ANTHROPIC_API_KEY=your_key         # ai-channel-builder
npm start
```

Tokens are read from environment variables only and are never stored in the code.
