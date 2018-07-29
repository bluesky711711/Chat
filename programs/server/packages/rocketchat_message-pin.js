(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:message-pin":{"server":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_message-pin/server/settings.js                                              //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor.startup(function () {
  RocketChat.settings.add('Message_AllowPinning', true, {
    type: 'boolean',
    group: 'Message',
    'public': true
  });
  return RocketChat.models.Permissions.upsert('pin-message', {
    $setOnInsert: {
      roles: ['owner', 'moderator', 'admin']
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

},"pinMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_message-pin/server/pinMessage.js                                            //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
const recursiveRemove = (msg, deep = 1) => {
  if (!msg) {
    return;
  }

  if (deep > RocketChat.settings.get('Message_QuoteChainLimit')) {
    delete msg.attachments;
    return msg;
  }

  msg.attachments = Array.isArray(msg.attachments) ? msg.attachments.map(nestedMsg => recursiveRemove(nestedMsg, deep + 1)) : null;
  return msg;
};

const shouldAdd = (attachments, attachment) => !attachments.some(({
  message_link
}) => message_link && message_link === attachment.message_link);

Meteor.methods({
  pinMessage(message, pinnedAt) {
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'pinMessage'
      });
    }

    if (!RocketChat.settings.get('Message_AllowPinning')) {
      throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
        method: 'pinMessage',
        action: 'Message_pinning'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(message.rid);

    if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
      return false;
    }

    let originalMessage = RocketChat.models.Messages.findOneById(message._id);

    if (originalMessage == null || originalMessage._id == null) {
      throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
        method: 'pinMessage',
        action: 'Message_pinning'
      });
    } //If we keep history of edits, insert a new message to store history information


    if (RocketChat.settings.get('Message_KeepHistory')) {
      RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
    }

    const me = RocketChat.models.Users.findOneById(userId);
    originalMessage.pinned = true;
    originalMessage.pinnedAt = pinnedAt || Date.now;
    originalMessage.pinnedBy = {
      _id: userId,
      username: me.username
    };
    originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);
    RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
    const attachments = [];

    if (Array.isArray(originalMessage.attachments)) {
      originalMessage.attachments.forEach(attachment => {
        if (!attachment.message_link || shouldAdd(attachments, attachment)) {
          attachments.push(attachment);
        }
      });
    }

    return RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_pinned', originalMessage.rid, '', me, {
      attachments: [{
        text: originalMessage.msg,
        author_name: originalMessage.u.username,
        author_icon: getAvatarUrlFromUsername(originalMessage.u.username),
        ts: originalMessage.ts,
        attachments: recursiveRemove(attachments)
      }]
    });
  },

  unpinMessage(message) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'unpinMessage'
      });
    }

    if (!RocketChat.settings.get('Message_AllowPinning')) {
      throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
        method: 'unpinMessage',
        action: 'Message_pinning'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(message.rid);

    if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
      return false;
    }

    let originalMessage = RocketChat.models.Messages.findOneById(message._id);

    if (originalMessage == null || originalMessage._id == null) {
      throw new Meteor.Error('error-invalid-message', 'Message you are unpinning was not found', {
        method: 'unpinMessage',
        action: 'Message_pinning'
      });
    } //If we keep history of edits, insert a new message to store history information


    if (RocketChat.settings.get('Message_KeepHistory')) {
      RocketChat.models.Messages.cloneAndSaveAsHistoryById(originalMessage._id);
    }

    const me = RocketChat.models.Users.findOneById(Meteor.userId());
    originalMessage.pinned = false;
    originalMessage.pinnedBy = {
      _id: Meteor.userId(),
      username: me.username
    };
    originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);
    return RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"pinnedMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_message-pin/server/publications/pinnedMessages.js                           //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor.publish('pinnedMessages', function (rid, limit = 50) {
  if (!this.userId) {
    return this.ready();
  }

  const publication = this;
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (!user) {
    return this.ready();
  }

  const cursorHandle = RocketChat.models.Messages.findPinnedByRoom(rid, {
    sort: {
      ts: -1
    },
    limit
  }).observeChanges({
    added(_id, record) {
      return publication.added('rocketchat_pinned_message', _id, record);
    },

    changed(_id, record) {
      return publication.changed('rocketchat_pinned_message', _id, record);
    },

    removed(_id) {
      return publication.removed('rocketchat_pinned_message', _id);
    }

  });
  this.ready();
  return this.onStop(function () {
    return cursorHandle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"indexes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_message-pin/server/startup/indexes.js                                       //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor.startup(function () {
  return Meteor.defer(function () {
    return RocketChat.models.Messages.tryEnsureIndex({
      'pinnedBy._id': 1
    }, {
      sparse: 1
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:message-pin/server/settings.js");
require("/node_modules/meteor/rocketchat:message-pin/server/pinMessage.js");
require("/node_modules/meteor/rocketchat:message-pin/server/publications/pinnedMessages.js");
require("/node_modules/meteor/rocketchat:message-pin/server/startup/indexes.js");

/* Exports */
Package._define("rocketchat:message-pin");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_message-pin.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLXBpbi9zZXJ2ZXIvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1waW4vc2VydmVyL3Bpbk1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1waW4vc2VydmVyL3B1YmxpY2F0aW9ucy9waW5uZWRNZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLXBpbi9zZXJ2ZXIvc3RhcnR1cC9pbmRleGVzLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGQiLCJ0eXBlIiwiZ3JvdXAiLCJtb2RlbHMiLCJQZXJtaXNzaW9ucyIsInVwc2VydCIsIiRzZXRPbkluc2VydCIsInJvbGVzIiwicmVjdXJzaXZlUmVtb3ZlIiwibXNnIiwiZGVlcCIsImdldCIsImF0dGFjaG1lbnRzIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwibmVzdGVkTXNnIiwic2hvdWxkQWRkIiwiYXR0YWNobWVudCIsInNvbWUiLCJtZXNzYWdlX2xpbmsiLCJtZXRob2RzIiwicGluTWVzc2FnZSIsIm1lc3NhZ2UiLCJwaW5uZWRBdCIsInVzZXJJZCIsIkVycm9yIiwibWV0aG9kIiwiYWN0aW9uIiwicm9vbSIsIlJvb21zIiwiZmluZE9uZUJ5SWQiLCJyaWQiLCJ1c2VybmFtZXMiLCJpbmRleE9mIiwidXNlciIsInVzZXJuYW1lIiwib3JpZ2luYWxNZXNzYWdlIiwiTWVzc2FnZXMiLCJfaWQiLCJjbG9uZUFuZFNhdmVBc0hpc3RvcnlCeUlkIiwibWUiLCJVc2VycyIsInBpbm5lZCIsIkRhdGUiLCJub3ciLCJwaW5uZWRCeSIsImNhbGxiYWNrcyIsInJ1biIsInNldFBpbm5lZEJ5SWRBbmRVc2VySWQiLCJmb3JFYWNoIiwicHVzaCIsImNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJ0ZXh0IiwiYXV0aG9yX25hbWUiLCJ1IiwiYXV0aG9yX2ljb24iLCJnZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUiLCJ0cyIsInVucGluTWVzc2FnZSIsInB1Ymxpc2giLCJsaW1pdCIsInJlYWR5IiwicHVibGljYXRpb24iLCJjdXJzb3JIYW5kbGUiLCJmaW5kUGlubmVkQnlSb29tIiwic29ydCIsIm9ic2VydmVDaGFuZ2VzIiwiYWRkZWQiLCJyZWNvcmQiLCJjaGFuZ2VkIiwicmVtb3ZlZCIsIm9uU3RvcCIsInN0b3AiLCJkZWZlciIsInRyeUVuc3VyZUluZGV4Iiwic3BhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsT0FBUCxDQUFlLFlBQVc7QUFDekJDLGFBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHNCQUF4QixFQUFnRCxJQUFoRCxFQUFzRDtBQUNyREMsVUFBTSxTQUQrQztBQUVyREMsV0FBTyxTQUY4QztBQUdyRCxjQUFVO0FBSDJDLEdBQXREO0FBS0EsU0FBT0osV0FBV0ssTUFBWCxDQUFrQkMsV0FBbEIsQ0FBOEJDLE1BQTlCLENBQXFDLGFBQXJDLEVBQW9EO0FBQzFEQyxrQkFBYztBQUNiQyxhQUFPLENBQUMsT0FBRCxFQUFVLFdBQVYsRUFBdUIsT0FBdkI7QUFETTtBQUQ0QyxHQUFwRCxDQUFQO0FBS0EsQ0FYRCxFOzs7Ozs7Ozs7OztBQ0FBLE1BQU1DLGtCQUFrQixDQUFDQyxHQUFELEVBQU1DLE9BQU8sQ0FBYixLQUFtQjtBQUMxQyxNQUFJLENBQUNELEdBQUwsRUFBVTtBQUNUO0FBQ0E7O0FBRUQsTUFBSUMsT0FBT1osV0FBV0MsUUFBWCxDQUFvQlksR0FBcEIsQ0FBd0IseUJBQXhCLENBQVgsRUFBK0Q7QUFDOUQsV0FBT0YsSUFBSUcsV0FBWDtBQUNBLFdBQU9ILEdBQVA7QUFDQTs7QUFFREEsTUFBSUcsV0FBSixHQUFrQkMs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MkJBQXBCLEVBQWlEaEMsR0FBakQsQ0FBUDtBQUNBOztBQVRnSCxHQUE3RixDQUFyQjtBQVdBLE9BQUt1QixLQUFMO0FBQ0EsU0FBTyxLQUFLVSxNQUFMLENBQVksWUFBVztBQUM3QixXQUFPUixhQUFhUyxJQUFiLEVBQVA7QUFDQSxHQUZNLENBQVA7QUFHQSxDQXpCRCxFOzs7Ozs7Ozs7OztBQ0FBN0UsT0FBT0MsT0FBUCxDQUFlLFlBQVc7QUFDekIsU0FBT0QsT0FBTzhFLEtBQVAsQ0FBYSxZQUFXO0FBQzlCLFdBQU81RSxXQUFXSyxNQUFYLENBQWtCbUMsUUFBbEIsQ0FBMkJxQyxjQUEzQixDQUEwQztBQUNoRCxzQkFBZ0I7QUFEZ0MsS0FBMUMsRUFFSjtBQUNGQyxjQUFRO0FBRE4sS0FGSSxDQUFQO0FBS0EsR0FOTSxDQUFQO0FBT0EsQ0FSRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X21lc3NhZ2UtcGluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNZXNzYWdlX0FsbG93UGlubmluZycsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHQncHVibGljJzogdHJ1ZVxuXHR9KTtcblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLnVwc2VydCgncGluLW1lc3NhZ2UnLCB7XG5cdFx0JHNldE9uSW5zZXJ0OiB7XG5cdFx0XHRyb2xlczogWydvd25lcicsICdtb2RlcmF0b3InLCAnYWRtaW4nXVxuXHRcdH1cblx0fSk7XG59KTtcbiIsImNvbnN0IHJlY3Vyc2l2ZVJlbW92ZSA9IChtc2csIGRlZXAgPSAxKSA9PiB7XG5cdGlmICghbXNnKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKGRlZXAgPiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWVzc2FnZV9RdW90ZUNoYWluTGltaXQnKSkge1xuXHRcdGRlbGV0ZSBtc2cuYXR0YWNobWVudHM7XG5cdFx0cmV0dXJuIG1zZztcblx0fVxuXG5cdG1zZy5hdHRhY2htZW50cyA9IEFycmF5LmlzQXJyYXkobXNnLmF0dGFjaG1lbnRzKSA/IG1zZy5hdHRhY2htZW50cy5tYXAoXG5cdFx0bmVzdGVkTXNnID0+IHJlY3Vyc2l2ZVJlbW92ZShuZXN0ZWRNc2csIGRlZXAgKyAxKVxuXHQpIDogbnVsbDtcblxuXHRyZXR1cm4gbXNnO1xufTtcblxuY29uc3Qgc2hvdWxkQWRkID0gKGF0dGFjaG1lbnRzLCBhdHRhY2htZW50KSA9PiAhYXR0YWNobWVudHMuc29tZSgoe21lc3NhZ2VfbGlua30pID0+IG1lc3NhZ2VfbGluayAmJiBtZXNzYWdlX2xpbmsgPT09IGF0dGFjaG1lbnQubWVzc2FnZV9saW5rKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRwaW5NZXNzYWdlKG1lc3NhZ2UsIHBpbm5lZEF0KSB7XG5cdFx0Y29uc3QgdXNlcklkID0gTWV0ZW9yLnVzZXJJZCgpO1xuXHRcdGlmICghdXNlcklkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHRtZXRob2Q6ICdwaW5NZXNzYWdlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWVzc2FnZV9BbGxvd1Bpbm5pbmcnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ01lc3NhZ2UgcGlubmluZyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAncGluTWVzc2FnZScsXG5cdFx0XHRcdGFjdGlvbjogJ01lc3NhZ2VfcGlubmluZydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChtZXNzYWdlLnJpZCk7XG5cdFx0aWYgKEFycmF5LmlzQXJyYXkocm9vbS51c2VybmFtZXMpICYmIHJvb20udXNlcm5hbWVzLmluZGV4T2YoTWV0ZW9yLnVzZXIoKS51c2VybmFtZSkgPT09IC0xKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0bGV0IG9yaWdpbmFsTWVzc2FnZSA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKG1lc3NhZ2UuX2lkKTtcblx0XHRpZiAob3JpZ2luYWxNZXNzYWdlID09IG51bGwgfHwgb3JpZ2luYWxNZXNzYWdlLl9pZCA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLW1lc3NhZ2UnLCAnTWVzc2FnZSB5b3UgYXJlIHBpbm5pbmcgd2FzIG5vdCBmb3VuZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAncGluTWVzc2FnZScsXG5cdFx0XHRcdGFjdGlvbjogJ01lc3NhZ2VfcGlubmluZydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vSWYgd2Uga2VlcCBoaXN0b3J5IG9mIGVkaXRzLCBpbnNlcnQgYSBuZXcgbWVzc2FnZSB0byBzdG9yZSBoaXN0b3J5IGluZm9ybWF0aW9uXG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0tlZXBIaXN0b3J5JykpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNsb25lQW5kU2F2ZUFzSGlzdG9yeUJ5SWQobWVzc2FnZS5faWQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblxuXHRcdG9yaWdpbmFsTWVzc2FnZS5waW5uZWQgPSB0cnVlO1xuXHRcdG9yaWdpbmFsTWVzc2FnZS5waW5uZWRBdCA9IHBpbm5lZEF0IHx8IERhdGUubm93O1xuXHRcdG9yaWdpbmFsTWVzc2FnZS5waW5uZWRCeSA9IHtcblx0XHRcdF9pZDogdXNlcklkLFxuXHRcdFx0dXNlcm5hbWU6IG1lLnVzZXJuYW1lXG5cdFx0fTtcblxuXHRcdG9yaWdpbmFsTWVzc2FnZSA9IFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignYmVmb3JlU2F2ZU1lc3NhZ2UnLCBvcmlnaW5hbE1lc3NhZ2UpO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0UGlubmVkQnlJZEFuZFVzZXJJZChvcmlnaW5hbE1lc3NhZ2UuX2lkLCBvcmlnaW5hbE1lc3NhZ2UucGlubmVkQnksIG9yaWdpbmFsTWVzc2FnZS5waW5uZWQpO1xuXG5cdFx0Y29uc3QgYXR0YWNobWVudHMgPSBbXTtcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KG9yaWdpbmFsTWVzc2FnZS5hdHRhY2htZW50cykpIHtcblx0XHRcdG9yaWdpbmFsTWVzc2FnZS5hdHRhY2htZW50cy5mb3JFYWNoKGF0dGFjaG1lbnQgPT4ge1xuXHRcdFx0XHRpZiAoIWF0dGFjaG1lbnQubWVzc2FnZV9saW5rIHx8IHNob3VsZEFkZChhdHRhY2htZW50cywgYXR0YWNobWVudCkpIHtcblx0XHRcdFx0XHRhdHRhY2htZW50cy5wdXNoKGF0dGFjaG1lbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcihcblx0XHRcdCdtZXNzYWdlX3Bpbm5lZCcsXG5cdFx0XHRvcmlnaW5hbE1lc3NhZ2UucmlkLFxuXHRcdFx0JycsXG5cdFx0XHRtZSxcblx0XHRcdHtcblx0XHRcdFx0YXR0YWNobWVudHM6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0ZXh0OiBvcmlnaW5hbE1lc3NhZ2UubXNnLFxuXHRcdFx0XHRcdFx0YXV0aG9yX25hbWU6IG9yaWdpbmFsTWVzc2FnZS51LnVzZXJuYW1lLFxuXHRcdFx0XHRcdFx0YXV0aG9yX2ljb246IGdldEF2YXRhclVybEZyb21Vc2VybmFtZShcblx0XHRcdFx0XHRcdFx0b3JpZ2luYWxNZXNzYWdlLnUudXNlcm5hbWVcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHR0czogb3JpZ2luYWxNZXNzYWdlLnRzLFxuXHRcdFx0XHRcdFx0YXR0YWNobWVudHM6IHJlY3Vyc2l2ZVJlbW92ZShhdHRhY2htZW50cylcblx0XHRcdFx0XHR9XG5cdFx0XHRcdF1cblx0XHRcdH1cblx0XHQpO1xuXHR9LFxuXHR1bnBpbk1lc3NhZ2UobWVzc2FnZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHRtZXRob2Q6ICd1bnBpbk1lc3NhZ2UnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93UGlubmluZycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnTWVzc2FnZSBwaW5uaW5nIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICd1bnBpbk1lc3NhZ2UnLFxuXHRcdFx0XHRhY3Rpb246ICdNZXNzYWdlX3Bpbm5pbmcnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQobWVzc2FnZS5yaWQpO1xuXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkocm9vbS51c2VybmFtZXMpICYmIHJvb20udXNlcm5hbWVzLmluZGV4T2YoTWV0ZW9yLnVzZXIoKS51c2VybmFtZSkgPT09IC0xKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0bGV0IG9yaWdpbmFsTWVzc2FnZSA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKG1lc3NhZ2UuX2lkKTtcblxuXHRcdGlmIChvcmlnaW5hbE1lc3NhZ2UgPT0gbnVsbCB8fCBvcmlnaW5hbE1lc3NhZ2UuX2lkID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtbWVzc2FnZScsICdNZXNzYWdlIHlvdSBhcmUgdW5waW5uaW5nIHdhcyBub3QgZm91bmQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3VucGluTWVzc2FnZScsXG5cdFx0XHRcdGFjdGlvbjogJ01lc3NhZ2VfcGlubmluZydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vSWYgd2Uga2VlcCBoaXN0b3J5IG9mIGVkaXRzLCBpbnNlcnQgYSBuZXcgbWVzc2FnZSB0byBzdG9yZSBoaXN0b3J5IGluZm9ybWF0aW9uXG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0tlZXBIaXN0b3J5JykpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNsb25lQW5kU2F2ZUFzSGlzdG9yeUJ5SWQob3JpZ2luYWxNZXNzYWdlLl9pZCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChNZXRlb3IudXNlcklkKCkpO1xuXHRcdG9yaWdpbmFsTWVzc2FnZS5waW5uZWQgPSBmYWxzZTtcblx0XHRvcmlnaW5hbE1lc3NhZ2UucGlubmVkQnkgPSB7XG5cdFx0XHRfaWQ6IE1ldGVvci51c2VySWQoKSxcblx0XHRcdHVzZXJuYW1lOiBtZS51c2VybmFtZVxuXHRcdH07XG5cdFx0b3JpZ2luYWxNZXNzYWdlID0gUm9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdiZWZvcmVTYXZlTWVzc2FnZScsIG9yaWdpbmFsTWVzc2FnZSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0UGlubmVkQnlJZEFuZFVzZXJJZChvcmlnaW5hbE1lc3NhZ2UuX2lkLCBvcmlnaW5hbE1lc3NhZ2UucGlubmVkQnksIG9yaWdpbmFsTWVzc2FnZS5waW5uZWQpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdwaW5uZWRNZXNzYWdlcycsIGZ1bmN0aW9uKHJpZCwgbGltaXQgPSA1MCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXHRjb25zdCBwdWJsaWNhdGlvbiA9IHRoaXM7XG5cblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkKTtcblx0aWYgKCF1c2VyKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXHRjb25zdCBjdXJzb3JIYW5kbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kUGlubmVkQnlSb29tKHJpZCwgeyBzb3J0OiB7IHRzOiAtMSB9LCBsaW1pdCB9KS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoX2lkLCByZWNvcmQpIHtcblx0XHRcdHJldHVybiBwdWJsaWNhdGlvbi5hZGRlZCgncm9ja2V0Y2hhdF9waW5uZWRfbWVzc2FnZScsIF9pZCwgcmVjb3JkKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoX2lkLCByZWNvcmQpIHtcblx0XHRcdHJldHVybiBwdWJsaWNhdGlvbi5jaGFuZ2VkKCdyb2NrZXRjaGF0X3Bpbm5lZF9tZXNzYWdlJywgX2lkLCByZWNvcmQpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChfaWQpIHtcblx0XHRcdHJldHVybiBwdWJsaWNhdGlvbi5yZW1vdmVkKCdyb2NrZXRjaGF0X3Bpbm5lZF9tZXNzYWdlJywgX2lkKTtcblx0XHR9XG5cdH0pO1xuXHR0aGlzLnJlYWR5KCk7XG5cdHJldHVybiB0aGlzLm9uU3RvcChmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gY3Vyc29ySGFuZGxlLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gTWV0ZW9yLmRlZmVyKGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy50cnlFbnN1cmVJbmRleCh7XG5cdFx0XHQncGlubmVkQnkuX2lkJzogMVxuXHRcdH0sIHtcblx0XHRcdHNwYXJzZTogMVxuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIl19
