'use strict';

const APIMessage = require('./APIMessage');
const Base = require('./Base');
const ClientApplication = require('./ClientApplication');
const MessageAttachment = require('./MessageAttachment');
const Embed = require('./MessageEmbed');
const Mentions = require('./MessageMentions');
const ReactionCollector = require('./ReactionCollector');
const { Error, TypeError } = require('../errors');
const ReactionManager = require('../managers/ReactionManager');
const Collection = require('../util/Collection');
const { MessageTypes, SystemMessageTypes } = require('../util/Constants');
const MessageFlags = require('../util/MessageFlags');
const Permissions = require('../util/Permissions');
const SnowflakeUtil = require('../util/Snowflake');
const Util = require('../util/Util');
const MessageMentions = require("./MessageMentions");
const Constants = require("../util/Constants");

/**
 * Represents a message on Discord.
 * @extends {Base}
 */
class Message extends Base {
  /**
   * @param {Client} client The instantiating client
   * @param {Object} data The data for the message
   * @param {TextChannel|DMChannel|NewsChannel} channel The channel the message was sent in
   */
  constructor(client, data, channel) {
    super(client);

    /**
     * The channel that the message was sent in
     * @type {TextChannel|DMChannel|NewsChannel}
     */
    this.channel = channel;

    /**
     * Whether this message has been deleted
     * @type {boolean}
     */
    this.deleted = false;

    if (!this.client.channels.cache.get(channel.id)) {
      this._channel = channel;
      Object.defineProperty(this, "channel", {
        enumerable: false,
        get: function () {
          return this.client.channels.cache.get(this._channel.id) ?? this._channel;
        }
      });
    }

    if (data) {
      this._patch(data);
    }
  }

  _patch(data) {
    /**
     * The ID of the message
     * @type {Snowflake}
     */
    this.id = data.id;

    if ('type' in data) {
      /**
       * The type of the message
       * @type {?MessageType}
       */
      this.type = MessageTypes[data.type];

      /**
       * Whether or not this message was sent by Discord, not actually a user (e.g. pin notifications)
       * @type {?boolean}
       */
      this.system = SystemMessageTypes.includes(this.type);
    } else if (typeof this.type !== 'string') {
      this.system = null;
      this.type = null;
    }

    if ('content' in data) {
      /**
       * The content of the message
       * @type {?string}
       */
      this.content = data.content;
    } else if (typeof this.content !== 'string') {
      this.content = null;
    }

    this.author = data.author
      ? this.client.users.add(data.author, this.client.doCache("members") || this.client.users.cache.has(data.author.id))
      : null;

    if (data.member && this.guild && this.author) {
      const member = this.guild.members.add(Object.assign(data.member, { user: this.author }), this.client.doCache("members") || this.client.users.cache.has(data.author.id));

      if (!this.guild.members.cache.has(this.author.id)) {
        this._member = member;
      }
    }

    if ('pinned' in data) {
      /**
       * Whether or not this message is pinned
       * @type {?boolean}
       */
      this.pinned = Boolean(data.pinned);
    } else if (typeof this.pinned !== 'boolean') {
      this.pinned = null;
    }

    if ('tts' in data) {
      /**
       * Whether or not the message was Text-To-Speech
       * @type {?boolean}
       */
      this.tts = data.tts;
    } else if (typeof this.tts !== 'boolean') {
      this.tts = null;
    }

    /**
     * A random number or string used for checking message delivery
     * <warn>This is only received after the message was sent successfully, and
     * lost if re-fetched</warn>
     * @type {?string}
     */
    this.nonce = 'nonce' in data ? data.nonce : null;

    /**
     * A list of embeds in the message - e.g. YouTube Player
     * @type {MessageEmbed[]}
     */
    this.embeds = (data.embeds || []).map(e => new Embed(e, true));

    /**
     * A collection of attachments in the message - e.g. Pictures - mapped by their ID
     * @type {Collection<Snowflake, MessageAttachment>}
     */
    this.attachments = new Collection();
    if (data.attachments) {
      for (const attachment of data.attachments) {
        this.attachments.set(attachment.id, new MessageAttachment(attachment.url, attachment.filename, attachment));
      }
    }

    /**
     * The timestamp the message was sent at
     * @type {number}
     */
    this.createdTimestamp = SnowflakeUtil.deconstruct(this.id).timestamp;

    /**
     * The timestamp the message was last edited at (if applicable)
     * @type {?number}
     */
    this.editedTimestamp = 'edited_timestamp' in data ? new Date(data.edited_timestamp).getTime() : null;

    /**
     * A manager of the reactions belonging to this message
     * @type {ReactionManager}
     */
    this.reactions = new ReactionManager(this);
    if (data.reactions && data.reactions.length > 0) {
      for (const reaction of data.reactions) {
        this.reactions.add(reaction);
      }
    }

    this.mentions = new MessageMentions(this, null, null, data.mention_everyone, data.mention_channels);
    this.mentions._members = [];

    if (data.mentions && data.mentions.length) {
      for (const mention of data.mentions) {
        this.mentions.users.set(mention.id, this.client.users.add(mention, this.client.users.cache.has(mention.id)));

        if (mention.member && this.guild) {
          mention.member = Object.assign(mention.member, { user: mention });

          if (this.client.users.cache.has(mention.id)) {
            if (this.guild.members.cache.has(mention.id)) {
              this.guild.members.cache.get(mention.id)._patch(mention.member);
            } else {
              this.guild.members.add(mention.member);
            }
          } else {
            this.mentions._members.push(mention.member);
          }
        }
      }
    }

    if (data.mention_roles && data.mention_roles.length && this.guild) {
      for (const role of data.mention_roles) {
        const _role = this.guild.roles.cache.get(role)
          ?? this.guild.roles.add({ id: role, permissions: 0 }, false)

        this.mentions.roles.set(role, _role);
      }
    }

    /**
     * ID of the webhook that sent the message, if applicable
     * @type {?Snowflake}
     */
    this.webhookID = data.webhook_id || null;

    /**
     * Supplemental application information for group activities
     * @type {?ClientApplication}
     */
    this.application = data.application ? new ClientApplication(this.client, data.application) : null;

    /**
     * Group activity
     * @type {?MessageActivity}
     */
    this.activity = data.activity
      ? {
        partyID: data.activity.party_id,
        type: data.activity.type,
      }
      : null;

    /**
     * Flags that are applied to the message
     * @type {Readonly<MessageFlags>}
     */
    this.flags = new MessageFlags(data.flags).freeze();

    /**
     * Reference data sent in a crossposted message or inline reply.
     * @typedef {Object} MessageReference
     * @property {string} channelID ID of the channel the message was referenced
     * @property {?string} guildID ID of the guild the message was referenced
     * @property {?string} messageID ID of the message that was referenced
     */

    /**
     * Message reference data
     * @type {?MessageReference}
     */
    this.reference = data.message_reference
      ? {
        channelID: data.message_reference.channel_id,
        guildID: data.message_reference.guild_id,
        messageID: data.message_reference.message_id,
      }
      : null;

    if (data.referenced_message) {
      this.channel.messages.add(data.referenced_message);
    }
  }

