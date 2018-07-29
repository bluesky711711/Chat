(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Restivus = Package['nimble:restivus'].Restivus;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var result, endpoints, options, routes;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:api":{"server":{"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/api.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const logger = new Logger('API', {});

class API extends Restivus {
  constructor(properties) {
    super(properties);
    this.authMethods = [];
    this.fieldSeparator = '.';
    this.defaultFieldsToExclude = {
      joinCode: 0,
      $loki: 0,
      meta: 0,
      members: 0,
      usernames: 0,
      // Please use the `channel/dm/group.members` endpoint. This is disabled for performance reasons
      importIds: 0
    };
    this.limitedUserFieldsToExclude = {
      avatarOrigin: 0,
      emails: 0,
      phone: 0,
      statusConnection: 0,
      createdAt: 0,
      lastLogin: 0,
      services: 0,
      requirePasswordChange: 0,
      requirePasswordChangeReason: 0,
      roles: 0,
      statusDefault: 0,
      _updatedAt: 0,
      customFields: 0,
      settings: 0
    };
    this.limitedUserFieldsToExcludeIfIsPrivilegedUser = {
      services: 0
    };

    this._config.defaultOptionsEndpoint = function _defaultOptionsEndpoint() {
      if (this.request.method === 'OPTIONS' && this.request.headers['access-control-request-method']) {
        if (RocketChat.settings.get('API_Enable_CORS') === true) {
          this.response.writeHead(200, {
            'Access-Control-Allow-Origin': RocketChat.settings.get('API_CORS_Origin'),
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token'
          });
        } else {
          this.response.writeHead(405);
          this.response.write('CORS not enabled. Go to "Admin > General > REST Api" to enable it.');
        }
      } else {
        this.response.writeHead(404);
      }

      this.done();
    };
  }

  hasHelperMethods() {
    return RocketChat.API.helperMethods.size !== 0;
  }

  getHelperMethods() {
    return RocketChat.API.helperMethods;
  }

  getHelperMethod(name) {
    return RocketChat.API.helperMethods.get(name);
  }

  addAuthMethod(method) {
    this.authMethods.push(method);
  }

  success(result = {}) {
    if (_.isObject(result)) {
      result.success = true;
    }

    result = {
      statusCode: 200,
      body: result
    };
    logger.debug('Success', result);
    return result;
  }

  failure(result, errorType) {
    if (_.isObject(result)) {
      result.success = false;
    } else {
      result = {
        success: false,
        error: result
      };

      if (errorType) {
        result.errorType = errorType;
      }
    }

    result = {
      statusCode: 400,
      body: result
    };
    logger.debug('Failure', result);
    return result;
  }

  notFound(msg) {
    return {
      statusCode: 404,
      body: {
        success: false,
        error: msg ? msg : 'Resource not found'
      }
    };
  }

  unauthorized(msg) {
    return {
      statusCode: 403,
      body: {
        success: false,
        error: msg ? msg : 'unauthorized'
      }
    };
  }

  addRoute(routes, options, endpoints) {
    //Note: required if the developer didn't provide options
    if (typeof endpoints === 'undefined') {
      endpoints = options;
      options = {};
    } //Allow for more than one route using the same option and endpoints


    if (!_.isArray(routes)) {
      routes = [routes];
    }

    const version = this._config.version;
    routes.forEach(route => {
      //Note: This is required due to Restivus calling `addRoute` in the constructor of itself
      Object.keys(endpoints).forEach(method => {
        if (typeof endpoints[method] === 'function') {
          endpoints[method] = {
            action: endpoints[method]
          };
        } //Add a try/catch for each endpoint


        const originalAction = endpoints[method].action;

        endpoints[method].action = function _internalRouteActionHandler() {
          const rocketchatRestApiEnd = RocketChat.metrics.rocketchatRestApi.startTimer({
            method,
            version,
            user_agent: this.request.headers['user-agent'],
            entrypoint: route
          });
          logger.debug(`${this.request.method.toUpperCase()}: ${this.request.url}`);
          let result;

          try {
            result = originalAction.apply(this);
          } catch (e) {
            logger.debug(`${method} ${route} threw an error:`, e.stack);
            result = RocketChat.API.v1.failure(e.message, e.error);
          }

          result = result || RocketChat.API.v1.success();
          rocketchatRestApiEnd({
            status: result.statusCode
          });
          return result;
        };

        if (this.hasHelperMethods()) {
          for (const [name, helperMethod] of this.getHelperMethods()) {
            endpoints[method][name] = helperMethod;
          }
        } //Allow the endpoints to make usage of the logger which respects the user's settings


        endpoints[method].logger = logger;
      });
      super.addRoute(route, options, endpoints);
    });
  }

  _initAuth() {
    const loginCompatibility = bodyParams => {
      // Grab the username or email that the user is logging in with
      const {
        user,
        username,
        email,
        password,
        code
      } = bodyParams;

      if (password == null) {
        return bodyParams;
      }

      if (_.without(Object.keys(bodyParams), 'user', 'username', 'email', 'password', 'code').length > 0) {
        return bodyParams;
      }

      const auth = {
        password
      };

      if (typeof user === 'string') {
        auth.user = user.includes('@') ? {
          email: user
        } : {
          username: user
        };
      } else if (username) {
        auth.user = {
          username
        };
      } else if (email) {
        auth.user = {
          email
        };
      }

      if (auth.user == null) {
        return bodyParams;
      }

      if (auth.password.hashed) {
        auth.password = {
          digest: auth.password,
          algorithm: 'sha-256'
        };
      }

      if (code) {
        return {
          totp: {
            code,
            login: auth
          }
        };
      }

      return auth;
    };

    const self = this;
    this.addRoute('login', {
      authRequired: false
    }, {
      post() {
        const args = loginCompatibility(this.bodyParams);
        const getUserInfo = self.getHelperMethod('getUserInfo');
        const invocation = new DDPCommon.MethodInvocation({
          connection: {
            close() {}

          }
        });
        let auth;

        try {
          auth = DDP._CurrentInvocation.withValue(invocation, () => Meteor.call('login', args));
        } catch (error) {
          let e = error;

          if (error.reason === 'User not found') {
            e = {
              error: 'Unauthorized',
              reason: 'Unauthorized'
            };
          }

          return {
            statusCode: 401,
            body: {
              status: 'error',
              error: e.error,
              message: e.reason || e.message
            }
          };
        }

        this.user = Meteor.users.findOne({
          _id: auth.id
        });
        this.userId = this.user._id; // Remove tokenExpires to keep the old behavior

        Meteor.users.update({
          _id: this.user._id,
          'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(auth.token)
        }, {
          $unset: {
            'services.resume.loginTokens.$.when': 1
          }
        });
        const response = {
          status: 'success',
          data: {
            userId: this.userId,
            authToken: auth.token,
            me: getUserInfo(this.user)
          }
        };

        const extraData = self._config.onLoggedIn && self._config.onLoggedIn.call(this);

        if (extraData != null) {
          _.extend(response.data, {
            extra: extraData
          });
        }

        return response;
      }

    });

    const logout = function () {
      // Remove the given auth token from the user's account
      const authToken = this.request.headers['x-auth-token'];

      const hashedToken = Accounts._hashLoginToken(authToken);

      const tokenLocation = self._config.auth.token;
      const index = tokenLocation.lastIndexOf('.');
      const tokenPath = tokenLocation.substring(0, index);
      const tokenFieldName = tokenLocation.substring(index + 1);
      const tokenToRemove = {};
      tokenToRemove[tokenFieldName] = hashedToken;
      const tokenRemovalQuery = {};
      tokenRemovalQuery[tokenPath] = tokenToRemove;
      Meteor.users.update(this.user._id, {
        $pull: tokenRemovalQuery
      });
      const response = {
        status: 'success',
        data: {
          message: 'You\'ve been logged out!'
        }
      }; // Call the logout hook with the authenticated user attached

      const extraData = self._config.onLoggedOut && self._config.onLoggedOut.call(this);

      if (extraData != null) {
        _.extend(response.data, {
          extra: extraData
        });
      }

      return response;
    };
    /*
    	Add a logout endpoint to the API
    	After the user is logged out, the onLoggedOut hook is called (see Restfully.configure() for
    	adding hook).
    */


    return this.addRoute('logout', {
      authRequired: true
    }, {
      get() {
        console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
        console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
        return logout.call(this);
      },

      post: logout
    });
  }

}

const getUserAuth = function _getUserAuth() {
  const invalidResults = [undefined, null, false];
  return {
    token: 'services.resume.loginTokens.hashedToken',

    user() {
      if (this.bodyParams && this.bodyParams.payload) {
        this.bodyParams = JSON.parse(this.bodyParams.payload);
      }

      for (let i = 0; i < RocketChat.API.v1.authMethods.length; i++) {
        const method = RocketChat.API.v1.authMethods[i];

        if (typeof method === 'function') {
          const result = method.apply(this, arguments);

          if (!invalidResults.includes(result)) {
            return result;
          }
        }
      }

      let token;

      if (this.request.headers['x-auth-token']) {
        token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
      }

      return {
        userId: this.request.headers['x-user-id'],
        token
      };
    }

  };
};

RocketChat.API = {
  helperMethods: new Map(),
  getUserAuth,
  ApiClass: API
};

const createApi = function _createApi(enableCors) {
  if (!RocketChat.API.v1 || RocketChat.API.v1._config.enableCors !== enableCors) {
    RocketChat.API.v1 = new API({
      version: 'v1',
      useDefaultAuth: true,
      prettyJson: process.env.NODE_ENV === 'development',
      enableCors,
      auth: getUserAuth()
    });
  }

  if (!RocketChat.API.default || RocketChat.API.default._config.enableCors !== enableCors) {
    RocketChat.API.default = new API({
      useDefaultAuth: true,
      prettyJson: process.env.NODE_ENV === 'development',
      enableCors,
      auth: getUserAuth()
    });
  }
}; // register the API to be re-created once the CORS-setting changes.


RocketChat.settings.get('API_Enable_CORS', (key, value) => {
  createApi(value);
}); // also create the API immediately

createApi(!!RocketChat.settings.get('API_Enable_CORS'));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/settings.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('General', function () {
  this.section('REST API', function () {
    this.add('API_Upper_Count_Limit', 100, {
      type: 'int',
      public: false
    });
    this.add('API_Default_Count', 50, {
      type: 'int',
      public: false
    });
    this.add('API_Allow_Infinite_Count', true, {
      type: 'boolean',
      public: false
    });
    this.add('API_Enable_Direct_Message_History_EndPoint', false, {
      type: 'boolean',
      public: false
    });
    this.add('API_Enable_Shields', true, {
      type: 'boolean',
      public: false
    });
    this.add('API_Shield_Types', '*', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'API_Enable_Shields',
        value: true
      }
    });
    this.add('API_Enable_CORS', false, {
      type: 'boolean',
      public: false
    });
    this.add('API_CORS_Origin', '*', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'API_Enable_CORS',
        value: true
      }
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers":{"requestParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/requestParams.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('requestParams', function _requestParams() {
  return ['POST', 'PUT'].includes(this.request.method) ? this.bodyParams : this.queryParams;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getPaginationItems.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getPaginationItems.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// If the count query param is higher than the "API_Upper_Count_Limit" setting, then we limit that
// If the count query param isn't defined, then we set it to the "API_Default_Count" setting
// If the count is zero, then that means unlimited and is only allowed if the setting "API_Allow_Infinite_Count" is true
RocketChat.API.helperMethods.set('getPaginationItems', function _getPaginationItems() {
  const hardUpperLimit = RocketChat.settings.get('API_Upper_Count_Limit') <= 0 ? 100 : RocketChat.settings.get('API_Upper_Count_Limit');
  const defaultCount = RocketChat.settings.get('API_Default_Count') <= 0 ? 50 : RocketChat.settings.get('API_Default_Count');
  const offset = this.queryParams.offset ? parseInt(this.queryParams.offset) : 0;
  let count = defaultCount; // Ensure count is an appropiate amount

  if (typeof this.queryParams.count !== 'undefined') {
    count = parseInt(this.queryParams.count);
  } else {
    count = defaultCount;
  }

  if (count > hardUpperLimit) {
    count = hardUpperLimit;
  }

  if (count === 0 && !RocketChat.settings.get('API_Allow_Infinite_Count')) {
    count = defaultCount;
  }

  return {
    offset,
    count
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUserFromParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getUserFromParams.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
//Convenience method, almost need to turn it into a middleware of sorts
RocketChat.API.helperMethods.set('getUserFromParams', function _getUserFromParams() {
  const doesntExist = {
    _doesntExist: true
  };
  let user;
  const params = this.requestParams();

  if (params.userId && params.userId.trim()) {
    user = RocketChat.models.Users.findOneById(params.userId) || doesntExist;
  } else if (params.username && params.username.trim()) {
    user = RocketChat.models.Users.findOneByUsername(params.username) || doesntExist;
  } else if (params.user && params.user.trim()) {
    user = RocketChat.models.Users.findOneByUsername(params.user) || doesntExist;
  } else {
    throw new Meteor.Error('error-user-param-not-provided', 'The required "userId" or "username" param was not provided');
  }

  if (user._doesntExist) {
    throw new Meteor.Error('error-invalid-user', 'The required "userId" or "username" param provided does not match any users');
  }

  return user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUserInfo.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getUserInfo.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const getInfoFromUserObject = user => {
  const {
    _id,
    name,
    emails,
    status,
    statusConnection,
    username,
    utcOffset,
    active,
    language,
    roles,
    settings
  } = user;
  return {
    _id,
    name,
    emails,
    status,
    statusConnection,
    username,
    utcOffset,
    active,
    language,
    roles,
    settings
  };
};

RocketChat.API.helperMethods.set('getUserInfo', function _getUserInfo(user) {
  const me = getInfoFromUserObject(user);

  const isVerifiedEmail = () => {
    if (me && me.emails && Array.isArray(me.emails)) {
      return me.emails.find(email => email.verified);
    }

    return false;
  };

  const getUserPreferences = () => {
    const defaultUserSettingPrefix = 'Accounts_Default_User_Preferences_';
    const allDefaultUserSettings = RocketChat.settings.get(new RegExp(`^${defaultUserSettingPrefix}.*$`));
    return allDefaultUserSettings.reduce((accumulator, setting) => {
      const settingWithoutPrefix = setting.key.replace(defaultUserSettingPrefix, ' ').trim();
      accumulator[settingWithoutPrefix] = RocketChat.getUserPreference(user, settingWithoutPrefix);
      return accumulator;
    }, {});
  };

  const verifiedEmail = isVerifiedEmail();
  me.email = verifiedEmail ? verifiedEmail.address : undefined;
  me.settings = {
    preferences: getUserPreferences()
  };
  return me;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"isUserFromParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/isUserFromParams.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('isUserFromParams', function _isUserFromParams() {
  const params = this.requestParams();
  return !params.userId && !params.username && !params.user || params.userId && this.userId === params.userId || params.username && this.user.username === params.username || params.user && this.user.username === params.user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"parseJsonQuery.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/parseJsonQuery.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('parseJsonQuery', function _parseJsonQuery() {
  let sort;

  if (this.queryParams.sort) {
    try {
      sort = JSON.parse(this.queryParams.sort);
    } catch (e) {
      this.logger.warn(`Invalid sort parameter provided "${this.queryParams.sort}":`, e);
      throw new Meteor.Error('error-invalid-sort', `Invalid sort parameter provided: "${this.queryParams.sort}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  }

  let fields;

  if (this.queryParams.fields) {
    try {
      fields = JSON.parse(this.queryParams.fields);
    } catch (e) {
      this.logger.warn(`Invalid fields parameter provided "${this.queryParams.fields}":`, e);
      throw new Meteor.Error('error-invalid-fields', `Invalid fields parameter provided: "${this.queryParams.fields}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  } // Verify the user's selected fields only contains ones which their role allows


  if (typeof fields === 'object') {
    let nonSelectableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);

    if (this.request.route.includes('/v1/users.')) {
      const getFields = () => Object.keys(RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') ? RocketChat.API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser : RocketChat.API.v1.limitedUserFieldsToExclude);

      nonSelectableFields = nonSelectableFields.concat(getFields());
    }

    Object.keys(fields).forEach(k => {
      if (nonSelectableFields.includes(k) || nonSelectableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
        delete fields[k];
      }
    });
  } // Limit the fields by default


  fields = Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude);

  if (this.request.route.includes('/v1/users.')) {
    if (RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info')) {
      fields = Object.assign(fields, RocketChat.API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser);
    } else {
      fields = Object.assign(fields, RocketChat.API.v1.limitedUserFieldsToExclude);
    }
  }

  let query;

  if (this.queryParams.query) {
    try {
      query = JSON.parse(this.queryParams.query);
    } catch (e) {
      this.logger.warn(`Invalid query parameter provided "${this.queryParams.query}":`, e);
      throw new Meteor.Error('error-invalid-query', `Invalid query parameter provided: "${this.queryParams.query}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  } // Verify the user has permission to query the fields they are


  if (typeof query === 'object') {
    let nonQueryableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);

    if (this.request.route.includes('/v1/users.')) {
      if (RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info')) {
        nonQueryableFields = nonQueryableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser));
      } else {
        nonQueryableFields = nonQueryableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExclude));
      }
    }

    Object.keys(query).forEach(k => {
      if (nonQueryableFields.includes(k) || nonQueryableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
        delete query[k];
      }
    });
  }

  return {
    sort,
    fields,
    query
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deprecationWarning.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/deprecationWarning.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

RocketChat.API.helperMethods.set('deprecationWarning', function _deprecationWarning({
  endpoint,
  versionWillBeRemove,
  response
}) {
  const warningMessage = `The endpoint "${endpoint}" is deprecated and will be removed after version ${versionWillBeRemove}`;
  console.warn(warningMessage);

  if (process.env.NODE_ENV === 'development') {
    return (0, _objectSpread2.default)({
      warning: warningMessage
    }, response);
  }

  return response;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getLoggedInUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getLoggedInUser.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('getLoggedInUser', function _getLoggedInUser() {
  let user;

  if (this.request.headers['x-auth-token'] && this.request.headers['x-user-id']) {
    user = RocketChat.models.Users.findOne({
      '_id': this.request.headers['x-user-id'],
      'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(this.request.headers['x-auth-token'])
    });
  }

  return user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"insertUserObject.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/insertUserObject.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('insertUserObject', function _addUserToObject({
  object,
  userId
}) {
  const user = RocketChat.models.Users.findOneById(userId);
  object.user = {};

  if (user) {
    object.user = {
      _id: userId,
      username: user.username,
      name: user.name
    };
  }

  return object;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"default":{"info.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/default/info.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.default.addRoute('info', {
  authRequired: false
}, {
  get() {
    const user = this.getLoggedInUser();

    if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
      return RocketChat.API.v1.success({
        info: RocketChat.Info
      });
    }

    return RocketChat.API.v1.success({
      version: RocketChat.Info.version
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"v1":{"channels.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/channels.js                                                                       //
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

//Returns the channel IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findChannelByIdOrName({
  params,
  checkedArchived = true,
  returnUsernames = false
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  const fields = (0, _objectSpread2.default)({}, RocketChat.API.v1.defaultFieldsToExclude);

  if (returnUsernames) {
    delete fields.usernames;
  }

  let room;

  if (params.roomId) {
    room = RocketChat.models.Rooms.findOneById(params.roomId, {
      fields
    });
  } else if (params.roomName) {
    room = RocketChat.models.Rooms.findOneByName(params.roomName, {
      fields
    });
  }

  if (!room || room.t !== 'c') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
  }

  if (checkedArchived && room.archived) {
    throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
  }

  return room;
}

RocketChat.API.v1.addRoute('channels.addAll', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addAllUserToRoom', findResult._id, this.bodyParams.activeUsersOnly);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.addModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomModerator', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.addOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomOwner', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.archive', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('archiveRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
/**
 DEPRECATED
 // TODO: Remove this after three versions have been released. That means at 0.67 this should be gone.
 **/

RocketChat.API.v1.addRoute('channels.cleanHistory', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (!this.bodyParams.latest) {
      return RocketChat.API.v1.failure('Body parameter "latest" is required.');
    }

    if (!this.bodyParams.oldest) {
      return RocketChat.API.v1.failure('Body parameter "oldest" is required.');
    }

    const latest = new Date(this.bodyParams.latest);
    const oldest = new Date(this.bodyParams.oldest);
    let inclusive = false;

    if (typeof this.bodyParams.inclusive !== 'undefined') {
      inclusive = this.bodyParams.inclusive;
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('cleanChannelHistory', {
        roomId: findResult._id,
        latest,
        oldest,
        inclusive
      });
    });
    return RocketChat.API.v1.success(this.deprecationWarning({
      endpoint: 'channels.cleanHistory',
      versionWillBeRemove: 'v0.67'
    }));
  }

});
RocketChat.API.v1.addRoute('channels.close', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

    if (!sub) {
      return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}.`);
    }

    if (!sub.open) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.counters', {
  authRequired: true
}, {
  get() {
    const access = RocketChat.authz.hasPermission(this.userId, 'view-room-administration');
    const ruserId = this.requestParams().userId;
    let user = this.userId;
    let unreads = null;
    let userMentions = null;
    let unreadsFrom = null;
    let joined = false;
    let msgs = null;
    let latest = null;
    let members = null;
    let lm = null;

    if (ruserId) {
      if (!access) {
        return RocketChat.API.v1.unauthorized();
      }

      user = ruserId;
    }

    const room = findChannelByIdOrName({
      params: this.requestParams(),
      returnUsernames: true
    });
    const channel = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user);
    lm = channel._room.lm ? channel._room.lm : channel._room._updatedAt;

    if (typeof channel !== 'undefined' && channel.open) {
      if (channel.ls) {
        unreads = RocketChat.models.Messages.countVisibleByRoomIdBetweenTimestampsInclusive(channel.rid, channel.ls, lm);
        unreadsFrom = channel.ls;
      }

      userMentions = channel.userMentions;
      joined = true;
    }

    if (access || joined) {
      msgs = room.msgs;
      latest = lm;
      members = room.usernames.length;
    }

    return RocketChat.API.v1.success({
      joined,
      members,
      unreads,
      unreadsFrom,
      msgs,
      latest,
      userMentions
    });
  }

}); // Channel -> create

function createChannelValidator(params) {
  if (!RocketChat.authz.hasPermission(params.user.value, 'create-c')) {
    throw new Error('unauthorized');
  }

  if (!params.name || !params.name.value) {
    throw new Error(`Param "${params.name.key}" is required`);
  }

  if (params.members && params.members.value && !_.isArray(params.members.value)) {
    throw new Error(`Param "${params.members.key}" must be an array if provided`);
  }

  if (params.customFields && params.customFields.value && !(typeof params.customFields.value === 'object')) {
    throw new Error(`Param "${params.customFields.key}" must be an object if provided`);
  }
}

function createChannel(userId, params) {
  let readOnly = false;

  if (typeof params.readOnly !== 'undefined') {
    readOnly = params.readOnly;
  }

  let id;
  Meteor.runAsUser(userId, () => {
    id = Meteor.call('createChannel', params.name, params.members ? params.members : [], readOnly, params.customFields);
  });
  return {
    channel: RocketChat.models.Rooms.findOneById(id.rid, {
      fields: RocketChat.API.v1.defaultFieldsToExclude
    })
  };
}

RocketChat.API.channels = {};
RocketChat.API.channels.create = {
  validate: createChannelValidator,
  execute: createChannel
};
RocketChat.API.v1.addRoute('channels.create', {
  authRequired: true
}, {
  post() {
    const userId = this.userId;
    const bodyParams = this.bodyParams;
    let error;

    try {
      RocketChat.API.channels.create.validate({
        user: {
          value: userId
        },
        name: {
          value: bodyParams.name,
          key: 'name'
        },
        members: {
          value: bodyParams.members,
          key: 'members'
        }
      });
    } catch (e) {
      if (e.message === 'unauthorized') {
        error = RocketChat.API.v1.unauthorized();
      } else {
        error = RocketChat.API.v1.failure(e.message);
      }
    }

    if (error) {
      return error;
    }

    return RocketChat.API.v1.success(RocketChat.API.channels.create.execute(userId, bodyParams));
  }

});
RocketChat.API.v1.addRoute('channels.delete', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('eraseRoom', findResult._id);
    });
    return RocketChat.API.v1.success({
      channel: findResult
    });
  }

});
RocketChat.API.v1.addRoute('channels.files', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });

    const addUserObjectToEveryObject = file => {
      if (file.userId) {
        file = this.insertUserObject({
          object: file,
          userId: file.userId
        });
      }

      return file;
    };

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('canAccessRoom', findResult._id, this.userId);
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult._id
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files: files.map(addUserObjectToEveryObject),
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.getIntegrations', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    let includeAllPublicChannels = true;

    if (typeof this.queryParams.includeAllPublicChannels !== 'undefined') {
      includeAllPublicChannels = this.queryParams.includeAllPublicChannels === 'true';
    }

    let ourQuery = {
      channel: `#${findResult.name}`
    };

    if (includeAllPublicChannels) {
      ourQuery.channel = {
        $in: [ourQuery.channel, 'all_public_channels']
      };
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    ourQuery = Object.assign({}, query, ourQuery);
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        _createdAt: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      count: integrations.length,
      offset,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.history', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult._id,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('channels.info', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.invite', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addUserToRoom', {
        rid: findResult._id,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.join', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('joinRoom', findResult._id, this.bodyParams.joinCode);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.kick', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeUserFromRoom', {
        rid: findResult._id,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.leave', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('leaveRoom', findResult._id);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.list', {
  authRequired: true
}, {
  get: {
    //This is defined as such only to provide an example of how the routes can be defined :X
    action() {
      const {
        offset,
        count
      } = this.getPaginationItems();
      const {
        sort,
        fields,
        query
      } = this.parseJsonQuery();
      const hasPermissionToSeeAllPublicChannels = RocketChat.authz.hasPermission(this.userId, 'view-c-room');
      const ourQuery = Object.assign({}, query, {
        t: 'c'
      });

      if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room') && !hasPermissionToSeeAllPublicChannels) {
        ourQuery.usernames = {
          $in: [this.user.username]
        };
      } else if (!hasPermissionToSeeAllPublicChannels) {
        return RocketChat.API.v1.unauthorized();
      }

      const rooms = RocketChat.models.Rooms.find(ourQuery, {
        sort: sort ? sort : {
          name: 1
        },
        skip: offset,
        limit: count,
        fields
      }).fetch();
      return RocketChat.API.v1.success({
        channels: rooms,
        count: rooms.length,
        offset,
        total: RocketChat.models.Rooms.find(ourQuery).count()
      });
    }

  }
});
RocketChat.API.v1.addRoute('channels.list.joined', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'c',
      'u._id': this.userId
    });

    let rooms = _.pluck(RocketChat.models.Subscriptions.find(ourQuery).fetch(), '_room');

    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      channels: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('channels.members', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false,
      returnUsernames: true
    });

    if (findResult.broadcast && !RocketChat.authz.hasPermission(this.userId, 'view-broadcast-member-list')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();
    const shouldBeOrderedDesc = Match.test(sort, Object) && Match.test(sort.username, Number) && sort.username === -1;
    let members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult.usernames).sort(), {
      skip: offset,
      limit: count
    });

    if (shouldBeOrderedDesc) {
      members = members.reverse();
    }

    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      },
      sort: sort ? sort : {
        username: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: users.length,
      offset,
      total: findResult.usernames.length
    });
  }

});
RocketChat.API.v1.addRoute('channels.messages', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false,
      returnUsernames: true
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult._id
    }); //Special check for the permissions

    if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room') && !findResult.usernames.includes(this.user.username)) {
      return RocketChat.API.v1.unauthorized();
    } else if (!RocketChat.authz.hasPermission(this.userId, 'view-c-room')) {
      return RocketChat.API.v1.unauthorized();
    }

    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.online', {
  authRequired: true
}, {
  get() {
    const {
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'c'
    });
    const room = RocketChat.models.Rooms.findOne(ourQuery);

    if (room == null) {
      return RocketChat.API.v1.failure('Channel does not exists');
    }

    const online = RocketChat.models.Users.findUsersNotOffline({
      fields: {
        username: 1
      }
    }).fetch();
    const onlineInRoom = [];
    online.forEach(user => {
      if (room.usernames.indexOf(user.username) !== -1) {
        onlineInRoom.push({
          _id: user._id,
          username: user.username
        });
      }
    });
    return RocketChat.API.v1.success({
      online: onlineInRoom
    });
  }

});
RocketChat.API.v1.addRoute('channels.open', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

    if (!sub) {
      return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}".`);
    }

    if (sub.open) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already open to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('openRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.removeModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomModerator', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.removeOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomOwner', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.rename', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "name" is required');
    }

    const findResult = findChannelByIdOrName({
      params: {
        roomId: this.bodyParams.roomId
      }
    });

    if (findResult.name === this.bodyParams.name) {
      return RocketChat.API.v1.failure('The channel name is the same as what it would be renamed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomName', this.bodyParams.name);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setCustomFields', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.customFields || !(typeof this.bodyParams.customFields === 'object')) {
      return RocketChat.API.v1.failure('The bodyParam "customFields" is required with a type like object.');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomCustomFields', this.bodyParams.customFields);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setDefault', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.default === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "default" is required', 'error-channels-setdefault-is-same');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.default === this.bodyParams.default) {
      return RocketChat.API.v1.failure('The channel default setting is the same as what it would be changed to.', 'error-channels-setdefault-missing-default-param');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'default', this.bodyParams.default.toString());
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setDescription', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "description" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.description === this.bodyParams.description) {
      return RocketChat.API.v1.failure('The channel description is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.description);
    });
    return RocketChat.API.v1.success({
      description: this.bodyParams.description
    });
  }

});
RocketChat.API.v1.addRoute('channels.setJoinCode', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.joinCode || !this.bodyParams.joinCode.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "joinCode" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'joinCode', this.bodyParams.joinCode);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setPurpose', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.description === this.bodyParams.purpose) {
      return RocketChat.API.v1.failure('The channel purpose (description) is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.purpose);
    });
    return RocketChat.API.v1.success({
      purpose: this.bodyParams.purpose
    });
  }

});
RocketChat.API.v1.addRoute('channels.setReadOnly', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.readOnly === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.ro === this.bodyParams.readOnly) {
      return RocketChat.API.v1.failure('The channel read only setting is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'readOnly', this.bodyParams.readOnly);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setTopic', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.topic === this.bodyParams.topic) {
      return RocketChat.API.v1.failure('The channel topic is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
RocketChat.API.v1.addRoute('channels.setAnnouncement', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.announcement || !this.bodyParams.announcement.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "announcement" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomAnnouncement', this.bodyParams.announcement);
    });
    return RocketChat.API.v1.success({
      announcement: this.bodyParams.announcement
    });
  }

});
RocketChat.API.v1.addRoute('channels.setType', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "type" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.t === this.bodyParams.type) {
      return RocketChat.API.v1.failure('The channel type is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomType', this.bodyParams.type);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.unarchive', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });

    if (!findResult.archived) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is not archived`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('unarchiveRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.getAllUserMentionsByChannel', {
  authRequired: true
}, {
  get() {
    const {
      roomId
    } = this.requestParams();
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();

    if (!roomId) {
      return RocketChat.API.v1.failure('The request param "roomId" is required');
    }

    const mentions = Meteor.runAsUser(this.userId, () => Meteor.call('getUserMentionsByChannel', {
      roomId,
      options: {
        sort: sort ? sort : {
          ts: 1
        },
        skip: offset,
        limit: count
      }
    }));
    const allMentions = Meteor.runAsUser(this.userId, () => Meteor.call('getUserMentionsByChannel', {
      roomId,
      options: {}
    }));
    return RocketChat.API.v1.success({
      mentions,
      count: mentions.length,
      offset,
      total: allMentions.length
    });
  }

});
RocketChat.API.v1.addRoute('channels.roles', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const roles = Meteor.runAsUser(this.userId, () => Meteor.call('getRoomRoles', findResult._id));
    return RocketChat.API.v1.success({
      roles
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/rooms.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let Busboy;
module.watch(require("busboy"), {
  default(v) {
    Busboy = v;
  }

}, 0);

function findRoomByIdOrName({
  params,
  checkedArchived = true
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  const fields = (0, _objectSpread2.default)({}, RocketChat.API.v1.defaultFieldsToExclude);
  let room;

  if (params.roomId) {
    room = RocketChat.models.Rooms.findOneById(params.roomId, {
      fields
    });
  } else if (params.roomName) {
    room = RocketChat.models.Rooms.findOneByName(params.roomName, {
      fields
    });
  }

  if (!room) {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
  }

  if (checkedArchived && room.archived) {
    throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
  }

  return room;
}

RocketChat.API.v1.addRoute('rooms.get', {
  authRequired: true
}, {
  get() {
    const {
      updatedSince
    } = this.queryParams;
    let updatedSinceDate;

    if (updatedSince) {
      if (isNaN(Date.parse(updatedSince))) {
        throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
      } else {
        updatedSinceDate = new Date(updatedSince);
      }
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('rooms/get', updatedSinceDate));

    if (Array.isArray(result)) {
      result = {
        update: result,
        remove: []
      };
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('rooms.upload/:rid', {
  authRequired: true
}, {
  post() {
    const room = Meteor.call('canAccessRoom', this.urlParams.rid, this.userId);

    if (!room) {
      return RocketChat.API.v1.unauthorized();
    }

    const busboy = new Busboy({
      headers: this.request.headers
    });
    const files = [];
    const fields = {};
    Meteor.wrapAsync(callback => {
      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (fieldname !== 'file') {
          return files.push(new Meteor.Error('invalid-field'));
        }

        const fileDate = [];
        file.on('data', data => fileDate.push(data));
        file.on('end', () => {
          files.push({
            fieldname,
            file,
            filename,
            encoding,
            mimetype,
            fileBuffer: Buffer.concat(fileDate)
          });
        });
      });
      busboy.on('field', (fieldname, value) => fields[fieldname] = value);
      busboy.on('finish', Meteor.bindEnvironment(() => callback()));
      this.request.pipe(busboy);
    })();

    if (files.length === 0) {
      return RocketChat.API.v1.failure('File required');
    }

    if (files.length > 1) {
      return RocketChat.API.v1.failure('Just 1 file is allowed');
    }

    const file = files[0];
    const fileStore = FileUpload.getStore('Uploads');
    const details = {
      name: file.filename,
      size: file.fileBuffer.length,
      type: file.mimetype,
      rid: this.urlParams.rid,
      userId: this.userId
    };
    Meteor.runAsUser(this.userId, () => {
      const uploadedFile = Meteor.wrapAsync(fileStore.insert.bind(fileStore))(details, file.fileBuffer);
      uploadedFile.description = fields.description;
      delete fields.description;
      RocketChat.API.v1.success(Meteor.call('sendFileMessage', this.urlParams.rid, null, uploadedFile, fields));
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('rooms.saveNotification', {
  authRequired: true
}, {
  post() {
    const saveNotifications = (notifications, roomId) => {
      Object.keys(notifications).map(notificationKey => {
        Meteor.runAsUser(this.userId, () => Meteor.call('saveNotificationSettings', roomId, notificationKey, notifications[notificationKey]));
      });
    };

    const {
      roomId,
      notifications
    } = this.bodyParams;

    if (!roomId) {
      return RocketChat.API.v1.failure('The \'roomId\' param is required');
    }

    if (!notifications || Object.keys(notifications).length === 0) {
      return RocketChat.API.v1.failure('The \'notifications\' param is required');
    }

    saveNotifications(notifications, roomId);
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('rooms.favorite', {
  authRequired: true
}, {
  post() {
    const {
      favorite
    } = this.bodyParams;

    if (!this.bodyParams.hasOwnProperty('favorite')) {
      return RocketChat.API.v1.failure('The \'favorite\' param is required');
    }

    const room = findRoomByIdOrName({
      params: this.bodyParams
    });
    Meteor.runAsUser(this.userId, () => Meteor.call('toggleFavorite', room._id, favorite));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('rooms.cleanHistory', {
  authRequired: true
}, {
  post() {
    const findResult = findRoomByIdOrName({
      params: this.bodyParams
    });

    if (!this.bodyParams.latest) {
      return RocketChat.API.v1.failure('Body parameter "latest" is required.');
    }

    if (!this.bodyParams.oldest) {
      return RocketChat.API.v1.failure('Body parameter "oldest" is required.');
    }

    const latest = new Date(this.bodyParams.latest);
    const oldest = new Date(this.bodyParams.oldest);
    let inclusive = false;

    if (typeof this.bodyParams.inclusive !== 'undefined') {
      inclusive = this.bodyParams.inclusive;
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('cleanRoomHistory', {
        roomId: findResult._id,
        latest,
        oldest,
        inclusive
      });
    });
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"subscriptions.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/subscriptions.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('subscriptions.get', {
  authRequired: true
}, {
  get() {
    const {
      updatedSince
    } = this.queryParams;
    let updatedSinceDate;

    if (updatedSince) {
      if (isNaN(Date.parse(updatedSince))) {
        throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
      } else {
        updatedSinceDate = new Date(updatedSince);
      }
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('subscriptions/get', updatedSinceDate));

    if (Array.isArray(result)) {
      result = {
        update: result,
        remove: []
      };
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('subscriptions.getOne', {
  authRequired: true
}, {
  get() {
    const {
      roomId
    } = this.requestParams();

    if (!roomId) {
      return RocketChat.API.v1.failure('The \'roomId\' param is required');
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId, {
      fields: {
        _room: 0,
        _user: 0,
        $loki: 0
      }
    });
    return RocketChat.API.v1.success({
      subscription
    });
  }

});
/**
	This API is suppose to mark any room as read.

	Method: POST
	Route: api/v1/subscriptions.read
	Params:
		- rid: The rid of the room to be marked as read.
 */

RocketChat.API.v1.addRoute('subscriptions.read', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      rid: String
    });
    Meteor.runAsUser(this.userId, () => Meteor.call('readMessages', this.bodyParams.rid));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('subscriptions.unread', {
  authRequired: true
}, {
  post() {
    const {
      roomId,
      firstUnreadMessage
    } = this.bodyParams;

    if (!roomId && firstUnreadMessage && !firstUnreadMessage._id) {
      return RocketChat.API.v1.failure('At least one of "roomId" or "firstUnreadMessage._id" params is required');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('unreadMessages', firstUnreadMessage, roomId));
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chat.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/chat.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global processWebhookMessage */
RocketChat.API.v1.addRoute('chat.delete', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      msgId: String,
      roomId: String,
      asUser: Match.Maybe(Boolean)
    }));
    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId, {
      fields: {
        u: 1,
        rid: 1
      }
    });

    if (!msg) {
      return RocketChat.API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
    }

    if (this.bodyParams.roomId !== msg.rid) {
      return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
    }

    if (this.bodyParams.asUser && msg.u._id !== this.userId && !RocketChat.authz.hasPermission(Meteor.userId(), 'force-delete-message', msg.rid)) {
      return RocketChat.API.v1.failure('Unauthorized. You must have the permission "force-delete-message" to delete other\'s message as them.');
    }

    Meteor.runAsUser(this.bodyParams.asUser ? msg.u._id : this.userId, () => {
      Meteor.call('deleteMessage', {
        _id: msg._id
      });
    });
    return RocketChat.API.v1.success({
      _id: msg._id,
      ts: Date.now(),
      message: msg
    });
  }

});
RocketChat.API.v1.addRoute('chat.syncMessages', {
  authRequired: true
}, {
  get() {
    const {
      roomId,
      lastUpdate
    } = this.queryParams;

    if (!roomId) {
      throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
    }

    if (!lastUpdate) {
      throw new Meteor.Error('error-lastUpdate-param-not-provided', 'The required "lastUpdate" query param is missing.');
    } else if (isNaN(Date.parse(lastUpdate))) {
      throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('messages/get', roomId, {
        lastUpdate: new Date(lastUpdate)
      });
    });

    if (!result) {
      return RocketChat.API.v1.failure();
    }

    return RocketChat.API.v1.success({
      result
    });
  }

});
RocketChat.API.v1.addRoute('chat.getMessage', {
  authRequired: true
}, {
  get() {
    if (!this.queryParams.msgId) {
      return RocketChat.API.v1.failure('The "msgId" query parameter must be provided.');
    }

    let msg;
    Meteor.runAsUser(this.userId, () => {
      msg = Meteor.call('getSingleMessage', this.queryParams.msgId);
    });

    if (!msg) {
      return RocketChat.API.v1.failure();
    }

    return RocketChat.API.v1.success({
      message: msg
    });
  }

});
RocketChat.API.v1.addRoute('chat.pinMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    let pinnedMessage;
    Meteor.runAsUser(this.userId, () => pinnedMessage = Meteor.call('pinMessage', msg));
    return RocketChat.API.v1.success({
      message: pinnedMessage
    });
  }

});
RocketChat.API.v1.addRoute('chat.postMessage', {
  authRequired: true
}, {
  post() {
    const messageReturn = processWebhookMessage(this.bodyParams, this.user, undefined, true)[0];

    if (!messageReturn) {
      return RocketChat.API.v1.failure('unknown-error');
    }

    return RocketChat.API.v1.success({
      ts: Date.now(),
      channel: messageReturn.channel,
      message: messageReturn.message
    });
  }

});
RocketChat.API.v1.addRoute('chat.search', {
  authRequired: true
}, {
  get() {
    const {
      roomId,
      searchText,
      limit
    } = this.queryParams;

    if (!roomId) {
      throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
    }

    if (!searchText) {
      throw new Meteor.Error('error-searchText-param-not-provided', 'The required "searchText" query param is missing.');
    }

    if (limit && (typeof limit !== 'number' || isNaN(limit) || limit <= 0)) {
      throw new Meteor.Error('error-limit-param-invalid', 'The "limit" query parameter must be a valid number and be greater than 0.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('messageSearch', searchText, roomId, limit).message.docs);
    return RocketChat.API.v1.success({
      messages: result
    });
  }

}); // The difference between `chat.postMessage` and `chat.sendMessage` is that `chat.sendMessage` allows
// for passing a value for `_id` and the other one doesn't. Also, `chat.sendMessage` only sends it to
// one channel whereas the other one allows for sending to more than one channel at a time.

RocketChat.API.v1.addRoute('chat.sendMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.message) {
      throw new Meteor.Error('error-invalid-params', 'The "message" parameter must be provided.');
    }

    let message;
    Meteor.runAsUser(this.userId, () => message = Meteor.call('sendMessage', this.bodyParams.message));
    return RocketChat.API.v1.success({
      message
    });
  }

});
RocketChat.API.v1.addRoute('chat.starMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
      _id: msg._id,
      rid: msg.rid,
      starred: true
    }));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.unPinMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('unpinMessage', msg));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.unStarMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
      _id: msg._id,
      rid: msg.rid,
      starred: false
    }));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.update', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      roomId: String,
      msgId: String,
      text: String //Using text to be consistant with chat.postMessage

    }));
    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId); //Ensure the message exists

    if (!msg) {
      return RocketChat.API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
    }

    if (this.bodyParams.roomId !== msg.rid) {
      return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
    } //Permission checks are already done in the updateMessage method, so no need to duplicate them


    Meteor.runAsUser(this.userId, () => {
      Meteor.call('updateMessage', {
        _id: msg._id,
        msg: this.bodyParams.text,
        rid: msg.rid
      });
    });
    return RocketChat.API.v1.success({
      message: RocketChat.models.Messages.findOneById(msg._id)
    });
  }

});
RocketChat.API.v1.addRoute('chat.react', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    const emoji = this.bodyParams.emoji || this.bodyParams.reaction;

    if (!emoji) {
      throw new Meteor.Error('error-emoji-param-not-provided', 'The required "emoji" param is missing.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('setReaction', emoji, msg._id, this.bodyParams.shouldReact));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.getMessageReadReceipts', {
  authRequired: true
}, {
  get() {
    const {
      messageId
    } = this.queryParams;

    if (!messageId) {
      return RocketChat.API.v1.failure({
        error: 'The required \'messageId\' param is missing.'
      });
    }

    try {
      const messageReadReceipts = Meteor.runAsUser(this.userId, () => Meteor.call('getReadReceipts', {
        messageId
      }));
      return RocketChat.API.v1.success({
        receipts: messageReadReceipts
      });
    } catch (error) {
      return RocketChat.API.v1.failure({
        error: error.message
      });
    }
  }

});
RocketChat.API.v1.addRoute('chat.reportMessage', {
  authRequired: true
}, {
  post() {
    const {
      messageId,
      description
    } = this.bodyParams;

    if (!messageId) {
      return RocketChat.API.v1.failure('The required "messageId" param is missing.');
    }

    if (!description) {
      return RocketChat.API.v1.failure('The required "description" param is missing.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('reportMessage', messageId, description));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.ignoreUser', {
  authRequired: true
}, {
  get() {
    const {
      rid,
      userId
    } = this.queryParams;
    let {
      ignore = true
    } = this.queryParams;
    ignore = typeof ignore === 'string' ? /true|1/.test(ignore) : ignore;

    if (!rid || !rid.trim()) {
      throw new Meteor.Error('error-room-id-param-not-provided', 'The required "rid" param is missing.');
    }

    if (!userId || !userId.trim()) {
      throw new Meteor.Error('error-user-id-param-not-provided', 'The required "userId" param is missing.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('ignoreUser', {
      rid,
      userId,
      ignore
    }));
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"commands.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/commands.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('commands.get', {
  authRequired: true
}, {
  get() {
    const params = this.queryParams;

    if (typeof params.command !== 'string') {
      return RocketChat.API.v1.failure('The query param "command" must be provided.');
    }

    const cmd = RocketChat.slashCommands.commands[params.command.toLowerCase()];

    if (!cmd) {
      return RocketChat.API.v1.failure(`There is no command in the system by the name of: ${params.command}`);
    }

    return RocketChat.API.v1.success({
      command: cmd
    });
  }

});
RocketChat.API.v1.addRoute('commands.list', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let commands = Object.values(RocketChat.slashCommands.commands);

    if (query && query.command) {
      commands = commands.filter(command => command.command === query.command);
    }

    const totalCount = commands.length;
    commands = RocketChat.models.Rooms.processQueryOptionsOnResult(commands, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      commands,
      offset,
      count: commands.length,
      total: totalCount
    });
  }

}); // Expects a body of: { command: 'gimme', params: 'any string value', roomId: 'value' }

RocketChat.API.v1.addRoute('commands.run', {
  authRequired: true
}, {
  post() {
    const body = this.bodyParams;
    const user = this.getLoggedInUser();

    if (typeof body.command !== 'string') {
      return RocketChat.API.v1.failure('You must provide a command to run.');
    }

    if (body.params && typeof body.params !== 'string') {
      return RocketChat.API.v1.failure('The parameters for the command must be a single string.');
    }

    if (typeof body.roomId !== 'string') {
      return RocketChat.API.v1.failure('The room\'s id where to execute this command must be provided and be a string.');
    }

    const cmd = body.command.toLowerCase();

    if (!RocketChat.slashCommands.commands[body.command.toLowerCase()]) {
      return RocketChat.API.v1.failure('The command provided does not exist (or is disabled).');
    } // This will throw an error if they can't or the room is invalid


    Meteor.call('canAccessRoom', body.roomId, user._id);
    const params = body.params ? body.params : '';
    let result;
    Meteor.runAsUser(user._id, () => {
      result = RocketChat.slashCommands.run(cmd, params, {
        _id: Random.id(),
        rid: body.roomId,
        msg: `/${cmd} ${params}`
      });
    });
    return RocketChat.API.v1.success({
      result
    });
  }

});
RocketChat.API.v1.addRoute('commands.preview', {
  authRequired: true
}, {
  // Expects these query params: command: 'giphy', params: 'mine', roomId: 'value'
  get() {
    const query = this.queryParams;
    const user = this.getLoggedInUser();

    if (typeof query.command !== 'string') {
      return RocketChat.API.v1.failure('You must provide a command to get the previews from.');
    }

    if (query.params && typeof query.params !== 'string') {
      return RocketChat.API.v1.failure('The parameters for the command must be a single string.');
    }

    if (typeof query.roomId !== 'string') {
      return RocketChat.API.v1.failure('The room\'s id where the previews are being displayed must be provided and be a string.');
    }

    const cmd = query.command.toLowerCase();

    if (!RocketChat.slashCommands.commands[cmd]) {
      return RocketChat.API.v1.failure('The command provided does not exist (or is disabled).');
    } // This will throw an error if they can't or the room is invalid


    Meteor.call('canAccessRoom', query.roomId, user._id);
    const params = query.params ? query.params : '';
    let preview;
    Meteor.runAsUser(user._id, () => {
      preview = Meteor.call('getSlashCommandPreviews', {
        cmd,
        params,
        msg: {
          rid: query.roomId
        }
      });
    });
    return RocketChat.API.v1.success({
      preview
    });
  },

  // Expects a body format of: { command: 'giphy', params: 'mine', roomId: 'value', previewItem: { id: 'sadf8' type: 'image', value: 'https://dev.null/gif } }
  post() {
    const body = this.bodyParams;
    const user = this.getLoggedInUser();

    if (typeof body.command !== 'string') {
      return RocketChat.API.v1.failure('You must provide a command to run the preview item on.');
    }

    if (body.params && typeof body.params !== 'string') {
      return RocketChat.API.v1.failure('The parameters for the command must be a single string.');
    }

    if (typeof body.roomId !== 'string') {
      return RocketChat.API.v1.failure('The room\'s id where the preview is being executed in must be provided and be a string.');
    }

    if (typeof body.previewItem === 'undefined') {
      return RocketChat.API.v1.failure('The preview item being executed must be provided.');
    }

    if (!body.previewItem.id || !body.previewItem.type || typeof body.previewItem.value === 'undefined') {
      return RocketChat.API.v1.failure('The preview item being executed is in the wrong format.');
    }

    const cmd = body.command.toLowerCase();

    if (!RocketChat.slashCommands.commands[cmd]) {
      return RocketChat.API.v1.failure('The command provided does not exist (or is disabled).');
    } // This will throw an error if they can't or the room is invalid


    Meteor.call('canAccessRoom', body.roomId, user._id);
    const params = body.params ? body.params : '';
    Meteor.runAsUser(user._id, () => {
      Meteor.call('executeSlashCommandPreview', {
        cmd,
        params,
        msg: {
          rid: body.roomId
        }
      }, body.previewItem);
    });
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"emoji-custom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/emoji-custom.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('emoji-custom', {
  authRequired: true
}, {
  get() {
    const emojis = Meteor.call('listEmojiCustom');
    return RocketChat.API.v1.success({
      emojis
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"groups.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/groups.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

//Returns the private group subscription IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findPrivateGroupByIdOrName({
  params,
  userId,
  checkedArchived = true
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  let roomSub;

  if (params.roomId) {
    roomSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(params.roomId, userId);
  } else if (params.roomName) {
    roomSub = RocketChat.models.Subscriptions.findOneByRoomNameAndUserId(params.roomName, userId);
  }

  if (!roomSub || roomSub.t !== 'p') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
  }

  if (checkedArchived && roomSub.archived) {
    throw new Meteor.Error('error-room-archived', `The private group, ${roomSub.name}, is archived`);
  }

  return roomSub;
}

RocketChat.API.v1.addRoute('groups.addAll', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addAllUserToRoom', findResult.rid, this.bodyParams.activeUsersOnly);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.addModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomModerator', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.addOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomOwner', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.addLeader', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomLeader', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

}); //Archives a private group only if it wasn't

RocketChat.API.v1.addRoute('groups.archive', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('archiveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.close', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    if (!findResult.open) {
      return RocketChat.API.v1.failure(`The private group, ${findResult.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.counters', {
  authRequired: true
}, {
  get() {
    const access = RocketChat.authz.hasPermission(this.userId, 'view-room-administration');
    const params = this.requestParams();
    let user = this.userId;
    let room;
    let unreads = null;
    let userMentions = null;
    let unreadsFrom = null;
    let joined = false;
    let msgs = null;
    let latest = null;
    let members = null;
    let lm = null;

    if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
      throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
    }

    if (params.roomId) {
      room = RocketChat.models.Rooms.findOneById(params.roomId);
    } else if (params.roomName) {
      room = RocketChat.models.Rooms.findOneByName(params.roomName);
    }

    if (!room || room.t !== 'p') {
      throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
    }

    if (room.archived) {
      throw new Meteor.Error('error-room-archived', `The private group, ${room.name}, is archived`);
    }

    if (params.userId) {
      if (!access) {
        return RocketChat.API.v1.unauthorized();
      }

      user = params.userId;
    }

    const group = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user);
    lm = group._room.lm ? group._room.lm : group._room._updatedAt;

    if (typeof group !== 'undefined' && group.open) {
      if (group.ls) {
        unreads = RocketChat.models.Messages.countVisibleByRoomIdBetweenTimestampsInclusive(group.rid, group.ls, lm);
        unreadsFrom = group.ls;
      }

      userMentions = group.userMentions;
      joined = true;
    }

    if (access || joined) {
      msgs = room.msgs;
      latest = lm;
      members = room.usernames.length;
    }

    return RocketChat.API.v1.success({
      joined,
      members,
      unreads,
      unreadsFrom,
      msgs,
      latest,
      userMentions
    });
  }

}); //Create Private Group

