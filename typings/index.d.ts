declare enum ChannelType {
  text = 0,
  dm = 1,
  voice = 2,
  group = 3,
  category = 4,
  news = 5,
  store = 6,
  unknown = 7,
}

declare enum OverwriteTypes {
  role = 0,
  member = 1,
}

declare module "@cascade-music/discord.js" {
  import BaseCollection from "@discordjs/collection";
  import { ChildProcess } from "child_process";
  import { EventEmitter } from "events";
  import { PathLike } from "fs";
  import { Readable, Stream, Writable } from "stream";
  import * as WebSocket from "ws";

  export const version: string;

  //#region Classes

  export class Action<T> {
    constructor(client: Client);

    handle(data: T): any
    getPayload<H>(data: NodeJS.Dict<any>, manager: BaseManager<any, H, any>, id: string, partialType: PartialTypes, cache: boolean): H;
    getChannel<C extends Channel>(data: ({ author: NodeJS.Dict<any> } | { user_id: string }) & ({ channel_id: string } | { id: string })): C;
    getMessage(data: { guild_id: string } & ({ message_id: string } | { id: string }), channel: TextChannel, cache: boolean): Message;
    getReaction(data: { emoji: { id: string; name: string } }, message: Message, user: User): MessageReaction;
    getMember(data: { user: { id: string } }, guild: Guild): GuildMember;
    getUser(data: { user_id: string }): User;
    getUserFromMember(data: { guild_id: string; member: { user: NodeJS.Dict<any> } }): User;
  }

  export type ActionsManager = {
    register(action: Constructable<Action<any>>): void
  } & Record<ActionType, Action<any>>;

  type ActionType =
    | "ChannelCreate" | "ChannelDelete" | "ChannelUpdate"
    | "GuildBanRemove" | "GuildChannelsPositionUpdate"
    | "GuildCreate" | "GuildDelete" | "GuildUpdate"
    | "GuildEmojiCreate" | "GuildEmojiDelete"
    | "GuildIntegrationsUpdate"
    | "GuildMemberRemove" | "GuildMemberUpdate"
    | "GuildRoleCreate" | "GuildRoleDelete" | "GuildRoleUpdate" | "GuildRolesPositionUpdate"
    | "InviteCreate" | "InviteDelete"
    | "MessageCreate" | "MessageDelete" | "MessageDeleteBulk" | "MessageUpdate"
    | "MessageReactionAdd" | "MessageReactionRemove" | "MessageReactionRemoveAll" | "MessageReactionReomoveEmoji"
    | "UserUpdate"
    | "VoiceStateUpdate"
    | "WebhooksUpdate"

  export class RESTManager {
    constructor(client: Client, tokenPrefix?: string);

    client: Client;
    handlers: Collection<string, any>;
    tokenPrefix: string;
    versioned: boolean;
    globalTimeout: Promise<void> | null;

    get api(): API;

    get cdn(): CDN;

    get endpoint(): string;
    set endpoint(endpoint: string)

    getAuth(): string;

    request<T>(method: HttpMethod, url: string, options: RequestOptions): Promise<T | null>
  }

  export class RequestHandler {
    constructor(manager: RESTManager);

    manager: RESTManager;
    queue: AsyncQueue;
    reset: number;
    remaining: number;
    limit: number;
    retryAfter: number;

    get limited(): boolean;

    private get _inactive(): boolean;

    push(request: APIRequest): Promise<any>;
    execute(request: APIRequest): Promise<any>;
  }

  export class APIRequest {
    constructor(rest: RESTManager, method: HttpMethod, path: string, options: RequestOptions & { route: string });

    rest: RESTManager;
    client: Client;
    method: HttpMethod;
    route: string;
    options: RequestOptions;
    retries: number;
    path: string;

    make(): Promise<any>;
  }

  class AsyncQueue {
    promises: Array<{ promise: Promise<void>, resolve: Function }>;

    get remaining(): number;

    wait(): Promise<void>;

    shift(): void;
  }

  export type HttpMethod = "get" | "post" | "put" | "delete";

  export interface RequestOptions {
    query?: NodeJS.Dict<any>;
    versioned?: boolean;
    auth?: boolean;
    reason?: string;
    headers?: NodeJS.Dict<any>;
    files?: Array<{
      file: string;
      name: string;
    }>
    data?: NodeJS.Dict<any>;
  }

  export class Activity {
    constructor(presence: Presence, data?: object);

    applicationID: Snowflake | null;
    assets: RichPresenceAssets | null;
    readonly createdAt: Date;
    createdTimestamp: number;
    details: string | null;
    emoji: Emoji | null;
    flags: Readonly<ActivityFlags>;
    name: string;
    party: {
      id: string | null;
      size: [ number, number ];
    } | null;
    state: string | null;
    timestamps: {
      start: Date | null;
      end: Date | null;
    } | null;
    type: ActivityType;
    url: string | null;

    equals(activity: Activity): boolean;
  }

  export class ActivityFlags extends BitField<ActivityFlagsString> {
    static FLAGS: Record<ActivityFlagsString, number>;

    static resolve(bit?: BitFieldResolvable<ActivityFlagsString, number>): number;
  }

  export class APIMessage {
    constructor(target: MessageTarget, options: MessageOptions | WebhookMessageOptions);

    data: object | null;
    readonly isUser: boolean;
    readonly isWebhook: boolean;
    readonly isMessage: boolean;
    files: object[] | null;
    options: MessageOptions | WebhookMessageOptions;
    target: MessageTarget;

    static create(
      target: MessageTarget,
      content: APIMessageContentResolvable,
      options?: undefined,
      extra?: MessageOptions | WebhookMessageOptions,
    ): APIMessage;
    static create(
      target: MessageTarget,
      content: StringResolvable,
      options: MessageOptions | WebhookMessageOptions | MessageAdditions,
      extra?: MessageOptions | WebhookMessageOptions,
    ): APIMessage;

    static partitionMessageAdditions(
      items: readonly (MessageEmbed | MessageAttachment)[],
    ): [ MessageEmbed[], MessageAttachment[] ];

    static resolveFile(fileLike: BufferResolvable | Stream | FileOptions | MessageAttachment): Promise<object>;

    static transformOptions(
      content: APIMessageContentResolvable,
      options?: undefined,
      extra?: MessageOptions | WebhookMessageOptions,
      isWebhook?: boolean,
    ): MessageOptions | WebhookMessageOptions;
    static transformOptions(
      content: StringResolvable,
      options: MessageOptions | WebhookMessageOptions | MessageAdditions,
      extra?: MessageOptions | WebhookMessageOptions,
      isWebhook?: boolean,
    ): MessageOptions | WebhookMessageOptions;

    makeContent(): string | string[] | undefined;

    resolveData(): this;

    resolveFiles(): Promise<this>;

    split(): APIMessage[];
  }

  export abstract class Application {
    constructor(client: Client, data: object);

    readonly createdAt: Date;
    readonly createdTimestamp: number;
    description: string;
    icon: string;
    id: Snowflake;
    name: string;

    coverImage(options?: ImageURLOptions): string;

    fetchAssets(): Promise<ApplicationAsset[]>;

    iconURL(options?: ImageURLOptions): string;

    toJSON(): object;

    toString(): string;
  }

  export class Base {
    constructor(client: Client);

    readonly client: Client;

    toJSON(...props: { [key: string]: boolean | string }[]): object;

    valueOf(): string;
  }

  export class BaseClient extends EventEmitter {
    constructor(options?: ClientOptions | WebhookClientOptions);

    private _timeouts: Set<NodeJS.Timeout>;
    private _intervals: Set<NodeJS.Timeout>;
    private _immediates: Set<NodeJS.Immediate>;

    readonly rest: RESTManager;
    readonly api: API;

    private decrementMaxListeners(): void;

    private incrementMaxListeners(): void;

    options: ClientOptions | WebhookClientOptions;

    clearInterval(interval: NodeJS.Timeout): void;

    clearTimeout(timeout: NodeJS.Timeout): void;

    clearImmediate(timeout: NodeJS.Immediate): void;

    destroy(): void;

    setInterval(fn: (...args: any[]) => void, delay: number, ...args: any[]): NodeJS.Timeout;

    setTimeout(fn: (...args: any[]) => void, delay: number, ...args: any[]): NodeJS.Timeout;

    setImmediate(fn: (...args: any[]) => void, ...args: any[]): NodeJS.Immediate;

    toJSON(...props: { [key: string]: boolean | string }[]): object;
  }

  export class BaseGuildEmoji extends Emoji {
    constructor(client: Client, data: object, guild: Guild);

    private _roles: string[];

    available: boolean | null;
    readonly createdAt: Date;
    readonly createdTimestamp: number;
    guild: Guild | GuildPreview;
    id: Snowflake;
    managed: boolean | null;
    requiresColons: boolean | null;
  }

  class BroadcastDispatcher extends VolumeMixin(StreamDispatcher) {
    broadcast: VoiceBroadcast;
  }

  export class BitField<S extends string, N extends number | bigint = number> {
    constructor(bits?: BitFieldResolvable<S, N>);

    bitfield: N;

    add(...bits: BitFieldResolvable<S, N>[]): BitField<S, N>;

    any(bit: BitFieldResolvable<S, N>): boolean;

    equals(bit: BitFieldResolvable<S, N>): boolean;

    freeze(): Readonly<BitField<S, N>>;

    has(bit: BitFieldResolvable<S, N>): boolean;

    missing(bits: BitFieldResolvable<S, N>, ...hasParam: readonly unknown[]): S[];

    remove(...bits: BitFieldResolvable<S, N>[]): BitField<S, N>;

    serialize(...hasParam: readonly unknown[]): Record<S, boolean>;

    toArray(...hasParam: readonly unknown[]): S[];

    toJSON(): number;

    valueOf(): number;

    [Symbol.iterator](): IterableIterator<S>;

    static FLAGS: object;

    static resolve(bit?: BitFieldResolvable<any, number | bigint>): number | bigint;
  }

  export class CategoryChannel extends GuildChannel {
    readonly children: Collection<Snowflake, GuildChannel>;
    type: "category";
  }

  export class Channel extends Base {
    constructor(client: Client, data?: object);

    readonly createdAt: Date;
    readonly createdTimestamp: number;
    deleted: boolean;
    id: Snowflake;
    type: keyof typeof ChannelType;

    delete(reason?: string): Promise<Channel>;

    fetch(force?: boolean): Promise<Channel>;

    isText(): this is TextChannel | DMChannel | NewsChannel;

    toString(): string;
  }

  export class Client extends BaseClient {
    constructor(options: ClientOptions);

    private _eval(script: string): any;

    private _validateOptions(options: ClientOptions): void;

    actions: ActionsManager;
    channels: ChannelManager;
    readonly emojis: BaseGuildEmojiManager;
    guilds: GuildManager;
    options: ClientOptions;
    readyAt: Date | null;
    readonly readyTimestamp: number | null;
    shard: ShardClientUtil | null;
    token: string | null;
    readonly uptime: number | null;
    user: ClientUser | null;
    users: UserManager;
    voice: ClientVoiceManager;
    ws: WebSocketManager;

    destroy(): void;

    sweepUsers(lifetime?: number): void;

    sweepMessages(lifetime?: number): number;

    sweepChannels(lifetime?: number): void;

    fetchApplication(): Promise<ClientApplication>;

    fetchGuildPreview(guild: GuildResolvable): Promise<GuildPreview>;

    fetchInvite(invite: InviteResolvable): Promise<Invite>;

    fetchGuildTemplate(template: GuildTemplateResolvable): Promise<GuildTemplate>;

    fetchVoiceRegions(): Promise<Collection<string, VoiceRegion>>;

    fetchWebhook(id: Snowflake, token?: string): Promise<Webhook>;

    generateInvite(options?: InviteGenerationOptions): Promise<string>;

    login(token?: string): Promise<string>;

    toJSON(): object;

    on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    on<S extends string | symbol>(
      event: Exclude<S, keyof ClientEvents>,
      listener: (...args: any[]) => void,
    ): this;

    once<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    once<S extends string | symbol>(
      event: Exclude<S, keyof ClientEvents>,
      listener: (...args: any[]) => void,
    ): this;

    emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;
    emit<S extends string | symbol>(event: Exclude<S, keyof ClientEvents>, ...args: any[]): boolean;

    off<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    off<S extends string | symbol>(
      event: Exclude<S, keyof ClientEvents>,
      listener: (...args: any[]) => void,
    ): this;

    removeAllListeners<K extends keyof ClientEvents>(event?: K): this;
    removeAllListeners<S extends string | symbol>(event?: Exclude<S, keyof ClientEvents>): this;
  }

  export class ClientApplication extends Application {
    botPublic: boolean | null;
    botRequireCodeGrant: boolean | null;
    cover: string | null;
    owner: User | Team | null;
    rpcOrigins: string[];
  }

  export class ClientUser extends User {
    mfaEnabled: boolean;
    verified: boolean;

    edit(data: ClientUserEditData): Promise<this>;

    setActivity(options?: ActivityOptions): Presence;
    setActivity(name: string, options?: ActivityOptions): Presence;

    setAFK(afk: boolean): Promise<Presence>;

    setAvatar(avatar: BufferResolvable | Base64Resolvable): Promise<this>;

    setPresence(data: PresenceData): Presence;

    setStatus(status: PresenceStatusData, shardID?: number | number[]): Presence;

    setUsername(username: string): Promise<this>;
  }

  export class ClientVoiceManager {
    constructor(client: Client);

    readonly client: Client;
    connections: Collection<Snowflake, VoiceConnection>;
    broadcasts: VoiceBroadcast[];

    private joinChannel(channel: VoiceChannel): Promise<VoiceConnection>;

    createBroadcast(): VoiceBroadcast;
  }

  export abstract class Collector<K, V> extends EventEmitter {
    constructor(client: Client, filter: CollectorFilter, options?: CollectorOptions);

    private _timeout: NodeJS.Timeout | null;
    private _idletimeout: NodeJS.Timeout | null;

    readonly client: Client;
    collected: Collection<K, V>;
    ended: boolean;
    filter: CollectorFilter;
    readonly next: Promise<V>;
    options: CollectorOptions;

    checkEnd(): void;

    handleCollect(...args: any[]): void;

    handleDispose(...args: any[]): void;

    stop(reason?: string): void;

    resetTimer(options?: { time?: number; idle?: number }): void;

    [Symbol.asyncIterator](): AsyncIterableIterator<V>;

    toJSON(): object;

    protected listener: (...args: any[]) => void;

    abstract collect(...args: any[]): K;

    abstract dispose(...args: any[]): K;

    abstract endReason(): void;

    on(event: "collect" | "dispose", listener: (...args: any[]) => void): this;
    on(event: "end", listener: (collected: Collection<K, V>, reason: string) => void): this;

    once(event: "collect" | "dispose", listener: (...args: any[]) => void): this;
    once(event: "end", listener: (collected: Collection<K, V>, reason: string) => void): this;
  }

  type AllowedImageFormat = "webp" | "png" | "jpg" | "jpeg" | "gif";

  type CDN = {
    Asset: (name: string) => string;
    DefaultAvatar: (id: string | number) => string;
    Emoji: (emojiID: string, format: "png" | "gif") => string;
    Avatar: (userID: string | number, hash: string, format: "default" | AllowedImageFormat, size: number) => string;
    Banner: (guildID: string | number, hash: string, format: AllowedImageFormat, size: number) => string;
    Icon: (userID: string | number, hash: string, format: "default" | AllowedImageFormat, size: number) => string;
    AppIcon: (userID: string | number, hash: string, format: AllowedImageFormat, size: number) => string;
    AppAsset: (userID: string | number, hash: string, format: AllowedImageFormat, size: number) => string;
    GDMIcon: (userID: string | number, hash: string, format: AllowedImageFormat, size: number) => string;
    Splash: (guildID: string | number, hash: string, format: AllowedImageFormat, size: number) => string;
    DiscoverySplash: (guildID: string | number, hash: string, format: AllowedImageFormat, size: number) => string;
    TeamIcon: (teamID: string | number, hash: string, format: AllowedImageFormat, size: number) => string;
  }

