'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class MessageReactionRemoveAll extends Action {
  handle(data) {
    const channel = this.getChannel(data, data.guild_id ? this.getGuild(data) : void 0),
      message = channel.messages.cache.get(data.message_id) || channel.messages.add({ id: data.message_id }, false);

    message.reactions.cache.clear();
    return { message };
  }
}

/**
 * Emitted whenever all reactions are removed from a cached message.
 * @event Client#messageReactionRemoveAll
 * @param {Message} message The message the reactions were removed from
 */

module.exports = MessageReactionRemoveAll;
