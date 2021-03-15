'use strict';

const Constants = require("../../../util/Constants");
module.exports = (client, packet) => {
  const { old, updated } = client.actions.UserUpdate.handle(packet.d);
  client.emit(Constants.Events.USER_UPDATE, old, updated);
};