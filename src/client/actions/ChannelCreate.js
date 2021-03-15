'use strict';

const Action = require('./Action');

class ChannelCreateAction extends Action {
  handle(data) {
    const client = this.client,
      guild = data.guild_id ? this.getGuild(data) : void 0;

    return {
      channel: client.channels.add(data, guild, client.doCache("channels")
        || client.channels.cache.has(data.id))
    }
  }
}

module.exports = ChannelCreateAction;