  type constants = {
    Package: {
      name: string;
      version: string;
      description: string;
      author: string;
      license: string;
      main: PathLike;
      types: PathLike;
      homepage: string;
      keywords: string[];
      bugs: { url: string };
      repository: { type: string; url: string };
      scripts: { [key: string]: string };
      engines: { [key: string]: string };
      dependencies: { [key: string]: string };
      peerDependencies: { [key: string]: string };
      devDependencies: { [key: string]: string };
      [key: string]: any;
    };
    DefaultOptions: ClientOptions;
    UserAgent: string | null;
    Endpoints: {
      botGateway: string;
      invite: (root: string, code: string) => string;
      CDN: (
        root: string,
      ) => CDN;
    };
    WSCodes: {
      1000: "WS_CLOSE_REQUESTED";
      4004: "TOKEN_INVALID";
      4010: "SHARDING_INVALID";
      4011: "SHARDING_REQUIRED";
    };
    Events: {
      RATE_LIMIT: "rateLimit";
      CLIENT_READY: "ready";
      RESUMED: "resumed";
      GUILD_CREATE: "guildCreate";
      GUILD_DELETE: "guildDelete";
      GUILD_UPDATE: "guildUpdate";
      INVITE_CREATE: "inviteCreate";
      INVITE_DELETE: "inviteDelete";
      GUILD_UNAVAILABLE: "guildUnavailable";
      GUILD_MEMBER_ADD: "guildMemberAdd";
      GUILD_MEMBER_REMOVE: "guildMemberRemove";
      GUILD_MEMBER_UPDATE: "guildMemberUpdate";
      GUILD_MEMBER_AVAILABLE: "guildMemberAvailable";
      GUILD_MEMBER_SPEAKING: "guildMemberSpeaking";
      GUILD_MEMBERS_CHUNK: "guildMembersChunk";
      GUILD_INTEGRATIONS_UPDATE: "guildIntegrationsUpdate";
      GUILD_ROLE_CREATE: "roleCreate";
      GUILD_ROLE_DELETE: "roleDelete";
      GUILD_ROLE_UPDATE: "roleUpdate";
      GUILD_EMOJI_CREATE: "emojiCreate";
      GUILD_EMOJI_DELETE: "emojiDelete";
      GUILD_EMOJI_UPDATE: "emojiUpdate";
      GUILD_BAN_ADD: "guildBanAdd";
      GUILD_BAN_REMOVE: "guildBanRemove";
      CHANNEL_CREATE: "channelCreate";
      CHANNEL_DELETE: "channelDelete";
      CHANNEL_UPDATE: "channelUpdate";
      CHANNEL_PINS_UPDATE: "channelPinsUpdate";
      MESSAGE_CREATE: "message";
      MESSAGE_DELETE: "messageDelete";
      MESSAGE_UPDATE: "messageUpdate";
      MESSAGE_BULK_DELETE: "messageDeleteBulk";
      MESSAGE_REACTION_ADD: "messageReactionAdd";
      MESSAGE_REACTION_REMOVE: "messageReactionRemove";
      MESSAGE_REACTION_REMOVE_ALL: "messageReactionRemoveAll";
      USER_UPDATE: "userUpdate";
      PRESENCE_UPDATE: "presenceUpdate";
      VOICE_STATE_UPDATE: "voiceStateUpdate";
      VOICE_BROADCAST_SUBSCRIBE: "subscribe";
      VOICE_BROADCAST_UNSUBSCRIBE: "unsubscribe";
      TYPING_START: "typingStart";
      WEBHOOKS_UPDATE: "webhookUpdate";
      DISCONNECT: "disconnect";
      RECONNECTING: "reconnecting";
      ERROR: "error";
      WARN: "warn";
      DEBUG: "debug";
      SHARD_DISCONNECT: "shardDisconnect";
      SHARD_ERROR: "shardError";
      SHARD_RECONNECTING: "shardReconnecting";
      SHARD_READY: "shardReady";
      SHARD_RESUME: "shardResume";
      INVALIDATED: "invalidated";
      RAW: "raw";
    };
    ShardEvents: {
      CLOSE: "close";
      DESTROYED: "destroyed";
      INVALID_SESSION: "invalidSession";
      READY: "ready";
      RESUMED: "resumed";
    };
    PartialTypes: {
      [K in PartialTypes]: K;
    };
    WSEvents: {
      [K in WSEventType]: K;
    };
    Colors: {
      DEFAULT: 0x000000;
      WHITE: 0xffffff;
      AQUA: 0x1abc9c;
      GREEN: 0x2ecc71;
      BLUE: 0x3498db;
      YELLOW: 0xffff00;
      PURPLE: 0x9b59b6;
      LUMINOUS_VIVID_PINK: 0xe91e63;
      GOLD: 0xf1c40f;
      ORANGE: 0xe67e22;
      RED: 0xe74c3c;
      GREY: 0x95a5a6;
      NAVY: 0x34495e;
      DARK_AQUA: 0x11806a;
      DARK_GREEN: 0x1f8b4c;
      DARK_BLUE: 0x206694;
      DARK_PURPLE: 0x71368a;
      DARK_VIVID_PINK: 0xad1457;
      DARK_GOLD: 0xc27c0e;
      DARK_ORANGE: 0xa84300;
      DARK_RED: 0x992d22;
      DARK_GREY: 0x979c9f;
      DARKER_GREY: 0x7f8c8d;
      LIGHT_GREY: 0xbcc0c0;
      DARK_NAVY: 0x2c3e50;
      BLURPLE: 0x7289da;
      GREYPLE: 0x99aab5;
      DARK_BUT_NOT_BLACK: 0x2c2f33;
      NOT_QUITE_BLACK: 0x23272a;
    };
    Status: {
      READY: 0;
      CONNECTING: 1;
      RECONNECTING: 2;
      IDLE: 3;
      NEARLY: 4;
      DISCONNECTED: 5;
    };
    OPCodes: {
      DISPATCH: 0;
      HEARTBEAT: 1;
      IDENTIFY: 2;
      STATUS_UPDATE: 3;
      VOICE_STATE_UPDATE: 4;
      VOICE_GUILD_PING: 5;
      RESUME: 6;
      RECONNECT: 7;
      REQUEST_GUILD_MEMBERS: 8;
      INVALID_SESSION: 9;
      HELLO: 10;
      HEARTBEAT_ACK: 11;
    };
    APIErrors: APIErrors;
    VoiceStatus: {
      CONNECTED: 0;
      CONNECTING: 1;
      AUTHENTICATING: 2;
      RECONNECTING: 3;
      DISCONNECTED: 4;
    };
    VoiceOPCodes: {
      IDENTIFY: 0;
      SELECT_PROTOCOL: 1;
      READY: 2;
      HEARTBEAT: 3;
      SESSION_DESCRIPTION: 4;
      SPEAKING: 5;
      HELLO: 8;
      CLIENT_CONNECT: 12;
      CLIENT_DISCONNECT: 13;
    };
    ChannelTypes: {
      TEXT: 0;
      DM: 1;
      VOICE: 2;
      GROUP: 3;
      CATEGORY: 4;
      NEWS: 5;
      STORE: 6;
    };
    ClientApplicationAssetTypes: {
      SMALL: 1;
      BIG: 2;
    };
    InviteScopes: InviteScope[];
    MessageTypes: MessageType[];
    SystemMessageTypes: SystemMessageType[];
    ActivityTypes: ActivityType[];
    OverwriteTypes: OverwriteTypes;
    ExplicitContentFilterLevels: ExplicitContentFilterLevel[];
    DefaultMessageNotifications: DefaultMessageNotifications[];
    VerificationLevels: VerificationLevel[];
    MembershipStates: "INVITED" | "ACCEPTED";
  };

  export const Constants: constants;

  export class DataResolver {
    static resolveBase64(data: Base64Resolvable): string;

    static resolveCode(data: string, regx: RegExp): string;

    static resolveFile(resource: BufferResolvable | Stream): Promise<Buffer | Stream>;

    static resolveFileAsBuffer(resource: BufferResolvable | Stream): Promise<Buffer>;

    static resolveImage(resource: BufferResolvable | Base64Resolvable): Promise<string>;

    static resolveInviteCode(data: InviteResolvable): string;

    static resolveGuildTemplateCode(data: GuildTemplateResolvable): string;
  }

  export class DiscordAPIError extends Error {
    constructor(path: string, error: object, method: string, httpStatus: number);

    private static flattenErrors(obj: object, key: string): string[];

    code: number;
    method: string;
    path: string;
    httpStatus: number;
  }

  export class DMChannel extends TextBasedChannel(Channel, [ "bulkDelete" ]) {
    constructor(client: Client, data?: object);

    messages: MessageManager;
    recipient: User;
    readonly partial: false;
    type: "dm";

    fetch(force?: boolean): Promise<this>;
  }

  export class Emoji extends Base {
    constructor(client: Client, emoji: object);

    animated: boolean;
    readonly createdAt: Date | null;
    readonly createdTimestamp: number | null;
    deleted: boolean;
    id: Snowflake | null;
    name: string;
    readonly identifier: string;
    readonly url: string | null;

    toJSON(): object;

    toString(): string;
  }

  export class Guild extends Base {
    constructor(client: Client, data: object);

    private _sortedRoles(): Collection<Snowflake, Role>;

    private _sortedChannels(channel: Channel): Collection<Snowflake, GuildChannel>;

    private _memberSpeakUpdate(user: Snowflake, speaking: boolean): void;

    readonly afkChannel: VoiceChannel | null;
    afkChannelID: Snowflake | null;
    afkTimeout: number;
    applicationID: Snowflake | null;
    approximateMemberCount: number | null;
    approximatePresenceCount: number | null;
    available: boolean;
    banner: string | null;
    channels: GuildChannelManager;
    readonly createdAt: Date;
    readonly createdTimestamp: number;
    defaultMessageNotifications: DefaultMessageNotifications | number;
    deleted: boolean;
    description: string | null;
    discoverySplash: string | null;
    emojis: GuildEmojiManager;
    explicitContentFilter: ExplicitContentFilterLevel;
    features: GuildFeatures[];
    icon: string | null;
    id: Snowflake;
    readonly joinedAt: Date;
    joinedTimestamp: number;
    large: boolean;
    maximumMembers: number | null;
    maximumPresences: number | null;
    readonly me: GuildMember | null;
    memberCount: number;
    members: GuildMemberManager;
    mfaLevel: number;
    name: string;
    readonly nameAcronym: string;
    readonly owner: GuildMember | null;
    ownerID: Snowflake;
    readonly partnered: boolean;
    preferredLocale: string;
    premiumSubscriptionCount: number | null;
    premiumTier: PremiumTier;
    presences: PresenceManager;
    readonly publicUpdatesChannel: TextChannel | null;
    publicUpdatesChannelID: Snowflake | null;
    region: string;
    roles: RoleManager;
    readonly rulesChannel: TextChannel | null;
    rulesChannelID: Snowflake | null;
    readonly shard: WebSocketShard;
    shardID: number;
    splash: string | null;
    readonly systemChannel: TextChannel | null;
    systemChannelFlags: Readonly<SystemChannelFlags>;
    systemChannelID: Snowflake | null;
    vanityURLCode: string | null;
    vanityURLUses: number | null;
    verificationLevel: VerificationLevel;
    readonly verified: boolean;
    readonly voiceStates: VoiceStateManager;
    readonly widgetChannel: TextChannel | null;
    widgetChannelID: Snowflake | null;
    widgetEnabled: boolean | null;

    addMember(user: UserResolvable, options: AddGuildMemberOptions): Promise<GuildMember>;

    bannerURL(options?: ImageURLOptions): string | null;

    createIntegration(data: IntegrationData, reason?: string): Promise<Guild>;

    createTemplate(name: string, description?: string): Promise<GuildTemplate>;

    delete(): Promise<Guild>;

    discoverySplashURL(options?: ImageURLOptions): string | null;

    edit(data: GuildEditData, reason?: string): Promise<Guild>;

    equals(guild: Guild): boolean;

    fetch(): Promise<Guild>;

    fetchAuditLogs(options?: GuildAuditLogsFetchOptions): Promise<GuildAuditLogs>;

    fetchBan(user: UserResolvable): Promise<{ user: User; reason: string }>;

    fetchBans(): Promise<Collection<Snowflake, { user: User; reason: string }>>;

    fetchIntegrations(): Promise<Collection<string, Integration>>;

    fetchInvites(): Promise<Collection<string, Invite>>;

    fetchPreview(): Promise<GuildPreview>;

    fetchTemplates(): Promise<Collection<GuildTemplate["code"], GuildTemplate>>;

    fetchVanityCode(): Promise<string>;

    fetchVanityData(): Promise<{ code: string; uses: number }>;

    fetchVoiceRegions(): Promise<Collection<string, VoiceRegion>>;

    fetchWebhooks(): Promise<Collection<Snowflake, Webhook>>;

    fetchWidget(): Promise<GuildWidget>;

    iconURL(options?: ImageURLOptions & { dynamic?: boolean }): string | null;

    leave(): Promise<Guild>;

    setAFKChannel(afkChannel: ChannelResolvable | null, reason?: string): Promise<Guild>;

    setAFKTimeout(afkTimeout: number, reason?: string): Promise<Guild>;

    setBanner(banner: Base64Resolvable | null, reason?: string): Promise<Guild>;

    setChannelPositions(channelPositions: readonly ChannelPosition[]): Promise<Guild>;

    setDefaultMessageNotifications(
      defaultMessageNotifications: DefaultMessageNotifications | number,
      reason?: string,
    ): Promise<Guild>;

    setDiscoverySplash(discoverySplash: Base64Resolvable | null, reason?: string): Promise<Guild>;

    setExplicitContentFilter(
      explicitContentFilter: ExplicitContentFilterLevel | number,
      reason?: string,
    ): Promise<Guild>;

    setIcon(icon: Base64Resolvable | null, reason?: string): Promise<Guild>;

    setName(name: string, reason?: string): Promise<Guild>;

    setOwner(owner: GuildMemberResolvable, reason?: string): Promise<Guild>;

    setPreferredLocale(preferredLocale: string, reason?: string): Promise<Guild>;

    setPublicUpdatesChannel(publicUpdatesChannel: ChannelResolvable | null, reason?: string): Promise<Guild>;

    setRegion(region: string, reason?: string): Promise<Guild>;

    setRolePositions(rolePositions: readonly RolePosition[]): Promise<Guild>;

    setRulesChannel(rulesChannel: ChannelResolvable | null, reason?: string): Promise<Guild>;

    setSplash(splash: Base64Resolvable | null, reason?: string): Promise<Guild>;

    setSystemChannel(systemChannel: ChannelResolvable | null, reason?: string): Promise<Guild>;

    setSystemChannelFlags(systemChannelFlags: SystemChannelFlagsResolvable, reason?: string): Promise<Guild>;

    setVerificationLevel(verificationLevel: VerificationLevel | number, reason?: string): Promise<Guild>;

    setWidget(widget: GuildWidgetData, reason?: string): Promise<Guild>;

    splashURL(options?: ImageURLOptions): string | null;

    toJSON(): object;

    toString(): string;
  }

  export class GuildAuditLogs {
    constructor(guild: Guild, data: object);

    private webhooks: Collection<Snowflake, Webhook>;
    private integrations: Collection<Snowflake, Integration>;

    entries: Collection<Snowflake, GuildAuditLogsEntry>;

    static Actions: GuildAuditLogsActions;
    static Targets: GuildAuditLogsTargets;
    static Entry: typeof GuildAuditLogsEntry;

    static actionType(action: number): GuildAuditLogsActionType;

    static build(...args: any[]): Promise<GuildAuditLogs>;

    static targetType(target: number): GuildAuditLogsTarget;

    toJSON(): object;
  }

  class GuildAuditLogsEntry {
    constructor(logs: GuildAuditLogs, guild: Guild, data: object);

    action: GuildAuditLogsAction;
    actionType: GuildAuditLogsActionType;
    changes: AuditLogChange[] | null;
    readonly createdAt: Date;
    readonly createdTimestamp: number;
    executor: User;
    extra: object | Role | GuildMember | null;
    id: Snowflake;
    reason: string | null;
    target:
      | Guild
      | GuildChannel
      | User
      | Role
      | GuildEmoji
      | Invite
      | Webhook
      | Message
      | Integration
      | { id: Snowflake }
      | null;
    targetType: GuildAuditLogsTarget;

    toJSON(): object;
  }

