'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class GuildDeleteAction extends Action {
  constructor(client) {
    super(client);
    this.deleted = new Map();
  }

  handle(data) {
    const c = this.client,
      guild = this.getGuild(data)

    for (const channel of guild.channels.cache.values()) {
      if (channel.type === "text") {
        channel.stopTyping(true);
      }
    }

    if (data.unavailable) {
      guild.available = false;
      c.emit(Events.GUILD_UNAVAILABLE, guild);

      return { guild: null };
    }

    for (const channel of guild.channels.cache.values()) {
      c.channels.remove(channel.id);
    }

    c.guilds.cache.delete(guild.id);
    guild.deleted = true;

    this.deleted.set(guild.id, guild);
    this.scheduleForDeletion(guild.id);

    return { guild };
  }

  scheduleForDeletion(id) {
    this.client.setTimeout(() => this.deleted.delete(id), this.client.options.restWsBridgeTimeout);
  }
}

module.exports = GuildDeleteAction;
