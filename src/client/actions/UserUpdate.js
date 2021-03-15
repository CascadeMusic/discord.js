'use strict';

const Action = require('./Action');

class UserUpdateAction extends Action {
  handle(data) {
    const client = this.client;

    let updated = client.users.cache.get(data.id), old = null;
    if(updated) {
      old = updated._update(data);
    } else {
      updated = client.users.add(data, client.doCache("members"));
    }

    return { old, updated }
  }
}

module.exports = UserUpdateAction;
