'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class PresenceUpdateAction extends Action {
  handle(data) {
    const client = this.client,
      guild = this.getGuild(data);

    let presence = guild.presences.cache.get(data.user.id),
      old = null;

    if (data.user.username && (client.doCache("members") || client.users.cache.has(data.user.id))) {
      const user = client.users.cache.get(data.user.id);
      if (!user || !user.equals(data.user)) {
        client.actions.UserUpdate.handle(data.user);
      }
    }

    if (client.users.cache.has(data.user.id)) {
      guild.members.add(data);
    }

    if (presence || client.doCache("presences") || client.users.cache.has(data.user.id)) {
      if (presence) {
        old = presence._clone();
      }

      presence = guild.presences.add(Object.assign(data, { guild }));
    }

    if (client.listenerCount(Events.PRESENCE_UPDATE)) {
      presence ??= guild.presences.add(Object.assign(data, { guild }), false);
      client.emit(Events.PRESENCE_UPDATE, old, presence);
    }
  }
}

module.exports = PresenceUpdateAction;