  /**
   * Whether or not this message is a partial
   * @type {boolean}
   * @readonly
   */
  get partial() {
    return typeof this.content !== 'string' || !this.author;
  }

  /**
   * Updates the message and returns the old message.
   * @param {Object} data Raw Discord message update data
   * @returns {Message}
   * @private
   */
  patch(data) {
    const clone = this._clone();

    if ('edited_timestamp' in data) {
      this.editedTimestamp = new Date(data.edited_timestamp).getTime();
    }

    if ('content' in data) {
      this.content = data.content;
    }

    if ('pinned' in data) {
      this.pinned = data.pinned;
    }

    if ('tts' in data) {
      this.tts = data.tts;
    }

    if ('embeds' in data) {
      this.embeds = data.embeds.map(e => new Embed(e, true));
    } else {
      this.embeds = this.embeds.slice();
    }

    if ('attachments' in data) {
      this.attachments = new Collection();
      for (const attachment of data.attachments) {
        this.attachments.set(attachment.id, new MessageAttachment(attachment.url, attachment.filename, attachment));
      }
    } else {
      this.attachments = new Collection(this.attachments);
    }

    this.flags = new MessageFlags('flags' in data ? data.flags : 0).freeze();

    this.mentions = new Mentions(
      this,
      'mentions' in data ? data.mentions : this.mentions.users,
      'mention_roles' in data ? data.mention_roles : this.mentions.roles,
      'mention_everyone' in data ? data.mention_everyone : this.mentions.everyone,
      'mention_channels' in data ? data.mention_channels : this.mentions.crosspostedChannels,
    );

    if (data.mentions && data.mentions.length) {
      this.mentions.users.clear();
      this.mentions._members = [];

      for (const mention of data.mentions) {
        this.mentions.users.set(mention.id, this.client.users.add(mention, this.client.users.cache.has(mention.id)));

        if (mention.member && this.guild) {
          mention.member = Object.assign(mention.member, { user: mention });

          if (this.client.users.cache.has(mention.id)) {
            if (this.guild.members.cache.has(mention.id)) {
              this.guild.members.cache.get(mention.id)._patch(mention.member);
            } else {
              this.guild.members.add(mention.member);
            }
          } else {
            this.mentions._members.push(mention.member);
          }
        }
      }
    }

    if (data.mention_roles && data.mention_roles.length && this.guild) {
      this.mentions.roles.clear();

      for (const role of data.mention_roles) {
        this.mentions.roles.set(role, this.guild.roles.cache.get(role) || this.guild.roles.add({ id: role }, false));
      }
    }

    return clone;
  }

