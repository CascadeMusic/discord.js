'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, packet, shard) => {
  const { member } = client.actions.GuildMemberRemove.handle(packet.d, shard);
  client.emit(Events.GUILD_MEMBER_REMOVE, member);
};
