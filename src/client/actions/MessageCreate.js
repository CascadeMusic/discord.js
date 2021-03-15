'use strict';

const Action = require('./Action');

class MessageCreateAction extends Action {
  handle(data) {
    const c = this.client,
      guild = data.guild_id ? this.getGuild(data) : void 0,
      channel = this.getChannel(data, guild);

    const message = channel.messages.add(data, c.channels.cache.has(channel.id));
    channel.lastMessageID = data.id;

    if (message.author) {
      message.author.lastMessageID = data.id;
      message.author.lastMessageChannelID = channel.id;
    }

    if (message.member) {
      message.member.lastMessageID = data.id;
      message.member.lastMessageChannelID = channel.id;
    }

    return { message };
  }
}

module.exports = MessageCreateAction;
