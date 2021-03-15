'use strict';

const Constants = require("../../../util/Constants");
module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { invite } = client.actions.InviteDelete.handle(packet.d);
  client.emit(Constants.Events.INVITE_DELETE, invite);
}
