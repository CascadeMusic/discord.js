'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }, shard) => {
  const guild = client.guilds.cache.get(data.guild_id)
    ?? client.guilds.add({ id: data.guild_id, shardID: shard.id }, false);

  const member = guild.members.add(data, client.doCache("members")
    || client.users.cache.has(data.user.id));

  if (guild.memberCount) {
    guild.memberCount++;
  }

  /**
   * Emitted whenever a user joins a guild.
   * @event Client#guildMemberAdd
   * @param {GuildMember} member The member that has joined a guild
   */
  client.emit(Events.GUILD_MEMBER_ADD, member);
}
