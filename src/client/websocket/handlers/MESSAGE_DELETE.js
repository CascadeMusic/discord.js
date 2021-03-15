'use strict';

const Constants = require("../../../util/Constants");
module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { message } = client.actions.MessageDelete.handle(packet.d);
  client.emit(Constants.Events.MESSAGE_DELETE, message);
};