  export class GuildChannel extends Channel {
    constructor(guild: Guild, data?: object);

    private memberPermissions(member: GuildMember): Readonly<Permissions>;

    private rolePermissions(role: Role): Readonly<Permissions>;

    readonly calculatedPosition: number;
    readonly deletable: boolean;
    guild: Guild;
    readonly manageable: boolean;
    readonly members: Collection<Snowflake, GuildMember>;
    name: string;
    readonly parent: CategoryChannel | null;
    parentID: Snowflake | null;
    permissionOverwrites: Collection<Snowflake, PermissionOverwrites>;
    readonly permissionsLocked: boolean | null;
    readonly position: number;
    rawPosition: number;
    type: Exclude<keyof typeof ChannelType, "dm" | "group" | "unknown">;
    readonly viewable: boolean;

    clone(options?: GuildChannelCloneOptions): Promise<this>;

    createInvite(options?: InviteOptions): Promise<Invite>;

    createOverwrite(
      userOrRole: RoleResolvable | UserResolvable,
      options: PermissionOverwriteOption,
      reason?: string,
    ): Promise<this>;

    edit(data: ChannelData, reason?: string): Promise<this>;

    equals(channel: GuildChannel): boolean;

    fetchInvites(): Promise<Collection<string, Invite>>;

    lockPermissions(): Promise<this>;

    overwritePermissions(
      overwrites: readonly OverwriteResolvable[] | Collection<Snowflake, OverwriteResolvable>,
      reason?: string,
    ): Promise<this>;

    permissionsFor(memberOrRole: GuildMember | Role): Readonly<Permissions>;
    permissionsFor(memberOrRole: GuildMemberResolvable | RoleResolvable): Readonly<Permissions> | null;

    setName(name: string, reason?: string): Promise<this>;

    setParent(
      channel: CategoryChannel | Snowflake | null,
      options?: { lockPermissions?: boolean; reason?: string },
    ): Promise<this>;

    setPosition(position: number, options?: { relative?: boolean; reason?: string }): Promise<this>;

    setTopic(topic: string | null, reason?: string): Promise<this>;

    updateOverwrite(
      userOrRole: RoleResolvable | UserResolvable,
      options: PermissionOverwriteOption,
      reason?: string,
    ): Promise<this>;

    isText(): this is TextChannel | NewsChannel;
  }

  export class GuildEmoji extends BaseGuildEmoji {
    readonly deletable: boolean;
    guild: Guild;
    author: User | null;
    readonly roles: GuildEmojiRoleManager;
    readonly url: string;

    delete(reason?: string): Promise<GuildEmoji>;

    edit(data: GuildEmojiEditData, reason?: string): Promise<GuildEmoji>;

    equals(other: GuildEmoji | object): boolean;

    fetchAuthor(): Promise<User>;

    setName(name: string, reason?: string): Promise<GuildEmoji>;
  }

  export class GuildMember extends PartialTextBasedChannel(Base) {
    constructor(client: Client, data: object, guild: Guild);

    readonly bannable: boolean;
    deleted: boolean;
    readonly displayColor: number;
    readonly displayHexColor: string;
    readonly displayName: string;
    guild: Guild;
    readonly id: Snowflake;
    pending: boolean;
    readonly joinedAt: Date | null;
    joinedTimestamp: number | null;
    readonly kickable: boolean;
    lastMessageChannelID: Snowflake | null;
    readonly manageable: boolean;
    nickname: string | null;
    readonly partial: false;
    readonly permissions: Readonly<Permissions>;
    readonly premiumSince: Date | null;
    premiumSinceTimestamp: number | null;
    readonly presence: Presence;
    readonly roles: GuildMemberRoleManager;
    user: User;
    readonly voice: VoiceState;

    ban(options?: BanOptions): Promise<GuildMember>;

    fetch(force?: boolean): Promise<GuildMember>;

    createDM(force?: boolean): Promise<DMChannel>;

    deleteDM(): Promise<DMChannel>;

    edit(data: GuildMemberEditData, reason?: string): Promise<GuildMember>;

    kick(reason?: string): Promise<GuildMember>;

    permissionsIn(channel: ChannelResolvable): Readonly<Permissions>;

    setNickname(nickname: string | null, reason?: string): Promise<GuildMember>;

    toJSON(): object;

    toString(): string;

    valueOf(): string;
  }

  export class GuildPreview extends Base {
    constructor(client: Client, data: object);

    approximateMemberCount: number;
    approximatePresenceCount: number;
    description: string | null;
    discoverySplash: string | null;
    emojis: Collection<Snowflake, GuildPreviewEmoji>;
    features: GuildFeatures[];
    icon: string | null;
    id: string;
    name: string;
    splash: string | null;

    discoverySplashURL(options?: ImageURLOptions): string | null;

    iconURL(options?: ImageURLOptions & { dynamic?: boolean }): string | null;

    splashURL(options?: ImageURLOptions): string | null;

    fetch(): Promise<GuildPreview>;

    toJSON(): object;

    toString(): string;
  }

  export class GuildTemplate extends Base {
    constructor(client: Client, data: object);

    readonly createdTimestamp: number;
    readonly updatedTimestamp: number;
    readonly url: string;
    code: string;
    name: string;
    description: string | null;
    usageCount: number;
    creator: User;
    creatorID: Snowflake;
    createdAt: Date;
    updatedAt: Date;
    guild: Guild | null;
    guildID: Snowflake;
    serializedGuild: object;
    unSynced: boolean | null;

    createGuild(name: string, icon?: BufferResolvable | Base64Resolvable): Promise<Guild>;

    delete(): Promise<GuildTemplate>;

    edit(options?: { name?: string; description?: string }): Promise<GuildTemplate>;

    sync(): Promise<GuildTemplate>;
  }

  export class GuildPreviewEmoji extends BaseGuildEmoji {
    constructor(client: Client, data: object, guild: GuildPreview);

    guild: GuildPreview;
    readonly roles: Set<Snowflake>;
  }

  export class HTTPError extends Error {
    constructor(message: string, name: string, code: number, method: string, path: string);

    code: number;
    method: string;
    name: string;
    path: string;
  }

  export class Integration extends Base {
    constructor(client: Client, data: object, guild: Guild);

    account: IntegrationAccount;
    application: IntegrationApplication | null;
    enabled: boolean;
    expireBehavior: number;
    expireGracePeriod: number;
    guild: Guild;
    id: Snowflake;
    name: string;
    role: Role;
    readonly roles: Collection<Snowflake, Role>;
    syncedAt: number;
    syncing: boolean;
    type: string;
    user: User | null;

    delete(reason?: string): Promise<Integration>;

    edit(data: IntegrationEditData, reason?: string): Promise<Integration>;

    sync(): Promise<Integration>;
  }

  export class IntegrationApplication extends Application {
    bot: User | null;
  }

  export class Intents extends BitField<IntentsString> {
    static FLAGS: Record<IntentsString, number>;
    static PRIVILEGED: number;
    static ALL: number;
    static NON_PRIVILEGED: number;

    static resolve(bit?: BitFieldResolvable<IntentsString, number>): number;
  }

  export class Invite extends Base {
    constructor(client: Client, data: object);

    channel: GuildChannel | PartialGroupDMChannel;
    code: string;
    readonly deletable: boolean;
    readonly createdAt: Date | null;
    createdTimestamp: number | null;
    readonly expiresAt: Date | null;
    readonly expiresTimestamp: number | null;
    guild: Guild | null;
    inviter: User | null;
    maxAge: number | null;
    maxUses: number | null;
    memberCount: number;
    presenceCount: number;
    targetUser: User | null;
    targetUserType: TargetUser | null;
    temporary: boolean | null;
    readonly url: string;
    uses: number | null;

    delete(reason?: string): Promise<Invite>;

    toJSON(): object;

    toString(): string;
  }

  type TextableChannel = TextChannel | DMChannel | NewsChannel
  export class Message<C extends TextableChannel = TextableChannel> extends Base {
    constructor(client: Client, data: object, channel: TextableChannel);

    private patch(data: object): Message;

    readonly cleanContent: string;
    readonly createdAt: Date;
    readonly deletable: boolean;
    readonly editable: boolean;
    readonly guild: Guild | null;
    readonly editedAt: Date | null;
    readonly member: GuildMember | null;
    readonly partial: false;
    readonly pinnable: boolean;
    readonly referencedMessage: Message | null;
    readonly url: string;

    activity: MessageActivity | null;
    application: ClientApplication | null;
    attachments: Collection<Snowflake, MessageAttachment>;
    author: User;
    channel: TextableChannel;
    content: string;
    createdTimestamp: number;
    deleted: boolean;
    editedTimestamp: number | null;
    embeds: MessageEmbed[];
    id: Snowflake;
    mentions: MessageMentions;
    nonce: string | number | null;
    pinned: boolean;
    reactions: ReactionManager;
    system: boolean;
    tts: boolean;
    type: MessageType;
    webhookID: Snowflake | null;
    flags: Readonly<MessageFlags>;
    reference: MessageReference | null;

    awaitReactions(filter: CollectorFilter, options?: AwaitReactionsOptions): Promise<Collection<Snowflake, MessageReaction>>;
    createReactionCollector(filter: CollectorFilter, options?: ReactionCollectorOptions): ReactionCollector;
    delete(): Promise<Message>;
    edit(content: APIMessageContentResolvable | MessageEditOptions | MessageEmbed | APIMessage,): Promise<Message>;
    edit(content: StringResolvable, options: MessageEditOptions | MessageEmbed): Promise<Message>;
    equals(message: Message, rawData: object): boolean;
    fetchWebhook(): Promise<Webhook>;
    crosspost(): Promise<Message>;
    fetch(force?: boolean): Promise<Message>;
    pin(options?: { reason?: string }): Promise<Message>;
    react(emoji: EmojiIdentifierResolvable): Promise<MessageReaction>;
    reply(content: APIMessageContentResolvable | (MessageOptions & { split?: false }) | MessageAdditions): Promise<Message>;
    reply(options: MessageOptions & { split: true | SplitOptions }): Promise<Message[]>;
    reply(options: MessageOptions | APIMessage): Promise<Message | Message[]>;
    reply(content: StringResolvable, options: (MessageOptions & { split?: false }) | MessageAdditions): Promise<Message>;
    reply(content: StringResolvable, options: MessageOptions & { split: true | SplitOptions }): Promise<Message[]>;
    reply(content: StringResolvable, options: MessageOptions): Promise<Message | Message[]>;
    suppressEmbeds(suppress?: boolean): Promise<Message>;
    toJSON(): object;
    toString(): string;
    unpin(options?: { reason?: string }): Promise<Message>;
  }

  export class MessageAttachment {
    constructor(attachment: BufferResolvable | Stream, name?: string, data?: object);

    attachment: BufferResolvable | Stream;
    height: number | null;
    id: Snowflake;
    name: string | null;
    proxyURL: string;
    size: number;
    readonly spoiler: boolean;
    url: string;
    width: number | null;

    setFile(attachment: BufferResolvable | Stream, name?: string): this;
    setName(name: string): this;
    toJSON(): object;
  }

  export class MessageCollector extends Collector<Snowflake, Message> {
    constructor(channel: TextChannel | DMChannel, filter: CollectorFilter, options?: MessageCollectorOptions);

    private _handleChannelDeletion(channel: GuildChannel): void;
    private _handleGuildDeletion(guild: Guild): void;

    channel: Channel;
    options: MessageCollectorOptions;
    received: number;

    collect(message: Message): Snowflake;
    dispose(message: Message): Snowflake;
    endReason(): string;
  }

  export class MessageEmbed {
    constructor(data?: MessageEmbed | MessageEmbedOptions);

    readonly hexColor: string | null;
    readonly length: number;
    readonly video: MessageEmbedVideo | null;
    readonly createdAt: Date | null;

    author: MessageEmbedAuthor | null;
    color: number | null;
    description: string | null;
    fields: EmbedField[];
    files: (MessageAttachment | string | FileOptions)[];
    footer: MessageEmbedFooter | null;
    image: MessageEmbedImage | null;
    provider: MessageEmbedProvider | null;
    thumbnail: MessageEmbedThumbnail | null;
    timestamp: number | null;
    title: string | null;
    type: string;
    url: string | null;

    addField(name: StringResolvable, value: StringResolvable, inline?: boolean): this;
    addFields(...fields: EmbedFieldData[] | EmbedFieldData[][]): this;
    attachFiles(file: (MessageAttachment | FileOptions | string)[]): this;
    setAuthor(name: StringResolvable, iconURL?: string, url?: string): this;
    setColor(color: ColorResolvable): this;
    setDescription(description: StringResolvable): this;
    setFooter(text: StringResolvable, iconURL?: string): this;
    setImage(url: string): this;
    setThumbnail(url: string): this;
    setTimestamp(timestamp?: Date | number): this;
    setTitle(title: StringResolvable): this;
    setURL(url: string): this;
    spliceFields(index: number, deleteCount: number, ...fields: EmbedFieldData[] | EmbedFieldData[][]): this;
    toJSON(): object;

    static normalizeField(name: StringResolvable, value: StringResolvable, inline?: boolean): Required<EmbedFieldData>;
    static normalizeFields(...fields: EmbedFieldData[] | EmbedFieldData[][]): Required<EmbedFieldData>[];
  }

  export class MessageFlags extends BitField<MessageFlagsString> {
    static FLAGS: Record<MessageFlagsString, number>;

    static resolve(bit?: BitFieldResolvable<MessageFlagsString, number>): number;
  }

  export class MessageMentions {
    constructor(
      message: Message,
      users: object[] | Collection<Snowflake, User>,
      roles: Snowflake[] | Collection<Snowflake, Role>,
      everyone: boolean,
    );

    private _channels: Collection<Snowflake, GuildChannel> | null;
    private readonly _content: string;
    private _members: Collection<Snowflake, GuildMember> | null;

    readonly channels: Collection<Snowflake, TextChannel>;
    readonly client: Client;
    everyone: boolean;
    readonly guild: Guild;

    has(
      data: UserResolvable | RoleResolvable | GuildChannelResolvable,
      options?: {
        ignoreDirect?: boolean;
        ignoreRoles?: boolean;
        ignoreEveryone?: boolean;
      },
    ): boolean;

    readonly members: Collection<Snowflake, GuildMember> | null;
    roles: Collection<Snowflake, Role>;
    users: Collection<Snowflake, User>;
    crosspostedChannels: Collection<Snowflake, CrosspostedChannel>;

    toJSON(): object;

    static CHANNELS_PATTERN: RegExp;
    static EVERYONE_PATTERN: RegExp;
    static ROLES_PATTERN: RegExp;
    static USERS_PATTERN: RegExp;
  }

  export class MessageReaction {
    constructor(client: Client, data: object, message: Message);

    private _emoji: GuildEmoji | ReactionEmoji;

    readonly client: Client;
    count: number | null;
    readonly emoji: GuildEmoji | ReactionEmoji;
    me: boolean;
    message: Message;
    readonly partial: boolean;
    users: ReactionUserManager;

    remove(): Promise<MessageReaction>;

    fetch(): Promise<MessageReaction>;

    toJSON(): object;
  }

  export class NewsChannel extends TextBasedChannel(GuildChannel) {
    constructor(guild: Guild, data?: object);

    messages: MessageManager;
    nsfw: boolean;
    topic: string | null;
    type: "news";

    createWebhook(
      name: string,
      options?: { avatar?: BufferResolvable | Base64Resolvable; reason?: string },
    ): Promise<Webhook>;

    setNSFW(nsfw: boolean, reason?: string): Promise<NewsChannel>;

    setType(type: Pick<typeof ChannelType, "text" | "news">, reason?: string): Promise<GuildChannel>;

    fetchWebhooks(): Promise<Collection<Snowflake, Webhook>>;

    addFollower(channel: GuildChannelResolvable, reason?: string): Promise<NewsChannel>;
  }

  export class PartialGroupDMChannel extends Channel {
    constructor(client: Client, data: object);

    name: string;
    icon: string | null;

    iconURL(options?: ImageURLOptions): string | null;
  }

  export class PermissionOverwrites {
    constructor(guildChannel: GuildChannel, data?: object);

    allow: Readonly<Permissions>;
    readonly channel: GuildChannel;
    deny: Readonly<Permissions>;
    id: Snowflake;
    type: OverwriteType;

