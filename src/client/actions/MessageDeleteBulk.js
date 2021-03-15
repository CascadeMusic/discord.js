'use strict';

const Action = require('./Action');
const Collection = require('../../util/Collection');

class MessageDeleteBulkAction extends Action {
  handle(data) {
    const guild = data.guild_id ? this.getGuild(data) : void 0,
      channel = this.getChannel(data, guild);

    const deleted = new Collection();
    for (let i = 0; i < data.ids.length; i++) {
      let message;
      if (channel.messages.cache.has(data.ids[i])) {
        message = channel.messages.cache.get(data.ids[i]);
        channel.messages.cache.delete(message.id);
      } else {
        message = channel.messages.add({ id: data.ids[i] }, false);
        message.system = null;
        message.createdTimestamp = null;
        message.author = {};
      }

      message.deleted = true;
      deleted.set(data.ids[i], message);
    }

    return { messages: deleted };
  }
}

module.exports = MessageDeleteBulkAction;
