'use strict';

const BaseManager = require('./BaseManager');
const Channel = require('../structures/Channel');
const { ChannelTypes, Events } = require('../util/Constants');

/**
 * A manager of channels belonging to a client
 * @extends {BaseManager}
 */
class ChannelManager extends BaseManager {
  constructor(client, iterable) {
    super(client, iterable, Channel);
  }

  /**
   * The cache of Channels
   * @type {Collection<Snowflake, Channel>}
   * @name ChannelManager#cache
   */
  add(data, guild, cache = true) {
    if (data.permission_overwrites && !data._withOverwrites && !this.client.doCache("overwrites")) {
      data.permission_overwrites = [];
    }

    const existing = this.cache.get(data.id);
    if (existing && !(data._withOverwrites && !existing.permissionOverwrites.size && !cache)) {
      if (existing._patch && cache) {
        existing._patch(data);
      }

      if (existing.guild) {
        existing.guild.channels.add(existing);
      }

      return existing;
    }

    const channel = Channel.create(this.client, data, guild);
    if (!channel) {
      this.client.emit(Events.DEBUG, `Failed to find guild, or unknown type for channel ${data.id} ${data.type}`);
      return null;
    }

    if (cache) {
      this.cache.set(channel.id, channel);

      const g = channel.guild;
      if (g && (this.client.doCache("guilds") || this.client.guilds.cache.has(g.id))) {
        g.channels.add(channel);
      }
    }

    return channel;
  }

  remove(id) {
    const channel = this.cache.get(id);
    channel?.guild?.channels.cache.delete(id);
    this.cache.delete(id);
  }

  /**
   * Creates a data-less Channel
   * @param {string} id
   * @param type
   */
  forge(id, type) {
    let g = null;

    const t = ChannelTypes[type.toUpperCase()];
    if (t !== 1) {
      g = this.client.guilds.add({ id: "0" }, false);
    }

    return this.add({ id, type: t }, g, false);
  }

  /**
   * Data that can be resolved to give a Channel object. This can be:
   * * A Channel object
   * * A Snowflake
   * @typedef {Channel|Snowflake} ChannelResolvable
   */

  /**
   * Resolves a ChannelResolvable to a Channel object.
   * @method resolve
   * @memberof ChannelManager
   * @instance
   * @param {ChannelResolvable} channel The channel resolvable to resolve
   * @returns {?Channel}
   */

  /**
   * Resolves a ChannelResolvable to a channel ID string.
   * @method resolveID
   * @memberof ChannelManager
   * @instance
   * @param {ChannelResolvable} channel The channel resolvable to resolve
   * @returns {?Snowflake}
   */

  /**
   * Obtains a channel from Discord, or the channel cache if it's already available.
   * @param {Snowflake} id ID of the channel
   * @param {boolean} [cache=true] Whether to cache the new channel object if it isn't already
   * @param {boolean} [force=false] Whether to skip the cache check and request the API
   * @returns {Promise<Channel>}
   * @example
   * // Fetch a channel by its id
   * client.channels.fetch('222109930545610754')
   *   .then(channel => console.log(channel.name))
   *   .catch(console.error);
   */
  async fetch(id, cache = true, force = false) {
    let options = {};
    switch (typeof cache) {
      case "boolean":
        options.cache = cache;
        break;
      case "object":
        options = cache || {};
        break;
    }

    switch (typeof id) {
      case "string":
        options.id = id;
        break;
      case "boolean":
        options.cache = id;
        break;
      case "object":
        options = id || {};
        break;
    }

    if (typeof options.cache === "undefined") {
      options.cache = true;
    }

    if (typeof options.force === "undefined" && typeof force !== "undefined") {
      options.force = force;
    }

    const existing = this.cache.get(options.id);
    if (!options.force && existing && !existing.partial && (!existing.guild || !options.withOverwrites || existing.permissionOverwrites.size)) {
      return existing;
    }

    const data = await this.client.api.channels(options.id).get();
    if (typeof options.withOverwrites !== "undefined") {
      data._withOverwrites = options.withOverwrites;
    }

    return this.add(data, null, options.cache);
  }
}

module.exports = ChannelManager;
