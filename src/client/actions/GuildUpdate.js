'use strict';

const Action = require('./Action');

class GuildUpdateAction extends Action {
  handle(data) {
    const client = this.client;

    let updated = client.guilds.cache.get(data.id), old = null;
    if (updated) {
      old = updated._update(data);
    } else {
      updated = client.guilds.add(data, client.doCache("guilds"));
    }

    return { old, updated }
  }
}

module.exports = GuildUpdateAction;
