'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class VoiceStateUpdate extends Action {
  handle(data) {
    const client = this.client,
      guild = this.getGuild(data)

    let user = client.users.cache.get(data.user_id);
    if (user && data.member) {
      if (data.member.user && data.member.user.username && !user.equals(data.member.user)) {
        client.actions.UserUpdate.handle(data.member.user);
      }

      const member = guild.members.cache.get(data.user_id);
      if (member) {
        member._update(data.member);
      } else {
        guild.members.add(data.member);
      }
    } else if (!user) {
      if (data.member && data.member.user) {
        client.users.add(data.member.user, client.doCache("members"));
      } else {
        client.users.add({ id: data.user_id }, false);
      }
    }

    const oldState = guild.voiceStates.cache.has(data.user_id)
      ? guild.voiceStates.cache.get(data.user_id)._clone()
      : null,
      newState = data.channel_id ? guild.voiceStates.add(data) : null;

    if (oldState && !newState) {
      guild.voiceStates.cache.delete(data.user_id);
    }

    if ((client.doCache("members") || client.users.cache.has(data.user_id)) && data.member) {
      guild.members.add(data.member);
    }

    if (oldState || newState) {
      client.emit(Events.VOICE_STATE_UPDATE, oldState, newState);
    }
  }
}

module.exports = VoiceStateUpdate;
