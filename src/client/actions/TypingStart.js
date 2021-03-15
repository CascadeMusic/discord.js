'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');
const textBasedChannelTypes = [ 'dm', 'text', 'news' ];

class TypingStart extends Action {
  handle(data) {
    const client = this.client,
      guild = data.guild_id ? this.getGuild(data) : void 0,
      channel = this.getChannel(data, guild)

    let user = client.users.cache.get(data.user_id);
    if (user) {
      if (data.member) {
        if (data.member.user && data.member.user.username && !user.equals(data.member.user)) {
          client.actions.UserUpdate.handle(data.member.user);
        }

        const member = guild.members.cache.get(data.user_id);
        if (member) {
          member._update(data.member);
        } else {
          guild.members.add(data.member);
        }
      }
    } else {
      user = data.member && data.member.user ? client.users.add(data.member.user, client.options.cacheMembers) : client.users.add({ id: data.user_id }, false);
    }

    const timestamp = new Date(data.timestamp * 1000);
    if (channel._typing.has(user.id)) {
      const typing = channel._typing.get(user.id);
      typing.lastTimestamp = timestamp;
      typing.elapsedTime = Date.now() - typing.since;

      client.clearTimeout(typing.timeout);
      typing.timeout = this.tooLate(channel, user);
    } else {
      channel._typing.set(user.id, {
        user,
        since: new Date(),
        lastTimestamp: new Date(),
        elapsedTime: 0,
        timeout: this.tooLate(channel, user)
      });
    }

    client.emit(Events.TYPING_START, channel, user);
  }

  tooLate(channel, user) {
    return channel.client.setTimeout(() => channel._typing.delete(user.id), 10000);
  }
}

module.exports = TypingStart;
