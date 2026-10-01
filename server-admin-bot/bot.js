const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID. See README.md → Setup.');
  process.exit(1);
}

// ─────────────────────────────────────────────
// SLASH COMMANDS
// ─────────────────────────────────────────────
const commands = [
  // CHANNELS
  new SlashCommandBuilder().setName('add-text').setDescription('Create a text channel')
    .addStringOption(o => o.setName('name').setDescription('Channel name').setRequired(true))
    .addStringOption(o => o.setName('category').setDescription('Category to place it in').setRequired(false))
    .addStringOption(o => o.setName('topic').setDescription('Channel topic').setRequired(false)),

  new SlashCommandBuilder().setName('add-voice').setDescription('Create a voice channel')
    .addStringOption(o => o.setName('name').setDescription('Channel name').setRequired(true))
    .addStringOption(o => o.setName('category').setDescription('Category to place it in').setRequired(false))
    .addIntegerOption(o => o.setName('limit').setDescription('Max users (0 = unlimited)').setRequired(false)),

  new SlashCommandBuilder().setName('add-category').setDescription('Create a category')
    .addStringOption(o => o.setName('name').setDescription('Category name').setRequired(true)),

  new SlashCommandBuilder().setName('delete-channel').setDescription('Delete a channel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to delete').setRequired(true)),

  new SlashCommandBuilder().setName('rename-channel').setDescription('Rename a channel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true))
    .addStringOption(o => o.setName('name').setDescription('New name').setRequired(true)),

  // ACCESS
  new SlashCommandBuilder().setName('lock').setDescription('Lock a channel (block @everyone)')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to lock').setRequired(true))
    .addRoleOption(o => o.setName('allow-role').setDescription('Role that can still access').setRequired(false)),

  new SlashCommandBuilder().setName('unlock').setDescription('Unlock a channel for everyone')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to unlock').setRequired(true)),

  new SlashCommandBuilder().setName('private').setDescription('Make channel visible only to a specific role')
    .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Role that can see it').setRequired(true)),

  new SlashCommandBuilder().setName('slowmode').setDescription('Set slowmode on a channel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true))
    .addIntegerOption(o => o.setName('seconds').setDescription('Delay in seconds (0 = disable)').setRequired(true)),

  // SERVER SETTINGS
  new SlashCommandBuilder().setName('server-rename').setDescription('Rename the server')
    .addStringOption(o => o.setName('name').setDescription('New server name').setRequired(true)),

  new SlashCommandBuilder().setName('server-icon').setDescription('Change server icon via image URL')
    .addStringOption(o => o.setName('url').setDescription('Direct image URL (.png .jpg .gif)').setRequired(true)),

  new SlashCommandBuilder().setName('server-banner').setDescription('Set server banner via image URL (needs Boost Level 2)')
    .addStringOption(o => o.setName('url').setDescription('Direct image URL').setRequired(true)),

  new SlashCommandBuilder().setName('server-info').setDescription('Show detailed server info'),

  // ROLES
  new SlashCommandBuilder().setName('add-role').setDescription('Create a new role')
    .addStringOption(o => o.setName('name').setDescription('Role name').setRequired(true))
    .addStringOption(o => o.setName('color').setDescription('Hex color (e.g. #FF5733)').setRequired(false)),

  new SlashCommandBuilder().setName('delete-role').setDescription('Delete a role')
    .addRoleOption(o => o.setName('role').setDescription('Role to delete').setRequired(true)),

  new SlashCommandBuilder().setName('give-role').setDescription('Give a role to a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Role to give').setRequired(true)),

  new SlashCommandBuilder().setName('remove-role').setDescription('Remove a role from a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true)),

  // MESSAGES
  new SlashCommandBuilder().setName('announce').setDescription('Send a formatted announcement')
    .addStringOption(o => o.setName('title').setDescription('Title').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Message body').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Where to send (default: current)').setRequired(false))
    .addStringOption(o => o.setName('color').setDescription('Embed color hex').setRequired(false)),

  new SlashCommandBuilder().setName('purge').setDescription('Delete recent messages')
    .addIntegerOption(o => o.setName('amount').setDescription('How many (1-100)').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel (default: current)').setRequired(false)),

  // MEMBERS
  new SlashCommandBuilder().setName('user-info').setDescription('Show info about a member')
    .addUserOption(o => o.setName('user').setDescription('User to look up').setRequired(true)),

  new SlashCommandBuilder().setName('kick').setDescription('Kick a member')
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  new SlashCommandBuilder().setName('ban').setDescription('Ban a member')
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),

  // HELP
  new SlashCommandBuilder().setName('help').setDescription('Show all commands'),
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
    console.log('✅ Slash commands registered globally!');
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const ok = (title, desc, color = '#57F287') => new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setTimestamp();
const err = (desc) => ({ content: `❌ ${desc}`, ephemeral: true });
const perm = (flag, i) => i.member.permissions.has(PermissionsBitField.Flags[flag]);
const findCategory = (guild, name) => guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === name.toLowerCase());

