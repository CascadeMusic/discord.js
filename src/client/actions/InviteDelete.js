'use strict';

const Action = require('./Action');
const Invite = require('../../structures/Invite');

class InviteDeleteAction extends Action {
  handle(data) {
    const client = this.client,
      guild = this.getGuild(data),
      channel = this.getChannel(data, guild)

    return {
      invite: new Invite(client, Object.assign(data, { channel, guild }))
    }
  }
}

module.exports = InviteDeleteAction;
