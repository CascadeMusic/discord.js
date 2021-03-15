'use strict';

const Action = require('./Action');

class GuildRoleDeleteAction extends Action {
  handle(data) {
    const guild = this.getGuild(data),
      role = guild.roles.cache.get(data.role_id) ?? guild.roles.add({ id: data.role_id, permissions: 0 }, false);

    guild.roles.cache.delete(data.role_id);
    role.deleted = true;

    return { role };
  }
}

module.exports = GuildRoleDeleteAction;
