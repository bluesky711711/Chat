(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var settings;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:channel-settings":{"server":{"functions":{"saveReactWhenReadOnly.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveReactWhenReadOnly.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveReactWhenReadOnly = function (rid, allowReact) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      function: 'RocketChat.saveReactWhenReadOnly'
    });
  }

  return RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomType.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomType.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomType = function (rid, roomType, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomType'
    });
  }

  if (roomType !== 'c' && roomType !== 'p') {
    throw new Meteor.Error('error-invalid-room-type', 'error-invalid-room-type', {
      'function': 'RocketChat.saveRoomType',
      type: roomType
    });
  }

  const room = RocketChat.models.Rooms.findOneById(rid);

  if (room == null) {
    throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
      'function': 'RocketChat.saveRoomType',
      _id: rid
    });
  }

  if (room.t === 'd') {
    throw new Meteor.Error('error-direct-room', 'Can\'t change type of direct rooms', {
      'function': 'RocketChat.saveRoomType'
    });
  }

  const result = RocketChat.models.Rooms.setTypeById(rid, roomType) && RocketChat.models.Subscriptions.updateTypeByRoomId(rid, roomType);

  if (result && sendMessage) {
    let message;

    if (roomType === 'c') {
      message = TAPi18n.__('Channel', {
        lng: user && user.language || RocketChat.settings.get('language') || 'en'
      });
    } else {
      message = TAPi18n.__('Private_Group', {
        lng: user && user.language || RocketChat.settings.get('language') || 'en'
      });
    }

    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_privacy', rid, message, user);
  }

  return result;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomTopic.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomTopic.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomTopic = function (rid, roomTopic, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomTopic'
    });
  }

  roomTopic = s.escapeHTML(roomTopic);
  const update = RocketChat.models.Rooms.setTopicById(rid, roomTopic);

  if (update && sendMessage) {
    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rid, roomTopic, user);
  }

  return update;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomCustomFields.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomCustomFields.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomCustomFields = function (rid, roomCustomFields) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomCustomFields'
    });
  }

  if (!Match.test(roomCustomFields, Object)) {
    throw new Meteor.Error('invalid-roomCustomFields-type', 'Invalid roomCustomFields type', {
      'function': 'RocketChat.saveRoomCustomFields'
    });
  }

  const ret = RocketChat.models.Rooms.setCustomFieldsById(rid, roomCustomFields); // Update customFields of any user's Subscription related with this rid

  RocketChat.models.Subscriptions.updateCustomFieldsByRoomId(rid, roomCustomFields);
  return ret;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomAnnouncement.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomAnnouncement.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectWithoutProperties"));

let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomAnnouncement = function (rid, roomAnnouncement, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      function: 'RocketChat.saveRoomAnnouncement'
    });
  }

  let message;
  let announcementDetails;

  if (typeof roomAnnouncement === 'string') {
    message = roomAnnouncement;
  } else {
    var _roomAnnouncement = roomAnnouncement;
    ({
      message
    } = _roomAnnouncement);
    announcementDetails = (0, _objectWithoutProperties2.default)(_roomAnnouncement, ["message"]);
    _roomAnnouncement;
  }

  const escapedMessage = s.escapeHTML(message);
  const updated = RocketChat.models.Rooms.setAnnouncementById(rid, escapedMessage, announcementDetails);

  if (updated && sendMessage) {
    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_announcement', rid, escapedMessage, user);
  }

  return updated;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomName.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomName.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomName = function (rid, displayName, user, sendMessage = true) {
  const room = RocketChat.models.Rooms.findOneById(rid);

  if (RocketChat.roomTypes.roomTypes[room.t].preventRenaming()) {
    throw new Meteor.Error('error-not-allowed', 'Not allowed', {
      'function': 'RocketChat.saveRoomdisplayName'
    });
  }

  if (displayName === room.name) {
    return;
  }

  const slugifiedRoomName = RocketChat.getValidRoomName(displayName, rid);
  const update = RocketChat.models.Rooms.setNameById(rid, slugifiedRoomName, displayName) && RocketChat.models.Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName);

  if (update && sendMessage) {
    RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rid, displayName, user);
  }

  return displayName;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomReadOnly.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomReadOnly.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomReadOnly = function (rid, readOnly) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomReadOnly'
    });
  }

  return RocketChat.models.Rooms.setReadOnlyById(rid, readOnly);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomDescription.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomDescription.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomDescription = function (rid, roomDescription, user) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomDescription'
    });
  }

  const escapedRoomDescription = s.escapeHTML(roomDescription);
  const update = RocketChat.models.Rooms.setDescriptionById(rid, escapedRoomDescription);
  RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', rid, escapedRoomDescription, user);
  return update;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomSystemMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomSystemMessages.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomSystemMessages = function (rid, systemMessages) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomSystemMessages'
    });
  }

  return RocketChat.models.Rooms.setSystemMessagesById(rid, systemMessages);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"saveRoomSettings.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/methods/saveRoomSettings.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const fields = ['roomName', 'roomTopic', 'roomAnnouncement', 'roomCustomFields', 'roomDescription', 'roomType', 'readOnly', 'reactWhenReadOnly', 'systemMessages', 'default', 'joinCode', 'tokenpass', 'streamingOptions'];
