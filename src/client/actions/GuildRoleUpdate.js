'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class GuildRoleUpdateAction extends Action {
  handle(data) {
    const c = this.client;
    const guild = c.guilds.cache.get(data.guild_id) || c.guilds.add({
      id: data.guild_id,
      shardID: data.shardID
    }, false);
    let role = guild.roles.cache.get(data.role.id);
    let old = null;
    if(role) {
      old = role._update(data.role);
    } else {
      role = guild.roles.add(data.role, c.options.cacheRoles || guild.roles.cache.size);
    }
    return {
      old,
      updated: role
    };
  }
}

module.exports = GuildRoleUpdateAction;
