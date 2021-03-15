'use strict';

const Action = require('./Action');

class MessageDeleteAction extends Action {
  handle(data) {
    const guild = data.guild_id ? this.getGuild(data) : void 0,
      channel = this.getChannel(data, guild);

    let message = channel.messages.cache.get(data.id);
    if (message) {
      channel.messages.cache.delete(message.id);
    } else {
      message = channel.messages.add(data, false);
      message.system = null;
      message.createdTimestamp = null;
      message.author = null;
    }

    message.deleted = true;
    return { message };
  }
}

module.exports = MessageDeleteAction;
