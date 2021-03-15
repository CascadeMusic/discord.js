'use strict';

const { Events, Status } = require('../../../util/Constants');

module.exports = (client, { d: data }, shard) => {
  data.shardID = shard.id;

  let guild = client.guilds.cache.get(data.id);
  if (guild) {
    if (!guild.available && !data.unavailable) {
      guild._patch(data);
    }
  } else {
    guild = client.guilds.add(data, client.doCache("guilds"));
    if (client.ws.status === Status.READY || !client.doCache("guilds")) {
      /**
       * Emitted whenever the client joins a guild.
       * @event Client#guildCreate
       * @param {Guild} guild The created guild
       */
      client.emit(Events.GUILD_CREATE, guild);
    }
  }
};


