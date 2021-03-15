'use strict';

const Constants = require("../../../util/Constants");
module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { invite } = client.actions.InviteCreate.handle(packet.d);
  client.emit(Constants.Events.INVITE_CREATE, invite);
};
