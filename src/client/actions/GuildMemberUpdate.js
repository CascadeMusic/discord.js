'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class GuildMemberUpdateAction extends Action {
  handle(data, shard) {
    const client = this.client;
    if (data.user.username) {
      const user = client.users.cache.get(data.user.id);
      if (!user) {
        if (client.doCache("members")) {
          client.users.add(data.user);
        }
      } else if (!user.equals(data.user)) {
        const { old, updated } = client.actions.UserUpdate.handle(data.user);
        client.emit(Events.USER_UPDATE, old, updated);
      }
    }

    const guild = this.getGuild(data);

    let member = guild.members.cache.get(data.user.id);
    if (member) {
      const old = member._update(data);
      if (!member.equals(old)) {
        client.emit(Events.GUILD_MEMBER_UPDATE, old, member);
      }
    } else {
      member = guild.members.add(data, client.users.cache.has(data.user.id));
      client.emit(Events.GUILD_MEMBER_UPDATE, null, member);
    }
  }
}

module.exports = GuildMemberUpdateAction;
