'use strict';

const BaseManager = require('./BaseManager');
const GuildChannel = require('../structures/GuildChannel');
const PermissionOverwrites = require('../structures/PermissionOverwrites');
const DiscordAPIError = require("../rest/DiscordAPIError");
const { ChannelTypes } = require('../util/Constants');

/**
 * Manages API methods for GuildChannels and stores their cache.
 * @extends {BaseManager}
 */
class GuildChannelManager extends BaseManager {
  constructor(guild, iterable) {
    super(guild.client, iterable, GuildChannel);

    /**
     * The guild this Manager belongs to
     * @type {Guild}
     */
    this.guild = guild;
  }

  /**
   * The cache of this Manager
   * @type {Collection<Snowflake, GuildChannel>}
   * @name GuildChannelManager#cache
   */

  add(channel) {
    const existing = this.cache.get(channel.id);
    if (existing) {
      return existing;
    }

    this.cache.set(channel.id, channel);
    return channel;
  }

  /**
   * Data that can be resolved to give a Guild Channel object. This can be:
   * * A GuildChannel object
   * * A Snowflake
   * @typedef {GuildChannel|Snowflake} GuildChannelResolvable
   */

  /**
   * Resolves a GuildChannelResolvable to a Channel object.
   * @method resolve
   * @memberof GuildChannelManager
   * @instance
   * @param {GuildChannelResolvable} channel The GuildChannel resolvable to resolve
   * @returns {?GuildChannel}
   */

  /**
   * Resolves a GuildChannelResolvable to a channel ID string.
   * @method resolveID
   * @memberof GuildChannelManager
   * @instance
   * @param {GuildChannelResolvable} channel The GuildChannel resolvable to resolve
   * @returns {?Snowflake}
   */

  /**
   * Creates a new channel in the guild.
   * @param {string} name The name of the new channel
   * @param {Object} [options] Options
   * @param {string} [options.type='text'] The type of the new channel, either `text`, `voice`, or `category`
   * @param {string} [options.topic] The topic for the new channel
   * @param {boolean} [options.nsfw] Whether the new channel is nsfw
   * @param {number} [options.bitrate] Bitrate of the new channel in bits (only voice)
   * @param {number} [options.userLimit] Maximum amount of users allowed in the new channel (only voice)
   * @param {ChannelResolvable} [options.parent] Parent of the new channel
   * @param {OverwriteResolvable[]|Collection<Snowflake, OverwriteResolvable>} [options.permissionOverwrites]
   * Permission overwrites of the new channel
   * @param {number} [options.position] Position of the new channel
   * @param {number} [options.rateLimitPerUser] The ratelimit per user for the channel
   * @param {string} [options.reason] Reason for creating the channel
   * @returns {Promise<GuildChannel>}
   * @example
   * // Create a new text channel
   * guild.channels.create('new-general', { reason: 'Needed a cool new channel' })
   *   .then(console.log)
   *   .catch(console.error);
   * @example
   * // Create a new channel with permission overwrites
   * guild.channels.create('new-voice', {
   *   type: 'voice',
   *   permissionOverwrites: [
   *      {
   *        id: message.author.id,
   *        deny: [Permissions.FLAGS.VIEW_CHANNEL],
   *     },
   *   ],
   * })
   */
  async create(name, options = {}) {
    let {
      type,
      topic,
      nsfw,
      bitrate,
      userLimit,
      parent,
      permissionOverwrites,
      position,
      rateLimitPerUser,
      reason,
    } = options;
    if (parent) {
      parent = this.client.channels.resolveID(parent);
    }
    if (permissionOverwrites) {
      permissionOverwrites = permissionOverwrites.map(o => PermissionOverwrites.resolve(o, this.guild));
    }

    const data = await this.client.api.guilds(this.guild.id).channels.post({
      data: {
        name,
        topic,
        type: type ? ChannelTypes[type.toUpperCase()] : ChannelTypes.TEXT,
        nsfw,
        bitrate,
        user_limit: userLimit,
        parent_id: parent,
        position,
        permission_overwrites: permissionOverwrites,
        rate_limit_per_user: rateLimitPerUser,
      },
      reason,
    });
    return this.client.actions.ChannelCreate.handle(data).channel;
  }

  /**
   * Creates a data-less
   * @param {string} id Channel Id
   * @param {ChannelType} [type="text"] Type of channel to forge
   * @returns {Collection<Snowflake, Channel>}
   */
  forge(id, type = "text") {
    return this.client.channels.add({ id, type: ChannelTypes[type.toUpperCase()] }, this.guild, false);
  };

  /**
   * Fetches a channel or channels from the Discord API.
   * @param {string|boolean} [id] ID of the channel to fetch or whether to cache all fetched channels.
   * @param {boolean} [cache] Whether to cache the fetch channel(s)
   * @returns {Promise<Collection<Snowflake, GuildChannel> | GuildChannel>}
   */
  async fetch(id, cache) {
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

    if (options.id) {
      const existing = this.cache.get(options.id);
      if (!options.force && existing && !existing.partial && (!options.withOverwrites || existing.permissionOverwrites.size)) {
        return existing;
      }
    }

    const channels = await this.client.api.guilds(this.guild.id).channels().get();
    if (options.id) {
      const c = channels.find(t => t.id === options.id);
      if (!c) {
        throw new DiscordAPIError(`${this.client.api.guilds(this.guild.id).channels()}:id`, { message: "Unknown Channel" }, "GET", 404);
      }

      if (options.withOverwrites) {
        c._withOverwrites = true;
      }

      return this.client.channels.add(c, this.guild, options.cache);
    }

    if (options.cache) {
      for (const channel of channels) {
        if (options.withOverwrites) {
          channel._withOverwrites = true;
        }
        this.client.channels.add(channel, this.guild);
      }

      return this.cache;
    }

    const collection = new Collection();
    for (const channel of channels) {
      if (options.withOverwrites) {
        channel._withOverwrites = true;
      }

      const c = this.client.channels.add(channel, this.guild, false);
      collection.set(c.id, c);
    }

    return collection;
  }
}

module.exports = GuildChannelManager;
