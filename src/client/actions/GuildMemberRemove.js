'use strict';

const Action = require('./Action');

class GuildMemberRemoveAction extends Action {
  handle(data, shard) {
    const guild = this.getGuild(data),
      member = guild.members.cache.get(data.user.id) ?? guild.members.add(data, false);

    member.deleted = true;
    guild.members.cache.delete(data.user.id);
    guild.voiceStates.cache.delete(data.user.id);

    if (guild.memberCount) {
      guild.memberCount--;
    }

    return { guild, member }
  }
}

module.exports = GuildMemberRemoveAction;
