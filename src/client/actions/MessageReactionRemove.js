'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

/*
{ user_id: 'id',
     message_id: 'id',
     emoji: { name: '�', id: null },
     channel_id: 'id',
     guild_id: 'id' }
*/

class MessageReactionRemove extends Action {
  handle(data) {
    const client = this.client,
      channel = this.getChannel(data, data.guild_id ? this.getGuild(data) : void 0)

    const user = client.users.cache.get(data.user_id) || client.users.add({ id: data.user_id }, false),
      message = channel.messages.cache.get(data.message_id) || channel.messages.add({ id: data.message_id }, false),
      reaction = message.reactions.cache.get(data.emoji.id || data.emoji.name) || message.reactions.add({
        emoji: data.emoji,
        count: null,
        me: null
      }, channel.messages.cache.has(data.message_id));

    reaction.me = data.user_id === client.user.id;
    if (channel.messages.cache.has(message.id)) {
      reaction.users.cache.delete(user.id);
      reaction.count = reaction.users.cache.size;

      if (reaction.count === 0) {
        message.reactions.cache.delete(data.emoji.id || data.emoji.name);
      }
    }

    return { message, reaction, user }
  }
}

module.exports = MessageReactionRemove;