  /**
   * Represents the author of the message as a guild member.
   * Only available if the message comes from a guild where the author is still a member
   * @type {?GuildMember}
   * @readonly
   */
  get member() {
    if (!this.guild) {
      return null;
    }

    const id = (this.author || {}).id ?? (this._member || {}).id;
    if (!id) {
      return null;
    }

    return this.guild.members.cache.get(id) ?? this._member ?? null;
  }

  /**
   * The time the message was sent at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * The time the message was last edited at (if applicable)
   * @type {?Date}
   * @readonly
   */
  get editedAt() {
    return this.editedTimestamp ? new Date(this.editedTimestamp) : null;
  }

  /**
   * The guild the message was sent in (if in a guild channel)
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.channel.guild || null;
  }

  /**
   * The url to jump to this message
   * @type {string}
   * @readonly
   */
  get url() {
    return `https://discord.com/channels/${this.guild ? this.guild.id : '@me'}/${this.channel.id}/${this.id}`;
  }

  /**
   * The message contents with all mentions replaced by the equivalent text.
   * If mentions cannot be resolved to a name, the relevant mention in the message content will not be converted.
   * @type {string}
   * @readonly
   */
  get cleanContent() {
    // eslint-disable-next-line eqeqeq
    return this.content != null ? Util.cleanContent(this.content, this) : null;
  }

  /**
   * Creates a reaction collector.
   * @param {CollectorFilter} filter The filter to apply
   * @param {ReactionCollectorOptions} [options={}] Options to send to the collector
   * @returns {ReactionCollector}
   * @example
   * // Create a reaction collector
   * const filter = (reaction, user) => reaction.emoji.name === '👌' && user.id === 'someID';
   * const collector = message.createReactionCollector(filter, { time: 15000 });
   * collector.on('collect', r => console.log(`Collected ${r.emoji.name}`));
   * collector.on('end', collected => console.log(`Collected ${collected.size} items`));
   */
  createReactionCollector(filter, options = {}) {
    return new ReactionCollector(this, filter, options);
  }

  /**
   * An object containing the same properties as CollectorOptions, but a few more:
   * @typedef {ReactionCollectorOptions} AwaitReactionsOptions
   * @property {string[]} [errors] Stop/end reasons that cause the promise to reject
   */

  /**
   * Similar to createReactionCollector but in promise form.
   * Resolves with a collection of reactions that pass the specified filter.
   * @param {CollectorFilter} filter The filter function to use
   * @param {AwaitReactionsOptions} [options={}] Optional options to pass to the internal collector
   * @returns {Promise<Collection<string, MessageReaction>>}
   * @example
   * // Create a reaction collector
   * const filter = (reaction, user) => reaction.emoji.name === '👌' && user.id === 'someID'
   * message.awaitReactions(filter, { time: 15000 })
   *   .then(collected => console.log(`Collected ${collected.size} reactions`))
   *   .catch(console.error);
   */
  awaitReactions(filter, options = {}) {
    return new Promise((resolve, reject) => {
      const collector = this.createReactionCollector(filter, options);
      collector.once('end', (reactions, reason) => {
        if (options.errors && options.errors.includes(reason)) {
          reject(reactions);
        } else {
          resolve(reactions);
        }
      });
    });
  }

  /**
   * Whether the message is editable by the client user
   * @type {boolean}
   * @readonly
   */
  get editable() {
    return this.author.id === this.client.user.id;
  }

  /**
   * Whether the message is deletable by the client user
   * @type {boolean}
   * @readonly
   */
  get deletable() {
    if (this.deleted) {
      return false;
    }

    if (this.author.id === this.client.user.id) {
      return true;
    }

    if (!this.guild) {
      return false;
    }

    if ((!this.client.doCache("roles") && !this.guild.roles.cache.size) || (!this.client.doCache("overwrites") && !this.channel.permissionOverwrites.size)) {
      return false;
    }

    return this
      .permissionsFor(this.client.user)
      .has(Permissions.FLAGS.MANAGE_MESSAGES, false);
  }

