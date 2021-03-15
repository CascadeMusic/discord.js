'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }, shard) => {
  const guild = client.guilds.cache.get(data.guild_id)
    ?? client.guilds.add({ id: data.guild_id, shardID: shard.id }, false);

  const user = client.users.add(data.user, client.doCache("members")
    || client.users.cache.has(data.user.id));

  /**
   * Emitted whenever a member is unbanned from a guild.
   * @event Client#guildBanRemove
   * @param {Guild} guild The guild that the unban occurred in
   * @param {User} user The user that was unbanned
   */
  client.emit(Events.GUILD_BAN_REMOVE, guild, user);
};
