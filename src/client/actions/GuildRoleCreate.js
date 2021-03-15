'use strict';

const Action = require('./Action');

class GuildRoleCreate extends Action {
  handle(data) {
    const client = this.client,
      guild = this.getGuild(data),
      role = guild.roles.add(data.role, client.doCache("roles") || guild.roles.cache.size);

    return { role };
  }
}

module.exports = GuildRoleCreate;