  /**
   * Whether the message is pinnable by the client user
   * @type {boolean}
   * @readonly
   */
  get pinnable() {
    if (this.type !== Constants.MessageTypes[0]) {
      return false;
    }

    if (!this.guild) {
      return true;
    }

    if ((!this.client.doCache("roles") && !this.guild.roles.cache.size) || (!this.client.doCache("overwrites") && !this.channel.permissionOverwrites.size)) {
      return false;
    }

    return this.channel
      .permissionsFor(this.client.user)
      .has(Permissions.FLAGS.MANAGE_MESSAGES, false);
  }

  /**
   * The Message this crosspost/reply/pin-add references, if cached
   * @type {?Message}
   * @readonly
   */
  get referencedMessage() {
    if (!this.reference) {
      return null;
    }
    const referenceChannel = this.client.channels.resolve(this.reference.channelID);
    if (!referenceChannel) {
      return null;
    }
    return referenceChannel.messages.resolve(this.reference.messageID);
  }

  /**
   * Whether the message is crosspostable by the client user
   * @type {boolean}
   * @readonly
   */
  get crosspostable() {
    if (this.channel.type !== "news" || this.type !== "DEFAULT" || this.flags.has(MessageFlags.FLAGS.CROSSPOSTED)) {
      return false;
    }

    if ((!this.client.doCache("roles") && !this.guild.roles.cache.size) || (!this.client.doCache("overwrites") && !this.channel.permissionOverwrites.size)) {
      return false;
    }

    return this.channel.viewable && this.channel
        .permissionsFor(this.client.user)
        .has(Permissions.FLAGS.SEND_MESSAGES)
      && (this.author.id === this.client.user.id || this.channel
        .permissionsFor(this.client.user)
        .has(Permissions.FLAGS.MANAGE_MESSAGES));
  }

  /**
   * Options that can be passed into editMessage.
   * @typedef {Object} MessageEditOptions
   * @property {string} [content] Content to be edited
   * @property {MessageEmbed|Object} [embed] An embed to be added/edited
   * @property {string|boolean} [code] Language for optional codeblock formatting to apply
   * @property {MessageMentionOptions} [allowedMentions] Which mentions should be parsed from the message content
   * @property {MessageFlags} [flags] Which flags to set for the message. Only `SUPPRESS_EMBEDS` can be edited.
   */

  /**
   * Edits the content of the message.
   * @param {StringResolvable|APIMessage} [content] The new content for the message
   * @param {MessageEditOptions|MessageEmbed} [options] The options to provide
   * @returns {Promise<Message>}
   * @example
   * // Update the content of a message
   * message.edit('This is my new content!')
   *   .then(msg => console.log(`Updated the content of a message to ${msg.content}`))
   *   .catch(console.error);
   */
  edit(content, options) {
    const { data } =
      content instanceof APIMessage ? content.resolveData() : APIMessage.create(this, content, options).resolveData();
    return this.client.api.channels[this.channel.id].messages[this.id].patch({ data }).then(d => {
      const clone = this._clone();
      clone._patch(d);
      return clone;
    });
  }

  /**
   * Publishes a message in an announcement channel to all channels following it.
   * @returns {Promise<Message>}
   * @example
   * // Crosspost a message
   * if (message.channel.type === 'news') {
   *   message.crosspost()
   *     .then(() => console.log('Crossposted message'))
   *     .catch(console.error);
   * }
   */
  async crosspost() {
    await this.client.api.channels(this.channel.id).messages(this.id).crosspost.post();
    return this;
  }

  /**
   * Pins this message to the channel's pinned messages.
   * @param {Object} [options] Options for pinning
   * @param {string} [options.reason] Reason for pinning
   * @returns {Promise<Message>}
   * @example
   * // Pin a message with a reason
   * message.pin({ reason: 'important' })
   *   .then(console.log)
   *   .catch(console.error)
   */
  pin(options) {
    return this.client.api
      .channels(this.channel.id)
      .pins(this.id)
      .put(options)
      .then(() => this);
  }

  /**
   * Unpins this message from the channel's pinned messages.
   * @param {Object} [options] Options for unpinning
   * @param {string} [options.reason] Reason for unpinning
   * @returns {Promise<Message>}
   * @example
   * // Unpin a message with a reason
   * message.unpin({ reason: 'no longer relevant' })
   *   .then(console.log)
   *   .catch(console.error)
   */
  unpin(options) {
    return this.client.api
      .channels(this.channel.id)
      .pins(this.id)
      .delete(options)
      .then(() => this);
  }