    update(options: PermissionOverwriteOption, reason?: string): Promise<PermissionOverwrites>;

    delete(reason?: string): Promise<PermissionOverwrites>;

    toJSON(): object;

    static resolveOverwriteOptions(
      options: ResolvedOverwriteOptions,
      initialPermissions: { allow?: PermissionResolvable; deny?: PermissionResolvable },
    ): ResolvedOverwriteOptions;

    static resolve(overwrite: OverwriteResolvable, guild: Guild): RawOverwriteData;
  }

  export class Permissions extends BitField<PermissionString, bigint> {
    any(permission: PermissionResolvable, checkAdmin?: boolean): boolean;

    has(permission: PermissionResolvable, checkAdmin?: boolean): boolean;

    missing(bits: BitFieldResolvable<PermissionString, bigint>, checkAdmin?: boolean): PermissionString[];

    serialize(checkAdmin?: boolean): Record<PermissionString, boolean>;

    toArray(checkAdmin?: boolean): PermissionString[];

    static ALL: bigint;
    static DEFAULT: bigint;
    static FLAGS: PermissionFlags;

    static resolve(permission?: PermissionResolvable): bigint;
  }

  export class Presence {
    constructor(client: Client, data?: object);

    activities: Activity[];
    clientStatus: ClientPresenceStatusData | null;
    guild: Guild | null;
    readonly member: GuildMember | null;
    status: PresenceStatus;
    readonly user: User | null;
    userID: Snowflake;

    equals(presence: Presence): boolean;
  }

  export class ReactionCollector extends Collector<Snowflake, MessageReaction> {
    constructor(message: Message, filter: CollectorFilter, options?: ReactionCollectorOptions);

    private _handleChannelDeletion(channel: GuildChannel): void;

    private _handleGuildDeletion(guild: Guild): void;

    private _handleMessageDeletion(message: Message): void;

    message: Message;
    options: ReactionCollectorOptions;
    total: number;
    users: Collection<Snowflake, User>;

    static key(reaction: MessageReaction): Snowflake | string;

    collect(reaction: MessageReaction): Snowflake | string;

    dispose(reaction: MessageReaction, user: User): Snowflake | string;

    empty(): void;

    endReason(): string | null;

    on(event: "collect" | "dispose" | "remove", listener: (reaction: MessageReaction, user: User) => void): this;
    on(
      event: "end",
      listener: (collected: Collection<Snowflake, MessageReaction>, reason: string) => void,
    ): this;
    on(event: string, listener: (...args: any[]) => void): this;

    once(
      event: "collect" | "dispose" | "remove",
      listener: (reaction: MessageReaction, user: User) => void,
    ): this;
    once(
      event: "end",
      listener: (collected: Collection<Snowflake, MessageReaction>, reason: string) => void,
    ): this;
    once(event: string, listener: (...args: any[]) => void): this;
  }

  export class ReactionEmoji extends Emoji {
    constructor(reaction: MessageReaction, emoji: object);

    reaction: MessageReaction;

    toJSON(): object;
  }

  export class RichPresenceAssets {
    constructor(activity: Activity, assets: object);

    largeImage: Snowflake | null;
    largeText: string | null;
    smallImage: Snowflake | null;
    smallText: string | null;

    largeImageURL(options?: ImageURLOptions): string | null;

    smallImageURL(options?: ImageURLOptions): string | null;
  }

  export class Role extends Base {
    constructor(client: Client, data: object, guild: Guild);

    color: number;
    readonly createdAt: Date;
    readonly createdTimestamp: number;
    deleted: boolean;
    readonly editable: boolean;
    guild: Guild;
    readonly hexColor: string;
    hoist: boolean;
    id: Snowflake;
    managed: boolean;
    readonly members: Collection<Snowflake, GuildMember>;
    mentionable: boolean;
    name: string;
    permissions: Readonly<Permissions>;
    readonly position: number;
    rawPosition: number;
    tags: RoleTagData | null;

    comparePositionTo(role: Role): number;

    delete(reason?: string): Promise<Role>;

    edit(data: RoleData, reason?: string): Promise<Role>;

    equals(role: Role): boolean;

    permissionsIn(channel: ChannelResolvable): Readonly<Permissions>;

    setColor(color: ColorResolvable, reason?: string): Promise<Role>;

    setHoist(hoist: boolean, reason?: string): Promise<Role>;

    setMentionable(mentionable: boolean, reason?: string): Promise<Role>;

    setName(name: string, reason?: string): Promise<Role>;

    setPermissions(permissions: PermissionResolvable, reason?: string): Promise<Role>;

    setPosition(position: number, options?: { relative?: boolean; reason?: string }): Promise<Role>;

    toJSON(): object;

    toString(): string;

    static comparePositions(role1: Role, role2: Role): number;
  }

  export class Shard extends EventEmitter {
    constructor(manager: ShardingManager, id: number);

    private _evals: Map<string, Promise<any>>;
    private _exitListener: (...args: any[]) => void;
    private _fetches: Map<string, Promise<any>>;

    private _handleExit(respawn?: boolean): void;

    private _handleMessage(message: any): void;

    args: string[];
    execArgv: string[];
    env: object;
    id: number;
    manager: ShardingManager;
    process: ChildProcess | null;
    ready: boolean;
    worker: any | null;

    eval(script: string): Promise<any>;
    eval<T>(fn: (client: Client) => T): Promise<T[]>;

    fetchClientValue(prop: string): Promise<any>;

    kill(): void;

    respawn(delay?: number, spawnTimeout?: number): Promise<ChildProcess>;

    send(message: any): Promise<Shard>;

    spawn(spawnTimeout?: number): Promise<ChildProcess>;

