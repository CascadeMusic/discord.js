'use strict';

const Constants = require("../../../util/Constants");
module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { old, updated } = client.actions.GuildRoleUpdate.handle(packet.d);
  client.emit(Constants.Events.GUILD_ROLE_UPDATE, old, updated);
};
