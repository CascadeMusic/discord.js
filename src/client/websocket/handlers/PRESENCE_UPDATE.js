'use strict';

module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  client.actions.PresenceUpdate.handle(packet.d);
};