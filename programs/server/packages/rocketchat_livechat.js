(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Autoupdate = Package.autoupdate.Autoupdate;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var Streamer = Package['rocketchat:streamer'].Streamer;
var UserPresence = Package['konecty:user-presence'].UserPresence;
var UserPresenceMonitor = Package['konecty:user-presence'].UserPresenceMonitor;
var UserPresenceEvents = Package['konecty:user-presence'].UserPresenceEvents;
var fileUpload = Package['rocketchat:ui'].fileUpload;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var department, emailSettings, self, _id, agents, username, agent, exports;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:livechat":{"livechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/livechat.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 1);
WebApp = Package.webapp.WebApp;
const Autoupdate = Package.autoupdate.Autoupdate;
WebApp.connectHandlers.use('/livechat', Meteor.bindEnvironment((req, res, next) => {
  const reqUrl = url.parse(req.url);

  if (reqUrl.pathname !== '/') {
    return next();
  }

  res.setHeader('content-type', 'text/html; charset=utf-8');
  let domainWhiteList = RocketChat.settings.get('Livechat_AllowedDomainsList');

  if (req.headers.referer && !_.isEmpty(domainWhiteList.trim())) {
    domainWhiteList = _.map(domainWhiteList.split(','), function (domain) {
      return domain.trim();
    });
    const referer = url.parse(req.headers.referer);

    if (!_.contains(domainWhiteList, referer.host)) {
      res.setHeader('X-FRAME-OPTIONS', 'DENY');
      return next();
    }

    res.setHeader('X-FRAME-OPTIONS', `ALLOW-FROM ${referer.protocol}//${referer.host}`);
  }

  const head = Assets.getText('public/head.html');
  let baseUrl;

  if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
    baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
  } else {
    baseUrl = '/';
  }

  if (/\/$/.test(baseUrl) === false) {
    baseUrl += '/';
  }

  const html = `<html>
		<head>
			<link rel="stylesheet" type="text/css" class="__meteor-css__" href="${baseUrl}livechat/livechat.css?_dc=${Autoupdate.autoupdateVersion}">
			<script type="text/javascript">
				__meteor_runtime_config__ = ${JSON.stringify(__meteor_runtime_config__)};
			</script>

			<base href="${baseUrl}">

			${head}
		</head>
		<body>
			<script type="text/javascript" src="${baseUrl}livechat/livechat.js?_dc=${Autoupdate.autoupdateVersion}"></script>
		</body>
	</html>`;
  res.write(html);
  res.end();
}));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/startup.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(() => {
  RocketChat.roomTypes.setRoomFind('l', _id => {
    return RocketChat.models.Rooms.findLivechatById(_id);
  });
  RocketChat.authz.addRoomAccessValidator(function (room, user) {
    return room.t === 'l' && user && RocketChat.authz.hasPermission(user._id, 'view-livechat-rooms');
  });
  RocketChat.authz.addRoomAccessValidator(function (room, user, extraData) {
    return room.t === 'l' && extraData && extraData.token && room.v && room.v.token === extraData.token;
  });
  RocketChat.callbacks.add('beforeLeaveRoom', function (user, room) {
    if (room.t !== 'l') {
      return user;
    }

    throw new Meteor.Error(TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
      lng: user.language || RocketChat.settings.get('language') || 'en'
    }));
  }, RocketChat.callbacks.priority.LOW, 'cant-leave-room');
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/visitorStatus.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UserPresenceEvents */
Meteor.startup(() => {
  UserPresenceEvents.on('setStatus', (session, status, metadata) => {
    if (metadata && metadata.visitor) {
      RocketChat.models.LivechatInquiry.updateVisitorStatus(metadata.visitor, status);
      RocketChat.models.Rooms.updateVisitorStatus(metadata.visitor, status);
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hooks":{"externalMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/externalMessage.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let knowledgeEnabled = false;
let apiaiKey = '';
let apiaiLanguage = 'en';
RocketChat.settings.get('Livechat_Knowledge_Enabled', function (key, value) {
  knowledgeEnabled = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Key', function (key, value) {
  apiaiKey = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Language', function (key, value) {
  apiaiLanguage = value;
});
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (!message || message.editedAt) {
    return message;
  }

  if (!knowledgeEnabled) {
    return message;
  }

  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
    return message;
  } // if the message hasn't a token, it was not sent by the visitor, so ignore it


  if (!message.token) {
    return message;
  }

  Meteor.defer(() => {
    try {
      const response = HTTP.post('https://api.api.ai/api/query?v=20150910', {
        data: {
          query: message.msg,
          lang: apiaiLanguage,
          sessionId: room._id
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${apiaiKey}`
        }
      });

      if (response.data && response.data.status.code === 200 && !_.isEmpty(response.data.result.fulfillment.speech)) {
        RocketChat.models.LivechatExternalMessage.insert({
          rid: message.rid,
          msg: response.data.result.fulfillment.speech,
          orig: message._id,
          ts: new Date()
        });
      }
    } catch (e) {
      SystemLogger.error('Error using Api.ai ->', e);
    }
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'externalWebHook');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leadCapture.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/leadCapture.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);

function validateMessage(message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return false;
  } // message valid only if it is a livechat room


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
    return false;
  } // if the message hasn't a token, it was NOT sent from the visitor, so ignore it


  if (!message.token) {
    return false;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return false;
  }

  return true;
}

RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  if (!validateMessage(message, room)) {
    return message;
  }

  const phoneRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_phone_regex'), 'g');
  const msgPhones = message.msg.match(phoneRegexp);
  const emailRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_email_regex'), 'gi');
  const msgEmails = message.msg.match(emailRegexp);

  if (msgEmails || msgPhones) {
    LivechatVisitors.saveGuestEmailPhoneById(room.v._id, msgEmails, msgPhones);
    RocketChat.callbacks.run('livechat.leadCapture', room);
  }

  return message;
}, RocketChat.callbacks.priority.LOW, 'leadCapture');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markRoomResponded.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/markRoomResponded.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (!message || message.editedAt) {
    return message;
  } // check if room is yet awaiting for response


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.waitingResponse)) {
    return message;
  } // if the message has a token, it was sent by the visitor, so ignore it


  if (message.token) {
    return message;
  }

  Meteor.defer(() => {
    const now = new Date();
    RocketChat.models.Rooms.setResponseByRoomId(room._id, {
      user: {
        _id: message.u._id,
        username: message.u.username
      },
      responseDate: now,
      responseTime: (now.getTime() - room.ts) / 1000
    });
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'markRoomResponded');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"offlineMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/offlineMessage.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.callbacks.add('livechat.offlineMessage', data => {
  if (!RocketChat.settings.get('Livechat_webhook_on_offline_msg')) {
    return data;
  }

  const postData = {
    type: 'LivechatOfflineMessage',
    sentAt: new Date(),
    visitor: {
      name: data.name,
      email: data.email
    },
    message: data.message
  };
  RocketChat.Livechat.sendRequest(postData);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-email-offline-message');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RDStation.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/RDStation.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function sendToRDStation(room) {
  if (!RocketChat.settings.get('Livechat_RDStation_Token')) {
    return room;
  }

  const livechatData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);

  if (!livechatData.visitor.email) {
    return room;
  }

  const options = {
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      token_rdstation: RocketChat.settings.get('Livechat_RDStation_Token'),
      identificador: 'rocketchat-livechat',
      client_id: livechatData.visitor._id,
      email: livechatData.visitor.email
    }
  };
  options.data.nome = livechatData.visitor.name || livechatData.visitor.username;

  if (livechatData.visitor.phone) {
    options.data.telefone = livechatData.visitor.phone;
  }

  if (livechatData.tags) {
    options.data.tags = livechatData.tags;
  }

  Object.keys(livechatData.customFields || {}).forEach(field => {
    options.data[field] = livechatData.customFields[field];
  });
  Object.keys(livechatData.visitor.customFields || {}).forEach(field => {
    options.data[field] = livechatData.visitor.customFields[field];
  });

  try {
    HTTP.call('POST', 'https://www.rdstation.com.br/api/1.3/conversions', options);
  } catch (e) {
    console.error('Error sending lead to RD Station ->', e);
  }

  return room;
}

RocketChat.callbacks.add('livechat.closeRoom', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-close-room');
RocketChat.callbacks.add('livechat.saveInfo', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-save-info');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendToCRM.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/sendToCRM.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const msgNavType = 'livechat_navigation_history';

const sendMessageType = msgType => {
  const sendNavHistory = RocketChat.settings.get('Livechat_Visitor_navigation_as_a_message') && RocketChat.settings.get('Send_visitor_navigation_history_livechat_webhook_request');
  return sendNavHistory && msgType === msgNavType;
};

function sendToCRM(type, room, includeMessages = true) {
  const postData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);
  postData.type = type;
  postData.messages = [];
  let messages;

  if (typeof includeMessages === 'boolean' && includeMessages) {
    messages = RocketChat.models.Messages.findVisibleByRoomId(room._id, {
      sort: {
        ts: 1
      }
    });
  } else if (includeMessages instanceof Array) {
    messages = includeMessages;
  }

  if (messages) {
    messages.forEach(message => {
      if (message.t && !sendMessageType(message.t)) {
        return;
      }

      const msg = {
        _id: message._id,
        username: message.u.username,
        msg: message.msg,
        ts: message.ts,
        editedAt: message.editedAt
      };

      if (message.u.username !== postData.visitor.username) {
        msg.agentId = message.u._id;
      }

      if (message.t === msgNavType) {
        msg.navigation = message.navigation;
      }

      postData.messages.push(msg);
    });
  }

  const response = RocketChat.Livechat.sendRequest(postData);

  if (response && response.data && response.data.data) {
    RocketChat.models.Rooms.saveCRMDataByRoomId(room._id, response.data.data);
  }

  return room;
}

RocketChat.callbacks.add('livechat.closeRoom', room => {
  if (!RocketChat.settings.get('Livechat_webhook_on_close')) {
    return room;
  }

  return sendToCRM('LivechatSession', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-close-room');
RocketChat.callbacks.add('livechat.saveInfo', room => {
  // Do not send to CRM if the chat is still open
  if (room.open) {
    return room;
  }

  return sendToCRM('LivechatEdit', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-save-info');
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // only call webhook if it is a livechat room
  if (room.t !== 'l' || room.v == null || room.v.token == null) {
    return message;
  } // if the message has a token, it was sent from the visitor
  // if not, it was sent from the agent


  if (message.token) {
    if (!RocketChat.settings.get('Livechat_webhook_on_visitor_message')) {
      return message;
    }
  } else if (!RocketChat.settings.get('Livechat_webhook_on_agent_message')) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips
  // unless the settings that handle with visitor navigation history are enabled


  if (message.t && !sendMessageType(message.t)) {
    return message;
  }

  sendToCRM('Message', room, [message]);
  return message;
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-message');
RocketChat.callbacks.add('livechat.leadCapture', room => {
  if (!RocketChat.settings.get('Livechat_webhook_on_capture')) {
    return room;
  }

  return sendToCRM('LeadCapture', room, false);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-lead-capture');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendToFacebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/sendToFacebook.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let OmniChannel;
module.watch(require("../lib/OmniChannel"), {
  default(v) {
    OmniChannel = v;
  }

}, 0);
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (!RocketChat.settings.get('Livechat_Facebook_Enabled') || !RocketChat.settings.get('Livechat_Facebook_API_Key')) {
    return message;
  } // only send the sms by SMS if it is a livechat room with SMS set to true


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.facebook && room.v && room.v.token)) {
    return message;
  } // if the message has a token, it was sent from the visitor, so ignore it


  if (message.token) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return message;
  }

  OmniChannel.reply({
    page: room.facebook.page.id,
    token: room.v.token,
    text: message.msg
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'sendMessageToFacebook');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/addAgent.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:addAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addAgent'
      });
    }

    return RocketChat.Livechat.addAgent(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addManager.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/addManager.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:addManager'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addManager'
      });
    }

    return RocketChat.Livechat.addManager(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeLivechatStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/changeLivechatStatus.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:changeLivechatStatus'() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:changeLivechatStatus'
      });
    }

    const user = Meteor.user();
    const newStatus = user.statusLivechat === 'available' ? 'not-available' : 'available';
    return RocketChat.models.Users.setLivechatStatus(user._id, newStatus);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"closeByVisitor.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/closeByVisitor.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:closeByVisitor'({
    roomId,
    token
  }) {
    const room = RocketChat.models.Rooms.findOneOpenByVisitorToken(token, roomId);

    if (!room || !room.open) {
      return false;
    }

    const visitor = LivechatVisitors.getVisitorByToken(token);
    const language = visitor && visitor.language || RocketChat.settings.get('language') || 'en';
    return RocketChat.Livechat.closeRoom({
      visitor,
      room,
      comment: TAPi18n.__('Closed_by_visitor', {
        lng: language
      })
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"closeRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/closeRoom.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:closeRoom'(roomId, comment) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'close-livechat-room')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room || room.t !== 'l') {
      throw new Meteor.Error('room-not-found', 'Room not found', {
        method: 'livechat:closeRoom'
      });
    }

    const user = Meteor.user();

    if ((!room.usernames || room.usernames.indexOf(user.username) === -1) && !RocketChat.authz.hasPermission(Meteor.userId(), 'close-others-livechat-room')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeRoom'
      });
    }

    return RocketChat.Livechat.closeRoom({
      user,
      room,
      comment
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/facebook.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let OmniChannel;
module.watch(require("../lib/OmniChannel"), {
  default(v) {
    OmniChannel = v;
  }

}, 0);
Meteor.methods({
  'livechat:facebook'(options) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addAgent'
      });
    }

    try {
      switch (options.action) {
        case 'initialState':
          {
            return {
              enabled: RocketChat.settings.get('Livechat_Facebook_Enabled'),
              hasToken: !!RocketChat.settings.get('Livechat_Facebook_API_Key')
            };
          }

        case 'enable':
          {
            const result = OmniChannel.enable();

            if (!result.success) {
              return result;
            }

            return RocketChat.settings.updateById('Livechat_Facebook_Enabled', true);
          }

        case 'disable':
          {
            OmniChannel.disable();
            return RocketChat.settings.updateById('Livechat_Facebook_Enabled', false);
          }

        case 'list-pages':
          {
            return OmniChannel.listPages();
          }

        case 'subscribe':
          {
            return OmniChannel.subscribe(options.page);
          }

        case 'unsubscribe':
          {
            return OmniChannel.unsubscribe(options.page);
          }
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        if (e.response.data.error.error) {
          throw new Meteor.Error(e.response.data.error.error, e.response.data.error.message);
        }

        if (e.response.data.error.response) {
          throw new Meteor.Error('integration-error', e.response.data.error.response.error.message);
        }

        if (e.response.data.error.message) {
          throw new Meteor.Error('integration-error', e.response.data.error.message);
        }
      }

      console.error('Error contacting omni.rocket.chat:', e);
      throw new Meteor.Error('integration-error', e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getCustomFields.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getCustomFields.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:getCustomFields'() {
    return RocketChat.models.LivechatCustomField.find().fetch();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getAgentData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getAgentData.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:getAgentData'({
    roomId,
    token
  }) {
    check(roomId, String);
    check(token, String);
    const room = RocketChat.models.Rooms.findOneById(roomId);
    const visitor = LivechatVisitors.getVisitorByToken(token); // allow to only user to send transcripts from their own chats

    if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor.token) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room');
    }

    if (!room.servedBy) {
      return;
    }

    return RocketChat.models.Users.getAgentInfo(room.servedBy._id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getInitialData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getInitialData.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);
Meteor.methods({
  'livechat:getInitialData'(visitorToken) {
    const info = {
      enabled: null,
      title: null,
      color: null,
      registrationForm: null,
      room: null,
      visitor: null,
      triggers: [],
      departments: [],
      allowSwitchingDepartments: null,
      online: true,
      offlineColor: null,
      offlineMessage: null,
      offlineSuccessMessage: null,
      offlineUnavailableMessage: null,
      displayOfflineForm: null,
      videoCall: null,
      conversationFinishedMessage: null,
      nameFieldRegistrationForm: null,
      emailFieldRegistrationForm: null
    };
    const room = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken, {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        v: 1,
        servedBy: 1
      }
    }).fetch();

    if (room && room.length > 0) {
      info.room = room[0];
    }

    const visitor = LivechatVisitors.getVisitorByToken(visitorToken, {
      fields: {
        name: 1,
        username: 1,
        visitorEmails: 1
      }
    });

    if (room) {
      info.visitor = visitor;
    }

    const initSettings = RocketChat.Livechat.getInitSettings();
    info.title = initSettings.Livechat_title;
    info.color = initSettings.Livechat_title_color;
    info.enabled = initSettings.Livechat_enabled;
    info.registrationForm = initSettings.Livechat_registration_form;
    info.offlineTitle = initSettings.Livechat_offline_title;
    info.offlineColor = initSettings.Livechat_offline_title_color;
    info.offlineMessage = initSettings.Livechat_offline_message;
    info.offlineSuccessMessage = initSettings.Livechat_offline_success_message;
    info.offlineUnavailableMessage = initSettings.Livechat_offline_form_unavailable;
    info.displayOfflineForm = initSettings.Livechat_display_offline_form;
    info.language = initSettings.Language;
    info.videoCall = initSettings.Livechat_videocall_enabled === true && initSettings.Jitsi_Enabled === true;
    info.transcript = initSettings.Livechat_enable_transcript;
    info.transcriptMessage = initSettings.Livechat_transcript_message;
    info.conversationFinishedMessage = initSettings.Livechat_conversation_finished_message;
    info.nameFieldRegistrationForm = initSettings.Livechat_name_field_registration_form;
    info.emailFieldRegistrationForm = initSettings.Livechat_email_field_registration_form;
    info.agentData = room && room[0] && room[0].servedBy && RocketChat.models.Users.getAgentInfo(room[0].servedBy._id);
    RocketChat.models.LivechatTrigger.findEnabled().forEach(trigger => {
      info.triggers.push(_.pick(trigger, '_id', 'actions', 'conditions'));
    });
    RocketChat.models.LivechatDepartment.findEnabledWithAgents().forEach(department => {
      info.departments.push(department);
    });
    info.allowSwitchingDepartments = initSettings.Livechat_allow_switching_departments;
    info.online = RocketChat.models.Users.findOnlineAgents().count() > 0;
    return info;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getNextAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getNextAgent.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:getNextAgent'({
    token,
    department
  }) {
    check(token, String);
    const room = RocketChat.models.Rooms.findOpenByVisitorToken(token).fetch();

    if (room && room.length > 0) {
      return;
    }

    if (!department) {
      const requireDeparment = RocketChat.Livechat.getRequiredDepartment();

      if (requireDeparment) {
        department = requireDeparment._id;
      }
    }

    const agent = RocketChat.Livechat.getNextAgent(department);

    if (!agent) {
      return;
    }

    return RocketChat.models.Users.getAgentInfo(agent.agentId);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadHistory.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/loadHistory.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:loadHistory'({
    token,
    rid,
    end,
    limit = 20,
    ls
  }) {
    const visitor = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (!visitor) {
      return;
    }

    return RocketChat.loadMessageHistory({
      userId: visitor._id,
      rid,
      end,
      limit,
      ls
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loginByToken.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/loginByToken.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:loginByToken'(token) {
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      return;
    }

    return {
      _id: user._id
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/pageVisited.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:pageVisited'(token, room, pageInfo) {
    RocketChat.Livechat.savePageHistory(token, room, pageInfo);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"registerGuest.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/registerGuest.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:registerGuest'({
    token,
    name,
    email,
    department
  } = {}) {
    const userId = RocketChat.Livechat.registerGuest.call(this, {
      token,
      name,
      email,
      department
    }); // update visited page history to not expire

    RocketChat.models.Messages.keepHistoryForToken(token);
    const visitor = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        name: 1,
        username: 1,
        visitorEmails: 1
      }
    });
    return {
      userId,
      visitor
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeAgent.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeAgent'
      });
    }

    return RocketChat.Livechat.removeAgent(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeCustomField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeCustomField.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeCustomField'(_id) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeCustomField'
      });
    }

    check(_id, String);
    const customField = RocketChat.models.LivechatCustomField.findOneById(_id, {
      fields: {
        _id: 1
      }
    });

    if (!customField) {
      throw new Meteor.Error('error-invalid-custom-field', 'Custom field not found', {
        method: 'livechat:removeCustomField'
      });
    }

    return RocketChat.models.LivechatCustomField.removeById(_id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeDepartment.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeDepartment.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeDepartment'(_id) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeDepartment'
      });
    }

    return RocketChat.Livechat.removeDepartment(_id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeManager.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeManager.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeManager'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeManager'
      });
    }

    return RocketChat.Livechat.removeManager(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeTrigger.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeTrigger'(triggerId) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeTrigger'
      });
    }

    check(triggerId, String);
    return RocketChat.models.LivechatTrigger.removeById(triggerId);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeRoom.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeRoom'(rid) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'remove-closed-livechat-rooms')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'livechat:removeRoom'
      });
    }

    if (room.t !== 'l') {
      throw new Meteor.Error('error-this-is-not-a-livechat-room', 'This is not a Livechat room', {
        method: 'livechat:removeRoom'
      });
    }

    if (room.open) {
      throw new Meteor.Error('error-room-is-not-closed', 'Room is not closed', {
        method: 'livechat:removeRoom'
      });
    }

    RocketChat.models.Messages.removeByRoomId(rid);
    RocketChat.models.Subscriptions.removeByRoomId(rid);
    return RocketChat.models.Rooms.removeById(rid);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveAppearance.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveAppearance.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveAppearance'(settings) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveAppearance'
      });
    }

    const validSettings = ['Livechat_title', 'Livechat_title_color', 'Livechat_show_agent_email', 'Livechat_display_offline_form', 'Livechat_offline_form_unavailable', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_email', 'Livechat_conversation_finished_message', 'Livechat_registration_form', 'Livechat_name_field_registration_form', 'Livechat_email_field_registration_form'];
    const valid = settings.every(setting => {
      return validSettings.indexOf(setting._id) !== -1;
    });

    if (!valid) {
      throw new Meteor.Error('invalid-setting');
    }

    settings.forEach(setting => {
      RocketChat.settings.updateById(setting._id, setting.value);
    });
    return;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveCustomField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveCustomField.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */
Meteor.methods({
  'livechat:saveCustomField'(_id, customFieldData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveCustomField'
      });
    }

    if (_id) {
      check(_id, String);
    }

    check(customFieldData, Match.ObjectIncluding({
      field: String,
      label: String,
      scope: String,
      visibility: String
    }));

    if (!/^[0-9a-zA-Z-_]+$/.test(customFieldData.field)) {
      throw new Meteor.Error('error-invalid-custom-field-nmae', 'Invalid custom field name. Use only letters, numbers, hyphens and underscores.', {
        method: 'livechat:saveCustomField'
      });
    }

    if (_id) {
      const customField = RocketChat.models.LivechatCustomField.findOneById(_id);

      if (!customField) {
        throw new Meteor.Error('error-invalid-custom-field', 'Custom Field Not found', {
          method: 'livechat:saveCustomField'
        });
      }
    }

    return RocketChat.models.LivechatCustomField.createOrUpdateCustomField(_id, customFieldData.field, customFieldData.label, customFieldData.scope, customFieldData.visibility);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveDepartment.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveDepartment.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveDepartment'(_id, departmentData, departmentAgents) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveDepartment'
      });
    }

    return RocketChat.Livechat.saveDepartment(_id, departmentData, departmentAgents);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveInfo.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveInfo.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */
Meteor.methods({
  'livechat:saveInfo'(guestData, roomData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveInfo'
      });
    }

    check(guestData, Match.ObjectIncluding({
      _id: String,
      name: Match.Optional(String),
      email: Match.Optional(String),
      phone: Match.Optional(String)
    }));
    check(roomData, Match.ObjectIncluding({
      _id: String,
      topic: Match.Optional(String),
      tags: Match.Optional(String)
    }));
    const room = RocketChat.models.Rooms.findOneById(roomData._id, {
      fields: {
        t: 1,
        servedBy: 1
      }
    });

    if (room == null || room.t !== 'l') {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'livechat:saveInfo'
      });
    }

    if ((!room.servedBy || room.servedBy._id !== Meteor.userId()) && !RocketChat.authz.hasPermission(Meteor.userId(), 'save-others-livechat-room-info')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveInfo'
      });
    }

    const ret = RocketChat.Livechat.saveGuest(guestData) && RocketChat.Livechat.saveRoomInfo(roomData, guestData);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveInfo', RocketChat.models.Rooms.findOneById(roomData._id));
    });
    return ret;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveIntegration.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveIntegration.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.methods({
  'livechat:saveIntegration'(values) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveIntegration'
      });
    }

    if (typeof values['Livechat_webhookUrl'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhookUrl', s.trim(values['Livechat_webhookUrl']));
    }

    if (typeof values['Livechat_secret_token'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_secret_token', s.trim(values['Livechat_secret_token']));
    }

    if (typeof values['Livechat_webhook_on_close'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_close', !!values['Livechat_webhook_on_close']);
    }

    if (typeof values['Livechat_webhook_on_offline_msg'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_offline_msg', !!values['Livechat_webhook_on_offline_msg']);
    }

    if (typeof values['Livechat_webhook_on_visitor_message'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_visitor_message', !!values['Livechat_webhook_on_visitor_message']);
    }

    if (typeof values['Livechat_webhook_on_agent_message'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_agent_message', !!values['Livechat_webhook_on_agent_message']);
    }

    return;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveSurveyFeedback.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveSurveyFeedback.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
Meteor.methods({
  'livechat:saveSurveyFeedback'(visitorToken, visitorRoom, formData) {
    check(visitorToken, String);
    check(visitorRoom, String);
    check(formData, [Match.ObjectIncluding({
      name: String,
      value: String
    })]);
    const visitor = LivechatVisitors.getVisitorByToken(visitorToken);
    const room = RocketChat.models.Rooms.findOneById(visitorRoom);

    if (visitor !== undefined && room !== undefined && room.v !== undefined && room.v.token === visitor.token) {
      const updateData = {};

      for (const item of formData) {
        if (_.contains(['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'], item.name) && _.contains(['1', '2', '3', '4', '5'], item.value)) {
          updateData[item.name] = item.value;
        } else if (item.name === 'additionalFeedback') {
          updateData[item.name] = item.value;
        }
      }

      if (!_.isEmpty(updateData)) {
        return RocketChat.models.Rooms.updateSurveyFeedbackById(room._id, updateData);
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveTrigger.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveTrigger'(trigger) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveTrigger'
      });
    }

    check(trigger, {
      _id: Match.Maybe(String),
      name: String,
      description: String,
      enabled: Boolean,
      conditions: Array,
      actions: Array
    });

    if (trigger._id) {
      return RocketChat.models.LivechatTrigger.updateById(trigger._id, trigger);
    } else {
      return RocketChat.models.LivechatTrigger.insert(trigger);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"searchAgent.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/searchAgent.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'livechat:searchAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:searchAgent'
      });
    }

    if (!username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'livechat:searchAgent'
      });
    }

    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:searchAgent'
      });
    }

    return user;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessageLivechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendMessageLivechat.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  sendMessageLivechat({
    token,
    _id,
    rid,
    msg
  }, agent) {
    check(token, String);
    check(_id, String);
    check(rid, String);
    check(msg, String);
    check(agent, Match.Maybe({
      agentId: String,
      username: String
    }));
    const guest = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        name: 1,
        username: 1,
        department: 1,
        token: 1
      }
    });

    if (!guest) {
      throw new Meteor.Error('invalid-token');
    }

    return RocketChat.Livechat.sendMessage({
      guest,
      message: {
        _id,
        rid,
        msg,
        token
      },
      agent
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendOfflineMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendOfflineMessage.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let dns;
module.watch(require("dns"), {
  default(v) {
    dns = v;
  }

}, 0);
Meteor.methods({
  'livechat:sendOfflineMessage'(data) {
    check(data, {
      name: String,
      email: String,
      message: String
    });

    if (!RocketChat.settings.get('Livechat_display_offline_form')) {
      return false;
    }

    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    const message = `${data.message}`.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
    const html = `
			<h1>New livechat message</h1>
			<p><strong>Visitor name:</strong> ${data.name}</p>
			<p><strong>Visitor email:</strong> ${data.email}</p>
			<p><strong>Message:</strong><br>${message}</p>`;
    let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

    if (fromEmail) {
      fromEmail = fromEmail[0];
    } else {
      fromEmail = RocketChat.settings.get('From_Email');
    }

    if (RocketChat.settings.get('Livechat_validate_offline_email')) {
      const emailDomain = data.email.substr(data.email.lastIndexOf('@') + 1);

      try {
        Meteor.wrapAsync(dns.resolveMx)(emailDomain);
      } catch (e) {
        throw new Meteor.Error('error-invalid-email-address', 'Invalid email address', {
          method: 'livechat:sendOfflineMessage'
        });
      }
    }

    Meteor.defer(() => {
      Email.send({
        to: RocketChat.settings.get('Livechat_offline_email'),
        from: `${data.name} - ${data.email} <${fromEmail}>`,
        replyTo: `${data.name} <${data.email}>`,
        subject: `Livechat offline message from ${data.name}: ${`${data.message}`.substring(0, 20)}`,
        html: header + html + footer
      });
    });
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.offlineMessage', data);
    });
    return true;
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'livechat:sendOfflineMessage',

  connectionId() {
    return true;
  }

}, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setCustomField.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/setCustomField.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:setCustomField'(token, key, value, overwrite = true) {
    const customField = RocketChat.models.LivechatCustomField.findOneById(key);

    if (customField) {
      if (customField.scope === 'room') {
        return RocketChat.models.Rooms.updateLivechatDataByToken(token, key, value, overwrite);
      } else {
        // Save in user
        return LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
      }
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setDepartmentForVisitor.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/setDepartmentForVisitor.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:setDepartmentForVisitor'({
    token,
    department
  } = {}) {
    RocketChat.Livechat.setDepartmentForGuest.call(this, {
      token,
      department
    }); // update visited page history to not expire

    RocketChat.models.Messages.keepHistoryForToken(token);
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startVideoCall.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/startVideoCall.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["MD5"]}] */
Meteor.methods({
  'livechat:startVideoCall'(roomId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeByVisitor'
      });
    }

    const guest = Meteor.user();
    const message = {
      _id: Random.id(),
      rid: roomId || Random.id(),
      msg: '',
      ts: new Date()
    };
    const {
      room
    } = RocketChat.Livechat.getRoom(guest, message, {
      jitsiTimeout: new Date(Date.now() + 3600 * 1000)
    });
    message.rid = room._id;
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('livechat_video_call', room._id, '', guest, {
      actionLinks: [{
        icon: 'icon-videocam',
        i18nLabel: 'Accept',
        method_id: 'createLivechatCall',
        params: ''
      }, {
        icon: 'icon-cancel',
        i18nLabel: 'Decline',
        method_id: 'denyLivechatCall',
        params: ''
      }]
    });
    return {
      roomId: room._id,
      domain: RocketChat.settings.get('Jitsi_Domain'),
      jitsiRoom: RocketChat.settings.get('Jitsi_URL_Room_Prefix') + RocketChat.settings.get('uniqueID') + roomId
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"transfer.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/transfer.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:transfer'(transferData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:transfer'
      });
    }

    check(transferData, {
      roomId: String,
      userId: Match.Optional(String),
      departmentId: Match.Optional(String)
    });
    const room = RocketChat.models.Rooms.findOneById(transferData.roomId);
    const guest = LivechatVisitors.findOneById(room.v._id);
    const user = Meteor.user();

    if (room.usernames.indexOf(user.username) === -1 && !RocketChat.authz.hasRole(Meteor.userId(), 'livechat-manager')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:transfer'
      });
    }

    return RocketChat.Livechat.transfer(room, guest, transferData);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"webhookTest.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/webhookTest.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals HTTP */
const postCatchError = Meteor.wrapAsync(function (url, options, resolve) {
  HTTP.post(url, options, function (err, res) {
    if (err) {
      resolve(null, err.response);
    } else {
      resolve(null, res);
    }
  });
});
Meteor.methods({
  'livechat:webhookTest'() {
    this.unblock();
    const sampleData = {
      type: 'LivechatSession',
      _id: 'fasd6f5a4sd6f8a4sdf',
      label: 'title',
      topic: 'asiodojf',
      createdAt: new Date(),
      lastMessageAt: new Date(),
      tags: ['tag1', 'tag2', 'tag3'],
      customFields: {
        productId: '123456'
      },
      visitor: {
        _id: '',
        name: 'visitor name',
        username: 'visitor-username',
        department: 'department',
        email: 'email@address.com',
        phone: '192873192873',
        ip: '123.456.7.89',
        browser: 'Chrome',
        os: 'Linux',
        customFields: {
          customerId: '123456'
        }
      },
      agent: {
        _id: 'asdf89as6df8',
        username: 'agent.username',
        name: 'Agent Name',
        email: 'agent@email.com'
      },
      messages: [{
        username: 'visitor-username',
        msg: 'message content',
        ts: new Date()
      }, {
        username: 'agent.username',
        agentId: 'asdf89as6df8',
        msg: 'message content from agent',
        ts: new Date()
      }]
    };
    const options = {
      headers: {
        'X-RocketChat-Livechat-Token': RocketChat.settings.get('Livechat_secret_token')
      },
      data: sampleData
    };
    const response = postCatchError(RocketChat.settings.get('Livechat_webhookUrl'), options);
    console.log('response ->', response);

    if (response && response.statusCode && response.statusCode === 200) {
      return true;
    } else {
      throw new Meteor.Error('error-invalid-webhook-response');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"takeInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/takeInquiry.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:takeInquiry'(inquiryId) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:takeInquiry'
      });
    }

    const inquiry = RocketChat.models.LivechatInquiry.findOneById(inquiryId);

    if (!inquiry || inquiry.status === 'taken') {
      throw new Meteor.Error('error-not-allowed', 'Inquiry already taken', {
        method: 'livechat:takeInquiry'
      });
    }

    const user = RocketChat.models.Users.findOneById(Meteor.userId());
    const agent = {
      agentId: user._id,
      username: user.username
    }; // add subscription

    const subscriptionData = {
      rid: inquiry.rid,
      name: inquiry.name,
      alert: true,
      open: true,
      unread: 1,
      userMentions: 1,
      groupMentions: 0,
      u: {
        _id: agent.agentId,
        username: agent.username
      },
      t: 'l',
      desktopNotifications: 'all',
      mobilePushNotifications: 'all',
      emailNotifications: 'all'
    };
    RocketChat.models.Subscriptions.insert(subscriptionData); // update room

    const room = RocketChat.models.Rooms.findOneById(inquiry.rid);
    RocketChat.models.Rooms.changeAgentByRoomId(inquiry.rid, agent);
    room.servedBy = {
      _id: agent.agentId,
      username: agent.username
    }; // mark inquiry as taken

    RocketChat.models.LivechatInquiry.takeInquiry(inquiry._id); // remove sending message from guest widget
    // dont check if setting is true, because if settingwas switched off inbetween  guest entered pool,
    // and inquiry being taken, message would not be switched off.

    RocketChat.models.Messages.createCommandWithRoomIdAndUser('connected', room._id, user);
    RocketChat.Livechat.stream.emit(room._id, {
      type: 'agentData',
      data: RocketChat.models.Users.getAgentInfo(agent.agentId)
    }); // return room corresponding to inquiry (for redirecting agent to the room route)

    return room;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"returnAsInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/returnAsInquiry.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:returnAsInquiry'(rid) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveDepartment'
      });
    } // //delete agent and room subscription


    RocketChat.models.Subscriptions.removeByRoomId(rid); // remove user from room

    const username = Meteor.user().username;
    RocketChat.models.Rooms.removeUsernameById(rid, username); // find inquiry corresponding to room

    const inquiry = RocketChat.models.LivechatInquiry.findOne({
      rid
    }); // mark inquiry as open

    return RocketChat.models.LivechatInquiry.openInquiry(inquiry._id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveOfficeHours.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveOfficeHours.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveOfficeHours'(day, start, finish, open) {
    RocketChat.models.LivechatOfficeHour.updateHours(day, start, finish, open);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendTranscript.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendTranscript.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);
Meteor.methods({
  'livechat:sendTranscript'(token, rid, email) {
    check(rid, String);
    check(email, String);
    const room = RocketChat.models.Rooms.findOneById(rid);
    const visitor = LivechatVisitors.getVisitorByToken(token);
    const userLanguage = visitor && visitor.language || RocketChat.settings.get('language') || 'en'; // allow to only user to send transcripts from their own chats

    if (!room || room.t !== 'l' || !room.v || room.v.token !== token) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room');
    }

    const messages = RocketChat.models.Messages.findVisibleByRoomIdNotContainingTypes(rid, ['livechat_navigation_history'], {
      sort: {
        'ts': 1
      }
    });
    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    let html = '<div> <hr>';
    messages.forEach(message => {
      if (message.t && ['command', 'livechat-close', 'livechat_video_call'].indexOf(message.t) !== -1) {
        return;
      }

      let author;

      if (message.u._id === visitor._id) {
        author = TAPi18n.__('You', {
          lng: userLanguage
        });
      } else {
        author = message.u.username;
      }

      const datetime = moment(message.ts).locale(userLanguage).format('LLL');
      const singleMessage = `
				<p><strong>${author}</strong>  <em>${datetime}</em></p>
				<p>${message.msg}</p>
			`;
      html = html + singleMessage;
    });
    html = `${html}</div>`;
    let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

    if (fromEmail) {
      fromEmail = fromEmail[0];
    } else {
      fromEmail = RocketChat.settings.get('From_Email');
    }

    emailSettings = {
      to: email,
      from: fromEmail,
      replyTo: fromEmail,
      subject: TAPi18n.__('Transcript_of_your_livechat_conversation', {
        lng: userLanguage
      }),
      html: header + html + footer
    };
    Meteor.defer(() => {
      Email.send(emailSettings);
    });
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.sendTranscript', messages, email);
    });
    return true;
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'livechat:sendTranscript',

  connectionId() {
    return true;
  }

}, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Users.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Users.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Sets an user as (non)operator
 * @param {string} _id - User's _id
 * @param {boolean} operator - Flag to set as operator or not
 */
RocketChat.models.Users.setOperator = function (_id, operator) {
  const update = {
    $set: {
      operator
    }
  };
  return this.update(_id, update);
};
/**
 * Gets all online agents
 * @return
 */


RocketChat.models.Users.findOnlineAgents = function () {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  return this.find(query);
};
/**
 * Find an online agent by his username
 * @return
 */


RocketChat.models.Users.findOneOnlineAgentByUsername = function (username) {
  const query = {
    username,
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  return this.findOne(query);
};
/**
 * Gets all agents
 * @return
 */


RocketChat.models.Users.findAgents = function () {
  const query = {
    roles: 'livechat-agent'
  };
  return this.find(query);
};
/**
 * Find online users from a list
 * @param {array} userList - array of usernames
 * @return
 */


RocketChat.models.Users.findOnlineUserFromList = function (userList) {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent',
    username: {
      $in: [].concat(userList)
    }
  };
  return this.find(query);
};
/**
 * Get next user agent in order
 * @return {object} User from db
 */


RocketChat.models.Users.getNextAgent = function () {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  const collectionObj = this.model.rawCollection();
  const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
  const sort = {
    livechatCount: 1,
    username: 1
  };
  const update = {
    $inc: {
      livechatCount: 1
    }
  };
  const user = findAndModify(query, sort, update);

  if (user && user.value) {
    return {
      agentId: user.value._id,
      username: user.value.username
    };
  } else {
    return null;
  }
};
/**
 * Change user's livechat status
 * @param {string} token - Visitor token
 */


RocketChat.models.Users.setLivechatStatus = function (userId, status) {
  const query = {
    '_id': userId
  };
  const update = {
    $set: {
      'statusLivechat': status
    }
  };
  return this.update(query, update);
};
/**
 * change all livechat agents livechat status to "not-available"
 */


RocketChat.models.Users.closeOffice = function () {
  self = this;
  self.findAgents().forEach(function (agent) {
    self.setLivechatStatus(agent._id, 'not-available');
  });
};
/**
 * change all livechat agents livechat status to "available"
 */


RocketChat.models.Users.openOffice = function () {
  self = this;
  self.findAgents().forEach(function (agent) {
    self.setLivechatStatus(agent._id, 'available');
  });
};

RocketChat.models.Users.getAgentInfo = function (agentId) {
  const query = {
    _id: agentId
  };
  const options = {
    fields: {
      name: 1,
      username: 1,
      phone: 1,
      customFields: 1
    }
  };

  if (RocketChat.settings.get('Livechat_show_agent_email')) {
    options.fields.emails = 1;
  }

  return this.findOne(query, options);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Rooms.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Rooms.updateSurveyFeedbackById = function (_id, surveyFeedback) {
  const query = {
    _id
  };
  const update = {
    $set: {
      surveyFeedback
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.updateLivechatDataByToken = function (token, key, value, overwrite = true) {
  const query = {
    'v.token': token,
    open: true
  };

  if (!overwrite) {
    const room = this.findOne(query, {
      fields: {
        livechatData: 1
      }
    });

    if (room.livechatData && typeof room.livechatData[key] !== 'undefined') {
      return true;
    }
  }

  const update = {
    $set: {
      [`livechatData.${key}`]: value
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.findLivechat = function (filter = {}, offset = 0, limit = 20) {
  const query = _.extend(filter, {
    t: 'l'
  });

  return this.find(query, {
    sort: {
      ts: -1
    },
    offset,
    limit
  });
};

RocketChat.models.Rooms.findLivechatById = function (_id, fields) {
  const options = {};

  if (fields) {
    options.fields = fields;
  }

  const query = {
    t: 'l',
    _id
  };
  return this.findOne(query, options);
};

RocketChat.models.Rooms.findLivechatById = function (_id, fields) {
  const options = {};

  if (fields) {
    options.fields = fields;
  }

  const query = {
    t: 'l',
    _id
  };
  return this.findOne(query, options);
};
/**
 * Get the next visitor name
 * @return {string} The next visitor name
 */


RocketChat.models.Rooms.updateLivechatRoomCount = function () {
  const settingsRaw = RocketChat.models.Settings.model.rawCollection();
  const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);
  const query = {
    _id: 'Livechat_Room_Count'
  };
  const update = {
    $inc: {
      value: 1
    }
  };
  const livechatCount = findAndModify(query, null, update);
  return livechatCount.value.value;
};

RocketChat.models.Rooms.findOpenByVisitorToken = function (visitorToken, options) {
  const query = {
    open: true,
    'v.token': visitorToken
  };
  return this.find(query, options);
};

RocketChat.models.Rooms.findByVisitorToken = function (visitorToken) {
  const query = {
    'v.token': visitorToken
  };
  return this.find(query);
};

RocketChat.models.Rooms.findByVisitorId = function (visitorId) {
  const query = {
    'v._id': visitorId
  };
  return this.find(query);
};

RocketChat.models.Rooms.findOneOpenByVisitorToken = function (token, roomId) {
  const query = {
    _id: roomId,
    open: true,
    'v.token': token
  };
  return this.findOne(query);
};

RocketChat.models.Rooms.setResponseByRoomId = function (roomId, response) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      responseBy: {
        _id: response.user._id,
        username: response.user.username
      },
      responseDate: response.responseDate,
      responseTime: response.responseTime
    },
    $unset: {
      waitingResponse: 1
    }
  });
};

RocketChat.models.Rooms.closeByRoomId = function (roomId, closeInfo) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      closer: closeInfo.closer,
      closedBy: closeInfo.closedBy,
      closedAt: closeInfo.closedAt,
      chatDuration: closeInfo.chatDuration,
      'v.status': 'offline'
    },
    $unset: {
      open: 1
    }
  });
};

RocketChat.models.Rooms.findOpenByAgent = function (userId) {
  const query = {
    open: true,
    'servedBy._id': userId
  };
  return this.find(query);
};

RocketChat.models.Rooms.changeAgentByRoomId = function (roomId, newAgent) {
  const query = {
    _id: roomId
  };
  const update = {
    $set: {
      servedBy: {
        _id: newAgent.agentId,
        username: newAgent.username
      }
    }
  };
  this.update(query, update);
};

RocketChat.models.Rooms.saveCRMDataByRoomId = function (roomId, crmData) {
  const query = {
    _id: roomId
  };
  const update = {
    $set: {
      crmData
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.updateVisitorStatus = function (token, status) {
  const query = {
    'v.token': token,
    open: true
  };
  const update = {
    $set: {
      'v.status': status
    }
  };
  return this.update(query, update);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Messages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Messages.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Messages.keepHistoryForToken = function (token) {
  return this.update({
    'navigation.token': token,
    expireAt: {
      $exists: true
    }
  }, {
    $unset: {
      expireAt: 1
    }
  }, {
    multi: true
  });
};

RocketChat.models.Messages.setRoomIdByToken = function (token, rid) {
  return this.update({
    'navigation.token': token,
    rid: null
  }, {
    $set: {
      rid
    }
  }, {
    multi: true
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatExternalMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatExternalMessage.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class LivechatExternalMessage extends RocketChat.models._Base {
  constructor() {
    super('livechat_external_message');

    if (Meteor.isClient) {
      this._initModel('livechat_external_message');
    }
  } // FIND


  findByRoomId(roomId, sort = {
    ts: -1
  }) {
    const query = {
      rid: roomId
    };
    return this.find(query, {
      sort
    });
  }

}

RocketChat.models.LivechatExternalMessage = new LivechatExternalMessage();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatCustomField.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatCustomField.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Custom Fields model
 */
class LivechatCustomField extends RocketChat.models._Base {
  constructor() {
    super('livechat_custom_field');
  } // FIND


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  createOrUpdateCustomField(_id, field, label, scope, visibility, extraData) {
    const record = {
      label,
      scope,
      visibility
    };

    _.extend(record, extraData);

    if (_id) {
      this.update({
        _id
      }, {
        $set: record
      });
    } else {
      record._id = field;
      _id = this.insert(record);
    }

    return record;
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

}

RocketChat.models.LivechatCustomField = new LivechatCustomField();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatDepartment.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatDepartment.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Department model
 */
class LivechatDepartment extends RocketChat.models._Base {
  constructor() {
    super('livechat_department');
    this.tryEnsureIndex({
      numAgents: 1,
      enabled: 1
    });
  } // FIND


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  findByDepartmentId(_id, options) {
    const query = {
      _id
    };
    return this.find(query, options);
  }

  createOrUpdateDepartment(_id, {
    enabled,
    name,
    description,
    showOnRegistration
  }, agents) {
    agents = [].concat(agents);
    const record = {
      enabled,
      name,
      description,
      numAgents: agents.length,
      showOnRegistration
    };

    if (_id) {
      this.update({
        _id
      }, {
        $set: record
      });
    } else {
      _id = this.insert(record);
    }

    const savedAgents = _.pluck(RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(_id).fetch(), 'agentId');

    const agentsToSave = _.pluck(agents, 'agentId'); // remove other agents


    _.difference(savedAgents, agentsToSave).forEach(agentId => {
      RocketChat.models.LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(_id, agentId);
    });

    agents.forEach(agent => {
      RocketChat.models.LivechatDepartmentAgents.saveAgent({
        agentId: agent.agentId,
        departmentId: _id,
        username: agent.username,
        count: agent.count ? parseInt(agent.count) : 0,
        order: agent.order ? parseInt(agent.order) : 0
      });
    });
    return _.extend(record, {
      _id
    });
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

  findEnabledWithAgents() {
    const query = {
      numAgents: {
        $gt: 0
      },
      enabled: true
    };
    return this.find(query);
  }

}

RocketChat.models.LivechatDepartment = new LivechatDepartment();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatDepartmentAgents.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatDepartmentAgents.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Department model
 */
class LivechatDepartmentAgents extends RocketChat.models._Base {
  constructor() {
    super('livechat_department_agents');
  }

  findByDepartmentId(departmentId) {
    return this.find({
      departmentId
    });
  }

  saveAgent(agent) {
    return this.upsert({
      agentId: agent.agentId,
      departmentId: agent.departmentId
    }, {
      $set: {
        username: agent.username,
        count: parseInt(agent.count),
        order: parseInt(agent.order)
      }
    });
  }

  removeByDepartmentIdAndAgentId(departmentId, agentId) {
    this.remove({
      departmentId,
      agentId
    });
  }

  getNextAgentForDepartment(departmentId) {
    const agents = this.findByDepartmentId(departmentId).fetch();

    if (agents.length === 0) {
      return;
    }

    const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

    const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

    const query = {
      departmentId,
      username: {
        $in: onlineUsernames
      }
    };
    const sort = {
      count: 1,
      order: 1,
      username: 1
    };
    const update = {
      $inc: {
        count: 1
      }
    };
    const collectionObj = this.model.rawCollection();
    const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
    const agent = findAndModify(query, sort, update);

    if (agent && agent.value) {
      return {
        agentId: agent.value.agentId,
        username: agent.value.username
      };
    } else {
      return null;
    }
  }

  getOnlineForDepartment(departmentId) {
    const agents = this.findByDepartmentId(departmentId).fetch();

    if (agents.length === 0) {
      return [];
    }

    const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

    const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

    const query = {
      departmentId,
      username: {
        $in: onlineUsernames
      }
    };
    const depAgents = this.find(query);

    if (depAgents) {
      return depAgents;
    } else {
      return [];
    }
  }

  findUsersInQueue(usersList) {
    const query = {};

    if (!_.isEmpty(usersList)) {
      query.username = {
        $in: usersList
      };
    }

    const options = {
      sort: {
        departmentId: 1,
        count: 1,
        order: 1,
        username: 1
      }
    };
    return this.find(query, options);
  }

  replaceUsernameOfAgentByUserId(userId, username) {
    const query = {
      'agentId': userId
    };
    const update = {
      $set: {
        username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

}

RocketChat.models.LivechatDepartmentAgents = new LivechatDepartmentAgents();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatPageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatPageVisited.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Livechat Page Visited model
 */
class LivechatPageVisited extends RocketChat.models._Base {
  constructor() {
    super('livechat_page_visited');
    this.tryEnsureIndex({
      'token': 1
    });
    this.tryEnsureIndex({
      'ts': 1
    }); // keep history for 1 month if the visitor does not register

    this.tryEnsureIndex({
      'expireAt': 1
    }, {
      sparse: 1,
      expireAfterSeconds: 0
    });
  }

  saveByToken(token, pageInfo) {
    // keep history of unregistered visitors for 1 month
    const keepHistoryMiliseconds = 2592000000;
    return this.insert({
      token,
      page: pageInfo,
      ts: new Date(),
      expireAt: new Date().getTime() + keepHistoryMiliseconds
    });
  }

  findByToken(token) {
    return this.find({
      token
    }, {
      sort: {
        ts: -1
      },
      limit: 20
    });
  }

  keepHistoryForToken(token) {
    return this.update({
      token,
      expireAt: {
        $exists: true
      }
    }, {
      $unset: {
        expireAt: 1
      }
    }, {
      multi: true
    });
  }

}

RocketChat.models.LivechatPageVisited = new LivechatPageVisited();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatTrigger.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Livechat Trigger model
 */
class LivechatTrigger extends RocketChat.models._Base {
  constructor() {
    super('livechat_trigger');
  }

  updateById(_id, data) {
    return this.update({
      _id
    }, {
      $set: data
    });
  }

  removeAll() {
    return this.remove({});
  }

  findById(_id) {
    return this.find({
      _id
    });
  }

  removeById(_id) {
    return this.remove({
      _id
    });
  }

  findEnabled() {
    return this.find({
      enabled: true
    });
  }

}

RocketChat.models.LivechatTrigger = new LivechatTrigger();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"indexes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/indexes.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.models.Rooms.tryEnsureIndex({
    open: 1
  }, {
    sparse: 1
  });
  RocketChat.models.Users.tryEnsureIndex({
    'visitorEmails.address': 1
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatInquiry.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class LivechatInquiry extends RocketChat.models._Base {
  constructor() {
    super('livechat_inquiry');
    this.tryEnsureIndex({
      'rid': 1
    }); // room id corresponding to this inquiry

    this.tryEnsureIndex({
      'name': 1
    }); // name of the inquiry (client name for now)

    this.tryEnsureIndex({
      'message': 1
    }); // message sent by the client

    this.tryEnsureIndex({
      'ts': 1
    }); // timestamp

    this.tryEnsureIndex({
      'agents': 1
    }); // Id's of the agents who can see the inquiry (handle departments)

    this.tryEnsureIndex({
      'status': 1
    }); // 'open', 'taken'
  }

  findOneById(inquiryId) {
    return this.findOne({
      _id: inquiryId
    });
  }
  /*
   * mark the inquiry as taken
   */


  takeInquiry(inquiryId) {
    this.update({
      '_id': inquiryId
    }, {
      $set: {
        status: 'taken'
      }
    });
  }
  /*
   * mark the inquiry as closed
   */


  closeByRoomId(roomId, closeInfo) {
    return this.update({
      rid: roomId
    }, {
      $set: {
        status: 'closed',
        closer: closeInfo.closer,
        closedBy: closeInfo.closedBy,
        closedAt: closeInfo.closedAt,
        chatDuration: closeInfo.chatDuration
      }
    });
  }
  /*
   * mark inquiry as open
   */


  openInquiry(inquiryId) {
    this.update({
      '_id': inquiryId
    }, {
      $set: {
        status: 'open'
      }
    });
  }
  /*
   * return the status of the inquiry (open or taken)
   */


  getStatus(inquiryId) {
    return this.findOne({
      '_id': inquiryId
    }).status;
  }

  updateVisitorStatus(token, status) {
    const query = {
      'v.token': token,
      status: 'open'
    };
    const update = {
      $set: {
        'v.status': status
      }
    };
    return this.update(query, update);
  }

}

RocketChat.models.LivechatInquiry = new LivechatInquiry();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatOfficeHour.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatOfficeHour.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);

class LivechatOfficeHour extends RocketChat.models._Base {
  constructor() {
    super('livechat_office_hour');
    this.tryEnsureIndex({
      'day': 1
    }); // the day of the week monday - sunday

    this.tryEnsureIndex({
      'start': 1
    }); // the opening hours of the office

    this.tryEnsureIndex({
      'finish': 1
    }); // the closing hours of the office

    this.tryEnsureIndex({
      'open': 1
    }); // whether or not the offices are open on this day
    // if there is nothing in the collection, add defaults

    if (this.find().count() === 0) {
      this.insert({
        'day': 'Monday',
        'start': '08:00',
        'finish': '20:00',
        'code': 1,
        'open': true
      });
      this.insert({
        'day': 'Tuesday',
        'start': '08:00',
        'finish': '20:00',
        'code': 2,
        'open': true
      });
      this.insert({
        'day': 'Wednesday',
        'start': '08:00',
        'finish': '20:00',
        'code': 3,
        'open': true
      });
      this.insert({
        'day': 'Thursday',
        'start': '08:00',
        'finish': '20:00',
        'code': 4,
        'open': true
      });
      this.insert({
        'day': 'Friday',
        'start': '08:00',
        'finish': '20:00',
        'code': 5,
        'open': true
      });
      this.insert({
        'day': 'Saturday',
        'start': '08:00',
        'finish': '20:00',
        'code': 6,
        'open': false
      });
      this.insert({
        'day': 'Sunday',
        'start': '08:00',
        'finish': '20:00',
        'code': 0,
        'open': false
      });
    }
  }
  /*
   * update the given days start and finish times and whether the office is open on that day
   */


  updateHours(day, newStart, newFinish, newOpen) {
    this.update({
      day
    }, {
      $set: {
        start: newStart,
        finish: newFinish,
        open: newOpen
      }
    });
  }
  /*
   * Check if the current server time (utc) is within the office hours of that day
   * returns true or false
   */


  isNowWithinHours() {
    // get current time on server in utc
    // var ct = moment().utc();
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    } // check if offices are open today


    if (todaysOfficeHours.open === false) {
      return false;
    }

    const start = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.start}`, 'dddd:HH:mm');
    const finish = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.finish}`, 'dddd:HH:mm'); // console.log(finish.isBefore(start));

    if (finish.isBefore(start)) {
      // finish.day(finish.day()+1);
      finish.add(1, 'days');
    }

    const result = currentTime.isBetween(start, finish); // inBetween  check

    return result;
  }

  isOpeningTime() {
    // get current time on server in utc
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    } // check if offices are open today


    if (todaysOfficeHours.open === false) {
      return false;
    }

    const start = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.start}`, 'dddd:HH:mm');
    return start.isSame(currentTime, 'minute');
  }

  isClosingTime() {
    // get current time on server in utc
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    }

    const finish = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.finish}`, 'dddd:HH:mm');
    return finish.isSame(currentTime, 'minute');
  }

}

RocketChat.models.LivechatOfficeHour = new LivechatOfficeHour();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatVisitors.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatVisitors.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);

class LivechatVisitors extends RocketChat.models._Base {
  constructor() {
    super('livechat_visitor');
  }
  /**
   * Gets visitor by token
   * @param {string} token - Visitor token
   */


  getVisitorByToken(token, options) {
    const query = {
      token
    };
    return this.findOne(query, options);
  }
  /**
   * Find visitors by _id
   * @param {string} token - Visitor token
   */


  findById(_id, options) {
    const query = {
      _id
    };
    return this.find(query, options);
  }
  /**
   * Gets visitor by token
   * @param {string} token - Visitor token
   */


  findVisitorByToken(token) {
    const query = {
      token
    };
    return this.find(query);
  }

  updateLivechatDataByToken(token, key, value, overwrite = true) {
    const query = {
      token
    };

    if (!overwrite) {
      const user = this.findOne(query, {
        fields: {
          livechatData: 1
        }
      });

      if (user.livechatData && typeof user.livechatData[key] !== 'undefined') {
        return true;
      }
    }

    const update = {
      $set: {
        [`livechatData.${key}`]: value
      }
    };
    return this.update(query, update);
  }
  /**
   * Find a visitor by their phone number
   * @return {object} User from db
   */


  findOneVisitorByPhone(phone) {
    const query = {
      'phone.phoneNumber': phone
    };
    return this.findOne(query);
  }
  /**
   * Get the next visitor name
   * @return {string} The next visitor name
   */


  getNextVisitorUsername() {
    const settingsRaw = RocketChat.models.Settings.model.rawCollection();
    const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);
    const query = {
      _id: 'Livechat_guest_count'
    };
    const update = {
      $inc: {
        value: 1
      }
    };
    const livechatCount = findAndModify(query, null, update);
    return `guest-${livechatCount.value.value + 1}`;
  }

  updateById(_id, update) {
    return this.update({
      _id
    }, update);
  }

  saveGuestById(_id, data) {
    const setData = {};
    const unsetData = {};

    if (data.name) {
      if (!_.isEmpty(s.trim(data.name))) {
        setData.name = s.trim(data.name);
      } else {
        unsetData.name = 1;
      }
    }

    if (data.email) {
      if (!_.isEmpty(s.trim(data.email))) {
        setData.visitorEmails = [{
          address: s.trim(data.email)
        }];
      } else {
        unsetData.visitorEmails = 1;
      }
    }

    if (data.phone) {
      if (!_.isEmpty(s.trim(data.phone))) {
        setData.phone = [{
          phoneNumber: s.trim(data.phone)
        }];
      } else {
        unsetData.phone = 1;
      }
    }

    const update = {};

    if (!_.isEmpty(setData)) {
      update.$set = setData;
    }

    if (!_.isEmpty(unsetData)) {
      update.$unset = unsetData;
    }

    if (_.isEmpty(update)) {
      return true;
    }

    return this.update({
      _id
    }, update);
  }

  findOneGuestByEmailAddress(emailAddress) {
    const query = {
      'visitorEmails.address': new RegExp(`^${s.escapeRegExp(emailAddress)}$`, 'i')
    };
    return this.findOne(query);
  }

  saveGuestEmailPhoneById(_id, emails, phones) {
    const update = {
      $addToSet: {}
    };
    const saveEmail = [].concat(emails).filter(email => email && email.trim()).map(email => {
      return {
        address: email
      };
    });

    if (saveEmail.length > 0) {
      update.$addToSet.visitorEmails = {
        $each: saveEmail
      };
    }

    const savePhone = [].concat(phones).filter(phone => phone && phone.trim().replace(/[^\d]/g, '')).map(phone => {
      return {
        phoneNumber: phone
      };
    });

    if (savePhone.length > 0) {
      update.$addToSet.phone = {
        $each: savePhone
      };
    }

    if (!update.$addToSet.visitorEmails && !update.$addToSet.phone) {
      return;
    }

    return this.update({
      _id
    }, update);
  }

}

module.exportDefault(new LivechatVisitors());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lib":{"Livechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/Livechat.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
let UAParser;
module.watch(require("ua-parser-js"), {
  default(v) {
    UAParser = v;
  }

}, 2);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 3);
RocketChat.Livechat = {
  historyMonitorType: 'url',
  logger: new Logger('Livechat', {
    sections: {
      webhook: 'Webhook'
    }
  }),

  getNextAgent(department) {
    if (RocketChat.settings.get('Livechat_Routing_Method') === 'External') {
      for (let i = 0; i < 10; i++) {
        try {
          const queryString = department ? `?departmentId=${department}` : '';
          const result = HTTP.call('GET', `${RocketChat.settings.get('Livechat_External_Queue_URL')}${queryString}`, {
            headers: {
              'User-Agent': 'RocketChat Server',
              'Accept': 'application/json',
              'X-RocketChat-Secret-Token': RocketChat.settings.get('Livechat_External_Queue_Token')
            }
          });

          if (result && result.data && result.data.username) {
            const agent = RocketChat.models.Users.findOneOnlineAgentByUsername(result.data.username);

            if (agent) {
              return {
                agentId: agent._id,
                username: agent.username
              };
            }
          }
        } catch (e) {
          console.error('Error requesting agent from external queue.', e);
          break;
        }
      }

      throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
    } else if (department) {
      return RocketChat.models.LivechatDepartmentAgents.getNextAgentForDepartment(department);
    }

    return RocketChat.models.Users.getNextAgent();
  },

  getAgents(department) {
    if (department) {
      return RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(department);
    } else {
      return RocketChat.models.Users.findAgents();
    }
  },

  getOnlineAgents(department) {
    if (department) {
      return RocketChat.models.LivechatDepartmentAgents.getOnlineForDepartment(department);
    } else {
      return RocketChat.models.Users.findOnlineAgents();
    }
  },

  getRequiredDepartment(onlineRequired = true) {
    const departments = RocketChat.models.LivechatDepartment.findEnabledWithAgents();
    return departments.fetch().find(dept => {
      if (!dept.showOnRegistration) {
        return false;
      }

      if (!onlineRequired) {
        return true;
      }

      const onlineAgents = RocketChat.models.LivechatDepartmentAgents.getOnlineForDepartment(dept._id);
      return onlineAgents.count() > 0;
    });
  },

  getRoom(guest, message, roomInfo, agent) {
    let room = RocketChat.models.Rooms.findOneById(message.rid);
    let newRoom = false;

    if (room && !room.open) {
      message.rid = Random.id();
      room = null;
    }

    if (room == null) {
      // if no department selected verify if there is at least one active and pick the first
      if (!agent && !guest.department) {
        const department = this.getRequiredDepartment();

        if (department) {
          guest.department = department._id;
        }
      } // delegate room creation to QueueMethods


      const routingMethod = RocketChat.settings.get('Livechat_Routing_Method');
      room = RocketChat.QueueMethods[routingMethod](guest, message, roomInfo, agent);
      newRoom = true;
    }

    if (!room || room.v.token !== guest.token) {
      throw new Meteor.Error('cannot-access-room');
    }

    if (newRoom) {
      RocketChat.models.Messages.setRoomIdByToken(guest.token, room._id);
    }

    return {
      room,
      newRoom
    };
  },

  sendMessage({
    guest,
    message,
    roomInfo,
    agent
  }) {
    const {
      room,
      newRoom
    } = this.getRoom(guest, message, roomInfo, agent);

    if (guest.name) {
      message.alias = guest.name;
    } // return messages;


    return _.extend(RocketChat.sendMessage(guest, message, room), {
      newRoom,
      showConnecting: this.showConnecting()
    });
  },

  registerGuest({
    token,
    name,
    email,
    department,
    phone,
    username
  } = {}) {
    check(token, String);
    let userId;
    const updateUser = {
      $set: {
        token
      }
    };
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (user) {
      userId = user._id;
    } else {
      if (!username) {
        username = LivechatVisitors.getNextVisitorUsername();
      }

      let existingUser = null;

      if (s.trim(email) !== '' && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(email))) {
        userId = existingUser._id;
      } else {
        const userData = {
          username,
          department
        };

        if (this.connection) {
          userData.userAgent = this.connection.httpHeaders['user-agent'];
          userData.ip = this.connection.httpHeaders['x-real-ip'] || this.connection.httpHeaders['x-forwarded-for'] || this.connection.clientAddress;
          userData.host = this.connection.httpHeaders.host;
        }

        userId = LivechatVisitors.insert(userData);
      }
    }

    if (phone) {
      updateUser.$set.phone = [{
        phoneNumber: phone.number
      }];
    }

    if (email && email.trim() !== '') {
      updateUser.$set.visitorEmails = [{
        address: email
      }];
    }

    if (name) {
      updateUser.$set.name = name;
    }

    LivechatVisitors.updateById(userId, updateUser);
    return userId;
  },

  setDepartmentForGuest({
    token,
    department
  } = {}) {
    check(token, String);
    const updateUser = {
      $set: {
        department
      }
    };
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (user) {
      return Meteor.users.update(user._id, updateUser);
    }

    return false;
  },

  saveGuest({
    _id,
    name,
    email,
    phone
  }) {
    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    if (email) {
      updateData.email = email;
    }

    if (phone) {
      updateData.phone = phone;
    }

    const ret = LivechatVisitors.saveGuestById(_id, updateData);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveGuest', updateData);
    });
    return ret;
  },

  closeRoom({
    user,
    visitor,
    room,
    comment
  }) {
    const now = new Date();
    const closeData = {
      closedAt: now,
      chatDuration: (now.getTime() - room.ts) / 1000
    };

    if (user) {
      closeData.closer = 'user';
      closeData.closedBy = {
        _id: user._id,
        username: user.username
      };
    } else if (visitor) {
      closeData.closer = 'visitor';
      closeData.closedBy = {
        _id: visitor._id,
        username: visitor.username
      };
    }

    RocketChat.models.Rooms.closeByRoomId(room._id, closeData);
    RocketChat.models.LivechatInquiry.closeByRoomId(room._id, closeData);
    const message = {
      t: 'livechat-close',
      msg: comment,
      groupable: false
    };
    RocketChat.sendMessage(user, message, room);

    if (room.servedBy) {
      RocketChat.models.Subscriptions.hideByRoomIdAndUserId(room._id, room.servedBy._id);
    }

    RocketChat.models.Messages.createCommandWithRoomIdAndUser('promptTranscript', room._id, closeData.closedBy);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.closeRoom', room);
    });
    return true;
  },

  getInitSettings() {
    const settings = {};
    RocketChat.models.Settings.findNotHiddenPublic(['Livechat_title', 'Livechat_title_color', 'Livechat_enabled', 'Livechat_registration_form', 'Livechat_allow_switching_departments', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_form_unavailable', 'Livechat_display_offline_form', 'Livechat_videocall_enabled', 'Jitsi_Enabled', 'Language', 'Livechat_enable_transcript', 'Livechat_transcript_message', 'Livechat_conversation_finished_message', 'Livechat_name_field_registration_form', 'Livechat_email_field_registration_form']).forEach(setting => {
      settings[setting._id] = setting.value;
    });
    return settings;
  },

  saveRoomInfo(roomData, guestData) {
    if ((roomData.topic != null || roomData.tags != null) && !RocketChat.models.Rooms.setTopicAndTagsById(roomData._id, roomData.topic, roomData.tags)) {
      return false;
    }

    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveRoom', roomData);
    });

    if (!_.isEmpty(guestData.name)) {
      return RocketChat.models.Rooms.setFnameById(roomData._id, guestData.name) && RocketChat.models.Subscriptions.updateDisplayNameByRoomId(roomData._id, guestData.name);
    }
  },

  closeOpenChats(userId, comment) {
    const user = RocketChat.models.Users.findOneById(userId);
    RocketChat.models.Rooms.findOpenByAgent(userId).forEach(room => {
      this.closeRoom({
        user,
        room,
        comment
      });
    });
  },

  forwardOpenChats(userId) {
    RocketChat.models.Rooms.findOpenByAgent(userId).forEach(room => {
      const guest = RocketChat.models.Users.findOneById(room.v._id);
      this.transfer(room, guest, {
        departmentId: guest.department
      });
    });
  },

  savePageHistory(token, roomId, pageInfo) {
    if (pageInfo.change === RocketChat.Livechat.historyMonitorType) {
      const user = RocketChat.models.Users.findOneById('rocket.cat');
      const pageTitle = pageInfo.title;
      const pageUrl = pageInfo.location.href;
      const extraData = {
        navigation: {
          page: pageInfo,
          token
        }
      };

      if (!roomId) {
        // keep history of unregistered visitors for 1 month
        const keepHistoryMiliseconds = 2592000000;
        extraData.expireAt = new Date().getTime() + keepHistoryMiliseconds;
      }

      if (!RocketChat.settings.get('Livechat_Visitor_navigation_as_a_message')) {
        extraData._hidden = true;
      }

      return RocketChat.models.Messages.createNavigationHistoryWithRoomIdMessageAndUser(roomId, `${pageTitle} - ${pageUrl}`, user, extraData);
    }

    return;
  },

  transfer(room, guest, transferData) {
    let agent;

    if (transferData.userId) {
      const user = RocketChat.models.Users.findOneById(transferData.userId);
      agent = {
        agentId: user._id,
        username: user.username
      };
    } else {
      agent = RocketChat.Livechat.getNextAgent(transferData.departmentId);
    }

    const servedBy = room.servedBy;

    if (agent && agent.agentId !== servedBy._id) {
      room.usernames = _.without(room.usernames, servedBy.username).concat(agent.username);
      RocketChat.models.Rooms.changeAgentByRoomId(room._id, agent);
      const subscriptionData = {
        rid: room._id,
        name: guest.name || guest.username,
        alert: true,
        open: true,
        unread: 1,
        userMentions: 1,
        groupMentions: 0,
        u: {
          _id: agent.agentId,
          username: agent.username
        },
        t: 'l',
        desktopNotifications: 'all',
        mobilePushNotifications: 'all',
        emailNotifications: 'all'
      };
      RocketChat.models.Subscriptions.removeByRoomIdAndUserId(room._id, servedBy._id);
      RocketChat.models.Subscriptions.insert(subscriptionData);
      RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(room._id, {
        _id: servedBy._id,
        username: servedBy.username
      });
      RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, {
        _id: agent.agentId,
        username: agent.username
      });
      RocketChat.Livechat.stream.emit(room._id, {
        type: 'agentData',
        data: RocketChat.models.Users.getAgentInfo(agent.agentId)
      });
      return true;
    }

    return false;
  },

  sendRequest(postData, callback, trying = 1) {
    try {
      const options = {
        headers: {
          'X-RocketChat-Livechat-Token': RocketChat.settings.get('Livechat_secret_token')
        },
        data: postData
      };
      return HTTP.post(RocketChat.settings.get('Livechat_webhookUrl'), options);
    } catch (e) {
      RocketChat.Livechat.logger.webhook.error(`Response error on ${trying} try ->`, e); // try 10 times after 10 seconds each

      if (trying < 10) {
        RocketChat.Livechat.logger.webhook.warn('Will try again in 10 seconds ...');
        trying++;
        setTimeout(Meteor.bindEnvironment(() => {
          RocketChat.Livechat.sendRequest(postData, callback, trying);
        }), 10000);
      }
    }
  },

  getLivechatRoomGuestInfo(room) {
    const visitor = LivechatVisitors.findOneById(room.v._id);
    const agent = RocketChat.models.Users.findOneById(room.servedBy && room.servedBy._id);
    const ua = new UAParser();
    ua.setUA(visitor.userAgent);
    const postData = {
      _id: room._id,
      label: room.fname || room.label,
      // using same field for compatibility
      topic: room.topic,
      createdAt: room.ts,
      lastMessageAt: room.lm,
      tags: room.tags,
      customFields: room.livechatData,
      visitor: {
        _id: visitor._id,
        token: visitor.token,
        name: visitor.name,
        username: visitor.username,
        email: null,
        phone: null,
        department: visitor.department,
        ip: visitor.ip,
        os: ua.getOS().name && `${ua.getOS().name} ${ua.getOS().version}`,
        browser: ua.getBrowser().name && `${ua.getBrowser().name} ${ua.getBrowser().version}`,
        customFields: visitor.livechatData
      }
    };

    if (agent) {
      postData.agent = {
        _id: agent._id,
        username: agent.username,
        name: agent.name,
        email: null
      };

      if (agent.emails && agent.emails.length > 0) {
        postData.agent.email = agent.emails[0].address;
      }
    }

    if (room.crmData) {
      postData.crmData = room.crmData;
    }

    if (visitor.visitorEmails && visitor.visitorEmails.length > 0) {
      postData.visitor.email = visitor.visitorEmails;
    }

    if (visitor.phone && visitor.phone.length > 0) {
      postData.visitor.phone = visitor.phone;
    }

    return postData;
  },

  addAgent(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:addAgent'
      });
    }

    if (RocketChat.authz.addUserRoles(user._id, 'livechat-agent')) {
      RocketChat.models.Users.setOperator(user._id, true);
      RocketChat.models.Users.setLivechatStatus(user._id, 'available');
      return user;
    }

    return false;
  },

  addManager(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:addManager'
      });
    }

    if (RocketChat.authz.addUserRoles(user._id, 'livechat-manager')) {
      return user;
    }

    return false;
  },

  removeAgent(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:removeAgent'
      });
    }

    if (RocketChat.authz.removeUserFromRoles(user._id, 'livechat-agent')) {
      RocketChat.models.Users.setOperator(user._id, false);
      RocketChat.models.Users.setLivechatStatus(user._id, 'not-available');
      return true;
    }

    return false;
  },

  removeManager(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:removeManager'
      });
    }

    return RocketChat.authz.removeUserFromRoles(user._id, 'livechat-manager');
  },

  saveDepartment(_id, departmentData, departmentAgents) {
    check(_id, Match.Maybe(String));
    check(departmentData, {
      enabled: Boolean,
      name: String,
      description: Match.Optional(String),
      showOnRegistration: Boolean
    });
    check(departmentAgents, [Match.ObjectIncluding({
      agentId: String,
      username: String
    })]);

    if (_id) {
      const department = RocketChat.models.LivechatDepartment.findOneById(_id);

      if (!department) {
        throw new Meteor.Error('error-department-not-found', 'Department not found', {
          method: 'livechat:saveDepartment'
        });
      }
    }

    return RocketChat.models.LivechatDepartment.createOrUpdateDepartment(_id, departmentData, departmentAgents);
  },

  removeDepartment(_id) {
    check(_id, String);
    const department = RocketChat.models.LivechatDepartment.findOneById(_id, {
      fields: {
        _id: 1
      }
    });

    if (!department) {
      throw new Meteor.Error('department-not-found', 'Department not found', {
        method: 'livechat:removeDepartment'
      });
    }

    return RocketChat.models.LivechatDepartment.removeById(_id);
  },

  showConnecting() {
    if (RocketChat.settings.get('Livechat_Routing_Method') === 'Guest_Pool') {
      return RocketChat.settings.get('Livechat_open_inquiery_show_connecting');
    } else {
      return false;
    }
  }

};
RocketChat.Livechat.stream = new Meteor.Streamer('livechat-room');
RocketChat.Livechat.stream.allowRead((roomId, extraData) => {
  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (!room) {
    console.warn(`Invalid eventName: "${roomId}"`);
    return false;
  }

  if (room.t === 'l' && extraData && extraData.token && room.v.token === extraData.token) {
    return true;
  }

  return false;
});
RocketChat.settings.get('Livechat_history_monitor_type', (key, value) => {
  RocketChat.Livechat.historyMonitorType = value;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QueueMethods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/QueueMethods.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.QueueMethods = {
  /* Least Amount Queuing method:
   *
   * default method where the agent with the least number
   * of open chats is paired with the incoming livechat
   */
  'Least_Amount'(guest, message, roomInfo, agent) {
    if (!agent) {
      agent = RocketChat.Livechat.getNextAgent(guest.department);

      if (!agent) {
        throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
      }
    }

    RocketChat.models.Rooms.updateLivechatRoomCount();

    const room = _.extend({
      _id: message.rid,
      msgs: 1,
      lm: new Date(),
      fname: roomInfo && roomInfo.fname || guest.name || guest.username,
      // usernames: [agent.username, guest.username],
      t: 'l',
      ts: new Date(),
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status || 'online'
      },
      servedBy: {
        _id: agent.agentId,
        username: agent.username
      },
      cl: false,
      open: true,
      waitingResponse: true
    }, roomInfo);

    const subscriptionData = {
      rid: message.rid,
      fname: guest.name || guest.username,
      alert: true,
      open: true,
      unread: 1,
      userMentions: 1,
      groupMentions: 0,
      u: {
        _id: agent.agentId,
        username: agent.username
      },
      t: 'l',
      desktopNotifications: 'all',
      mobilePushNotifications: 'all',
      emailNotifications: 'all'
    };
    RocketChat.models.Rooms.insert(room);
    RocketChat.models.Subscriptions.insert(subscriptionData);
    RocketChat.Livechat.stream.emit(room._id, {
      type: 'agentData',
      data: RocketChat.models.Users.getAgentInfo(agent.agentId)
    });
    return room;
  },

  /* Guest Pool Queuing Method:
   *
   * An incomming livechat is created as an Inquiry
   * which is picked up from an agent.
   * An Inquiry is visible to all agents (TODO: in the correct department)
      *
   * A room is still created with the initial message, but it is occupied by
   * only the client until paired with an agent
   */
  'Guest_Pool'(guest, message, roomInfo) {
    let agents = RocketChat.Livechat.getOnlineAgents(guest.department);

    if (agents.count() === 0 && RocketChat.settings.get('Livechat_guest_pool_with_no_agents')) {
      agents = RocketChat.Livechat.getAgents(guest.department);
    }

    if (agents.count() === 0) {
      throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
    }

    RocketChat.models.Rooms.updateLivechatRoomCount();
    const agentIds = [];
    agents.forEach(agent => {
      if (guest.department) {
        agentIds.push(agent.agentId);
      } else {
        agentIds.push(agent._id);
      }
    });
    const inquiry = {
      rid: message.rid,
      message: message.msg,
      name: guest.name || guest.username,
      ts: new Date(),
      department: guest.department,
      agents: agentIds,
      status: 'open',
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status || 'online'
      },
      t: 'l'
    };

    const room = _.extend({
      _id: message.rid,
      msgs: 1,
      lm: new Date(),
      fname: guest.name || guest.username,
      // usernames: [guest.username],
      t: 'l',
      ts: new Date(),
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status
      },
      cl: false,
      open: true,
      waitingResponse: true
    }, roomInfo);

    RocketChat.models.LivechatInquiry.insert(inquiry);
    RocketChat.models.Rooms.insert(room);
    return room;
  },

  'External'(guest, message, roomInfo, agent) {
    return this['Least_Amount'](guest, message, roomInfo, agent); // eslint-disable-line
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OfficeClock.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/OfficeClock.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Every minute check if office closed
Meteor.setInterval(function () {
  if (RocketChat.settings.get('Livechat_enable_office_hours')) {
    if (RocketChat.models.LivechatOfficeHour.isOpeningTime()) {
      RocketChat.models.Users.openOffice();
    } else if (RocketChat.models.LivechatOfficeHour.isClosingTime()) {
      RocketChat.models.Users.closeOffice();
    }
  }
}, 60000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OmniChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/OmniChannel.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const gatewayURL = 'https://omni.rocket.chat';
module.exportDefault({
  enable() {
    const result = HTTP.call('POST', `${gatewayURL}/facebook/enable`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`,
        'content-type': 'application/json'
      },
      data: {
        url: RocketChat.settings.get('Site_Url')
      }
    });
    return result.data;
  },

  disable() {
    const result = HTTP.call('DELETE', `${gatewayURL}/facebook/enable`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`,
        'content-type': 'application/json'
      }
    });
    return result.data;
  },

  listPages() {
    const result = HTTP.call('GET', `${gatewayURL}/facebook/pages`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  subscribe(pageId) {
    const result = HTTP.call('POST', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  unsubscribe(pageId) {
    const result = HTTP.call('DELETE', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  reply({
    page,
    token,
    text
  }) {
    return HTTP.call('POST', `${gatewayURL}/facebook/reply`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      },
      data: {
        page,
        token,
        text
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"sendMessageBySMS.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/sendMessageBySMS.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("./models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (!RocketChat.SMS.enabled) {
    return message;
  } // only send the sms by SMS if it is a livechat room with SMS set to true


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.sms && room.v && room.v.token)) {
    return message;
  } // if the message has a token, it was sent from the visitor, so ignore it


  if (message.token) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return message;
  }

  const SMSService = RocketChat.SMS.getService(RocketChat.settings.get('SMS_Service'));

  if (!SMSService) {
    return message;
  }

  const visitor = LivechatVisitors.getVisitorByToken(room.v.token);

  if (!visitor || !visitor.phone || visitor.phone.length === 0) {
    return message;
  }

  SMSService.send(room.sms.from, visitor.phone[0].phoneNumber, message.msg);
  return message;
}, RocketChat.callbacks.priority.LOW, 'sendMessageBySms');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unclosedLivechats.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/unclosedLivechats.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UserPresenceMonitor */
let agentsHandler;
let monitorAgents = false;
let actionTimeout = 60000;
const onlineAgents = {
  users: {},
  queue: {},

  add(userId) {
    if (this.queue[userId]) {
      clearTimeout(this.queue[userId]);
      delete this.queue[userId];
    }

    this.users[userId] = 1;
  },

  remove(userId, callback) {
    if (this.queue[userId]) {
      clearTimeout(this.queue[userId]);
    }

    this.queue[userId] = setTimeout(Meteor.bindEnvironment(() => {
      callback();
      delete this.users[userId];
      delete this.queue[userId];
    }), actionTimeout);
  },

  exists(userId) {
    return !!this.users[userId];
  }

};

function runAgentLeaveAction(userId) {
  const action = RocketChat.settings.get('Livechat_agent_leave_action');

  if (action === 'close') {
    return RocketChat.Livechat.closeOpenChats(userId, RocketChat.settings.get('Livechat_agent_leave_comment'));
  } else if (action === 'forward') {
    return RocketChat.Livechat.forwardOpenChats(userId);
  }
}

RocketChat.settings.get('Livechat_agent_leave_action_timeout', function (key, value) {
  actionTimeout = value * 1000;
});
RocketChat.settings.get('Livechat_agent_leave_action', function (key, value) {
  monitorAgents = value;

  if (value !== 'none') {
    if (!agentsHandler) {
      agentsHandler = RocketChat.models.Users.findOnlineAgents().observeChanges({
        added(id) {
          onlineAgents.add(id);
        },

        changed(id, fields) {
          if (fields.statusLivechat && fields.statusLivechat === 'not-available') {
            onlineAgents.remove(id, () => {
              runAgentLeaveAction(id);
            });
          } else {
            onlineAgents.add(id);
          }
        },

        removed(id) {
          onlineAgents.remove(id, () => {
            runAgentLeaveAction(id);
          });
        }

      });
    }
  } else if (agentsHandler) {
    agentsHandler.stop();
    agentsHandler = null;
  }
});
UserPresenceMonitor.onSetUserStatus((user, status
/*, statusConnection*/
) => {
  if (!monitorAgents) {
    return;
  }

  if (onlineAgents.exists(user._id)) {
    if (status === 'offline' || user.statusLivechat === 'not-available') {
      onlineAgents.remove(user._id, () => {
        runAgentLeaveAction(user._id);
      });
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"customFields.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/customFields.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.publish('livechat:customFields', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:customFields'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:customFields'
    }));
  }

  if (s.trim(_id)) {
    return RocketChat.models.LivechatCustomField.find({
      _id
    });
  }

  return RocketChat.models.LivechatCustomField.find();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"departmentAgents.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/departmentAgents.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:departmentAgents', function (departmentId) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:departmentAgents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:departmentAgents'
    }));
  }

  return RocketChat.models.LivechatDepartmentAgents.find({
    departmentId
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"externalMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/externalMessages.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:externalMessages', function (roomId) {
  return RocketChat.models.LivechatExternalMessage.findByRoomId(roomId);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatAgents.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatAgents.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:agents', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  const self = this;
  const handle = RocketChat.authz.getUsersInRole('livechat-agent').observeChanges({
    added(id, fields) {
      self.added('agentUsers', id, fields);
    },

    changed(id, fields) {
      self.changed('agentUsers', id, fields);
    },

    removed(id) {
      self.removed('agentUsers', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatAppearance.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatAppearance.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:appearance', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:appearance'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:appearance'
    }));
  }

  const query = {
    _id: {
      $in: ['Livechat_title', 'Livechat_title_color', 'Livechat_show_agent_email', 'Livechat_display_offline_form', 'Livechat_offline_form_unavailable', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_email', 'Livechat_conversation_finished_message', 'Livechat_registration_form', 'Livechat_name_field_registration_form', 'Livechat_email_field_registration_form']
    }
  };
  const self = this;
  const handle = RocketChat.models.Settings.find(query).observeChanges({
    added(id, fields) {
      self.added('livechatAppearance', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatAppearance', id, fields);
    },

    removed(id) {
      self.removed('livechatAppearance', id);
    }

  });
  this.ready();
  this.onStop(() => {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatDepartments.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatDepartments.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:departments', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (_id !== undefined) {
    return RocketChat.models.LivechatDepartment.findByDepartmentId(_id);
  } else {
    return RocketChat.models.LivechatDepartment.find();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatIntegration.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatIntegration.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:integration', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:integration'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:integration'
    }));
  }

  const self = this;
  const handle = RocketChat.models.Settings.findByIds(['Livechat_webhookUrl', 'Livechat_secret_token', 'Livechat_webhook_on_close', 'Livechat_webhook_on_offline_msg', 'Livechat_webhook_on_visitor_message', 'Livechat_webhook_on_agent_message']).observeChanges({
    added(id, fields) {
      self.added('livechatIntegration', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatIntegration', id, fields);
    },

    removed(id) {
      self.removed('livechatIntegration', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatManagers.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatManagers.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:managers', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:managers'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:managers'
    }));
  }

  const self = this;
  const handle = RocketChat.authz.getUsersInRole('livechat-manager').observeChanges({
    added(id, fields) {
      self.added('managerUsers', id, fields);
    },

    changed(id, fields) {
      self.changed('managerUsers', id, fields);
    },

    removed(id) {
      self.removed('managerUsers', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatRooms.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatRooms.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:rooms', function (filter = {}, offset = 0, limit = 20) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:rooms'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:rooms'
    }));
  }

  check(filter, {
    name: Match.Maybe(String),
    // room name to filter
    agent: Match.Maybe(String),
    // agent _id who is serving
    status: Match.Maybe(String),
    // either 'opened' or 'closed'
    from: Match.Maybe(Date),
    to: Match.Maybe(Date)
  });
  const query = {};

  if (filter.name) {
    query.label = new RegExp(filter.name, 'i');
  }

  if (filter.agent) {
    query['servedBy._id'] = filter.agent;
  }

  if (filter.status) {
    if (filter.status === 'opened') {
      query.open = true;
    } else {
      query.open = {
        $exists: false
      };
    }
  }

  if (filter.from) {
    query.ts = {
      $gte: filter.from
    };
  }

  if (filter.to) {
    filter.to.setDate(filter.to.getDate() + 1);
    filter.to.setSeconds(filter.to.getSeconds() - 1);

    if (!query.ts) {
      query.ts = {};
    }

    query.ts.$lte = filter.to;
  }

  const self = this;
  const handle = RocketChat.models.Rooms.findLivechat(query, offset, limit).observeChanges({
    added(id, fields) {
      self.added('livechatRoom', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatRoom', id, fields);
    },

    removed(id) {
      self.removed('livechatRoom', id);
    }

  });
  this.ready();
  this.onStop(() => {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatQueue.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatQueue.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:queue', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:queue'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:queue'
    }));
  } // let sort = { count: 1, sort: 1, username: 1 };
  // let onlineUsers = {};
  // let handleUsers = RocketChat.models.Users.findOnlineAgents().observeChanges({
  // 	added(id, fields) {
  // 		onlineUsers[fields.username] = 1;
  // 		// this.added('livechatQueueUser', id, fields);
  // 	},
  // 	changed(id, fields) {
  // 		onlineUsers[fields.username] = 1;
  // 		// this.changed('livechatQueueUser', id, fields);
  // 	},
  // 	removed(id) {
  // 		this.removed('livechatQueueUser', id);
  // 	}
  // });


  const self = this;
  const handleDepts = RocketChat.models.LivechatDepartmentAgents.findUsersInQueue().observeChanges({
    added(id, fields) {
      self.added('livechatQueueUser', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatQueueUser', id, fields);
    },

    removed(id) {
      self.removed('livechatQueueUser', id);
    }

  });
  this.ready();
  this.onStop(() => {
    // handleUsers.stop();
    handleDepts.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatTriggers.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatTriggers.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:triggers', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:triggers'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:triggers'
    }));
  }

  if (_id !== undefined) {
    return RocketChat.models.LivechatTrigger.findById(_id);
  } else {
    return RocketChat.models.LivechatTrigger.find();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorHistory.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorHistory.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:visitorHistory', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (room.usernames.indexOf(user.username) === -1) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  const self = this;

  if (room && room.v && room.v._id) {
    const handle = RocketChat.models.Rooms.findByVisitorId(room.v._id).observeChanges({
      added(id, fields) {
        self.added('visitor_history', id, fields);
      },

      changed(id, fields) {
        self.changed('visitor_history', id, fields);
      },

      removed(id) {
        self.removed('visitor_history', id);
      }

    });
    self.ready();
    self.onStop(function () {
      handle.stop();
    });
  } else {
    self.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorInfo.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorInfo.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.publish('livechat:visitorInfo', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorInfo'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorInfo'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (room && room.v && room.v._id) {
    return LivechatVisitors.findById(room.v._id);
  } else {
    return this.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorPageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorPageVisited.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:visitorPageVisited', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorPageVisited'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorPageVisited'
    }));
  }

  const self = this;
  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (room) {
    const handle = RocketChat.models.Messages.findByRoomIdAndType(room._id, 'livechat_navigation_history').observeChanges({
      added(id, fields) {
        self.added('visitor_navigation_history', id, fields);
      },

      changed(id, fields) {
        self.changed('visitor_navigation_history', id, fields);
      },

      removed(id) {
        self.removed('visitor_navigation_history', id);
      }

    });
    self.ready();
    self.onStop(function () {
      handle.stop();
    });
  } else {
    self.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatInquiries.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatInquiries.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:inquiry', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:inquiry'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:inquiry'
    }));
  }

  const query = {
    agents: this.userId,
    status: 'open'
  };
  return RocketChat.models.LivechatInquiry.find(query);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatOfficeHours.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatOfficeHours.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:officeHour', function () {
  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  return RocketChat.models.LivechatOfficeHour.find();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/api.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("../imports/server/rest/departments.js"));
module.watch(require("../imports/server/rest/facebook.js"));
module.watch(require("../imports/server/rest/sms.js"));
module.watch(require("../imports/server/rest/users.js"));
module.watch(require("../imports/server/rest/messages.js"));
module.watch(require("../imports/server/rest/visitors.js"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"permissions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/permissions.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.startup(() => {
  const roles = _.pluck(RocketChat.models.Roles.find().fetch(), 'name');

  if (roles.indexOf('livechat-agent') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-agent');
  }

  if (roles.indexOf('livechat-manager') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-manager');
  }

  if (roles.indexOf('livechat-guest') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-guest');
  }

  if (RocketChat.models && RocketChat.models.Permissions) {
    RocketChat.models.Permissions.createOrUpdate('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('view-livechat-manager', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('view-livechat-rooms', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('close-livechat-room', ['livechat-agent', 'livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('close-others-livechat-room', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('save-others-livechat-room-info', ['livechat-manager']);
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messageTypes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/messageTypes.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.MessageTypes.registerType({
  id: 'livechat_navigation_history',
  system: true,
  message: 'New_visitor_navigation',

  data(message) {
    if (!message.navigation || !message.navigation.page) {
      return;
    }

    return {
      history: `${(message.navigation.page.title ? `${message.navigation.page.title} - ` : '') + message.navigation.page.location.href}`
    };
  }

});
RocketChat.MessageTypes.registerType({
  id: 'livechat_video_call',
  system: true,
  message: 'New_videocall_request'
});
RocketChat.actionLinks.register('createLivechatCall', function (message, params, instance) {
  if (Meteor.isClient) {
    instance.tabBar.open('video');
  }
});
RocketChat.actionLinks.register('denyLivechatCall', function (message
/*, params*/
) {
  if (Meteor.isServer) {
    const user = Meteor.user();
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('command', message.rid, 'endCall', user);
    RocketChat.Notifications.notifyRoom(message.rid, 'deleteMessage', {
      _id: message._id
    });
    const language = user.language || RocketChat.settings.get('language') || 'en';
    RocketChat.Livechat.closeRoom({
      user,
      room: RocketChat.models.Rooms.findOneById(message.rid),
      comment: TAPi18n.__('Videocall_declined', {
        lng: language
      })
    });
    Meteor.defer(() => {
      RocketChat.models.Messages.setHiddenById(message._id);
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomType.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/roomType.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext;
module.watch(require("meteor/rocketchat:lib"), {
  RoomSettingsEnum(v) {
    RoomSettingsEnum = v;
  },

  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  },

  RoomTypeRouteConfig(v) {
    RoomTypeRouteConfig = v;
  },

  UiTextContext(v) {
    UiTextContext = v;
  }

}, 0);

class LivechatRoomRoute extends RoomTypeRouteConfig {
  constructor() {
    super({
      name: 'live',
      path: '/live/:id'
    });
  }

  action(params) {
    openRoom('l', params.id);
  }

  link(sub) {
    return {
      id: sub.rid
    };
  }

}

class LivechatRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'l',
      order: 5,
      icon: 'livechat',
      label: 'Livechat',
      route: new LivechatRoomRoute()
    });
    this.notSubscribedTpl = {
      template: 'livechatNotSubscribed'
    };
  }

  findRoom(identifier) {
    return ChatRoom.findOne({
      _id: identifier
    });
  }

  roomName(roomData) {
    return roomData.name || roomData.fname || roomData.label;
  }

  condition() {
    return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-l-room');
  }

  canSendMessage(roomId) {
    const room = ChatRoom.findOne({
      _id: roomId
    }, {
      fields: {
        open: 1
      }
    });
    return room && room.open === true;
  }

  getUserStatus(roomId) {
    const room = Session.get(`roomData${roomId}`);

    if (room) {
      return room.v && room.v.status;
    }

    const inquiry = LivechatInquiry.findOne({
      rid: roomId
    });
    return inquiry && inquiry.v && inquiry.v.status;
  }

  allowRoomSettingChange(room, setting) {
    switch (setting) {
      case RoomSettingsEnum.JOIN_CODE:
        return false;

      default:
        return true;
    }
  }

  getUiText(context) {
    switch (context) {
      case UiTextContext.HIDE_WARNING:
        return 'Hide_Livechat_Warning';

      case UiTextContext.LEAVE_WARNING:
        return 'Hide_Livechat_Warning';

      default:
        return '';
    }
  }

}

RocketChat.roomTypes.add(new LivechatRoomType());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"config.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/config.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.settings.addGroup('Livechat');
  RocketChat.settings.add('Livechat_enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_title', 'Rocket.Chat', {
    type: 'string',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_title_color', '#C1272D', {
    type: 'color',
    editor: 'color',
    allowedTypes: ['color', 'expression'],
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_display_offline_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Display_offline_form'
  });
  RocketChat.settings.add('Livechat_validate_offline_email', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Validate_email_address'
  });
  RocketChat.settings.add('Livechat_offline_form_unavailable', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Offline_form_unavailable_message'
  });
  RocketChat.settings.add('Livechat_offline_title', 'Leave a message', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Title'
  });
  RocketChat.settings.add('Livechat_offline_title_color', '#666666', {
    type: 'color',
    editor: 'color',
    allowedTypes: ['color', 'expression'],
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Color'
  });
  RocketChat.settings.add('Livechat_offline_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Instructions',
    i18nDescription: 'Instructions_to_your_visitor_fill_the_form_to_send_a_message'
  });
  RocketChat.settings.add('Livechat_offline_email', '', {
    type: 'string',
    group: 'Livechat',
    i18nLabel: 'Email_address_to_send_offline_messages',
    section: 'Offline'
  });
  RocketChat.settings.add('Livechat_offline_success_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Offline_success_message'
  });
  RocketChat.settings.add('Livechat_allow_switching_departments', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Allow_switching_departments'
  });
  RocketChat.settings.add('Livechat_show_agent_email', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_agent_email'
  });
  RocketChat.settings.add('Livechat_conversation_finished_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Conversation_finished_message'
  });
  RocketChat.settings.add('Livechat_registration_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_preregistration_form'
  });
  RocketChat.settings.add('Livechat_name_field_registration_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_name_field'
  });
  RocketChat.settings.add('Livechat_email_field_registration_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_email_field'
  });
  RocketChat.settings.add('Livechat_guest_count', 1, {
    type: 'int',
    group: 'Livechat'
  });
  RocketChat.settings.add('Livechat_Room_Count', 1, {
    type: 'int',
    group: 'Livechat',
    i18nLabel: 'Livechat_room_count'
  });
  RocketChat.settings.add('Livechat_agent_leave_action', 'none', {
    type: 'select',
    group: 'Livechat',
    values: [{
      key: 'none',
      i18nLabel: 'None'
    }, {
      key: 'forward',
      i18nLabel: 'Forward'
    }, {
      key: 'close',
      i18nLabel: 'Close'
    }],
    i18nLabel: 'How_to_handle_open_sessions_when_agent_goes_offline'
  });
  RocketChat.settings.add('Livechat_agent_leave_action_timeout', 60, {
    type: 'int',
    group: 'Livechat',
    enableQuery: {
      _id: 'Livechat_agent_leave_action',
      value: {
        $ne: 'none'
      }
    },
    i18nLabel: 'How_long_to_wait_after_agent_goes_offline',
    i18nDescription: 'Time_in_seconds'
  });
  RocketChat.settings.add('Livechat_agent_leave_comment', '', {
    type: 'string',
    group: 'Livechat',
    enableQuery: {
      _id: 'Livechat_agent_leave_action',
      value: 'close'
    },
    i18nLabel: 'Comment_to_leave_on_closing_session'
  });
  RocketChat.settings.add('Livechat_webhookUrl', false, {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Webhook_URL'
  });
  RocketChat.settings.add('Livechat_secret_token', false, {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Secret_token'
  });
  RocketChat.settings.add('Livechat_webhook_on_close', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_chat_close'
  });
  RocketChat.settings.add('Livechat_webhook_on_offline_msg', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_offline_messages'
  });
  RocketChat.settings.add('Livechat_webhook_on_visitor_message', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_visitor_message'
  });
  RocketChat.settings.add('Livechat_webhook_on_agent_message', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_agent_message'
  });
  RocketChat.settings.add('Send_visitor_navigation_history_livechat_webhook_request', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_visitor_navigation_history_on_request',
    i18nDescription: 'Feature_Depends_on_Livechat_Visitor_navigation_as_a_message_to_be_enabled',
    enableQuery: {
      _id: 'Livechat_Visitor_navigation_as_a_message',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_webhook_on_capture', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_lead_capture'
  });
  RocketChat.settings.add('Livechat_lead_email_regex', '\\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\\.)+[A-Z]{2,4}\\b', {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Lead_capture_email_regex'
  });
  RocketChat.settings.add('Livechat_lead_phone_regex', '((?:\\([0-9]{1,3}\\)|[0-9]{2})[ \\-]*?[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$)|[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$))', {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Lead_capture_phone_regex'
  });
  RocketChat.settings.add('Livechat_Knowledge_Enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Enabled'
  });
  RocketChat.settings.add('Livechat_Knowledge_Apiai_Key', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Apiai_Key'
  });
  RocketChat.settings.add('Livechat_Knowledge_Apiai_Language', 'en', {
    type: 'string',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Apiai_Language'
  });
  RocketChat.settings.add('Livechat_history_monitor_type', 'url', {
    type: 'select',
    group: 'Livechat',
    i18nLabel: 'Monitor_history_for_changes_on',
    values: [{
      key: 'url',
      i18nLabel: 'Page_URL'
    }, {
      key: 'title',
      i18nLabel: 'Page_title'
    }]
  });
  RocketChat.settings.add('Livechat_Visitor_navigation_as_a_message', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Send_Visitor_navigation_history_as_a_message'
  });
  RocketChat.settings.add('Livechat_enable_office_hours', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Office_hours_enabled'
  });
  RocketChat.settings.add('Livechat_continuous_sound_notification_new_livechat_room', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Continuous_sound_notifications_for_new_livechat_room'
  });
  RocketChat.settings.add('Livechat_videocall_enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Videocall_enabled',
    i18nDescription: 'Beta_feature_Depends_on_Video_Conference_to_be_enabled',
    enableQuery: {
      _id: 'Jitsi_Enabled',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_enable_transcript', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Transcript_Enabled'
  });
  RocketChat.settings.add('Livechat_transcript_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Transcript_message',
    enableQuery: {
      _id: 'Livechat_enable_transcript',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_open_inquiery_show_connecting', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Livechat_open_inquiery_show_connecting',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'Guest_Pool'
    }
  });
  RocketChat.settings.add('Livechat_AllowedDomainsList', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Livechat_AllowedDomainsList',
    i18nDescription: 'Domains_allowed_to_embed_the_livechat_widget'
  });
  RocketChat.settings.add('Livechat_Facebook_Enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Facebook'
  });
  RocketChat.settings.add('Livechat_Facebook_API_Key', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Facebook',
    i18nDescription: 'If_you_dont_have_one_send_an_email_to_omni_rocketchat_to_get_yours'
  });
  RocketChat.settings.add('Livechat_Facebook_API_Secret', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Facebook',
    i18nDescription: 'If_you_dont_have_one_send_an_email_to_omni_rocketchat_to_get_yours'
  });
  RocketChat.settings.add('Livechat_RDStation_Token', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'RD Station',
    i18nLabel: 'RDStation_Token'
  });
  RocketChat.settings.add('Livechat_Routing_Method', 'Least_Amount', {
    type: 'select',
    group: 'Livechat',
    public: true,
    section: 'Routing',
    values: [{
      key: 'External',
      i18nLabel: 'External_Service'
    }, {
      key: 'Least_Amount',
      i18nLabel: 'Least_Amount'
    }, {
      key: 'Guest_Pool',
      i18nLabel: 'Guest_Pool'
    }]
  });
  RocketChat.settings.add('Livechat_guest_pool_with_no_agents', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Routing',
    i18nLabel: 'Accept_with_no_online_agents',
    i18nDescription: 'Accept_incoming_livechat_requests_even_if_there_are_no_online_agents',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'Guest_Pool'
    }
  });
  RocketChat.settings.add('Livechat_show_queue_list_link', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Routing',
    i18nLabel: 'Show_queue_list_to_all_agents',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: {
        $ne: 'External'
      }
    }
  });
  RocketChat.settings.add('Livechat_External_Queue_URL', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'Routing',
    i18nLabel: 'External_Queue_Service_URL',
    i18nDescription: 'For_more_details_please_check_our_docs',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'External'
    }
  });
  RocketChat.settings.add('Livechat_External_Queue_Token', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'Routing',
    i18nLabel: 'Secret_token',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'External'
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"imports":{"server":{"rest":{"departments.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/departments.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('livechat/department', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success({
      departments: RocketChat.models.LivechatDepartment.find().fetch()
    });
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.bodyParams, {
        department: Object,
        agents: Array
      });
      const department = RocketChat.Livechat.saveDepartment(null, this.bodyParams.department, this.bodyParams.agents);

      if (department) {
        return RocketChat.API.v1.success({
          department,
          agents: RocketChat.models.LivechatDepartmentAgents.find({
            departmentId: department._id
          }).fetch()
        });
      }

      RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e);
    }
  }

});
RocketChat.API.v1.addRoute('livechat/department/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });
      return RocketChat.API.v1.success({
        department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
        agents: RocketChat.models.LivechatDepartmentAgents.find({
          departmentId: this.urlParams._id
        }).fetch()
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  put() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });
      check(this.bodyParams, {
        department: Object,
        agents: Array
      });

      if (RocketChat.Livechat.saveDepartment(this.urlParams._id, this.bodyParams.department, this.bodyParams.agents)) {
        return RocketChat.API.v1.success({
          department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
          agents: RocketChat.models.LivechatDepartmentAgents.find({
            departmentId: this.urlParams._id
          }).fetch()
        });
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  delete() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });

      if (RocketChat.Livechat.removeDepartment(this.urlParams._id)) {
        return RocketChat.API.v1.success();
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/facebook.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let crypto;
module.watch(require("crypto"), {
  default(v) {
    crypto = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);

/**
 * @api {post} /livechat/facebook Send Facebook message
 * @apiName Facebook
 * @apiGroup Livechat
 *
 * @apiParam {String} mid Facebook message id
 * @apiParam {String} page Facebook pages id
 * @apiParam {String} token Facebook user's token
 * @apiParam {String} first_name Facebook user's first name
 * @apiParam {String} last_name Facebook user's last name
 * @apiParam {String} [text] Facebook message text
 * @apiParam {String} [attachments] Facebook message attachments
 */
RocketChat.API.v1.addRoute('livechat/facebook', {
  post() {
    if (!this.bodyParams.text && !this.bodyParams.attachments) {
      return {
        success: false
      };
    }

    if (!this.request.headers['x-hub-signature']) {
      return {
        success: false
      };
    }

    if (!RocketChat.settings.get('Livechat_Facebook_Enabled')) {
      return {
        success: false,
        error: 'Integration disabled'
      };
    } // validate if request come from omni


    const signature = crypto.createHmac('sha1', RocketChat.settings.get('Livechat_Facebook_API_Secret')).update(JSON.stringify(this.request.body)).digest('hex');

    if (this.request.headers['x-hub-signature'] !== `sha1=${signature}`) {
      return {
        success: false,
        error: 'Invalid signature'
      };
    }

    const sendMessage = {
      message: {
        _id: this.bodyParams.mid
      },
      roomInfo: {
        facebook: {
          page: this.bodyParams.page
        }
      }
    };
    let visitor = LivechatVisitors.getVisitorByToken(this.bodyParams.token);

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

      if (rooms && rooms.length > 0) {
        sendMessage.message.rid = rooms[0]._id;
      } else {
        sendMessage.message.rid = Random.id();
      }

      sendMessage.message.token = visitor.token;
    } else {
      sendMessage.message.rid = Random.id();
      sendMessage.message.token = this.bodyParams.token;
      const userId = RocketChat.Livechat.registerGuest({
        token: sendMessage.message.token,
        name: `${this.bodyParams.first_name} ${this.bodyParams.last_name}`
      });
      visitor = RocketChat.models.Users.findOneById(userId);
    }

    sendMessage.message.msg = this.bodyParams.text;
    sendMessage.guest = visitor;

    try {
      return {
        sucess: true,
        message: RocketChat.Livechat.sendMessage(sendMessage)
      };
    } catch (e) {
      console.error('Error using Facebook ->', e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/messages.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/messages', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.bodyParams.visitor) {
      return RocketChat.API.v1.failure('Body param "visitor" is required');
    }

    if (!this.bodyParams.visitor.token) {
      return RocketChat.API.v1.failure('Body param "visitor.token" is required');
    }

    if (!this.bodyParams.messages) {
      return RocketChat.API.v1.failure('Body param "messages" is required');
    }

    if (!(this.bodyParams.messages instanceof Array)) {
      return RocketChat.API.v1.failure('Body param "messages" is not an array');
    }

    if (this.bodyParams.messages.length === 0) {
      return RocketChat.API.v1.failure('Body param "messages" is empty');
    }

    const visitorToken = this.bodyParams.visitor.token;
    let visitor = LivechatVisitors.getVisitorByToken(visitorToken);
    let rid;

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken).fetch();

      if (rooms && rooms.length > 0) {
        rid = rooms[0]._id;
      } else {
        rid = Random.id();
      }
    } else {
      rid = Random.id();
      const visitorId = RocketChat.Livechat.registerGuest(this.bodyParams.visitor);
      visitor = LivechatVisitors.findOneById(visitorId);
    }

    const sentMessages = this.bodyParams.messages.map(message => {
      const sendMessage = {
        guest: visitor,
        message: {
          _id: Random.id(),
          rid,
          token: visitorToken,
          msg: message.msg
        }
      };
      const sentMessage = RocketChat.Livechat.sendMessage(sendMessage);
      return {
        username: sentMessage.u.username,
        msg: sentMessage.msg,
        ts: sentMessage.ts
      };
    });
    return RocketChat.API.v1.success({
      messages: sentMessages
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/sms.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/sms-incoming/:service', {
  post() {
    const SMSService = RocketChat.SMS.getService(this.urlParams.service);
    const sms = SMSService.parse(this.bodyParams);
    let visitor = LivechatVisitors.findOneVisitorByPhone(sms.from);
    const sendMessage = {
      message: {
        _id: Random.id()
      },
      roomInfo: {
        sms: {
          from: sms.to
        }
      }
    };

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

      if (rooms && rooms.length > 0) {
        sendMessage.message.rid = rooms[0]._id;
      } else {
        sendMessage.message.rid = Random.id();
      }

      sendMessage.message.token = visitor.token;
    } else {
      sendMessage.message.rid = Random.id();
      sendMessage.message.token = Random.id();
      const visitorId = RocketChat.Livechat.registerGuest({
        username: sms.from.replace(/[^0-9]/g, ''),
        token: sendMessage.message.token,
        phone: {
          number: sms.from
        }
      });
      visitor = LivechatVisitors.findOneById(visitorId);
    }

    sendMessage.message.msg = sms.body;
    sendMessage.guest = visitor;
    sendMessage.message.attachments = sms.media.map(curr => {
      const attachment = {
        message_link: curr.url
      };
      const contentType = curr.contentType;

      switch (contentType.substr(0, contentType.indexOf('/'))) {
        case 'image':
          attachment.image_url = curr.url;
          break;

        case 'video':
          attachment.video_url = curr.url;
          break;

        case 'audio':
          attachment.audio_url = curr.url;
          break;
      }

      return attachment;
    });

    try {
      const message = SMSService.response.call(this, RocketChat.Livechat.sendMessage(sendMessage));
      Meteor.defer(() => {
        if (sms.extra) {
          if (sms.extra.fromCountry) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'country', sms.extra.fromCountry);
          }

          if (sms.extra.fromState) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'state', sms.extra.fromState);
          }

          if (sms.extra.fromCity) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'city', sms.extra.fromCity);
          }
        }
      });
      return message;
    } catch (e) {
      return SMSService.error.call(this, e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/users.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/users/:type', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String
      });
      let role;

      if (this.urlParams.type === 'agent') {
        role = 'livechat-agent';
      } else if (this.urlParams.type === 'manager') {
        role = 'livechat-manager';
      } else {
        throw 'Invalid type';
      }

      const users = RocketChat.authz.getUsersInRole(role);
      return RocketChat.API.v1.success({
        users: users.fetch().map(user => _.pick(user, '_id', 'username', 'name', 'status', 'statusLivechat'))
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String
      });
      check(this.bodyParams, {
        username: String
      });

      if (this.urlParams.type === 'agent') {
        const user = RocketChat.Livechat.addAgent(this.bodyParams.username);

        if (user) {
          return RocketChat.API.v1.success({
            user
          });
        }
      } else if (this.urlParams.type === 'manager') {
        const user = RocketChat.Livechat.addManager(this.bodyParams.username);

        if (user) {
          return RocketChat.API.v1.success({
            user
          });
        }
      } else {
        throw 'Invalid type';
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
RocketChat.API.v1.addRoute('livechat/users/:type/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String,
        _id: String
      });
      const user = RocketChat.models.Users.findOneById(this.urlParams._id);

      if (!user) {
        return RocketChat.API.v1.failure('User not found');
      }

      let role;

      if (this.urlParams.type === 'agent') {
        role = 'livechat-agent';
      } else if (this.urlParams.type === 'manager') {
        role = 'livechat-manager';
      } else {
        throw 'Invalid type';
      }

      if (user.roles.indexOf(role) !== -1) {
        return RocketChat.API.v1.success({
          user: _.pick(user, '_id', 'username')
        });
      }

      return RocketChat.API.v1.success({
        user: null
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  delete() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String,
        _id: String
      });
      const user = RocketChat.models.Users.findOneById(this.urlParams._id);

      if (!user) {
        return RocketChat.API.v1.failure();
      }

      if (this.urlParams.type === 'agent') {
        if (RocketChat.Livechat.removeAgent(user.username)) {
          return RocketChat.API.v1.success();
        }
      } else if (this.urlParams.type === 'manager') {
        if (RocketChat.Livechat.removeManager(user.username)) {
          return RocketChat.API.v1.success();
        }
      } else {
        throw 'Invalid type';
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitors.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/visitors.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/visitor/:visitorToken', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    const visitor = LivechatVisitors.getVisitorByToken(this.urlParams.visitorToken);
    return RocketChat.API.v1.success(visitor);
  }

});
RocketChat.API.v1.addRoute('livechat/visitor/:visitorToken/room', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(this.urlParams.visitorToken, {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        servedBy: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      rooms
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"node_modules":{"ua-parser-js":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_livechat/node_modules/ua-parser-js/package.json                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "ua-parser-js";
exports.version = "0.7.17";
exports.main = "src/ua-parser.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"src":{"ua-parser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_livechat/node_modules/ua-parser-js/src/ua-parser.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * UAParser.js v0.7.17
 * Lightweight JavaScript-based User-Agent string parser
 * https://github.com/faisalman/ua-parser-js
 *
 * Copyright © 2012-2016 Faisal Salman <fyzlman@gmail.com>
 * Dual licensed under GPLv2 & MIT
 */

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.17',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        STR_TYPE    = 'string',
        MAJOR       = 'major', // deprecated
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv',
        WEARABLE    = 'wearable',
        EMBEDDED    = 'embedded';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            var margedRegexes = {};
            for (var i in regexes) {
                if (extensions[i] && extensions[i].length % 2 === 0) {
                    margedRegexes[i] = extensions[i].concat(regexes[i]);
                } else {
                    margedRegexes[i] = regexes[i];
                }
            }
            return margedRegexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          } else {
            return false;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        },
        major : function (version) {
            return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g,'').split(".")[0] : undefined;
        },
        trim : function (str) {
          return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function (ua, arrays) {

            //var result = {},
            var i = 0, j, k, p, q, matches, match;//, args = arguments;

            /*// construct object barebones
            for (p = 0; p < args[1].length; p++) {
                q = args[1][p];
                result[typeof q === OBJ_TYPE ? q[0] : q] = undefined;
            }*/

            // loop through all regexes maps
            while (i < arrays.length && !matches) {

                var regex = arrays[i],       // even sequence (0,2,4,..)
                    props = arrays[i + 1];   // odd sequence (1,3,5,..)
                j = k = 0;

                // try matching uastring with regexes
                while (j < regex.length && !matches) {

                    matches = regex[j++].exec(ua);

                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof q === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof q[1] == FUNC_TYPE) {
                                        // assign modified match
                                        this[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        this[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        this[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                this[q] = match ? match : undefined;
                            }
                        }
                    }
                }
                i += 2;
            }
            // console.log(this);
            //return this;
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    '10'        : ['NT 6.4', 'NT 10.0'],
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
            /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
            /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
            /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80
            ], [NAME, VERSION], [

            /(opios)[\/\s]+([\w\.]+)/i                                          // Opera mini on iphone >= 8.0
            ], [[NAME, 'Opera Mini'], VERSION], [

            /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
            ], [[NAME, 'Opera'], VERSION], [

            // Mixed
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]+)*/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)\/([\w\.]+)*/i,                                            // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser)\/([\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser
            ], [NAME, VERSION], [

            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
            ], [[NAME, 'IE'], VERSION], [

            /(edge)\/((\d+)?[\w\.]+)/i                                          // Microsoft Edge
            ], [NAME, VERSION], [

            /(yabrowser)\/([\w\.]+)/i                                           // Yandex
            ], [[NAME, 'Yandex'], VERSION], [

            /(puffin)\/([\w\.]+)/i                                              // Puffin
            ], [[NAME, 'Puffin'], VERSION], [

            /((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i
                                                                                // UCBrowser
            ], [[NAME, 'UCBrowser'], VERSION], [

            /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION], [

            /(micromessenger)\/([\w\.]+)/i                                      // WeChat
            ], [[NAME, 'WeChat'], VERSION], [

            /(QQ)\/([\d\.]+)/i                                                  // QQ, aka ShouQ
            ], [NAME, VERSION], [

            /m?(qqbrowser)[\/\s]?([\w\.]+)/i                                    // QQBrowser
            ], [NAME, VERSION], [

            /xiaomi\/miuibrowser\/([\w\.]+)/i                                   // MIUI Browser
            ], [VERSION, [NAME, 'MIUI Browser']], [

            /;fbav\/([\w\.]+);/i                                                // Facebook App for iOS & Android
            ], [VERSION, [NAME, 'Facebook']], [

            /headlesschrome(?:\/([\w\.]+)|\s)/i                                 // Chrome Headless
            ], [VERSION, [NAME, 'Chrome Headless']], [

            /\swv\).+(chrome)\/([\w\.]+)/i                                      // Chrome WebView
            ], [[NAME, /(.+)/, '$1 WebView'], VERSION], [

            /((?:oculus|samsung)browser)\/([\w\.]+)/i
            ], [[NAME, /(.+(?:g|us))(.+)/, '$1 $2'], VERSION], [                // Oculus / Samsung Browser

            /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
            ], [VERSION, [NAME, 'Android Browser']], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            ], [NAME, VERSION], [

            /(dolfin)\/([\w\.]+)/i                                              // Dolphin
            ], [[NAME, 'Dolphin'], VERSION], [

            /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION], [

            /(coast)\/([\w\.]+)/i                                               // Opera Coast
            ], [[NAME, 'Opera Coast'], VERSION], [

            /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
            ], [VERSION, [NAME, 'Firefox']], [

            /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
            ], [VERSION, [NAME, 'Mobile Safari']], [

            /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
            ], [VERSION, NAME], [

            /webkit.+?(gsa)\/([\w\.]+).+?(mobile\s?safari|safari)(\/[\w\.]+)/i  // Google Search Appliance on iOS
            ], [[NAME, 'GSA'], VERSION], [

            /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
            ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/([\w\.]+)/i,                                          // Konqueror
            /(webkit|khtml)\/([\w\.]+)/i
            ], [NAME, VERSION], [

            // Gecko based
            /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
            ], [[NAME, 'Netscape'], VERSION], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/([\w\.-]+)/i,
                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
            /(links)\s\(([\w\.]+)/i,                                            // Links
            /(gobrowser)\/?([\w\.]+)*/i,                                        // GoBrowser
            /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
            /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
            ], [NAME, VERSION]

            /* /////////////////////
            // Media players BEGIN
            ////////////////////////

            , [

            /(apple(?:coremedia|))\/((\d+)[\w\._]+)/i,                          // Generic Apple CoreMedia
            /(coremedia) v((\d+)[\w\._]+)/i
            ], [NAME, VERSION], [

            /(aqualung|lyssna|bsplayer)\/((\d+)?[\w\.-]+)/i                     // Aqualung/Lyssna/BSPlayer
            ], [NAME, VERSION], [

            /(ares|ossproxy)\s((\d+)[\w\.-]+)/i                                 // Ares/OSSProxy
            ], [NAME, VERSION], [

            /(audacious|audimusicstream|amarok|bass|core|dalvik|gnomemplayer|music on console|nsplayer|psp-internetradioplayer|videos)\/((\d+)[\w\.-]+)/i,
                                                                                // Audacious/AudiMusicStream/Amarok/BASS/OpenCORE/Dalvik/GnomeMplayer/MoC
                                                                                // NSPlayer/PSP-InternetRadioPlayer/Videos
            /(clementine|music player daemon)\s((\d+)[\w\.-]+)/i,               // Clementine/MPD
            /(lg player|nexplayer)\s((\d+)[\d\.]+)/i,
            /player\/(nexplayer|lg player)\s((\d+)[\w\.-]+)/i                   // NexPlayer/LG Player
            ], [NAME, VERSION], [
            /(nexplayer)\s((\d+)[\w\.-]+)/i                                     // Nexplayer
            ], [NAME, VERSION], [

            /(flrp)\/((\d+)[\w\.-]+)/i                                          // Flip Player
            ], [[NAME, 'Flip Player'], VERSION], [

            /(fstream|nativehost|queryseekspider|ia-archiver|facebookexternalhit)/i
                                                                                // FStream/NativeHost/QuerySeekSpider/IA Archiver/facebookexternalhit
            ], [NAME], [

            /(gstreamer) souphttpsrc (?:\([^\)]+\)){0,1} libsoup\/((\d+)[\w\.-]+)/i
                                                                                // Gstreamer
            ], [NAME, VERSION], [

            /(htc streaming player)\s[\w_]+\s\/\s((\d+)[\d\.]+)/i,              // HTC Streaming Player
            /(java|python-urllib|python-requests|wget|libcurl)\/((\d+)[\w\.-_]+)/i,
                                                                                // Java/urllib/requests/wget/cURL
            /(lavf)((\d+)[\d\.]+)/i                                             // Lavf (FFMPEG)
            ], [NAME, VERSION], [

            /(htc_one_s)\/((\d+)[\d\.]+)/i                                      // HTC One S
            ], [[NAME, /_/g, ' '], VERSION], [

            /(mplayer)(?:\s|\/)(?:(?:sherpya-){0,1}svn)(?:-|\s)(r\d+(?:-\d+[\w\.-]+){0,1})/i
                                                                                // MPlayer SVN
            ], [NAME, VERSION], [

            /(mplayer)(?:\s|\/|[unkow-]+)((\d+)[\w\.-]+)/i                      // MPlayer
            ], [NAME, VERSION], [

            /(mplayer)/i,                                                       // MPlayer (no other info)
            /(yourmuze)/i,                                                      // YourMuze
            /(media player classic|nero showtime)/i                             // Media Player Classic/Nero ShowTime
            ], [NAME], [

            /(nero (?:home|scout))\/((\d+)[\w\.-]+)/i                           // Nero Home/Nero Scout
            ], [NAME, VERSION], [

            /(nokia\d+)\/((\d+)[\w\.-]+)/i                                      // Nokia
            ], [NAME, VERSION], [

            /\s(songbird)\/((\d+)[\w\.-]+)/i                                    // Songbird/Philips-Songbird
            ], [NAME, VERSION], [

            /(winamp)3 version ((\d+)[\w\.-]+)/i,                               // Winamp
            /(winamp)\s((\d+)[\w\.-]+)/i,
            /(winamp)mpeg\/((\d+)[\w\.-]+)/i
            ], [NAME, VERSION], [

            /(ocms-bot|tapinradio|tunein radio|unknown|winamp|inlight radio)/i  // OCMS-bot/tap in radio/tunein/unknown/winamp (no other info)
                                                                                // inlight radio
            ], [NAME], [

            /(quicktime|rma|radioapp|radioclientapplication|soundtap|totem|stagefright|streamium)\/((\d+)[\w\.-]+)/i
                                                                                // QuickTime/RealMedia/RadioApp/RadioClientApplication/
                                                                                // SoundTap/Totem/Stagefright/Streamium
            ], [NAME, VERSION], [

            /(smp)((\d+)[\d\.]+)/i                                              // SMP
            ], [NAME, VERSION], [

            /(vlc) media player - version ((\d+)[\w\.]+)/i,                     // VLC Videolan
            /(vlc)\/((\d+)[\w\.-]+)/i,
            /(xbmc|gvfs|xine|xmms|irapp)\/((\d+)[\w\.-]+)/i,                    // XBMC/gvfs/Xine/XMMS/irapp
            /(foobar2000)\/((\d+)[\d\.]+)/i,                                    // Foobar2000
            /(itunes)\/((\d+)[\d\.]+)/i                                         // iTunes
            ], [NAME, VERSION], [

            /(wmplayer)\/((\d+)[\w\.-]+)/i,                                     // Windows Media Player
            /(windows-media-player)\/((\d+)[\w\.-]+)/i
            ], [[NAME, /-/g, ' '], VERSION], [

            /windows\/((\d+)[\w\.-]+) upnp\/[\d\.]+ dlnadoc\/[\d\.]+ (home media server)/i
                                                                                // Windows Media Server
            ], [VERSION, [NAME, 'Windows']], [

            /(com\.riseupradioalarm)\/((\d+)[\d\.]*)/i                          // RiseUP Radio Alarm
            ], [NAME, VERSION], [

            /(rad.io)\s((\d+)[\d\.]+)/i,                                        // Rad.io
            /(radio.(?:de|at|fr))\s((\d+)[\d\.]+)/i
            ], [[NAME, 'rad.io'], VERSION]

            //////////////////////
            // Media players END
            ////////////////////*/

        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+;))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

            /(archos)\s(gamepad2?)/i,                                           // Archos
            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(hp).+(tablet)/i,                                                  // HP Tablet
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i                               // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i                  // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\(bb10;\s(\w+)/i                                                   // BlackBerry 10
            ], [MODEL, [VENDOR, 'BlackBerry'], [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone)/i
            ], [MODEL, [VENDOR, 'Asus'], [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
            /(sony)?(?:sgp.+)\sbuild\//i
            ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Tablet'], [TYPE, TABLET]], [
            /android.+\s([c-g]\d{4}|so[-l]\w+)\sbuild\//i
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /\s(ouya)\s/i,                                                      // Ouya
            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /android.+;\s(shield)\sbuild/i                                      // Nvidia
            ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [

            /(playstation\s[34portablevi]+)/i                                   // Playstation
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i                         // Lenovo tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
            /(zte)-(\w+)*/i,                                                    // ZTE
            /(alcatel|geeksphone|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                                                                                // Alcatel/GeeksPhone/Lenovo/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /(nexus\s9)/i                                                       // HTC Nexus 9
            ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [

            /d\/huawei([\w\s-]+)[;\)]/i,
            /(nexus\s6p)/i                                                      // Huawei
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

            /(microsoft);\s(lumia[\s\w]+)/i                                     // Microsoft Lumia
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
            ], [MODEL, [VENDOR, 'Microsoft'], [TYPE, CONSOLE]], [
            /(kin\.[onetw]{3})/i                                                // Microsoft Kin
            ], [[MODEL, /\./g, ' '], [VENDOR, 'Microsoft'], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?)[\w\s]+build\//i,
            /mot[\s-]?(\w+)*/i,
            /(XT\d{3,4}) build\//i,
            /(nexus\s6)/i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, MOBILE]], [
            /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, TABLET]], [

            /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i            // HbbTV devices
            ], [[VENDOR, util.trim], [MODEL, util.trim], [TYPE, SMARTTV]], [

            /hbbtv.+maple;(\d+)/i
            ], [[MODEL, /^/, 'SmartTV'], [VENDOR, 'Samsung'], [TYPE, SMARTTV]], [

            /\(dtv[\);].+(aquos)/i                                              // Sharp
            ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /smart-tv.+(samsung)/i
            ], [VENDOR, [TYPE, SMARTTV], MODEL], [
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [

            /sie-(\w+)*/i                                                       // Siemens
            ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]+)*/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android\s3\.[\s\w;-]{10}(a\d{3})/i                                 // Acer
            ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

            /android.+([vl]k\-?\d{3})\s+build/i                                 // LG Tablet
            ], [MODEL, [VENDOR, 'LG'], [TYPE, TABLET]], [
            /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
            /(nexus\s[45])/i,                                                   // LG
            /lg[e;\s\/-]+(\w+)*/i,
            /android.+lg(\-?[\d\w]+)\s+build/i
            ], [MODEL, [VENDOR, 'LG'], [TYPE, MOBILE]], [

            /android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
            ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [

            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /((pebble))app\/[\d\.]+\s/i                                         // Pebble
            ], [VENDOR, MODEL, [TYPE, WEARABLE]], [

            /android.+;\s(oppo)\s?([\w\s]+)\sbuild/i                            // OPPO
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /crkey/i                                                            // Google Chromecast
            ], [[MODEL, 'Chromecast'], [VENDOR, 'Google']], [

            /android.+;\s(glass)\s\d/i                                          // Google Glass
            ], [MODEL, [VENDOR, 'Google'], [TYPE, WEARABLE]], [

            /android.+;\s(pixel c)\s/i                                          // Google Pixel C
            ], [MODEL, [VENDOR, 'Google'], [TYPE, TABLET]], [

            /android.+;\s(pixel xl|pixel)\s/i                                   // Google Pixel
            ], [MODEL, [VENDOR, 'Google'], [TYPE, MOBILE]], [

            /android.+(\w+)\s+build\/hm\1/i,                                    // Xiaomi Hongmi 'numeric' models
            /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,               // Xiaomi Hongmi
            /android.+(mi[\s\-_]*(?:one|one[\s_]plus|note lte)?[\s_]*(?:\d\w)?)\s+build/i,    // Xiaomi Mi
            /android.+(redmi[\s\-_]*(?:note)?(?:[\s_]*[\w\s]+)?)\s+build/i      // Redmi Phones
            ], [[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, MOBILE]], [
            /android.+(mi[\s\-_]*(?:pad)?(?:[\s_]*[\w\s]+)?)\s+build/i          // Mi Pad tablets
            ],[[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, TABLET]], [
            /android.+;\s(m[1-5]\snote)\sbuild/i                                // Meizu Tablet
            ], [MODEL, [VENDOR, 'Meizu'], [TYPE, TABLET]], [

            /android.+a000(1)\s+build/i                                         // OnePlus
            ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(RCT[\d\w]+)\s+build/i                            // RCA Tablets
            ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Venue[\d\s]*)\s+build/i                          // Dell Venue Tablets
            ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i                         // Verizon Tablet
            ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [

            /android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i     // Barnes & Noble Tablet
            ], [[VENDOR, 'Barnes & Noble'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i                           // Barnes & Noble Tablet
            ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(zte)?.+(k\d{2})\s+build/i                        // ZTE K Series Tablet
            ], [[VENDOR, 'ZTE'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(gen\d{3})\s+build.*49h/i                         // Swiss GEN Mobile
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(zur\d{3})\s+build/i                              // Swiss ZUR Tablet
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i                         // Zeki Tablets
            ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [

            /(android).+[;\/]\s+([YR]\d{2}x?.*)\s+build/i,
            /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(.+)\s+build/i          // Dragon Touch Tablet
            ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(NS-?.+)\s+build/i                                // Insignia Tablets
            ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((NX|Next)-?.+)\s+build/i                         // NextBook Tablets
            ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Xtreme\_?)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i
            ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [                    // Voice Xtreme Phones

            /android.+[;\/]\s*(LVTEL\-?)?(V1[12])\s+build/i                     // LvTel Phones
            ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [

            /android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i          // Envizen Tablets
            ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(.*\b)\s+build/i             // Le Pan Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i                         // MachSpeed Tablets
            ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i                // Trinity Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*TU_(1491)\s+build/i                               // Rotor Tablets
            ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [

            /android.+(KS(.+))\s+build/i                                        // Amazon Kindle Tablets
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [

            /android.+(Gigaset)[\s\-]+(Q.+)\s+build/i                           // Gigaset Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /\s(tablet|tab)[;\/]/i,                                             // Unidentifiable Tablet
            /\s(mobile)(?:[;\/]|\ssafari)/i                                     // Unidentifiable Mobile
            ], [[TYPE, util.lowerize], VENDOR, MODEL], [

            /(android.+)[;\/].+build/i                                          // Generic Android Device
            ], [MODEL, [VENDOR, 'Generic']]


        /*//////////////////////////
            // TODO: move to string map
            ////////////////////////////

            /(C6603)/i                                                          // Sony Xperia Z C6603
            ], [[MODEL, 'Xperia Z C6603'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [
            /(C6903)/i                                                          // Sony Xperia Z 1
            ], [[MODEL, 'Xperia Z 1'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /(SM-G900[F|H])/i                                                   // Samsung Galaxy S5
            ], [[MODEL, 'Galaxy S5'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G7102)/i                                                       // Samsung Galaxy Grand 2
            ], [[MODEL, 'Galaxy Grand 2'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G530H)/i                                                       // Samsung Galaxy Grand Prime
            ], [[MODEL, 'Galaxy Grand Prime'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G313HZ)/i                                                      // Samsung Galaxy V
            ], [[MODEL, 'Galaxy V'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T805)/i                                                        // Samsung Galaxy Tab S 10.5
            ], [[MODEL, 'Galaxy Tab S 10.5'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [
            /(SM-G800F)/i                                                       // Samsung Galaxy S5 Mini
            ], [[MODEL, 'Galaxy S5 Mini'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T311)/i                                                        // Samsung Galaxy Tab 3 8.0
            ], [[MODEL, 'Galaxy Tab 3 8.0'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [

            /(T3C)/i                                                            // Advan Vandroid T3C
            ], [MODEL, [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN T1J\+)/i                                                    // Advan Vandroid T1J+
            ], [[MODEL, 'Vandroid T1J+'], [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN S4A)/i                                                      // Advan Vandroid S4A
            ], [[MODEL, 'Vandroid S4A'], [VENDOR, 'Advan'], [TYPE, MOBILE]], [

            /(V972M)/i                                                          // ZTE V972M
            ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [

            /(i-mobile)\s(IQ\s[\d\.]+)/i                                        // i-mobile IQ
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(IQ6.3)/i                                                          // i-mobile IQ IQ 6.3
            ], [[MODEL, 'IQ 6.3'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [
            /(i-mobile)\s(i-style\s[\d\.]+)/i                                   // i-mobile i-STYLE
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(i-STYLE2.1)/i                                                     // i-mobile i-STYLE 2.1
            ], [[MODEL, 'i-STYLE 2.1'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [

            /(mobiistar touch LAI 512)/i                                        // mobiistar touch LAI 512
            ], [[MODEL, 'Touch LAI 512'], [VENDOR, 'mobiistar'], [TYPE, MOBILE]], [

            /////////////
            // END TODO
            ///////////*/

        ],

        engine : [[

            /windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
            ], [VERSION, [NAME, 'EdgeHTML']], [

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s]+\w)*/i,                  // Windows Phone
            /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
            /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]+)*/i,
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki
            /linux;.+(sailfish);/i                                              // Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]+)*/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(haiku)\s(\w+)/i                                                  // Haiku
            ], [NAME, VERSION],[

            /cfnetwork\/.+darwin/i,
            /ip[honead]+(?:.*os\s([\w]+)\slike\smac|;\sopera)/i                 // iOS
            ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i,
            /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
            ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

            // Other
            /((?:open)?solaris)[\/\s-]?([\w\.]+)*/i,                            // Solaris
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////
    /*
    var Browser = function (name, version) {
        this[NAME] = name;
        this[VERSION] = version;
    };
    var CPU = function (arch) {
        this[ARCHITECTURE] = arch;
    };
    var Device = function (vendor, model, type) {
        this[VENDOR] = vendor;
        this[MODEL] = model;
        this[TYPE] = type;
    };
    var Engine = Browser;
    var OS = Browser;
    */
    var UAParser = function (uastring, extensions) {

        if (typeof uastring === 'object') {
            extensions = uastring;
            uastring = undefined;
        }

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;
        //var browser = new Browser();
        //var cpu = new CPU();
        //var device = new Device();
        //var engine = new Engine();
        //var os = new OS();

        this.getBrowser = function () {
            var browser = { name: undefined, version: undefined };
            mapper.rgx.call(browser, ua, rgxmap.browser);
            browser.major = util.major(browser.version); // deprecated
            return browser;
        };
        this.getCPU = function () {
            var cpu = { architecture: undefined };
            mapper.rgx.call(cpu, ua, rgxmap.cpu);
            return cpu;
        };
        this.getDevice = function () {
            var device = { vendor: undefined, model: undefined, type: undefined };
            mapper.rgx.call(device, ua, rgxmap.device);
            return device;
        };
        this.getEngine = function () {
            var engine = { name: undefined, version: undefined };
            mapper.rgx.call(engine, ua, rgxmap.engine);
            return engine;
        };
        this.getOS = function () {
            var os = { name: undefined, version: undefined };
            mapper.rgx.call(os, ua, rgxmap.os);
            return os;
        };
        this.getResult = function () {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            //browser = new Browser();
            //cpu = new CPU();
            //device = new Device();
            //engine = new Engine();
            //os = new OS();
            return this;
        };
        return this;
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR, // deprecated
        VERSION : VERSION
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET,
        WEARABLE: WEARABLE,
        EMBEDDED: EMBEDDED
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION
    };
    //UAParser.Utils = util;

    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof module !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        // TODO: test!!!!!!!!
        /*
        if (require && require.main === module && process) {
            // cli
            var jsonize = function (arr) {
                var res = [];
                for (var i in arr) {
                    res.push(new UAParser(arr[i]).getResult());
                }
                process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            };
            if (process.stdin.isTTY) {
                // via args
                jsonize(process.argv.slice(2));
            } else {
                // via pipe
                var str = '';
                process.stdin.on('readable', function() {
                    var read = process.stdin.read();
                    if (read !== null) {
                        str += read;
                    }
                });
                process.stdin.on('end', function () {
                    jsonize(str.replace(/\n$/, '').split('\n'));
                });
            }
        }
        */
        exports.UAParser = UAParser;
    } else {
        // requirejs env (optional)
        if (typeof(define) === FUNC_TYPE && define.amd) {
            define(function () {
                return UAParser;
            });
        } else if (window) {
            // browser env
            window.UAParser = UAParser;
        }
    }

    // jQuery/Zepto specific (optional)
    // Note:
    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
    //   and we should catch that.
    var $ = window && (window.jQuery || window.Zepto);
    if (typeof $ !== UNDEF_TYPE) {
        var parser = new UAParser();
        $.ua = parser.getResult();
        $.ua.get = function () {
            return parser.getUA();
        };
        $.ua.set = function (uastring) {
            parser.setUA(uastring);
            var result = parser.getResult();
            for (var prop in result) {
                $.ua[prop] = result[prop];
            }
        };
    }

})(typeof window === 'object' ? window : this);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:livechat/livechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/startup.js");
require("/node_modules/meteor/rocketchat:livechat/server/visitorStatus.js");
require("/node_modules/meteor/rocketchat:livechat/permissions.js");
require("/node_modules/meteor/rocketchat:livechat/messageTypes.js");
require("/node_modules/meteor/rocketchat:livechat/roomType.js");
require("/node_modules/meteor/rocketchat:livechat/config.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/externalMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/leadCapture.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/markRoomResponded.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/offlineMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/RDStation.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/sendToCRM.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/sendToFacebook.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/addAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/addManager.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/changeLivechatStatus.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/closeByVisitor.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/closeRoom.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/facebook.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getCustomFields.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getAgentData.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getInitialData.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getNextAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/loadHistory.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/loginByToken.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/pageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/registerGuest.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeManager.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeRoom.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveAppearance.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveInfo.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveIntegration.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveSurveyFeedback.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/searchAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendMessageLivechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendOfflineMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/setCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/setDepartmentForVisitor.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/startVideoCall.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/transfer.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/webhookTest.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/takeInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/returnAsInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveOfficeHours.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendTranscript.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Users.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatExternalMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatDepartmentAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatPageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/indexes.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatOfficeHour.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/Livechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/QueueMethods.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/OfficeClock.js");
require("/node_modules/meteor/rocketchat:livechat/server/sendMessageBySMS.js");
require("/node_modules/meteor/rocketchat:livechat/server/unclosedLivechats.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/customFields.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/departmentAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/externalMessages.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatAppearance.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatDepartments.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatIntegration.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatManagers.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatRooms.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatQueue.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatTriggers.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorHistory.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorInfo.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorPageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatInquiries.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatOfficeHours.js");
require("/node_modules/meteor/rocketchat:livechat/server/api.js");

/* Exports */
Package._define("rocketchat:livechat");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_livechat.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9saXZlY2hhdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvc3RhcnR1cC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvdmlzaXRvclN0YXR1cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3MvZXh0ZXJuYWxNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9ob29rcy9sZWFkQ2FwdHVyZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3MvbWFya1Jvb21SZXNwb25kZWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2hvb2tzL29mZmxpbmVNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9ob29rcy9SRFN0YXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2hvb2tzL3NlbmRUb0NSTS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3Mvc2VuZFRvRmFjZWJvb2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvYWRkQWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvYWRkTWFuYWdlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9jaGFuZ2VMaXZlY2hhdFN0YXR1cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9jbG9zZUJ5VmlzaXRvci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9jbG9zZVJvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvZmFjZWJvb2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvZ2V0Q3VzdG9tRmllbGRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL2dldEFnZW50RGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9nZXRJbml0aWFsRGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9nZXROZXh0QWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvbG9hZEhpc3RvcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvbG9naW5CeVRva2VuLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3BhZ2VWaXNpdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlZ2lzdGVyR3Vlc3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlQWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlQ3VzdG9tRmllbGQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlRGVwYXJ0bWVudC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9yZW1vdmVNYW5hZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlbW92ZVRyaWdnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlUm9vbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zYXZlQXBwZWFyYW5jZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zYXZlQ3VzdG9tRmllbGQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZURlcGFydG1lbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZUluZm8uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZUludGVncmF0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVTdXJ2ZXlGZWVkYmFjay5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zYXZlVHJpZ2dlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZWFyY2hBZ2VudC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZW5kTWVzc2FnZUxpdmVjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NlbmRPZmZsaW5lTWVzc2FnZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZXRDdXN0b21GaWVsZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZXREZXBhcnRtZW50Rm9yVmlzaXRvci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zdGFydFZpZGVvQ2FsbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy90cmFuc2Zlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy93ZWJob29rVGVzdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy90YWtlSW5xdWlyeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9yZXR1cm5Bc0lucXVpcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZU9mZmljZUhvdXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NlbmRUcmFuc2NyaXB0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvVXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9Sb29tcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL01lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRFeHRlcm5hbE1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdEN1c3RvbUZpZWxkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXREZXBhcnRtZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRQYWdlVmlzaXRlZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VHJpZ2dlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL2luZGV4ZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdElucXVpcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdE9mZmljZUhvdXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9saWIvTGl2ZWNoYXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2xpYi9RdWV1ZU1ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2xpYi9PZmZpY2VDbG9jay5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbGliL09tbmlDaGFubmVsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9zZW5kTWVzc2FnZUJ5U01TLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci91bmNsb3NlZExpdmVjaGF0cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2N1c3RvbUZpZWxkcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2RlcGFydG1lbnRBZ2VudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9leHRlcm5hbE1lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRBZ2VudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdEFwcGVhcmFuY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdERlcGFydG1lbnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRJbnRlZ3JhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0TWFuYWdlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdFJvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRRdWV1ZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0VHJpZ2dlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy92aXNpdG9ySGlzdG9yeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL3Zpc2l0b3JJbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvdmlzaXRvclBhZ2VWaXNpdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRJbnF1aXJpZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdE9mZmljZUhvdXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvcGVybWlzc2lvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvbWVzc2FnZVR5cGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3Jvb21UeXBlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L2NvbmZpZy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9pbXBvcnRzL3NlcnZlci9yZXN0L2RlcGFydG1lbnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L2ltcG9ydHMvc2VydmVyL3Jlc3QvZmFjZWJvb2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvaW1wb3J0cy9zZXJ2ZXIvcmVzdC9tZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9pbXBvcnRzL3NlcnZlci9yZXN0L3Ntcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9pbXBvcnRzL3NlcnZlci9yZXN0L3VzZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L2ltcG9ydHMvc2VydmVyL3Jlc3QvdmlzaXRvcnMuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwidXJsIiwiV2ViQXBwIiwiUGFja2FnZSIsIndlYmFwcCIsIkF1dG91cGRhdGUiLCJhdXRvdXBkYXRlIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwiTWV0ZW9yIiwiYmluZEVudmlyb25tZW50IiwicmVxIiwicmVzIiwibmV4dCIsInJlcVVybCIsInBhcnNlIiwicGF0aG5hbWUiLCJzZXRIZWFkZXIiLCJkb21haW5XaGl0ZUxpc3QiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJoZWFkZXJzIiwicmVmZXJlciIsImlzRW1wdHkiLCJ0cmltIiwibWFwIiwic3BsaXQiLCJkb21haW4iLCJjb250YWlucyIsImhvc3QiLCJwcm90b2NvbCIsImhlYWQiLCJBc3NldHMiLCJnZXRUZXh0IiwiYmFzZVVybCIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTF9QQVRIX1BSRUZJWCIsInRlc3QiLCJodG1sIiwiYXV0b3VwZGF0ZVZlcnNpb24iLCJKU09OIiwic3RyaW5naWZ5Iiwid3JpdGUiLCJlbmQiLCJzdGFydHVwIiwicm9vbVR5cGVzIiwic2V0Um9vbUZpbmQiLCJfaWQiLCJtb2RlbHMiLCJSb29tcyIsImZpbmRMaXZlY2hhdEJ5SWQiLCJhdXRoeiIsImFkZFJvb21BY2Nlc3NWYWxpZGF0b3IiLCJyb29tIiwidXNlciIsInQiLCJoYXNQZXJtaXNzaW9uIiwiZXh0cmFEYXRhIiwidG9rZW4iLCJjYWxsYmFja3MiLCJhZGQiLCJFcnJvciIsIlRBUGkxOG4iLCJfXyIsImxuZyIsImxhbmd1YWdlIiwicHJpb3JpdHkiLCJMT1ciLCJVc2VyUHJlc2VuY2VFdmVudHMiLCJvbiIsInNlc3Npb24iLCJzdGF0dXMiLCJtZXRhZGF0YSIsInZpc2l0b3IiLCJMaXZlY2hhdElucXVpcnkiLCJ1cGRhdGVWaXNpdG9yU3RhdHVzIiwia25vd2xlZGdlRW5hYmxlZCIsImFwaWFpS2V5IiwiYXBpYWlMYW5ndWFnZSIsImtleSIsInZhbHVlIiwibWVzc2FnZSIsImVkaXRlZEF0IiwiZGVmZXIiLCJyZXNwb25zZSIsIkhUVFAiLCJwb3N0IiwiZGF0YSIsInF1ZXJ5IiwibXNnIiwibGFuZyIsInNlc3Npb25JZCIsImNvZGUiLCJyZXN1bHQiLCJmdWxmaWxsbWVudCIsInNwZWVjaCIsIkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlIiwiaW5zZXJ0IiwicmlkIiwib3JpZyIsInRzIiwiRGF0ZSIsImUiLCJTeXN0ZW1Mb2dnZXIiLCJlcnJvciIsIkxpdmVjaGF0VmlzaXRvcnMiLCJ2YWxpZGF0ZU1lc3NhZ2UiLCJwaG9uZVJlZ2V4cCIsIlJlZ0V4cCIsIm1zZ1Bob25lcyIsIm1hdGNoIiwiZW1haWxSZWdleHAiLCJtc2dFbWFpbHMiLCJzYXZlR3Vlc3RFbWFpbFBob25lQnlJZCIsInJ1biIsIndhaXRpbmdSZXNwb25zZSIsIm5vdyIsInNldFJlc3BvbnNlQnlSb29tSWQiLCJ1IiwidXNlcm5hbWUiLCJyZXNwb25zZURhdGUiLCJyZXNwb25zZVRpbWUiLCJnZXRUaW1lIiwicG9zdERhdGEiLCJ0eXBlIiwic2VudEF0IiwibmFtZSIsImVtYWlsIiwiTGl2ZWNoYXQiLCJzZW5kUmVxdWVzdCIsIk1FRElVTSIsInNlbmRUb1JEU3RhdGlvbiIsImxpdmVjaGF0RGF0YSIsImdldExpdmVjaGF0Um9vbUd1ZXN0SW5mbyIsIm9wdGlvbnMiLCJ0b2tlbl9yZHN0YXRpb24iLCJpZGVudGlmaWNhZG9yIiwiY2xpZW50X2lkIiwibm9tZSIsInBob25lIiwidGVsZWZvbmUiLCJ0YWdzIiwiT2JqZWN0Iiwia2V5cyIsImN1c3RvbUZpZWxkcyIsImZvckVhY2giLCJmaWVsZCIsImNhbGwiLCJjb25zb2xlIiwibXNnTmF2VHlwZSIsInNlbmRNZXNzYWdlVHlwZSIsIm1zZ1R5cGUiLCJzZW5kTmF2SGlzdG9yeSIsInNlbmRUb0NSTSIsImluY2x1ZGVNZXNzYWdlcyIsIm1lc3NhZ2VzIiwiTWVzc2FnZXMiLCJmaW5kVmlzaWJsZUJ5Um9vbUlkIiwic29ydCIsIkFycmF5IiwiYWdlbnRJZCIsIm5hdmlnYXRpb24iLCJwdXNoIiwic2F2ZUNSTURhdGFCeVJvb21JZCIsIm9wZW4iLCJPbW5pQ2hhbm5lbCIsImZhY2Vib29rIiwicmVwbHkiLCJwYWdlIiwiaWQiLCJ0ZXh0IiwibWV0aG9kcyIsInVzZXJJZCIsIm1ldGhvZCIsImFkZEFnZW50IiwiYWRkTWFuYWdlciIsIm5ld1N0YXR1cyIsInN0YXR1c0xpdmVjaGF0IiwiVXNlcnMiLCJzZXRMaXZlY2hhdFN0YXR1cyIsInJvb21JZCIsImZpbmRPbmVPcGVuQnlWaXNpdG9yVG9rZW4iLCJnZXRWaXNpdG9yQnlUb2tlbiIsImNsb3NlUm9vbSIsImNvbW1lbnQiLCJmaW5kT25lQnlJZCIsInVzZXJuYW1lcyIsImluZGV4T2YiLCJhY3Rpb24iLCJlbmFibGVkIiwiaGFzVG9rZW4iLCJlbmFibGUiLCJzdWNjZXNzIiwidXBkYXRlQnlJZCIsImRpc2FibGUiLCJsaXN0UGFnZXMiLCJzdWJzY3JpYmUiLCJ1bnN1YnNjcmliZSIsIkxpdmVjaGF0Q3VzdG9tRmllbGQiLCJmaW5kIiwiZmV0Y2giLCJjaGVjayIsIlN0cmluZyIsInNlcnZlZEJ5IiwiZ2V0QWdlbnRJbmZvIiwidmlzaXRvclRva2VuIiwiaW5mbyIsInRpdGxlIiwiY29sb3IiLCJyZWdpc3RyYXRpb25Gb3JtIiwidHJpZ2dlcnMiLCJkZXBhcnRtZW50cyIsImFsbG93U3dpdGNoaW5nRGVwYXJ0bWVudHMiLCJvbmxpbmUiLCJvZmZsaW5lQ29sb3IiLCJvZmZsaW5lTWVzc2FnZSIsIm9mZmxpbmVTdWNjZXNzTWVzc2FnZSIsIm9mZmxpbmVVbmF2YWlsYWJsZU1lc3NhZ2UiLCJkaXNwbGF5T2ZmbGluZUZvcm0iLCJ2aWRlb0NhbGwiLCJjb252ZXJzYXRpb25GaW5pc2hlZE1lc3NhZ2UiLCJuYW1lRmllbGRSZWdpc3RyYXRpb25Gb3JtIiwiZW1haWxGaWVsZFJlZ2lzdHJhdGlvbkZvcm0iLCJmaW5kT3BlbkJ5VmlzaXRvclRva2VuIiwiZmllbGRzIiwiY2wiLCJsZW5ndGgiLCJ2aXNpdG9yRW1haWxzIiwiaW5pdFNldHRpbmdzIiwiZ2V0SW5pdFNldHRpbmdzIiwiTGl2ZWNoYXRfdGl0bGUiLCJMaXZlY2hhdF90aXRsZV9jb2xvciIsIkxpdmVjaGF0X2VuYWJsZWQiLCJMaXZlY2hhdF9yZWdpc3RyYXRpb25fZm9ybSIsIm9mZmxpbmVUaXRsZSIsIkxpdmVjaGF0X29mZmxpbmVfdGl0bGUiLCJMaXZlY2hhdF9vZmZsaW5lX3RpdGxlX2NvbG9yIiwiTGl2ZWNoYXRfb2ZmbGluZV9tZXNzYWdlIiwiTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UiLCJMaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGUiLCJMaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybSIsIkxhbmd1YWdlIiwiTGl2ZWNoYXRfdmlkZW9jYWxsX2VuYWJsZWQiLCJKaXRzaV9FbmFibGVkIiwidHJhbnNjcmlwdCIsIkxpdmVjaGF0X2VuYWJsZV90cmFuc2NyaXB0IiwidHJhbnNjcmlwdE1lc3NhZ2UiLCJMaXZlY2hhdF90cmFuc2NyaXB0X21lc3NhZ2UiLCJMaXZlY2hhdF9jb252ZXJzYXRpb25fZmluaXNoZWRfbWVzc2FnZSIsIkxpdmVjaGF0X25hbWVfZmllbGRfcmVnaXN0cmF0aW9uX2Zvcm0iLCJMaXZlY2hhdF9lbWFpbF9maWVsZF9yZWdpc3RyYXRpb25fZm9ybSIsImFnZW50RGF0YSIsIkxpdmVjaGF0VHJpZ2dlciIsImZpbmRFbmFibGVkIiwidHJpZ2dlciIsInBpY2siLCJMaXZlY2hhdERlcGFydG1lbnQiLCJmaW5kRW5hYmxlZFdpdGhBZ2VudHMiLCJkZXBhcnRtZW50IiwiTGl2ZWNoYXRfYWxsb3dfc3dpdGNoaW5nX2RlcGFydG1lbnRzIiwiZmluZE9ubGluZUFnZW50cyIsImNvdW50IiwicmVxdWlyZURlcGFybWVudCIsImdldFJlcXVpcmVkRGVwYXJ0bWVudCIsImFnZW50IiwiZ2V0TmV4dEFnZW50IiwibGltaXQiLCJscyIsImxvYWRNZXNzYWdlSGlzdG9yeSIsInBhZ2VJbmZvIiwic2F2ZVBhZ2VIaXN0b3J5IiwicmVnaXN0ZXJHdWVzdCIsImtlZXBIaXN0b3J5Rm9yVG9rZW4iLCJyZW1vdmVBZ2VudCIsImN1c3RvbUZpZWxkIiwicmVtb3ZlQnlJZCIsInJlbW92ZURlcGFydG1lbnQiLCJyZW1vdmVNYW5hZ2VyIiwidHJpZ2dlcklkIiwicmVtb3ZlQnlSb29tSWQiLCJTdWJzY3JpcHRpb25zIiwidmFsaWRTZXR0aW5ncyIsInZhbGlkIiwiZXZlcnkiLCJzZXR0aW5nIiwiY3VzdG9tRmllbGREYXRhIiwiTWF0Y2giLCJPYmplY3RJbmNsdWRpbmciLCJsYWJlbCIsInNjb3BlIiwidmlzaWJpbGl0eSIsImNyZWF0ZU9yVXBkYXRlQ3VzdG9tRmllbGQiLCJkZXBhcnRtZW50RGF0YSIsImRlcGFydG1lbnRBZ2VudHMiLCJzYXZlRGVwYXJ0bWVudCIsImd1ZXN0RGF0YSIsInJvb21EYXRhIiwiT3B0aW9uYWwiLCJ0b3BpYyIsInJldCIsInNhdmVHdWVzdCIsInNhdmVSb29tSW5mbyIsInMiLCJ2YWx1ZXMiLCJ2aXNpdG9yUm9vbSIsImZvcm1EYXRhIiwidW5kZWZpbmVkIiwidXBkYXRlRGF0YSIsIml0ZW0iLCJ1cGRhdGVTdXJ2ZXlGZWVkYmFja0J5SWQiLCJNYXliZSIsImRlc2NyaXB0aW9uIiwiQm9vbGVhbiIsImNvbmRpdGlvbnMiLCJhY3Rpb25zIiwiaXNTdHJpbmciLCJmaW5kT25lQnlVc2VybmFtZSIsInNlbmRNZXNzYWdlTGl2ZWNoYXQiLCJndWVzdCIsInNlbmRNZXNzYWdlIiwiZG5zIiwiaGVhZGVyIiwicGxhY2Vob2xkZXJzIiwicmVwbGFjZSIsImZvb3RlciIsImZyb21FbWFpbCIsImVtYWlsRG9tYWluIiwic3Vic3RyIiwibGFzdEluZGV4T2YiLCJ3cmFwQXN5bmMiLCJyZXNvbHZlTXgiLCJFbWFpbCIsInNlbmQiLCJ0byIsImZyb20iLCJyZXBseVRvIiwic3ViamVjdCIsInN1YnN0cmluZyIsIkREUFJhdGVMaW1pdGVyIiwiYWRkUnVsZSIsImNvbm5lY3Rpb25JZCIsIm92ZXJ3cml0ZSIsInVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4iLCJzZXREZXBhcnRtZW50Rm9yR3Vlc3QiLCJSYW5kb20iLCJnZXRSb29tIiwiaml0c2lUaW1lb3V0IiwiY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlciIsImFjdGlvbkxpbmtzIiwiaWNvbiIsImkxOG5MYWJlbCIsIm1ldGhvZF9pZCIsInBhcmFtcyIsImppdHNpUm9vbSIsInRyYW5zZmVyRGF0YSIsImRlcGFydG1lbnRJZCIsImhhc1JvbGUiLCJ0cmFuc2ZlciIsInBvc3RDYXRjaEVycm9yIiwicmVzb2x2ZSIsImVyciIsInVuYmxvY2siLCJzYW1wbGVEYXRhIiwiY3JlYXRlZEF0IiwibGFzdE1lc3NhZ2VBdCIsInByb2R1Y3RJZCIsImlwIiwiYnJvd3NlciIsIm9zIiwiY3VzdG9tZXJJZCIsImxvZyIsInN0YXR1c0NvZGUiLCJpbnF1aXJ5SWQiLCJpbnF1aXJ5Iiwic3Vic2NyaXB0aW9uRGF0YSIsImFsZXJ0IiwidW5yZWFkIiwidXNlck1lbnRpb25zIiwiZ3JvdXBNZW50aW9ucyIsImRlc2t0b3BOb3RpZmljYXRpb25zIiwibW9iaWxlUHVzaE5vdGlmaWNhdGlvbnMiLCJlbWFpbE5vdGlmaWNhdGlvbnMiLCJjaGFuZ2VBZ2VudEJ5Um9vbUlkIiwidGFrZUlucXVpcnkiLCJjcmVhdGVDb21tYW5kV2l0aFJvb21JZEFuZFVzZXIiLCJzdHJlYW0iLCJlbWl0IiwicmVtb3ZlVXNlcm5hbWVCeUlkIiwiZmluZE9uZSIsIm9wZW5JbnF1aXJ5IiwiZGF5Iiwic3RhcnQiLCJmaW5pc2giLCJMaXZlY2hhdE9mZmljZUhvdXIiLCJ1cGRhdGVIb3VycyIsIm1vbWVudCIsInVzZXJMYW5ndWFnZSIsImZpbmRWaXNpYmxlQnlSb29tSWROb3RDb250YWluaW5nVHlwZXMiLCJhdXRob3IiLCJkYXRldGltZSIsImxvY2FsZSIsImZvcm1hdCIsInNpbmdsZU1lc3NhZ2UiLCJlbWFpbFNldHRpbmdzIiwic2V0T3BlcmF0b3IiLCJvcGVyYXRvciIsInVwZGF0ZSIsIiRzZXQiLCIkZXhpc3RzIiwiJG5lIiwicm9sZXMiLCJmaW5kT25lT25saW5lQWdlbnRCeVVzZXJuYW1lIiwiZmluZEFnZW50cyIsImZpbmRPbmxpbmVVc2VyRnJvbUxpc3QiLCJ1c2VyTGlzdCIsIiRpbiIsImNvbmNhdCIsImNvbGxlY3Rpb25PYmoiLCJtb2RlbCIsInJhd0NvbGxlY3Rpb24iLCJmaW5kQW5kTW9kaWZ5IiwibGl2ZWNoYXRDb3VudCIsIiRpbmMiLCJjbG9zZU9mZmljZSIsInNlbGYiLCJvcGVuT2ZmaWNlIiwiZW1haWxzIiwic3VydmV5RmVlZGJhY2siLCJmaW5kTGl2ZWNoYXQiLCJmaWx0ZXIiLCJvZmZzZXQiLCJleHRlbmQiLCJ1cGRhdGVMaXZlY2hhdFJvb21Db3VudCIsInNldHRpbmdzUmF3IiwiU2V0dGluZ3MiLCJmaW5kQnlWaXNpdG9yVG9rZW4iLCJmaW5kQnlWaXNpdG9ySWQiLCJ2aXNpdG9ySWQiLCJyZXNwb25zZUJ5IiwiJHVuc2V0IiwiY2xvc2VCeVJvb21JZCIsImNsb3NlSW5mbyIsImNsb3NlciIsImNsb3NlZEJ5IiwiY2xvc2VkQXQiLCJjaGF0RHVyYXRpb24iLCJmaW5kT3BlbkJ5QWdlbnQiLCJuZXdBZ2VudCIsImNybURhdGEiLCJleHBpcmVBdCIsIm11bHRpIiwic2V0Um9vbUlkQnlUb2tlbiIsIl9CYXNlIiwiY29uc3RydWN0b3IiLCJpc0NsaWVudCIsIl9pbml0TW9kZWwiLCJmaW5kQnlSb29tSWQiLCJyZWNvcmQiLCJyZW1vdmUiLCJ0cnlFbnN1cmVJbmRleCIsIm51bUFnZW50cyIsImZpbmRCeURlcGFydG1lbnRJZCIsImNyZWF0ZU9yVXBkYXRlRGVwYXJ0bWVudCIsInNob3dPblJlZ2lzdHJhdGlvbiIsImFnZW50cyIsInNhdmVkQWdlbnRzIiwicGx1Y2siLCJMaXZlY2hhdERlcGFydG1lbnRBZ2VudHMiLCJhZ2VudHNUb1NhdmUiLCJkaWZmZXJlbmNlIiwicmVtb3ZlQnlEZXBhcnRtZW50SWRBbmRBZ2VudElkIiwic2F2ZUFnZW50IiwicGFyc2VJbnQiLCJvcmRlciIsIiRndCIsInVwc2VydCIsImdldE5leHRBZ2VudEZvckRlcGFydG1lbnQiLCJvbmxpbmVVc2VycyIsIm9ubGluZVVzZXJuYW1lcyIsImdldE9ubGluZUZvckRlcGFydG1lbnQiLCJkZXBBZ2VudHMiLCJmaW5kVXNlcnNJblF1ZXVlIiwidXNlcnNMaXN0IiwicmVwbGFjZVVzZXJuYW1lT2ZBZ2VudEJ5VXNlcklkIiwiTGl2ZWNoYXRQYWdlVmlzaXRlZCIsInNwYXJzZSIsImV4cGlyZUFmdGVyU2Vjb25kcyIsInNhdmVCeVRva2VuIiwia2VlcEhpc3RvcnlNaWxpc2Vjb25kcyIsImZpbmRCeVRva2VuIiwicmVtb3ZlQWxsIiwiZmluZEJ5SWQiLCJnZXRTdGF0dXMiLCJuZXdTdGFydCIsIm5ld0ZpbmlzaCIsIm5ld09wZW4iLCJpc05vd1dpdGhpbkhvdXJzIiwiY3VycmVudFRpbWUiLCJ1dGMiLCJ0b2RheXNPZmZpY2VIb3VycyIsImlzQmVmb3JlIiwiaXNCZXR3ZWVuIiwiaXNPcGVuaW5nVGltZSIsImlzU2FtZSIsImlzQ2xvc2luZ1RpbWUiLCJmaW5kVmlzaXRvckJ5VG9rZW4iLCJmaW5kT25lVmlzaXRvckJ5UGhvbmUiLCJnZXROZXh0VmlzaXRvclVzZXJuYW1lIiwic2F2ZUd1ZXN0QnlJZCIsInNldERhdGEiLCJ1bnNldERhdGEiLCJhZGRyZXNzIiwicGhvbmVOdW1iZXIiLCJmaW5kT25lR3Vlc3RCeUVtYWlsQWRkcmVzcyIsImVtYWlsQWRkcmVzcyIsImVzY2FwZVJlZ0V4cCIsInBob25lcyIsIiRhZGRUb1NldCIsInNhdmVFbWFpbCIsIiRlYWNoIiwic2F2ZVBob25lIiwiZXhwb3J0RGVmYXVsdCIsIlVBUGFyc2VyIiwiaGlzdG9yeU1vbml0b3JUeXBlIiwibG9nZ2VyIiwiTG9nZ2VyIiwic2VjdGlvbnMiLCJ3ZWJob29rIiwiaSIsInF1ZXJ5U3RyaW5nIiwiZ2V0QWdlbnRzIiwiZ2V0T25saW5lQWdlbnRzIiwib25saW5lUmVxdWlyZWQiLCJkZXB0Iiwib25saW5lQWdlbnRzIiwicm9vbUluZm8iLCJuZXdSb29tIiwicm91dGluZ01ldGhvZCIsIlF1ZXVlTWV0aG9kcyIsImFsaWFzIiwic2hvd0Nvbm5lY3RpbmciLCJ1cGRhdGVVc2VyIiwiZXhpc3RpbmdVc2VyIiwidXNlckRhdGEiLCJjb25uZWN0aW9uIiwidXNlckFnZW50IiwiaHR0cEhlYWRlcnMiLCJjbGllbnRBZGRyZXNzIiwibnVtYmVyIiwidXNlcnMiLCJjbG9zZURhdGEiLCJncm91cGFibGUiLCJoaWRlQnlSb29tSWRBbmRVc2VySWQiLCJmaW5kTm90SGlkZGVuUHVibGljIiwic2V0VG9waWNBbmRUYWdzQnlJZCIsInNldEZuYW1lQnlJZCIsInVwZGF0ZURpc3BsYXlOYW1lQnlSb29tSWQiLCJjbG9zZU9wZW5DaGF0cyIsImZvcndhcmRPcGVuQ2hhdHMiLCJjaGFuZ2UiLCJwYWdlVGl0bGUiLCJwYWdlVXJsIiwibG9jYXRpb24iLCJocmVmIiwiX2hpZGRlbiIsImNyZWF0ZU5hdmlnYXRpb25IaXN0b3J5V2l0aFJvb21JZE1lc3NhZ2VBbmRVc2VyIiwid2l0aG91dCIsInJlbW92ZUJ5Um9vbUlkQW5kVXNlcklkIiwiY3JlYXRlVXNlckxlYXZlV2l0aFJvb21JZEFuZFVzZXIiLCJjcmVhdGVVc2VySm9pbldpdGhSb29tSWRBbmRVc2VyIiwiY2FsbGJhY2siLCJ0cnlpbmciLCJ3YXJuIiwic2V0VGltZW91dCIsInVhIiwic2V0VUEiLCJmbmFtZSIsImxtIiwiZ2V0T1MiLCJ2ZXJzaW9uIiwiZ2V0QnJvd3NlciIsImFkZFVzZXJSb2xlcyIsInJlbW92ZVVzZXJGcm9tUm9sZXMiLCJTdHJlYW1lciIsImFsbG93UmVhZCIsIm1zZ3MiLCJhZ2VudElkcyIsInNldEludGVydmFsIiwiZ2F0ZXdheVVSTCIsInBhZ2VJZCIsIlNNUyIsInNtcyIsIlNNU1NlcnZpY2UiLCJnZXRTZXJ2aWNlIiwiYWdlbnRzSGFuZGxlciIsIm1vbml0b3JBZ2VudHMiLCJhY3Rpb25UaW1lb3V0IiwicXVldWUiLCJjbGVhclRpbWVvdXQiLCJleGlzdHMiLCJydW5BZ2VudExlYXZlQWN0aW9uIiwib2JzZXJ2ZUNoYW5nZXMiLCJhZGRlZCIsImNoYW5nZWQiLCJyZW1vdmVkIiwic3RvcCIsIlVzZXJQcmVzZW5jZU1vbml0b3IiLCJvblNldFVzZXJTdGF0dXMiLCJwdWJsaXNoIiwiaGFuZGxlIiwiZ2V0VXNlcnNJblJvbGUiLCJyZWFkeSIsIm9uU3RvcCIsImZpbmRCeUlkcyIsIiRndGUiLCJzZXREYXRlIiwiZ2V0RGF0ZSIsInNldFNlY29uZHMiLCJnZXRTZWNvbmRzIiwiJGx0ZSIsImhhbmRsZURlcHRzIiwiZmluZEJ5Um9vbUlkQW5kVHlwZSIsIlJvbGVzIiwiY3JlYXRlT3JVcGRhdGUiLCJQZXJtaXNzaW9ucyIsIk1lc3NhZ2VUeXBlcyIsInJlZ2lzdGVyVHlwZSIsInN5c3RlbSIsImhpc3RvcnkiLCJyZWdpc3RlciIsImluc3RhbmNlIiwidGFiQmFyIiwiaXNTZXJ2ZXIiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5Um9vbSIsInNldEhpZGRlbkJ5SWQiLCJSb29tU2V0dGluZ3NFbnVtIiwiUm9vbVR5cGVDb25maWciLCJSb29tVHlwZVJvdXRlQ29uZmlnIiwiVWlUZXh0Q29udGV4dCIsIkxpdmVjaGF0Um9vbVJvdXRlIiwicGF0aCIsIm9wZW5Sb29tIiwibGluayIsInN1YiIsIkxpdmVjaGF0Um9vbVR5cGUiLCJpZGVudGlmaWVyIiwicm91dGUiLCJub3RTdWJzY3JpYmVkVHBsIiwidGVtcGxhdGUiLCJmaW5kUm9vbSIsIkNoYXRSb29tIiwicm9vbU5hbWUiLCJjb25kaXRpb24iLCJoYXNBbGxQZXJtaXNzaW9uIiwiY2FuU2VuZE1lc3NhZ2UiLCJnZXRVc2VyU3RhdHVzIiwiU2Vzc2lvbiIsImFsbG93Um9vbVNldHRpbmdDaGFuZ2UiLCJKT0lOX0NPREUiLCJnZXRVaVRleHQiLCJjb250ZXh0IiwiSElERV9XQVJOSU5HIiwiTEVBVkVfV0FSTklORyIsImFkZEdyb3VwIiwiZ3JvdXAiLCJwdWJsaWMiLCJlZGl0b3IiLCJhbGxvd2VkVHlwZXMiLCJzZWN0aW9uIiwiaTE4bkRlc2NyaXB0aW9uIiwiZW5hYmxlUXVlcnkiLCJBUEkiLCJ2MSIsImFkZFJvdXRlIiwiYXV0aFJlcXVpcmVkIiwidW5hdXRob3JpemVkIiwiYm9keVBhcmFtcyIsImZhaWx1cmUiLCJ1cmxQYXJhbXMiLCJwdXQiLCJkZWxldGUiLCJjcnlwdG8iLCJhdHRhY2htZW50cyIsInJlcXVlc3QiLCJzaWduYXR1cmUiLCJjcmVhdGVIbWFjIiwiYm9keSIsImRpZ2VzdCIsIm1pZCIsInJvb21zIiwiZmlyc3RfbmFtZSIsImxhc3RfbmFtZSIsInN1Y2VzcyIsInNlbnRNZXNzYWdlcyIsInNlbnRNZXNzYWdlIiwic2VydmljZSIsIm1lZGlhIiwiY3VyciIsImF0dGFjaG1lbnQiLCJtZXNzYWdlX2xpbmsiLCJjb250ZW50VHlwZSIsImltYWdlX3VybCIsInZpZGVvX3VybCIsImF1ZGlvX3VybCIsImV4dHJhIiwiZnJvbUNvdW50cnkiLCJmcm9tU3RhdGUiLCJmcm9tQ2l0eSIsInJvbGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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QUcsQ0FKSTtBQUtQb0UsbUJBQVcsQ0FMSjtBQU1QaUIsa0JBQVU7QUFOSDtBQURpRixLQUE1RSxFQVNYSCxLQVRXLEVBQWQ7QUFVQSxXQUFPdEwsV0FBVzhvQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JqZSxPQUFsQixDQUEwQjtBQUFFa2Y7QUFBRixLQUExQixDQUFQO0FBQ0E7O0FBakJ3RixDQUExRixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2xpdmVjaGF0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBXZWJBcHA6dHJ1ZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5cbldlYkFwcCA9IFBhY2thZ2Uud2ViYXBwLldlYkFwcDtcbmNvbnN0IEF1dG91cGRhdGUgPSBQYWNrYWdlLmF1dG91cGRhdGUuQXV0b3VwZGF0ZTtcblxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoJy9saXZlY2hhdCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdGNvbnN0IHJlcVVybCA9IHVybC5wYXJzZShyZXEudXJsKTtcblx0aWYgKHJlcVVybC5wYXRobmFtZSAhPT0gJy8nKSB7XG5cdFx0cmV0dXJuIG5leHQoKTtcblx0fVxuXHRyZXMuc2V0SGVhZGVyKCdjb250ZW50LXR5cGUnLCAndGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04Jyk7XG5cblx0bGV0IGRvbWFpbldoaXRlTGlzdCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9BbGxvd2VkRG9tYWluc0xpc3QnKTtcblx0aWYgKHJlcS5oZWFkZXJzLnJlZmVyZXIgJiYgIV8uaXNFbXB0eShkb21haW5XaGl0ZUxpc3QudHJpbSgpKSkge1xuXHRcdGRvbWFpbldoaXRlTGlzdCA9IF8ubWFwKGRvbWFpbldoaXRlTGlzdC5zcGxpdCgnLCcpLCBmdW5jdGlvbihkb21haW4pIHtcblx0XHRcdHJldHVybiBkb21haW4udHJpbSgpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgcmVmZXJlciA9IHVybC5wYXJzZShyZXEuaGVhZGVycy5yZWZlcmVyKTtcblx0XHRpZiAoIV8uY29udGFpbnMoZG9tYWluV2hpdGVMaXN0LCByZWZlcmVyLmhvc3QpKSB7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdYLUZSQU1FLU9QVElPTlMnLCAnREVOWScpO1xuXHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHR9XG5cblx0XHRyZXMuc2V0SGVhZGVyKCdYLUZSQU1FLU9QVElPTlMnLCBgQUxMT1ctRlJPTSAkeyByZWZlcmVyLnByb3RvY29sIH0vLyR7IHJlZmVyZXIuaG9zdCB9YCk7XG5cdH1cblxuXHRjb25zdCBoZWFkID0gQXNzZXRzLmdldFRleHQoJ3B1YmxpYy9oZWFkLmh0bWwnKTtcblxuXHRsZXQgYmFzZVVybDtcblx0aWYgKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVggJiYgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWC50cmltKCkgIT09ICcnKSB7XG5cdFx0YmFzZVVybCA9IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVg7XG5cdH0gZWxzZSB7XG5cdFx0YmFzZVVybCA9ICcvJztcblx0fVxuXHRpZiAoL1xcLyQvLnRlc3QoYmFzZVVybCkgPT09IGZhbHNlKSB7XG5cdFx0YmFzZVVybCArPSAnLyc7XG5cdH1cblxuXHRjb25zdCBodG1sID0gYDxodG1sPlxuXHRcdDxoZWFkPlxuXHRcdFx0PGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGNsYXNzPVwiX19tZXRlb3ItY3NzX19cIiBocmVmPVwiJHsgYmFzZVVybCB9bGl2ZWNoYXQvbGl2ZWNoYXQuY3NzP19kYz0keyBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uIH1cIj5cblx0XHRcdDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiPlxuXHRcdFx0XHRfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fID0gJHsgSlNPTi5zdHJpbmdpZnkoX19tZXRlb3JfcnVudGltZV9jb25maWdfXykgfTtcblx0XHRcdDwvc2NyaXB0PlxuXG5cdFx0XHQ8YmFzZSBocmVmPVwiJHsgYmFzZVVybCB9XCI+XG5cblx0XHRcdCR7IGhlYWQgfVxuXHRcdDwvaGVhZD5cblx0XHQ8Ym9keT5cblx0XHRcdDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cIiR7IGJhc2VVcmwgfWxpdmVjaGF0L2xpdmVjaGF0LmpzP19kYz0keyBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uIH1cIj48L3NjcmlwdD5cblx0XHQ8L2JvZHk+XG5cdDwvaHRtbD5gO1xuXG5cdHJlcy53cml0ZShodG1sKTtcblx0cmVzLmVuZCgpO1xufSkpO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRSb2NrZXRDaGF0LnJvb21UeXBlcy5zZXRSb29tRmluZCgnbCcsIChfaWQpID0+IHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZExpdmVjaGF0QnlJZChfaWQpO1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LmF1dGh6LmFkZFJvb21BY2Nlc3NWYWxpZGF0b3IoZnVuY3Rpb24ocm9vbSwgdXNlcikge1xuXHRcdHJldHVybiByb29tLnQgPT09ICdsJyAmJiB1c2VyICYmIFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VyLl9pZCwgJ3ZpZXctbGl2ZWNoYXQtcm9vbXMnKTtcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5hdXRoei5hZGRSb29tQWNjZXNzVmFsaWRhdG9yKGZ1bmN0aW9uKHJvb20sIHVzZXIsIGV4dHJhRGF0YSkge1xuXHRcdHJldHVybiByb29tLnQgPT09ICdsJyAmJiBleHRyYURhdGEgJiYgZXh0cmFEYXRhLnRva2VuICYmIHJvb20udiAmJiByb29tLnYudG9rZW4gPT09IGV4dHJhRGF0YS50b2tlbjtcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdiZWZvcmVMZWF2ZVJvb20nLCBmdW5jdGlvbih1c2VyLCByb29tKSB7XG5cdFx0aWYgKHJvb20udCAhPT0gJ2wnKSB7XG5cdFx0XHRyZXR1cm4gdXNlcjtcblx0XHR9XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihUQVBpMThuLl9fKCdZb3VfY2FudF9sZWF2ZV9hX2xpdmVjaGF0X3Jvb21fUGxlYXNlX3VzZV90aGVfY2xvc2VfYnV0dG9uJywge1xuXHRcdFx0bG5nOiB1c2VyLmxhbmd1YWdlIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbidcblx0XHR9KSk7XG5cdH0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ2NhbnQtbGVhdmUtcm9vbScpO1xufSk7XG4iLCIvKiBnbG9iYWxzIFVzZXJQcmVzZW5jZUV2ZW50cyAqL1xuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRVc2VyUHJlc2VuY2VFdmVudHMub24oJ3NldFN0YXR1cycsIChzZXNzaW9uLCBzdGF0dXMsIG1ldGFkYXRhKSA9PiB7XG5cdFx0aWYgKG1ldGFkYXRhICYmIG1ldGFkYXRhLnZpc2l0b3IpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS51cGRhdGVWaXNpdG9yU3RhdHVzKG1ldGFkYXRhLnZpc2l0b3IsIHN0YXR1cyk7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVWaXNpdG9yU3RhdHVzKG1ldGFkYXRhLnZpc2l0b3IsIHN0YXR1cyk7XG5cdFx0fVxuXHR9KTtcbn0pO1xuIiwiLyogZ2xvYmFscyBIVFRQLCBTeXN0ZW1Mb2dnZXIgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5sZXQga25vd2xlZGdlRW5hYmxlZCA9IGZhbHNlO1xubGV0IGFwaWFpS2V5ID0gJyc7XG5sZXQgYXBpYWlMYW5ndWFnZSA9ICdlbic7XG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfS25vd2xlZGdlX0VuYWJsZWQnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdGtub3dsZWRnZUVuYWJsZWQgPSB2YWx1ZTtcbn0pO1xuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0tub3dsZWRnZV9BcGlhaV9LZXknLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdGFwaWFpS2V5ID0gdmFsdWU7XG59KTtcblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9Lbm93bGVkZ2VfQXBpYWlfTGFuZ3VhZ2UnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdGFwaWFpTGFuZ3VhZ2UgPSB2YWx1ZTtcbn0pO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlLCByb29tKSB7XG5cdC8vIHNraXBzIHRoaXMgY2FsbGJhY2sgaWYgdGhlIG1lc3NhZ2Ugd2FzIGVkaXRlZFxuXHRpZiAoIW1lc3NhZ2UgfHwgbWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0aWYgKCFrbm93bGVkZ2VFbmFibGVkKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRpZiAoISh0eXBlb2Ygcm9vbS50ICE9PSAndW5kZWZpbmVkJyAmJiByb29tLnQgPT09ICdsJyAmJiByb29tLnYgJiYgcm9vbS52LnRva2VuKSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gaWYgdGhlIG1lc3NhZ2UgaGFzbid0IGEgdG9rZW4sIGl0IHdhcyBub3Qgc2VudCBieSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmICghbWVzc2FnZS50b2tlbikge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBIVFRQLnBvc3QoJ2h0dHBzOi8vYXBpLmFwaS5haS9hcGkvcXVlcnk/dj0yMDE1MDkxMCcsIHtcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdHF1ZXJ5OiBtZXNzYWdlLm1zZyxcblx0XHRcdFx0XHRsYW5nOiBhcGlhaUxhbmd1YWdlLFxuXHRcdFx0XHRcdHNlc3Npb25JZDogcm9vbS5faWRcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG5cdFx0XHRcdFx0J0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7IGFwaWFpS2V5IH1gXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnN0YXR1cy5jb2RlID09PSAyMDAgJiYgIV8uaXNFbXB0eShyZXNwb25zZS5kYXRhLnJlc3VsdC5mdWxmaWxsbWVudC5zcGVlY2gpKSB7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlLmluc2VydCh7XG5cdFx0XHRcdFx0cmlkOiBtZXNzYWdlLnJpZCxcblx0XHRcdFx0XHRtc2c6IHJlc3BvbnNlLmRhdGEucmVzdWx0LmZ1bGZpbGxtZW50LnNwZWVjaCxcblx0XHRcdFx0XHRvcmlnOiBtZXNzYWdlLl9pZCxcblx0XHRcdFx0XHR0czogbmV3IERhdGUoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRTeXN0ZW1Mb2dnZXIuZXJyb3IoJ0Vycm9yIHVzaW5nIEFwaS5haSAtPicsIGUpO1xuXHRcdH1cblx0fSk7XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdleHRlcm5hbFdlYkhvb2snKTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uLy4uL3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlTWVzc2FnZShtZXNzYWdlLCByb29tKSB7XG5cdC8vIHNraXBzIHRoaXMgY2FsbGJhY2sgaWYgdGhlIG1lc3NhZ2Ugd2FzIGVkaXRlZFxuXHRpZiAobWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIG1lc3NhZ2UgdmFsaWQgb25seSBpZiBpdCBpcyBhIGxpdmVjaGF0IHJvb21cblx0aWYgKCEodHlwZW9mIHJvb20udCAhPT0gJ3VuZGVmaW5lZCcgJiYgcm9vbS50ID09PSAnbCcgJiYgcm9vbS52ICYmIHJvb20udi50b2tlbikpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXNuJ3QgYSB0b2tlbiwgaXQgd2FzIE5PVCBzZW50IGZyb20gdGhlIHZpc2l0b3IsIHNvIGlnbm9yZSBpdFxuXHRpZiAoIW1lc3NhZ2UudG9rZW4pIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0eXBlIG1lYW5zIGl0IGlzIGEgc3BlY2lhbCBtZXNzYWdlIChsaWtlIHRoZSBjbG9zaW5nIGNvbW1lbnQpLCBzbyBza2lwc1xuXHRpZiAobWVzc2FnZS50KSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UsIHJvb20pIHtcblx0aWYgKCF2YWxpZGF0ZU1lc3NhZ2UobWVzc2FnZSwgcm9vbSkpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGNvbnN0IHBob25lUmVnZXhwID0gbmV3IFJlZ0V4cChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfbGVhZF9waG9uZV9yZWdleCcpLCAnZycpO1xuXHRjb25zdCBtc2dQaG9uZXMgPSBtZXNzYWdlLm1zZy5tYXRjaChwaG9uZVJlZ2V4cCk7XG5cblx0Y29uc3QgZW1haWxSZWdleHAgPSBuZXcgUmVnRXhwKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9sZWFkX2VtYWlsX3JlZ2V4JyksICdnaScpO1xuXHRjb25zdCBtc2dFbWFpbHMgPSBtZXNzYWdlLm1zZy5tYXRjaChlbWFpbFJlZ2V4cCk7XG5cblx0aWYgKG1zZ0VtYWlscyB8fCBtc2dQaG9uZXMpIHtcblx0XHRMaXZlY2hhdFZpc2l0b3JzLnNhdmVHdWVzdEVtYWlsUGhvbmVCeUlkKHJvb20udi5faWQsIG1zZ0VtYWlscywgbXNnUGhvbmVzKTtcblxuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignbGl2ZWNoYXQubGVhZENhcHR1cmUnLCByb29tKTtcblx0fVxuXG5cdHJldHVybiBtZXNzYWdlO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnbGVhZENhcHR1cmUnKTtcbiIsIlJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UsIHJvb20pIHtcblx0Ly8gc2tpcHMgdGhpcyBjYWxsYmFjayBpZiB0aGUgbWVzc2FnZSB3YXMgZWRpdGVkXG5cdGlmICghbWVzc2FnZSB8fCBtZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBjaGVjayBpZiByb29tIGlzIHlldCBhd2FpdGluZyBmb3IgcmVzcG9uc2Vcblx0aWYgKCEodHlwZW9mIHJvb20udCAhPT0gJ3VuZGVmaW5lZCcgJiYgcm9vbS50ID09PSAnbCcgJiYgcm9vbS53YWl0aW5nUmVzcG9uc2UpKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0b2tlbiwgaXQgd2FzIHNlbnQgYnkgdGhlIHZpc2l0b3IsIHNvIGlnbm9yZSBpdFxuXHRpZiAobWVzc2FnZS50b2tlbikge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFJlc3BvbnNlQnlSb29tSWQocm9vbS5faWQsIHtcblx0XHRcdHVzZXI6IHtcblx0XHRcdFx0X2lkOiBtZXNzYWdlLnUuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogbWVzc2FnZS51LnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0cmVzcG9uc2VEYXRlOiBub3csXG5cdFx0XHRyZXNwb25zZVRpbWU6IChub3cuZ2V0VGltZSgpIC0gcm9vbS50cykgLyAxMDAwXG5cdFx0fSk7XG5cdH0pO1xuXG5cdHJldHVybiBtZXNzYWdlO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnbWFya1Jvb21SZXNwb25kZWQnKTtcbiIsIlJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnbGl2ZWNoYXQub2ZmbGluZU1lc3NhZ2UnLCAoZGF0YSkgPT4ge1xuXHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rX29uX29mZmxpbmVfbXNnJykpIHtcblx0XHRyZXR1cm4gZGF0YTtcblx0fVxuXG5cdGNvbnN0IHBvc3REYXRhID0ge1xuXHRcdHR5cGU6ICdMaXZlY2hhdE9mZmxpbmVNZXNzYWdlJyxcblx0XHRzZW50QXQ6IG5ldyBEYXRlKCksXG5cdFx0dmlzaXRvcjoge1xuXHRcdFx0bmFtZTogZGF0YS5uYW1lLFxuXHRcdFx0ZW1haWw6IGRhdGEuZW1haWxcblx0XHR9LFxuXHRcdG1lc3NhZ2U6IGRhdGEubWVzc2FnZVxuXHR9O1xuXG5cdFJvY2tldENoYXQuTGl2ZWNoYXQuc2VuZFJlcXVlc3QocG9zdERhdGEpO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtc2VuZC1lbWFpbC1vZmZsaW5lLW1lc3NhZ2UnKTtcbiIsImZ1bmN0aW9uIHNlbmRUb1JEU3RhdGlvbihyb29tKSB7XG5cdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X1JEU3RhdGlvbl9Ub2tlbicpKSB7XG5cdFx0cmV0dXJuIHJvb207XG5cdH1cblxuXHRjb25zdCBsaXZlY2hhdERhdGEgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldExpdmVjaGF0Um9vbUd1ZXN0SW5mbyhyb29tKTtcblxuXHRpZiAoIWxpdmVjaGF0RGF0YS52aXNpdG9yLmVtYWlsKSB7XG5cdFx0cmV0dXJuIHJvb207XG5cdH1cblxuXHRjb25zdCBvcHRpb25zID0ge1xuXHRcdGhlYWRlcnM6IHtcblx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcblx0XHR9LFxuXHRcdGRhdGE6IHtcblx0XHRcdHRva2VuX3Jkc3RhdGlvbjogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X1JEU3RhdGlvbl9Ub2tlbicpLFxuXHRcdFx0aWRlbnRpZmljYWRvcjogJ3JvY2tldGNoYXQtbGl2ZWNoYXQnLFxuXHRcdFx0Y2xpZW50X2lkOiBsaXZlY2hhdERhdGEudmlzaXRvci5faWQsXG5cdFx0XHRlbWFpbDogbGl2ZWNoYXREYXRhLnZpc2l0b3IuZW1haWxcblx0XHR9XG5cdH07XG5cblx0b3B0aW9ucy5kYXRhLm5vbWUgPSBsaXZlY2hhdERhdGEudmlzaXRvci5uYW1lIHx8IGxpdmVjaGF0RGF0YS52aXNpdG9yLnVzZXJuYW1lO1xuXG5cdGlmIChsaXZlY2hhdERhdGEudmlzaXRvci5waG9uZSkge1xuXHRcdG9wdGlvbnMuZGF0YS50ZWxlZm9uZSA9IGxpdmVjaGF0RGF0YS52aXNpdG9yLnBob25lO1xuXHR9XG5cblx0aWYgKGxpdmVjaGF0RGF0YS50YWdzKSB7XG5cdFx0b3B0aW9ucy5kYXRhLnRhZ3MgPSBsaXZlY2hhdERhdGEudGFncztcblx0fVxuXG5cdE9iamVjdC5rZXlzKGxpdmVjaGF0RGF0YS5jdXN0b21GaWVsZHMgfHwge30pLmZvckVhY2goZmllbGQgPT4ge1xuXHRcdG9wdGlvbnMuZGF0YVtmaWVsZF0gPSBsaXZlY2hhdERhdGEuY3VzdG9tRmllbGRzW2ZpZWxkXTtcblx0fSk7XG5cblx0T2JqZWN0LmtleXMobGl2ZWNoYXREYXRhLnZpc2l0b3IuY3VzdG9tRmllbGRzIHx8IHt9KS5mb3JFYWNoKGZpZWxkID0+IHtcblx0XHRvcHRpb25zLmRhdGFbZmllbGRdID0gbGl2ZWNoYXREYXRhLnZpc2l0b3IuY3VzdG9tRmllbGRzW2ZpZWxkXTtcblx0fSk7XG5cblx0dHJ5IHtcblx0XHRIVFRQLmNhbGwoJ1BPU1QnLCAnaHR0cHM6Ly93d3cucmRzdGF0aW9uLmNvbS5ici9hcGkvMS4zL2NvbnZlcnNpb25zJywgb3B0aW9ucyk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBzZW5kaW5nIGxlYWQgdG8gUkQgU3RhdGlvbiAtPicsIGUpO1xuXHR9XG5cblx0cmV0dXJuIHJvb207XG59XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnbGl2ZWNoYXQuY2xvc2VSb29tJywgc2VuZFRvUkRTdGF0aW9uLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1yZC1zdGF0aW9uLWNsb3NlLXJvb20nKTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5zYXZlSW5mbycsIHNlbmRUb1JEU3RhdGlvbiwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtcmQtc3RhdGlvbi1zYXZlLWluZm8nKTtcbiIsImNvbnN0IG1zZ05hdlR5cGUgPSAnbGl2ZWNoYXRfbmF2aWdhdGlvbl9oaXN0b3J5JztcblxuY29uc3Qgc2VuZE1lc3NhZ2VUeXBlID0gKG1zZ1R5cGUpID0+IHtcblx0Y29uc3Qgc2VuZE5hdkhpc3RvcnkgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfVmlzaXRvcl9uYXZpZ2F0aW9uX2FzX2FfbWVzc2FnZScpICYmIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTZW5kX3Zpc2l0b3JfbmF2aWdhdGlvbl9oaXN0b3J5X2xpdmVjaGF0X3dlYmhvb2tfcmVxdWVzdCcpO1xuXG5cdHJldHVybiBzZW5kTmF2SGlzdG9yeSAmJiBtc2dUeXBlID09PSBtc2dOYXZUeXBlO1xufTtcblxuZnVuY3Rpb24gc2VuZFRvQ1JNKHR5cGUsIHJvb20sIGluY2x1ZGVNZXNzYWdlcyA9IHRydWUpIHtcblx0Y29uc3QgcG9zdERhdGEgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldExpdmVjaGF0Um9vbUd1ZXN0SW5mbyhyb29tKTtcblxuXHRwb3N0RGF0YS50eXBlID0gdHlwZTtcblxuXHRwb3N0RGF0YS5tZXNzYWdlcyA9IFtdO1xuXG5cdGxldCBtZXNzYWdlcztcblx0aWYgKHR5cGVvZiBpbmNsdWRlTWVzc2FnZXMgPT09ICdib29sZWFuJyAmJiBpbmNsdWRlTWVzc2FnZXMpIHtcblx0XHRtZXNzYWdlcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRWaXNpYmxlQnlSb29tSWQocm9vbS5faWQsIHsgc29ydDogeyB0czogMSB9IH0pO1xuXHR9IGVsc2UgaWYgKGluY2x1ZGVNZXNzYWdlcyBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0bWVzc2FnZXMgPSBpbmNsdWRlTWVzc2FnZXM7XG5cdH1cblxuXHRpZiAobWVzc2FnZXMpIHtcblx0XHRtZXNzYWdlcy5mb3JFYWNoKChtZXNzYWdlKSA9PiB7XG5cdFx0XHRpZiAobWVzc2FnZS50ICYmICFzZW5kTWVzc2FnZVR5cGUobWVzc2FnZS50KSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBtc2cgPSB7XG5cdFx0XHRcdF9pZDogbWVzc2FnZS5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBtZXNzYWdlLnUudXNlcm5hbWUsXG5cdFx0XHRcdG1zZzogbWVzc2FnZS5tc2csXG5cdFx0XHRcdHRzOiBtZXNzYWdlLnRzLFxuXHRcdFx0XHRlZGl0ZWRBdDogbWVzc2FnZS5lZGl0ZWRBdFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKG1lc3NhZ2UudS51c2VybmFtZSAhPT0gcG9zdERhdGEudmlzaXRvci51c2VybmFtZSkge1xuXHRcdFx0XHRtc2cuYWdlbnRJZCA9IG1lc3NhZ2UudS5faWQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChtZXNzYWdlLnQgPT09IG1zZ05hdlR5cGUpIHtcblx0XHRcdFx0bXNnLm5hdmlnYXRpb24gPSBtZXNzYWdlLm5hdmlnYXRpb247XG5cdFx0XHR9XG5cblx0XHRcdHBvc3REYXRhLm1lc3NhZ2VzLnB1c2gobXNnKTtcblx0XHR9KTtcblx0fVxuXG5cdGNvbnN0IHJlc3BvbnNlID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5zZW5kUmVxdWVzdChwb3N0RGF0YSk7XG5cblx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS5kYXRhKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2F2ZUNSTURhdGFCeVJvb21JZChyb29tLl9pZCwgcmVzcG9uc2UuZGF0YS5kYXRhKTtcblx0fVxuXG5cdHJldHVybiByb29tO1xufVxuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2xpdmVjaGF0LmNsb3NlUm9vbScsIChyb29tKSA9PiB7XG5cdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnKSkge1xuXHRcdHJldHVybiByb29tO1xuXHR9XG5cblx0cmV0dXJuIHNlbmRUb0NSTSgnTGl2ZWNoYXRTZXNzaW9uJywgcm9vbSk7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1zZW5kLWNybS1jbG9zZS1yb29tJyk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnbGl2ZWNoYXQuc2F2ZUluZm8nLCAocm9vbSkgPT4ge1xuXHQvLyBEbyBub3Qgc2VuZCB0byBDUk0gaWYgdGhlIGNoYXQgaXMgc3RpbGwgb3BlblxuXHRpZiAocm9vbS5vcGVuKSB7XG5cdFx0cmV0dXJuIHJvb207XG5cdH1cblxuXHRyZXR1cm4gc2VuZFRvQ1JNKCdMaXZlY2hhdEVkaXQnLCByb29tKTtcbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ2xpdmVjaGF0LXNlbmQtY3JtLXNhdmUtaW5mbycpO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlLCByb29tKSB7XG5cdC8vIG9ubHkgY2FsbCB3ZWJob29rIGlmIGl0IGlzIGEgbGl2ZWNoYXQgcm9vbVxuXHRpZiAocm9vbS50ICE9PSAnbCcgfHwgcm9vbS52ID09IG51bGwgfHwgcm9vbS52LnRva2VuID09IG51bGwpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHRva2VuLCBpdCB3YXMgc2VudCBmcm9tIHRoZSB2aXNpdG9yXG5cdC8vIGlmIG5vdCwgaXQgd2FzIHNlbnQgZnJvbSB0aGUgYWdlbnRcblx0aWYgKG1lc3NhZ2UudG9rZW4pIHtcblx0XHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rX29uX3Zpc2l0b3JfbWVzc2FnZScpKSB7XG5cdFx0XHRyZXR1cm4gbWVzc2FnZTtcblx0XHR9XG5cdH0gZWxzZSBpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rX29uX2FnZW50X21lc3NhZ2UnKSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHR5cGUgbWVhbnMgaXQgaXMgYSBzcGVjaWFsIG1lc3NhZ2UgKGxpa2UgdGhlIGNsb3NpbmcgY29tbWVudCksIHNvIHNraXBzXG5cdC8vIHVubGVzcyB0aGUgc2V0dGluZ3MgdGhhdCBoYW5kbGUgd2l0aCB2aXNpdG9yIG5hdmlnYXRpb24gaGlzdG9yeSBhcmUgZW5hYmxlZFxuXHRpZiAobWVzc2FnZS50ICYmICFzZW5kTWVzc2FnZVR5cGUobWVzc2FnZS50KSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0c2VuZFRvQ1JNKCdNZXNzYWdlJywgcm9vbSwgW21lc3NhZ2VdKTtcblx0cmV0dXJuIG1lc3NhZ2U7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1zZW5kLWNybS1tZXNzYWdlJyk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnbGl2ZWNoYXQubGVhZENhcHR1cmUnLCAocm9vbSkgPT4ge1xuXHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rX29uX2NhcHR1cmUnKSkge1xuXHRcdHJldHVybiByb29tO1xuXHR9XG5cdHJldHVybiBzZW5kVG9DUk0oJ0xlYWRDYXB0dXJlJywgcm9vbSwgZmFsc2UpO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtc2VuZC1jcm0tbGVhZC1jYXB0dXJlJyk7XG4iLCJpbXBvcnQgT21uaUNoYW5uZWwgZnJvbSAnLi4vbGliL09tbmlDaGFubmVsJztcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSwgcm9vbSkge1xuXHQvLyBza2lwcyB0aGlzIGNhbGxiYWNrIGlmIHRoZSBtZXNzYWdlIHdhcyBlZGl0ZWRcblx0aWYgKG1lc3NhZ2UuZWRpdGVkQXQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0VuYWJsZWQnKSB8fCAhUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gb25seSBzZW5kIHRoZSBzbXMgYnkgU01TIGlmIGl0IGlzIGEgbGl2ZWNoYXQgcm9vbSB3aXRoIFNNUyBzZXQgdG8gdHJ1ZVxuXHRpZiAoISh0eXBlb2Ygcm9vbS50ICE9PSAndW5kZWZpbmVkJyAmJiByb29tLnQgPT09ICdsJyAmJiByb29tLmZhY2Vib29rICYmIHJvb20udiAmJiByb29tLnYudG9rZW4pKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0b2tlbiwgaXQgd2FzIHNlbnQgZnJvbSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmIChtZXNzYWdlLnRva2VuKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0eXBlIG1lYW5zIGl0IGlzIGEgc3BlY2lhbCBtZXNzYWdlIChsaWtlIHRoZSBjbG9zaW5nIGNvbW1lbnQpLCBzbyBza2lwc1xuXHRpZiAobWVzc2FnZS50KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRPbW5pQ2hhbm5lbC5yZXBseSh7XG5cdFx0cGFnZTogcm9vbS5mYWNlYm9vay5wYWdlLmlkLFxuXHRcdHRva2VuOiByb29tLnYudG9rZW4sXG5cdFx0dGV4dDogbWVzc2FnZS5tc2dcblx0fSk7XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG5cbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ3NlbmRNZXNzYWdlVG9GYWNlYm9vaycpO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6YWRkQWdlbnQnKHVzZXJuYW1lKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmFkZEFnZW50JyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5hZGRBZ2VudCh1c2VybmFtZSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6YWRkTWFuYWdlcicodXNlcm5hbWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6YWRkTWFuYWdlcicgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuYWRkTWFuYWdlcih1c2VybmFtZSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Y2hhbmdlTGl2ZWNoYXRTdGF0dXMnKCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6Y2hhbmdlTGl2ZWNoYXRTdGF0dXMnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0Y29uc3QgbmV3U3RhdHVzID0gdXNlci5zdGF0dXNMaXZlY2hhdCA9PT0gJ2F2YWlsYWJsZScgPyAnbm90LWF2YWlsYWJsZScgOiAnYXZhaWxhYmxlJztcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRMaXZlY2hhdFN0YXR1cyh1c2VyLl9pZCwgbmV3U3RhdHVzKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmNsb3NlQnlWaXNpdG9yJyh7IHJvb21JZCwgdG9rZW4gfSkge1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lT3BlbkJ5VmlzaXRvclRva2VuKHRva2VuLCByb29tSWQpO1xuXG5cdFx0aWYgKCFyb29tIHx8ICFyb29tLm9wZW4pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbik7XG5cblx0XHRjb25zdCBsYW5ndWFnZSA9ICh2aXNpdG9yICYmIHZpc2l0b3IubGFuZ3VhZ2UpIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbic7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5jbG9zZVJvb20oe1xuXHRcdFx0dmlzaXRvcixcblx0XHRcdHJvb20sXG5cdFx0XHRjb21tZW50OiBUQVBpMThuLl9fKCdDbG9zZWRfYnlfdmlzaXRvcicsIHsgbG5nOiBsYW5ndWFnZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmNsb3NlUm9vbScocm9vbUlkLCBjb21tZW50KSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdjbG9zZS1saXZlY2hhdC1yb29tJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpjbG9zZVJvb20nIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udCAhPT0gJ2wnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdyb29tLW5vdC1mb3VuZCcsICdSb29tIG5vdCBmb3VuZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6Y2xvc2VSb29tJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGlmICgoIXJvb20udXNlcm5hbWVzIHx8IHJvb20udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSkgPT09IC0xKSAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2Nsb3NlLW90aGVycy1saXZlY2hhdC1yb29tJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpjbG9zZVJvb20nIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LmNsb3NlUm9vbSh7XG5cdFx0XHR1c2VyLFxuXHRcdFx0cm9vbSxcblx0XHRcdGNvbW1lbnRcblx0XHR9KTtcblx0fVxufSk7XG4iLCJpbXBvcnQgT21uaUNoYW5uZWwgZnJvbSAnLi4vbGliL09tbmlDaGFubmVsJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6ZmFjZWJvb2snKG9wdGlvbnMpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6YWRkQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRzd2l0Y2ggKG9wdGlvbnMuYWN0aW9uKSB7XG5cdFx0XHRcdGNhc2UgJ2luaXRpYWxTdGF0ZSc6IHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZW5hYmxlZDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0VuYWJsZWQnKSxcblx0XHRcdFx0XHRcdGhhc1Rva2VuOiAhIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19BUElfS2V5Jylcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAnZW5hYmxlJzoge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IE9tbmlDaGFubmVsLmVuYWJsZSgpO1xuXG5cdFx0XHRcdFx0aWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJywgdHJ1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICdkaXNhYmxlJzoge1xuXHRcdFx0XHRcdE9tbmlDaGFubmVsLmRpc2FibGUoKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X0ZhY2Vib29rX0VuYWJsZWQnLCBmYWxzZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICdsaXN0LXBhZ2VzJzoge1xuXHRcdFx0XHRcdHJldHVybiBPbW5pQ2hhbm5lbC5saXN0UGFnZXMoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgJ3N1YnNjcmliZSc6IHtcblx0XHRcdFx0XHRyZXR1cm4gT21uaUNoYW5uZWwuc3Vic2NyaWJlKG9wdGlvbnMucGFnZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICd1bnN1YnNjcmliZSc6IHtcblx0XHRcdFx0XHRyZXR1cm4gT21uaUNoYW5uZWwudW5zdWJzY3JpYmUob3B0aW9ucy5wYWdlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlLnJlc3BvbnNlICYmIGUucmVzcG9uc2UuZGF0YSAmJiBlLnJlc3BvbnNlLmRhdGEuZXJyb3IpIHtcblx0XHRcdFx0aWYgKGUucmVzcG9uc2UuZGF0YS5lcnJvci5lcnJvcikge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZS5yZXNwb25zZS5kYXRhLmVycm9yLmVycm9yLCBlLnJlc3BvbnNlLmRhdGEuZXJyb3IubWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGUucmVzcG9uc2UuZGF0YS5lcnJvci5yZXNwb25zZSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludGVncmF0aW9uLWVycm9yJywgZS5yZXNwb25zZS5kYXRhLmVycm9yLnJlc3BvbnNlLmVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChlLnJlc3BvbnNlLmRhdGEuZXJyb3IubWVzc2FnZSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludGVncmF0aW9uLWVycm9yJywgZS5yZXNwb25zZS5kYXRhLmVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBjb250YWN0aW5nIG9tbmkucm9ja2V0LmNoYXQ6JywgZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnRlZ3JhdGlvbi1lcnJvcicsIGUuZXJyb3IpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpnZXRDdXN0b21GaWVsZHMnKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmQoKS5mZXRjaCgpO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Z2V0QWdlbnREYXRhJyh7IHJvb21JZCwgdG9rZW4gfSkge1xuXHRcdGNoZWNrKHJvb21JZCwgU3RyaW5nKTtcblx0XHRjaGVjayh0b2tlbiwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuKTtcblxuXHRcdC8vIGFsbG93IHRvIG9ubHkgdXNlciB0byBzZW5kIHRyYW5zY3JpcHRzIGZyb20gdGhlaXIgb3duIGNoYXRzXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udCAhPT0gJ2wnIHx8ICFyb29tLnYgfHwgcm9vbS52LnRva2VuICE9PSB2aXNpdG9yLnRva2VuKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb29tLnNlcnZlZEJ5KSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldEFnZW50SW5mbyhyb29tLnNlcnZlZEJ5Ll9pZCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Z2V0SW5pdGlhbERhdGEnKHZpc2l0b3JUb2tlbikge1xuXHRcdGNvbnN0IGluZm8gPSB7XG5cdFx0XHRlbmFibGVkOiBudWxsLFxuXHRcdFx0dGl0bGU6IG51bGwsXG5cdFx0XHRjb2xvcjogbnVsbCxcblx0XHRcdHJlZ2lzdHJhdGlvbkZvcm06IG51bGwsXG5cdFx0XHRyb29tOiBudWxsLFxuXHRcdFx0dmlzaXRvcjogbnVsbCxcblx0XHRcdHRyaWdnZXJzOiBbXSxcblx0XHRcdGRlcGFydG1lbnRzOiBbXSxcblx0XHRcdGFsbG93U3dpdGNoaW5nRGVwYXJ0bWVudHM6IG51bGwsXG5cdFx0XHRvbmxpbmU6IHRydWUsXG5cdFx0XHRvZmZsaW5lQ29sb3I6IG51bGwsXG5cdFx0XHRvZmZsaW5lTWVzc2FnZTogbnVsbCxcblx0XHRcdG9mZmxpbmVTdWNjZXNzTWVzc2FnZTogbnVsbCxcblx0XHRcdG9mZmxpbmVVbmF2YWlsYWJsZU1lc3NhZ2U6IG51bGwsXG5cdFx0XHRkaXNwbGF5T2ZmbGluZUZvcm06IG51bGwsXG5cdFx0XHR2aWRlb0NhbGw6IG51bGwsXG5cdFx0XHRjb252ZXJzYXRpb25GaW5pc2hlZE1lc3NhZ2U6IG51bGwsXG5cdFx0XHRuYW1lRmllbGRSZWdpc3RyYXRpb25Gb3JtOiBudWxsLFxuXHRcdFx0ZW1haWxGaWVsZFJlZ2lzdHJhdGlvbkZvcm06IG51bGxcblx0XHR9O1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odmlzaXRvclRva2VuLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0bmFtZTogMSxcblx0XHRcdFx0dDogMSxcblx0XHRcdFx0Y2w6IDEsXG5cdFx0XHRcdHU6IDEsXG5cdFx0XHRcdHVzZXJuYW1lczogMSxcblx0XHRcdFx0djogMSxcblx0XHRcdFx0c2VydmVkQnk6IDFcblx0XHRcdH1cblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0aWYgKHJvb20gJiYgcm9vbS5sZW5ndGggPiAwKSB7XG5cdFx0XHRpbmZvLnJvb20gPSByb29tWzBdO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHZpc2l0b3JUb2tlbiwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdG5hbWU6IDEsXG5cdFx0XHRcdHVzZXJuYW1lOiAxLFxuXHRcdFx0XHR2aXNpdG9yRW1haWxzOiAxXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAocm9vbSkge1xuXHRcdFx0aW5mby52aXNpdG9yID0gdmlzaXRvcjtcblx0XHR9XG5cblx0XHRjb25zdCBpbml0U2V0dGluZ3MgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldEluaXRTZXR0aW5ncygpO1xuXG5cdFx0aW5mby50aXRsZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF90aXRsZTtcblx0XHRpbmZvLmNvbG9yID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X3RpdGxlX2NvbG9yO1xuXHRcdGluZm8uZW5hYmxlZCA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9lbmFibGVkO1xuXHRcdGluZm8ucmVnaXN0cmF0aW9uRm9ybSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9yZWdpc3RyYXRpb25fZm9ybTtcblx0XHRpbmZvLm9mZmxpbmVUaXRsZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9vZmZsaW5lX3RpdGxlO1xuXHRcdGluZm8ub2ZmbGluZUNvbG9yID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3I7XG5cdFx0aW5mby5vZmZsaW5lTWVzc2FnZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9vZmZsaW5lX21lc3NhZ2U7XG5cdFx0aW5mby5vZmZsaW5lU3VjY2Vzc01lc3NhZ2UgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2U7XG5cdFx0aW5mby5vZmZsaW5lVW5hdmFpbGFibGVNZXNzYWdlID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X29mZmxpbmVfZm9ybV91bmF2YWlsYWJsZTtcblx0XHRpbmZvLmRpc3BsYXlPZmZsaW5lRm9ybSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybTtcblx0XHRpbmZvLmxhbmd1YWdlID0gaW5pdFNldHRpbmdzLkxhbmd1YWdlO1xuXHRcdGluZm8udmlkZW9DYWxsID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X3ZpZGVvY2FsbF9lbmFibGVkID09PSB0cnVlICYmIGluaXRTZXR0aW5ncy5KaXRzaV9FbmFibGVkID09PSB0cnVlO1xuXHRcdGluZm8udHJhbnNjcmlwdCA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9lbmFibGVfdHJhbnNjcmlwdDtcblx0XHRpbmZvLnRyYW5zY3JpcHRNZXNzYWdlID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X3RyYW5zY3JpcHRfbWVzc2FnZTtcblx0XHRpbmZvLmNvbnZlcnNhdGlvbkZpbmlzaGVkTWVzc2FnZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9jb252ZXJzYXRpb25fZmluaXNoZWRfbWVzc2FnZTtcblx0XHRpbmZvLm5hbWVGaWVsZFJlZ2lzdHJhdGlvbkZvcm0gPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfbmFtZV9maWVsZF9yZWdpc3RyYXRpb25fZm9ybTtcblx0XHRpbmZvLmVtYWlsRmllbGRSZWdpc3RyYXRpb25Gb3JtID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X2VtYWlsX2ZpZWxkX3JlZ2lzdHJhdGlvbl9mb3JtO1xuXG5cdFx0aW5mby5hZ2VudERhdGEgPSByb29tICYmIHJvb21bMF0gJiYgcm9vbVswXS5zZXJ2ZWRCeSAmJiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8ocm9vbVswXS5zZXJ2ZWRCeS5faWQpO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRUcmlnZ2VyLmZpbmRFbmFibGVkKCkuZm9yRWFjaCgodHJpZ2dlcikgPT4ge1xuXHRcdFx0aW5mby50cmlnZ2Vycy5wdXNoKF8ucGljayh0cmlnZ2VyLCAnX2lkJywgJ2FjdGlvbnMnLCAnY29uZGl0aW9ucycpKTtcblx0XHR9KTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kRW5hYmxlZFdpdGhBZ2VudHMoKS5mb3JFYWNoKChkZXBhcnRtZW50KSA9PiB7XG5cdFx0XHRpbmZvLmRlcGFydG1lbnRzLnB1c2goZGVwYXJ0bWVudCk7XG5cdFx0fSk7XG5cdFx0aW5mby5hbGxvd1N3aXRjaGluZ0RlcGFydG1lbnRzID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X2FsbG93X3N3aXRjaGluZ19kZXBhcnRtZW50cztcblxuXHRcdGluZm8ub25saW5lID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZUFnZW50cygpLmNvdW50KCkgPiAwO1xuXG5cdFx0cmV0dXJuIGluZm87XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Z2V0TmV4dEFnZW50Jyh7IHRva2VuLCBkZXBhcnRtZW50IH0pIHtcblx0XHRjaGVjayh0b2tlbiwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuKHRva2VuKS5mZXRjaCgpO1xuXG5cdFx0aWYgKHJvb20gJiYgcm9vbS5sZW5ndGggPiAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCFkZXBhcnRtZW50KSB7XG5cdFx0XHRjb25zdCByZXF1aXJlRGVwYXJtZW50ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXRSZXF1aXJlZERlcGFydG1lbnQoKTtcblx0XHRcdGlmIChyZXF1aXJlRGVwYXJtZW50KSB7XG5cdFx0XHRcdGRlcGFydG1lbnQgPSByZXF1aXJlRGVwYXJtZW50Ll9pZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBhZ2VudCA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0TmV4dEFnZW50KGRlcGFydG1lbnQpO1xuXHRcdGlmICghYWdlbnQpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKGFnZW50LmFnZW50SWQpO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6bG9hZEhpc3RvcnknKHsgdG9rZW4sIHJpZCwgZW5kLCBsaW1pdCA9IDIwLCBsc30pIHtcblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbiwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cblx0XHRpZiAoIXZpc2l0b3IpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5sb2FkTWVzc2FnZUhpc3RvcnkoeyB1c2VySWQ6IHZpc2l0b3IuX2lkLCByaWQsIGVuZCwgbGltaXQsIGxzIH0pO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6bG9naW5CeVRva2VuJyh0b2tlbikge1xuXHRcdGNvbnN0IHVzZXIgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRfaWQ6IHVzZXIuX2lkXG5cdFx0fTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpwYWdlVmlzaXRlZCcodG9rZW4sIHJvb20sIHBhZ2VJbmZvKSB7XG5cdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zYXZlUGFnZUhpc3RvcnkodG9rZW4sIHJvb20sIHBhZ2VJbmZvKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnJlZ2lzdGVyR3Vlc3QnKHsgdG9rZW4sIG5hbWUsIGVtYWlsLCBkZXBhcnRtZW50IH0gPSB7fSkge1xuXHRcdGNvbnN0IHVzZXJJZCA9IFJvY2tldENoYXQuTGl2ZWNoYXQucmVnaXN0ZXJHdWVzdC5jYWxsKHRoaXMsIHtcblx0XHRcdHRva2VuLFxuXHRcdFx0bmFtZSxcblx0XHRcdGVtYWlsLFxuXHRcdFx0ZGVwYXJ0bWVudFxuXHRcdH0pO1xuXG5cdFx0Ly8gdXBkYXRlIHZpc2l0ZWQgcGFnZSBoaXN0b3J5IHRvIG5vdCBleHBpcmVcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5rZWVwSGlzdG9yeUZvclRva2VuKHRva2VuKTtcblxuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0bmFtZTogMSxcblx0XHRcdFx0dXNlcm5hbWU6IDEsXG5cdFx0XHRcdHZpc2l0b3JFbWFpbHM6IDFcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHR1c2VySWQsXG5cdFx0XHR2aXNpdG9yXG5cdFx0fTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZW1vdmVBZ2VudCcodXNlcm5hbWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZUFnZW50KHVzZXJuYW1lKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZW1vdmVDdXN0b21GaWVsZCcoX2lkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZUN1c3RvbUZpZWxkJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayhfaWQsIFN0cmluZyk7XG5cblx0XHRjb25zdCBjdXN0b21GaWVsZCA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuZmluZE9uZUJ5SWQoX2lkLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghY3VzdG9tRmllbGQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY3VzdG9tLWZpZWxkJywgJ0N1c3RvbSBmaWVsZCBub3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZUN1c3RvbUZpZWxkJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5yZW1vdmVCeUlkKF9pZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cmVtb3ZlRGVwYXJ0bWVudCcoX2lkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZURlcGFydG1lbnQnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZURlcGFydG1lbnQoX2lkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZW1vdmVNYW5hZ2VyJyh1c2VybmFtZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVNYW5hZ2VyJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZW1vdmVNYW5hZ2VyKHVzZXJuYW1lKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZW1vdmVUcmlnZ2VyJyh0cmlnZ2VySWQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlVHJpZ2dlcicgfSk7XG5cdFx0fVxuXG5cdFx0Y2hlY2sodHJpZ2dlcklkLCBTdHJpbmcpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci5yZW1vdmVCeUlkKHRyaWdnZXJJZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cmVtb3ZlUm9vbScocmlkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdyZW1vdmUtY2xvc2VkLWxpdmVjaGF0LXJvb21zJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVSb29tJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKTtcblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlUm9vbSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChyb29tLnQgIT09ICdsJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItdGhpcy1pcy1ub3QtYS1saXZlY2hhdC1yb29tJywgJ1RoaXMgaXMgbm90IGEgTGl2ZWNoYXQgcm9vbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlUm9vbSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChyb29tLm9wZW4pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20taXMtbm90LWNsb3NlZCcsICdSb29tIGlzIG5vdCBjbG9zZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZVJvb20nXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5yZW1vdmVCeVJvb21JZChyaWQpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMucmVtb3ZlQnlSb29tSWQocmlkKTtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucmVtb3ZlQnlJZChyaWQpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNhdmVBcHBlYXJhbmNlJyhzZXR0aW5ncykge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlQXBwZWFyYW5jZScgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmFsaWRTZXR0aW5ncyA9IFtcblx0XHRcdCdMaXZlY2hhdF90aXRsZScsXG5cdFx0XHQnTGl2ZWNoYXRfdGl0bGVfY29sb3InLFxuXHRcdFx0J0xpdmVjaGF0X3Nob3dfYWdlbnRfZW1haWwnLFxuXHRcdFx0J0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGUnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfbWVzc2FnZScsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGUnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3InLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfZW1haWwnLFxuXHRcdFx0J0xpdmVjaGF0X2NvbnZlcnNhdGlvbl9maW5pc2hlZF9tZXNzYWdlJyxcblx0XHRcdCdMaXZlY2hhdF9yZWdpc3RyYXRpb25fZm9ybScsXG5cdFx0XHQnTGl2ZWNoYXRfbmFtZV9maWVsZF9yZWdpc3RyYXRpb25fZm9ybScsXG5cdFx0XHQnTGl2ZWNoYXRfZW1haWxfZmllbGRfcmVnaXN0cmF0aW9uX2Zvcm0nXG5cdFx0XTtcblxuXHRcdGNvbnN0IHZhbGlkID0gc2V0dGluZ3MuZXZlcnkoKHNldHRpbmcpID0+IHtcblx0XHRcdHJldHVybiB2YWxpZFNldHRpbmdzLmluZGV4T2Yoc2V0dGluZy5faWQpICE9PSAtMTtcblx0XHR9KTtcblxuXHRcdGlmICghdmFsaWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtc2V0dGluZycpO1xuXHRcdH1cblxuXHRcdHNldHRpbmdzLmZvckVhY2goKHNldHRpbmcpID0+IHtcblx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZChzZXR0aW5nLl9pZCwgc2V0dGluZy52YWx1ZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm47XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTWF0Y2guT2JqZWN0SW5jbHVkaW5nXCIsIFwiTWF0Y2guT3B0aW9uYWxcIl19XSAqL1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlQ3VzdG9tRmllbGQnKF9pZCwgY3VzdG9tRmllbGREYXRhKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0Y2hlY2soX2lkLCBTdHJpbmcpO1xuXHRcdH1cblxuXHRcdGNoZWNrKGN1c3RvbUZpZWxkRGF0YSwgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHsgZmllbGQ6IFN0cmluZywgbGFiZWw6IFN0cmluZywgc2NvcGU6IFN0cmluZywgdmlzaWJpbGl0eTogU3RyaW5nIH0pKTtcblxuXHRcdGlmICghL15bMC05YS16QS1aLV9dKyQvLnRlc3QoY3VzdG9tRmllbGREYXRhLmZpZWxkKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jdXN0b20tZmllbGQtbm1hZScsICdJbnZhbGlkIGN1c3RvbSBmaWVsZCBuYW1lLiBVc2Ugb25seSBsZXR0ZXJzLCBudW1iZXJzLCBoeXBoZW5zIGFuZCB1bmRlcnNjb3Jlcy4nLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0Y29uc3QgY3VzdG9tRmllbGQgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmRPbmVCeUlkKF9pZCk7XG5cdFx0XHRpZiAoIWN1c3RvbUZpZWxkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY3VzdG9tLWZpZWxkJywgJ0N1c3RvbSBGaWVsZCBOb3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuY3JlYXRlT3JVcGRhdGVDdXN0b21GaWVsZChfaWQsIGN1c3RvbUZpZWxkRGF0YS5maWVsZCwgY3VzdG9tRmllbGREYXRhLmxhYmVsLCBjdXN0b21GaWVsZERhdGEuc2NvcGUsIGN1c3RvbUZpZWxkRGF0YS52aXNpYmlsaXR5KTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlRGVwYXJ0bWVudCcoX2lkLCBkZXBhcnRtZW50RGF0YSwgZGVwYXJ0bWVudEFnZW50cykge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlRGVwYXJ0bWVudCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuc2F2ZURlcGFydG1lbnQoX2lkLCBkZXBhcnRtZW50RGF0YSwgZGVwYXJ0bWVudEFnZW50cyk7XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTWF0Y2guT2JqZWN0SW5jbHVkaW5nXCIsIFwiTWF0Y2guT3B0aW9uYWxcIl19XSAqL1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlSW5mbycoZ3Vlc3REYXRhLCByb29tRGF0YSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1sLXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVJbmZvJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayhndWVzdERhdGEsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRfaWQ6IFN0cmluZyxcblx0XHRcdG5hbWU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRlbWFpbDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdHBob25lOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpXG5cdFx0fSkpO1xuXG5cdFx0Y2hlY2socm9vbURhdGEsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRfaWQ6IFN0cmluZyxcblx0XHRcdHRvcGljOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0dGFnczogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tRGF0YS5faWQsIHtmaWVsZHM6IHt0OiAxLCBzZXJ2ZWRCeTogMX19KTtcblxuXHRcdGlmIChyb29tID09IG51bGwgfHwgcm9vbS50ICE9PSAnbCcpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVJbmZvJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoKCFyb29tLnNlcnZlZEJ5IHx8IHJvb20uc2VydmVkQnkuX2lkICE9PSBNZXRlb3IudXNlcklkKCkpICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnc2F2ZS1vdGhlcnMtbGl2ZWNoYXQtcm9vbS1pbmZvJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlSW5mbycgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmV0ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5zYXZlR3Vlc3QoZ3Vlc3REYXRhKSAmJiBSb2NrZXRDaGF0LkxpdmVjaGF0LnNhdmVSb29tSW5mbyhyb29tRGF0YSwgZ3Vlc3REYXRhKTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0LnNhdmVJbmZvJywgUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbURhdGEuX2lkKSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcmV0O1xuXHR9XG59KTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2F2ZUludGVncmF0aW9uJyh2YWx1ZXMpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZUludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va1VybCddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF93ZWJob29rVXJsJywgcy50cmltKHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va1VybCddKSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZXNbJ0xpdmVjaGF0X3NlY3JldF90b2tlbiddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF9zZWNyZXRfdG9rZW4nLCBzLnRyaW0odmFsdWVzWydMaXZlY2hhdF9zZWNyZXRfdG9rZW4nXSkpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdmFsdWVzWydMaXZlY2hhdF93ZWJob29rX29uX2Nsb3NlJ10gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnLCAhIXZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl9jbG9zZSddKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl9vZmZsaW5lX21zZyddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF93ZWJob29rX29uX29mZmxpbmVfbXNnJywgISF2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fb2ZmbGluZV9tc2cnXSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fdmlzaXRvcl9tZXNzYWdlJ10gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fdmlzaXRvcl9tZXNzYWdlJywgISF2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fdmlzaXRvcl9tZXNzYWdlJ10pO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdmFsdWVzWydMaXZlY2hhdF93ZWJob29rX29uX2FnZW50X21lc3NhZ2UnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZCgnTGl2ZWNoYXRfd2ViaG9va19vbl9hZ2VudF9tZXNzYWdlJywgISF2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fYWdlbnRfbWVzc2FnZSddKTtcblx0XHR9XG5cblx0XHRyZXR1cm47XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTWF0Y2guT2JqZWN0SW5jbHVkaW5nXCJdfV0gKi9cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlU3VydmV5RmVlZGJhY2snKHZpc2l0b3JUb2tlbiwgdmlzaXRvclJvb20sIGZvcm1EYXRhKSB7XG5cdFx0Y2hlY2sodmlzaXRvclRva2VuLCBTdHJpbmcpO1xuXHRcdGNoZWNrKHZpc2l0b3JSb29tLCBTdHJpbmcpO1xuXHRcdGNoZWNrKGZvcm1EYXRhLCBbTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHsgbmFtZTogU3RyaW5nLCB2YWx1ZTogU3RyaW5nIH0pXSk7XG5cblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih2aXNpdG9yVG9rZW4pO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZCh2aXNpdG9yUm9vbSk7XG5cblx0XHRpZiAodmlzaXRvciAhPT0gdW5kZWZpbmVkICYmIHJvb20gIT09IHVuZGVmaW5lZCAmJiByb29tLnYgIT09IHVuZGVmaW5lZCAmJiByb29tLnYudG9rZW4gPT09IHZpc2l0b3IudG9rZW4pIHtcblx0XHRcdGNvbnN0IHVwZGF0ZURhdGEgPSB7fTtcblx0XHRcdGZvciAoY29uc3QgaXRlbSBvZiBmb3JtRGF0YSkge1xuXHRcdFx0XHRpZiAoXy5jb250YWlucyhbJ3NhdGlzZmFjdGlvbicsICdhZ2VudEtub3dsZWRnZScsICdhZ2VudFJlc3Bvc2l2ZW5lc3MnLCAnYWdlbnRGcmllbmRsaW5lc3MnXSwgaXRlbS5uYW1lKSAmJiBfLmNvbnRhaW5zKFsnMScsICcyJywgJzMnLCAnNCcsICc1J10sIGl0ZW0udmFsdWUpKSB7XG5cdFx0XHRcdFx0dXBkYXRlRGF0YVtpdGVtLm5hbWVdID0gaXRlbS52YWx1ZTtcblx0XHRcdFx0fSBlbHNlIGlmIChpdGVtLm5hbWUgPT09ICdhZGRpdGlvbmFsRmVlZGJhY2snKSB7XG5cdFx0XHRcdFx0dXBkYXRlRGF0YVtpdGVtLm5hbWVdID0gaXRlbS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCFfLmlzRW1wdHkodXBkYXRlRGF0YSkpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZVN1cnZleUZlZWRiYWNrQnlJZChyb29tLl9pZCwgdXBkYXRlRGF0YSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNhdmVUcmlnZ2VyJyh0cmlnZ2VyKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVUcmlnZ2VyJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayh0cmlnZ2VyLCB7XG5cdFx0XHRfaWQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRuYW1lOiBTdHJpbmcsXG5cdFx0XHRkZXNjcmlwdGlvbjogU3RyaW5nLFxuXHRcdFx0ZW5hYmxlZDogQm9vbGVhbixcblx0XHRcdGNvbmRpdGlvbnM6IEFycmF5LFxuXHRcdFx0YWN0aW9uczogQXJyYXlcblx0XHR9KTtcblxuXHRcdGlmICh0cmlnZ2VyLl9pZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci51cGRhdGVCeUlkKHRyaWdnZXIuX2lkLCB0cmlnZ2VyKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci5pbnNlcnQodHJpZ2dlcik7XG5cdFx0fVxuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzZWFyY2hBZ2VudCcodXNlcm5hbWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2VhcmNoQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghdXNlcm5hbWUgfHwgIV8uaXNTdHJpbmcodXNlcm5hbWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWFyZ3VtZW50cycsICdJbnZhbGlkIGFyZ3VtZW50cycsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2VhcmNoQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxLCB1c2VybmFtZTogMSB9IH0pO1xuXG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzZWFyY2hBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVzZXI7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdHNlbmRNZXNzYWdlTGl2ZWNoYXQoeyB0b2tlbiwgX2lkLCByaWQsIG1zZyB9LCBhZ2VudCkge1xuXHRcdGNoZWNrKHRva2VuLCBTdHJpbmcpO1xuXHRcdGNoZWNrKF9pZCwgU3RyaW5nKTtcblx0XHRjaGVjayhyaWQsIFN0cmluZyk7XG5cdFx0Y2hlY2sobXNnLCBTdHJpbmcpO1xuXG5cdFx0Y2hlY2soYWdlbnQsIE1hdGNoLk1heWJlKHtcblx0XHRcdGFnZW50SWQ6IFN0cmluZyxcblx0XHRcdHVzZXJuYW1lOiBTdHJpbmdcblx0XHR9KSk7XG5cblx0XHRjb25zdCBndWVzdCA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4sIHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHRuYW1lOiAxLFxuXHRcdFx0XHR1c2VybmFtZTogMSxcblx0XHRcdFx0ZGVwYXJ0bWVudDogMSxcblx0XHRcdFx0dG9rZW46IDFcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGlmICghZ3Vlc3QpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtdG9rZW4nKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5zZW5kTWVzc2FnZSh7XG5cdFx0XHRndWVzdCxcblx0XHRcdG1lc3NhZ2U6IHtcblx0XHRcdFx0X2lkLFxuXHRcdFx0XHRyaWQsXG5cdFx0XHRcdG1zZyxcblx0XHRcdFx0dG9rZW5cblx0XHRcdH0sXG5cdFx0XHRhZ2VudFxuXHRcdH0pO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgRERQUmF0ZUxpbWl0ZXIgKi9cbmltcG9ydCBkbnMgZnJvbSAnZG5zJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2VuZE9mZmxpbmVNZXNzYWdlJyhkYXRhKSB7XG5cdFx0Y2hlY2soZGF0YSwge1xuXHRcdFx0bmFtZTogU3RyaW5nLFxuXHRcdFx0ZW1haWw6IFN0cmluZyxcblx0XHRcdG1lc3NhZ2U6IFN0cmluZ1xuXHRcdH0pO1xuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfZGlzcGxheV9vZmZsaW5lX2Zvcm0nKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhlYWRlciA9IFJvY2tldENoYXQucGxhY2Vob2xkZXJzLnJlcGxhY2UoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0VtYWlsX0hlYWRlcicpIHx8ICcnKTtcblx0XHRjb25zdCBmb290ZXIgPSBSb2NrZXRDaGF0LnBsYWNlaG9sZGVycy5yZXBsYWNlKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdFbWFpbF9Gb290ZXInKSB8fCAnJyk7XG5cblx0XHRjb25zdCBtZXNzYWdlID0gKGAkeyBkYXRhLm1lc3NhZ2UgfWApLnJlcGxhY2UoLyhbXj5cXHJcXG5dPykoXFxyXFxufFxcblxccnxcXHJ8XFxuKS9nLCAnJDEnICsgJzxicj4nICsgJyQyJyk7XG5cblx0XHRjb25zdCBodG1sID0gYFxuXHRcdFx0PGgxPk5ldyBsaXZlY2hhdCBtZXNzYWdlPC9oMT5cblx0XHRcdDxwPjxzdHJvbmc+VmlzaXRvciBuYW1lOjwvc3Ryb25nPiAkeyBkYXRhLm5hbWUgfTwvcD5cblx0XHRcdDxwPjxzdHJvbmc+VmlzaXRvciBlbWFpbDo8L3N0cm9uZz4gJHsgZGF0YS5lbWFpbCB9PC9wPlxuXHRcdFx0PHA+PHN0cm9uZz5NZXNzYWdlOjwvc3Ryb25nPjxicj4keyBtZXNzYWdlIH08L3A+YDtcblxuXHRcdGxldCBmcm9tRW1haWwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRnJvbV9FbWFpbCcpLm1hdGNoKC9cXGJbQS1aMC05Ll8lKy1dK0AoPzpbQS1aMC05LV0rXFwuKStbQS1aXXsyLDR9XFxiL2kpO1xuXG5cdFx0aWYgKGZyb21FbWFpbCkge1xuXHRcdFx0ZnJvbUVtYWlsID0gZnJvbUVtYWlsWzBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmcm9tRW1haWwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRnJvbV9FbWFpbCcpO1xuXHRcdH1cblxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfdmFsaWRhdGVfb2ZmbGluZV9lbWFpbCcpKSB7XG5cdFx0XHRjb25zdCBlbWFpbERvbWFpbiA9IGRhdGEuZW1haWwuc3Vic3RyKGRhdGEuZW1haWwubGFzdEluZGV4T2YoJ0AnKSArIDEpO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRNZXRlb3Iud3JhcEFzeW5jKGRucy5yZXNvbHZlTXgpKGVtYWlsRG9tYWluKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1lbWFpbC1hZGRyZXNzJywgJ0ludmFsaWQgZW1haWwgYWRkcmVzcycsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2VuZE9mZmxpbmVNZXNzYWdlJyB9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0RW1haWwuc2VuZCh7XG5cdFx0XHRcdHRvOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfb2ZmbGluZV9lbWFpbCcpLFxuXHRcdFx0XHRmcm9tOiBgJHsgZGF0YS5uYW1lIH0gLSAkeyBkYXRhLmVtYWlsIH0gPCR7IGZyb21FbWFpbCB9PmAsXG5cdFx0XHRcdHJlcGx5VG86IGAkeyBkYXRhLm5hbWUgfSA8JHsgZGF0YS5lbWFpbCB9PmAsXG5cdFx0XHRcdHN1YmplY3Q6IGBMaXZlY2hhdCBvZmZsaW5lIG1lc3NhZ2UgZnJvbSAkeyBkYXRhLm5hbWUgfTogJHsgKGAkeyBkYXRhLm1lc3NhZ2UgfWApLnN1YnN0cmluZygwLCAyMCkgfWAsXG5cdFx0XHRcdGh0bWw6IGhlYWRlciArIGh0bWwgKyBmb290ZXJcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignbGl2ZWNoYXQub2ZmbGluZU1lc3NhZ2UnLCBkYXRhKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcblxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZSh7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAnbGl2ZWNoYXQ6c2VuZE9mZmxpbmVNZXNzYWdlJyxcblx0Y29ubmVjdGlvbklkKCkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59LCAxLCA1MDAwKTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2V0Q3VzdG9tRmllbGQnKHRva2VuLCBrZXksIHZhbHVlLCBvdmVyd3JpdGUgPSB0cnVlKSB7XG5cdFx0Y29uc3QgY3VzdG9tRmllbGQgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmRPbmVCeUlkKGtleSk7XG5cdFx0aWYgKGN1c3RvbUZpZWxkKSB7XG5cdFx0XHRpZiAoY3VzdG9tRmllbGQuc2NvcGUgPT09ICdyb29tJykge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlTGl2ZWNoYXREYXRhQnlUb2tlbih0b2tlbiwga2V5LCB2YWx1ZSwgb3ZlcndyaXRlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFNhdmUgaW4gdXNlclxuXHRcdFx0XHRyZXR1cm4gTGl2ZWNoYXRWaXNpdG9ycy51cGRhdGVMaXZlY2hhdERhdGFCeVRva2VuKHRva2VuLCBrZXksIHZhbHVlLCBvdmVyd3JpdGUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNldERlcGFydG1lbnRGb3JWaXNpdG9yJyh7IHRva2VuLCBkZXBhcnRtZW50IH0gPSB7fSkge1xuXHRcdFJvY2tldENoYXQuTGl2ZWNoYXQuc2V0RGVwYXJ0bWVudEZvckd1ZXN0LmNhbGwodGhpcywge1xuXHRcdFx0dG9rZW4sXG5cdFx0XHRkZXBhcnRtZW50XG5cdFx0fSk7XG5cblx0XHQvLyB1cGRhdGUgdmlzaXRlZCBwYWdlIGhpc3RvcnkgdG8gbm90IGV4cGlyZVxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmtlZXBIaXN0b3J5Rm9yVG9rZW4odG9rZW4pO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTUQ1XCJdfV0gKi9cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnN0YXJ0VmlkZW9DYWxsJyhyb29tSWQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmNsb3NlQnlWaXNpdG9yJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBndWVzdCA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRjb25zdCBtZXNzYWdlID0ge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZDogcm9vbUlkIHx8IFJhbmRvbS5pZCgpLFxuXHRcdFx0bXNnOiAnJyxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpXG5cdFx0fTtcblxuXHRcdGNvbnN0IHsgcm9vbSB9ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXRSb29tKGd1ZXN0LCBtZXNzYWdlLCB7IGppdHNpVGltZW91dDogbmV3IERhdGUoRGF0ZS5ub3coKSArIDM2MDAgKiAxMDAwKSB9KTtcblx0XHRtZXNzYWdlLnJpZCA9IHJvb20uX2lkO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcignbGl2ZWNoYXRfdmlkZW9fY2FsbCcsIHJvb20uX2lkLCAnJywgZ3Vlc3QsIHtcblx0XHRcdGFjdGlvbkxpbmtzOiBbXG5cdFx0XHRcdHsgaWNvbjogJ2ljb24tdmlkZW9jYW0nLCBpMThuTGFiZWw6ICdBY2NlcHQnLCBtZXRob2RfaWQ6ICdjcmVhdGVMaXZlY2hhdENhbGwnLCBwYXJhbXM6ICcnIH0sXG5cdFx0XHRcdHsgaWNvbjogJ2ljb24tY2FuY2VsJywgaTE4bkxhYmVsOiAnRGVjbGluZScsIG1ldGhvZF9pZDogJ2RlbnlMaXZlY2hhdENhbGwnLCBwYXJhbXM6ICcnIH1cblx0XHRcdF1cblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyb29tSWQ6IHJvb20uX2lkLFxuXHRcdFx0ZG9tYWluOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSml0c2lfRG9tYWluJyksXG5cdFx0XHRqaXRzaVJvb206IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdKaXRzaV9VUkxfUm9vbV9QcmVmaXgnKSArIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd1bmlxdWVJRCcpICsgcm9vbUlkXG5cdFx0fTtcblx0fVxufSk7XG5cbiIsIi8qIGVzbGludCBuZXctY2FwOiBbMiwge1wiY2FwSXNOZXdFeGNlcHRpb25zXCI6IFtcIk1hdGNoLk9wdGlvbmFsXCJdfV0gKi9cblxuaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDp0cmFuc2ZlcicodHJhbnNmZXJEYXRhKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6dHJhbnNmZXInIH0pO1xuXHRcdH1cblxuXHRcdGNoZWNrKHRyYW5zZmVyRGF0YSwge1xuXHRcdFx0cm9vbUlkOiBTdHJpbmcsXG5cdFx0XHR1c2VySWQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRkZXBhcnRtZW50SWQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZylcblx0XHR9KTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZCh0cmFuc2ZlckRhdGEucm9vbUlkKTtcblxuXHRcdGNvbnN0IGd1ZXN0ID0gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lQnlJZChyb29tLnYuX2lkKTtcblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0aWYgKHJvb20udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSkgPT09IC0xICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1JvbGUoTWV0ZW9yLnVzZXJJZCgpLCAnbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6dHJhbnNmZXInIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LnRyYW5zZmVyKHJvb20sIGd1ZXN0LCB0cmFuc2ZlckRhdGEpO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgSFRUUCAqL1xuY29uc3QgcG9zdENhdGNoRXJyb3IgPSBNZXRlb3Iud3JhcEFzeW5jKGZ1bmN0aW9uKHVybCwgb3B0aW9ucywgcmVzb2x2ZSkge1xuXHRIVFRQLnBvc3QodXJsLCBvcHRpb25zLCBmdW5jdGlvbihlcnIsIHJlcykge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdHJlc29sdmUobnVsbCwgZXJyLnJlc3BvbnNlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzb2x2ZShudWxsLCByZXMpO1xuXHRcdH1cblx0fSk7XG59KTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6d2ViaG9va1Rlc3QnKCkge1xuXHRcdHRoaXMudW5ibG9jaygpO1xuXG5cdFx0Y29uc3Qgc2FtcGxlRGF0YSA9IHtcblx0XHRcdHR5cGU6ICdMaXZlY2hhdFNlc3Npb24nLFxuXHRcdFx0X2lkOiAnZmFzZDZmNWE0c2Q2ZjhhNHNkZicsXG5cdFx0XHRsYWJlbDogJ3RpdGxlJyxcblx0XHRcdHRvcGljOiAnYXNpb2RvamYnLFxuXHRcdFx0Y3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuXHRcdFx0bGFzdE1lc3NhZ2VBdDogbmV3IERhdGUoKSxcblx0XHRcdHRhZ3M6IFtcblx0XHRcdFx0J3RhZzEnLFxuXHRcdFx0XHQndGFnMicsXG5cdFx0XHRcdCd0YWczJ1xuXHRcdFx0XSxcblx0XHRcdGN1c3RvbUZpZWxkczoge1xuXHRcdFx0XHRwcm9kdWN0SWQ6ICcxMjM0NTYnXG5cdFx0XHR9LFxuXHRcdFx0dmlzaXRvcjoge1xuXHRcdFx0XHRfaWQ6ICcnLFxuXHRcdFx0XHRuYW1lOiAndmlzaXRvciBuYW1lJyxcblx0XHRcdFx0dXNlcm5hbWU6ICd2aXNpdG9yLXVzZXJuYW1lJyxcblx0XHRcdFx0ZGVwYXJ0bWVudDogJ2RlcGFydG1lbnQnLFxuXHRcdFx0XHRlbWFpbDogJ2VtYWlsQGFkZHJlc3MuY29tJyxcblx0XHRcdFx0cGhvbmU6ICcxOTI4NzMxOTI4NzMnLFxuXHRcdFx0XHRpcDogJzEyMy40NTYuNy44OScsXG5cdFx0XHRcdGJyb3dzZXI6ICdDaHJvbWUnLFxuXHRcdFx0XHRvczogJ0xpbnV4Jyxcblx0XHRcdFx0Y3VzdG9tRmllbGRzOiB7XG5cdFx0XHRcdFx0Y3VzdG9tZXJJZDogJzEyMzQ1Nidcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGFnZW50OiB7XG5cdFx0XHRcdF9pZDogJ2FzZGY4OWFzNmRmOCcsXG5cdFx0XHRcdHVzZXJuYW1lOiAnYWdlbnQudXNlcm5hbWUnLFxuXHRcdFx0XHRuYW1lOiAnQWdlbnQgTmFtZScsXG5cdFx0XHRcdGVtYWlsOiAnYWdlbnRAZW1haWwuY29tJ1xuXHRcdFx0fSxcblx0XHRcdG1lc3NhZ2VzOiBbe1xuXHRcdFx0XHR1c2VybmFtZTogJ3Zpc2l0b3ItdXNlcm5hbWUnLFxuXHRcdFx0XHRtc2c6ICdtZXNzYWdlIGNvbnRlbnQnLFxuXHRcdFx0XHR0czogbmV3IERhdGUoKVxuXHRcdFx0fSwge1xuXHRcdFx0XHR1c2VybmFtZTogJ2FnZW50LnVzZXJuYW1lJyxcblx0XHRcdFx0YWdlbnRJZDogJ2FzZGY4OWFzNmRmOCcsXG5cdFx0XHRcdG1zZzogJ21lc3NhZ2UgY29udGVudCBmcm9tIGFnZW50Jyxcblx0XHRcdFx0dHM6IG5ldyBEYXRlKClcblx0XHRcdH1dXG5cdFx0fTtcblxuXHRcdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdYLVJvY2tldENoYXQtTGl2ZWNoYXQtVG9rZW4nOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJylcblx0XHRcdH0sXG5cdFx0XHRkYXRhOiBzYW1wbGVEYXRhXG5cdFx0fTtcblxuXHRcdGNvbnN0IHJlc3BvbnNlID0gcG9zdENhdGNoRXJyb3IoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tVcmwnKSwgb3B0aW9ucyk7XG5cblx0XHRjb25zb2xlLmxvZygncmVzcG9uc2UgLT4nLCByZXNwb25zZSk7XG5cblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSAmJiByZXNwb25zZS5zdGF0dXNDb2RlID09PSAyMDApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXdlYmhvb2stcmVzcG9uc2UnKTtcblx0XHR9XG5cdH1cbn0pO1xuXG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDp0YWtlSW5xdWlyeScoaW5xdWlyeUlkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6dGFrZUlucXVpcnknIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGlucXVpcnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkuZmluZE9uZUJ5SWQoaW5xdWlyeUlkKTtcblxuXHRcdGlmICghaW5xdWlyeSB8fCBpbnF1aXJ5LnN0YXR1cyA9PT0gJ3Rha2VuJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnSW5xdWlyeSBhbHJlYWR5IHRha2VuJywgeyBtZXRob2Q6ICdsaXZlY2hhdDp0YWtlSW5xdWlyeScgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKE1ldGVvci51c2VySWQoKSk7XG5cblx0XHRjb25zdCBhZ2VudCA9IHtcblx0XHRcdGFnZW50SWQ6IHVzZXIuX2lkLFxuXHRcdFx0dXNlcm5hbWU6IHVzZXIudXNlcm5hbWVcblx0XHR9O1xuXG5cdFx0Ly8gYWRkIHN1YnNjcmlwdGlvblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbkRhdGEgPSB7XG5cdFx0XHRyaWQ6IGlucXVpcnkucmlkLFxuXHRcdFx0bmFtZTogaW5xdWlyeS5uYW1lLFxuXHRcdFx0YWxlcnQ6IHRydWUsXG5cdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0dW5yZWFkOiAxLFxuXHRcdFx0dXNlck1lbnRpb25zOiAxLFxuXHRcdFx0Z3JvdXBNZW50aW9uczogMCxcblx0XHRcdHU6IHtcblx0XHRcdFx0X2lkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHR0OiAnbCcsXG5cdFx0XHRkZXNrdG9wTm90aWZpY2F0aW9uczogJ2FsbCcsXG5cdFx0XHRtb2JpbGVQdXNoTm90aWZpY2F0aW9uczogJ2FsbCcsXG5cdFx0XHRlbWFpbE5vdGlmaWNhdGlvbnM6ICdhbGwnXG5cdFx0fTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmluc2VydChzdWJzY3JpcHRpb25EYXRhKTtcblxuXHRcdC8vIHVwZGF0ZSByb29tXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGlucXVpcnkucmlkKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmNoYW5nZUFnZW50QnlSb29tSWQoaW5xdWlyeS5yaWQsIGFnZW50KTtcblxuXHRcdHJvb20uc2VydmVkQnkgPSB7XG5cdFx0XHRfaWQ6IGFnZW50LmFnZW50SWQsXG5cdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHR9O1xuXG5cdFx0Ly8gbWFyayBpbnF1aXJ5IGFzIHRha2VuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5LnRha2VJbnF1aXJ5KGlucXVpcnkuX2lkKTtcblxuXHRcdC8vIHJlbW92ZSBzZW5kaW5nIG1lc3NhZ2UgZnJvbSBndWVzdCB3aWRnZXRcblx0XHQvLyBkb250IGNoZWNrIGlmIHNldHRpbmcgaXMgdHJ1ZSwgYmVjYXVzZSBpZiBzZXR0aW5nd2FzIHN3aXRjaGVkIG9mZiBpbmJldHdlZW4gIGd1ZXN0IGVudGVyZWQgcG9vbCxcblx0XHQvLyBhbmQgaW5xdWlyeSBiZWluZyB0YWtlbiwgbWVzc2FnZSB3b3VsZCBub3QgYmUgc3dpdGNoZWQgb2ZmLlxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZUNvbW1hbmRXaXRoUm9vbUlkQW5kVXNlcignY29ubmVjdGVkJywgcm9vbS5faWQsIHVzZXIpO1xuXG5cdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zdHJlYW0uZW1pdChyb29tLl9pZCwge1xuXHRcdFx0dHlwZTogJ2FnZW50RGF0YScsXG5cdFx0XHRkYXRhOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8oYWdlbnQuYWdlbnRJZClcblx0XHR9KTtcblxuXHRcdC8vIHJldHVybiByb29tIGNvcnJlc3BvbmRpbmcgdG8gaW5xdWlyeSAoZm9yIHJlZGlyZWN0aW5nIGFnZW50IHRvIHRoZSByb29tIHJvdXRlKVxuXHRcdHJldHVybiByb29tO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnJldHVybkFzSW5xdWlyeScocmlkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZURlcGFydG1lbnQnIH0pO1xuXHRcdH1cblxuXHRcdC8vIC8vZGVsZXRlIGFnZW50IGFuZCByb29tIHN1YnNjcmlwdGlvblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMucmVtb3ZlQnlSb29tSWQocmlkKTtcblxuXHRcdC8vIHJlbW92ZSB1c2VyIGZyb20gcm9vbVxuXHRcdGNvbnN0IHVzZXJuYW1lID0gTWV0ZW9yLnVzZXIoKS51c2VybmFtZTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnJlbW92ZVVzZXJuYW1lQnlJZChyaWQsIHVzZXJuYW1lKTtcblxuXHRcdC8vIGZpbmQgaW5xdWlyeSBjb3JyZXNwb25kaW5nIHRvIHJvb21cblx0XHRjb25zdCBpbnF1aXJ5ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5LmZpbmRPbmUoe3JpZH0pO1xuXG5cdFx0Ly8gbWFyayBpbnF1aXJ5IGFzIG9wZW5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5Lm9wZW5JbnF1aXJ5KGlucXVpcnkuX2lkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlT2ZmaWNlSG91cnMnKGRheSwgc3RhcnQsIGZpbmlzaCwgb3Blbikge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0T2ZmaWNlSG91ci51cGRhdGVIb3VycyhkYXksIHN0YXJ0LCBmaW5pc2gsIG9wZW4pO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgZW1haWxTZXR0aW5ncywgRERQUmF0ZUxpbWl0ZXIgKi9cbi8qIFNlbmQgYSB0cmFuc2NyaXB0IG9mIHRoZSByb29tIGNvbnZlcnN0YXRpb24gdG8gdGhlIGdpdmVuIGVtYWlsICovXG5pbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2VuZFRyYW5zY3JpcHQnKHRva2VuLCByaWQsIGVtYWlsKSB7XG5cdFx0Y2hlY2socmlkLCBTdHJpbmcpO1xuXHRcdGNoZWNrKGVtYWlsLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJpZCk7XG5cblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbik7XG5cdFx0Y29uc3QgdXNlckxhbmd1YWdlID0gKHZpc2l0b3IgJiYgdmlzaXRvci5sYW5ndWFnZSkgfHwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ2xhbmd1YWdlJykgfHwgJ2VuJztcblxuXHRcdC8vIGFsbG93IHRvIG9ubHkgdXNlciB0byBzZW5kIHRyYW5zY3JpcHRzIGZyb20gdGhlaXIgb3duIGNoYXRzXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udCAhPT0gJ2wnIHx8ICFyb29tLnYgfHwgcm9vbS52LnRva2VuICE9PSB0b2tlbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2VzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZFZpc2libGVCeVJvb21JZE5vdENvbnRhaW5pbmdUeXBlcyhyaWQsIFsnbGl2ZWNoYXRfbmF2aWdhdGlvbl9oaXN0b3J5J10sIHsgc29ydDogeyAndHMnIDogMSB9fSk7XG5cdFx0Y29uc3QgaGVhZGVyID0gUm9ja2V0Q2hhdC5wbGFjZWhvbGRlcnMucmVwbGFjZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1haWxfSGVhZGVyJykgfHwgJycpO1xuXHRcdGNvbnN0IGZvb3RlciA9IFJvY2tldENoYXQucGxhY2Vob2xkZXJzLnJlcGxhY2UoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0VtYWlsX0Zvb3RlcicpIHx8ICcnKTtcblxuXHRcdGxldCBodG1sID0gJzxkaXY+IDxocj4nO1xuXHRcdG1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZSA9PiB7XG5cdFx0XHRpZiAobWVzc2FnZS50ICYmIFsnY29tbWFuZCcsICdsaXZlY2hhdC1jbG9zZScsICdsaXZlY2hhdF92aWRlb19jYWxsJ10uaW5kZXhPZihtZXNzYWdlLnQpICE9PSAtMSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGxldCBhdXRob3I7XG5cdFx0XHRpZiAobWVzc2FnZS51Ll9pZCA9PT0gdmlzaXRvci5faWQpIHtcblx0XHRcdFx0YXV0aG9yID0gVEFQaTE4bi5fXygnWW91JywgeyBsbmc6IHVzZXJMYW5ndWFnZSB9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGF1dGhvciA9IG1lc3NhZ2UudS51c2VybmFtZTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgZGF0ZXRpbWUgPSBtb21lbnQobWVzc2FnZS50cykubG9jYWxlKHVzZXJMYW5ndWFnZSkuZm9ybWF0KCdMTEwnKTtcblx0XHRcdGNvbnN0IHNpbmdsZU1lc3NhZ2UgPSBgXG5cdFx0XHRcdDxwPjxzdHJvbmc+JHsgYXV0aG9yIH08L3N0cm9uZz4gIDxlbT4keyBkYXRldGltZSB9PC9lbT48L3A+XG5cdFx0XHRcdDxwPiR7IG1lc3NhZ2UubXNnIH08L3A+XG5cdFx0XHRgO1xuXHRcdFx0aHRtbCA9IGh0bWwgKyBzaW5nbGVNZXNzYWdlO1xuXHRcdH0pO1xuXG5cdFx0aHRtbCA9IGAkeyBodG1sIH08L2Rpdj5gO1xuXG5cdFx0bGV0IGZyb21FbWFpbCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGcm9tX0VtYWlsJykubWF0Y2goL1xcYltBLVowLTkuXyUrLV0rQCg/OltBLVowLTktXStcXC4pK1tBLVpdezIsNH1cXGIvaSk7XG5cblx0XHRpZiAoZnJvbUVtYWlsKSB7XG5cdFx0XHRmcm9tRW1haWwgPSBmcm9tRW1haWxbMF07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZyb21FbWFpbCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGcm9tX0VtYWlsJyk7XG5cdFx0fVxuXG5cdFx0ZW1haWxTZXR0aW5ncyA9IHtcblx0XHRcdHRvOiBlbWFpbCxcblx0XHRcdGZyb206IGZyb21FbWFpbCxcblx0XHRcdHJlcGx5VG86IGZyb21FbWFpbCxcblx0XHRcdHN1YmplY3Q6IFRBUGkxOG4uX18oJ1RyYW5zY3JpcHRfb2ZfeW91cl9saXZlY2hhdF9jb252ZXJzYXRpb24nLCB7IGxuZzogdXNlckxhbmd1YWdlIH0pLFxuXHRcdFx0aHRtbDogaGVhZGVyICsgaHRtbCArIGZvb3RlclxuXHRcdH07XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0RW1haWwuc2VuZChlbWFpbFNldHRpbmdzKTtcblx0XHR9KTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0LnNlbmRUcmFuc2NyaXB0JywgbWVzc2FnZXMsIGVtYWlsKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcblxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZSh7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAnbGl2ZWNoYXQ6c2VuZFRyYW5zY3JpcHQnLFxuXHRjb25uZWN0aW9uSWQoKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0sIDEsIDUwMDApO1xuIiwiLyoqXG4gKiBTZXRzIGFuIHVzZXIgYXMgKG5vbilvcGVyYXRvclxuICogQHBhcmFtIHtzdHJpbmd9IF9pZCAtIFVzZXIncyBfaWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3BlcmF0b3IgLSBGbGFnIHRvIHNldCBhcyBvcGVyYXRvciBvciBub3RcbiAqL1xuUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0T3BlcmF0b3IgPSBmdW5jdGlvbihfaWQsIG9wZXJhdG9yKSB7XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRvcGVyYXRvclxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUoX2lkLCB1cGRhdGUpO1xufTtcblxuLyoqXG4gKiBHZXRzIGFsbCBvbmxpbmUgYWdlbnRzXG4gKiBAcmV0dXJuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMgPSBmdW5jdGlvbigpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0c3RhdHVzOiB7XG5cdFx0XHQkZXhpc3RzOiB0cnVlLFxuXHRcdFx0JG5lOiAnb2ZmbGluZSdcblx0XHR9LFxuXHRcdHN0YXR1c0xpdmVjaGF0OiAnYXZhaWxhYmxlJyxcblx0XHRyb2xlczogJ2xpdmVjaGF0LWFnZW50J1xuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuLyoqXG4gKiBGaW5kIGFuIG9ubGluZSBhZ2VudCBieSBoaXMgdXNlcm5hbWVcbiAqIEByZXR1cm5cbiAqL1xuUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZU9ubGluZUFnZW50QnlVc2VybmFtZSA9IGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHVzZXJuYW1lLFxuXHRcdHN0YXR1czoge1xuXHRcdFx0JGV4aXN0czogdHJ1ZSxcblx0XHRcdCRuZTogJ29mZmxpbmUnXG5cdFx0fSxcblx0XHRzdGF0dXNMaXZlY2hhdDogJ2F2YWlsYWJsZScsXG5cdFx0cm9sZXM6ICdsaXZlY2hhdC1hZ2VudCdcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5KTtcbn07XG5cbi8qKlxuICogR2V0cyBhbGwgYWdlbnRzXG4gKiBAcmV0dXJuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRBZ2VudHMgPSBmdW5jdGlvbigpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0cm9sZXM6ICdsaXZlY2hhdC1hZ2VudCdcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cbi8qKlxuICogRmluZCBvbmxpbmUgdXNlcnMgZnJvbSBhIGxpc3RcbiAqIEBwYXJhbSB7YXJyYXl9IHVzZXJMaXN0IC0gYXJyYXkgb2YgdXNlcm5hbWVzXG4gKiBAcmV0dXJuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVVc2VyRnJvbUxpc3QgPSBmdW5jdGlvbih1c2VyTGlzdCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRzdGF0dXM6IHtcblx0XHRcdCRleGlzdHM6IHRydWUsXG5cdFx0XHQkbmU6ICdvZmZsaW5lJ1xuXHRcdH0sXG5cdFx0c3RhdHVzTGl2ZWNoYXQ6ICdhdmFpbGFibGUnLFxuXHRcdHJvbGVzOiAnbGl2ZWNoYXQtYWdlbnQnLFxuXHRcdHVzZXJuYW1lOiB7XG5cdFx0XHQkaW46IFtdLmNvbmNhdCh1c2VyTGlzdClcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG4vKipcbiAqIEdldCBuZXh0IHVzZXIgYWdlbnQgaW4gb3JkZXJcbiAqIEByZXR1cm4ge29iamVjdH0gVXNlciBmcm9tIGRiXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldE5leHRBZ2VudCA9IGZ1bmN0aW9uKCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRzdGF0dXM6IHtcblx0XHRcdCRleGlzdHM6IHRydWUsXG5cdFx0XHQkbmU6ICdvZmZsaW5lJ1xuXHRcdH0sXG5cdFx0c3RhdHVzTGl2ZWNoYXQ6ICdhdmFpbGFibGUnLFxuXHRcdHJvbGVzOiAnbGl2ZWNoYXQtYWdlbnQnXG5cdH07XG5cblx0Y29uc3QgY29sbGVjdGlvbk9iaiA9IHRoaXMubW9kZWwucmF3Q29sbGVjdGlvbigpO1xuXHRjb25zdCBmaW5kQW5kTW9kaWZ5ID0gTWV0ZW9yLndyYXBBc3luYyhjb2xsZWN0aW9uT2JqLmZpbmRBbmRNb2RpZnksIGNvbGxlY3Rpb25PYmopO1xuXG5cdGNvbnN0IHNvcnQgPSB7XG5cdFx0bGl2ZWNoYXRDb3VudDogMSxcblx0XHR1c2VybmFtZTogMVxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkaW5jOiB7XG5cdFx0XHRsaXZlY2hhdENvdW50OiAxXG5cdFx0fVxuXHR9O1xuXG5cdGNvbnN0IHVzZXIgPSBmaW5kQW5kTW9kaWZ5KHF1ZXJ5LCBzb3J0LCB1cGRhdGUpO1xuXHRpZiAodXNlciAmJiB1c2VyLnZhbHVlKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGFnZW50SWQ6IHVzZXIudmFsdWUuX2lkLFxuXHRcdFx0dXNlcm5hbWU6IHVzZXIudmFsdWUudXNlcm5hbWVcblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG59O1xuXG4vKipcbiAqIENoYW5nZSB1c2VyJ3MgbGl2ZWNoYXQgc3RhdHVzXG4gKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gLSBWaXNpdG9yIHRva2VuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldExpdmVjaGF0U3RhdHVzID0gZnVuY3Rpb24odXNlcklkLCBzdGF0dXMpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0J19pZCc6IHVzZXJJZFxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHQnc3RhdHVzTGl2ZWNoYXQnOiBzdGF0dXNcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuLyoqXG4gKiBjaGFuZ2UgYWxsIGxpdmVjaGF0IGFnZW50cyBsaXZlY2hhdCBzdGF0dXMgdG8gXCJub3QtYXZhaWxhYmxlXCJcbiAqL1xuUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuY2xvc2VPZmZpY2UgPSBmdW5jdGlvbigpIHtcblx0c2VsZiA9IHRoaXM7XG5cdHNlbGYuZmluZEFnZW50cygpLmZvckVhY2goZnVuY3Rpb24oYWdlbnQpIHtcblx0XHRzZWxmLnNldExpdmVjaGF0U3RhdHVzKGFnZW50Ll9pZCwgJ25vdC1hdmFpbGFibGUnKTtcblx0fSk7XG59O1xuXG4vKipcbiAqIGNoYW5nZSBhbGwgbGl2ZWNoYXQgYWdlbnRzIGxpdmVjaGF0IHN0YXR1cyB0byBcImF2YWlsYWJsZVwiXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLm9wZW5PZmZpY2UgPSBmdW5jdGlvbigpIHtcblx0c2VsZiA9IHRoaXM7XG5cdHNlbGYuZmluZEFnZW50cygpLmZvckVhY2goZnVuY3Rpb24oYWdlbnQpIHtcblx0XHRzZWxmLnNldExpdmVjaGF0U3RhdHVzKGFnZW50Ll9pZCwgJ2F2YWlsYWJsZScpO1xuXHR9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldEFnZW50SW5mbyA9IGZ1bmN0aW9uKGFnZW50SWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiBhZ2VudElkXG5cdH07XG5cblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRmaWVsZHM6IHtcblx0XHRcdG5hbWU6IDEsXG5cdFx0XHR1c2VybmFtZTogMSxcblx0XHRcdHBob25lOiAxLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiAxXG5cdFx0fVxuXHR9O1xuXG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfc2hvd19hZ2VudF9lbWFpbCcpKSB7XG5cdFx0b3B0aW9ucy5maWVsZHMuZW1haWxzID0gMTtcblx0fVxuXG5cdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnksIG9wdGlvbnMpO1xufTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG4vKipcbiAqIEdldHMgdmlzaXRvciBieSB0b2tlblxuICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIC0gVmlzaXRvciB0b2tlblxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVTdXJ2ZXlGZWVkYmFja0J5SWQgPSBmdW5jdGlvbihfaWQsIHN1cnZleUZlZWRiYWNrKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRzdXJ2ZXlGZWVkYmFja1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVMaXZlY2hhdERhdGFCeVRva2VuID0gZnVuY3Rpb24odG9rZW4sIGtleSwgdmFsdWUsIG92ZXJ3cml0ZSA9IHRydWUpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0J3YudG9rZW4nOiB0b2tlbixcblx0XHRvcGVuOiB0cnVlXG5cdH07XG5cblx0aWYgKCFvdmVyd3JpdGUpIHtcblx0XHRjb25zdCByb29tID0gdGhpcy5maW5kT25lKHF1ZXJ5LCB7IGZpZWxkczogeyBsaXZlY2hhdERhdGE6IDEgfSB9KTtcblx0XHRpZiAocm9vbS5saXZlY2hhdERhdGEgJiYgdHlwZW9mIHJvb20ubGl2ZWNoYXREYXRhW2tleV0gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0W2BsaXZlY2hhdERhdGEuJHsga2V5IH1gXTogdmFsdWVcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZExpdmVjaGF0ID0gZnVuY3Rpb24oZmlsdGVyID0ge30sIG9mZnNldCA9IDAsIGxpbWl0ID0gMjApIHtcblx0Y29uc3QgcXVlcnkgPSBfLmV4dGVuZChmaWx0ZXIsIHtcblx0XHR0OiAnbCdcblx0fSk7XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgeyBzb3J0OiB7IHRzOiAtIDEgfSwgb2Zmc2V0LCBsaW1pdCB9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRMaXZlY2hhdEJ5SWQgPSBmdW5jdGlvbihfaWQsIGZpZWxkcykge1xuXHRjb25zdCBvcHRpb25zID0ge307XG5cblx0aWYgKGZpZWxkcykge1xuXHRcdG9wdGlvbnMuZmllbGRzID0gZmllbGRzO1xuXHR9XG5cblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0dDogJ2wnLFxuXHRcdF9pZFxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnksIG9wdGlvbnMpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZExpdmVjaGF0QnlJZCA9IGZ1bmN0aW9uKF9pZCwgZmllbGRzKSB7XG5cdGNvbnN0IG9wdGlvbnMgPSB7fTtcblxuXHRpZiAoZmllbGRzKSB7XG5cdFx0b3B0aW9ucy5maWVsZHMgPSBmaWVsZHM7XG5cdH1cblxuXHRjb25zdCBxdWVyeSA9IHtcblx0XHR0OiAnbCcsXG5cdFx0X2lkXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSwgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgbmV4dCB2aXNpdG9yIG5hbWVcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIG5leHQgdmlzaXRvciBuYW1lXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZUxpdmVjaGF0Um9vbUNvdW50ID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHNldHRpbmdzUmF3ID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MubW9kZWwucmF3Q29sbGVjdGlvbigpO1xuXHRjb25zdCBmaW5kQW5kTW9kaWZ5ID0gTWV0ZW9yLndyYXBBc3luYyhzZXR0aW5nc1Jhdy5maW5kQW5kTW9kaWZ5LCBzZXR0aW5nc1Jhdyk7XG5cblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiAnTGl2ZWNoYXRfUm9vbV9Db3VudCdcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JGluYzoge1xuXHRcdFx0dmFsdWU6IDFcblx0XHR9XG5cdH07XG5cblx0Y29uc3QgbGl2ZWNoYXRDb3VudCA9IGZpbmRBbmRNb2RpZnkocXVlcnksIG51bGwsIHVwZGF0ZSk7XG5cblx0cmV0dXJuIGxpdmVjaGF0Q291bnQudmFsdWUudmFsdWU7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuID0gZnVuY3Rpb24odmlzaXRvclRva2VuLCBvcHRpb25zKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdG9wZW46IHRydWUsXG5cdFx0J3YudG9rZW4nOiB2aXNpdG9yVG9rZW5cblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVZpc2l0b3JUb2tlbiA9IGZ1bmN0aW9uKHZpc2l0b3JUb2tlbikge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHQndi50b2tlbic6IHZpc2l0b3JUb2tlblxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VmlzaXRvcklkID0gZnVuY3Rpb24odmlzaXRvcklkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCd2Ll9pZCc6IHZpc2l0b3JJZFxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZU9wZW5CeVZpc2l0b3JUb2tlbiA9IGZ1bmN0aW9uKHRva2VuLCByb29tSWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiByb29tSWQsXG5cdFx0b3BlbjogdHJ1ZSxcblx0XHQndi50b2tlbic6IHRva2VuXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRSZXNwb25zZUJ5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkLCByZXNwb25zZSkge1xuXHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdF9pZDogcm9vbUlkXG5cdH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHRyZXNwb25zZUJ5OiB7XG5cdFx0XHRcdF9pZDogcmVzcG9uc2UudXNlci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiByZXNwb25zZS51c2VyLnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0cmVzcG9uc2VEYXRlOiByZXNwb25zZS5yZXNwb25zZURhdGUsXG5cdFx0XHRyZXNwb25zZVRpbWU6IHJlc3BvbnNlLnJlc3BvbnNlVGltZVxuXHRcdH0sXG5cdFx0JHVuc2V0OiB7XG5cdFx0XHR3YWl0aW5nUmVzcG9uc2U6IDFcblx0XHR9XG5cdH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY2xvc2VCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCwgY2xvc2VJbmZvKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0X2lkOiByb29tSWRcblx0fSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdGNsb3NlcjogY2xvc2VJbmZvLmNsb3Nlcixcblx0XHRcdGNsb3NlZEJ5OiBjbG9zZUluZm8uY2xvc2VkQnksXG5cdFx0XHRjbG9zZWRBdDogY2xvc2VJbmZvLmNsb3NlZEF0LFxuXHRcdFx0Y2hhdER1cmF0aW9uOiBjbG9zZUluZm8uY2hhdER1cmF0aW9uLFxuXHRcdFx0J3Yuc3RhdHVzJzogJ29mZmxpbmUnXG5cdFx0fSxcblx0XHQkdW5zZXQ6IHtcblx0XHRcdG9wZW46IDFcblx0XHR9XG5cdH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeUFnZW50ID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdG9wZW46IHRydWUsXG5cdFx0J3NlcnZlZEJ5Ll9pZCc6IHVzZXJJZFxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY2hhbmdlQWdlbnRCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCwgbmV3QWdlbnQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiByb29tSWRcblx0fTtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdHNlcnZlZEJ5OiB7XG5cdFx0XHRcdF9pZDogbmV3QWdlbnQuYWdlbnRJZCxcblx0XHRcdFx0dXNlcm5hbWU6IG5ld0FnZW50LnVzZXJuYW1lXG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2F2ZUNSTURhdGFCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCwgY3JtRGF0YSkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWQ6IHJvb21JZFxuXHR9O1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0Y3JtRGF0YVxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVWaXNpdG9yU3RhdHVzID0gZnVuY3Rpb24odG9rZW4sIHN0YXR1cykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHQndi50b2tlbic6IHRva2VuLFxuXHRcdG9wZW46IHRydWVcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0J3Yuc3RhdHVzJzogc3RhdHVzXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5rZWVwSGlzdG9yeUZvclRva2VuID0gZnVuY3Rpb24odG9rZW4pIHtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHtcblx0XHQnbmF2aWdhdGlvbi50b2tlbic6IHRva2VuLFxuXHRcdGV4cGlyZUF0OiB7XG5cdFx0XHQkZXhpc3RzOiB0cnVlXG5cdFx0fVxuXHR9LCB7XG5cdFx0JHVuc2V0OiB7XG5cdFx0XHRleHBpcmVBdDogMVxuXHRcdH1cblx0fSwge1xuXHRcdG11bHRpOiB0cnVlXG5cdH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0Um9vbUlkQnlUb2tlbiA9IGZ1bmN0aW9uKHRva2VuLCByaWQpIHtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHtcblx0XHQnbmF2aWdhdGlvbi50b2tlbic6IHRva2VuLFxuXHRcdHJpZDogbnVsbFxuXHR9LCB7XG5cdFx0JHNldDoge1xuXHRcdFx0cmlkXG5cdFx0fVxuXHR9LCB7XG5cdFx0bXVsdGk6IHRydWVcblx0fSk7XG59O1xuIiwiY2xhc3MgTGl2ZWNoYXRFeHRlcm5hbE1lc3NhZ2UgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF9leHRlcm5hbF9tZXNzYWdlJyk7XG5cblx0XHRpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG5cdFx0XHR0aGlzLl9pbml0TW9kZWwoJ2xpdmVjaGF0X2V4dGVybmFsX21lc3NhZ2UnKTtcblx0XHR9XG5cdH1cblxuXHQvLyBGSU5EXG5cdGZpbmRCeVJvb21JZChyb29tSWQsIHNvcnQgPSB7IHRzOiAtMSB9KSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IHJpZDogcm9vbUlkIH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCB7IHNvcnQgfSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRFeHRlcm5hbE1lc3NhZ2UgPSBuZXcgTGl2ZWNoYXRFeHRlcm5hbE1lc3NhZ2UoKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG4vKipcbiAqIExpdmVjaGF0IEN1c3RvbSBGaWVsZHMgbW9kZWxcbiAqL1xuY2xhc3MgTGl2ZWNoYXRDdXN0b21GaWVsZCBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2N1c3RvbV9maWVsZCcpO1xuXHR9XG5cblx0Ly8gRklORFxuXHRmaW5kT25lQnlJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsgX2lkIH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdGNyZWF0ZU9yVXBkYXRlQ3VzdG9tRmllbGQoX2lkLCBmaWVsZCwgbGFiZWwsIHNjb3BlLCB2aXNpYmlsaXR5LCBleHRyYURhdGEpIHtcblx0XHRjb25zdCByZWNvcmQgPSB7XG5cdFx0XHRsYWJlbCxcblx0XHRcdHNjb3BlLFxuXHRcdFx0dmlzaWJpbGl0eVxuXHRcdH07XG5cblx0XHRfLmV4dGVuZChyZWNvcmQsIGV4dHJhRGF0YSk7XG5cblx0XHRpZiAoX2lkKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZSh7IF9pZCB9LCB7ICRzZXQ6IHJlY29yZCB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVjb3JkLl9pZCA9IGZpZWxkO1xuXHRcdFx0X2lkID0gdGhpcy5pbnNlcnQocmVjb3JkKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVjb3JkO1xuXHR9XG5cblx0Ly8gUkVNT1ZFXG5cdHJlbW92ZUJ5SWQoX2lkKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IF9pZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKHF1ZXJ5KTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkID0gbmV3IExpdmVjaGF0Q3VzdG9tRmllbGQoKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG4vKipcbiAqIExpdmVjaGF0IERlcGFydG1lbnQgbW9kZWxcbiAqL1xuY2xhc3MgTGl2ZWNoYXREZXBhcnRtZW50IGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignbGl2ZWNoYXRfZGVwYXJ0bWVudCcpO1xuXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7XG5cdFx0XHRudW1BZ2VudHM6IDEsXG5cdFx0XHRlbmFibGVkOiAxXG5cdFx0fSk7XG5cdH1cblxuXHQvLyBGSU5EXG5cdGZpbmRPbmVCeUlkKF9pZCwgb3B0aW9ucykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0geyBfaWQgfTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0ZmluZEJ5RGVwYXJ0bWVudElkKF9pZCwgb3B0aW9ucykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0geyBfaWQgfTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0Y3JlYXRlT3JVcGRhdGVEZXBhcnRtZW50KF9pZCwgeyBlbmFibGVkLCBuYW1lLCBkZXNjcmlwdGlvbiwgc2hvd09uUmVnaXN0cmF0aW9uIH0sIGFnZW50cykge1xuXHRcdGFnZW50cyA9IFtdLmNvbmNhdChhZ2VudHMpO1xuXG5cdFx0Y29uc3QgcmVjb3JkID0ge1xuXHRcdFx0ZW5hYmxlZCxcblx0XHRcdG5hbWUsXG5cdFx0XHRkZXNjcmlwdGlvbixcblx0XHRcdG51bUFnZW50czogYWdlbnRzLmxlbmd0aCxcblx0XHRcdHNob3dPblJlZ2lzdHJhdGlvblxuXHRcdH07XG5cblx0XHRpZiAoX2lkKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZSh7IF9pZCB9LCB7ICRzZXQ6IHJlY29yZCB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0X2lkID0gdGhpcy5pbnNlcnQocmVjb3JkKTtcblx0XHR9XG5cblx0XHRjb25zdCBzYXZlZEFnZW50cyA9IF8ucGx1Y2soUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmZpbmRCeURlcGFydG1lbnRJZChfaWQpLmZldGNoKCksICdhZ2VudElkJyk7XG5cdFx0Y29uc3QgYWdlbnRzVG9TYXZlID0gXy5wbHVjayhhZ2VudHMsICdhZ2VudElkJyk7XG5cblx0XHQvLyByZW1vdmUgb3RoZXIgYWdlbnRzXG5cdFx0Xy5kaWZmZXJlbmNlKHNhdmVkQWdlbnRzLCBhZ2VudHNUb1NhdmUpLmZvckVhY2goKGFnZW50SWQpID0+IHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5yZW1vdmVCeURlcGFydG1lbnRJZEFuZEFnZW50SWQoX2lkLCBhZ2VudElkKTtcblx0XHR9KTtcblxuXHRcdGFnZW50cy5mb3JFYWNoKChhZ2VudCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLnNhdmVBZ2VudCh7XG5cdFx0XHRcdGFnZW50SWQ6IGFnZW50LmFnZW50SWQsXG5cdFx0XHRcdGRlcGFydG1lbnRJZDogX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWUsXG5cdFx0XHRcdGNvdW50OiBhZ2VudC5jb3VudCA/IHBhcnNlSW50KGFnZW50LmNvdW50KSA6IDAsXG5cdFx0XHRcdG9yZGVyOiBhZ2VudC5vcmRlciA/IHBhcnNlSW50KGFnZW50Lm9yZGVyKSA6IDBcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIF8uZXh0ZW5kKHJlY29yZCwgeyBfaWQgfSk7XG5cdH1cblxuXHQvLyBSRU1PVkVcblx0cmVtb3ZlQnlJZChfaWQpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsgX2lkIH07XG5cblx0XHRyZXR1cm4gdGhpcy5yZW1vdmUocXVlcnkpO1xuXHR9XG5cblx0ZmluZEVuYWJsZWRXaXRoQWdlbnRzKCkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0bnVtQWdlbnRzOiB7ICRndDogMCB9LFxuXHRcdFx0ZW5hYmxlZDogdHJ1ZVxuXHRcdH07XG5cdFx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50ID0gbmV3IExpdmVjaGF0RGVwYXJ0bWVudCgpO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG4vKipcbiAqIExpdmVjaGF0IERlcGFydG1lbnQgbW9kZWxcbiAqL1xuY2xhc3MgTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignbGl2ZWNoYXRfZGVwYXJ0bWVudF9hZ2VudHMnKTtcblx0fVxuXG5cdGZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50SWQpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgZGVwYXJ0bWVudElkIH0pO1xuXHR9XG5cblx0c2F2ZUFnZW50KGFnZW50KSB7XG5cdFx0cmV0dXJuIHRoaXMudXBzZXJ0KHtcblx0XHRcdGFnZW50SWQ6IGFnZW50LmFnZW50SWQsXG5cdFx0XHRkZXBhcnRtZW50SWQ6IGFnZW50LmRlcGFydG1lbnRJZFxuXHRcdH0sIHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lLFxuXHRcdFx0XHRjb3VudDogcGFyc2VJbnQoYWdlbnQuY291bnQpLFxuXHRcdFx0XHRvcmRlcjogcGFyc2VJbnQoYWdlbnQub3JkZXIpXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZW1vdmVCeURlcGFydG1lbnRJZEFuZEFnZW50SWQoZGVwYXJ0bWVudElkLCBhZ2VudElkKSB7XG5cdFx0dGhpcy5yZW1vdmUoeyBkZXBhcnRtZW50SWQsIGFnZW50SWQgfSk7XG5cdH1cblxuXHRnZXROZXh0QWdlbnRGb3JEZXBhcnRtZW50KGRlcGFydG1lbnRJZCkge1xuXHRcdGNvbnN0IGFnZW50cyA9IHRoaXMuZmluZEJ5RGVwYXJ0bWVudElkKGRlcGFydG1lbnRJZCkuZmV0Y2goKTtcblxuXHRcdGlmIChhZ2VudHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgb25saW5lVXNlcnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25saW5lVXNlckZyb21MaXN0KF8ucGx1Y2soYWdlbnRzLCAndXNlcm5hbWUnKSk7XG5cblx0XHRjb25zdCBvbmxpbmVVc2VybmFtZXMgPSBfLnBsdWNrKG9ubGluZVVzZXJzLmZldGNoKCksICd1c2VybmFtZScpO1xuXG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRkZXBhcnRtZW50SWQsXG5cdFx0XHR1c2VybmFtZToge1xuXHRcdFx0XHQkaW46IG9ubGluZVVzZXJuYW1lc1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBzb3J0ID0ge1xuXHRcdFx0Y291bnQ6IDEsXG5cdFx0XHRvcmRlcjogMSxcblx0XHRcdHVzZXJuYW1lOiAxXG5cdFx0fTtcblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkaW5jOiB7XG5cdFx0XHRcdGNvdW50OiAxXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IGNvbGxlY3Rpb25PYmogPSB0aGlzLm1vZGVsLnJhd0NvbGxlY3Rpb24oKTtcblx0XHRjb25zdCBmaW5kQW5kTW9kaWZ5ID0gTWV0ZW9yLndyYXBBc3luYyhjb2xsZWN0aW9uT2JqLmZpbmRBbmRNb2RpZnksIGNvbGxlY3Rpb25PYmopO1xuXG5cdFx0Y29uc3QgYWdlbnQgPSBmaW5kQW5kTW9kaWZ5KHF1ZXJ5LCBzb3J0LCB1cGRhdGUpO1xuXHRcdGlmIChhZ2VudCAmJiBhZ2VudC52YWx1ZSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0YWdlbnRJZDogYWdlbnQudmFsdWUuYWdlbnRJZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnZhbHVlLnVzZXJuYW1lXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH1cblxuXHRnZXRPbmxpbmVGb3JEZXBhcnRtZW50KGRlcGFydG1lbnRJZCkge1xuXHRcdGNvbnN0IGFnZW50cyA9IHRoaXMuZmluZEJ5RGVwYXJ0bWVudElkKGRlcGFydG1lbnRJZCkuZmV0Y2goKTtcblxuXHRcdGlmIChhZ2VudHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fVxuXG5cdFx0Y29uc3Qgb25saW5lVXNlcnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25saW5lVXNlckZyb21MaXN0KF8ucGx1Y2soYWdlbnRzLCAndXNlcm5hbWUnKSk7XG5cblx0XHRjb25zdCBvbmxpbmVVc2VybmFtZXMgPSBfLnBsdWNrKG9ubGluZVVzZXJzLmZldGNoKCksICd1c2VybmFtZScpO1xuXG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRkZXBhcnRtZW50SWQsXG5cdFx0XHR1c2VybmFtZToge1xuXHRcdFx0XHQkaW46IG9ubGluZVVzZXJuYW1lc1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBkZXBBZ2VudHMgPSB0aGlzLmZpbmQocXVlcnkpO1xuXG5cdFx0aWYgKGRlcEFnZW50cykge1xuXHRcdFx0cmV0dXJuIGRlcEFnZW50cztcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblx0fVxuXG5cdGZpbmRVc2Vyc0luUXVldWUodXNlcnNMaXN0KSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7fTtcblxuXHRcdGlmICghXy5pc0VtcHR5KHVzZXJzTGlzdCkpIHtcblx0XHRcdHF1ZXJ5LnVzZXJuYW1lID0ge1xuXHRcdFx0XHQkaW46IHVzZXJzTGlzdFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0c29ydDoge1xuXHRcdFx0XHRkZXBhcnRtZW50SWQ6IDEsXG5cdFx0XHRcdGNvdW50OiAxLFxuXHRcdFx0XHRvcmRlcjogMSxcblx0XHRcdFx0dXNlcm5hbWU6IDFcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgb3B0aW9ucyk7XG5cdH1cblxuXHRyZXBsYWNlVXNlcm5hbWVPZkFnZW50QnlVc2VySWQodXNlcklkLCB1c2VybmFtZSkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0geydhZ2VudElkJzogdXNlcklkfTtcblxuXHRcdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0dXNlcm5hbWVcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUsIHsgbXVsdGk6IHRydWUgfSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzID0gbmV3IExpdmVjaGF0RGVwYXJ0bWVudEFnZW50cygpO1xuIiwiLyoqXG4gKiBMaXZlY2hhdCBQYWdlIFZpc2l0ZWQgbW9kZWxcbiAqL1xuY2xhc3MgTGl2ZWNoYXRQYWdlVmlzaXRlZCBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X3BhZ2VfdmlzaXRlZCcpO1xuXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICd0b2tlbic6IDEgfSk7XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICd0cyc6IDEgfSk7XG5cblx0XHQvLyBrZWVwIGhpc3RvcnkgZm9yIDEgbW9udGggaWYgdGhlIHZpc2l0b3IgZG9lcyBub3QgcmVnaXN0ZXJcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ2V4cGlyZUF0JzogMSB9LCB7IHNwYXJzZTogMSwgZXhwaXJlQWZ0ZXJTZWNvbmRzOiAwIH0pO1xuXHR9XG5cblx0c2F2ZUJ5VG9rZW4odG9rZW4sIHBhZ2VJbmZvKSB7XG5cdFx0Ly8ga2VlcCBoaXN0b3J5IG9mIHVucmVnaXN0ZXJlZCB2aXNpdG9ycyBmb3IgMSBtb250aFxuXHRcdGNvbnN0IGtlZXBIaXN0b3J5TWlsaXNlY29uZHMgPSAyNTkyMDAwMDAwO1xuXG5cdFx0cmV0dXJuIHRoaXMuaW5zZXJ0KHtcblx0XHRcdHRva2VuLFxuXHRcdFx0cGFnZTogcGFnZUluZm8sXG5cdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdGV4cGlyZUF0OiBuZXcgRGF0ZSgpLmdldFRpbWUoKSArIGtlZXBIaXN0b3J5TWlsaXNlY29uZHNcblx0XHR9KTtcblx0fVxuXG5cdGZpbmRCeVRva2VuKHRva2VuKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IHRva2VuIH0sIHsgc29ydCA6IHsgdHM6IC0xIH0sIGxpbWl0OiAyMCB9KTtcblx0fVxuXG5cdGtlZXBIaXN0b3J5Rm9yVG9rZW4odG9rZW4pIHtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdFx0dG9rZW4sXG5cdFx0XHRleHBpcmVBdDoge1xuXHRcdFx0XHQkZXhpc3RzOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSwge1xuXHRcdFx0JHVuc2V0OiB7XG5cdFx0XHRcdGV4cGlyZUF0OiAxXG5cdFx0XHR9XG5cdFx0fSwge1xuXHRcdFx0bXVsdGk6IHRydWVcblx0XHR9KTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFBhZ2VWaXNpdGVkID0gbmV3IExpdmVjaGF0UGFnZVZpc2l0ZWQoKTtcbiIsIi8qKlxuICogTGl2ZWNoYXQgVHJpZ2dlciBtb2RlbFxuICovXG5jbGFzcyBMaXZlY2hhdFRyaWdnZXIgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF90cmlnZ2VyJyk7XG5cdH1cblxuXHR1cGRhdGVCeUlkKF9pZCwgZGF0YSkge1xuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7IF9pZCB9LCB7ICRzZXQ6IGRhdGEgfSk7XG5cdH1cblxuXHRyZW1vdmVBbGwoKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKHt9KTtcblx0fVxuXG5cdGZpbmRCeUlkKF9pZCkge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyBfaWQgfSk7XG5cdH1cblxuXHRyZW1vdmVCeUlkKF9pZCkge1xuXHRcdHJldHVybiB0aGlzLnJlbW92ZSh7IF9pZCB9KTtcblx0fVxuXG5cdGZpbmRFbmFibGVkKCkge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyBlbmFibGVkOiB0cnVlIH0pO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlciA9IG5ldyBMaXZlY2hhdFRyaWdnZXIoKTtcbiIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy50cnlFbnN1cmVJbmRleCh7IG9wZW46IDEgfSwgeyBzcGFyc2U6IDEgfSk7XG5cdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnRyeUVuc3VyZUluZGV4KHsgJ3Zpc2l0b3JFbWFpbHMuYWRkcmVzcyc6IDEgfSk7XG59KTtcbiIsImNsYXNzIExpdmVjaGF0SW5xdWlyeSBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2lucXVpcnknKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAncmlkJzogMSB9KTsgLy8gcm9vbSBpZCBjb3JyZXNwb25kaW5nIHRvIHRoaXMgaW5xdWlyeVxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnbmFtZSc6IDEgfSk7IC8vIG5hbWUgb2YgdGhlIGlucXVpcnkgKGNsaWVudCBuYW1lIGZvciBub3cpXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdtZXNzYWdlJzogMSB9KTsgLy8gbWVzc2FnZSBzZW50IGJ5IHRoZSBjbGllbnRcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ3RzJzogMSB9KTsgLy8gdGltZXN0YW1wXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdhZ2VudHMnOiAxfSk7IC8vIElkJ3Mgb2YgdGhlIGFnZW50cyB3aG8gY2FuIHNlZSB0aGUgaW5xdWlyeSAoaGFuZGxlIGRlcGFydG1lbnRzKVxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnc3RhdHVzJzogMX0pOyAvLyAnb3BlbicsICd0YWtlbidcblx0fVxuXG5cdGZpbmRPbmVCeUlkKGlucXVpcnlJZCkge1xuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUoeyBfaWQ6IGlucXVpcnlJZCB9KTtcblx0fVxuXG5cdC8qXG5cdCAqIG1hcmsgdGhlIGlucXVpcnkgYXMgdGFrZW5cblx0ICovXG5cdHRha2VJbnF1aXJ5KGlucXVpcnlJZCkge1xuXHRcdHRoaXMudXBkYXRlKHtcblx0XHRcdCdfaWQnOiBpbnF1aXJ5SWRcblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7IHN0YXR1czogJ3Rha2VuJyB9XG5cdFx0fSk7XG5cdH1cblxuXHQvKlxuXHQgKiBtYXJrIHRoZSBpbnF1aXJ5IGFzIGNsb3NlZFxuXHQgKi9cblx0Y2xvc2VCeVJvb21JZChyb29tSWQsIGNsb3NlSW5mbykge1xuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0XHRyaWQ6IHJvb21JZFxuXHRcdH0sIHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0c3RhdHVzOiAnY2xvc2VkJyxcblx0XHRcdFx0Y2xvc2VyOiBjbG9zZUluZm8uY2xvc2VyLFxuXHRcdFx0XHRjbG9zZWRCeTogY2xvc2VJbmZvLmNsb3NlZEJ5LFxuXHRcdFx0XHRjbG9zZWRBdDogY2xvc2VJbmZvLmNsb3NlZEF0LFxuXHRcdFx0XHRjaGF0RHVyYXRpb246IGNsb3NlSW5mby5jaGF0RHVyYXRpb25cblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8qXG5cdCAqIG1hcmsgaW5xdWlyeSBhcyBvcGVuXG5cdCAqL1xuXHRvcGVuSW5xdWlyeShpbnF1aXJ5SWQpIHtcblx0XHR0aGlzLnVwZGF0ZSh7XG5cdFx0XHQnX2lkJzogaW5xdWlyeUlkXG5cdFx0fSwge1xuXHRcdFx0JHNldDogeyBzdGF0dXM6ICdvcGVuJyB9XG5cdFx0fSk7XG5cdH1cblxuXHQvKlxuXHQgKiByZXR1cm4gdGhlIHN0YXR1cyBvZiB0aGUgaW5xdWlyeSAob3BlbiBvciB0YWtlbilcblx0ICovXG5cdGdldFN0YXR1cyhpbnF1aXJ5SWQpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHsnX2lkJzogaW5xdWlyeUlkfSkuc3RhdHVzO1xuXHR9XG5cblx0dXBkYXRlVmlzaXRvclN0YXR1cyh0b2tlbiwgc3RhdHVzKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHQndi50b2tlbic6IHRva2VuLFxuXHRcdFx0c3RhdHVzOiAnb3Blbidcblx0XHR9O1xuXG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHQndi5zdGF0dXMnOiBzdGF0dXNcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeSA9IG5ldyBMaXZlY2hhdElucXVpcnkoKTtcbiIsImltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcblxuY2xhc3MgTGl2ZWNoYXRPZmZpY2VIb3VyIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignbGl2ZWNoYXRfb2ZmaWNlX2hvdXInKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnZGF5JzogMSB9KTsgLy8gdGhlIGRheSBvZiB0aGUgd2VlayBtb25kYXkgLSBzdW5kYXlcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ3N0YXJ0JzogMSB9KTsgLy8gdGhlIG9wZW5pbmcgaG91cnMgb2YgdGhlIG9mZmljZVxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnZmluaXNoJzogMSB9KTsgLy8gdGhlIGNsb3NpbmcgaG91cnMgb2YgdGhlIG9mZmljZVxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnb3Blbic6IDEgfSk7IC8vIHdoZXRoZXIgb3Igbm90IHRoZSBvZmZpY2VzIGFyZSBvcGVuIG9uIHRoaXMgZGF5XG5cblx0XHQvLyBpZiB0aGVyZSBpcyBub3RoaW5nIGluIHRoZSBjb2xsZWN0aW9uLCBhZGQgZGVmYXVsdHNcblx0XHRpZiAodGhpcy5maW5kKCkuY291bnQoKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ01vbmRheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDEsICdvcGVuJyA6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmluc2VydCh7J2RheScgOiAnVHVlc2RheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDIsICdvcGVuJyA6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmluc2VydCh7J2RheScgOiAnV2VkbmVzZGF5JywgJ3N0YXJ0JyA6ICcwODowMCcsICdmaW5pc2gnIDogJzIwOjAwJywgJ2NvZGUnIDogMywgJ29wZW4nIDogdHJ1ZSB9KTtcblx0XHRcdHRoaXMuaW5zZXJ0KHsnZGF5JyA6ICdUaHVyc2RheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDQsICdvcGVuJyA6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmluc2VydCh7J2RheScgOiAnRnJpZGF5JywgJ3N0YXJ0JyA6ICcwODowMCcsICdmaW5pc2gnIDogJzIwOjAwJywgJ2NvZGUnIDogNSwgJ29wZW4nIDogdHJ1ZSB9KTtcblx0XHRcdHRoaXMuaW5zZXJ0KHsnZGF5JyA6ICdTYXR1cmRheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDYsICdvcGVuJyA6IGZhbHNlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ1N1bmRheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDAsICdvcGVuJyA6IGZhbHNlIH0pO1xuXHRcdH1cblx0fVxuXG5cdC8qXG5cdCAqIHVwZGF0ZSB0aGUgZ2l2ZW4gZGF5cyBzdGFydCBhbmQgZmluaXNoIHRpbWVzIGFuZCB3aGV0aGVyIHRoZSBvZmZpY2UgaXMgb3BlbiBvbiB0aGF0IGRheVxuXHQgKi9cblx0dXBkYXRlSG91cnMoZGF5LCBuZXdTdGFydCwgbmV3RmluaXNoLCBuZXdPcGVuKSB7XG5cdFx0dGhpcy51cGRhdGUoe1xuXHRcdFx0ZGF5XG5cdFx0fSwge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRzdGFydDogbmV3U3RhcnQsXG5cdFx0XHRcdGZpbmlzaDogbmV3RmluaXNoLFxuXHRcdFx0XHRvcGVuOiBuZXdPcGVuXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKlxuXHQgKiBDaGVjayBpZiB0aGUgY3VycmVudCBzZXJ2ZXIgdGltZSAodXRjKSBpcyB3aXRoaW4gdGhlIG9mZmljZSBob3VycyBvZiB0aGF0IGRheVxuXHQgKiByZXR1cm5zIHRydWUgb3IgZmFsc2Vcblx0ICovXG5cdGlzTm93V2l0aGluSG91cnMoKSB7XG5cdFx0Ly8gZ2V0IGN1cnJlbnQgdGltZSBvbiBzZXJ2ZXIgaW4gdXRjXG5cdFx0Ly8gdmFyIGN0ID0gbW9tZW50KCkudXRjKCk7XG5cdFx0Y29uc3QgY3VycmVudFRpbWUgPSBtb21lbnQudXRjKG1vbWVudCgpLnV0YygpLmZvcm1hdCgnZGRkZDpISDptbScpLCAnZGRkZDpISDptbScpO1xuXG5cdFx0Ly8gZ2V0IHRvZGF5cyBvZmZpY2UgaG91cnMgZnJvbSBkYlxuXHRcdGNvbnN0IHRvZGF5c09mZmljZUhvdXJzID0gdGhpcy5maW5kT25lKHtkYXk6IGN1cnJlbnRUaW1lLmZvcm1hdCgnZGRkZCcpfSk7XG5cdFx0aWYgKCF0b2RheXNPZmZpY2VIb3Vycykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGNoZWNrIGlmIG9mZmljZXMgYXJlIG9wZW4gdG9kYXlcblx0XHRpZiAodG9kYXlzT2ZmaWNlSG91cnMub3BlbiA9PT0gZmFsc2UpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBzdGFydCA9IG1vbWVudC51dGMoYCR7IHRvZGF5c09mZmljZUhvdXJzLmRheSB9OiR7IHRvZGF5c09mZmljZUhvdXJzLnN0YXJ0IH1gLCAnZGRkZDpISDptbScpO1xuXHRcdGNvbnN0IGZpbmlzaCA9IG1vbWVudC51dGMoYCR7IHRvZGF5c09mZmljZUhvdXJzLmRheSB9OiR7IHRvZGF5c09mZmljZUhvdXJzLmZpbmlzaCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdC8vIGNvbnNvbGUubG9nKGZpbmlzaC5pc0JlZm9yZShzdGFydCkpO1xuXHRcdGlmIChmaW5pc2guaXNCZWZvcmUoc3RhcnQpKSB7XG5cdFx0XHQvLyBmaW5pc2guZGF5KGZpbmlzaC5kYXkoKSsxKTtcblx0XHRcdGZpbmlzaC5hZGQoMSwgJ2RheXMnKTtcblx0XHR9XG5cblx0XHRjb25zdCByZXN1bHQgPSBjdXJyZW50VGltZS5pc0JldHdlZW4oc3RhcnQsIGZpbmlzaCk7XG5cblx0XHQvLyBpbkJldHdlZW4gIGNoZWNrXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdGlzT3BlbmluZ1RpbWUoKSB7XG5cdFx0Ly8gZ2V0IGN1cnJlbnQgdGltZSBvbiBzZXJ2ZXIgaW4gdXRjXG5cdFx0Y29uc3QgY3VycmVudFRpbWUgPSBtb21lbnQudXRjKG1vbWVudCgpLnV0YygpLmZvcm1hdCgnZGRkZDpISDptbScpLCAnZGRkZDpISDptbScpO1xuXG5cdFx0Ly8gZ2V0IHRvZGF5cyBvZmZpY2UgaG91cnMgZnJvbSBkYlxuXHRcdGNvbnN0IHRvZGF5c09mZmljZUhvdXJzID0gdGhpcy5maW5kT25lKHtkYXk6IGN1cnJlbnRUaW1lLmZvcm1hdCgnZGRkZCcpfSk7XG5cdFx0aWYgKCF0b2RheXNPZmZpY2VIb3Vycykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGNoZWNrIGlmIG9mZmljZXMgYXJlIG9wZW4gdG9kYXlcblx0XHRpZiAodG9kYXlzT2ZmaWNlSG91cnMub3BlbiA9PT0gZmFsc2UpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBzdGFydCA9IG1vbWVudC51dGMoYCR7IHRvZGF5c09mZmljZUhvdXJzLmRheSB9OiR7IHRvZGF5c09mZmljZUhvdXJzLnN0YXJ0IH1gLCAnZGRkZDpISDptbScpO1xuXG5cdFx0cmV0dXJuIHN0YXJ0LmlzU2FtZShjdXJyZW50VGltZSwgJ21pbnV0ZScpO1xuXHR9XG5cblx0aXNDbG9zaW5nVGltZSgpIHtcblx0XHQvLyBnZXQgY3VycmVudCB0aW1lIG9uIHNlcnZlciBpbiB1dGNcblx0XHRjb25zdCBjdXJyZW50VGltZSA9IG1vbWVudC51dGMobW9tZW50KCkudXRjKCkuZm9ybWF0KCdkZGRkOkhIOm1tJyksICdkZGRkOkhIOm1tJyk7XG5cblx0XHQvLyBnZXQgdG9kYXlzIG9mZmljZSBob3VycyBmcm9tIGRiXG5cdFx0Y29uc3QgdG9kYXlzT2ZmaWNlSG91cnMgPSB0aGlzLmZpbmRPbmUoe2RheTogY3VycmVudFRpbWUuZm9ybWF0KCdkZGRkJyl9KTtcblx0XHRpZiAoIXRvZGF5c09mZmljZUhvdXJzKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluaXNoID0gbW9tZW50LnV0YyhgJHsgdG9kYXlzT2ZmaWNlSG91cnMuZGF5IH06JHsgdG9kYXlzT2ZmaWNlSG91cnMuZmluaXNoIH1gLCAnZGRkZDpISDptbScpO1xuXG5cdFx0cmV0dXJuIGZpbmlzaC5pc1NhbWUoY3VycmVudFRpbWUsICdtaW51dGUnKTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdE9mZmljZUhvdXIgPSBuZXcgTGl2ZWNoYXRPZmZpY2VIb3VyKCk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuY2xhc3MgTGl2ZWNoYXRWaXNpdG9ycyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X3Zpc2l0b3InKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIHZpc2l0b3IgYnkgdG9rZW5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIC0gVmlzaXRvciB0b2tlblxuXHQgKi9cblx0Z2V0VmlzaXRvckJ5VG9rZW4odG9rZW4sIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdHRva2VuXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEZpbmQgdmlzaXRvcnMgYnkgX2lkXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiAtIFZpc2l0b3IgdG9rZW5cblx0ICovXG5cdGZpbmRCeUlkKF9pZCwgb3B0aW9ucykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0X2lkXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldHMgdmlzaXRvciBieSB0b2tlblxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gLSBWaXNpdG9yIHRva2VuXG5cdCAqL1xuXHRmaW5kVmlzaXRvckJ5VG9rZW4odG9rZW4pIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdHRva2VuXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xuXHR9XG5cblx0dXBkYXRlTGl2ZWNoYXREYXRhQnlUb2tlbih0b2tlbiwga2V5LCB2YWx1ZSwgb3ZlcndyaXRlID0gdHJ1ZSkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0dG9rZW5cblx0XHR9O1xuXG5cdFx0aWYgKCFvdmVyd3JpdGUpIHtcblx0XHRcdGNvbnN0IHVzZXIgPSB0aGlzLmZpbmRPbmUocXVlcnksIHsgZmllbGRzOiB7IGxpdmVjaGF0RGF0YTogMSB9IH0pO1xuXHRcdFx0aWYgKHVzZXIubGl2ZWNoYXREYXRhICYmIHR5cGVvZiB1c2VyLmxpdmVjaGF0RGF0YVtrZXldICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdFtgbGl2ZWNoYXREYXRhLiR7IGtleSB9YF06IHZhbHVlXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBGaW5kIGEgdmlzaXRvciBieSB0aGVpciBwaG9uZSBudW1iZXJcblx0ICogQHJldHVybiB7b2JqZWN0fSBVc2VyIGZyb20gZGJcblx0ICovXG5cdGZpbmRPbmVWaXNpdG9yQnlQaG9uZShwaG9uZSkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0J3Bob25lLnBob25lTnVtYmVyJzogcGhvbmVcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSk7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IHRoZSBuZXh0IHZpc2l0b3IgbmFtZVxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBuZXh0IHZpc2l0b3IgbmFtZVxuXHQgKi9cblx0Z2V0TmV4dFZpc2l0b3JVc2VybmFtZSgpIHtcblx0XHRjb25zdCBzZXR0aW5nc1JhdyA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLm1vZGVsLnJhd0NvbGxlY3Rpb24oKTtcblx0XHRjb25zdCBmaW5kQW5kTW9kaWZ5ID0gTWV0ZW9yLndyYXBBc3luYyhzZXR0aW5nc1Jhdy5maW5kQW5kTW9kaWZ5LCBzZXR0aW5nc1Jhdyk7XG5cblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdF9pZDogJ0xpdmVjaGF0X2d1ZXN0X2NvdW50J1xuXHRcdH07XG5cblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkaW5jOiB7XG5cdFx0XHRcdHZhbHVlOiAxXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IGxpdmVjaGF0Q291bnQgPSBmaW5kQW5kTW9kaWZ5KHF1ZXJ5LCBudWxsLCB1cGRhdGUpO1xuXG5cdFx0cmV0dXJuIGBndWVzdC0keyBsaXZlY2hhdENvdW50LnZhbHVlLnZhbHVlICsgMSB9YDtcblx0fVxuXG5cdHVwZGF0ZUJ5SWQoX2lkLCB1cGRhdGUpIHtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQgfSwgdXBkYXRlKTtcblx0fVxuXG5cdHNhdmVHdWVzdEJ5SWQoX2lkLCBkYXRhKSB7XG5cdFx0Y29uc3Qgc2V0RGF0YSA9IHt9O1xuXHRcdGNvbnN0IHVuc2V0RGF0YSA9IHt9O1xuXG5cdFx0aWYgKGRhdGEubmFtZSkge1xuXHRcdFx0aWYgKCFfLmlzRW1wdHkocy50cmltKGRhdGEubmFtZSkpKSB7XG5cdFx0XHRcdHNldERhdGEubmFtZSA9IHMudHJpbShkYXRhLm5hbWUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dW5zZXREYXRhLm5hbWUgPSAxO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChkYXRhLmVtYWlsKSB7XG5cdFx0XHRpZiAoIV8uaXNFbXB0eShzLnRyaW0oZGF0YS5lbWFpbCkpKSB7XG5cdFx0XHRcdHNldERhdGEudmlzaXRvckVtYWlscyA9IFtcblx0XHRcdFx0XHR7IGFkZHJlc3M6IHMudHJpbShkYXRhLmVtYWlsKSB9XG5cdFx0XHRcdF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR1bnNldERhdGEudmlzaXRvckVtYWlscyA9IDE7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGRhdGEucGhvbmUpIHtcblx0XHRcdGlmICghXy5pc0VtcHR5KHMudHJpbShkYXRhLnBob25lKSkpIHtcblx0XHRcdFx0c2V0RGF0YS5waG9uZSA9IFtcblx0XHRcdFx0XHR7IHBob25lTnVtYmVyOiBzLnRyaW0oZGF0YS5waG9uZSkgfVxuXHRcdFx0XHRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dW5zZXREYXRhLnBob25lID0gMTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCB1cGRhdGUgPSB7fTtcblxuXHRcdGlmICghXy5pc0VtcHR5KHNldERhdGEpKSB7XG5cdFx0XHR1cGRhdGUuJHNldCA9IHNldERhdGE7XG5cdFx0fVxuXG5cdFx0aWYgKCFfLmlzRW1wdHkodW5zZXREYXRhKSkge1xuXHRcdFx0dXBkYXRlLiR1bnNldCA9IHVuc2V0RGF0YTtcblx0XHR9XG5cblx0XHRpZiAoXy5pc0VtcHR5KHVwZGF0ZSkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7IF9pZCB9LCB1cGRhdGUpO1xuXHR9XG5cblx0ZmluZE9uZUd1ZXN0QnlFbWFpbEFkZHJlc3MoZW1haWxBZGRyZXNzKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHQndmlzaXRvckVtYWlscy5hZGRyZXNzJzogbmV3IFJlZ0V4cChgXiR7IHMuZXNjYXBlUmVnRXhwKGVtYWlsQWRkcmVzcykgfSRgLCAnaScpXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnkpO1xuXHR9XG5cblx0c2F2ZUd1ZXN0RW1haWxQaG9uZUJ5SWQoX2lkLCBlbWFpbHMsIHBob25lcykge1xuXHRcdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHRcdCRhZGRUb1NldDoge31cblx0XHR9O1xuXG5cdFx0Y29uc3Qgc2F2ZUVtYWlsID0gW10uY29uY2F0KGVtYWlscylcblx0XHRcdC5maWx0ZXIoZW1haWwgPT4gZW1haWwgJiYgZW1haWwudHJpbSgpKVxuXHRcdFx0Lm1hcChlbWFpbCA9PiB7XG5cdFx0XHRcdHJldHVybiB7IGFkZHJlc3M6IGVtYWlsIH07XG5cdFx0XHR9KTtcblxuXHRcdGlmIChzYXZlRW1haWwubGVuZ3RoID4gMCkge1xuXHRcdFx0dXBkYXRlLiRhZGRUb1NldC52aXNpdG9yRW1haWxzID0geyAkZWFjaDogc2F2ZUVtYWlsIH07XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2F2ZVBob25lID0gW10uY29uY2F0KHBob25lcylcblx0XHRcdC5maWx0ZXIocGhvbmUgPT4gcGhvbmUgJiYgcGhvbmUudHJpbSgpLnJlcGxhY2UoL1teXFxkXS9nLCAnJykpXG5cdFx0XHQubWFwKHBob25lID0+IHtcblx0XHRcdFx0cmV0dXJuIHsgcGhvbmVOdW1iZXI6IHBob25lIH07XG5cdFx0XHR9KTtcblxuXHRcdGlmIChzYXZlUGhvbmUubGVuZ3RoID4gMCkge1xuXHRcdFx0dXBkYXRlLiRhZGRUb1NldC5waG9uZSA9IHsgJGVhY2g6IHNhdmVQaG9uZSB9O1xuXHRcdH1cblxuXHRcdGlmICghdXBkYXRlLiRhZGRUb1NldC52aXNpdG9yRW1haWxzICYmICF1cGRhdGUuJGFkZFRvU2V0LnBob25lKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHsgX2lkIH0sIHVwZGF0ZSk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IExpdmVjaGF0VmlzaXRvcnMoKTtcbiIsIi8qIGdsb2JhbHMgSFRUUCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgVUFQYXJzZXIgZnJvbSAndWEtcGFyc2VyLWpzJztcbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuUm9ja2V0Q2hhdC5MaXZlY2hhdCA9IHtcblx0aGlzdG9yeU1vbml0b3JUeXBlOiAndXJsJyxcblxuXHRsb2dnZXI6IG5ldyBMb2dnZXIoJ0xpdmVjaGF0Jywge1xuXHRcdHNlY3Rpb25zOiB7XG5cdFx0XHR3ZWJob29rOiAnV2ViaG9vaydcblx0XHR9XG5cdH0pLFxuXG5cdGdldE5leHRBZ2VudChkZXBhcnRtZW50KSB7XG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9Sb3V0aW5nX01ldGhvZCcpID09PSAnRXh0ZXJuYWwnKSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb25zdCBxdWVyeVN0cmluZyA9IGRlcGFydG1lbnQgPyBgP2RlcGFydG1lbnRJZD0keyBkZXBhcnRtZW50IH1gIDogJyc7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gSFRUUC5jYWxsKCdHRVQnLCBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0V4dGVybmFsX1F1ZXVlX1VSTCcpIH0keyBxdWVyeVN0cmluZyB9YCwge1xuXHRcdFx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdFx0XHQnVXNlci1BZ2VudCc6ICdSb2NrZXRDaGF0IFNlcnZlcicsXG5cdFx0XHRcdFx0XHRcdCdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHRcdFx0XHRcdCdYLVJvY2tldENoYXQtU2VjcmV0LVRva2VuJzogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0V4dGVybmFsX1F1ZXVlX1Rva2VuJylcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGlmIChyZXN1bHQgJiYgcmVzdWx0LmRhdGEgJiYgcmVzdWx0LmRhdGEudXNlcm5hbWUpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGFnZW50ID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZU9ubGluZUFnZW50QnlVc2VybmFtZShyZXN1bHQuZGF0YS51c2VybmFtZSk7XG5cblx0XHRcdFx0XHRcdGlmIChhZ2VudCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdGFnZW50SWQ6IGFnZW50Ll9pZCxcblx0XHRcdFx0XHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciByZXF1ZXN0aW5nIGFnZW50IGZyb20gZXh0ZXJuYWwgcXVldWUuJywgZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vLWFnZW50LW9ubGluZScsICdTb3JyeSwgbm8gb25saW5lIGFnZW50cycpO1xuXHRcdH0gZWxzZSBpZiAoZGVwYXJ0bWVudCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5nZXROZXh0QWdlbnRGb3JEZXBhcnRtZW50KGRlcGFydG1lbnQpO1xuXHRcdH1cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0TmV4dEFnZW50KCk7XG5cdH0sXG5cdGdldEFnZW50cyhkZXBhcnRtZW50KSB7XG5cdFx0aWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZmluZEJ5RGVwYXJ0bWVudElkKGRlcGFydG1lbnQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZEFnZW50cygpO1xuXHRcdH1cblx0fSxcblx0Z2V0T25saW5lQWdlbnRzKGRlcGFydG1lbnQpIHtcblx0XHRpZiAoZGVwYXJ0bWVudCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5nZXRPbmxpbmVGb3JEZXBhcnRtZW50KGRlcGFydG1lbnQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZUFnZW50cygpO1xuXHRcdH1cblx0fSxcblx0Z2V0UmVxdWlyZWREZXBhcnRtZW50KG9ubGluZVJlcXVpcmVkID0gdHJ1ZSkge1xuXHRcdGNvbnN0IGRlcGFydG1lbnRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmRFbmFibGVkV2l0aEFnZW50cygpO1xuXG5cdFx0cmV0dXJuIGRlcGFydG1lbnRzLmZldGNoKCkuZmluZCgoZGVwdCkgPT4ge1xuXHRcdFx0aWYgKCFkZXB0LnNob3dPblJlZ2lzdHJhdGlvbikge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIW9ubGluZVJlcXVpcmVkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3Qgb25saW5lQWdlbnRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmdldE9ubGluZUZvckRlcGFydG1lbnQoZGVwdC5faWQpO1xuXHRcdFx0cmV0dXJuIG9ubGluZUFnZW50cy5jb3VudCgpID4gMDtcblx0XHR9KTtcblx0fSxcblx0Z2V0Um9vbShndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50KSB7XG5cdFx0bGV0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChtZXNzYWdlLnJpZCk7XG5cdFx0bGV0IG5ld1Jvb20gPSBmYWxzZTtcblxuXHRcdGlmIChyb29tICYmICFyb29tLm9wZW4pIHtcblx0XHRcdG1lc3NhZ2UucmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHRyb29tID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAocm9vbSA9PSBudWxsKSB7XG5cdFx0XHQvLyBpZiBubyBkZXBhcnRtZW50IHNlbGVjdGVkIHZlcmlmeSBpZiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgYWN0aXZlIGFuZCBwaWNrIHRoZSBmaXJzdFxuXHRcdFx0aWYgKCFhZ2VudCAmJiAhZ3Vlc3QuZGVwYXJ0bWVudCkge1xuXHRcdFx0XHRjb25zdCBkZXBhcnRtZW50ID0gdGhpcy5nZXRSZXF1aXJlZERlcGFydG1lbnQoKTtcblxuXHRcdFx0XHRpZiAoZGVwYXJ0bWVudCkge1xuXHRcdFx0XHRcdGd1ZXN0LmRlcGFydG1lbnQgPSBkZXBhcnRtZW50Ll9pZDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBkZWxlZ2F0ZSByb29tIGNyZWF0aW9uIHRvIFF1ZXVlTWV0aG9kc1xuXHRcdFx0Y29uc3Qgcm91dGluZ01ldGhvZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9Sb3V0aW5nX01ldGhvZCcpO1xuXHRcdFx0cm9vbSA9IFJvY2tldENoYXQuUXVldWVNZXRob2RzW3JvdXRpbmdNZXRob2RdKGd1ZXN0LCBtZXNzYWdlLCByb29tSW5mbywgYWdlbnQpO1xuXG5cdFx0XHRuZXdSb29tID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoIXJvb20gfHwgcm9vbS52LnRva2VuICE9PSBndWVzdC50b2tlbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignY2Fubm90LWFjY2Vzcy1yb29tJyk7XG5cdFx0fVxuXG5cdFx0aWYgKG5ld1Jvb20pIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFJvb21JZEJ5VG9rZW4oZ3Vlc3QudG9rZW4sIHJvb20uX2lkKTtcblx0XHR9XG5cblx0XHRyZXR1cm4geyByb29tLCBuZXdSb29tIH07XG5cdH0sXG5cdHNlbmRNZXNzYWdlKHsgZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvLCBhZ2VudCB9KSB7XG5cdFx0Y29uc3QgeyByb29tLCBuZXdSb29tIH0gPSB0aGlzLmdldFJvb20oZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvLCBhZ2VudCk7XG5cdFx0aWYgKGd1ZXN0Lm5hbWUpIHtcblx0XHRcdG1lc3NhZ2UuYWxpYXMgPSBndWVzdC5uYW1lO1xuXHRcdH1cblxuXHRcdC8vIHJldHVybiBtZXNzYWdlcztcblx0XHRyZXR1cm4gXy5leHRlbmQoUm9ja2V0Q2hhdC5zZW5kTWVzc2FnZShndWVzdCwgbWVzc2FnZSwgcm9vbSksIHsgbmV3Um9vbSwgc2hvd0Nvbm5lY3Rpbmc6IHRoaXMuc2hvd0Nvbm5lY3RpbmcoKSB9KTtcblx0fSxcblx0cmVnaXN0ZXJHdWVzdCh7IHRva2VuLCBuYW1lLCBlbWFpbCwgZGVwYXJ0bWVudCwgcGhvbmUsIHVzZXJuYW1lIH0gPSB7fSkge1xuXHRcdGNoZWNrKHRva2VuLCBTdHJpbmcpO1xuXG5cdFx0bGV0IHVzZXJJZDtcblx0XHRjb25zdCB1cGRhdGVVc2VyID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHR0b2tlblxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCB1c2VyID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbiwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cblx0XHRpZiAodXNlcikge1xuXHRcdFx0dXNlcklkID0gdXNlci5faWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICghdXNlcm5hbWUpIHtcblx0XHRcdFx0dXNlcm5hbWUgPSBMaXZlY2hhdFZpc2l0b3JzLmdldE5leHRWaXNpdG9yVXNlcm5hbWUoKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IGV4aXN0aW5nVXNlciA9IG51bGw7XG5cblx0XHRcdGlmIChzLnRyaW0oZW1haWwpICE9PSAnJyAmJiAoZXhpc3RpbmdVc2VyID0gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lR3Vlc3RCeUVtYWlsQWRkcmVzcyhlbWFpbCkpKSB7XG5cdFx0XHRcdHVzZXJJZCA9IGV4aXN0aW5nVXNlci5faWQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCB1c2VyRGF0YSA9IHtcblx0XHRcdFx0XHR1c2VybmFtZSxcblx0XHRcdFx0XHRkZXBhcnRtZW50XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0aWYgKHRoaXMuY29ubmVjdGlvbikge1xuXHRcdFx0XHRcdHVzZXJEYXRhLnVzZXJBZ2VudCA9IHRoaXMuY29ubmVjdGlvbi5odHRwSGVhZGVyc1sndXNlci1hZ2VudCddO1xuXHRcdFx0XHRcdHVzZXJEYXRhLmlwID0gdGhpcy5jb25uZWN0aW9uLmh0dHBIZWFkZXJzWyd4LXJlYWwtaXAnXSB8fCB0aGlzLmNvbm5lY3Rpb24uaHR0cEhlYWRlcnNbJ3gtZm9yd2FyZGVkLWZvciddIHx8IHRoaXMuY29ubmVjdGlvbi5jbGllbnRBZGRyZXNzO1xuXHRcdFx0XHRcdHVzZXJEYXRhLmhvc3QgPSB0aGlzLmNvbm5lY3Rpb24uaHR0cEhlYWRlcnMuaG9zdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHVzZXJJZCA9IExpdmVjaGF0VmlzaXRvcnMuaW5zZXJ0KHVzZXJEYXRhKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAocGhvbmUpIHtcblx0XHRcdHVwZGF0ZVVzZXIuJHNldC5waG9uZSA9IFtcblx0XHRcdFx0eyBwaG9uZU51bWJlcjogcGhvbmUubnVtYmVyIH1cblx0XHRcdF07XG5cdFx0fVxuXG5cdFx0aWYgKGVtYWlsICYmIGVtYWlsLnRyaW0oKSAhPT0gJycpIHtcblx0XHRcdHVwZGF0ZVVzZXIuJHNldC52aXNpdG9yRW1haWxzID0gW1xuXHRcdFx0XHR7IGFkZHJlc3M6IGVtYWlsIH1cblx0XHRcdF07XG5cdFx0fVxuXG5cdFx0aWYgKG5hbWUpIHtcblx0XHRcdHVwZGF0ZVVzZXIuJHNldC5uYW1lID0gbmFtZTtcblx0XHR9XG5cblx0XHRMaXZlY2hhdFZpc2l0b3JzLnVwZGF0ZUJ5SWQodXNlcklkLCB1cGRhdGVVc2VyKTtcblxuXHRcdHJldHVybiB1c2VySWQ7XG5cdH0sXG5cdHNldERlcGFydG1lbnRGb3JHdWVzdCh7IHRva2VuLCBkZXBhcnRtZW50IH0gPSB7fSkge1xuXHRcdGNoZWNrKHRva2VuLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3QgdXBkYXRlVXNlciA9IHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0ZGVwYXJ0bWVudFxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCB1c2VyID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbiwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cdFx0aWYgKHVzZXIpIHtcblx0XHRcdHJldHVybiBNZXRlb3IudXNlcnMudXBkYXRlKHVzZXIuX2lkLCB1cGRhdGVVc2VyKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXHRzYXZlR3Vlc3QoeyBfaWQsIG5hbWUsIGVtYWlsLCBwaG9uZSB9KSB7XG5cdFx0Y29uc3QgdXBkYXRlRGF0YSA9IHt9O1xuXG5cdFx0aWYgKG5hbWUpIHtcblx0XHRcdHVwZGF0ZURhdGEubmFtZSA9IG5hbWU7XG5cdFx0fVxuXHRcdGlmIChlbWFpbCkge1xuXHRcdFx0dXBkYXRlRGF0YS5lbWFpbCA9IGVtYWlsO1xuXHRcdH1cblx0XHRpZiAocGhvbmUpIHtcblx0XHRcdHVwZGF0ZURhdGEucGhvbmUgPSBwaG9uZTtcblx0XHR9XG5cdFx0Y29uc3QgcmV0ID0gTGl2ZWNoYXRWaXNpdG9ycy5zYXZlR3Vlc3RCeUlkKF9pZCwgdXBkYXRlRGF0YSk7XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdsaXZlY2hhdC5zYXZlR3Vlc3QnLCB1cGRhdGVEYXRhKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiByZXQ7XG5cdH0sXG5cblx0Y2xvc2VSb29tKHsgdXNlciwgdmlzaXRvciwgcm9vbSwgY29tbWVudCB9KSB7XG5cdFx0Y29uc3Qgbm93ID0gbmV3IERhdGUoKTtcblxuXHRcdGNvbnN0IGNsb3NlRGF0YSA9IHtcblx0XHRcdGNsb3NlZEF0OiBub3csXG5cdFx0XHRjaGF0RHVyYXRpb246IChub3cuZ2V0VGltZSgpIC0gcm9vbS50cykgLyAxMDAwXG5cdFx0fTtcblxuXHRcdGlmICh1c2VyKSB7XG5cdFx0XHRjbG9zZURhdGEuY2xvc2VyID0gJ3VzZXInO1xuXHRcdFx0Y2xvc2VEYXRhLmNsb3NlZEJ5ID0ge1xuXHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZVxuXHRcdFx0fTtcblx0XHR9IGVsc2UgaWYgKHZpc2l0b3IpIHtcblx0XHRcdGNsb3NlRGF0YS5jbG9zZXIgPSAndmlzaXRvcic7XG5cdFx0XHRjbG9zZURhdGEuY2xvc2VkQnkgPSB7XG5cdFx0XHRcdF9pZDogdmlzaXRvci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiB2aXNpdG9yLnVzZXJuYW1lXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmNsb3NlQnlSb29tSWQocm9vbS5faWQsIGNsb3NlRGF0YSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5LmNsb3NlQnlSb29tSWQocm9vbS5faWQsIGNsb3NlRGF0YSk7XG5cblx0XHRjb25zdCBtZXNzYWdlID0ge1xuXHRcdFx0dDogJ2xpdmVjaGF0LWNsb3NlJyxcblx0XHRcdG1zZzogY29tbWVudCxcblx0XHRcdGdyb3VwYWJsZTogZmFsc2Vcblx0XHR9O1xuXG5cdFx0Um9ja2V0Q2hhdC5zZW5kTWVzc2FnZSh1c2VyLCBtZXNzYWdlLCByb29tKTtcblxuXHRcdGlmIChyb29tLnNlcnZlZEJ5KSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmhpZGVCeVJvb21JZEFuZFVzZXJJZChyb29tLl9pZCwgcm9vbS5zZXJ2ZWRCeS5faWQpO1xuXHRcdH1cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVDb21tYW5kV2l0aFJvb21JZEFuZFVzZXIoJ3Byb21wdFRyYW5zY3JpcHQnLCByb29tLl9pZCwgY2xvc2VEYXRhLmNsb3NlZEJ5KTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0LmNsb3NlUm9vbScsIHJvb20pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cblx0Z2V0SW5pdFNldHRpbmdzKCkge1xuXHRcdGNvbnN0IHNldHRpbmdzID0ge307XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kTm90SGlkZGVuUHVibGljKFtcblx0XHRcdCdMaXZlY2hhdF90aXRsZScsXG5cdFx0XHQnTGl2ZWNoYXRfdGl0bGVfY29sb3InLFxuXHRcdFx0J0xpdmVjaGF0X2VuYWJsZWQnLFxuXHRcdFx0J0xpdmVjaGF0X3JlZ2lzdHJhdGlvbl9mb3JtJyxcblx0XHRcdCdMaXZlY2hhdF9hbGxvd19zd2l0Y2hpbmdfZGVwYXJ0bWVudHMnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGUnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3InLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfbWVzc2FnZScsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfZm9ybV91bmF2YWlsYWJsZScsXG5cdFx0XHQnTGl2ZWNoYXRfZGlzcGxheV9vZmZsaW5lX2Zvcm0nLFxuXHRcdFx0J0xpdmVjaGF0X3ZpZGVvY2FsbF9lbmFibGVkJyxcblx0XHRcdCdKaXRzaV9FbmFibGVkJyxcblx0XHRcdCdMYW5ndWFnZScsXG5cdFx0XHQnTGl2ZWNoYXRfZW5hYmxlX3RyYW5zY3JpcHQnLFxuXHRcdFx0J0xpdmVjaGF0X3RyYW5zY3JpcHRfbWVzc2FnZScsXG5cdFx0XHQnTGl2ZWNoYXRfY29udmVyc2F0aW9uX2ZpbmlzaGVkX21lc3NhZ2UnLFxuXHRcdFx0J0xpdmVjaGF0X25hbWVfZmllbGRfcmVnaXN0cmF0aW9uX2Zvcm0nLFxuXHRcdFx0J0xpdmVjaGF0X2VtYWlsX2ZpZWxkX3JlZ2lzdHJhdGlvbl9mb3JtJ1xuXG5cdFx0XSkuZm9yRWFjaCgoc2V0dGluZykgPT4ge1xuXHRcdFx0c2V0dGluZ3Nbc2V0dGluZy5faWRdID0gc2V0dGluZy52YWx1ZTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBzZXR0aW5ncztcblx0fSxcblxuXHRzYXZlUm9vbUluZm8ocm9vbURhdGEsIGd1ZXN0RGF0YSkge1xuXHRcdGlmICgocm9vbURhdGEudG9waWMgIT0gbnVsbCB8fCByb29tRGF0YS50YWdzICE9IG51bGwpICYmICFSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRUb3BpY0FuZFRhZ3NCeUlkKHJvb21EYXRhLl9pZCwgcm9vbURhdGEudG9waWMsIHJvb21EYXRhLnRhZ3MpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignbGl2ZWNoYXQuc2F2ZVJvb20nLCByb29tRGF0YSk7XG5cdFx0fSk7XG5cblx0XHRpZiAoIV8uaXNFbXB0eShndWVzdERhdGEubmFtZSkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRGbmFtZUJ5SWQocm9vbURhdGEuX2lkLCBndWVzdERhdGEubmFtZSkgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVEaXNwbGF5TmFtZUJ5Um9vbUlkKHJvb21EYXRhLl9pZCwgZ3Vlc3REYXRhLm5hbWUpO1xuXHRcdH1cblx0fSxcblxuXHRjbG9zZU9wZW5DaGF0cyh1c2VySWQsIGNvbW1lbnQpIHtcblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5QWdlbnQodXNlcklkKS5mb3JFYWNoKChyb29tKSA9PiB7XG5cdFx0XHR0aGlzLmNsb3NlUm9vbSh7IHVzZXIsIHJvb20sIGNvbW1lbnR9KTtcblx0XHR9KTtcblx0fSxcblxuXHRmb3J3YXJkT3BlbkNoYXRzKHVzZXJJZCkge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlBZ2VudCh1c2VySWQpLmZvckVhY2goKHJvb20pID0+IHtcblx0XHRcdGNvbnN0IGd1ZXN0ID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQocm9vbS52Ll9pZCk7XG5cdFx0XHR0aGlzLnRyYW5zZmVyKHJvb20sIGd1ZXN0LCB7IGRlcGFydG1lbnRJZDogZ3Vlc3QuZGVwYXJ0bWVudCB9KTtcblx0XHR9KTtcblx0fSxcblxuXHRzYXZlUGFnZUhpc3RvcnkodG9rZW4sIHJvb21JZCwgcGFnZUluZm8pIHtcblx0XHRpZiAocGFnZUluZm8uY2hhbmdlID09PSBSb2NrZXRDaGF0LkxpdmVjaGF0Lmhpc3RvcnlNb25pdG9yVHlwZSkge1xuXG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoJ3JvY2tldC5jYXQnKTtcblxuXHRcdFx0Y29uc3QgcGFnZVRpdGxlID0gcGFnZUluZm8udGl0bGU7XG5cdFx0XHRjb25zdCBwYWdlVXJsID0gcGFnZUluZm8ubG9jYXRpb24uaHJlZjtcblx0XHRcdGNvbnN0IGV4dHJhRGF0YSA9IHtcblx0XHRcdFx0bmF2aWdhdGlvbjoge1xuXHRcdFx0XHRcdHBhZ2U6IHBhZ2VJbmZvLFxuXHRcdFx0XHRcdHRva2VuXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHRcdC8vIGtlZXAgaGlzdG9yeSBvZiB1bnJlZ2lzdGVyZWQgdmlzaXRvcnMgZm9yIDEgbW9udGhcblx0XHRcdFx0Y29uc3Qga2VlcEhpc3RvcnlNaWxpc2Vjb25kcyA9IDI1OTIwMDAwMDA7XG5cdFx0XHRcdGV4dHJhRGF0YS5leHBpcmVBdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpICsga2VlcEhpc3RvcnlNaWxpc2Vjb25kcztcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfVmlzaXRvcl9uYXZpZ2F0aW9uX2FzX2FfbWVzc2FnZScpKSB7XG5cdFx0XHRcdGV4dHJhRGF0YS5faGlkZGVuID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZU5hdmlnYXRpb25IaXN0b3J5V2l0aFJvb21JZE1lc3NhZ2VBbmRVc2VyKHJvb21JZCwgYCR7IHBhZ2VUaXRsZSB9IC0gJHsgcGFnZVVybCB9YCwgdXNlciwgZXh0cmFEYXRhKTtcblx0XHR9XG5cblx0XHRyZXR1cm47XG5cdH0sXG5cblx0dHJhbnNmZXIocm9vbSwgZ3Vlc3QsIHRyYW5zZmVyRGF0YSkge1xuXHRcdGxldCBhZ2VudDtcblxuXHRcdGlmICh0cmFuc2ZlckRhdGEudXNlcklkKSB7XG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodHJhbnNmZXJEYXRhLnVzZXJJZCk7XG5cdFx0XHRhZ2VudCA9IHtcblx0XHRcdFx0YWdlbnRJZDogdXNlci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhZ2VudCA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0TmV4dEFnZW50KHRyYW5zZmVyRGF0YS5kZXBhcnRtZW50SWQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHNlcnZlZEJ5ID0gcm9vbS5zZXJ2ZWRCeTtcblxuXHRcdGlmIChhZ2VudCAmJiBhZ2VudC5hZ2VudElkICE9PSBzZXJ2ZWRCeS5faWQpIHtcblx0XHRcdHJvb20udXNlcm5hbWVzID0gXy53aXRob3V0KHJvb20udXNlcm5hbWVzLCBzZXJ2ZWRCeS51c2VybmFtZSkuY29uY2F0KGFnZW50LnVzZXJuYW1lKTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY2hhbmdlQWdlbnRCeVJvb21JZChyb29tLl9pZCwgYWdlbnQpO1xuXG5cdFx0XHRjb25zdCBzdWJzY3JpcHRpb25EYXRhID0ge1xuXHRcdFx0XHRyaWQ6IHJvb20uX2lkLFxuXHRcdFx0XHRuYW1lOiBndWVzdC5uYW1lIHx8IGd1ZXN0LnVzZXJuYW1lLFxuXHRcdFx0XHRhbGVydDogdHJ1ZSxcblx0XHRcdFx0b3BlbjogdHJ1ZSxcblx0XHRcdFx0dW5yZWFkOiAxLFxuXHRcdFx0XHR1c2VyTWVudGlvbnM6IDEsXG5cdFx0XHRcdGdyb3VwTWVudGlvbnM6IDAsXG5cdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRfaWQ6IGFnZW50LmFnZW50SWQsXG5cdFx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHQ6ICdsJyxcblx0XHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0XHRtb2JpbGVQdXNoTm90aWZpY2F0aW9uczogJ2FsbCcsXG5cdFx0XHRcdGVtYWlsTm90aWZpY2F0aW9uczogJ2FsbCdcblx0XHRcdH07XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnJlbW92ZUJ5Um9vbUlkQW5kVXNlcklkKHJvb20uX2lkLCBzZXJ2ZWRCeS5faWQpO1xuXG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmluc2VydChzdWJzY3JpcHRpb25EYXRhKTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlVXNlckxlYXZlV2l0aFJvb21JZEFuZFVzZXIocm9vbS5faWQsIHsgX2lkOiBzZXJ2ZWRCeS5faWQsIHVzZXJuYW1lOiBzZXJ2ZWRCeS51c2VybmFtZSB9KTtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVVzZXJKb2luV2l0aFJvb21JZEFuZFVzZXIocm9vbS5faWQsIHsgX2lkOiBhZ2VudC5hZ2VudElkLCB1c2VybmFtZTogYWdlbnQudXNlcm5hbWUgfSk7XG5cblx0XHRcdFJvY2tldENoYXQuTGl2ZWNoYXQuc3RyZWFtLmVtaXQocm9vbS5faWQsIHtcblx0XHRcdFx0dHlwZTogJ2FnZW50RGF0YScsXG5cdFx0XHRcdGRhdGE6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldEFnZW50SW5mbyhhZ2VudC5hZ2VudElkKVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRzZW5kUmVxdWVzdChwb3N0RGF0YSwgY2FsbGJhY2ssIHRyeWluZyA9IDEpIHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdCdYLVJvY2tldENoYXQtTGl2ZWNoYXQtVG9rZW4nOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJylcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGF0YTogcG9zdERhdGFcblx0XHRcdH07XG5cdFx0XHRyZXR1cm4gSFRUUC5wb3N0KFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rVXJsJyksIG9wdGlvbnMpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFJvY2tldENoYXQuTGl2ZWNoYXQubG9nZ2VyLndlYmhvb2suZXJyb3IoYFJlc3BvbnNlIGVycm9yIG9uICR7IHRyeWluZyB9IHRyeSAtPmAsIGUpO1xuXHRcdFx0Ly8gdHJ5IDEwIHRpbWVzIGFmdGVyIDEwIHNlY29uZHMgZWFjaFxuXHRcdFx0aWYgKHRyeWluZyA8IDEwKSB7XG5cdFx0XHRcdFJvY2tldENoYXQuTGl2ZWNoYXQubG9nZ2VyLndlYmhvb2sud2FybignV2lsbCB0cnkgYWdhaW4gaW4gMTAgc2Vjb25kcyAuLi4nKTtcblx0XHRcdFx0dHJ5aW5nKys7XG5cdFx0XHRcdHNldFRpbWVvdXQoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zZW5kUmVxdWVzdChwb3N0RGF0YSwgY2FsbGJhY2ssIHRyeWluZyk7XG5cdFx0XHRcdH0pLCAxMDAwMCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdGdldExpdmVjaGF0Um9vbUd1ZXN0SW5mbyhyb29tKSB7XG5cdFx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZmluZE9uZUJ5SWQocm9vbS52Ll9pZCk7XG5cdFx0Y29uc3QgYWdlbnQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChyb29tLnNlcnZlZEJ5ICYmIHJvb20uc2VydmVkQnkuX2lkKTtcblxuXHRcdGNvbnN0IHVhID0gbmV3IFVBUGFyc2VyKCk7XG5cdFx0dWEuc2V0VUEodmlzaXRvci51c2VyQWdlbnQpO1xuXG5cdFx0Y29uc3QgcG9zdERhdGEgPSB7XG5cdFx0XHRfaWQ6IHJvb20uX2lkLFxuXHRcdFx0bGFiZWw6IHJvb20uZm5hbWUgfHwgcm9vbS5sYWJlbCwgLy8gdXNpbmcgc2FtZSBmaWVsZCBmb3IgY29tcGF0aWJpbGl0eVxuXHRcdFx0dG9waWM6IHJvb20udG9waWMsXG5cdFx0XHRjcmVhdGVkQXQ6IHJvb20udHMsXG5cdFx0XHRsYXN0TWVzc2FnZUF0OiByb29tLmxtLFxuXHRcdFx0dGFnczogcm9vbS50YWdzLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiByb29tLmxpdmVjaGF0RGF0YSxcblx0XHRcdHZpc2l0b3I6IHtcblx0XHRcdFx0X2lkOiB2aXNpdG9yLl9pZCxcblx0XHRcdFx0dG9rZW46IHZpc2l0b3IudG9rZW4sXG5cdFx0XHRcdG5hbWU6IHZpc2l0b3IubmFtZSxcblx0XHRcdFx0dXNlcm5hbWU6IHZpc2l0b3IudXNlcm5hbWUsXG5cdFx0XHRcdGVtYWlsOiBudWxsLFxuXHRcdFx0XHRwaG9uZTogbnVsbCxcblx0XHRcdFx0ZGVwYXJ0bWVudDogdmlzaXRvci5kZXBhcnRtZW50LFxuXHRcdFx0XHRpcDogdmlzaXRvci5pcCxcblx0XHRcdFx0b3M6IHVhLmdldE9TKCkubmFtZSAmJiAoYCR7IHVhLmdldE9TKCkubmFtZSB9ICR7IHVhLmdldE9TKCkudmVyc2lvbiB9YCksXG5cdFx0XHRcdGJyb3dzZXI6IHVhLmdldEJyb3dzZXIoKS5uYW1lICYmIChgJHsgdWEuZ2V0QnJvd3NlcigpLm5hbWUgfSAkeyB1YS5nZXRCcm93c2VyKCkudmVyc2lvbiB9YCksXG5cdFx0XHRcdGN1c3RvbUZpZWxkczogdmlzaXRvci5saXZlY2hhdERhdGFcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKGFnZW50KSB7XG5cdFx0XHRwb3N0RGF0YS5hZ2VudCA9IHtcblx0XHRcdFx0X2lkOiBhZ2VudC5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBhZ2VudC51c2VybmFtZSxcblx0XHRcdFx0bmFtZTogYWdlbnQubmFtZSxcblx0XHRcdFx0ZW1haWw6IG51bGxcblx0XHRcdH07XG5cblx0XHRcdGlmIChhZ2VudC5lbWFpbHMgJiYgYWdlbnQuZW1haWxzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0cG9zdERhdGEuYWdlbnQuZW1haWwgPSBhZ2VudC5lbWFpbHNbMF0uYWRkcmVzcztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAocm9vbS5jcm1EYXRhKSB7XG5cdFx0XHRwb3N0RGF0YS5jcm1EYXRhID0gcm9vbS5jcm1EYXRhO1xuXHRcdH1cblxuXHRcdGlmICh2aXNpdG9yLnZpc2l0b3JFbWFpbHMgJiYgdmlzaXRvci52aXNpdG9yRW1haWxzLmxlbmd0aCA+IDApIHtcblx0XHRcdHBvc3REYXRhLnZpc2l0b3IuZW1haWwgPSB2aXNpdG9yLnZpc2l0b3JFbWFpbHM7XG5cdFx0fVxuXHRcdGlmICh2aXNpdG9yLnBob25lICYmIHZpc2l0b3IucGhvbmUubGVuZ3RoID4gMCkge1xuXHRcdFx0cG9zdERhdGEudmlzaXRvci5waG9uZSA9IHZpc2l0b3IucGhvbmU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHBvc3REYXRhO1xuXHR9LFxuXG5cdGFkZEFnZW50KHVzZXJuYW1lKSB7XG5cdFx0Y2hlY2sodXNlcm5hbWUsIFN0cmluZyk7XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUsIHsgZmllbGRzOiB7IF9pZDogMSwgdXNlcm5hbWU6IDEgfSB9KTtcblxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6YWRkQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6LmFkZFVzZXJSb2xlcyh1c2VyLl9pZCwgJ2xpdmVjaGF0LWFnZW50JykpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldE9wZXJhdG9yKHVzZXIuX2lkLCB0cnVlKTtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldExpdmVjaGF0U3RhdHVzKHVzZXIuX2lkLCAnYXZhaWxhYmxlJyk7XG5cdFx0XHRyZXR1cm4gdXNlcjtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0YWRkTWFuYWdlcih1c2VybmFtZSkge1xuXHRcdGNoZWNrKHVzZXJuYW1lLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lLCB7IGZpZWxkczogeyBfaWQ6IDEsIHVzZXJuYW1lOiAxIH0gfSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmFkZE1hbmFnZXInIH0pO1xuXHRcdH1cblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6LmFkZFVzZXJSb2xlcyh1c2VyLl9pZCwgJ2xpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIHVzZXI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdHJlbW92ZUFnZW50KHVzZXJuYW1lKSB7XG5cdFx0Y2hlY2sodXNlcm5hbWUsIFN0cmluZyk7XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHoucmVtb3ZlVXNlckZyb21Sb2xlcyh1c2VyLl9pZCwgJ2xpdmVjaGF0LWFnZW50JykpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldE9wZXJhdG9yKHVzZXIuX2lkLCBmYWxzZSk7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRMaXZlY2hhdFN0YXR1cyh1c2VyLl9pZCwgJ25vdC1hdmFpbGFibGUnKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRyZW1vdmVNYW5hZ2VyKHVzZXJuYW1lKSB7XG5cdFx0Y2hlY2sodXNlcm5hbWUsIFN0cmluZyk7XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVNYW5hZ2VyJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5yZW1vdmVVc2VyRnJvbVJvbGVzKHVzZXIuX2lkLCAnbGl2ZWNoYXQtbWFuYWdlcicpO1xuXHR9LFxuXG5cdHNhdmVEZXBhcnRtZW50KF9pZCwgZGVwYXJ0bWVudERhdGEsIGRlcGFydG1lbnRBZ2VudHMpIHtcblx0XHRjaGVjayhfaWQsIE1hdGNoLk1heWJlKFN0cmluZykpO1xuXG5cdFx0Y2hlY2soZGVwYXJ0bWVudERhdGEsIHtcblx0XHRcdGVuYWJsZWQ6IEJvb2xlYW4sXG5cdFx0XHRuYW1lOiBTdHJpbmcsXG5cdFx0XHRkZXNjcmlwdGlvbjogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdHNob3dPblJlZ2lzdHJhdGlvbjogQm9vbGVhblxuXHRcdH0pO1xuXG5cdFx0Y2hlY2soZGVwYXJ0bWVudEFnZW50cywgW1xuXHRcdFx0TWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdFx0YWdlbnRJZDogU3RyaW5nLFxuXHRcdFx0XHR1c2VybmFtZTogU3RyaW5nXG5cdFx0XHR9KVxuXHRcdF0pO1xuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0Y29uc3QgZGVwYXJ0bWVudCA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kT25lQnlJZChfaWQpO1xuXHRcdFx0aWYgKCFkZXBhcnRtZW50KSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWRlcGFydG1lbnQtbm90LWZvdW5kJywgJ0RlcGFydG1lbnQgbm90IGZvdW5kJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlRGVwYXJ0bWVudCcgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5jcmVhdGVPclVwZGF0ZURlcGFydG1lbnQoX2lkLCBkZXBhcnRtZW50RGF0YSwgZGVwYXJ0bWVudEFnZW50cyk7XG5cdH0sXG5cblx0cmVtb3ZlRGVwYXJ0bWVudChfaWQpIHtcblx0XHRjaGVjayhfaWQsIFN0cmluZyk7XG5cblx0XHRjb25zdCBkZXBhcnRtZW50ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmRPbmVCeUlkKF9pZCwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cblx0XHRpZiAoIWRlcGFydG1lbnQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2RlcGFydG1lbnQtbm90LWZvdW5kJywgJ0RlcGFydG1lbnQgbm90IGZvdW5kJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVEZXBhcnRtZW50JyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LnJlbW92ZUJ5SWQoX2lkKTtcblx0fSxcblxuXHRzaG93Q29ubmVjdGluZygpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJykgPT09ICdHdWVzdF9Qb29sJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9vcGVuX2lucXVpZXJ5X3Nob3dfY29ubmVjdGluZycpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59O1xuXG5Sb2NrZXRDaGF0LkxpdmVjaGF0LnN0cmVhbSA9IG5ldyBNZXRlb3IuU3RyZWFtZXIoJ2xpdmVjaGF0LXJvb20nKTtcblxuUm9ja2V0Q2hhdC5MaXZlY2hhdC5zdHJlYW0uYWxsb3dSZWFkKChyb29tSWQsIGV4dHJhRGF0YSkgPT4ge1xuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblx0aWYgKCFyb29tKSB7XG5cdFx0Y29uc29sZS53YXJuKGBJbnZhbGlkIGV2ZW50TmFtZTogXCIkeyByb29tSWQgfVwiYCk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdGlmIChyb29tLnQgPT09ICdsJyAmJiBleHRyYURhdGEgJiYgZXh0cmFEYXRhLnRva2VuICYmIHJvb20udi50b2tlbiA9PT0gZXh0cmFEYXRhLnRva2VuKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9oaXN0b3J5X21vbml0b3JfdHlwZScsIChrZXksIHZhbHVlKSA9PiB7XG5cdFJvY2tldENoYXQuTGl2ZWNoYXQuaGlzdG9yeU1vbml0b3JUeXBlID0gdmFsdWU7XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0LlF1ZXVlTWV0aG9kcyA9IHtcblx0LyogTGVhc3QgQW1vdW50IFF1ZXVpbmcgbWV0aG9kOlxuXHQgKlxuXHQgKiBkZWZhdWx0IG1ldGhvZCB3aGVyZSB0aGUgYWdlbnQgd2l0aCB0aGUgbGVhc3QgbnVtYmVyXG5cdCAqIG9mIG9wZW4gY2hhdHMgaXMgcGFpcmVkIHdpdGggdGhlIGluY29taW5nIGxpdmVjaGF0XG5cdCAqL1xuXHQnTGVhc3RfQW1vdW50JyhndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50KSB7XG5cdFx0aWYgKCFhZ2VudCkge1xuXHRcdFx0YWdlbnQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldE5leHRBZ2VudChndWVzdC5kZXBhcnRtZW50KTtcblx0XHRcdGlmICghYWdlbnQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm8tYWdlbnQtb25saW5lJywgJ1NvcnJ5LCBubyBvbmxpbmUgYWdlbnRzJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlTGl2ZWNoYXRSb29tQ291bnQoKTtcblxuXHRcdGNvbnN0IHJvb20gPSBfLmV4dGVuZCh7XG5cdFx0XHRfaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0bXNnczogMSxcblx0XHRcdGxtOiBuZXcgRGF0ZSgpLFxuXHRcdFx0Zm5hbWU6IChyb29tSW5mbyAmJiByb29tSW5mby5mbmFtZSkgfHwgZ3Vlc3QubmFtZSB8fCBndWVzdC51c2VybmFtZSxcblx0XHRcdC8vIHVzZXJuYW1lczogW2FnZW50LnVzZXJuYW1lLCBndWVzdC51c2VybmFtZV0sXG5cdFx0XHR0OiAnbCcsXG5cdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdHY6IHtcblx0XHRcdFx0X2lkOiBndWVzdC5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBndWVzdC51c2VybmFtZSxcblx0XHRcdFx0dG9rZW46IG1lc3NhZ2UudG9rZW4sXG5cdFx0XHRcdHN0YXR1czogZ3Vlc3Quc3RhdHVzIHx8ICdvbmxpbmUnXG5cdFx0XHR9LFxuXHRcdFx0c2VydmVkQnk6IHtcblx0XHRcdFx0X2lkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHRjbDogZmFsc2UsXG5cdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0d2FpdGluZ1Jlc3BvbnNlOiB0cnVlXG5cdFx0fSwgcm9vbUluZm8pO1xuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbkRhdGEgPSB7XG5cdFx0XHRyaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0Zm5hbWU6IGd1ZXN0Lm5hbWUgfHwgZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHRhbGVydDogdHJ1ZSxcblx0XHRcdG9wZW46IHRydWUsXG5cdFx0XHR1bnJlYWQ6IDEsXG5cdFx0XHR1c2VyTWVudGlvbnM6IDEsXG5cdFx0XHRncm91cE1lbnRpb25zOiAwLFxuXHRcdFx0dToge1xuXHRcdFx0XHRfaWQ6IGFnZW50LmFnZW50SWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBhZ2VudC51c2VybmFtZVxuXHRcdFx0fSxcblx0XHRcdHQ6ICdsJyxcblx0XHRcdGRlc2t0b3BOb3RpZmljYXRpb25zOiAnYWxsJyxcblx0XHRcdG1vYmlsZVB1c2hOb3RpZmljYXRpb25zOiAnYWxsJyxcblx0XHRcdGVtYWlsTm90aWZpY2F0aW9uczogJ2FsbCdcblx0XHR9O1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuaW5zZXJ0KHJvb20pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuaW5zZXJ0KHN1YnNjcmlwdGlvbkRhdGEpO1xuXG5cdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zdHJlYW0uZW1pdChyb29tLl9pZCwge1xuXHRcdFx0dHlwZTogJ2FnZW50RGF0YScsXG5cdFx0XHRkYXRhOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8oYWdlbnQuYWdlbnRJZClcblx0XHR9KTtcblxuXHRcdHJldHVybiByb29tO1xuXHR9LFxuXHQvKiBHdWVzdCBQb29sIFF1ZXVpbmcgTWV0aG9kOlxuXHQgKlxuXHQgKiBBbiBpbmNvbW1pbmcgbGl2ZWNoYXQgaXMgY3JlYXRlZCBhcyBhbiBJbnF1aXJ5XG5cdCAqIHdoaWNoIGlzIHBpY2tlZCB1cCBmcm9tIGFuIGFnZW50LlxuXHQgKiBBbiBJbnF1aXJ5IGlzIHZpc2libGUgdG8gYWxsIGFnZW50cyAoVE9ETzogaW4gdGhlIGNvcnJlY3QgZGVwYXJ0bWVudClcbiAgICAgKlxuXHQgKiBBIHJvb20gaXMgc3RpbGwgY3JlYXRlZCB3aXRoIHRoZSBpbml0aWFsIG1lc3NhZ2UsIGJ1dCBpdCBpcyBvY2N1cGllZCBieVxuXHQgKiBvbmx5IHRoZSBjbGllbnQgdW50aWwgcGFpcmVkIHdpdGggYW4gYWdlbnRcblx0ICovXG5cdCdHdWVzdF9Qb29sJyhndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8pIHtcblx0XHRsZXQgYWdlbnRzID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXRPbmxpbmVBZ2VudHMoZ3Vlc3QuZGVwYXJ0bWVudCk7XG5cblx0XHRpZiAoYWdlbnRzLmNvdW50KCkgPT09IDAgJiYgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2d1ZXN0X3Bvb2xfd2l0aF9ub19hZ2VudHMnKSkge1xuXHRcdFx0YWdlbnRzID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXRBZ2VudHMoZ3Vlc3QuZGVwYXJ0bWVudCk7XG5cdFx0fVxuXG5cdFx0aWYgKGFnZW50cy5jb3VudCgpID09PSAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1hZ2VudC1vbmxpbmUnLCAnU29ycnksIG5vIG9ubGluZSBhZ2VudHMnKTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVMaXZlY2hhdFJvb21Db3VudCgpO1xuXG5cdFx0Y29uc3QgYWdlbnRJZHMgPSBbXTtcblxuXHRcdGFnZW50cy5mb3JFYWNoKChhZ2VudCkgPT4ge1xuXHRcdFx0aWYgKGd1ZXN0LmRlcGFydG1lbnQpIHtcblx0XHRcdFx0YWdlbnRJZHMucHVzaChhZ2VudC5hZ2VudElkKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFnZW50SWRzLnB1c2goYWdlbnQuX2lkKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGNvbnN0IGlucXVpcnkgPSB7XG5cdFx0XHRyaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0bWVzc2FnZTogbWVzc2FnZS5tc2csXG5cdFx0XHRuYW1lOiBndWVzdC5uYW1lIHx8IGd1ZXN0LnVzZXJuYW1lLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRkZXBhcnRtZW50OiBndWVzdC5kZXBhcnRtZW50LFxuXHRcdFx0YWdlbnRzOiBhZ2VudElkcyxcblx0XHRcdHN0YXR1czogJ29wZW4nLFxuXHRcdFx0djoge1xuXHRcdFx0XHRfaWQ6IGd1ZXN0Ll9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGd1ZXN0LnVzZXJuYW1lLFxuXHRcdFx0XHR0b2tlbjogbWVzc2FnZS50b2tlbixcblx0XHRcdFx0c3RhdHVzOiBndWVzdC5zdGF0dXMgfHwgJ29ubGluZSdcblx0XHRcdH0sXG5cdFx0XHR0OiAnbCdcblx0XHR9O1xuXHRcdGNvbnN0IHJvb20gPSBfLmV4dGVuZCh7XG5cdFx0XHRfaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0bXNnczogMSxcblx0XHRcdGxtOiBuZXcgRGF0ZSgpLFxuXHRcdFx0Zm5hbWU6IGd1ZXN0Lm5hbWUgfHwgZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHQvLyB1c2VybmFtZXM6IFtndWVzdC51c2VybmFtZV0sXG5cdFx0XHR0OiAnbCcsXG5cdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdHY6IHtcblx0XHRcdFx0X2lkOiBndWVzdC5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBndWVzdC51c2VybmFtZSxcblx0XHRcdFx0dG9rZW46IG1lc3NhZ2UudG9rZW4sXG5cdFx0XHRcdHN0YXR1czogZ3Vlc3Quc3RhdHVzXG5cdFx0XHR9LFxuXHRcdFx0Y2w6IGZhbHNlLFxuXHRcdFx0b3BlbjogdHJ1ZSxcblx0XHRcdHdhaXRpbmdSZXNwb25zZTogdHJ1ZVxuXHRcdH0sIHJvb21JbmZvKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkuaW5zZXJ0KGlucXVpcnkpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmluc2VydChyb29tKTtcblxuXHRcdHJldHVybiByb29tO1xuXHR9LFxuXHQnRXh0ZXJuYWwnKGd1ZXN0LCBtZXNzYWdlLCByb29tSW5mbywgYWdlbnQpIHtcblx0XHRyZXR1cm4gdGhpc1snTGVhc3RfQW1vdW50J10oZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvLCBhZ2VudCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblx0fVxufTtcbiIsIi8vIEV2ZXJ5IG1pbnV0ZSBjaGVjayBpZiBvZmZpY2UgY2xvc2VkXG5NZXRlb3Iuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfZW5hYmxlX29mZmljZV9ob3VycycpKSB7XG5cdFx0aWYgKFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0T2ZmaWNlSG91ci5pc09wZW5pbmdUaW1lKCkpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLm9wZW5PZmZpY2UoKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0T2ZmaWNlSG91ci5pc0Nsb3NpbmdUaW1lKCkpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmNsb3NlT2ZmaWNlKCk7XG5cdFx0fVxuXHR9XG59LCA2MDAwMCk7XG4iLCJjb25zdCBnYXRld2F5VVJMID0gJ2h0dHBzOi8vb21uaS5yb2NrZXQuY2hhdCc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0ZW5hYmxlKCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnUE9TVCcsIGAkeyBnYXRld2F5VVJMIH0vZmFjZWJvb2svZW5hYmxlYCwge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnYXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSB9YCxcblx0XHRcdFx0J2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdFx0fSxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dXJsOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2l0ZV9VcmwnKVxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQuZGF0YTtcblx0fSxcblxuXHRkaXNhYmxlKCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnREVMRVRFJywgYCR7IGdhdGV3YXlVUkwgfS9mYWNlYm9vay9lbmFibGVgLCB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdhdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpIH1gLFxuXHRcdFx0XHQnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHJlc3VsdC5kYXRhO1xuXHR9LFxuXG5cdGxpc3RQYWdlcygpIHtcblx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ0dFVCcsIGAkeyBnYXRld2F5VVJMIH0vZmFjZWJvb2svcGFnZXNgLCB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdhdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpIH1gXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHJlc3VsdC5kYXRhO1xuXHR9LFxuXG5cdHN1YnNjcmliZShwYWdlSWQpIHtcblx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ1BPU1QnLCBgJHsgZ2F0ZXdheVVSTCB9L2ZhY2Vib29rL3BhZ2UvJHsgcGFnZUlkIH0vc3Vic2NyaWJlYCwge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnYXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSB9YFxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQuZGF0YTtcblx0fSxcblxuXHR1bnN1YnNjcmliZShwYWdlSWQpIHtcblx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ0RFTEVURScsIGAkeyBnYXRld2F5VVJMIH0vZmFjZWJvb2svcGFnZS8keyBwYWdlSWQgfS9zdWJzY3JpYmVgLCB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdhdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpIH1gXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHJlc3VsdC5kYXRhO1xuXHR9LFxuXG5cdHJlcGx5KHsgcGFnZSwgdG9rZW4sIHRleHQgfSkge1xuXHRcdHJldHVybiBIVFRQLmNhbGwoJ1BPU1QnLCBgJHsgZ2F0ZXdheVVSTCB9L2ZhY2Vib29rL3JlcGx5YCwge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnYXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSB9YFxuXHRcdFx0fSxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0cGFnZSxcblx0XHRcdFx0dG9rZW4sXG5cdFx0XHRcdHRleHRcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlLCByb29tKSB7XG5cdC8vIHNraXBzIHRoaXMgY2FsbGJhY2sgaWYgdGhlIG1lc3NhZ2Ugd2FzIGVkaXRlZFxuXHRpZiAobWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LlNNUy5lbmFibGVkKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBvbmx5IHNlbmQgdGhlIHNtcyBieSBTTVMgaWYgaXQgaXMgYSBsaXZlY2hhdCByb29tIHdpdGggU01TIHNldCB0byB0cnVlXG5cdGlmICghKHR5cGVvZiByb29tLnQgIT09ICd1bmRlZmluZWQnICYmIHJvb20udCA9PT0gJ2wnICYmIHJvb20uc21zICYmIHJvb20udiAmJiByb29tLnYudG9rZW4pKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0b2tlbiwgaXQgd2FzIHNlbnQgZnJvbSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmIChtZXNzYWdlLnRva2VuKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0eXBlIG1lYW5zIGl0IGlzIGEgc3BlY2lhbCBtZXNzYWdlIChsaWtlIHRoZSBjbG9zaW5nIGNvbW1lbnQpLCBzbyBza2lwc1xuXHRpZiAobWVzc2FnZS50KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRjb25zdCBTTVNTZXJ2aWNlID0gUm9ja2V0Q2hhdC5TTVMuZ2V0U2VydmljZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU01TX1NlcnZpY2UnKSk7XG5cblx0aWYgKCFTTVNTZXJ2aWNlKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbihyb29tLnYudG9rZW4pO1xuXG5cdGlmICghdmlzaXRvciB8fCAhdmlzaXRvci5waG9uZSB8fCB2aXNpdG9yLnBob25lLmxlbmd0aCA9PT0gMCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0U01TU2VydmljZS5zZW5kKHJvb20uc21zLmZyb20sIHZpc2l0b3IucGhvbmVbMF0ucGhvbmVOdW1iZXIsIG1lc3NhZ2UubXNnKTtcblxuXHRyZXR1cm4gbWVzc2FnZTtcblxufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnc2VuZE1lc3NhZ2VCeVNtcycpO1xuIiwiLyogZ2xvYmFscyBVc2VyUHJlc2VuY2VNb25pdG9yICovXG5cbmxldCBhZ2VudHNIYW5kbGVyO1xubGV0IG1vbml0b3JBZ2VudHMgPSBmYWxzZTtcbmxldCBhY3Rpb25UaW1lb3V0ID0gNjAwMDA7XG5cbmNvbnN0IG9ubGluZUFnZW50cyA9IHtcblx0dXNlcnM6IHt9LFxuXHRxdWV1ZToge30sXG5cblx0YWRkKHVzZXJJZCkge1xuXHRcdGlmICh0aGlzLnF1ZXVlW3VzZXJJZF0pIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLnF1ZXVlW3VzZXJJZF0pO1xuXHRcdFx0ZGVsZXRlIHRoaXMucXVldWVbdXNlcklkXTtcblx0XHR9XG5cdFx0dGhpcy51c2Vyc1t1c2VySWRdID0gMTtcblx0fSxcblxuXHRyZW1vdmUodXNlcklkLCBjYWxsYmFjaykge1xuXHRcdGlmICh0aGlzLnF1ZXVlW3VzZXJJZF0pIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLnF1ZXVlW3VzZXJJZF0pO1xuXHRcdH1cblx0XHR0aGlzLnF1ZXVlW3VzZXJJZF0gPSBzZXRUaW1lb3V0KE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuXHRcdFx0Y2FsbGJhY2soKTtcblxuXHRcdFx0ZGVsZXRlIHRoaXMudXNlcnNbdXNlcklkXTtcblx0XHRcdGRlbGV0ZSB0aGlzLnF1ZXVlW3VzZXJJZF07XG5cdFx0fSksIGFjdGlvblRpbWVvdXQpO1xuXHR9LFxuXG5cdGV4aXN0cyh1c2VySWQpIHtcblx0XHRyZXR1cm4gISF0aGlzLnVzZXJzW3VzZXJJZF07XG5cdH1cbn07XG5cbmZ1bmN0aW9uIHJ1bkFnZW50TGVhdmVBY3Rpb24odXNlcklkKSB7XG5cdGNvbnN0IGFjdGlvbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb24nKTtcblx0aWYgKGFjdGlvbiA9PT0gJ2Nsb3NlJykge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LmNsb3NlT3BlbkNoYXRzKHVzZXJJZCwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2FnZW50X2xlYXZlX2NvbW1lbnQnKSk7XG5cdH0gZWxzZSBpZiAoYWN0aW9uID09PSAnZm9yd2FyZCcpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5mb3J3YXJkT3BlbkNoYXRzKHVzZXJJZCk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2FnZW50X2xlYXZlX2FjdGlvbl90aW1lb3V0JywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRhY3Rpb25UaW1lb3V0ID0gdmFsdWUgKiAxMDAwO1xufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb24nLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdG1vbml0b3JBZ2VudHMgPSB2YWx1ZTtcblx0aWYgKHZhbHVlICE9PSAnbm9uZScpIHtcblx0XHRpZiAoIWFnZW50c0hhbmRsZXIpIHtcblx0XHRcdGFnZW50c0hhbmRsZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25saW5lQWdlbnRzKCkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdFx0XHRhZGRlZChpZCkge1xuXHRcdFx0XHRcdG9ubGluZUFnZW50cy5hZGQoaWQpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdFx0XHRpZiAoZmllbGRzLnN0YXR1c0xpdmVjaGF0ICYmIGZpZWxkcy5zdGF0dXNMaXZlY2hhdCA9PT0gJ25vdC1hdmFpbGFibGUnKSB7XG5cdFx0XHRcdFx0XHRvbmxpbmVBZ2VudHMucmVtb3ZlKGlkLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHJ1bkFnZW50TGVhdmVBY3Rpb24oaWQpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdG9ubGluZUFnZW50cy5hZGQoaWQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0XHRcdG9ubGluZUFnZW50cy5yZW1vdmUoaWQsICgpID0+IHtcblx0XHRcdFx0XHRcdHJ1bkFnZW50TGVhdmVBY3Rpb24oaWQpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0gZWxzZSBpZiAoYWdlbnRzSGFuZGxlcikge1xuXHRcdGFnZW50c0hhbmRsZXIuc3RvcCgpO1xuXHRcdGFnZW50c0hhbmRsZXIgPSBudWxsO1xuXHR9XG59KTtcblxuVXNlclByZXNlbmNlTW9uaXRvci5vblNldFVzZXJTdGF0dXMoKHVzZXIsIHN0YXR1cy8qLCBzdGF0dXNDb25uZWN0aW9uKi8pID0+IHtcblx0aWYgKCFtb25pdG9yQWdlbnRzKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmIChvbmxpbmVBZ2VudHMuZXhpc3RzKHVzZXIuX2lkKSkge1xuXHRcdGlmIChzdGF0dXMgPT09ICdvZmZsaW5lJyB8fCB1c2VyLnN0YXR1c0xpdmVjaGF0ID09PSAnbm90LWF2YWlsYWJsZScpIHtcblx0XHRcdG9ubGluZUFnZW50cy5yZW1vdmUodXNlci5faWQsICgpID0+IHtcblx0XHRcdFx0cnVuQWdlbnRMZWF2ZUFjdGlvbih1c2VyLl9pZCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5NZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6Y3VzdG9tRmllbGRzJywgZnVuY3Rpb24oX2lkKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmN1c3RvbUZpZWxkcycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDpjdXN0b21GaWVsZHMnIH0pKTtcblx0fVxuXG5cdGlmIChzLnRyaW0oX2lkKSkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmQoeyBfaWQgfSk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5maW5kKCk7XG5cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmRlcGFydG1lbnRBZ2VudHMnLCBmdW5jdGlvbihkZXBhcnRtZW50SWQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6ZGVwYXJ0bWVudEFnZW50cycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LXJvb21zJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmRlcGFydG1lbnRBZ2VudHMnIH0pKTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZmluZCh7IGRlcGFydG1lbnRJZCB9KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmV4dGVybmFsTWVzc2FnZXMnLCBmdW5jdGlvbihyb29tSWQpIHtcblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlLmZpbmRCeVJvb21JZChyb29tSWQpO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6YWdlbnRzJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFnZW50cycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDphZ2VudHMnIH0pKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZSA9IFJvY2tldENoYXQuYXV0aHouZ2V0VXNlcnNJblJvbGUoJ2xpdmVjaGF0LWFnZW50Jykub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2FnZW50VXNlcnMnLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5jaGFuZ2VkKCdhZ2VudFVzZXJzJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKGlkKSB7XG5cdFx0XHRzZWxmLnJlbW92ZWQoJ2FnZW50VXNlcnMnLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHRzZWxmLnJlYWR5KCk7XG5cblx0c2VsZi5vblN0b3AoZnVuY3Rpb24oKSB7XG5cdFx0aGFuZGxlLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDphcHBlYXJhbmNlJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFwcGVhcmFuY2UnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFwcGVhcmFuY2UnIH0pKTtcblx0fVxuXG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDoge1xuXHRcdFx0JGluOiBbXG5cdFx0XHRcdCdMaXZlY2hhdF90aXRsZScsXG5cdFx0XHRcdCdMaXZlY2hhdF90aXRsZV9jb2xvcicsXG5cdFx0XHRcdCdMaXZlY2hhdF9zaG93X2FnZW50X2VtYWlsJyxcblx0XHRcdFx0J0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJyxcblx0XHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfZm9ybV91bmF2YWlsYWJsZScsXG5cdFx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX21lc3NhZ2UnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV90aXRsZScsXG5cdFx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlX2NvbG9yJyxcblx0XHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfZW1haWwnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfY29udmVyc2F0aW9uX2ZpbmlzaGVkX21lc3NhZ2UnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfcmVnaXN0cmF0aW9uX2Zvcm0nLFxuXHRcdFx0XHQnTGl2ZWNoYXRfbmFtZV9maWVsZF9yZWdpc3RyYXRpb25fZm9ybScsXG5cdFx0XHRcdCdMaXZlY2hhdF9lbWFpbF9maWVsZF9yZWdpc3RyYXRpb25fZm9ybSdcblx0XHRcdF1cblx0XHR9XG5cdH07XG5cblx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cblx0Y29uc3QgaGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZChxdWVyeSkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2xpdmVjaGF0QXBwZWFyYW5jZScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ2xpdmVjaGF0QXBwZWFyYW5jZScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdsaXZlY2hhdEFwcGVhcmFuY2UnLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHR0aGlzLnJlYWR5KCk7XG5cblx0dGhpcy5vblN0b3AoKCkgPT4ge1xuXHRcdGhhbmRsZS5zdG9wKCk7XG5cdH0pO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6ZGVwYXJ0bWVudHMnLCBmdW5jdGlvbihfaWQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YWdlbnRzJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFnZW50cycgfSkpO1xuXHR9XG5cblx0aWYgKF9pZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kQnlEZXBhcnRtZW50SWQoX2lkKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmQoKTtcblx0fVxuXG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDppbnRlZ3JhdGlvbicsIGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDppbnRlZ3JhdGlvbicgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6aW50ZWdyYXRpb24nIH0pKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZSA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRCeUlkcyhbJ0xpdmVjaGF0X3dlYmhvb2tVcmwnLCAnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJywgJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnLCAnTGl2ZWNoYXRfd2ViaG9va19vbl9vZmZsaW5lX21zZycsICdMaXZlY2hhdF93ZWJob29rX29uX3Zpc2l0b3JfbWVzc2FnZScsICdMaXZlY2hhdF93ZWJob29rX29uX2FnZW50X21lc3NhZ2UnXSkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2xpdmVjaGF0SW50ZWdyYXRpb24nLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5jaGFuZ2VkKCdsaXZlY2hhdEludGVncmF0aW9uJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKGlkKSB7XG5cdFx0XHRzZWxmLnJlbW92ZWQoJ2xpdmVjaGF0SW50ZWdyYXRpb24nLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHRzZWxmLnJlYWR5KCk7XG5cblx0c2VsZi5vblN0b3AoZnVuY3Rpb24oKSB7XG5cdFx0aGFuZGxlLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDptYW5hZ2VycycsIGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDptYW5hZ2VycycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LXJvb21zJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0Om1hbmFnZXJzJyB9KSk7XG5cdH1cblxuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRjb25zdCBoYW5kbGUgPSBSb2NrZXRDaGF0LmF1dGh6LmdldFVzZXJzSW5Sb2xlKCdsaXZlY2hhdC1tYW5hZ2VyJykub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ21hbmFnZXJVc2VycycsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ21hbmFnZXJVc2VycycsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdtYW5hZ2VyVXNlcnMnLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHRzZWxmLnJlYWR5KCk7XG5cblx0c2VsZi5vblN0b3AoZnVuY3Rpb24oKSB7XG5cdFx0aGFuZGxlLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDpyb29tcycsIGZ1bmN0aW9uKGZpbHRlciA9IHt9LCBvZmZzZXQgPSAwLCBsaW1pdCA9IDIwKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnJvb21zJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtcm9vbXMnKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6cm9vbXMnIH0pKTtcblx0fVxuXG5cdGNoZWNrKGZpbHRlciwge1xuXHRcdG5hbWU6IE1hdGNoLk1heWJlKFN0cmluZyksIC8vIHJvb20gbmFtZSB0byBmaWx0ZXJcblx0XHRhZ2VudDogTWF0Y2guTWF5YmUoU3RyaW5nKSwgLy8gYWdlbnQgX2lkIHdobyBpcyBzZXJ2aW5nXG5cdFx0c3RhdHVzOiBNYXRjaC5NYXliZShTdHJpbmcpLCAvLyBlaXRoZXIgJ29wZW5lZCcgb3IgJ2Nsb3NlZCdcblx0XHRmcm9tOiBNYXRjaC5NYXliZShEYXRlKSxcblx0XHR0bzogTWF0Y2guTWF5YmUoRGF0ZSlcblx0fSk7XG5cblx0Y29uc3QgcXVlcnkgPSB7fTtcblx0aWYgKGZpbHRlci5uYW1lKSB7XG5cdFx0cXVlcnkubGFiZWwgPSBuZXcgUmVnRXhwKGZpbHRlci5uYW1lLCAnaScpO1xuXHR9XG5cdGlmIChmaWx0ZXIuYWdlbnQpIHtcblx0XHRxdWVyeVsnc2VydmVkQnkuX2lkJ10gPSBmaWx0ZXIuYWdlbnQ7XG5cdH1cblx0aWYgKGZpbHRlci5zdGF0dXMpIHtcblx0XHRpZiAoZmlsdGVyLnN0YXR1cyA9PT0gJ29wZW5lZCcpIHtcblx0XHRcdHF1ZXJ5Lm9wZW4gPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRxdWVyeS5vcGVuID0geyAkZXhpc3RzOiBmYWxzZSB9O1xuXHRcdH1cblx0fVxuXHRpZiAoZmlsdGVyLmZyb20pIHtcblx0XHRxdWVyeS50cyA9IHtcblx0XHRcdCRndGU6IGZpbHRlci5mcm9tXG5cdFx0fTtcblx0fVxuXHRpZiAoZmlsdGVyLnRvKSB7XG5cdFx0ZmlsdGVyLnRvLnNldERhdGUoZmlsdGVyLnRvLmdldERhdGUoKSArIDEpO1xuXHRcdGZpbHRlci50by5zZXRTZWNvbmRzKGZpbHRlci50by5nZXRTZWNvbmRzKCkgLSAxKTtcblxuXHRcdGlmICghcXVlcnkudHMpIHtcblx0XHRcdHF1ZXJ5LnRzID0ge307XG5cdFx0fVxuXHRcdHF1ZXJ5LnRzLiRsdGUgPSBmaWx0ZXIudG87XG5cdH1cblxuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRjb25zdCBoYW5kbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kTGl2ZWNoYXQocXVlcnksIG9mZnNldCwgbGltaXQpLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRhZGRlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmFkZGVkKCdsaXZlY2hhdFJvb20nLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5jaGFuZ2VkKCdsaXZlY2hhdFJvb20nLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdHNlbGYucmVtb3ZlZCgnbGl2ZWNoYXRSb29tJywgaWQpO1xuXHRcdH1cblx0fSk7XG5cblx0dGhpcy5yZWFkeSgpO1xuXG5cdHRoaXMub25TdG9wKCgpID0+IHtcblx0XHRoYW5kbGUuc3RvcCgpO1xuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnF1ZXVlJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnF1ZXVlJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnF1ZXVlJyB9KSk7XG5cdH1cblxuXHQvLyBsZXQgc29ydCA9IHsgY291bnQ6IDEsIHNvcnQ6IDEsIHVzZXJuYW1lOiAxIH07XG5cdC8vIGxldCBvbmxpbmVVc2VycyA9IHt9O1xuXG5cdC8vIGxldCBoYW5kbGVVc2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMoKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdC8vIFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHQvLyBcdFx0b25saW5lVXNlcnNbZmllbGRzLnVzZXJuYW1lXSA9IDE7XG5cdC8vIFx0XHQvLyB0aGlzLmFkZGVkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkLCBmaWVsZHMpO1xuXHQvLyBcdH0sXG5cdC8vIFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdC8vIFx0XHRvbmxpbmVVc2Vyc1tmaWVsZHMudXNlcm5hbWVdID0gMTtcblx0Ly8gXHRcdC8vIHRoaXMuY2hhbmdlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCwgZmllbGRzKTtcblx0Ly8gXHR9LFxuXHQvLyBcdHJlbW92ZWQoaWQpIHtcblx0Ly8gXHRcdHRoaXMucmVtb3ZlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCk7XG5cdC8vIFx0fVxuXHQvLyB9KTtcblxuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRjb25zdCBoYW5kbGVEZXB0cyA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kVXNlcnNJblF1ZXVlKCkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2xpdmVjaGF0UXVldWVVc2VyJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuY2hhbmdlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdHNlbGYucmVtb3ZlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHR0aGlzLnJlYWR5KCk7XG5cblx0dGhpcy5vblN0b3AoKCkgPT4ge1xuXHRcdC8vIGhhbmRsZVVzZXJzLnN0b3AoKTtcblx0XHRoYW5kbGVEZXB0cy5zdG9wKCk7XG5cdH0pO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6dHJpZ2dlcnMnLCBmdW5jdGlvbihfaWQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dHJpZ2dlcnMnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnRyaWdnZXJzJyB9KSk7XG5cdH1cblxuXHRpZiAoX2lkICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRUcmlnZ2VyLmZpbmRCeUlkKF9pZCk7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci5maW5kKCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnZpc2l0b3JIaXN0b3J5JywgZnVuY3Rpb24oeyByaWQ6IHJvb21JZCB9KSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JIaXN0b3J5JyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JIaXN0b3J5JyB9KSk7XG5cdH1cblxuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblxuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy51c2VySWQpO1xuXG5cdGlmIChyb29tLnVzZXJuYW1lcy5pbmRleE9mKHVzZXIudXNlcm5hbWUpID09PSAtMSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckhpc3RvcnknIH0pKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGlmIChyb29tICYmIHJvb20udiAmJiByb29tLnYuX2lkKSB7XG5cdFx0Y29uc3QgaGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VmlzaXRvcklkKHJvb20udi5faWQpLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdFx0c2VsZi5hZGRlZCgndmlzaXRvcl9oaXN0b3J5JywgaWQsIGZpZWxkcyk7XG5cdFx0XHR9LFxuXHRcdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRcdHNlbGYuY2hhbmdlZCgndmlzaXRvcl9oaXN0b3J5JywgaWQsIGZpZWxkcyk7XG5cdFx0XHR9LFxuXHRcdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0XHRzZWxmLnJlbW92ZWQoJ3Zpc2l0b3JfaGlzdG9yeScsIGlkKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHNlbGYucmVhZHkoKTtcblxuXHRcdHNlbGYub25TdG9wKGZ1bmN0aW9uKCkge1xuXHRcdFx0aGFuZGxlLnN0b3AoKTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRzZWxmLnJlYWR5KCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6dmlzaXRvckluZm8nLCBmdW5jdGlvbih7IHJpZDogcm9vbUlkIH0pIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckluZm8nIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckluZm8nIH0pKTtcblx0fVxuXG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdGlmIChyb29tICYmIHJvb20udiAmJiByb29tLnYuX2lkKSB7XG5cdFx0cmV0dXJuIExpdmVjaGF0VmlzaXRvcnMuZmluZEJ5SWQocm9vbS52Ll9pZCk7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6dmlzaXRvclBhZ2VWaXNpdGVkJywgZnVuY3Rpb24oeyByaWQ6IHJvb21JZCB9KSB7XG5cblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvclBhZ2VWaXNpdGVkJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JQYWdlVmlzaXRlZCcgfSkpO1xuXHR9XG5cblx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdGlmIChyb29tKSB7XG5cdFx0Y29uc3QgaGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZEJ5Um9vbUlkQW5kVHlwZShyb29tLl9pZCwgJ2xpdmVjaGF0X25hdmlnYXRpb25faGlzdG9yeScpLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdFx0c2VsZi5hZGRlZCgndmlzaXRvcl9uYXZpZ2F0aW9uX2hpc3RvcnknLCBpZCwgZmllbGRzKTtcblx0XHRcdH0sXG5cdFx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdFx0c2VsZi5jaGFuZ2VkKCd2aXNpdG9yX25hdmlnYXRpb25faGlzdG9yeScsIGlkLCBmaWVsZHMpO1xuXHRcdFx0fSxcblx0XHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdFx0c2VsZi5yZW1vdmVkKCd2aXNpdG9yX25hdmlnYXRpb25faGlzdG9yeScsIGlkKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHNlbGYucmVhZHkoKTtcblxuXHRcdHNlbGYub25TdG9wKGZ1bmN0aW9uKCkge1xuXHRcdFx0aGFuZGxlLnN0b3AoKTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRzZWxmLnJlYWR5KCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmlucXVpcnknLCBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6aW5xdWlyeScgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDppbnF1aXJ5JyB9KSk7XG5cdH1cblxuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRhZ2VudHM6IHRoaXMudXNlcklkLFxuXHRcdHN0YXR1czogJ29wZW4nXG5cdH07XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS5maW5kKHF1ZXJ5KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0Om9mZmljZUhvdXInLCBmdW5jdGlvbigpIHtcblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDphZ2VudHMnIH0pKTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdE9mZmljZUhvdXIuZmluZCgpO1xufSk7XG4iLCJpbXBvcnQgJy4uL2ltcG9ydHMvc2VydmVyL3Jlc3QvZGVwYXJ0bWVudHMuanMnO1xuaW1wb3J0ICcuLi9pbXBvcnRzL3NlcnZlci9yZXN0L2ZhY2Vib29rLmpzJztcbmltcG9ydCAnLi4vaW1wb3J0cy9zZXJ2ZXIvcmVzdC9zbXMuanMnO1xuaW1wb3J0ICcuLi9pbXBvcnRzL3NlcnZlci9yZXN0L3VzZXJzLmpzJztcbmltcG9ydCAnLi4vaW1wb3J0cy9zZXJ2ZXIvcmVzdC9tZXNzYWdlcy5qcyc7XG5pbXBvcnQgJy4uL2ltcG9ydHMvc2VydmVyL3Jlc3QvdmlzaXRvcnMuanMnO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcblx0Y29uc3Qgcm9sZXMgPSBfLnBsdWNrKFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmZpbmQoKS5mZXRjaCgpLCAnbmFtZScpO1xuXHRpZiAocm9sZXMuaW5kZXhPZignbGl2ZWNoYXQtYWdlbnQnKSA9PT0gLTEpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5jcmVhdGVPclVwZGF0ZSgnbGl2ZWNoYXQtYWdlbnQnKTtcblx0fVxuXHRpZiAocm9sZXMuaW5kZXhPZignbGl2ZWNoYXQtbWFuYWdlcicpID09PSAtMSkge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmNyZWF0ZU9yVXBkYXRlKCdsaXZlY2hhdC1tYW5hZ2VyJyk7XG5cdH1cblx0aWYgKHJvbGVzLmluZGV4T2YoJ2xpdmVjaGF0LWd1ZXN0JykgPT09IC0xKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuY3JlYXRlT3JVcGRhdGUoJ2xpdmVjaGF0LWd1ZXN0Jyk7XG5cdH1cblx0aWYgKFJvY2tldENoYXQubW9kZWxzICYmIFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoJ3ZpZXctbC1yb29tJywgWydsaXZlY2hhdC1hZ2VudCcsICdsaXZlY2hhdC1tYW5hZ2VyJywgJ2FkbWluJ10pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNyZWF0ZU9yVXBkYXRlKCd2aWV3LWxpdmVjaGF0LW1hbmFnZXInLCBbJ2xpdmVjaGF0LW1hbmFnZXInLCAnYWRtaW4nXSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoJ3ZpZXctbGl2ZWNoYXQtcm9vbXMnLCBbJ2xpdmVjaGF0LW1hbmFnZXInLCAnYWRtaW4nXSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoJ2Nsb3NlLWxpdmVjaGF0LXJvb20nLCBbJ2xpdmVjaGF0LWFnZW50JywgJ2xpdmVjaGF0LW1hbmFnZXInLCAnYWRtaW4nXSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoJ2Nsb3NlLW90aGVycy1saXZlY2hhdC1yb29tJywgWydsaXZlY2hhdC1tYW5hZ2VyJywgJ2FkbWluJ10pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNyZWF0ZU9yVXBkYXRlKCdzYXZlLW90aGVycy1saXZlY2hhdC1yb29tLWluZm8nLCBbJ2xpdmVjaGF0LW1hbmFnZXInXSk7XG5cdH1cbn0pO1xuIiwiUm9ja2V0Q2hhdC5NZXNzYWdlVHlwZXMucmVnaXN0ZXJUeXBlKHtcblx0aWQ6ICdsaXZlY2hhdF9uYXZpZ2F0aW9uX2hpc3RvcnknLFxuXHRzeXN0ZW06IHRydWUsXG5cdG1lc3NhZ2U6ICdOZXdfdmlzaXRvcl9uYXZpZ2F0aW9uJyxcblx0ZGF0YShtZXNzYWdlKSB7XG5cdFx0aWYgKCFtZXNzYWdlLm5hdmlnYXRpb24gfHwgIW1lc3NhZ2UubmF2aWdhdGlvbi5wYWdlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHJldHVybiB7XG5cdFx0XHRoaXN0b3J5OiBgJHsgKG1lc3NhZ2UubmF2aWdhdGlvbi5wYWdlLnRpdGxlID8gYCR7IG1lc3NhZ2UubmF2aWdhdGlvbi5wYWdlLnRpdGxlIH0gLSBgIDogJycpICsgbWVzc2FnZS5uYXZpZ2F0aW9uLnBhZ2UubG9jYXRpb24uaHJlZiB9YFxuXHRcdH07XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0Lk1lc3NhZ2VUeXBlcy5yZWdpc3RlclR5cGUoe1xuXHRpZDogJ2xpdmVjaGF0X3ZpZGVvX2NhbGwnLFxuXHRzeXN0ZW06IHRydWUsXG5cdG1lc3NhZ2U6ICdOZXdfdmlkZW9jYWxsX3JlcXVlc3QnXG59KTtcblxuUm9ja2V0Q2hhdC5hY3Rpb25MaW5rcy5yZWdpc3RlcignY3JlYXRlTGl2ZWNoYXRDYWxsJywgZnVuY3Rpb24obWVzc2FnZSwgcGFyYW1zLCBpbnN0YW5jZSkge1xuXHRpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG5cdFx0aW5zdGFuY2UudGFiQmFyLm9wZW4oJ3ZpZGVvJyk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LmFjdGlvbkxpbmtzLnJlZ2lzdGVyKCdkZW55TGl2ZWNoYXRDYWxsJywgZnVuY3Rpb24obWVzc2FnZS8qLCBwYXJhbXMqLykge1xuXHRpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdjb21tYW5kJywgbWVzc2FnZS5yaWQsICdlbmRDYWxsJywgdXNlcik7XG5cdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVJvb20obWVzc2FnZS5yaWQsICdkZWxldGVNZXNzYWdlJywgeyBfaWQ6IG1lc3NhZ2UuX2lkIH0pO1xuXG5cdFx0Y29uc3QgbGFuZ3VhZ2UgPSB1c2VyLmxhbmd1YWdlIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbic7XG5cblx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LmNsb3NlUm9vbSh7XG5cdFx0XHR1c2VyLFxuXHRcdFx0cm9vbTogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQobWVzc2FnZS5yaWQpLFxuXHRcdFx0Y29tbWVudDogVEFQaTE4bi5fXygnVmlkZW9jYWxsX2RlY2xpbmVkJywgeyBsbmc6IGxhbmd1YWdlIH0pXG5cdFx0fSk7XG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldEhpZGRlbkJ5SWQobWVzc2FnZS5faWQpO1xuXHRcdH0pO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgb3BlblJvb20sIExpdmVjaGF0SW5xdWlyeSAqL1xuaW1wb3J0IHtSb29tU2V0dGluZ3NFbnVtLCBSb29tVHlwZUNvbmZpZywgUm9vbVR5cGVSb3V0ZUNvbmZpZywgVWlUZXh0Q29udGV4dH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuY2xhc3MgTGl2ZWNoYXRSb29tUm91dGUgZXh0ZW5kcyBSb29tVHlwZVJvdXRlQ29uZmlnIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoe1xuXHRcdFx0bmFtZTogJ2xpdmUnLFxuXHRcdFx0cGF0aDogJy9saXZlLzppZCdcblx0XHR9KTtcblx0fVxuXG5cdGFjdGlvbihwYXJhbXMpIHtcblx0XHRvcGVuUm9vbSgnbCcsIHBhcmFtcy5pZCk7XG5cdH1cblxuXHRsaW5rKHN1Yikge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogc3ViLnJpZFxuXHRcdH07XG5cdH1cbn1cblxuY2xhc3MgTGl2ZWNoYXRSb29tVHlwZSBleHRlbmRzIFJvb21UeXBlQ29uZmlnIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoe1xuXHRcdFx0aWRlbnRpZmllcjogJ2wnLFxuXHRcdFx0b3JkZXI6IDUsXG5cdFx0XHRpY29uOiAnbGl2ZWNoYXQnLFxuXHRcdFx0bGFiZWw6ICdMaXZlY2hhdCcsXG5cdFx0XHRyb3V0ZTogbmV3IExpdmVjaGF0Um9vbVJvdXRlKClcblx0XHR9KTtcblxuXHRcdHRoaXMubm90U3Vic2NyaWJlZFRwbCA9IHtcblx0XHRcdHRlbXBsYXRlOiAnbGl2ZWNoYXROb3RTdWJzY3JpYmVkJ1xuXHRcdH07XG5cdH1cblxuXHRmaW5kUm9vbShpZGVudGlmaWVyKSB7XG5cdFx0cmV0dXJuIENoYXRSb29tLmZpbmRPbmUoe19pZDogaWRlbnRpZmllcn0pO1xuXHR9XG5cblx0cm9vbU5hbWUocm9vbURhdGEpIHtcblx0XHRyZXR1cm4gcm9vbURhdGEubmFtZSB8fCByb29tRGF0YS5mbmFtZSB8fCByb29tRGF0YS5sYWJlbDtcblx0fVxuXG5cdGNvbmRpdGlvbigpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2VuYWJsZWQnKSAmJiBSb2NrZXRDaGF0LmF1dGh6Lmhhc0FsbFBlcm1pc3Npb24oJ3ZpZXctbC1yb29tJyk7XG5cdH1cblxuXHRjYW5TZW5kTWVzc2FnZShyb29tSWQpIHtcblx0XHRjb25zdCByb29tID0gQ2hhdFJvb20uZmluZE9uZSh7X2lkOiByb29tSWR9LCB7ZmllbGRzOiB7b3BlbjogMX19KTtcblx0XHRyZXR1cm4gcm9vbSAmJiByb29tLm9wZW4gPT09IHRydWU7XG5cdH1cblxuXHRnZXRVc2VyU3RhdHVzKHJvb21JZCkge1xuXHRcdGNvbnN0IHJvb20gPSBTZXNzaW9uLmdldChgcm9vbURhdGEkeyByb29tSWQgfWApO1xuXHRcdGlmIChyb29tKSB7XG5cdFx0XHRyZXR1cm4gcm9vbS52ICYmIHJvb20udi5zdGF0dXM7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaW5xdWlyeSA9IExpdmVjaGF0SW5xdWlyeS5maW5kT25lKHsgcmlkOiByb29tSWQgfSk7XG5cdFx0cmV0dXJuIGlucXVpcnkgJiYgaW5xdWlyeS52ICYmIGlucXVpcnkudi5zdGF0dXM7XG5cdH1cblxuXHRhbGxvd1Jvb21TZXR0aW5nQ2hhbmdlKHJvb20sIHNldHRpbmcpIHtcblx0XHRzd2l0Y2ggKHNldHRpbmcpIHtcblx0XHRcdGNhc2UgUm9vbVNldHRpbmdzRW51bS5KT0lOX0NPREU6XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdGdldFVpVGV4dChjb250ZXh0KSB7XG5cdFx0c3dpdGNoIChjb250ZXh0KSB7XG5cdFx0XHRjYXNlIFVpVGV4dENvbnRleHQuSElERV9XQVJOSU5HOlxuXHRcdFx0XHRyZXR1cm4gJ0hpZGVfTGl2ZWNoYXRfV2FybmluZyc7XG5cdFx0XHRjYXNlIFVpVGV4dENvbnRleHQuTEVBVkVfV0FSTklORzpcblx0XHRcdFx0cmV0dXJuICdIaWRlX0xpdmVjaGF0X1dhcm5pbmcnO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdH1cblx0fVxufVxuXG5Sb2NrZXRDaGF0LnJvb21UeXBlcy5hZGQobmV3IExpdmVjaGF0Um9vbVR5cGUoKSk7XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnTGl2ZWNoYXQnKTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfZW5hYmxlZCcsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSB9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfdGl0bGUnLCAnUm9ja2V0LkNoYXQnLCB7IHR5cGU6ICdzdHJpbmcnLCBncm91cDogJ0xpdmVjaGF0JywgcHVibGljOiB0cnVlIH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfdGl0bGVfY29sb3InLCAnI0MxMjcyRCcsIHtcblx0XHR0eXBlOiAnY29sb3InLFxuXHRcdGVkaXRvcjogJ2NvbG9yJyxcblx0XHRhbGxvd2VkVHlwZXM6IFsnY29sb3InLCAnZXhwcmVzc2lvbiddLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfZGlzcGxheV9vZmZsaW5lX2Zvcm0nLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZScsXG5cdFx0aTE4bkxhYmVsOiAnRGlzcGxheV9vZmZsaW5lX2Zvcm0nXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF92YWxpZGF0ZV9vZmZsaW5lX2VtYWlsJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ1ZhbGlkYXRlX2VtYWlsX2FkZHJlc3MnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGUnLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZScsXG5cdFx0aTE4bkxhYmVsOiAnT2ZmbGluZV9mb3JtX3VuYXZhaWxhYmxlX21lc3NhZ2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlJywgJ0xlYXZlIGEgbWVzc2FnZScsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ1RpdGxlJ1xuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3InLCAnIzY2NjY2NicsIHtcblx0XHR0eXBlOiAnY29sb3InLFxuXHRcdGVkaXRvcjogJ2NvbG9yJyxcblx0XHRhbGxvd2VkVHlwZXM6IFsnY29sb3InLCAnZXhwcmVzc2lvbiddLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZScsXG5cdFx0aTE4bkxhYmVsOiAnQ29sb3InXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfb2ZmbGluZV9tZXNzYWdlJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ0luc3RydWN0aW9ucycsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnSW5zdHJ1Y3Rpb25zX3RvX3lvdXJfdmlzaXRvcl9maWxsX3RoZV9mb3JtX3RvX3NlbmRfYV9tZXNzYWdlJ1xuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X29mZmxpbmVfZW1haWwnLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdGkxOG5MYWJlbDogJ0VtYWlsX2FkZHJlc3NfdG9fc2VuZF9vZmZsaW5lX21lc3NhZ2VzJyxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZSdcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vZmZsaW5lX3N1Y2Nlc3NfbWVzc2FnZScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdHNlY3Rpb246ICdPZmZsaW5lJyxcblx0XHRpMThuTGFiZWw6ICdPZmZsaW5lX3N1Y2Nlc3NfbWVzc2FnZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2FsbG93X3N3aXRjaGluZ19kZXBhcnRtZW50cycsIHRydWUsIHsgdHlwZTogJ2Jvb2xlYW4nLCBncm91cDogJ0xpdmVjaGF0JywgcHVibGljOiB0cnVlLCBpMThuTGFiZWw6ICdBbGxvd19zd2l0Y2hpbmdfZGVwYXJ0bWVudHMnIH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfc2hvd19hZ2VudF9lbWFpbCcsIHRydWUsIHsgdHlwZTogJ2Jvb2xlYW4nLCBncm91cDogJ0xpdmVjaGF0JywgcHVibGljOiB0cnVlLCBpMThuTGFiZWw6ICdTaG93X2FnZW50X2VtYWlsJyB9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfY29udmVyc2F0aW9uX2ZpbmlzaGVkX21lc3NhZ2UnLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdDb252ZXJzYXRpb25fZmluaXNoZWRfbWVzc2FnZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3JlZ2lzdHJhdGlvbl9mb3JtJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnU2hvd19wcmVyZWdpc3RyYXRpb25fZm9ybSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X25hbWVfZmllbGRfcmVnaXN0cmF0aW9uX2Zvcm0nLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdTaG93X25hbWVfZmllbGQnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9lbWFpbF9maWVsZF9yZWdpc3RyYXRpb25fZm9ybScsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1Nob3dfZW1haWxfZmllbGQnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9ndWVzdF9jb3VudCcsIDEsIHsgdHlwZTogJ2ludCcsIGdyb3VwOiAnTGl2ZWNoYXQnIH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9Sb29tX0NvdW50JywgMSwge1xuXHRcdHR5cGU6ICdpbnQnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdGkxOG5MYWJlbDogJ0xpdmVjaGF0X3Jvb21fY291bnQnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb24nLCAnbm9uZScsIHtcblx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHR2YWx1ZXM6IFtcblx0XHRcdHsga2V5OiAnbm9uZScsIGkxOG5MYWJlbDogJ05vbmUnIH0sXG5cdFx0XHR7IGtleTogJ2ZvcndhcmQnLCBpMThuTGFiZWw6ICdGb3J3YXJkJyB9LFxuXHRcdFx0eyBrZXk6ICdjbG9zZScsIGkxOG5MYWJlbDogJ0Nsb3NlJyB9XG5cdFx0XSxcblx0XHRpMThuTGFiZWw6ICdIb3dfdG9faGFuZGxlX29wZW5fc2Vzc2lvbnNfd2hlbl9hZ2VudF9nb2VzX29mZmxpbmUnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb25fdGltZW91dCcsIDYwLCB7XG5cdFx0dHlwZTogJ2ludCcsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uJywgdmFsdWU6IHsgJG5lOiAnbm9uZScgfSB9LFxuXHRcdGkxOG5MYWJlbDogJ0hvd19sb25nX3RvX3dhaXRfYWZ0ZXJfYWdlbnRfZ29lc19vZmZsaW5lJyxcblx0XHRpMThuRGVzY3JpcHRpb246ICdUaW1lX2luX3NlY29uZHMnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9jb21tZW50JywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb24nLCB2YWx1ZTogJ2Nsb3NlJyB9LFxuXHRcdGkxOG5MYWJlbDogJ0NvbW1lbnRfdG9fbGVhdmVfb25fY2xvc2luZ19zZXNzaW9uJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfd2ViaG9va1VybCcsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnV2ViaG9va19VUkwnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9zZWNyZXRfdG9rZW4nLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1NlY3JldF90b2tlbidcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZW5kX3JlcXVlc3Rfb25fY2hhdF9jbG9zZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fb2ZmbGluZV9tc2cnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZW5kX3JlcXVlc3Rfb25fb2ZmbGluZV9tZXNzYWdlcydcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fdmlzaXRvcl9tZXNzYWdlJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnU2VuZF9yZXF1ZXN0X29uX3Zpc2l0b3JfbWVzc2FnZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fYWdlbnRfbWVzc2FnZScsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1NlbmRfcmVxdWVzdF9vbl9hZ2VudF9tZXNzYWdlJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnU2VuZF92aXNpdG9yX25hdmlnYXRpb25faGlzdG9yeV9saXZlY2hhdF93ZWJob29rX3JlcXVlc3QnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZW5kX3Zpc2l0b3JfbmF2aWdhdGlvbl9oaXN0b3J5X29uX3JlcXVlc3QnLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0ZlYXR1cmVfRGVwZW5kc19vbl9MaXZlY2hhdF9WaXNpdG9yX25hdmlnYXRpb25fYXNfYV9tZXNzYWdlX3RvX2JlX2VuYWJsZWQnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1Zpc2l0b3JfbmF2aWdhdGlvbl9hc19hX21lc3NhZ2UnLCB2YWx1ZTogdHJ1ZSB9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF93ZWJob29rX29uX2NhcHR1cmUnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZW5kX3JlcXVlc3Rfb25fbGVhZF9jYXB0dXJlJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfbGVhZF9lbWFpbF9yZWdleCcsICdcXFxcYltBLVowLTkuXyUrLV0rQCg/OltBLVowLTktXStcXFxcLikrW0EtWl17Miw0fVxcXFxiJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ0xlYWRfY2FwdHVyZV9lbWFpbF9yZWdleCdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2xlYWRfcGhvbmVfcmVnZXgnLCAnKCg/OlxcXFwoWzAtOV17MSwzfVxcXFwpfFswLTldezJ9KVsgXFxcXC1dKj9bMC05XXs0LDV9KD86W1xcXFwtXFxcXHNcXFxcX117MSwyfSk/WzAtOV17NH0oPzooPz1bXjAtOV0pfCQpfFswLTldezQsNX0oPzpbXFxcXC1cXFxcc1xcXFxfXXsxLDJ9KT9bMC05XXs0fSg/Oig/PVteMC05XSl8JCkpJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ0xlYWRfY2FwdHVyZV9waG9uZV9yZWdleCdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X0tub3dsZWRnZV9FbmFibGVkJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0tub3dsZWRnZV9CYXNlJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnRW5hYmxlZCdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X0tub3dsZWRnZV9BcGlhaV9LZXknLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdLbm93bGVkZ2VfQmFzZScsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ0FwaWFpX0tleSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X0tub3dsZWRnZV9BcGlhaV9MYW5ndWFnZScsICdlbicsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnS25vd2xlZGdlX0Jhc2UnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdBcGlhaV9MYW5ndWFnZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2hpc3RvcnlfbW9uaXRvcl90eXBlJywgJ3VybCcsIHtcblx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRpMThuTGFiZWw6ICdNb25pdG9yX2hpc3RvcnlfZm9yX2NoYW5nZXNfb24nLFxuXHRcdHZhbHVlczogW1xuXHRcdFx0eyBrZXk6ICd1cmwnLCBpMThuTGFiZWw6ICdQYWdlX1VSTCcgfSxcblx0XHRcdHsga2V5OiAndGl0bGUnLCBpMThuTGFiZWw6ICdQYWdlX3RpdGxlJyB9XG5cdFx0XVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfVmlzaXRvcl9uYXZpZ2F0aW9uX2FzX2FfbWVzc2FnZScsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdTZW5kX1Zpc2l0b3JfbmF2aWdhdGlvbl9oaXN0b3J5X2FzX2FfbWVzc2FnZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2VuYWJsZV9vZmZpY2VfaG91cnMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnT2ZmaWNlX2hvdXJzX2VuYWJsZWQnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9jb250aW51b3VzX3NvdW5kX25vdGlmaWNhdGlvbl9uZXdfbGl2ZWNoYXRfcm9vbScsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdDb250aW51b3VzX3NvdW5kX25vdGlmaWNhdGlvbnNfZm9yX25ld19saXZlY2hhdF9yb29tJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfdmlkZW9jYWxsX2VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnVmlkZW9jYWxsX2VuYWJsZWQnLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0JldGFfZmVhdHVyZV9EZXBlbmRzX29uX1ZpZGVvX0NvbmZlcmVuY2VfdG9fYmVfZW5hYmxlZCcsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnSml0c2lfRW5hYmxlZCcsIHZhbHVlOiB0cnVlIH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2VuYWJsZV90cmFuc2NyaXB0JywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1RyYW5zY3JpcHRfRW5hYmxlZCdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3RyYW5zY3JpcHRfbWVzc2FnZScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1RyYW5zY3JpcHRfbWVzc2FnZScsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfZW5hYmxlX3RyYW5zY3JpcHQnLCB2YWx1ZTogdHJ1ZSB9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vcGVuX2lucXVpZXJ5X3Nob3dfY29ubmVjdGluZycsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdMaXZlY2hhdF9vcGVuX2lucXVpZXJ5X3Nob3dfY29ubmVjdGluZycsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnLCB2YWx1ZTogJ0d1ZXN0X1Bvb2wnIH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X0FsbG93ZWREb21haW5zTGlzdCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ0xpdmVjaGF0X0FsbG93ZWREb21haW5zTGlzdCcsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRG9tYWluc19hbGxvd2VkX3RvX2VtYmVkX3RoZV9saXZlY2hhdF93aWRnZXQnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0ZhY2Vib29rJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0ZhY2Vib29rJyxcblx0XHRpMThuRGVzY3JpcHRpb246ICdJZl95b3VfZG9udF9oYXZlX29uZV9zZW5kX2FuX2VtYWlsX3RvX29tbmlfcm9ja2V0Y2hhdF90b19nZXRfeW91cnMnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9GYWNlYm9va19BUElfU2VjcmV0JywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnRmFjZWJvb2snLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0lmX3lvdV9kb250X2hhdmVfb25lX3NlbmRfYW5fZW1haWxfdG9fb21uaV9yb2NrZXRjaGF0X3RvX2dldF95b3Vycydcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X1JEU3RhdGlvbl9Ub2tlbicsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiBmYWxzZSxcblx0XHRzZWN0aW9uOiAnUkQgU3RhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnUkRTdGF0aW9uX1Rva2VuJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnLCAnTGVhc3RfQW1vdW50Jywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0dmFsdWVzOiBbXG5cdFx0XHR7a2V5OiAnRXh0ZXJuYWwnLCBpMThuTGFiZWw6ICdFeHRlcm5hbF9TZXJ2aWNlJ30sXG5cdFx0XHR7a2V5OiAnTGVhc3RfQW1vdW50JywgaTE4bkxhYmVsOiAnTGVhc3RfQW1vdW50J30sXG5cdFx0XHR7a2V5OiAnR3Vlc3RfUG9vbCcsIGkxOG5MYWJlbDogJ0d1ZXN0X1Bvb2wnfVxuXHRcdF1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2d1ZXN0X3Bvb2xfd2l0aF9ub19hZ2VudHMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0aTE4bkxhYmVsOiAnQWNjZXB0X3dpdGhfbm9fb25saW5lX2FnZW50cycsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnQWNjZXB0X2luY29taW5nX2xpdmVjaGF0X3JlcXVlc3RzX2V2ZW5faWZfdGhlcmVfYXJlX25vX29ubGluZV9hZ2VudHMnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6ICdHdWVzdF9Qb29sJyB9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9zaG93X3F1ZXVlX2xpc3RfbGluaycsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0aTE4bkxhYmVsOiAnU2hvd19xdWV1ZV9saXN0X3RvX2FsbF9hZ2VudHMnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6IHsgJG5lOiAnRXh0ZXJuYWwnIH0gfVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRXh0ZXJuYWxfUXVldWVfVVJMJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IGZhbHNlLFxuXHRcdHNlY3Rpb246ICdSb3V0aW5nJyxcblx0XHRpMThuTGFiZWw6ICdFeHRlcm5hbF9RdWV1ZV9TZXJ2aWNlX1VSTCcsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRm9yX21vcmVfZGV0YWlsc19wbGVhc2VfY2hlY2tfb3VyX2RvY3MnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6ICdFeHRlcm5hbCcgfVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRXh0ZXJuYWxfUXVldWVfVG9rZW4nLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogZmFsc2UsXG5cdFx0c2VjdGlvbjogJ1JvdXRpbmcnLFxuXHRcdGkxOG5MYWJlbDogJ1NlY3JldF90b2tlbicsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnLCB2YWx1ZTogJ0V4dGVybmFsJyB9XG5cdH0pO1xufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvZGVwYXJ0bWVudCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRkZXBhcnRtZW50czogUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmQoKS5mZXRjaCgpXG5cdFx0fSk7XG5cdH0sXG5cdHBvc3QoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdFx0ZGVwYXJ0bWVudDogT2JqZWN0LFxuXHRcdFx0XHRhZ2VudHM6IEFycmF5XG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgZGVwYXJ0bWVudCA9IFJvY2tldENoYXQuTGl2ZWNoYXQuc2F2ZURlcGFydG1lbnQobnVsbCwgdGhpcy5ib2R5UGFyYW1zLmRlcGFydG1lbnQsIHRoaXMuYm9keVBhcmFtcy5hZ2VudHMpO1xuXG5cdFx0XHRpZiAoZGVwYXJ0bWVudCkge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0ZGVwYXJ0bWVudCxcblx0XHRcdFx0XHRhZ2VudHM6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kKHsgZGVwYXJ0bWVudElkOiBkZXBhcnRtZW50Ll9pZCB9KS5mZXRjaCgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZSk7XG5cdFx0fVxuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L2RlcGFydG1lbnQvOl9pZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy51cmxQYXJhbXMsIHtcblx0XHRcdFx0X2lkOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdGRlcGFydG1lbnQ6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kT25lQnlJZCh0aGlzLnVybFBhcmFtcy5faWQpLFxuXHRcdFx0XHRhZ2VudHM6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kKHsgZGVwYXJ0bWVudElkOiB0aGlzLnVybFBhcmFtcy5faWQgfSkuZmV0Y2goKVxuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5lcnJvcik7XG5cdFx0fVxuXHR9LFxuXHRwdXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHRfaWQ6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0XHRkZXBhcnRtZW50OiBPYmplY3QsXG5cdFx0XHRcdGFnZW50czogQXJyYXlcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5MaXZlY2hhdC5zYXZlRGVwYXJ0bWVudCh0aGlzLnVybFBhcmFtcy5faWQsIHRoaXMuYm9keVBhcmFtcy5kZXBhcnRtZW50LCB0aGlzLmJvZHlQYXJhbXMuYWdlbnRzKSkge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0ZGVwYXJ0bWVudDogUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLl9pZCksXG5cdFx0XHRcdFx0YWdlbnRzOiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZmluZCh7IGRlcGFydG1lbnRJZDogdGhpcy51cmxQYXJhbXMuX2lkIH0pLmZldGNoKClcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5lcnJvcik7XG5cdFx0fVxuXHR9LFxuXHRkZWxldGUoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHRfaWQ6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZURlcGFydG1lbnQodGhpcy51cmxQYXJhbXMuX2lkKSkge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uLy4uLy4uL3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbi8qKlxuICogQGFwaSB7cG9zdH0gL2xpdmVjaGF0L2ZhY2Vib29rIFNlbmQgRmFjZWJvb2sgbWVzc2FnZVxuICogQGFwaU5hbWUgRmFjZWJvb2tcbiAqIEBhcGlHcm91cCBMaXZlY2hhdFxuICpcbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSBtaWQgRmFjZWJvb2sgbWVzc2FnZSBpZFxuICogQGFwaVBhcmFtIHtTdHJpbmd9IHBhZ2UgRmFjZWJvb2sgcGFnZXMgaWRcbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSB0b2tlbiBGYWNlYm9vayB1c2VyJ3MgdG9rZW5cbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSBmaXJzdF9uYW1lIEZhY2Vib29rIHVzZXIncyBmaXJzdCBuYW1lXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gbGFzdF9uYW1lIEZhY2Vib29rIHVzZXIncyBsYXN0IG5hbWVcbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSBbdGV4dF0gRmFjZWJvb2sgbWVzc2FnZSB0ZXh0XG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gW2F0dGFjaG1lbnRzXSBGYWNlYm9vayBtZXNzYWdlIGF0dGFjaG1lbnRzXG4gKi9cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC9mYWNlYm9vaycsIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy50ZXh0ICYmICF0aGlzLmJvZHlQYXJhbXMuYXR0YWNobWVudHMpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtaHViLXNpZ25hdHVyZSddKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJykpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogJ0ludGVncmF0aW9uIGRpc2FibGVkJ1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLyB2YWxpZGF0ZSBpZiByZXF1ZXN0IGNvbWUgZnJvbSBvbW5pXG5cdFx0Y29uc3Qgc2lnbmF0dXJlID0gY3J5cHRvLmNyZWF0ZUhtYWMoJ3NoYTEnLCBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX1NlY3JldCcpKS51cGRhdGUoSlNPTi5zdHJpbmdpZnkodGhpcy5yZXF1ZXN0LmJvZHkpKS5kaWdlc3QoJ2hleCcpO1xuXHRcdGlmICh0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1odWItc2lnbmF0dXJlJ10gIT09IGBzaGExPSR7IHNpZ25hdHVyZSB9YCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdGVycm9yOiAnSW52YWxpZCBzaWduYXR1cmUnXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGNvbnN0IHNlbmRNZXNzYWdlID0ge1xuXHRcdFx0bWVzc2FnZToge1xuXHRcdFx0XHRfaWQ6IHRoaXMuYm9keVBhcmFtcy5taWRcblx0XHRcdH0sXG5cdFx0XHRyb29tSW5mbzoge1xuXHRcdFx0XHRmYWNlYm9vazoge1xuXHRcdFx0XHRcdHBhZ2U6IHRoaXMuYm9keVBhcmFtcy5wYWdlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdGxldCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0aGlzLmJvZHlQYXJhbXMudG9rZW4pO1xuXHRcdGlmICh2aXNpdG9yKSB7XG5cdFx0XHRjb25zdCByb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odmlzaXRvci50b2tlbikuZmV0Y2goKTtcblx0XHRcdGlmIChyb29tcyAmJiByb29tcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UucmlkID0gcm9vbXNbMF0uX2lkO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5yaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdH1cblx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4gPSB2aXNpdG9yLnRva2VuO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnJpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiA9IHRoaXMuYm9keVBhcmFtcy50b2tlbjtcblxuXHRcdFx0Y29uc3QgdXNlcklkID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZWdpc3Rlckd1ZXN0KHtcblx0XHRcdFx0dG9rZW46IHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4sXG5cdFx0XHRcdG5hbWU6IGAkeyB0aGlzLmJvZHlQYXJhbXMuZmlyc3RfbmFtZSB9ICR7IHRoaXMuYm9keVBhcmFtcy5sYXN0X25hbWUgfWBcblx0XHRcdH0pO1xuXG5cdFx0XHR2aXNpdG9yID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblx0XHR9XG5cblx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLm1zZyA9IHRoaXMuYm9keVBhcmFtcy50ZXh0O1xuXHRcdHNlbmRNZXNzYWdlLmd1ZXN0ID0gdmlzaXRvcjtcblxuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNlc3M6IHRydWUsXG5cdFx0XHRcdG1lc3NhZ2U6IFJvY2tldENoYXQuTGl2ZWNoYXQuc2VuZE1lc3NhZ2Uoc2VuZE1lc3NhZ2UpXG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHVzaW5nIEZhY2Vib29rIC0+JywgZSk7XG5cdFx0fVxuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uLy4uLy4uL3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC9tZXNzYWdlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudmlzaXRvcikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW0gXCJ2aXNpdG9yXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudmlzaXRvci50b2tlbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW0gXCJ2aXNpdG9yLnRva2VuXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZXMpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwibWVzc2FnZXNcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblx0XHRpZiAoISh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwibWVzc2FnZXNcIiBpcyBub3QgYW4gYXJyYXknKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwibWVzc2FnZXNcIiBpcyBlbXB0eScpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZpc2l0b3JUb2tlbiA9IHRoaXMuYm9keVBhcmFtcy52aXNpdG9yLnRva2VuO1xuXG5cdFx0bGV0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHZpc2l0b3JUb2tlbik7XG5cdFx0bGV0IHJpZDtcblx0XHRpZiAodmlzaXRvcikge1xuXHRcdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuKHZpc2l0b3JUb2tlbikuZmV0Y2goKTtcblx0XHRcdGlmIChyb29tcyAmJiByb29tcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdHJpZCA9IHJvb21zWzBdLl9pZDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdGNvbnN0IHZpc2l0b3JJZCA9IFJvY2tldENoYXQuTGl2ZWNoYXQucmVnaXN0ZXJHdWVzdCh0aGlzLmJvZHlQYXJhbXMudmlzaXRvcik7XG5cdFx0XHR2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lQnlJZCh2aXNpdG9ySWQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHNlbnRNZXNzYWdlcyA9IHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlcy5tYXAoKG1lc3NhZ2UpID0+IHtcblx0XHRcdGNvbnN0IHNlbmRNZXNzYWdlID0ge1xuXHRcdFx0XHRndWVzdDogdmlzaXRvcixcblx0XHRcdFx0bWVzc2FnZToge1xuXHRcdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdFx0cmlkLFxuXHRcdFx0XHRcdHRva2VuOiB2aXNpdG9yVG9rZW4sXG5cdFx0XHRcdFx0bXNnOiBtZXNzYWdlLm1zZ1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0Y29uc3Qgc2VudE1lc3NhZ2UgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRNZXNzYWdlKHNlbmRNZXNzYWdlKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVzZXJuYW1lOiBzZW50TWVzc2FnZS51LnVzZXJuYW1lLFxuXHRcdFx0XHRtc2c6IHNlbnRNZXNzYWdlLm1zZyxcblx0XHRcdFx0dHM6IHNlbnRNZXNzYWdlLnRzXG5cdFx0XHR9O1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZXM6IHNlbnRNZXNzYWdlc1xuXHRcdH0pO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uLy4uLy4uL3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC9zbXMtaW5jb21pbmcvOnNlcnZpY2UnLCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgU01TU2VydmljZSA9IFJvY2tldENoYXQuU01TLmdldFNlcnZpY2UodGhpcy51cmxQYXJhbXMuc2VydmljZSk7XG5cblx0XHRjb25zdCBzbXMgPSBTTVNTZXJ2aWNlLnBhcnNlKHRoaXMuYm9keVBhcmFtcyk7XG5cblx0XHRsZXQgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZmluZE9uZVZpc2l0b3JCeVBob25lKHNtcy5mcm9tKTtcblxuXHRcdGNvbnN0IHNlbmRNZXNzYWdlID0ge1xuXHRcdFx0bWVzc2FnZToge1xuXHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpXG5cdFx0XHR9LFxuXHRcdFx0cm9vbUluZm86IHtcblx0XHRcdFx0c21zOiB7XG5cdFx0XHRcdFx0ZnJvbTogc21zLnRvXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKHZpc2l0b3IpIHtcblx0XHRcdGNvbnN0IHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeVZpc2l0b3JUb2tlbih2aXNpdG9yLnRva2VuKS5mZXRjaCgpO1xuXG5cdFx0XHRpZiAocm9vbXMgJiYgcm9vbXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnJpZCA9IHJvb21zWzBdLl9pZDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UucmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHR9XG5cdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuID0gdmlzaXRvci50b2tlbjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5yaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4gPSBSYW5kb20uaWQoKTtcblxuXHRcdFx0Y29uc3QgdmlzaXRvcklkID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZWdpc3Rlckd1ZXN0KHtcblx0XHRcdFx0dXNlcm5hbWU6IHNtcy5mcm9tLnJlcGxhY2UoL1teMC05XS9nLCAnJyksXG5cdFx0XHRcdHRva2VuOiBzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuLFxuXHRcdFx0XHRwaG9uZToge1xuXHRcdFx0XHRcdG51bWJlcjogc21zLmZyb21cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmZpbmRPbmVCeUlkKHZpc2l0b3JJZCk7XG5cdFx0fVxuXG5cdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5tc2cgPSBzbXMuYm9keTtcblx0XHRzZW5kTWVzc2FnZS5ndWVzdCA9IHZpc2l0b3I7XG5cblx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLmF0dGFjaG1lbnRzID0gc21zLm1lZGlhLm1hcChjdXJyID0+IHtcblx0XHRcdGNvbnN0IGF0dGFjaG1lbnQgPSB7XG5cdFx0XHRcdG1lc3NhZ2VfbGluazogY3Vyci51cmxcblx0XHRcdH07XG5cblx0XHRcdGNvbnN0IGNvbnRlbnRUeXBlID0gY3Vyci5jb250ZW50VHlwZTtcblx0XHRcdHN3aXRjaCAoY29udGVudFR5cGUuc3Vic3RyKDAsIGNvbnRlbnRUeXBlLmluZGV4T2YoJy8nKSkpIHtcblx0XHRcdFx0Y2FzZSAnaW1hZ2UnOlxuXHRcdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfdXJsID0gY3Vyci51cmw7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3ZpZGVvJzpcblx0XHRcdFx0XHRhdHRhY2htZW50LnZpZGVvX3VybCA9IGN1cnIudXJsO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdhdWRpbyc6XG5cdFx0XHRcdFx0YXR0YWNobWVudC5hdWRpb191cmwgPSBjdXJyLnVybDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGF0dGFjaG1lbnQ7XG5cdFx0fSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgbWVzc2FnZSA9IFNNU1NlcnZpY2UucmVzcG9uc2UuY2FsbCh0aGlzLCBSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRNZXNzYWdlKHNlbmRNZXNzYWdlKSk7XG5cblx0XHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRcdGlmIChzbXMuZXh0cmEpIHtcblx0XHRcdFx0XHRpZiAoc21zLmV4dHJhLmZyb21Db3VudHJ5KSB7XG5cdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnbGl2ZWNoYXQ6c2V0Q3VzdG9tRmllbGQnLCBzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuLCAnY291bnRyeScsIHNtcy5leHRyYS5mcm9tQ291bnRyeSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzbXMuZXh0cmEuZnJvbVN0YXRlKSB7XG5cdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnbGl2ZWNoYXQ6c2V0Q3VzdG9tRmllbGQnLCBzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuLCAnc3RhdGUnLCBzbXMuZXh0cmEuZnJvbVN0YXRlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHNtcy5leHRyYS5mcm9tQ2l0eSkge1xuXHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2xpdmVjaGF0OnNldEN1c3RvbUZpZWxkJywgc2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiwgJ2NpdHknLCBzbXMuZXh0cmEuZnJvbUNpdHkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBtZXNzYWdlO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBTTVNTZXJ2aWNlLmVycm9yLmNhbGwodGhpcywgZSk7XG5cdFx0fVxuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvdXNlcnMvOnR5cGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNoZWNrKHRoaXMudXJsUGFyYW1zLCB7XG5cdFx0XHRcdHR5cGU6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGxldCByb2xlO1xuXHRcdFx0aWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdhZ2VudCcpIHtcblx0XHRcdFx0cm9sZSA9ICdsaXZlY2hhdC1hZ2VudCc7XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdtYW5hZ2VyJykge1xuXHRcdFx0XHRyb2xlID0gJ2xpdmVjaGF0LW1hbmFnZXInO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgJ0ludmFsaWQgdHlwZSc7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHVzZXJzID0gUm9ja2V0Q2hhdC5hdXRoei5nZXRVc2Vyc0luUm9sZShyb2xlKTtcblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHR1c2VyczogdXNlcnMuZmV0Y2goKS5tYXAodXNlciA9PiBfLnBpY2sodXNlciwgJ19pZCcsICd1c2VybmFtZScsICduYW1lJywgJ3N0YXR1cycsICdzdGF0dXNMaXZlY2hhdCcpKVxuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5lcnJvcik7XG5cdFx0fVxuXHR9LFxuXHRwb3N0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cdFx0dHJ5IHtcblx0XHRcdGNoZWNrKHRoaXMudXJsUGFyYW1zLCB7XG5cdFx0XHRcdHR5cGU6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0XHR1c2VybmFtZTogU3RyaW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdhZ2VudCcpIHtcblx0XHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQuTGl2ZWNoYXQuYWRkQWdlbnQodGhpcy5ib2R5UGFyYW1zLnVzZXJuYW1lKTtcblx0XHRcdFx0aWYgKHVzZXIpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXIgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAodGhpcy51cmxQYXJhbXMudHlwZSA9PT0gJ21hbmFnZXInKSB7XG5cdFx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmFkZE1hbmFnZXIodGhpcy5ib2R5UGFyYW1zLnVzZXJuYW1lKTtcblx0XHRcdFx0aWYgKHVzZXIpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXIgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93ICdJbnZhbGlkIHR5cGUnO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC91c2Vycy86dHlwZS86X2lkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHRcdF9pZDogU3RyaW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLl9pZCk7XG5cblx0XHRcdGlmICghdXNlcikge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVXNlciBub3QgZm91bmQnKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IHJvbGU7XG5cblx0XHRcdGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnYWdlbnQnKSB7XG5cdFx0XHRcdHJvbGUgPSAnbGl2ZWNoYXQtYWdlbnQnO1xuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnbWFuYWdlcicpIHtcblx0XHRcdFx0cm9sZSA9ICdsaXZlY2hhdC1tYW5hZ2VyJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93ICdJbnZhbGlkIHR5cGUnO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodXNlci5yb2xlcy5pbmRleE9mKHJvbGUpICE9PSAtMSkge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0dXNlcjogXy5waWNrKHVzZXIsICdfaWQnLCAndXNlcm5hbWUnKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHR1c2VyOiBudWxsXG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLmVycm9yKTtcblx0XHR9XG5cdH0sXG5cdGRlbGV0ZSgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNoZWNrKHRoaXMudXJsUGFyYW1zLCB7XG5cdFx0XHRcdHR5cGU6IFN0cmluZyxcblx0XHRcdFx0X2lkOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuX2lkKTtcblxuXHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnYWdlbnQnKSB7XG5cdFx0XHRcdGlmIChSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZUFnZW50KHVzZXIudXNlcm5hbWUpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnbWFuYWdlcicpIHtcblx0XHRcdFx0aWYgKFJvY2tldENoYXQuTGl2ZWNoYXQucmVtb3ZlTWFuYWdlcih1c2VyLnVzZXJuYW1lKSkge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93ICdJbnZhbGlkIHR5cGUnO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi8uLi8uLi9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvdmlzaXRvci86dmlzaXRvclRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRoaXMudXJsUGFyYW1zLnZpc2l0b3JUb2tlbik7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModmlzaXRvcik7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvdmlzaXRvci86dmlzaXRvclRva2VuL3Jvb20nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuKHRoaXMudXJsUGFyYW1zLnZpc2l0b3JUb2tlbiwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdG5hbWU6IDEsXG5cdFx0XHRcdHQ6IDEsXG5cdFx0XHRcdGNsOiAxLFxuXHRcdFx0XHR1OiAxLFxuXHRcdFx0XHR1c2VybmFtZXM6IDEsXG5cdFx0XHRcdHNlcnZlZEJ5OiAxXG5cdFx0XHR9XG5cdFx0fSkuZmV0Y2goKTtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHJvb21zIH0pO1xuXHR9XG59KTtcbiJdfQ==
