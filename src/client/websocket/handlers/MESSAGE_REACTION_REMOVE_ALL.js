'use strict';

const Constants = require("../../../util/Constants");
module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { message } = client.actions.MessageReactionRemoveAll.handle(packet.d);
  client.emit(Constants.Events.MESSAGE_REACTION_REMOVE_ALL, message);
};