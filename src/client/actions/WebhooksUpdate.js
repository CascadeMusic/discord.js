'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class WebhooksUpdate extends Action {
  handle(data) {
    const channel = this.getChannel(data, this.getGuild(data))
    this.client.emit(Events.WEBHOOKS_UPDATE, channel);
  }
}

module.exports = WebhooksUpdate;
