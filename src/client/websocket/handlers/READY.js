'use strict';

let ClientUser;

module.exports = (client, { d: data }, shard) => {
  if (client.user) {
    client.user._patch(data.user);
  } else {
    const clientUser = new ClientUser(client, data.user);
    client.user = clientUser;
    client.users.cache.set(clientUser.id, clientUser);
  }

  const guilds = new Collection();
  for (const guild of data.guilds) {
    guild.shardID = shard.id;
    guilds.set(guild.id, client.guilds.add(guild, client.doCache("guilds")));
  }

  client.emit("shardConnect", shard.id, guilds);
  if (!client.doCache("guilds")) {
    shard.debug("Guild cache is disabled, skipping guild check.");
    shard.expectedGuilds.clear();
  }

  shard.checkReady();
};
