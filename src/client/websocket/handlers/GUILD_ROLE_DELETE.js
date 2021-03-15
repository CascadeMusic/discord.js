'use strict';

const Constants = require("../../../util/Constants");
module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { role } = client.actions.GuildRoleDelete.handle(packet.d);
  client.emit(Constants.Events.GUILD_ROLE_DELETE, role);
};
