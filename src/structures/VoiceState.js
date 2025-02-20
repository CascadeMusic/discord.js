'use strict';

const Base = require('./Base');
const { Error, TypeError } = require('../errors');

/**
 * Represents the voice state for a Guild Member.
 */
class VoiceState extends Base {
  /**
   * @param {Guild} guild The guild the voice state is part of
   * @param {Object} data The data for the voice state
   */
  constructor(guild, data) {
    super(guild.client);
    /**
     * The guild of this voice state
     * @type {Guild}
     */
    this.guild = guild;
    /**
     * The ID of the member of this voice state
     * @type {Snowflake}
     */
    this.id = data.user_id;
    this._patch(data);
  }

  _patch(data) {
    /**
     * Whether this member is deafened server-wide
     * @type {?boolean}
     */
    this.serverDeaf = 'deaf' in data ? data.deaf : null;

    /**
     * Whether this member is muted server-wide
     * @type {?boolean}
     */
    this.serverMute = 'mute' in data ? data.mute : null;

    /**
     * Whether this member is self-deafened
     * @type {?boolean}
     */
    this.selfDeaf = 'self_deaf' in data ? data.self_deaf : null;

    /**
     * Whether this member is self-muted
     * @type {?boolean}
     */
    this.selfMute = 'self_mute' in data ? data.self_mute : null;

    /**
     * Whether this member's camera is enabled
     * @type {?boolean}
     */
    this.selfVideo = 'self_video' in data ? data.self_video : null;

    /**
     * The session ID of this member's connection
     * @type {?string}
     */
    this.sessionID = 'session_id' in data ? data.session_id : null;

    /**
     * Whether this member is streaming using "Go Live"
     * @type {boolean}
     */
    this.streaming = data.self_stream || false;

    /**
     * The ID of the voice channel that this member is in
     * @type {?Snowflake}
     */
    this.channelID = data.channel_id || null;

    if (data.member && data.member.user && !this.guild.members.cache.has(data.member.user.id)) {
      this._member = data.member;
    }

    return this;
  }

  /**
   * The member that this voice state belongs to
   * @type {?GuildMember}
   * @readonly
   */
  get member() {
    return this.guild.members.cache.get(this.id)
      || this.guild.members.add(this._member || { user: { id: this.id } }, false);
  }

  /**
   * The channel that the member is connected to
   * @type {?VoiceChannel}
   * @readonly
   */
  get channel() {
    return this.channelID
      ? this.client.channels.cache.get(this.channelID)
      || this.client.channels.add({ id: this.channelID, type: 2 }, this.guild, false)
      : null;
  }

  /**
   * If this is a voice state of the client user, then this will refer to the active VoiceConnection for this guild
   * @type {?VoiceConnection}
   * @readonly
   */
  get connection() {
    if (this.id !== this.client.user.id) {
      return null;
    }
    return this.client.voice.connections.get(this.guild.id) || null;
  }

  /**
   * Whether this member is either self-deafened or server-deafened
   * @type {?boolean}
   * @readonly
   */
  get deaf() {
    return this.serverDeaf || this.selfDeaf;
  }

  /**
   * Whether this member is either self-muted or server-muted
   * @type {?boolean}
   * @readonly
   */
  get mute() {
    return this.serverMute || this.selfMute;
  }

  /**
   * Mutes/unmutes the member of this voice state.
   * @param {boolean} mute Whether or not the member should be muted
   * @param {string} [reason] Reason for muting or unmuting
   * @returns {Promise<GuildMember>}
   */
  setMute(mute, reason) {
    return this.member
      ? this.member.edit({ mute }, reason)
      : Promise.reject(new Error('VOICE_STATE_UNCACHED_MEMBER'));
  }

  /**
   * Deafens/undeafens the member of this voice state.
   * @param {boolean} deaf Whether or not the member should be deafened
   * @param {string} [reason] Reason for deafening or undeafening
   * @returns {Promise<GuildMember>}
   */
  setDeaf(deaf, reason) {
    return this.member
      ? this.member.edit({ deaf }, reason)
      : Promise.reject(new Error('VOICE_STATE_UNCACHED_MEMBER'));
  }

  /**
   * Kicks the member from the voice channel.
   * @param {string} [reason] Reason for kicking member from the channel
   * @returns {Promise<GuildMember>}
   */
  kick(reason) {
    return this.setChannel(null, reason);
  }

  /**
   * Moves the member to a different channel, or disconnects them from the one they're in.
   * @param {ChannelResolvable|null} [channel] Channel to move the member to, or `null` if you want to disconnect them
   * from voice.
   * @param {string} [reason] Reason for moving member to another channel or disconnecting
   * @returns {Promise<GuildMember>}
   */
  setChannel(channel, reason) {
    return this.member
      ? this.member.edit({ channel }, reason)
      : Promise.reject(new Error('VOICE_STATE_UNCACHED_MEMBER'));
  }

  toJSON() {
    return super.toJSON({
      id: true,
      serverDeaf: true,
      serverMute: true,
      selfDeaf: true,
      selfMute: true,
      sessionID: true,
      channelID: 'channel',
    });
  }
}

module.exports = VoiceState;
