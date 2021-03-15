'use strict';

const Constants = require("../../../util/Constants");
module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { messages } = client.actions.MessageDeleteBulk.handle(packet.d);
  client.emit(Constants.Events.MESSAGE_BULK_DELETE, messages);
};