'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class GuildIntegrationsUpdate extends Action {
  handle(data) {
    const client = this.client,
      guild = this.getGuild(data);

    client.emit(Events.GUILD_INTEGRATIONS_UPDATE, guild);
  }
}

module.exports = GuildIntegrationsUpdate;