    on(event: "spawn" | "death", listener: (child: ChildProcess) => void): this;
    on(event: "disconnect" | "ready" | "reconnecting", listener: () => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    on(event: "message", listener: (message: any) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    once(event: "spawn" | "death", listener: (child: ChildProcess) => void): this;
    once(event: "disconnect" | "ready" | "reconnecting", listener: () => void): this;
    once(event: "error", listener: (error: Error) => void): this;
    once(event: "message", listener: (message: any) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
  }

  export class ShardClientUtil {
    constructor(client: Client, mode: ShardingManagerMode);

    private _handleMessage(message: any): void;

    private _respond(type: string, message: any): void;

    client: Client;
    readonly count: number;
    readonly ids: number[];
    mode: ShardingManagerMode;
    parentPort: any | null;

    broadcastEval(script: string): Promise<any[]>;
    broadcastEval(script: string, shard: number): Promise<any>;
    broadcastEval<T>(fn: (client: Client) => T): Promise<T[]>;
    broadcastEval<T>(fn: (client: Client) => T, shard: number): Promise<T>;

    fetchClientValues(prop: string): Promise<any[]>;
    fetchClientValues(prop: string, shard: number): Promise<any>;

    respawnAll(shardDelay?: number, respawnDelay?: number, spawnTimeout?: number): Promise<void>;

    send(message: any): Promise<void>;

    static singleton(client: Client, mode: ShardingManagerMode): ShardClientUtil;

    static shardIDForGuildID(guildID: Snowflake, shardCount: number): number;
  }

  export class ShardingManager extends EventEmitter {
    constructor(
      file: string,
      options?: {
        totalShards?: number | "auto";
        shardList?: number[] | "auto";
        mode?: ShardingManagerMode;
        respawn?: boolean;
        shardArgs?: string[];
        token?: string;
        execArgv?: string[];
      },
    );

    private _performOnShards(method: string, args: any[]): Promise<any[]>;
    private _performOnShards(method: string, args: any[], shard: number): Promise<any>;

    file: string;
    respawn: boolean;
    shardArgs: string[];
    shards: Collection<number, Shard>;
    token: string | null;
    totalShards: number | "auto";

    broadcast(message: any): Promise<Shard[]>;

    broadcastEval(script: string): Promise<any[]>;
    broadcastEval(script: string, shard: number): Promise<any>;

    createShard(id: number): Shard;

    fetchClientValues(prop: string): Promise<any[]>;
    fetchClientValues(prop: string, shard: number): Promise<any>;

    respawnAll(
      shardDelay?: number,
      respawnDelay?: number,
      spawnTimeout?: number,
    ): Promise<Collection<number, Shard>>;

    spawn(amount?: number | "auto", delay?: number, spawnTimeout?: number): Promise<Collection<number, Shard>>;

    on(event: "shardCreate", listener: (shard: Shard) => void): this;

    once(event: "shardCreate", listener: (shard: Shard) => void): this;
  }

  export class SnowflakeUtil {
    static deconstruct(snowflake: Snowflake): DeconstructedSnowflake;

    static generate(timestamp?: number | Date): Snowflake;

    static readonly EPOCH: number;
  }

  export class Speaking extends BitField<SpeakingString> {
    static FLAGS: Record<SpeakingString, number>;

    static resolve(bit?: BitFieldResolvable<SpeakingString, number>): number;
  }

  export class StoreChannel extends GuildChannel {
    constructor(guild: Guild, data?: object);

    nsfw: boolean;
    type: "store";
  }

  class StreamDispatcher extends VolumeMixin(Writable) {
    constructor(player: object, options?: StreamOptions, streams?: object);

    readonly bitrateEditable: boolean;
    broadcast: VoiceBroadcast | null;
    readonly paused: boolean;
    pausedSince: number | null;
    readonly pausedTime: number;
    player: object;
    readonly streamTime: number;
    readonly totalStreamTime: number;

    pause(silence?: boolean): void;

    resume(): void;

    setBitrate(value: number | "auto"): boolean;

    setFEC(enabled: boolean): boolean;

    setPLP(value: number): boolean;

    on(event: "close" | "drain" | "finish" | "start", listener: () => void): this;
    on(event: "debug", listener: (info: string) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "pipe" | "unpipe", listener: (src: Readable) => void): this;
    on(event: "speaking", listener: (speaking: boolean) => void): this;
    on(event: "volumeChange", listener: (oldVolume: number, newVolume: number) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    once(event: "close" | "drain" | "finish" | "start", listener: () => void): this;
    once(event: "debug", listener: (info: string) => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    once(event: "pipe" | "unpipe", listener: (src: Readable) => void): this;
    once(event: "speaking", listener: (speaking: boolean) => void): this;
    once(event: "volumeChange", listener: (oldVolume: number, newVolume: number) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
  }

  export class Structures {
    static get<K extends keyof Extendable>(structure: K): Extendable[K];
    static get(structure: string): (...args: any[]) => void;

    static extend<K extends keyof Extendable, T extends Extendable[K]>(
      structure: K,
      extender: (baseClass: Extendable[K]) => T,
    ): T;
    static extend<T extends (...args: any[]) => void>(
      structure: string,
      extender: (baseClass: typeof Function) => T,
    ): T;
  }

  export class SystemChannelFlags extends BitField<SystemChannelFlagsString> {
    static FLAGS: Record<SystemChannelFlagsString, number>;

    static resolve(bit?: BitFieldResolvable<SystemChannelFlagsString, number>): number;
  }

  export class Team extends Base {
    constructor(client: Client, data: object);

    id: Snowflake;
    name: string;
    icon: string | null;
    ownerID: Snowflake | null;
    members: Collection<Snowflake, TeamMember>;

    readonly owner: TeamMember;
    readonly createdAt: Date;
    readonly createdTimestamp: number;

    iconURL(options?: ImageURLOptions): string;

    toJSON(): object;

    toString(): string;
  }

  export class TeamMember extends Base {
    constructor(team: Team, data: object);

    team: Team;
    readonly id: Snowflake;
    permissions: string[];
    membershipState: MembershipStates;
    user: User;

    toString(): string;
  }

  export class TextChannel extends TextBasedChannel(GuildChannel) {
    constructor(guild: Guild, data?: object);

    messages: MessageManager;
    nsfw: boolean;
    type: "text";
    rateLimitPerUser: number;
    topic: string | null;

    createWebhook(
      name: string,
      options?: { avatar?: BufferResolvable | Base64Resolvable; reason?: string },
    ): Promise<Webhook>;

    setNSFW(nsfw: boolean, reason?: string): Promise<TextChannel>;

    setRateLimitPerUser(rateLimitPerUser: number, reason?: string): Promise<TextChannel>;

    setType(type: Pick<typeof ChannelType, "text" | "news">, reason?: string): Promise<GuildChannel>;

    fetchWebhooks(): Promise<Collection<Snowflake, Webhook>>;
  }

  export class User extends PartialTextBasedChannel(Base) {
    constructor(client: Client, data: object);

    avatar: string | null;
    bot: boolean;
    readonly createdAt: Date;
    readonly createdTimestamp: number;
    discriminator: string;
    readonly defaultAvatarURL: string;
    readonly dmChannel: DMChannel | null;
    flags: Readonly<UserFlags> | null;
    id: Snowflake;
    lastMessageID: Snowflake | null;
    readonly partial: false;
    readonly presence: Presence;
    system: boolean | null;
    readonly tag: string;
    username: string;

    avatarURL(options?: ImageURLOptions & { dynamic?: boolean }): string | null;

    createDM(): Promise<DMChannel>;

    deleteDM(): Promise<DMChannel>;

    displayAvatarURL(options?: ImageURLOptions & { dynamic?: boolean }): string;

    equals(user: User): boolean;

    fetch(force?: boolean): Promise<User>;

    fetchFlags(force?: boolean): Promise<UserFlags>;

    toString(): string;

    typingDurationIn(channel: ChannelResolvable): number;

    typingIn(channel: ChannelResolvable): boolean;

    typingSinceIn(channel: ChannelResolvable): Date;
  }

  export class UserFlags extends BitField<UserFlagsString> {
    static FLAGS: Record<UserFlagsString, number>;

    static resolve(bit?: BitFieldResolvable<UserFlagsString, number>): number;
  }

  export class Util {
    static basename(path: string, ext?: string): string;

    static binaryToID(num: string): Snowflake;

    static cleanContent(str: string, message: Message): string;

    static removeMentions(str: string): string;

    static cloneObject(obj: object): object;

    static delayFor(ms: number): Promise<void>;

    static discordSort<K, V extends { rawPosition: number; id: string }>(
      collection: Collection<K, V>,
    ): Collection<K, V>;

    static escapeMarkdown(text: string, options?: EscapeMarkdownOptions): string;

    static escapeCodeBlock(text: string): string;

    static escapeInlineCode(text: string): string;

    static escapeBold(text: string): string;

    static escapeItalic(text: string): string;

    static escapeUnderline(text: string): string;

    static escapeStrikethrough(text: string): string;

    static escapeSpoiler(text: string): string;

    static cleanCodeBlockContent(text: string): string;

    static fetchRecommendedShards(token: string, guildsPerShard?: number): Promise<number>;

    static flatten(obj: object, ...props: { [key: string]: boolean | string }[]): object;

    static idToBinary(num: Snowflake): string;

    static makeError(obj: { name: string; message: string; stack: string }): Error;

    static makePlainError(err: Error): { name: string; message: string; stack: string };

    static mergeDefault(def: object, given: object): object;

    static moveElementInArray(array: any[], element: any, newIndex: number, offset?: boolean): number;

    static parseEmoji(text: string): { animated: boolean; name: string; id: string | null } | null;

    static resolveColor(color: ColorResolvable): number;

    static resolveString(data: StringResolvable): string;

    static setPosition<T extends Channel | Role>(
      item: T,
      position: number,
      relative: boolean,
      sorted: Collection<Snowflake, T>,
      route: object,
      reason?: string,
    ): Promise<{ id: Snowflake; position: number }[]>;

    static splitMessage(text: StringResolvable, options?: SplitOptions): string[];
  }

  class VoiceBroadcast extends EventEmitter {
    constructor(client: Client);

    client: Client;
    subscribers: StreamDispatcher[];
    readonly dispatcher: BroadcastDispatcher | null;

    play(input: string | Readable, options?: StreamOptions): BroadcastDispatcher;

    end(): void;

    on(event: "end", listener: () => void): this;
    on(event: "subscribe" | "unsubscribe", listener: (dispatcher: StreamDispatcher) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    once(event: "end", listener: () => void): this;
    once(event: "subscribe" | "unsubscribe", listener: (dispatcher: StreamDispatcher) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
  }

  export class VoiceChannel extends GuildChannel {
    constructor(guild: Guild, data?: object);

    bitrate: number;
    readonly editable: boolean;
    readonly full: boolean;
    readonly joinable: boolean;
    readonly speakable: boolean;
    type: "voice";
    userLimit: number;

    join(): Promise<VoiceConnection>;

    leave(): void;

    setBitrate(bitrate: number, reason?: string): Promise<VoiceChannel>;

    setUserLimit(userLimit: number, reason?: string): Promise<VoiceChannel>;
  }

  class VoiceConnection extends EventEmitter {
    constructor(voiceManager: ClientVoiceManager, channel: VoiceChannel);

    private authentication: object;
    private sockets: object;
    private ssrcMap: Map<number, boolean>;
    private _speaking: Map<Snowflake, Readonly<Speaking>>;

    private _disconnect(): void;

    private authenticate(): void;

    private authenticateFailed(reason: string): void;

    private checkAuthenticated(): void;

    private cleanup(): void;

    private connect(): void;

    private onReady(data: object): void;

    private onSessionDescription(mode: string, secret: string): void;

    private onSpeaking(data: object): void;

    private reconnect(token: string, endpoint: string): void;

    private sendVoiceStateUpdate(options: object): Promise<Shard>;

    private setSessionID(sessionID: string): void;

    private setTokenAndEndpoint(token: string, endpoint: string): void;

    private updateChannel(channel: VoiceChannel): void;

    channel: VoiceChannel;
    readonly client: Client;
    readonly dispatcher: StreamDispatcher | null;
    player: object;
    receiver: VoiceReceiver;
    speaking: Readonly<Speaking>;
    status: VoiceStatus;
    readonly voice: VoiceState | null;
    voiceManager: ClientVoiceManager;

    disconnect(): void;

    play(input: VoiceBroadcast | Readable | string, options?: StreamOptions): StreamDispatcher;

    setSpeaking(value: BitFieldResolvable<SpeakingString, number>): void;

    on(event: "authenticated" | "closing" | "newSession" | "ready" | "reconnecting", listener: () => void): this;
    on(event: "debug", listener: (message: string) => void): this;
    on(event: "error" | "failed" | "disconnect", listener: (error: Error) => void): this;
    on(event: "speaking", listener: (user: User, speaking: Readonly<Speaking>) => void): this;
    on(event: "warn", listener: (warning: string | Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    once(
      event: "authenticated" | "closing" | "newSession" | "ready" | "reconnecting",
      listener: () => void,
    ): this;
    once(event: "debug", listener: (message: string) => void): this;
    once(event: "error" | "failed" | "disconnect", listener: (error: Error) => void): this;
    once(event: "speaking", listener: (user: User, speaking: Readonly<Speaking>) => void): this;
    once(event: "warn", listener: (warning: string | Error) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
  }

  class VoiceReceiver extends EventEmitter {
    constructor(connection: VoiceConnection);

    createStream(
      user: UserResolvable,
      options?: { mode?: "opus" | "pcm"; end?: "silence" | "manual" },
    ): Readable;

    on(event: "debug", listener: (error: Error | string) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    once(event: "debug", listener: (error: Error | string) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
  }

  export class VoiceRegion {
    constructor(data: object);

    custom: boolean;
    deprecated: boolean;
    id: string;
    name: string;
    optimal: boolean;
    vip: boolean;

    toJSON(): object;
  }

  export class VoiceState extends Base {
    constructor(guild: Guild, data: object);

    readonly channel: VoiceChannel | null;
    channelID: Snowflake | null;
    readonly connection: VoiceConnection | null;
    readonly deaf: boolean | null;
    guild: Guild;
    id: Snowflake;
    readonly member: GuildMember | null;
    readonly mute: boolean | null;
    selfDeaf: boolean | null;
    selfMute: boolean | null;
    serverDeaf: boolean | null;
    serverMute: boolean | null;
    sessionID: string | null;
    streaming: boolean;
    selfVideo: boolean;
    readonly speaking: boolean | null;

    setDeaf(deaf: boolean, reason?: string): Promise<GuildMember>;

    setMute(mute: boolean, reason?: string): Promise<GuildMember>;

    kick(reason?: string): Promise<GuildMember>;

    setChannel(channel: ChannelResolvable | null, reason?: string): Promise<GuildMember>;

    setSelfDeaf(deaf: boolean): Promise<boolean>;

    setSelfMute(mute: boolean): Promise<boolean>;
  }

  class VolumeInterface extends EventEmitter {
    constructor(options?: { volume?: number });

    readonly volume: number;
    readonly volumeDecibels: number;
    readonly volumeEditable: boolean;
    readonly volumeLogarithmic: number;

    setVolume(volume: number): void;

    setVolumeDecibels(db: number): void;

    setVolumeLogarithmic(value: number): void;

    on(event: "volumeChange", listener: (oldVolume: number, newVolume: number) => void): this;

    once(event: "volumeChange", listener: (oldVolume: number, newVolume: number) => void): this;
  }

  export class Webhook extends WebhookMixin() {
    constructor(client: Client, data?: object);

    avatar: string;

    avatarURL(options?: ImageURLOptions): string | null;

    channelID: Snowflake;
    client: Client;
    guildID: Snowflake;
    name: string;
    owner: User | object | null;
    token: string | null;
    type: WebhookTypes;
  }

  export class WebhookClient extends WebhookMixin(BaseClient) {
    constructor(id: string, token: string, options?: WebhookClientOptions);

    client: this;
    options: WebhookClientOptions;
    token: string;
  }

  export class WebSocketManager extends EventEmitter {
    constructor(client: Client);

    private totalShards: number | string;
    private shardQueue: Set<WebSocketShard>;
    private packetQueue: object[];
    private destroyed: boolean;
    private reconnecting: boolean;
    private sessionStartLimit: { total: number; remaining: number; reset_after: number } | null;

    readonly client: Client;
    gateway: string | null;
    shards: Collection<number, WebSocketShard>;
    status: Status;
    readonly ping: number;

    on(event: WSEventType, listener: (data: any, shardID: number) => void): this;

    once(event: WSEventType, listener: (data: any, shardID: number) => void): this;

    private debug(message: string, shard?: WebSocketShard): void;

    private connect(): Promise<void>;

    private createShards(): Promise<void>;

    private reconnect(): Promise<void>;

    private broadcast(packet: object): void;

    private destroy(): void;

    private _handleSessionLimit(remaining?: number, resetAfter?: number): Promise<void>;

    private handlePacket(packet?: object, shard?: WebSocketShard): boolean;

    private checkShardsReady(): void;

    private triggerClientReady(): void;
  }

  export class WebSocketShard extends EventEmitter {
    constructor(manager: WebSocketManager, id: number);

    private sequence: number;
    private closeSequence: number;
    private sessionID: string | null;
    private lastPingTimestamp: number;
    private lastHeartbeatAcked: boolean;
    private ratelimit: { queue: object[]; total: number; remaining: number; time: 60e3; timer: NodeJS.Timeout | null };
    private connection: WebSocket | null;
    private helloTimeout: NodeJS.Timeout | null;
    private eventsAttached: boolean;
    private expectedGuilds: Set<Snowflake> | null;
    private readyTimeout: NodeJS.Timeout | null;

    manager: WebSocketManager;
    id: number;
    status: Status;
    ping: number;

    private debug(message: string): void;

    private connect(): Promise<void>;

    private onOpen(): void;

    private onMessage(event: MessageEvent): void;

    private onError(error: ErrorEvent | object): void;

    private onClose(event: CloseEvent): void;

    private onPacket(packet: object): void;

    private checkReady(): void;

    private setHelloTimeout(time?: number): void;

    private setHeartbeatTimer(time: number): void;

    private sendHeartbeat(): void;

    private ackHeartbeat(): void;

    private identify(): void;

    private identifyNew(): void;

    private identifyResume(): void;

    private _send(data: object): void;

    private processQueue(): void;

    private destroy(destroyOptions?: { closeCode?: number; reset?: boolean; emit?: boolean; log?: boolean }): void;

    private _cleanupConnection(): void;

    private _emitDestroyed(): void;

    send(data: object): void;

    on(event: "ready" | "resumed" | "invalidSession", listener: () => void): this;
    on(event: "close", listener: (event: CloseEvent) => void): this;
    on(event: "allReady", listener: (unavailableGuilds?: Set<Snowflake>) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    once(event: "ready" | "resumed" | "invalidSession", listener: () => void): this;
    once(event: "close", listener: (event: CloseEvent) => void): this;
    once(event: "allReady", listener: (unavailableGuilds?: Set<Snowflake>) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
  }

  //#endregion

  //#region Collections

  export class Collection<K, V> extends BaseCollection<K, V> {
    flatMap<T>(
      fn: (value: V, key: K, collection: this) => Collection<K, T>,
      thisArg?: unknown,
    ): Collection<K, T>;
    flatMap<T, This>(
      fn: (this: This, value: V, key: K, collection: this) => Collection<K, T>,
      thisArg: This,
    ): Collection<K, T>;

    mapValues<T>(fn: (value: V, key: K, collection: this) => T, thisArg?: unknown): Collection<K, T>;
    mapValues<This, T>(
      fn: (this: This, value: V, key: K, collection: this) => T,
      thisArg: This,
    ): Collection<K, T>;

    toJSON(): object;
  }

  //#endregion

  //#region Managers

  export abstract class BaseManager<K, Holds, R> {
    constructor(client: Client, iterable: Iterable<any>, holds: Constructable<Holds>, cacheType: Collection<K, Holds>);

    holds: Constructable<Holds>;
    cache: Collection<K, Holds>;
    cacheType: Collection<K, Holds>;
    readonly client: Client;

    add(data: any, cache?: boolean, {
      id,
      extras,
    }?: { id: K; extras: any[] }): Holds;

    resolve(resolvable: Holds): Holds;
    resolve(resolvable: R): Holds | null;

    resolveID(resolvable: Holds): K;
    resolveID(resolvable: R): K | null;

    valueOf(): Collection<K, Holds>;
  }

  export class BaseGuildEmojiManager extends BaseManager<Snowflake, GuildEmoji, EmojiResolvable> {
    constructor(client: Client, iterable?: Iterable<any>);

    resolveIdentifier(emoji: EmojiIdentifierResolvable): string | null;
  }

  export class ChannelManager extends BaseManager<Snowflake, Channel, ChannelResolvable> {
    constructor(client: Client, iterable: Iterable<any>);

    forge(id: Snowflake, type?: "dm"): DMChannel
    forge(id: Snowflake, type: "text"): TextChannel
    forge(id: Snowflake, type: "voice"): VoiceChannel
    forge(id: Snowflake, type: "group"): PartialGroupDMChannel
    forge(id: Snowflake, type: "category"): CategoryChannel
    forge(id: Snowflake, type: "news"): NewsChannel
    forge(id: Snowflake, type: "store"): StoreChannel
    fetch(id: Snowflake): Promise<Channel>
    fetch(id: Snowflake, cache: boolean): Promise<Channel>
    fetch(id: Snowflake, options: ChannelFetchOptions): Promise<Channel>
    fetch(options: { id: Snowflake } & ChannelFetchOptions): Promise<Channel>
    fetch(id: Snowflake, cache?: boolean, force?: boolean): Promise<Channel>;
  }

  export class GuildChannelManager extends BaseManager<Snowflake, GuildChannel, GuildChannelResolvable> {
    constructor(guild: Guild, iterable?: Iterable<any>);

    guild: Guild;

    forge(id: Snowflake, type?: "text"): TextChannel
    forge(id: Snowflake, type: "voice"): VoiceChannel
    forge(id: Snowflake, type: "category"): CategoryChannel
    forge(id: Snowflake, type: "news"): NewsChannel
    forge(id: Snowflake, type: "store"): StoreChannel
    fetch(): Promise<Collection<Snowflake, GuildChannel>>
    fetch(id: Snowflake): Promise<GuildChannel>
    fetch(id: Snowflake, cache: boolean): Promise<GuildChannel>
    fetch(id: Snowflake, options: ChannelFetchOptions): Promise<GuildChannel>
    fetch(cache: boolean): Promise<Collection<Snowflake, GuildChannel>>
    fetch(cache: boolean, options: ChannelFetchOptions): Promise<Collection<Snowflake, GuildChannel>>
    fetch(options: { id: Snowflake } & ChannelFetchOptions): Promise<GuildChannel>
    fetch(options: ChannelFetchOptions): Promise<Collection<Snowflake, GuildChannel>>
    create(name: string, options: GuildCreateChannelOptions & { type: "voice" }): Promise<VoiceChannel>;
    create(name: string, options: GuildCreateChannelOptions & { type: "category" }): Promise<CategoryChannel>;
    create(name: string, options?: GuildCreateChannelOptions & { type?: "text" }): Promise<TextChannel>;
    create(name: string, options: GuildCreateChannelOptions,): Promise<TextChannel | VoiceChannel | CategoryChannel>;
  }

  export class GuildEmojiManager extends BaseGuildEmojiManager {
    constructor(guild: Guild, iterable?: Iterable<any>);

    guild: Guild;

    create(attachment: BufferResolvable | Base64Resolvable, name: string, options?: GuildEmojiCreateOptions): Promise<GuildEmoji>;
    forge(id: Snowflake): GuildEmojiManager
    fetch(): Promise<Collection<Snowflake, GuildEmoji>>
    fetch(id: Snowflake): Promise<GuildEmoji>
    fetch(id: Snowflake, cache: boolean): Promise<GuildEmoji>
    fetch(id: Snowflake, options: EmojiFetchOptions): Promise<GuildEmoji>
    fetch(cache: boolean): Promise<Collection<Snowflake, GuildEmoji>>
    fetch(cache: boolean, options: EmojiFetchOptions): Promise<Collection<Snowflake, GuildEmoji>>
    fetch(options: { id: Snowflake } & EmojiFetchOptions): Promise<GuildEmoji>
    fetch(options: EmojiFetchOptions): Promise<Collection<Snowflake, GuildEmoji>>
  }

  export class GuildEmojiRoleManager {
    constructor(emoji: GuildEmoji);

    emoji: GuildEmoji;
    guild: Guild;
    cache: Collection<Snowflake, Role>;

    add(roleOrRoles: RoleResolvable | readonly RoleResolvable[] | Collection<Snowflake, Role>): Promise<GuildEmoji>;
    set(roles: readonly RoleResolvable[] | Collection<Snowflake, Role>): Promise<GuildEmoji>;
    remove(roleOrRoles: RoleResolvable | readonly RoleResolvable[] | Collection<Snowflake, Role>): Promise<GuildEmoji>;
    valueOf(): Collection<Snowflake, Role>;
  }

  export class GuildManager extends BaseManager<Snowflake, Guild, GuildResolvable> {
    constructor(client: Client, iterable?: Iterable<any>);

    create(name: string, options?: GuildCreateOptions): Promise<Guild>;
    forge(id: Snowflake): Guild
    fetch(): Promise<Collection<Snowflake, Guild>>
    fetch(id: Snowflake): Promise<Guild>
    fetch(id: Snowflake, cache: boolean): Promise<Guild>
    fetch(id: Snowflake, options: GuildFetchOptions): Promise<Guild>
    fetch(cache: boolean): Promise<Collection<Snowflake, Guild>>
    fetch(cache: boolean, options: GuildFetchOptions): Promise<Collection<Snowflake, Guild>>
    fetch(options: { id: Snowflake } & GuildFetchOptions): Promise<Guild>
    fetch(options: GuildFetchOptions): Promise<Collection<Snowflake, Guild>>
    fetch(id: Snowflake, cache?: boolean, force?: boolean): Promise<Guild>;
  }

  export class GuildMemberManager extends BaseManager<Snowflake, GuildMember, GuildMemberResolvable> {
    constructor(guild: Guild, iterable?: Iterable<any>);

    guild: Guild;

    ban(user: UserResolvable, options?: BanOptions): Promise<GuildMember | User | Snowflake>;
    forge(id: Snowflake): GuildMemberManager
    fetch(): Promise<Collection<Snowflake, GuildMember>>
    fetch(user: Snowflake): Promise<GuildMember>
    fetch(user: Snowflake, cache: boolean): Promise<GuildMember>
    fetch(user: Snowflake, options: MemberFetchOptions): Promise<GuildMember>
    fetch(cache: boolean): Promise<Collection<Snowflake, GuildMember>>
    fetch(cache: boolean, options: MemberFetchOptions): Promise<Collection<Snowflake, GuildMember>>
    fetch(options: { user: Snowflake } & MemberFetchOptions): Promise<GuildMember>
    fetch(options: MemberFetchOptions): Promise<Collection<Snowflake, GuildMember>>
    prune(options: GuildPruneMembersOptions & { dry?: false; count: false }): Promise<null>;
    prune(options?: GuildPruneMembersOptions): Promise<number>;
    unban(user: UserResolvable, reason?: string): Promise<User>;
  }

  export class GuildMemberRoleManager extends OverridableManager<Snowflake, Role, RoleResolvable> {
    constructor(member: GuildMember);

    readonly hoist: Role | null;
    readonly color: Role | null;
    readonly highest: Role;
    readonly premiumSubscriberRole: Role | null;
    readonly botRole: Role | null;
    member: GuildMember;
    guild: Guild;

    add(roleOrRoles: RoleResolvable | readonly RoleResolvable[] | Collection<Snowflake, Role>, reason?: string): Promise<GuildMember>;
    set(roles: readonly RoleResolvable[] | Collection<Snowflake, Role>, reason?: string): Promise<GuildMember>;
    remove(roleOrRoles: RoleResolvable | readonly RoleResolvable[] | Collection<Snowflake, Role>, reason?: string): Promise<GuildMember>;
    valueOf(): Collection<Snowflake, Role>;
  }

  export class MessageManager extends BaseManager<Snowflake, Message, MessageResolvable> {
    constructor(channel: TextChannel | DMChannel, iterable?: Iterable<any>);

    channel: TextBasedChannelFields;
    cache: Collection<Snowflake, Message>;

    fetch(message: Snowflake, cache?: boolean, force?: boolean): Promise<Message>;
    fetch(options?: ChannelLogsQueryOptions, cache?: boolean, force?: boolean): Promise<Collection<Snowflake, Message>>;
    forge(id: Snowflake): Message
    fetchPinned(cache?: boolean): Promise<Collection<Snowflake, Message>>;
    delete(message: MessageResolvable): Promise<void>;
  }

  // Hacky workaround because changing the signature of an overridden method errors
  class OverridableManager<V, K, R = any> extends BaseManager<V, K, R> {
    add(data: any, cache: any): any;

    set(key: any): any;
  }

  export class PresenceManager extends BaseManager<Snowflake, Presence, PresenceResolvable> {
    constructor(client: Client, iterable?: Iterable<any>);

    forge(id: Snowflake): Presence
  }

  export class ReactionManager extends BaseManager<string | Snowflake, MessageReaction, MessageReactionResolvable> {
    constructor(message: Message, iterable?: Iterable<any>);

    message: Message;
    
    forge(id: Snowflake): MessageReaction
    forge(unicodeEmoji: string): MessageReaction
    removeAll(): Promise<Message>;
  }

  export class ReactionUserManager extends BaseManager<Snowflake, User, UserResolvable> {
    constructor(client: Client, iterable: Iterable<any> | undefined, reaction: MessageReaction);

    reaction: MessageReaction;

    fetch(): Promise<Collection<Snowflake, User>>
    fetch(options: ReactionUserFetchOptions): Promise<Collection<Snowflake, User>>
    remove(user?: UserResolvable): Promise<MessageReaction>;
  }

  export class RoleManager extends BaseManager<Snowflake, Role, RoleResolvable> {
    constructor(guild: Guild, iterable?: Iterable<any>);

    readonly everyone: Role;
    readonly highest: Role;
    guild: Guild;
    readonly premiumSubscriberRole: Role | null;

    botRoleFor(user: UserResolvable): Role | null;
    create(options?: RoleData & { reason?: string }): Promise<Role>;
    forge(id: Snowflake): Role
    fetch(): Promise<Collection<Snowflake, Role>>
    fetch(id: Snowflake): Promise<Role>
    fetch(id: Snowflake, cache: boolean): Promise<Role>
    fetch(id: Snowflake, options: RoleFetchOptions): Promise<Role>
    fetch(cache: boolean): Promise<Collection<Snowflake, Role>>
    fetch(cache: boolean, options: RoleFetchOptions): Promise<Collection<Snowflake, Role>>
    fetch(options: { id: Snowflake } & RoleFetchOptions): Promise<Role>
    fetch(options: RoleFetchOptions): Promise<Collection<Snowflake, Role>>
  }

  export class UserManager extends BaseManager<Snowflake, User, UserResolvable> {
    constructor(client: Client, iterable?: Iterable<any>);

    forge(id: Snowflake): User
    fetch(id: Snowflake, cache?: boolean, force?: boolean): Promise<User>;
  }

  export class VoiceStateManager extends BaseManager<Snowflake, VoiceState, typeof VoiceState> {
    constructor(guild: Guild, iterable?: Iterable<any>);

    guild: Guild;
  }

  //#endregion

  //#region Mixins

  // Model the TextBasedChannel mixin system, allowing application of these fields
  // to the classes that use these methods without having to manually add them
  // to each of those classes

  type Constructable<T> = new (...args: any[]) => T;

  function PartialTextBasedChannel<T>(Base?: Constructable<T>): Constructable<T & PartialTextBasedChannelFields>;

  function TextBasedChannel<T, I extends keyof TextBasedChannelFields = never>(
    Base?: Constructable<T>,
    ignore?: I[],
  ): Constructable<T & Omit<TextBasedChannelFields, I>>;

  interface PartialTextBasedChannelFields {
    lastMessageID: Snowflake | null;
    readonly lastMessage: Message | null;
    
    send(content: APIMessageContentResolvable | (MessageOptions & { split?: false }) | MessageAdditions,): Promise<Message>;
    send(options: MessageOptions & { split: true | SplitOptions }): Promise<Message[]>;
    send(options: MessageOptions | APIMessage): Promise<Message | Message[]>;
    send(content: StringResolvable, options: (MessageOptions & { split?: false }) | MessageAdditions): Promise<Message>;
    send(content: StringResolvable, options: MessageOptions & { split: true | SplitOptions }): Promise<Message[]>;
    send(content: StringResolvable, options: MessageOptions): Promise<Message | Message[]>;
  }

  interface TextBasedChannelFields extends PartialTextBasedChannelFields {
    _typing: Map<string, TypingData>;
    lastPinTimestamp: number | null;
    readonly lastPinAt: Date | null;
    typing: boolean;
    typingCount: number;

    awaitMessages(filter: CollectorFilter, options?: AwaitMessagesOptions): Promise<Collection<Snowflake, Message>>;
    bulkDelete(messages: Collection<Snowflake, Message> | readonly MessageResolvable[] | number, filterOld?: boolean,): Promise<Collection<Snowflake, Message>>;
    createMessageCollector(filter: CollectorFilter, options?: MessageCollectorOptions): MessageCollector;
    startTyping(count?: number): Promise<void>;
    stopTyping(force?: boolean): void;
  }

  function WebhookMixin<T>(Base?: Constructable<T>): Constructable<T & WebhookFields>;

  function VolumeMixin<T>(base: Constructable<T>): Constructable<T & VolumeInterface>;

  interface WebhookFields {
    id: Snowflake;
    readonly createdAt: Date;
    readonly createdTimestamp: number;
    readonly url: string;

    delete(reason?: string): Promise<void>;
    edit(options: WebhookEditData): Promise<Webhook>;
    send(content: APIMessageContentResolvable | (WebhookMessageOptions & { split?: false }) | MessageAdditions,): Promise<Message | WebhookRawMessageResponse>;
    send(options: WebhookMessageOptions & { split: true | SplitOptions },): Promise<(Message | WebhookRawMessageResponse)[]>;
    send(options: WebhookMessageOptions | APIMessage,): Promise<Message | WebhookRawMessageResponse | (Message | WebhookRawMessageResponse)[]>;
    send(content: StringResolvable, options: (WebhookMessageOptions & { split?: false }) | MessageAdditions): Promise<Message | WebhookRawMessageResponse>;
    send(content: StringResolvable, options: WebhookMessageOptions & { split: true | SplitOptions }): Promise<(Message | WebhookRawMessageResponse)[]>;
    send(content: StringResolvable, options: WebhookMessageOptions,): Promise<Message | WebhookRawMessageResponse | (Message | WebhookRawMessageResponse)[]>;
    sendSlackMessage(body: object): Promise<boolean>;
  }

  //#endregion

  //#region Typedefs

  type ActivityFlagsString = "INSTANCE" | "JOIN" | "SPECTATE" | "JOIN_REQUEST" | "SYNC" | "PLAY";

  interface ActivityOptions {
    name?: string;
    url?: string;
    type?: ActivityType | number;
    shardID?: number | readonly number[];
  }

  type ActivityType = "PLAYING" | "STREAMING" | "LISTENING" | "WATCHING" | "CUSTOM_STATUS" | "COMPETING";

  interface AddGuildMemberOptions {
    accessToken: string;
    nick?: string;
    roles?: Collection<Snowflake, Role> | RoleResolvable[];
    mute?: boolean;
    deaf?: boolean;
  }

  interface APIErrors {
    UNKNOWN_ACCOUNT: 10001;
    UNKNOWN_APPLICATION: 10002;
    UNKNOWN_CHANNEL: 10003;
    UNKNOWN_GUILD: 10004;
    UNKNOWN_INTEGRATION: 10005;
    UNKNOWN_INVITE: 10006;
    UNKNOWN_MEMBER: 10007;
    UNKNOWN_MESSAGE: 10008;
    UNKNOWN_OVERWRITE: 10009;
    UNKNOWN_PROVIDER: 10010;
    UNKNOWN_ROLE: 10011;
    UNKNOWN_TOKEN: 10012;
    UNKNOWN_USER: 10013;
    UNKNOWN_EMOJI: 10014;
    UNKNOWN_WEBHOOK: 10015;
    UNKNOWN_BAN: 10026;
    UNKNOWN_GUILD_TEMPLATE: 10057;
    BOT_PROHIBITED_ENDPOINT: 20001;
    BOT_ONLY_ENDPOINT: 20002;
    ANNOUNCEMENT_EDIT_LIMIT_EXCEEDED: 20022;
    CHANNEL_HIT_WRITE_RATELIMIT: 20028;
    MAXIMUM_GUILDS: 30001;
    MAXIMUM_FRIENDS: 30002;
    MAXIMUM_PINS: 30003;
    MAXIMUM_ROLES: 30005;
    MAXIMUM_WEBHOOKS: 30007;
    MAXIMUM_REACTIONS: 30010;
    MAXIMUM_CHANNELS: 30013;
    MAXIMUM_ATTACHMENTS: 30015;
    MAXIMUM_INVITES: 30016;
    GUILD_ALREADY_HAS_TEMPLATE: 30031;
    UNAUTHORIZED: 40001;
    ACCOUNT_VERIFICATION_REQUIRED: 40002;
    REQUEST_ENTITY_TOO_LARGE: 40005;
    FEATURE_TEMPORARILY_DISABLED: 40006;
    USER_BANNED: 40007;
    ALREADY_CROSSPOSTED: 40033;
    MISSING_ACCESS: 50001;
    INVALID_ACCOUNT_TYPE: 50002;
    CANNOT_EXECUTE_ON_DM: 50003;
    EMBED_DISABLED: 50004;
    CANNOT_EDIT_MESSAGE_BY_OTHER: 50005;
    CANNOT_SEND_EMPTY_MESSAGE: 50006;
    CANNOT_MESSAGE_USER: 50007;
    CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL: 50008;
    CHANNEL_VERIFICATION_LEVEL_TOO_HIGH: 50009;
    OAUTH2_APPLICATION_BOT_ABSENT: 50010;
    MAXIMUM_OAUTH2_APPLICATIONS: 50011;
    INVALID_OAUTH_STATE: 50012;
    MISSING_PERMISSIONS: 50013;
    INVALID_AUTHENTICATION_TOKEN: 50014;
    NOTE_TOO_LONG: 50015;
    INVALID_BULK_DELETE_QUANTITY: 50016;
    CANNOT_PIN_MESSAGE_IN_OTHER_CHANNEL: 50019;
    INVALID_OR_TAKEN_INVITE_CODE: 50020;
    CANNOT_EXECUTE_ON_SYSTEM_MESSAGE: 50021;
    INVALID_OAUTH_TOKEN: 50025;
    BULK_DELETE_MESSAGE_TOO_OLD: 50034;
    INVALID_FORM_BODY: 50035;
    INVITE_ACCEPTED_TO_GUILD_NOT_CONTAINING_BOT: 50036;
    INVALID_API_VERSION: 50041;
    CANNOT_DELETE_COMMUNITY_REQUIRED_CHANNEL: 50074;
    REACTION_BLOCKED: 90001;
    RESOURCE_OVERLOADED: 130000;
  }

  type APIMessageContentResolvable = string | number | boolean | bigint | symbol | readonly StringResolvable[];

  interface APIRawMessage {
    id: Snowflake;
    type: number;
    content: string;
    channel_id: Snowflake;
    author: {
      bot?: true;
      id: Snowflake;
      username: string;
      avatar: string | null;
      discriminator: string;
    };
    attachments: {
      id: Snowflake;
      filename: string;
      size: number;
      url: string;
      proxy_url: string;
      height: number | null;
      width: number | null;
    }[];
    embeds: {
      title?: string;
      type?: "rich" | "image" | "video" | "gifv" | "article" | "link";
      description?: string;
      url?: string;
      timestamp?: string;
      color?: number;
      footer?: {
        text: string;
        icon_url?: string;
        proxy_icon_url?: string;
      };
      image?: {
        url?: string;
        proxy_url?: string;
        height?: number;
        width?: number;
      };
      thumbnail?: {
        url?: string;
        proxy_url?: string;
        height?: number;
        width?: number;
      };
      video?: {
        url?: string;
        height?: number;
        width?: number;
      };
      provider?: { name?: string; url?: string };
      author?: {
        name?: string;
        url?: string;
        icon_url?: string;
        proxy_icon_url?: string;
      };
      fields?: {
        name: string;
        value: string;
        inline?: boolean;
      }[];
    }[];
    mentions: {
      id: Snowflake;
      username: string;
      discriminator: string;
      avatar: string | null;
      bot?: true;
      public_flags?: number;
      member?: {
        nick: string | null;
        roles: Snowflake[];
        joined_at: string;
        premium_since?: string | null;
        deaf: boolean;
        mute: boolean;
      };
    }[];
    mention_roles: Snowflake[];
    pinned: boolean;
    mention_everyone: boolean;
    tts: boolean;
    timestamp: string;
    edited_timestamp: string | null;
    flags: number;
    webhook_id: Snowflake;
  }

  interface ApplicationAsset {
    name: string;
    id: Snowflake;
    type: "BIG" | "SMALL";
  }

  interface AuditLogChange {
    key: string;
    old?: any;
    new?: any;
  }

  interface AwaitMessagesOptions extends MessageCollectorOptions {
    errors?: string[];
  }

  interface AwaitReactionsOptions extends ReactionCollectorOptions {
    errors?: string[];
  }

  interface BanOptions {
    days?: number;
    reason?: string;
  }

  type Base64Resolvable = Buffer | Base64String;

  type Base64String = string;

  type BitFieldResolvable<T extends string, N extends number | bigint> =
    | RecursiveReadonlyArray<T | N | Readonly<BitField<T, N>>>
    | T
    | N
    | Readonly<BitField<T, N>>;

  type BufferResolvable = Buffer | string;

  interface ChannelCreationOverwrites {
    allow?: PermissionResolvable;
    deny?: PermissionResolvable;
    id: RoleResolvable | UserResolvable;
  }

  interface ChannelData {
    name?: string;
    type?: Pick<typeof ChannelType, "text" | "news">;
    position?: number;
    topic?: string;
    nsfw?: boolean;
    bitrate?: number;
    userLimit?: number;
    parentID?: Snowflake | null;
    rateLimitPerUser?: number;
    lockPermissions?: boolean;
    permissionOverwrites?: readonly OverwriteResolvable[] | Collection<Snowflake, OverwriteResolvable>;
  }

  interface ChannelLogsQueryOptions {
    limit?: number;
    before?: Snowflake;
    after?: Snowflake;
    around?: Snowflake;
  }

  interface ChannelPosition {
    channel: ChannelResolvable;
    position: number;
  }

  type ChannelResolvable = Channel | Snowflake;

  interface ClientEvents {
    rest: [ { path: string, method: string, response?: Promise<Buffer> } ]
    shardConnect: [ shard_id: number, guilds: Collection<Snowflake, Guild> ]
    guildEmojisUpdate: [ emojis: Collection<Snowflake, GuildEmoji> ]
    channelCreate: [ channel: GuildChannel ];
    channelDelete: [ channel: DMChannel | GuildChannel ];
    channelPinsUpdate: [ channel: Channel | PartialDMChannel, date: Date ];
    channelUpdate: [ oldChannel: Channel, newChannel: Channel ];
    debug: [ message: string ];
    warn: [ message: string ];
    disconnect: [ closeEvent: any, status: number ];
    emojiCreate: [ emoji: GuildEmoji ];
    emojiDelete: [ emoji: GuildEmoji ];
    emojiUpdate: [ oldEmoji: GuildEmoji, newEmoji: GuildEmoji ];
    error: [ error: Error ];
    guildBanAdd: [ guild: Guild, user: User ];
    guildBanRemove: [ guild: Guild, user: User ];
    guildCreate: [ guild: Guild ];
    guildDelete: [ guild: Guild ];
    guildUnavailable: [ guild: Guild ];
    guildIntegrationsUpdate: [ guild: Guild ];
    guildMemberAdd: [ member: GuildMember ];
    guildMemberAvailable: [ member: GuildMember | PartialGuildMember ];
    guildMemberRemove: [ member: GuildMember | PartialGuildMember ];
    guildMembersChunk: [
      members: Collection<Snowflake, GuildMember>,
      guild: Guild,
      data: { count: number; index: number; nonce: string | undefined },
    ];
    guildMemberSpeaking: [ member: GuildMember | PartialGuildMember, speaking: Readonly<Speaking> ];
    guildMemberUpdate: [ oldMember: GuildMember | PartialGuildMember, newMember: GuildMember ];
    guildUpdate: [ oldGuild: Guild, newGuild: Guild ];
    inviteCreate: [ invite: Invite ];
    inviteDelete: [ invite: Invite ];
    message: [ message: Message ];
    messageDelete: [ message: Message | PartialMessage ];
    messageReactionRemoveAll: [ message: Message | PartialMessage ];
    messageReactionRemoveEmoji: [ reaction: MessageReaction ];
    messageDeleteBulk: [ messages: Collection<Snowflake, Message | PartialMessage> ];
    messageReactionAdd: [ message: MessageReaction, user: User | PartialUser ];
    messageReactionRemove: [ reaction: MessageReaction, user: User | PartialUser ];
    messageUpdate: [ oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage ];
    presenceUpdate: [ oldPresence: Presence | undefined, newPresence: Presence ];
    rateLimit: [ rateLimitData: RateLimitData ];
    ready: [];
    invalidated: [];
    roleCreate: [ role: Role ];
    roleDelete: [ role: Role ];
    roleUpdate: [ oldRole: Role, newRole: Role ];
    typingStart: [ channel: Channel | PartialDMChannel, user: User | PartialUser ];
    userUpdate: [ oldUser: User | PartialUser, newUser: User ];
    voiceStateUpdate: [ oldState: VoiceState, newState: VoiceState ];
    webhookUpdate: [ channel: TextChannel ];
    shardDisconnect: [ closeEvent: CloseEvent, shardID: number ];
    shardError: [ error: Error, shardID: number ];
    shardReady: [ shardID: number, unavailableGuilds: Set<Snowflake> | undefined ];
    shardReconnecting: [ shardID: number ];
    shardResume: [ shardID: number, replayedEvents: number ];
  }

  interface ClientOptions {
    // DJS-LIGHT
    cache?: ("reactions" | "channels" | "guilds" | "presences" | "roles" | "overwrites" | "emojis" | "members")[];
    restoreCache?: ("guilds")[];
    hotReload?: boolean;
    sessionID?: string | string[];
    sequence?: number | number[];

    // BASE DJS
    shards?: number | number[] | "auto";
    shardCount?: number;
    messageCacheMaxSize?: number;
    messageCacheLifetime?: number;
    messageSweepInterval?: number;
    allowedMentions?: MessageMentionOptions;
    partials?: PartialTypes[];
    restWsBridgeTimeout?: number;
    restTimeOffset?: number;
    restRequestTimeout?: number;
    restSweepInterval?: number;
    retryLimit?: number;
    presence?: PresenceData;
    intents: BitFieldResolvable<IntentsString, number>;
    ws?: WebSocketOptions;
    http?: HTTPOptions;
  }

  type ClientPresenceStatus = "online" | "idle" | "dnd";

  interface ClientPresenceStatusData {
    web?: ClientPresenceStatus;
    mobile?: ClientPresenceStatus;
    desktop?: ClientPresenceStatus;
  }

  interface ClientUserEditData {
    username?: string;
    avatar?: BufferResolvable | Base64Resolvable;
  }

  interface CloseEvent {
    wasClean: boolean;
    code: number;
    reason: string;
    target: WebSocket;
  }

  type CollectorFilter = (...args: any[]) => boolean | Promise<boolean>;

  interface CollectorOptions {
    time?: number;
    idle?: number;
    dispose?: boolean;
  }

  type ColorResolvable =
    | "DEFAULT"
    | "WHITE"
    | "AQUA"
    | "GREEN"
    | "BLUE"
    | "YELLOW"
    | "PURPLE"
    | "LUMINOUS_VIVID_PINK"
    | "GOLD"
    | "ORANGE"
    | "RED"
    | "GREY"
    | "DARKER_GREY"
    | "NAVY"
    | "DARK_AQUA"
    | "DARK_GREEN"
    | "DARK_BLUE"
    | "DARK_PURPLE"
    | "DARK_VIVID_PINK"
    | "DARK_GOLD"
    | "DARK_ORANGE"
    | "DARK_RED"
    | "DARK_GREY"
    | "LIGHT_GREY"
    | "DARK_NAVY"
    | "BLURPLE"
    | "GREYPLE"
    | "DARK_BUT_NOT_BLACK"
    | "NOT_QUITE_BLACK"
    | "RANDOM"
    | [ number, number, number ]
    | number
    | string;

  interface CrosspostedChannel {
    channelID: Snowflake;
    guildID: Snowflake;
    type: keyof typeof ChannelType;
    name: string;
  }

  interface DeconstructedSnowflake {
    timestamp: number;
    readonly date: Date;
    workerID: number;
    processID: number;
    increment: number;
    binary: string;
  }

  type DefaultMessageNotifications = "ALL" | "MENTIONS";

  interface EmbedField {
    name: string;
    value: string;
    inline: boolean;
  }

  interface EmbedFieldData {
    name: StringResolvable;
    value: StringResolvable;
    inline?: boolean;
  }

  type EmojiIdentifierResolvable = string | EmojiResolvable;

  type EmojiResolvable = Snowflake | GuildEmoji | ReactionEmoji;

  interface ErrorEvent {
    error: any;
    message: string;
    type: string;
    target: WebSocket;
  }

  interface EscapeMarkdownOptions {
    codeBlock?: boolean;
    inlineCode?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    spoiler?: boolean;
    inlineCodeContent?: boolean;
    codeBlockContent?: boolean;
  }

  type ExplicitContentFilterLevel = "DISABLED" | "MEMBERS_WITHOUT_ROLES" | "ALL_MEMBERS";

  interface Extendable {
    GuildEmoji: typeof GuildEmoji;
    DMChannel: typeof DMChannel;
    TextChannel: typeof TextChannel;
    VoiceChannel: typeof VoiceChannel;
    CategoryChannel: typeof CategoryChannel;
    NewsChannel: typeof NewsChannel;
    StoreChannel: typeof StoreChannel;
    GuildMember: typeof GuildMember;
    Guild: typeof Guild;
    Message: typeof Message;
    MessageReaction: typeof MessageReaction;
    Presence: typeof Presence;
    VoiceState: typeof VoiceState;
    Role: typeof Role;
    User: typeof User;
  }

  interface FetchMemberOptions {
    user: UserResolvable;
    cache?: boolean;
    force?: boolean;
  }

  interface FetchMembersOptions {
    user?: UserResolvable | UserResolvable[];
    query?: string;
    limit?: number;
    withPresences?: boolean;
    time?: number;
    nonce?: string;
    force?: boolean;
  }

  interface FileOptions {
    attachment: BufferResolvable | Stream;
    name?: string;
  }

  type GuildAuditLogsAction = keyof GuildAuditLogsActions;

  interface GuildAuditLogsActions {
    ALL?: null;
    GUILD_UPDATE?: number;
    CHANNEL_CREATE?: number;
    CHANNEL_UPDATE?: number;
    CHANNEL_DELETE?: number;
    CHANNEL_OVERWRITE_CREATE?: number;
    CHANNEL_OVERWRITE_UPDATE?: number;
    CHANNEL_OVERWRITE_DELETE?: number;
    MEMBER_KICK?: number;
    MEMBER_PRUNE?: number;
    MEMBER_BAN_ADD?: number;
    MEMBER_BAN_REMOVE?: number;
    MEMBER_UPDATE?: number;
    MEMBER_ROLE_UPDATE?: number;
    MEMBER_MOVE?: number;
    MEMBER_DISCONNECT?: number;
    BOT_ADD?: number;
    ROLE_CREATE?: number;
    ROLE_UPDATE?: number;
    ROLE_DELETE?: number;
    INVITE_CREATE?: number;
    INVITE_UPDATE?: number;
    INVITE_DELETE?: number;
    WEBHOOK_CREATE?: number;
    WEBHOOK_UPDATE?: number;
    WEBHOOK_DELETE?: number;
    EMOJI_CREATE?: number;
    EMOJI_UPDATE?: number;
    EMOJI_DELETE?: number;
    MESSAGE_DELETE?: number;
    MESSAGE_BULK_DELETE?: number;
    MESSAGE_PIN?: number;
    MESSAGE_UNPIN?: number;
    INTEGRATION_CREATE?: number;
    INTEGRATION_UPDATE?: number;
    INTEGRATION_DELETE?: number;
  }

  type GuildAuditLogsActionType = "CREATE" | "DELETE" | "UPDATE" | "ALL";

  interface GuildAuditLogsFetchOptions {
    before?: Snowflake | GuildAuditLogsEntry;
    limit?: number;
    user?: UserResolvable;
    type?: GuildAuditLogsAction | number;
  }

  type GuildAuditLogsTarget = keyof GuildAuditLogsTargets;

  interface GuildAuditLogsTargets {
    ALL?: string;
    GUILD?: string;
    CHANNEL?: string;
    USER?: string;
    ROLE?: string;
    INVITE?: string;
    WEBHOOK?: string;
    EMOJI?: string;
    MESSAGE?: string;
    INTEGRATION?: string;
    UNKNOWN?: string;
  }

  type GuildChannelResolvable = Snowflake | GuildChannel;

  interface GuildCreateChannelOptions {
    permissionOverwrites?: OverwriteResolvable[] | Collection<Snowflake, OverwriteResolvable>;
    topic?: string;
    type?: Exclude<keyof typeof ChannelType | ChannelType,
      "dm" | "group" | "unknown" | ChannelType.dm | ChannelType.group | ChannelType.unknown>;
    nsfw?: boolean;
    parent?: ChannelResolvable;
    bitrate?: number;
    userLimit?: number;
    rateLimitPerUser?: number;
    position?: number;
    reason?: string;
  }

  interface GuildChannelCloneOptions extends GuildCreateChannelOptions {
    name?: string;
  }

  interface GuildCreateOptions {
    afkChannelID?: number;
    afkTimeout?: number;
    channels?: PartialChannelData[];
    defaultMessageNotifications?: DefaultMessageNotifications | number;
    explicitContentFilter?: ExplicitContentFilterLevel | number;
    icon?: BufferResolvable | Base64Resolvable | null;
    region?: string;
    roles?: PartialRoleData[];
    systemChannelID?: number;
    verificationLevel?: VerificationLevel | number;
  }

  interface GuildWidget {
    enabled: boolean;
    channel: GuildChannel | null;
  }

  interface GuildEditData {
    name?: string;
    region?: string;
    verificationLevel?: VerificationLevel | number;
    explicitContentFilter?: ExplicitContentFilterLevel | number;
    defaultMessageNotifications?: DefaultMessageNotifications | number;
    afkChannel?: ChannelResolvable;
    systemChannel?: ChannelResolvable;
    systemChannelFlags?: SystemChannelFlagsResolvable;
    afkTimeout?: number;
    icon?: Base64Resolvable;
    owner?: GuildMemberResolvable;
    splash?: Base64Resolvable;
    discoverySplash?: Base64Resolvable;
    banner?: Base64Resolvable;
    rulesChannel?: ChannelResolvable;
    publicUpdatesChannel?: ChannelResolvable;
    preferredLocale?: string;
  }

  interface GuildEmojiCreateOptions {
    roles?: Collection<Snowflake, Role> | RoleResolvable[];
    reason?: string;
  }

  interface GuildEmojiEditData {
    name?: string;
    roles?: Collection<Snowflake, Role> | RoleResolvable[];
  }

  type GuildFeatures =
    | "ANIMATED_ICON"
    | "BANNER"
    | "COMMERCE"
    | "COMMUNITY"
    | "DISCOVERABLE"
    | "FEATURABLE"
    | "INVITE_SPLASH"
    | "NEWS"
    | "PARTNERED"
    | "RELAY_ENABLED"
    | "VANITY_URL"
    | "VERIFIED"
    | "VIP_REGIONS"
    | "WELCOME_SCREEN_ENABLED";

  interface GuildMemberEditData {
    nick?: string | null;
    roles?: Collection<Snowflake, Role> | readonly RoleResolvable[];
    mute?: boolean;
    deaf?: boolean;
    channel?: ChannelResolvable | null;
  }

  type GuildMemberResolvable = GuildMember | UserResolvable;

  type GuildResolvable = Guild | GuildChannel | GuildMember | GuildEmoji | Invite | Role | Snowflake;

  interface GuildPruneMembersOptions {
    count?: boolean;
    days?: number;
    dry?: boolean;
    reason?: string;
    roles?: RoleResolvable[];
  }

  interface GuildWidgetData {
    enabled: boolean;
    channel: GuildChannelResolvable | null;
  }

  interface HTTPOptions {
    api?: string;
    version?: number;
    host?: string;
    cdn?: string;
    invite?: string;
    template?: string;
  }

  type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;

  interface ImageURLOptions {
    format?: AllowedImageFormat;
    size?: ImageSize;
  }

  interface IntegrationData {
    id: string;
    type: string;
  }

  interface IntegrationEditData {
    expireBehavior?: number;
    expireGracePeriod?: number;
  }

  interface IntegrationAccount {
    id: string;
    name: string;
  }

  type IntentsString =
    | "GUILDS"
    | "GUILD_MEMBERS"
    | "GUILD_BANS"
    | "GUILD_EMOJIS"
    | "GUILD_INTEGRATIONS"
    | "GUILD_WEBHOOKS"
    | "GUILD_INVITES"
    | "GUILD_VOICE_STATES"
    | "GUILD_PRESENCES"
    | "GUILD_MESSAGES"
    | "GUILD_MESSAGE_REACTIONS"
    | "GUILD_MESSAGE_TYPING"
    | "DIRECT_MESSAGES"
    | "DIRECT_MESSAGE_REACTIONS"
    | "DIRECT_MESSAGE_TYPING";

  interface InviteGenerationOptions {
    permissions?: PermissionResolvable;
    guild?: GuildResolvable;
    disableGuildSelect?: boolean;
    additionalScopes?: InviteScope[];
  }

  interface InviteOptions {
    temporary?: boolean;
    maxAge?: number;
    maxUses?: number;
    unique?: boolean;
    reason?: string;
  }

  type InviteResolvable = string;

  type InviteScope =
    | "applications.builds.read"
    | "applications.commands"
    | "applications.entitlements"
    | "applications.store.update"
    | "connections"
    | "email"
    | "identity"
    | "guilds"
    | "guilds.join"
    | "gdm.join"
    | "webhook.incoming";

  type GuildTemplateResolvable = string;

  type MembershipStates = "INVITED" | "ACCEPTED";

  type MessageAdditions = MessageEmbed | MessageAttachment | (MessageEmbed | MessageAttachment)[];

  interface MessageActivity {
    partyID: string;
    type: number;
  }

  interface MessageCollectorOptions extends CollectorOptions {
    max?: number;
    maxProcessed?: number;
  }

  interface MessageEditOptions {
    content?: StringResolvable;
    embed?: MessageEmbed | MessageEmbedOptions | null;
    code?: string | boolean;
    flags?: BitFieldResolvable<MessageFlagsString, number>;
    allowedMentions?: MessageMentionOptions;
  }

  interface MessageEmbedAuthor {
    name?: string;
    url?: string;
    iconURL?: string;
    proxyIconURL?: string;
  }

  interface MessageEmbedFooter {
    text?: string;
    iconURL?: string;
    proxyIconURL?: string;
  }

  interface MessageEmbedImage {
    url: string;
    proxyURL?: string;
    height?: number;
    width?: number;
  }

  interface MessageEmbedOptions {
    title?: string;
    description?: string;
    url?: string;
    timestamp?: Date | number;
    color?: ColorResolvable;
    fields?: EmbedFieldData[];
    files?: (MessageAttachment | string | FileOptions)[];
    author?: Partial<MessageEmbedAuthor> & { icon_url?: string; proxy_icon_url?: string };
    thumbnail?: Partial<MessageEmbedThumbnail> & { proxy_url?: string };
    image?: Partial<MessageEmbedImage> & { proxy_url?: string };
    video?: Partial<MessageEmbedVideo> & { proxy_url?: string };
    footer?: Partial<MessageEmbedFooter> & { icon_url?: string; proxy_icon_url?: string };
  }

  interface MessageEmbedProvider {
    name: string;
    url: string;
  }

  interface MessageEmbedThumbnail {
    url: string;
    proxyURL?: string;
    height?: number;
    width?: number;
  }

  interface MessageEmbedVideo {
    url?: string;
    proxyURL?: string;
    height?: number;
    width?: number;
  }

  interface MessageEvent {
    data: WebSocket.Data;
    type: string;
    target: WebSocket;
  }

  type MessageFlagsString = "CROSSPOSTED" | "IS_CROSSPOST" | "SUPPRESS_EMBEDS" | "SOURCE_MESSAGE_DELETED" | "URGENT";

  interface MessageMentionOptions {
    parse?: MessageMentionTypes[];
    roles?: Snowflake[];
    users?: Snowflake[];
    repliedUser?: boolean;
  }

  type MessageMentionTypes = "roles" | "users" | "everyone";

  interface MessageOptions {
    tts?: boolean;
    nonce?: string | number;
    content?: StringResolvable;
    embed?: MessageEmbed | MessageEmbedOptions;
    allowedMentions?: MessageMentionOptions;
    files?: (FileOptions | BufferResolvable | Stream | MessageAttachment)[];
    code?: string | boolean;
    split?: boolean | SplitOptions;
    replyTo?: MessageResolvable;
  }

  type MessageReactionResolvable = MessageReaction | Snowflake;

  interface MessageReference {
    channelID: string;
    guildID: string;
    messageID: string | null;
  }

  type MessageResolvable = Message | Snowflake;

  type MessageTarget = TextChannel | NewsChannel | DMChannel | User | GuildMember | Webhook | WebhookClient;

  type MessageType =
    | "DEFAULT"
    | "RECIPIENT_ADD"
    | "RECIPIENT_REMOVE"
    | "CALL"
    | "CHANNEL_NAME_CHANGE"
    | "CHANNEL_ICON_CHANGE"
    | "PINS_ADD"
    | "GUILD_MEMBER_JOIN"
    | "USER_PREMIUM_GUILD_SUBSCRIPTION"
    | "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1"
    | "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2"
    | "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3"
    | "CHANNEL_FOLLOW_ADD"
    | "GUILD_DISCOVERY_DISQUALIFIED"
    | "GUILD_DISCOVERY_REQUALIFIED"
    | "REPLY";

  interface OverwriteData {
    allow?: PermissionResolvable;
    deny?: PermissionResolvable;
    id: GuildMemberResolvable | RoleResolvable;
    type?: OverwriteType;
  }

  type OverwriteResolvable = PermissionOverwrites | OverwriteData;

  type OverwriteType = "member" | "role";

  interface PermissionFlags extends Record<PermissionString, bigint> {
  }

  interface PermissionObject extends Record<PermissionString, boolean> {
  }

  interface PermissionOverwriteOption extends Partial<Record<PermissionString, boolean | null>> {
  }

  type PermissionResolvable = BitFieldResolvable<PermissionString, bigint>;

  type PermissionString =
    | "CREATE_INSTANT_INVITE"
    | "KICK_MEMBERS"
    | "BAN_MEMBERS"
    | "ADMINISTRATOR"
    | "MANAGE_CHANNELS"
    | "MANAGE_GUILD"
    | "ADD_REACTIONS"
    | "VIEW_AUDIT_LOG"
    | "PRIORITY_SPEAKER"
    | "STREAM"
    | "VIEW_CHANNEL"
    | "SEND_MESSAGES"
    | "SEND_TTS_MESSAGES"
    | "MANAGE_MESSAGES"
    | "EMBED_LINKS"
    | "ATTACH_FILES"
    | "READ_MESSAGE_HISTORY"
    | "MENTION_EVERYONE"
    | "USE_EXTERNAL_EMOJIS"
    | "VIEW_GUILD_INSIGHTS"
    | "CONNECT"
    | "SPEAK"
    | "MUTE_MEMBERS"
    | "DEAFEN_MEMBERS"
    | "MOVE_MEMBERS"
    | "USE_VAD"
    | "CHANGE_NICKNAME"
    | "MANAGE_NICKNAMES"
    | "MANAGE_ROLES"
    | "MANAGE_WEBHOOKS"
    | "MANAGE_EMOJIS";

  interface RecursiveArray<T> extends ReadonlyArray<T | RecursiveArray<T>> {
  }

  type RecursiveReadonlyArray<T> = ReadonlyArray<T | RecursiveReadonlyArray<T>>;

  interface PermissionOverwriteOptions {
    allow: PermissionResolvable;
    deny: PermissionResolvable;
    id: UserResolvable | RoleResolvable;
  }

  type PremiumTier = number;

  interface PresenceData {
    status?: PresenceStatusData;
    afk?: boolean;
    activity?: {
      name?: string;
      type?: ActivityType | number;
      url?: string;
    };
    shardID?: number | number[];
  }

  type PresenceResolvable = Presence | UserResolvable | Snowflake;

  type Partialize<T, O extends string> = {
    readonly client: Client;
    readonly createdAt: Date;
    readonly createdTimestamp: number;
    deleted: boolean;
    id: string;
    partial: true;
    fetch(): Promise<T>;
  } & {
    [K in keyof Omit<T,
      "client" | "createdAt" | "createdTimestamp" | "id" | "partial" | "fetch" | "deleted" | O>]: T[K] extends Function ? T[K] : T[K] | null; // tslint:disable-line:ban-types
  };

  interface PartialDMChannel
    extends Partialize<DMChannel,
      "lastMessage" | "lastMessageID" | "messages" | "recipient" | "type" | "typing" | "typingCount"> {
    lastMessage: null;
    lastMessageID: undefined;
    messages: MessageManager;
    recipient: User | PartialUser;
    type: "dm";
    readonly typing: boolean;
    readonly typingCount: number;
  }

  interface PartialChannelData {
    id?: number;
    name: string;
    topic?: string;
    type?: ChannelType;
    parentID?: number;
    permissionOverwrites?: {
      id: number | Snowflake;
      type?: OverwriteType;
      allow?: PermissionResolvable;
      deny?: PermissionResolvable;
    }[];
  }

  interface PartialGuildMember
    extends Partialize<GuildMember,
      | "bannable"
      | "displayColor"
      | "displayHexColor"
      | "displayName"
      | "guild"
      | "kickable"
      | "permissions"
      | "roles"
      | "manageable"
      | "presence"
      | "voice"> {
    readonly bannable: boolean;
    readonly displayColor: number;
    readonly displayHexColor: string;
    readonly displayName: string;
    guild: Guild;
    readonly manageable: boolean;
    joinedAt: null;
    joinedTimestamp: null;
    readonly kickable: boolean;
    readonly permissions: GuildMember["permissions"];
    readonly presence: GuildMember["presence"];
    readonly roles: GuildMember["roles"];
    readonly voice: GuildMember["voice"];
  }

  interface PartialMessage
    extends Partialize<Message,
      | "attachments"
      | "channel"
      | "deletable"
      | "crosspostable"
      | "editable"
      | "mentions"
      | "pinnable"
      | "url"
      | "flags"
      | "embeds"> {
    attachments: Message["attachments"];
    channel: Message["channel"];
    readonly deletable: boolean;
    readonly crosspostable: boolean;
    readonly editable: boolean;
    embeds: Message["embeds"];
    flags: Message["flags"];
    mentions: Message["mentions"];
    readonly pinnable: boolean;
    reactions: Message["reactions"];
    readonly url: string;
  }

  interface PartialRoleData extends RoleData {
    id?: number;
  }

  type PartialTypes = "USER" | "CHANNEL" | "GUILD_MEMBER" | "MESSAGE" | "REACTION";

  interface PartialUser extends Omit<Partialize<User, "bot" | "flags" | "system" | "tag" | "username">, "deleted"> {
    bot: User["bot"];
    flags: User["flags"];
    system: User["system"];
    readonly tag: null;
    username: null;
  }

  type PresenceStatusData = ClientPresenceStatus | "invisible";

  type PresenceStatus = PresenceStatusData | "offline";

  interface RateLimitData {
    timeout: number;
    limit: number;
    method: string;
    path: string;
    route: string;
  }

  interface RawOverwriteData {
    id: Snowflake;
    allow: string;
    deny: string;
    type: number;
  }

  interface ReactionCollectorOptions extends CollectorOptions {
    max?: number;
    maxEmojis?: number;
    maxUsers?: number;
  }

  interface ResolvedOverwriteOptions {
    allow: Permissions;
    deny: Permissions;
  }

  interface RoleData {
    name?: string;
    color?: ColorResolvable;
    hoist?: boolean;
    position?: number;
    permissions?: PermissionResolvable;
    mentionable?: boolean;
  }

  interface RolePosition {
    role: RoleResolvable;
    position: number;
  }

  type RoleResolvable = Role | string;

  interface RoleTagData {
    botID?: Snowflake;
    integrationID?: Snowflake;
    premiumSubscriberRole?: true;
  }

  type ShardingManagerMode = "process" | "worker";

  type Snowflake = string;

  interface SplitOptions {
    maxLength?: number;
    char?: string;
    prepend?: string;
    append?: string;
  }

  type Status = number;

  interface StreamOptions {
    type?: StreamType;
    seek?: number;
    volume?: number | boolean;
    plp?: number;
    fec?: boolean;
    bitrate?: number | "auto";
    highWaterMark?: number;
  }

  type ChannelFetchOptions = {
    id?: Snowflake
    cache?: boolean
    withOverwrites?: boolean
    force?: boolean
  }
  type GuildFetchOptions = {
    id?: Snowflake
    cache?: boolean
    limit?: number
    before?: Snowflake
    after?: Snowflake
    force?: boolean
  }
  type MemberFetchOptions = {
    user?: Snowflake | Array<Snowflake>
    cache?: boolean
    rest?: boolean
    query?: string
    limit?: number
    after?: Snowflake
    withPresences?: boolean
    time?: number
    force?: boolean
  }
  type EmojiFetchOptions = {
    id?: Snowflake
    cache?: boolean
    force?: boolean
  }

  type RoleFetchOptions = {
    id?: Snowflake
    cache?: boolean
    force?: boolean
  }

  type ReactionUserFetchOptions = {
    cache?: boolean
    limit?: number
    before?: Snowflake
    after?: Snowflake
  }

  type SpeakingString = "SPEAKING" | "SOUNDSHARE" | "PRIORITY_SPEAKING";

  type StreamType = "unknown" | "converted" | "opus" | "ogg/opus" | "webm/opus";

  type StringResolvable = string | string[] | any;

  type SystemChannelFlagsString = "WELCOME_MESSAGE_DISABLED" | "BOOST_MESSAGE_DISABLED";

  type SystemChannelFlagsResolvable = BitFieldResolvable<SystemChannelFlagsString, number>;

  type SystemMessageType = Exclude<MessageType, "DEFAULT" | "REPLY">;

  type TargetUser = number;

  interface TypingData {
    user: User | PartialUser;
    since: Date;
    lastTimestamp: Date;
    elapsedTime: number;
    timeout: NodeJS.Timeout;
  }

  type UserFlagsString =
    | "DISCORD_EMPLOYEE"
    | "PARTNERED_SERVER_OWNER"
    | "HYPESQUAD_EVENTS"
    | "BUGHUNTER_LEVEL_1"
    | "HOUSE_BRAVERY"
    | "HOUSE_BRILLIANCE"
    | "HOUSE_BALANCE"
    | "EARLY_SUPPORTER"
    | "TEAM_USER"
    | "SYSTEM"
    | "BUGHUNTER_LEVEL_2"
    | "VERIFIED_BOT"
    | "EARLY_VERIFIED_BOT_DEVELOPER";

  type UserResolvable = User | Snowflake | Message | GuildMember;

  type VerificationLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

  type VoiceStatus = number;

  type WebhookClientOptions = Pick<ClientOptions,
    "allowedMentions" | "restTimeOffset" | "restRequestTimeout" | "retryLimit" | "http">;

  interface WebhookEditData {
    name?: string;
    avatar?: BufferResolvable;
    channel?: ChannelResolvable;
    reason?: string;
  }

  interface WebhookMessageOptions {
    username?: string;
    avatarURL?: string;
    tts?: boolean;
    nonce?: string;
    embeds?: (MessageEmbed | object)[];
    allowedMentions?: MessageMentionOptions;
    files?: (FileOptions | BufferResolvable | Stream | MessageAttachment)[];
    code?: string | boolean;
    split?: boolean | SplitOptions;
  }

  type WebhookRawMessageResponse = Omit<APIRawMessage, "author"> & {
    author: {
      bot: true;
      id: Snowflake;
      username: string;
      avatar: string | null;
      discriminator: "0000";
    };
  };

  type WebhookTypes = "Incoming" | "Channel Follower";

  interface WebSocketOptions {
    large_threshold?: number;
    compress?: boolean;
    properties?: WebSocketProperties;
  }

  interface WebSocketProperties {
    $os?: string;
    $browser?: string;
    $device?: string;
  }

  type WSEventType =
    | "READY"
    | "RESUMED"
    | "GUILD_CREATE"
    | "GUILD_DELETE"
    | "GUILD_UPDATE"
    | "INVITE_CREATE"
    | "INVITE_DELETE"
    | "GUILD_MEMBER_ADD"
    | "GUILD_MEMBER_REMOVE"
    | "GUILD_MEMBER_UPDATE"
    | "GUILD_MEMBERS_CHUNK"
    | "GUILD_ROLE_CREATE"
    | "GUILD_ROLE_DELETE"
    | "GUILD_ROLE_UPDATE"
    | "GUILD_BAN_ADD"
    | "GUILD_BAN_REMOVE"
    | "GUILD_EMOJIS_UPDATE"
    | "GUILD_INTEGRATIONS_UPDATE"
    | "CHANNEL_CREATE"
    | "CHANNEL_DELETE"
    | "CHANNEL_UPDATE"
    | "CHANNEL_PINS_UPDATE"
    | "MESSAGE_CREATE"
    | "MESSAGE_DELETE"
    | "MESSAGE_UPDATE"
    | "MESSAGE_DELETE_BULK"
    | "MESSAGE_REACTION_ADD"
    | "MESSAGE_REACTION_REMOVE"
    | "MESSAGE_REACTION_REMOVE_ALL"
    | "MESSAGE_REACTION_REMOVE_EMOJI"
    | "USER_UPDATE"
    | "PRESENCE_UPDATE"
    | "TYPING_START"
    | "VOICE_STATE_UPDATE"
    | "VOICE_SERVER_UPDATE"
    | "WEBHOOKS_UPDATE";

  //#endregion

  //#region API

  type API = Record<string, any>;
}
