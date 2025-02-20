'use strict';

const Collection = require('../../../util/Collection');
const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }, shard) => {
  const guild = client.guilds.cache.get(data.guild_id)
    ?? client.guilds.add({ id: data.guild_id, shardID: shard.id }, false);

  const members = new Collection();
  for (const member of data.members) {
    members.set(member.user.id, guild.members.add(member, false));
  }

  /**
   * Emitted whenever a chunk of guild members is received (all members come from the same guild).
   * @event Client#guildMembersChunk
   * @param {Collection<Snowflake, GuildMember>} members The members in the chunk
   * @param {Guild} guild The guild related to the member chunk
   * @param {Object} chunk Properties of the received chunk
   * @param {number} chunk.index Index of the received chunk
   * @param {number} chunk.count Number of chunks the client should receive
   * @param {?string} chunk.nonce Nonce for this chunk
   */
  client.emit(Events.GUILD_MEMBERS_CHUNK, members, guild, {
    count: data.chunk_count,
    index: data.chunk_index,
    nonce: data.nonce,
  });
};
