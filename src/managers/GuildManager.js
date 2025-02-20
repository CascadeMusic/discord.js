'use strict';

const BaseManager = require('./BaseManager');
const Guild = require('../structures/Guild');
const GuildChannel = require('../structures/GuildChannel');
const GuildEmoji = require('../structures/GuildEmoji');
const GuildMember = require('../structures/GuildMember');
const Invite = require('../structures/Invite');
const Role = require('../structures/Role');
const {
  ChannelTypes,
  Events,
  VerificationLevels,
  DefaultMessageNotifications,
  ExplicitContentFilterLevels,
} = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
const Permissions = require('../util/Permissions');
const { resolveColor } = require('../util/Util');

/**
 * Manages API methods for Guilds and stores their cache.
 * @extends {BaseManager}
 */
class GuildManager extends BaseManager {
  constructor(client, iterable) {
    super(client, iterable, Guild);
  }

  /**
   * The cache of this Manager
   * @type {Collection<Snowflake, Guild>}
   * @name GuildManager#cache
   */

  /**
   * Data that resolves to give a Guild object. This can be:
   * * A Guild object
   * * A GuildChannel object
   * * A GuildEmoji object
   * * A Role object
   * * A Snowflake
   * * An Invite object
   * @typedef {Guild|GuildChannel|GuildMember|GuildEmoji|Role|Snowflake|Invite} GuildResolvable
   */

  /**
   * Partial data for a Role.
   * @typedef {Object} PartialRoleData
   * @property {number} [id] The ID for this role, used to set channel overrides,
   * this is a placeholder and will be replaced by the API after consumption
   * @property {string} [name] The name of the role
   * @property {ColorResolvable} [color] The color of the role, either a hex string or a base 10 number
   * @property {boolean} [hoist] Whether or not the role should be hoisted
   * @property {number} [position] The position of the role
   * @property {PermissionResolvable} [permissions] The permissions of the role
   * @property {boolean} [mentionable] Whether or not the role should be mentionable
   */

  /**
   * Partial overwrite data.
   * @typedef {Object} PartialOverwriteData
   * @property {number|Snowflake} id The Role or User ID for this overwrite
   * @property {string} [type] The type of this overwrite
   * @property {PermissionResolvable} [allow] The permissions to allow
   * @property {PermissionResolvable} [deny] The permissions to deny
   */

  /**
   * Partial data for a Channel.
   * @typedef {Object} PartialChannelData
   * @property {number} [id] The ID for this channel, used to set its parent,
   * this is a placeholder and will be replaced by the API after consumption
   * @property {number} [parentID] The parent ID for this channel
   * @property {string} [type] The type of the channel
   * @property {string} name The name of the channel
   * @property {string} [topic] The topic of the text channel
   * @property {boolean} [nsfw] Whether the channel is NSFW
   * @property {number} [bitrate] The bitrate of the voice channel
   * @property {number} [userLimit] The user limit of the channel
   * @property {PartialOverwriteData} [permissionOverwrites]
   * Overwrites of the channel
   * @property {number} [rateLimitPerUser] The rate limit per user of the channel in seconds
   */

  /**
   * Resolves a GuildResolvable to a Guild object.
   * @method resolve
   * @memberof GuildManager
   * @instance
   * @param {GuildResolvable} guild The guild resolvable to identify
   * @returns {?Guild}
   */
  resolve(guild) {
    if (
      guild instanceof GuildChannel ||
      guild instanceof GuildMember ||
      guild instanceof GuildEmoji ||
      guild instanceof Role ||
      (guild instanceof Invite && guild.guild)
    ) {
      return super.resolve(guild.guild);
    }
    return super.resolve(guild);
  }

  /**
   * Resolves a GuildResolvable to a Guild ID string.
   * @method resolveID
   * @memberof GuildManager
   * @instance
   * @param {GuildResolvable} guild The guild resolvable to identify
   * @returns {?Snowflake}
   */
  resolveID(guild) {
    if (
      guild instanceof GuildChannel ||
      guild instanceof GuildMember ||
      guild instanceof GuildEmoji ||
      guild instanceof Role ||
      (guild instanceof Invite && guild.guild)
    ) {
      return super.resolveID(guild.guild.id);
    }
    return super.resolveID(guild);
  }

