'use strict';

const { PartialTypes } = require('../../util/Constants');

/*

ABOUT ACTIONS

Actions are similar to WebSocket Packet Handlers, but since introducing
the REST API methods, in order to prevent rewriting code to handle data,
"actions" have been introduced. They're basically what Packet Handlers
used to be but they're strictly for manipulating data and making sure
that WebSocket events don't clash with REST methods.

*/

class GenericAction {
  constructor(client) {
    this.client = client;
  }

  handle(data) {
    return data;
  }

  getPayload(data, manager, id, partialType, cache) {
    return manager.cache.get(id) ?? manager.add(data, cache);
  }

  getChannel(data, guild) {
    return this.client.channels.cache.get(data.channel_id)
      ?? this.client.channels.add({
        id: data.channel_id,
        type: guild ? 0 : 1
      }, guild, false);
  }

  getMessage(data, channel, cache) {
    const id = data.message_id || data.id;
    return (
      data.message ||
      this.getPayload(
        {
          id,
          channel_id: channel.id,
          guild_id: data.guild_id || (channel.guild ? channel.guild.id : null),
        },
        channel.messages,
        id,
        PartialTypes.MESSAGE,
        cache,
      )
    );
  }

  getReaction(data, message, user) {
    const id = data.emoji.id || decodeURIComponent(data.emoji.name);
    return this.getPayload(
      {
        emoji: data.emoji,
        count: message.partial ? null : 0,
        me: user ? user.id === this.client.user.id : false,
      },
      message.reactions,
      id,
      PartialTypes.REACTION,
    );
  }

  getMember(data, guild) {
    return this.getPayload(data, guild.members, data.user.id, PartialTypes.GUILD_MEMBER);
  }

  getGuild(data) {
    return this.client.guilds.cache.get(data.guild_id)
      ?? this.client.guilds.add({ id: data.guild_id, shardID: data.shardID }, false)
  }

  getUser(data) {
    const id = data.user_id;
    return data.user || this.getPayload({ id }, this.client.users, id, PartialTypes.USER);
  }

  getUserFromMember(data) {
    if (data.guild_id && data.member && data.member.user) {
      const guild = this.client.guilds.cache.get(data.guild_id);
      if (guild) {
        return guild.members.add(data.member).user;
      } else {
        return this.client.users.add(data.member.user);
      }
    }
    return this.getUser(data);
  }
}

module.exports = GenericAction;
