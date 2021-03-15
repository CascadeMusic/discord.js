'use strict';

const Action = require('./Action');

class GuildEmojisUpdateAction extends Action {
  handle(data) {
    const client = this.client,
      guild = this.getGuild(data);

    if (guild.emojis.cache.size || client.options.cacheEmojis) {
      const deletions = new Map(guild.emojis.cache);
      for (const emoji of data.emojis) {
        const cached = guild.emojis.cache.get(emoji.id);
        if (cached) {
          deletions.delete(emoji.id);

          if (!cached.equals(emoji)) {
            const result = client.actions.GuildEmojiUpdate.handle(cached, emoji);
            client.emit(Events.GUILD_EMOJI_UPDATE, result.old, result.emoji);
          }
        } else {
          const result = client.actions.GuildEmojiCreate.handle(guild, emoji);
          client.emit(Events.GUILD_EMOJI_CREATE, result.emoji);
        }
      }

      for (const deleted of deletions.values()) {
        const result = client.actions.GuildEmojiDelete.handle(deleted);
        client.emit(Events.GUILD_EMOJI_DELETE, result.emoji);
      }
    } else {
      const emojis = new Collection();
      for (const emoji of data.emojis) {
        emojis.set(emoji.id, guild.emojis.add(emoji, false));
      }

      client.emit("guildEmojisUpdate", emojis);
    }
  }
}

module.exports = GuildEmojisUpdateAction;