  /**
   * Creates a guild.
   * <warn>This is only available to bots in fewer than 10 guilds.</warn>
   * @param {string} name The name of the guild
   * @param {Object} [options] Options for the creating
   * @param {number} [options.afkChannelID] The ID of the AFK channel
   * @param {number} [options.afkTimeout] The AFK timeout in seconds
   * @param {PartialChannelData[]} [options.channels] The channels for this guild
   * @param {DefaultMessageNotifications} [options.defaultMessageNotifications] The default message notifications
   * for the guild
   * @param {ExplicitContentFilterLevel} [options.explicitContentFilter] The explicit content filter level for the guild
   * @param {BufferResolvable|Base64Resolvable} [options.icon=null] The icon for the guild
   * @param {string} [options.region] The region for the server, defaults to the closest one available
   * @param {PartialRoleData[]} [options.roles] The roles for this guild,
   * the first element of this array is used to change properties of the guild's everyone role.
   * @param {number} [options.systemChannelID] The ID of the system channel
   * @param {VerificationLevel} [options.verificationLevel] The verification level for the guild
   * @returns {Promise<Guild>} The guild that was created
   */
  async create(
    name,
    {
      afkChannelID,
      afkTimeout,
      channels = [],
      defaultMessageNotifications,
      explicitContentFilter,
      icon = null,
      region,
      roles = [],
      systemChannelID,
      verificationLevel,
    } = {},
  ) {
    icon = await DataResolver.resolveImage(icon);

    if (typeof verificationLevel !== 'undefined' && typeof verificationLevel !== 'number') {
      verificationLevel = VerificationLevels.indexOf(verificationLevel);
    }

    if (typeof defaultMessageNotifications !== 'undefined' && typeof defaultMessageNotifications !== 'number') {
      defaultMessageNotifications = DefaultMessageNotifications.indexOf(defaultMessageNotifications);
    }

    if (typeof explicitContentFilter !== 'undefined' && typeof explicitContentFilter !== 'number') {
      explicitContentFilter = ExplicitContentFilterLevels.indexOf(explicitContentFilter);
    }

    for (const channel of channels) {
      if (channel.type) {
        channel.type = ChannelTypes[channel.type.toUpperCase()];
      }

      channel.parent_id = channel.parentID;
      delete channel.parentID;

      if (!channel.permissionOverwrites) {
        continue;
      }

      for (const overwrite of channel.permissionOverwrites) {
        if (overwrite.allow) {
          overwrite.allow = Permissions.resolve(overwrite.allow);
        }

        if (overwrite.deny) {
          overwrite.deny = Permissions.resolve(overwrite.deny);
        }
      }

      channel.permission_overwrites = channel.permissionOverwrites;
      delete channel.permissionOverwrites;
    }

    for (const role of roles) {
      if (role.color) {
        role.color = resolveColor(role.color);
      }

      if (role.permissions) {
        role.permissions = Permissions.resolve(role.permissions);
      }
    }

    return new Promise((resolve, reject) =>
      this.client.api.guilds
        .post({
          data: {
            name,
            region,
            icon,
            verification_level: verificationLevel,
            default_message_notifications: defaultMessageNotifications,
            explicit_content_filter: explicitContentFilter,
            roles,
            channels,
            afk_channel_id: afkChannelID,
            afk_timeout: afkTimeout,
            system_channel_id: systemChannelID,
          },
        })
        .then(data => {
          if (this.client.guilds.cache.has(data.id)) {
            return resolve(this.client.guilds.cache.get(data.id));
          }

          const handleGuild = guild => {
            if (guild.id === data.id) {
              this.client.clearTimeout(timeout);
              this.client.removeListener(Events.GUILD_CREATE, handleGuild);
              this.client.decrementMaxListeners();
              resolve(guild);
            }
          };
          this.client.incrementMaxListeners();
          this.client.on(Events.GUILD_CREATE, handleGuild);

          const timeout = this.client.setTimeout(() => {
            this.client.removeListener(Events.GUILD_CREATE, handleGuild);
            this.client.decrementMaxListeners();
            resolve(this.client.guilds.add(data));
          }, 10000);
          return undefined;
        }, reject),
    );
  }

  /**
   * Creates a data-less Guild instance
   * @param {string} id Guild ID
   * @returns {Guild}
   */
  forge(id) {
    return this.add({ id }, false)
  }

  /**
   * Obtains a guild from Discord, or the guild cache if it's already available.
   * @param {Snowflake} id ID of the guild
   * @param {boolean} [cache=true] Whether to cache the new guild object if it isn't already
   * @param {boolean} [force=false] Whether to skip the cache check and request the API
   * @returns {Promise<Guild>}
   * @example
   * // Fetch a guild by its id
   * client.guilds.fetch('222078108977594368')
   *   .then(guild => console.log(guild.name))
   *   .catch(console.error);
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
      if (!options.force && existing && existing.ownerID) {
        return existing;
      }
      const guild = await this.client.api.guilds(options.id).get({ query: { with_counts: true } });
      return this.add(guild, options.cache || this.cache.has(options.id));
    }

    const c = new Collection(),
      l = options.limit > 100 ? 100 : options.limit || 100;

    let guilds = await this.client.api.users("@me").guilds().get({
      query: {
        limit: l,
        after: options.after || 0,
        before: options.before || 0
      }
    });

    while (guilds.length) {
      for (const guild of guilds) {
        c.set(guild.id, this.cache.get(guild.id) || this.add(guild, options.cache));
        if (options.limit && c.size >= options.limit) {
          return c;
        }
      }

      guilds = guilds.length === 100 && (!options.limit || c.size < options.limit) ? await this.client.api.users("@me").guilds().get({
        query: {
          limit: 100,
          after: c.last(),
          before: options.before || 0
        }
      }) : [];
    }

    return c;
  }
}

module.exports = GuildManager;
