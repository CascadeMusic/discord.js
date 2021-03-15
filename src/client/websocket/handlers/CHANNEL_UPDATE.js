'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { old, updated } = client.actions.ChannelUpdate.handle(packet.d);
  client.emit(Events.CHANNEL_UPDATE, old, updated);
}
