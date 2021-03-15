'use strict';

const Action = require('./Action');
const Invite = require('../../structures/Invite');

class InviteCreateAction extends Action {
  handle(data) {
    const c = this.client,
      guild = this.getGuild(data),
      channel = this.getChannel(data, guild);

    return {
      invite: new Invite(c, Object.assign(data, { channel, guild }))
    }
  }
}

module.exports = InviteCreateAction;
