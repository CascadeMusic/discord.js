'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class MessageReactionRemoveEmoji extends Action {
  handle(data) {
    const channel = this.getChannel(data, data.guild_id ? this.getGuild(data) : void 0),
      message = channel.messages.cache.get(data.message_id) ?? channel.messages.add({ id: data.message_id }, false);

    const reaction = message.reactions.cache.get(data.emoji.id || data.emoji.name)
      ?? message.reactions.add({
        emoji: data.emoji,
        count: null,
        me: null
      }, channel.messages.cache.has(data.message_id));

    message.reactions.cache.delete(data.emoji.id || data.emoji.name);
    return { reaction };
  }
}

module.exports = MessageReactionRemoveEmoji;
