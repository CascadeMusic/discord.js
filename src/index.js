"use strict";

const Util = require("./util/Util");

module.exports = {
  // "Root" classes (starting points)
  BaseClient: require("./client/BaseClient"),
  Client: require("./client/Client"),
  WebhookClient: require("./client/WebhookClient"),

  // Actions
  Action: require("./client/actions/Action"),
  ActionsManager: require("./client/actions/ActionsManager"),

  // Rest
  RESTManager: require("./rest/RESTManager"),
  APIRequest: require("./rest/APIRequest"),
  RequestHandler: require("./rest/RequestHandler"),
  DiscordAPIError: require("./rest/DiscordAPIError"),
  HTTPError: require("./rest/HTTPError"),

  // Utilities
  ActivityFlags: require("./util/ActivityFlags"),
  BitField: require("./util/BitField"),
  Collection: require("./util/Collection"),
  Constants: require("./util/Constants"),
  DataResolver: require("./util/DataResolver"),
  BaseManager: require("./managers/BaseManager"),
  MessageFlags: require("./util/MessageFlags"),
  Intents: require("./util/Intents"),
  Permissions: require("./util/Permissions"),
  Speaking: require("./util/Speaking"),
  Snowflake: require("./util/Snowflake"),
  SnowflakeUtil: require("./util/Snowflake"),
  Structures: require("./util/Structures"),
  SystemChannelFlags: require("./util/SystemChannelFlags"),
  UserFlags: require("./util/UserFlags"),
  Util: Util,
  version: require("../package.json").version,

  // Managers
  BaseGuildEmojiManager: require("./managers/BaseGuildEmojiManager"),
  ChannelManager: require("./managers/ChannelManager"),
  GuildChannelManager: require("./managers/GuildChannelManager"),
  GuildEmojiManager: require("./managers/GuildEmojiManager"),
  GuildEmojiRoleManager: require("./managers/GuildEmojiRoleManager"),
  GuildMemberManager: require("./managers/GuildMemberManager"),
  GuildMemberRoleManager: require("./managers/GuildMemberRoleManager"),
  GuildManager: require("./managers/GuildManager"),
  ReactionManager: require("./managers/ReactionManager"),
  ReactionUserManager: require("./managers/ReactionUserManager"),
  MessageManager: require("./managers/MessageManager"),
  PresenceManager: require("./managers/PresenceManager"),
  RoleManager: require("./managers/RoleManager"),
  UserManager: require("./managers/UserManager"),

  // Shortcuts to Util methods
  discordSort: Util.discordSort,
  escapeMarkdown: Util.escapeMarkdown,
  fetchRecommendedShards: Util.fetchRecommendedShards,
  resolveColor: Util.resolveColor,
  resolveString: Util.resolveString,
  splitMessage: Util.splitMessage,

  // Structures
  Application: require("./structures/interfaces/Application"),
  Base: require("./structures/Base"),
  Activity: require("./structures/Presence").Activity,
  APIMessage: require("./structures/APIMessage"),
  BaseGuildEmoji: require("./structures/BaseGuildEmoji"),
  CategoryChannel: require("./structures/CategoryChannel"),
  Channel: require("./structures/Channel"),
  ClientApplication: require("./structures/ClientApplication"),
  get ClientUser() {
    // This is a getter so that it properly extends any custom User class
    return require("./structures/ClientUser");
  },
  Collector: require("./structures/interfaces/Collector"),
  DMChannel: require("./structures/DMChannel"),
  Emoji: require("./structures/Emoji"),
  Guild: require("./structures/Guild"),
  GuildAuditLogs: require("./structures/GuildAuditLogs"),
  GuildChannel: require("./structures/GuildChannel"),
  GuildEmoji: require("./structures/GuildEmoji"),
  GuildMember: require("./structures/GuildMember"),
  GuildPreview: require("./structures/GuildPreview"),
  GuildTemplate: require("./structures/GuildTemplate"),
  Integration: require("./structures/Integration"),
  Invite: require("./structures/Invite"),
  Message: require("./structures/Message"),
  MessageAttachment: require("./structures/MessageAttachment"),
  MessageCollector: require("./structures/MessageCollector"),
  MessageEmbed: require("./structures/MessageEmbed"),
  MessageMentions: require("./structures/MessageMentions"),
  MessageReaction: require("./structures/MessageReaction"),
  NewsChannel: require("./structures/NewsChannel"),
  PermissionOverwrites: require("./structures/PermissionOverwrites"),
  Presence: require("./structures/Presence").Presence,
  ClientPresence: require("./structures/ClientPresence"),
  ReactionCollector: require("./structures/ReactionCollector"),
  ReactionEmoji: require("./structures/ReactionEmoji"),
  RichPresenceAssets: require("./structures/Presence").RichPresenceAssets,
  Role: require("./structures/Role"),
  StoreChannel: require("./structures/StoreChannel"),
  Team: require("./structures/Team"),
  TeamMember: require("./structures/TeamMember"),
  TextChannel: require("./structures/TextChannel"),
  User: require("./structures/User"),
  VoiceChannel: require("./structures/VoiceChannel"),
  VoiceRegion: require("./structures/VoiceRegion"),
  VoiceState: require("./structures/VoiceState"),
  Webhook: require("./structures/Webhook"),

  WebSocket: require("./WebSocket"),
};
