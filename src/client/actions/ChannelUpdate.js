'use strict';

const Action = require('./Action');
const Channel = require('../../structures/Channel');
const { ChannelTypes } = require('../../util/Constants');

class ChannelUpdateAction extends Action {
  handle(data) {
    const client = this.client,
      guild = data.guild_id ? this.getGuild(data) : void 0;

    if (client.channels.cache.has(data.id)) {
      let newChannel = client.channels.cache.get(data.id);
      if (guild && (!client.doCache("overwrites") && !newChannel.permissionOverwrites.size)) {
        data.permission_overwrites = [];
      }

      const oldChannel = newChannel._update(data);
      if (ChannelTypes[oldChannel.type.toUpperCase()] !== data.type) {
        const changedChannel = Channel.create(client, data, guild);
        for (const [ id, message ] of newChannel.messages.cache) {
          changedChannel.messages.cache.set(id, message);
        }

        changedChannel._typing = new Map(newChannel._typing);
        newChannel = changedChannel;

        client.channels.cache.set(newChannel.id, newChannel);
        if (guild) {
          guild.channels.add(newChannel);
        }
      }

      return {
        old: oldChannel,
        updated: newChannel
      };
    }

    const channel = client.channels.add(data, guild, client.options.cacheChannels);
    return {
      old: null,
      updated: channel
    }
  }
}

module.exports = ChannelUpdateAction;
