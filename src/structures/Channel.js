'use strict';

const Base = require('./Base');
const { ChannelTypes } = require('../util/Constants');
const Snowflake = require('../util/Snowflake');
const Structures = require("../util/Structures");

/**
 * Represents any channel on
 * @extends {Base}
 * @abstract
 */
class Channel extends Base {
  constructor(client, data) {
    super(client);

    const type = Object.keys(ChannelTypes)[data.type];
    /**
     * The type of the channel, either:
     * * `dm` - a DM channel
     * * `text` - a guild text channel
     * * `voice` - a guild voice channel
     * * `category` - a guild category channel
     * * `news` - a guild news channel
     * * `store` - a guild store channel
     * * `unknown` - a generic channel of unknown type, could be Channel or GuildChannel
     * @type {string}
     */
    this.type = type ? type.toLowerCase() : 'unknown';

    /**
     * Whether the channel has been deleted
     * @type {boolean}
     */
    this.deleted = false;

    if (data) {
      this._patch(data);
    }
  }

  _patch(data) {
    /**
     * The unique ID of the channel
     * @type {Snowflake}
     */
    this.id = data.id;
  }

  /**
   * The timestamp the channel was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return Snowflake.deconstruct(this.id).timestamp;
  }

  /**
   * The time the channel was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * When concatenated with a string, this automatically returns the channel's mention instead of the Channel object.
   * @returns {string}
   * @example
   * // Logs: Hello from <#123456789012345678>!
   * console.log(`Hello from ${channel}!`);
   */
  toString() {
    return `<#${this.id}>`;
  }

  /**
   * Deletes this channel.
   * @returns {Promise<Channel>}
   * @example
   * // Delete the channel
   * channel.delete()
   *   .then(console.log)
   *   .catch(console.error);
   */
  delete() {
    return this.client.api
      .channels(this.id)
      .delete()
      .then(() => this);
  }

  /**
   * Fetches this channel.
   * @param {boolean} [force=false] Whether to skip the cache check and request the API
   * @returns {Promise<Channel>}
   */
  fetch(force = false) {
    return this.client.channels.fetch(this.id, true, force);
  }

  /**
   * Indicates whether this channel is text-based.
   * @returns {boolean}
   */
  isText() {
    return 'messages' in this;
  }

  static create(client, data, _guild) {
    let channel,
      guild = _guild;

    if (!data.guild_id && !guild) {
      if ((data.recipients && data.type !== ChannelTypes.GROUP) || data.type === ChannelTypes.DM) {
        const DMChannel = Structures.get("DMChannel");
        channel = new DMChannel(client, data);
      } else if (data.type === ChannelTypes.GROUP) {
        const PartialGroupDMChannel = require('./PartialGroupDMChannel');
        channel = new PartialGroupDMChannel(client, data);
      }
    } else {
      if (!(guild instanceof Guild)) {
        guild = client.guilds.cache.get(data.guild_id) || client.guilds.add({
          id: data.guild_id,
          shardID: data.shardID
        }, false);
      }
      if (guild) {
        switch (data.type) {
          case ChannelTypes.TEXT: {
            const TextChannel = Structures.get("TextChannel");
            channel = new TextChannel(guild, data);
            break;
          }

          case ChannelTypes.VOICE: {
            const VoiceChannel = Structures.get("VoiceChannel");
            channel = new VoiceChannel(guild, data);
            break;
          }

          case ChannelTypes.CATEGORY: {
            const CategoryChannel = Structures.get("CategoryChannel");
            channel = new CategoryChannel(guild, data);
            break;
          }

          case ChannelTypes.NEWS: {
            const NewsChannel = Structures.get("NewsChannel");
            channel = new NewsChannel(guild, data);
            break;
          }

          case ChannelTypes.STORE: {
            const StoreChannel = Structures.get("StoreChannel");
            channel = new StoreChannel(guild, data);
            break;
          }
        }
      }
    }

    return channel;
  }

  toJSON(...props) {
    return super.toJSON({ createdTimestamp: true }, ...props);
  }
}

module.exports = Channel;