Meteor.methods({
  saveRoomSettings(rid, settings, value) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        'function': 'RocketChat.saveRoomName'
      });
    }

    if (!Match.test(rid, String)) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    if (typeof settings !== 'object') {
      settings = {
        [settings]: value
      };
    }

    if (!Object.keys(settings).every(key => fields.includes(key))) {
      throw new Meteor.Error('error-invalid-settings', 'Invalid settings provided', {
        method: 'saveRoomSettings'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)) {
      throw new Meteor.Error('error-action-not-allowed', 'Editing room is not allowed', {
        method: 'saveRoomSettings',
        action: 'Editing_room'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (room.broadcast && (settings.readOnly || settings.reactWhenReadOnly)) {
      throw new Meteor.Error('error-action-not-allowed', 'Editing readOnly/reactWhenReadOnly are not allowed for broadcast rooms', {
        method: 'saveRoomSettings',
        action: 'Editing_room'
      });
    }

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    const user = Meteor.user();
    Object.keys(settings).forEach(setting => {
      const value = settings[setting];

      if (settings === 'default' && !RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
        throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
          method: 'saveRoomSettings',
          action: 'Viewing_room_administration'
        });
      }

      if (setting === 'roomType' && value !== room.t && value === 'c' && !RocketChat.authz.hasPermission(this.userId, 'create-c')) {
        throw new Meteor.Error('error-action-not-allowed', 'Changing a private group to a public channel is not allowed', {
          method: 'saveRoomSettings',
          action: 'Change_Room_Type'
        });
      }

      if (setting === 'roomType' && value !== room.t && value === 'p' && !RocketChat.authz.hasPermission(this.userId, 'create-p')) {
        throw new Meteor.Error('error-action-not-allowed', 'Changing a public channel to a private room is not allowed', {
          method: 'saveRoomSettings',
          action: 'Change_Room_Type'
        });
      }
    });
    Object.keys(settings).forEach(setting => {
      const value = settings[setting];

      switch (setting) {
        case 'roomName':
          RocketChat.saveRoomName(rid, value, user);
          break;

        case 'roomTopic':
          if (value !== room.topic) {
            RocketChat.saveRoomTopic(rid, value, user);
          }

          break;

        case 'roomAnnouncement':
          if (value !== room.announcement) {
            RocketChat.saveRoomAnnouncement(rid, value, user);
          }

          break;

        case 'roomCustomFields':
          if (value !== room.customFields) {
            RocketChat.saveRoomCustomFields(rid, value);
          }

          break;

        case 'roomDescription':
          if (value !== room.description) {
            RocketChat.saveRoomDescription(rid, value, user);
          }

          break;

        case 'roomType':
          if (value !== room.t) {
            RocketChat.saveRoomType(rid, value, user);
          }

          break;

        case 'tokenpass':
          check(value, {
            require: String,
            tokens: [{
              token: String,
              balance: String
            }]
          });
          RocketChat.saveRoomTokenpass(rid, value);
          break;

        case 'streamingOptions':
          RocketChat.saveStreamingOptions(rid, value);
          break;

        case 'readOnly':
          if (value !== room.ro) {
            RocketChat.saveRoomReadOnly(rid, value, user);
          }

          break;

        case 'reactWhenReadOnly':
          if (value !== room.reactWhenReadOnly) {
            RocketChat.saveReactWhenReadOnly(rid, value, user);
          }

          break;

        case 'systemMessages':
          if (value !== room.sysMes) {
            RocketChat.saveRoomSystemMessages(rid, value, user);
          }

          break;

        case 'joinCode':
          RocketChat.models.Rooms.setJoinCodeById(rid, String(value));
          break;

        case 'default':
          RocketChat.models.Rooms.saveDefaultById(rid, value);
      }
    });
    return {
      result: true,
      rid: room._id
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Messages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/models/Messages.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser = function (type, roomId, message, user, extraData) {
  return this.createWithTypeRoomIdMessageAndUser(type, roomId, message, user, extraData);
};

RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser = function (roomId, roomName, user, extraData) {
  return this.createWithTypeRoomIdMessageAndUser('r', roomId, roomName, user, extraData);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/models/Rooms.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Rooms.setDescriptionById = function (_id, description) {
  const query = {
    _id
  };
  const update = {
    $set: {
      description
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.setReadOnlyById = function (_id, readOnly) {
  const query = {
    _id
  };
  const update = {
    $set: {
      ro: readOnly
    }
  };

  if (readOnly) {
    RocketChat.models.Subscriptions.findByRoomId(_id).forEach(function (subscription) {
      if (subscription._user == null) {
        return;
      }

      const user = subscription._user;

      if (RocketChat.authz.hasPermission(user._id, 'post-readonly') === false) {
        if (!update.$set.muted) {
          update.$set.muted = [];
        }

        return update.$set.muted.push(user.username);
      }
    });
  } else {
    update.$unset = {
      muted: ''
    };
  }

  return this.update(query, update);
};

RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById = function (_id, allowReacting) {
  const query = {
    _id
  };
  const update = {
    $set: {
      reactWhenReadOnly: allowReacting
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.setSystemMessagesById = function (_id, systemMessages) {
  const query = {
    _id
  };
  const update = {
    $set: {
      sysMes: systemMessages
    }
  };
  return this.update(query, update);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/startup.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.models.Permissions.upsert('post-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner', 'moderator']
    }
  });
  RocketChat.models.Permissions.upsert('set-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner']
    }
  });
  RocketChat.models.Permissions.upsert('set-react-when-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner']
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveReactWhenReadOnly.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomType.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomTopic.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomCustomFields.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomAnnouncement.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomName.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomReadOnly.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomDescription.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomSystemMessages.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/methods/saveRoomSettings.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/startup.js");

/* Exports */
Package._define("rocketchat:channel-settings");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_channel-settings.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9mdW5jdGlvbnMvc2F2ZVJlYWN0V2hlblJlYWRPbmx5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tVG9waWMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tQ3VzdG9tRmllbGRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbUFubm91bmNlbWVudC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9mdW5jdGlvbnMvc2F2ZVJvb21OYW1lLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVJlYWRPbmx5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbURlc2NyaXB0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVN5c3RlbU1lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL21ldGhvZHMvc2F2ZVJvb21TZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9tb2RlbHMvTWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvbW9kZWxzL1Jvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL3N0YXJ0dXAuanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsInNhdmVSZWFjdFdoZW5SZWFkT25seSIsInJpZCIsImFsbG93UmVhY3QiLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJNZXRlb3IiLCJFcnJvciIsImZ1bmN0aW9uIiwibW9kZWxzIiwiUm9vbXMiLCJzZXRBbGxvd1JlYWN0aW5nV2hlblJlYWRPbmx5QnlJZCIsInNhdmVSb29tVHlwZSIsInJvb21UeXBlIiwidXNlciIsInNlbmRNZXNzYWdlIiwidHlwZSIsInJvb20iLCJmaW5kT25lQnlJZCIsIl9pZCIsInQiLCJyZXN1bHQiLCJzZXRUeXBlQnlJZCIsIlN1YnNjcmlwdGlvbnMiLCJ1cGRhdGVUeXBlQnlSb29tSWQiLCJtZXNzYWdlIiwiVEFQaTE4biIsIl9fIiwibG5nIiwibGFuZ3VhZ2UiLCJzZXR0aW5ncyIsImdldCIsIk1lc3NhZ2VzIiwiY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJzIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJzYXZlUm9vbVRvcGljIiwicm9vbVRvcGljIiwiZXNjYXBlSFRNTCIsInVwZGF0ZSIsInNldFRvcGljQnlJZCIsInNhdmVSb29tQ3VzdG9tRmllbGRzIiwicm9vbUN1c3RvbUZpZWxkcyIsIk9iamVjdCIsInJldCIsInNldEN1c3RvbUZpZWxkc0J5SWQiLCJ1cGRhdGVDdXN0b21GaWVsZHNCeVJvb21JZCIsInNhdmVSb29tQW5ub3VuY2VtZW50Iiwicm9vbUFubm91bmNlbWVudCIsImFubm91bmNlbWVudERldGFpbHMiLCJlc2NhcGVkTWVzc2FnZSIsInVwZGF0ZWQiLCJzZXRBbm5vdW5jZW1lbnRCeUlkIiwic2F2ZVJvb21OYW1lIiwiZGlzcGxheU5hbWUiLCJyb29tVHlwZXMiLCJwcmV2ZW50UmVuYW1pbmciLCJuYW1lIiwic2x1Z2lmaWVkUm9vbU5hbWUiLCJnZXRWYWxpZFJvb21OYW1lIiwic2V0TmFtZUJ5SWQiLCJ1cGRhdGVOYW1lQW5kQWxlcnRCeVJvb21JZCIsImNyZWF0ZVJvb21SZW5hbWVkV2l0aFJvb21JZFJvb21OYW1lQW5kVXNlciIsInNhdmVSb29tUmVhZE9ubHkiLCJyZWFkT25seSIsInNldFJlYWRPbmx5QnlJZCIsInNhdmVSb29tRGVzY3JpcHRpb24iLCJyb29tRGVzY3JpcHRpb24iLCJlc2NhcGVkUm9vbURlc2NyaXB0aW9uIiwic2V0RGVzY3JpcHRpb25CeUlkIiwic2F2ZVJvb21TeXN0ZW1NZXNzYWdlcyIsInN5c3RlbU1lc3NhZ2VzIiwic2V0U3lzdGVtTWVzc2FnZXNCeUlkIiwiZmllbGRzIiwibWV0aG9kcyIsInNhdmVSb29tU2V0dGluZ3MiLCJ2YWx1ZSIsInVzZXJJZCIsIm1ldGhvZCIsImtleXMiLCJldmVyeSIsImtleSIsImluY2x1ZGVzIiwiYXV0aHoiLCJoYXNQZXJtaXNzaW9uIiwiYWN0aW9uIiwiYnJvYWRjYXN0IiwicmVhY3RXaGVuUmVhZE9ubHkiLCJmb3JFYWNoIiwic2V0dGluZyIsInRvcGljIiwiYW5ub3VuY2VtZW50IiwiY3VzdG9tRmllbGRzIiwiZGVzY3JpcHRpb24iLCJjaGVjayIsInRva2VucyIsInRva2VuIiwiYmFsYW5jZSIsInNhdmVSb29tVG9rZW5wYXNzIiwic2F2ZVN0cmVhbWluZ09wdGlvbnMiLCJybyIsInN5c01lcyIsInNldEpvaW5Db2RlQnlJZCIsInNhdmVEZWZhdWx0QnlJZCIsInJvb21JZCIsImV4dHJhRGF0YSIsImNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJyb29tTmFtZSIsInF1ZXJ5IiwiJHNldCIsImZpbmRCeVJvb21JZCIsInN1YnNjcmlwdGlvbiIsIl91c2VyIiwibXV0ZWQiLCJwdXNoIiwidXNlcm5hbWUiLCIkdW5zZXQiLCJhbGxvd1JlYWN0aW5nIiwic3RhcnR1cCIsIlBlcm1pc3Npb25zIiwidXBzZXJ0IiwiJHNldE9uSW5zZXJ0Iiwicm9sZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MscUJBQVgsR0FBbUMsVUFBU0MsR0FBVCxFQUFjQyxVQUFkLEVBQTBCO0FBQzVELE1BQUksQ0FBQ0MsTUFBTUMsSUFBTixDQUFXSCxHQUFYLEVBQWdCSSxNQUFoQixDQUFMLEVBQThCO0FBQzdCLFVBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixjQUFqQixFQUFpQyxjQUFqQyxFQUFpRDtBQUFFQyxnQkFBVTtBQUFaLEtBQWpELENBQU47QUFDQTs7QUFFRCxTQUFPVCxXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsZ0NBQXhCLENBQXlEVixHQUF6RCxFQUE4REMsVUFBOUQsQ0FBUDtBQUNBLENBTkQsQzs7Ozs7Ozs7Ozs7QUNDQUgsV0FBV2EsWUFBWCxHQUEwQixVQUFTWCxHQUFULEVBQWNZLFFBQWQsRUFBd0JDLElBQXhCLEVBQThCQyxjQUFjLElBQTVDLEVBQWtEO0FBQzNFLE1BQUksQ0FBQ1osTUFBTUMsSUFBTixDQUFXSCxHQUFYLEVBQWdCSSxNQUFoQixDQUFMLEVBQThCO0FBQzdCLFVBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixjQUFqQixFQUFpQyxjQUFqQyxFQUFpRDtBQUN0RCxrQkFBWTtBQUQwQyxLQUFqRCxDQUFOO0FBR0E7O0FBQ0QsTUFBSU0sYUFBYSxHQUFiLElBQW9CQSxhQUFhLEdBQXJDLEVBQTBDO0FBQ3pDLFVBQU0sSUFB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QyxjQUFyQyxFQUFxRDtBQUFDQyxrQkFBYztBQUFFQyxhQUFPLENBQUMsT0FBRCxFQUFVLE9BQVY7QUFBVDtBQUFmLEdBQXJEO0FBQ0EvSCxhQUFXVSxNQUFYLENBQWtCa0gsV0FBbEIsQ0FBOEJDLE1BQTlCLENBQXFDLHlCQUFyQyxFQUFnRTtBQUFDQyxrQkFBYztBQUFFQyxhQUFPLENBQUMsT0FBRCxFQUFVLE9BQVY7QUFBVDtBQUFmLEdBQWhFO0FBQ0EsQ0FKRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2NoYW5uZWwtc2V0dGluZ3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyJSb2NrZXRDaGF0LnNhdmVSZWFjdFdoZW5SZWFkT25seSA9IGZ1bmN0aW9uKHJpZCwgYWxsb3dSZWFjdCkge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHsgZnVuY3Rpb246ICdSb2NrZXRDaGF0LnNhdmVSZWFjdFdoZW5SZWFkT25seScgfSk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0QWxsb3dSZWFjdGluZ1doZW5SZWFkT25seUJ5SWQocmlkLCBhbGxvd1JlYWN0KTtcbn07XG4iLCJcblJvY2tldENoYXQuc2F2ZVJvb21UeXBlID0gZnVuY3Rpb24ocmlkLCByb29tVHlwZSwgdXNlciwgc2VuZE1lc3NhZ2UgPSB0cnVlKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21UeXBlJ1xuXHRcdH0pO1xuXHR9XG5cdGlmIChyb29tVHlwZSAhPT0gJ2MnICYmIHJvb21UeXBlICE9PSAncCcpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20tdHlwZScsICdlcnJvci1pbnZhbGlkLXJvb20tdHlwZScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tVHlwZScsXG5cdFx0XHR0eXBlOiByb29tVHlwZVxuXHRcdH0pO1xuXHR9XG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyaWQpO1xuXHRpZiAocm9vbSA9PSBudWxsKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ2Vycm9yLWludmFsaWQtcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tVHlwZScsXG5cdFx0XHRfaWQ6IHJpZFxuXHRcdH0pO1xuXHR9XG5cdGlmIChyb29tLnQgPT09ICdkJykge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWRpcmVjdC1yb29tJywgJ0NhblxcJ3QgY2hhbmdlIHR5cGUgb2YgZGlyZWN0IHJvb21zJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21UeXBlJ1xuXHRcdH0pO1xuXHR9XG5cdGNvbnN0IHJlc3VsdCA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFR5cGVCeUlkKHJpZCwgcm9vbVR5cGUpICYmIFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlVHlwZUJ5Um9vbUlkKHJpZCwgcm9vbVR5cGUpO1xuXHRpZiAocmVzdWx0ICYmIHNlbmRNZXNzYWdlKSB7XG5cdFx0bGV0IG1lc3NhZ2U7XG5cdFx0aWYgKHJvb21UeXBlID09PSAnYycpIHtcblx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdDaGFubmVsJywge1xuXHRcdFx0XHRsbmc6IHVzZXIgJiYgdXNlci5sYW5ndWFnZSB8fCBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnbGFuZ3VhZ2UnKSB8fCAnZW4nXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWVzc2FnZSA9IFRBUGkxOG4uX18oJ1ByaXZhdGVfR3JvdXAnLCB7XG5cdFx0XHRcdGxuZzogdXNlciAmJiB1c2VyLmxhbmd1YWdlIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbidcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncm9vbV9jaGFuZ2VkX3ByaXZhY3knLCByaWQsIG1lc3NhZ2UsIHVzZXIpO1xuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59O1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5Sb2NrZXRDaGF0LnNhdmVSb29tVG9waWMgPSBmdW5jdGlvbihyaWQsIHJvb21Ub3BpYywgdXNlciwgc2VuZE1lc3NhZ2UgPSB0cnVlKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21Ub3BpYydcblx0XHR9KTtcblx0fVxuXHRyb29tVG9waWMgPSBzLmVzY2FwZUhUTUwocm9vbVRvcGljKTtcblx0Y29uc3QgdXBkYXRlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0VG9waWNCeUlkKHJpZCwgcm9vbVRvcGljKTtcblx0aWYgKHVwZGF0ZSAmJiBzZW5kTWVzc2FnZSkge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21TZXR0aW5nc0NoYW5nZWRXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdyb29tX2NoYW5nZWRfdG9waWMnLCByaWQsIHJvb21Ub3BpYywgdXNlcik7XG5cdH1cblx0cmV0dXJuIHVwZGF0ZTtcbn07XG4iLCJSb2NrZXRDaGF0LnNhdmVSb29tQ3VzdG9tRmllbGRzID0gZnVuY3Rpb24ocmlkLCByb29tQ3VzdG9tRmllbGRzKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21DdXN0b21GaWVsZHMnXG5cdFx0fSk7XG5cdH1cblx0aWYgKCFNYXRjaC50ZXN0KHJvb21DdXN0b21GaWVsZHMsIE9iamVjdCkpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb21DdXN0b21GaWVsZHMtdHlwZScsICdJbnZhbGlkIHJvb21DdXN0b21GaWVsZHMgdHlwZScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tQ3VzdG9tRmllbGRzJ1xuXHRcdH0pO1xuXHR9XG5cdGNvbnN0IHJldCA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldEN1c3RvbUZpZWxkc0J5SWQocmlkLCByb29tQ3VzdG9tRmllbGRzKTtcblxuXHQvLyBVcGRhdGUgY3VzdG9tRmllbGRzIG9mIGFueSB1c2VyJ3MgU3Vic2NyaXB0aW9uIHJlbGF0ZWQgd2l0aCB0aGlzIHJpZFxuXHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUN1c3RvbUZpZWxkc0J5Um9vbUlkKHJpZCwgcm9vbUN1c3RvbUZpZWxkcyk7XG5cblx0cmV0dXJuIHJldDtcbn07XG4iLCJpbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cblJvY2tldENoYXQuc2F2ZVJvb21Bbm5vdW5jZW1lbnQgPSBmdW5jdGlvbihyaWQsIHJvb21Bbm5vdW5jZW1lbnQsIHVzZXIsIHNlbmRNZXNzYWdlPXRydWUpIHtcblx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IGZ1bmN0aW9uOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbUFubm91bmNlbWVudCcgfSk7XG5cdH1cblxuXHRsZXQgbWVzc2FnZTtcblx0bGV0IGFubm91bmNlbWVudERldGFpbHM7XG5cdGlmICh0eXBlb2Ygcm9vbUFubm91bmNlbWVudCA9PT0gJ3N0cmluZycpIHtcblx0XHRtZXNzYWdlID0gcm9vbUFubm91bmNlbWVudDtcblx0fSBlbHNlIHtcblx0XHQoe21lc3NhZ2UsIC4uLmFubm91bmNlbWVudERldGFpbHN9ID0gcm9vbUFubm91bmNlbWVudCk7XG5cdH1cblxuXHRjb25zdCBlc2NhcGVkTWVzc2FnZSA9IHMuZXNjYXBlSFRNTChtZXNzYWdlKTtcblxuXHRjb25zdCB1cGRhdGVkID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0QW5ub3VuY2VtZW50QnlJZChyaWQsIGVzY2FwZWRNZXNzYWdlLCBhbm5vdW5jZW1lbnREZXRhaWxzKTtcblx0aWYgKHVwZGF0ZWQgJiYgc2VuZE1lc3NhZ2UpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncm9vbV9jaGFuZ2VkX2Fubm91bmNlbWVudCcsIHJpZCwgZXNjYXBlZE1lc3NhZ2UsIHVzZXIpO1xuXHR9XG5cblx0cmV0dXJuIHVwZGF0ZWQ7XG59O1xuIiwiXG5Sb2NrZXRDaGF0LnNhdmVSb29tTmFtZSA9IGZ1bmN0aW9uKHJpZCwgZGlzcGxheU5hbWUsIHVzZXIsIHNlbmRNZXNzYWdlID0gdHJ1ZSkge1xuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKTtcblx0aWYgKFJvY2tldENoYXQucm9vbVR5cGVzLnJvb21UeXBlc1tyb29tLnRdLnByZXZlbnRSZW5hbWluZygpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbWRpc3BsYXlOYW1lJ1xuXHRcdH0pO1xuXHR9XG5cdGlmIChkaXNwbGF5TmFtZSA9PT0gcm9vbS5uYW1lKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3Qgc2x1Z2lmaWVkUm9vbU5hbWUgPSBSb2NrZXRDaGF0LmdldFZhbGlkUm9vbU5hbWUoZGlzcGxheU5hbWUsIHJpZCk7XG5cblx0Y29uc3QgdXBkYXRlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0TmFtZUJ5SWQocmlkLCBzbHVnaWZpZWRSb29tTmFtZSwgZGlzcGxheU5hbWUpICYmIFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlTmFtZUFuZEFsZXJ0QnlSb29tSWQocmlkLCBzbHVnaWZpZWRSb29tTmFtZSwgZGlzcGxheU5hbWUpO1xuXG5cdGlmICh1cGRhdGUgJiYgc2VuZE1lc3NhZ2UpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tUmVuYW1lZFdpdGhSb29tSWRSb29tTmFtZUFuZFVzZXIocmlkLCBkaXNwbGF5TmFtZSwgdXNlcik7XG5cdH1cblx0cmV0dXJuIGRpc3BsYXlOYW1lO1xufTtcbiIsIlJvY2tldENoYXQuc2F2ZVJvb21SZWFkT25seSA9IGZ1bmN0aW9uKHJpZCwgcmVhZE9ubHkpIHtcblx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVJlYWRPbmx5J1xuXHRcdH0pO1xuXHR9XG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRSZWFkT25seUJ5SWQocmlkLCByZWFkT25seSk7XG59O1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5Sb2NrZXRDaGF0LnNhdmVSb29tRGVzY3JpcHRpb24gPSBmdW5jdGlvbihyaWQsIHJvb21EZXNjcmlwdGlvbiwgdXNlcikge1xuXG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21EZXNjcmlwdGlvbidcblx0XHR9KTtcblx0fVxuXHRjb25zdCBlc2NhcGVkUm9vbURlc2NyaXB0aW9uID0gcy5lc2NhcGVIVE1MKHJvb21EZXNjcmlwdGlvbik7XG5cdGNvbnN0IHVwZGF0ZSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldERlc2NyaXB0aW9uQnlJZChyaWQsIGVzY2FwZWRSb29tRGVzY3JpcHRpb24pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncm9vbV9jaGFuZ2VkX2Rlc2NyaXB0aW9uJywgcmlkLCBlc2NhcGVkUm9vbURlc2NyaXB0aW9uLCB1c2VyKTtcblx0cmV0dXJuIHVwZGF0ZTtcbn07XG4iLCJSb2NrZXRDaGF0LnNhdmVSb29tU3lzdGVtTWVzc2FnZXMgPSBmdW5jdGlvbihyaWQsIHN5c3RlbU1lc3NhZ2VzKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21TeXN0ZW1NZXNzYWdlcydcblx0XHR9KTtcblx0fVxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0U3lzdGVtTWVzc2FnZXNCeUlkKHJpZCwgc3lzdGVtTWVzc2FnZXMpO1xufTtcbiIsImNvbnN0IGZpZWxkcyA9IFsncm9vbU5hbWUnLCAncm9vbVRvcGljJywgJ3Jvb21Bbm5vdW5jZW1lbnQnLCAncm9vbUN1c3RvbUZpZWxkcycsICdyb29tRGVzY3JpcHRpb24nLCAncm9vbVR5cGUnLCAncmVhZE9ubHknLCAncmVhY3RXaGVuUmVhZE9ubHknLCAnc3lzdGVtTWVzc2FnZXMnLCAnZGVmYXVsdCcsICdqb2luQ29kZScsICd0b2tlbnBhc3MnLCAnc3RyZWFtaW5nT3B0aW9ucyddO1xuTWV0ZW9yLm1ldGhvZHMoe1xuXHRzYXZlUm9vbVNldHRpbmdzKHJpZCwgc2V0dGluZ3MsIHZhbHVlKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tTmFtZSdcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0XHRtZXRob2Q6ICdzYXZlUm9vbVNldHRpbmdzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBzZXR0aW5ncyAhPT0gJ29iamVjdCcpIHtcblx0XHRcdHNldHRpbmdzID0ge1xuXHRcdFx0XHRbc2V0dGluZ3NdIDogdmFsdWVcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKCFPYmplY3Qua2V5cyhzZXR0aW5ncykuZXZlcnkoa2V5ID0+IGZpZWxkcy5pbmNsdWRlcyhrZXkpKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1zZXR0aW5ncycsICdJbnZhbGlkIHNldHRpbmdzIHByb3ZpZGVkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdzYXZlUm9vbVNldHRpbmdzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnZWRpdC1yb29tJywgcmlkKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0VkaXRpbmcgcm9vbSBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncycsXG5cdFx0XHRcdGFjdGlvbjogJ0VkaXRpbmdfcm9vbSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyaWQpO1xuXG5cdFx0aWYgKHJvb20uYnJvYWRjYXN0ICYmIChzZXR0aW5ncy5yZWFkT25seSB8fCBzZXR0aW5ncy5yZWFjdFdoZW5SZWFkT25seSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdFZGl0aW5nIHJlYWRPbmx5L3JlYWN0V2hlblJlYWRPbmx5IGFyZSBub3QgYWxsb3dlZCBmb3IgYnJvYWRjYXN0IHJvb21zJywge1xuXHRcdFx0XHRtZXRob2Q6ICdzYXZlUm9vbVNldHRpbmdzJyxcblx0XHRcdFx0YWN0aW9uOiAnRWRpdGluZ19yb29tJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0XHRtZXRob2Q6ICdzYXZlUm9vbVNldHRpbmdzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRPYmplY3Qua2V5cyhzZXR0aW5ncykuZm9yRWFjaChzZXR0aW5nID0+IHtcblx0XHRcdGNvbnN0IHZhbHVlID0gc2V0dGluZ3Nbc2V0dGluZ107XG5cdFx0XHRpZiAoc2V0dGluZ3MgPT09ICdkZWZhdWx0JyAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1yb29tLWFkbWluaXN0cmF0aW9uJykpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ1ZpZXdpbmcgcm9vbSBhZG1pbmlzdHJhdGlvbiBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0XHRtZXRob2Q6ICdzYXZlUm9vbVNldHRpbmdzJyxcblx0XHRcdFx0XHRhY3Rpb246ICdWaWV3aW5nX3Jvb21fYWRtaW5pc3RyYXRpb24nXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNldHRpbmcgPT09ICdyb29tVHlwZScgJiYgdmFsdWUgIT09IHJvb20udCAmJiB2YWx1ZSA9PT0gJ2MnICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdjcmVhdGUtYycpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdDaGFuZ2luZyBhIHByaXZhdGUgZ3JvdXAgdG8gYSBwdWJsaWMgY2hhbm5lbCBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0XHRtZXRob2Q6ICdzYXZlUm9vbVNldHRpbmdzJyxcblx0XHRcdFx0XHRhY3Rpb246ICdDaGFuZ2VfUm9vbV9UeXBlJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGlmIChzZXR0aW5nID09PSAncm9vbVR5cGUnICYmIHZhbHVlICE9PSByb29tLnQgJiYgdmFsdWUgPT09ICdwJyAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnY3JlYXRlLXAnKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQ2hhbmdpbmcgYSBwdWJsaWMgY2hhbm5lbCB0byBhIHByaXZhdGUgcm9vbSBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0XHRtZXRob2Q6ICdzYXZlUm9vbVNldHRpbmdzJyxcblx0XHRcdFx0XHRhY3Rpb246ICdDaGFuZ2VfUm9vbV9UeXBlJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdE9iamVjdC5rZXlzKHNldHRpbmdzKS5mb3JFYWNoKHNldHRpbmcgPT4ge1xuXHRcdFx0Y29uc3QgdmFsdWUgPSBzZXR0aW5nc1tzZXR0aW5nXTtcblx0XHRcdHN3aXRjaCAoc2V0dGluZykge1xuXHRcdFx0XHRjYXNlICdyb29tTmFtZSc6XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbU5hbWUocmlkLCB2YWx1ZSwgdXNlcik7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3Jvb21Ub3BpYyc6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLnRvcGljKSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tVG9waWMocmlkLCB2YWx1ZSwgdXNlcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyb29tQW5ub3VuY2VtZW50Jzpcblx0XHRcdFx0XHRpZiAodmFsdWUgIT09IHJvb20uYW5ub3VuY2VtZW50KSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tQW5ub3VuY2VtZW50KHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncm9vbUN1c3RvbUZpZWxkcyc6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLmN1c3RvbUZpZWxkcykge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbUN1c3RvbUZpZWxkcyhyaWQsIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3Jvb21EZXNjcmlwdGlvbic6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLmRlc2NyaXB0aW9uKSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tRGVzY3JpcHRpb24ocmlkLCB2YWx1ZSwgdXNlcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyb29tVHlwZSc6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLnQpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21UeXBlKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndG9rZW5wYXNzJzpcblx0XHRcdFx0XHRjaGVjayh2YWx1ZSwge1xuXHRcdFx0XHRcdFx0cmVxdWlyZTogU3RyaW5nLFxuXHRcdFx0XHRcdFx0dG9rZW5zOiBbe1xuXHRcdFx0XHRcdFx0XHR0b2tlbjogU3RyaW5nLFxuXHRcdFx0XHRcdFx0XHRiYWxhbmNlOiBTdHJpbmdcblx0XHRcdFx0XHRcdH1dXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVRva2VucGFzcyhyaWQsIHZhbHVlKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnc3RyZWFtaW5nT3B0aW9ucyc6XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlU3RyZWFtaW5nT3B0aW9ucyhyaWQsIHZhbHVlKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncmVhZE9ubHknOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5ybykge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVJlYWRPbmx5KHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncmVhY3RXaGVuUmVhZE9ubHknOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5yZWFjdFdoZW5SZWFkT25seSkge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUmVhY3RXaGVuUmVhZE9ubHkocmlkLCB2YWx1ZSwgdXNlcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdzeXN0ZW1NZXNzYWdlcyc6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLnN5c01lcykge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVN5c3RlbU1lc3NhZ2VzKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnam9pbkNvZGUnOlxuXHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldEpvaW5Db2RlQnlJZChyaWQsIFN0cmluZyh2YWx1ZSkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdkZWZhdWx0Jzpcblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zYXZlRGVmYXVsdEJ5SWQocmlkLCB2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdWx0OiB0cnVlLFxuXHRcdFx0cmlkOiByb29tLl9pZFxuXHRcdH07XG5cdH1cbn0pO1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIgPSBmdW5jdGlvbih0eXBlLCByb29tSWQsIG1lc3NhZ2UsIHVzZXIsIGV4dHJhRGF0YSkge1xuXHRyZXR1cm4gdGhpcy5jcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKHR5cGUsIHJvb21JZCwgbWVzc2FnZSwgdXNlciwgZXh0cmFEYXRhKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21SZW5hbWVkV2l0aFJvb21JZFJvb21OYW1lQW5kVXNlciA9IGZ1bmN0aW9uKHJvb21JZCwgcm9vbU5hbWUsIHVzZXIsIGV4dHJhRGF0YSkge1xuXHRyZXR1cm4gdGhpcy5jcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdyJywgcm9vbUlkLCByb29tTmFtZSwgdXNlciwgZXh0cmFEYXRhKTtcbn07XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXREZXNjcmlwdGlvbkJ5SWQgPSBmdW5jdGlvbihfaWQsIGRlc2NyaXB0aW9uKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0ZGVzY3JpcHRpb25cblx0XHR9XG5cdH07XG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFJlYWRPbmx5QnlJZCA9IGZ1bmN0aW9uKF9pZCwgcmVhZE9ubHkpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRybzogcmVhZE9ubHlcblx0XHR9XG5cdH07XG5cdGlmIChyZWFkT25seSkge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEJ5Um9vbUlkKF9pZCkuZm9yRWFjaChmdW5jdGlvbihzdWJzY3JpcHRpb24pIHtcblx0XHRcdGlmIChzdWJzY3JpcHRpb24uX3VzZXIgPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zdCB1c2VyID0gc3Vic2NyaXB0aW9uLl91c2VyO1xuXHRcdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VyLl9pZCwgJ3Bvc3QtcmVhZG9ubHknKSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0aWYgKCF1cGRhdGUuJHNldC5tdXRlZCkge1xuXHRcdFx0XHRcdHVwZGF0ZS4kc2V0Lm11dGVkID0gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHVwZGF0ZS4kc2V0Lm11dGVkLnB1c2godXNlci51c2VybmFtZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0dXBkYXRlLiR1bnNldCA9IHtcblx0XHRcdG11dGVkOiAnJ1xuXHRcdH07XG5cdH1cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0QWxsb3dSZWFjdGluZ1doZW5SZWFkT25seUJ5SWQgPSBmdW5jdGlvbihfaWQsIGFsbG93UmVhY3RpbmcpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRyZWFjdFdoZW5SZWFkT25seTogYWxsb3dSZWFjdGluZ1xuXHRcdH1cblx0fTtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0U3lzdGVtTWVzc2FnZXNCeUlkID0gZnVuY3Rpb24oX2lkLCBzeXN0ZW1NZXNzYWdlcykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdHN5c01lczogc3lzdGVtTWVzc2FnZXNcblx0XHR9XG5cdH07XG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KCdwb3N0LXJlYWRvbmx5JywgeyRzZXRPbkluc2VydDogeyByb2xlczogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9IH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy51cHNlcnQoJ3NldC1yZWFkb25seScsIHskc2V0T25JbnNlcnQ6IHsgcm9sZXM6IFsnYWRtaW4nLCAnb3duZXInXSB9IH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy51cHNlcnQoJ3NldC1yZWFjdC13aGVuLXJlYWRvbmx5JywgeyRzZXRPbkluc2VydDogeyByb2xlczogWydhZG1pbicsICdvd25lciddIH19KTtcbn0pO1xuIl19
