'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, packet, shard) => {
  packet.d.shardID = shard.id;
  const { guild } = client.actions.GuildDelete.handle(packet.d);
  if (guild) {
    client.emit(Events.GUILD_DELETE, guild);
  }
};
