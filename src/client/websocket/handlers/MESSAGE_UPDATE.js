'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { old, updated } = client.actions.MessageUpdate.handle(packet.d);

  /**
   * Emitted whenever a message is updated - e.g. embed or content change.
   * @event Client#messageUpdate
   * @param {Message} oldMessage The message before the update
   * @param {Message} newMessage The message after the update
   */
  client.emit(Events.MESSAGE_UPDATE, old, updated);
};
