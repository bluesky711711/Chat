(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var logger;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:cas":{"server":{"cas_rocketchat.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_cas/server/cas_rocketchat.js                                                        //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/* globals logger:true */
logger = new Logger('CAS', {});
Meteor.startup(function () {
  RocketChat.settings.addGroup('CAS', function () {
    this.add('CAS_enabled', false, {
      type: 'boolean',
      group: 'CAS',
      public: true
    });
    this.add('CAS_base_url', '', {
      type: 'string',
      group: 'CAS',
      public: true
    });
    this.add('CAS_login_url', '', {
      type: 'string',
      group: 'CAS',
      public: true
    });
    this.add('CAS_version', '1.0', {
      type: 'select',
      values: [{
        key: '1.0',
        i18nLabel: '1.0'
      }, {
        key: '2.0',
        i18nLabel: '2.0'
      }],
      group: 'CAS'
    });
    this.section('Attribute_handling', function () {
      // Enable/disable sync
      this.add('CAS_Sync_User_Data_Enabled', true, {
        type: 'boolean'
      }); // Attribute mapping table

      this.add('CAS_Sync_User_Data_FieldMap', '{}', {
        type: 'string'
      });
    });
    this.section('CAS_Login_Layout', function () {
      this.add('CAS_popup_width', '810', {
        type: 'string',
        group: 'CAS',
        public: true
      });
      this.add('CAS_popup_height', '610', {
        type: 'string',
        group: 'CAS',
        public: true
      });
      this.add('CAS_button_label_text', 'CAS', {
        type: 'string',
        group: 'CAS'
      });
      this.add('CAS_button_label_color', '#FFFFFF', {
        type: 'color',
        group: 'CAS'
      });
      this.add('CAS_button_color', '#13679A', {
        type: 'color',
        group: 'CAS'
      });
      this.add('CAS_autoclose', true, {
        type: 'boolean',
        group: 'CAS'
      });
    });
  });
});
let timer;

function updateServices()
/*record*/
{
  if (typeof timer !== 'undefined') {
    Meteor.clearTimeout(timer);
  }

  timer = Meteor.setTimeout(function () {
    const data = {
      // These will pe passed to 'node-cas' as options
      enabled: RocketChat.settings.get('CAS_enabled'),
      base_url: RocketChat.settings.get('CAS_base_url'),
      login_url: RocketChat.settings.get('CAS_login_url'),
      // Rocketchat Visuals
      buttonLabelText: RocketChat.settings.get('CAS_button_label_text'),
      buttonLabelColor: RocketChat.settings.get('CAS_button_label_color'),
      buttonColor: RocketChat.settings.get('CAS_button_color'),
      width: RocketChat.settings.get('CAS_popup_width'),
      height: RocketChat.settings.get('CAS_popup_height'),
      autoclose: RocketChat.settings.get('CAS_autoclose')
    }; // Either register or deregister the CAS login service based upon its configuration

    if (data.enabled) {
      logger.info('Enabling CAS login service');
      ServiceConfiguration.configurations.upsert({
        service: 'cas'
      }, {
        $set: data
      });
    } else {
      logger.info('Disabling CAS login service');
      ServiceConfiguration.configurations.remove({
        service: 'cas'
      });
    }
  }, 2000);
}

RocketChat.settings.get(/^CAS_.+/, (key, value) => {
  updateServices(value);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cas_server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_cas/server/cas_server.js                                                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let fiber;
module.watch(require("fibers"), {
  default(v) {
    fiber = v;
  }

}, 1);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 2);
let CAS;
module.watch(require("cas"), {
  default(v) {
    CAS = v;
  }

}, 3);
RoutePolicy.declare('/_cas/', 'network');

const closePopup = function (res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  const content = '<html><head><script>window.close()</script></head></html>';
  res.end(content, 'utf-8');
};

const casTicket = function (req, token, callback) {
  // get configuration
  if (!RocketChat.settings.get('CAS_enabled')) {
    logger.error('Got ticket validation request, but CAS is not enabled');
    callback();
  } // get ticket and validate.


  const parsedUrl = url.parse(req.url, true);
  const ticketId = parsedUrl.query.ticket;
  const baseUrl = RocketChat.settings.get('CAS_base_url');
  const cas_version = parseFloat(RocketChat.settings.get('CAS_version'));

  const appUrl = Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;

  logger.debug(`Using CAS_base_url: ${baseUrl}`);
  const cas = new CAS({
    base_url: baseUrl,
    version: cas_version,
    service: `${appUrl}/_cas/${token}`
  });
  cas.validate(ticketId, Meteor.bindEnvironment(function (err, status, username, details) {
    if (err) {
      logger.error(`error when trying to validate: ${err.message}`);
    } else if (status) {
      logger.info(`Validated user: ${username}`);
      const user_info = {
        username
      }; // CAS 2.0 attributes handling

      if (details && details.attributes) {
        _.extend(user_info, {
          attributes: details.attributes
        });
      }

      RocketChat.models.CredentialTokens.create(token, user_info);
    } else {
      logger.error(`Unable to validate ticket: ${ticketId}`);
    } //logger.debug("Receveied response: " + JSON.stringify(details, null , 4));


    callback();
  }));
  return;
};

const middleware = function (req, res, next) {
  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  try {
    const barePath = req.url.substring(0, req.url.indexOf('?'));
    const splitPath = barePath.split('/'); // Any non-cas request will continue down the default
    // middlewares.

    if (splitPath[1] !== '_cas') {
      next();
      return;
    } // get auth token


    const credentialToken = splitPath[2];

    if (!credentialToken) {
      closePopup(res);
      return;
    } // validate ticket


    casTicket(req, credentialToken, function () {
      closePopup(res);
    });
  } catch (err) {
    logger.error(`Unexpected error : ${err.message}`);
    closePopup(res);
  }
}; // Listen to incoming OAuth http requests


WebApp.connectHandlers.use(function (req, res, next) {
  // Need to create a fiber since we're using synchronous http calls and nothing
  // else is wrapping this in a fiber automatically
  fiber(function () {
    middleware(req, res, next);
  }).run();
});
/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 *
 */

Accounts.registerLoginHandler(function (options) {
  if (!options.cas) {
    return undefined;
  }

  const credentials = RocketChat.models.CredentialTokens.findOneById(options.cas.credentialToken);

  if (credentials === undefined) {
    throw new Meteor.Error(Accounts.LoginCancelledError.numericError, 'no matching login attempt found');
  }

  const result = credentials.userInfo;
  const syncUserDataFieldMap = RocketChat.settings.get('CAS_Sync_User_Data_FieldMap').trim();
  const cas_version = parseFloat(RocketChat.settings.get('CAS_version'));
  const sync_enabled = RocketChat.settings.get('CAS_Sync_User_Data_Enabled'); // We have these

  const ext_attrs = {
    username: result.username
  }; // We need these

  const int_attrs = {
    email: undefined,
    name: undefined,
    username: undefined,
    rooms: undefined
  }; // Import response attributes

  if (cas_version >= 2.0) {
    // Clean & import external attributes
    _.each(result.attributes, function (value, ext_name) {
      if (value) {
        ext_attrs[ext_name] = value[0];
      }
    });
  } // Source internal attributes


  if (syncUserDataFieldMap) {
    // Our mapping table: key(int_attr) -> value(ext_attr)
    // Spoken: Source this internal attribute from these external attributes
    const attr_map = JSON.parse(syncUserDataFieldMap);

    _.each(attr_map, function (source, int_name) {
      // Source is our String to interpolate
      if (_.isString(source)) {
        _.each(ext_attrs, function (value, ext_name) {
          source = source.replace(`%${ext_name}%`, ext_attrs[ext_name]);
        });

        int_attrs[int_name] = source;
        logger.debug(`Sourced internal attribute: ${int_name} = ${source}`);
      }
    });
  } // Search existing user by its external service id


  logger.debug(`Looking up user by id: ${result.username}`);
  let user = Meteor.users.findOne({
    'services.cas.external_id': result.username
  });

  if (user) {
    logger.debug(`Using existing user for '${result.username}' with id: ${user._id}`);

    if (sync_enabled) {
      logger.debug('Syncing user attributes'); // Update name

      if (int_attrs.name) {
        RocketChat._setRealName(user._id, int_attrs.name);
      } // Update email


      if (int_attrs.email) {
        Meteor.users.update(user, {
          $set: {
            emails: [{
              address: int_attrs.email,
              verified: true
            }]
          }
        });
      }
    }
  } else {
    // Define new user
    const newUser = {
      username: result.username,
      active: true,
      globalRoles: ['user'],
      emails: [],
      services: {
        cas: {
          external_id: result.username,
          version: cas_version,
          attrs: int_attrs
        }
      }
    }; // Add User.name

    if (int_attrs.name) {
      _.extend(newUser, {
        name: int_attrs.name
      });
    } // Add email


    if (int_attrs.email) {
      _.extend(newUser, {
        emails: [{
          address: int_attrs.email,
          verified: true
        }]
      });
    } // Create the user


    logger.debug(`User "${result.username}" does not exist yet, creating it`);
    const userId = Accounts.insertUserDoc({}, newUser); // Fetch and use it

    user = Meteor.users.findOne(userId);
    logger.debug(`Created new user for '${result.username}' with id: ${user._id}`); //logger.debug(JSON.stringify(user, undefined, 4));

    logger.debug(`Joining user to attribute channels: ${int_attrs.rooms}`);

    if (int_attrs.rooms) {
      _.each(int_attrs.rooms.split(','), function (room_name) {
        if (room_name) {
          let room = RocketChat.models.Rooms.findOneByNameAndType(room_name, 'c');

          if (!room) {
            room = RocketChat.models.Rooms.createWithIdTypeAndName(Random.id(), 'c', room_name);
          }

          if (!RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, userId)) {
            RocketChat.models.Rooms.addUsernameByName(room_name, result.username);
            RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
              ts: new Date(),
              open: true,
              alert: true,
              unread: 1,
              userMentions: 1,
              groupMentions: 0
            });
          }
        }
      });
    }
  }

  return {
    userId: user._id
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"CredentialTokens.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_cas/server/models/CredentialTokens.js                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
RocketChat.models.CredentialTokens = new class extends RocketChat.models._Base {
  constructor() {
    super('credential_tokens');
    this.tryEnsureIndex({
      'expireAt': 1
    }, {
      sparse: 1,
      expireAfterSeconds: 0
    });
  }

  create(_id, userInfo) {
    const validForMilliseconds = 60000; // Valid for 60 seconds

    const token = {
      _id,
      userInfo,
      expireAt: new Date(Date.now() + validForMilliseconds)
    };
    this.insert(token);
    return token;
  }

  findOneById(_id) {
    const query = {
      _id,
      expireAt: {
        $gt: new Date()
      }
    };
    return this.findOne(query);
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:cas/server/cas_rocketchat.js");
require("/node_modules/meteor/rocketchat:cas/server/cas_server.js");
require("/node_modules/meteor/rocketchat:cas/server/models/CredentialTokens.js");

/* Exports */
Package._define("rocketchat:cas");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_cas.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjYXMvc2VydmVyL2Nhc19yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNhcy9zZXJ2ZXIvY2FzX3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjYXMvc2VydmVyL21vZGVscy9DcmVkZW50aWFsVG9rZW5zLmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIkxvZ2dlciIsIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJncm91cCIsInB1YmxpYyIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsInNlY3Rpb24iLCJ0aW1lciIsInVwZGF0ZVNlcnZpY2VzIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsImRhdGEiLCJlbmFibGVkIiwiZ2V0IiwiYmFzZV91cmwiLCJsb2dpbl91cmwiLCJidXR0b25MYWJlbFRleHQiLCJidXR0b25MYWJlbENvbG9yIiwiYnV0dG9uQ29sb3IiLCJ3aWR0aCIsImhlaWdodCIsImF1dG9jbG9zZSIsImluZm8iLCJTZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwidXBzZXJ0Iiwic2VydmljZSIsIiRzZXQiLCJyZW1vdmUiLCJ2YWx1ZSIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsImZpYmVyIiwidXJsIiwiQ0FTIiwiUm91dGVQb2xpY3kiLCJkZWNsYXJlIiwiY2xvc2VQb3B1cCIsInJlcyIsIndyaXRlSGVhZCIsImNvbnRlbnQiLCJlbmQiLCJjYXNUaWNrZXQiLCJyZXEiLCJ0b2tlbiIsImNhbGxiYWNrIiwiZXJyb3IiLCJwYXJzZWRVcmwiLCJwYXJzZSIsInRpY2tldElkIiwicXVlcnkiLCJ0aWNrZXQiLCJiYXNlVXJsIiwiY2FzX3ZlcnNpb24iLCJwYXJzZUZsb2F0IiwiYXBwVXJsIiwiYWJzb2x1dGVVcmwiLCJyZXBsYWNlIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsIlJPT1RfVVJMX1BBVEhfUFJFRklYIiwiZGVidWciLCJjYXMiLCJ2ZXJzaW9uIiwidmFsaWRhdGUiLCJiaW5kRW52aXJvbm1lbnQiLCJlcnIiLCJzdGF0dXMiLCJ1c2VybmFtZSIsImRldGFpbHMiLCJtZXNzYWdlIiwidXNlcl9pbmZvIiwiYXR0cmlidXRlcyIsImV4dGVuZCIsIm1vZGVscyIsIkNyZWRlbnRpYWxUb2tlbnMiLCJjcmVhdGUiLCJtaWRkbGV3YXJlIiwibmV4dCIsImJhcmVQYXRoIiwic3Vic3RyaW5nIiwiaW5kZXhPZiIsInNwbGl0UGF0aCIsInNwbGl0IiwiY3JlZGVudGlhbFRva2VuIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwicnVuIiwiQWNjb3VudHMiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsIm9wdGlvbnMiLCJ1bmRlZmluZWQiLCJjcmVkZW50aWFscyIsImZpbmRPbmVCeUlkIiwiRXJyb3IiLCJMb2dpbkNhbmNlbGxlZEVycm9yIiwibnVtZXJpY0Vycm9yIiwicmVzdWx0IiwidXNlckluZm8iLCJzeW5jVXNlckRhdGFGaWVsZE1hcCIsInRyaW0iLCJzeW5jX2VuYWJsZWQiLCJleHRfYXR0cnMiLCJpbnRfYXR0cnMiLCJlbWFpbCIsIm5hbWUiLCJyb29tcyIsImVhY2giLCJleHRfbmFtZSIsImF0dHJfbWFwIiwiSlNPTiIsInNvdXJjZSIsImludF9uYW1lIiwiaXNTdHJpbmciLCJ1c2VyIiwidXNlcnMiLCJmaW5kT25lIiwiX2lkIiwiX3NldFJlYWxOYW1lIiwidXBkYXRlIiwiZW1haWxzIiwiYWRkcmVzcyIsInZlcmlmaWVkIiwibmV3VXNlciIsImFjdGl2ZSIsImdsb2JhbFJvbGVzIiwic2VydmljZXMiLCJleHRlcm5hbF9pZCIsImF0dHJzIiwidXNlcklkIiwiaW5zZXJ0VXNlckRvYyIsInJvb21fbmFtZSIsInJvb20iLCJSb29tcyIsImZpbmRPbmVCeU5hbWVBbmRUeXBlIiwiY3JlYXRlV2l0aElkVHlwZUFuZE5hbWUiLCJSYW5kb20iLCJpZCIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJhZGRVc2VybmFtZUJ5TmFtZSIsImNyZWF0ZVdpdGhSb29tQW5kVXNlciIsInRzIiwiRGF0ZSIsIm9wZW4iLCJhbGVydCIsInVucmVhZCIsInVzZXJNZW50aW9ucyIsImdyb3VwTWVudGlvbnMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwidHJ5RW5zdXJlSW5kZXgiLCJzcGFyc2UiLCJleHBpcmVBZnRlclNlY29uZHMiLCJ2YWxpZEZvck1pbGxpc2Vjb25kcyIsImV4cGlyZUF0Iiwibm93IiwiaW5zZXJ0IiwiJGd0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFFQUEsU0FBUyxJQUFJQyxNQUFKLENBQVcsS0FBWCxFQUFrQixFQUFsQixDQUFUO0FBRUFDLE9BQU9DLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCQyxhQUFXQyxRQUFYLENBQW9CQyxRQUFwQixDQUE2QixLQUE3QixFQUFvQyxZQUFXO0FBQzlDLFNBQUtDLEdBQUwsQ0FBUyxhQUFULEVBQXdCLEtBQXhCLEVBQStCO0FBQUVDLFlBQU0sU0FBUjtBQUFtQkMsYUFBTyxLQUExQjtBQUFpQ0MsY0FBUTtBQUF6QyxLQUEvQjtBQUNBLFNBQUtILEdBQUwsQ0FBUyxjQUFULEVBQXlCLEVBQXpCLEVBQTZCO0FBQUVDLFlBQU0sUUFBUjtBQUFrQkMsYUFBTyxLQUF6QjtBQUFnQ0MsY0FBUTtBQUF4QyxLQUE3QjtBQUNBLFNBQUtILEdBQUwsQ0FBUyxlQUFULEVBQTBCLEVBQTFCLEVBQThCO0FBQUVDLFlBQU0sUUFBUjtBQUFrQkMsYUFBTyxLQUF6QjtBQUFnQ0MsY0FBUTtBQUF4QyxLQUE5QjtBQUNBLFNBQUtILEdBQUwsQ0FBUyxhQUFULEVBQXdCLEtBQXhCLEVBQStCO0FBQUVDLFlBQU0sUUFB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QUosQ0FBU0EsS0FBS2EsR0FBTCxLQUFhRixvQkFBdEI7QUFIRyxLQUFkO0FBTUEsU0FBS0csTUFBTCxDQUFZakgsS0FBWjtBQUNBLFdBQU9BLEtBQVA7QUFDQTs7QUFFRGlELGNBQVl3QixHQUFaLEVBQWlCO0FBQ2hCLFVBQU1uRSxRQUFRO0FBQ2JtRSxTQURhO0FBRWJzQyxnQkFBVTtBQUFFRyxhQUFLLElBQUlmLElBQUo7QUFBUDtBQUZHLEtBQWQ7QUFLQSxXQUFPLEtBQUszQixPQUFMLENBQWFsRSxLQUFiLENBQVA7QUFDQTs7QUExQjZFLENBQTFDLEVBQXJDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfY2FzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBsb2dnZXI6dHJ1ZSAqL1xuXG5sb2dnZXIgPSBuZXcgTG9nZ2VyKCdDQVMnLCB7fSk7XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdDQVMnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnQ0FTX2VuYWJsZWQnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIGdyb3VwOiAnQ0FTJywgcHVibGljOiB0cnVlIH0pO1xuXHRcdHRoaXMuYWRkKCdDQVNfYmFzZV91cmwnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdDQVMnLCBwdWJsaWM6IHRydWUgfSk7XG5cdFx0dGhpcy5hZGQoJ0NBU19sb2dpbl91cmwnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdDQVMnLCBwdWJsaWM6IHRydWUgfSk7XG5cdFx0dGhpcy5hZGQoJ0NBU192ZXJzaW9uJywgJzEuMCcsIHsgdHlwZTogJ3NlbGVjdCcsIHZhbHVlczogW3sga2V5OiAnMS4wJywgaTE4bkxhYmVsOiAnMS4wJ30sIHsga2V5OiAnMi4wJywgaTE4bkxhYmVsOiAnMi4wJ31dLCBncm91cDogJ0NBUycgfSk7XG5cblx0XHR0aGlzLnNlY3Rpb24oJ0F0dHJpYnV0ZV9oYW5kbGluZycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gRW5hYmxlL2Rpc2FibGUgc3luY1xuXHRcdFx0dGhpcy5hZGQoJ0NBU19TeW5jX1VzZXJfRGF0YV9FbmFibGVkJywgdHJ1ZSwgeyB0eXBlOiAnYm9vbGVhbicgfSk7XG5cdFx0XHQvLyBBdHRyaWJ1dGUgbWFwcGluZyB0YWJsZVxuXHRcdFx0dGhpcy5hZGQoJ0NBU19TeW5jX1VzZXJfRGF0YV9GaWVsZE1hcCcsICd7fScsIHsgdHlwZTogJ3N0cmluZycgfSk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLnNlY3Rpb24oJ0NBU19Mb2dpbl9MYXlvdXQnLCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuYWRkKCdDQVNfcG9wdXBfd2lkdGgnLCAnODEwJywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdDQVMnLCBwdWJsaWM6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmFkZCgnQ0FTX3BvcHVwX2hlaWdodCcsICc2MTAnLCB7IHR5cGU6ICdzdHJpbmcnLCBncm91cDogJ0NBUycsIHB1YmxpYzogdHJ1ZSB9KTtcblx0XHRcdHRoaXMuYWRkKCdDQVNfYnV0dG9uX2xhYmVsX3RleHQnLCAnQ0FTJywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdDQVMnfSk7XG5cdFx0XHR0aGlzLmFkZCgnQ0FTX2J1dHRvbl9sYWJlbF9jb2xvcicsICcjRkZGRkZGJywgeyB0eXBlOiAnY29sb3InLCBncm91cDogJ0NBUyd9KTtcblx0XHRcdHRoaXMuYWRkKCdDQVNfYnV0dG9uX2NvbG9yJywgJyMxMzY3OUEnLCB7IHR5cGU6ICdjb2xvcicsIGdyb3VwOiAnQ0FTJ30pO1xuXHRcdFx0dGhpcy5hZGQoJ0NBU19hdXRvY2xvc2UnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdDQVMnfSk7XG5cdFx0fSk7XG5cdH0pO1xufSk7XG5cbmxldCB0aW1lcjtcblxuZnVuY3Rpb24gdXBkYXRlU2VydmljZXMoLypyZWNvcmQqLykge1xuXHRpZiAodHlwZW9mIHRpbWVyICE9PSAndW5kZWZpbmVkJykge1xuXHRcdE1ldGVvci5jbGVhclRpbWVvdXQodGltZXIpO1xuXHR9XG5cblx0dGltZXIgPSBNZXRlb3Iuc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0Ly8gVGhlc2Ugd2lsbCBwZSBwYXNzZWQgdG8gJ25vZGUtY2FzJyBhcyBvcHRpb25zXG5cdFx0XHRlbmFibGVkOiAgICAgICAgICBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX2VuYWJsZWQnKSxcblx0XHRcdGJhc2VfdXJsOiAgICAgICAgIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfYmFzZV91cmwnKSxcblx0XHRcdGxvZ2luX3VybDogICAgICAgIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfbG9naW5fdXJsJyksXG5cdFx0XHQvLyBSb2NrZXRjaGF0IFZpc3VhbHNcblx0XHRcdGJ1dHRvbkxhYmVsVGV4dDogIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfYnV0dG9uX2xhYmVsX3RleHQnKSxcblx0XHRcdGJ1dHRvbkxhYmVsQ29sb3I6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfYnV0dG9uX2xhYmVsX2NvbG9yJyksXG5cdFx0XHRidXR0b25Db2xvcjogICAgICBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX2J1dHRvbl9jb2xvcicpLFxuXHRcdFx0d2lkdGg6ICAgICAgICAgICAgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19wb3B1cF93aWR0aCcpLFxuXHRcdFx0aGVpZ2h0OiAgICAgICAgICAgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19wb3B1cF9oZWlnaHQnKSxcblx0XHRcdGF1dG9jbG9zZTogICAgICAgIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfYXV0b2Nsb3NlJylcblx0XHR9O1xuXG5cdFx0Ly8gRWl0aGVyIHJlZ2lzdGVyIG9yIGRlcmVnaXN0ZXIgdGhlIENBUyBsb2dpbiBzZXJ2aWNlIGJhc2VkIHVwb24gaXRzIGNvbmZpZ3VyYXRpb25cblx0XHRpZiAoZGF0YS5lbmFibGVkKSB7XG5cdFx0XHRsb2dnZXIuaW5mbygnRW5hYmxpbmcgQ0FTIGxvZ2luIHNlcnZpY2UnKTtcblx0XHRcdFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLnVwc2VydCh7c2VydmljZTogJ2Nhcyd9LCB7ICRzZXQ6IGRhdGEgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxvZ2dlci5pbmZvKCdEaXNhYmxpbmcgQ0FTIGxvZ2luIHNlcnZpY2UnKTtcblx0XHRcdFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLnJlbW92ZSh7c2VydmljZTogJ2Nhcyd9KTtcblx0XHR9XG5cdH0sIDIwMDApO1xufVxuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkNBU18uKy8sIChrZXksIHZhbHVlKSA9PiB7XG5cdHVwZGF0ZVNlcnZpY2VzKHZhbHVlKTtcbn0pO1xuIiwiLyogZ2xvYmFscyBSb3V0ZVBvbGljeSwgbG9nZ2VyICovXG4vKiBqc2hpbnQgbmV3Y2FwOiBmYWxzZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmltcG9ydCBmaWJlciBmcm9tICdmaWJlcnMnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IENBUyBmcm9tICdjYXMnO1xuXG5Sb3V0ZVBvbGljeS5kZWNsYXJlKCcvX2Nhcy8nLCAnbmV0d29yaycpO1xuXG5jb25zdCBjbG9zZVBvcHVwID0gZnVuY3Rpb24ocmVzKSB7XG5cdHJlcy53cml0ZUhlYWQoMjAwLCB7J0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWwnfSk7XG5cdGNvbnN0IGNvbnRlbnQgPSAnPGh0bWw+PGhlYWQ+PHNjcmlwdD53aW5kb3cuY2xvc2UoKTwvc2NyaXB0PjwvaGVhZD48L2h0bWw+Jztcblx0cmVzLmVuZChjb250ZW50LCAndXRmLTgnKTtcbn07XG5cbmNvbnN0IGNhc1RpY2tldCA9IGZ1bmN0aW9uKHJlcSwgdG9rZW4sIGNhbGxiYWNrKSB7XG5cblx0Ly8gZ2V0IGNvbmZpZ3VyYXRpb25cblx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX2VuYWJsZWQnKSkge1xuXHRcdGxvZ2dlci5lcnJvcignR290IHRpY2tldCB2YWxpZGF0aW9uIHJlcXVlc3QsIGJ1dCBDQVMgaXMgbm90IGVuYWJsZWQnKTtcblx0XHRjYWxsYmFjaygpO1xuXHR9XG5cblx0Ly8gZ2V0IHRpY2tldCBhbmQgdmFsaWRhdGUuXG5cdGNvbnN0IHBhcnNlZFVybCA9IHVybC5wYXJzZShyZXEudXJsLCB0cnVlKTtcblx0Y29uc3QgdGlja2V0SWQgPSBwYXJzZWRVcmwucXVlcnkudGlja2V0O1xuXHRjb25zdCBiYXNlVXJsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19iYXNlX3VybCcpO1xuXHRjb25zdCBjYXNfdmVyc2lvbiA9IHBhcnNlRmxvYXQoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU192ZXJzaW9uJykpO1xuXHRjb25zdCBhcHBVcmwgPSBNZXRlb3IuYWJzb2x1dGVVcmwoKS5yZXBsYWNlKC9cXC8kLywgJycpICsgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWDtcblx0bG9nZ2VyLmRlYnVnKGBVc2luZyBDQVNfYmFzZV91cmw6ICR7IGJhc2VVcmwgfWApO1xuXG5cdGNvbnN0IGNhcyA9IG5ldyBDQVMoe1xuXHRcdGJhc2VfdXJsOiBiYXNlVXJsLFxuXHRcdHZlcnNpb246IGNhc192ZXJzaW9uLFxuXHRcdHNlcnZpY2U6IGAkeyBhcHBVcmwgfS9fY2FzLyR7IHRva2VuIH1gXG5cdH0pO1xuXG5cdGNhcy52YWxpZGF0ZSh0aWNrZXRJZCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihlcnIsIHN0YXR1cywgdXNlcm5hbWUsIGRldGFpbHMpIHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRsb2dnZXIuZXJyb3IoYGVycm9yIHdoZW4gdHJ5aW5nIHRvIHZhbGlkYXRlOiAkeyBlcnIubWVzc2FnZSB9YCk7XG5cdFx0fSBlbHNlIGlmIChzdGF0dXMpIHtcblx0XHRcdGxvZ2dlci5pbmZvKGBWYWxpZGF0ZWQgdXNlcjogJHsgdXNlcm5hbWUgfWApO1xuXHRcdFx0Y29uc3QgdXNlcl9pbmZvID0geyB1c2VybmFtZSB9O1xuXG5cdFx0XHQvLyBDQVMgMi4wIGF0dHJpYnV0ZXMgaGFuZGxpbmdcblx0XHRcdGlmIChkZXRhaWxzICYmIGRldGFpbHMuYXR0cmlidXRlcykge1xuXHRcdFx0XHRfLmV4dGVuZCh1c2VyX2luZm8sIHsgYXR0cmlidXRlczogZGV0YWlscy5hdHRyaWJ1dGVzIH0pO1xuXHRcdFx0fVxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuQ3JlZGVudGlhbFRva2Vucy5jcmVhdGUodG9rZW4sIHVzZXJfaW5mbyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxvZ2dlci5lcnJvcihgVW5hYmxlIHRvIHZhbGlkYXRlIHRpY2tldDogJHsgdGlja2V0SWQgfWApO1xuXHRcdH1cblx0XHQvL2xvZ2dlci5kZWJ1ZyhcIlJlY2V2ZWllZCByZXNwb25zZTogXCIgKyBKU09OLnN0cmluZ2lmeShkZXRhaWxzLCBudWxsICwgNCkpO1xuXG5cdFx0Y2FsbGJhY2soKTtcblx0fSkpO1xuXG5cdHJldHVybjtcbn07XG5cbmNvbnN0IG1pZGRsZXdhcmUgPSBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXHQvLyBNYWtlIHN1cmUgdG8gY2F0Y2ggYW55IGV4Y2VwdGlvbnMgYmVjYXVzZSBvdGhlcndpc2Ugd2UnZCBjcmFzaFxuXHQvLyB0aGUgcnVubmVyXG5cdHRyeSB7XG5cdFx0Y29uc3QgYmFyZVBhdGggPSByZXEudXJsLnN1YnN0cmluZygwLCByZXEudXJsLmluZGV4T2YoJz8nKSk7XG5cdFx0Y29uc3Qgc3BsaXRQYXRoID0gYmFyZVBhdGguc3BsaXQoJy8nKTtcblxuXHRcdC8vIEFueSBub24tY2FzIHJlcXVlc3Qgd2lsbCBjb250aW51ZSBkb3duIHRoZSBkZWZhdWx0XG5cdFx0Ly8gbWlkZGxld2FyZXMuXG5cdFx0aWYgKHNwbGl0UGF0aFsxXSAhPT0gJ19jYXMnKSB7XG5cdFx0XHRuZXh0KCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gZ2V0IGF1dGggdG9rZW5cblx0XHRjb25zdCBjcmVkZW50aWFsVG9rZW4gPSBzcGxpdFBhdGhbMl07XG5cdFx0aWYgKCFjcmVkZW50aWFsVG9rZW4pIHtcblx0XHRcdGNsb3NlUG9wdXAocmVzKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyB2YWxpZGF0ZSB0aWNrZXRcblx0XHRjYXNUaWNrZXQocmVxLCBjcmVkZW50aWFsVG9rZW4sIGZ1bmN0aW9uKCkge1xuXHRcdFx0Y2xvc2VQb3B1cChyZXMpO1xuXHRcdH0pO1xuXG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdGxvZ2dlci5lcnJvcihgVW5leHBlY3RlZCBlcnJvciA6ICR7IGVyci5tZXNzYWdlIH1gKTtcblx0XHRjbG9zZVBvcHVwKHJlcyk7XG5cdH1cbn07XG5cbi8vIExpc3RlbiB0byBpbmNvbWluZyBPQXV0aCBodHRwIHJlcXVlc3RzXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZShmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXHQvLyBOZWVkIHRvIGNyZWF0ZSBhIGZpYmVyIHNpbmNlIHdlJ3JlIHVzaW5nIHN5bmNocm9ub3VzIGh0dHAgY2FsbHMgYW5kIG5vdGhpbmdcblx0Ly8gZWxzZSBpcyB3cmFwcGluZyB0aGlzIGluIGEgZmliZXIgYXV0b21hdGljYWxseVxuXHRmaWJlcihmdW5jdGlvbigpIHtcblx0XHRtaWRkbGV3YXJlKHJlcSwgcmVzLCBuZXh0KTtcblx0fSkucnVuKCk7XG59KTtcblxuLypcbiAqIFJlZ2lzdGVyIGEgc2VydmVyLXNpZGUgbG9naW4gaGFuZGxlLlxuICogSXQgaXMgY2FsbCBhZnRlciBBY2NvdW50cy5jYWxsTG9naW5NZXRob2QoKSBpcyBjYWxsIGZyb20gY2xpZW50LlxuICpcbiAqL1xuQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdGlmICghb3B0aW9ucy5jYXMpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cblx0Y29uc3QgY3JlZGVudGlhbHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5DcmVkZW50aWFsVG9rZW5zLmZpbmRPbmVCeUlkKG9wdGlvbnMuY2FzLmNyZWRlbnRpYWxUb2tlbik7XG5cdGlmIChjcmVkZW50aWFscyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihBY2NvdW50cy5Mb2dpbkNhbmNlbGxlZEVycm9yLm51bWVyaWNFcnJvcixcblx0XHRcdCdubyBtYXRjaGluZyBsb2dpbiBhdHRlbXB0IGZvdW5kJyk7XG5cdH1cblxuXHRjb25zdCByZXN1bHQgPSBjcmVkZW50aWFscy51c2VySW5mbztcblx0Y29uc3Qgc3luY1VzZXJEYXRhRmllbGRNYXAgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX1N5bmNfVXNlcl9EYXRhX0ZpZWxkTWFwJykudHJpbSgpO1xuXHRjb25zdCBjYXNfdmVyc2lvbiA9IHBhcnNlRmxvYXQoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU192ZXJzaW9uJykpO1xuXHRjb25zdCBzeW5jX2VuYWJsZWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX1N5bmNfVXNlcl9EYXRhX0VuYWJsZWQnKTtcblxuXHQvLyBXZSBoYXZlIHRoZXNlXG5cdGNvbnN0IGV4dF9hdHRycyA9IHtcblx0XHR1c2VybmFtZTogcmVzdWx0LnVzZXJuYW1lXG5cdH07XG5cblx0Ly8gV2UgbmVlZCB0aGVzZVxuXHRjb25zdCBpbnRfYXR0cnMgPSB7XG5cdFx0ZW1haWw6IHVuZGVmaW5lZCxcblx0XHRuYW1lOiB1bmRlZmluZWQsXG5cdFx0dXNlcm5hbWU6IHVuZGVmaW5lZCxcblx0XHRyb29tczogdW5kZWZpbmVkXG5cdH07XG5cblx0Ly8gSW1wb3J0IHJlc3BvbnNlIGF0dHJpYnV0ZXNcblx0aWYgKGNhc192ZXJzaW9uID49IDIuMCkge1xuXHRcdC8vIENsZWFuICYgaW1wb3J0IGV4dGVybmFsIGF0dHJpYnV0ZXNcblx0XHRfLmVhY2gocmVzdWx0LmF0dHJpYnV0ZXMsIGZ1bmN0aW9uKHZhbHVlLCBleHRfbmFtZSkge1xuXHRcdFx0aWYgKHZhbHVlKSB7XG5cdFx0XHRcdGV4dF9hdHRyc1tleHRfbmFtZV0gPSB2YWx1ZVswXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8vIFNvdXJjZSBpbnRlcm5hbCBhdHRyaWJ1dGVzXG5cdGlmIChzeW5jVXNlckRhdGFGaWVsZE1hcCkge1xuXG5cdFx0Ly8gT3VyIG1hcHBpbmcgdGFibGU6IGtleShpbnRfYXR0cikgLT4gdmFsdWUoZXh0X2F0dHIpXG5cdFx0Ly8gU3Bva2VuOiBTb3VyY2UgdGhpcyBpbnRlcm5hbCBhdHRyaWJ1dGUgZnJvbSB0aGVzZSBleHRlcm5hbCBhdHRyaWJ1dGVzXG5cdFx0Y29uc3QgYXR0cl9tYXAgPSBKU09OLnBhcnNlKHN5bmNVc2VyRGF0YUZpZWxkTWFwKTtcblxuXHRcdF8uZWFjaChhdHRyX21hcCwgZnVuY3Rpb24oc291cmNlLCBpbnRfbmFtZSkge1xuXHRcdFx0Ly8gU291cmNlIGlzIG91ciBTdHJpbmcgdG8gaW50ZXJwb2xhdGVcblx0XHRcdGlmIChfLmlzU3RyaW5nKHNvdXJjZSkpIHtcblx0XHRcdFx0Xy5lYWNoKGV4dF9hdHRycywgZnVuY3Rpb24odmFsdWUsIGV4dF9uYW1lKSB7XG5cdFx0XHRcdFx0c291cmNlID0gc291cmNlLnJlcGxhY2UoYCUkeyBleHRfbmFtZSB9JWAsIGV4dF9hdHRyc1tleHRfbmFtZV0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpbnRfYXR0cnNbaW50X25hbWVdID0gc291cmNlO1xuXHRcdFx0XHRsb2dnZXIuZGVidWcoYFNvdXJjZWQgaW50ZXJuYWwgYXR0cmlidXRlOiAkeyBpbnRfbmFtZSB9ID0gJHsgc291cmNlIH1gKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8vIFNlYXJjaCBleGlzdGluZyB1c2VyIGJ5IGl0cyBleHRlcm5hbCBzZXJ2aWNlIGlkXG5cdGxvZ2dlci5kZWJ1ZyhgTG9va2luZyB1cCB1c2VyIGJ5IGlkOiAkeyByZXN1bHQudXNlcm5hbWUgfWApO1xuXHRsZXQgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHsgJ3NlcnZpY2VzLmNhcy5leHRlcm5hbF9pZCc6IHJlc3VsdC51c2VybmFtZSB9KTtcblxuXHRpZiAodXNlcikge1xuXHRcdGxvZ2dlci5kZWJ1ZyhgVXNpbmcgZXhpc3RpbmcgdXNlciBmb3IgJyR7IHJlc3VsdC51c2VybmFtZSB9JyB3aXRoIGlkOiAkeyB1c2VyLl9pZCB9YCk7XG5cdFx0aWYgKHN5bmNfZW5hYmxlZCkge1xuXHRcdFx0bG9nZ2VyLmRlYnVnKCdTeW5jaW5nIHVzZXIgYXR0cmlidXRlcycpO1xuXHRcdFx0Ly8gVXBkYXRlIG5hbWVcblx0XHRcdGlmIChpbnRfYXR0cnMubmFtZSkge1xuXHRcdFx0XHRSb2NrZXRDaGF0Ll9zZXRSZWFsTmFtZSh1c2VyLl9pZCwgaW50X2F0dHJzLm5hbWUpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBVcGRhdGUgZW1haWxcblx0XHRcdGlmIChpbnRfYXR0cnMuZW1haWwpIHtcblx0XHRcdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh1c2VyLCB7ICRzZXQ6IHsgZW1haWxzOiBbeyBhZGRyZXNzOiBpbnRfYXR0cnMuZW1haWwsIHZlcmlmaWVkOiB0cnVlIH1dIH19KTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cblx0XHQvLyBEZWZpbmUgbmV3IHVzZXJcblx0XHRjb25zdCBuZXdVc2VyID0ge1xuXHRcdFx0dXNlcm5hbWU6IHJlc3VsdC51c2VybmFtZSxcblx0XHRcdGFjdGl2ZTogdHJ1ZSxcblx0XHRcdGdsb2JhbFJvbGVzOiBbJ3VzZXInXSxcblx0XHRcdGVtYWlsczogW10sXG5cdFx0XHRzZXJ2aWNlczoge1xuXHRcdFx0XHRjYXM6IHtcblx0XHRcdFx0XHRleHRlcm5hbF9pZDogcmVzdWx0LnVzZXJuYW1lLFxuXHRcdFx0XHRcdHZlcnNpb246IGNhc192ZXJzaW9uLFxuXHRcdFx0XHRcdGF0dHJzOiBpbnRfYXR0cnNcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBBZGQgVXNlci5uYW1lXG5cdFx0aWYgKGludF9hdHRycy5uYW1lKSB7XG5cdFx0XHRfLmV4dGVuZChuZXdVc2VyLCB7XG5cdFx0XHRcdG5hbWU6IGludF9hdHRycy5uYW1lXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBBZGQgZW1haWxcblx0XHRpZiAoaW50X2F0dHJzLmVtYWlsKSB7XG5cdFx0XHRfLmV4dGVuZChuZXdVc2VyLCB7XG5cdFx0XHRcdGVtYWlsczogW3sgYWRkcmVzczogaW50X2F0dHJzLmVtYWlsLCB2ZXJpZmllZDogdHJ1ZSB9XVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gQ3JlYXRlIHRoZSB1c2VyXG5cdFx0bG9nZ2VyLmRlYnVnKGBVc2VyIFwiJHsgcmVzdWx0LnVzZXJuYW1lIH1cIiBkb2VzIG5vdCBleGlzdCB5ZXQsIGNyZWF0aW5nIGl0YCk7XG5cdFx0Y29uc3QgdXNlcklkID0gQWNjb3VudHMuaW5zZXJ0VXNlckRvYyh7fSwgbmV3VXNlcik7XG5cblx0XHQvLyBGZXRjaCBhbmQgdXNlIGl0XG5cdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJJZCk7XG5cdFx0bG9nZ2VyLmRlYnVnKGBDcmVhdGVkIG5ldyB1c2VyIGZvciAnJHsgcmVzdWx0LnVzZXJuYW1lIH0nIHdpdGggaWQ6ICR7IHVzZXIuX2lkIH1gKTtcblx0XHQvL2xvZ2dlci5kZWJ1ZyhKU09OLnN0cmluZ2lmeSh1c2VyLCB1bmRlZmluZWQsIDQpKTtcblxuXHRcdGxvZ2dlci5kZWJ1ZyhgSm9pbmluZyB1c2VyIHRvIGF0dHJpYnV0ZSBjaGFubmVsczogJHsgaW50X2F0dHJzLnJvb21zIH1gKTtcblx0XHRpZiAoaW50X2F0dHJzLnJvb21zKSB7XG5cdFx0XHRfLmVhY2goaW50X2F0dHJzLnJvb21zLnNwbGl0KCcsJyksIGZ1bmN0aW9uKHJvb21fbmFtZSkge1xuXHRcdFx0XHRpZiAocm9vbV9uYW1lKSB7XG5cdFx0XHRcdFx0bGV0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lQW5kVHlwZShyb29tX25hbWUsICdjJyk7XG5cdFx0XHRcdFx0aWYgKCFyb29tKSB7XG5cdFx0XHRcdFx0XHRyb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY3JlYXRlV2l0aElkVHlwZUFuZE5hbWUoUmFuZG9tLmlkKCksICdjJywgcm9vbV9uYW1lKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIVJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb20uX2lkLCB1c2VySWQpKSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5hZGRVc2VybmFtZUJ5TmFtZShyb29tX25hbWUsIHJlc3VsdC51c2VybmFtZSk7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmNyZWF0ZVdpdGhSb29tQW5kVXNlcihyb29tLCB1c2VyLCB7XG5cdFx0XHRcdFx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRhbGVydDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0dW5yZWFkOiAxLFxuXHRcdFx0XHRcdFx0XHR1c2VyTWVudGlvbnM6IDEsXG5cdFx0XHRcdFx0XHRcdGdyb3VwTWVudGlvbnM6IDBcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdH1cblxuXHRyZXR1cm4geyB1c2VySWQ6IHVzZXIuX2lkIH07XG59KTtcbiIsIlJvY2tldENoYXQubW9kZWxzLkNyZWRlbnRpYWxUb2tlbnMgPSBuZXcgY2xhc3MgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdjcmVkZW50aWFsX3Rva2VucycpO1xuXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdleHBpcmVBdCc6IDEgfSwgeyBzcGFyc2U6IDEsIGV4cGlyZUFmdGVyU2Vjb25kczogMCB9KTtcblx0fVxuXG5cdGNyZWF0ZShfaWQsIHVzZXJJbmZvKSB7XG5cdFx0Y29uc3QgdmFsaWRGb3JNaWxsaXNlY29uZHMgPSA2MDAwMDtcdFx0Ly8gVmFsaWQgZm9yIDYwIHNlY29uZHNcblx0XHRjb25zdCB0b2tlbiA9IHtcblx0XHRcdF9pZCxcblx0XHRcdHVzZXJJbmZvLFxuXHRcdFx0ZXhwaXJlQXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyB2YWxpZEZvck1pbGxpc2Vjb25kcylcblx0XHR9O1xuXG5cdFx0dGhpcy5pbnNlcnQodG9rZW4pO1xuXHRcdHJldHVybiB0b2tlbjtcblx0fVxuXG5cdGZpbmRPbmVCeUlkKF9pZCkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0X2lkLFxuXHRcdFx0ZXhwaXJlQXQ6IHsgJGd0OiBuZXcgRGF0ZSgpIH1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSk7XG5cdH1cbn07XG4iXX0=
