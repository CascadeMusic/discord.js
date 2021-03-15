'use strict';

const Constants = require("../../../util/Constants");
module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { reaction, user } = client.actions.MessageReactionRemove.handle(packet.d);
  client.emit(Constants.Events.MESSAGE_REACTION_REMOVE, reaction, user);
};
