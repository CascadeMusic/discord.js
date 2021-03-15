'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }, shard) => {
  const guild = data.guild_id
    ? client.guilds.cache.get(data.guild_id) ?? client.guilds.add({ id: data.guild_id, shardID: shard.id }, false)
    : void 0;

  const channel = client.channels.cache.get(data.channel_id)
    ?? client.channels.add({ id: data.channel_id, type: guild ? 0 : 1 }, guild, false);

  const time = new Date(data.last_pin_timestamp);
  if (!Number.isNaN(time.getTime())) {
    channel.lastPinTimestamp = time.getTime() || null;
    client.emit(Events.CHANNEL_PINS_UPDATE, channel, time);
  }
};
