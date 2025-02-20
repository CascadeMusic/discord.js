'use strict';

const BaseGuildEmoji = require('./BaseGuildEmoji');
const { Error } = require('../errors');
const GuildEmojiRoleManager = require('../managers/GuildEmojiRoleManager');
const Permissions = require('../util/Permissions');

/**
 * Represents a custom emoji.
 * @extends {BaseGuildEmoji}
 */
class GuildEmoji extends BaseGuildEmoji {
  /**
   * @param {Client} client The instantiating client
   * @param {Object} data The data for the guild emoji
   * @param {Guild} guild The guild the guild emoji is part of
   */
  constructor(client, data, guild) {
    super(client, data, guild);

    /**
     * The user who created this emoji
     * @type {?User}
     */
    Object.defineProperty(this, "author", {
      enumerable: false,
      get: function () {
        return this._author
          ? this.client.users.cache.get(this._author) || this.client.users.add({ id: this._author }, false)
          : null;
      }
    });
  }

  /**
   * The guild this emoji is part of
   * @type {Guild}
   * @name GuildEmoji#guild
   */

  _clone() {
    const clone = super._clone();
    clone._roles = this._roles.slice();
    return clone;
  }

  _patch(data) {
    super._patch(data);

    if (typeof data.user !== "undefined") {
      this._author = data.user.id;
    }
  }

  /**
   * Whether the emoji is deletable by the client user
   * @type {boolean}
   * @readonly
   */
  get deletable() {
    if (!this.guild.me) {
      throw new Error('GUILD_UNCACHED_ME');
    }
    return !this.managed && this.guild.me.permissions.has(Permissions.FLAGS.MANAGE_EMOJIS);
  }

  /**
   * A manager for roles this emoji is active for.
   * @type {GuildEmojiRoleManager}
   * @readonly
   */
  get roles() {
    return new GuildEmojiRoleManager(this);
  }

  /**
   * Fetches the author for this emoji
   * @returns {Promise<User>}
   */
  async fetchAuthor(cache = true) {
    if (this.managed) {
      throw new Error("EMOJI_MANAGED");
    } else {
      if (!this.guild.me) {
        throw new Error("GUILD_UNCACHED_ME");
      }

      if (this.guild.roles.cache.size && !this.guild.me.permissions.has(Discord.Permissions.FLAGS.MANAGE_EMOJIS)) {
        throw new Error("MISSING_MANAGE_EMOJIS_PERMISSION", this.guild);
      }
    }

    const data = await this.client.api.guilds(this.guild.id).emojis(this.id).get();
    this._patch(data);

    return this.client.users.add(data.user, cache);
  }

  /**
   * Data for editing an emoji.
   * @typedef {Object} GuildEmojiEditData
   * @property {string} [name] The name of the emoji
   * @property {Collection<Snowflake, Role>|RoleResolvable[]} [roles] Roles to restrict emoji to
   */

  /**
   * Edits the emoji.
   * @param {GuildEmojiEditData} data The new data for the emoji
   * @param {string} [reason] Reason for editing this emoji
   * @returns {Promise<GuildEmoji>}
   * @example
   * // Edit an emoji
   * emoji.edit({ name: 'newemoji' })
   *   .then(e => console.log(`Edited emoji ${e}`))
   *   .catch(console.error);
   */
  edit(data, reason) {
    const roles = data.roles ? data.roles.map(r => r.id || r) : undefined;
    return this.client.api
      .guilds(this.guild.id)
      .emojis(this.id)
      .patch({
        data: {
          name: data.name,
          roles,
        },
        reason,
      })
      .then(newData => {
        const clone = this._clone();
        clone._patch(newData);
        return clone;
      });
  }

  /**
   * Sets the name of the emoji.
   * @param {string} name The new name for the emoji
   * @param {string} [reason] Reason for changing the emoji's name
   * @returns {Promise<GuildEmoji>}
   */
  setName(name, reason) {
    return this.edit({ name }, reason);
  }

  /**
   * Deletes the emoji.
   * @param {string} [reason] Reason for deleting the emoji
   * @returns {Promise<GuildEmoji>}
   */
  delete(reason) {
    return this.client.api
      .guilds(this.guild.id)
      .emojis(this.id)
      .delete({ reason })
      .then(() => this);
  }

  /**
   * Whether this emoji is the same as another one.
   * @param {GuildEmoji|Object} other The emoji to compare it to
   * @returns {boolean} Whether the emoji is equal to the given emoji or not
   */
  equals(other) {
    if (other instanceof GuildEmoji) {
      return (
        other.id === this.id &&
        other.name === this.name &&
        other.managed === this.managed &&
        other.available === this.available &&
        other.requiresColons === this.requiresColons &&
        other.roles.cache.size === this.roles.cache.size &&
        other.roles.cache.every(role => this.roles.cache.has(role.id))
      );
    } else {
      return (
        other.id === this.id &&
        other.name === this.name &&
        other.roles.length === this.roles.cache.size &&
        other.roles.every(role => this.roles.cache.has(role))
      );
    }
  }
}

module.exports = GuildEmoji;
