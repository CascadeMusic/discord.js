'use strict';

const BaseGuildEmojiManager = require('./BaseGuildEmojiManager');
const { TypeError } = require('../errors');
const Collection = require('../util/Collection');
const DataResolver = require('../util/DataResolver');

/**
 * Manages API methods for GuildEmojis and stores their cache.
 * @extends {BaseGuildEmojiManager}
 */
class GuildEmojiManager extends BaseGuildEmojiManager {
  constructor(guild, iterable) {
    super(guild.client, iterable);

    /**
     * The guild this manager belongs to
     * @type {Guild}
     */
    this.guild = guild;
  }

  add(data, cache) {
    return super.add(data, cache, { extras: [ this.guild ] });
  }

  /**
   * Creates a new custom emoji in the guild.
   * @param {BufferResolvable|Base64Resolvable} attachment The image for the emoji
   * @param {string} name The name for the emoji
   * @param {Object} [options] Options
   * @param {Collection<Snowflake, Role>|RoleResolvable[]} [options.roles] Roles to limit the emoji to
   * @param {string} [options.reason] Reason for creating the emoji
   * @returns {Promise<Emoji>} The created emoji
   * @example
   * // Create a new emoji from a url
   * guild.emojis.create('https://i.imgur.com/w3duR07.png', 'rip')
   *   .then(emoji => console.log(`Created new emoji with name ${emoji.name}!`))
   *   .catch(console.error);
   * @example
   * // Create a new emoji from a file on your computer
   * guild.emojis.create('./memes/banana.png', 'banana')
   *   .then(emoji => console.log(`Created new emoji with name ${emoji.name}!`))
   *   .catch(console.error);
   */
  async create(attachment, name, { roles, reason } = {}) {
    attachment = await DataResolver.resolveImage(attachment);
    if (!attachment) {
      throw new TypeError('REQ_RESOURCE_TYPE');
    }

    const data = { image: attachment, name };
    if (roles) {
      data.roles = [];
      for (let role of roles instanceof Collection ? roles.values() : roles) {
        role = this.guild.roles.resolve(role);
        if (!role) {
          return Promise.reject(
            new TypeError('INVALID_TYPE', 'options.roles', 'Array or Collection of Roles or Snowflakes', true),
          );
        }
        data.roles.push(role.id);
      }
    }

    return this.client.api
      .guilds(this.guild.id)
      .emojis.post({ data, reason })
      .then(emoji => this.client.actions.GuildEmojiCreate.handle(this.guild, emoji).emoji);
  }

  /**
   * Creates a data-less instance of GuildEmoji
   * @param {string} id Emoji ID
   * @returns {GuildEmoji}
   */
  forge(id) {
    return this.add({ id }, false);
  }

  /**
   * Obtains one or more emojis from Discord, or the emoji cache if they're already available.
   * @param {Snowflake} [id] ID of the emoji
   * @param {boolean} [cache=true] Whether to cache the new emoji objects if it weren't already
   * @param {boolean} [force=false] Whether to skip the cache check and request the API
   * @returns {Promise<GuildEmoji|Collection<Snowflake, GuildEmoji>>}
   * @example
   * // Fetch all emojis from the guild
   * message.guild.emojis.fetch()
   *   .then(emojis => console.log(`There are ${emojis.size} emojis.`))
   *   .catch(console.error);
   * @example
   * // Fetch a single emoji
   * message.guild.emojis.fetch('222078108977594368')
   *   .then(emoji => console.log(`The emoji name is: ${emoji.name}`))
   *   .catch(console.error);
   */
  async fetch(id, cache = true) {
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
      if (!options.force && existing) {
        return existing;
      }

      const emoji = await this.client.api.guilds(this.guild.id).emojis(options.id).get();
      return this.add(emoji, options.cache);
    }

    const emojis = await this.client.api.guilds(this.guild.id).emojis().get();
    if (options.cache) {
      for (const emoji of emojis) {
        this.add(emoji);
      }

      return this.cache;
    }

    const collection = new Discord.Collection();
    for (const emoji of emojis) {
      collection.set(emoji.id, this.add(emoji, false));
    }

    return collection;
  }
}

module.exports = GuildEmojiManager;
