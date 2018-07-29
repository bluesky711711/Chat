var require = meteorInstall({"imports":{"message-read-receipt":{"server":{"lib":{"ReadReceipt.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/message-read-receipt/server/lib/ReadReceipt.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  ReadReceipt: () => ReadReceipt
});
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 0);
let ModelReadReceipts;
module.watch(require("../models/ReadReceipts"), {
  default(v) {
    ModelReadReceipts = v;
  }

}, 1);
const rawReadReceipts = ModelReadReceipts.model.rawCollection(); // debounced function by roomId, so multiple calls within 2 seconds to same roomId runs only once

const list = {};

const debounceByRoomId = function (fn) {
  return function (roomId, ...args) {
    clearTimeout(list[roomId]);
    list[roomId] = setTimeout(() => {
      fn.call(this, roomId, ...args);
    }, 2000);
  };
};

const updateMessages = debounceByRoomId(Meteor.bindEnvironment(roomId => {
  // @TODO maybe store firstSubscription in room object so we don't need to call the above update method
  const firstSubscription = RocketChat.models.Subscriptions.getMinimumLastSeenByRoomId(roomId);
  RocketChat.models.Messages.setAsRead(roomId, firstSubscription.ls);
}));
const ReadReceipt = {
  markMessagesAsRead(roomId, userId, userLastSeen) {
    if (!RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
      return;
    }

    const room = RocketChat.models.Rooms.findOneById(roomId, {
      fields: {
        lm: 1
      }
    }); // if users last seen is greadebounceByRoomIdter than room's last message, it means the user already have this room marked as read

    if (userLastSeen > room.lm) {
      return;
    }

    if (userLastSeen) {
      this.storeReadReceipts(RocketChat.models.Messages.findUnreadMessagesByRoomAndDate(roomId, userLastSeen), roomId, userId);
    }

    updateMessages(roomId);
  },

  markMessageAsReadBySender(message, roomId, userId) {
    if (!RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
      return;
    } // this will usually happens if the message sender is the only one on the room


    const firstSubscription = RocketChat.models.Subscriptions.getMinimumLastSeenByRoomId(roomId);

    if (message.unread && message.ts < firstSubscription.ls) {
      RocketChat.models.Messages.setAsReadById(message._id, firstSubscription.ls);
    }

    this.storeReadReceipts([{
      _id: message._id
    }], roomId, userId);
  },

  storeReadReceipts(messages, roomId, userId) {
    if (RocketChat.settings.get('Message_Read_Receipt_Store_Users')) {
      const ts = new Date();
      const receipts = messages.map(message => {
        return {
          _id: Random.id(),
          roomId,
          userId,
          messageId: message._id,
          ts
        };
      });

      if (receipts.length === 0) {
        return;
      }

      try {
        rawReadReceipts.insertMany(receipts);
      } catch (e) {
        console.error('Error inserting read receipts per user');
      }
    }
  },

  getReceipts(message) {
    return ModelReadReceipts.findByMessageId(message._id).map(receipt => (0, _objectSpread2.default)({}, receipt, {
      user: RocketChat.models.Users.findOneById(receipt.userId, {
        fields: {
          username: 1,
          name: 1
        }
      })
    }));
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"api":{"methods":{"getReadReceipts.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/message-read-receipt/server/api/methods/getReadReceipts.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let ReadReceipt;
module.watch(require("../../lib/ReadReceipt"), {
  ReadReceipt(v) {
    ReadReceipt = v;
  }

}, 1);
Meteor.methods({
  getReadReceipts({
    messageId
  }) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getReadReceipts'
      });
    }

    if (!messageId) {
      throw new Meteor.Error('error-invalid-message', 'The required \'messageId\' param is missing.', {
        method: 'getReadReceipts'
      });
    }

    const message = RocketChat.models.Messages.findOneById(messageId);

    if (!message) {
      throw new Meteor.Error('error-invalid-message', 'Invalid message', {
        method: 'getReadReceipts'
      });
    }

    const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'getReadReceipts'
      });
    }

    return ReadReceipt.getReceipts(message);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"models":{"ReadReceipts.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/message-read-receipt/server/models/ReadReceipts.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class ModelReadReceipts extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
    this.tryEnsureIndex({
      roomId: 1,
      userId: 1,
      messageId: 1
    }, {
      unique: 1
    });
  }

  findByMessageId(messageId) {
    return this.find({
      messageId
    });
  }

}

module.exportDefault(new ModelReadReceipts('message_read_receipt'));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"dbIndexes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/message-read-receipt/server/dbIndexes.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Messages.tryEnsureIndex({
  unread: 1
}, {
  sparse: true
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hooks.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/message-read-receipt/server/hooks.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let ReadReceipt;
module.watch(require("./lib/ReadReceipt"), {
  ReadReceipt(v) {
    ReadReceipt = v;
  }

}, 0);
RocketChat.callbacks.add('afterSaveMessage', (message, room) => {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  } // set subscription as read right after message was sent


  RocketChat.models.Subscriptions.setAsReadByRoomIdAndUserId(room._id, message.u._id); // mark message as read as well

  ReadReceipt.markMessageAsReadBySender(message, room._id, message.u._id);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/message-read-receipt/server/index.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./dbIndexes"));
module.watch(require("./hooks"));
module.watch(require("./settings"));
module.watch(require("./api/methods/getReadReceipts"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/message-read-receipt/server/settings.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.add('Message_Read_Receipt_Enabled', false, {
  group: 'Message',
  type: 'boolean',
  public: true
});
RocketChat.settings.add('Message_Read_Receipt_Store_Users', false, {
  group: 'Message',
  type: 'boolean',
  public: true,
  enableQuery: {
    _id: 'Message_Read_Receipt_Enabled',
    value: true
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"startup":{"server":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/index.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("../../message-read-receipt/server"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"server":{"lib":{"cordova":{"facebook-login.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/lib/cordova/facebook-login.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

function getIdentity(accessToken) {
  try {
    return HTTP.get('https://graph.facebook.com/me', {
      params: {
        access_token: accessToken
      }
    }).data;
  } catch (error) {
    throw _.extend(new Error(`Failed to fetch identity from Facebook. ${error.message}`), {
      response: error.response
    });
  }
}

Accounts.registerLoginHandler(function (loginRequest) {
  if (!loginRequest.cordova) {
    return;
  }

  loginRequest = loginRequest.authResponse;
  const identity = getIdentity(loginRequest.accessToken);
  const serviceData = {
    accessToken: loginRequest.accessToken,
    expiresAt: Date.now() + 1000 * loginRequest.expiresIn
  };
  const whitelisted = ['id', 'email', 'name', 'first_name', 'last_name', 'link', 'username', 'gender', 'locale', 'age_range'];

  const fields = _.pick(identity, whitelisted);

  const options = {
    profile: {}
  };

  _.extend(serviceData, fields);

  _.extend(options.profile, fields);

  return Accounts.updateOrCreateUserFromExternalService('facebook', serviceData, options);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"accounts.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/lib/accounts.js                                                                                              //
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
const accountsConfig = {
  forbidClientAccountCreation: true,
  loginExpirationInDays: RocketChat.settings.get('Accounts_LoginExpiration')
};
Accounts.config(accountsConfig);
Accounts.emailTemplates.siteName = RocketChat.settings.get('Site_Name');
Accounts.emailTemplates.from = `${RocketChat.settings.get('Site_Name')} <${RocketChat.settings.get('From_Email')}>`;
Accounts.emailTemplates.userToActivate = {
  subject() {
    const subject = TAPi18n.__('Accounts_Admin_Email_Approval_Needed_Subject_Default');

    const siteName = RocketChat.settings.get('Site_Name');
    return `[${siteName}] ${subject}`;
  },

  html(options = {}) {
    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    const email = options.reason ? 'Accounts_Admin_Email_Approval_Needed_With_Reason_Default' : 'Accounts_Admin_Email_Approval_Needed_Default';
    const html = RocketChat.placeholders.replace(TAPi18n.__(email), {
      name: options.name,
      email: options.email,
      reason: options.reason
    });
    return header + html + footer;
  }

};
Accounts.emailTemplates.userActivated = {
  subject({
    active,
    username
  }) {
    const action = active ? username ? 'Activated' : 'Approved' : 'Deactivated';
    const subject = `Accounts_Email_${action}_Subject`;
    const siteName = RocketChat.settings.get('Site_Name');
    return `[${siteName}] ${TAPi18n.__(subject)}`;
  },

  html({
    active,
    name,
    username
  }) {
    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    const action = active ? username ? 'Activated' : 'Approved' : 'Deactivated';
    const html = RocketChat.placeholders.replace(TAPi18n.__(`Accounts_Email_${action}`), {
      name
    });
    return header + html + footer;
  }

};
const verifyEmailHtml = Accounts.emailTemplates.verifyEmail.text;

Accounts.emailTemplates.verifyEmail.html = function (user, url) {
  url = url.replace(Meteor.absoluteUrl(), `${Meteor.absoluteUrl()}login/`);
  return verifyEmailHtml(user, url);
};

Accounts.urls.resetPassword = function (token) {
  return Meteor.absoluteUrl(`reset-password/${token}`);
};

Accounts.emailTemplates.resetPassword.html = Accounts.emailTemplates.resetPassword.text;

Accounts.emailTemplates.enrollAccount.subject = function (user = {}) {
  let subject;

  if (RocketChat.settings.get('Accounts_Enrollment_Customized')) {
    subject = RocketChat.settings.get('Accounts_Enrollment_Email_Subject');
  } else {
    subject = TAPi18n.__('Accounts_Enrollment_Email_Subject_Default', {
      lng: user.language || RocketChat.settings.get('language') || 'en'
    });
  }

  return RocketChat.placeholders.replace(subject);
};

Accounts.emailTemplates.enrollAccount.html = function (user = {}
/*, url*/
) {
  let html;

  if (RocketChat.settings.get('Accounts_Enrollment_Customized')) {
    html = RocketChat.settings.get('Accounts_Enrollment_Email');
  } else {
    html = TAPi18n.__('Accounts_Enrollment_Email_Default', {
      lng: user.language || RocketChat.settings.get('language') || 'en'
    });
  }

  const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
  const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
  html = RocketChat.placeholders.replace(html, {
    name: user.name,
    email: user.emails && user.emails[0] && user.emails[0].address
  });
  return header + html + footer;
};

Accounts.onCreateUser(function (options, user = {}) {
  RocketChat.callbacks.run('beforeCreateUser', options, user);
  user.status = 'offline';
  user.active = !RocketChat.settings.get('Accounts_ManuallyApproveNewUsers');

  if (!user.name) {
    if (options.profile) {
      if (options.profile.name) {
        user.name = options.profile.name;
      } else if (options.profile.firstName && options.profile.lastName) {
        // LinkedIn format
        user.name = `${options.profile.firstName} ${options.profile.lastName}`;
      } else if (options.profile.firstName) {
        // LinkedIn format
        user.name = options.profile.firstName;
      }
    }
  }

  if (user.services) {
    for (const service of Object.values(user.services)) {
      if (!user.name) {
        user.name = service.name || service.username;
      }

      if (!user.emails && service.email) {
        user.emails = [{
          address: service.email,
          verified: true
        }];
      }
    }
  }

  if (!user.active) {
    const destinations = [];
    RocketChat.models.Roles.findUsersInRole('admin').forEach(adminUser => {
      if (Array.isArray(adminUser.emails)) {
        adminUser.emails.forEach(email => {
          destinations.push(`${adminUser.name}<${email.address}>`);
        });
      }
    });
    const email = {
      to: destinations,
      from: RocketChat.settings.get('From_Email'),
      subject: Accounts.emailTemplates.userToActivate.subject(),
      html: Accounts.emailTemplates.userToActivate.html(options)
    };
    Meteor.defer(() => Email.send(email));
  }

  return user;
});
Accounts.insertUserDoc = _.wrap(Accounts.insertUserDoc, function (insertUserDoc, options, user) {
  let roles = [];

  if (Match.test(user.globalRoles, [String]) && user.globalRoles.length > 0) {
    roles = roles.concat(user.globalRoles);
  }

  delete user.globalRoles;

  if (user.services && !user.services.password) {
    const defaultAuthServiceRoles = String(RocketChat.settings.get('Accounts_Registration_AuthenticationServices_Default_Roles')).split(',');

    if (defaultAuthServiceRoles.length > 0) {
      roles = roles.concat(defaultAuthServiceRoles.map(s => s.trim()));
    }
  }

  if (!user.type) {
    user.type = 'user';
  }

  const _id = insertUserDoc.call(Accounts, options, user);

  user = Meteor.users.findOne({
    _id
  });

  if (user.username) {
    if (options.joinDefaultChannels !== false && user.joinDefaultChannels !== false) {
      Meteor.runAsUser(_id, function () {
        return Meteor.call('joinDefaultChannels', options.joinDefaultChannelsSilenced);
      });
    }

    if (user.type !== 'visitor') {
      Meteor.defer(function () {
        return RocketChat.callbacks.run('afterCreateUser', user);
      });
    }
  }

  if (roles.length === 0) {
    const hasAdmin = RocketChat.models.Users.findOne({
      roles: 'admin',
      type: 'user'
    }, {
      fields: {
        _id: 1
      }
    });

    if (hasAdmin) {
      roles.push('user');
    } else {
      roles.push('admin');

      if (RocketChat.settings.get('Show_Setup_Wizard') === 'pending') {
        RocketChat.models.Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
      }
    }
  }

  RocketChat.authz.addUserRoles(_id, roles);
  return _id;
});
Accounts.validateLoginAttempt(function (login) {
  login = RocketChat.callbacks.run('beforeValidateLogin', login);

  if (login.allowed !== true) {
    return login.allowed;
  }

  if (login.user.type === 'visitor') {
    return true;
  }

  if (!!login.user.active !== true) {
    throw new Meteor.Error('error-user-is-not-activated', 'User is not activated', {
      'function': 'Accounts.validateLoginAttempt'
    });
  }

  if (!login.user.roles || !Array.isArray(login.user.roles)) {
    throw new Meteor.Error('error-user-has-no-roles', 'User has no roles', {
      'function': 'Accounts.validateLoginAttempt'
    });
  }

  if (login.user.roles.includes('admin') === false && login.type === 'password' && RocketChat.settings.get('Accounts_EmailVerification') === true) {
    const validEmail = login.user.emails.filter(email => email.verified === true);

    if (validEmail.length === 0) {
      throw new Meteor.Error('error-invalid-email', 'Invalid email __email__');
    }
  }

  login = RocketChat.callbacks.run('onValidateLogin', login);
  RocketChat.models.Users.updateLastLoginById(login.user._id);
  Meteor.defer(function () {
    return RocketChat.callbacks.run('afterValidateLogin', login);
  });
  return true;
});
Accounts.validateNewUser(function (user) {
  if (user.type === 'visitor') {
    return true;
  }

  if (RocketChat.settings.get('Accounts_Registration_AuthenticationServices_Enabled') === false && RocketChat.settings.get('LDAP_Enable') === false && !(user.services && user.services.password)) {
    throw new Meteor.Error('registration-disabled-authentication-services', 'User registration is disabled for authentication services');
  }

  return true;
});
Accounts.validateNewUser(function (user) {
  if (user.type === 'visitor') {
    return true;
  }

  let domainWhiteList = RocketChat.settings.get('Accounts_AllowedDomainsList');

  if (_.isEmpty(s.trim(domainWhiteList))) {
    return true;
  }

  domainWhiteList = domainWhiteList.split(',').map(domain => domain.trim());

  if (user.emails && user.emails.length > 0) {
    const email = user.emails[0].address;
    const inWhiteList = domainWhiteList.some(domain => email.match(`@${RegExp.escape(domain)}$`));

    if (inWhiteList === false) {
      throw new Meteor.Error('error-invalid-domain');
    }
  }

  return true;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cordova.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/lib/cordova.js                                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global Push, SystemLogger */
Meteor.methods({
  // log() {
  // 	return console.log(...arguments);
  // },
  push_test() {
    const user = Meteor.user();

    if (!user) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'push_test'
      });
    }

    if (!RocketChat.authz.hasRole(user._id, 'admin')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'push_test'
      });
    }

    if (Push.enabled !== true) {
      throw new Meteor.Error('error-push-disabled', 'Push is disabled', {
        method: 'push_test'
      });
    }

    const query = {
      $and: [{
        userId: user._id
      }, {
        $or: [{
          'token.apn': {
            $exists: true
          }
        }, {
          'token.gcm': {
            $exists: true
          }
        }]
      }]
    };
    const tokens = Push.appCollection.find(query).count();

    if (tokens === 0) {
      throw new Meteor.Error('error-no-tokens-for-this-user', 'There are no tokens for this user', {
        method: 'push_test'
      });
    }

    Push.send({
      from: 'push',
      title: `@${user.username}`,
      text: TAPi18n.__('This_is_a_push_test_messsage'),
      apn: {
        text: `@${user.username}:\n${TAPi18n.__('This_is_a_push_test_messsage')}`
      },
      sound: 'default',
      query: {
        userId: user._id
      }
    });
    return {
      message: 'Your_push_was_sent_to_s_devices',
      params: [tokens]
    };
  }

});

function sendPush(service, token, options, tries = 0) {
  const data = {
    data: {
      token,
      options
    }
  };
  return HTTP.post(`${RocketChat.settings.get('Push_gateway')}/push/${service}/send`, data, function (error, response) {
    if (response && response.statusCode === 406) {
      console.log('removing push token', token);
      Push.appCollection.remove({
        $or: [{
          'token.apn': token
        }, {
          'token.gcm': token
        }]
      });
      return;
    }

    if (!error) {
      return;
    }

    SystemLogger.error(`Error sending push to gateway (${tries} try) ->`, error);

    if (tries <= 6) {
      const milli = Math.pow(10, tries + 2);
      SystemLogger.log('Trying sending push to gateway again in', milli, 'milliseconds');
      return Meteor.setTimeout(function () {
        return sendPush(service, token, options, tries + 1);
      }, milli);
    }
  });
}

function configurePush() {
  if (RocketChat.settings.get('Push_debug')) {
    Push.debug = true;
    console.log('Push: configuring...');
  }

  if (RocketChat.settings.get('Push_enable') === true) {
    Push.allow({
      send(userId
      /*, notification*/
      ) {
        return RocketChat.authz.hasRole(userId, 'admin');
      }

    });
    let apn;
    let gcm;

    if (RocketChat.settings.get('Push_enable_gateway') === false) {
      gcm = {
        apiKey: RocketChat.settings.get('Push_gcm_api_key'),
        projectNumber: RocketChat.settings.get('Push_gcm_project_number')
      };
      apn = {
        passphrase: RocketChat.settings.get('Push_apn_passphrase'),
        keyData: RocketChat.settings.get('Push_apn_key'),
        certData: RocketChat.settings.get('Push_apn_cert')
      };

      if (RocketChat.settings.get('Push_production') !== true) {
        apn = {
          passphrase: RocketChat.settings.get('Push_apn_dev_passphrase'),
          keyData: RocketChat.settings.get('Push_apn_dev_key'),
          certData: RocketChat.settings.get('Push_apn_dev_cert'),
          gateway: 'gateway.sandbox.push.apple.com'
        };
      }

      if (!apn.keyData || apn.keyData.trim() === '' || !apn.certData || apn.certData.trim() === '') {
        apn = undefined;
      }

      if (!gcm.apiKey || gcm.apiKey.trim() === '' || !gcm.projectNumber || gcm.projectNumber.trim() === '') {
        gcm = undefined;
      }
    }

    Push.Configure({
      apn,
      gcm,
      production: RocketChat.settings.get('Push_production'),
      sendInterval: 1000,
      sendBatchSize: 10
    });

    if (RocketChat.settings.get('Push_enable_gateway') === true) {
      Push.serverSend = function (options = {
        badge: 0
      }) {
        if (options.from !== String(options.from)) {
          throw new Error('Push.send: option "from" not a string');
        }

        if (options.title !== String(options.title)) {
          throw new Error('Push.send: option "title" not a string');
        }

        if (options.text !== String(options.text)) {
          throw new Error('Push.send: option "text" not a string');
        }

        if (RocketChat.settings.get('Push_debug')) {
          console.log(`Push: send message "${options.title}" via query`, options.query);
        }

        const query = {
          $and: [options.query, {
            $or: [{
              'token.apn': {
                $exists: true
              }
            }, {
              'token.gcm': {
                $exists: true
              }
            }]
          }]
        };
        return Push.appCollection.find(query).forEach(app => {
          if (RocketChat.settings.get('Push_debug')) {
            console.log('Push: send to token', app.token);
          }

          if (app.token.apn) {
            options.topic = app.appName;
            return sendPush('apn', app.token.apn, options);
          }

          if (app.token.gcm) {
            return sendPush('gcm', app.token.gcm, options);
          }
        });
      };
    }

    return Push.enabled = true;
  }
}

Meteor.startup(function () {
  return configurePush();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"migrations":{"v001.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v001.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 1,

  up() {
    return RocketChat.models.Users.find({
      username: {
        $exists: false
      },
      lastLogin: {
        $exists: true
      }
    }).forEach(user => {
      const username = RocketChat.generateUsernameSuggestion(user);

      if (username && username.trim() !== '') {
        return RocketChat.models.Users.setUsername(user._id, username);
      } else {
        return console.log('User without username', JSON.stringify(user, null, ' '));
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v002.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v002.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals getAvatarSuggestionForUser */
RocketChat.Migrations.add({
  version: 2,

  up() {
    return RocketChat.models.Users.find({
      avatarOrigin: {
        $exists: false
      },
      username: {
        $exists: true
      }
    }).forEach(user => {
      const avatars = getAvatarSuggestionForUser(user);
      const services = Object.keys(avatars);

      if (services.length === 0) {
        return;
      }

      const service = services[0];
      console.log(user.username, '->', service);
      const dataURI = avatars[service].blob;
      const {
        image,
        contentType
      } = RocketChatFile.dataURIParse(dataURI);
      const rs = RocketChatFile.bufferToStream(new Buffer(image, 'base64'));
      const fileStore = FileUpload.getStore('Avatars');
      fileStore.deleteByName(user.username);
      const file = {
        userId: user._id,
        type: contentType
      };
      fileStore.insert(file, rs, () => {
        return RocketChat.models.Users.setAvatarOrigin(user._id, service);
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v003.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v003.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 3,

  up() {
    RocketChat.models.Subscriptions.tryDropIndex('uid_1');
    RocketChat.models.Subscriptions.tryDropIndex('rid_1_uid_1');
    console.log('Fixing ChatSubscription uid');
    RocketChat.models.Subscriptions.find({
      uid: {
        $exists: true
      }
    }, {
      nonreactive: true
    }).forEach(sub => {
      const update = {};
      const user = RocketChat.models.Users.findOneById(sub.uid, {
        fields: {
          username: 1
        }
      });

      if (user) {
        if (!update.$set) {
          update.$set = {};
        }

        if (!update.$unset) {
          update.$unset = {};
        }

        update.$set['u._id'] = user._id;
        update.$set['u.username'] = user.username;
        update.$unset.uid = 1;
      }

      if (Object.keys(update).length > 0) {
        return RocketChat.models.Subscriptions.update(sub._id, update);
      }
    });
    console.log('Fixing ChatRoom uids');
    RocketChat.models.Rooms.find({
      'uids.0': {
        $exists: true
      }
    }, {
      nonreactive: true
    }).forEach(function (room) {
      const update = {};
      const users = RocketChat.models.Users.find({
        _id: {
          $in: room.uids
        },
        username: {
          $exists: true
        }
      }, {
        fields: {
          username: 1
        }
      });
      const usernames = users.map(function (user) {
        return user.username;
      });

      if (!update.$set) {
        update.$set = {};
      }

      if (!update.$unset) {
        update.$unset = {};
      }

      update.$set.usernames = usernames;
      update.$unset.uids = 1;
      const user = RocketChat.models.Users.findOneById(room.uid, {
        fields: {
          username: 1
        }
      });

      if (user) {
        update.$set['u._id'] = user._id;
        update.$set['u.username'] = user.username;
        update.$unset.uid = 1;
      }

      if (room.t === 'd' && usernames.length === 2) {
        for (const k of Object.keys(update.$set)) {
          const v = update.$set[k];
          room[k] = v;
        }

        for (const k of Object.keys(update.$unset)) {
          delete room[k];
        }

        const oldId = room._id;
        room._id = usernames.sort().join(',');
        RocketChat.models.Rooms.insert(room);
        RocketChat.models.Rooms.removeById(oldId);
        RocketChat.models.Subscriptions.update({
          rid: oldId
        }, {
          $set: {
            rid: room._id
          }
        }, {
          multi: true
        });
        return RocketChat.models.Messages.update({
          rid: oldId
        }, {
          $set: {
            rid: room._id
          }
        }, {
          multi: true
        });
      } else {
        return RocketChat.models.Rooms.update(room._id, update);
      }
    });
    console.log('Fixing ChatMessage uid');
    RocketChat.models.Messages.find({
      uid: {
        $exists: true
      }
    }, {
      nonreactive: true
    }).forEach(message => {
      const update = {};
      const user = RocketChat.models.Users.findOneById(message.uid, {
        fields: {
          username: 1
        }
      });

      if (user) {
        if (!update.$set) {
          update.$set = {};
        }

        if (!update.$unset) {
          update.$unset = {};
        }

        update.$set['u._id'] = user._id;
        update.$set['u.username'] = user.username;
        update.$unset.uid = 1;
      }

      if (Object.keys(update).length > 0) {
        return RocketChat.models.Messages.update(message._id, update);
      }
    });
    return console.log('End');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v004.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v004.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 4,

  up() {
    RocketChat.models.Messages.tryDropIndex('rid_1');
    RocketChat.models.Subscriptions.tryDropIndex('u._id_1');
    console.log('Rename rn to name');
    RocketChat.models.Subscriptions.update({
      rn: {
        $exists: true
      }
    }, {
      $rename: {
        rn: 'name'
      }
    }, {
      multi: true
    });
    console.log('Adding names to rooms without name');
    RocketChat.models.Rooms.find({
      name: ''
    }).forEach(item => {
      const name = Random.id().toLowerCase();
      RocketChat.models.Rooms.setNameById(item._id, name);
      return RocketChat.models.Subscriptions.update({
        rid: item._id
      }, {
        $set: {
          name
        }
      }, {
        multi: true
      });
    });
    console.log('Making room names unique');
    RocketChat.models.Rooms.find().forEach(function (room) {
      return RocketChat.models.Rooms.find({
        name: room.name,
        _id: {
          $ne: room._id
        }
      }).forEach(item => {
        const name = `${room.name}-${Random.id(2).toLowerCase()}`;
        RocketChat.models.Rooms.setNameById(item._id, name);
        return RocketChat.models.Subscriptions.update({
          rid: item._id
        }, {
          $set: {
            name
          }
        }, {
          multi: true
        });
      });
    });
    return console.log('End');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v005.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v005.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 5,

  up() {
    console.log('Dropping test rooms with less than 2 messages');
    RocketChat.models.Rooms.find({
      msgs: {
        $lt: 2
      }
    }).forEach(room => {
      console.log('Dropped: ', room.name);
      RocketChat.models.Rooms.removeById(room._id);
      RocketChat.models.Messages.removeByRoomId(room._id);
      return RocketChat.models.Subscriptions.removeByRoomId(room._id);
    });
    console.log('Dropping test rooms with less than 2 user');
    RocketChat.models.Rooms.find({
      usernames: {
        $size: 1
      }
    }).forEach(room => {
      console.log('Dropped: ', room.name);
      RocketChat.models.Rooms.removeById(room._id);
      RocketChat.models.Messages.removeByRoomId(room._id);
      return RocketChat.models.Subscriptions.removeByRoomId(room._id);
    });
    console.log('Adding username to all users');
    RocketChat.models.Users.find({
      username: {
        $exists: 0
      },
      emails: {
        $exists: 1
      }
    }).forEach(user => {
      let newUserName = user.emails[0].address.split('@')[0];

      if (RocketChat.models.Users.findOneByUsername(newUserName)) {
        newUserName = newUserName + Math.floor(Math.random() * 10 + 1);

        if (RocketChat.models.Users.findOneByUsername(newUserName)) {
          newUserName = newUserName + Math.floor(Math.random() * 10 + 1);

          if (RocketChat.models.Users.findOneByUsername(newUserName)) {
            newUserName = newUserName + Math.floor(Math.random() * 10 + 1);
          }
        }
      }

      console.log(`Adding: username ${newUserName} to all user ${user._id}`);
      return RocketChat.models.Users.setUsername(user._id, newUserName);
    });
    console.log('Fixing _id of direct messages rooms');
    RocketChat.models.Rooms.findByType('d').forEach(function (room) {
      let newId = '';

      const id0 = RocketChat.models.Users.findOneByUsername(room.usernames[0])._id;

      const id1 = RocketChat.models.Users.findOneByUsername(room.usernames[1])._id;

      const ids = [id0, id1];
      newId = ids.sort().join('');

      if (newId !== room._id) {
        console.log(`Fixing: _id ${room._id} to ${newId}`);
        RocketChat.models.Subscriptions.update({
          rid: room._id
        }, {
          $set: {
            rid: newId
          }
        }, {
          multi: 1
        });
        RocketChat.models.Messages.update({
          rid: room._id
        }, {
          $set: {
            rid: newId
          }
        }, {
          multi: 1
        });
        RocketChat.models.Rooms.removeById(room._id);
        room._id = newId;
        RocketChat.models.Rooms.insert(room);
      }

      RocketChat.models.Subscriptions.update({
        rid: room._id,
        'u._id': id0
      }, {
        $set: {
          name: room.usernames[1]
        }
      });
      return RocketChat.models.Subscriptions.update({
        rid: room._id,
        'u._id': id1
      }, {
        $set: {
          name: room.usernames[0]
        }
      });
    });
    console.log('Adding u.username to all documents');
    RocketChat.models.Users.find({}, {
      username: 1
    }).forEach(user => {
      console.log(`Adding: u.username ${user.username} to all document`);
      RocketChat.models.Rooms.update({
        'u._id': user._id
      }, {
        $set: {
          'u.username': user.username
        }
      }, {
        multi: 1
      });
      RocketChat.models.Subscriptions.update({
        'u._id': user._id
      }, {
        $set: {
          'u.username': user.username
        }
      }, {
        multi: 1
      });
      RocketChat.models.Messages.update({
        'u._id': user._id
      }, {
        $set: {
          'u.username': user.username
        }
      }, {
        multi: 1
      });
      RocketChat.models.Messages.update({
        uid: user._id
      }, {
        $set: {
          u: user
        }
      }, {
        multi: 1
      });
      RocketChat.models.Messages.update({
        by: user._id
      }, {
        $set: {
          u: user
        }
      }, {
        multi: 1
      });
      RocketChat.models.Messages.update({
        uid: {
          $exists: 1
        }
      }, {
        $unset: {
          uid: 1,
          by: 1
        }
      }, {
        multi: 1
      });
    });
    return console.log('End');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v006.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v006.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 6,

  up() {
    console.log('Changing _id of #general channel room from XXX to GENERAL');
    const room = RocketChat.models.Rooms.findOneByName('general');

    if (room && room._id !== 'GENERAL') {
      RocketChat.models.Subscriptions.update({
        rid: room._id
      }, {
        $set: {
          rid: 'GENERAL'
        }
      }, {
        multi: 1
      });
      RocketChat.models.Messages.update({
        rid: room._id
      }, {
        $set: {
          rid: 'GENERAL'
        }
      }, {
        multi: 1
      });
      RocketChat.models.Rooms.removeById(room._id);
      delete room._id;
      RocketChat.models.Rooms.upsert({
        _id: 'GENERAL'
      }, {
        $set: room
      });
    }

    return console.log('End');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v007.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v007.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.Migrations.add({
  version: 7,

  up() {
    console.log('Populate urls in messages');
    const query = RocketChat.models.Messages.find({
      'urls.0': {
        $exists: true
      }
    });
    const count = query.count();
    query.forEach((message, index) => {
      console.log(`${index + 1} / ${count}`);
      message.urls = message.urls.map(url => {
        if (_.isString(url)) {
          return {
            url
          };
        }

        return url;
      });
      return OEmbed.rocketUrlParser(message);
    });
    return console.log('End');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v008.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v008.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 8,

  up() {
    console.log('Load old settings record');
    const settings = RocketChat.models.Settings.findOne({
      _id: 'settings'
    });

    if (settings) {
      if (settings.CDN_PREFIX) {
        RocketChat.models.Settings.insert({
          _id: 'CDN_PREFIX',
          value: settings.CDN_PREFIX,
          type: 'string',
          group: 'General'
        });
      }

      if (settings.ENV && settings.ENV.MAIL_URL) {
        RocketChat.models.Settings.insert({
          _id: 'MAIL_URL',
          value: settings.ENV.MAIL_URL,
          type: 'string',
          group: 'SMTP'
        });
      }

      if (settings.denyUnverifiedEmails) {
        RocketChat.models.Settings.insert({
          _id: 'Accounts_denyUnverifiedEmails',
          value: settings.denyUnverifiedEmails,
          type: 'boolean',
          group: 'Accounts'
        });
      }

      if (settings.public && settings.public.avatarStore && settings.public.avatarStore.type) {
        RocketChat.models.Settings.insert({
          _id: 'avatarStore_type',
          value: settings.public.avatarStore.type,
          type: 'string',
          group: 'API'
        });
      }

      if (settings.public && settings.public.avatarStore && settings.public.avatarStore.path) {
        RocketChat.models.Settings.insert({
          _id: 'avatarStore_path',
          value: settings.public.avatarStore.path,
          type: 'string',
          group: 'API'
        });
      }

      return RocketChat.models.Settings.remove({
        _id: 'settings'
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v009.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v009.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 9,

  up() {
    // Migrate existing source collection data to target collection
    // target collection is defined in collections.coffee using the new collection name
    // source collection is dropped after data migration
    const toMigrate = [{
      source: new Mongo.Collection('data.ChatRoom'),
      target: RocketChat.models.Rooms.model
    }, {
      source: new Mongo.Collection('data.ChatSubscription'),
      target: RocketChat.models.Subscriptions.model
    }, {
      source: new Mongo.Collection('data.ChatMessage'),
      target: RocketChat.models.Messages.model
    }, {
      source: new Mongo.Collection('settings'),
      target: RocketChat.models.Settings.model
    }, {
      // this collection may not exit
      source: new Mongo.Collection('oembed_cache'),
      target: RocketChat.models.OEmbedCache.model
    }];
    return toMigrate.forEach(collection => {
      const {
        target,
        source
      } = collection; // rawCollection available as of Meteor 1.0.4

      console.log(`Migrating data from: ${source.rawCollection().collectionName} to: ${target.rawCollection().collectionName}`);
      source.find().forEach(doc => {
        // use upsert to account for GENERAL room created by initialData
        return target.upsert({
          _id: doc._id
        }, doc);
      });
      const rawSource = source.rawCollection();
      return Meteor.wrapAsync(rawSource.drop, rawSource)(function (err
      /*, res*/
      ) {
        if (err) {
          return console.log(`Error dropping ${rawSource.collectionName} collection due to: ${err.errmsg}`);
        }
      }); // Note: the following would have been much easier, but didn't work.  The serverside
      // data was not published to the client for some reason.
      // newName = target.rawCollection().collectionName
      // Meteor.wrapAsync(rawSource.rename, rawSource )(newName, {dropTarget:true})
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v010.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v010.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.Migrations.add({
  version: 10,

  up() {
    /*
     * Remove duplicated usernames from rooms
     */
    let count = 0;
    RocketChat.models.Rooms.find({
      'usernames.0': {
        $exists: true
      }
    }, {
      fields: {
        usernames: 1
      }
    }).forEach(room => {
      const newUsernames = _.uniq(room.usernames);

      if (newUsernames.length !== room.usernames.length) {
        count++;
        return RocketChat.models.Rooms.update({
          _id: room._id
        }, {
          $set: {
            usernames: newUsernames
          }
        });
      }
    });
    return console.log(`Removed duplicated usernames from ${count} rooms`);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v011.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v011.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 11,

  up() {
    /*
     * Set GENERAL room to be default
     */
    RocketChat.models.Rooms.update({
      _id: 'GENERAL'
    }, {
      $set: {
        'default': true
      }
    });
    return console.log('Set GENERAL room to be default');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v012.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v012.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 12,

  up() {
    // Set oldest user as admin, if none exists yet
    const admin = RocketChat.models.Users.findOneAdmin(true, {
      fields: {
        _id: 1
      }
    });

    if (!admin) {
      // get oldest user
      const oldestUser = RocketChat.models.Users.findOne({}, {
        fields: {
          username: 1
        },
        sort: {
          createdAt: 1
        }
      });

      if (oldestUser) {
        Meteor.users.update({
          _id: oldestUser._id
        }, {
          $set: {
            admin: true
          }
        });
        return console.log(`Set ${oldestUser.username} as admin for being the oldest user`);
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v013.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v013.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 13,

  up() {
    // Set all current users as active
    RocketChat.models.Users.setAllUsersActive(true);
    return console.log('Set all users as active');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v014.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v014.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 14,

  up() {
    // Remove unused settings
    RocketChat.models.Settings.remove({
      _id: 'API_Piwik_URL'
    });
    RocketChat.models.Settings.remove({
      _id: 'API_Piwik_ID'
    });
    RocketChat.models.Settings.remove({
      _id: 'Message_Edit'
    });
    RocketChat.models.Settings.remove({
      _id: 'Message_Delete'
    });
    RocketChat.models.Settings.remove({
      _id: 'Message_KeepStatusHistory'
    });
    RocketChat.models.Settings.update({
      _id: 'Message_ShowEditedStatus'
    }, {
      $set: {
        type: 'boolean',
        value: true
      }
    });
    RocketChat.models.Settings.update({
      _id: 'Message_ShowDeletedStatus'
    }, {
      $set: {
        type: 'boolean',
        value: false
      }
    });
    const metaKeys = [{
      old: 'Meta:language',
      new: 'Meta_language'
    }, {
      old: 'Meta:fb:app_id',
      new: 'Meta_fb_app_id'
    }, {
      old: 'Meta:robots',
      new: 'Meta_robots'
    }, {
      old: 'Meta:google-site-verification',
      new: 'Meta_google-site-verification'
    }, {
      old: 'Meta:msvalidate.01',
      new: 'Meta_msvalidate01'
    }];

    for (const oldAndNew of metaKeys) {
      const oldSetting = RocketChat.models.Settings.findOne({
        _id: oldAndNew.old
      });
      const oldValue = oldSetting && oldSetting.value;
      const newSetting = RocketChat.models.Settings.findOne({
        _id: oldAndNew.new
      });
      const newValue = newSetting && newSetting.value;

      if (oldValue && newValue) {
        RocketChat.models.Settings.update({
          _id: oldAndNew.new
        }, {
          $set: {
            value: newValue
          }
        });
      }

      RocketChat.models.Settings.remove({
        _id: oldAndNew.old
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'SMTP_Security'
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v015.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v015.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 15,

  up() {
    console.log('Starting file migration');
    const oldFilesCollection = new Mongo.Collection('cfs.Files.filerecord');
    const oldGridFSCollection = new Mongo.Collection('cfs_gridfs.files.files');
    const oldChunkCollection = new Mongo.Collection('cfs_gridfs.files.chunks');
    const newFilesCollection = RocketChat.models.Uploads;
    const newGridFSCollection = new Mongo.Collection('rocketchat_uploads.files');
    const newChunkCollection = new Mongo.Collection('rocketchat_uploads.chunks');
    oldFilesCollection.find({
      'copies.files.key': {
        $exists: true
      }
    }).forEach(cfsRecord => {
      const nameParts = cfsRecord.original.name && cfsRecord.original.name.split('.');
      let extension = '';
      let url = `ufs/rocketchat_uploads/${cfsRecord._id}`;
      console.log('migrating file', url);

      if (nameParts && nameParts.length > 1) {
        extension = nameParts.pop();
        url = `${url}.${extension}`;
      }

      const record = {
        _id: cfsRecord._id,
        name: cfsRecord.original.name || '',
        size: cfsRecord.original.size,
        type: cfsRecord.original.type,
        complete: true,
        uploading: false,
        store: 'rocketchat_uploads',
        extension,
        userId: cfsRecord.userId,
        uploadedAt: cfsRecord.updatedAt,
        url: Meteor.absoluteUrl() + url
      };
      newFilesCollection.insert(record);
      const oldGridFsFile = oldGridFSCollection.findOne({
        _id: new Mongo.Collection.ObjectID(cfsRecord.copies.files.key)
      });
      newGridFSCollection.insert({
        _id: cfsRecord._id,
        filename: cfsRecord._id,
        contentType: oldGridFsFile.contentType,
        length: oldGridFsFile.length,
        chunkSize: oldGridFsFile.chunkSize,
        uploadDate: oldGridFsFile.uploadDate,
        aliases: null,
        metadata: null,
        md5: oldGridFsFile.md5
      });
      oldChunkCollection.find({
        files_id: new Mongo.Collection.ObjectID(cfsRecord.copies.files.key)
      }).forEach(oldChunk => {
        newChunkCollection.insert({
          _id: oldChunk._id,
          files_id: cfsRecord._id,
          n: oldChunk.n,
          data: oldChunk.data
        });
      });
      RocketChat.models.Messages.find({
        $or: [{
          'urls.url': `https://open.rocket.chat/cfs/files/Files/${cfsRecord._id}`
        }, {
          'urls.url': `https://rocket.chat/cfs/files/Files/${cfsRecord._id}`
        }]
      }).forEach(message => {
        for (const urlsItem of message.urls) {
          if (urlsItem.url === `https://open.rocket.chat/cfs/files/Files/${cfsRecord._id}` || urlsItem.url === `https://rocket.chat/cfs/files/Files/${cfsRecord._id}`) {
            urlsItem.url = Meteor.absoluteUrl() + url;

            if (urlsItem.parsedUrl && urlsItem.parsedUrl.pathname) {
              urlsItem.parsedUrl.pathname = `/${url}`;
            }

            message.msg = message.msg.replace(`https://open.rocket.chat/cfs/files/Files/${cfsRecord._id}`, Meteor.absoluteUrl() + url);
            message.msg = message.msg.replace(`https://rocket.chat/cfs/files/Files/${cfsRecord._id}`, Meteor.absoluteUrl() + url);
          }
        }

        RocketChat.models.Messages.update({
          _id: message._id
        }, {
          $set: {
            urls: message.urls,
            msg: message.msg
          }
        });
      });
      oldFilesCollection.remove({
        _id: cfsRecord._id
      });
      oldGridFSCollection.remove({
        _id: oldGridFsFile._id
      });
      oldChunkCollection.remove({
        files_id: new Mongo.Collection.ObjectID(cfsRecord.copies.files.key)
      });
    });
    return console.log('End of file migration');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v016.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v016.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 16,

  up() {
    return RocketChat.models.Messages.tryDropIndex({
      _hidden: 1
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v017.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v017.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 17,

  up() {
    return RocketChat.models.Messages.tryDropIndex({
      _hidden: 1
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v018.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v018.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 18,

  up() {
    const changes = {
      Accounts_Facebook: 'Accounts_OAuth_Facebook',
      Accounts_Facebook_id: 'Accounts_OAuth_Facebook_id',
      Accounts_Facebook_secret: 'Accounts_OAuth_Facebook_secret',
      Accounts_Google: 'Accounts_OAuth_Google',
      Accounts_Google_id: 'Accounts_OAuth_Google_id',
      Accounts_Google_secret: 'Accounts_OAuth_Google_secret',
      Accounts_Github: 'Accounts_OAuth_Github',
      Accounts_Github_id: 'Accounts_OAuth_Github_id',
      Accounts_Github_secret: 'Accounts_OAuth_Github_secret',
      Accounts_Gitlab: 'Accounts_OAuth_Gitlab',
      Accounts_Gitlab_id: 'Accounts_OAuth_Gitlab_id',
      Accounts_Gitlab_secret: 'Accounts_OAuth_Gitlab_secret',
      Accounts_Linkedin: 'Accounts_OAuth_Linkedin',
      Accounts_Linkedin_id: 'Accounts_OAuth_Linkedin_id',
      Accounts_Linkedin_secret: 'Accounts_OAuth_Linkedin_secret',
      Accounts_Meteor: 'Accounts_OAuth_Meteor',
      Accounts_Meteor_id: 'Accounts_OAuth_Meteor_id',
      Accounts_Meteor_secret: 'Accounts_OAuth_Meteor_secret',
      Accounts_Twitter: 'Accounts_OAuth_Twitter',
      Accounts_Twitter_id: 'Accounts_OAuth_Twitter_id',
      Accounts_Twitter_secret: 'Accounts_OAuth_Twitter_secret'
    };

    for (const from of Object.keys(changes)) {
      const to = changes[from];
      const record = RocketChat.models.Settings.findOne({
        _id: from
      });

      if (record) {
        delete record._id;
        RocketChat.models.Settings.upsert({
          _id: to
        }, record);
      }

      RocketChat.models.Settings.remove({
        _id: from
      });
    }

    return ServiceConfiguration.configurations.remove({});
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v019.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v019.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.Migrations.add({
  version: 19,

  up() {
    /*
     * Migrate existing admin users to Role based admin functionality
     * 'admin' role applies to global scope
     */
    const admins = Meteor.users.find({
      admin: true
    }, {
      fields: {
        _id: 1,
        username: 1
      }
    }).fetch();
    admins.forEach(admin => {
      RocketChat.authz.addUserRoles(admin._id, ['admin']);
    });
    Meteor.users.update({}, {
      $unset: {
        admin: ''
      }
    }, {
      multi: true
    });

    let usernames = _.pluck(admins, 'username').join(', ');

    console.log(`Migrate ${usernames} from admin field to 'admin' role`.green); // Add 'user' role to all users

    const users = Meteor.users.find().fetch();
    users.forEach(user => {
      RocketChat.authz.addUserRoles(user._id, ['user']);
    });
    usernames = _.pluck(users, 'username').join(', ');
    console.log(`Add ${usernames} to 'user' role`.green); // Add 'moderator' role to channel/group creators

    const rooms = RocketChat.models.Rooms.findByTypes(['c', 'p']).fetch();
    return rooms.forEach(room => {
      const creator = room && room.u && room.u._id;

      if (creator) {
        if (Meteor.users.findOne({
          _id: creator
        })) {
          return RocketChat.authz.addUserRoles(creator, ['moderator'], room._id);
        } else {
          RocketChat.models.Subscriptions.removeByRoomId(room._id);
          RocketChat.models.Messages.removeByRoomId(room._id);
          return RocketChat.models.Rooms.removeById(room._id);
        }
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v020.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v020.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 20,

  up() {
    /*
     * Migrate existing `rocketchat_uploads` documents to include the room Id
     * where the file was uploaded to. The room Id is retrieved from the message
     * document created after the file upload.
     */
    // list of channel messages which were created after uploading a file
    const msgQuery = {
      rid: {
        $exists: true
      },
      'file._id': {
        $exists: true
      }
    };
    const msgOptions = {
      fields: {
        _id: 1,
        rid: 1,
        'file._id': 1
      }
    };
    const cursorFileMessages = RocketChat.models.Messages.find(msgQuery, msgOptions);

    if (!cursorFileMessages.count()) {
      return;
    }

    cursorFileMessages.fetch().forEach(msg => {
      return RocketChat.models.Uploads.update({
        _id: msg.file && msg.file._id
      }, {
        $set: {
          rid: msg.rid
        }
      }, {
        $multi: true
      });
    });
    return console.log('Updated rocketchat_uploads documents to include the room Id in which they were sent.');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v021.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v021.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 21,

  up() {
    /*
     * Remove any i18nLabel from rocketchat_settings
     * They will be added again where necessary on next restart
     */
    RocketChat.models.Settings.update({
      i18nLabel: {
        $exists: true
      }
    }, {
      $unset: {
        i18nLabel: 1
      }
    }, {
      multi: true
    });
    return console.log('Removed i18nLabel from Settings. New labels will be added on next restart! Please restart your server.');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v022.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v022.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 22,

  up() {
    /*
     * Update message edit field
     */
    RocketChat.models.Messages.upgradeEtsToEditAt();
    return console.log('Updated old messages\' ets edited timestamp to new editedAt timestamp.');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v023.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v023.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 23,

  up() {
    RocketChat.models.Settings.remove({
      _id: 'Accounts_denyUnverifiedEmails'
    });
    return console.log('Deleting not used setting Accounts_denyUnverifiedEmails');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v024.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v024.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 24,

  up() {
    return RocketChat.models.Permissions.remove({
      _id: 'access-rocket-permissions'
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v025.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v025.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 25,

  up() {
    return RocketChat.models.Settings.update({
      _id: /Accounts_OAuth_Custom/
    }, {
      $set: {
        persistent: true
      },
      $unset: {
        hidden: true
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v026.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v026.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 26,

  up() {
    return RocketChat.models.Messages.update({
      t: 'rm'
    }, {
      $set: {
        mentions: []
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v027.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v027.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 27,

  up() {
    RocketChat.models.Users.update({}, {
      $rename: {
        roles: '_roles'
      }
    }, {
      multi: true
    });
    RocketChat.models.Users.find({
      _roles: {
        $exists: 1
      }
    }).forEach(user => {
      for (const scope of Object.keys(user._roles)) {
        const roles = user._roles[scope];
        RocketChat.models.Roles.addUserRoles(user._id, roles, scope);
      }
    });
    return RocketChat.models.Users.update({}, {
      $unset: {
        _roles: 1
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v028.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v028.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 28,

  up() {
    return RocketChat.models.Permissions.addRole('view-c-room', 'bot');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v029.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v029.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 29,

  up() {
    let LDAP_Url = (RocketChat.models.Settings.findOne('LDAP_Url') || {}).value;
    const LDAP_TLS = (RocketChat.models.Settings.findOne('LDAP_TLS') || {}).value;
    const LDAP_DN = (RocketChat.models.Settings.findOne('LDAP_DN') || {}).value;
    const LDAP_Bind_Search = (RocketChat.models.Settings.findOne('LDAP_Bind_Search') || {}).value;

    if (LDAP_Url && LDAP_Url.trim() !== '') {
      LDAP_Url = LDAP_Url.replace(/ldaps?:\/\//i, '');
      RocketChat.models.Settings.upsert({
        _id: 'LDAP_Host'
      }, {
        $set: {
          value: LDAP_Url
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      });
    }

    if (LDAP_TLS === true) {
      RocketChat.models.Settings.upsert({
        _id: 'LDAP_Encryption'
      }, {
        $set: {
          value: 'tls'
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      });
    }

    if (LDAP_DN && LDAP_DN.trim() !== '') {
      RocketChat.models.Settings.upsert({
        _id: 'LDAP_Domain_Base'
      }, {
        $set: {
          value: LDAP_DN
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      });
      RocketChat.models.Settings.upsert({
        _id: 'LDAP_Username_Field'
      }, {
        $set: {
          value: ''
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      });
      RocketChat.models.Settings.upsert({
        _id: 'LDAP_Unique_Identifier_Field'
      }, {
        $set: {
          value: ''
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      });
    }

    if (LDAP_Bind_Search && LDAP_Bind_Search.trim() !== '') {
      RocketChat.models.Settings.upsert({
        _id: 'LDAP_Custom_Domain_Search'
      }, {
        $set: {
          value: LDAP_Bind_Search
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      });
      RocketChat.models.Settings.upsert({
        _id: 'LDAP_Use_Custom_Domain_Search'
      }, {
        $set: {
          value: true
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'LDAP_Url'
    });
    RocketChat.models.Settings.remove({
      _id: 'LDAP_TLS'
    });
    RocketChat.models.Settings.remove({
      _id: 'LDAP_DN'
    });
    RocketChat.models.Settings.remove({
      _id: 'LDAP_Bind_Search'
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v030.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v030.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 30,

  up() {
    const WebRTC_STUN_Server = (RocketChat.models.Settings.findOne('WebRTC_STUN_Server') || {}).value;
    const WebRTC_TURN_Server = (RocketChat.models.Settings.findOne('WebRTC_TURN_Server') || {}).value;
    const WebRTC_TURN_Username = (RocketChat.models.Settings.findOne('WebRTC_TURN_Username') || {}).value;
    const WebRTC_TURN_Password = (RocketChat.models.Settings.findOne('WebRTC_TURN_Password') || {}).value;
    RocketChat.models.Settings.remove({
      _id: 'WebRTC_STUN_Server'
    });
    RocketChat.models.Settings.remove({
      _id: 'WebRTC_TURN_Server'
    });
    RocketChat.models.Settings.remove({
      _id: 'WebRTC_TURN_Username'
    });
    RocketChat.models.Settings.remove({
      _id: 'WebRTC_TURN_Password'
    });

    if (WebRTC_STUN_Server === 'stun:stun.l.google.com:19302' && WebRTC_TURN_Server === 'turn:numb.viagenie.ca:3478' && WebRTC_TURN_Username === 'team@rocket.chat' && WebRTC_TURN_Password === 'demo') {
      return;
    }

    let servers = '';

    if (WebRTC_STUN_Server) {
      servers += WebRTC_STUN_Server;
    }

    if (WebRTC_TURN_Server) {
      servers += ', ';

      if (WebRTC_TURN_Username != null) {
        servers += `${encodeURIComponent(WebRTC_TURN_Username)}:${encodeURIComponent(WebRTC_TURN_Password)}@`;
      }

      servers += WebRTC_TURN_Server;
    }

    if (servers !== '') {
      return RocketChat.models.Settings.upsert({
        _id: 'WebRTC_Servers'
      }, {
        $set: {
          value: servers
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v031.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v031.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 31,

  up() {
    const changes = {
      API_Analytics: 'GoogleTagManager_id'
    };

    for (const from of Object.keys(changes)) {
      const to = changes[from];
      const record = RocketChat.models.Settings.findOne({
        _id: from
      });

      if (record) {
        delete record._id;
        RocketChat.models.Settings.upsert({
          _id: to
        }, record);
      }

      RocketChat.models.Settings.remove({
        _id: from
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v032.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v032.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 32,

  up() {
    return RocketChat.models.Settings.update({
      _id: /Accounts_OAuth_Custom_/
    }, {
      $set: {
        group: 'OAuth'
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v033.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v033.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 33,

  up() {
    const scriptAlert = '/**\n * This script is out-of-date, convert to the new format\n * (https://rocket.chat/docs/administrator-guides/integrations)\n**/\n\n';
    const integrations = RocketChat.models.Integrations.find({
      $or: [{
        script: {
          $exists: false
        },
        processIncomingRequestScript: {
          $exists: true
        }
      }, {
        script: {
          $exists: false
        },
        prepareOutgoingRequestScript: {
          $exists: true
        }
      }, {
        script: {
          $exists: false
        },
        processOutgoingResponseScript: {
          $exists: true
        }
      }]
    }).fetch();
    integrations.forEach(function (integration) {
      let script = '';

      if (integration.processIncomingRequestScript) {
        script += `${integration.processIncomingRequestScript}\n\n`;
      }

      if (integration.prepareOutgoingRequestScript) {
        script += `${integration.prepareOutgoingRequestScript}\n\n`;
      }

      if (integration.processOutgoingResponseScript) {
        script += `${integration.processOutgoingResponseScript}\n\n`;
      }

      return RocketChat.models.Integrations.update(integration._id, {
        $set: {
          script: scriptAlert + script.replace(/^/gm, '// ')
        }
      });
    });
    let update = {
      $unset: {
        processIncomingRequestScript: 1,
        prepareOutgoingRequestScript: 1,
        processOutgoingResponseScript: 1
      }
    };
    RocketChat.models.Integrations.update({}, update, {
      multi: true
    });
    update = {
      $set: {
        enabled: true
      }
    };
    RocketChat.models.Integrations.update({
      enabled: {
        $exists: false
      }
    }, update, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v034.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v034.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 34,

  up() {
    return RocketChat.models.Settings.update({
      _id: 'Layout_Login_Header',
      value: '<a class="logo" href="/"><img src="/assets/logo/logo.svg?v=3" /></a>'
    }, {
      $set: {
        value: '<a class="logo" href="/"><img src="/assets/logo?v=3" /></a>'
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v035.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v035.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 35,

  up() {
    return RocketChat.models.Messages.update({
      'file._id': {
        $exists: true
      },
      'attachments.title_link': {
        $exists: true
      },
      'attachments.title_link_download': {
        $exists: false
      }
    }, {
      $set: {
        'attachments.$.title_link_download': true
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v036.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v036.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 0);
RocketChat.Migrations.add({
  version: 36,

  up() {
    const loginHeader = RocketChat.models.Settings.findOne({
      _id: 'Layout_Login_Header'
    });

    if (!loginHeader || !loginHeader.value) {
      return;
    }

    const match = loginHeader.value.match(/<img\ssrc=['"]([^'"]+)/);

    if (match && match.length === 2) {
      let requestUrl = match[1];

      if (requestUrl[0] === '/') {
        requestUrl = url.resolve(Meteor.absoluteUrl(), requestUrl);
      }

      try {
        Meteor.startup(function () {
          return Meteor.setTimeout(function () {
            const result = HTTP.get(requestUrl, {
              npmRequestOptions: {
                encoding: 'binary'
              }
            });

            if (result.statusCode === 200) {
              return RocketChat.Assets.setAsset(result.content, result.headers['content-type'], 'logo');
            }
          }, 30000);
        });
      } catch (e) {
        console.log(e);
      }
    }

    return RocketChat.models.Settings.remove({
      _id: 'Layout_Login_Header'
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v037.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v037.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 37,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Permissions) {
      // Find permission add-user (changed it to create-user)
      const addUserPermission = RocketChat.models.Permissions.findOne('add-user');

      if (addUserPermission) {
        RocketChat.models.Permissions.upsert({
          _id: 'create-user'
        }, {
          $set: {
            roles: addUserPermission.roles
          }
        });
        RocketChat.models.Permissions.remove({
          _id: 'add-user'
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v038.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v038.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 38,

  up() {
    if (RocketChat && RocketChat.settings && RocketChat.settings.get) {
      const allowPinning = RocketChat.settings.get('Message_AllowPinningByAnyone'); // If public pinning was allowed, add pinning permissions to 'users', else leave it to 'owners' and 'moderators'

      if (allowPinning) {
        if (RocketChat.models && RocketChat.models.Permissions) {
          RocketChat.models.Permissions.update({
            _id: 'pin-message'
          }, {
            $addToSet: {
              roles: 'user'
            }
          });
        }
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v039.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v039.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 39,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      const footer = RocketChat.models.Settings.findOne({
        _id: 'Layout_Sidenav_Footer'
      }); // Replace footer octicons with icons

      if (footer && footer.value !== '') {
        let footerValue = footer.value.replace('octicon octicon-pencil', 'icon-pencil');
        footerValue = footerValue.replace('octicon octicon-heart', 'icon-heart');
        footerValue = footerValue.replace('octicon octicon-mark-github', 'icon-github-circled');
        RocketChat.models.Settings.update({
          _id: 'Layout_Sidenav_Footer'
        }, {
          $set: {
            value: footerValue,
            packageValue: footerValue
          }
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v040.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v040.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 40,

  up() {
    RocketChat.models.Settings.find({
      _id: /Accounts_OAuth_Custom_/,
      i18nLabel: 'Accounts_OAuth_Custom_Enable'
    }).forEach(function (customOauth) {
      const parts = customOauth._id.split('_');

      const name = parts[3];
      const id = `Accounts_OAuth_Custom_${name}_token_sent_via`;

      if (!RocketChat.models.Settings.findOne({
        _id: id
      })) {
        RocketChat.models.Settings.insert({
          '_id': id,
          'type': 'select',
          'group': 'OAuth',
          'section': `Custom OAuth: ${name}`,
          'i18nLabel': 'Accounts_OAuth_Custom_Token_Sent_Via',
          'persistent': true,
          'values': [{
            'key': 'header',
            'i18nLabel': 'Header'
          }, {
            'key': 'payload',
            'i18nLabel': 'Payload'
          }],
          'packageValue': 'payload',
          'valueSource': 'packageValue',
          'ts': new Date(),
          'hidden': false,
          'blocked': false,
          'sorter': 255,
          'i18nDescription': `Accounts_OAuth_Custom_${name}_token_sent_via_Description`,
          'createdAt': new Date(),
          'value': 'payload'
        });
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v041.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v041.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 41,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Users) {
      RocketChat.models.Users.update({
        bot: true
      }, {
        $set: {
          type: 'bot'
        }
      }, {
        multi: true
      });
      RocketChat.models.Users.update({
        'profile.guest': true
      }, {
        $set: {
          type: 'visitor'
        }
      }, {
        multi: true
      });
      RocketChat.models.Users.update({
        type: {
          $exists: false
        }
      }, {
        $set: {
          type: 'user'
        }
      }, {
        multi: true
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v042.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v042.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 42,

  up() {
    const files = RocketChat.__migration_assets_files = new Mongo.Collection('assets.files');
    const chunks = RocketChat.__migration_assets_chunks = new Mongo.Collection('assets.chunks');
    const list = {
      'favicon.ico': 'favicon_ico',
      'favicon.svg': 'favicon',
      'favicon_64.png': 'favicon_64',
      'favicon_96.png': 'favicon_96',
      'favicon_128.png': 'favicon_128',
      'favicon_192.png': 'favicon_192',
      'favicon_256.png': 'favicon_256'
    };

    for (const from of Object.keys(list)) {
      const to = list[from];
      const query = {
        _id: to
      };

      if (!files.findOne(query)) {
        const oldFile = files.findOne({
          _id: from
        });

        if (oldFile) {
          const extension = RocketChat.Assets.mime.extension(oldFile.contentType);
          RocketChat.settings.removeById(`Assets_${from}`);
          RocketChat.settings.updateById(`Assets_${to}`, {
            url: `/assets/${to}.${extension}`,
            defaultUrl: RocketChat.Assets.assets[to].defaultUrl
          });
          oldFile._id = to;
          oldFile.filename = to;
          files.insert(oldFile);
          files.remove({
            _id: from
          });
          chunks.update({
            files_id: from
          }, {
            $set: {
              files_id: to
            }
          }, {
            multi: true
          });
        }
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v043.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v043.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 43,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Permissions) {
      RocketChat.models.Permissions.update({
        _id: 'pin-message'
      }, {
        $addToSet: {
          roles: 'admin'
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v044.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v044.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 44,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Users) {
      RocketChat.models.Users.find({
        $or: [{
          'settings.preferences.disableNewRoomNotification': {
            $exists: 1
          }
        }, {
          'settings.preferences.disableNewMessageNotification': {
            $exists: 1
          }
        }]
      }).forEach(function (user) {
        const newRoomNotification = !(user && user.settings && user.settings.preferences && user.settings.preferences.disableNewRoomNotification);
        const newMessageNotification = !(user && user.settings && user.settings.preferences && user.settings.preferences.disableNewMessageNotification);
        RocketChat.models.Users.update({
          _id: user._id
        }, {
          $unset: {
            'settings.preferences.disableNewRoomNotification': 1,
            'settings.preferences.disableNewMessageNotification': 1
          },
          $set: {
            'settings.preferences.newRoomNotification': newRoomNotification,
            'settings.preferences.newMessageNotification': newMessageNotification
          }
        });
      });
    }

    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      const optOut = RocketChat.models.Settings.findOne({
        _id: 'Statistics_opt_out'
      });

      if (optOut) {
        RocketChat.models.Settings.remove({
          _id: 'Statistics_opt_out'
        });
        RocketChat.models.Settings.upsert({
          _id: 'Statistics_reporting'
        }, {
          $set: {
            value: !optOut.value ? true : false,
            i18nDescription: 'Statistics_reporting_Description',
            packageValue: true,
            i18nLabel: 'Statistics_reporting'
          }
        });
      }
    }

    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      const favoriteRooms = RocketChat.models.Settings.findOne({
        _id: 'Disable_Favorite_Rooms'
      });

      if (favoriteRooms) {
        RocketChat.models.Settings.remove({
          _id: 'Disable_Favorite_Rooms'
        });
        RocketChat.models.Settings.upsert({
          _id: 'Favorite_Rooms'
        }, {
          $set: {
            value: !favoriteRooms.value ? true : false,
            i18nDescription: 'Favorite_Rooms_Description',
            packageValue: true,
            i18nLabel: 'Favorite_Rooms'
          }
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v045.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v045.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 45,

  up() {
    // finds the latest created visitor
    const lastVisitor = RocketChat.models.Users.find({
      type: 'visitor'
    }, {
      fields: {
        username: 1
      },
      sort: {
        createdAt: -1
      },
      limit: 1
    }).fetch();

    if (lastVisitor && lastVisitor.length > 0) {
      const lastNumber = lastVisitor[0].username.replace(/^guest\-/, '');
      RocketChat.settings.add('Livechat_guest_count', parseInt(lastNumber) + 1, {
        type: 'int',
        group: 'Livechat'
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v046.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v046.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 46,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Users) {
      RocketChat.models.Users.update({
        type: {
          $exists: false
        }
      }, {
        $set: {
          type: 'user'
        }
      }, {
        multi: true
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v047.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v047.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 47,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      const autolinkerUrls = RocketChat.models.Settings.findOne({
        _id: 'AutoLinker_Urls'
      });

      if (autolinkerUrls) {
        RocketChat.models.Settings.remove({
          _id: 'AutoLinker_Urls'
        });
        RocketChat.models.Settings.upsert({
          _id: 'AutoLinker_Urls_Scheme'
        }, {
          $set: {
            value: autolinkerUrls.value ? true : false,
            i18nLabel: 'AutoLinker_Urls_Scheme'
          }
        });
        RocketChat.models.Settings.upsert({
          _id: 'AutoLinker_Urls_www'
        }, {
          $set: {
            value: autolinkerUrls.value ? true : false,
            i18nLabel: 'AutoLinker_Urls_www'
          }
        });
        RocketChat.models.Settings.upsert({
          _id: 'AutoLinker_Urls_TLD'
        }, {
          $set: {
            value: autolinkerUrls.value ? true : false,
            i18nLabel: 'AutoLinker_Urls_TLD'
          }
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v048.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v048.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 48,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      const RocketBot_Enabled = RocketChat.models.Settings.findOne({
        _id: 'RocketBot_Enabled'
      });

      if (RocketBot_Enabled) {
        RocketChat.models.Settings.remove({
          _id: 'RocketBot_Enabled'
        });
        RocketChat.models.Settings.upsert({
          _id: 'InternalHubot_Enabled'
        }, {
          $set: {
            value: RocketBot_Enabled.value
          }
        });
      }

      const RocketBot_Name = RocketChat.models.Settings.findOne({
        _id: 'RocketBot_Name'
      });

      if (RocketBot_Name) {
        RocketChat.models.Settings.remove({
          _id: 'RocketBot_Name'
        });
        RocketChat.models.Settings.upsert({
          _id: 'InternalHubot_Username'
        }, {
          $set: {
            value: RocketBot_Name.value
          }
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v049.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v049.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 49,

  up() {
    let count = 1;
    RocketChat.models.Rooms.find({
      t: 'l'
    }, {
      sort: {
        ts: 1
      },
      fields: {
        _id: 1
      }
    }).forEach(function (room) {
      RocketChat.models.Rooms.update({
        _id: room._id
      }, {
        $set: {
          code: count
        }
      });
      RocketChat.models.Subscriptions.update({
        rid: room._id
      }, {
        $set: {
          code: count
        }
      }, {
        multi: true
      });
      count++;
    });
    RocketChat.models.Settings.upsert({
      _id: 'Livechat_Room_Count'
    }, {
      $set: {
        value: count,
        type: 'int',
        group: 'Livechat'
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v050.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v050.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 50,

  up() {
    RocketChat.models.Subscriptions.tryDropIndex('u._id_1_name_1_t_1');
    RocketChat.models.Subscriptions.tryEnsureIndex({
      'u._id': 1,
      'name': 1,
      't': 1
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v051.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v051.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 51,

  up() {
    RocketChat.models.Rooms.find({
      t: 'l',
      'v.token': {
        $exists: true
      },
      label: {
        $exists: false
      }
    }).forEach(function (room) {
      const user = RocketChat.models.Users.findOne({
        'profile.token': room.v.token
      });

      if (user) {
        RocketChat.models.Rooms.update({
          _id: room._id
        }, {
          $set: {
            label: user.name || user.username,
            'v._id': user._id
          }
        });
        RocketChat.models.Subscriptions.update({
          rid: room._id
        }, {
          $set: {
            name: user.name || user.username
          }
        }, {
          multi: true
        });
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v052.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v052.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 52,

  up() {
    RocketChat.models.Users.update({
      _id: 'rocket.cat'
    }, {
      $addToSet: {
        roles: 'bot'
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v053.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v053.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 53,

  up() {
    RocketChat.models.Settings.update({
      _id: 'Email_Header',
      value: ''
    }, {
      $set: {
        value: '<table border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#f3f3f3" style="color:#4a4a4a;font-family: Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;border-collapse:callapse;border-spacing:0;margin:0 auto"><tr><td style="padding:1em"><table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="width:100%;margin:0 auto;max-width:800px"><tr><td bgcolor="#ffffff" style="background-color:#ffffff; border: 1px solid #DDD; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="background-color: #04436a;"><h1 style="font-family: Helvetica,Arial,sans-serif; padding: 0 1em; margin: 0; line-height: 70px; color: #FFF;">[Site_Name]</h1></td></tr><tr><td style="padding: 1em; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;">'
      }
    });
    RocketChat.models.Settings.update({
      _id: 'Email_Footer',
      value: ''
    }, {
      $set: {
        value: '</td></tr></table></td></tr><tr><td border="0" cellspacing="0" cellpadding="0" width="100%" style="font-family: Helvetica,Arial,sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em; text-align: center; font-size: 8pt; color: #999;">Powered by <a href="https://rocket.chat" target="_blank">Rocket.Chat</a></td></tr></table></td></tr></table>'
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v054.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v054.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 54,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Users) {
      // Set default message viewMode to 'normal' or 'cozy' depending on the users' current settings and remove the field 'compactView'
      RocketChat.models.Users.update({
        'settings.preferences.compactView': true
      }, {
        $set: {
          'settings.preferences.viewMode': 1
        },
        $unset: {
          'settings.preferences.compactView': 1
        }
      }, {
        multi: true
      });
      RocketChat.models.Users.update({
        'settings.preferences.viewMode': {
          $ne: 1
        }
      }, {
        $set: {
          'settings.preferences.viewMode': 0
        }
      }, {
        multi: true
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v055.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v055.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
RocketChat.Migrations.add({
  version: 55,

  up() {
    RocketChat.models.Rooms.find({
      'topic': {
        $exists: 1,
        $ne: ''
      }
    }, {
      topic: 1
    }).forEach(function (room) {
      const topic = s.escapeHTML(room.topic);
      RocketChat.models.Rooms.update({
        _id: room._id
      }, {
        $set: {
          topic
        }
      });
      RocketChat.models.Messages.update({
        t: 'room_changed_topic',
        rid: room._id
      }, {
        $set: {
          msg: topic
        }
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v056.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v056.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 56,

  up() {
    RocketChat.models.Messages.find({
      _id: /\./
    }).forEach(function (message) {
      const oldId = message._id;
      message._id = message._id.replace(/(.*)\.S?(.*)/, 'slack-$1-$2');
      RocketChat.models.Messages.insert(message);
      RocketChat.models.Messages.remove({
        _id: oldId
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v057.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v057.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 57,

  up() {
    RocketChat.models.Messages.find({
      _id: /slack-([a-zA-Z0-9]+)S([0-9]+-[0-9]+)/
    }).forEach(function (message) {
      const oldId = message._id;
      message._id = message._id.replace(/slack-([a-zA-Z0-9]+)S([0-9]+-[0-9]+)/, 'slack-$1-$2');
      RocketChat.models.Messages.insert(message);
      RocketChat.models.Messages.remove({
        _id: oldId
      });
    });
    RocketChat.models.Messages.find({
      _id: /slack-slack/
    }).forEach(function (message) {
      const oldId = message._id;
      message._id = message._id.replace('slack-slack', 'slack');
      RocketChat.models.Messages.insert(message);
      RocketChat.models.Messages.remove({
        _id: oldId
      });
    });
    RocketChat.models.Messages.find({
      _id: /\./
    }).forEach(function (message) {
      const oldId = message._id;
      message._id = message._id.replace(/(.*)\.?S(.*)/, 'slack-$1-$2');
      message._id = message._id.replace(/\./g, '-');
      RocketChat.models.Messages.remove({
        _id: message._id
      });
      RocketChat.models.Messages.insert(message);
      RocketChat.models.Messages.remove({
        _id: oldId
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v058.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v058.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 58,

  up() {
    RocketChat.models.Settings.update({
      _id: 'Push_gateway',
      value: 'https://rocket.chat'
    }, {
      $set: {
        value: 'https://gateway.rocket.chat',
        packageValue: 'https://gateway.rocket.chat'
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v059.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v059.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 59,

  up() {
    const users = RocketChat.models.Users.find({}, {
      sort: {
        createdAt: 1
      },
      limit: 1
    }).fetch();

    if (users && users.length > 0) {
      const createdAt = users[0].createdAt;
      RocketChat.models.Settings.update({
        createdAt: {
          $exists: 0
        }
      }, {
        $set: {
          createdAt
        }
      }, {
        multi: true
      });
      RocketChat.models.Statistics.update({
        installedAt: {
          $exists: 0
        }
      }, {
        $set: {
          installedAt: createdAt
        }
      }, {
        multi: true
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v060.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v060.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.Migrations.add({
  version: 60,

  up() {
    let subscriptions = RocketChat.models.Subscriptions.find({
      $or: [{
        name: {
          $exists: 0
        }
      }, {
        name: {
          $not: {
            $type: 2
          }
        }
      }]
    }).fetch();

    if (subscriptions && subscriptions.length > 0) {
      RocketChat.models.Subscriptions.remove({
        _id: {
          $in: _.pluck(subscriptions, '_id')
        }
      });
    }

    subscriptions = RocketChat.models.Subscriptions.find().forEach(function (subscription) {
      const user = RocketChat.models.Users.findOne({
        _id: subscription && subscription.u && subscription.u._id
      });

      if (!user) {
        RocketChat.models.Subscriptions.remove({
          _id: subscription._id
        });
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v061.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v061.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 61,

  up() {
    RocketChat.models.Users.find({
      active: false
    }).forEach(function (user) {
      RocketChat.models.Subscriptions.setArchivedByUsername(user.username, true);
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v062.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v062.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 62,

  up() {
    RocketChat.models.Settings.remove({
      _id: 'Atlassian Crowd',
      type: 'group'
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v063.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v063.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 63,

  up() {
    const forward = RocketChat.models.Settings.findOne({
      _id: 'Livechat_forward_open_chats'
    });
    const timeout = RocketChat.models.Settings.findOne({
      _id: 'Livechat_forward_open_chats_timeout'
    });

    if (forward && forward.value) {
      RocketChat.models.Settings.upsert({
        _id: 'Livechat_agent_leave_action'
      }, {
        $set: {
          value: 'forward',
          type: 'string',
          group: 'Livechat'
        }
      });
    }

    if (timeout && timeout.value !== 60) {
      RocketChat.models.Settings.upsert({
        _id: 'Livechat_agent_leave_action_timeout'
      }, {
        $set: {
          value: timeout.value,
          type: 'int',
          group: 'Livechat'
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'Livechat_forward_open_chats'
    });
    RocketChat.models.Settings.remove({
      _id: 'Livechat_forward_open_chats_timeout'
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v064.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v064.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
RocketChat.Migrations.add({
  version: 64,

  up() {
    RocketChat.models.Messages.find({
      't': 'room_changed_topic',
      'msg': /</
    }, {
      msg: 1
    }).forEach(function (message) {
      const msg = s.escapeHTML(message.msg);
      RocketChat.models.Messages.update({
        _id: message._id
      }, {
        $set: {
          msg
        }
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v065.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v065.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 65,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      // New color settings - start with old settings as defaults
      const replace1 = RocketChat.models.Settings.findOne({
        _id: 'theme-color-quaternary-font-color'
      });
      const replace2 = RocketChat.models.Settings.findOne({
        _id: 'theme-color-input-font-color'
      });
      const replace3 = RocketChat.models.Settings.findOne({
        _id: 'theme-color-status-online'
      });
      const replace4 = RocketChat.models.Settings.findOne({
        _id: 'theme-color-status-away'
      });
      const replace5 = RocketChat.models.Settings.findOne({
        _id: 'theme-color-status-busy'
      });
      const replace6 = RocketChat.models.Settings.findOne({
        _id: 'theme-color-info-active-font-color'
      });

      if (replace1) {
        RocketChat.models.Settings.upsert({
          _id: 'theme-color-secondary-action-color'
        }, {
          $set: {
            value: replace1.value
          }
        });
      }

      if (replace2) {
        RocketChat.models.Settings.upsert({
          _id: 'theme-color-component-color'
        }, {
          $set: {
            value: replace2.value
          }
        });
      }

      if (replace3) {
        RocketChat.models.Settings.upsert({
          _id: 'theme-color-success-color'
        }, {
          $set: {
            value: replace3.value
          }
        });
      }

      if (replace4) {
        RocketChat.models.Settings.upsert({
          _id: 'theme-color-pending-color'
        }, {
          $set: {
            value: replace4.value
          }
        });
      }

      if (replace5) {
        RocketChat.models.Settings.upsert({
          _id: 'theme-color-error-color'
        }, {
          $set: {
            value: replace5.value
          }
        });
      }

      if (replace6) {
        RocketChat.models.Settings.upsert({
          _id: 'theme-color-selection-color'
        }, {
          $set: {
            value: replace6.value
          }
        });
      } // Renamed color settings


      const oldColor = RocketChat.models.Settings.findOne({
        _id: 'theme-color-action-buttons-color'
      });

      if (oldColor) {
        RocketChat.models.Settings.remove({
          _id: 'theme-color-action-buttons-color'
        });
        RocketChat.models.Settings.upsert({
          _id: 'theme-color-primary-action-color'
        }, {
          $set: {
            value: oldColor.value
          }
        });
      } // Removed color settings


      RocketChat.models.Settings.remove({
        _id: 'theme-color-quaternary-font-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-active-channel-background-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-active-channel-font-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-blockquote-background'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-clean-buttons-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-code-background'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-code-border'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-code-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-info-active-font-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-input-font-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-message-hover-background-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-smallprint-font-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-smallprint-hover-color'
      });
      RocketChat.models.Settings.remove({
        _id: 'theme-color-unread-notification-color'
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v066.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v066.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 66,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      // New color settings - start with old settings as defaults
      const replace1 = RocketChat.models.Settings.findOne({
        _id: 'theme-color-tertiary-background-color'
      });

      if (replace1) {
        RocketChat.models.Settings.upsert({
          _id: 'theme-color-component-color'
        }, {
          $set: {
            value: replace1.value
          }
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v067.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v067.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 67,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.LivechatDepartment) {
      RocketChat.models.LivechatDepartment.model.update({}, {
        $set: {
          showOnRegistration: true
        }
      }, {
        multi: true
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v068.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v068.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 68,

  up() {
    const GoogleSiteVerification_id = RocketChat.models.Settings.findOne({
      _id: 'GoogleSiteVerification_id'
    });

    if (GoogleSiteVerification_id && GoogleSiteVerification_id.value) {
      RocketChat.models.Settings.update({
        _id: 'Meta_google-site-verification'
      }, {
        $set: {
          value: GoogleSiteVerification_id.value
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'GoogleSiteVerification_id'
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v069.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v069.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 69,

  up() {
    RocketChat.models.Settings.update({
      '_id': 'theme-color-custom-scrollbar-color',
      'value': 'rgba(255, 255, 255, 0.05)'
    }, {
      $set: {
        'editor': 'expression',
        'value': '@transparent-darker'
      }
    });
    RocketChat.models.Settings.update({
      '_id': 'theme-color-info-font-color',
      'value': '#aaaaaa'
    }, {
      $set: {
        'editor': 'expression',
        'value': '@secondary-font-color'
      }
    });
    RocketChat.models.Settings.update({
      '_id': 'theme-color-link-font-color',
      'value': '#008ce3'
    }, {
      $set: {
        'editor': 'expression',
        'value': '@primary-action-color'
      }
    });
    RocketChat.models.Settings.update({
      '_id': 'theme-color-status-away',
      'value': '#fcb316'
    }, {
      $set: {
        'editor': 'expression',
        'value': '@pending-color'
      }
    });
    RocketChat.models.Settings.update({
      '_id': 'theme-color-status-busy',
      'value': '#d30230'
    }, {
      $set: {
        'editor': 'expression',
        'value': '@error-color'
      }
    });
    RocketChat.models.Settings.update({
      '_id': 'theme-color-status-offline',
      'value': 'rgba(150, 150, 150, 0.50)'
    }, {
      $set: {
        'editor': 'expression',
        'value': '@transparent-darker'
      }
    });
    RocketChat.models.Settings.update({
      '_id': 'theme-color-status-online',
      'value': '#35ac19'
    }, {
      $set: {
        'editor': 'expression',
        'value': '@success-color'
      }
    });
    RocketChat.models.Settings.update({
      '_id': 'theme-color-tertiary-background-color',
      'value': '#eaeaea'
    }, {
      $set: {
        'editor': 'expression',
        'value': '@component-color'
      }
    });
    return RocketChat.models.Settings.update({
      '_id': 'theme-color-tertiary-font-color',
      'value': 'rgba(255, 255, 255, 0.6)'
    }, {
      $set: {
        'editor': 'expression',
        'value': '@transparent-lightest'
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v070.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v070.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 70,

  up() {
    const settings = RocketChat.models.Settings.find({
      _id: /^Accounts_OAuth_Custom_.+/
    }).fetch();

    for (const setting of settings) {
      const _id = setting._id;
      setting._id = setting._id.replace(/Accounts_OAuth_Custom_([A-Za-z0-9]+)_(.+)/, 'Accounts_OAuth_Custom-$1-$2');
      setting._id = setting._id.replace(/Accounts_OAuth_Custom_([A-Za-z0-9]+)/, 'Accounts_OAuth_Custom-$1');
      RocketChat.models.Settings.remove({
        _id
      });
      RocketChat.models.Settings.insert(setting);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v071.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v071.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 71,

  up() {
    //Removes the reactions on messages which are the system type "rm" ;)
    RocketChat.models.Messages.find({
      't': 'rm',
      'reactions': {
        $exists: true,
        $not: {
          $size: 0
        }
      }
    }, {
      t: 1
    }).forEach(function (message) {
      RocketChat.models.Messages.update({
        _id: message._id
      }, {
        $set: {
          reactions: []
        }
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v072.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v072.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 72,

  up() {
    RocketChat.models.Users.find({
      type: 'visitor',
      'emails.address': {
        $exists: true
      }
    }, {
      emails: 1
    }).forEach(function (visitor) {
      RocketChat.models.Users.update({
        _id: visitor._id
      }, {
        $set: {
          visitorEmails: visitor.emails
        },
        $unset: {
          emails: 1
        }
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v073.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v073.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 73,

  up() {
    RocketChat.models.Users.find({
      'oauth.athorizedClients': {
        $exists: true
      }
    }, {
      oauth: 1
    }).forEach(function (user) {
      RocketChat.models.Users.update({
        _id: user._id
      }, {
        $set: {
          'oauth.authorizedClients': user.oauth.athorizedClients
        },
        $unset: {
          'oauth.athorizedClients': 1
        }
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v074.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v074.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 74,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      RocketChat.models.Settings.remove({
        _id: 'Assets_favicon_64'
      });
      RocketChat.models.Settings.remove({
        _id: 'Assets_favicon_96'
      });
      RocketChat.models.Settings.remove({
        _id: 'Assets_favicon_128'
      });
      RocketChat.models.Settings.remove({
        _id: 'Assets_favicon_256'
      });
      RocketChat.models.Settings.update({
        _id: 'Assets_favicon_192'
      }, {
        $set: {
          i18nLabel: 'android-chrome 192x192 (png)'
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v075.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v075.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 71.1,

  up() {
    ServiceConfiguration.configurations.remove({});
  }

});
RocketChat.Migrations.add({
  version: 75,

  up() {
    ServiceConfiguration.configurations.remove({});
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v076.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v076.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 76,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      RocketChat.models.Settings.find({
        section: 'Colors (alphas)'
      }).forEach(setting => {
        RocketChat.models.Settings.remove({
          _id: setting._id
        });
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v077.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v077.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 77,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Rooms) {
      RocketChat.models.Rooms.find({
        t: 'l',
        'v._id': {
          $exists: true
        },
        'v.username': {
          $exists: false
        }
      }, {
        fields: {
          'v._id': 1
        }
      }).forEach(function (room) {
        const user = RocketChat.models.Users.findOne({
          _id: room.v._id
        }, {
          username: 1
        });

        if (user && user.username) {
          RocketChat.models.Rooms.update({
            _id: room._id
          }, {
            $set: {
              'v.username': user.username
            }
          });
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v078.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v078.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 78,

  up() {
    RocketChat.models.Permissions.update({
      _id: {
        $in: ['create-c', 'create-d', 'create-p']
      }
    }, {
      $addToSet: {
        roles: 'bot'
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v079.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v079.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 79,

  up() {
    const integrations = RocketChat.models.Integrations.find({
      type: 'webhook-incoming'
    }).fetch();

    for (const integration of integrations) {
      if (typeof integration.channel === 'string') {
        RocketChat.models.Integrations.update({
          _id: integration._id
        }, {
          $set: {
            channel: integration.channel.split(',').map(channel => channel.trim())
          }
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v080.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v080.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 80,

  up() {
    const query = {
      type: 'webhook-outgoing',
      $or: [{
        channel: []
      }, {
        channel: ''
      }, {
        channel: {
          $exists: false
        }
      }]
    };
    const update = {
      $set: {
        channel: ['all_public_channels']
      }
    };
    RocketChat.models.Integrations.update(query, update, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v081.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v081.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 81,

  up() {
    RocketChat.models.OAuthApps.update({
      _id: 'zapier'
    }, {
      $set: {
        active: true,
        redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/App32270API/'
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v082.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v082.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 82,

  up() {
    const admins = RocketChat.authz.getUsersInRole('admin').fetch();

    if (admins.length === 1 && admins[0]._id === 'rocket.cat') {
      RocketChat.authz.removeUserFromRoles('rocket.cat', 'admin');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v083.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v083.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 83,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings && RocketChat.models.Users) {
      const setting = RocketChat.models.Settings.findOne({
        _id: 'InternalHubot_Username'
      });

      if (setting && setting.value) {
        const username = setting.value;
        const user = RocketChat.models.Users.findOne({
          username
        });

        if (!user && setting.value === 'Rocket.Cat') {
          RocketChat.models.Settings.update({
            _id: 'InternalHubot_Username'
          }, {
            $set: {
              value: 'rocket.cat',
              packageValue: 'rocket.cat'
            }
          });
        }
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v084.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v084.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 84,

  up() {
    if (RocketChat.models && RocketChat.models.Permissions) {
      // Update permission name, copy values from old name
      const oldPermission = RocketChat.models.Permissions.findOne('add-user-to-room');

      if (oldPermission && oldPermission.roles.length) {
        RocketChat.models.Permissions.upsert({
          _id: 'add-user-to-joined-room'
        }, {
          $set: {
            roles: oldPermission.roles
          }
        });
        RocketChat.models.Permissions.remove({
          _id: 'add-user-to-room'
        });
      }
    }
  },

  down() {
    if (RocketChat.models && RocketChat.models.Permissions) {
      // Revert permission name, copy values from updated name
      const newPermission = RocketChat.models.Permissions.findOne('add-user-to-joined-room');

      if (newPermission && newPermission.roles.length) {
        RocketChat.models.Permissions.upsert({
          _id: 'add-user-to-room'
        }, {
          $set: {
            roles: newPermission.roles
          }
        });
        RocketChat.models.Permissions.remove({
          _id: 'add-user-to-joined-room'
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v085.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v085.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 85,

  up() {
    const query = {
      t: 'p',
      usernames: {
        $size: 2
      },
      u: {
        $exists: false
      },
      name: {
        $exists: false
      }
    };
    const rooms = RocketChat.models.Rooms.find(query).fetch();

    if (rooms.length > 0) {
      const rids = rooms.map(room => room._id);
      RocketChat.models.Rooms.update({
        _id: {
          $in: rids
        }
      }, {
        $set: {
          t: 'd'
        }
      }, {
        multi: true
      });
      RocketChat.models.Subscriptions.update({
        rid: {
          $in: rids
        }
      }, {
        $set: {
          t: 'd'
        }
      }, {
        multi: true
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v086.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v086.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 86,

  up() {// Disabled this migration for it was not updating any user
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v087.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v087.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 87,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Users) {
      RocketChat.models.Users.update({
        'settings.preferences.newMessageNotification': false
      }, {
        $set: {
          'settings.preferences.newMessageNotification': 'none'
        }
      }, {
        multi: true
      });
      RocketChat.models.Users.update({
        'settings.preferences.newMessageNotification': true
      }, {
        $unset: {
          'settings.preferences.newMessageNotification': 1
        }
      }, {
        multi: true
      });
      RocketChat.models.Users.update({
        'settings.preferences.newRoomNotification': false
      }, {
        $set: {
          'settings.preferences.newRoomNotification': 'none'
        }
      }, {
        multi: true
      });
      RocketChat.models.Users.update({
        'settings.preferences.newRoomNotification': true
      }, {
        $unset: {
          'settings.preferences.newRoomNotification': 1
        }
      }, {
        multi: true
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v088.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v088.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 88,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      const setting = RocketChat.models.Settings.findOne({
        _id: 'Layout_Sidenav_Footer'
      });

      if (setting && setting.value && setting.packageValue) {
        if (setting.value === '<img style="left: 10px; position: absolute;" src="/assets/logo.png" />') {
          RocketChat.models.Settings.update({
            _id: 'Layout_Sidenav_Footer'
          }, {
            $set: {
              value: setting.packageValue
            }
          });
        }
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v089.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v089.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 89,

  up() {
    const outgoingIntegrations = RocketChat.models.Integrations.find({
      type: 'webhook-outgoing'
    }, {
      fields: {
        name: 1
      }
    }).fetch();
    outgoingIntegrations.forEach(i => {
      RocketChat.models.Integrations.update(i._id, {
        $set: {
          event: 'sendMessage',
          retryFailedCalls: true,
          retryCount: 6,
          retryDelay: 'powers-of-ten'
        }
      });
    });
  },

  down() {
    const outgoingIntegrations = RocketChat.models.Integrations.find({
      type: 'webhook-outgoing',
      event: {
        $ne: 'sendMessage'
      }
    }, {
      fields: {
        name: 1
      }
    }).fetch();
    outgoingIntegrations.forEach(i => {
      RocketChat.models.Integrations.update(i._id, {
        $set: {
          enabled: false
        }
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v090.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v090.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 90,

  up() {
    RocketChat.models.Settings.remove({
      _id: 'Piwik',
      type: 'group'
    });
    const settings = RocketChat.models.Settings.find({
      $or: [{
        _id: 'PiwikAnalytics_url',
        value: {
          $ne: null
        }
      }, {
        _id: 'PiwikAnalytics_siteId',
        value: {
          $ne: null
        }
      }]
    }).fetch();

    if (settings && settings.length === 2) {
      RocketChat.models.Settings.upsert({
        _id: 'PiwikAnalytics_enabled'
      }, {
        $set: {
          value: true
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v091.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v091.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 91,

  up() {
    const query = {
      'services.linkedin': {
        $exists: 1
      },
      $or: [{
        name: {
          $exists: 0
        }
      }, {
        name: null
      }]
    };
    RocketChat.models.Users.find(query, {
      'services.linkedin.firstName': 1,
      username: 1
    }).forEach(user => {
      const name = `${user.services.linkedin.firstName} ${user.services.linkedin.lastName}`;
      RocketChat.models.Users.setName(user._id, name);
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v092.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v092.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 92,

  up() {
    const outgoingIntegrations = RocketChat.models.Integrations.find({
      type: 'webhook-outgoing',
      'event': 'sendMessage'
    }, {
      fields: {
        name: 1
      }
    }).fetch();
    outgoingIntegrations.forEach(i => {
      RocketChat.models.Integrations.update(i._id, {
        $set: {
          runOnEdits: true
        }
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v093.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v093.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 93,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      const setting = RocketChat.models.Settings.findOne({
        _id: 'Accounts_AllowAnonymousAccess'
      });

      if (setting && setting.value === true) {
        RocketChat.models.Settings.update({
          _id: 'Accounts_AllowAnonymousRead'
        }, {
          $set: {
            value: setting.value
          }
        });
      }
    }

    const query = {
      _id: {
        $in: ['view-c-room', 'view-history', 'view-joined-room', 'view-p-room', 'preview-c-room']
      }
    };
    const update = {
      $addToSet: {
        roles: 'anonymous'
      }
    };
    RocketChat.models.Permissions.update(query, update, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v094.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v094.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 94,

  up() {
    const query = {
      'emails.address.address': {
        $exists: true
      }
    };
    RocketChat.models.Users.find(query, {
      'emails.address.address': 1
    }).forEach(user => {
      let emailAddress;
      user.emails.some(email => {
        if (email.address && email.address.address) {
          emailAddress = email.address.address;
          return true;
        }
      });
      const existingUser = RocketChat.models.Users.findOne({
        'emails.address': emailAddress
      }, {
        fields: {
          _id: 1
        }
      });

      if (existingUser) {
        RocketChat.models.Users.update({
          _id: user._id,
          'emails.address.address': emailAddress
        }, {
          $unset: {
            'emails.$': 1
          }
        });
      } else {
        RocketChat.models.Users.update({
          _id: user._id,
          'emails.address.address': emailAddress
        }, {
          $set: {
            'emails.$.address': emailAddress
          }
        });
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v095.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v095.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 95,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      const emailHeader = RocketChat.models.Settings.findOne({
        _id: 'Email_Header'
      });
      const emailFooter = RocketChat.models.Settings.findOne({
        _id: 'Email_Footer'
      });
      const startWithHTML = emailHeader.value.match(/^<html>/);
      const endsWithHTML = emailFooter.value.match(/<\/html>$/);

      if (!startWithHTML) {
        RocketChat.models.Settings.update({
          _id: 'Email_Header'
        }, {
          $set: {
            value: `<html>${emailHeader.value}`
          }
        });
      }

      if (!endsWithHTML) {
        RocketChat.models.Settings.update({
          _id: 'Email_Footer'
        }, {
          $set: {
            value: `${emailFooter.value}</html>`
          }
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v096.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v096.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 96,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
      RocketChat.models.Settings.update({
        _id: 'InternalHubot_ScriptsToLoad'
      }, {
        $set: {
          value: ''
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v097.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v097.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 97,

  up() {// Migration moved to 099.js to fix a bug
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v098.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v098.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 98,

  up() {
    RocketChat.models.OAuthApps.update({
      _id: 'zapier'
    }, {
      $set: {
        redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/RocketChatDevAPI/'
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v099.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v099.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let path;
module.watch(require("path"), {
  default(v) {
    path = v;
  }

}, 1);

function log(...args) {
  console.log('[AVATAR]', ...args);
}

function logError(...args) {
  console.error('[AVATAR]', ...args);
}

function insertAvatar({
  details,
  avatarsFileStore,
  stream,
  callback = () => {}
}) {
  return new Promise(resolve => {
    Meteor.defer(() => {
      Meteor.runAsUser('rocket.cat', () => {
        avatarsFileStore.insert(details, stream, err => {
          if (err) {
            logError({
              err
            });
            resolve();
          } else {
            Meteor.setTimeout(() => {
              callback();
            }, 200);
          }

          resolve();
        });
      });
    });
  });
}

function batch(arr, limit, fn) {
  if (!arr.length) {
    return Promise.resolve();
  }

  return Promise.all(arr.splice(0, limit).map(item => {
    return fn(item);
  })).then(() => {
    return batch(arr, limit, fn);
  });
}

RocketChat.Migrations.add({
  version: 99,

  up() {
    log('Migrating avatars. This might take a while.');
    const query = {
      $or: [{
        's3.path': {
          $exists: true
        }
      }, {
        'googleCloudStorage.path': {
          $exists: true
        }
      }]
    };
    RocketChat.models.Uploads.find(query).forEach(record => {
      if (record.s3) {
        RocketChat.models.Uploads.model.direct.update({
          _id: record._id
        }, {
          $set: {
            'store': 'AmazonS3:Uploads',
            AmazonS3: {
              path: record.s3.path + record._id
            }
          },
          $unset: {
            s3: 1
          }
        }, {
          multi: true
        });
      } else {
        RocketChat.models.Uploads.model.direct.update({
          _id: record._id
        }, {
          $set: {
            store: 'GoogleCloudStorage:Uploads',
            GoogleStorage: {
              path: record.googleCloudStorage.path + record._id
            }
          },
          $unset: {
            googleCloudStorage: 1
          }
        }, {
          multi: true
        });
      }
    });
    RocketChat.models.Uploads.model.direct.update({
      store: 'fileSystem'
    }, {
      $set: {
        store: 'FileSystem:Uploads'
      }
    }, {
      multi: true
    });
    RocketChat.models.Uploads.model.direct.update({
      store: 'rocketchat_uploads'
    }, {
      $set: {
        store: 'GridFS:Uploads'
      }
    }, {
      multi: true
    });
    const avatarOrigins = ['upload', 'gravatar', 'facebook', 'twitter', 'github', 'google', 'url', 'gitlab', 'linkedin'];
    const avatarsPathRecord = RocketChat.models.Settings.findOne({
      _id: 'Accounts_AvatarStorePath'
    });
    const avatarStoreTypeRecord = RocketChat.models.Settings.findOne({
      _id: 'Accounts_AvatarStoreType'
    });
    const avatarsPath = avatarsPathRecord ? avatarsPathRecord.value : process.env.AVATARS_PATH;
    let avatarStoreType = avatarStoreTypeRecord && avatarStoreTypeRecord.value;
    const oldAvatarGridFS = new RocketChatFile.GridFS({
      name: 'avatars'
    });

    if (avatarStoreType == null) {
      const count = oldAvatarGridFS.countSync();

      if (Match.test(count, Number) && count > 0) {
        avatarStoreType = 'GridFS';
      } else if (Match.test(avatarsPath, String) && avatarsPath.length > 0) {
        avatarStoreType = 'FileSystem';
      } else {
        SystemLogger.error_box('Can\'t define the avatar\'s storage type.\nIf you have avatars missing and they was stored in your file system\nrun the process including the following environment variables: \n  AVATARS_PATH=\'YOUR AVATAR\'S DIRECTORY\'\n  MIGRATION_VERSION=99,rerun', 'WARNING');
        return;
      }
    }

    Meteor.startup(function () {
      Meteor.setTimeout(function () {
        const avatarsFileStore = FileUpload.getStore('Avatars');
        const users = RocketChat.models.Users.find({
          avatarOrigin: {
            $in: avatarOrigins
          }
        }, {
          avatarOrigin: 1,
          username: 1
        }).fetch();
        const usersTotal = users.length;
        log('Total users to migrate avatars ->', usersTotal);
        let current = 0;
        batch(users, 300, user => {
          const id = `${user.username}.jpg`;
          const gridFSAvatar = oldAvatarGridFS.getFileWithReadStream(id);
          log('Migrating', ++current, 'of', usersTotal);

          if (gridFSAvatar) {
            const details = {
              userId: user._id,
              type: gridFSAvatar.contentType,
              size: gridFSAvatar.length
            };
            return insertAvatar({
              details,
              avatarsFileStore,
              stream: gridFSAvatar.readStream,

              callback() {
                oldAvatarGridFS.deleteFile(id);
              }

            });
          }

          if (avatarStoreType === 'FileSystem' && avatarsPath && avatarsPath.trim()) {
            try {
              const filePath = path.join(avatarsPath, id);
              const stat = fs.statSync(filePath);

              if (stat && stat.isFile()) {
                const details = {
                  userId: user._id,
                  type: 'image/jpeg',
                  size: stat.size
                };
                return insertAvatar({
                  details,
                  avatarsFileStore,
                  stream: fs.createReadStream(filePath),

                  callback() {
                    fs.unlinkSync(filePath);
                  }

                });
              }
            } catch (e) {
              logError('Error migrating old avatar', e);
              return Promise.resolve();
            }
          }
        }).then(() => {
          const avatarsFiles = new Mongo.Collection('avatars.files');
          const avatarsChunks = new Mongo.Collection('avatars.chunks');
          avatarsFiles.rawCollection().drop();
          avatarsChunks.rawCollection().drop();
          RocketChat.models.Settings.remove({
            _id: 'Accounts_AvatarStoreType'
          });
          RocketChat.models.Settings.remove({
            _id: 'Accounts_AvatarStorePath'
          });
        });
      }, 1000);
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v100.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v100.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 100,

  up() {
    RocketChat.models.Subscriptions.update({
      audioNotification: {
        $exists: 1
      }
    }, {
      $rename: {
        'audioNotification': 'audioNotifications'
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v101.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v101.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 101,

  up() {
    RocketChat.models.Subscriptions.update({
      lastActivity: {
        $exists: 1
      }
    }, {
      $unset: {
        'lastActivity': ''
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v102.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v102.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 102,

  up() {
    if (!RocketChat || !RocketChat.models || !RocketChat.models.Settings) {
      return;
    }

    RocketChat.models.Settings.update({
      _id: 'LDAP_Connect_Timeout',
      value: 600000
    }, {
      $set: {
        value: 1000
      }
    });
    RocketChat.models.Settings.update({
      _id: 'LDAP_Idle_Timeout',
      value: 600000
    }, {
      $set: {
        value: 1000
      }
    });
    const LDAP_Domain_Base = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Domain_Base'
    });

    if (LDAP_Domain_Base) {
      RocketChat.models.Settings.update({
        _id: 'LDAP_BaseDN'
      }, {
        $set: {
          value: LDAP_Domain_Base.value
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'LDAP_Domain_Base'
    });
    const LDAP_Domain_Search_User_ID = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Domain_Search_User_ID'
    });

    if (LDAP_Domain_Search_User_ID) {
      RocketChat.models.Settings.update({
        _id: 'LDAP_User_Search_Field'
      }, {
        $set: {
          value: LDAP_Domain_Search_User_ID.value
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'LDAP_Domain_Search_User_ID'
    });
    const LDAP_Use_Custom_Domain_Search = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Use_Custom_Domain_Search'
    });
    const LDAP_Custom_Domain_Search = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Custom_Domain_Search'
    });
    const LDAP_Domain_Search_User = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Domain_Search_User'
    });
    const LDAP_Domain_Search_Password = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Domain_Search_Password'
    });
    const LDAP_Domain_Search_Filter = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Domain_Search_Filter'
    });
    const LDAP_Domain_Search_Object_Class = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Domain_Search_Object_Class'
    });
    const LDAP_Domain_Search_Object_Category = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Domain_Search_Object_Category'
    });

    if (LDAP_Use_Custom_Domain_Search) {
      if (LDAP_Use_Custom_Domain_Search.value === true) {
        let Custom_Domain_Search;

        try {
          Custom_Domain_Search = JSON.parse(LDAP_Custom_Domain_Search.value);
        } catch (error) {
          throw new Error('Invalid Custom Domain Search JSON');
        }

        LDAP_Domain_Search_User.value = Custom_Domain_Search.userDN || '';
        LDAP_Domain_Search_Password.value = Custom_Domain_Search.password || '';
        LDAP_Domain_Search_Filter.value = Custom_Domain_Search.filter;
      } else {
        const filter = [];

        if (LDAP_Domain_Search_Object_Category.value !== '') {
          filter.push(`(objectCategory=${LDAP_Domain_Search_Object_Category.value})`);
        }

        if (LDAP_Domain_Search_Object_Class.value !== '') {
          filter.push(`(objectclass=${LDAP_Domain_Search_Object_Class.value})`);
        }

        if (LDAP_Domain_Search_Filter.value !== '') {
          filter.push(`(${LDAP_Domain_Search_Filter.value})`);
        }

        if (filter.length === 1) {
          LDAP_Domain_Search_Filter.value = filter[0];
        } else if (filter.length > 1) {
          LDAP_Domain_Search_Filter.value = `(&${filter.join('')})`;
        }
      }
    }

    if (LDAP_Domain_Search_Filter && LDAP_Domain_Search_Filter.value) {
      RocketChat.models.Settings.update({
        _id: 'LDAP_User_Search_Filter'
      }, {
        $set: {
          value: LDAP_Domain_Search_Filter.value
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'LDAP_Domain_Search_Filter'
    });

    if (LDAP_Domain_Search_User && LDAP_Domain_Search_User.value) {
      RocketChat.models.Settings.update({
        _id: 'LDAP_Authentication_UserDN'
      }, {
        $set: {
          value: LDAP_Domain_Search_User.value
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'LDAP_Domain_Search_User'
    });

    if (LDAP_Domain_Search_Password && LDAP_Domain_Search_Password.value) {
      RocketChat.models.Settings.update({
        _id: 'LDAP_Authentication_Password'
      }, {
        $set: {
          value: LDAP_Domain_Search_Password.value
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'LDAP_Domain_Search_Password'
    });

    if (LDAP_Domain_Search_User && LDAP_Domain_Search_User.value && LDAP_Domain_Search_Password && LDAP_Domain_Search_Password.value) {
      RocketChat.models.Settings.update({
        _id: 'LDAP_Authentication'
      }, {
        $set: {
          value: true
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'LDAP_Use_Custom_Domain_Search'
    });
    RocketChat.models.Settings.remove({
      _id: 'LDAP_Custom_Domain_Search'
    });
    RocketChat.models.Settings.remove({
      _id: 'LDAP_Domain_Search_Object_Class'
    });
    RocketChat.models.Settings.remove({
      _id: 'LDAP_Domain_Search_Object_Category'
    });
    RocketChat.models.Settings.remove({
      _id: 'LDAP_Sync_Users'
    }); //Button

    const LDAP_Sync_User_Data = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Sync_User_Data'
    });

    if (LDAP_Sync_User_Data && LDAP_Sync_User_Data.value) {
      RocketChat.models.Settings.update({
        _id: 'LDAP_Background_Sync'
      }, {
        $set: {
          value: true
        }
      });
    }

    const LDAP_Import_Users = RocketChat.models.Settings.findOne({
      _id: 'LDAP_Import_Users'
    });

    if (LDAP_Import_Users && LDAP_Import_Users.value === false) {
      RocketChat.models.Settings.update({
        _id: 'LDAP_Background_Sync_Import_New_Users'
      }, {
        $set: {
          value: false
        }
      });
    }

    RocketChat.models.Settings.remove({
      _id: 'LDAP_Import_Users'
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v103.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v103.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const majorColors = {
  'content-background-color': '#FFFFFF',
  'primary-background-color': '#04436A',
  'primary-font-color': '#444444',
  'primary-action-color': '#13679A',
  // was action-buttons-color
  'secondary-background-color': '#F4F4F4',
  'secondary-font-color': '#A0A0A0',
  'secondary-action-color': '#DDDDDD',
  'component-color': '#EAEAEA',
  'success-color': '#4dff4d',
  'pending-color': '#FCB316',
  'error-color': '#BC2031',
  'selection-color': '#02ACEC',
  'attention-color': '#9C27B0'
}; // Minor colours implement major colours by default, but can be overruled
// const minorColors = {
// 	'tertiary-background-color': '@component-color',
// 	'tertiary-font-color': '@transparent-lightest',
// 	'link-font-color': '@primary-action-color',
// 	'info-font-color': '@secondary-font-color',
// 	'custom-scrollbar-color': '@transparent-darker',
// 	'status-online': '@success-color',
// 	'status-away': '@pending-color',
// 	'status-busy': '@error-color',
// 	'status-offline': '@transparent-darker'
// };

const newvariables = {
  'content-background-color': 'rc-color-primary-lightest',
  'primary-background-color': 'rc-color-primary',
  'success-color': 'rc-color-success',
  'pending-color': 'rc-color-alert',
  'error-color': 'rc-color-error',
  'status-online': 'rc-color-success',
  'status-away': 'rc-color-alert',
  'status-busy': 'rc-color-error',
  'status-offline': 'rc-color-primary-darkest'
};

function lightenDarkenColor(col, amt) {
  let usePound = false;

  if (col[0] === '#') {
    col = col.slice(1);
    usePound = true;
  }

  const num = parseInt(col, 16);
  let r = (num >> 16) + amt;

  if (r > 255) {
    r = 255;
  } else if (r < 0) {
    r = 0;
  }

  let b = (num >> 8 & 0x00FF) + amt;

  if (b > 255) {
    b = 255;
  } else if (b < 0) {
    b = 0;
  }

  let g = (num & 0x0000FF) + amt;

  if (g > 255) {
    g = 255;
  } else if (g < 0) {
    g = 0;
  }

  return (usePound ? '#' : '') + (g | b << 8 | r << 16).toString(16);
}

RocketChat.Migrations.add({
  version: 103,

  up() {
    Object.keys(majorColors).forEach(function (_id) {
      const color = RocketChat.models.Settings.findOne({
        _id: `theme-color-${_id}`
      });
      const key = newvariables[_id];

      if (color && color.value !== majorColors[_id] && key) {
        if (/^@.+/.test(color.value)) {
          color.value = newvariables[color.value.replace('@', '')];
        }

        const id = `theme-color-${key}`;
        RocketChat.models.Settings.update({
          _id: id
        }, {
          $set: {
            value: color.value,
            editor: /^#.+/.test(color.value) ? 'color' : 'expression'
          }
        });

        if (key === 'rc-color-primary') {
          RocketChat.models.Settings.update({
            _id: 'theme-color-rc-color-primary-darkest'
          }, {
            $set: {
              editor: 'color',
              value: lightenDarkenColor(color.value, -16)
            }
          });
          RocketChat.models.Settings.update({
            _id: 'theme-color-rc-color-primary-dark'
          }, {
            $set: {
              editor: 'color',
              value: lightenDarkenColor(color.value, 18)
            }
          });
          RocketChat.models.Settings.update({
            _id: 'theme-color-rc-color-primary-light'
          }, {
            $set: {
              editor: 'color',
              value: lightenDarkenColor(color.value, 110)
            }
          });
          RocketChat.models.Settings.update({
            _id: 'theme-color-rc-color-primary-light-medium'
          }, {
            $set: {
              editor: 'color',
              value: lightenDarkenColor(color.value, 156)
            }
          });
          RocketChat.models.Settings.update({
            _id: 'theme-color-rc-color-primary-lightest'
          }, {
            $set: {
              editor: 'color',
              value: lightenDarkenColor(color.value, 200)
            }
          });
        }
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v104.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v104.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 104,

  up() {
    if ((RocketChat.models.Settings.findOne({
      _id: 'theme-color-rc-color-primary'
    }) || {}).value === '#04436A' && (RocketChat.models.Settings.findOne({
      _id: 'theme-color-rc-color-primary-darkest'
    }) || {}).value === '#335a' && (RocketChat.models.Settings.findOne({
      _id: 'theme-color-rc-color-primary-dark'
    }) || {}).value === '#16557c' && (RocketChat.models.Settings.findOne({
      _id: 'theme-color-rc-color-primary-light'
    }) || {}).value === '#72b1d8' && (RocketChat.models.Settings.findOne({
      _id: 'theme-color-rc-color-primary-light-medium'
    }) || {}).value === '#a0dfff' && (RocketChat.models.Settings.findOne({
      _id: 'theme-color-rc-color-primary-lightest'
    }) || {}).value === '#ccffff') {
      RocketChat.models.Settings.update({
        _id: 'theme-color-rc-color-primary'
      }, {
        $set: {
          editor: 'expression',
          value: 'color-dark'
        }
      });
      RocketChat.models.Settings.update({
        _id: 'theme-color-rc-color-primary-darkest'
      }, {
        $set: {
          editor: 'expression',
          value: 'color-darkest'
        }
      });
      RocketChat.models.Settings.update({
        _id: 'theme-color-rc-color-primary-dark'
      }, {
        $set: {
          editor: 'expression',
          value: 'color-dark-medium'
        }
      });
      RocketChat.models.Settings.update({
        _id: 'theme-color-rc-color-primary-light'
      }, {
        $set: {
          editor: 'expression',
          value: 'color-gray'
        }
      });
      RocketChat.models.Settings.update({
        _id: 'theme-color-rc-color-primary-light-medium'
      }, {
        $set: {
          editor: 'expression',
          value: 'color-gray-medium'
        }
      });
      RocketChat.models.Settings.update({
        _id: 'theme-color-rc-color-primary-lightest'
      }, {
        $set: {
          editor: 'expression',
          value: 'color-gray-lightest'
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v105.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v105.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 105,

  up() {
    if (RocketChat && RocketChat.models) {
      if (RocketChat.models.Users) {
        RocketChat.models.Users.find({
          'settings.preferences.unreadRoomsMode': {
            $exists: 1
          }
        }).forEach(function (user) {
          const newPreference = user.settings.preferences.unreadRoomsMode ? 'unread' : 'category';
          RocketChat.models.Users.update({
            _id: user._id
          }, {
            $unset: {
              'settings.preferences.unreadRoomsMode': 1
            },
            $set: {
              'settings.preferences.roomsListExhibitionMode': newPreference
            }
          });
        });
      }

      if (RocketChat.models.Settings) {
        const settingsMap = {
          'Desktop_Notifications_Default_Alert': 'Accounts_Default_User_Preferences_desktopNotifications',
          'Mobile_Notifications_Default_Alert': 'Accounts_Default_User_Preferences_mobileNotifications',
          'Audio_Notifications_Default_Alert': 'Accounts_Default_User_Preferences_audioNotifications',
          'Desktop_Notifications_Duration': 'Accounts_Default_User_Preferences_desktopNotificationDuration',
          'Audio_Notifications_Value': undefined
        };
        RocketChat.models.Settings.find({
          _id: {
            $in: Object.keys(settingsMap)
          }
        }).forEach(oldSetting => {
          const newSettingKey = settingsMap[oldSetting._id];
          const newSetting = newSettingKey && RocketChat.models.Settings.findOne({
            _id: newSettingKey
          });

          if (newSetting && newSetting.value !== oldSetting.value) {
            RocketChat.models.Settings.update({
              _id: newSettingKey
            }, {
              $set: {
                value: oldSetting.value
              }
            });
          }

          RocketChat.models.Settings.remove({
            _id: oldSetting._id
          });
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v106.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v106.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("meteor/rocketchat:livechat/server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.Migrations.add({
  version: 106,

  up() {
    const visitors = Meteor.users.find({
      type: 'visitor'
    });
    const total = visitors.count();
    let current = 1;
    console.log('Migrating livechat visitors, this may take a while ...');
    Meteor.setTimeout(() => {
      visitors.forEach(user => {
        console.log(`Migrating visitor ${current++}/${total}`);
        const {
          _id,
          name,
          username,
          deparment,
          userAgent,
          ip,
          host,
          visitorEmails,
          phone
        } = user;
        LivechatVisitors.insert({
          _id,
          name,
          username,
          deparment,
          userAgent,
          ip,
          host,
          visitorEmails,
          phone,
          token: user.profile.token
        });
        Meteor.users.remove({
          _id
        });
      });
      console.log('Livechat visitors migration finished.');
    }, 1000);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v107.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v107.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 107,

  up() {
    RocketChat.models.Users.update({
      'preferences.roomsListExhibitionMode': 'activity'
    }, {
      $unset: {
        'preferences.roomsListExhibitionMode': 1
      },
      $set: {
        'preferences.sidebarSortby': 'activity',
        'preferences.sidebarShowFavorites': true
      }
    });
    RocketChat.models.Users.update({
      'preferences.roomsListExhibitionMode': 'unread'
    }, {
      $unset: {
        'preferences.roomsListExhibitionMode': 1
      },
      $set: {
        'preferences.sidebarSortby': 'alphabetical',
        'preferences.sidebarShowUnread': true,
        'preferences.sidebarShowFavorites': true
      }
    });
    RocketChat.models.Users.update({
      'preferences.roomsListExhibitionMode': 'category'
    }, {
      $unset: {
        'preferences.roomsListExhibitionMode': 1
      },
      $set: {
        'preferences.sidebarSortby': 'alphabetical',
        'preferences.sidebarShowFavorites': true
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v108.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v108.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 108,

  up() {
    const roles = RocketChat.models.Roles.find({
      _id: {
        $ne: 'guest'
      },
      scope: 'Users'
    }).fetch().map(role => {
      return role._id;
    });
    RocketChat.models.Permissions.createOrUpdate('leave-c', roles);
    RocketChat.models.Permissions.createOrUpdate('leave-d', roles);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v109.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v109.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 109,

  up() {
    const FileUpload_GoogleStorage_Proxy = (RocketChat.models.Settings.findOne({
      _id: 'FileUpload_GoogleStorage_Proxy'
    }) || {}).value === true;
    const FileUpload_S3_Proxy = (RocketChat.models.Settings.findOne({
      _id: 'FileUpload_S3_Proxy'
    }) || {}).value === true;
    RocketChat.models.Settings.update({
      _id: 'FileUpload_GoogleStorage_Proxy_Avatars'
    }, {
      $set: {
        value: FileUpload_GoogleStorage_Proxy
      }
    });
    RocketChat.models.Settings.update({
      _id: 'FileUpload_GoogleStorage_Proxy_Uploads'
    }, {
      $set: {
        value: FileUpload_GoogleStorage_Proxy
      }
    });
    RocketChat.models.Settings.update({
      _id: 'FileUpload_S3_Proxy_Avatars'
    }, {
      $set: {
        value: FileUpload_S3_Proxy
      }
    });
    RocketChat.models.Settings.update({
      _id: 'FileUpload_S3_Proxy_Uploads'
    }, {
      $set: {
        value: FileUpload_S3_Proxy
      }
    });
    RocketChat.models.Settings.remove({
      _id: 'FileUpload_GoogleStorage_Proxy'
    });
    RocketChat.models.Settings.remove({
      _id: 'FileUpload_S3_Proxy'
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v110.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v110.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 110,

  up() {
    if (RocketChat && RocketChat.models) {
      if (RocketChat.models.Settings) {
        const setting = RocketChat.models.Settings.findOne({
          _id: 'Accounts_Default_User_Preferences_viewMode'
        });

        if (setting && setting.value) {
          RocketChat.models.Settings.update({
            _id: 'Accounts_Default_User_Preferences_messageViewMode'
          }, {
            $set: {
              value: setting.value
            }
          });
          RocketChat.models.Settings.remove({
            _id: 'Accounts_Default_User_Preferences_viewMode'
          });
        }
      }

      if (RocketChat.models.Users) {
        RocketChat.models.Users.update({
          'settings.preferences.viewMode': {
            $exists: 1
          }
        }, {
          $rename: {
            'settings.preferences.viewMode': 'user.settings.preferences.messageViewMode'
          }
        });
      }
    }
  },

  down() {
    if (RocketChat && RocketChat.models) {
      if (RocketChat.models.Settings) {
        const setting = RocketChat.models.Settings.findOne({
          _id: 'Accounts_Default_User_Preferences_messageViewMode'
        });

        if (setting && setting.value) {
          RocketChat.models.Settings.update({
            _id: 'Accounts_Default_User_Preferences_viewMode'
          }, {
            $set: {
              value: setting.value
            }
          });
          RocketChat.models.Settings.remove({
            _id: 'Accounts_Default_User_Preferences_messageViewMode'
          });
        }
      }

      if (RocketChat.models.Users) {
        RocketChat.models.Users.update({
          'settings.preferences.messageViewMode': {
            $exists: 1
          }
        }, {
          $rename: {
            'settings.preferences.messageViewMode': 'user.settings.preferences.viewMode'
          }
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v111.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v111.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Migration to give delete channel, delete group permissions to owner
RocketChat.Migrations.add({
  version: 111,

  up() {
    if (RocketChat.models && RocketChat.models.Permissions) {
      RocketChat.models.Permissions.update({
        _id: 'delete-c'
      }, {
        $addToSet: {
          roles: 'owner'
        }
      });
      RocketChat.models.Permissions.update({
        _id: 'delete-p'
      }, {
        $addToSet: {
          roles: 'owner'
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v112.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v112.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 112,

  up() {
    if (RocketChat && RocketChat.models) {
      if (RocketChat.models.Settings) {
        const setting = RocketChat.models.Settings.findOne({
          _id: 'Accounts_Default_User_Preferences_idleTimeoutLimit'
        });

        if (setting && setting.value) {
          RocketChat.models.Settings.update({
            _id: 'Accounts_Default_User_Preferences_idleTimeoutLimit'
          }, {
            $set: {
              value: setting.value / 1000
            }
          });
        }
      }

      if (RocketChat.models.Users) {
        RocketChat.models.Users.find({
          'settings.preferences.idleTimeLimit': {
            $exists: 1
          }
        }).forEach(function (user) {
          RocketChat.models.Users.update({
            _id: user._id
          }, {
            $set: {
              'settings.preferences.idleTimeLimit': user.settings.preferences.idleTimeLimit / 1000
            }
          });
        });
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v113.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v113.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 113,

  up() {
    if (RocketChat && RocketChat.models && RocketChat.models.Uploads && RocketChat.models.Messages) {
      const fileQuery = {
        userId: null
      };
      const filesToUpdate = RocketChat.models.Uploads.find(fileQuery);
      filesToUpdate.forEach(file => {
        const messageQuery = {
          'file._id': file._id
        };
        const message = RocketChat.models.Messages.findOne(messageQuery);

        if (message) {
          const filter = {
            _id: file._id
          };
          const update = {
            $set: {
              userId: message.u._id
            }
          };
          RocketChat.models.Uploads.model.direct.update(filter, update);
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v114.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v114.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 114,

  up() {
    if (RocketChat && RocketChat.models) {
      if (RocketChat.models.Settings) {
        const setting = RocketChat.models.Settings.findOne({
          _id: 'Message_GlobalSearch'
        });

        if (setting && setting.value) {
          RocketChat.models.Settings.upsert({
            _id: 'Search.defaultProvider.GlobalSearchEnabled'
          }, {
            $set: {
              value: setting.value
            }
          });
          RocketChat.models.Settings.removeById('Message_GlobalSearch');
        }
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v115.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v115.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 115,

  up() {
    RocketChat.models.Rooms.update({
      'announcement.message': {
        $exists: true
      }
    }, {
      $unset: {
        announcement: 1
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v116.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v116.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 116,

  up() {
    RocketChat.models.Subscriptions.tryDropIndex({
      unread: 1
    }); // set pref origin to all existing preferences

    RocketChat.models.Subscriptions.update({
      desktopNotifications: {
        $exists: true
      }
    }, {
      $set: {
        desktopPrefOrigin: 'subscription'
      }
    }, {
      multi: true
    });
    RocketChat.models.Subscriptions.update({
      mobilePushNotifications: {
        $exists: true
      }
    }, {
      $set: {
        mobilePrefOrigin: 'subscription'
      }
    }, {
      multi: true
    });
    RocketChat.models.Subscriptions.update({
      emailNotifications: {
        $exists: true
      }
    }, {
      $set: {
        emailPrefOrigin: 'subscription'
      }
    }, {
      multi: true
    }); // set user preferences on subscriptions

    RocketChat.models.Users.find({
      $or: [{
        'settings.preferences.desktopNotifications': {
          $exists: true
        }
      }, {
        'settings.preferences.mobileNotifications': {
          $exists: true
        }
      }, {
        'settings.preferences.emailNotificationMode': {
          $exists: true
        }
      }]
    }).forEach(user => {
      if (user.settings.preferences.desktopNotifications && user.settings.preferences.desktopNotifications !== 'default') {
        RocketChat.models.Subscriptions.update({
          'u._id': user._id,
          desktopPrefOrigin: {
            $exists: false
          }
        }, {
          $set: {
            desktopNotifications: user.settings.preferences.desktopNotifications,
            desktopPrefOrigin: 'user'
          }
        }, {
          multi: true
        });
      }

      if (user.settings.preferences.mobileNotifications && user.settings.preferences.mobileNotifications !== 'default') {
        RocketChat.models.Subscriptions.update({
          'u._id': user._id,
          mobilePrefOrigin: {
            $exists: false
          }
        }, {
          $set: {
            mobileNotifications: user.settings.preferences.mobileNotifications,
            mobilePrefOrigin: 'user'
          }
        }, {
          multi: true
        });
      }

      if (user.settings.preferences.emailNotificationMode && user.settings.preferences.emailNotificationMode !== 'default') {
        RocketChat.models.Subscriptions.update({
          'u._id': user._id,
          emailPrefOrigin: {
            $exists: false
          }
        }, {
          $set: {
            emailNotifications: user.settings.preferences.emailNotificationMode === 'disabled' || user.settings.preferences.emailNotificationMode === 'nothing' ? 'nothing' : 'mentions',
            emailPrefOrigin: 'user'
          }
        }, {
          multi: true
        });
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v117.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v117.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 117,

  up() {
    if (RocketChat.authz && RocketChat.models && RocketChat.models.Settings && RocketChat.authz.getUsersInRole('admin').count()) {
      RocketChat.models.Settings.upsert({
        _id: 'Show_Setup_Wizard'
      }, {
        $set: {
          value: 'completed'
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v118.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v118.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 118,

  up() {
    RocketChat.models.Subscriptions.update({
      emailNotifications: 'all',
      emailPrefOrigin: 'user'
    }, {
      $set: {
        emailNotifications: 'mentions'
      }
    }, {
      multi: true
    });
    RocketChat.models.Users.update({
      'settings.preferences.emailNotificationMode': 'disabled'
    }, {
      $set: {
        'settings.preferences.emailNotificationMode': 'nothing'
      }
    }, {
      multi: true
    });
    RocketChat.models.Users.update({
      'settings.preferences.emailNotificationMode': 'all'
    }, {
      $set: {
        'settings.preferences.emailNotificationMode': 'mentions'
      }
    }, {
      multi: true
    });
    RocketChat.models.Settings.update({
      _id: 'Accounts_Default_User_Preferences_emailNotificationMode',
      value: 'disabled'
    }, {
      $set: {
        value: 'nothing'
      }
    });
    RocketChat.models.Settings.update({
      _id: 'Accounts_Default_User_Preferences_emailNotificationMode',
      value: 'all'
    }, {
      $set: {
        value: 'mentions'
      }
    }); // set user highlights on subscriptions

    RocketChat.models.Users.find({
      'settings.preferences.highlights.0': {
        $exists: true
      }
    }, {
      fields: {
        'settings.preferences.highlights': 1
      }
    }).forEach(user => {
      RocketChat.models.Subscriptions.update({
        'u._id': user._id
      }, {
        $set: {
          userHighlights: user.settings.preferences.highlights
        }
      }, {
        multi: true
      });
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v119.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v119.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 119,

  up() {
    if (RocketChat.models && RocketChat.models.Settings) {
      RocketChat.models.Settings.update({
        _id: 'Show_Setup_Wizard',
        value: true
      }, {
        $set: {
          value: 'pending'
        }
      });
      RocketChat.models.Settings.update({
        _id: 'Show_Setup_Wizard',
        value: false
      }, {
        $set: {
          value: 'completed'
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v120.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v120.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 120,

  up() {
    RocketChat.models.Users.update({
      'settings.preferences.roomsListExhibitionMode': 'activity'
    }, {
      $unset: {
        'settings.preferences.roomsListExhibitionMode': 1
      },
      $set: {
        'settings.preferences.sidebarSortby': 'activity',
        'settings.preferences.sidebarShowFavorites': true
      }
    });
    RocketChat.models.Users.update({
      'settings.preferences.roomsListExhibitionMode': 'unread'
    }, {
      $unset: {
        'settings.preferences.roomsListExhibitionMode': 1
      },
      $set: {
        'settings.preferences.sidebarSortby': 'alphabetical',
        'settings.preferences.sidebarShowUnread': true,
        'settings.preferences.sidebarShowFavorites': true
      }
    });
    RocketChat.models.Users.update({
      'settings.preferences.roomsListExhibitionMode': 'category'
    }, {
      $unset: {
        'settings.preferences.roomsListExhibitionMode': 1
      },
      $set: {
        'settings.preferences.sidebarSortby': 'alphabetical',
        'settings.preferences.sidebarShowFavorites': true
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v121.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v121.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 121,

  up() {
    // set user preferences on subscriptions
    RocketChat.models.Users.find({
      $or: [{
        'settings.preferences.desktopNotifications': {
          $exists: true
        }
      }, {
        'settings.preferences.mobileNotifications': {
          $exists: true
        }
      }, {
        'settings.preferences.emailNotificationMode': {
          $exists: true
        }
      }]
    }).forEach(user => {
      if (user.settings.preferences.desktopNotifications && user.settings.preferences.desktopNotifications !== 'default') {
        RocketChat.models.Subscriptions.update({
          'u._id': user._id,
          desktopPrefOrigin: {
            $exists: false
          }
        }, {
          $set: {
            desktopNotifications: user.settings.preferences.desktopNotifications,
            desktopPrefOrigin: 'user'
          }
        }, {
          multi: true
        });
      }

      if (user.settings.preferences.mobileNotifications && user.settings.preferences.mobileNotifications !== 'default') {
        RocketChat.models.Subscriptions.update({
          'u._id': user._id,
          mobilePrefOrigin: {
            $exists: false
          }
        }, {
          $set: {
            mobileNotifications: user.settings.preferences.mobileNotifications,
            mobilePrefOrigin: 'user'
          }
        }, {
          multi: true
        });
      }

      if (user.settings.preferences.emailNotificationMode && user.settings.preferences.emailNotificationMode !== 'default') {
        RocketChat.models.Subscriptions.update({
          'u._id': user._id,
          emailPrefOrigin: {
            $exists: false
          }
        }, {
          $set: {
            emailNotifications: user.settings.preferences.emailNotificationMode === 'disabled' || user.settings.preferences.emailNotificationMode === 'nothing' ? 'nothing' : 'mentions',
            emailPrefOrigin: 'user'
          }
        }, {
          multi: true
        });
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v122.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v122.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 122,

  up() {
    RocketChat.models.Subscriptions.tryDropIndex('u._id_1_name_1_t_1_code_1');
    console.log('Fixing ChatSubscription u._id_1_name_1_t_1_code_1');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v123.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v123.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let pageVisitedCollection;
let messageCollection;
let roomCollection;
const roomIdByToken = {};
const batchSize = 5000;

function migrateHistory(total, current) {
  return Promise.asyncApply(() => {
    console.log(`Livechat history migration ${current}/${total}`);
    const items = Promise.await(pageVisitedCollection.find({}).limit(batchSize).toArray());
    const tokens = items.filter(item => item.token && !roomIdByToken[item.token]).map(item => item.token);
    const rooms = Promise.await(roomCollection.find({
      'v.token': {
        $in: tokens
      }
    }, {
      fields: {
        'v.token': 1
      }
    }).toArray());
    rooms.forEach(room => {
      roomIdByToken[room.v.token] = room._id;
    });
    const actions = items.reduce((result, item) => {
      const msg = {
        t: 'livechat_navigation_history',
        rid: roomIdByToken[item.token] || null,
        // prevent from being `undefined`
        ts: item.ts,
        msg: `${item.page.title} - ${item.page.location.href}`,
        u: {
          _id: 'rocket.cat',
          username: 'rocket.cat'
        },
        groupable: false,
        navigation: {
          page: item.page,
          token: item.token
        }
      };

      if (!roomIdByToken[item.token] && item.expireAt) {
        msg.expireAt = item.expireAt;
      }

      result.insert.push(msg);
      result.remove.push(item._id);
      return result;
    }, {
      insert: [],
      remove: []
    });
    const ops = [];

    if (actions.insert.length > 0) {
      ops.push(messageCollection.insertMany(actions.insert));
    }

    if (actions.remove.length > 0) {
      ops.push(pageVisitedCollection.removeMany({
        _id: {
          $in: actions.remove
        }
      }));
    }

    const batch = Promise.all(ops);

    if (actions.remove.length === batchSize) {
      Promise.await(batch);
      return migrateHistory(total, current + batchSize);
    }

    return batch;
  });
}

RocketChat.Migrations.add({
  version: 123,

  up() {
    pageVisitedCollection = RocketChat.models.LivechatPageVisited.model.rawCollection();
    messageCollection = RocketChat.models.Messages.model.rawCollection();
    roomCollection = RocketChat.models.Rooms.model.rawCollection();
    /*
     * Move visitor navigation history to messages
     */

    Meteor.setTimeout(() => Promise.asyncApply(() => {
      const pages = pageVisitedCollection.find({});
      const total = Promise.await(pages.count());
      Promise.await(pages.close());
      console.log('Migrating livechat visitors navigation history to livechat messages. This might take a long time ...');
      Promise.await(migrateHistory(total, 0));
      console.log('Livechat visitors navigation history migration finished.');
    }), 1000);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v124.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v124.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 124,

  up() {
    RocketChat.models.Users.update({
      'settings.preferences.mergeChannels': true
    }, {
      $unset: {
        'settings.preferences.mergeChannels': 1
      },
      $set: {
        'settings.preferences.groupByType': false
      }
    }, {
      multi: true
    });
    RocketChat.models.Users.update({
      'settings.preferences.mergeChannels': false
    }, {
      $unset: {
        'settings.preferences.mergeChannels': 1
      },
      $set: {
        'settings.preferences.groupByType': true
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v125.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v125.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 125,

  up() {
    RocketChat.models.Users.update({}, {
      $rename: {
        'settings.preferences.groupByType': 'settings.preferences.sidebarGroupByType'
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v126.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v126.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 126,

  up() {
    if (!RocketChat.models || !RocketChat.models.Settings) {
      return;
    }

    const query = {
      _id: 'Accounts_Default_User_Preferences_idleTimeoutLimit'
    };
    const setting = RocketChat.models.Settings.findOne(query);

    if (setting) {
      delete setting._id;
      RocketChat.models.Settings.upsert({
        _id: 'Accounts_Default_User_Preferences_idleTimeLimit'
      }, setting);
      RocketChat.models.Settings.remove(query);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v127.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v127.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 127,

  up() {
    if (RocketChat.models && RocketChat.models.Permissions) {
      const newPermission = RocketChat.models.Permissions.findOne('view-livechat-manager');

      if (newPermission && newPermission.roles.length) {
        RocketChat.models.Permissions.upsert({
          _id: 'remove-closed-livechat-rooms'
        }, {
          $set: {
            roles: newPermission.roles
          }
        });
      }
    }
  },

  down() {
    if (RocketChat.models && RocketChat.models.Permissions) {
      // Revert permission
      RocketChat.models.Permissions.remove({
        _id: 'remove-closed-livechat-rooms'
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"v128.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/v128.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Migrations.add({
  version: 128,

  up() {
    const _id = 'theme-font-body-font-family';
    const oldValue = '-apple-system, BlinkMacSystemFont, Roboto, \'Helvetica Neue\', Arial, sans-serif, \'Apple Color Emoji\', \'Segoe UI\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Meiryo UI\'';
    const newValue = '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Helvetica Neue\', \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Meiryo UI\', Arial, sans-serif';
    RocketChat.models.Settings.update({
      _id,
      value: oldValue
    }, {
      $set: {
        value: newValue
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"xrun.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/migrations/xrun.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

if (RocketChat.Migrations.getVersion() !== 0) {
  RocketChat.Migrations.migrateTo(process.env.MIGRATION_VERSION || 'latest');
} else {
  const control = RocketChat.Migrations._getControl();

  control.version = _.last(RocketChat.Migrations._list).version;

  RocketChat.Migrations._setControl(control);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"appcache.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/appcache.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
if (Meteor.AppCache) {
  Meteor.AppCache.config({
    onlineOnly: ['/elements/', '/landing/', '/moment-locales/', '/scripts/']
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"avatar.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/avatar.js                                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let sharp;
module.watch(require("sharp"), {
  default(v) {
    sharp = v;
  }

}, 1);
Meteor.startup(function () {
  WebApp.connectHandlers.use('/avatar/', Meteor.bindEnvironment(function (req, res
  /*, next*/
  ) {
    const params = {
      username: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, ''))
    };
    const cacheTime = req.query.cacheTime || RocketChat.settings.get('Accounts_AvatarCacheTime');

    if (_.isEmpty(params.username)) {
      res.writeHead(403);
      res.write('Forbidden');
      res.end();
      return;
    }

    const match = /^\/([^?]*)/.exec(req.url);

    if (match[1]) {
      let username = decodeURIComponent(match[1]);
      let file;
      username = username.replace(/\.jpg$/, '');

      if (username[0] !== '@') {
        if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm) {
          const user = RocketChat.models.Users.findOneByUsername(username);

          if (user && user.services && user.services.sandstorm && user.services.sandstorm.picture) {
            res.setHeader('Location', user.services.sandstorm.picture);
            res.writeHead(302);
            res.end();
            return;
          }
        }

        file = RocketChat.models.Avatars.findOneByName(username);
      }

      if (file) {
        res.setHeader('Content-Security-Policy', 'default-src \'none\'');
        const reqModifiedHeader = req.headers['if-modified-since'];

        if (reqModifiedHeader && reqModifiedHeader === (file.uploadedAt && file.uploadedAt.toUTCString())) {
          res.setHeader('Last-Modified', reqModifiedHeader);
          res.writeHead(304);
          res.end();
          return;
        }

        res.setHeader('Cache-Control', `public, max-age=${cacheTime}`);
        res.setHeader('Expires', '-1');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
        res.setHeader('Content-Type', file.type);
        res.setHeader('Content-Length', file.size);
        return FileUpload.get(file, req, res);
      } else {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', `public, max-age=${cacheTime}`);
        res.setHeader('Expires', '-1');
        res.setHeader('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT');
        const reqModifiedHeader = req.headers['if-modified-since'];

        if (reqModifiedHeader) {
          if (reqModifiedHeader === 'Thu, 01 Jan 2015 00:00:00 GMT') {
            res.writeHead(304);
            res.end();
            return;
          }
        }

        if (RocketChat.settings.get('UI_Use_Name_Avatar')) {
          const user = RocketChat.models.Users.findOneByUsername(username, {
            fields: {
              name: 1
            }
          });

          if (user && user.name) {
            username = user.name;
          }
        }

        let color = '';
        let initials = '';

        if (username === '?') {
          color = '#000';
          initials = username;
        } else {
          color = RocketChat.getAvatarColor(username);
          initials = username.replace(/[^A-Za-z0-9]/g, '').substr(0, 1).toUpperCase();
        }

        const viewSize = parseInt(req.query.size) || 200;
        const fontSize = viewSize / 1.6;
        const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ${viewSize} ${viewSize}\">\n<rect width=\"100%\" height=\"100%\" fill=\"${color}\"/>\n<text x=\"50%\" y=\"50%\" dy=\"0.36em\" text-anchor=\"middle\" pointer-events=\"none\" fill=\"#ffffff\" font-family=\"Helvetica, Arial, Lucida Grande, sans-serif\" font-size="${fontSize}">\n${initials}\n</text>\n</svg>`;

        if (['png', 'jpg', 'jpeg'].includes(req.query.format)) {
          res.setHeader('Content-Type', `image/${req.query.format}`);
          sharp(new Buffer(svg)).toFormat(req.query.format).pipe(res);
          return;
        }

        res.write(svg);
        res.end();
        return;
      }
    }

    res.writeHead(404);
    res.end();
    return;
  }));
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cron.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/cron.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global SyncedCron */
const logger = new Logger('SyncedCron');
SyncedCron.config({
  logger(opts) {
    return logger[opts.level].call(logger, opts.message);
  },

  collectionName: 'rocketchat_cron_history'
});

function generateStatistics() {
  const statistics = RocketChat.statistics.save();
  statistics.host = Meteor.absoluteUrl();

  if (RocketChat.settings.get('Statistics_reporting')) {
    try {
      HTTP.post('https://collector.rocket.chat/', {
        data: statistics
      });
    } catch (error) {
      /*error*/
      logger.warn('Failed to send usage report');
    }
  }
}

function cleanupOEmbedCache() {
  return Meteor.call('OEmbedCacheCleanup');
}

Meteor.startup(function () {
  return Meteor.defer(function () {
    generateStatistics();
    SyncedCron.add({
      name: 'Generate and save statistics',

      schedule(parser) {
        return parser.cron(`${new Date().getMinutes()} * * * *`);
      },

      job: generateStatistics
    });
    SyncedCron.add({
      name: 'Cleanup OEmbed cache',

      schedule(parser) {
        const now = new Date();
        return parser.cron(`${now.getMinutes()} ${now.getHours()} * * *`);
      },

      job: cleanupOEmbedCache
    });
    return SyncedCron.start();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"i18n-validation.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/i18n-validation.js                                                                                   //
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

function flat(obj, newObj = {}, path = '') {
  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (_.isObject(value)) {
      flat(value, newObj, `${key}.`);
    } else {
      newObj[path + key] = value;
    }
  }

  return newObj;
}

RocketChat.i18nValidation = function i18nValidation() {
  const l = {};
  const keys = {};
  const errors = [];
  const langs = Object.keys(TAPi18next.options.resStore);

  for (const lang of Object.keys(TAPi18next.options.resStore)) {
    const value = TAPi18next.options.resStore[lang];
    l[lang] = flat(value);

    for (const key of Object.keys(l[lang])) {
      if (keys[key] == null) {
        keys[key] = [];
      }

      keys[key].push(lang);
    }
  }

  let len = 0;

  for (const key of Object.keys(keys)) {
    const present = keys[key];

    if (!(present.length !== langs.length)) {
      continue;
    }

    const error = `${_.difference(langs, present).join(',')}: missing translation for `.red + key.white + `. Present in [${present.join(',')}]`.red;
    errors.push(error);

    if (error.length > len) {
      len = error.length;
    }
  }

  if (errors.length > 0) {
    console.log('+'.red + s.rpad('', len - 28, '-').red + '+'.red);

    for (const error of errors) {
      console.log('|'.red, s.rpad(`${error}`, len).red, '|'.red);
    }

    return console.log('+'.red + s.rpad('', len - 28, '-').red + '+'.red);
  }
}; // Meteor.startup(function() {
// 	RocketChat.i18nValidation();
// });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"initialData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/initialData.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.startup(function () {
  Meteor.defer(() => RocketChat.models._CacheControl.withValue(false, function () {
    if (!RocketChat.models.Rooms.findOneById('GENERAL')) {
      RocketChat.models.Rooms.createWithIdTypeAndName('GENERAL', 'c', 'general', {
        'default': true
      });
    }

    if (!RocketChat.models.Users.findOneById('rocket.cat')) {
      RocketChat.models.Users.create({
        _id: 'rocket.cat',
        name: 'Rocket.Cat',
        username: 'rocket.cat',
        status: 'online',
        statusDefault: 'online',
        utcOffset: 0,
        active: true,
        type: 'bot'
      });
      RocketChat.authz.addUserRoles('rocket.cat', 'bot');
      const rs = RocketChatFile.bufferToStream(new Buffer(Assets.getBinary('avatars/rocketcat.png'), 'utf8'));
      const fileStore = FileUpload.getStore('Avatars');
      fileStore.deleteByName('rocket.cat');
      const file = {
        userId: 'rocket.cat',
        type: 'image/png'
      };
      Meteor.runAsUser('rocket.cat', () => {
        fileStore.insert(file, rs, () => {
          return RocketChat.models.Users.setAvatarOrigin('rocket.cat', 'local');
        });
      });
    }

    if (process.env.ADMIN_PASS) {
      if (_.isEmpty(RocketChat.authz.getUsersInRole('admin').fetch())) {
        console.log('Inserting admin user:'.green);
        const adminUser = {
          name: 'Administrator',
          username: 'admin',
          status: 'offline',
          statusDefault: 'online',
          utcOffset: 0,
          active: true
        };

        if (process.env.ADMIN_NAME) {
          adminUser.name = process.env.ADMIN_NAME;
        }

        console.log(`Name: ${adminUser.name}`.green);

        if (process.env.ADMIN_EMAIL) {
          const re = /^[^@].*@[^@]+$/i;

          if (re.test(process.env.ADMIN_EMAIL)) {
            if (!RocketChat.models.Users.findOneByEmailAddress(process.env.ADMIN_EMAIL)) {
              adminUser.emails = [{
                address: process.env.ADMIN_EMAIL,
                verified: true
              }];
              console.log(`Email: ${process.env.ADMIN_EMAIL}`.green);
            } else {
              console.log('Email provided already exists; Ignoring environment variables ADMIN_EMAIL'.red);
            }
          } else {
            console.log('Email provided is invalid; Ignoring environment variables ADMIN_EMAIL'.red);
          }
        }

        if (process.env.ADMIN_USERNAME) {
          let nameValidation;

          try {
            nameValidation = new RegExp(`^${RocketChat.settings.get('UTF8_Names_Validation')}$`);
          } catch (error) {
            nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
          }

          if (nameValidation.test(process.env.ADMIN_USERNAME)) {
            if (RocketChat.checkUsernameAvailability(process.env.ADMIN_USERNAME)) {
              adminUser.username = process.env.ADMIN_USERNAME;
            } else {
              console.log('Username provided already exists; Ignoring environment variables ADMIN_USERNAME'.red);
            }
          } else {
            console.log('Username provided is invalid; Ignoring environment variables ADMIN_USERNAME'.red);
          }
        }

        console.log(`Username: ${adminUser.username}`.green);
        adminUser.type = 'user';
        const id = RocketChat.models.Users.create(adminUser);
        Accounts.setPassword(id, process.env.ADMIN_PASS);
        console.log(`Password: ${process.env.ADMIN_PASS}`.green);
        RocketChat.authz.addUserRoles(id, 'admin');
      } else {
        console.log('Users with admin role already exist; Ignoring environment variables ADMIN_PASS'.red);
      }
    }

    if (typeof process.env.INITIAL_USER === 'string' && process.env.INITIAL_USER.length > 0) {
      try {
        const initialUser = JSON.parse(process.env.INITIAL_USER);

        if (!initialUser._id) {
          console.log('No _id provided; Ignoring environment variable INITIAL_USER'.red);
        } else if (!RocketChat.models.Users.findOneById(initialUser._id)) {
          console.log('Inserting initial user:'.green);
          console.log(JSON.stringify(initialUser, null, 2).green);
          RocketChat.models.Users.create(initialUser);
        }
      } catch (e) {
        console.log('Error processing environment variable INITIAL_USER'.red, e);
      }
    }

    if (_.isEmpty(RocketChat.authz.getUsersInRole('admin').fetch())) {
      const oldestUser = RocketChat.models.Users.findOne({
        _id: {
          $ne: 'rocket.cat'
        }
      }, {
        fields: {
          username: 1
        },
        sort: {
          createdAt: 1
        }
      });

      if (oldestUser) {
        RocketChat.authz.addUserRoles(oldestUser._id, 'admin');
        console.log(`No admins are found. Set ${oldestUser.username || oldestUser.name} as admin for being the oldest user`);
      }
    }

    if (!_.isEmpty(RocketChat.authz.getUsersInRole('admin').fetch())) {
      if (RocketChat.settings.get('Show_Setup_Wizard') === 'pending') {
        console.log('Setting Setup Wizard to "in_progress" because, at least, one admin was found');
        RocketChat.models.Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
      }
    }

    RocketChat.models.Users.removeById('rocketchat.internal.admin.test');

    if (process.env.TEST_MODE === 'true') {
      console.log('Inserting admin test user:'.green);
      const adminUser = {
        _id: 'rocketchat.internal.admin.test',
        name: 'RocketChat Internal Admin Test',
        username: 'rocketchat.internal.admin.test',
        emails: [{
          address: 'rocketchat.internal.admin.test@rocket.chat',
          verified: true
        }],
        status: 'offline',
        statusDefault: 'online',
        utcOffset: 0,
        active: true,
        type: 'user'
      };
      console.log(`Name: ${adminUser.name}`.green);
      console.log(`Email: ${adminUser.emails[0].address}`.green);
      console.log(`Username: ${adminUser.username}`.green);
      console.log(`Password: ${adminUser._id}`.green);

      if (RocketChat.models.Users.findOneByEmailAddress(adminUser.emails[0].address)) {
        throw new Meteor.Error(`Email ${adminUser.emails[0].address} already exists`, 'Rocket.Chat can\'t run in test mode');
      }

      if (!RocketChat.checkUsernameAvailability(adminUser.username)) {
        throw new Meteor.Error(`Username ${adminUser.username} already exists`, 'Rocket.Chat can\'t run in test mode');
      }

      RocketChat.models.Users.create(adminUser);
      Accounts.setPassword(adminUser._id, adminUser._id);
      RocketChat.authz.addUserRoles(adminUser._id, 'admin');

      if (RocketChat.settings.get('Show_Setup_Wizard') === 'pending') {
        RocketChat.models.Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
      }

      return RocketChat.addUserToDefaultChannels(adminUser, true);
    }
  }));
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"presence.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/presence.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals InstanceStatus, UserPresence, UserPresenceMonitor */
Meteor.startup(function () {
  const instance = {
    host: 'localhost',
    port: String(process.env.PORT).trim()
  };

  if (process.env.INSTANCE_IP) {
    instance.host = String(process.env.INSTANCE_IP).trim();
  }

  InstanceStatus.registerInstance('rocket.chat', instance);
  UserPresence.start();
  return UserPresenceMonitor.start();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomPublishes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/roomPublishes.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.roomTypes.setPublish('c', function (identifier) {
    const options = {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        topic: 1,
        announcement: 1,
        muted: 1,
        archived: 1,
        ro: 1,
        reactWhenReadOnly: 1,
        jitsiTimeout: 1,
        description: 1,
        sysMes: 1,
        joinCodeRequired: 1,
        streamingOptions: 1
      }
    };

    if (RocketChat.authz.hasPermission(this.userId, 'view-c-room')) {
      return RocketChat.models.Rooms.findByTypeAndName('c', identifier, options);
    } else if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room')) {
      const roomId = RocketChat.models.Subscriptions.findByTypeNameAndUserId('c', identifier, this.userId).fetch();

      if (roomId.length > 0) {
        return RocketChat.models.Rooms.findById(roomId[0].rid, options);
      }
    }

    return this.ready();
  });
  RocketChat.roomTypes.setPublish('p', function (identifier) {
    const options = {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        topic: 1,
        announcement: 1,
        muted: 1,
        archived: 1,
        ro: 1,
        reactWhenReadOnly: 1,
        jitsiTimeout: 1,
        description: 1,
        sysMes: 1,
        tokenpass: 1,
        streamingOptions: 1
      }
    };
    const user = RocketChat.models.Users.findOneById(this.userId, {
      fields: {
        username: 1
      }
    });
    return RocketChat.models.Rooms.findByTypeAndNameContainingUsername('p', identifier, user.username, options);
  });
  return RocketChat.roomTypes.setPublish('d', function (identifier) {
    const options = {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        topic: 1,
        jitsiTimeout: 1
      }
    };
    const user = RocketChat.models.Users.findOneById(this.userId, {
      fields: {
        username: 1
      }
    });

    if (RocketChat.authz.hasAtLeastOnePermission(this.userId, ['view-d-room', 'view-joined-room'])) {
      return RocketChat.models.Rooms.findByTypeContainingUsernames('d', [user.username, identifier], options);
    }

    return this.ready();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"serverRunning.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/startup/serverRunning.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let path;
module.watch(require("path"), {
  default(v) {
    path = v;
  }

}, 1);
let semver;
module.watch(require("semver"), {
  default(v) {
    semver = v;
  }

}, 2);
Meteor.startup(function () {
  let oplogState = 'Disabled';

  if (MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle && MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry) {
    oplogState = 'Enabled';

    if (RocketChat.settings.get('Force_Disable_OpLog_For_Cache') === true) {
      oplogState += ' (Disabled for Cache Sync)';
    }
  }

  const desiredNodeVersion = semver.clean(fs.readFileSync(path.join(process.cwd(), '../../.node_version.txt')).toString());
  const desiredNodeVersionMajor = String(semver.parse(desiredNodeVersion).major);
  return Meteor.setTimeout(function () {
    let msg = [`Rocket.Chat Version: ${RocketChat.Info.version}`, `     NodeJS Version: ${process.versions.node} - ${process.arch}`, `           Platform: ${process.platform}`, `       Process Port: ${process.env.PORT}`, `           Site URL: ${RocketChat.settings.get('Site_Url')}`, `   ReplicaSet OpLog: ${oplogState}`];

    if (RocketChat.Info.commit && RocketChat.Info.commit.hash) {
      msg.push(`        Commit Hash: ${RocketChat.Info.commit.hash.substr(0, 10)}`);
    }

    if (RocketChat.Info.commit && RocketChat.Info.commit.branch) {
      msg.push(`      Commit Branch: ${RocketChat.Info.commit.branch}`);
    }

    msg = msg.join('\n');

    if (semver.satisfies(process.versions.node, desiredNodeVersionMajor)) {
      return SystemLogger.startup_box(msg, 'SERVER RUNNING');
    }

    msg += ['', '', 'YOUR CURRENT NODEJS VERSION IS NOT SUPPORTED,', `PLEASE UPGRADE / DOWNGRADE TO VERSION ${desiredNodeVersionMajor}.X.X`].join('\n');
    SystemLogger.error_box(msg, 'SERVER ERROR');
    return process.exit();
  }, 100);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"configuration":{"accounts_meld.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/configuration/accounts_meld.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const orig_updateOrCreateUserFromExternalService = Accounts.updateOrCreateUserFromExternalService;

Accounts.updateOrCreateUserFromExternalService = function (serviceName, serviceData = {}
/*, options*/
) {
  const services = ['facebook', 'github', 'gitlab', 'google', 'meteor-developer', 'linkedin', 'twitter', 'sandstorm'];

  if (services.includes(serviceName) === false && serviceData._OAuthCustom !== true) {
    return;
  }

  if (serviceName === 'meteor-developer') {
    if (Array.isArray(serviceData.emails)) {
      const primaryEmail = serviceData.emails.sort(a => a.primary !== true).filter(item => item.verified === true)[0];
      serviceData.email = primaryEmail && primaryEmail.address;
    }
  }

  if (serviceName === 'linkedin') {
    serviceData.email = serviceData.emailAddress;
  }

  if (serviceData.email) {
    const user = RocketChat.models.Users.findOneByEmailAddress(serviceData.email);

    if (user != null) {
      const findQuery = {
        address: serviceData.email,
        verified: true
      };

      if (!_.findWhere(user.emails, findQuery)) {
        RocketChat.models.Users.resetPasswordAndSetRequirePasswordChange(user._id, true, 'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password');
      }

      RocketChat.models.Users.setServiceId(user._id, serviceName, serviceData.id);
      RocketChat.models.Users.setEmailVerified(user._id, serviceData.email);
    }
  }

  return orig_updateOrCreateUserFromExternalService.apply(this, arguments);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"grant.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/configuration/grant.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Settings;
module.watch(require("meteor/rocketchat:grant"), {
  Settings(v) {
    Settings = v;
  }

}, 0);
Settings.add({
  enabled: true,
  provider: 'github',
  key: '96db2753350cfe8c8ae1',
  secret: '546317a561df5e3d350fca9b5500f270b54f3301'
});
Settings.add({
  enabled: true,
  provider: 'facebook',
  key: '494859557516801',
  secret: '5274d3495cebaf01f7e1b90fe1331fba'
});
Settings.add({
  enabled: true,
  provider: 'google',
  key: '979285364697-pob8soqche90ng1af0pj9if6ed69jalh.apps.googleusercontent.com',
  secret: 'lFWtrtJngtlNBdrAoevwPjZh'
});
Settings.apps.add('pwa', {
  redirectUrl: 'http://localhost:4200/login?service={provider}&access_token={accessToken}&refresh_token={refreshToken}',
  errorUrl: 'http://localhost:4200/login?service={provider}&error={error}'
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"OEmbedCacheCleanup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/OEmbedCacheCleanup.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  OEmbedCacheCleanup() {
    if (Meteor.userId() && !RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'OEmbedCacheCleanup'
      });
    }

    const date = new Date();
    const expirationDays = RocketChat.settings.get('API_EmbedCacheExpirationDays');
    date.setDate(date.getDate() - expirationDays);
    RocketChat.models.OEmbedCache.removeAfterDate(date);
    return {
      message: 'cache_cleared'
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addAllUserToRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/addAllUserToRoom.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  addAllUserToRoom(rid, activeUsersOnly = false) {
    check(rid, String);
    check(activeUsersOnly, Boolean);

    if (RocketChat.authz.hasRole(this.userId, 'admin') === true) {
      const userCount = RocketChat.models.Users.find().count();

      if (userCount > RocketChat.settings.get('API_User_Limit')) {
        throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
          method: 'addAllToRoom'
        });
      }

      const room = RocketChat.models.Rooms.findOneById(rid);

      if (room == null) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          method: 'addAllToRoom'
        });
      }

      const userFilter = {};

      if (activeUsersOnly === true) {
        userFilter.active = true;
      }

      const users = RocketChat.models.Users.find(userFilter).fetch();
      const now = new Date();
      users.forEach(function (user) {
        const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

        if (subscription != null) {
          return;
        }

        RocketChat.callbacks.run('beforeJoinRoom', user, room);
        RocketChat.models.Rooms.addUsernameById(rid, user.username);
        RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
          ts: now,
          open: true,
          alert: true,
          unread: 1,
          userMentions: 1,
          groupMentions: 0
        });
        RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rid, user, {
          ts: now
        });
        Meteor.defer(function () {});
        return RocketChat.callbacks.run('afterJoinRoom', user, room);
      });
      return true;
    } else {
      throw new Meteor.Error(403, 'Access to Method Forbidden', {
        method: 'addAllToRoom'
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addRoomLeader.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/addRoomLeader.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  addRoomLeader(rid, userId) {
    check(rid, String);
    check(userId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addRoomLeader'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-leader', rid)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'addRoomLeader'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    if (!user || !user.username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addRoomLeader'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

    if (!subscription) {
      throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
        method: 'addRoomLeader'
      });
    }

    if (Array.isArray(subscription.roles) === true && subscription.roles.includes('leader') === true) {
      throw new Meteor.Error('error-user-already-leader', 'User is already a leader', {
        method: 'addRoomLeader'
      });
    }

    RocketChat.models.Subscriptions.addRoleById(subscription._id, 'leader');
    const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());
    RocketChat.models.Messages.createSubscriptionRoleAddedWithRoomIdAndUser(rid, user, {
      u: {
        _id: fromUser._id,
        username: fromUser.username
      },
      role: 'leader'
    });

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'added',
        _id: 'leader',
        u: {
          _id: user._id,
          username: user.username,
          name: user.name
        },
        scope: rid
      });
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addRoomModerator.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/addRoomModerator.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  addRoomModerator(rid, userId) {
    check(rid, String);
    check(userId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addRoomModerator'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-moderator', rid)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'addRoomModerator'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    if (!user || !user.username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addRoomModerator'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

    if (!subscription) {
      throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
        method: 'addRoomModerator'
      });
    }

    if (Array.isArray(subscription.roles) === true && subscription.roles.includes('moderator') === true) {
      throw new Meteor.Error('error-user-already-moderator', 'User is already a moderator', {
        method: 'addRoomModerator'
      });
    }

    RocketChat.models.Subscriptions.addRoleById(subscription._id, 'moderator');
    const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());
    RocketChat.models.Messages.createSubscriptionRoleAddedWithRoomIdAndUser(rid, user, {
      u: {
        _id: fromUser._id,
        username: fromUser.username
      },
      role: 'moderator'
    });

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'added',
        _id: 'moderator',
        u: {
          _id: user._id,
          username: user.username,
          name: fromUser.name
        },
        scope: rid
      });
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addRoomOwner.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/addRoomOwner.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  addRoomOwner(rid, userId) {
    check(rid, String);
    check(userId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addRoomOwner'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-owner', rid)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'addRoomOwner'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    if (!user || !user.username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addRoomOwner'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

    if (!subscription) {
      throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
        method: 'addRoomOwner'
      });
    }

    if (Array.isArray(subscription.roles) === true && subscription.roles.includes('owner') === true) {
      throw new Meteor.Error('error-user-already-owner', 'User is already an owner', {
        method: 'addRoomOwner'
      });
    }

    RocketChat.models.Subscriptions.addRoleById(subscription._id, 'owner');
    const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());
    RocketChat.models.Messages.createSubscriptionRoleAddedWithRoomIdAndUser(rid, user, {
      u: {
        _id: fromUser._id,
        username: fromUser.username
      },
      role: 'owner'
    });

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'added',
        _id: 'owner',
        u: {
          _id: user._id,
          username: user.username,
          name: user.name
        },
        scope: rid
      });
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"afterVerifyEmail.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/afterVerifyEmail.js                                                                                  //
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
  afterVerifyEmail() {
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'afterVerifyEmail'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    const verifiedEmail = _.find(user.emails, email => email.verified);

    if (verifiedEmail) {
      RocketChat.models.Roles.addUserRoles(user._id, 'user');
      RocketChat.models.Roles.removeUserRoles(user._id, 'anonymous');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"browseChannels.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/browseChannels.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

const sortChannels = function (field, direction) {
  switch (field) {
    case 'createdAt':
      return {
        ts: direction === 'asc' ? 1 : -1
      };

    default:
      return {
        [field]: direction === 'asc' ? 1 : -1
      };
  }
};

const sortUsers = function (field, direction) {
  switch (field) {
    default:
      return {
        [field]: direction === 'asc' ? 1 : -1
      };
  }
};

Meteor.methods({
  browseChannels({
    text = '',
    type = 'channels',
    sortBy = 'name',
    sortDirection = 'asc',
    page = 0,
    limit = 10
  }) {
    const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');

    if (!['channels', 'users'].includes(type)) {
      return;
    }

    if (!['asc', 'desc'].includes(sortDirection)) {
      return;
    }

    if (!['name', 'createdAt', ...(type === 'channels' ? ['usernames'] : []), ...(type === 'users' ? ['username'] : [])].includes(sortBy)) {
      return;
    }

    page = page > -1 ? page : 0;
    limit = limit > 0 ? limit : 10;
    const options = {
      skip: limit * page,
      limit
    };
    const user = Meteor.user();

    if (type === 'channels') {
      const sort = sortChannels(sortBy, sortDirection);

      if (!RocketChat.authz.hasPermission(user._id, 'view-c-room')) {
        return;
      }

      return {
        results: RocketChat.models.Rooms.findByNameAndType(regex, 'c', (0, _objectSpread2.default)({}, options, {
          sort,
          fields: {
            description: 1,
            topic: 1,
            name: 1,
            lastMessage: 1,
            ts: 1,
            archived: 1,
            usernames: 1,
            usersCount: 1
          }
        })).fetch(),
        total: RocketChat.models.Rooms.findByNameAndType(regex, 'c').count()
      };
    } // type === users


    if (!RocketChat.authz.hasPermission(user._id, 'view-outside-room') || !RocketChat.authz.hasPermission(user._id, 'view-d-room')) {
      return;
    }

    const sort = sortUsers(sortBy, sortDirection);
    return {
      results: RocketChat.models.Users.findByActiveUsersExcept(text, [user.username], (0, _objectSpread2.default)({}, options, {
        sort,
        fields: {
          username: 1,
          name: 1,
          createdAt: 1,
          emails: 1
        }
      })).fetch(),
      total: RocketChat.models.Users.findByActiveUsersExcept(text, [user.username]).count()
    };
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'browseChannels',

  userId()
  /*userId*/
  {
    return true;
  }

}, 100, 100000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"canAccessRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/canAccessRoom.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  canAccessRoom(rid, userId, extraData) {
    check(rid, String);
    check(userId, Match.Maybe(String));
    let user;

    if (userId) {
      user = RocketChat.models.Users.findOneById(userId, {
        fields: {
          username: 1
        }
      });

      if (!user || !user.username) {
        throw new Meteor.Error('error-invalid-user', 'Invalid user', {
          method: 'canAccessRoom'
        });
      }
    }

    if (!rid) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'canAccessRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (room) {
      if (RocketChat.authz.canAccessRoom.call(this, room, user, extraData)) {
        if (user) {
          room.username = user.username;
        }

        return room;
      }

      if (!userId && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
        throw new Meteor.Error('error-invalid-user', 'Invalid user', {
          method: 'canAccessRoom'
        });
      }

      return false;
    } else {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'canAccessRoom'
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelsList.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/channelsList.js                                                                                      //
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
Meteor.methods({
  channelsList(filter, channelType, limit, sort) {
    this.unblock();
    check(filter, String);
    check(channelType, String);
    check(limit, Match.Optional(Number));
    check(sort, Match.Optional(String));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'channelsList'
      });
    }

    const options = {
      fields: {
        name: 1,
        t: 1
      },
      sort: {
        msgs: -1
      }
    };

    if (_.isNumber(limit)) {
      options.limit = limit;
    }

    if (s.trim(sort)) {
      switch (sort) {
        case 'name':
          options.sort = {
            name: 1
          };
          break;

        case 'msgs':
          options.sort = {
            msgs: -1
          };
      }
    }

    const roomTypes = [];

    if (channelType !== 'private') {
      if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room')) {
        roomTypes.push({
          type: 'c'
        });
      } else if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-joined-room')) {
        const roomIds = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('c', Meteor.userId()).fetch(), 'rid');

        roomTypes.push({
          type: 'c',
          ids: roomIds
        });
      }
    }

    if (channelType !== 'public' && RocketChat.authz.hasPermission(Meteor.userId(), 'view-p-room')) {
      const user = RocketChat.models.Users.findOne(Meteor.userId(), {
        fields: {
          username: 1,
          'settings.preferences.sidebarGroupByType': 1
        }
      });
      const userPref = RocketChat.getUserPreference(user, 'sidebarGroupByType');
      const globalPref = RocketChat.settings.get('UI_Group_Channels_By_Type'); // needs to negate globalPref because userPref represents its opposite

      const groupByType = userPref !== undefined ? userPref : globalPref;

      if (!groupByType) {
        roomTypes.push({
          type: 'p',
          username: user.username
        });
      }
    }

    if (roomTypes.length) {
      if (filter) {
        return {
          channels: RocketChat.models.Rooms.findByNameContainingTypesWithUsername(filter, roomTypes, options).fetch()
        };
      }

      return {
        channels: RocketChat.models.Rooms.findContainingTypesWithUsername(roomTypes, options).fetch()
      };
    }

    return {
      channels: []
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createDirectMessage.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/createDirectMessage.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

Meteor.methods({
  createDirectMessage(username) {
    check(username, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'createDirectMessage'
      });
    }

    const me = Meteor.user();

    if (!me.username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'createDirectMessage'
      });
    }

    if (RocketChat.settings.get('Message_AllowDirectMessagesToYourself') === false && me.username === username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'createDirectMessage'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-d')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'createDirectMessage'
      });
    }

    const to = RocketChat.models.Users.findOneByUsername(username);

    if (!to) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'createDirectMessage'
      });
    }

    const rid = [me._id, to._id].sort().join('');
    const now = new Date(); // Make sure we have a room

    RocketChat.models.Rooms.upsert({
      _id: rid
    }, {
      $set: {
        usernames: [me.username, to.username]
      },
      $setOnInsert: {
        t: 'd',
        msgs: 0,
        ts: now
      }
    });
    const myNotificationPref = RocketChat.getDefaultSubscriptionPref(me); // Make user I have a subcription to this room

    const upsertSubscription = {
      $set: {
        ts: now,
        ls: now,
        open: true
      },
      $setOnInsert: (0, _objectSpread2.default)({
        name: to.username,
        t: 'd',
        alert: false,
        unread: 0,
        userMentions: 0,
        groupMentions: 0,
        customFields: me.customFields,
        u: {
          _id: me._id,
          username: me.username
        }
      }, myNotificationPref)
    };

    if (to.active === false) {
      upsertSubscription.$set.archived = true;
    }

    RocketChat.models.Subscriptions.upsert({
      rid,
      $and: [{
        'u._id': me._id
      }] // work around to solve problems with upsert and dot

    }, upsertSubscription);
    const toNotificationPref = RocketChat.getDefaultSubscriptionPref(to);
    RocketChat.models.Subscriptions.upsert({
      rid,
      $and: [{
        'u._id': to._id
      }] // work around to solve problems with upsert and dot

    }, {
      $setOnInsert: (0, _objectSpread2.default)({
        name: me.username,
        t: 'd',
        open: false,
        alert: false,
        unread: 0,
        userMentions: 0,
        groupMentions: 0,
        customFields: to.customFields,
        u: {
          _id: to._id,
          username: to.username
        }
      }, toNotificationPref)
    });
    return {
      rid
    };
  }

});
RocketChat.RateLimiter.limitMethod('createDirectMessage', 10, 60000, {
  userId(userId) {
    return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteFileMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/deleteFileMessage.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global FileUpload */
Meteor.methods({
  deleteFileMessage(fileID) {
    check(fileID, String);
    const msg = RocketChat.models.Messages.getMessageByFileId(fileID);

    if (msg) {
      return Meteor.call('deleteMessage', msg);
    }

    return FileUpload.getStore('Uploads').deleteById(fileID);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/deleteUser.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  deleteUser(userId) {
    check(userId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'deleteUser'
      });
    }

    if (RocketChat.authz.hasPermission(Meteor.userId(), 'delete-user') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'deleteUser'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'deleteUser'
      });
    }

    const adminCount = Meteor.users.find({
      roles: 'admin'
    }).count();
    const userIsAdmin = user.roles.indexOf('admin') > -1;

    if (adminCount === 1 && userIsAdmin) {
      throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
        method: 'deleteUser',
        action: 'Remove_last_admin'
      });
    }

    RocketChat.deleteUser(userId);
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"eraseRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/eraseRoom.js                                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals RocketChat */
Meteor.methods({
  eraseRoom(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'eraseRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'eraseRoom'
      });
    }

    if (Apps && Apps.isLoaded()) {
      const prevent = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomDeletePrevent', room));

      if (prevent) {
        throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the room erasing.');
      }
    }

    if (RocketChat.roomTypes.roomTypes[room.t].canBeDeleted(room)) {
      RocketChat.models.Messages.removeByRoomId(rid);
      RocketChat.models.Subscriptions.removeByRoomId(rid);
      const result = RocketChat.models.Rooms.removeById(rid);

      if (Apps && Apps.isLoaded()) {
        Apps.getBridges().getListenerBridge().roomEvent('IPostRoomDeleted', room);
      }

      return result;
    } else {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'eraseRoom'
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getAvatarSuggestion.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/getAvatarSuggestion.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global Gravatar */
function getAvatarSuggestionForUser(user) {
  check(user, Object);
  const avatars = [];

  if (user.services.facebook && user.services.facebook.id && RocketChat.settings.get('Accounts_OAuth_Facebook')) {
    avatars.push({
      service: 'facebook',
      url: `https://graph.facebook.com/${user.services.facebook.id}/picture?type=large`
    });
  }

  if (user.services.google && user.services.google.picture && user.services.google.picture !== 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg' && RocketChat.settings.get('Accounts_OAuth_Google')) {
    avatars.push({
      service: 'google',
      url: user.services.google.picture
    });
  }

  if (user.services.github && user.services.github.username && RocketChat.settings.get('Accounts_OAuth_Github')) {
    avatars.push({
      service: 'github',
      url: `https://avatars.githubusercontent.com/${user.services.github.username}?s=200`
    });
  }

  if (user.services.linkedin && user.services.linkedin.pictureUrl && RocketChat.settings.get('Accounts_OAuth_Linkedin')) {
    avatars.push({
      service: 'linkedin',
      url: user.services.linkedin.pictureUrl
    });
  }

  if (user.services.twitter && user.services.twitter.profile_image_url_https && RocketChat.settings.get('Accounts_OAuth_Twitter')) {
    avatars.push({
      service: 'twitter',
      url: user.services.twitter.profile_image_url_https.replace(/_normal|_bigger/, '')
    });
  }

  if (user.services.gitlab && user.services.gitlab.avatar_url && RocketChat.settings.get('Accounts_OAuth_Gitlab')) {
    avatars.push({
      service: 'gitlab',
      url: user.services.gitlab.avatar_url
    });
  }

  if (user.services.sandstorm && user.services.sandstorm.picture && Meteor.settings['public'].sandstorm) {
    avatars.push({
      service: 'sandstorm',
      url: user.services.sandstorm.picture
    });
  }

  if (user.emails && user.emails.length > 0) {
    for (const email of user.emails) {
      if (email.verified === true) {
        avatars.push({
          service: 'gravatar',
          url: Gravatar.imageUrl(email.address, {
            'default': '404',
            size: 200,
            secure: true
          })
        });
      }

      if (email.verified !== true) {
        avatars.push({
          service: 'gravatar',
          url: Gravatar.imageUrl(email.address, {
            'default': '404',
            size: 200,
            secure: true
          })
        });
      }
    }
  }

  const validAvatars = {};

  for (const avatar of avatars) {
    try {
      const result = HTTP.get(avatar.url, {
        npmRequestOptions: {
          encoding: 'binary'
        }
      });

      if (result.statusCode === 200) {
        let blob = `data:${result.headers['content-type']};base64,`;
        blob += Buffer.from(result.content, 'binary').toString('base64');
        avatar.blob = blob;
        avatar.contentType = result.headers['content-type'];
        validAvatars[avatar.service] = avatar;
      }
    } catch (error) {// error;
    }
  }

  return validAvatars;
}

this.getAvatarSuggestionForUser = getAvatarSuggestionForUser;
Meteor.methods({
  getAvatarSuggestion() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getAvatarSuggestion'
      });
    }

    this.unblock();
    const user = Meteor.user();
    return getAvatarSuggestionForUser(user);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getRoomIdByNameOrId.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/getRoomIdByNameOrId.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  getRoomIdByNameOrId(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getRoomIdByNameOrId'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid) || RocketChat.models.Rooms.findOneByName(rid);

    if (room == null) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'getRoomIdByNameOrId'
      });
    }

    const user = Meteor.user();

    if (user && user.username && room.usernames.indexOf(user.username) !== -1) {
      return room._id;
    }

    if (room.t !== 'c' || RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'getRoomIdByNameOrId'
      });
    }

    return room._id;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getRoomNameById.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/getRoomNameById.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  getRoomNameById(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getRoomNameById'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (room == null) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'getRoomNameById'
      });
    }

    const user = Meteor.user();

    if (user && user.username && room.usernames.indexOf(user.username) !== -1) {
      return room.name;
    }

    if (room.t !== 'c' || RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'getRoomNameById'
      });
    }

    return room.name;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getTotalChannels.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/getTotalChannels.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  getTotalChannels() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getTotalChannels'
      });
    }

    const query = {
      t: 'c'
    };
    return RocketChat.models.Rooms.find(query).count();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUsernameSuggestion.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/getUsernameSuggestion.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

function slug(text) {
  text = slugify(text, '.');
  return text.replace(/[^0-9a-z-_.]/g, '');
}

function usernameIsAvaliable(username) {
  if (username.length < 1) {
    return false;
  }

  if (username === 'all') {
    return false;
  }

  return !RocketChat.models.Users.findOneByUsername(username);
}

function generateSuggestion(user) {
  let usernames = [];
  let username = undefined;

  if (Meteor.settings['public'].sandstorm) {
    usernames.push(user.services.sandstorm.preferredHandle);
  }

  if (Match.test(user && user.name, String)) {
    if (RocketChat.settings.get('UTF8_Names_Slugify')) {
      usernames.push(slug(user.name));
    } else {
      usernames.push(user.name);
    }

    const nameParts = user.name.split(' ');

    if (nameParts.length > 1) {
      const first = nameParts[0];
      const last = nameParts[nameParts.length - 1];

      if (RocketChat.settings.get('UTF8_Names_Slugify')) {
        usernames.push(slug(first[0] + last));
        usernames.push(slug(first + last[0]));
      } else {
        usernames.push(first[0] + last);
        usernames.push(first + last[0]);
      }
    }
  }

  if (user.profile && user.profile.name) {
    if (RocketChat.settings.get('UTF8_Names_Slugify')) {
      usernames.push(slug(user.profile.name));
    } else {
      usernames.push(user.profile.name);
    }
  }

  if (Array.isArray(user.services)) {
    let services = user.services.map(service => {
      return _.values(_.pick(service, 'name', 'username', 'firstName', 'lastName'));
    });
    services = _.uniq(_.flatten(services));

    for (const service of services) {
      if (RocketChat.settings.get('UTF8_Names_Slugify')) {
        usernames.push(slug(service));
      } else {
        usernames.push(service);
      }
    }
  }

  if (user.emails && user.emails.length > 0) {
    for (const email of user.emails) {
      if (email.address && email.verified === true) {
        usernames.push(slug(email.address.replace(/@.+$/, '')));
        usernames.push(slug(email.address.replace(/(.+)@(\w+).+/, '$1.$2')));
      }
    }
  }

  usernames = _.compact(usernames);

  for (const item of usernames) {
    if (usernameIsAvaliable(item)) {
      return item;
    }
  }

  if (usernames.length === 0 || usernames[0].length === 0) {
    usernames.push(RocketChat.settings.get('Accounts_DefaultUsernamePrefixSuggestion'));
  }

  let index = 0;

  while (!username) {
    index++;

    if (usernameIsAvaliable(`${usernames[0]}-${index}`)) {
      username = `${usernames[0]}-${index}`;
    }
  }

  if (usernameIsAvaliable(username)) {
    return username;
  }
}

RocketChat.generateUsernameSuggestion = generateSuggestion;
Meteor.methods({
  getUsernameSuggestion() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getUsernameSuggestion'
      });
    }

    const user = Meteor.user();
    return generateSuggestion(user);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUsersOfRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/getUsersOfRoom.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  getUsersOfRoom(roomId, showAll) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getUsersOfRoom'
      });
    }

    const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'getUsersOfRoom'
      });
    }

    if (room.broadcast && !RocketChat.authz.hasPermission(Meteor.userId(), 'view-broadcast-member-list', roomId)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'getUsersOfRoom'
      });
    }

    const filter = record => {
      if (!record._user) {
        console.log('Subscription without user', record._id);
        return false;
      }

      if (showAll === true) {
        return true;
      }

      return record._user.status !== 'offline';
    };

    const map = record => {
      return {
        _id: record._user._id,
        username: record._user.username,
        name: record._user.name
      };
    };

    const records = RocketChat.models.Subscriptions.findByRoomId(roomId).fetch();
    return {
      total: records.length,
      records: records.filter(filter).map(map)
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"groupsList.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/groupsList.js                                                                                        //
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
Meteor.methods({
  groupsList(nameFilter, limit, sort) {
    check(nameFilter, Match.Optional(String));
    check(limit, Match.Optional(Number));
    check(sort, Match.Optional(String));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'groupsList'
      });
    }

    const options = {
      fields: {
        name: 1
      },
      sort: {
        name: 1
      }
    }; //Verify the limit param is a number

    if (_.isNumber(limit)) {
      options.limit = limit;
    } //Verify there is a sort option and it's a string


    if (s.trim(sort)) {
      switch (sort) {
        case 'name':
          options.sort = {
            name: 1
          };
          break;

        case 'msgs':
          options.sort = {
            msgs: -1
          };
          break;
      }
    } //Determine if they are searching or not, base it upon the name field


    if (nameFilter) {
      return {
        groups: RocketChat.models.Rooms.findByTypeAndNameContainingUsername('p', new RegExp(s.trim(s.escapeRegExp(nameFilter)), 'i'), Meteor.user().username, options).fetch()
      };
    } else {
      const roomIds = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('p', Meteor.userId()).fetch(), 'rid');

      return {
        groups: RocketChat.models.Rooms.findByIds(roomIds, options).fetch()
      };
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hideRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/hideRoom.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  hideRoom(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'hideRoom'
      });
    }

    return RocketChat.models.Subscriptions.hideByRoomIdAndUserId(rid, Meteor.userId());
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ignoreUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/ignoreUser.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals RocketChat */
Meteor.methods({
  ignoreUser({
    rid,
    userId: ignoredUser,
    ignore = true
  }) {
    check(ignoredUser, String);
    check(rid, String);
    check(ignore, Boolean);
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'ignoreUser'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, userId);

    if (!subscription) {
      throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
        method: 'ignoreUser'
      });
    }

    const subscriptionIgnoredUser = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, ignoredUser);

    if (!subscriptionIgnoredUser) {
      throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
        method: 'ignoreUser'
      });
    }

    return !!RocketChat.models.Subscriptions.ignoreUser({
      _id: subscription._id,
      ignoredUser,
      ignore
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadHistory.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/loadHistory.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const hideMessagesOfType = [];
RocketChat.settings.get(/Message_HideType_.+/, function (key, value) {
  const type = key.replace('Message_HideType_', '');
  const types = type === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [type];
  return types.forEach(type => {
    const index = hideMessagesOfType.indexOf(type);

    if (value === true && index === -1) {
      return hideMessagesOfType.push(type);
    }

    if (index > -1) {
      return hideMessagesOfType.splice(index, 1);
    }
  });
});
Meteor.methods({
  loadHistory(rid, end, limit = 20, ls) {
    this.unblock();
    check(rid, String);

    if (!Meteor.userId() && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'loadHistory'
      });
    }

    const fromId = Meteor.userId();
    const room = Meteor.call('canAccessRoom', rid, fromId);

    if (!room) {
      return false;
    }

    const canAnonymous = RocketChat.settings.get('Accounts_AllowAnonymousRead');
    const canPreview = RocketChat.authz.hasPermission(fromId, 'preview-c-room');

    if (room.t === 'c' && !canAnonymous && !canPreview && room.usernames.indexOf(room.username) === -1) {
      return false;
    }

    return RocketChat.loadMessageHistory({
      userId: fromId,
      rid,
      end,
      limit,
      ls
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadLocale.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/loadLocale.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  loadLocale(locale) {
    check(locale, String);

    try {
      return Assets.getText(`moment-locales/${locale.toLowerCase()}.js`);
    } catch (error) {
      try {
        return Assets.getText(`moment-locales/${locale.split('-').shift().toLowerCase()}.js`);
      } catch (error) {
        return console.log(error);
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadMissedMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/loadMissedMessages.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  loadMissedMessages(rid, start) {
    check(rid, String);
    check(start, Date);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'loadMissedMessages'
      });
    }

    const fromId = Meteor.userId();

    if (!Meteor.call('canAccessRoom', rid, fromId)) {
      return false;
    }

    const options = {
      sort: {
        ts: -1
      }
    };

    if (!RocketChat.settings.get('Message_ShowEditedStatus')) {
      options.fields = {
        'editedAt': 0
      };
    }

    return RocketChat.models.Messages.findVisibleByRoomIdAfterTimestamp(rid, start, options).fetch();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadNextMessages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/loadNextMessages.js                                                                                  //
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
  loadNextMessages(rid, end, limit = 20) {
    check(rid, String);
    check(limit, Number);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'loadNextMessages'
      });
    }

    const fromId = Meteor.userId();

    if (!Meteor.call('canAccessRoom', rid, fromId)) {
      return false;
    }

    const options = {
      sort: {
        ts: 1
      },
      limit
    };

    if (!RocketChat.settings.get('Message_ShowEditedStatus')) {
      options.fields = {
        editedAt: 0
      };
    }

    let records;

    if (end) {
      records = RocketChat.models.Messages.findVisibleByRoomIdAfterTimestamp(rid, end, options).fetch();
    } else {
      records = RocketChat.models.Messages.findVisibleByRoomId(rid, options).fetch();
    }

    const messages = records.map(message => {
      message.starred = _.findWhere(message.starred, {
        _id: fromId
      });
      return message;
    });
    return {
      messages
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadSurroundingMessages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/loadSurroundingMessages.js                                                                           //
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
  loadSurroundingMessages(message, limit = 50) {
    check(message, Object);
    check(limit, Number);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'loadSurroundingMessages'
      });
    }

    const fromId = Meteor.userId();

    if (!message._id) {
      return false;
    }

    message = RocketChat.models.Messages.findOneById(message._id);

    if (!message || !message.rid) {
      return false;
    }

    if (!Meteor.call('canAccessRoom', message.rid, fromId)) {
      return false;
    }

    limit = limit - 1;
    const options = {
      sort: {
        ts: -1
      },
      limit: Math.ceil(limit / 2)
    };

    if (!RocketChat.settings.get('Message_ShowEditedStatus')) {
      options.fields = {
        editedAt: 0
      };
    }

    const recordsBefore = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestamp(message.rid, message.ts, options).fetch();
    const messages = recordsBefore.map(message => {
      message.starred = _.findWhere(message.starred, {
        _id: fromId
      });
      return message;
    });
    const moreBefore = messages.length === options.limit;
    messages.push(message);
    options.sort = {
      ts: 1
    };
    options.limit = Math.floor(limit / 2);
    const recordsAfter = RocketChat.models.Messages.findVisibleByRoomIdAfterTimestamp(message.rid, message.ts, options).fetch();
    const afterMessages = recordsAfter.map(message => {
      message.starred = _.findWhere(message.starred, {
        _id: fromId
      });
      return message;
    });
    const moreAfter = afterMessages.length === options.limit;
    return {
      messages: messages.concat(afterMessages),
      moreBefore,
      moreAfter
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"logoutCleanUp.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/logoutCleanUp.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  logoutCleanUp(user) {
    check(user, Object);
    Meteor.defer(function () {
      RocketChat.callbacks.run('afterLogoutCleanUp', user);
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messageSearch.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/messageSearch.js                                                                                     //
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
  messageSearch(text, rid, limit) {
    check(text, String);
    check(rid, Match.Maybe(String));
    check(limit, Match.Optional(Number)); // TODO: Evaluate why we are returning `users` and `channels`, as the only thing that gets set is the `messages`.

    const result = {
      message: {
        docs: []
      }
    };
    const currentUserId = Meteor.userId();

    if (!currentUserId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'messageSearch'
      });
    } // Don't process anything else if the user can't access the room


    if (rid) {
      if (!Meteor.call('canAccessRoom', rid, currentUserId)) {
        return result;
      }
    } else if (RocketChat.settings.get('Search.defaultProvider.GlobalSearchEnabled') !== true) {
      return result;
    }

    const user = Meteor.user();
    const currentUserName = user.username;
    const currentUserTimezoneOffset = user.utcOffset;
    const query = {};
    const options = {
      sort: {
        ts: -1
      },
      limit: limit || 20
    }; // I would place these methods at the bottom of the file for clarity but travis doesn't appreciate that.
    // (no-use-before-define)

    function filterStarred() {
      query['starred._id'] = currentUserId;
      return '';
    }

    function filterUrl() {
      query['urls.0'] = {
        $exists: true
      };
      return '';
    }

    function filterPinned() {
      query.pinned = true;
      return '';
    }

    function filterLocation() {
      query.location = {
        $exist: true
      };
      return '';
    }

    function filterBeforeDate(_, day, month, year) {
      month--;
      const beforeDate = new Date(year, month, day);
      beforeDate.setHours(beforeDate.getUTCHours() + beforeDate.getTimezoneOffset() / 60 + currentUserTimezoneOffset);
      query.ts = {
        $lte: beforeDate
      };
      return '';
    }

    function filterAfterDate(_, day, month, year) {
      month--;
      day++;
      const afterDate = new Date(year, month, day);
      afterDate.setUTCHours(afterDate.getUTCHours() + afterDate.getTimezoneOffset() / 60 + currentUserTimezoneOffset);

      if (query.ts) {
        query.ts.$gte = afterDate;
      } else {
        query.ts = {
          $gte: afterDate
        };
      }

      return '';
    }

    function filterOnDate(_, day, month, year) {
      month--;
      const date = new Date(year, month, day);
      date.setUTCHours(date.getUTCHours() + date.getTimezoneOffset() / 60 + currentUserTimezoneOffset);
      const dayAfter = new Date(date);
      dayAfter.setDate(dayAfter.getDate() + 1);
      delete query.ts;
      query.ts = {
        $gte: date,
        $lt: dayAfter
      };
      return '';
    }

    function filterLabel(_, tag) {
      query['attachments.0.labels'] = new RegExp(s.escapeRegExp(tag), 'i');
      return '';
    }

    function sortByTimestamp(_, direction) {
      if (direction.startsWith('asc')) {
        options.sort.ts = 1;
      } else if (direction.startsWith('desc')) {
        options.sort.ts = -1;
      }

      return '';
    }
    /*
     text = 'from:rodrigo mention:gabriel chat'
     */
    // Query for senders


    const from = [];
    text = text.replace(/from:([a-z0-9.-_]+)/ig, function (match, username) {
      if (username === 'me' && !from.includes(currentUserName)) {
        username = currentUserName;
      }

      from.push(username);
      return '';
    });

    if (from.length > 0) {
      query['u.username'] = {
        $regex: from.join('|'),
        $options: 'i'
      };
    } // Query for senders


    const mention = [];
    text = text.replace(/mention:([a-z0-9.-_]+)/ig, function (match, username) {
      mention.push(username);
      return '';
    });

    if (mention.length > 0) {
      query['mentions.username'] = {
        $regex: mention.join('|'),
        $options: 'i'
      };
    } // Filter on messages that are starred by the current user.


    text = text.replace(/has:star/g, filterStarred); // Filter on messages that have an url.

    text = text.replace(/has:url|has:link/g, filterUrl); // Filter on pinned messages.

    text = text.replace(/is:pinned|has:pin/g, filterPinned); // Filter on messages which have a location attached.

    text = text.replace(/has:location|has:map/g, filterLocation); // Filter image tags

    text = text.replace(/label:(\w+)/g, filterLabel); // Filtering before/after/on a date
    // matches dd-MM-yyyy, dd/MM/yyyy, dd-MM-yyyy, prefixed by before:, after: and on: respectively.
    // Example: before:15/09/2016 after: 10-08-2016
    // if "on:" is set, "before:" and "after:" are ignored.

    text = text.replace(/before:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, filterBeforeDate);
    text = text.replace(/after:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, filterAfterDate);
    text = text.replace(/on:(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g, filterOnDate); // Sort order

    text = text.replace(/(?:order|sort):(asc|ascend|ascending|desc|descend|descending)/g, sortByTimestamp); // Query in message text

    text = text.trim().replace(/\s\s/g, ' ');

    if (text !== '') {
      if (/^\/.+\/[imxs]*$/.test(text)) {
        const r = text.split('/');
        query.msg = {
          $regex: r[1],
          $options: r[2]
        };
      } else if (RocketChat.settings.get('Message_AlwaysSearchRegExp')) {
        query.msg = {
          $regex: text,
          $options: 'i'
        };
      } else {
        query.$text = {
          $search: text
        };
        options.fields = {
          score: {
            $meta: 'textScore'
          }
        };
      }
    }

    if (Object.keys(query).length > 0) {
      query.t = {
        $ne: 'rm' //hide removed messages (useful when searching for user messages)

      };
      query._hidden = {
        $ne: true // don't return _hidden messages

      };

      if (rid) {
        query.rid = rid;
      } else {
        query.rid = {
          $in: RocketChat.models.Subscriptions.findByUserId(user._id).fetch().map(subscription => subscription.rid)
        };
      }

      if (!RocketChat.settings.get('Message_ShowEditedStatus')) {
        options.fields = {
          'editedAt': 0
        };
      }

      result.message.docs = RocketChat.models.Messages.find(query, options).fetch();
    }

    return result;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"migrate.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/migrate.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  migrateTo(version) {
    check(version, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'migrateTo'
      });
    }

    const user = Meteor.user();

    if (!user || RocketChat.authz.hasPermission(user._id, 'run-migration') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'migrateTo'
      });
    }

    this.unblock();
    RocketChat.Migrations.migrateTo(version);
    return version;
  },

  getMigrationVersion() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getMigrationVersion'
      });
    }

    return RocketChat.Migrations.getVersion();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"muteUserInRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/muteUserInRoom.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  muteUserInRoom(data) {
    check(data, Match.ObjectIncluding({
      rid: String,
      username: String
    }));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'muteUserInRoom'
      });
    }

    const fromId = Meteor.userId();

    if (!RocketChat.authz.hasPermission(fromId, 'mute-user', data.rid)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'muteUserInRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(data.rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'muteUserInRoom'
      });
    }

    if (['c', 'p'].includes(room.t) === false) {
      throw new Meteor.Error('error-invalid-room-type', `${room.t} is not a valid room type`, {
        method: 'muteUserInRoom',
        type: room.t
      });
    }

    if (Array.isArray(room.usernames) === false || room.usernames.includes(data.username) === false) {
      throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
        method: 'muteUserInRoom'
      });
    }

    const mutedUser = RocketChat.models.Users.findOneByUsername(data.username);
    RocketChat.models.Rooms.muteUsernameByRoomId(data.rid, mutedUser.username);
    const fromUser = RocketChat.models.Users.findOneById(fromId);
    RocketChat.models.Messages.createUserMutedWithRoomIdAndUser(data.rid, mutedUser, {
      u: {
        _id: fromUser._id,
        username: fromUser.username
      }
    });
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"openRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/openRoom.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  openRoom(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'openRoom'
      });
    }

    return RocketChat.models.Subscriptions.openByRoomIdAndUserId(rid, Meteor.userId());
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"readMessages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/readMessages.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let ReadReceipt;
module.watch(require("../../imports/message-read-receipt/server/lib/ReadReceipt"), {
  ReadReceipt(v) {
    ReadReceipt = v;
  }

}, 0);
Meteor.methods({
  readMessages(rid) {
    check(rid, String);
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'readMessages'
      });
    } // this prevents cache from updating object reference/pointer


    const userSubscription = Object.assign({}, RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, userId));
    RocketChat.models.Subscriptions.setAsReadByRoomIdAndUserId(rid, userId);
    Meteor.defer(() => {
      ReadReceipt.markMessagesAsRead(rid, userId, userSubscription.ls);
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"registerUser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/registerUser.js                                                                                      //
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
  registerUser(formData) {
    const AllowAnonymousRead = RocketChat.settings.get('Accounts_AllowAnonymousRead');
    const AllowAnonymousWrite = RocketChat.settings.get('Accounts_AllowAnonymousWrite');
    const manuallyApproveNewUsers = RocketChat.settings.get('Accounts_ManuallyApproveNewUsers');

    if (AllowAnonymousRead === true && AllowAnonymousWrite === true && formData.email == null) {
      const userId = Accounts.insertUserDoc({}, {
        globalRoles: ['anonymous']
      });

      const {
        id,
        token
      } = Accounts._loginUser(this, userId);

      return {
        id,
        token
      };
    } else {
      check(formData, Match.ObjectIncluding({
        email: String,
        pass: String,
        name: String,
        secretURL: Match.Optional(String),
        reason: Match.Optional(String)
      }));
    }

    if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Disabled') {
      throw new Meteor.Error('error-user-registration-disabled', 'User registration is disabled', {
        method: 'registerUser'
      });
    } else if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Secret URL' && (!formData.secretURL || formData.secretURL !== RocketChat.settings.get('Accounts_RegistrationForm_SecretURL'))) {
      throw new Meteor.Error('error-user-registration-secret', 'User registration is only allowed via Secret URL', {
        method: 'registerUser'
      });
    }

    RocketChat.passwordPolicy.validate(formData.pass);
    RocketChat.validateEmailDomain(formData.email);
    const userData = {
      email: s.trim(formData.email.toLowerCase()),
      password: formData.pass,
      name: formData.name,
      reason: formData.reason
    }; // Check if user has already been imported and never logged in. If so, set password and let it through

    const importedUser = RocketChat.models.Users.findOneByEmailAddress(s.trim(formData.email.toLowerCase()));
    let userId;

    if (importedUser && importedUser.importIds && importedUser.importIds.length && !importedUser.lastLogin) {
      Accounts.setPassword(importedUser._id, userData.password);
      userId = importedUser._id;
    } else {
      userId = Accounts.createUser(userData);
    }

    RocketChat.models.Users.setName(userId, s.trim(formData.name));
    const reason = s.trim(formData.reason);

    if (manuallyApproveNewUsers && reason) {
      RocketChat.models.Users.setReason(userId, reason);
    }

    RocketChat.saveCustomFields(userId, formData);

    try {
      if (RocketChat.settings.get('Verification_Customized')) {
        const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email_Subject') || '');
        const html = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email') || '');

        Accounts.emailTemplates.verifyEmail.subject = () => subject;

        Accounts.emailTemplates.verifyEmail.html = (userModel, url) => html.replace(/\[Verification_Url]/g, url);
      }

      Accounts.sendVerificationEmail(userId, userData.email);
    } catch (error) {// throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }
    }

    return userId;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeRoomLeader.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/removeRoomLeader.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  removeRoomLeader(rid, userId) {
    check(rid, String);
    check(userId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeRoomLeader'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-leader', rid)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'removeRoomLeader'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    if (!user || !user.username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeRoomLeader'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

    if (!subscription) {
      throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
        method: 'removeRoomLeader'
      });
    }

    if (Array.isArray(subscription.roles) === true && subscription.roles.includes('leader') === false) {
      throw new Meteor.Error('error-user-not-leader', 'User is not a leader', {
        method: 'removeRoomLeader'
      });
    }

    RocketChat.models.Subscriptions.removeRoleById(subscription._id, 'leader');
    const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());
    RocketChat.models.Messages.createSubscriptionRoleRemovedWithRoomIdAndUser(rid, user, {
      u: {
        _id: fromUser._id,
        username: fromUser.username
      },
      role: 'leader'
    });

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'removed',
        _id: 'leader',
        u: {
          _id: user._id,
          username: user.username,
          name: user.name
        },
        scope: rid
      });
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeRoomModerator.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/removeRoomModerator.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  removeRoomModerator(rid, userId) {
    check(rid, String);
    check(userId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeRoomModerator'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-moderator', rid)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'removeRoomModerator'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    if (!user || !user.username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeRoomModerator'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

    if (!subscription) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'removeRoomModerator'
      });
    }

    if (Array.isArray(subscription.roles) === false || subscription.roles.includes('moderator') === false) {
      throw new Meteor.Error('error-user-not-moderator', 'User is not a moderator', {
        method: 'removeRoomModerator'
      });
    }

    RocketChat.models.Subscriptions.removeRoleById(subscription._id, 'moderator');
    const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());
    RocketChat.models.Messages.createSubscriptionRoleRemovedWithRoomIdAndUser(rid, user, {
      u: {
        _id: fromUser._id,
        username: fromUser.username
      },
      role: 'moderator'
    });

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'removed',
        _id: 'moderator',
        u: {
          _id: user._id,
          username: user.username,
          name: user.name
        },
        scope: rid
      });
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeRoomOwner.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/removeRoomOwner.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  removeRoomOwner(rid, userId) {
    check(rid, String);
    check(userId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeRoomOwner'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'set-owner', rid)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'removeRoomOwner'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    if (!user || !user.username) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeRoomOwner'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

    if (!subscription) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'removeRoomOwner'
      });
    }

    if (Array.isArray(subscription.roles) === false || subscription.roles.includes('owner') === false) {
      throw new Meteor.Error('error-user-not-owner', 'User is not an owner', {
        method: 'removeRoomOwner'
      });
    }

    const numOwners = RocketChat.authz.getUsersInRole('owner', rid).count();

    if (numOwners === 1) {
      throw new Meteor.Error('error-remove-last-owner', 'This is the last owner. Please set a new owner before removing this one.', {
        method: 'removeRoomOwner'
      });
    }

    RocketChat.models.Subscriptions.removeRoleById(subscription._id, 'owner');
    const fromUser = RocketChat.models.Users.findOneById(Meteor.userId());
    RocketChat.models.Messages.createSubscriptionRoleRemovedWithRoomIdAndUser(rid, user, {
      u: {
        _id: fromUser._id,
        username: fromUser.username
      },
      role: 'owner'
    });

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'removed',
        _id: 'owner',
        u: {
          _id: user._id,
          username: user.username,
          name: user.name
        },
        scope: rid
      });
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUserFromRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/removeUserFromRoom.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  removeUserFromRoom(data) {
    check(data, Match.ObjectIncluding({
      rid: String,
      username: String
    }));
    const fromId = Meteor.userId();

    if (!fromId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeUserFromRoom'
      });
    }

    if (!RocketChat.authz.hasPermission(fromId, 'remove-user', data.rid)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'removeUserFromRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(data.rid);

    if (!room || room.t === 'd') {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'removeUserFromRoom'
      });
    }

    if (Array.isArray(room.usernames) === false || room.usernames.includes(data.username) === false) {
      throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
        method: 'removeUserFromRoom'
      });
    }

    const removedUser = RocketChat.models.Users.findOneByUsername(data.username);

    if (RocketChat.authz.hasRole(removedUser._id, 'owner', room._id)) {
      const numOwners = RocketChat.authz.getUsersInRole('owner', room._id).fetch().length;

      if (numOwners === 1) {
        throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
          method: 'removeUserFromRoom'
        });
      }
    }

    RocketChat.models.Rooms.removeUsernameById(data.rid, data.username);
    RocketChat.models.Subscriptions.removeByRoomIdAndUserId(data.rid, removedUser._id);

    if (['c', 'p'].includes(room.t) === true) {
      RocketChat.authz.removeUserFromRoles(removedUser._id, ['moderator', 'owner'], data.rid);
    }

    const fromUser = RocketChat.models.Users.findOneById(fromId);
    RocketChat.models.Messages.createUserRemovedWithRoomIdAndUser(data.rid, removedUser, {
      u: {
        _id: fromUser._id,
        username: fromUser.username
      }
    });
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"reportMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/reportMessage.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  reportMessage(messageId, description) {
    check(messageId, String);
    check(description, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'reportMessage'
      });
    }

    if (description == null || description.trim() === '') {
      throw new Meteor.Error('error-invalid-description', 'Invalid description', {
        method: 'reportMessage'
      });
    }

    const message = RocketChat.models.Messages.findOneById(messageId);

    if (!message) {
      throw new Meteor.Error('error-invalid-message_id', 'Invalid message id', {
        method: 'reportMessage'
      });
    }

    return RocketChat.models.Reports.createWithMessageDescriptionAndUserId(message, description, Meteor.userId());
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"requestDataDownload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/requestDataDownload.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let path;
module.watch(require("path"), {
  default(v) {
    path = v;
  }

}, 1);
let tempFolder = '/tmp/userData';

if (RocketChat.settings.get('UserData_FileSystemPath') != null) {
  if (RocketChat.settings.get('UserData_FileSystemPath').trim() !== '') {
    tempFolder = RocketChat.settings.get('UserData_FileSystemPath');
  }
}

Meteor.methods({
  requestDataDownload({
    fullExport = false
  }) {
    const currentUserData = Meteor.user();
    const userId = currentUserData._id;
    const lastOperation = RocketChat.models.ExportOperations.findLastOperationByUser(userId, fullExport);

    if (lastOperation) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      if (lastOperation.createdAt > yesterday) {
        return {
          requested: false,
          exportOperation: lastOperation
        };
      }
    }

    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder);
    }

    const subFolderName = fullExport ? 'full' : 'partial';
    const baseFolder = path.join(tempFolder, userId);

    if (!fs.existsSync(baseFolder)) {
      fs.mkdirSync(baseFolder);
    }

    const folderName = path.join(baseFolder, subFolderName);

    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }

    const assetsFolder = path.join(folderName, 'assets');

    if (!fs.existsSync(assetsFolder)) {
      fs.mkdirSync(assetsFolder);
    }

    const exportOperation = {
      userId: currentUserData._id,
      roomList: null,
      status: 'pending',
      exportPath: folderName,
      assetsPath: assetsFolder,
      fileList: [],
      generatedFile: null,
      fullExport
    };
    RocketChat.models.ExportOperations.create(exportOperation);
    return {
      requested: true,
      exportOperation
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"resetAvatar.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/resetAvatar.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  resetAvatar() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'resetAvatar'
      });
    }

    if (!RocketChat.settings.get('Accounts_AllowUserAvatarChange')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'resetAvatar'
      });
    }

    const user = Meteor.user();
    FileUpload.getStore('Avatars').deleteByName(user.username);
    RocketChat.models.Users.unsetAvatarOrigin(user._id);
    RocketChat.Notifications.notifyLogged('updateAvatar', {
      username: user.username
    });
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'resetAvatar',

  userId() {
    return true;
  }

}, 1, 60000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomNameExists.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/roomNameExists.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  roomNameExists(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'roomExists'
      });
    }

    const room = RocketChat.models.Rooms.findOneByName(rid);
    return !!room;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveUserPreferences.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/saveUserPreferences.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  saveUserPreferences(settings) {
    const keys = {
      language: Match.Optional(String),
      newRoomNotification: Match.Optional(String),
      newMessageNotification: Match.Optional(String),
      useEmojis: Match.Optional(Boolean),
      convertAsciiEmoji: Match.Optional(Boolean),
      saveMobileBandwidth: Match.Optional(Boolean),
      collapseMediaByDefault: Match.Optional(Boolean),
      autoImageLoad: Match.Optional(Boolean),
      emailNotificationMode: Match.Optional(String),
      unreadAlert: Match.Optional(Boolean),
      notificationsSoundVolume: Match.Optional(Number),
      desktopNotifications: Match.Optional(String),
      mobileNotifications: Match.Optional(String),
      enableAutoAway: Match.Optional(Boolean),
      highlights: Match.Optional([String]),
      desktopNotificationDuration: Match.Optional(Number),
      messageViewMode: Match.Optional(Number),
      hideUsernames: Match.Optional(Boolean),
      hideRoles: Match.Optional(Boolean),
      hideAvatars: Match.Optional(Boolean),
      hideFlexTab: Match.Optional(Boolean),
      sendOnEnter: Match.Optional(String),
      roomCounterSidebar: Match.Optional(Boolean),
      idleTimeLimit: Match.Optional(Number),
      sidebarShowFavorites: Match.Optional(Boolean),
      sidebarShowUnread: Match.Optional(Boolean),
      sidebarSortby: Match.Optional(String),
      sidebarViewMode: Match.Optional(String),
      sidebarHideAvatar: Match.Optional(Boolean),
      sidebarGroupByType: Match.Optional(Boolean),
      muteFocusedConversations: Match.Optional(Boolean)
    };
    check(settings, Match.ObjectIncluding(keys));
    const user = Meteor.user();

    if (!user) {
      return false;
    }

    const {
      desktopNotifications: oldDesktopNotifications,
      mobileNotifications: oldMobileNotifications,
      emailNotificationMode: oldEmailNotifications
    } = user.settings && user.settings.preferences || {};

    if (user.settings == null) {
      RocketChat.models.Users.clearSettings(user._id);
    }

    if (settings.language != null) {
      RocketChat.models.Users.setLanguage(user._id, settings.language);
    } // Keep compatibility with old values


    if (settings.emailNotificationMode === 'all') {
      settings.emailNotificationMode = 'mentions';
    } else if (settings.emailNotificationMode === 'disabled') {
      settings.emailNotificationMode = 'nothing';
    }

    if (settings.idleTimeLimit != null && settings.idleTimeLimit < 60) {
      throw new Meteor.Error('invalid-idle-time-limit-value', 'Invalid idleTimeLimit');
    }

    RocketChat.models.Users.setPreferences(user._id, settings); // propagate changed notification preferences

    Meteor.defer(() => {
      if (oldDesktopNotifications !== settings.desktopNotifications) {
        if (settings.desktopNotifications === 'default') {
          RocketChat.models.Subscriptions.clearDesktopNotificationUserPreferences(user._id);
        } else {
          RocketChat.models.Subscriptions.updateDesktopNotificationUserPreferences(user._id, settings.desktopNotifications);
        }
      }

      if (oldMobileNotifications !== settings.mobileNotifications) {
        if (settings.mobileNotifications === 'default') {
          RocketChat.models.Subscriptions.clearMobileNotificationUserPreferences(user._id);
        } else {
          RocketChat.models.Subscriptions.updateMobileNotificationUserPreferences(user._id, settings.mobileNotifications);
        }
      }

      if (oldEmailNotifications !== settings.emailNotificationMode) {
        if (settings.emailNotificationMode === 'default') {
          RocketChat.models.Subscriptions.clearEmailNotificationUserPreferences(user._id);
        } else {
          RocketChat.models.Subscriptions.updateEmailNotificationUserPreferences(user._id, settings.emailNotificationMode);
        }
      }

      if (Array.isArray(settings.highlights)) {
        RocketChat.models.Subscriptions.updateUserHighlights(user._id, settings.highlights);
      }
    });
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveUserProfile.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/saveUserProfile.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  saveUserProfile(settings, customFields) {
    check(settings, Object);
    check(customFields, Match.Maybe(Object));

    if (!RocketChat.settings.get('Accounts_AllowUserProfileChange')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'saveUserProfile'
      });
    }

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'saveUserProfile'
      });
    }

    const user = RocketChat.models.Users.findOneById(Meteor.userId());

    function checkPassword(user = {}, typedPassword) {
      if (!(user.services && user.services.password && user.services.password.bcrypt && user.services.password.bcrypt.trim())) {
        return true;
      }

      const passCheck = Accounts._checkPassword(user, {
        digest: typedPassword,
        algorithm: 'sha-256'
      });

      if (passCheck.error) {
        return false;
      }

      return true;
    }

    if (settings.realname) {
      if (!RocketChat.setRealName(Meteor.userId(), settings.realname)) {
        throw new Meteor.Error('error-could-not-change-name', 'Could not change name', {
          method: 'saveUserProfile'
        });
      }
    }

    if (settings.username) {
      Meteor.call('setUsername', settings.username);
    }

    if (settings.email) {
      if (!checkPassword(user, settings.typedPassword)) {
        throw new Meteor.Error('error-invalid-password', 'Invalid password', {
          method: 'saveUserProfile'
        });
      }

      Meteor.call('setEmail', settings.email);
    } // Should be the last check to prevent error when trying to check password for users without password


    if (settings.newPassword && RocketChat.settings.get('Accounts_AllowPasswordChange') === true) {
      if (!checkPassword(user, settings.typedPassword)) {
        throw new Meteor.Error('error-invalid-password', 'Invalid password', {
          method: 'saveUserProfile'
        });
      }

      RocketChat.passwordPolicy.validate(settings.newPassword);
      Accounts.setPassword(Meteor.userId(), settings.newPassword, {
        logout: false
      });
    }

    RocketChat.models.Users.setProfile(Meteor.userId(), {});

    if (customFields && Object.keys(customFields).length) {
      RocketChat.saveCustomFields(Meteor.userId(), customFields);
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendConfirmationEmail.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/sendConfirmationEmail.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  sendConfirmationEmail(email) {
    check(email, String);
    email = email.trim();
    const user = RocketChat.models.Users.findOneByEmailAddress(email);

    if (user) {
      if (RocketChat.settings.get('Verification_Customized')) {
        const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email_Subject') || '');
        const html = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email') || '');

        Accounts.emailTemplates.verifyEmail.subject = function ()
        /*userModel*/
        {
          return subject;
        };

        Accounts.emailTemplates.verifyEmail.html = function (userModel, url) {
          return html.replace(/\[Verification_Url]/g, url);
        };
      }

      try {
        Accounts.sendVerificationEmail(user._id, email);
      } catch (error) {
        throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${error.message}`, {
          method: 'registerUser',
          message: error.message
        });
      }

      return true;
    }

    return false;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendForgotPasswordEmail.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/sendForgotPasswordEmail.js                                                                           //
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
  sendForgotPasswordEmail(email) {
    check(email, String);
    email = email.trim();
    const user = RocketChat.models.Users.findOneByEmailAddress(email);

    if (user) {
      const regex = new RegExp(`^${s.escapeRegExp(email)}$`, 'i');
      email = (user.emails || []).map(item => item.address).find(userEmail => regex.test(userEmail));

      if (RocketChat.settings.get('Forgot_Password_Customized')) {
        const data = {
          name: user.name,
          email
        };
        const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Forgot_Password_Email_Subject') || '', data);
        const html = RocketChat.placeholders.replace(RocketChat.settings.get('Forgot_Password_Email') || '', data);
        Accounts.emailTemplates.from = `${RocketChat.settings.get('Site_Name')} <${RocketChat.settings.get('From_Email')}>`;

        Accounts.emailTemplates.resetPassword.subject = function ()
        /*userModel*/
        {
          return subject;
        };

        Accounts.emailTemplates.resetPassword.html = function (userModel, url) {
          return html.replace(/\[Forgot_Password_Url]/g, url);
        };
      }

      try {
        Accounts.sendResetPasswordEmail(user._id, email);
      } catch (error) {
        throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${error.message}`, {
          method: 'registerUser',
          message: error.message
        });
      }

      return true;
    }

    return false;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setAvatarFromService.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/setAvatarFromService.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  setAvatarFromService(dataURI, contentType, service) {
    check(dataURI, String);
    check(contentType, Match.Optional(String));
    check(service, Match.Optional(String));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setAvatarFromService'
      });
    }

    if (!RocketChat.settings.get('Accounts_AllowUserAvatarChange')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setAvatarFromService'
      });
    }

    const user = Meteor.user();
    return RocketChat.setUserAvatar(user, dataURI, contentType, service);
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'setAvatarFromService',

  userId() {
    return true;
  }

}, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setUserActiveStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/setUserActiveStatus.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  setUserActiveStatus(userId, active) {
    check(userId, String);
    check(active, Boolean);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setUserActiveStatus'
      });
    }

    if (RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-active-status') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setUserActiveStatus'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    if (user) {
      RocketChat.models.Users.setUserActive(userId, active);

      if (user.username) {
        RocketChat.models.Subscriptions.setArchivedByUsername(user.username, !active);
      }

      if (active === false) {
        RocketChat.models.Users.unsetLoginTokens(userId);
      } else {
        RocketChat.models.Users.unsetReason(userId);
      }

      const destinations = Array.isArray(user.emails) && user.emails.map(email => `${user.name || user.username}<${email.address}>`);

      if (destinations) {
        const email = {
          to: destinations,
          from: RocketChat.settings.get('From_Email'),
          subject: Accounts.emailTemplates.userActivated.subject({
            active
          }),
          html: Accounts.emailTemplates.userActivated.html({
            active,
            name: user.name,
            username: user.username
          })
        };
        Meteor.defer(() => Email.send(email));
      }

      return true;
    }

    return false;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setUserPassword.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/setUserPassword.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  setUserPassword(password) {
    check(password, String);
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setUserPassword'
      });
    }

    const user = RocketChat.models.Users.findOneById(userId);

    if (user && user.requirePasswordChange !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setUserPassword'
      });
    }

    RocketChat.passwordPolicy.validate(password);
    Accounts.setPassword(userId, password, {
      logout: false
    });
    return RocketChat.models.Users.unsetRequirePasswordChange(userId);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"toogleFavorite.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/toogleFavorite.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  toggleFavorite(rid, f) {
    check(rid, String);
    check(f, Match.Optional(Boolean));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'toggleFavorite'
      });
    }

    const userSubscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());

    if (!userSubscription) {
      throw new Meteor.Error('error-invalid-subscription', 'You must be part of a room to favorite it', {
        method: 'toggleFavorite'
      });
    }

    return RocketChat.models.Subscriptions.setFavoriteByRoomIdAndUserId(rid, Meteor.userId(), f);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unmuteUserInRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/unmuteUserInRoom.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  unmuteUserInRoom(data) {
    const fromId = Meteor.userId();
    check(data, Match.ObjectIncluding({
      rid: String,
      username: String
    }));

    if (!RocketChat.authz.hasPermission(fromId, 'mute-user', data.rid)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'unmuteUserInRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(data.rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'unmuteUserInRoom'
      });
    }

    if (['c', 'p'].includes(room.t) === false) {
      throw new Meteor.Error('error-invalid-room-type', `${room.t} is not a valid room type`, {
        method: 'unmuteUserInRoom',
        type: room.t
      });
    }

    if (Array.isArray(room.usernames) === false || room.usernames.includes(data.username) === false) {
      throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
        method: 'unmuteUserInRoom'
      });
    }

    const unmutedUser = RocketChat.models.Users.findOneByUsername(data.username);
    RocketChat.models.Rooms.unmuteUsernameByRoomId(data.rid, unmutedUser.username);
    const fromUser = RocketChat.models.Users.findOneById(fromId);
    RocketChat.models.Messages.createUserUnmutedWithRoomIdAndUser(data.rid, unmutedUser, {
      u: {
        _id: fromUser._id,
        username: fromUser.username
      }
    });
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userSetUtcOffset.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/userSetUtcOffset.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  userSetUtcOffset(utcOffset) {
    check(utcOffset, Number);

    if (this.userId == null) {
      return;
    }

    this.unblock();
    return RocketChat.models.Users.setUtcOffset(this.userId, utcOffset);
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'userSetUtcOffset',

  userId() {
    return true;
  }

}, 1, 60000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"activeUsers.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/activeUsers.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('activeUsers', function () {
  if (!this.userId) {
    return this.ready();
  }

  return RocketChat.models.Users.findUsersNotOffline({
    fields: {
      username: 1,
      name: 1,
      status: 1,
      utcOffset: 1
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelAndPrivateAutocomplete.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/channelAndPrivateAutocomplete.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('channelAndPrivateAutocomplete', function (selector) {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'view-other-user-channels') !== true) {
    return this.ready();
  }

  const pub = this;
  const options = {
    fields: {
      _id: 1,
      name: 1
    },
    limit: 10,
    sort: {
      name: 1
    }
  };
  const cursorHandle = RocketChat.models.Rooms.findByNameStartingAndTypes(selector.name, ['c', 'p'], options).observeChanges({
    added(_id, record) {
      return pub.added('autocompleteRecords', _id, record);
    },

    changed(_id, record) {
      return pub.changed('autocompleteRecords', _id, record);
    },

    removed(_id, record) {
      return pub.removed('autocompleteRecords', _id, record);
    }

  });
  this.ready();
  this.onStop(function () {
    return cursorHandle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fullUserData.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/fullUserData.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('fullUserData', function (filter, limit) {
  if (!this.userId) {
    return this.ready();
  }

  const result = RocketChat.getFullUserData({
    userId: this.userId,
    filter,
    limit
  });

  if (!result) {
    return this.ready();
  }

  return result;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/messages.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.publish('messages', function (rid
/*, start*/
) {
  if (!this.userId) {
    return this.ready();
  }

  const publication = this;

  if (typeof rid !== 'string') {
    return this.ready();
  }

  if (!Meteor.call('canAccessRoom', rid, this.userId)) {
    return this.ready();
  }

  const cursor = RocketChat.models.Messages.findVisibleByRoomId(rid, {
    sort: {
      ts: -1
    },
    limit: 50
  });
  const cursorHandle = cursor.observeChanges({
    added(_id, record) {
      record.starred = _.findWhere(record.starred, {
        _id: publication.userId
      });
      return publication.added('rocketchat_message', _id, record);
    },

    changed(_id, record) {
      record.starred = _.findWhere(record.starred, {
        _id: publication.userId
      });
      return publication.changed('rocketchat_message', _id, record);
    }

  });
  const cursorDelete = RocketChat.models.Messages.findInvisibleByRoomId(rid, {
    fields: {
      _id: 1
    }
  });
  const cursorDeleteHandle = cursorDelete.observeChanges({
    added(_id
    /*, record*/
    ) {
      return publication.added('rocketchat_message', _id, {
        _hidden: true
      });
    },

    changed(_id
    /*, record*/
    ) {
      return publication.added('rocketchat_message', _id, {
        _hidden: true
      });
    }

  });
  this.ready();
  return this.onStop(function () {
    cursorHandle.stop();
    return cursorDeleteHandle.stop();
  });
});
Meteor.methods({
  'messages/get'(rid, {
    lastUpdate,
    latestDate = new Date(),
    oldestDate,
    inclusive = false,
    count = 20,
    unreads = false
  }) {
    check(rid, String);
    const fromId = Meteor.userId();

    if (!fromId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'messages/get'
      });
    }

    if (!Meteor.call('canAccessRoom', rid, fromId)) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'messages/get'
      });
    }

    const options = {
      sort: {
        ts: -1
      }
    };

    if (lastUpdate instanceof Date) {
      return {
        updated: RocketChat.models.Messages.findForUpdates(rid, lastUpdate, options).fetch(),
        deleted: RocketChat.models.Messages.trashFindDeletedAfter(lastUpdate, {
          rid
        }, (0, _objectSpread2.default)({}, options, {
          fields: {
            _id: 1,
            _deletedAt: 1
          }
        })).fetch()
      };
    }

    return Meteor.call('getChannelHistory', {
      rid,
      latest: latestDate,
      oldest: oldestDate,
      inclusive,
      count,
      unreads
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"room.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/room.js                                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const fields = {
  _id: 1,
  name: 1,
  fname: 1,
  t: 1,
  cl: 1,
  u: 1,
  // usernames: 1,
  topic: 1,
  announcement: 1,
  announcementDetails: 1,
  muted: 1,
  _updatedAt: 1,
  archived: 1,
  jitsiTimeout: 1,
  description: 1,
  default: 1,
  customFields: 1,
  lastMessage: 1,
  // @TODO create an API to register this fields based on room type
  livechatData: 1,
  tags: 1,
  sms: 1,
  facebook: 1,
  code: 1,
  joinCodeRequired: 1,
  open: 1,
  v: 1,
  label: 1,
  ro: 1,
  reactWhenReadOnly: 1,
  sysMes: 1,
  sentiment: 1,
  tokenpass: 1,
  streamingOptions: 1,
  broadcast: 1
};

const roomMap = record => {
  if (record._room) {
    return _.pick(record._room, ...Object.keys(fields));
  }

  console.log('Empty Room for Subscription', record);
  return {};
};

Meteor.methods({
  'rooms/get'(updatedAt) {
    let options = {
      fields
    };

    if (!Meteor.userId()) {
      if (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
        return RocketChat.models.Rooms.findByDefaultAndTypes(true, ['c'], options).fetch();
      }

      return [];
    }

    this.unblock();
    options = {
      fields
    };

    if (updatedAt instanceof Date) {
      return {
        update: RocketChat.models.Rooms.findBySubscriptionUserIdUpdatedAfter(Meteor.userId(), updatedAt, options).fetch(),
        remove: RocketChat.models.Rooms.trashFindDeletedAfter(updatedAt, {}, {
          fields: {
            _id: 1,
            _deletedAt: 1
          }
        }).fetch()
      };
    }

    return RocketChat.models.Rooms.findBySubscriptionUserId(Meteor.userId(), options).fetch();
  },

  getRoomByTypeAndName(type, name) {
    if (!Meteor.userId() && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getRoomByTypeAndName'
      });
    }

    const roomFind = RocketChat.roomTypes.getRoomFind(type);
    let room;

    if (roomFind) {
      room = roomFind.call(this, name);
    } else {
      room = RocketChat.models.Rooms.findByTypeAndName(type, name).fetch();
    }

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'getRoomByTypeAndName'
      });
    }

    if (!Meteor.call('canAccessRoom', room._id, Meteor.userId())) {
      throw new Meteor.Error('error-no-permission', 'No permission', {
        method: 'getRoomByTypeAndName'
      });
    }

    if (RocketChat.settings.get('Store_Last_Message') && !RocketChat.authz.hasPermission(Meteor.userId(), 'preview-c-room')) {
      delete room.lastMessage;
    }

    return roomMap({
      _room: room
    });
  }

});
RocketChat.models.Rooms.cache.on('sync', (type, room
/*, diff*/
) => {
  const records = RocketChat.models.Subscriptions.findByRoomId(room._id).fetch();

  const _room = roomMap({
    _room: room
  });

  for (const record of records) {
    RocketChat.Notifications.notifyUserInThisInstance(record.u._id, 'rooms-changed', type, _room);
  }
});
RocketChat.models.Subscriptions.on('changed', (type, subscription
/*, diff*/
) => {
  if (type === 'inserted' || type === 'removed') {
    const room = RocketChat.models.Rooms.findOneById(subscription.rid);

    if (room) {
      RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'rooms-changed', type, roomMap({
        _room: room
      }));
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomFiles.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/roomFiles.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

Meteor.publish('roomFiles', function (rid, limit = 50) {
  if (!this.userId) {
    return this.ready();
  }

  const pub = this;
  const cursorFileListHandle = RocketChat.models.Uploads.findNotHiddenFilesOfRoom(rid, limit).observeChanges({
    added(_id, record) {
      const {
        username,
        name
      } = record.userId ? RocketChat.models.Users.findOneById(record.userId) : {};
      return pub.added('room_files', _id, (0, _objectSpread2.default)({}, record, {
        user: {
          username,
          name
        }
      }));
    },

    changed(_id, record) {
      const {
        username,
        name
      } = record.userId ? RocketChat.models.Users.findOneById(record.userId) : {};
      return pub.changed('room_files', _id, (0, _objectSpread2.default)({}, record, {
        user: {
          username,
          name
        }
      }));
    },

    removed(_id, record) {
      return pub.removed('room_files', _id, record);
    }

  });
  this.ready();
  return this.onStop(function () {
    return cursorFileListHandle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomSubscriptionsByRole.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/roomSubscriptionsByRole.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('roomSubscriptionsByRole', function (rid, role) {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'view-other-user-channels') !== true) {
    return this.ready();
  }

  return RocketChat.models.Subscriptions.findByRoomIdAndRoles(rid, role, {
    fields: {
      rid: 1,
      name: 1,
      roles: 1,
      u: 1
    },
    sort: {
      name: 1
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"spotlight.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/spotlight.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

function fetchRooms(userId, rooms) {
  if (!RocketChat.settings.get('Store_Last_Message') || RocketChat.authz.hasPermission(userId, 'preview-c-room')) {
    return rooms;
  }

  return rooms.map(room => {
    delete room.lastMessage;
    return room;
  });
}

Meteor.methods({
  spotlight(text, usernames, type = {
    users: true,
    rooms: true
  }, rid) {
    const searchForChannels = text[0] === '#';
    const searchForDMs = text[0] === '@';

    if (searchForChannels) {
      type.users = false;
      text = text.slice(1);
    }

    if (searchForDMs) {
      type.rooms = false;
      text = text.slice(1);
    }

    const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');
    const result = {
      users: [],
      rooms: []
    };
    const roomOptions = {
      limit: 5,
      fields: {
        t: 1,
        name: 1,
        lastMessage: 1
      },
      sort: {
        name: 1
      }
    };
    const userId = this.userId;

    if (userId == null) {
      if (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
        result.rooms = fetchRooms(userId, RocketChat.models.Rooms.findByNameAndTypeNotDefault(regex, 'c', roomOptions).fetch());
      }

      return result;
    }

    const userOptions = {
      limit: 5,
      fields: {
        username: 1,
        name: 1,
        status: 1
      },
      sort: {}
    };

    if (RocketChat.settings.get('UI_Use_Real_Name')) {
      userOptions.sort.name = 1;
    } else {
      userOptions.sort.username = 1;
    }

    if (RocketChat.authz.hasPermission(userId, 'view-outside-room')) {
      if (type.users === true && RocketChat.authz.hasPermission(userId, 'view-d-room')) {
        result.users = RocketChat.models.Users.findByActiveUsersExcept(text, usernames, userOptions).fetch();
      }

      if (type.rooms === true && RocketChat.authz.hasPermission(userId, 'view-c-room')) {
        const username = RocketChat.models.Users.findOneById(userId, {
          username: 1
        }).username;
        const searchableRoomTypes = Object.entries(RocketChat.roomTypes.roomTypes).filter(roomType => roomType[1].includeInRoomSearch()).map(roomType => roomType[0]);
        result.rooms = fetchRooms(userId, RocketChat.models.Rooms.findByNameAndTypesNotContainingUsername(regex, searchableRoomTypes, username, roomOptions).fetch());
      }
    } else if (type.users === true && rid) {
      const subscriptions = RocketChat.models.Subscriptions.find({
        rid,
        'u.username': {
          $regex: regex,
          $nin: [...usernames, Meteor.user().username]
        }
      }, {
        limit: userOptions.limit
      }).fetch().map(({
        u
      }) => u._id);
      result.users = RocketChat.models.Users.find({
        _id: {
          $in: subscriptions
        }
      }, {
        fields: userOptions.fields,
        sort: userOptions.sort
      }).fetch();
    }

    return result;
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'spotlight',

  userId()
  /*userId*/
  {
    return true;
  }

}, 100, 100000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"subscription.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/subscription.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const fields = {
  t: 1,
  ts: 1,
  ls: 1,
  name: 1,
  fname: 1,
  rid: 1,
  code: 1,
  f: 1,
  u: 1,
  open: 1,
  alert: 1,
  roles: 1,
  unread: 1,
  userMentions: 1,
  groupMentions: 1,
  archived: 1,
  audioNotifications: 1,
  audioNotificationValue: 1,
  desktopNotifications: 1,
  desktopNotificationDuration: 1,
  mobilePushNotifications: 1,
  emailNotifications: 1,
  unreadAlert: 1,
  _updatedAt: 1,
  blocked: 1,
  blocker: 1,
  autoTranslate: 1,
  autoTranslateLanguage: 1,
  disableNotifications: 1,
  hideUnreadStatus: 1,
  muteGroupMentions: 1,
  ignored: 1
};
Meteor.methods({
  'subscriptions/get'(updatedAt) {
    if (!Meteor.userId()) {
      return [];
    }

    this.unblock();
    const options = {
      fields
    };
    const records = RocketChat.models.Subscriptions.findByUserId(Meteor.userId(), options).fetch();

    if (updatedAt instanceof Date) {
      return {
        update: records.filter(function (record) {
          return record._updatedAt > updatedAt;
        }),
        remove: RocketChat.models.Subscriptions.trashFindDeletedAfter(updatedAt, {
          'u._id': Meteor.userId()
        }, {
          fields: {
            _id: 1,
            _deletedAt: 1
          }
        }).fetch()
      };
    }

    return records;
  }

});
RocketChat.models.Subscriptions.on('changed', function (type, subscription) {
  RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', type, RocketChat.models.Subscriptions.processQueryOptionsOnResult(subscription, {
    fields
  }));
}); // TODO needs improvement
// We are sending the record again cuz any update on subscription will send the record without the fname (join)
// Then we need to sent it again listening to the join event.

RocketChat.models.Subscriptions.on('join:fname:inserted', function (subscription
/*, user*/
) {
  RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', 'changed', RocketChat.models.Subscriptions.processQueryOptionsOnResult(subscription, {
    fields
  }));
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userAutocomplete.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/userAutocomplete.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.publish('userAutocomplete', function (selector) {
  if (!this.userId) {
    return this.ready();
  }

  if (!_.isObject(selector)) {
    return this.ready();
  }

  const options = {
    fields: {
      name: 1,
      username: 1,
      status: 1
    },
    sort: {
      username: 1
    },
    limit: 10
  };
  const pub = this;
  const exceptions = selector.exceptions || [];
  const cursorHandle = RocketChat.models.Users.findActiveByUsernameOrNameRegexWithExceptions(selector.term, exceptions, options).observeChanges({
    added(_id, record) {
      return pub.added('autocompleteRecords', _id, record);
    },

    changed(_id, record) {
      return pub.changed('autocompleteRecords', _id, record);
    },

    removed(_id, record) {
      return pub.removed('autocompleteRecords', _id, record);
    }

  });
  this.ready();
  this.onStop(function () {
    return cursorHandle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userChannels.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/userChannels.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('userChannels', function (userId) {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'view-other-user-channels') !== true) {
    return this.ready();
  }

  return RocketChat.models.Subscriptions.findByUserId(userId, {
    fields: {
      rid: 1,
      name: 1,
      t: 1,
      u: 1
    },
    sort: {
      t: 1,
      name: 1
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userData.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications/userData.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('userData', function () {
  if (!this.userId) {
    return this.ready();
  }

  return RocketChat.models.Users.find(this.userId, {
    fields: {
      name: 1,
      username: 1,
      status: 1,
      statusDefault: 1,
      statusConnection: 1,
      avatarOrigin: 1,
      utcOffset: 1,
      language: 1,
      settings: 1,
      enableAutoAway: 1,
      idleTimeLimit: 1,
      roles: 1,
      active: 1,
      defaultRoom: 1,
      customFields: 1,
      'services.github': 1,
      'services.gitlab': 1,
      'services.tokenpass': 1,
      requirePasswordChange: 1,
      requirePasswordChangeReason: 1,
      'services.password.bcrypt': 1,
      'services.totp.enabled': 1,
      statusLivechat: 1,
      banners: 1
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"stream":{"messages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/stream/messages.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const msgStream = new Meteor.Streamer('room-messages');
this.msgStream = msgStream;
msgStream.allowWrite('none');
msgStream.allowRead(function (eventName, args) {
  try {
    const room = Meteor.call('canAccessRoom', eventName, this.userId, args);

    if (!room) {
      return false;
    }

    if (room.t === 'c' && !RocketChat.authz.hasPermission(this.userId, 'preview-c-room') && room.usernames.indexOf(room.username) === -1) {
      return false;
    }

    return true;
  } catch (error) {
    /*error*/
    return false;
  }
});
msgStream.allowRead('__my_messages__', 'all');
msgStream.allowEmit('__my_messages__', function (eventName, msg, options) {
  try {
    const room = Meteor.call('canAccessRoom', msg.rid, this.userId);

    if (!room) {
      return false;
    }

    options.roomParticipant = room.usernames.indexOf(room.username) > -1;
    options.roomType = room.t;
    return true;
  } catch (error) {
    /*error*/
    return false;
  }
});
Meteor.startup(function () {
  function publishMessage(type, record) {
    if (record._hidden !== true && record.imported == null) {
      const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;

      if (record.u && record.u._id && UI_Use_Real_Name) {
        const user = RocketChat.models.Users.findOneById(record.u._id);
        record.u.name = user && user.name;
      }

      if (record.mentions && record.mentions.length && UI_Use_Real_Name) {
        record.mentions.forEach(mention => {
          const user = RocketChat.models.Users.findOneById(mention._id);
          mention.name = user && user.name;
        });
      }

      msgStream.emitWithoutBroadcast('__my_messages__', record, {});
      return msgStream.emitWithoutBroadcast(record.rid, record);
    }
  }

  return RocketChat.models.Messages._db.on('change', function ({
    action,
    id,
    data
    /*, oplog*/

  }) {
    switch (action) {
      case 'insert':
        data._id = id;
        publishMessage('inserted', data);
        break;

      case 'update:record':
        publishMessage('updated', data);
        break;

      case 'update:diff':
        publishMessage('updated', RocketChat.models.Messages.findOne({
          _id: id
        }));
        break;
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"streamBroadcast.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/stream/streamBroadcast.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let DDPCommon;
module.watch(require("meteor/ddp-common"), {
  DDPCommon(v) {
    DDPCommon = v;
  }

}, 1);
process.env.PORT = String(process.env.PORT).trim();
process.env.INSTANCE_IP = String(process.env.INSTANCE_IP).trim();
const connections = {};
this.connections = connections;
const logger = new Logger('StreamBroadcast', {
  sections: {
    connection: 'Connection',
    auth: 'Auth',
    stream: 'Stream'
  }
});

function _authorizeConnection(instance) {
  logger.auth.info(`Authorizing with ${instance}`);
  return connections[instance].call('broadcastAuth', InstanceStatus.id(), connections[instance].instanceId, function (err, ok) {
    if (err != null) {
      return logger.auth.error(`broadcastAuth error ${instance} ${InstanceStatus.id()} ${connections[instance].instanceId}`, err);
    }

    connections[instance].broadcastAuth = ok;
    return logger.auth.info(`broadcastAuth with ${instance}`, ok);
  });
}

function authorizeConnection(instance) {
  const query = {
    _id: InstanceStatus.id()
  };

  if (!InstanceStatus.getCollection().findOne(query)) {
    return Meteor.setTimeout(function () {
      return authorizeConnection(instance);
    }, 500);
  }

  return _authorizeConnection(instance);
}

function startMatrixBroadcast() {
  const query = {
    'extraInformation.port': {
      $exists: true
    }
  };
  const options = {
    sort: {
      _createdAt: -1
    }
  };
  return InstanceStatus.getCollection().find(query, options).observe({
    added(record) {
      let instance = `${record.extraInformation.host}:${record.extraInformation.port}`;

      if (record.extraInformation.port === process.env.PORT && record.extraInformation.host === process.env.INSTANCE_IP) {
        logger.auth.info('prevent self connect', instance);
        return;
      }

      if (record.extraInformation.host === process.env.INSTANCE_IP && RocketChat.isDocker() === false) {
        instance = `localhost:${record.extraInformation.port}`;
      }

      if (connections[instance] && connections[instance].instanceRecord) {
        if (connections[instance].instanceRecord._createdAt < record._createdAt) {
          connections[instance].disconnect();
          delete connections[instance];
        } else {
          return;
        }
      }

      logger.connection.info('connecting in', instance);
      connections[instance] = DDP.connect(instance, {
        _dontPrintErrors: LoggerManager.logLevel < 2
      });
      connections[instance].instanceRecord = record;
      connections[instance].instanceId = record._id;
      return connections[instance].onReconnect = function () {
        return authorizeConnection(instance);
      };
    },

    removed(record) {
      let instance = `${record.extraInformation.host}:${record.extraInformation.port}`;

      if (record.extraInformation.host === process.env.INSTANCE_IP && RocketChat.isDocker() === false) {
        instance = `localhost:${record.extraInformation.port}`;
      }

      const query = {
        'extraInformation.host': record.extraInformation.host,
        'extraInformation.port': record.extraInformation.port
      };

      if (connections[instance] && !InstanceStatus.getCollection().findOne(query)) {
        logger.connection.info('disconnecting from', instance);
        connections[instance].disconnect();
        return delete connections[instance];
      }
    }

  });
}

Meteor.methods({
  broadcastAuth(remoteId, selfId) {
    check(selfId, String);
    check(remoteId, String);
    this.unblock();
    const query = {
      _id: remoteId
    };

    if (selfId === InstanceStatus.id() && remoteId !== InstanceStatus.id() && InstanceStatus.getCollection().findOne(query)) {
      this.connection.broadcastAuth = true;
    }

    return this.connection.broadcastAuth === true;
  },

  stream(streamName, eventName, args) {
    if (!this.connection) {
      return 'self-not-authorized';
    }

    if (this.connection.broadcastAuth !== true) {
      return 'not-authorized';
    }

    const instance = Meteor.StreamerCentral.instances[streamName];

    if (!instance) {
      return 'stream-not-exists';
    }

    if (instance.serverOnly) {
      const scope = {};
      instance.emitWithScope(eventName, scope, ...args);
    } else {
      Meteor.StreamerCentral.instances[streamName]._emit(eventName, args);
    }
  }

});

function startStreamCastBroadcast(value) {
  const instance = 'StreamCast';
  logger.connection.info('connecting in', instance, value);
  const connection = DDP.connect(value, {
    _dontPrintErrors: LoggerManager.logLevel < 2
  });
  connections[instance] = connection;
  connection.instanceId = instance;

  connection.onReconnect = function () {
    return authorizeConnection(instance);
  };

  connection._stream.on('message', function (raw_msg) {
    const msg = DDPCommon.parseDDP(raw_msg);

    if (!msg || msg.msg !== 'changed' || !msg.collection || !msg.fields) {
      return;
    }

    const {
      streamName,
      eventName,
      args
    } = msg.fields;

    if (!streamName || !eventName || !args) {
      return;
    }

    if (connection.broadcastAuth !== true) {
      return 'not-authorized';
    }

    if (!Meteor.StreamerCentral.instances[streamName]) {
      return 'stream-not-exists';
    }

    return Meteor.StreamerCentral.instances[streamName]._emit(eventName, args);
  });

  return connection.subscribe('stream');
}

function startStreamBroadcast() {
  if (!process.env.INSTANCE_IP) {
    process.env.INSTANCE_IP = 'localhost';
  }

  logger.info('startStreamBroadcast');
  RocketChat.settings.get('Stream_Cast_Address', function (key, value) {
    // var connection, fn, instance;
    const fn = function (instance, connection) {
      connection.disconnect();
      return delete connections[instance];
    };

    for (const instance of Object.keys(connections)) {
      const connection = connections[instance];
      fn(instance, connection);
    }

    if (value && value.trim() !== '') {
      return startStreamCastBroadcast(value);
    } else {
      return startMatrixBroadcast();
    }
  });

  function broadcast(streamName, eventName, args
  /*, userId*/
  ) {
    const fromInstance = `${process.env.INSTANCE_IP}:${process.env.PORT}`;
    const results = [];

    for (const instance of Object.keys(connections)) {
      const connection = connections[instance];

      if (connection.status().connected === true) {
        connection.call('stream', streamName, eventName, args, function (error, response) {
          if (error) {
            logger.error('Stream broadcast error', error);
          }

          switch (response) {
            case 'self-not-authorized':
              logger.stream.error(`Stream broadcast from '${fromInstance}' to '${connection._stream.endpoint}' with name ${streamName} to self is not authorized`.red);
              logger.stream.debug('    -> connection authorized'.red, connection.broadcastAuth);
              logger.stream.debug('    -> connection status'.red, connection.status());
              return logger.stream.debug('    -> arguments'.red, eventName, args);

            case 'not-authorized':
              logger.stream.error(`Stream broadcast from '${fromInstance}' to '${connection._stream.endpoint}' with name ${streamName} not authorized`.red);
              logger.stream.debug('    -> connection authorized'.red, connection.broadcastAuth);
              logger.stream.debug('    -> connection status'.red, connection.status());
              logger.stream.debug('    -> arguments'.red, eventName, args);
              return authorizeConnection(instance);

            case 'stream-not-exists':
              logger.stream.error(`Stream broadcast from '${fromInstance}' to '${connection._stream.endpoint}' with name ${streamName} does not exist`.red);
              logger.stream.debug('    -> connection authorized'.red, connection.broadcastAuth);
              logger.stream.debug('    -> connection status'.red, connection.status());
              return logger.stream.debug('    -> arguments'.red, eventName, args);
          }
        });
      }
    }

    return results;
  }

  return Meteor.StreamerCentral.on('broadcast', function (streamName, eventName, args) {
    return broadcast(streamName, eventName, args);
  });
}

Meteor.startup(function () {
  return startStreamBroadcast();
});
Meteor.methods({
  'instances/get'() {
    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'view-statistics')) {
      throw new Meteor.Error('error-action-not-allowed', 'List instances is not allowed', {
        method: 'instances/get'
      });
    }

    return Object.keys(connections).map(address => {
      const conn = connections[address];
      return Object.assign({
        address,
        currentStatus: conn._stream.currentStatus
      }, _.pick(conn, 'instanceRecord', 'broadcastAuth'));
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/main.js                                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("/imports/startup/server"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lib":{"RegExp.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/RegExp.js                                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RegExp.escape = function (s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"francocatena_fix.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/francocatena_fix.js                                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
this.i18n_status_func = function (key, options) {
  return TAPi18n.__(key, options);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json",
    ".info"
  ]
});
require("/server/lib/cordova/facebook-login.js");
require("/server/lib/accounts.js");
require("/server/lib/cordova.js");
require("/lib/RegExp.js");
require("/lib/francocatena_fix.js");
require("/server/startup/migrations/v001.js");
require("/server/startup/migrations/v002.js");
require("/server/startup/migrations/v003.js");
require("/server/startup/migrations/v004.js");
require("/server/startup/migrations/v005.js");
require("/server/startup/migrations/v006.js");
require("/server/startup/migrations/v007.js");
require("/server/startup/migrations/v008.js");
require("/server/startup/migrations/v009.js");
require("/server/startup/migrations/v010.js");
require("/server/startup/migrations/v011.js");
require("/server/startup/migrations/v012.js");
require("/server/startup/migrations/v013.js");
require("/server/startup/migrations/v014.js");
require("/server/startup/migrations/v015.js");
require("/server/startup/migrations/v016.js");
require("/server/startup/migrations/v017.js");
require("/server/startup/migrations/v018.js");
require("/server/startup/migrations/v019.js");
require("/server/startup/migrations/v020.js");
require("/server/startup/migrations/v021.js");
require("/server/startup/migrations/v022.js");
require("/server/startup/migrations/v023.js");
require("/server/startup/migrations/v024.js");
require("/server/startup/migrations/v025.js");
require("/server/startup/migrations/v026.js");
require("/server/startup/migrations/v027.js");
require("/server/startup/migrations/v028.js");
require("/server/startup/migrations/v029.js");
require("/server/startup/migrations/v030.js");
require("/server/startup/migrations/v031.js");
require("/server/startup/migrations/v032.js");
require("/server/startup/migrations/v033.js");
require("/server/startup/migrations/v034.js");
require("/server/startup/migrations/v035.js");
require("/server/startup/migrations/v036.js");
require("/server/startup/migrations/v037.js");
require("/server/startup/migrations/v038.js");
require("/server/startup/migrations/v039.js");
require("/server/startup/migrations/v040.js");
require("/server/startup/migrations/v041.js");
require("/server/startup/migrations/v042.js");
require("/server/startup/migrations/v043.js");
require("/server/startup/migrations/v044.js");
require("/server/startup/migrations/v045.js");
require("/server/startup/migrations/v046.js");
require("/server/startup/migrations/v047.js");
require("/server/startup/migrations/v048.js");
require("/server/startup/migrations/v049.js");
require("/server/startup/migrations/v050.js");
require("/server/startup/migrations/v051.js");
require("/server/startup/migrations/v052.js");
require("/server/startup/migrations/v053.js");
require("/server/startup/migrations/v054.js");
require("/server/startup/migrations/v055.js");
require("/server/startup/migrations/v056.js");
require("/server/startup/migrations/v057.js");
require("/server/startup/migrations/v058.js");
require("/server/startup/migrations/v059.js");
require("/server/startup/migrations/v060.js");
require("/server/startup/migrations/v061.js");
require("/server/startup/migrations/v062.js");
require("/server/startup/migrations/v063.js");
require("/server/startup/migrations/v064.js");
require("/server/startup/migrations/v065.js");
require("/server/startup/migrations/v066.js");
require("/server/startup/migrations/v067.js");
require("/server/startup/migrations/v068.js");
require("/server/startup/migrations/v069.js");
require("/server/startup/migrations/v070.js");
require("/server/startup/migrations/v071.js");
require("/server/startup/migrations/v072.js");
require("/server/startup/migrations/v073.js");
require("/server/startup/migrations/v074.js");
require("/server/startup/migrations/v075.js");
require("/server/startup/migrations/v076.js");
require("/server/startup/migrations/v077.js");
require("/server/startup/migrations/v078.js");
require("/server/startup/migrations/v079.js");
require("/server/startup/migrations/v080.js");
require("/server/startup/migrations/v081.js");
require("/server/startup/migrations/v082.js");
require("/server/startup/migrations/v083.js");
require("/server/startup/migrations/v084.js");
require("/server/startup/migrations/v085.js");
require("/server/startup/migrations/v086.js");
require("/server/startup/migrations/v087.js");
require("/server/startup/migrations/v088.js");
require("/server/startup/migrations/v089.js");
require("/server/startup/migrations/v090.js");
require("/server/startup/migrations/v091.js");
require("/server/startup/migrations/v092.js");
require("/server/startup/migrations/v093.js");
require("/server/startup/migrations/v094.js");
require("/server/startup/migrations/v095.js");
require("/server/startup/migrations/v096.js");
require("/server/startup/migrations/v097.js");
require("/server/startup/migrations/v098.js");
require("/server/startup/migrations/v099.js");
require("/server/startup/migrations/v100.js");
require("/server/startup/migrations/v101.js");
require("/server/startup/migrations/v102.js");
require("/server/startup/migrations/v103.js");
require("/server/startup/migrations/v104.js");
require("/server/startup/migrations/v105.js");
require("/server/startup/migrations/v106.js");
require("/server/startup/migrations/v107.js");
require("/server/startup/migrations/v108.js");
require("/server/startup/migrations/v109.js");
require("/server/startup/migrations/v110.js");
require("/server/startup/migrations/v111.js");
require("/server/startup/migrations/v112.js");
require("/server/startup/migrations/v113.js");
require("/server/startup/migrations/v114.js");
require("/server/startup/migrations/v115.js");
require("/server/startup/migrations/v116.js");
require("/server/startup/migrations/v117.js");
require("/server/startup/migrations/v118.js");
require("/server/startup/migrations/v119.js");
require("/server/startup/migrations/v120.js");
require("/server/startup/migrations/v121.js");
require("/server/startup/migrations/v122.js");
require("/server/startup/migrations/v123.js");
require("/server/startup/migrations/v124.js");
require("/server/startup/migrations/v125.js");
require("/server/startup/migrations/v126.js");
require("/server/startup/migrations/v127.js");
require("/server/startup/migrations/v128.js");
require("/server/startup/migrations/xrun.js");
require("/server/configuration/accounts_meld.js");
require("/server/configuration/grant.js");
require("/server/methods/OEmbedCacheCleanup.js");
require("/server/methods/addAllUserToRoom.js");
require("/server/methods/addRoomLeader.js");
require("/server/methods/addRoomModerator.js");
require("/server/methods/addRoomOwner.js");
require("/server/methods/afterVerifyEmail.js");
require("/server/methods/browseChannels.js");
require("/server/methods/canAccessRoom.js");
require("/server/methods/channelsList.js");
require("/server/methods/createDirectMessage.js");
require("/server/methods/deleteFileMessage.js");
require("/server/methods/deleteUser.js");
require("/server/methods/eraseRoom.js");
require("/server/methods/getAvatarSuggestion.js");
require("/server/methods/getRoomIdByNameOrId.js");
require("/server/methods/getRoomNameById.js");
require("/server/methods/getTotalChannels.js");
require("/server/methods/getUsernameSuggestion.js");
require("/server/methods/getUsersOfRoom.js");
require("/server/methods/groupsList.js");
require("/server/methods/hideRoom.js");
require("/server/methods/ignoreUser.js");
require("/server/methods/loadHistory.js");
require("/server/methods/loadLocale.js");
require("/server/methods/loadMissedMessages.js");
require("/server/methods/loadNextMessages.js");
require("/server/methods/loadSurroundingMessages.js");
require("/server/methods/logoutCleanUp.js");
require("/server/methods/messageSearch.js");
require("/server/methods/migrate.js");
require("/server/methods/muteUserInRoom.js");
require("/server/methods/openRoom.js");
require("/server/methods/readMessages.js");
require("/server/methods/registerUser.js");
require("/server/methods/removeRoomLeader.js");
require("/server/methods/removeRoomModerator.js");
require("/server/methods/removeRoomOwner.js");
require("/server/methods/removeUserFromRoom.js");
require("/server/methods/reportMessage.js");
require("/server/methods/requestDataDownload.js");
require("/server/methods/resetAvatar.js");
require("/server/methods/roomNameExists.js");
require("/server/methods/saveUserPreferences.js");
require("/server/methods/saveUserProfile.js");
require("/server/methods/sendConfirmationEmail.js");
require("/server/methods/sendForgotPasswordEmail.js");
require("/server/methods/setAvatarFromService.js");
require("/server/methods/setUserActiveStatus.js");
require("/server/methods/setUserPassword.js");
require("/server/methods/toogleFavorite.js");
require("/server/methods/unmuteUserInRoom.js");
require("/server/methods/userSetUtcOffset.js");
require("/server/publications/activeUsers.js");
require("/server/publications/channelAndPrivateAutocomplete.js");
require("/server/publications/fullUserData.js");
require("/server/publications/messages.js");
require("/server/publications/room.js");
require("/server/publications/roomFiles.js");
require("/server/publications/roomSubscriptionsByRole.js");
require("/server/publications/spotlight.js");
require("/server/publications/subscription.js");
require("/server/publications/userAutocomplete.js");
require("/server/publications/userChannels.js");
require("/server/publications/userData.js");
require("/server/startup/appcache.js");
require("/server/startup/avatar.js");
require("/server/startup/cron.js");
require("/server/startup/i18n-validation.js");
require("/server/startup/initialData.js");
require("/server/startup/presence.js");
require("/server/startup/roomPublishes.js");
require("/server/startup/serverRunning.js");
require("/server/stream/messages.js");
require("/server/stream/streamBroadcast.js");
require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js