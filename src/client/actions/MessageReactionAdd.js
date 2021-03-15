'use strict';

const Action = require('./Action');

/*
{ user_id: 'id',
     message_id: 'id',
     emoji: { name: '�', id: null },
     channel_id: 'id',
     // If originating from a guild
     guild_id: 'id',
     member: { ..., user: { ... } } }
*/

class MessageReactionAdd extends Action {
  handle(data) {
    const client = this.client;

    let channel = data.channel;
    if (!channel) {
      const guild = data.guild_id ? this.getGuild(data) : void 0;
      channel = this.getChannel(data, guild)
    }

    const user = data.user || client.users.cache.get(data.user_id) || (data.member && data.member.user ? client.users.add(data.member.user, client.options.cacheMembers) : client.users.add({ id: data.user_id }, false)),
      message = data.message || channel.messages.cache.get(data.message_id) || channel.messages.add({ id: data.message_id }, false),
      reaction = message.reactions.cache.get(data.emoji.id || data.emoji.name) || message.reactions.add({
        emoji: data.emoji,
        count: null,
        me: null
      }, channel.messages.cache.has(data.message_id));

    reaction.me = data.user_id === client.user.id;
    if (channel.messages.cache.has(message.id)) {
      reaction.users.cache.set(user.id, user);
      reaction.count = reaction.users.cache.size;
    }

    return { message, reaction, user }
  }
}

module.exports = MessageReactionAdd;
