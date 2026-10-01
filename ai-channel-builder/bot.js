const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// Any current Claude model works; override with CLAUDE_MODEL without touching the code.
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const PREFIX = '!build';
const MAX_CHANNELS = 15; // guard against a runaway request creating dozens of channels

if (!DISCORD_TOKEN || !ANTHROPIC_API_KEY) {
  console.error('Missing DISCORD_TOKEN or ANTHROPIC_API_KEY. See README.md → Setup.');
  process.exit(1);
}

// Ask Claude to parse the user's plain-English request
async function parseRequest(userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: `You are a Discord server builder assistant. The user will describe what channels they want in plain English.
Your job is to extract the channels they want and return ONLY valid JSON — no markdown, no explanation, no backticks.

Return this format:
{
  "channels": [
    { "name": "channel-name", "type": "text" },
    { "name": "channel-name", "type": "voice" },
    { "name": "Category Name", "type": "category" }
  ]
}

Rules:
- "type" must be exactly "text", "voice", or "category"
- Channel names should be lowercase with dashes for text/voice (e.g. "general-chat")
- Category names can be Title Case (e.g. "Events")
- If user mentions a category, list it BEFORE its child channels
- Return ONLY the JSON object, nothing else`,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Claude API error ${response.status}`);
  // Models sometimes wrap JSON in ```fences``` despite instructions; strip them before parsing.
  const text = (data.content?.[0]?.text || '{}').replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  const parsed = JSON.parse(text);
  const allowed = new Set(['text', 'voice', 'category']);
  parsed.channels = (parsed.channels || [])
    .filter(ch => ch && typeof ch.name === 'string' && allowed.has(ch.type))
    .slice(0, MAX_CHANNELS);
  return parsed;
}

client.on('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  console.log(`📋 Use: !build <describe what you want>`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const userInput = message.content.slice(PREFIX.length).trim();
  if (!userInput) {
    return message.reply('Please describe what channels you want! Example:\n`!build add a general text chat, an announcements channel, and a voice lounge`');
  }

  // Check permissions
  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
    return message.reply('❌ You need **Manage Channels** permission to use this bot.');
  }

  const thinking = await message.reply('🤖 Thinking about your server layout...');

  try {
    const parsed = await parseRequest(userInput);

    if (!parsed.channels || parsed.channels.length === 0) {
      return thinking.edit('❌ I couldn\'t understand that. Try something like:\n`!build add a lounge voice chat and a general text channel`');
    }

    await thinking.edit(`📐 Creating ${parsed.channels.length} channel(s)...`);

    const guild = message.guild;
    const created = [];
    let lastCategory = null;

    for (const ch of parsed.channels) {
      try {
        if (ch.type === 'category') {
          const category = await guild.channels.create({
            name: ch.name,
            type: ChannelType.GuildCategory,
          });
          lastCategory = category;
          created.push(`📁 **${ch.name}** (category)`);
        } else if (ch.type === 'voice') {
          await guild.channels.create({
            name: ch.name,
            type: ChannelType.GuildVoice,
            parent: lastCategory?.id || null,
          });
          created.push(`🔊 **${ch.name}** (voice)`);
        } else {
          await guild.channels.create({
            name: ch.name,
            type: ChannelType.GuildText,
            parent: lastCategory?.id || null,
          });
          created.push(`💬 **${ch.name}** (text)`);
        }
      } catch (err) {
        created.push(`⚠️ Failed to create **${ch.name}**: ${err.message}`);
      }
    }

    await thinking.edit(`✅ Done! Here's what I created:\n${created.join('\n')}`);
  } catch (err) {
    console.error(err);
    await thinking.edit('❌ Something went wrong. Make sure your request is clear and try again.');
  }
});

client.login(DISCORD_TOKEN);
