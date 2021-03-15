'use strict';

const Action = require('./Action');
const DMChannel = require('../../structures/DMChannel');

class ChannelDeleteAction extends Action {
  constructor(client) {
    super(client);
    this.deleted = new Map();
  }

  handle(data) {
    const client = this.client,
      guild = data.guild_id ? this.getGuild(data) : void 0;

    let channel = client.channels.cache.get(data.id);
    if (channel) {
      if (channel.messages && !(channel instanceof DMChannel)) {
        for (const message of channel.messages.cache.values()) {
          message.deleted = true;
        }
      }

      client.channels.remove(channel.id);
      channel.deleted = true;
    } else {
      channel = client.channels.add(data, guild, false);
    }

    return { channel };
  }
}

module.exports = ChannelDeleteAction;
