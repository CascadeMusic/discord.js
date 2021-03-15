'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { channel } = client.actions.ChannelDelete.handle(packet.d);
  client.emit(Events.CHANNEL_DELETE, channel);
}
