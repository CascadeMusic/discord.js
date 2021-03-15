'use strict';

const { Events } = require("../../../util/Constants")

module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { old, updated } = client.actions.GuildUpdate.handle(packet.d);
  client.emit(Events.GUILD_UPDATE, old, updated);
};