// ─────────────────────────────────────────────
// COMMAND HANDLER
// ─────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName: cmd, guild } = interaction;

  try {
    // ── HELP ──
    if (cmd === 'help') {
      const e = new EmbedBuilder().setTitle('🤖 Server Builder Bot').setColor('#5865F2').setTimestamp()
        .addFields(
          { name: '📢 Channels', value: '`/add-text` `/add-voice` `/add-category`\n`/delete-channel` `/rename-channel`' },
          { name: '🔒 Access', value: '`/lock` `/unlock` `/private` `/slowmode`' },
          { name: '🏠 Server', value: '`/server-rename` `/server-icon` `/server-banner` `/server-info`' },
          { name: '🎭 Roles', value: '`/add-role` `/delete-role` `/give-role` `/remove-role`' },
          { name: '📣 Messages', value: '`/announce` `/purge`' },
          { name: '👤 Members', value: '`/user-info` `/kick` `/ban`' },
        );
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    // ── ADD TEXT ──
    if (cmd === 'add-text') {
      if (!perm('ManageChannels', interaction)) return interaction.reply(err('You need Manage Channels permission.'));
      const name = interaction.options.getString('name');
      const catName = interaction.options.getString('category');
      const topic = interaction.options.getString('topic');
      const parent = catName ? findCategory(guild, catName)?.id : null;
      const ch = await guild.channels.create({ name, type: ChannelType.GuildText, parent, topic });
      return interaction.reply({ embeds: [ok('✅ Text Channel Created', `💬 <#${ch.id}> created${catName ? ` in **${catName}**` : ''}.`)] });
    }

    // ── ADD VOICE ──
    if (cmd === 'add-voice') {
      if (!perm('ManageChannels', interaction)) return interaction.reply(err('You need Manage Channels permission.'));
      const name = interaction.options.getString('name');
      const catName = interaction.options.getString('category');
      const limit = interaction.options.getInteger('limit') ?? 0;
      const parent = catName ? findCategory(guild, catName)?.id : null;
      const ch = await guild.channels.create({ name, type: ChannelType.GuildVoice, parent, userLimit: limit });
      return interaction.reply({ embeds: [ok('✅ Voice Channel Created', `🔊 **${ch.name}** created${catName ? ` in **${catName}**` : ''}${limit ? ` • max **${limit}** users` : ''}.`)] });
    }

    // ── ADD CATEGORY ──
    if (cmd === 'add-category') {
      if (!perm('ManageChannels', interaction)) return interaction.reply(err('You need Manage Channels permission.'));
      const name = interaction.options.getString('name');
      await guild.channels.create({ name, type: ChannelType.GuildCategory });
      return interaction.reply({ embeds: [ok('✅ Category Created', `📁 **${name}** created.`)] });
    }

    // ── DELETE CHANNEL ──
    if (cmd === 'delete-channel') {
      if (!perm('ManageChannels', interaction)) return interaction.reply(err('You need Manage Channels permission.'));
      const ch = interaction.options.getChannel('channel');
      const name = ch.name;
      await ch.delete();
      return interaction.reply({ embeds: [ok('🗑️ Channel Deleted', `**${name}** has been deleted.`, '#ED4245')] });
    }

    // ── RENAME CHANNEL ──
    if (cmd === 'rename-channel') {
      if (!perm('ManageChannels', interaction)) return interaction.reply(err('You need Manage Channels permission.'));
      const ch = interaction.options.getChannel('channel');
      const oldName = ch.name;
      await ch.setName(interaction.options.getString('name'));
      return interaction.reply({ embeds: [ok('✏️ Renamed', `**${oldName}** → **${ch.name}**`)] });
    }

    // ── LOCK ──
    if (cmd === 'lock') {
      if (!perm('ManageChannels', interaction)) return interaction.reply(err('You need Manage Channels permission.'));
      const ch = interaction.options.getChannel('channel');
      const allowRole = interaction.options.getRole('allow-role');
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false, Connect: false });
      if (allowRole) await ch.permissionOverwrites.edit(allowRole, { SendMessages: true, Connect: true, ViewChannel: true });
      return interaction.reply({ embeds: [ok('🔒 Locked', `<#${ch.id}> locked for @everyone.${allowRole ? ` **${allowRole.name}** still has access.` : ''}`, '#FEE75C')] });
    }

    // ── UNLOCK ──
    if (cmd === 'unlock') {
      if (!perm('ManageChannels', interaction)) return interaction.reply(err('You need Manage Channels permission.'));
      const ch = interaction.options.getChannel('channel');
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null, Connect: null });
      return interaction.reply({ embeds: [ok('🔓 Unlocked', `<#${ch.id}> is now open for everyone.`)] });
    }

    // ── PRIVATE ──
    if (cmd === 'private') {
      if (!perm('ManageChannels', interaction)) return interaction.reply(err('You need Manage Channels permission.'));
      const ch = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');
      await ch.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false });
      await ch.permissionOverwrites.edit(role, { ViewChannel: true, SendMessages: true });
      return interaction.reply({ embeds: [ok('🔐 Private Channel', `<#${ch.id}> is now only visible to **${role.name}**.`, '#EB459E')] });
    }

    // ── SLOWMODE ──
    if (cmd === 'slowmode') {
      if (!perm('ManageChannels', interaction)) return interaction.reply(err('You need Manage Channels permission.'));
      const ch = interaction.options.getChannel('channel');
      const secs = interaction.options.getInteger('seconds');
      await ch.setRateLimitPerUser(secs);
      return interaction.reply({ embeds: [ok('🐢 Slowmode', secs === 0 ? `Disabled in <#${ch.id}>.` : `Set to **${secs}s** in <#${ch.id}>.`)] });
    }

    // ── SERVER RENAME ──
    if (cmd === 'server-rename') {
      if (!perm('ManageGuild', interaction)) return interaction.reply(err('You need Manage Server permission.'));
      const oldName = guild.name;
      await guild.setName(interaction.options.getString('name'));
      return interaction.reply({ embeds: [ok('✏️ Server Renamed', `**${oldName}** → **${guild.name}**`)] });
    }

    // ── SERVER ICON ──
    if (cmd === 'server-icon') {
      if (!perm('ManageGuild', interaction)) return interaction.reply(err('You need Manage Server permission.'));
      const url = interaction.options.getString('url');
      await guild.setIcon(url);
      return interaction.reply({ embeds: [ok('🖼️ Icon Updated', `Server icon changed. [View](${url})`)] });
    }

    // ── SERVER BANNER ──
    if (cmd === 'server-banner') {
      if (!perm('ManageGuild', interaction)) return interaction.reply(err('You need Manage Server permission.'));
      const url = interaction.options.getString('url');
      await guild.setBanner(url);
      return interaction.reply({ embeds: [ok('🎨 Banner Updated', `Server banner changed. [View](${url})`)] });
    }

    // ── SERVER INFO ──
    if (cmd === 'server-info') {
      const owner = await guild.fetchOwner();
      const chans = guild.channels.cache;
      const e = new EmbedBuilder().setTitle(`📊 ${guild.name}`).setColor('#5865F2').setThumbnail(guild.iconURL()).setTimestamp()
        .addFields(
          { name: '👑 Owner', value: owner.user.tag, inline: true },
          { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
          { name: '🌟 Boost Level', value: `Level ${guild.premiumTier}`, inline: true },
          { name: '💬 Text Channels', value: `${chans.filter(c => c.type === ChannelType.GuildText).size}`, inline: true },
          { name: '🔊 Voice Channels', value: `${chans.filter(c => c.type === ChannelType.GuildVoice).size}`, inline: true },
          { name: '📁 Categories', value: `${chans.filter(c => c.type === ChannelType.GuildCategory).size}`, inline: true },
          { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: '🆔 Server ID', value: guild.id, inline: true },
          { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        );
      return interaction.reply({ embeds: [e] });
    }

    // ── ADD ROLE ──
    if (cmd === 'add-role') {
      if (!perm('ManageRoles', interaction)) return interaction.reply(err('You need Manage Roles permission.'));
      const name = interaction.options.getString('name');
      const color = interaction.options.getString('color') || '#99AAB5';
      const role = await guild.roles.create({ name, color });
      return interaction.reply({ embeds: [ok('🎭 Role Created', `**${role.name}** created.`, color)] });
    }

    // ── DELETE ROLE ──
    if (cmd === 'delete-role') {
      if (!perm('ManageRoles', interaction)) return interaction.reply(err('You need Manage Roles permission.'));
      const role = interaction.options.getRole('role');
      await role.delete();
      return interaction.reply({ embeds: [ok('🗑️ Role Deleted', `**${role.name}** deleted.`, '#ED4245')] });
    }

    // ── GIVE ROLE ──
    if (cmd === 'give-role') {
      if (!perm('ManageRoles', interaction)) return interaction.reply(err('You need Manage Roles permission.'));
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      const member = await guild.members.fetch(user.id);
      await member.roles.add(role);
      return interaction.reply({ embeds: [ok('✅ Role Given', `**${role.name}** → **${user.tag}**`)] });
    }

    // ── REMOVE ROLE ──
    if (cmd === 'remove-role') {
      if (!perm('ManageRoles', interaction)) return interaction.reply(err('You need Manage Roles permission.'));
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      const member = await guild.members.fetch(user.id);
      await member.roles.remove(role);
      return interaction.reply({ embeds: [ok('✅ Role Removed', `**${role.name}** removed from **${user.tag}**`, '#FEE75C')] });
    }

    // ── ANNOUNCE ──
    if (cmd === 'announce') {
      if (!perm('ManageGuild', interaction)) return interaction.reply(err('You need Manage Server permission.'));
      const title = interaction.options.getString('title');
      const message = interaction.options.getString('message');
      const ch = interaction.options.getChannel('channel') || interaction.channel;
      const color = interaction.options.getString('color') || '#5865F2';
      const e = new EmbedBuilder().setTitle(`📣 ${title}`).setDescription(message).setColor(color)
        .setFooter({ text: `By ${interaction.user.tag}` }).setTimestamp();
      await ch.send({ embeds: [e] });
      return interaction.reply({ content: `✅ Sent to <#${ch.id}>!`, ephemeral: true });
    }

    // ── PURGE ──
    if (cmd === 'purge') {
      if (!perm('ManageMessages', interaction)) return interaction.reply(err('You need Manage Messages permission.'));
      const amount = Math.min(100, Math.max(1, interaction.options.getInteger('amount')));
      const ch = interaction.options.getChannel('channel') || interaction.channel;
      const deleted = await ch.bulkDelete(amount, true);
      return interaction.reply({ embeds: [ok('🗑️ Purged', `Deleted **${deleted.size}** messages in <#${ch.id}>.`, '#ED4245')], ephemeral: true });
    }

    // ── USER INFO ──
    if (cmd === 'user-info') {
      const user = interaction.options.getUser('user');
      const member = await guild.members.fetch(user.id).catch(() => null);
      const roles = member?.roles.cache.filter(r => r.id !== guild.roles.everyone.id).map(r => `<@&${r.id}>`).join(', ') || 'None';
      const e = new EmbedBuilder().setTitle(`👤 ${user.tag}`).setThumbnail(user.displayAvatarURL()).setColor('#5865F2').setTimestamp()
        .addFields(
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'N/A', inline: true },
          { name: '🎭 Roles', value: roles },
          { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        );
      return interaction.reply({ embeds: [e] });
    }

    // ── KICK ──
    if (cmd === 'kick') {
      if (!perm('KickMembers', interaction)) return interaction.reply(err('You need Kick Members permission.'));
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply(err('Could not find that member.'));
      await member.kick(reason);
      return interaction.reply({ embeds: [ok('👟 Kicked', `**${user.tag}** kicked.\n**Reason:** ${reason}`, '#FEE75C')] });
    }

    // ── BAN ──
    if (cmd === 'ban') {
      if (!perm('BanMembers', interaction)) return interaction.reply(err('You need Ban Members permission.'));
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      await guild.members.ban(user, { reason });
      return interaction.reply({ embeds: [ok('🔨 Banned', `**${user.tag}** banned.\n**Reason:** ${reason}`, '#ED4245')] });
    }

  } catch (e) {
    console.error(`Error in /${cmd}:`, e);
    const msg = { content: `❌ Something went wrong: ${e.message}`, ephemeral: true };
    interaction.replied || interaction.deferred ? interaction.followUp(msg) : interaction.reply(msg);
  }
});

client.on('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await registerCommands();
  console.log('🤖 Bot ready! Use /help in Discord.');
});

client.login(DISCORD_TOKEN);
