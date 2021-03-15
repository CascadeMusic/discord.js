'use strict';

module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  client.actions.GuildIntegrationsUpdate.handle(packet.d);
};
