'use strict';

const Action = require('./Action');

class GuildEmojiCreateAction extends Action {
  handle(guild, created) {
    const client = this.client,
      emoji = guild.emojis.add(created, guild.emojis.cache.size || client.doCache("emojis"));

    return { emoji };
  }
}

module.exports = GuildEmojiCreateAction;