RocketChat.API.v1.addRoute('groups.create', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'create-p')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.bodyParams.name) {
      return RocketChat.API.v1.failure('Body param "name" is required');
    }

    if (this.bodyParams.members && !_.isArray(this.bodyParams.members)) {
      return RocketChat.API.v1.failure('Body param "members" must be an array if provided');
    }

    if (this.bodyParams.customFields && !(typeof this.bodyParams.customFields === 'object')) {
      return RocketChat.API.v1.failure('Body param "customFields" must be an object if provided');
    }

    let readOnly = false;

    if (typeof this.bodyParams.readOnly !== 'undefined') {
      readOnly = this.bodyParams.readOnly;
    }

    let id;
    Meteor.runAsUser(this.userId, () => {
      id = Meteor.call('createPrivateGroup', this.bodyParams.name, this.bodyParams.members ? this.bodyParams.members : [], readOnly, this.bodyParams.customFields);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(id.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.delete', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('eraseRoom', findResult.rid);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.processQueryOptionsOnResult([findResult._room], {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })[0]
    });
  }

});
RocketChat.API.v1.addRoute('groups.files', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    const addUserObjectToEveryObject = file => {
      if (file.userId) {
        file = this.insertUserObject({
          object: file,
          userId: file.userId
        });
      }

      return file;
    };

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult.rid
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files: files.map(addUserObjectToEveryObject),
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.getIntegrations', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    let includeAllPrivateGroups = true;

    if (typeof this.queryParams.includeAllPrivateGroups !== 'undefined') {
      includeAllPrivateGroups = this.queryParams.includeAllPrivateGroups === 'true';
    }

    const channelsToSearch = [`#${findResult.name}`];

    if (includeAllPrivateGroups) {
      channelsToSearch.push('all_private_groups');
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      channel: {
        $in: channelsToSearch
      }
    });
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        _createdAt: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      count: integrations.length,
      offset,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.history', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult.rid,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('groups.info', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.invite', {
  authRequired: true
}, {
  post() {
    const {
      roomId = '',
      roomName = ''
    } = this.requestParams();
    const idOrName = roomId || roomName;

    if (!idOrName.trim()) {
      throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
    }

    const {
      _id: rid,
      t: type
    } = RocketChat.models.Rooms.findOneByIdOrName(idOrName) || {};

    if (!rid || type !== 'p') {
      throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
    }

    const {
      username
    } = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => Meteor.call('addUserToRoom', {
      rid,
      username
    }));
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.kick', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeUserFromRoom', {
        rid: findResult.rid,
        username: user.username
      });
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.leave', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('leaveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

}); //List Private Groups a user has access to

RocketChat.API.v1.addRoute('groups.list', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'p',
      'u._id': this.userId
    });

    let rooms = _.pluck(RocketChat.models.Subscriptions.find(ourQuery).fetch(), '_room');

    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      groups: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('groups.listAll', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'p'
    });
    let rooms = RocketChat.models.Rooms.find(ourQuery).fetch();
    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      groups: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('groups.members', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });

    if (findResult._room.broadcast && !RocketChat.authz.hasPermission(this.userId, 'view-broadcast-member-list')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();

    let sortFn = (a, b) => a > b;

    if (Match.test(sort, Object) && Match.test(sort.username, Number) && sort.username === -1) {
      sortFn = (a, b) => b < a;
    }

    const members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult._room.usernames).sort(sortFn), {
      skip: offset,
      limit: count
    });
    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      },
      sort: sort ? sort : {
        username: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: members.length,
      offset,
      total: findResult._room.usernames.length
    });
  }

});
RocketChat.API.v1.addRoute('groups.messages', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult.rid
    });
    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.online', {
  authRequired: true
}, {
  get() {
    const {
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'p'
    });
    const room = RocketChat.models.Rooms.findOne(ourQuery);

    if (room == null) {
      return RocketChat.API.v1.failure('Group does not exists');
    }

    const online = RocketChat.models.Users.findUsersNotOffline({
      fields: {
        username: 1
      }
    }).fetch();
    const onlineInRoom = [];
    online.forEach(user => {
      if (room.usernames.indexOf(user.username) !== -1) {
        onlineInRoom.push({
          _id: user._id,
          username: user.username
        });
      }
    });
    return RocketChat.API.v1.success({
      online: onlineInRoom
    });
  }

});
RocketChat.API.v1.addRoute('groups.open', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    if (findResult.open) {
      return RocketChat.API.v1.failure(`The private group, ${findResult.name}, is already open for the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('openRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomModerator', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomOwner', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeLeader', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomLeader', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.rename', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "name" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: {
        roomId: this.bodyParams.roomId
      },
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomName', this.bodyParams.name);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setCustomFields', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.customFields || !(typeof this.bodyParams.customFields === 'object')) {
      return RocketChat.API.v1.failure('The bodyParam "customFields" is required with a type like object.');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomCustomFields', this.bodyParams.customFields);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setDescription', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "description" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.description);
    });
    return RocketChat.API.v1.success({
      description: this.bodyParams.description
    });
  }

});
RocketChat.API.v1.addRoute('groups.setPurpose', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.purpose);
    });
    return RocketChat.API.v1.success({
      purpose: this.bodyParams.purpose
    });
  }

});
RocketChat.API.v1.addRoute('groups.setReadOnly', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.readOnly === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });

    if (findResult.ro === this.bodyParams.readOnly) {
      return RocketChat.API.v1.failure('The private group read only setting is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'readOnly', this.bodyParams.readOnly);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setTopic', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
RocketChat.API.v1.addRoute('groups.setType', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "type" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });

    if (findResult.t === this.bodyParams.type) {
      return RocketChat.API.v1.failure('The private group type is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomType', this.bodyParams.type);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.unarchive', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('unarchiveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.roles', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const roles = Meteor.runAsUser(this.userId, () => Meteor.call('getRoomRoles', findResult.rid));
    return RocketChat.API.v1.success({
      roles
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"im.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/im.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

function findDirectMessageRoom(params, user) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.username || !params.username.trim())) {
    throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" or "username" is required');
  }

  const room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
    currentUserId: user._id,
    nameOrId: params.username || params.roomId,
    type: 'd'
  });

  if (!room || room.t !== 'd') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "username" param provided does not match any dirct message');
  }

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
  return {
    room,
    subscription
  };
}

RocketChat.API.v1.addRoute(['dm.create', 'im.create'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    return RocketChat.API.v1.success({
      room: findResult.room
    });
  }

});
RocketChat.API.v1.addRoute(['dm.close', 'im.close'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    if (!findResult.subscription.open) {
      return RocketChat.API.v1.failure(`The direct message room, ${this.bodyParams.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult.room._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute(['dm.counters', 'im.counters'], {
  authRequired: true
}, {
  get() {
    const access = RocketChat.authz.hasPermission(this.userId, 'view-room-administration');
    const ruserId = this.requestParams().userId;
    let user = this.userId;
    let unreads = null;
    let userMentions = null;
    let unreadsFrom = null;
    let joined = false;
    let msgs = null;
    let latest = null;
    let members = null;
    let lm = null;

    if (ruserId) {
      if (!access) {
        return RocketChat.API.v1.unauthorized();
      }

      user = ruserId;
    }

    const rs = findDirectMessageRoom(this.requestParams(), {
      '_id': user
    });
    const room = rs.room;
    const dm = rs.subscription;
    lm = room.lm ? room.lm : room._updatedAt;

    if (typeof dm !== 'undefined' && dm.open) {
      if (dm.ls && room.msgs) {
        unreads = dm.unread;
        unreadsFrom = dm.ls;
      }

      userMentions = dm.userMentions;
      joined = true;
    }

    if (access || joined) {
      msgs = room.msgs;
      latest = lm;
      members = room.usernames.length;
    }

    return RocketChat.API.v1.success({
      joined,
      members,
      unreads,
      unreadsFrom,
      msgs,
      latest,
      userMentions
    });
  }

});
RocketChat.API.v1.addRoute(['dm.files', 'im.files'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    const addUserObjectToEveryObject = file => {
      if (file.userId) {
        file = this.insertUserObject({
          object: file,
          userId: file.userId
        });
      }

      return file;
    };

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult.room._id
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files: files.map(addUserObjectToEveryObject),
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.history', 'im.history'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult.room._id,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute(['dm.members', 'im.members'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();
    const members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult.room.usernames), {
      sort: sort ? sort : -1,
      skip: offset,
      limit: count
    });
    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: members.length,
      offset,
      total: findResult.room.usernames.length
    });
  }

});
RocketChat.API.v1.addRoute(['dm.messages', 'im.messages'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    console.log(findResult);
    const ourQuery = Object.assign({}, query, {
      rid: findResult.room._id
    });
    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.messages.others', 'im.messages.others'], {
  authRequired: true
}, {
  get() {
    if (RocketChat.settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
      throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
        route: '/api/v1/im.messages.others'
      });
    }

    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const roomId = this.queryParams.roomId;

    if (!roomId || !roomId.trim()) {
      throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" is required');
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room || room.t !== 'd') {
      throw new Meteor.Error('error-room-not-found', `No direct message room found by the id of: ${roomId}`);
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: room._id
    });
    const msgs = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages: msgs,
      offset,
      count: msgs.length,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.list', 'im.list'], {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'd',
      'u._id': this.userId
    });

    let rooms = _.pluck(RocketChat.models.Subscriptions.find(ourQuery).fetch(), '_room');

    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      ims: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute(['dm.list.everyone', 'im.list.everyone'], {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'd'
    });
    const rooms = RocketChat.models.Rooms.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      ims: rooms,
      offset,
      count: rooms.length,
      total: RocketChat.models.Rooms.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.open', 'im.open'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    if (!findResult.subscription.open) {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('openRoom', findResult.room._id);
      });
    }

    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute(['dm.setTopic', 'im.setTopic'], {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.room._id, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"integrations.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/integrations.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('integrations.create', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      type: String,
      name: String,
      enabled: Boolean,
      username: String,
      urls: Match.Maybe([String]),
      channel: String,
      event: Match.Maybe(String),
      triggerWords: Match.Maybe([String]),
      alias: Match.Maybe(String),
      avatar: Match.Maybe(String),
      emoji: Match.Maybe(String),
      token: Match.Maybe(String),
      scriptEnabled: Boolean,
      script: Match.Maybe(String),
      targetChannel: Match.Maybe(String)
    }));
    let integration;

    switch (this.bodyParams.type) {
      case 'webhook-outgoing':
        Meteor.runAsUser(this.userId, () => {
          integration = Meteor.call('addOutgoingIntegration', this.bodyParams);
        });
        break;

      case 'webhook-incoming':
        Meteor.runAsUser(this.userId, () => {
          integration = Meteor.call('addIncomingIntegration', this.bodyParams);
        });
        break;

      default:
        return RocketChat.API.v1.failure('Invalid integration type.');
    }

    return RocketChat.API.v1.success({
      integration
    });
  }

});
RocketChat.API.v1.addRoute('integrations.history', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.queryParams.id || this.queryParams.id.trim() === '') {
      return RocketChat.API.v1.failure('Invalid integration id.');
    }

    const id = this.queryParams.id;
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      'integration._id': id
    });
    const history = RocketChat.models.IntegrationHistory.find(ourQuery, {
      sort: sort ? sort : {
        _updatedAt: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      history,
      offset,
      items: history.length,
      total: RocketChat.models.IntegrationHistory.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('integrations.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query);
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      offset,
      items: integrations.length,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('integrations.remove', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      type: String,
      target_url: Match.Maybe(String),
      integrationId: Match.Maybe(String)
    }));

    if (!this.bodyParams.target_url && !this.bodyParams.integrationId) {
      return RocketChat.API.v1.failure('An integrationId or target_url needs to be provided.');
    }

    let integration;

    switch (this.bodyParams.type) {
      case 'webhook-outgoing':
        if (this.bodyParams.target_url) {
          integration = RocketChat.models.Integrations.findOne({
            urls: this.bodyParams.target_url
          });
        } else if (this.bodyParams.integrationId) {
          integration = RocketChat.models.Integrations.findOne({
            _id: this.bodyParams.integrationId
          });
        }

        if (!integration) {
          return RocketChat.API.v1.failure('No integration found.');
        }

        Meteor.runAsUser(this.userId, () => {
          Meteor.call('deleteOutgoingIntegration', integration._id);
        });
        return RocketChat.API.v1.success({
          integration
        });

      case 'webhook-incoming':
        integration = RocketChat.models.Integrations.findOne({
          _id: this.bodyParams.integrationId
        });

        if (!integration) {
          return RocketChat.API.v1.failure('No integration found.');
        }

        Meteor.runAsUser(this.userId, () => {
          Meteor.call('deleteIncomingIntegration', integration._id);
        });
        return RocketChat.API.v1.success({
          integration
        });

      default:
        return RocketChat.API.v1.failure('Invalid integration type.');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"misc.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/misc.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('info', {
  authRequired: false
}, {
  get() {
    const user = this.getLoggedInUser();

    if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
      return RocketChat.API.v1.success({
        info: RocketChat.Info
      });
    }

    return RocketChat.API.v1.success({
      info: {
        'version': RocketChat.Info.version
      }
    });
  }

});
RocketChat.API.v1.addRoute('me', {
  authRequired: true
}, {
  get() {
    return RocketChat.API.v1.success(this.getUserInfo(RocketChat.models.Users.findOneById(this.userId)));
  }

});
let onlineCache = 0;
let onlineCacheDate = 0;
const cacheInvalid = 60000; // 1 minute

RocketChat.API.v1.addRoute('shield.svg', {
  authRequired: false
}, {
  get() {
    const {
      type,
      channel,
      name,
      icon
    } = this.queryParams;

    if (!RocketChat.settings.get('API_Enable_Shields')) {
      throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
        route: '/api/v1/shield.svg'
      });
    }

    const types = RocketChat.settings.get('API_Shield_Types');

    if (type && types !== '*' && !types.split(',').map(t => t.trim()).includes(type)) {
      throw new Meteor.Error('error-shield-disabled', 'This shield type is disabled', {
        route: '/api/v1/shield.svg'
      });
    }

    const hideIcon = icon === 'false';

    if (hideIcon && (!name || !name.trim())) {
      return RocketChat.API.v1.failure('Name cannot be empty when icon is hidden');
    }

    let text;
    let backgroundColor = '#4c1';

    switch (type) {
      case 'online':
        if (Date.now() - onlineCacheDate > cacheInvalid) {
          onlineCache = RocketChat.models.Users.findUsersNotOffline().count();
          onlineCacheDate = Date.now();
        }

        text = `${onlineCache} ${TAPi18n.__('Online')}`;
        break;

      case 'channel':
        if (!channel) {
          return RocketChat.API.v1.failure('Shield channel is required for type "channel"');
        }

        text = `#${channel}`;
        break;

      case 'user':
        const user = this.getUserFromParams(); // Respect the server's choice for using their real names or not

        if (user.name && RocketChat.settings.get('UI_Use_Real_Name')) {
          text = `${user.name}`;
        } else {
          text = `@${user.username}`;
        }

        switch (user.status) {
          case 'online':
            backgroundColor = '#1fb31f';
            break;

          case 'away':
            backgroundColor = '#dc9b01';
            break;

          case 'busy':
            backgroundColor = '#bc2031';
            break;

          case 'offline':
            backgroundColor = '#a5a1a1';
        }

        break;

      default:
        text = TAPi18n.__('Join_Chat').toUpperCase();
    }

    const iconSize = hideIcon ? 7 : 24;
    const leftSize = name ? name.length * 6 + 7 + iconSize : iconSize;
    const rightSize = text.length * 6 + 20;
    const width = leftSize + rightSize;
    const height = 20;
    return {
      headers: {
        'Content-Type': 'image/svg+xml;charset=utf-8'
      },
      body: `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
				  <linearGradient id="b" x2="0" y2="100%">
				    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
				    <stop offset="1" stop-opacity=".1"/>
				  </linearGradient>
				  <mask id="a">
				    <rect width="${width}" height="${height}" rx="3" fill="#fff"/>
				  </mask>
				  <g mask="url(#a)">
				    <path fill="#555" d="M0 0h${leftSize}v${height}H0z"/>
				    <path fill="${backgroundColor}" d="M${leftSize} 0h${rightSize}v${height}H${leftSize}z"/>
				    <path fill="url(#b)" d="M0 0h${width}v${height}H0z"/>
				  </g>
				    ${hideIcon ? '' : '<image x="5" y="3" width="14" height="14" xlink:href="/assets/favicon.svg"/>'}
				  <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
						${name ? `<text x="${iconSize}" y="15" fill="#010101" fill-opacity=".3">${name}</text>
				    <text x="${iconSize}" y="14">${name}</text>` : ''}
				    <text x="${leftSize + 7}" y="15" fill="#010101" fill-opacity=".3">${text}</text>
				    <text x="${leftSize + 7}" y="14">${text}</text>
				  </g>
				</svg>
			`.trim().replace(/\>[\s]+\</gm, '><')
    };
  }

});
RocketChat.API.v1.addRoute('spotlight', {
  authRequired: true
}, {
  get() {
    check(this.queryParams, {
      query: String
    });
    const {
      query
    } = this.queryParams;
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('spotlight', query));
    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('directory', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      query
    } = this.parseJsonQuery();
    const {
      text,
      type
    } = query;

    if (sort && Object.keys(sort).length > 1) {
      return RocketChat.API.v1.failure('This method support only one "sort" parameter');
    }

    const sortBy = sort ? Object.keys(sort)[0] : undefined;
    const sortDirection = sort && Object.values(sort)[0] === 1 ? 'asc' : 'desc';
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('browseChannels', {
      text,
      type,
      sortBy,
      sortDirection,
      page: offset,
      limit: count
    }));

    if (!result) {
      return RocketChat.API.v1.failure('Please verify the parameters');
    }

    return RocketChat.API.v1.success({
      result: result.results,
      count: result.results.length,
      offset,
      total: result.total
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"permissions.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/permissions.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
	This API returns all permissions that exists
	on the server, with respective roles.

	Method: GET
	Route: api/v1/permissions
 */
RocketChat.API.v1.addRoute('permissions', {
  authRequired: true
}, {
  get() {
    const warningMessage = 'The endpoint "permissions" is deprecated and will be removed after version v0.69';
    console.warn(warningMessage);
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));
    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('permissions.list', {
  authRequired: true
}, {
  get() {
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));
    return RocketChat.API.v1.success({
      permissions: result
    });
  }

});
RocketChat.API.v1.addRoute('permissions.update', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'access-permissions')) {
      return RocketChat.API.v1.failure('Editing permissions is not allowed', 'error-edit-permissions-not-allowed');
    }

    check(this.bodyParams, {
      permissions: [Match.ObjectIncluding({
        _id: String,
        roles: [String]
      })]
    });
    let permissionNotFound = false;
    let roleNotFound = false;
    Object.keys(this.bodyParams.permissions).forEach(key => {
      const element = this.bodyParams.permissions[key];

      if (!RocketChat.models.Permissions.findOneById(element._id)) {
        permissionNotFound = true;
      }

      Object.keys(element.roles).forEach(key => {
        const subelement = element.roles[key];

        if (!RocketChat.models.Roles.findOneById(subelement)) {
          roleNotFound = true;
        }
      });
    });

    if (permissionNotFound) {
      return RocketChat.API.v1.failure('Invalid permission', 'error-invalid-permission');
    } else if (roleNotFound) {
      return RocketChat.API.v1.failure('Invalid role', 'error-invalid-role');
    }

    Object.keys(this.bodyParams.permissions).forEach(key => {
      const element = this.bodyParams.permissions[key];
      RocketChat.models.Permissions.createOrUpdate(element._id, element.roles);
    });
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));
    return RocketChat.API.v1.success({
      permissions: result
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"push.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/push.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals Push */
RocketChat.API.v1.addRoute('push.token', {
  authRequired: true
}, {
  post() {
    const {
      type,
      value,
      appName
    } = this.bodyParams;
    let {
      id
    } = this.bodyParams;

    if (id && typeof id !== 'string') {
      throw new Meteor.Error('error-id-param-not-valid', 'The required "id" body param is invalid.');
    } else {
      id = Random.id();
    }

    if (!type || type !== 'apn' && type !== 'gcm') {
      throw new Meteor.Error('error-type-param-not-valid', 'The required "type" body param is missing or invalid.');
    }

    if (!value || typeof value !== 'string') {
      throw new Meteor.Error('error-token-param-not-valid', 'The required "value" body param is missing or invalid.');
    }

    if (!appName || typeof appName !== 'string') {
      throw new Meteor.Error('error-appName-param-not-valid', 'The required "appName" body param is missing or invalid.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('raix:push-update', {
      id,
      token: {
        [type]: value
      },
      appName,
      userId: this.userId
    }));
    return RocketChat.API.v1.success({
      result
    });
  },

  delete() {
    const {
      token
    } = this.bodyParams;

    if (!token || typeof token !== 'string') {
      throw new Meteor.Error('error-token-param-not-valid', 'The required "token" body param is missing or invalid.');
    }

    const affectedRecords = Push.appCollection.remove({
      $or: [{
        'token.apn': token
      }, {
        'token.gcm': token
      }],
      userId: this.userId
    });

    if (affectedRecords === 0) {
      return RocketChat.API.v1.notFound();
    }

    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/settings.js                                                                       //
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
// settings endpoints
RocketChat.API.v1.addRoute('settings.public', {
  authRequired: false
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let ourQuery = {
      hidden: {
        $ne: true
      },
      'public': true
    };
    ourQuery = Object.assign({}, query, ourQuery);
    const settings = RocketChat.models.Settings.find(ourQuery, {
      sort: sort ? sort : {
        _id: 1
      },
      skip: offset,
      limit: count,
      fields: Object.assign({
        _id: 1,
        value: 1
      }, fields)
    }).fetch();
    return RocketChat.API.v1.success({
      settings,
      count: settings.length,
      offset,
      total: RocketChat.models.Settings.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('settings.oauth', {
  authRequired: false
}, {
  get() {
    const mountOAuthServices = () => {
      const oAuthServicesEnabled = ServiceConfiguration.configurations.find({}, {
        fields: {
          secret: 0
        }
      }).fetch();
      return oAuthServicesEnabled.map(service => {
        if (service.custom || ['saml', 'cas', 'wordpress'].includes(service.service)) {
          return (0, _objectSpread2.default)({}, service);
        }

        return {
          _id: service._id,
          name: service.service,
          clientId: service.appId || service.clientId || service.consumerKey,
          buttonLabelText: service.buttonLabelText || '',
          buttonColor: service.buttonColor || '',
          buttonLabelColor: service.buttonLabelColor || '',
          custom: false
        };
      });
    };

    return RocketChat.API.v1.success({
      services: mountOAuthServices()
    });
  }

});
RocketChat.API.v1.addRoute('settings', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let ourQuery = {
      hidden: {
        $ne: true
      }
    };

    if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
      ourQuery.public = true;
    }

    ourQuery = Object.assign({}, query, ourQuery);
    const settings = RocketChat.models.Settings.find(ourQuery, {
      sort: sort ? sort : {
        _id: 1
      },
      skip: offset,
      limit: count,
      fields: Object.assign({
        _id: 1,
        value: 1
      }, fields)
    }).fetch();
    return RocketChat.API.v1.success({
      settings,
      count: settings.length,
      offset,
      total: RocketChat.models.Settings.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('settings/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(_.pick(RocketChat.models.Settings.findOneNotHiddenById(this.urlParams._id), '_id', 'value'));
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'edit-privileged-setting')) {
      return RocketChat.API.v1.unauthorized();
    } // allow special handling of particular setting types


    const setting = RocketChat.models.Settings.findOneNotHiddenById(this.urlParams._id);

    if (setting.type === 'action' && this.bodyParams && this.bodyParams.execute) {
      //execute the configured method
      Meteor.call(setting.value);
      return RocketChat.API.v1.success();
    }

    if (setting.type === 'color' && this.bodyParams && this.bodyParams.editor && this.bodyParams.value) {
      RocketChat.models.Settings.updateOptionsById(this.urlParams._id, {
        editor: this.bodyParams.editor
      });
      RocketChat.models.Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value);
      return RocketChat.API.v1.success();
    }

    check(this.bodyParams, {
      value: Match.Any
    });

    if (RocketChat.models.Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value)) {
      return RocketChat.API.v1.success();
    }

    return RocketChat.API.v1.failure();
  }

});
RocketChat.API.v1.addRoute('service.configurations', {
  authRequired: false
}, {
  get() {
    const ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
    return RocketChat.API.v1.success({
      configurations: ServiceConfiguration.configurations.find({}, {
        fields: {
          secret: 0
        }
      }).fetch()
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stats.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/stats.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('statistics', {
  authRequired: true
}, {
  get() {
    let refresh = false;

    if (typeof this.queryParams.refresh !== 'undefined' && this.queryParams.refresh === 'true') {
      refresh = true;
    }

    let stats;
    Meteor.runAsUser(this.userId, () => {
      stats = Meteor.call('getStatistics', refresh);
    });
    return RocketChat.API.v1.success({
      statistics: stats
    });
  }

});
RocketChat.API.v1.addRoute('statistics.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-statistics')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const statistics = RocketChat.models.Statistics.find(query, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      statistics,
      count: statistics.length,
      offset,
      total: RocketChat.models.Statistics.find(query).count()
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/users.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let Busboy;
module.watch(require("busboy"), {
  default(v) {
    Busboy = v;
  }

}, 1);
RocketChat.API.v1.addRoute('users.create', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      email: String,
      name: String,
      password: String,
      username: String,
      active: Match.Maybe(Boolean),
      roles: Match.Maybe(Array),
      joinDefaultChannels: Match.Maybe(Boolean),
      requirePasswordChange: Match.Maybe(Boolean),
      sendWelcomeEmail: Match.Maybe(Boolean),
      verified: Match.Maybe(Boolean),
      customFields: Match.Maybe(Object)
    }); //New change made by pull request #5152

    if (typeof this.bodyParams.joinDefaultChannels === 'undefined') {
      this.bodyParams.joinDefaultChannels = true;
    }

    if (this.bodyParams.customFields) {
      RocketChat.validateCustomFields(this.bodyParams.customFields);
    }

    const newUserId = RocketChat.saveUser(this.userId, this.bodyParams);

    if (this.bodyParams.customFields) {
      RocketChat.saveCustomFieldsWithoutValidation(newUserId, this.bodyParams.customFields);
    }

    if (typeof this.bodyParams.active !== 'undefined') {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('setUserActiveStatus', newUserId, this.bodyParams.active);
      });
    }

    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(newUserId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.delete', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'delete-user')) {
      return RocketChat.API.v1.unauthorized();
    }

    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('deleteUser', user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.getAvatar', {
  authRequired: false
}, {
  get() {
    const user = this.getUserFromParams();
    const url = RocketChat.getURL(`/avatar/${user.username}`, {
      cdn: false,
      full: true
    });
    this.response.setHeader('Location', url);
    return {
      statusCode: 307,
      body: url
    };
  }

});
RocketChat.API.v1.addRoute('users.getPresence', {
  authRequired: true
}, {
  get() {
    if (this.isUserFromParams()) {
      const user = RocketChat.models.Users.findOneById(this.userId);
      return RocketChat.API.v1.success({
        presence: user.status,
        connectionStatus: user.statusConnection,
        lastLogin: user.lastLogin
      });
    }

    const user = this.getUserFromParams();
    return RocketChat.API.v1.success({
      presence: user.status
    });
  }

});
RocketChat.API.v1.addRoute('users.info', {
  authRequired: true
}, {
  get() {
    const user = this.getUserFromParams();
    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getFullUserData', {
        filter: user.username,
        limit: 1
      });
    });

    if (!result || result.length !== 1) {
      return RocketChat.API.v1.failure(`Failed to get the user data for the userId of "${user._id}".`);
    }

    return RocketChat.API.v1.success({
      user: result[0]
    });
  }

});
RocketChat.API.v1.addRoute('users.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-d-room')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const users = RocketChat.models.Users.find(query, {
      sort: sort ? sort : {
        username: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      users,
      count: users.length,
      offset,
      total: RocketChat.models.Users.find(query).count()
    });
  }

});
RocketChat.API.v1.addRoute('users.register', {
  authRequired: false
}, {
  post() {
    if (this.userId) {
      return RocketChat.API.v1.failure('Logged in users can not register again.');
    } //We set their username here, so require it
    //The `registerUser` checks for the other requirements


    check(this.bodyParams, Match.ObjectIncluding({
      username: String
    })); //Register the user

    const userId = Meteor.call('registerUser', this.bodyParams); //Now set their username

    Meteor.runAsUser(userId, () => Meteor.call('setUsername', this.bodyParams.username));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.resetAvatar', {
  authRequired: true
}, {
  post() {
    const user = this.getUserFromParams();

    if (user._id === this.userId) {
      Meteor.runAsUser(this.userId, () => Meteor.call('resetAvatar'));
    } else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
      Meteor.runAsUser(user._id, () => Meteor.call('resetAvatar'));
    } else {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.setAvatar', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      avatarUrl: Match.Maybe(String),
      userId: Match.Maybe(String),
      username: Match.Maybe(String)
    }));
    let user;

    if (this.isUserFromParams()) {
      user = Meteor.users.findOne(this.userId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
      user = this.getUserFromParams();
    } else {
      return RocketChat.API.v1.unauthorized();
    }

    Meteor.runAsUser(user._id, () => {
      if (this.bodyParams.avatarUrl) {
        RocketChat.setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
      } else {
        const busboy = new Busboy({
          headers: this.request.headers
        });
        Meteor.wrapAsync(callback => {
          busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
            if (fieldname !== 'image') {
              return callback(new Meteor.Error('invalid-field'));
            }

            const imageData = [];
            file.on('data', Meteor.bindEnvironment(data => {
              imageData.push(data);
            }));
            file.on('end', Meteor.bindEnvironment(() => {
              RocketChat.setUserAvatar(user, Buffer.concat(imageData), mimetype, 'rest');
              callback();
            }));
          }));
          this.request.pipe(busboy);
        })();
      }
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.update', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      userId: String,
      data: Match.ObjectIncluding({
        email: Match.Maybe(String),
        name: Match.Maybe(String),
        password: Match.Maybe(String),
        username: Match.Maybe(String),
        active: Match.Maybe(Boolean),
        roles: Match.Maybe(Array),
        joinDefaultChannels: Match.Maybe(Boolean),
        requirePasswordChange: Match.Maybe(Boolean),
        sendWelcomeEmail: Match.Maybe(Boolean),
        verified: Match.Maybe(Boolean),
        customFields: Match.Maybe(Object)
      })
    });

    const userData = _.extend({
      _id: this.bodyParams.userId
    }, this.bodyParams.data);

    Meteor.runAsUser(this.userId, () => RocketChat.saveUser(this.userId, userData));

    if (this.bodyParams.data.customFields) {
      RocketChat.saveCustomFields(this.bodyParams.userId, this.bodyParams.data.customFields);
    }

    if (typeof this.bodyParams.data.active !== 'undefined') {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('setUserActiveStatus', this.bodyParams.userId, this.bodyParams.data.active);
      });
    }

    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.bodyParams.userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.updateOwnBasicInfo', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      data: Match.ObjectIncluding({
        email: Match.Maybe(String),
        name: Match.Maybe(String),
        username: Match.Maybe(String),
        currentPassword: Match.Maybe(String),
        newPassword: Match.Maybe(String)
      }),
      customFields: Match.Maybe(Object)
    });
    const userData = {
      email: this.bodyParams.data.email,
      realname: this.bodyParams.data.name,
      username: this.bodyParams.data.username,
      newPassword: this.bodyParams.data.newPassword,
      typedPassword: this.bodyParams.data.currentPassword
    };
    Meteor.runAsUser(this.userId, () => Meteor.call('saveUserProfile', userData, this.bodyParams.customFields));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.createToken', {
  authRequired: true
}, {
  post() {
    const user = this.getUserFromParams();
    let data;
    Meteor.runAsUser(this.userId, () => {
      data = Meteor.call('createToken', user._id);
    });
    return data ? RocketChat.API.v1.success({
      data
    }) : RocketChat.API.v1.unauthorized();
  }

});
RocketChat.API.v1.addRoute('users.getPreferences', {
  authRequired: true
}, {
  get() {
    const user = RocketChat.models.Users.findOneById(this.userId);

    if (user.settings) {
      const preferences = user.settings.preferences;
      preferences['language'] = user.language;
      return RocketChat.API.v1.success({
        preferences
      });
    } else {
      return RocketChat.API.v1.failure(TAPi18n.__('Accounts_Default_User_Preferences_not_available').toUpperCase());
    }
  }

});
RocketChat.API.v1.addRoute('users.setPreferences', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      userId: Match.Maybe(String),
      data: Match.ObjectIncluding({
        newRoomNotification: Match.Maybe(String),
        newMessageNotification: Match.Maybe(String),
        useEmojis: Match.Maybe(Boolean),
        convertAsciiEmoji: Match.Maybe(Boolean),
        saveMobileBandwidth: Match.Maybe(Boolean),
        collapseMediaByDefault: Match.Maybe(Boolean),
        autoImageLoad: Match.Maybe(Boolean),
        emailNotificationMode: Match.Maybe(String),
        unreadAlert: Match.Maybe(Boolean),
        notificationsSoundVolume: Match.Maybe(Number),
        desktopNotifications: Match.Maybe(String),
        mobileNotifications: Match.Maybe(String),
        enableAutoAway: Match.Maybe(Boolean),
        highlights: Match.Maybe(Array),
        desktopNotificationDuration: Match.Maybe(Number),
        messageViewMode: Match.Maybe(Number),
        hideUsernames: Match.Maybe(Boolean),
        hideRoles: Match.Maybe(Boolean),
        hideAvatars: Match.Maybe(Boolean),
        hideFlexTab: Match.Maybe(Boolean),
        sendOnEnter: Match.Maybe(String),
        roomCounterSidebar: Match.Maybe(Boolean),
        language: Match.Maybe(String),
        sidebarShowFavorites: Match.Optional(Boolean),
        sidebarShowUnread: Match.Optional(Boolean),
        sidebarSortby: Match.Optional(String),
        sidebarViewMode: Match.Optional(String),
        sidebarHideAvatar: Match.Optional(Boolean),
        sidebarGroupByType: Match.Optional(Boolean),
        muteFocusedConversations: Match.Optional(Boolean)
      })
    });
    let preferences;
    const userId = this.bodyParams.userId ? this.bodyParams.userId : this.userId;

    if (this.bodyParams.data.language) {
      const language = this.bodyParams.data.language;
      delete this.bodyParams.data.language;
      preferences = _.extend({
        _id: userId,
        settings: {
          preferences: this.bodyParams.data
        },
        language
      });
    } else {
      preferences = _.extend({
        _id: userId,
        settings: {
          preferences: this.bodyParams.data
        }
      });
    } // Keep compatibility with old values


    if (preferences.emailNotificationMode === 'all') {
      preferences.emailNotificationMode = 'mentions';
    } else if (preferences.emailNotificationMode === 'disabled') {
      preferences.emailNotificationMode = 'nothing';
    }

    Meteor.runAsUser(this.userId, () => RocketChat.saveUser(this.userId, preferences));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.bodyParams.userId, {
        fields: preferences
      })
    });
  }

});
/**
 DEPRECATED
 // TODO: Remove this after three versions have been released. That means at 0.66 this should be gone.
 This API returns the logged user roles.

 Method: GET
 Route: api/v1/user.roles
 */

