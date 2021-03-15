'use strict';

const GuildChannel = require('./GuildChannel');
const Collection = require('../util/Collection');
const Permissions = require('../util/Permissions');

/**
 * Represents a guild voice channel on Discord.
 * @extends {GuildChannel}
 */
class VoiceChannel extends GuildChannel {
  _patch(data) {
    super._patch(data);
    /**
     * The bitrate of this voice channel
     * @type {number}
     */
    this.bitrate = data.bitrate;

    /**
     * The maximum amount of users allowed in this channel - 0 means unlimited.
     * @type {number}
     */
    this.userLimit = data.user_limit;
  }

  /**
   * The members in this voice channel
   * @type {Collection<Snowflake, GuildMember>}
   * @readonly
   */
  get members() {
    const coll = new Collection();
    for (const state of this.guild.voiceStates.cache.values()) {
      if (state.channelID === this.id && state.member) {
        coll.set(state.id, state.member);
      }
    }

    return coll;
  }

  /**
   * Checks if the voice channel is full
   * @type {boolean}
   * @readonly
   */
  get full() {
    return this.userLimit > 0 && this.members.size >= this.userLimit;
  }

  /**
   * Whether the channel is deletable by the client user
   * @type {boolean}
   * @readonly
   */
  get deletable() {
    return super.deletable && this.permissionsFor(this.client.user).has(Permissions.FLAGS.CONNECT, false);
  }

  /**
   * Whether the channel is editable by the client user
   * @type {boolean}
   * @readonly
   */
  get editable() {
    return this.manageable && this.permissionsFor(this.client.user).has(Permissions.FLAGS.CONNECT, false);
  }

  /**
   * Whether the channel is joinable by the client user
   * @type {boolean}
   * @readonly
   */
  get joinable() {
    if ((!this.guild.roles.cache.size && !this.client.doCache("roles")) || (!this.permissionOverwrites.size && !this.client.options.cacheOverwrites)) {
      return true;
    }

    if (!this.viewable) {
      return false;
    }

    if (!this.permissionsFor(this.client.user).has(Permissions.FLAGS.CONNECT, false)) {
      return false;
    }

    return !(this.full && !this.permissionsFor(this.client.user).has(Permissions.FLAGS.MOVE_MEMBERS, false));
  }

  /**
   * Checks if the client has permission to send audio to the voice channel
   * @type {boolean}
   * @readonly
   */
  get speakable() {
    return this.permissionsFor(this.client.user).has(Permissions.FLAGS.SPEAK, false);
  }
}

module.exports = VoiceChannel;
