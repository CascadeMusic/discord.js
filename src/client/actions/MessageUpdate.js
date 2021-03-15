'use strict';

const Action = require('./Action');

class MessageUpdateAction extends Action {
  handle(data) {
    const channel = this.getChannel(data, guild);

    let updated = channel.messages.cache.get(data.id), old = null;
    if (updated) {
      old = updated.patch(data);
    } else {
      updated = channel.messages.add(data, false);
    }

    return { old, updated }
  }
}

module.exports = MessageUpdateAction;