RocketChat.API.v1.addRoute('user.roles', {
  authRequired: true
}, {
  get() {
    let currentUserRoles = {};
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('getUserRoles'));

    if (Array.isArray(result) && result.length > 0) {
      currentUserRoles = result[0];
    }

    return RocketChat.API.v1.success(this.deprecationWarning({
      endpoint: 'user.roles',
      versionWillBeRemove: 'v0.66',
      response: currentUserRoles
    }));
  }

});
RocketChat.API.v1.addRoute('users.forgotPassword', {
  authRequired: false
}, {
  post() {
    const {
      email
    } = this.bodyParams;

    if (!email) {
      return RocketChat.API.v1.failure('The \'email\' param is required');
    }

    const emailSent = Meteor.call('sendForgotPasswordEmail', email);

    if (emailSent) {
      return RocketChat.API.v1.success();
    }

    return RocketChat.API.v1.failure('User not found');
  }

});
RocketChat.API.v1.addRoute('users.getUsernameSuggestion', {
  authRequired: true
}, {
  get() {
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('getUsernameSuggestion'));
    return RocketChat.API.v1.success({
      result
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:api/server/api.js");
require("/node_modules/meteor/rocketchat:api/server/settings.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/requestParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getPaginationItems.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getUserFromParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getUserInfo.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/isUserFromParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/parseJsonQuery.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/deprecationWarning.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getLoggedInUser.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/insertUserObject.js");
require("/node_modules/meteor/rocketchat:api/server/default/info.js");
require("/node_modules/meteor/rocketchat:api/server/v1/channels.js");
require("/node_modules/meteor/rocketchat:api/server/v1/rooms.js");
require("/node_modules/meteor/rocketchat:api/server/v1/subscriptions.js");
require("/node_modules/meteor/rocketchat:api/server/v1/chat.js");
require("/node_modules/meteor/rocketchat:api/server/v1/commands.js");
require("/node_modules/meteor/rocketchat:api/server/v1/emoji-custom.js");
require("/node_modules/meteor/rocketchat:api/server/v1/groups.js");
require("/node_modules/meteor/rocketchat:api/server/v1/im.js");
require("/node_modules/meteor/rocketchat:api/server/v1/integrations.js");
require("/node_modules/meteor/rocketchat:api/server/v1/misc.js");
require("/node_modules/meteor/rocketchat:api/server/v1/permissions.js");
require("/node_modules/meteor/rocketchat:api/server/v1/push.js");
require("/node_modules/meteor/rocketchat:api/server/v1/settings.js");
require("/node_modules/meteor/rocketchat:api/server/v1/stats.js");
require("/node_modules/meteor/rocketchat:api/server/v1/users.js");

/* Exports */
Package._define("rocketchat:api");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_api.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2FwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9yZXF1ZXN0UGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9nZXRQYWdpbmF0aW9uSXRlbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci9oZWxwZXJzL2dldFVzZXJGcm9tUGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9nZXRVc2VySW5mby5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2hlbHBlcnMvaXNVc2VyRnJvbVBhcmFtcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2hlbHBlcnMvcGFyc2VKc29uUXVlcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci9oZWxwZXJzL2RlcHJlY2F0aW9uV2FybmluZy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2hlbHBlcnMvZ2V0TG9nZ2VkSW5Vc2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9pbnNlcnRVc2VyT2JqZWN0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvZGVmYXVsdC9pbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvY2hhbm5lbHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9yb29tcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3N1YnNjcmlwdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9jaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvY29tbWFuZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9lbW9qaS1jdXN0b20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9ncm91cHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9pbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL2ludGVncmF0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL21pc2MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9wZXJtaXNzaW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3B1c2guanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3N0YXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvdXNlcnMuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwibG9nZ2VyIiwiTG9nZ2VyIiwiQVBJIiwiUmVzdGl2dXMiLCJjb25zdHJ1Y3RvciIsInByb3BlcnRpZXMiLCJhdXRoTWV0aG9kcyIsImZpZWxkU2VwYXJhdG9yIiwiZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSIsImpvaW5Db2RlIiwiJGxva2kiLCJtZXRhIiwibWVtYmVycyIsInVzZXJuYW1lcyIsImltcG9ydElkcyIsImxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlIiwiYXZhdGFyT3JpZ2luIiwiZW1haWxzIiwicGhvbmUiLCJzdGF0dXNDb25uZWN0aW9uIiwiY3JlYXRlZEF0IiwibGFzdExvZ2luIiwic2VydmljZXMiLCJyZXF1aXJlUGFzc3dvcmRDaGFuZ2UiLCJyZXF1aXJlUGFzc3dvcmRDaGFuZ2VSZWFzb24iLCJyb2xlcyIsInN0YXR1c0RlZmF1bHQiLCJfdXBkYXRlZEF0IiwiY3VzdG9tRmllbGRzIiwic2V0dGluZ3MiLCJsaW1pdGVkVXNlckZpZWxkc1RvRXhjbHVkZUlmSXNQcml2aWxlZ2VkVXNlciIsIl9jb25maWciLCJkZWZhdWx0T3B0aW9uc0VuZHBvaW50IiwiX2RlZmF1bHRPcHRpb25zRW5kcG9pbnQiLCJyZXF1ZXN0IiwibWV0aG9kIiwiaGVhZGVycyIsIlJvY2tldENoYXQiLCJnZXQiLCJyZXNwb25zZSIsIndyaXRlSGVhZCIsIndyaXRlIiwiZG9uZSIsImhhc0hlbHBlck1ldGhvZHMiLCJoZWxwZXJNZXRob2RzIiwic2l6ZSIsImdldEhlbHBlck1ldGhvZHMiLCJnZXRIZWxwZXJNZXRob2QiLCJuYW1lIiwiYWRkQXV0aE1ldGhvZCIsInB1c2giLCJzdWNjZXNzIiwicmVzdWx0IiwiaXNPYmplY3QiLCJzdGF0dXNDb2RlIiwiYm9keSIsImRlYnVnIiwiZmFpbHVyZSIsImVycm9yVHlwZSIsImVycm9yIiwibm90Rm91bmQiLCJtc2ciLCJ1bmF1dGhvcml6ZWQiLCJhZGRSb3V0ZSIsInJvdXRlcyIsIm9wdGlvbnMiLCJlbmRwb2ludHMiLCJpc0FycmF5IiwidmVyc2lvbiIsImZvckVhY2giLCJyb3V0ZSIsIk9iamVjdCIsImtleXMiLCJhY3Rpb24iLCJvcmlnaW5hbEFjdGlvbiIsIl9pbnRlcm5hbFJvdXRlQWN0aW9uSGFuZGxlciIsInJvY2tldGNoYXRSZXN0QXBpRW5kIiwibWV0cmljcyIsInJvY2tldGNoYXRSZXN0QXBpIiwic3RhcnRUaW1lciIsInVzZXJfYWdlbnQiLCJlbnRyeXBvaW50IiwidG9VcHBlckNhc2UiLCJ1cmwiLCJhcHBseSIsImUiLCJzdGFjayIsInYxIiwibWVzc2FnZSIsInN0YXR1cyIsImhlbHBlck1ldGhvZCIsIl9pbml0QXV0aCIsImxvZ2luQ29tcGF0aWJpbGl0eSIsImJvZHlQYXJhbXMiLCJ1c2VyIiwidXNlcm5hbWUiLCJlbWFpbCIsInBhc3N3b3JkIiwiY29kZSIsIndpdGhvdXQiLCJsZW5ndGgiLCJhdXRoIiwiaW5jbHVkZXMiLCJoYXNoZWQiLCJkaWdlc3QiLCJhbGdvcml0aG0iLCJ0b3RwIiwibG9naW4iLCJzZWxmIiwiYXV0aFJlcXVpcmVkIiwicG9zdCIsImFyZ3MiLCJnZXRVc2VySW5mbyIsImludm9jYXRpb24iLCJERFBDb21tb24iLCJNZXRob2RJbnZvY2F0aW9uIiwiY29ubmVjdGlvbiIsImNsb3NlIiwiRERQIiwiX0N1cnJlbnRJbnZvY2F0aW9uIiwid2l0aFZhbHVlIiwiTWV0ZW9yIiwiY2FsbCIsInJlYXNvbiIsInVzZXJzIiwiZmluZE9uZSIsIl9pZCIsImlkIiwidXNlcklkIiwidXBkYXRlIiwiQWNjb3VudHMiLCJfaGFzaExvZ2luVG9rZW4iLCJ0b2tlbiIsIiR1bnNldCIsImRhdGEiLCJhdXRoVG9rZW4iLCJtZSIsImV4dHJhRGF0YSIsIm9uTG9nZ2VkSW4iLCJleHRlbmQiLCJleHRyYSIsImxvZ291dCIsImhhc2hlZFRva2VuIiwidG9rZW5Mb2NhdGlvbiIsImluZGV4IiwibGFzdEluZGV4T2YiLCJ0b2tlblBhdGgiLCJzdWJzdHJpbmciLCJ0b2tlbkZpZWxkTmFtZSIsInRva2VuVG9SZW1vdmUiLCJ0b2tlblJlbW92YWxRdWVyeSIsIiRwdWxsIiwib25Mb2dnZWRPdXQiLCJjb25zb2xlIiwid2FybiIsImdldFVzZXJBdXRoIiwiX2dldFVzZXJBdXRoIiwiaW52YWxpZFJlc3VsdHMiLCJ1bmRlZmluZWQiLCJwYXlsb2FkIiwiSlNPTiIsInBhcnNlIiwiaSIsImFyZ3VtZW50cyIsIk1hcCIsIkFwaUNsYXNzIiwiY3JlYXRlQXBpIiwiX2NyZWF0ZUFwaSIsImVuYWJsZUNvcnMiLCJ1c2VEZWZhdWx0QXV0aCIsInByZXR0eUpzb24iLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJrZXkiLCJ2YWx1ZSIsImFkZEdyb3VwIiwic2VjdGlvbiIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJlbmFibGVRdWVyeSIsInNldCIsIl9yZXF1ZXN0UGFyYW1zIiwicXVlcnlQYXJhbXMiLCJfZ2V0UGFnaW5hdGlvbkl0ZW1zIiwiaGFyZFVwcGVyTGltaXQiLCJkZWZhdWx0Q291bnQiLCJvZmZzZXQiLCJwYXJzZUludCIsImNvdW50IiwiX2dldFVzZXJGcm9tUGFyYW1zIiwiZG9lc250RXhpc3QiLCJfZG9lc250RXhpc3QiLCJwYXJhbXMiLCJyZXF1ZXN0UGFyYW1zIiwidHJpbSIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5SWQiLCJmaW5kT25lQnlVc2VybmFtZSIsIkVycm9yIiwiZ2V0SW5mb0Zyb21Vc2VyT2JqZWN0IiwidXRjT2Zmc2V0IiwiYWN0aXZlIiwibGFuZ3VhZ2UiLCJfZ2V0VXNlckluZm8iLCJpc1ZlcmlmaWVkRW1haWwiLCJBcnJheSIsImZpbmQiLCJ2ZXJpZmllZCIsImdldFVzZXJQcmVmZXJlbmNlcyIsImRlZmF1bHRVc2VyU2V0dGluZ1ByZWZpeCIsImFsbERlZmF1bHRVc2VyU2V0dGluZ3MiLCJSZWdFeHAiLCJyZWR1Y2UiLCJhY2N1bXVsYXRvciIsInNldHRpbmciLCJzZXR0aW5nV2l0aG91dFByZWZpeCIsInJlcGxhY2UiLCJnZXRVc2VyUHJlZmVyZW5jZSIsInZlcmlmaWVkRW1haWwiLCJhZGRyZXNzIiwicHJlZmVyZW5jZXMiLCJfaXNVc2VyRnJvbVBhcmFtcyIsIl9wYXJzZUpzb25RdWVyeSIsInNvcnQiLCJmaWVsZHMiLCJub25TZWxlY3RhYmxlRmllbGRzIiwiZ2V0RmllbGRzIiwiYXV0aHoiLCJoYXNQZXJtaXNzaW9uIiwiY29uY2F0IiwiayIsInNwbGl0IiwiYXNzaWduIiwicXVlcnkiLCJub25RdWVyeWFibGVGaWVsZHMiLCJfZGVwcmVjYXRpb25XYXJuaW5nIiwiZW5kcG9pbnQiLCJ2ZXJzaW9uV2lsbEJlUmVtb3ZlIiwid2FybmluZ01lc3NhZ2UiLCJ3YXJuaW5nIiwiX2dldExvZ2dlZEluVXNlciIsIl9hZGRVc2VyVG9PYmplY3QiLCJvYmplY3QiLCJnZXRMb2dnZWRJblVzZXIiLCJoYXNSb2xlIiwiaW5mbyIsIkluZm8iLCJmaW5kQ2hhbm5lbEJ5SWRPck5hbWUiLCJjaGVja2VkQXJjaGl2ZWQiLCJyZXR1cm5Vc2VybmFtZXMiLCJyb29tSWQiLCJyb29tTmFtZSIsInJvb20iLCJSb29tcyIsImZpbmRPbmVCeU5hbWUiLCJ0IiwiYXJjaGl2ZWQiLCJmaW5kUmVzdWx0IiwicnVuQXNVc2VyIiwiYWN0aXZlVXNlcnNPbmx5IiwiY2hhbm5lbCIsImdldFVzZXJGcm9tUGFyYW1zIiwibGF0ZXN0Iiwib2xkZXN0IiwiRGF0ZSIsImluY2x1c2l2ZSIsImRlcHJlY2F0aW9uV2FybmluZyIsInN1YiIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJvcGVuIiwiYWNjZXNzIiwicnVzZXJJZCIsInVucmVhZHMiLCJ1c2VyTWVudGlvbnMiLCJ1bnJlYWRzRnJvbSIsImpvaW5lZCIsIm1zZ3MiLCJsbSIsIl9yb29tIiwibHMiLCJNZXNzYWdlcyIsImNvdW50VmlzaWJsZUJ5Um9vbUlkQmV0d2VlblRpbWVzdGFtcHNJbmNsdXNpdmUiLCJyaWQiLCJjcmVhdGVDaGFubmVsVmFsaWRhdG9yIiwiY3JlYXRlQ2hhbm5lbCIsInJlYWRPbmx5IiwiY2hhbm5lbHMiLCJjcmVhdGUiLCJ2YWxpZGF0ZSIsImV4ZWN1dGUiLCJhZGRVc2VyT2JqZWN0VG9FdmVyeU9iamVjdCIsImZpbGUiLCJpbnNlcnRVc2VyT2JqZWN0IiwiZ2V0UGFnaW5hdGlvbkl0ZW1zIiwicGFyc2VKc29uUXVlcnkiLCJvdXJRdWVyeSIsImZpbGVzIiwiVXBsb2FkcyIsInNraXAiLCJsaW1pdCIsImZldGNoIiwibWFwIiwidG90YWwiLCJpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMiLCIkaW4iLCJpbnRlZ3JhdGlvbnMiLCJJbnRlZ3JhdGlvbnMiLCJfY3JlYXRlZEF0IiwibGF0ZXN0RGF0ZSIsIm9sZGVzdERhdGUiLCJoYXNQZXJtaXNzaW9uVG9TZWVBbGxQdWJsaWNDaGFubmVscyIsInJvb21zIiwicGx1Y2siLCJ0b3RhbENvdW50IiwicHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0IiwiYnJvYWRjYXN0Iiwic2hvdWxkQmVPcmRlcmVkRGVzYyIsIk1hdGNoIiwidGVzdCIsIk51bWJlciIsImZyb20iLCJyZXZlcnNlIiwibWVzc2FnZXMiLCJ0cyIsIm9ubGluZSIsImZpbmRVc2Vyc05vdE9mZmxpbmUiLCJvbmxpbmVJblJvb20iLCJpbmRleE9mIiwidG9TdHJpbmciLCJkZXNjcmlwdGlvbiIsInB1cnBvc2UiLCJybyIsInRvcGljIiwiYW5ub3VuY2VtZW50IiwibWVudGlvbnMiLCJhbGxNZW50aW9ucyIsIkJ1c2JveSIsImZpbmRSb29tQnlJZE9yTmFtZSIsInVwZGF0ZWRTaW5jZSIsInVwZGF0ZWRTaW5jZURhdGUiLCJpc05hTiIsInJlbW92ZSIsInVybFBhcmFtcyIsImJ1c2JveSIsIndyYXBBc3luYyIsImNhbGxiYWNrIiwib24iLCJmaWVsZG5hbWUiLCJmaWxlbmFtZSIsImVuY29kaW5nIiwibWltZXR5cGUiLCJmaWxlRGF0ZSIsImZpbGVCdWZmZXIiLCJCdWZmZXIiLCJiaW5kRW52aXJvbm1lbnQiLCJwaXBlIiwiZmlsZVN0b3JlIiwiRmlsZVVwbG9hZCIsImdldFN0b3JlIiwiZGV0YWlscyIsInVwbG9hZGVkRmlsZSIsImluc2VydCIsImJpbmQiLCJzYXZlTm90aWZpY2F0aW9ucyIsIm5vdGlmaWNhdGlvbnMiLCJub3RpZmljYXRpb25LZXkiLCJmYXZvcml0ZSIsImhhc093blByb3BlcnR5Iiwic3Vic2NyaXB0aW9uIiwiX3VzZXIiLCJjaGVjayIsIlN0cmluZyIsImZpcnN0VW5yZWFkTWVzc2FnZSIsIk9iamVjdEluY2x1ZGluZyIsIm1zZ0lkIiwiYXNVc2VyIiwiTWF5YmUiLCJCb29sZWFuIiwidSIsIm5vdyIsImxhc3RVcGRhdGUiLCJtZXNzYWdlSWQiLCJwaW5uZWRNZXNzYWdlIiwibWVzc2FnZVJldHVybiIsInByb2Nlc3NXZWJob29rTWVzc2FnZSIsInNlYXJjaFRleHQiLCJkb2NzIiwic3RhcnJlZCIsInRleHQiLCJlbW9qaSIsInJlYWN0aW9uIiwic2hvdWxkUmVhY3QiLCJtZXNzYWdlUmVhZFJlY2VpcHRzIiwicmVjZWlwdHMiLCJpZ25vcmUiLCJjb21tYW5kIiwiY21kIiwic2xhc2hDb21tYW5kcyIsImNvbW1hbmRzIiwidG9Mb3dlckNhc2UiLCJ2YWx1ZXMiLCJmaWx0ZXIiLCJydW4iLCJSYW5kb20iLCJwcmV2aWV3IiwicHJldmlld0l0ZW0iLCJlbW9qaXMiLCJmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSIsInJvb21TdWIiLCJmaW5kT25lQnlSb29tTmFtZUFuZFVzZXJJZCIsImdyb3VwIiwiaW5jbHVkZUFsbFByaXZhdGVHcm91cHMiLCJjaGFubmVsc1RvU2VhcmNoIiwiaWRPck5hbWUiLCJmaW5kT25lQnlJZE9yTmFtZSIsImdyb3VwcyIsInNvcnRGbiIsImEiLCJiIiwiZmluZERpcmVjdE1lc3NhZ2VSb29tIiwiZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luIiwiY3VycmVudFVzZXJJZCIsIm5hbWVPcklkIiwicnMiLCJkbSIsInVucmVhZCIsImxvZyIsImltcyIsImVuYWJsZWQiLCJ1cmxzIiwiZXZlbnQiLCJ0cmlnZ2VyV29yZHMiLCJhbGlhcyIsImF2YXRhciIsInNjcmlwdEVuYWJsZWQiLCJzY3JpcHQiLCJ0YXJnZXRDaGFubmVsIiwiaW50ZWdyYXRpb24iLCJoaXN0b3J5IiwiSW50ZWdyYXRpb25IaXN0b3J5IiwiaXRlbXMiLCJ0YXJnZXRfdXJsIiwiaW50ZWdyYXRpb25JZCIsIm9ubGluZUNhY2hlIiwib25saW5lQ2FjaGVEYXRlIiwiY2FjaGVJbnZhbGlkIiwiaWNvbiIsInR5cGVzIiwiaGlkZUljb24iLCJiYWNrZ3JvdW5kQ29sb3IiLCJUQVBpMThuIiwiX18iLCJpY29uU2l6ZSIsImxlZnRTaXplIiwicmlnaHRTaXplIiwid2lkdGgiLCJoZWlnaHQiLCJzb3J0QnkiLCJzb3J0RGlyZWN0aW9uIiwicGFnZSIsInJlc3VsdHMiLCJwZXJtaXNzaW9ucyIsInBlcm1pc3Npb25Ob3RGb3VuZCIsInJvbGVOb3RGb3VuZCIsImVsZW1lbnQiLCJQZXJtaXNzaW9ucyIsInN1YmVsZW1lbnQiLCJSb2xlcyIsImNyZWF0ZU9yVXBkYXRlIiwiYXBwTmFtZSIsImRlbGV0ZSIsImFmZmVjdGVkUmVjb3JkcyIsIlB1c2giLCJhcHBDb2xsZWN0aW9uIiwiJG9yIiwiaGlkZGVuIiwiJG5lIiwiU2V0dGluZ3MiLCJtb3VudE9BdXRoU2VydmljZXMiLCJvQXV0aFNlcnZpY2VzRW5hYmxlZCIsIlNlcnZpY2VDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbnMiLCJzZWNyZXQiLCJzZXJ2aWNlIiwiY3VzdG9tIiwiY2xpZW50SWQiLCJhcHBJZCIsImNvbnN1bWVyS2V5IiwiYnV0dG9uTGFiZWxUZXh0IiwiYnV0dG9uQ29sb3IiLCJidXR0b25MYWJlbENvbG9yIiwicGljayIsImZpbmRPbmVOb3RIaWRkZW5CeUlkIiwiZWRpdG9yIiwidXBkYXRlT3B0aW9uc0J5SWQiLCJ1cGRhdGVWYWx1ZU5vdEhpZGRlbkJ5SWQiLCJBbnkiLCJQYWNrYWdlIiwicmVmcmVzaCIsInN0YXRzIiwic3RhdGlzdGljcyIsIlN0YXRpc3RpY3MiLCJqb2luRGVmYXVsdENoYW5uZWxzIiwic2VuZFdlbGNvbWVFbWFpbCIsInZhbGlkYXRlQ3VzdG9tRmllbGRzIiwibmV3VXNlcklkIiwic2F2ZVVzZXIiLCJzYXZlQ3VzdG9tRmllbGRzV2l0aG91dFZhbGlkYXRpb24iLCJnZXRVUkwiLCJjZG4iLCJmdWxsIiwic2V0SGVhZGVyIiwiaXNVc2VyRnJvbVBhcmFtcyIsInByZXNlbmNlIiwiY29ubmVjdGlvblN0YXR1cyIsImF2YXRhclVybCIsInNldFVzZXJBdmF0YXIiLCJpbWFnZURhdGEiLCJ1c2VyRGF0YSIsInNhdmVDdXN0b21GaWVsZHMiLCJjdXJyZW50UGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsInJlYWxuYW1lIiwidHlwZWRQYXNzd29yZCIsIm5ld1Jvb21Ob3RpZmljYXRpb24iLCJuZXdNZXNzYWdlTm90aWZpY2F0aW9uIiwidXNlRW1vamlzIiwiY29udmVydEFzY2lpRW1vamkiLCJzYXZlTW9iaWxlQmFuZHdpZHRoIiwiY29sbGFwc2VNZWRpYUJ5RGVmYXVsdCIsImF1dG9JbWFnZUxvYWQiLCJlbWFpbE5vdGlmaWNhdGlvbk1vZGUiLCJ1bnJlYWRBbGVydCIsIm5vdGlmaWNhdGlvbnNTb3VuZFZvbHVtZSIsImRlc2t0b3BOb3RpZmljYXRpb25zIiwibW9iaWxlTm90aWZpY2F0aW9ucyIsImVuYWJsZUF1dG9Bd2F5IiwiaGlnaGxpZ2h0cyIsImRlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbiIsIm1lc3NhZ2VWaWV3TW9kZSIsImhpZGVVc2VybmFtZXMiLCJoaWRlUm9sZXMiLCJoaWRlQXZhdGFycyIsImhpZGVGbGV4VGFiIiwic2VuZE9uRW50ZXIiLCJyb29tQ291bnRlclNpZGViYXIiLCJzaWRlYmFyU2hvd0Zhdm9yaXRlcyIsIk9wdGlvbmFsIiwic2lkZWJhclNob3dVbnJlYWQiLCJzaWRlYmFyU29ydGJ5Iiwic2lkZWJhclZpZXdNb2RlIiwic2lkZWJhckhpZGVBdmF0YXIiLCJzaWRlYmFyR3JvdXBCeVR5cGUiLCJtdXRlRm9jdXNlZENvbnZlcnNhdGlvbnMiLCJjdXJyZW50VXNlclJvbGVzIiwiZW1haWxTZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFFTixNQUFNQyxTQUFTLElBQUlDLE1BQUosQ0FBVyxLQUFYLEVBQWtCLEVBQWxCLENBQWY7O0FBRUEsTUFBTUMsR0FBTixTQUFrQkMsUUFBbEIsQ0FBMkI7QUFDMUJDLGNBQVlDLFVBQVosRUFBd0I7QUFDdkIsVUFBTUEsVUFBTjtBQUNBLFNBQUtDLFdBQUwsR0FBbUIsRUFBbkI7QUFDQSxTQUFLQyxjQUFMLEdBQXNCLEdBQXRCO0FBQ0EsU0FBS0Msc0JBQUwsR0FBOEI7QUFDN0JDLGdCQUFVLENBRG1CO0FBRTdCQyxhQUFPLENBRnNCO0FBRzdCQyxZQUFNLENBSHVCO0FBSTdCQyxlQUFTLENBSm9CO0FBSzdCQyxpQkFBVyxDQUxrQjtBQUtmO0FBQ2RDLGlCQUFXO0FBTmtCLEtBQTlCO0FBUUEsU0FBS0MsMEJBQUwsR0FBa0M7QUFDakNDLG9CQUFjLENBRG1CO0FBRWpDQyxjQUFRLENBRnlCO0FBR2pDQyxhQUFPLENBSDBCO0FBSWpDQyx3QkFBa0IsQ0FKZTtBQUtqQ0MsaUJBQVcsQ0FMc0I7QUFNakNDLGlCQUFXLENBTnNCO0FBT2pDQyxnQkFBVSxDQVB1QjtBQVFqQ0MsNkJBQXVCLENBUlU7QUFTakNDLG1DQUE2QixDQVRJO0FBVWpDQyxhQUFPLENBVjBCO0FBV2pDQyxxQkFBZSxDQVhrQjtBQVlqQ0Msa0JBQVksQ0FacUI7QUFhakNDLG9CQUFjLENBYm1CO0FBY2pDQyxn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WTtBQUNYLGFBQU8zRCxXQUFXbkMsR0FBWCxDQUFlcUYsRUFBZixDQUFrQjlCLE9BQWxCLENBQTBCLGlDQUExQixDQUFQO0FBQ0E7O0FBRUQsVUFBTXNmLFlBQVl0YixPQUFPQyxJQUFQLENBQVkseUJBQVosRUFBdUMxQixLQUF2QyxDQUFsQjs7QUFDQSxRQUFJK2MsU0FBSixFQUFlO0FBQ2QsYUFBTzFnQixXQUFXbkMsR0FBWCxDQUFlcUYsRUFBZixDQUFrQnBDLE9BQWxCLEVBQVA7QUFDQTs7QUFDRCxXQUFPZCxXQUFXbkMsR0FBWCxDQUFlcUYsRUFBZixDQUFrQjlCLE9BQWxCLENBQTBCLGdCQUExQixDQUFQO0FBQ0E7O0FBWjBFLENBQTVFO0FBZUFwQixXQUFXbkMsR0FBWCxDQUFlcUYsRUFBZixDQUFrQnhCLFFBQWxCLENBQTJCLDZCQUEzQixFQUEwRDtBQUFFOEMsZ0JBQWM7QUFBaEIsQ0FBMUQsRUFBa0Y7QUFDakZ2RSxRQUFNO0FBQ0wsVUFBTWMsU0FBU3FFLE9BQU80SSxTQUFQLENBQWlCLEtBQUtySSxNQUF0QixFQUE4QixNQUFNUCxPQUFPQyxJQUFQLENBQVksdUJBQVosQ0FBcEMsQ0FBZjtBQUVBLFdBQU9yRixXQUFXbkMsR0FBWCxDQUFlcUYsRUFBZixDQUFrQnBDLE9BQWxCLENBQTBCO0FBQUVDO0FBQUYsS0FBMUIsQ0FBUDtBQUNBOztBQUxnRixDQUFsRixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2FwaS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBSZXN0aXZ1cywgRERQLCBERFBDb21tb24gKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignQVBJJywge30pO1xuXG5jbGFzcyBBUEkgZXh0ZW5kcyBSZXN0aXZ1cyB7XG5cdGNvbnN0cnVjdG9yKHByb3BlcnRpZXMpIHtcblx0XHRzdXBlcihwcm9wZXJ0aWVzKTtcblx0XHR0aGlzLmF1dGhNZXRob2RzID0gW107XG5cdFx0dGhpcy5maWVsZFNlcGFyYXRvciA9ICcuJztcblx0XHR0aGlzLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgPSB7XG5cdFx0XHRqb2luQ29kZTogMCxcblx0XHRcdCRsb2tpOiAwLFxuXHRcdFx0bWV0YTogMCxcblx0XHRcdG1lbWJlcnM6IDAsXG5cdFx0XHR1c2VybmFtZXM6IDAsIC8vIFBsZWFzZSB1c2UgdGhlIGBjaGFubmVsL2RtL2dyb3VwLm1lbWJlcnNgIGVuZHBvaW50LiBUaGlzIGlzIGRpc2FibGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zXG5cdFx0XHRpbXBvcnRJZHM6IDBcblx0XHR9O1xuXHRcdHRoaXMubGltaXRlZFVzZXJGaWVsZHNUb0V4Y2x1ZGUgPSB7XG5cdFx0XHRhdmF0YXJPcmlnaW46IDAsXG5cdFx0XHRlbWFpbHM6IDAsXG5cdFx0XHRwaG9uZTogMCxcblx0XHRcdHN0YXR1c0Nvbm5lY3Rpb246IDAsXG5cdFx0XHRjcmVhdGVkQXQ6IDAsXG5cdFx0XHRsYXN0TG9naW46IDAsXG5cdFx0XHRzZXJ2aWNlczogMCxcblx0XHRcdHJlcXVpcmVQYXNzd29yZENoYW5nZTogMCxcblx0XHRcdHJlcXVpcmVQYXNzd29yZENoYW5nZVJlYXNvbjogMCxcblx0XHRcdHJvbGVzOiAwLFxuXHRcdFx0c3RhdHVzRGVmYXVsdDogMCxcblx0XHRcdF91cGRhdGVkQXQ6IDAsXG5cdFx0XHRjdXN0b21GaWVsZHM6IDAsXG5cdFx0XHRzZXR0aW5nczogMFxuXHRcdH07XG5cdFx0dGhpcy5saW1pdGVkVXNlckZpZWxkc1RvRXhjbHVkZUlmSXNQcml2aWxlZ2VkVXNlciA9IHtcblx0XHRcdHNlcnZpY2VzOiAwXG5cdFx0fTtcblxuXHRcdHRoaXMuX2NvbmZpZy5kZWZhdWx0T3B0aW9uc0VuZHBvaW50ID0gZnVuY3Rpb24gX2RlZmF1bHRPcHRpb25zRW5kcG9pbnQoKSB7XG5cdFx0XHRpZiAodGhpcy5yZXF1ZXN0Lm1ldGhvZCA9PT0gJ09QVElPTlMnICYmIHRoaXMucmVxdWVzdC5oZWFkZXJzWydhY2Nlc3MtY29udHJvbC1yZXF1ZXN0LW1ldGhvZCddKSB7XG5cdFx0XHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0VuYWJsZV9DT1JTJykgPT09IHRydWUpIHtcblx0XHRcdFx0XHR0aGlzLnJlc3BvbnNlLndyaXRlSGVhZCgyMDAsIHtcblx0XHRcdFx0XHRcdCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0NPUlNfT3JpZ2luJyksXG5cdFx0XHRcdFx0XHQnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICdPcmlnaW4sIFgtUmVxdWVzdGVkLVdpdGgsIENvbnRlbnQtVHlwZSwgQWNjZXB0LCBYLVVzZXItSWQsIFgtQXV0aC1Ub2tlbidcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnJlc3BvbnNlLndyaXRlSGVhZCg0MDUpO1xuXHRcdFx0XHRcdHRoaXMucmVzcG9uc2Uud3JpdGUoJ0NPUlMgbm90IGVuYWJsZWQuIEdvIHRvIFwiQWRtaW4gPiBHZW5lcmFsID4gUkVTVCBBcGlcIiB0byBlbmFibGUgaXQuJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMucmVzcG9uc2Uud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZG9uZSgpO1xuXHRcdH07XG5cdH1cblxuXHRoYXNIZWxwZXJNZXRob2RzKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNpemUgIT09IDA7XG5cdH1cblxuXHRnZXRIZWxwZXJNZXRob2RzKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzO1xuXHR9XG5cblx0Z2V0SGVscGVyTWV0aG9kKG5hbWUpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5nZXQobmFtZSk7XG5cdH1cblxuXHRhZGRBdXRoTWV0aG9kKG1ldGhvZCkge1xuXHRcdHRoaXMuYXV0aE1ldGhvZHMucHVzaChtZXRob2QpO1xuXHR9XG5cblx0c3VjY2VzcyhyZXN1bHQgPSB7fSkge1xuXHRcdGlmIChfLmlzT2JqZWN0KHJlc3VsdCkpIHtcblx0XHRcdHJlc3VsdC5zdWNjZXNzID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXN1bHQgPSB7XG5cdFx0XHRzdGF0dXNDb2RlOiAyMDAsXG5cdFx0XHRib2R5OiByZXN1bHRcblx0XHR9O1xuXG5cdFx0bG9nZ2VyLmRlYnVnKCdTdWNjZXNzJywgcmVzdWx0KTtcblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRmYWlsdXJlKHJlc3VsdCwgZXJyb3JUeXBlKSB7XG5cdFx0aWYgKF8uaXNPYmplY3QocmVzdWx0KSkge1xuXHRcdFx0cmVzdWx0LnN1Y2Nlc3MgPSBmYWxzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0ID0ge1xuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0ZXJyb3I6IHJlc3VsdFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKGVycm9yVHlwZSkge1xuXHRcdFx0XHRyZXN1bHQuZXJyb3JUeXBlID0gZXJyb3JUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJlc3VsdCA9IHtcblx0XHRcdHN0YXR1c0NvZGU6IDQwMCxcblx0XHRcdGJvZHk6IHJlc3VsdFxuXHRcdH07XG5cblx0XHRsb2dnZXIuZGVidWcoJ0ZhaWx1cmUnLCByZXN1bHQpO1xuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdG5vdEZvdW5kKG1zZykge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRib2R5OiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogbXNnID8gbXNnIDogJ1Jlc291cmNlIG5vdCBmb3VuZCdcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0dW5hdXRob3JpemVkKG1zZykge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXNDb2RlOiA0MDMsXG5cdFx0XHRib2R5OiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogbXNnID8gbXNnIDogJ3VuYXV0aG9yaXplZCdcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0YWRkUm91dGUocm91dGVzLCBvcHRpb25zLCBlbmRwb2ludHMpIHtcblx0XHQvL05vdGU6IHJlcXVpcmVkIGlmIHRoZSBkZXZlbG9wZXIgZGlkbid0IHByb3ZpZGUgb3B0aW9uc1xuXHRcdGlmICh0eXBlb2YgZW5kcG9pbnRzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0ZW5kcG9pbnRzID0gb3B0aW9ucztcblx0XHRcdG9wdGlvbnMgPSB7fTtcblx0XHR9XG5cblx0XHQvL0FsbG93IGZvciBtb3JlIHRoYW4gb25lIHJvdXRlIHVzaW5nIHRoZSBzYW1lIG9wdGlvbiBhbmQgZW5kcG9pbnRzXG5cdFx0aWYgKCFfLmlzQXJyYXkocm91dGVzKSkge1xuXHRcdFx0cm91dGVzID0gW3JvdXRlc107XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmVyc2lvbiA9IHRoaXMuX2NvbmZpZy52ZXJzaW9uO1xuXG5cdFx0cm91dGVzLmZvckVhY2goKHJvdXRlKSA9PiB7XG5cdFx0XHQvL05vdGU6IFRoaXMgaXMgcmVxdWlyZWQgZHVlIHRvIFJlc3RpdnVzIGNhbGxpbmcgYGFkZFJvdXRlYCBpbiB0aGUgY29uc3RydWN0b3Igb2YgaXRzZWxmXG5cdFx0XHRPYmplY3Qua2V5cyhlbmRwb2ludHMpLmZvckVhY2goKG1ldGhvZCkgPT4ge1xuXHRcdFx0XHRpZiAodHlwZW9mIGVuZHBvaW50c1ttZXRob2RdID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0ZW5kcG9pbnRzW21ldGhvZF0gPSB7IGFjdGlvbjogZW5kcG9pbnRzW21ldGhvZF0gfTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vQWRkIGEgdHJ5L2NhdGNoIGZvciBlYWNoIGVuZHBvaW50XG5cdFx0XHRcdGNvbnN0IG9yaWdpbmFsQWN0aW9uID0gZW5kcG9pbnRzW21ldGhvZF0uYWN0aW9uO1xuXHRcdFx0XHRlbmRwb2ludHNbbWV0aG9kXS5hY3Rpb24gPSBmdW5jdGlvbiBfaW50ZXJuYWxSb3V0ZUFjdGlvbkhhbmRsZXIoKSB7XG5cdFx0XHRcdFx0Y29uc3Qgcm9ja2V0Y2hhdFJlc3RBcGlFbmQgPSBSb2NrZXRDaGF0Lm1ldHJpY3Mucm9ja2V0Y2hhdFJlc3RBcGkuc3RhcnRUaW1lcih7XG5cdFx0XHRcdFx0XHRtZXRob2QsXG5cdFx0XHRcdFx0XHR2ZXJzaW9uLFxuXHRcdFx0XHRcdFx0dXNlcl9hZ2VudDogdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3VzZXItYWdlbnQnXSxcblx0XHRcdFx0XHRcdGVudHJ5cG9pbnQ6IHJvdXRlXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRsb2dnZXIuZGVidWcoYCR7IHRoaXMucmVxdWVzdC5tZXRob2QudG9VcHBlckNhc2UoKSB9OiAkeyB0aGlzLnJlcXVlc3QudXJsIH1gKTtcblx0XHRcdFx0XHRsZXQgcmVzdWx0O1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRyZXN1bHQgPSBvcmlnaW5hbEFjdGlvbi5hcHBseSh0aGlzKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRsb2dnZXIuZGVidWcoYCR7IG1ldGhvZCB9ICR7IHJvdXRlIH0gdGhyZXcgYW4gZXJyb3I6YCwgZS5zdGFjayk7XG5cdFx0XHRcdFx0XHRyZXN1bHQgPSBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUubWVzc2FnZSwgZS5lcnJvcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzdWx0ID0gcmVzdWx0IHx8IFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblxuXHRcdFx0XHRcdHJvY2tldGNoYXRSZXN0QXBpRW5kKHtcblx0XHRcdFx0XHRcdHN0YXR1czogcmVzdWx0LnN0YXR1c0NvZGVcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0aWYgKHRoaXMuaGFzSGVscGVyTWV0aG9kcygpKSB7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBbbmFtZSwgaGVscGVyTWV0aG9kXSBvZiB0aGlzLmdldEhlbHBlck1ldGhvZHMoKSkge1xuXHRcdFx0XHRcdFx0ZW5kcG9pbnRzW21ldGhvZF1bbmFtZV0gPSBoZWxwZXJNZXRob2Q7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9BbGxvdyB0aGUgZW5kcG9pbnRzIHRvIG1ha2UgdXNhZ2Ugb2YgdGhlIGxvZ2dlciB3aGljaCByZXNwZWN0cyB0aGUgdXNlcidzIHNldHRpbmdzXG5cdFx0XHRcdGVuZHBvaW50c1ttZXRob2RdLmxvZ2dlciA9IGxvZ2dlcjtcblx0XHRcdH0pO1xuXG5cdFx0XHRzdXBlci5hZGRSb3V0ZShyb3V0ZSwgb3B0aW9ucywgZW5kcG9pbnRzKTtcblx0XHR9KTtcblx0fVxuXG5cdF9pbml0QXV0aCgpIHtcblx0XHRjb25zdCBsb2dpbkNvbXBhdGliaWxpdHkgPSAoYm9keVBhcmFtcykgPT4ge1xuXHRcdFx0Ly8gR3JhYiB0aGUgdXNlcm5hbWUgb3IgZW1haWwgdGhhdCB0aGUgdXNlciBpcyBsb2dnaW5nIGluIHdpdGhcblx0XHRcdGNvbnN0IHt1c2VyLCB1c2VybmFtZSwgZW1haWwsIHBhc3N3b3JkLCBjb2RlfSA9IGJvZHlQYXJhbXM7XG5cblx0XHRcdGlmIChwYXNzd29yZCA9PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiBib2R5UGFyYW1zO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoXy53aXRob3V0KE9iamVjdC5rZXlzKGJvZHlQYXJhbXMpLCAndXNlcicsICd1c2VybmFtZScsICdlbWFpbCcsICdwYXNzd29yZCcsICdjb2RlJykubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRyZXR1cm4gYm9keVBhcmFtcztcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgYXV0aCA9IHtcblx0XHRcdFx0cGFzc3dvcmRcblx0XHRcdH07XG5cblx0XHRcdGlmICh0eXBlb2YgdXNlciA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0YXV0aC51c2VyID0gdXNlci5pbmNsdWRlcygnQCcpID8ge2VtYWlsOiB1c2VyfSA6IHt1c2VybmFtZTogdXNlcn07XG5cdFx0XHR9IGVsc2UgaWYgKHVzZXJuYW1lKSB7XG5cdFx0XHRcdGF1dGgudXNlciA9IHt1c2VybmFtZX07XG5cdFx0XHR9IGVsc2UgaWYgKGVtYWlsKSB7XG5cdFx0XHRcdGF1dGgudXNlciA9IHtlbWFpbH07XG5cdFx0XHR9XG5cblx0XHRcdGlmIChhdXRoLnVzZXIgPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gYm9keVBhcmFtcztcblx0XHRcdH1cblxuXHRcdFx0aWYgKGF1dGgucGFzc3dvcmQuaGFzaGVkKSB7XG5cdFx0XHRcdGF1dGgucGFzc3dvcmQgPSB7XG5cdFx0XHRcdFx0ZGlnZXN0OiBhdXRoLnBhc3N3b3JkLFxuXHRcdFx0XHRcdGFsZ29yaXRobTogJ3NoYS0yNTYnXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjb2RlKSB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0dG90cDoge1xuXHRcdFx0XHRcdFx0Y29kZSxcblx0XHRcdFx0XHRcdGxvZ2luOiBhdXRoXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYXV0aDtcblx0XHR9O1xuXG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLmFkZFJvdXRlKCdsb2dpbicsIHthdXRoUmVxdWlyZWQ6IGZhbHNlfSwge1xuXHRcdFx0cG9zdCgpIHtcblx0XHRcdFx0Y29uc3QgYXJncyA9IGxvZ2luQ29tcGF0aWJpbGl0eSh0aGlzLmJvZHlQYXJhbXMpO1xuXHRcdFx0XHRjb25zdCBnZXRVc2VySW5mbyA9IHNlbGYuZ2V0SGVscGVyTWV0aG9kKCdnZXRVc2VySW5mbycpO1xuXG5cdFx0XHRcdGNvbnN0IGludm9jYXRpb24gPSBuZXcgRERQQ29tbW9uLk1ldGhvZEludm9jYXRpb24oe1xuXHRcdFx0XHRcdGNvbm5lY3Rpb246IHtcblx0XHRcdFx0XHRcdGNsb3NlKCkge31cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGxldCBhdXRoO1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF1dGggPSBERFAuX0N1cnJlbnRJbnZvY2F0aW9uLndpdGhWYWx1ZShpbnZvY2F0aW9uLCAoKSA9PiBNZXRlb3IuY2FsbCgnbG9naW4nLCBhcmdzKSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0bGV0IGUgPSBlcnJvcjtcblx0XHRcdFx0XHRpZiAoZXJyb3IucmVhc29uID09PSAnVXNlciBub3QgZm91bmQnKSB7XG5cdFx0XHRcdFx0XHRlID0ge1xuXHRcdFx0XHRcdFx0XHRlcnJvcjogJ1VuYXV0aG9yaXplZCcsXG5cdFx0XHRcdFx0XHRcdHJlYXNvbjogJ1VuYXV0aG9yaXplZCdcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMSxcblx0XHRcdFx0XHRcdGJvZHk6IHtcblx0XHRcdFx0XHRcdFx0c3RhdHVzOiAnZXJyb3InLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogZS5lcnJvcixcblx0XHRcdFx0XHRcdFx0bWVzc2FnZTogZS5yZWFzb24gfHwgZS5tZXNzYWdlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMudXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtcblx0XHRcdFx0XHRfaWQ6IGF1dGguaWRcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0dGhpcy51c2VySWQgPSB0aGlzLnVzZXIuX2lkO1xuXG5cdFx0XHRcdC8vIFJlbW92ZSB0b2tlbkV4cGlyZXMgdG8ga2VlcCB0aGUgb2xkIGJlaGF2aW9yXG5cdFx0XHRcdE1ldGVvci51c2Vycy51cGRhdGUoe1xuXHRcdFx0XHRcdF9pZDogdGhpcy51c2VyLl9pZCxcblx0XHRcdFx0XHQnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLmhhc2hlZFRva2VuJzogQWNjb3VudHMuX2hhc2hMb2dpblRva2VuKGF1dGgudG9rZW4pXG5cdFx0XHRcdH0sIHtcblx0XHRcdFx0XHQkdW5zZXQ6IHtcblx0XHRcdFx0XHRcdCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuJC53aGVuJzogMVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Y29uc3QgcmVzcG9uc2UgPSB7XG5cdFx0XHRcdFx0c3RhdHVzOiAnc3VjY2VzcycsXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0dXNlcklkOiB0aGlzLnVzZXJJZCxcblx0XHRcdFx0XHRcdGF1dGhUb2tlbjogYXV0aC50b2tlbixcblx0XHRcdFx0XHRcdG1lOiBnZXRVc2VySW5mbyh0aGlzLnVzZXIpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnN0IGV4dHJhRGF0YSA9IHNlbGYuX2NvbmZpZy5vbkxvZ2dlZEluICYmIHNlbGYuX2NvbmZpZy5vbkxvZ2dlZEluLmNhbGwodGhpcyk7XG5cblx0XHRcdFx0aWYgKGV4dHJhRGF0YSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Xy5leHRlbmQocmVzcG9uc2UuZGF0YSwge1xuXHRcdFx0XHRcdFx0ZXh0cmE6IGV4dHJhRGF0YVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgbG9nb3V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBSZW1vdmUgdGhlIGdpdmVuIGF1dGggdG9rZW4gZnJvbSB0aGUgdXNlcidzIGFjY291bnRcblx0XHRcdGNvbnN0IGF1dGhUb2tlbiA9IHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXTtcblx0XHRcdGNvbnN0IGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hMb2dpblRva2VuKGF1dGhUb2tlbik7XG5cdFx0XHRjb25zdCB0b2tlbkxvY2F0aW9uID0gc2VsZi5fY29uZmlnLmF1dGgudG9rZW47XG5cdFx0XHRjb25zdCBpbmRleCA9IHRva2VuTG9jYXRpb24ubGFzdEluZGV4T2YoJy4nKTtcblx0XHRcdGNvbnN0IHRva2VuUGF0aCA9IHRva2VuTG9jYXRpb24uc3Vic3RyaW5nKDAsIGluZGV4KTtcblx0XHRcdGNvbnN0IHRva2VuRmllbGROYW1lID0gdG9rZW5Mb2NhdGlvbi5zdWJzdHJpbmcoaW5kZXggKyAxKTtcblx0XHRcdGNvbnN0IHRva2VuVG9SZW1vdmUgPSB7fTtcblx0XHRcdHRva2VuVG9SZW1vdmVbdG9rZW5GaWVsZE5hbWVdID0gaGFzaGVkVG9rZW47XG5cdFx0XHRjb25zdCB0b2tlblJlbW92YWxRdWVyeSA9IHt9O1xuXHRcdFx0dG9rZW5SZW1vdmFsUXVlcnlbdG9rZW5QYXRoXSA9IHRva2VuVG9SZW1vdmU7XG5cblx0XHRcdE1ldGVvci51c2Vycy51cGRhdGUodGhpcy51c2VyLl9pZCwge1xuXHRcdFx0XHQkcHVsbDogdG9rZW5SZW1vdmFsUXVlcnlcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCByZXNwb25zZSA9IHtcblx0XHRcdFx0c3RhdHVzOiAnc3VjY2VzcycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRtZXNzYWdlOiAnWW91XFwndmUgYmVlbiBsb2dnZWQgb3V0ISdcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0Ly8gQ2FsbCB0aGUgbG9nb3V0IGhvb2sgd2l0aCB0aGUgYXV0aGVudGljYXRlZCB1c2VyIGF0dGFjaGVkXG5cdFx0XHRjb25zdCBleHRyYURhdGEgPSBzZWxmLl9jb25maWcub25Mb2dnZWRPdXQgJiYgc2VsZi5fY29uZmlnLm9uTG9nZ2VkT3V0LmNhbGwodGhpcyk7XG5cdFx0XHRpZiAoZXh0cmFEYXRhICE9IG51bGwpIHtcblx0XHRcdFx0Xy5leHRlbmQocmVzcG9uc2UuZGF0YSwge1xuXHRcdFx0XHRcdGV4dHJhOiBleHRyYURhdGFcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fTtcblxuXHRcdC8qXG5cdFx0XHRBZGQgYSBsb2dvdXQgZW5kcG9pbnQgdG8gdGhlIEFQSVxuXHRcdFx0QWZ0ZXIgdGhlIHVzZXIgaXMgbG9nZ2VkIG91dCwgdGhlIG9uTG9nZ2VkT3V0IGhvb2sgaXMgY2FsbGVkIChzZWUgUmVzdGZ1bGx5LmNvbmZpZ3VyZSgpIGZvclxuXHRcdFx0YWRkaW5nIGhvb2spLlxuXHRcdCovXG5cdFx0cmV0dXJuIHRoaXMuYWRkUm91dGUoJ2xvZ291dCcsIHtcblx0XHRcdGF1dGhSZXF1aXJlZDogdHJ1ZVxuXHRcdH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdXYXJuaW5nOiBEZWZhdWx0IGxvZ291dCB2aWEgR0VUIHdpbGwgYmUgcmVtb3ZlZCBpbiBSZXN0aXZ1cyB2MS4wLiBVc2UgUE9TVCBpbnN0ZWFkLicpO1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJyAgICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2thaG1hbGkvbWV0ZW9yLXJlc3RpdnVzL2lzc3Vlcy8xMDAnKTtcblx0XHRcdFx0cmV0dXJuIGxvZ291dC5jYWxsKHRoaXMpO1xuXHRcdFx0fSxcblx0XHRcdHBvc3Q6IGxvZ291dFxuXHRcdH0pO1xuXHR9XG59XG5cbmNvbnN0IGdldFVzZXJBdXRoID0gZnVuY3Rpb24gX2dldFVzZXJBdXRoKCkge1xuXHRjb25zdCBpbnZhbGlkUmVzdWx0cyA9IFt1bmRlZmluZWQsIG51bGwsIGZhbHNlXTtcblx0cmV0dXJuIHtcblx0XHR0b2tlbjogJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbicsXG5cdFx0dXNlcigpIHtcblx0XHRcdGlmICh0aGlzLmJvZHlQYXJhbXMgJiYgdGhpcy5ib2R5UGFyYW1zLnBheWxvYWQpIHtcblx0XHRcdFx0dGhpcy5ib2R5UGFyYW1zID0gSlNPTi5wYXJzZSh0aGlzLmJvZHlQYXJhbXMucGF5bG9hZCk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgUm9ja2V0Q2hhdC5BUEkudjEuYXV0aE1ldGhvZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc3QgbWV0aG9kID0gUm9ja2V0Q2hhdC5BUEkudjEuYXV0aE1ldGhvZHNbaV07XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdFx0XHRpZiAoIWludmFsaWRSZXN1bHRzLmluY2x1ZGVzKHJlc3VsdCkpIHtcblx0XHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGxldCB0b2tlbjtcblx0XHRcdGlmICh0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10pIHtcblx0XHRcdFx0dG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4odGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtYXV0aC10b2tlbiddKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXNlcklkOiB0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC11c2VyLWlkJ10sXG5cdFx0XHRcdHRva2VuXG5cdFx0XHR9O1xuXHRcdH1cblx0fTtcbn07XG5cblJvY2tldENoYXQuQVBJID0ge1xuXHRoZWxwZXJNZXRob2RzOiBuZXcgTWFwKCksXG5cdGdldFVzZXJBdXRoLFxuXHRBcGlDbGFzczogQVBJXG59O1xuXG5jb25zdCBjcmVhdGVBcGkgPSBmdW5jdGlvbiBfY3JlYXRlQXBpKGVuYWJsZUNvcnMpIHtcblx0aWYgKCFSb2NrZXRDaGF0LkFQSS52MSB8fCBSb2NrZXRDaGF0LkFQSS52MS5fY29uZmlnLmVuYWJsZUNvcnMgIT09IGVuYWJsZUNvcnMpIHtcblx0XHRSb2NrZXRDaGF0LkFQSS52MSA9IG5ldyBBUEkoe1xuXHRcdFx0dmVyc2lvbjogJ3YxJyxcblx0XHRcdHVzZURlZmF1bHRBdXRoOiB0cnVlLFxuXHRcdFx0cHJldHR5SnNvbjogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcsXG5cdFx0XHRlbmFibGVDb3JzLFxuXHRcdFx0YXV0aDogZ2V0VXNlckF1dGgoKVxuXHRcdH0pO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LkFQSS5kZWZhdWx0IHx8IFJvY2tldENoYXQuQVBJLmRlZmF1bHQuX2NvbmZpZy5lbmFibGVDb3JzICE9PSBlbmFibGVDb3JzKSB7XG5cdFx0Um9ja2V0Q2hhdC5BUEkuZGVmYXVsdCA9IG5ldyBBUEkoe1xuXHRcdFx0dXNlRGVmYXVsdEF1dGg6IHRydWUsXG5cdFx0XHRwcmV0dHlKc29uOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jyxcblx0XHRcdGVuYWJsZUNvcnMsXG5cdFx0XHRhdXRoOiBnZXRVc2VyQXV0aCgpXG5cdFx0fSk7XG5cdH1cbn07XG5cbi8vIHJlZ2lzdGVyIHRoZSBBUEkgdG8gYmUgcmUtY3JlYXRlZCBvbmNlIHRoZSBDT1JTLXNldHRpbmcgY2hhbmdlcy5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRW5hYmxlX0NPUlMnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRjcmVhdGVBcGkodmFsdWUpO1xufSk7XG5cbi8vIGFsc28gY3JlYXRlIHRoZSBBUEkgaW1tZWRpYXRlbHlcbmNyZWF0ZUFwaSghIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRW5hYmxlX0NPUlMnKSk7XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdHZW5lcmFsJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuc2VjdGlvbignUkVTVCBBUEknLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnQVBJX1VwcGVyX0NvdW50X0xpbWl0JywgMTAwLCB7IHR5cGU6ICdpbnQnLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfRGVmYXVsdF9Db3VudCcsIDUwLCB7IHR5cGU6ICdpbnQnLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfQWxsb3dfSW5maW5pdGVfQ291bnQnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgcHVibGljOiBmYWxzZSB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX0VuYWJsZV9EaXJlY3RfTWVzc2FnZV9IaXN0b3J5X0VuZFBvaW50JywgZmFsc2UsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfRW5hYmxlX1NoaWVsZHMnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgcHVibGljOiBmYWxzZSB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX1NoaWVsZF9UeXBlcycsICcqJywgeyB0eXBlOiAnc3RyaW5nJywgcHVibGljOiBmYWxzZSwgZW5hYmxlUXVlcnk6IHsgX2lkOiAnQVBJX0VuYWJsZV9TaGllbGRzJywgdmFsdWU6IHRydWUgfSB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX0VuYWJsZV9DT1JTJywgZmFsc2UsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfQ09SU19PcmlnaW4nLCAnKicsIHsgdHlwZTogJ3N0cmluZycsIHB1YmxpYzogZmFsc2UsIGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0FQSV9FbmFibGVfQ09SUycsIHZhbHVlOiB0cnVlIH0gfSk7XG5cdH0pO1xufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNldCgncmVxdWVzdFBhcmFtcycsIGZ1bmN0aW9uIF9yZXF1ZXN0UGFyYW1zKCkge1xuXHRyZXR1cm4gWydQT1NUJywgJ1BVVCddLmluY2x1ZGVzKHRoaXMucmVxdWVzdC5tZXRob2QpID8gdGhpcy5ib2R5UGFyYW1zIDogdGhpcy5xdWVyeVBhcmFtcztcbn0pO1xuIiwiLy8gSWYgdGhlIGNvdW50IHF1ZXJ5IHBhcmFtIGlzIGhpZ2hlciB0aGFuIHRoZSBcIkFQSV9VcHBlcl9Db3VudF9MaW1pdFwiIHNldHRpbmcsIHRoZW4gd2UgbGltaXQgdGhhdFxuLy8gSWYgdGhlIGNvdW50IHF1ZXJ5IHBhcmFtIGlzbid0IGRlZmluZWQsIHRoZW4gd2Ugc2V0IGl0IHRvIHRoZSBcIkFQSV9EZWZhdWx0X0NvdW50XCIgc2V0dGluZ1xuLy8gSWYgdGhlIGNvdW50IGlzIHplcm8sIHRoZW4gdGhhdCBtZWFucyB1bmxpbWl0ZWQgYW5kIGlzIG9ubHkgYWxsb3dlZCBpZiB0aGUgc2V0dGluZyBcIkFQSV9BbGxvd19JbmZpbml0ZV9Db3VudFwiIGlzIHRydWVcblxuUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ2dldFBhZ2luYXRpb25JdGVtcycsIGZ1bmN0aW9uIF9nZXRQYWdpbmF0aW9uSXRlbXMoKSB7XG5cdGNvbnN0IGhhcmRVcHBlckxpbWl0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9VcHBlcl9Db3VudF9MaW1pdCcpIDw9IDAgPyAxMDAgOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1VwcGVyX0NvdW50X0xpbWl0Jyk7XG5cdGNvbnN0IGRlZmF1bHRDb3VudCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRGVmYXVsdF9Db3VudCcpIDw9IDAgPyA1MCA6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRGVmYXVsdF9Db3VudCcpO1xuXHRjb25zdCBvZmZzZXQgPSB0aGlzLnF1ZXJ5UGFyYW1zLm9mZnNldCA/IHBhcnNlSW50KHRoaXMucXVlcnlQYXJhbXMub2Zmc2V0KSA6IDA7XG5cdGxldCBjb3VudCA9IGRlZmF1bHRDb3VudDtcblxuXHQvLyBFbnN1cmUgY291bnQgaXMgYW4gYXBwcm9waWF0ZSBhbW91bnRcblx0aWYgKHR5cGVvZiB0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdGNvdW50ID0gcGFyc2VJbnQodGhpcy5xdWVyeVBhcmFtcy5jb3VudCk7XG5cdH0gZWxzZSB7XG5cdFx0Y291bnQgPSBkZWZhdWx0Q291bnQ7XG5cdH1cblxuXHRpZiAoY291bnQgPiBoYXJkVXBwZXJMaW1pdCkge1xuXHRcdGNvdW50ID0gaGFyZFVwcGVyTGltaXQ7XG5cdH1cblxuXHRpZiAoY291bnQgPT09IDAgJiYgIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfQWxsb3dfSW5maW5pdGVfQ291bnQnKSkge1xuXHRcdGNvdW50ID0gZGVmYXVsdENvdW50O1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRvZmZzZXQsXG5cdFx0Y291bnRcblx0fTtcbn0pO1xuIiwiLy9Db252ZW5pZW5jZSBtZXRob2QsIGFsbW9zdCBuZWVkIHRvIHR1cm4gaXQgaW50byBhIG1pZGRsZXdhcmUgb2Ygc29ydHNcblJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdnZXRVc2VyRnJvbVBhcmFtcycsIGZ1bmN0aW9uIF9nZXRVc2VyRnJvbVBhcmFtcygpIHtcblx0Y29uc3QgZG9lc250RXhpc3QgPSB7IF9kb2VzbnRFeGlzdDogdHJ1ZSB9O1xuXHRsZXQgdXNlcjtcblx0Y29uc3QgcGFyYW1zID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCk7XG5cblx0aWYgKHBhcmFtcy51c2VySWQgJiYgcGFyYW1zLnVzZXJJZC50cmltKCkpIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQocGFyYW1zLnVzZXJJZCkgfHwgZG9lc250RXhpc3Q7XG5cdH0gZWxzZSBpZiAocGFyYW1zLnVzZXJuYW1lICYmIHBhcmFtcy51c2VybmFtZS50cmltKCkpIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUocGFyYW1zLnVzZXJuYW1lKSB8fCBkb2VzbnRFeGlzdDtcblx0fSBlbHNlIGlmIChwYXJhbXMudXNlciAmJiBwYXJhbXMudXNlci50cmltKCkpIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUocGFyYW1zLnVzZXIpIHx8IGRvZXNudEV4aXN0O1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXVzZXItcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInVzZXJJZFwiIG9yIFwidXNlcm5hbWVcIiBwYXJhbSB3YXMgbm90IHByb3ZpZGVkJyk7XG5cdH1cblxuXHRpZiAodXNlci5fZG9lc250RXhpc3QpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnVGhlIHJlcXVpcmVkIFwidXNlcklkXCIgb3IgXCJ1c2VybmFtZVwiIHBhcmFtIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIGFueSB1c2VycycpO1xuXHR9XG5cblx0cmV0dXJuIHVzZXI7XG59KTtcbiIsImNvbnN0IGdldEluZm9Gcm9tVXNlck9iamVjdCA9ICh1c2VyKSA9PiB7XG5cdGNvbnN0IHtcblx0XHRfaWQsXG5cdFx0bmFtZSxcblx0XHRlbWFpbHMsXG5cdFx0c3RhdHVzLFxuXHRcdHN0YXR1c0Nvbm5lY3Rpb24sXG5cdFx0dXNlcm5hbWUsXG5cdFx0dXRjT2Zmc2V0LFxuXHRcdGFjdGl2ZSxcblx0XHRsYW5ndWFnZSxcblx0XHRyb2xlcyxcblx0XHRzZXR0aW5nc1xuXHR9ID0gdXNlcjtcblx0cmV0dXJuIHtcblx0XHRfaWQsXG5cdFx0bmFtZSxcblx0XHRlbWFpbHMsXG5cdFx0c3RhdHVzLFxuXHRcdHN0YXR1c0Nvbm5lY3Rpb24sXG5cdFx0dXNlcm5hbWUsXG5cdFx0dXRjT2Zmc2V0LFxuXHRcdGFjdGl2ZSxcblx0XHRsYW5ndWFnZSxcblx0XHRyb2xlcyxcblx0XHRzZXR0aW5nc1xuXHR9O1xufTtcblxuXG5Sb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNldCgnZ2V0VXNlckluZm8nLCBmdW5jdGlvbiBfZ2V0VXNlckluZm8odXNlcikge1xuXHRjb25zdCBtZSA9IGdldEluZm9Gcm9tVXNlck9iamVjdCh1c2VyKTtcblx0Y29uc3QgaXNWZXJpZmllZEVtYWlsID0gKCkgPT4ge1xuXHRcdGlmIChtZSAmJiBtZS5lbWFpbHMgJiYgQXJyYXkuaXNBcnJheShtZS5lbWFpbHMpKSB7XG5cdFx0XHRyZXR1cm4gbWUuZW1haWxzLmZpbmQoKGVtYWlsKSA9PiBlbWFpbC52ZXJpZmllZCk7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblx0Y29uc3QgZ2V0VXNlclByZWZlcmVuY2VzID0gKCkgPT4ge1xuXHRcdGNvbnN0IGRlZmF1bHRVc2VyU2V0dGluZ1ByZWZpeCA9ICdBY2NvdW50c19EZWZhdWx0X1VzZXJfUHJlZmVyZW5jZXNfJztcblx0XHRjb25zdCBhbGxEZWZhdWx0VXNlclNldHRpbmdzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQobmV3IFJlZ0V4cChgXiR7IGRlZmF1bHRVc2VyU2V0dGluZ1ByZWZpeCB9LiokYCkpO1xuXG5cdFx0cmV0dXJuIGFsbERlZmF1bHRVc2VyU2V0dGluZ3MucmVkdWNlKChhY2N1bXVsYXRvciwgc2V0dGluZykgPT4ge1xuXHRcdFx0Y29uc3Qgc2V0dGluZ1dpdGhvdXRQcmVmaXggPSBzZXR0aW5nLmtleS5yZXBsYWNlKGRlZmF1bHRVc2VyU2V0dGluZ1ByZWZpeCwgJyAnKS50cmltKCk7XG5cdFx0XHRhY2N1bXVsYXRvcltzZXR0aW5nV2l0aG91dFByZWZpeF0gPSBSb2NrZXRDaGF0LmdldFVzZXJQcmVmZXJlbmNlKHVzZXIsIHNldHRpbmdXaXRob3V0UHJlZml4KTtcblx0XHRcdHJldHVybiBhY2N1bXVsYXRvcjtcblx0XHR9LCB7fSk7XG5cdH07XG5cdGNvbnN0IHZlcmlmaWVkRW1haWwgPSBpc1ZlcmlmaWVkRW1haWwoKTtcblx0bWUuZW1haWwgPSB2ZXJpZmllZEVtYWlsID8gdmVyaWZpZWRFbWFpbC5hZGRyZXNzIDogdW5kZWZpbmVkO1xuXHRtZS5zZXR0aW5ncyA9IHtcblx0XHRwcmVmZXJlbmNlczogZ2V0VXNlclByZWZlcmVuY2VzKClcblx0fTtcblxuXHRyZXR1cm4gbWU7XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdpc1VzZXJGcm9tUGFyYW1zJywgZnVuY3Rpb24gX2lzVXNlckZyb21QYXJhbXMoKSB7XG5cdGNvbnN0IHBhcmFtcyA9IHRoaXMucmVxdWVzdFBhcmFtcygpO1xuXG5cdHJldHVybiAoIXBhcmFtcy51c2VySWQgJiYgIXBhcmFtcy51c2VybmFtZSAmJiAhcGFyYW1zLnVzZXIpIHx8XG5cdFx0KHBhcmFtcy51c2VySWQgJiYgdGhpcy51c2VySWQgPT09IHBhcmFtcy51c2VySWQpIHx8XG5cdFx0KHBhcmFtcy51c2VybmFtZSAmJiB0aGlzLnVzZXIudXNlcm5hbWUgPT09IHBhcmFtcy51c2VybmFtZSkgfHxcblx0XHQocGFyYW1zLnVzZXIgJiYgdGhpcy51c2VyLnVzZXJuYW1lID09PSBwYXJhbXMudXNlcik7XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdwYXJzZUpzb25RdWVyeScsIGZ1bmN0aW9uIF9wYXJzZUpzb25RdWVyeSgpIHtcblx0bGV0IHNvcnQ7XG5cdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnNvcnQpIHtcblx0XHR0cnkge1xuXHRcdFx0c29ydCA9IEpTT04ucGFyc2UodGhpcy5xdWVyeVBhcmFtcy5zb3J0KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIHNvcnQgcGFyYW1ldGVyIHByb3ZpZGVkIFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5zb3J0IH1cIjpgLCBlKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtc29ydCcsIGBJbnZhbGlkIHNvcnQgcGFyYW1ldGVyIHByb3ZpZGVkOiBcIiR7IHRoaXMucXVlcnlQYXJhbXMuc29ydCB9XCJgLCB7IGhlbHBlck1ldGhvZDogJ3BhcnNlSnNvblF1ZXJ5JyB9KTtcblx0XHR9XG5cdH1cblxuXHRsZXQgZmllbGRzO1xuXHRpZiAodGhpcy5xdWVyeVBhcmFtcy5maWVsZHMpIHtcblx0XHR0cnkge1xuXHRcdFx0ZmllbGRzID0gSlNPTi5wYXJzZSh0aGlzLnF1ZXJ5UGFyYW1zLmZpZWxkcyk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybihgSW52YWxpZCBmaWVsZHMgcGFyYW1ldGVyIHByb3ZpZGVkIFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5maWVsZHMgfVwiOmAsIGUpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1maWVsZHMnLCBgSW52YWxpZCBmaWVsZHMgcGFyYW1ldGVyIHByb3ZpZGVkOiBcIiR7IHRoaXMucXVlcnlQYXJhbXMuZmllbGRzIH1cImAsIHsgaGVscGVyTWV0aG9kOiAncGFyc2VKc29uUXVlcnknIH0pO1xuXHRcdH1cblx0fVxuXG5cdC8vIFZlcmlmeSB0aGUgdXNlcidzIHNlbGVjdGVkIGZpZWxkcyBvbmx5IGNvbnRhaW5zIG9uZXMgd2hpY2ggdGhlaXIgcm9sZSBhbGxvd3Ncblx0aWYgKHR5cGVvZiBmaWVsZHMgPT09ICdvYmplY3QnKSB7XG5cdFx0bGV0IG5vblNlbGVjdGFibGVGaWVsZHMgPSBPYmplY3Qua2V5cyhSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlKTtcblx0XHRpZiAodGhpcy5yZXF1ZXN0LnJvdXRlLmluY2x1ZGVzKCcvdjEvdXNlcnMuJykpIHtcblx0XHRcdGNvbnN0IGdldEZpZWxkcyA9ICgpID0+IE9iamVjdC5rZXlzKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZnVsbC1vdGhlci11c2VyLWluZm8nKSA/IFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlSWZJc1ByaXZpbGVnZWRVc2VyIDogUm9ja2V0Q2hhdC5BUEkudjEubGltaXRlZFVzZXJGaWVsZHNUb0V4Y2x1ZGUpO1xuXHRcdFx0bm9uU2VsZWN0YWJsZUZpZWxkcyA9IG5vblNlbGVjdGFibGVGaWVsZHMuY29uY2F0KGdldEZpZWxkcygpKTtcblx0XHR9XG5cblx0XHRPYmplY3Qua2V5cyhmaWVsZHMpLmZvckVhY2goKGspID0+IHtcblx0XHRcdGlmIChub25TZWxlY3RhYmxlRmllbGRzLmluY2x1ZGVzKGspIHx8IG5vblNlbGVjdGFibGVGaWVsZHMuaW5jbHVkZXMoay5zcGxpdChSb2NrZXRDaGF0LkFQSS52MS5maWVsZFNlcGFyYXRvcilbMF0pKSB7XG5cdFx0XHRcdGRlbGV0ZSBmaWVsZHNba107XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBMaW1pdCB0aGUgZmllbGRzIGJ5IGRlZmF1bHRcblx0ZmllbGRzID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGRzLCBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlKTtcblx0aWYgKHRoaXMucmVxdWVzdC5yb3V0ZS5pbmNsdWRlcygnL3YxL3VzZXJzLicpKSB7XG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZnVsbC1vdGhlci11c2VyLWluZm8nKSkge1xuXHRcdFx0ZmllbGRzID0gT2JqZWN0LmFzc2lnbihmaWVsZHMsIFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlSWZJc1ByaXZpbGVnZWRVc2VyKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmllbGRzID0gT2JqZWN0LmFzc2lnbihmaWVsZHMsIFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlKTtcblx0XHR9XG5cdH1cblxuXHRsZXQgcXVlcnk7XG5cdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnF1ZXJ5KSB7XG5cdFx0dHJ5IHtcblx0XHRcdHF1ZXJ5ID0gSlNPTi5wYXJzZSh0aGlzLnF1ZXJ5UGFyYW1zLnF1ZXJ5KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIHF1ZXJ5IHBhcmFtZXRlciBwcm92aWRlZCBcIiR7IHRoaXMucXVlcnlQYXJhbXMucXVlcnkgfVwiOmAsIGUpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1xdWVyeScsIGBJbnZhbGlkIHF1ZXJ5IHBhcmFtZXRlciBwcm92aWRlZDogXCIkeyB0aGlzLnF1ZXJ5UGFyYW1zLnF1ZXJ5IH1cImAsIHsgaGVscGVyTWV0aG9kOiAncGFyc2VKc29uUXVlcnknIH0pO1xuXHRcdH1cblx0fVxuXG5cdC8vIFZlcmlmeSB0aGUgdXNlciBoYXMgcGVybWlzc2lvbiB0byBxdWVyeSB0aGUgZmllbGRzIHRoZXkgYXJlXG5cdGlmICh0eXBlb2YgcXVlcnkgPT09ICdvYmplY3QnKSB7XG5cdFx0bGV0IG5vblF1ZXJ5YWJsZUZpZWxkcyA9IE9iamVjdC5rZXlzKFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUpO1xuXHRcdGlmICh0aGlzLnJlcXVlc3Qucm91dGUuaW5jbHVkZXMoJy92MS91c2Vycy4nKSkge1xuXHRcdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZnVsbC1vdGhlci11c2VyLWluZm8nKSkge1xuXHRcdFx0XHRub25RdWVyeWFibGVGaWVsZHMgPSBub25RdWVyeWFibGVGaWVsZHMuY29uY2F0KE9iamVjdC5rZXlzKFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlSWZJc1ByaXZpbGVnZWRVc2VyKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRub25RdWVyeWFibGVGaWVsZHMgPSBub25RdWVyeWFibGVGaWVsZHMuY29uY2F0KE9iamVjdC5rZXlzKFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0T2JqZWN0LmtleXMocXVlcnkpLmZvckVhY2goKGspID0+IHtcblx0XHRcdGlmIChub25RdWVyeWFibGVGaWVsZHMuaW5jbHVkZXMoaykgfHwgbm9uUXVlcnlhYmxlRmllbGRzLmluY2x1ZGVzKGsuc3BsaXQoUm9ja2V0Q2hhdC5BUEkudjEuZmllbGRTZXBhcmF0b3IpWzBdKSkge1xuXHRcdFx0XHRkZWxldGUgcXVlcnlba107XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdHNvcnQsXG5cdFx0ZmllbGRzLFxuXHRcdHF1ZXJ5XG5cdH07XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdkZXByZWNhdGlvbldhcm5pbmcnLCBmdW5jdGlvbiBfZGVwcmVjYXRpb25XYXJuaW5nKHsgZW5kcG9pbnQsIHZlcnNpb25XaWxsQmVSZW1vdmUsIHJlc3BvbnNlIH0pIHtcblx0Y29uc3Qgd2FybmluZ01lc3NhZ2UgPSBgVGhlIGVuZHBvaW50IFwiJHsgZW5kcG9pbnQgfVwiIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBhZnRlciB2ZXJzaW9uICR7IHZlcnNpb25XaWxsQmVSZW1vdmUgfWA7XG5cdGNvbnNvbGUud2Fybih3YXJuaW5nTWVzc2FnZSk7XG5cdGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuXHRcdHJldHVybiB7XG5cdFx0XHR3YXJuaW5nOiB3YXJuaW5nTWVzc2FnZSxcblx0XHRcdC4uLnJlc3BvbnNlXG5cdFx0fTtcblx0fVxuXG5cdHJldHVybiByZXNwb25zZTtcbn0pO1xuXG4iLCJSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNldCgnZ2V0TG9nZ2VkSW5Vc2VyJywgZnVuY3Rpb24gX2dldExvZ2dlZEluVXNlcigpIHtcblx0bGV0IHVzZXI7XG5cblx0aWYgKHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXSAmJiB0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC11c2VyLWlkJ10pIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7XG5cdFx0XHQnX2lkJzogdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtdXNlci1pZCddLFxuXHRcdFx0J3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbic6IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbih0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10pXG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gdXNlcjtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ2luc2VydFVzZXJPYmplY3QnLCBmdW5jdGlvbiBfYWRkVXNlclRvT2JqZWN0KHsgb2JqZWN0LCB1c2VySWQgfSkge1xuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblx0b2JqZWN0LnVzZXIgPSB7IH07XG5cdGlmICh1c2VyKSB7XG5cdFx0b2JqZWN0LnVzZXIgPSB7XG5cdFx0XHRfaWQ6IHVzZXJJZCxcblx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLFxuXHRcdFx0bmFtZTogdXNlci5uYW1lXG5cdFx0fTtcblx0fVxuXG5cblx0cmV0dXJuIG9iamVjdDtcbn0pO1xuXG4iLCJSb2NrZXRDaGF0LkFQSS5kZWZhdWx0LmFkZFJvdXRlKCdpbmZvJywgeyBhdXRoUmVxdWlyZWQ6IGZhbHNlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldExvZ2dlZEluVXNlcigpO1xuXG5cdFx0aWYgKHVzZXIgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNSb2xlKHVzZXIuX2lkLCAnYWRtaW4nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRpbmZvOiBSb2NrZXRDaGF0LkluZm9cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHZlcnNpb246IFJvY2tldENoYXQuSW5mby52ZXJzaW9uXG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbi8vUmV0dXJucyB0aGUgY2hhbm5lbCBJRiBmb3VuZCBvdGhlcndpc2UgaXQgd2lsbCByZXR1cm4gdGhlIGZhaWx1cmUgb2Ygd2h5IGl0IGRpZG4ndC4gQ2hlY2sgdGhlIGBzdGF0dXNDb2RlYCBwcm9wZXJ0eVxuZnVuY3Rpb24gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zLCBjaGVja2VkQXJjaGl2ZWQgPSB0cnVlLCByZXR1cm5Vc2VybmFtZXMgPSBmYWxzZSB9KSB7XG5cdGlmICgoIXBhcmFtcy5yb29tSWQgfHwgIXBhcmFtcy5yb29tSWQudHJpbSgpKSAmJiAoIXBhcmFtcy5yb29tTmFtZSB8fCAhcGFyYW1zLnJvb21OYW1lLnRyaW0oKSkpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29taWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSBwYXJhbWV0ZXIgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgaXMgcmVxdWlyZWQnKTtcblx0fVxuXG5cdGNvbnN0IGZpZWxkcyA9IHsgLi4uUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9O1xuXHRpZiAocmV0dXJuVXNlcm5hbWVzKSB7XG5cdFx0ZGVsZXRlIGZpZWxkcy51c2VybmFtZXM7XG5cdH1cblxuXHRsZXQgcm9vbTtcblx0aWYgKHBhcmFtcy5yb29tSWQpIHtcblx0XHRyb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocGFyYW1zLnJvb21JZCwgeyBmaWVsZHMgfSk7XG5cdH0gZWxzZSBpZiAocGFyYW1zLnJvb21OYW1lKSB7XG5cdFx0cm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUocGFyYW1zLnJvb21OYW1lLCB7IGZpZWxkcyB9KTtcblx0fVxuXG5cdGlmICghcm9vbSB8fCByb29tLnQgIT09ICdjJykge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBwYXJhbSBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCBhbnkgY2hhbm5lbCcpO1xuXHR9XG5cblx0aWYgKGNoZWNrZWRBcmNoaXZlZCAmJiByb29tLmFyY2hpdmVkKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1hcmNoaXZlZCcsIGBUaGUgY2hhbm5lbCwgJHsgcm9vbS5uYW1lIH0sIGlzIGFyY2hpdmVkYCk7XG5cdH1cblxuXHRyZXR1cm4gcm9vbTtcbn1cblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmFkZEFsbCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRBbGxVc2VyVG9Sb29tJywgZmluZFJlc3VsdC5faWQsIHRoaXMuYm9keVBhcmFtcy5hY3RpdmVVc2Vyc09ubHkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuYWRkTW9kZXJhdG9yJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRSb29tTW9kZXJhdG9yJywgZmluZFJlc3VsdC5faWQsIHVzZXIuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuYWRkT3duZXInLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FkZFJvb21Pd25lcicsIGZpbmRSZXN1bHQuX2lkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmFyY2hpdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYXJjaGl2ZVJvb20nLCBmaW5kUmVzdWx0Ll9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuLyoqXG4gREVQUkVDQVRFRFxuIC8vIFRPRE86IFJlbW92ZSB0aGlzIGFmdGVyIHRocmVlIHZlcnNpb25zIGhhdmUgYmVlbiByZWxlYXNlZC4gVGhhdCBtZWFucyBhdCAwLjY3IHRoaXMgc2hvdWxkIGJlIGdvbmUuXG4gKiovXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuY2xlYW5IaXN0b3J5JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubGF0ZXN0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbWV0ZXIgXCJsYXRlc3RcIiBpcyByZXF1aXJlZC4nKTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5vbGRlc3QpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtZXRlciBcIm9sZGVzdFwiIGlzIHJlcXVpcmVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGxhdGVzdCA9IG5ldyBEYXRlKHRoaXMuYm9keVBhcmFtcy5sYXRlc3QpO1xuXHRcdGNvbnN0IG9sZGVzdCA9IG5ldyBEYXRlKHRoaXMuYm9keVBhcmFtcy5vbGRlc3QpO1xuXG5cdFx0bGV0IGluY2x1c2l2ZSA9IGZhbHNlO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmluY2x1c2l2ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGluY2x1c2l2ZSA9IHRoaXMuYm9keVBhcmFtcy5pbmNsdXNpdmU7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2NsZWFuQ2hhbm5lbEhpc3RvcnknLCB7IHJvb21JZDogZmluZFJlc3VsdC5faWQsIGxhdGVzdCwgb2xkZXN0LCBpbmNsdXNpdmUgfSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh0aGlzLmRlcHJlY2F0aW9uV2FybmluZyh7XG5cdFx0XHRlbmRwb2ludDogJ2NoYW5uZWxzLmNsZWFuSGlzdG9yeScsXG5cdFx0XHR2ZXJzaW9uV2lsbEJlUmVtb3ZlOiAndjAuNjcnXG5cdFx0fSkpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmNsb3NlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0Y29uc3Qgc3ViID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQoZmluZFJlc3VsdC5faWQsIHRoaXMudXNlcklkKTtcblxuXHRcdGlmICghc3ViKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIHVzZXIvY2FsbGVlIGlzIG5vdCBpbiB0aGUgY2hhbm5lbCBcIiR7IGZpbmRSZXN1bHQubmFtZSB9LmApO1xuXHRcdH1cblxuXHRcdGlmICghc3ViLm9wZW4pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGBUaGUgY2hhbm5lbCwgJHsgZmluZFJlc3VsdC5uYW1lIH0sIGlzIGFscmVhZHkgY2xvc2VkIHRvIHRoZSBzZW5kZXJgKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnaGlkZVJvb20nLCBmaW5kUmVzdWx0Ll9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmNvdW50ZXJzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgYWNjZXNzID0gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1yb29tLWFkbWluaXN0cmF0aW9uJyk7XG5cdFx0Y29uc3QgcnVzZXJJZCA9IHRoaXMucmVxdWVzdFBhcmFtcygpLnVzZXJJZDtcblx0XHRsZXQgdXNlciA9IHRoaXMudXNlcklkO1xuXHRcdGxldCB1bnJlYWRzID0gbnVsbDtcblx0XHRsZXQgdXNlck1lbnRpb25zID0gbnVsbDtcblx0XHRsZXQgdW5yZWFkc0Zyb20gPSBudWxsO1xuXHRcdGxldCBqb2luZWQgPSBmYWxzZTtcblx0XHRsZXQgbXNncyA9IG51bGw7XG5cdFx0bGV0IGxhdGVzdCA9IG51bGw7XG5cdFx0bGV0IG1lbWJlcnMgPSBudWxsO1xuXHRcdGxldCBsbSA9IG51bGw7XG5cblx0XHRpZiAocnVzZXJJZCkge1xuXHRcdFx0aWYgKCFhY2Nlc3MpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdFx0fVxuXHRcdFx0dXNlciA9IHJ1c2VySWQ7XG5cdFx0fVxuXHRcdGNvbnN0IHJvb20gPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoe1xuXHRcdFx0cGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSxcblx0XHRcdHJldHVyblVzZXJuYW1lczogdHJ1ZVxuXHRcdH0pO1xuXHRcdGNvbnN0IGNoYW5uZWwgPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyb29tLl9pZCwgdXNlcik7XG5cdFx0bG0gPSBjaGFubmVsLl9yb29tLmxtID8gY2hhbm5lbC5fcm9vbS5sbSA6IGNoYW5uZWwuX3Jvb20uX3VwZGF0ZWRBdDtcblxuXHRcdGlmICh0eXBlb2YgY2hhbm5lbCAhPT0gJ3VuZGVmaW5lZCcgJiYgY2hhbm5lbC5vcGVuKSB7XG5cdFx0XHRpZiAoY2hhbm5lbC5scykge1xuXHRcdFx0XHR1bnJlYWRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY291bnRWaXNpYmxlQnlSb29tSWRCZXR3ZWVuVGltZXN0YW1wc0luY2x1c2l2ZShjaGFubmVsLnJpZCwgY2hhbm5lbC5scywgbG0pO1xuXHRcdFx0XHR1bnJlYWRzRnJvbSA9IGNoYW5uZWwubHM7XG5cdFx0XHR9XG5cdFx0XHR1c2VyTWVudGlvbnMgPSBjaGFubmVsLnVzZXJNZW50aW9ucztcblx0XHRcdGpvaW5lZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKGFjY2VzcyB8fCBqb2luZWQpIHtcblx0XHRcdG1zZ3MgPSByb29tLm1zZ3M7XG5cdFx0XHRsYXRlc3QgPSBsbTtcblx0XHRcdG1lbWJlcnMgPSByb29tLnVzZXJuYW1lcy5sZW5ndGg7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0am9pbmVkLFxuXHRcdFx0bWVtYmVycyxcblx0XHRcdHVucmVhZHMsXG5cdFx0XHR1bnJlYWRzRnJvbSxcblx0XHRcdG1zZ3MsXG5cdFx0XHRsYXRlc3QsXG5cdFx0XHR1c2VyTWVudGlvbnNcblx0XHR9KTtcblx0fVxufSk7XG5cbi8vIENoYW5uZWwgLT4gY3JlYXRlXG5cbmZ1bmN0aW9uIGNyZWF0ZUNoYW5uZWxWYWxpZGF0b3IocGFyYW1zKSB7XG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHBhcmFtcy51c2VyLnZhbHVlLCAnY3JlYXRlLWMnKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcigndW5hdXRob3JpemVkJyk7XG5cdH1cblxuXHRpZiAoIXBhcmFtcy5uYW1lIHx8ICFwYXJhbXMubmFtZS52YWx1ZSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgUGFyYW0gXCIkeyBwYXJhbXMubmFtZS5rZXkgfVwiIGlzIHJlcXVpcmVkYCk7XG5cdH1cblxuXHRpZiAocGFyYW1zLm1lbWJlcnMgJiYgcGFyYW1zLm1lbWJlcnMudmFsdWUgJiYgIV8uaXNBcnJheShwYXJhbXMubWVtYmVycy52YWx1ZSkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFBhcmFtIFwiJHsgcGFyYW1zLm1lbWJlcnMua2V5IH1cIiBtdXN0IGJlIGFuIGFycmF5IGlmIHByb3ZpZGVkYCk7XG5cdH1cblxuXHRpZiAocGFyYW1zLmN1c3RvbUZpZWxkcyAmJiBwYXJhbXMuY3VzdG9tRmllbGRzLnZhbHVlICYmICEodHlwZW9mIHBhcmFtcy5jdXN0b21GaWVsZHMudmFsdWUgPT09ICdvYmplY3QnKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgUGFyYW0gXCIkeyBwYXJhbXMuY3VzdG9tRmllbGRzLmtleSB9XCIgbXVzdCBiZSBhbiBvYmplY3QgaWYgcHJvdmlkZWRgKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDaGFubmVsKHVzZXJJZCwgcGFyYW1zKSB7XG5cdGxldCByZWFkT25seSA9IGZhbHNlO1xuXHRpZiAodHlwZW9mIHBhcmFtcy5yZWFkT25seSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRyZWFkT25seSA9IHBhcmFtcy5yZWFkT25seTtcblx0fVxuXG5cdGxldCBpZDtcblx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IHtcblx0XHRpZCA9IE1ldGVvci5jYWxsKCdjcmVhdGVDaGFubmVsJywgcGFyYW1zLm5hbWUsIHBhcmFtcy5tZW1iZXJzID8gcGFyYW1zLm1lbWJlcnMgOiBbXSwgcmVhZE9ubHksIHBhcmFtcy5jdXN0b21GaWVsZHMpO1xuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGlkLnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0fTtcbn1cblxuUm9ja2V0Q2hhdC5BUEkuY2hhbm5lbHMgPSB7fTtcblJvY2tldENoYXQuQVBJLmNoYW5uZWxzLmNyZWF0ZSA9IHtcblx0dmFsaWRhdGU6IGNyZWF0ZUNoYW5uZWxWYWxpZGF0b3IsXG5cdGV4ZWN1dGU6IGNyZWF0ZUNoYW5uZWxcbn07XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5jcmVhdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgdXNlcklkID0gdGhpcy51c2VySWQ7XG5cdFx0Y29uc3QgYm9keVBhcmFtcyA9IHRoaXMuYm9keVBhcmFtcztcblxuXHRcdGxldCBlcnJvcjtcblxuXHRcdHRyeSB7XG5cdFx0XHRSb2NrZXRDaGF0LkFQSS5jaGFubmVscy5jcmVhdGUudmFsaWRhdGUoe1xuXHRcdFx0XHR1c2VyOiB7XG5cdFx0XHRcdFx0dmFsdWU6IHVzZXJJZFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRuYW1lOiB7XG5cdFx0XHRcdFx0dmFsdWU6IGJvZHlQYXJhbXMubmFtZSxcblx0XHRcdFx0XHRrZXk6ICduYW1lJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRtZW1iZXJzOiB7XG5cdFx0XHRcdFx0dmFsdWU6IGJvZHlQYXJhbXMubWVtYmVycyxcblx0XHRcdFx0XHRrZXk6ICdtZW1iZXJzJ1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZS5tZXNzYWdlID09PSAndW5hdXRob3JpemVkJykge1xuXHRcdFx0XHRlcnJvciA9IFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZXJyb3IgPSBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUubWVzc2FnZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRyZXR1cm4gZXJyb3I7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoUm9ja2V0Q2hhdC5BUEkuY2hhbm5lbHMuY3JlYXRlLmV4ZWN1dGUodXNlcklkLCBib2R5UGFyYW1zKSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuZGVsZXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2VyYXNlUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IGZpbmRSZXN1bHRcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5maWxlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXHRcdGNvbnN0IGFkZFVzZXJPYmplY3RUb0V2ZXJ5T2JqZWN0ID0gKGZpbGUpID0+IHtcblx0XHRcdGlmIChmaWxlLnVzZXJJZCkge1xuXHRcdFx0XHRmaWxlID0gdGhpcy5pbnNlcnRVc2VyT2JqZWN0KHsgb2JqZWN0OiBmaWxlLCB1c2VySWQ6IGZpbGUudXNlcklkIH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0fTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgZmluZFJlc3VsdC5faWQsIHRoaXMudXNlcklkKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgcmlkOiBmaW5kUmVzdWx0Ll9pZCB9KTtcblxuXHRcdGNvbnN0IGZpbGVzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGZpbGVzOiBmaWxlcy5tYXAoYWRkVXNlck9iamVjdFRvRXZlcnlPYmplY3QpLFxuXHRcdFx0Y291bnQ6XG5cdFx0XHRmaWxlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuZ2V0SW50ZWdyYXRpb25zJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGxldCBpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMgPSB0cnVlO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5xdWVyeVBhcmFtcy5pbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMgPSB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1ZGVBbGxQdWJsaWNDaGFubmVscyA9PT0gJ3RydWUnO1xuXHRcdH1cblxuXHRcdGxldCBvdXJRdWVyeSA9IHtcblx0XHRcdGNoYW5uZWw6IGAjJHsgZmluZFJlc3VsdC5uYW1lIH1gXG5cdFx0fTtcblxuXHRcdGlmIChpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMpIHtcblx0XHRcdG91clF1ZXJ5LmNoYW5uZWwgPSB7XG5cdFx0XHRcdCRpbjogW291clF1ZXJ5LmNoYW5uZWwsICdhbGxfcHVibGljX2NoYW5uZWxzJ11cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0b3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgb3VyUXVlcnkpO1xuXG5cdFx0Y29uc3QgaW50ZWdyYXRpb25zID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBfY3JlYXRlZEF0OiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW50ZWdyYXRpb25zLFxuXHRcdFx0Y291bnQ6IGludGVncmF0aW9ucy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5oaXN0b3J5JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRsZXQgbGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKCk7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KSB7XG5cdFx0XHRsYXRlc3REYXRlID0gbmV3IERhdGUodGhpcy5xdWVyeVBhcmFtcy5sYXRlc3QpO1xuXHRcdH1cblxuXHRcdGxldCBvbGRlc3REYXRlID0gdW5kZWZpbmVkO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCkge1xuXHRcdFx0b2xkZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMub2xkZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgaW5jbHVzaXZlID0gZmFsc2U7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuaW5jbHVzaXZlKSB7XG5cdFx0XHRpbmNsdXNpdmUgPSB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZTtcblx0XHR9XG5cblx0XHRsZXQgY291bnQgPSAyMDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5jb3VudCkge1xuXHRcdFx0Y291bnQgPSBwYXJzZUludCh0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50KTtcblx0XHR9XG5cblx0XHRsZXQgdW5yZWFkcyA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHMpIHtcblx0XHRcdHVucmVhZHMgPSB0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHM7XG5cdFx0fVxuXG5cdFx0bGV0IHJlc3VsdDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRyZXN1bHQgPSBNZXRlb3IuY2FsbCgnZ2V0Q2hhbm5lbEhpc3RvcnknLCB7XG5cdFx0XHRcdHJpZDogZmluZFJlc3VsdC5faWQsXG5cdFx0XHRcdGxhdGVzdDogbGF0ZXN0RGF0ZSxcblx0XHRcdFx0b2xkZXN0OiBvbGRlc3REYXRlLFxuXHRcdFx0XHRpbmNsdXNpdmUsXG5cdFx0XHRcdGNvdW50LFxuXHRcdFx0XHR1bnJlYWRzXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5pbmZvJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5pbnZpdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FkZFVzZXJUb1Jvb20nLCB7IHJpZDogZmluZFJlc3VsdC5faWQsIHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuam9pbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdqb2luUm9vbScsIGZpbmRSZXN1bHQuX2lkLCB0aGlzLmJvZHlQYXJhbXMuam9pbkNvZGUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMua2ljaycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgncmVtb3ZlVXNlckZyb21Sb29tJywgeyByaWQ6IGZpbmRSZXN1bHQuX2lkLCB1c2VybmFtZTogdXNlci51c2VybmFtZSB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmxlYXZlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2xlYXZlUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldDoge1xuXHRcdC8vVGhpcyBpcyBkZWZpbmVkIGFzIHN1Y2ggb25seSB0byBwcm92aWRlIGFuIGV4YW1wbGUgb2YgaG93IHRoZSByb3V0ZXMgY2FuIGJlIGRlZmluZWQgOlhcblx0XHRhY3Rpb24oKSB7XG5cdFx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRcdGNvbnN0IGhhc1Blcm1pc3Npb25Ub1NlZUFsbFB1YmxpY0NoYW5uZWxzID0gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1jLXJvb20nKTtcblxuXHRcdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyB0OiAnYycgfSk7XG5cblx0XHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWpvaW5lZC1yb29tJykgJiYgIWhhc1Blcm1pc3Npb25Ub1NlZUFsbFB1YmxpY0NoYW5uZWxzKSB7XG5cdFx0XHRcdG91clF1ZXJ5LnVzZXJuYW1lcyA9IHtcblx0XHRcdFx0XHQkaW46IFt0aGlzLnVzZXIudXNlcm5hbWVdXG5cdFx0XHRcdH07XG5cdFx0XHR9IGVsc2UgaWYgKCFoYXNQZXJtaXNzaW9uVG9TZWVBbGxQdWJsaWNDaGFubmVscykge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdFx0ZmllbGRzXG5cdFx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdGNoYW5uZWxzOiByb29tcyxcblx0XHRcdFx0Y291bnQ6IHJvb21zLmxlbmd0aCxcblx0XHRcdFx0b2Zmc2V0LFxuXHRcdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmxpc3Quam9pbmVkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHtcblx0XHRcdHQ6ICdjJyxcblx0XHRcdCd1Ll9pZCc6IHRoaXMudXNlcklkXG5cdFx0fSk7XG5cblx0XHRsZXQgcm9vbXMgPSBfLnBsdWNrKFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZChvdXJRdWVyeSkuZmV0Y2goKSwgJ19yb29tJyk7XG5cdFx0Y29uc3QgdG90YWxDb3VudCA9IHJvb21zLmxlbmd0aDtcblxuXHRcdHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KHJvb21zLCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsczogcm9vbXMsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHRjb3VudDogcm9vbXMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IHRvdGFsQ291bnRcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5tZW1iZXJzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7XG5cdFx0XHRwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLFxuXHRcdFx0Y2hlY2tlZEFyY2hpdmVkOiBmYWxzZSxcblx0XHRcdHJldHVyblVzZXJuYW1lczogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQuYnJvYWRjYXN0ICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWJyb2FkY2FzdC1tZW1iZXItbGlzdCcpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgc2hvdWxkQmVPcmRlcmVkRGVzYyA9IE1hdGNoLnRlc3Qoc29ydCwgT2JqZWN0KSAmJiBNYXRjaC50ZXN0KHNvcnQudXNlcm5hbWUsIE51bWJlcikgJiYgc29ydC51c2VybmFtZSA9PT0gLTE7XG5cblx0XHRsZXQgbWVtYmVycyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChBcnJheS5mcm9tKGZpbmRSZXN1bHQudXNlcm5hbWVzKS5zb3J0KCksIHtcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudFxuXHRcdH0pO1xuXG5cdFx0aWYgKHNob3VsZEJlT3JkZXJlZERlc2MpIHtcblx0XHRcdG1lbWJlcnMgPSBtZW1iZXJzLnJldmVyc2UoKTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQoeyB1c2VybmFtZTogeyAkaW46IG1lbWJlcnMgfSB9LCB7XG5cdFx0XHRmaWVsZHM6IHsgX2lkOiAxLCB1c2VybmFtZTogMSwgbmFtZTogMSwgc3RhdHVzOiAxLCB1dGNPZmZzZXQ6IDEgfSxcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB1c2VybmFtZTogMSB9XG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lbWJlcnM6IHVzZXJzLFxuXHRcdFx0Y291bnQ6IHVzZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBmaW5kUmVzdWx0LnVzZXJuYW1lcy5sZW5ndGhcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5tZXNzYWdlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoe1xuXHRcdFx0cGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSxcblx0XHRcdGNoZWNrZWRBcmNoaXZlZDogZmFsc2UsXG5cdFx0XHRyZXR1cm5Vc2VybmFtZXM6IHRydWVcblx0XHR9KTtcblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHJpZDogZmluZFJlc3VsdC5faWQgfSk7XG5cblx0XHQvL1NwZWNpYWwgY2hlY2sgZm9yIHRoZSBwZXJtaXNzaW9uc1xuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWpvaW5lZC1yb29tJykgJiYgIWZpbmRSZXN1bHQudXNlcm5hbWVzLmluY2x1ZGVzKHRoaXMudXNlci51c2VybmFtZSkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9IGVsc2UgaWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWMtcm9vbScpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWVzc2FnZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgdHM6IC0xIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZXMsXG5cdFx0XHRjb3VudDogbWVzc2FnZXMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5vbmxpbmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyB0OiAnYycgfSk7XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZShvdXJRdWVyeSk7XG5cblx0XHRpZiAocm9vbSA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQ2hhbm5lbCBkb2VzIG5vdCBleGlzdHMnKTtcblx0XHR9XG5cblx0XHRjb25zdCBvbmxpbmUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kVXNlcnNOb3RPZmZsaW5lKHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHR1c2VybmFtZTogMVxuXHRcdFx0fVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRjb25zdCBvbmxpbmVJblJvb20gPSBbXTtcblx0XHRvbmxpbmUuZm9yRWFjaCh1c2VyID0+IHtcblx0XHRcdGlmIChyb29tLnVzZXJuYW1lcy5pbmRleE9mKHVzZXIudXNlcm5hbWUpICE9PSAtMSkge1xuXHRcdFx0XHRvbmxpbmVJblJvb20ucHVzaCh7XG5cdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG9ubGluZTogb25saW5lSW5Sb29tXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMub3BlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGNvbnN0IHN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKGZpbmRSZXN1bHQuX2lkLCB0aGlzLnVzZXJJZCk7XG5cblx0XHRpZiAoIXN1Yikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSB1c2VyL2NhbGxlZSBpcyBub3QgaW4gdGhlIGNoYW5uZWwgXCIkeyBmaW5kUmVzdWx0Lm5hbWUgfVwiLmApO1xuXHRcdH1cblxuXHRcdGlmIChzdWIub3Blbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSBjaGFubmVsLCAkeyBmaW5kUmVzdWx0Lm5hbWUgfSwgaXMgYWxyZWFkeSBvcGVuIHRvIHRoZSBzZW5kZXJgKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnb3BlblJvb20nLCBmaW5kUmVzdWx0Ll9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnJlbW92ZU1vZGVyYXRvcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgncmVtb3ZlUm9vbU1vZGVyYXRvcicsIGZpbmRSZXN1bHQuX2lkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnJlbW92ZU93bmVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVSb29tT3duZXInLCBmaW5kUmVzdWx0Ll9pZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5yZW5hbWUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubmFtZSB8fCAhdGhpcy5ib2R5UGFyYW1zLm5hbWUudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcIm5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHsgcm9vbUlkOiB0aGlzLmJvZHlQYXJhbXMucm9vbUlkIH0gfSk7XG5cblx0XHRpZiAoZmluZFJlc3VsdC5uYW1lID09PSB0aGlzLmJvZHlQYXJhbXMubmFtZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjaGFubmVsIG5hbWUgaXMgdGhlIHNhbWUgYXMgd2hhdCBpdCB3b3VsZCBiZSByZW5hbWVkIHRvLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5faWQsICdyb29tTmFtZScsIHRoaXMuYm9keVBhcmFtcy5uYW1lKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldEN1c3RvbUZpZWxkcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMgfHwgISh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyA9PT0gJ29iamVjdCcpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcImN1c3RvbUZpZWxkc1wiIGlzIHJlcXVpcmVkIHdpdGggYSB0eXBlIGxpa2Ugb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21DdXN0b21GaWVsZHMnLCB0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldERlZmF1bHQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMuZGVmYXVsdCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwiZGVmYXVsdFwiIGlzIHJlcXVpcmVkJywgJ2Vycm9yLWNoYW5uZWxzLXNldGRlZmF1bHQtaXMtc2FtZScpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQuZGVmYXVsdCA9PT0gdGhpcy5ib2R5UGFyYW1zLmRlZmF1bHQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY2hhbm5lbCBkZWZhdWx0IHNldHRpbmcgaXMgdGhlIHNhbWUgYXMgd2hhdCBpdCB3b3VsZCBiZSBjaGFuZ2VkIHRvLicsICdlcnJvci1jaGFubmVscy1zZXRkZWZhdWx0LW1pc3NpbmctZGVmYXVsdC1wYXJhbScpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5faWQsICdkZWZhdWx0JywgdGhpcy5ib2R5UGFyYW1zLmRlZmF1bHQudG9TdHJpbmcoKSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5zZXREZXNjcmlwdGlvbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvbiB8fCAhdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJkZXNjcmlwdGlvblwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRpZiAoZmluZFJlc3VsdC5kZXNjcmlwdGlvbiA9PT0gdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNoYW5uZWwgZGVzY3JpcHRpb24gaXMgdGhlIHNhbWUgYXMgd2hhdCBpdCB3b3VsZCBiZSBjaGFuZ2VkIHRvLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5faWQsICdyb29tRGVzY3JpcHRpb24nLCB0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0ZGVzY3JpcHRpb246IHRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvblxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldEpvaW5Db2RlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmpvaW5Db2RlIHx8ICF0aGlzLmJvZHlQYXJhbXMuam9pbkNvZGUudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcImpvaW5Db2RlXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5faWQsICdqb2luQ29kZScsIHRoaXMuYm9keVBhcmFtcy5qb2luQ29kZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5zZXRQdXJwb3NlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UgfHwgIXRoaXMuYm9keVBhcmFtcy5wdXJwb3NlLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJwdXJwb3NlXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LmRlc2NyaXB0aW9uID09PSB0aGlzLmJvZHlQYXJhbXMucHVycG9zZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjaGFubmVsIHB1cnBvc2UgKGRlc2NyaXB0aW9uKSBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21EZXNjcmlwdGlvbicsIHRoaXMuYm9keVBhcmFtcy5wdXJwb3NlKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHB1cnBvc2U6IHRoaXMuYm9keVBhcmFtcy5wdXJwb3NlXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0UmVhZE9ubHknLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInJlYWRPbmx5XCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LnJvID09PSB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY2hhbm5lbCByZWFkIG9ubHkgc2V0dGluZyBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3JlYWRPbmx5JywgdGhpcy5ib2R5UGFyYW1zLnJlYWRPbmx5KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldFRvcGljJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnRvcGljIHx8ICF0aGlzLmJvZHlQYXJhbXMudG9waWMudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInRvcGljXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LnRvcGljID09PSB0aGlzLmJvZHlQYXJhbXMudG9waWMpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY2hhbm5lbCB0b3BpYyBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21Ub3BpYycsIHRoaXMuYm9keVBhcmFtcy50b3BpYyk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHR0b3BpYzogdGhpcy5ib2R5UGFyYW1zLnRvcGljXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0QW5ub3VuY2VtZW50JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmFubm91bmNlbWVudCB8fCAhdGhpcy5ib2R5UGFyYW1zLmFubm91bmNlbWVudC50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwiYW5ub3VuY2VtZW50XCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5faWQsICdyb29tQW5ub3VuY2VtZW50JywgdGhpcy5ib2R5UGFyYW1zLmFubm91bmNlbWVudCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRhbm5vdW5jZW1lbnQ6IHRoaXMuYm9keVBhcmFtcy5hbm5vdW5jZW1lbnRcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5zZXRUeXBlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnR5cGUgfHwgIXRoaXMuYm9keVBhcmFtcy50eXBlLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJ0eXBlXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LnQgPT09IHRoaXMuYm9keVBhcmFtcy50eXBlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNoYW5uZWwgdHlwZSBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21UeXBlJywgdGhpcy5ib2R5UGFyYW1zLnR5cGUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMudW5hcmNoaXZlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0aWYgKCFmaW5kUmVzdWx0LmFyY2hpdmVkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIGNoYW5uZWwsICR7IGZpbmRSZXN1bHQubmFtZSB9LCBpcyBub3QgYXJjaGl2ZWRgKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgndW5hcmNoaXZlUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuZ2V0QWxsVXNlck1lbnRpb25zQnlDaGFubmVsJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyByb29tSWQgfSA9IHRoaXMucmVxdWVzdFBhcmFtcygpO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJlcXVlc3QgcGFyYW0gXCJyb29tSWRcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lbnRpb25zID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2dldFVzZXJNZW50aW9uc0J5Q2hhbm5lbCcsIHtcblx0XHRcdHJvb21JZCxcblx0XHRcdG9wdGlvbnM6IHtcblx0XHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAxIH0sXG5cdFx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdFx0bGltaXQ6IGNvdW50XG5cdFx0XHR9XG5cdFx0fSkpO1xuXG5cdFx0Y29uc3QgYWxsTWVudGlvbnMgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnZ2V0VXNlck1lbnRpb25zQnlDaGFubmVsJywge1xuXHRcdFx0cm9vbUlkLFxuXHRcdFx0b3B0aW9uczoge31cblx0XHR9KSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZW50aW9ucyxcblx0XHRcdGNvdW50OiBtZW50aW9ucy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogYWxsTWVudGlvbnMubGVuZ3RoXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMucm9sZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHJvbGVzID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2dldFJvb21Sb2xlcycsIGZpbmRSZXN1bHQuX2lkKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRyb2xlc1xuXHRcdH0pO1xuXHR9XG59KTtcbiIsImltcG9ydCBCdXNib3kgZnJvbSAnYnVzYm95JztcblxuZnVuY3Rpb24gZmluZFJvb21CeUlkT3JOYW1lKHsgcGFyYW1zLCBjaGVja2VkQXJjaGl2ZWQgPSB0cnVlfSkge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMucm9vbU5hbWUgfHwgIXBhcmFtcy5yb29tTmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgb3IgXCJyb29tTmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdH1cblxuXHRjb25zdCBmaWVsZHMgPSB7IC4uLlJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfTtcblxuXHRsZXQgcm9vbTtcblx0aWYgKHBhcmFtcy5yb29tSWQpIHtcblx0XHRyb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocGFyYW1zLnJvb21JZCwgeyBmaWVsZHMgfSk7XG5cdH0gZWxzZSBpZiAocGFyYW1zLnJvb21OYW1lKSB7XG5cdFx0cm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUocGFyYW1zLnJvb21OYW1lLCB7IGZpZWxkcyB9KTtcblx0fVxuXHRpZiAoIXJvb20pIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLW5vdC1mb3VuZCcsICdUaGUgcmVxdWlyZWQgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgcGFyYW0gcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggYW55IGNoYW5uZWwnKTtcblx0fVxuXHRpZiAoY2hlY2tlZEFyY2hpdmVkICYmIHJvb20uYXJjaGl2ZWQpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLWFyY2hpdmVkJywgYFRoZSBjaGFubmVsLCAkeyByb29tLm5hbWUgfSwgaXMgYXJjaGl2ZWRgKTtcblx0fVxuXG5cdHJldHVybiByb29tO1xufVxuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncm9vbXMuZ2V0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyB1cGRhdGVkU2luY2UgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRsZXQgdXBkYXRlZFNpbmNlRGF0ZTtcblx0XHRpZiAodXBkYXRlZFNpbmNlKSB7XG5cdFx0XHRpZiAoaXNOYU4oRGF0ZS5wYXJzZSh1cGRhdGVkU2luY2UpKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci11cGRhdGVkU2luY2UtcGFyYW0taW52YWxpZCcsICdUaGUgXCJ1cGRhdGVkU2luY2VcIiBxdWVyeSBwYXJhbWV0ZXIgbXVzdCBiZSBhIHZhbGlkIGRhdGUuJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR1cGRhdGVkU2luY2VEYXRlID0gbmV3IERhdGUodXBkYXRlZFNpbmNlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHJlc3VsdCA9IE1ldGVvci5jYWxsKCdyb29tcy9nZXQnLCB1cGRhdGVkU2luY2VEYXRlKSk7XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpKSB7XG5cdFx0XHRyZXN1bHQgPSB7XG5cdFx0XHRcdHVwZGF0ZTogcmVzdWx0LFxuXHRcdFx0XHRyZW1vdmU6IFtdXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHJlc3VsdCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncm9vbXMudXBsb2FkLzpyaWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgdGhpcy51cmxQYXJhbXMucmlkLCB0aGlzLnVzZXJJZCk7XG5cblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCBidXNib3kgPSBuZXcgQnVzYm95KHsgaGVhZGVyczogdGhpcy5yZXF1ZXN0LmhlYWRlcnMgfSk7XG5cdFx0Y29uc3QgZmlsZXMgPSBbXTtcblx0XHRjb25zdCBmaWVsZHMgPSB7fTtcblxuXHRcdE1ldGVvci53cmFwQXN5bmMoKGNhbGxiYWNrKSA9PiB7XG5cdFx0XHRidXNib3kub24oJ2ZpbGUnLCAoZmllbGRuYW1lLCBmaWxlLCBmaWxlbmFtZSwgZW5jb2RpbmcsIG1pbWV0eXBlKSA9PiB7XG5cdFx0XHRcdGlmIChmaWVsZG5hbWUgIT09ICdmaWxlJykge1xuXHRcdFx0XHRcdHJldHVybiBmaWxlcy5wdXNoKG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmllbGQnKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBmaWxlRGF0ZSA9IFtdO1xuXHRcdFx0XHRmaWxlLm9uKCdkYXRhJywgZGF0YSA9PiBmaWxlRGF0ZS5wdXNoKGRhdGEpKTtcblxuXHRcdFx0XHRmaWxlLm9uKCdlbmQnLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZmlsZXMucHVzaCh7IGZpZWxkbmFtZSwgZmlsZSwgZmlsZW5hbWUsIGVuY29kaW5nLCBtaW1ldHlwZSwgZmlsZUJ1ZmZlcjogQnVmZmVyLmNvbmNhdChmaWxlRGF0ZSkgfSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGJ1c2JveS5vbignZmllbGQnLCAoZmllbGRuYW1lLCB2YWx1ZSkgPT4gZmllbGRzW2ZpZWxkbmFtZV0gPSB2YWx1ZSk7XG5cblx0XHRcdGJ1c2JveS5vbignZmluaXNoJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiBjYWxsYmFjaygpKSk7XG5cblx0XHRcdHRoaXMucmVxdWVzdC5waXBlKGJ1c2JveSk7XG5cdFx0fSkoKTtcblxuXHRcdGlmIChmaWxlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdGaWxlIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGZpbGVzLmxlbmd0aCA+IDEpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdKdXN0IDEgZmlsZSBpcyBhbGxvd2VkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZSA9IGZpbGVzWzBdO1xuXG5cdFx0Y29uc3QgZmlsZVN0b3JlID0gRmlsZVVwbG9hZC5nZXRTdG9yZSgnVXBsb2FkcycpO1xuXG5cdFx0Y29uc3QgZGV0YWlscyA9IHtcblx0XHRcdG5hbWU6IGZpbGUuZmlsZW5hbWUsXG5cdFx0XHRzaXplOiBmaWxlLmZpbGVCdWZmZXIubGVuZ3RoLFxuXHRcdFx0dHlwZTogZmlsZS5taW1ldHlwZSxcblx0XHRcdHJpZDogdGhpcy51cmxQYXJhbXMucmlkLFxuXHRcdFx0dXNlcklkOiB0aGlzLnVzZXJJZFxuXHRcdH07XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRjb25zdCB1cGxvYWRlZEZpbGUgPSBNZXRlb3Iud3JhcEFzeW5jKGZpbGVTdG9yZS5pbnNlcnQuYmluZChmaWxlU3RvcmUpKShkZXRhaWxzLCBmaWxlLmZpbGVCdWZmZXIpO1xuXG5cdFx0XHR1cGxvYWRlZEZpbGUuZGVzY3JpcHRpb24gPSBmaWVsZHMuZGVzY3JpcHRpb247XG5cblx0XHRcdGRlbGV0ZSBmaWVsZHMuZGVzY3JpcHRpb247XG5cblx0XHRcdFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoTWV0ZW9yLmNhbGwoJ3NlbmRGaWxlTWVzc2FnZScsIHRoaXMudXJsUGFyYW1zLnJpZCwgbnVsbCwgdXBsb2FkZWRGaWxlLCBmaWVsZHMpKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncm9vbXMuc2F2ZU5vdGlmaWNhdGlvbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBzYXZlTm90aWZpY2F0aW9ucyA9IChub3RpZmljYXRpb25zLCByb29tSWQpID0+IHtcblx0XHRcdE9iamVjdC5rZXlzKG5vdGlmaWNhdGlvbnMpLm1hcCgobm90aWZpY2F0aW9uS2V5KSA9PiB7XG5cdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzYXZlTm90aWZpY2F0aW9uU2V0dGluZ3MnLCByb29tSWQsIG5vdGlmaWNhdGlvbktleSwgbm90aWZpY2F0aW9uc1tub3RpZmljYXRpb25LZXldKSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdGNvbnN0IHsgcm9vbUlkLCBub3RpZmljYXRpb25zIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cblx0XHRpZiAoIXJvb21JZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBcXCdyb29tSWRcXCcgcGFyYW0gaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRpZiAoIW5vdGlmaWNhdGlvbnMgfHwgT2JqZWN0LmtleXMobm90aWZpY2F0aW9ucykubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIFxcJ25vdGlmaWNhdGlvbnNcXCcgcGFyYW0gaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRzYXZlTm90aWZpY2F0aW9ucyhub3RpZmljYXRpb25zLCByb29tSWQpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdyb29tcy5mYXZvcml0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCB7IGZhdm9yaXRlIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgnZmF2b3JpdGUnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBcXCdmYXZvcml0ZVxcJyBwYXJhbSBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBmaW5kUm9vbUJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMuYm9keVBhcmFtcyB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCd0b2dnbGVGYXZvcml0ZScsIHJvb20uX2lkLCBmYXZvcml0ZSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdyb29tcy5jbGVhbkhpc3RvcnknLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRSb29tQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5ib2R5UGFyYW1zIH0pO1xuXG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubGF0ZXN0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbWV0ZXIgXCJsYXRlc3RcIiBpcyByZXF1aXJlZC4nKTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5vbGRlc3QpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtZXRlciBcIm9sZGVzdFwiIGlzIHJlcXVpcmVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGxhdGVzdCA9IG5ldyBEYXRlKHRoaXMuYm9keVBhcmFtcy5sYXRlc3QpO1xuXHRcdGNvbnN0IG9sZGVzdCA9IG5ldyBEYXRlKHRoaXMuYm9keVBhcmFtcy5vbGRlc3QpO1xuXG5cdFx0bGV0IGluY2x1c2l2ZSA9IGZhbHNlO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmluY2x1c2l2ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGluY2x1c2l2ZSA9IHRoaXMuYm9keVBhcmFtcy5pbmNsdXNpdmU7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2NsZWFuUm9vbUhpc3RvcnknLCB7IHJvb21JZDogZmluZFJlc3VsdC5faWQsIGxhdGVzdCwgb2xkZXN0LCBpbmNsdXNpdmUgfSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuIiwiUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3N1YnNjcmlwdGlvbnMuZ2V0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyB1cGRhdGVkU2luY2UgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRsZXQgdXBkYXRlZFNpbmNlRGF0ZTtcblx0XHRpZiAodXBkYXRlZFNpbmNlKSB7XG5cdFx0XHRpZiAoaXNOYU4oRGF0ZS5wYXJzZSh1cGRhdGVkU2luY2UpKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0taW52YWxpZCcsICdUaGUgXCJsYXN0VXBkYXRlXCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgYSB2YWxpZCBkYXRlLicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dXBkYXRlZFNpbmNlRGF0ZSA9IG5ldyBEYXRlKHVwZGF0ZWRTaW5jZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bGV0IHJlc3VsdDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiByZXN1bHQgPSBNZXRlb3IuY2FsbCgnc3Vic2NyaXB0aW9ucy9nZXQnLCB1cGRhdGVkU2luY2VEYXRlKSk7XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpKSB7XG5cdFx0XHRyZXN1bHQgPSB7XG5cdFx0XHRcdHVwZGF0ZTogcmVzdWx0LFxuXHRcdFx0XHRyZW1vdmU6IFtdXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHJlc3VsdCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc3Vic2NyaXB0aW9ucy5nZXRPbmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHJvb21JZCB9ID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCk7XG5cblx0XHRpZiAoIXJvb21JZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBcXCdyb29tSWRcXCcgcGFyYW0gaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyb29tSWQsIHRoaXMudXNlcklkLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0X3Jvb206IDAsXG5cdFx0XHRcdF91c2VyOiAwLFxuXHRcdFx0XHQkbG9raTogMFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c3Vic2NyaXB0aW9uXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG4vKipcblx0VGhpcyBBUEkgaXMgc3VwcG9zZSB0byBtYXJrIGFueSByb29tIGFzIHJlYWQuXG5cblx0TWV0aG9kOiBQT1NUXG5cdFJvdXRlOiBhcGkvdjEvc3Vic2NyaXB0aW9ucy5yZWFkXG5cdFBhcmFtczpcblx0XHQtIHJpZDogVGhlIHJpZCBvZiB0aGUgcm9vbSB0byBiZSBtYXJrZWQgYXMgcmVhZC5cbiAqL1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3N1YnNjcmlwdGlvbnMucmVhZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHJpZDogU3RyaW5nXG5cdFx0fSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PlxuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlYWRNZXNzYWdlcycsIHRoaXMuYm9keVBhcmFtcy5yaWQpXG5cdFx0KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc3Vic2NyaXB0aW9ucy51bnJlYWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyByb29tSWQsIGZpcnN0VW5yZWFkTWVzc2FnZSB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXHRcdGlmICghcm9vbUlkICYmIChmaXJzdFVucmVhZE1lc3NhZ2UgJiYgIWZpcnN0VW5yZWFkTWVzc2FnZS5faWQpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQXQgbGVhc3Qgb25lIG9mIFwicm9vbUlkXCIgb3IgXCJmaXJzdFVucmVhZE1lc3NhZ2UuX2lkXCIgcGFyYW1zIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT5cblx0XHRcdE1ldGVvci5jYWxsKCd1bnJlYWRNZXNzYWdlcycsIGZpcnN0VW5yZWFkTWVzc2FnZSwgcm9vbUlkKVxuXHRcdCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuXG4iLCIvKiBnbG9iYWwgcHJvY2Vzc1dlYmhvb2tNZXNzYWdlICovXG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LmRlbGV0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRtc2dJZDogU3RyaW5nLFxuXHRcdFx0cm9vbUlkOiBTdHJpbmcsXG5cdFx0XHRhc1VzZXI6IE1hdGNoLk1heWJlKEJvb2xlYW4pXG5cdFx0fSkpO1xuXG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQodGhpcy5ib2R5UGFyYW1zLm1zZ0lkLCB7IGZpZWxkczogeyB1OiAxLCByaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgTm8gbWVzc2FnZSBmb3VuZCB3aXRoIHRoZSBpZCBvZiBcIiR7IHRoaXMuYm9keVBhcmFtcy5tc2dJZCB9XCIuYCk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5yb29tSWQgIT09IG1zZy5yaWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcm9vbSBpZCBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCB3aGVyZSB0aGUgbWVzc2FnZSBpcyBmcm9tLicpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuYXNVc2VyICYmIG1zZy51Ll9pZCAhPT0gdGhpcy51c2VySWQgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdmb3JjZS1kZWxldGUtbWVzc2FnZScsIG1zZy5yaWQpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVW5hdXRob3JpemVkLiBZb3UgbXVzdCBoYXZlIHRoZSBwZXJtaXNzaW9uIFwiZm9yY2UtZGVsZXRlLW1lc3NhZ2VcIiB0byBkZWxldGUgb3RoZXJcXCdzIG1lc3NhZ2UgYXMgdGhlbS4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMuYm9keVBhcmFtcy5hc1VzZXIgPyBtc2cudS5faWQgOiB0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2RlbGV0ZU1lc3NhZ2UnLCB7IF9pZDogbXNnLl9pZCB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdF9pZDogbXNnLl9pZCxcblx0XHRcdHRzOiBEYXRlLm5vdygpLFxuXHRcdFx0bWVzc2FnZTogbXNnXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zeW5jTWVzc2FnZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHJvb21JZCwgbGFzdFVwZGF0ZSB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIHF1ZXJ5IHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFsYXN0VXBkYXRlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1sYXN0VXBkYXRlLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJsYXN0VXBkYXRlXCIgcXVlcnkgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9IGVsc2UgaWYgKGlzTmFOKERhdGUucGFyc2UobGFzdFVwZGF0ZSkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0taW52YWxpZCcsICdUaGUgXCJsYXN0VXBkYXRlXCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgYSB2YWxpZCBkYXRlLicpO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0cmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ21lc3NhZ2VzL2dldCcsIHJvb21JZCwgeyBsYXN0VXBkYXRlOiBuZXcgRGF0ZShsYXN0VXBkYXRlKSB9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJlc3VsdFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQuZ2V0TWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghdGhpcy5xdWVyeVBhcmFtcy5tc2dJZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBcIm1zZ0lkXCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IG1zZztcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRtc2cgPSBNZXRlb3IuY2FsbCgnZ2V0U2luZ2xlTWVzc2FnZScsIHRoaXMucXVlcnlQYXJhbXMubXNnSWQpO1xuXHRcdH0pO1xuXG5cdFx0aWYgKCFtc2cpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZTogbXNnXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5waW5NZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRsZXQgcGlubmVkTWVzc2FnZTtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBwaW5uZWRNZXNzYWdlID0gTWV0ZW9yLmNhbGwoJ3Bpbk1lc3NhZ2UnLCBtc2cpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2U6IHBpbm5lZE1lc3NhZ2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnBvc3RNZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IG1lc3NhZ2VSZXR1cm4gPSBwcm9jZXNzV2ViaG9va01lc3NhZ2UodGhpcy5ib2R5UGFyYW1zLCB0aGlzLnVzZXIsIHVuZGVmaW5lZCwgdHJ1ZSlbMF07XG5cblx0XHRpZiAoIW1lc3NhZ2VSZXR1cm4pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCd1bmtub3duLWVycm9yJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dHM6IERhdGUubm93KCksXG5cdFx0XHRjaGFubmVsOiBtZXNzYWdlUmV0dXJuLmNoYW5uZWwsXG5cdFx0XHRtZXNzYWdlOiBtZXNzYWdlUmV0dXJuLm1lc3NhZ2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnNlYXJjaCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgcm9vbUlkLCBzZWFyY2hUZXh0LCBsaW1pdCB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIHF1ZXJ5IHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFzZWFyY2hUZXh0KSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1zZWFyY2hUZXh0LXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJzZWFyY2hUZXh0XCIgcXVlcnkgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRpZiAobGltaXQgJiYgKHR5cGVvZiBsaW1pdCAhPT0gJ251bWJlcicgfHwgaXNOYU4obGltaXQpIHx8IGxpbWl0IDw9IDApKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1saW1pdC1wYXJhbS1pbnZhbGlkJywgJ1RoZSBcImxpbWl0XCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgYSB2YWxpZCBudW1iZXIgYW5kIGJlIGdyZWF0ZXIgdGhhbiAwLicpO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gcmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ21lc3NhZ2VTZWFyY2gnLCBzZWFyY2hUZXh0LCByb29tSWQsIGxpbWl0KS5tZXNzYWdlLmRvY3MpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZXM6IHJlc3VsdFxuXHRcdH0pO1xuXHR9XG59KTtcblxuLy8gVGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBgY2hhdC5wb3N0TWVzc2FnZWAgYW5kIGBjaGF0LnNlbmRNZXNzYWdlYCBpcyB0aGF0IGBjaGF0LnNlbmRNZXNzYWdlYCBhbGxvd3Ncbi8vIGZvciBwYXNzaW5nIGEgdmFsdWUgZm9yIGBfaWRgIGFuZCB0aGUgb3RoZXIgb25lIGRvZXNuJ3QuIEFsc28sIGBjaGF0LnNlbmRNZXNzYWdlYCBvbmx5IHNlbmRzIGl0IHRvXG4vLyBvbmUgY2hhbm5lbCB3aGVyZWFzIHRoZSBvdGhlciBvbmUgYWxsb3dzIGZvciBzZW5kaW5nIHRvIG1vcmUgdGhhbiBvbmUgY2hhbm5lbCBhdCBhIHRpbWUuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zZW5kTWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXBhcmFtcycsICdUaGUgXCJtZXNzYWdlXCIgcGFyYW1ldGVyIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IG1lc3NhZ2U7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gbWVzc2FnZSA9IE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zdGFyTWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQgfHwgIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlaWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcIm1lc3NhZ2VJZFwiIHBhcmFtIGlzIHJlcXVpcmVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQpO1xuXG5cdFx0aWYgKCFtc2cpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2Utbm90LWZvdW5kJywgJ1RoZSBwcm92aWRlZCBcIm1lc3NhZ2VJZFwiIGRvZXMgbm90IG1hdGNoIGFueSBleGlzdGluZyBtZXNzYWdlLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzdGFyTWVzc2FnZScsIHtcblx0XHRcdF9pZDogbXNnLl9pZCxcblx0XHRcdHJpZDogbXNnLnJpZCxcblx0XHRcdHN0YXJyZWQ6IHRydWVcblx0XHR9KSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQudW5QaW5NZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgcmVxdWlyZWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQodGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCk7XG5cblx0XHRpZiAoIW1zZykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZS1ub3QtZm91bmQnLCAnVGhlIHByb3ZpZGVkIFwibWVzc2FnZUlkXCIgZG9lcyBub3QgbWF0Y2ggYW55IGV4aXN0aW5nIG1lc3NhZ2UuJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3VucGluTWVzc2FnZScsIG1zZykpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnVuU3Rhck1lc3NhZ2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkIHx8ICF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJtZXNzYWdlSWRcIiBwYXJhbSBpcyByZXF1aXJlZC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnc3Rhck1lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IG1zZy5faWQsXG5cdFx0XHRyaWQ6IG1zZy5yaWQsXG5cdFx0XHRzdGFycmVkOiBmYWxzZVxuXHRcdH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC51cGRhdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0cm9vbUlkOiBTdHJpbmcsXG5cdFx0XHRtc2dJZDogU3RyaW5nLFxuXHRcdFx0dGV4dDogU3RyaW5nIC8vVXNpbmcgdGV4dCB0byBiZSBjb25zaXN0YW50IHdpdGggY2hhdC5wb3N0TWVzc2FnZVxuXHRcdH0pKTtcblxuXHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy5tc2dJZCk7XG5cblx0XHQvL0Vuc3VyZSB0aGUgbWVzc2FnZSBleGlzdHNcblx0XHRpZiAoIW1zZykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYE5vIG1lc3NhZ2UgZm91bmQgd2l0aCB0aGUgaWQgb2YgXCIkeyB0aGlzLmJvZHlQYXJhbXMubXNnSWQgfVwiLmApO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMucm9vbUlkICE9PSBtc2cucmlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJvb20gaWQgcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggd2hlcmUgdGhlIG1lc3NhZ2UgaXMgZnJvbS4nKTtcblx0XHR9XG5cblx0XHQvL1Blcm1pc3Npb24gY2hlY2tzIGFyZSBhbHJlYWR5IGRvbmUgaW4gdGhlIHVwZGF0ZU1lc3NhZ2UgbWV0aG9kLCBzbyBubyBuZWVkIHRvIGR1cGxpY2F0ZSB0aGVtXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3VwZGF0ZU1lc3NhZ2UnLCB7IF9pZDogbXNnLl9pZCwgbXNnOiB0aGlzLmJvZHlQYXJhbXMudGV4dCwgcmlkOiBtc2cucmlkIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZTogUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQobXNnLl9pZClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnJlYWN0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBlbW9qaSA9IHRoaXMuYm9keVBhcmFtcy5lbW9qaSB8fCB0aGlzLmJvZHlQYXJhbXMucmVhY3Rpb247XG5cblx0XHRpZiAoIWVtb2ppKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1lbW9qaS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwiZW1vamlcIiBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzZXRSZWFjdGlvbicsIGVtb2ppLCBtc2cuX2lkLCB0aGlzLmJvZHlQYXJhbXMuc2hvdWxkUmVhY3QpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5nZXRNZXNzYWdlUmVhZFJlY2VpcHRzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBtZXNzYWdlSWQgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cdFx0aWYgKCFtZXNzYWdlSWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKHtcblx0XHRcdFx0ZXJyb3I6ICdUaGUgcmVxdWlyZWQgXFwnbWVzc2FnZUlkXFwnIHBhcmFtIGlzIG1pc3NpbmcuJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG1lc3NhZ2VSZWFkUmVjZWlwdHMgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnZ2V0UmVhZFJlY2VpcHRzJywgeyBtZXNzYWdlSWQgfSkpO1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRyZWNlaXB0czogbWVzc2FnZVJlYWRSZWNlaXB0c1xuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKHtcblx0XHRcdFx0ZXJyb3I6IGVycm9yLm1lc3NhZ2Vcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnJlcG9ydE1lc3NhZ2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyBtZXNzYWdlSWQsIGRlc2NyaXB0aW9uIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cdFx0aWYgKCFtZXNzYWdlSWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcmVxdWlyZWQgXCJtZXNzYWdlSWRcIiBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICghZGVzY3JpcHRpb24pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcmVxdWlyZWQgXCJkZXNjcmlwdGlvblwiIHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3JlcG9ydE1lc3NhZ2UnLCBtZXNzYWdlSWQsIGRlc2NyaXB0aW9uKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQuaWdub3JlVXNlcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgcmlkLCB1c2VySWQgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cdFx0bGV0IHsgaWdub3JlID0gdHJ1ZSB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlnbm9yZSA9IHR5cGVvZiBpZ25vcmUgPT09ICdzdHJpbmcnID8gL3RydWV8MS8udGVzdChpZ25vcmUpIDogaWdub3JlO1xuXG5cdFx0aWYgKCFyaWQgfHwgIXJpZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20taWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInJpZFwiIHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCF1c2VySWQgfHwgIXVzZXJJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXVzZXItaWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInVzZXJJZFwiIHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2lnbm9yZVVzZXInLCB7IHJpZCwgdXNlcklkLCBpZ25vcmUgfSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY29tbWFuZHMuZ2V0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgcGFyYW1zID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlmICh0eXBlb2YgcGFyYW1zLmNvbW1hbmQgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHF1ZXJ5IHBhcmFtIFwiY29tbWFuZFwiIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW3BhcmFtcy5jb21tYW5kLnRvTG93ZXJDYXNlKCldO1xuXG5cdFx0aWYgKCFjbWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGBUaGVyZSBpcyBubyBjb21tYW5kIGluIHRoZSBzeXN0ZW0gYnkgdGhlIG5hbWUgb2Y6ICR7IHBhcmFtcy5jb21tYW5kIH1gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGNvbW1hbmQ6IGNtZCB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjb21tYW5kcy5saXN0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0bGV0IGNvbW1hbmRzID0gT2JqZWN0LnZhbHVlcyhSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHMpO1xuXG5cdFx0aWYgKHF1ZXJ5ICYmIHF1ZXJ5LmNvbW1hbmQpIHtcblx0XHRcdGNvbW1hbmRzID0gY29tbWFuZHMuZmlsdGVyKChjb21tYW5kKSA9PiBjb21tYW5kLmNvbW1hbmQgPT09IHF1ZXJ5LmNvbW1hbmQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSBjb21tYW5kcy5sZW5ndGg7XG5cdFx0Y29tbWFuZHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5wcm9jZXNzUXVlcnlPcHRpb25zT25SZXN1bHQoY29tbWFuZHMsIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBuYW1lOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNvbW1hbmRzLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IGNvbW1hbmRzLmxlbmd0aCxcblx0XHRcdHRvdGFsOiB0b3RhbENvdW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG4vLyBFeHBlY3RzIGEgYm9keSBvZjogeyBjb21tYW5kOiAnZ2ltbWUnLCBwYXJhbXM6ICdhbnkgc3RyaW5nIHZhbHVlJywgcm9vbUlkOiAndmFsdWUnIH1cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjb21tYW5kcy5ydW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgYm9keSA9IHRoaXMuYm9keVBhcmFtcztcblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRMb2dnZWRJblVzZXIoKTtcblxuXHRcdGlmICh0eXBlb2YgYm9keS5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1lvdSBtdXN0IHByb3ZpZGUgYSBjb21tYW5kIHRvIHJ1bi4nKTtcblx0XHR9XG5cblx0XHRpZiAoYm9keS5wYXJhbXMgJiYgdHlwZW9mIGJvZHkucGFyYW1zICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBwYXJhbWV0ZXJzIGZvciB0aGUgY29tbWFuZCBtdXN0IGJlIGEgc2luZ2xlIHN0cmluZy4nKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGJvZHkucm9vbUlkICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSByb29tXFwncyBpZCB3aGVyZSB0byBleGVjdXRlIHRoaXMgY29tbWFuZCBtdXN0IGJlIHByb3ZpZGVkIGFuZCBiZSBhIHN0cmluZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBjbWQgPSBib2R5LmNvbW1hbmQudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAoIVJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tib2R5LmNvbW1hbmQudG9Mb3dlckNhc2UoKV0pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY29tbWFuZCBwcm92aWRlZCBkb2VzIG5vdCBleGlzdCAob3IgaXMgZGlzYWJsZWQpLicpO1xuXHRcdH1cblxuXHRcdC8vIFRoaXMgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGV5IGNhbid0IG9yIHRoZSByb29tIGlzIGludmFsaWRcblx0XHRNZXRlb3IuY2FsbCgnY2FuQWNjZXNzUm9vbScsIGJvZHkucm9vbUlkLCB1c2VyLl9pZCk7XG5cblx0XHRjb25zdCBwYXJhbXMgPSBib2R5LnBhcmFtcyA/IGJvZHkucGFyYW1zIDogJyc7XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdHJlc3VsdCA9IFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5ydW4oY21kLCBwYXJhbXMsIHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0cmlkOiBib2R5LnJvb21JZCxcblx0XHRcdFx0bXNnOiBgLyR7IGNtZCB9ICR7IHBhcmFtcyB9YFxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHJlc3VsdCB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjb21tYW5kcy5wcmV2aWV3JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHQvLyBFeHBlY3RzIHRoZXNlIHF1ZXJ5IHBhcmFtczogY29tbWFuZDogJ2dpcGh5JywgcGFyYW1zOiAnbWluZScsIHJvb21JZDogJ3ZhbHVlJ1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJ5UGFyYW1zO1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldExvZ2dlZEluVXNlcigpO1xuXG5cdFx0aWYgKHR5cGVvZiBxdWVyeS5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1lvdSBtdXN0IHByb3ZpZGUgYSBjb21tYW5kIHRvIGdldCB0aGUgcHJldmlld3MgZnJvbS4nKTtcblx0XHR9XG5cblx0XHRpZiAocXVlcnkucGFyYW1zICYmIHR5cGVvZiBxdWVyeS5wYXJhbXMgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBjb21tYW5kIG11c3QgYmUgYSBzaW5nbGUgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcXVlcnkucm9vbUlkICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSByb29tXFwncyBpZCB3aGVyZSB0aGUgcHJldmlld3MgYXJlIGJlaW5nIGRpc3BsYXllZCBtdXN0IGJlIHByb3ZpZGVkIGFuZCBiZSBhIHN0cmluZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBjbWQgPSBxdWVyeS5jb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjb21tYW5kIHByb3ZpZGVkIGRvZXMgbm90IGV4aXN0IChvciBpcyBkaXNhYmxlZCkuJyk7XG5cdFx0fVxuXG5cdFx0Ly8gVGhpcyB3aWxsIHRocm93IGFuIGVycm9yIGlmIHRoZXkgY2FuJ3Qgb3IgdGhlIHJvb20gaXMgaW52YWxpZFxuXHRcdE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgcXVlcnkucm9vbUlkLCB1c2VyLl9pZCk7XG5cblx0XHRjb25zdCBwYXJhbXMgPSBxdWVyeS5wYXJhbXMgPyBxdWVyeS5wYXJhbXMgOiAnJztcblxuXHRcdGxldCBwcmV2aWV3O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdHByZXZpZXcgPSBNZXRlb3IuY2FsbCgnZ2V0U2xhc2hDb21tYW5kUHJldmlld3MnLCB7IGNtZCwgcGFyYW1zLCBtc2c6IHsgcmlkOiBxdWVyeS5yb29tSWQgfSB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgcHJldmlldyB9KTtcblx0fSxcblx0Ly8gRXhwZWN0cyBhIGJvZHkgZm9ybWF0IG9mOiB7IGNvbW1hbmQ6ICdnaXBoeScsIHBhcmFtczogJ21pbmUnLCByb29tSWQ6ICd2YWx1ZScsIHByZXZpZXdJdGVtOiB7IGlkOiAnc2FkZjgnIHR5cGU6ICdpbWFnZScsIHZhbHVlOiAnaHR0cHM6Ly9kZXYubnVsbC9naWYgfSB9XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgYm9keSA9IHRoaXMuYm9keVBhcmFtcztcblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRMb2dnZWRJblVzZXIoKTtcblxuXHRcdGlmICh0eXBlb2YgYm9keS5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1lvdSBtdXN0IHByb3ZpZGUgYSBjb21tYW5kIHRvIHJ1biB0aGUgcHJldmlldyBpdGVtIG9uLicpO1xuXHRcdH1cblxuXHRcdGlmIChib2R5LnBhcmFtcyAmJiB0eXBlb2YgYm9keS5wYXJhbXMgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBjb21tYW5kIG11c3QgYmUgYSBzaW5nbGUgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgYm9keS5yb29tSWQgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJvb21cXCdzIGlkIHdoZXJlIHRoZSBwcmV2aWV3IGlzIGJlaW5nIGV4ZWN1dGVkIGluIG11c3QgYmUgcHJvdmlkZWQgYW5kIGJlIGEgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgYm9keS5wcmV2aWV3SXRlbSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcHJldmlldyBpdGVtIGJlaW5nIGV4ZWN1dGVkIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFib2R5LnByZXZpZXdJdGVtLmlkIHx8ICFib2R5LnByZXZpZXdJdGVtLnR5cGUgfHwgdHlwZW9mIGJvZHkucHJldmlld0l0ZW0udmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHByZXZpZXcgaXRlbSBiZWluZyBleGVjdXRlZCBpcyBpbiB0aGUgd3JvbmcgZm9ybWF0LicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IGJvZHkuY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICghUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY29tbWFuZCBwcm92aWRlZCBkb2VzIG5vdCBleGlzdCAob3IgaXMgZGlzYWJsZWQpLicpO1xuXHRcdH1cblxuXHRcdC8vIFRoaXMgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGV5IGNhbid0IG9yIHRoZSByb29tIGlzIGludmFsaWRcblx0XHRNZXRlb3IuY2FsbCgnY2FuQWNjZXNzUm9vbScsIGJvZHkucm9vbUlkLCB1c2VyLl9pZCk7XG5cblx0XHRjb25zdCBwYXJhbXMgPSBib2R5LnBhcmFtcyA/IGJvZHkucGFyYW1zIDogJyc7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnZXhlY3V0ZVNsYXNoQ29tbWFuZFByZXZpZXcnLCB7IGNtZCwgcGFyYW1zLCBtc2c6IHsgcmlkOiBib2R5LnJvb21JZCB9IH0sIGJvZHkucHJldmlld0l0ZW0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZW1vamktY3VzdG9tJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZW1vamlzID0gTWV0ZW9yLmNhbGwoJ2xpc3RFbW9qaUN1c3RvbScpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBlbW9qaXMgfSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbi8vUmV0dXJucyB0aGUgcHJpdmF0ZSBncm91cCBzdWJzY3JpcHRpb24gSUYgZm91bmQgb3RoZXJ3aXNlIGl0IHdpbGwgcmV0dXJuIHRoZSBmYWlsdXJlIG9mIHdoeSBpdCBkaWRuJ3QuIENoZWNrIHRoZSBgc3RhdHVzQ29kZWAgcHJvcGVydHlcbmZ1bmN0aW9uIGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zLCB1c2VySWQsIGNoZWNrZWRBcmNoaXZlZCA9IHRydWUgfSkge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMucm9vbU5hbWUgfHwgIXBhcmFtcy5yb29tTmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHBhcmFtZXRlciBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHR9XG5cblx0bGV0IHJvb21TdWI7XG5cdGlmIChwYXJhbXMucm9vbUlkKSB7XG5cdFx0cm9vbVN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHBhcmFtcy5yb29tSWQsIHVzZXJJZCk7XG5cdH0gZWxzZSBpZiAocGFyYW1zLnJvb21OYW1lKSB7XG5cdFx0cm9vbVN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbU5hbWVBbmRVc2VySWQocGFyYW1zLnJvb21OYW1lLCB1c2VySWQpO1xuXHR9XG5cblx0aWYgKCFyb29tU3ViIHx8IHJvb21TdWIudCAhPT0gJ3AnKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1ub3QtZm91bmQnLCAnVGhlIHJlcXVpcmVkIFwicm9vbUlkXCIgb3IgXCJyb29tTmFtZVwiIHBhcmFtIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIGFueSBncm91cCcpO1xuXHR9XG5cblx0aWYgKGNoZWNrZWRBcmNoaXZlZCAmJiByb29tU3ViLmFyY2hpdmVkKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1hcmNoaXZlZCcsIGBUaGUgcHJpdmF0ZSBncm91cCwgJHsgcm9vbVN1Yi5uYW1lIH0sIGlzIGFyY2hpdmVkYCk7XG5cdH1cblxuXHRyZXR1cm4gcm9vbVN1Yjtcbn1cblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5hZGRBbGwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRBbGxVc2VyVG9Sb29tJywgZmluZFJlc3VsdC5yaWQsIHRoaXMuYm9keVBhcmFtcy5hY3RpdmVVc2Vyc09ubHkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5hZGRNb2RlcmF0b3InLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbU1vZGVyYXRvcicsIGZpbmRSZXN1bHQucmlkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5hZGRPd25lcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRSb29tT3duZXInLCBmaW5kUmVzdWx0LnJpZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuYWRkTGVhZGVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbUxlYWRlcicsIGZpbmRSZXN1bHQucmlkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuLy9BcmNoaXZlcyBhIHByaXZhdGUgZ3JvdXAgb25seSBpZiBpdCB3YXNuJ3RcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuYXJjaGl2ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FyY2hpdmVSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuY2xvc2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGlmICghZmluZFJlc3VsdC5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIHByaXZhdGUgZ3JvdXAsICR7IGZpbmRSZXN1bHQubmFtZSB9LCBpcyBhbHJlYWR5IGNsb3NlZCB0byB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuY291bnRlcnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBhY2Nlc3MgPSBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKTtcblx0XHRjb25zdCBwYXJhbXMgPSB0aGlzLnJlcXVlc3RQYXJhbXMoKTtcblx0XHRsZXQgdXNlciA9IHRoaXMudXNlcklkO1xuXHRcdGxldCByb29tO1xuXHRcdGxldCB1bnJlYWRzID0gbnVsbDtcblx0XHRsZXQgdXNlck1lbnRpb25zID0gbnVsbDtcblx0XHRsZXQgdW5yZWFkc0Zyb20gPSBudWxsO1xuXHRcdGxldCBqb2luZWQgPSBmYWxzZTtcblx0XHRsZXQgbXNncyA9IG51bGw7XG5cdFx0bGV0IGxhdGVzdCA9IG51bGw7XG5cdFx0bGV0IG1lbWJlcnMgPSBudWxsO1xuXHRcdGxldCBsbSA9IG51bGw7XG5cblx0XHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMucm9vbU5hbWUgfHwgIXBhcmFtcy5yb29tTmFtZS50cmltKCkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgb3IgXCJyb29tTmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHBhcmFtcy5yb29tSWQpIHtcblx0XHRcdHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChwYXJhbXMucm9vbUlkKTtcblx0XHR9IGVsc2UgaWYgKHBhcmFtcy5yb29tTmFtZSkge1xuXHRcdFx0cm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUocGFyYW1zLnJvb21OYW1lKTtcblx0XHR9XG5cblx0XHRpZiAoIXJvb20gfHwgcm9vbS50ICE9PSAncCcpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBwYXJhbSBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCBhbnkgZ3JvdXAnKTtcblx0XHR9XG5cblx0XHRpZiAocm9vbS5hcmNoaXZlZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1hcmNoaXZlZCcsIGBUaGUgcHJpdmF0ZSBncm91cCwgJHsgcm9vbS5uYW1lIH0sIGlzIGFyY2hpdmVkYCk7XG5cdFx0fVxuXG5cdFx0aWYgKHBhcmFtcy51c2VySWQpIHtcblx0XHRcdGlmICghYWNjZXNzKSB7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHRcdH1cblx0XHRcdHVzZXIgPSBwYXJhbXMudXNlcklkO1xuXHRcdH1cblx0XHRjb25zdCBncm91cCA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb20uX2lkLCB1c2VyKTtcblx0XHRsbSA9IGdyb3VwLl9yb29tLmxtID8gZ3JvdXAuX3Jvb20ubG0gOiBncm91cC5fcm9vbS5fdXBkYXRlZEF0O1xuXG5cdFx0aWYgKHR5cGVvZiBncm91cCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ3JvdXAub3Blbikge1xuXHRcdFx0aWYgKGdyb3VwLmxzKSB7XG5cdFx0XHRcdHVucmVhZHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jb3VudFZpc2libGVCeVJvb21JZEJldHdlZW5UaW1lc3RhbXBzSW5jbHVzaXZlKGdyb3VwLnJpZCwgZ3JvdXAubHMsIGxtKTtcblx0XHRcdFx0dW5yZWFkc0Zyb20gPSBncm91cC5scztcblx0XHRcdH1cblx0XHRcdHVzZXJNZW50aW9ucyA9IGdyb3VwLnVzZXJNZW50aW9ucztcblx0XHRcdGpvaW5lZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKGFjY2VzcyB8fCBqb2luZWQpIHtcblx0XHRcdG1zZ3MgPSByb29tLm1zZ3M7XG5cdFx0XHRsYXRlc3QgPSBsbTtcblx0XHRcdG1lbWJlcnMgPSByb29tLnVzZXJuYW1lcy5sZW5ndGg7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0am9pbmVkLFxuXHRcdFx0bWVtYmVycyxcblx0XHRcdHVucmVhZHMsXG5cdFx0XHR1bnJlYWRzRnJvbSxcblx0XHRcdG1zZ3MsXG5cdFx0XHRsYXRlc3QsXG5cdFx0XHR1c2VyTWVudGlvbnNcblx0XHR9KTtcblx0fVxufSk7XG5cbi8vQ3JlYXRlIFByaXZhdGUgR3JvdXBcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuY3JlYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnY3JlYXRlLXAnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm5hbWUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwibmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5tZW1iZXJzICYmICFfLmlzQXJyYXkodGhpcy5ib2R5UGFyYW1zLm1lbWJlcnMpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcIm1lbWJlcnNcIiBtdXN0IGJlIGFuIGFycmF5IGlmIHByb3ZpZGVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMgJiYgISh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyA9PT0gJ29iamVjdCcpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcImN1c3RvbUZpZWxkc1wiIG11c3QgYmUgYW4gb2JqZWN0IGlmIHByb3ZpZGVkJyk7XG5cdFx0fVxuXG5cdFx0bGV0IHJlYWRPbmx5ID0gZmFsc2U7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZWFkT25seSA9IHRoaXMuYm9keVBhcmFtcy5yZWFkT25seTtcblx0XHR9XG5cblx0XHRsZXQgaWQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0aWQgPSBNZXRlb3IuY2FsbCgnY3JlYXRlUHJpdmF0ZUdyb3VwJywgdGhpcy5ib2R5UGFyYW1zLm5hbWUsIHRoaXMuYm9keVBhcmFtcy5tZW1iZXJzID8gdGhpcy5ib2R5UGFyYW1zLm1lbWJlcnMgOiBbXSwgcmVhZE9ubHksIHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGlkLnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuZGVsZXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnZXJhc2VSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChbZmluZFJlc3VsdC5fcm9vbV0sIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pWzBdXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmZpbGVzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblx0XHRjb25zdCBhZGRVc2VyT2JqZWN0VG9FdmVyeU9iamVjdCA9IChmaWxlKSA9PiB7XG5cdFx0XHRpZiAoZmlsZS51c2VySWQpIHtcblx0XHRcdFx0ZmlsZSA9IHRoaXMuaW5zZXJ0VXNlck9iamVjdCh7IG9iamVjdDogZmlsZSwgdXNlcklkOiBmaWxlLnVzZXJJZCB9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmaWxlO1xuXHRcdH07XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHJpZDogZmluZFJlc3VsdC5yaWQgfSk7XG5cblx0XHRjb25zdCBmaWxlcyA9IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRmaWxlczogZmlsZXMubWFwKGFkZFVzZXJPYmplY3RUb0V2ZXJ5T2JqZWN0KSxcblx0XHRcdGNvdW50OiBmaWxlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmdldEludGVncmF0aW9ucycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGxldCBpbmNsdWRlQWxsUHJpdmF0ZUdyb3VwcyA9IHRydWU7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1ZGVBbGxQcml2YXRlR3JvdXBzICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aW5jbHVkZUFsbFByaXZhdGVHcm91cHMgPSB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1ZGVBbGxQcml2YXRlR3JvdXBzID09PSAndHJ1ZSc7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY2hhbm5lbHNUb1NlYXJjaCA9IFtgIyR7IGZpbmRSZXN1bHQubmFtZSB9YF07XG5cdFx0aWYgKGluY2x1ZGVBbGxQcml2YXRlR3JvdXBzKSB7XG5cdFx0XHRjaGFubmVsc1RvU2VhcmNoLnB1c2goJ2FsbF9wcml2YXRlX2dyb3VwcycpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgY2hhbm5lbDogeyAkaW46IGNoYW5uZWxzVG9TZWFyY2ggfSB9KTtcblx0XHRjb25zdCBpbnRlZ3JhdGlvbnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IF9jcmVhdGVkQXQ6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRpbnRlZ3JhdGlvbnMsXG5cdFx0XHRjb3VudDogaW50ZWdyYXRpb25zLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5oaXN0b3J5JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGxldCBsYXRlc3REYXRlID0gbmV3IERhdGUoKTtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5sYXRlc3QpIHtcblx0XHRcdGxhdGVzdERhdGUgPSBuZXcgRGF0ZSh0aGlzLnF1ZXJ5UGFyYW1zLmxhdGVzdCk7XG5cdFx0fVxuXG5cdFx0bGV0IG9sZGVzdERhdGUgPSB1bmRlZmluZWQ7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMub2xkZXN0KSB7XG5cdFx0XHRvbGRlc3REYXRlID0gbmV3IERhdGUodGhpcy5xdWVyeVBhcmFtcy5vbGRlc3QpO1xuXHRcdH1cblxuXHRcdGxldCBpbmNsdXNpdmUgPSBmYWxzZTtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5pbmNsdXNpdmUpIHtcblx0XHRcdGluY2x1c2l2ZSA9IHRoaXMucXVlcnlQYXJhbXMuaW5jbHVzaXZlO1xuXHRcdH1cblxuXHRcdGxldCBjb3VudCA9IDIwO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50KSB7XG5cdFx0XHRjb3VudCA9IHBhcnNlSW50KHRoaXMucXVlcnlQYXJhbXMuY291bnQpO1xuXHRcdH1cblxuXHRcdGxldCB1bnJlYWRzID0gZmFsc2U7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMudW5yZWFkcykge1xuXHRcdFx0dW5yZWFkcyA9IHRoaXMucXVlcnlQYXJhbXMudW5yZWFkcztcblx0XHR9XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdHJlc3VsdCA9IE1ldGVvci5jYWxsKCdnZXRDaGFubmVsSGlzdG9yeScsIHsgcmlkOiBmaW5kUmVzdWx0LnJpZCwgbGF0ZXN0OiBsYXRlc3REYXRlLCBvbGRlc3Q6IG9sZGVzdERhdGUsIGluY2x1c2l2ZSwgY291bnQsIHVucmVhZHMgfSk7XG5cdFx0fSk7XG5cblx0XHRpZiAoIXJlc3VsdCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHJlc3VsdCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmluZm8nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5pbnZpdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyByb29tSWQgPSAnJywgcm9vbU5hbWUgPSAnJyB9ID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCk7XG5cdFx0Y29uc3QgaWRPck5hbWUgPSByb29tSWQgfHwgcm9vbU5hbWU7XG5cdFx0aWYgKCFpZE9yTmFtZS50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSBwYXJhbWV0ZXIgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IF9pZDogcmlkLCB0OiB0eXBlIH0gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZE9yTmFtZShpZE9yTmFtZSkgfHwge307XG5cblx0XHRpZiAoIXJpZCB8fCB0eXBlICE9PSAncCcpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBwYXJhbSBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCBhbnkgZ3JvdXAnKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IHVzZXJuYW1lIH0gPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnYWRkVXNlclRvUm9vbScsIHsgcmlkLCB1c2VybmFtZSB9KSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5raWNrJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVVzZXJGcm9tUm9vbScsIHsgcmlkOiBmaW5kUmVzdWx0LnJpZCwgdXNlcm5hbWU6IHVzZXIudXNlcm5hbWUgfSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5sZWF2ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2xlYXZlUm9vbScsIGZpbmRSZXN1bHQucmlkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG4vL0xpc3QgUHJpdmF0ZSBHcm91cHMgYSB1c2VyIGhhcyBhY2Nlc3MgdG9cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMubGlzdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7XG5cdFx0XHR0OiAncCcsXG5cdFx0XHQndS5faWQnOiB0aGlzLnVzZXJJZFxuXHRcdH0pO1xuXG5cdFx0bGV0IHJvb21zID0gXy5wbHVjayhSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmQob3VyUXVlcnkpLmZldGNoKCksICdfcm9vbScpO1xuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSByb29tcy5sZW5ndGg7XG5cblx0XHRyb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChyb29tcywge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXBzOiByb29tcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiByb29tcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmxpc3RBbGwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcm9vbS1hZG1pbmlzdHJhdGlvbicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHQ6ICdwJyB9KTtcblxuXHRcdGxldCByb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQob3VyUXVlcnkpLmZldGNoKCk7XG5cdFx0Y29uc3QgdG90YWxDb3VudCA9IHJvb21zLmxlbmd0aDtcblxuXHRcdHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KHJvb21zLCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cHM6IHJvb21zLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IHJvb21zLmxlbmd0aCxcblx0XHRcdHRvdGFsOiB0b3RhbENvdW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLm1lbWJlcnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQuX3Jvb20uYnJvYWRjYXN0ICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWJyb2FkY2FzdC1tZW1iZXItbGlzdCcpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0bGV0IHNvcnRGbiA9IChhLCBiKSA9PiBhID4gYjtcblx0XHRpZiAoTWF0Y2gudGVzdChzb3J0LCBPYmplY3QpICYmIE1hdGNoLnRlc3Qoc29ydC51c2VybmFtZSwgTnVtYmVyKSAmJiBzb3J0LnVzZXJuYW1lID09PSAtMSkge1xuXHRcdFx0c29ydEZuID0gKGEsIGIpID0+IGIgPCBhO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lbWJlcnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5wcm9jZXNzUXVlcnlPcHRpb25zT25SZXN1bHQoQXJyYXkuZnJvbShmaW5kUmVzdWx0Ll9yb29tLnVzZXJuYW1lcykuc29ydChzb3J0Rm4pLCB7XG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnRcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZCh7IHVzZXJuYW1lOiB7ICRpbjogbWVtYmVycyB9IH0sIHtcblx0XHRcdGZpZWxkczogeyBfaWQ6IDEsIHVzZXJuYW1lOiAxLCBuYW1lOiAxLCBzdGF0dXM6IDEsIHV0Y09mZnNldDogMSB9LFxuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHVzZXJuYW1lOiAxIH1cblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVtYmVyczogdXNlcnMsXG5cdFx0XHRjb3VudDogbWVtYmVycy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogZmluZFJlc3VsdC5fcm9vbS51c2VybmFtZXMubGVuZ3RoXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLm1lc3NhZ2VzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHJpZDogZmluZFJlc3VsdC5yaWQgfSk7XG5cblx0XHRjb25zdCBtZXNzYWdlcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB0czogLTEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlcyxcblx0XHRcdGNvdW50OiBtZXNzYWdlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5vbmxpbmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyB0OiAncCcgfSk7XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZShvdXJRdWVyeSk7XG5cblx0XHRpZiAocm9vbSA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnR3JvdXAgZG9lcyBub3QgZXhpc3RzJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgb25saW5lID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZFVzZXJzTm90T2ZmbGluZSh7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0dXNlcm5hbWU6IDFcblx0XHRcdH1cblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0Y29uc3Qgb25saW5lSW5Sb29tID0gW107XG5cdFx0b25saW5lLmZvckVhY2godXNlciA9PiB7XG5cdFx0XHRpZiAocm9vbS51c2VybmFtZXMuaW5kZXhPZih1c2VyLnVzZXJuYW1lKSAhPT0gLTEpIHtcblx0XHRcdFx0b25saW5lSW5Sb29tLnB1c2goe1xuXHRcdFx0XHRcdF9pZDogdXNlci5faWQsXG5cdFx0XHRcdFx0dXNlcm5hbWU6IHVzZXIudXNlcm5hbWVcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRvbmxpbmU6IG9ubGluZUluUm9vbVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5vcGVuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRpZiAoZmluZFJlc3VsdC5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIHByaXZhdGUgZ3JvdXAsICR7IGZpbmRSZXN1bHQubmFtZSB9LCBpcyBhbHJlYWR5IG9wZW4gZm9yIHRoZSBzZW5kZXJgKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnb3BlblJvb20nLCBmaW5kUmVzdWx0LnJpZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5yZW1vdmVNb2RlcmF0b3InLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgncmVtb3ZlUm9vbU1vZGVyYXRvcicsIGZpbmRSZXN1bHQucmlkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5yZW1vdmVPd25lcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVSb29tT3duZXInLCBmaW5kUmVzdWx0LnJpZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMucmVtb3ZlTGVhZGVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVJvb21MZWFkZXInLCBmaW5kUmVzdWx0LnJpZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMucmVuYW1lJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm5hbWUgfHwgIXRoaXMuYm9keVBhcmFtcy5uYW1lLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJuYW1lXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHsgcm9vbUlkOiB0aGlzLmJvZHlQYXJhbXMucm9vbUlkfSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5yaWQsICdyb29tTmFtZScsIHRoaXMuYm9keVBhcmFtcy5uYW1lKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3VwOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0LnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuc2V0Q3VzdG9tRmllbGRzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyB8fCAhKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzID09PSAnb2JqZWN0JykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwiY3VzdG9tRmllbGRzXCIgaXMgcmVxdWlyZWQgd2l0aCBhIHR5cGUgbGlrZSBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5yaWQsICdyb29tQ3VzdG9tRmllbGRzJywgdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5yaWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnNldERlc2NyaXB0aW9uJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uIHx8ICF0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24udHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcImRlc2NyaXB0aW9uXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJpZCwgJ3Jvb21EZXNjcmlwdGlvbicsIHRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvbik7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRkZXNjcmlwdGlvbjogdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnNldFB1cnBvc2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMucHVycG9zZSB8fCAhdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInB1cnBvc2VcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncm9vbURlc2NyaXB0aW9uJywgdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0cHVycG9zZTogdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuc2V0UmVhZE9ubHknLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInJlYWRPbmx5XCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQucm8gPT09IHRoaXMuYm9keVBhcmFtcy5yZWFkT25seSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBwcml2YXRlIGdyb3VwIHJlYWQgb25seSBzZXR0aW5nIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncmVhZE9ubHknLCB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5zZXRUb3BpYycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy50b3BpYyB8fCAhdGhpcy5ib2R5UGFyYW1zLnRvcGljLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJ0b3BpY1wiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5yaWQsICdyb29tVG9waWMnLCB0aGlzLmJvZHlQYXJhbXMudG9waWMpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dG9waWM6IHRoaXMuYm9keVBhcmFtcy50b3BpY1xuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5zZXRUeXBlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnR5cGUgfHwgIXRoaXMuYm9keVBhcmFtcy50eXBlLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJ0eXBlXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQudCA9PT0gdGhpcy5ib2R5UGFyYW1zLnR5cGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcHJpdmF0ZSBncm91cCB0eXBlIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncm9vbVR5cGUnLCB0aGlzLmJvZHlQYXJhbXMudHlwZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5yaWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnVuYXJjaGl2ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3VuYXJjaGl2ZVJvb20nLCBmaW5kUmVzdWx0LnJpZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5yb2xlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRjb25zdCByb2xlcyA9IE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdnZXRSb29tUm9sZXMnLCBmaW5kUmVzdWx0LnJpZCkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0cm9sZXNcblx0XHR9KTtcblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuZnVuY3Rpb24gZmluZERpcmVjdE1lc3NhZ2VSb29tKHBhcmFtcywgdXNlcikge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMudXNlcm5hbWUgfHwgIXBhcmFtcy51c2VybmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnQm9keSBwYXJhbSBcInJvb21JZFwiIG9yIFwidXNlcm5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHR9XG5cblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQuZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luKHtcblx0XHRjdXJyZW50VXNlcklkOiB1c2VyLl9pZCxcblx0XHRuYW1lT3JJZDogcGFyYW1zLnVzZXJuYW1lIHx8IHBhcmFtcy5yb29tSWQsXG5cdFx0dHlwZTogJ2QnXG5cdH0pO1xuXG5cdGlmICghcm9vbSB8fCByb29tLnQgIT09ICdkJykge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIG9yIFwidXNlcm5hbWVcIiBwYXJhbSBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCBhbnkgZGlyY3QgbWVzc2FnZScpO1xuXHR9XG5cblx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHVzZXIuX2lkKTtcblxuXHRyZXR1cm4ge1xuXHRcdHJvb20sXG5cdFx0c3Vic2NyaXB0aW9uXG5cdH07XG59XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0uY3JlYXRlJywgJ2ltLmNyZWF0ZSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmREaXJlY3RNZXNzYWdlUm9vbSh0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdGhpcy51c2VyKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJvb206IGZpbmRSZXN1bHQucm9vbVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5jbG9zZScsICdpbS5jbG9zZSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmREaXJlY3RNZXNzYWdlUm9vbSh0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdGhpcy51c2VyKTtcblxuXHRcdGlmICghZmluZFJlc3VsdC5zdWJzY3JpcHRpb24ub3Blbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSBkaXJlY3QgbWVzc2FnZSByb29tLCAkeyB0aGlzLmJvZHlQYXJhbXMubmFtZSB9LCBpcyBhbHJlYWR5IGNsb3NlZCB0byB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgZmluZFJlc3VsdC5yb29tLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5jb3VudGVycycsICdpbS5jb3VudGVycyddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBhY2Nlc3MgPSBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKTtcblx0XHRjb25zdCBydXNlcklkID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCkudXNlcklkO1xuXHRcdGxldCB1c2VyID0gdGhpcy51c2VySWQ7XG5cdFx0bGV0IHVucmVhZHMgPSBudWxsO1xuXHRcdGxldCB1c2VyTWVudGlvbnMgPSBudWxsO1xuXHRcdGxldCB1bnJlYWRzRnJvbSA9IG51bGw7XG5cdFx0bGV0IGpvaW5lZCA9IGZhbHNlO1xuXHRcdGxldCBtc2dzID0gbnVsbDtcblx0XHRsZXQgbGF0ZXN0ID0gbnVsbDtcblx0XHRsZXQgbWVtYmVycyA9IG51bGw7XG5cdFx0bGV0IGxtID0gbnVsbDtcblxuXHRcdGlmIChydXNlcklkKSB7XG5cdFx0XHRpZiAoIWFjY2Vzcykge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0XHR9XG5cdFx0XHR1c2VyID0gcnVzZXJJZDtcblx0XHR9XG5cdFx0Y29uc3QgcnMgPSBmaW5kRGlyZWN0TWVzc2FnZVJvb20odGhpcy5yZXF1ZXN0UGFyYW1zKCksIHsnX2lkJzogdXNlcn0pO1xuXHRcdGNvbnN0IHJvb20gPSBycy5yb29tO1xuXHRcdGNvbnN0IGRtID0gcnMuc3Vic2NyaXB0aW9uO1xuXHRcdGxtID0gcm9vbS5sbSA/IHJvb20ubG0gOiByb29tLl91cGRhdGVkQXQ7XG5cblx0XHRpZiAodHlwZW9mIGRtICE9PSAndW5kZWZpbmVkJyAmJiBkbS5vcGVuKSB7XG5cdFx0XHRpZiAoZG0ubHMgJiYgcm9vbS5tc2dzKSB7XG5cdFx0XHRcdHVucmVhZHMgPSBkbS51bnJlYWQ7XG5cdFx0XHRcdHVucmVhZHNGcm9tID0gZG0ubHM7XG5cdFx0XHR9XG5cdFx0XHR1c2VyTWVudGlvbnMgPSBkbS51c2VyTWVudGlvbnM7XG5cdFx0XHRqb2luZWQgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmIChhY2Nlc3MgfHwgam9pbmVkKSB7XG5cdFx0XHRtc2dzID0gcm9vbS5tc2dzO1xuXHRcdFx0bGF0ZXN0ID0gbG07XG5cdFx0XHRtZW1iZXJzID0gcm9vbS51c2VybmFtZXMubGVuZ3RoO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGpvaW5lZCxcblx0XHRcdG1lbWJlcnMsXG5cdFx0XHR1bnJlYWRzLFxuXHRcdFx0dW5yZWFkc0Zyb20sXG5cdFx0XHRtc2dzLFxuXHRcdFx0bGF0ZXN0LFxuXHRcdFx0dXNlck1lbnRpb25zXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZShbJ2RtLmZpbGVzJywgJ2ltLmZpbGVzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kRGlyZWN0TWVzc2FnZVJvb20odGhpcy5yZXF1ZXN0UGFyYW1zKCksIHRoaXMudXNlcik7XG5cdFx0Y29uc3QgYWRkVXNlck9iamVjdFRvRXZlcnlPYmplY3QgPSAoZmlsZSkgPT4ge1xuXHRcdFx0aWYgKGZpbGUudXNlcklkKSB7XG5cdFx0XHRcdGZpbGUgPSB0aGlzLmluc2VydFVzZXJPYmplY3QoeyBvYmplY3Q6IGZpbGUsIHVzZXJJZDogZmlsZS51c2VySWQgfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmlsZTtcblx0XHR9O1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBmaWxlcyA9IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRmaWxlczogZmlsZXMubWFwKGFkZFVzZXJPYmplY3RUb0V2ZXJ5T2JqZWN0KSxcblx0XHRcdGNvdW50OiBmaWxlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZShbJ2RtLmhpc3RvcnknLCAnaW0uaGlzdG9yeSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0bGV0IGxhdGVzdERhdGUgPSBuZXcgRGF0ZSgpO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmxhdGVzdCkge1xuXHRcdFx0bGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgb2xkZXN0RGF0ZSA9IHVuZGVmaW5lZDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5vbGRlc3QpIHtcblx0XHRcdG9sZGVzdERhdGUgPSBuZXcgRGF0ZSh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCk7XG5cdFx0fVxuXG5cdFx0bGV0IGluY2x1c2l2ZSA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZSkge1xuXHRcdFx0aW5jbHVzaXZlID0gdGhpcy5xdWVyeVBhcmFtcy5pbmNsdXNpdmU7XG5cdFx0fVxuXG5cdFx0bGV0IGNvdW50ID0gMjA7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuY291bnQpIHtcblx0XHRcdGNvdW50ID0gcGFyc2VJbnQodGhpcy5xdWVyeVBhcmFtcy5jb3VudCk7XG5cdFx0fVxuXG5cdFx0bGV0IHVucmVhZHMgPSBmYWxzZTtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzKSB7XG5cdFx0XHR1bnJlYWRzID0gdGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0cmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ2dldENoYW5uZWxIaXN0b3J5Jywge1xuXHRcdFx0XHRyaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQsXG5cdFx0XHRcdGxhdGVzdDogbGF0ZXN0RGF0ZSxcblx0XHRcdFx0b2xkZXN0OiBvbGRlc3REYXRlLFxuXHRcdFx0XHRpbmNsdXNpdmUsXG5cdFx0XHRcdGNvdW50LFxuXHRcdFx0XHR1bnJlYWRzXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ubWVtYmVycycsICdpbS5tZW1iZXJzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kRGlyZWN0TWVzc2FnZVJvb20odGhpcy5yZXF1ZXN0UGFyYW1zKCksIHRoaXMudXNlcik7XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBtZW1iZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KEFycmF5LmZyb20oZmluZFJlc3VsdC5yb29tLnVzZXJuYW1lcyksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogLTEsXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnRcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZCh7IHVzZXJuYW1lOiB7ICRpbjogbWVtYmVycyB9IH0sXG5cdFx0XHR7IGZpZWxkczogeyBfaWQ6IDEsIHVzZXJuYW1lOiAxLCBuYW1lOiAxLCBzdGF0dXM6IDEsIHV0Y09mZnNldDogMSB9IH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZW1iZXJzOiB1c2Vycyxcblx0XHRcdGNvdW50OiBtZW1iZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBmaW5kUmVzdWx0LnJvb20udXNlcm5hbWVzLmxlbmd0aFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5tZXNzYWdlcycsICdpbS5tZXNzYWdlcyddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc29sZS5sb2coZmluZFJlc3VsdCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBtZXNzYWdlcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB0czogLTEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlcyxcblx0XHRcdGNvdW50OiBtZXNzYWdlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5tZXNzYWdlcy5vdGhlcnMnLCAnaW0ubWVzc2FnZXMub3RoZXJzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0VuYWJsZV9EaXJlY3RfTWVzc2FnZV9IaXN0b3J5X0VuZFBvaW50JykgIT09IHRydWUpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWVuZHBvaW50LWRpc2FibGVkJywgJ1RoaXMgZW5kcG9pbnQgaXMgZGlzYWJsZWQnLCB7IHJvdXRlOiAnL2FwaS92MS9pbS5tZXNzYWdlcy5vdGhlcnMnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1yb29tLWFkbWluaXN0cmF0aW9uJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tSWQgPSB0aGlzLnF1ZXJ5UGFyYW1zLnJvb21JZDtcblx0XHRpZiAoIXJvb21JZCB8fCAhcm9vbUlkLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblx0XHRpZiAoIXJvb20gfHwgcm9vbS50ICE9PSAnZCcpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgYE5vIGRpcmVjdCBtZXNzYWdlIHJvb20gZm91bmQgYnkgdGhlIGlkIG9mOiAkeyByb29tSWQgfWApO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHJpZDogcm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBtc2dzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2VzOiBtc2dzLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IG1zZ3MubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ubGlzdCcsICdpbS5saXN0J10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7XG5cdFx0XHR0OiAnZCcsXG5cdFx0XHQndS5faWQnOiB0aGlzLnVzZXJJZFxuXHRcdH0pO1xuXG5cdFx0bGV0IHJvb21zID0gXy5wbHVjayhSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmQob3VyUXVlcnkpLmZldGNoKCksICdfcm9vbScpO1xuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSByb29tcy5sZW5ndGg7XG5cblx0XHRyb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChyb29tcywge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW1zOiByb29tcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiByb29tcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5saXN0LmV2ZXJ5b25lJywgJ2ltLmxpc3QuZXZlcnlvbmUnXSwgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgdDogJ2QnIH0pO1xuXG5cdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGltczogcm9vbXMsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHRjb3VudDogcm9vbXMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ub3BlbicsICdpbS5vcGVuJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0aWYgKCFmaW5kUmVzdWx0LnN1YnNjcmlwdGlvbi5vcGVuKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdvcGVuUm9vbScsIGZpbmRSZXN1bHQucm9vbS5faWQpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0uc2V0VG9waWMnLCAnaW0uc2V0VG9waWMnXSwgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnRvcGljIHx8ICF0aGlzLmJvZHlQYXJhbXMudG9waWMudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInRvcGljXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJvb20uX2lkLCAncm9vbVRvcGljJywgdGhpcy5ib2R5UGFyYW1zLnRvcGljKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHRvcGljOiB0aGlzLmJvZHlQYXJhbXMudG9waWNcblx0XHR9KTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnaW50ZWdyYXRpb25zLmNyZWF0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHRuYW1lOiBTdHJpbmcsXG5cdFx0XHRlbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0dXNlcm5hbWU6IFN0cmluZyxcblx0XHRcdHVybHM6IE1hdGNoLk1heWJlKFtTdHJpbmddKSxcblx0XHRcdGNoYW5uZWw6IFN0cmluZyxcblx0XHRcdGV2ZW50OiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dHJpZ2dlcldvcmRzOiBNYXRjaC5NYXliZShbU3RyaW5nXSksXG5cdFx0XHRhbGlhczogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdGF2YXRhcjogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdGVtb2ppOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dG9rZW46IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRzY3JpcHRFbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0c2NyaXB0OiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dGFyZ2V0Q2hhbm5lbDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblxuXHRcdHN3aXRjaCAodGhpcy5ib2R5UGFyYW1zLnR5cGUpIHtcblx0XHRcdGNhc2UgJ3dlYmhvb2stb3V0Z29pbmcnOlxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBNZXRlb3IuY2FsbCgnYWRkT3V0Z29pbmdJbnRlZ3JhdGlvbicsIHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3dlYmhvb2staW5jb21pbmcnOlxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBNZXRlb3IuY2FsbCgnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicsIHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdJbnZhbGlkIGludGVncmF0aW9uIHR5cGUuJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBpbnRlZ3JhdGlvbiB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdpbnRlZ3JhdGlvbnMuaGlzdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLnF1ZXJ5UGFyYW1zLmlkIHx8IHRoaXMucXVlcnlQYXJhbXMuaWQudHJpbSgpID09PSAnJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0ludmFsaWQgaW50ZWdyYXRpb24gaWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaWQgPSB0aGlzLnF1ZXJ5UGFyYW1zLmlkO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgJ2ludGVncmF0aW9uLl9pZCc6IGlkIH0pO1xuXHRcdGNvbnN0IGhpc3RvcnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IF91cGRhdGVkQXQ6IC0xIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aGlzdG9yeSxcblx0XHRcdG9mZnNldCxcblx0XHRcdGl0ZW1zOiBoaXN0b3J5Lmxlbmd0aCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2ludGVncmF0aW9ucy5saXN0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5KTtcblx0XHRjb25zdCBpbnRlZ3JhdGlvbnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGludGVncmF0aW9ucyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGl0ZW1zOiBpbnRlZ3JhdGlvbnMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnaW50ZWdyYXRpb25zLnJlbW92ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHR0YXJnZXRfdXJsOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0aW50ZWdyYXRpb25JZDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnRhcmdldF91cmwgJiYgIXRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQW4gaW50ZWdyYXRpb25JZCBvciB0YXJnZXRfdXJsIG5lZWRzIHRvIGJlIHByb3ZpZGVkLicpO1xuXHRcdH1cblxuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblx0XHRzd2l0Y2ggKHRoaXMuYm9keVBhcmFtcy50eXBlKSB7XG5cdFx0XHRjYXNlICd3ZWJob29rLW91dGdvaW5nJzpcblx0XHRcdFx0aWYgKHRoaXMuYm9keVBhcmFtcy50YXJnZXRfdXJsKSB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IHVybHM6IHRoaXMuYm9keVBhcmFtcy50YXJnZXRfdXJsIH0pO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkKSB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IF9pZDogdGhpcy5ib2R5UGFyYW1zLmludGVncmF0aW9uSWQgfSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIWludGVncmF0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ05vIGludGVncmF0aW9uIGZvdW5kLicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdE1ldGVvci5jYWxsKCdkZWxldGVPdXRnb2luZ0ludGVncmF0aW9uJywgaW50ZWdyYXRpb24uX2lkKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGludGVncmF0aW9uXG5cdFx0XHRcdH0pO1xuXHRcdFx0Y2FzZSAnd2ViaG9vay1pbmNvbWluZyc6XG5cdFx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoeyBfaWQ6IHRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkIH0pO1xuXG5cdFx0XHRcdGlmICghaW50ZWdyYXRpb24pIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnTm8gaW50ZWdyYXRpb24gZm91bmQuJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2RlbGV0ZUluY29taW5nSW50ZWdyYXRpb24nLCBpbnRlZ3JhdGlvbi5faWQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb25cblx0XHRcdFx0fSk7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnSW52YWxpZCBpbnRlZ3JhdGlvbiB0eXBlLicpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdpbmZvJywgeyBhdXRoUmVxdWlyZWQ6IGZhbHNlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldExvZ2dlZEluVXNlcigpO1xuXG5cdFx0aWYgKHVzZXIgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNSb2xlKHVzZXIuX2lkLCAnYWRtaW4nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRpbmZvOiBSb2NrZXRDaGF0LkluZm9cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGluZm86IHtcblx0XHRcdFx0J3ZlcnNpb24nOiBSb2NrZXRDaGF0LkluZm8udmVyc2lvblxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ21lJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModGhpcy5nZXRVc2VySW5mbyhSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCkpKTtcblx0fVxufSk7XG5cbmxldCBvbmxpbmVDYWNoZSA9IDA7XG5sZXQgb25saW5lQ2FjaGVEYXRlID0gMDtcbmNvbnN0IGNhY2hlSW52YWxpZCA9IDYwMDAwOyAvLyAxIG1pbnV0ZVxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3NoaWVsZC5zdmcnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyB0eXBlLCBjaGFubmVsLCBuYW1lLCBpY29uIH0gPSB0aGlzLnF1ZXJ5UGFyYW1zO1xuXHRcdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9FbmFibGVfU2hpZWxkcycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1lbmRwb2ludC1kaXNhYmxlZCcsICdUaGlzIGVuZHBvaW50IGlzIGRpc2FibGVkJywgeyByb3V0ZTogJy9hcGkvdjEvc2hpZWxkLnN2ZycgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdHlwZXMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1NoaWVsZF9UeXBlcycpO1xuXHRcdGlmICh0eXBlICYmICh0eXBlcyAhPT0gJyonICYmICF0eXBlcy5zcGxpdCgnLCcpLm1hcCgodCkgPT4gdC50cmltKCkpLmluY2x1ZGVzKHR5cGUpKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itc2hpZWxkLWRpc2FibGVkJywgJ1RoaXMgc2hpZWxkIHR5cGUgaXMgZGlzYWJsZWQnLCB7IHJvdXRlOiAnL2FwaS92MS9zaGllbGQuc3ZnJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBoaWRlSWNvbiA9IGljb24gPT09ICdmYWxzZSc7XG5cdFx0aWYgKGhpZGVJY29uICYmICghbmFtZSB8fCAhbmFtZS50cmltKCkpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnTmFtZSBjYW5ub3QgYmUgZW1wdHkgd2hlbiBpY29uIGlzIGhpZGRlbicpO1xuXHRcdH1cblxuXHRcdGxldCB0ZXh0O1xuXHRcdGxldCBiYWNrZ3JvdW5kQ29sb3IgPSAnIzRjMSc7XG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlICdvbmxpbmUnOlxuXHRcdFx0XHRpZiAoRGF0ZS5ub3coKSAtIG9ubGluZUNhY2hlRGF0ZSA+IGNhY2hlSW52YWxpZCkge1xuXHRcdFx0XHRcdG9ubGluZUNhY2hlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZFVzZXJzTm90T2ZmbGluZSgpLmNvdW50KCk7XG5cdFx0XHRcdFx0b25saW5lQ2FjaGVEYXRlID0gRGF0ZS5ub3coKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRleHQgPSBgJHsgb25saW5lQ2FjaGUgfSAkeyBUQVBpMThuLl9fKCdPbmxpbmUnKSB9YDtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdjaGFubmVsJzpcblx0XHRcdFx0aWYgKCFjaGFubmVsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1NoaWVsZCBjaGFubmVsIGlzIHJlcXVpcmVkIGZvciB0eXBlIFwiY2hhbm5lbFwiJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0ZXh0ID0gYCMkeyBjaGFubmVsIH1gO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3VzZXInOlxuXHRcdFx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0XHRcdC8vIFJlc3BlY3QgdGhlIHNlcnZlcidzIGNob2ljZSBmb3IgdXNpbmcgdGhlaXIgcmVhbCBuYW1lcyBvciBub3Rcblx0XHRcdFx0aWYgKHVzZXIubmFtZSAmJiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVUlfVXNlX1JlYWxfTmFtZScpKSB7XG5cdFx0XHRcdFx0dGV4dCA9IGAkeyB1c2VyLm5hbWUgfWA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGV4dCA9IGBAJHsgdXNlci51c2VybmFtZSB9YDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHN3aXRjaCAodXNlci5zdGF0dXMpIHtcblx0XHRcdFx0XHRjYXNlICdvbmxpbmUnOlxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yID0gJyMxZmIzMWYnO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnYXdheSc6XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgPSAnI2RjOWIwMSc7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdidXN5Jzpcblx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvciA9ICcjYmMyMDMxJztcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ29mZmxpbmUnOlxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yID0gJyNhNWExYTEnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGV4dCA9IFRBUGkxOG4uX18oJ0pvaW5fQ2hhdCcpLnRvVXBwZXJDYXNlKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaWNvblNpemUgPSBoaWRlSWNvbiA/IDcgOiAyNDtcblx0XHRjb25zdCBsZWZ0U2l6ZSA9IG5hbWUgPyBuYW1lLmxlbmd0aCAqIDYgKyA3ICsgaWNvblNpemUgOiBpY29uU2l6ZTtcblx0XHRjb25zdCByaWdodFNpemUgPSB0ZXh0Lmxlbmd0aCAqIDYgKyAyMDtcblx0XHRjb25zdCB3aWR0aCA9IGxlZnRTaXplICsgcmlnaHRTaXplO1xuXHRcdGNvbnN0IGhlaWdodCA9IDIwO1xuXHRcdHJldHVybiB7XG5cdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnaW1hZ2Uvc3ZnK3htbDtjaGFyc2V0PXV0Zi04JyB9LFxuXHRcdFx0Ym9keTogYFxuXHRcdFx0XHQ8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB3aWR0aD1cIiR7IHdpZHRoIH1cIiBoZWlnaHQ9XCIkeyBoZWlnaHQgfVwiPlxuXHRcdFx0XHQgIDxsaW5lYXJHcmFkaWVudCBpZD1cImJcIiB4Mj1cIjBcIiB5Mj1cIjEwMCVcIj5cblx0XHRcdFx0ICAgIDxzdG9wIG9mZnNldD1cIjBcIiBzdG9wLWNvbG9yPVwiI2JiYlwiIHN0b3Atb3BhY2l0eT1cIi4xXCIvPlxuXHRcdFx0XHQgICAgPHN0b3Agb2Zmc2V0PVwiMVwiIHN0b3Atb3BhY2l0eT1cIi4xXCIvPlxuXHRcdFx0XHQgIDwvbGluZWFyR3JhZGllbnQ+XG5cdFx0XHRcdCAgPG1hc2sgaWQ9XCJhXCI+XG5cdFx0XHRcdCAgICA8cmVjdCB3aWR0aD1cIiR7IHdpZHRoIH1cIiBoZWlnaHQ9XCIkeyBoZWlnaHQgfVwiIHJ4PVwiM1wiIGZpbGw9XCIjZmZmXCIvPlxuXHRcdFx0XHQgIDwvbWFzaz5cblx0XHRcdFx0ICA8ZyBtYXNrPVwidXJsKCNhKVwiPlxuXHRcdFx0XHQgICAgPHBhdGggZmlsbD1cIiM1NTVcIiBkPVwiTTAgMGgkeyBsZWZ0U2l6ZSB9diR7IGhlaWdodCB9SDB6XCIvPlxuXHRcdFx0XHQgICAgPHBhdGggZmlsbD1cIiR7IGJhY2tncm91bmRDb2xvciB9XCIgZD1cIk0keyBsZWZ0U2l6ZSB9IDBoJHsgcmlnaHRTaXplIH12JHsgaGVpZ2h0IH1IJHsgbGVmdFNpemUgfXpcIi8+XG5cdFx0XHRcdCAgICA8cGF0aCBmaWxsPVwidXJsKCNiKVwiIGQ9XCJNMCAwaCR7IHdpZHRoIH12JHsgaGVpZ2h0IH1IMHpcIi8+XG5cdFx0XHRcdCAgPC9nPlxuXHRcdFx0XHQgICAgJHsgaGlkZUljb24gPyAnJyA6ICc8aW1hZ2UgeD1cIjVcIiB5PVwiM1wiIHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCIxNFwiIHhsaW5rOmhyZWY9XCIvYXNzZXRzL2Zhdmljb24uc3ZnXCIvPicgfVxuXHRcdFx0XHQgIDxnIGZpbGw9XCIjZmZmXCIgZm9udC1mYW1pbHk9XCJEZWphVnUgU2FucyxWZXJkYW5hLEdlbmV2YSxzYW5zLXNlcmlmXCIgZm9udC1zaXplPVwiMTFcIj5cblx0XHRcdFx0XHRcdCR7IG5hbWUgPyBgPHRleHQgeD1cIiR7IGljb25TaXplIH1cIiB5PVwiMTVcIiBmaWxsPVwiIzAxMDEwMVwiIGZpbGwtb3BhY2l0eT1cIi4zXCI+JHsgbmFtZSB9PC90ZXh0PlxuXHRcdFx0XHQgICAgPHRleHQgeD1cIiR7IGljb25TaXplIH1cIiB5PVwiMTRcIj4keyBuYW1lIH08L3RleHQ+YCA6ICcnIH1cblx0XHRcdFx0ICAgIDx0ZXh0IHg9XCIkeyBsZWZ0U2l6ZSArIDcgfVwiIHk9XCIxNVwiIGZpbGw9XCIjMDEwMTAxXCIgZmlsbC1vcGFjaXR5PVwiLjNcIj4keyB0ZXh0IH08L3RleHQ+XG5cdFx0XHRcdCAgICA8dGV4dCB4PVwiJHsgbGVmdFNpemUgKyA3IH1cIiB5PVwiMTRcIj4keyB0ZXh0IH08L3RleHQ+XG5cdFx0XHRcdCAgPC9nPlxuXHRcdFx0XHQ8L3N2Zz5cblx0XHRcdGAudHJpbSgpLnJlcGxhY2UoL1xcPltcXHNdK1xcPC9nbSwgJz48Jylcblx0XHR9O1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3Nwb3RsaWdodCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNoZWNrKHRoaXMucXVlcnlQYXJhbXMsIHtcblx0XHRcdHF1ZXJ5OiBTdHJpbmdcblx0XHR9KTtcblxuXHRcdGNvbnN0IHsgcXVlcnkgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRjb25zdCByZXN1bHQgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PlxuXHRcdFx0TWV0ZW9yLmNhbGwoJ3Nwb3RsaWdodCcsIHF1ZXJ5KVxuXHRcdCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhyZXN1bHQpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2RpcmVjdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCB7IHRleHQsIHR5cGUgfSA9IHF1ZXJ5O1xuXHRcdGlmIChzb3J0ICYmIE9iamVjdC5rZXlzKHNvcnQpLmxlbmd0aCA+IDEpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGlzIG1ldGhvZCBzdXBwb3J0IG9ubHkgb25lIFwic29ydFwiIHBhcmFtZXRlcicpO1xuXHRcdH1cblx0XHRjb25zdCBzb3J0QnkgPSBzb3J0ID8gT2JqZWN0LmtleXMoc29ydClbMF0gOiB1bmRlZmluZWQ7XG5cdFx0Y29uc3Qgc29ydERpcmVjdGlvbiA9IHNvcnQgJiYgT2JqZWN0LnZhbHVlcyhzb3J0KVswXSA9PT0gMSA/ICdhc2MnIDogJ2Rlc2MnO1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2Jyb3dzZUNoYW5uZWxzJywge1xuXHRcdFx0dGV4dCxcblx0XHRcdHR5cGUsXG5cdFx0XHRzb3J0QnksXG5cdFx0XHRzb3J0RGlyZWN0aW9uLFxuXHRcdFx0cGFnZTogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50XG5cdFx0fSkpO1xuXG5cdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdQbGVhc2UgdmVyaWZ5IHRoZSBwYXJhbWV0ZXJzJyk7XG5cdFx0fVxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJlc3VsdDogcmVzdWx0LnJlc3VsdHMsXG5cdFx0XHRjb3VudDogcmVzdWx0LnJlc3VsdHMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IHJlc3VsdC50b3RhbFxuXHRcdH0pO1xuXHR9XG59KTtcbiIsIi8qKlxuXHRUaGlzIEFQSSByZXR1cm5zIGFsbCBwZXJtaXNzaW9ucyB0aGF0IGV4aXN0c1xuXHRvbiB0aGUgc2VydmVyLCB3aXRoIHJlc3BlY3RpdmUgcm9sZXMuXG5cblx0TWV0aG9kOiBHRVRcblx0Um91dGU6IGFwaS92MS9wZXJtaXNzaW9uc1xuICovXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncGVybWlzc2lvbnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB3YXJuaW5nTWVzc2FnZSA9ICdUaGUgZW5kcG9pbnQgXCJwZXJtaXNzaW9uc1wiIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBhZnRlciB2ZXJzaW9uIHYwLjY5Jztcblx0XHRjb25zb2xlLndhcm4od2FybmluZ01lc3NhZ2UpO1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3Blcm1pc3Npb25zL2dldCcpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHJlc3VsdCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncGVybWlzc2lvbnMubGlzdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdwZXJtaXNzaW9ucy9nZXQnKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRwZXJtaXNzaW9uczogcmVzdWx0XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncGVybWlzc2lvbnMudXBkYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnYWNjZXNzLXBlcm1pc3Npb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdFZGl0aW5nIHBlcm1pc3Npb25zIGlzIG5vdCBhbGxvd2VkJywgJ2Vycm9yLWVkaXQtcGVybWlzc2lvbnMtbm90LWFsbG93ZWQnKTtcblx0XHR9XG5cblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHBlcm1pc3Npb25zOiBbXG5cdFx0XHRcdE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRcdFx0X2lkOiBTdHJpbmcsXG5cdFx0XHRcdFx0cm9sZXM6IFtTdHJpbmddXG5cdFx0XHRcdH0pXG5cdFx0XHRdXG5cdFx0fSk7XG5cblx0XHRsZXQgcGVybWlzc2lvbk5vdEZvdW5kID0gZmFsc2U7XG5cdFx0bGV0IHJvbGVOb3RGb3VuZCA9IGZhbHNlO1xuXHRcdE9iamVjdC5rZXlzKHRoaXMuYm9keVBhcmFtcy5wZXJtaXNzaW9ucykuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRjb25zdCBlbGVtZW50ID0gdGhpcy5ib2R5UGFyYW1zLnBlcm1pc3Npb25zW2tleV07XG5cblx0XHRcdGlmICghUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuZmluZE9uZUJ5SWQoZWxlbWVudC5faWQpKSB7XG5cdFx0XHRcdHBlcm1pc3Npb25Ob3RGb3VuZCA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdE9iamVjdC5rZXlzKGVsZW1lbnQucm9sZXMpLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdFx0XHRjb25zdCBzdWJlbGVtZW50ID0gZWxlbWVudC5yb2xlc1trZXldO1xuXG5cdFx0XHRcdGlmICghUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZE9uZUJ5SWQoc3ViZWxlbWVudCkpIHtcblx0XHRcdFx0XHRyb2xlTm90Rm91bmQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmIChwZXJtaXNzaW9uTm90Rm91bmQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdJbnZhbGlkIHBlcm1pc3Npb24nLCAnZXJyb3ItaW52YWxpZC1wZXJtaXNzaW9uJyk7XG5cdFx0fSBlbHNlIGlmIChyb2xlTm90Rm91bmQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdJbnZhbGlkIHJvbGUnLCAnZXJyb3ItaW52YWxpZC1yb2xlJyk7XG5cdFx0fVxuXG5cdFx0T2JqZWN0LmtleXModGhpcy5ib2R5UGFyYW1zLnBlcm1pc3Npb25zKS5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRcdGNvbnN0IGVsZW1lbnQgPSB0aGlzLmJvZHlQYXJhbXMucGVybWlzc2lvbnNba2V5XTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoZWxlbWVudC5faWQsIGVsZW1lbnQucm9sZXMpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3Blcm1pc3Npb25zL2dldCcpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHBlcm1pc3Npb25zOiByZXN1bHRcblx0XHR9KTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIFB1c2ggKi9cblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3B1c2gudG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyB0eXBlLCB2YWx1ZSwgYXBwTmFtZSB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXHRcdGxldCB7IGlkIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cblx0XHRpZiAoaWQgJiYgdHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaWQtcGFyYW0tbm90LXZhbGlkJywgJ1RoZSByZXF1aXJlZCBcImlkXCIgYm9keSBwYXJhbSBpcyBpbnZhbGlkLicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdH1cblxuXHRcdGlmICghdHlwZSB8fCAodHlwZSAhPT0gJ2FwbicgJiYgdHlwZSAhPT0gJ2djbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10eXBlLXBhcmFtLW5vdC12YWxpZCcsICdUaGUgcmVxdWlyZWQgXCJ0eXBlXCIgYm9keSBwYXJhbSBpcyBtaXNzaW5nIG9yIGludmFsaWQuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10b2tlbi1wYXJhbS1ub3QtdmFsaWQnLCAnVGhlIHJlcXVpcmVkIFwidmFsdWVcIiBib2R5IHBhcmFtIGlzIG1pc3Npbmcgb3IgaW52YWxpZC4nKTtcblx0XHR9XG5cblx0XHRpZiAoIWFwcE5hbWUgfHwgdHlwZW9mIGFwcE5hbWUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hcHBOYW1lLXBhcmFtLW5vdC12YWxpZCcsICdUaGUgcmVxdWlyZWQgXCJhcHBOYW1lXCIgYm9keSBwYXJhbSBpcyBtaXNzaW5nIG9yIGludmFsaWQuJyk7XG5cdFx0fVxuXG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHJlc3VsdCA9IE1ldGVvci5jYWxsKCdyYWl4OnB1c2gtdXBkYXRlJywge1xuXHRcdFx0aWQsXG5cdFx0XHR0b2tlbjogeyBbdHlwZV06IHZhbHVlIH0sXG5cdFx0XHRhcHBOYW1lLFxuXHRcdFx0dXNlcklkOiB0aGlzLnVzZXJJZFxuXHRcdH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgcmVzdWx0IH0pO1xuXHR9LFxuXHRkZWxldGUoKSB7XG5cdFx0Y29uc3QgeyB0b2tlbiB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXG5cdFx0aWYgKCF0b2tlbiB8fCB0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10b2tlbi1wYXJhbS1ub3QtdmFsaWQnLCAnVGhlIHJlcXVpcmVkIFwidG9rZW5cIiBib2R5IHBhcmFtIGlzIG1pc3Npbmcgb3IgaW52YWxpZC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBhZmZlY3RlZFJlY29yZHMgPSBQdXNoLmFwcENvbGxlY3Rpb24ucmVtb3ZlKHtcblx0XHRcdCRvcjogW3tcblx0XHRcdFx0J3Rva2VuLmFwbic6IHRva2VuXG5cdFx0XHR9LCB7XG5cdFx0XHRcdCd0b2tlbi5nY20nOiB0b2tlblxuXHRcdFx0fV0sXG5cdFx0XHR1c2VySWQ6IHRoaXMudXNlcklkXG5cdFx0fSk7XG5cblx0XHRpZiAoYWZmZWN0ZWRSZWNvcmRzID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG4vLyBzZXR0aW5ncyBlbmRwb2ludHNcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncy5wdWJsaWMnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0bGV0IG91clF1ZXJ5ID0ge1xuXHRcdFx0aGlkZGVuOiB7ICRuZTogdHJ1ZSB9LFxuXHRcdFx0J3B1YmxpYyc6IHRydWVcblx0XHR9O1xuXG5cdFx0b3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgb3VyUXVlcnkpO1xuXG5cdFx0Y29uc3Qgc2V0dGluZ3MgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgX2lkOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHM6IE9iamVjdC5hc3NpZ24oeyBfaWQ6IDEsIHZhbHVlOiAxIH0sIGZpZWxkcylcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c2V0dGluZ3MsXG5cdFx0XHRjb3VudDogc2V0dGluZ3MubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncy5vYXV0aCcsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBtb3VudE9BdXRoU2VydmljZXMgPSAoKSA9PiB7XG5cdFx0XHRjb25zdCBvQXV0aFNlcnZpY2VzRW5hYmxlZCA9IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmQoe30sIHsgZmllbGRzOiB7IHNlY3JldDogMCB9IH0pLmZldGNoKCk7XG5cblx0XHRcdHJldHVybiBvQXV0aFNlcnZpY2VzRW5hYmxlZC5tYXAoKHNlcnZpY2UpID0+IHtcblx0XHRcdFx0aWYgKHNlcnZpY2UuY3VzdG9tIHx8IFsnc2FtbCcsICdjYXMnLCAnd29yZHByZXNzJ10uaW5jbHVkZXMoc2VydmljZS5zZXJ2aWNlKSkge1xuXHRcdFx0XHRcdHJldHVybiB7IC4uLnNlcnZpY2UgfTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0X2lkOiBzZXJ2aWNlLl9pZCxcblx0XHRcdFx0XHRuYW1lOiBzZXJ2aWNlLnNlcnZpY2UsXG5cdFx0XHRcdFx0Y2xpZW50SWQ6IHNlcnZpY2UuYXBwSWQgfHwgc2VydmljZS5jbGllbnRJZCB8fCBzZXJ2aWNlLmNvbnN1bWVyS2V5LFxuXHRcdFx0XHRcdGJ1dHRvbkxhYmVsVGV4dDogc2VydmljZS5idXR0b25MYWJlbFRleHQgfHwgJycsXG5cdFx0XHRcdFx0YnV0dG9uQ29sb3I6IHNlcnZpY2UuYnV0dG9uQ29sb3IgfHwgJycsXG5cdFx0XHRcdFx0YnV0dG9uTGFiZWxDb2xvcjogc2VydmljZS5idXR0b25MYWJlbENvbG9yIHx8ICcnLFxuXHRcdFx0XHRcdGN1c3RvbTogZmFsc2Vcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRzZXJ2aWNlczogbW91bnRPQXV0aFNlcnZpY2VzKClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGxldCBvdXJRdWVyeSA9IHtcblx0XHRcdGhpZGRlbjogeyAkbmU6IHRydWUgfVxuXHRcdH07XG5cblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcHJpdmlsZWdlZC1zZXR0aW5nJykpIHtcblx0XHRcdG91clF1ZXJ5LnB1YmxpYyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0b3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgb3VyUXVlcnkpO1xuXG5cdFx0Y29uc3Qgc2V0dGluZ3MgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgX2lkOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHM6IE9iamVjdC5hc3NpZ24oeyBfaWQ6IDEsIHZhbHVlOiAxIH0sIGZpZWxkcylcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c2V0dGluZ3MsXG5cdFx0XHRjb3VudDogc2V0dGluZ3MubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncy86X2lkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXByaXZpbGVnZWQtc2V0dGluZycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoXy5waWNrKFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRPbmVOb3RIaWRkZW5CeUlkKHRoaXMudXJsUGFyYW1zLl9pZCksICdfaWQnLCAndmFsdWUnKSk7XG5cdH0sXG5cdHBvc3QoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdlZGl0LXByaXZpbGVnZWQtc2V0dGluZycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Ly8gYWxsb3cgc3BlY2lhbCBoYW5kbGluZyBvZiBwYXJ0aWN1bGFyIHNldHRpbmcgdHlwZXNcblx0XHRjb25zdCBzZXR0aW5nID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZU5vdEhpZGRlbkJ5SWQodGhpcy51cmxQYXJhbXMuX2lkKTtcblx0XHRpZiAoc2V0dGluZy50eXBlID09PSAnYWN0aW9uJyAmJiB0aGlzLmJvZHlQYXJhbXMgJiYgdGhpcy5ib2R5UGFyYW1zLmV4ZWN1dGUpIHtcblx0XHRcdC8vZXhlY3V0ZSB0aGUgY29uZmlndXJlZCBtZXRob2Rcblx0XHRcdE1ldGVvci5jYWxsKHNldHRpbmcudmFsdWUpO1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHR9XG5cblx0XHRpZiAoc2V0dGluZy50eXBlID09PSAnY29sb3InICYmIHRoaXMuYm9keVBhcmFtcyAmJiB0aGlzLmJvZHlQYXJhbXMuZWRpdG9yICYmIHRoaXMuYm9keVBhcmFtcy52YWx1ZSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MudXBkYXRlT3B0aW9uc0J5SWQodGhpcy51cmxQYXJhbXMuX2lkLCB7IGVkaXRvcjogdGhpcy5ib2R5UGFyYW1zLmVkaXRvciB9KTtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLnVwZGF0ZVZhbHVlTm90SGlkZGVuQnlJZCh0aGlzLnVybFBhcmFtcy5faWQsIHRoaXMuYm9keVBhcmFtcy52YWx1ZSk7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdH1cblxuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0dmFsdWU6IE1hdGNoLkFueVxuXHRcdH0pO1xuXHRcdGlmIChSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy51cGRhdGVWYWx1ZU5vdEhpZGRlbkJ5SWQodGhpcy51cmxQYXJhbXMuX2lkLCB0aGlzLmJvZHlQYXJhbXMudmFsdWUpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc2VydmljZS5jb25maWd1cmF0aW9ucycsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBTZXJ2aWNlQ29uZmlndXJhdGlvbiA9IFBhY2thZ2VbJ3NlcnZpY2UtY29uZmlndXJhdGlvbiddLlNlcnZpY2VDb25maWd1cmF0aW9uO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y29uZmlndXJhdGlvbnM6IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmQoe30sIHsgZmllbGRzOiB7IHNlY3JldDogMCB9IH0pLmZldGNoKClcblx0XHR9KTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc3RhdGlzdGljcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGxldCByZWZyZXNoID0gZmFsc2U7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLnF1ZXJ5UGFyYW1zLnJlZnJlc2ggIT09ICd1bmRlZmluZWQnICYmIHRoaXMucXVlcnlQYXJhbXMucmVmcmVzaCA9PT0gJ3RydWUnKSB7XG5cdFx0XHRyZWZyZXNoID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgc3RhdHM7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0c3RhdHMgPSBNZXRlb3IuY2FsbCgnZ2V0U3RhdGlzdGljcycsIHJlZnJlc2gpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c3RhdGlzdGljczogc3RhdHNcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzdGF0aXN0aWNzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctc3RhdGlzdGljcycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgc3RhdGlzdGljcyA9IFJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MuZmluZChxdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRzdGF0aXN0aWNzLFxuXHRcdFx0Y291bnQ6IHN0YXRpc3RpY3MubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MuZmluZChxdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IEJ1c2JveSBmcm9tICdidXNib3knO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuY3JlYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0ZW1haWw6IFN0cmluZyxcblx0XHRcdG5hbWU6IFN0cmluZyxcblx0XHRcdHBhc3N3b3JkOiBTdHJpbmcsXG5cdFx0XHR1c2VybmFtZTogU3RyaW5nLFxuXHRcdFx0YWN0aXZlOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHJvbGVzOiBNYXRjaC5NYXliZShBcnJheSksXG5cdFx0XHRqb2luRGVmYXVsdENoYW5uZWxzOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHJlcXVpcmVQYXNzd29yZENoYW5nZTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRzZW5kV2VsY29tZUVtYWlsOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHZlcmlmaWVkOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdGN1c3RvbUZpZWxkczogTWF0Y2guTWF5YmUoT2JqZWN0KVxuXHRcdH0pO1xuXG5cdFx0Ly9OZXcgY2hhbmdlIG1hZGUgYnkgcHVsbCByZXF1ZXN0ICM1MTUyXG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMuam9pbkRlZmF1bHRDaGFubmVscyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRoaXMuYm9keVBhcmFtcy5qb2luRGVmYXVsdENoYW5uZWxzID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcykge1xuXHRcdFx0Um9ja2V0Q2hhdC52YWxpZGF0ZUN1c3RvbUZpZWxkcyh0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKTtcblx0XHR9XG5cblx0XHRjb25zdCBuZXdVc2VySWQgPSBSb2NrZXRDaGF0LnNhdmVVc2VyKHRoaXMudXNlcklkLCB0aGlzLmJvZHlQYXJhbXMpO1xuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpIHtcblx0XHRcdFJvY2tldENoYXQuc2F2ZUN1c3RvbUZpZWxkc1dpdGhvdXRWYWxpZGF0aW9uKG5ld1VzZXJJZCwgdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyk7XG5cdFx0fVxuXG5cblx0XHRpZiAodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5hY3RpdmUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRVc2VyQWN0aXZlU3RhdHVzJywgbmV3VXNlcklkLCB0aGlzLmJvZHlQYXJhbXMuYWN0aXZlKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgdXNlcjogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQobmV3VXNlcklkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KSB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5kZWxldGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdkZWxldGUtdXNlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdkZWxldGVVc2VyJywgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5nZXRBdmF0YXInLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdGNvbnN0IHVybCA9IFJvY2tldENoYXQuZ2V0VVJMKGAvYXZhdGFyLyR7IHVzZXIudXNlcm5hbWUgfWAsIHsgY2RuOiBmYWxzZSwgZnVsbDogdHJ1ZSB9KTtcblx0XHR0aGlzLnJlc3BvbnNlLnNldEhlYWRlcignTG9jYXRpb24nLCB1cmwpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0YXR1c0NvZGU6IDMwNyxcblx0XHRcdGJvZHk6IHVybFxuXHRcdH07XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuZ2V0UHJlc2VuY2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAodGhpcy5pc1VzZXJGcm9tUGFyYW1zKCkpIHtcblx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCk7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdHByZXNlbmNlOiB1c2VyLnN0YXR1cyxcblx0XHRcdFx0Y29ubmVjdGlvblN0YXR1czogdXNlci5zdGF0dXNDb25uZWN0aW9uLFxuXHRcdFx0XHRsYXN0TG9naW46IHVzZXIubGFzdExvZ2luXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0cHJlc2VuY2U6IHVzZXIuc3RhdHVzXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuaW5mbycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdHJlc3VsdCA9IE1ldGVvci5jYWxsKCdnZXRGdWxsVXNlckRhdGEnLCB7IGZpbHRlcjogdXNlci51c2VybmFtZSwgbGltaXQ6IDEgfSk7XG5cdFx0fSk7XG5cblx0XHRpZiAoIXJlc3VsdCB8fCByZXN1bHQubGVuZ3RoICE9PSAxKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgRmFpbGVkIHRvIGdldCB0aGUgdXNlciBkYXRhIGZvciB0aGUgdXNlcklkIG9mIFwiJHsgdXNlci5faWQgfVwiLmApO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHVzZXI6IHJlc3VsdFswXVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZC1yb29tJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCB1c2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQocXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB1c2VybmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHVzZXJzLFxuXHRcdFx0Y291bnQ6IHVzZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kKHF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMucmVnaXN0ZXInLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICh0aGlzLnVzZXJJZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0xvZ2dlZCBpbiB1c2VycyBjYW4gbm90IHJlZ2lzdGVyIGFnYWluLicpO1xuXHRcdH1cblxuXHRcdC8vV2Ugc2V0IHRoZWlyIHVzZXJuYW1lIGhlcmUsIHNvIHJlcXVpcmUgaXRcblx0XHQvL1RoZSBgcmVnaXN0ZXJVc2VyYCBjaGVja3MgZm9yIHRoZSBvdGhlciByZXF1aXJlbWVudHNcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR1c2VybmFtZTogU3RyaW5nXG5cdFx0fSkpO1xuXG5cdFx0Ly9SZWdpc3RlciB0aGUgdXNlclxuXHRcdGNvbnN0IHVzZXJJZCA9IE1ldGVvci5jYWxsKCdyZWdpc3RlclVzZXInLCB0aGlzLmJvZHlQYXJhbXMpO1xuXG5cdFx0Ly9Ob3cgc2V0IHRoZWlyIHVzZXJuYW1lXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzZXRVc2VybmFtZScsIHRoaXMuYm9keVBhcmFtcy51c2VybmFtZSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyB1c2VyOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pIH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnJlc2V0QXZhdGFyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRpZiAodXNlci5faWQgPT09IHRoaXMudXNlcklkKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgncmVzZXRBdmF0YXInKSk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdlZGl0LW90aGVyLXVzZXItaW5mbycpKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiBNZXRlb3IuY2FsbCgncmVzZXRBdmF0YXInKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnNldEF2YXRhcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRhdmF0YXJVcmw6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHR1c2VySWQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHR1c2VybmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGxldCB1c2VyO1xuXHRcdGlmICh0aGlzLmlzVXNlckZyb21QYXJhbXMoKSkge1xuXHRcdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHRoaXMudXNlcklkKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2VkaXQtb3RoZXItdXNlci1pbmZvJykpIHtcblx0XHRcdHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmF2YXRhclVybCkge1xuXHRcdFx0XHRSb2NrZXRDaGF0LnNldFVzZXJBdmF0YXIodXNlciwgdGhpcy5ib2R5UGFyYW1zLmF2YXRhclVybCwgJycsICd1cmwnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGJ1c2JveSA9IG5ldyBCdXNib3koeyBoZWFkZXJzOiB0aGlzLnJlcXVlc3QuaGVhZGVycyB9KTtcblxuXHRcdFx0XHRNZXRlb3Iud3JhcEFzeW5jKChjYWxsYmFjaykgPT4ge1xuXHRcdFx0XHRcdGJ1c2JveS5vbignZmlsZScsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGZpZWxkbmFtZSwgZmlsZSwgZmlsZW5hbWUsIGVuY29kaW5nLCBtaW1ldHlwZSkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGZpZWxkbmFtZSAhPT0gJ2ltYWdlJykge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWVsZCcpKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3QgaW1hZ2VEYXRhID0gW107XG5cdFx0XHRcdFx0XHRmaWxlLm9uKCdkYXRhJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZGF0YSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpbWFnZURhdGEucHVzaChkYXRhKTtcblx0XHRcdFx0XHRcdH0pKTtcblxuXHRcdFx0XHRcdFx0ZmlsZS5vbignZW5kJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2V0VXNlckF2YXRhcih1c2VyLCBCdWZmZXIuY29uY2F0KGltYWdlRGF0YSksIG1pbWV0eXBlLCAncmVzdCcpO1xuXHRcdFx0XHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHRcdHRoaXMucmVxdWVzdC5waXBlKGJ1c2JveSk7XG5cdFx0XHRcdH0pKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnVwZGF0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHVzZXJJZDogU3RyaW5nLFxuXHRcdFx0ZGF0YTogTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdFx0ZW1haWw6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdG5hbWU6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHBhc3N3b3JkOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHR1c2VybmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0YWN0aXZlOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0cm9sZXM6IE1hdGNoLk1heWJlKEFycmF5KSxcblx0XHRcdFx0am9pbkRlZmF1bHRDaGFubmVsczogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHJlcXVpcmVQYXNzd29yZENoYW5nZTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHNlbmRXZWxjb21lRW1haWw6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHR2ZXJpZmllZDogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGN1c3RvbUZpZWxkczogTWF0Y2guTWF5YmUoT2JqZWN0KVxuXHRcdFx0fSlcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJEYXRhID0gXy5leHRlbmQoeyBfaWQ6IHRoaXMuYm9keVBhcmFtcy51c2VySWQgfSwgdGhpcy5ib2R5UGFyYW1zLmRhdGEpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gUm9ja2V0Q2hhdC5zYXZlVXNlcih0aGlzLnVzZXJJZCwgdXNlckRhdGEpKTtcblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuZGF0YS5jdXN0b21GaWVsZHMpIHtcblx0XHRcdFJvY2tldENoYXQuc2F2ZUN1c3RvbUZpZWxkcyh0aGlzLmJvZHlQYXJhbXMudXNlcklkLCB0aGlzLmJvZHlQYXJhbXMuZGF0YS5jdXN0b21GaWVsZHMpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmRhdGEuYWN0aXZlICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRNZXRlb3IuY2FsbCgnc2V0VXNlckFjdGl2ZVN0YXR1cycsIHRoaXMuYm9keVBhcmFtcy51c2VySWQsIHRoaXMuYm9keVBhcmFtcy5kYXRhLmFjdGl2ZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXI6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy51c2VySWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pIH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnVwZGF0ZU93bkJhc2ljSW5mbycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdGRhdGE6IE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRcdGVtYWlsOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRuYW1lOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHR1c2VybmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0Y3VycmVudFBhc3N3b3JkOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRuZXdQYXNzd29yZDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdFx0fSksXG5cdFx0XHRjdXN0b21GaWVsZHM6IE1hdGNoLk1heWJlKE9iamVjdClcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJEYXRhID0ge1xuXHRcdFx0ZW1haWw6IHRoaXMuYm9keVBhcmFtcy5kYXRhLmVtYWlsLFxuXHRcdFx0cmVhbG5hbWU6IHRoaXMuYm9keVBhcmFtcy5kYXRhLm5hbWUsXG5cdFx0XHR1c2VybmFtZTogdGhpcy5ib2R5UGFyYW1zLmRhdGEudXNlcm5hbWUsXG5cdFx0XHRuZXdQYXNzd29yZDogdGhpcy5ib2R5UGFyYW1zLmRhdGEubmV3UGFzc3dvcmQsXG5cdFx0XHR0eXBlZFBhc3N3b3JkOiB0aGlzLmJvZHlQYXJhbXMuZGF0YS5jdXJyZW50UGFzc3dvcmRcblx0XHR9O1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3NhdmVVc2VyUHJvZmlsZScsIHVzZXJEYXRhLCB0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXI6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KSB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5jcmVhdGVUb2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXHRcdGxldCBkYXRhO1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdGRhdGEgPSBNZXRlb3IuY2FsbCgnY3JlYXRlVG9rZW4nLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGRhdGEgPyBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgZGF0YSB9KSA6IFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmdldFByZWZlcmVuY2VzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkKTtcblx0XHRpZiAodXNlci5zZXR0aW5ncykge1xuXHRcdFx0Y29uc3QgcHJlZmVyZW5jZXMgPSB1c2VyLnNldHRpbmdzLnByZWZlcmVuY2VzO1xuXHRcdFx0cHJlZmVyZW5jZXNbJ2xhbmd1YWdlJ10gPSB1c2VyLmxhbmd1YWdlO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdHByZWZlcmVuY2VzXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoVEFQaTE4bi5fXygnQWNjb3VudHNfRGVmYXVsdF9Vc2VyX1ByZWZlcmVuY2VzX25vdF9hdmFpbGFibGUnKS50b1VwcGVyQ2FzZSgpKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuc2V0UHJlZmVyZW5jZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCB7XG5cdFx0XHR1c2VySWQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRkYXRhOiBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0XHRuZXdSb29tTm90aWZpY2F0aW9uOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRuZXdNZXNzYWdlTm90aWZpY2F0aW9uOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHR1c2VFbW9qaXM6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRjb252ZXJ0QXNjaWlFbW9qaTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHNhdmVNb2JpbGVCYW5kd2lkdGg6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRjb2xsYXBzZU1lZGlhQnlEZWZhdWx0OiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0YXV0b0ltYWdlTG9hZDogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGVtYWlsTm90aWZpY2F0aW9uTW9kZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0dW5yZWFkQWxlcnQ6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRub3RpZmljYXRpb25zU291bmRWb2x1bWU6IE1hdGNoLk1heWJlKE51bWJlciksXG5cdFx0XHRcdGRlc2t0b3BOb3RpZmljYXRpb25zOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRtb2JpbGVOb3RpZmljYXRpb25zOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRlbmFibGVBdXRvQXdheTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGhpZ2hsaWdodHM6IE1hdGNoLk1heWJlKEFycmF5KSxcblx0XHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uOiBNYXRjaC5NYXliZShOdW1iZXIpLFxuXHRcdFx0XHRtZXNzYWdlVmlld01vZGU6IE1hdGNoLk1heWJlKE51bWJlciksXG5cdFx0XHRcdGhpZGVVc2VybmFtZXM6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRoaWRlUm9sZXM6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRoaWRlQXZhdGFyczogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGhpZGVGbGV4VGFiOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0c2VuZE9uRW50ZXI6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHJvb21Db3VudGVyU2lkZWJhcjogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGxhbmd1YWdlOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRzaWRlYmFyU2hvd0Zhdm9yaXRlczogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0XHRcdHNpZGViYXJTaG93VW5yZWFkOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcblx0XHRcdFx0c2lkZWJhclNvcnRieTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdFx0c2lkZWJhclZpZXdNb2RlOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0XHRzaWRlYmFySGlkZUF2YXRhcjogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0XHRcdHNpZGViYXJHcm91cEJ5VHlwZTogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0XHRcdG11dGVGb2N1c2VkQ29udmVyc2F0aW9uczogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbilcblx0XHRcdH0pXG5cdFx0fSk7XG5cblx0XHRsZXQgcHJlZmVyZW5jZXM7XG5cdFx0Y29uc3QgdXNlcklkID0gdGhpcy5ib2R5UGFyYW1zLnVzZXJJZCA/IHRoaXMuYm9keVBhcmFtcy51c2VySWQgOiB0aGlzLnVzZXJJZDtcblx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmRhdGEubGFuZ3VhZ2UpIHtcblx0XHRcdGNvbnN0IGxhbmd1YWdlID0gdGhpcy5ib2R5UGFyYW1zLmRhdGEubGFuZ3VhZ2U7XG5cdFx0XHRkZWxldGUgdGhpcy5ib2R5UGFyYW1zLmRhdGEubGFuZ3VhZ2U7XG5cdFx0XHRwcmVmZXJlbmNlcyA9IF8uZXh0ZW5kKHsgX2lkOiB1c2VySWQsIHNldHRpbmdzOiB7IHByZWZlcmVuY2VzOiB0aGlzLmJvZHlQYXJhbXMuZGF0YSB9LCBsYW5ndWFnZSB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cHJlZmVyZW5jZXMgPSBfLmV4dGVuZCh7IF9pZDogdXNlcklkLCBzZXR0aW5nczogeyBwcmVmZXJlbmNlczogdGhpcy5ib2R5UGFyYW1zLmRhdGEgfSB9KTtcblx0XHR9XG5cblx0XHQvLyBLZWVwIGNvbXBhdGliaWxpdHkgd2l0aCBvbGQgdmFsdWVzXG5cdFx0aWYgKHByZWZlcmVuY2VzLmVtYWlsTm90aWZpY2F0aW9uTW9kZSA9PT0gJ2FsbCcpIHtcblx0XHRcdHByZWZlcmVuY2VzLmVtYWlsTm90aWZpY2F0aW9uTW9kZSA9ICdtZW50aW9ucyc7XG5cdFx0fSBlbHNlIGlmIChwcmVmZXJlbmNlcy5lbWFpbE5vdGlmaWNhdGlvbk1vZGUgPT09ICdkaXNhYmxlZCcpIHtcblx0XHRcdHByZWZlcmVuY2VzLmVtYWlsTm90aWZpY2F0aW9uTW9kZSA9ICdub3RoaW5nJztcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBSb2NrZXRDaGF0LnNhdmVVc2VyKHRoaXMudXNlcklkLCBwcmVmZXJlbmNlcykpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyB1c2VyOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMudXNlcklkLCB7IGZpZWxkczogcHJlZmVyZW5jZXMgfSkgfSk7XG5cdH1cbn0pO1xuXG4vKipcbiBERVBSRUNBVEVEXG4gLy8gVE9ETzogUmVtb3ZlIHRoaXMgYWZ0ZXIgdGhyZWUgdmVyc2lvbnMgaGF2ZSBiZWVuIHJlbGVhc2VkLiBUaGF0IG1lYW5zIGF0IDAuNjYgdGhpcyBzaG91bGQgYmUgZ29uZS5cbiBUaGlzIEFQSSByZXR1cm5zIHRoZSBsb2dnZWQgdXNlciByb2xlcy5cblxuIE1ldGhvZDogR0VUXG4gUm91dGU6IGFwaS92MS91c2VyLnJvbGVzXG4gKi9cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2VyLnJvbGVzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0bGV0IGN1cnJlbnRVc2VyUm9sZXMgPSB7fTtcblxuXHRcdGNvbnN0IHJlc3VsdCA9IE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdnZXRVc2VyUm9sZXMnKSk7XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpICYmIHJlc3VsdC5sZW5ndGggPiAwKSB7XG5cdFx0XHRjdXJyZW50VXNlclJvbGVzID0gcmVzdWx0WzBdO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHRoaXMuZGVwcmVjYXRpb25XYXJuaW5nKHtcblx0XHRcdGVuZHBvaW50OiAndXNlci5yb2xlcycsXG5cdFx0XHR2ZXJzaW9uV2lsbEJlUmVtb3ZlOiAndjAuNjYnLFxuXHRcdFx0cmVzcG9uc2U6IGN1cnJlbnRVc2VyUm9sZXNcblx0XHR9KSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuZm9yZ290UGFzc3dvcmQnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHsgZW1haWwgfSA9IHRoaXMuYm9keVBhcmFtcztcblx0XHRpZiAoIWVtYWlsKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIFxcJ2VtYWlsXFwnIHBhcmFtIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZW1haWxTZW50ID0gTWV0ZW9yLmNhbGwoJ3NlbmRGb3Jnb3RQYXNzd29yZEVtYWlsJywgZW1haWwpO1xuXHRcdGlmIChlbWFpbFNlbnQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdFx0fVxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdVc2VyIG5vdCBmb3VuZCcpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmdldFVzZXJuYW1lU3VnZ2VzdGlvbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdnZXRVc2VybmFtZVN1Z2dlc3Rpb24nKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHJlc3VsdCB9KTtcblx0fVxufSk7XG4iXX0=