  /**
   * Adds a reaction to the message.
   * @param {EmojiIdentifierResolvable} emoji The emoji to react with
   * @returns {Promise<MessageReaction>}
   * @example
   * // React to a message with a unicode emoji
   * message.react('🤔')
   *   .then(console.log)
   *   .catch(console.error);
   * @example
   * // React to a message with a custom emoji
   * message.react(message.guild.emojis.cache.get('123456789012345678'))
   *   .then(console.log)
   *   .catch(console.error);
   */
  react(emoji) {
    emoji = this.client.emojis.resolveIdentifier(emoji);
    if (!emoji) {
      throw new TypeError('EMOJI_TYPE');
    }

    return this.client.api
      .channels(this.channel.id)
      .messages(this.id)
      .reactions(emoji, '@me')
      .put()
      .then(
        () =>
          this.client.actions.MessageReactionAdd.handle({
            user: this.client.user,
            channel: this.channel,
            message: this,
            emoji: Util.parseEmoji(emoji),
          }).reaction,
      );
  }

  /**
   * Deletes the message.
   * @returns {Promise<Message>}
   * @example
   * // Delete a message
   * message.delete()
   *   .then(msg => console.log(`Deleted message from ${msg.author.username}`))
   *   .catch(console.error);
   */
  async delete() {
    await this.channel.messages.delete(this.id);
    return this;
  }

  /**
   * Send an inline reply to this message.
   * @param {StringResolvable|APIMessage} [content=''] The content for the message
   * @param {MessageOptions|MessageAdditions} [options] The additional options to provide
   * @param {MessageResolvable} [options.replyTo=this] The message to reply to
   * @returns {Promise<Message|Message[]>}
   */
  reply(content, options) {
    return this.channel.send(
      content instanceof APIMessage
        ? content
        : APIMessage.transformOptions(content, options, {
          replyTo: this,
        }),
    );
  }

  /**
   * Fetch this message.
   * @param {boolean} [force=false] Whether to skip the cache check and request the API
   * @returns {Promise<Message>}
   */
  fetch(force = false) {
    return this.channel.messages.fetch(this.id, true, force);
  }

  /**
   * Fetches the webhook used to create this message.
   * @returns {Promise<?Webhook>}
   */
  fetchWebhook() {
    if (!this.webhookID) {
      return Promise.reject(new Error('WEBHOOK_MESSAGE'));
    }
    return this.client.fetchWebhook(this.webhookID);
  }

  /**
   * Suppresses or unsuppresses embeds on a message.
   * @param {boolean} [suppress=true] If the embeds should be suppressed or not
   * @returns {Promise<Message>}
   */
  suppressEmbeds(suppress = true) {
    const flags = new MessageFlags(this.flags.bitfield);

    if (suppress) {
      flags.add(MessageFlags.FLAGS.SUPPRESS_EMBEDS);
    } else {
      flags.remove(MessageFlags.FLAGS.SUPPRESS_EMBEDS);
    }

    return this.edit({ flags });
  }

  /**
   * Used mainly internally. Whether two messages are identical in properties. If you want to compare messages
   * without checking all the properties, use `message.id === message2.id`, which is much more efficient. This
   * method allows you to see if there are differences in content, embeds, attachments, nonce and tts properties.
   * @param {Message} message The message to compare it to
   * @param {Object} rawData Raw data passed through the WebSocket about this message
   * @returns {boolean}
   */
  equals(message, rawData) {
    if (!message) {
      return false;
    }
    const embedUpdate = !message.author && !message.attachments;
    if (embedUpdate) {
      return this.id === message.id && this.embeds.length === message.embeds.length;
    }

    let equal =
      this.id === message.id &&
      this.author.id === message.author.id &&
      this.content === message.content &&
      this.tts === message.tts &&
      this.nonce === message.nonce &&
      this.embeds.length === message.embeds.length &&
      this.attachments.length === message.attachments.length;

    if (equal && rawData) {
      equal =
        this.mentions.everyone === message.mentions.everyone &&
        this.createdTimestamp === new Date(rawData.timestamp).getTime() &&
        this.editedTimestamp === new Date(rawData.edited_timestamp).getTime();
    }

    return equal;
  }

  /**
   * When concatenated with a string, this automatically concatenates the message's content instead of the object.
   * @returns {string}
   * @example
   * // Logs: Message: This is a message!
   * console.log(`Message: ${message}`);
   */
  toString() {
    return this.content;
  }

  toJSON() {
    return super.toJSON({
      channel: 'channelID',
      author: 'authorID',
      application: 'applicationID',
      guild: 'guildID',
      cleanContent: true,
      member: false,
      reactions: false,
    });
  }
}

module.exports = Message;
