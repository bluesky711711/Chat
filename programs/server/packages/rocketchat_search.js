(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var FlowRouter = Package['kadira:flow-router'].FlowRouter;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var payload;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:search":{"server":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/index.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  searchProviderService: () => searchProviderService,
  SearchProvider: () => SearchProvider
});
module.watch(require("./model/provider"));
module.watch(require("./service/providerService.js"));
module.watch(require("./service/validationService.js"));
module.watch(require("./events/events.js"));
module.watch(require("./provider/defaultProvider.js"));
let searchProviderService;
module.watch(require("./service/providerService"), {
  searchProviderService(v) {
    searchProviderService = v;
  }

}, 0);
let SearchProvider;
module.watch(require("./model/provider"), {
  default(v) {
    SearchProvider = v;
  }

}, 1);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"events":{"events.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/events/events.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let searchProviderService;
module.watch(require("../service/providerService"), {
  searchProviderService(v) {
    searchProviderService = v;
  }

}, 0);
let SearchLogger;
module.watch(require("../logger/logger"), {
  default(v) {
    SearchLogger = v;
  }

}, 1);

class EventService {
  /*eslint no-unused-vars: [2, { "args": "none" }]*/
  _pushError(name, value, payload) {
    //TODO implement a (performant) cache
    SearchLogger.debug(`Error on event '${name}' with id '${value}'`);
  }

  promoteEvent(name, value, payload) {
    if (!(searchProviderService.activeProvider && searchProviderService.activeProvider.on(name, value, payload))) {
      this._pushError(name, value, payload);
    }
  }

}

const eventService = new EventService();
/**
 * Listen to message changes via Hooks
 */

RocketChat.callbacks.add('afterSaveMessage', function (m) {
  eventService.promoteEvent('message.save', m._id, m);
});
RocketChat.callbacks.add('afterDeleteMessage', function (m) {
  eventService.promoteEvent('message.delete', m._id);
});
/**
 * Listen to user and room changes via cursor
 */

RocketChat.models.Users.on('changed', (type, user) => {
  if (type === 'inserted' || type === 'updated') {
    eventService.promoteEvent('user.save', user._id, user);
  }

  if (type === 'removed') {
    eventService.promoteEvent('user.delete', user._id);
  }
});
RocketChat.models.Rooms.on('changed', (type, room) => {
  if (type === 'inserted' || type === 'updated') {
    eventService.promoteEvent('room.save', room._id, room);
  }

  if (type === 'removed') {
    eventService.promoteEvent('room.delete', room._id);
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"logger":{"logger.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/logger/logger.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const SearchLogger = new Logger('Search Logger', {});
module.exportDefault(SearchLogger);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"model":{"provider.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/model/provider.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => SearchProvider
});
let SearchLogger;
module.watch(require("../logger/logger"), {
  default(v) {
    SearchLogger = v;
  }

}, 0);

/**
 * Setting Object in order to manage settings loading for providers and admin ui display
 */
class Setting {
  constructor(basekey, key, type, defaultValue, options = {}) {
    this._basekey = basekey;
    this.key = key;
    this.type = type;
    this.defaultValue = defaultValue;
    this.options = options;
    this._value = undefined;
  }

  get value() {
    return this._value;
  }
  /**
   * Id is generated based on baseKey and key
   * @returns {string}
   */


  get id() {
    return `Search.${this._basekey}.${this.key}`;
  }

  load() {
    this._value = RocketChat.settings.get(this.id);

    if (this._value === undefined) {
      this._value = this.defaultValue;
    }
  }

}
/**
 * Settings Object allows to manage Setting Objects
 */


class Settings {
  constructor(basekey) {
    this.basekey = basekey;
    this.settings = {};
  }

  add(key, type, defaultValue, options) {
    this.settings[key] = new Setting(this.basekey, key, type, defaultValue, options);
  }

  list() {
    return Object.keys(this.settings).map(key => this.settings[key]);
  }

  map() {
    return this.settings;
  }
  /**
   * return the value for key
   * @param key
   */


  get(key) {
    if (!this.settings[key]) {
      throw new Error('Setting is not set');
    }

    return this.settings[key].value;
  }
  /**
   * load currently stored values of all settings
   */


  load() {
    Object.keys(this.settings).forEach(key => {
      this.settings[key].load();
    });
  }

}

class SearchProvider {
  /**
   * Create search provider, key must match /^[a-z0-9]+$/
   * @param key
   */
  constructor(key) {
    if (!key.match(/^[A-z0-9]+$/)) {
      throw new Error(`cannot instantiate provider: ${key} does not match key-pattern`);
    }

    SearchLogger.info(`create search provider ${key}`);
    this._key = key;
    this._settings = new Settings(key);
  }
  /*--- basic params ---*/


  get key() {
    return this._key;
  }

  get i18nLabel() {
    return undefined;
  }

  get i18nDescription() {
    return undefined;
  }

  get iconName() {
    return 'magnifier';
  }

  get settings() {
    return this._settings.list();
  }

  get settingsAsMap() {
    return this._settings.map();
  }
  /*--- templates ---*/


  get resultTemplate() {
    return 'DefaultSearchResultTemplate';
  }

  get suggestionItemTemplate() {
    return 'DefaultSuggestionItemTemplate';
  }
  /*--- search functions ---*/

  /**
   * Search using the current search provider and check if results are valid for the user. The search result has
   * the format {messages:{start:0,numFound:1,docs:[{...}]},users:{...},rooms:{...}}
   * @param text the search text
   * @param context the context (uid, rid)
   * @param payload custom payload (e.g. for paging)
   * @param callback is used to return result an can be called with (error,result)
   */


  search(text, context, payload, callback) {
    throw new Error('Function search has to be implemented');
  }
  /**
   * Returns an ordered list of suggestions. The result should have at least the form [{text:string}]
   * @param text
   * @param context
   * @param payload
   * @param callback
   */


  suggest(text, context, payload, callback) {
    callback(null, []);
  }

  get supportsSuggestions() {
    return false;
  }
  /*--- triggers ---*/


  on(name, value) {
    return true;
  }
  /*--- livecycle ---*/


  run(reason, callback) {
    return new Promise((resolve, reject) => {
      this._settings.load();

      this.start(reason, resolve, reject);
    });
  }

  start(reason, resolve) {
    resolve();
  }

  stop(resolve) {
    resolve();
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"provider":{"defaultProvider.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/provider/defaultProvider.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let searchProviderService;
module.watch(require("../service/providerService"), {
  searchProviderService(v) {
    searchProviderService = v;
  }

}, 0);
let SearchProvider;
module.watch(require("../model/provider"), {
  default(v) {
    SearchProvider = v;
  }

}, 1);

/**
 * Implements the default provider (based on mongo db search)
 */
class DefaultProvider extends SearchProvider {
  /**
   * Enable settings: GlobalSearchEnabled, PageSize
   */
  constructor() {
    super('defaultProvider');

    this._settings.add('GlobalSearchEnabled', 'boolean', false, {
      i18nLabel: 'Global_Search',
      alert: 'This feature is currently in beta and could decrease the application performance! Please report bugs to github.com/RocketChat/Rocket.Chat/issues'
    });

    this._settings.add('PageSize', 'int', 10, {
      i18nLabel: 'Search_Page_Size'
    });
  }

  get i18nLabel() {
    return 'Default provider';
  }

  get i18nDescription() {
    return 'You_can_search_using_RegExp_eg';
  }
  /**
   * {@inheritDoc}
   * Uses Meteor function 'messageSearch'
   */


  search(text, context, payload = {}, callback) {
    const _rid = payload.searchAll ? undefined : context.rid;

    const _limit = payload.limit || this._settings.get('PageSize');

    Meteor.call('messageSearch', text, _rid, _limit, callback);
  }

} //register provider


searchProviderService.register(new DefaultProvider());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"service":{"providerService.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/service/providerService.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  searchProviderService: () => searchProviderService
});

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let validationService;
module.watch(require("../service/validationService"), {
  validationService(v) {
    validationService = v;
  }

}, 1);
let SearchLogger;
module.watch(require("../logger/logger"), {
  default(v) {
    SearchLogger = v;
  }

}, 2);

class SearchProviderService {
  constructor() {
    this.providers = {};
    this.activeProvider = undefined;
  }
  /**
   * Stop current provider (if there is one) and start the new
   * @param id the id of the provider which should be started
   * @param cb a possible callback if provider is active or not (currently not in use)
   */


  use(id) {
    return new Promise((resolve, reject) => {
      if (!this.providers[id]) {
        throw new Error(`provider ${id} cannot be found`);
      }

      let reason = 'switch';

      if (!this.activeProvider) {
        reason = 'startup';
      } else if (this.activeProvider.key === this.providers[id].key) {
        reason = 'update';
      }

      const stopProvider = () => {
        return new Promise((resolve, reject) => {
          if (this.activeProvider) {
            SearchLogger.debug(`Stopping provider '${this.activeProvider.key}'`);
            this.activeProvider.stop(resolve, reject);
          } else {
            resolve();
          }
        });
      };

      stopProvider().then(() => {
        this.activeProvider = undefined;
        SearchLogger.debug(`Start provider '${id}'`);

        try {
          this.providers[id].run(reason).then(() => {
            this.activeProvider = this.providers[id];
            resolve();
          }, reject);
        } catch (e) {
          reject(e);
        }
      }, reject);
    });
  }
  /**
   * Registers a search provider on system startup
   * @param provider
   */


  register(provider) {
    this.providers[provider.key] = provider;
  }
  /**
   * Starts the service (loads provider settings for admin ui, add lister not setting changes, enable current provider
   */


  start() {
    SearchLogger.debug('Load data for all providers');
    const providers = this.providers; //add settings for admininistration

    RocketChat.settings.addGroup('Search', function () {
      const self = this;
      self.add('Search.Provider', 'defaultProvider', {
        type: 'select',
        values: Object.keys(providers).map(key => {
          return {
            key,
            i18nLabel: providers[key].i18nLabel
          };
        }),
        public: true,
        i18nLabel: 'Search_Provider'
      });
      Object.keys(providers).filter(key => providers[key].settings && providers[key].settings.length > 0).forEach(function (key) {
        self.section(providers[key].i18nLabel, function () {
          providers[key].settings.forEach(setting => {
            const _options = (0, _objectSpread2.default)({
              type: setting.type
            }, setting.options);

            _options.enableQuery = _options.enableQuery || [];

            _options.enableQuery.push({
              _id: 'Search.Provider',
              value: key
            });

            this.add(setting.id, setting.defaultValue, _options);
          });
        });
      });
    }); //add listener to react on setting changes

    const configProvider = _.debounce(Meteor.bindEnvironment(() => {
      const providerId = RocketChat.settings.get('Search.Provider');

      if (providerId) {
        this.use(providerId); //TODO do something with success and errors
      }
    }), 1000);

    RocketChat.settings.get(/^Search\./, configProvider);
  }

}

const searchProviderService = new SearchProviderService();
Meteor.startup(() => {
  searchProviderService.start();
});
Meteor.methods({
  /**
   * Search using the current search provider and check if results are valid for the user. The search result has
   * the format {messages:{start:0,numFound:1,docs:[{...}]},users:{...},rooms:{...}}
   * @param text the search text
   * @param context the context (uid, rid)
   * @param payload custom payload (e.g. for paging)
   * @returns {*}
   */
  'rocketchatSearch.search'(text, context, payload) {
    return new Promise((resolve, reject) => {
      payload = payload !== null ? payload : undefined; //TODO is this cleanup necessary?

      try {
        if (!searchProviderService.activeProvider) {
          throw new Error('Provider currently not active');
        }

        SearchLogger.debug('search: ', `\n\tText:${text}\n\tContext:${JSON.stringify(context)}\n\tPayload:${JSON.stringify(payload)}`);
        searchProviderService.activeProvider.search(text, context, payload, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(validationService.validateSearchResult(data));
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  'rocketchatSearch.suggest'(text, context, payload) {
    return new Promise((resolve, reject) => {
      payload = payload !== null ? payload : undefined; //TODO is this cleanup necessary?

      try {
        if (!searchProviderService.activeProvider) {
          throw new Error('Provider currently not active');
        }

        SearchLogger.debug('suggest: ', `\n\tText:${text}\n\tContext:${JSON.stringify(context)}\n\tPayload:${JSON.stringify(payload)}`);
        searchProviderService.activeProvider.suggest(text, context, payload, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Get the current provider with key, description, resultTemplate, suggestionItemTemplate and settings (as Map)
   * @returns {*}
   */
  'rocketchatSearch.getProvider'() {
    if (!searchProviderService.activeProvider) {
      return undefined;
    }

    return {
      key: searchProviderService.activeProvider.key,
      description: searchProviderService.activeProvider.i18nDescription,
      icon: searchProviderService.activeProvider.iconName,
      resultTemplate: searchProviderService.activeProvider.resultTemplate,
      supportsSuggestions: searchProviderService.activeProvider.supportsSuggestions,
      suggestionItemTemplate: searchProviderService.activeProvider.suggestionItemTemplate,
      settings: _.mapObject(searchProviderService.activeProvider.settingsAsMap, setting => {
        return setting.value;
      })
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validationService.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/service/validationService.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  validationService: () => validationService
});
let SearchLogger;
module.watch(require("../logger/logger"), {
  default(v) {
    SearchLogger = v;
  }

}, 0);

class ValidationService {
  constructor() {}

  validateSearchResult(result) {
    const subscriptionCache = {};

    const getSubscription = (rid, uid) => {
      if (!subscriptionCache.hasOwnProperty(rid)) {
        subscriptionCache[rid] = Meteor.call('canAccessRoom', rid, uid);
      }

      return subscriptionCache[rid];
    };

    const userCache = {};

    const getUsername = uid => {
      if (!userCache.hasOwnProperty(uid)) {
        try {
          userCache[uid] = RocketChat.models.Users.findById(uid).fetch()[0].username;
        } catch (e) {
          userCache[uid] = undefined;
        }
      }

      return userCache[uid];
    };

    const uid = Meteor.userId(); //get subscription for message

    if (result.message) {
      result.message.docs.forEach(msg => {
        const subscription = getSubscription(msg.rid, uid);

        if (subscription) {
          msg.r = {
            name: subscription.name,
            t: subscription.t
          };
          msg.username = getUsername(msg.user);
          msg.valid = true;
          SearchLogger.debug(`user ${uid} can access ${msg.rid} ( ${subscription.t === 'd' ? subscription.username : subscription.name} )`);
        } else {
          SearchLogger.debug(`user ${uid} can NOT access ${msg.rid}`);
        }
      });
      result.message.docs.filter(msg => {
        return msg.valid;
      });
    }

    if (result.room) {
      result.room.docs.forEach(room => {
        const subscription = getSubscription(room._id, uid);

        if (subscription) {
          room.valid = true;
          SearchLogger.debug(`user ${uid} can access ${room._id} ( ${subscription.t === 'd' ? subscription.username : subscription.name} )`);
        } else {
          SearchLogger.debug(`user ${uid} can NOT access ${room._id}`);
        }
      });
      result.room.docs.filter(room => {
        return room.valid;
      });
    }

    return result;
  }

}

const validationService = new ValidationService();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:search/server/index.js");

/* Exports */
Package._define("rocketchat:search", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_search.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZWFyY2gvc2VydmVyL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNlYXJjaC9zZXJ2ZXIvZXZlbnRzL2V2ZW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZWFyY2gvc2VydmVyL2xvZ2dlci9sb2dnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2VhcmNoL3NlcnZlci9tb2RlbC9wcm92aWRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZWFyY2gvc2VydmVyL3Byb3ZpZGVyL2RlZmF1bHRQcm92aWRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZWFyY2gvc2VydmVyL3NlcnZpY2UvcHJvdmlkZXJTZXJ2aWNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNlYXJjaC9zZXJ2ZXIvc2VydmljZS92YWxpZGF0aW9uU2VydmljZS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJzZWFyY2hQcm92aWRlclNlcnZpY2UiLCJTZWFyY2hQcm92aWRlciIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJkZWZhdWx0IiwiU2VhcmNoTG9nZ2VyIiwiRXZlbnRTZXJ2aWNlIiwiX3B1c2hFcnJvciIsIm5hbWUiLCJ2YWx1ZSIsInBheWxvYWQiLCJkZWJ1ZyIsInByb21vdGVFdmVudCIsImFjdGl2ZVByb3ZpZGVyIiwib24iLCJldmVudFNlcnZpY2UiLCJSb2NrZXRDaGF0IiwiY2FsbGJhY2tzIiwiYWRkIiwibSIsIl9pZCIsIm1vZGVscyIsIlVzZXJzIiwidHlwZSIsInVzZXIiLCJSb29tcyIsInJvb20iLCJMb2dnZXIiLCJleHBvcnREZWZhdWx0IiwiU2V0dGluZyIsImNvbnN0cnVjdG9yIiwiYmFzZWtleSIsImtleSIsImRlZmF1bHRWYWx1ZSIsIm9wdGlvbnMiLCJfYmFzZWtleSIsIl92YWx1ZSIsInVuZGVmaW5lZCIsImlkIiwibG9hZCIsInNldHRpbmdzIiwiZ2V0IiwiU2V0dGluZ3MiLCJsaXN0IiwiT2JqZWN0Iiwia2V5cyIsIm1hcCIsIkVycm9yIiwiZm9yRWFjaCIsIm1hdGNoIiwiaW5mbyIsIl9rZXkiLCJfc2V0dGluZ3MiLCJpMThuTGFiZWwiLCJpMThuRGVzY3JpcHRpb24iLCJpY29uTmFtZSIsInNldHRpbmdzQXNNYXAiLCJyZXN1bHRUZW1wbGF0ZSIsInN1Z2dlc3Rpb25JdGVtVGVtcGxhdGUiLCJzZWFyY2giLCJ0ZXh0IiwiY29udGV4dCIsImNhbGxiYWNrIiwic3VnZ2VzdCIsInN1cHBvcnRzU3VnZ2VzdGlvbnMiLCJydW4iLCJyZWFzb24iLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInN0YXJ0Iiwic3RvcCIsIkRlZmF1bHRQcm92aWRlciIsImFsZXJ0IiwiX3JpZCIsInNlYXJjaEFsbCIsInJpZCIsIl9saW1pdCIsImxpbWl0IiwiTWV0ZW9yIiwiY2FsbCIsInJlZ2lzdGVyIiwiXyIsInZhbGlkYXRpb25TZXJ2aWNlIiwiU2VhcmNoUHJvdmlkZXJTZXJ2aWNlIiwicHJvdmlkZXJzIiwidXNlIiwic3RvcFByb3ZpZGVyIiwidGhlbiIsImUiLCJwcm92aWRlciIsImFkZEdyb3VwIiwic2VsZiIsInZhbHVlcyIsInB1YmxpYyIsImZpbHRlciIsImxlbmd0aCIsInNlY3Rpb24iLCJzZXR0aW5nIiwiX29wdGlvbnMiLCJlbmFibGVRdWVyeSIsInB1c2giLCJjb25maWdQcm92aWRlciIsImRlYm91bmNlIiwiYmluZEVudmlyb25tZW50IiwicHJvdmlkZXJJZCIsInN0YXJ0dXAiLCJtZXRob2RzIiwiSlNPTiIsInN0cmluZ2lmeSIsImVycm9yIiwiZGF0YSIsInZhbGlkYXRlU2VhcmNoUmVzdWx0IiwiZGVzY3JpcHRpb24iLCJpY29uIiwibWFwT2JqZWN0IiwiVmFsaWRhdGlvblNlcnZpY2UiLCJyZXN1bHQiLCJzdWJzY3JpcHRpb25DYWNoZSIsImdldFN1YnNjcmlwdGlvbiIsInVpZCIsImhhc093blByb3BlcnR5IiwidXNlckNhY2hlIiwiZ2V0VXNlcm5hbWUiLCJmaW5kQnlJZCIsImZldGNoIiwidXNlcm5hbWUiLCJ1c2VySWQiLCJtZXNzYWdlIiwiZG9jcyIsIm1zZyIsInN1YnNjcmlwdGlvbiIsInIiLCJ0IiwidmFsaWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyx5QkFBc0IsTUFBSUEscUJBQTNCO0FBQWlEQyxrQkFBZSxNQUFJQTtBQUFwRSxDQUFkO0FBQW1HSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsa0JBQVIsQ0FBYjtBQUEwQ0wsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDhCQUFSLENBQWI7QUFBc0RMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxnQ0FBUixDQUFiO0FBQXdETCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsb0JBQVIsQ0FBYjtBQUE0Q0wsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLCtCQUFSLENBQWI7QUFBdUQsSUFBSUgscUJBQUo7QUFBMEJGLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSwyQkFBUixDQUFiLEVBQWtEO0FBQUNILHdCQUFzQkksQ0FBdEIsRUFBd0I7QUFBQ0osNEJBQXNCSSxDQUF0QjtBQUF3Qjs7QUFBbEQsQ0FBbEQsRUFBc0csQ0FBdEc7QUFBeUcsSUFBSUgsY0FBSjtBQUFtQkgsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGtCQUFSLENBQWIsRUFBeUM7QUFBQ0UsVUFBUUQsQ0FBUixFQUFVO0FBQUNILHFCQUFlRyxDQUFmO0FBQWlCOztBQUE3QixDQUF6QyxFQUF3RSxDQUF4RSxFOzs7Ozs7Ozs7OztBQ0FwZixJQUFJSixxQkFBSjtBQUEwQkYsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ0gsd0JBQXNCSSxDQUF0QixF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QWFNLEtBQWIsQ0FBb0IsUUFBUTZHLEdBQUssbUJBQW1COUYsS0FBS04sR0FBSyxFQUE5RDtBQUNBO0FBQ0QsT0FSRDtBQVVBaUcsYUFBTzNGLElBQVAsQ0FBWXVHLElBQVosQ0FBaUJsQyxNQUFqQixDQUF5QnJFLElBQUQsSUFBVTtBQUNqQyxlQUFPQSxLQUFLNEcsS0FBWjtBQUNBLE9BRkQ7QUFHQTs7QUFFRCxXQUFPakIsTUFBUDtBQUNBOztBQW5Fc0I7O0FBc0VqQixNQUFNbEMsb0JBQW9CLElBQUlpQyxpQkFBSixFQUExQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NlYXJjaC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnLi9tb2RlbC9wcm92aWRlcic7XG5pbXBvcnQgJy4vc2VydmljZS9wcm92aWRlclNlcnZpY2UuanMnO1xuaW1wb3J0ICcuL3NlcnZpY2UvdmFsaWRhdGlvblNlcnZpY2UuanMnO1xuaW1wb3J0ICcuL2V2ZW50cy9ldmVudHMuanMnO1xuaW1wb3J0ICcuL3Byb3ZpZGVyL2RlZmF1bHRQcm92aWRlci5qcyc7XG5cbmltcG9ydCB7c2VhcmNoUHJvdmlkZXJTZXJ2aWNlfSBmcm9tICcuL3NlcnZpY2UvcHJvdmlkZXJTZXJ2aWNlJztcbmltcG9ydCBTZWFyY2hQcm92aWRlciBmcm9tICcuL21vZGVsL3Byb3ZpZGVyJztcblxuZXhwb3J0IHtcblx0c2VhcmNoUHJvdmlkZXJTZXJ2aWNlLFxuXHRTZWFyY2hQcm92aWRlclxufTtcbiIsImltcG9ydCB7c2VhcmNoUHJvdmlkZXJTZXJ2aWNlfSBmcm9tICcuLi9zZXJ2aWNlL3Byb3ZpZGVyU2VydmljZSc7XG5pbXBvcnQgU2VhcmNoTG9nZ2VyIGZyb20gJy4uL2xvZ2dlci9sb2dnZXInO1xuXG5jbGFzcyBFdmVudFNlcnZpY2Uge1xuXG5cdC8qZXNsaW50IG5vLXVudXNlZC12YXJzOiBbMiwgeyBcImFyZ3NcIjogXCJub25lXCIgfV0qL1xuXHRfcHVzaEVycm9yKG5hbWUsIHZhbHVlLCBwYXlsb2FkKSB7XG5cdFx0Ly9UT0RPIGltcGxlbWVudCBhIChwZXJmb3JtYW50KSBjYWNoZVxuXHRcdFNlYXJjaExvZ2dlci5kZWJ1ZyhgRXJyb3Igb24gZXZlbnQgJyR7IG5hbWUgfScgd2l0aCBpZCAnJHsgdmFsdWUgfSdgKTtcblx0fVxuXG5cdHByb21vdGVFdmVudChuYW1lLCB2YWx1ZSwgcGF5bG9hZCkge1xuXHRcdGlmICghKHNlYXJjaFByb3ZpZGVyU2VydmljZS5hY3RpdmVQcm92aWRlciAmJiBzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIub24obmFtZSwgdmFsdWUsIHBheWxvYWQpKSkge1xuXHRcdFx0dGhpcy5fcHVzaEVycm9yKG5hbWUsIHZhbHVlLCBwYXlsb2FkKTtcblx0XHR9XG5cdH1cbn1cblxuY29uc3QgZXZlbnRTZXJ2aWNlID0gbmV3IEV2ZW50U2VydmljZSgpO1xuXG4vKipcbiAqIExpc3RlbiB0byBtZXNzYWdlIGNoYW5nZXMgdmlhIEhvb2tzXG4gKi9cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG0pIHtcblx0ZXZlbnRTZXJ2aWNlLnByb21vdGVFdmVudCgnbWVzc2FnZS5zYXZlJywgbS5faWQsIG0pO1xufSk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJEZWxldGVNZXNzYWdlJywgZnVuY3Rpb24obSkge1xuXHRldmVudFNlcnZpY2UucHJvbW90ZUV2ZW50KCdtZXNzYWdlLmRlbGV0ZScsIG0uX2lkKTtcbn0pO1xuXG4vKipcbiAqIExpc3RlbiB0byB1c2VyIGFuZCByb29tIGNoYW5nZXMgdmlhIGN1cnNvclxuICovXG5cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLm9uKCdjaGFuZ2VkJywgKHR5cGUsIHVzZXIpPT57XG5cdGlmICh0eXBlID09PSAnaW5zZXJ0ZWQnIHx8IHR5cGUgPT09ICd1cGRhdGVkJykge1xuXHRcdGV2ZW50U2VydmljZS5wcm9tb3RlRXZlbnQoJ3VzZXIuc2F2ZScsIHVzZXIuX2lkLCB1c2VyKTtcblx0fVxuXHRpZiAodHlwZSA9PT0gJ3JlbW92ZWQnKSB7XG5cdFx0ZXZlbnRTZXJ2aWNlLnByb21vdGVFdmVudCgndXNlci5kZWxldGUnLCB1c2VyLl9pZCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5vbignY2hhbmdlZCcsICh0eXBlLCByb29tKT0+e1xuXHRpZiAodHlwZSA9PT0gJ2luc2VydGVkJyB8fCB0eXBlID09PSAndXBkYXRlZCcpIHtcblx0XHRldmVudFNlcnZpY2UucHJvbW90ZUV2ZW50KCdyb29tLnNhdmUnLCByb29tLl9pZCwgcm9vbSk7XG5cdH1cblx0aWYgKHR5cGUgPT09ICdyZW1vdmVkJykge1xuXHRcdGV2ZW50U2VydmljZS5wcm9tb3RlRXZlbnQoJ3Jvb20uZGVsZXRlJywgcm9vbS5faWQpO1xuXHR9XG59KTtcbiIsImNvbnN0IFNlYXJjaExvZ2dlciA9IG5ldyBMb2dnZXIoJ1NlYXJjaCBMb2dnZXInLCB7fSk7XG5leHBvcnQgZGVmYXVsdCBTZWFyY2hMb2dnZXI7XG4iLCIvKmVzbGludCBuby11bnVzZWQtdmFyczogWzIsIHsgXCJhcmdzXCI6IFwibm9uZVwiIH1dKi9cbmltcG9ydCBTZWFyY2hMb2dnZXIgZnJvbSAnLi4vbG9nZ2VyL2xvZ2dlcic7XG5cbi8qKlxuICogU2V0dGluZyBPYmplY3QgaW4gb3JkZXIgdG8gbWFuYWdlIHNldHRpbmdzIGxvYWRpbmcgZm9yIHByb3ZpZGVycyBhbmQgYWRtaW4gdWkgZGlzcGxheVxuICovXG5jbGFzcyBTZXR0aW5nIHtcblx0Y29uc3RydWN0b3IoYmFzZWtleSwga2V5LCB0eXBlLCBkZWZhdWx0VmFsdWUsIG9wdGlvbnMgPSB7fSkge1xuXHRcdHRoaXMuX2Jhc2VrZXkgPSBiYXNla2V5O1xuXHRcdHRoaXMua2V5ID0ga2V5O1xuXHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0dGhpcy5kZWZhdWx0VmFsdWUgPSBkZWZhdWx0VmFsdWU7XG5cdFx0dGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0XHR0aGlzLl92YWx1ZSA9IHVuZGVmaW5lZDtcblx0fVxuXG5cdGdldCB2YWx1ZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fdmFsdWU7XG5cdH1cblxuXHQvKipcblx0ICogSWQgaXMgZ2VuZXJhdGVkIGJhc2VkIG9uIGJhc2VLZXkgYW5kIGtleVxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHQgKi9cblx0Z2V0IGlkKCkge1xuXHRcdHJldHVybiBgU2VhcmNoLiR7IHRoaXMuX2Jhc2VrZXkgfS4keyB0aGlzLmtleSB9YDtcblx0fVxuXG5cdGxvYWQoKSB7XG5cdFx0dGhpcy5fdmFsdWUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCh0aGlzLmlkKTtcblxuXHRcdGlmICh0aGlzLl92YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHRoaXMuX3ZhbHVlID0gdGhpcy5kZWZhdWx0VmFsdWU7IH1cblx0fVxuXG59XG5cbi8qKlxuICogU2V0dGluZ3MgT2JqZWN0IGFsbG93cyB0byBtYW5hZ2UgU2V0dGluZyBPYmplY3RzXG4gKi9cbmNsYXNzIFNldHRpbmdzIHtcblx0Y29uc3RydWN0b3IoYmFzZWtleSkge1xuXHRcdHRoaXMuYmFzZWtleSA9IGJhc2VrZXk7XG5cdFx0dGhpcy5zZXR0aW5ncyA9IHt9O1xuXHR9XG5cblx0YWRkKGtleSwgdHlwZSwgZGVmYXVsdFZhbHVlLCBvcHRpb25zKSB7XG5cdFx0dGhpcy5zZXR0aW5nc1trZXldID0gbmV3IFNldHRpbmcodGhpcy5iYXNla2V5LCBrZXksIHR5cGUsIGRlZmF1bHRWYWx1ZSwgb3B0aW9ucyk7XG5cdH1cblxuXHRsaXN0KCkge1xuXHRcdHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnNldHRpbmdzKS5tYXAoa2V5ID0+IHRoaXMuc2V0dGluZ3Nba2V5XSk7XG5cdH1cblxuXHRtYXAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2V0dGluZ3M7XG5cdH1cblxuXHQvKipcblx0ICogcmV0dXJuIHRoZSB2YWx1ZSBmb3Iga2V5XG5cdCAqIEBwYXJhbSBrZXlcblx0ICovXG5cdGdldChrZXkpIHtcblx0XHRpZiAoIXRoaXMuc2V0dGluZ3Nba2V5XSkgeyB0aHJvdyBuZXcgRXJyb3IoJ1NldHRpbmcgaXMgbm90IHNldCcpOyB9XG5cdFx0cmV0dXJuIHRoaXMuc2V0dGluZ3Nba2V5XS52YWx1ZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBsb2FkIGN1cnJlbnRseSBzdG9yZWQgdmFsdWVzIG9mIGFsbCBzZXR0aW5nc1xuXHQgKi9cblx0bG9hZCgpIHtcblx0XHRPYmplY3Qua2V5cyh0aGlzLnNldHRpbmdzKS5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRcdHRoaXMuc2V0dGluZ3Nba2V5XS5sb2FkKCk7XG5cdFx0fSk7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VhcmNoUHJvdmlkZXIge1xuXG5cdC8qKlxuXHQgKiBDcmVhdGUgc2VhcmNoIHByb3ZpZGVyLCBrZXkgbXVzdCBtYXRjaCAvXlthLXowLTldKyQvXG5cdCAqIEBwYXJhbSBrZXlcblx0ICovXG5cdGNvbnN0cnVjdG9yKGtleSkge1xuXG5cdFx0aWYgKCFrZXkubWF0Y2goL15bQS16MC05XSskLykpIHsgdGhyb3cgbmV3IEVycm9yKGBjYW5ub3QgaW5zdGFudGlhdGUgcHJvdmlkZXI6ICR7IGtleSB9IGRvZXMgbm90IG1hdGNoIGtleS1wYXR0ZXJuYCk7IH1cblxuXHRcdFNlYXJjaExvZ2dlci5pbmZvKGBjcmVhdGUgc2VhcmNoIHByb3ZpZGVyICR7IGtleSB9YCk7XG5cblx0XHR0aGlzLl9rZXkgPSBrZXk7XG5cdFx0dGhpcy5fc2V0dGluZ3MgPSBuZXcgU2V0dGluZ3Moa2V5KTtcblx0fVxuXG5cdC8qLS0tIGJhc2ljIHBhcmFtcyAtLS0qL1xuXHRnZXQga2V5KCkge1xuXHRcdHJldHVybiB0aGlzLl9rZXk7XG5cdH1cblxuXHRnZXQgaTE4bkxhYmVsKCkge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblxuXHRnZXQgaTE4bkRlc2NyaXB0aW9uKCkge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblxuXHRnZXQgaWNvbk5hbWUoKSB7XG5cdFx0cmV0dXJuICdtYWduaWZpZXInO1xuXHR9XG5cblx0Z2V0IHNldHRpbmdzKCkge1xuXHRcdHJldHVybiB0aGlzLl9zZXR0aW5ncy5saXN0KCk7XG5cdH1cblxuXHRnZXQgc2V0dGluZ3NBc01hcCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fc2V0dGluZ3MubWFwKCk7XG5cdH1cblxuXHQvKi0tLSB0ZW1wbGF0ZXMgLS0tKi9cblx0Z2V0IHJlc3VsdFRlbXBsYXRlKCkge1xuXHRcdHJldHVybiAnRGVmYXVsdFNlYXJjaFJlc3VsdFRlbXBsYXRlJztcblx0fVxuXG5cdGdldCBzdWdnZXN0aW9uSXRlbVRlbXBsYXRlKCkge1xuXHRcdHJldHVybiAnRGVmYXVsdFN1Z2dlc3Rpb25JdGVtVGVtcGxhdGUnO1xuXHR9XG5cblx0LyotLS0gc2VhcmNoIGZ1bmN0aW9ucyAtLS0qL1xuXHQvKipcblx0ICogU2VhcmNoIHVzaW5nIHRoZSBjdXJyZW50IHNlYXJjaCBwcm92aWRlciBhbmQgY2hlY2sgaWYgcmVzdWx0cyBhcmUgdmFsaWQgZm9yIHRoZSB1c2VyLiBUaGUgc2VhcmNoIHJlc3VsdCBoYXNcblx0ICogdGhlIGZvcm1hdCB7bWVzc2FnZXM6e3N0YXJ0OjAsbnVtRm91bmQ6MSxkb2NzOlt7Li4ufV19LHVzZXJzOnsuLi59LHJvb21zOnsuLi59fVxuXHQgKiBAcGFyYW0gdGV4dCB0aGUgc2VhcmNoIHRleHRcblx0ICogQHBhcmFtIGNvbnRleHQgdGhlIGNvbnRleHQgKHVpZCwgcmlkKVxuXHQgKiBAcGFyYW0gcGF5bG9hZCBjdXN0b20gcGF5bG9hZCAoZS5nLiBmb3IgcGFnaW5nKVxuXHQgKiBAcGFyYW0gY2FsbGJhY2sgaXMgdXNlZCB0byByZXR1cm4gcmVzdWx0IGFuIGNhbiBiZSBjYWxsZWQgd2l0aCAoZXJyb3IscmVzdWx0KVxuXHQgKi9cblx0c2VhcmNoKHRleHQsIGNvbnRleHQsIHBheWxvYWQsIGNhbGxiYWNrKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdGdW5jdGlvbiBzZWFyY2ggaGFzIHRvIGJlIGltcGxlbWVudGVkJyk7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBhbiBvcmRlcmVkIGxpc3Qgb2Ygc3VnZ2VzdGlvbnMuIFRoZSByZXN1bHQgc2hvdWxkIGhhdmUgYXQgbGVhc3QgdGhlIGZvcm0gW3t0ZXh0OnN0cmluZ31dXG5cdCAqIEBwYXJhbSB0ZXh0XG5cdCAqIEBwYXJhbSBjb250ZXh0XG5cdCAqIEBwYXJhbSBwYXlsb2FkXG5cdCAqIEBwYXJhbSBjYWxsYmFja1xuXHQgKi9cblx0c3VnZ2VzdCh0ZXh0LCBjb250ZXh0LCBwYXlsb2FkLCBjYWxsYmFjaykge1xuXHRcdGNhbGxiYWNrKG51bGwsIFtdKTtcblx0fVxuXG5cdGdldCBzdXBwb3J0c1N1Z2dlc3Rpb25zKCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8qLS0tIHRyaWdnZXJzIC0tLSovXG5cdG9uKG5hbWUsIHZhbHVlKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvKi0tLSBsaXZlY3ljbGUgLS0tKi9cblx0cnVuKHJlYXNvbiwgY2FsbGJhY2spIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0dGhpcy5fc2V0dGluZ3MubG9hZCgpO1xuXHRcdFx0dGhpcy5zdGFydChyZWFzb24sIHJlc29sdmUsIHJlamVjdCk7XG5cdFx0fSk7XG5cdH1cblxuXHRzdGFydChyZWFzb24sIHJlc29sdmUpIHtcblx0XHRyZXNvbHZlKCk7XG5cdH1cblxuXHRzdG9wKHJlc29sdmUpIHtcblx0XHRyZXNvbHZlKCk7XG5cdH1cbn1cblxuIiwiaW1wb3J0IHtzZWFyY2hQcm92aWRlclNlcnZpY2V9IGZyb20gJy4uL3NlcnZpY2UvcHJvdmlkZXJTZXJ2aWNlJztcbmltcG9ydCBTZWFyY2hQcm92aWRlciBmcm9tICcuLi9tb2RlbC9wcm92aWRlcic7XG5cbi8qKlxuICogSW1wbGVtZW50cyB0aGUgZGVmYXVsdCBwcm92aWRlciAoYmFzZWQgb24gbW9uZ28gZGIgc2VhcmNoKVxuICovXG5jbGFzcyBEZWZhdWx0UHJvdmlkZXIgZXh0ZW5kcyBTZWFyY2hQcm92aWRlciB7XG5cblx0LyoqXG5cdCAqIEVuYWJsZSBzZXR0aW5nczogR2xvYmFsU2VhcmNoRW5hYmxlZCwgUGFnZVNpemVcblx0ICovXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdkZWZhdWx0UHJvdmlkZXInKTtcblx0XHR0aGlzLl9zZXR0aW5ncy5hZGQoJ0dsb2JhbFNlYXJjaEVuYWJsZWQnLCAnYm9vbGVhbicsIGZhbHNlLCB7XG5cdFx0XHRpMThuTGFiZWw6ICdHbG9iYWxfU2VhcmNoJyxcblx0XHRcdGFsZXJ0OiAnVGhpcyBmZWF0dXJlIGlzIGN1cnJlbnRseSBpbiBiZXRhIGFuZCBjb3VsZCBkZWNyZWFzZSB0aGUgYXBwbGljYXRpb24gcGVyZm9ybWFuY2UhIFBsZWFzZSByZXBvcnQgYnVncyB0byBnaXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvaXNzdWVzJ1xuXHRcdH0pO1xuXHRcdHRoaXMuX3NldHRpbmdzLmFkZCgnUGFnZVNpemUnLCAnaW50JywgMTAsIHtcblx0XHRcdGkxOG5MYWJlbDogJ1NlYXJjaF9QYWdlX1NpemUnXG5cdFx0fSk7XG5cdH1cblxuXHRnZXQgaTE4bkxhYmVsKCkge1xuXHRcdHJldHVybiAnRGVmYXVsdCBwcm92aWRlcic7XG5cdH1cblxuXHRnZXQgaTE4bkRlc2NyaXB0aW9uKCkge1xuXHRcdHJldHVybiAnWW91X2Nhbl9zZWFyY2hfdXNpbmdfUmVnRXhwX2VnJztcblx0fVxuXG5cdC8qKlxuXHQgKiB7QGluaGVyaXREb2N9XG5cdCAqIFVzZXMgTWV0ZW9yIGZ1bmN0aW9uICdtZXNzYWdlU2VhcmNoJ1xuXHQgKi9cblx0c2VhcmNoKHRleHQsIGNvbnRleHQsIHBheWxvYWQgPSB7fSwgY2FsbGJhY2spIHtcblxuXHRcdGNvbnN0IF9yaWQgPSBwYXlsb2FkLnNlYXJjaEFsbCA/IHVuZGVmaW5lZCA6IGNvbnRleHQucmlkO1xuXG5cdFx0Y29uc3QgX2xpbWl0ID0gcGF5bG9hZC5saW1pdCB8fCB0aGlzLl9zZXR0aW5ncy5nZXQoJ1BhZ2VTaXplJyk7XG5cblx0XHRNZXRlb3IuY2FsbCgnbWVzc2FnZVNlYXJjaCcsIHRleHQsIF9yaWQsIF9saW1pdCwgY2FsbGJhY2spO1xuXG5cdH1cbn1cblxuLy9yZWdpc3RlciBwcm92aWRlclxuc2VhcmNoUHJvdmlkZXJTZXJ2aWNlLnJlZ2lzdGVyKG5ldyBEZWZhdWx0UHJvdmlkZXIoKSk7XG4iLCIvKiBnbG9iYWxzIFJvY2tldENoYXQgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5pbXBvcnQge3ZhbGlkYXRpb25TZXJ2aWNlfSBmcm9tICcuLi9zZXJ2aWNlL3ZhbGlkYXRpb25TZXJ2aWNlJztcbmltcG9ydCBTZWFyY2hMb2dnZXIgZnJvbSAnLi4vbG9nZ2VyL2xvZ2dlcic7XG5cbmNsYXNzIFNlYXJjaFByb3ZpZGVyU2VydmljZSB7XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5wcm92aWRlcnMgPSB7fTtcblx0XHR0aGlzLmFjdGl2ZVByb3ZpZGVyID0gdW5kZWZpbmVkO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN0b3AgY3VycmVudCBwcm92aWRlciAoaWYgdGhlcmUgaXMgb25lKSBhbmQgc3RhcnQgdGhlIG5ld1xuXHQgKiBAcGFyYW0gaWQgdGhlIGlkIG9mIHRoZSBwcm92aWRlciB3aGljaCBzaG91bGQgYmUgc3RhcnRlZFxuXHQgKiBAcGFyYW0gY2IgYSBwb3NzaWJsZSBjYWxsYmFjayBpZiBwcm92aWRlciBpcyBhY3RpdmUgb3Igbm90IChjdXJyZW50bHkgbm90IGluIHVzZSlcblx0ICovXG5cdHVzZShpZCkge1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGlmICghdGhpcy5wcm92aWRlcnNbaWRdKSB7IHRocm93IG5ldyBFcnJvcihgcHJvdmlkZXIgJHsgaWQgfSBjYW5ub3QgYmUgZm91bmRgKTsgfVxuXG5cdFx0XHRsZXQgcmVhc29uID0gJ3N3aXRjaCc7XG5cblx0XHRcdGlmICghdGhpcy5hY3RpdmVQcm92aWRlcikge1xuXHRcdFx0XHRyZWFzb24gPSAnc3RhcnR1cCc7XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMuYWN0aXZlUHJvdmlkZXIua2V5ID09PSB0aGlzLnByb3ZpZGVyc1tpZF0ua2V5KSB7XG5cdFx0XHRcdHJlYXNvbiA9ICd1cGRhdGUnO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzdG9wUHJvdmlkZXIgPSAoKSA9PiB7XG5cdFx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdFx0aWYgKHRoaXMuYWN0aXZlUHJvdmlkZXIpIHtcblxuXHRcdFx0XHRcdFx0U2VhcmNoTG9nZ2VyLmRlYnVnKGBTdG9wcGluZyBwcm92aWRlciAnJHsgdGhpcy5hY3RpdmVQcm92aWRlci5rZXkgfSdgKTtcblxuXHRcdFx0XHRcdFx0dGhpcy5hY3RpdmVQcm92aWRlci5zdG9wKHJlc29sdmUsIHJlamVjdCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fTtcblxuXHRcdFx0c3RvcFByb3ZpZGVyKCkudGhlbigoKSA9PiB7XG5cdFx0XHRcdHRoaXMuYWN0aXZlUHJvdmlkZXIgPSB1bmRlZmluZWQ7XG5cblx0XHRcdFx0U2VhcmNoTG9nZ2VyLmRlYnVnKGBTdGFydCBwcm92aWRlciAnJHsgaWQgfSdgKTtcblxuXHRcdFx0XHR0cnkge1xuXG5cdFx0XHRcdFx0dGhpcy5wcm92aWRlcnNbaWRdLnJ1bihyZWFzb24pLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5hY3RpdmVQcm92aWRlciA9IHRoaXMucHJvdmlkZXJzW2lkXTtcblx0XHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHR9LCByZWplY3QpO1xuXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRyZWplY3QoZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0sIHJlamVjdCk7XG5cblx0XHR9KTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJlZ2lzdGVycyBhIHNlYXJjaCBwcm92aWRlciBvbiBzeXN0ZW0gc3RhcnR1cFxuXHQgKiBAcGFyYW0gcHJvdmlkZXJcblx0ICovXG5cdHJlZ2lzdGVyKHByb3ZpZGVyKSB7XG5cdFx0dGhpcy5wcm92aWRlcnNbcHJvdmlkZXIua2V5XSA9IHByb3ZpZGVyO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN0YXJ0cyB0aGUgc2VydmljZSAobG9hZHMgcHJvdmlkZXIgc2V0dGluZ3MgZm9yIGFkbWluIHVpLCBhZGQgbGlzdGVyIG5vdCBzZXR0aW5nIGNoYW5nZXMsIGVuYWJsZSBjdXJyZW50IHByb3ZpZGVyXG5cdCAqL1xuXHRzdGFydCgpIHtcblx0XHRTZWFyY2hMb2dnZXIuZGVidWcoJ0xvYWQgZGF0YSBmb3IgYWxsIHByb3ZpZGVycycpO1xuXG5cdFx0Y29uc3QgcHJvdmlkZXJzID0gdGhpcy5wcm92aWRlcnM7XG5cblx0XHQvL2FkZCBzZXR0aW5ncyBmb3IgYWRtaW5pbmlzdHJhdGlvblxuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ1NlYXJjaCcsIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRcdFx0c2VsZi5hZGQoJ1NlYXJjaC5Qcm92aWRlcicsICdkZWZhdWx0UHJvdmlkZXInLCB7XG5cdFx0XHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdFx0XHR2YWx1ZXM6IE9iamVjdC5rZXlzKHByb3ZpZGVycykubWFwKChrZXkpID0+IHsgcmV0dXJuIHtrZXksIGkxOG5MYWJlbDogcHJvdmlkZXJzW2tleV0uaTE4bkxhYmVsfTsgfSksXG5cdFx0XHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRcdFx0aTE4bkxhYmVsOiAnU2VhcmNoX1Byb3ZpZGVyJ1xuXHRcdFx0fSk7XG5cblx0XHRcdE9iamVjdC5rZXlzKHByb3ZpZGVycylcblx0XHRcdFx0LmZpbHRlcigoa2V5KSA9PiBwcm92aWRlcnNba2V5XS5zZXR0aW5ncyAmJiBwcm92aWRlcnNba2V5XS5zZXR0aW5ncy5sZW5ndGggPiAwKVxuXHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcblx0XHRcdFx0XHRzZWxmLnNlY3Rpb24ocHJvdmlkZXJzW2tleV0uaTE4bkxhYmVsLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHByb3ZpZGVyc1trZXldLnNldHRpbmdzLmZvckVhY2goKHNldHRpbmcpID0+IHtcblxuXHRcdFx0XHRcdFx0XHRjb25zdCBfb3B0aW9ucyA9IHtcblx0XHRcdFx0XHRcdFx0XHR0eXBlOiBzZXR0aW5nLnR5cGUsXG5cdFx0XHRcdFx0XHRcdFx0Li4uc2V0dGluZy5vcHRpb25zXG5cdFx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdFx0X29wdGlvbnMuZW5hYmxlUXVlcnkgPSBfb3B0aW9ucy5lbmFibGVRdWVyeSB8fCBbXTtcblxuXHRcdFx0XHRcdFx0XHRfb3B0aW9ucy5lbmFibGVRdWVyeS5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRfaWQ6ICdTZWFyY2guUHJvdmlkZXInLFxuXHRcdFx0XHRcdFx0XHRcdHZhbHVlOiBrZXlcblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0dGhpcy5hZGQoc2V0dGluZy5pZCwgc2V0dGluZy5kZWZhdWx0VmFsdWUsIF9vcHRpb25zKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vYWRkIGxpc3RlbmVyIHRvIHJlYWN0IG9uIHNldHRpbmcgY2hhbmdlc1xuXHRcdGNvbnN0IGNvbmZpZ1Byb3ZpZGVyID0gXy5kZWJvdW5jZShNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdGNvbnN0IHByb3ZpZGVySWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2VhcmNoLlByb3ZpZGVyJyk7XG5cblx0XHRcdGlmIChwcm92aWRlcklkKSB7XG5cdFx0XHRcdHRoaXMudXNlKHByb3ZpZGVySWQpOy8vVE9ETyBkbyBzb21ldGhpbmcgd2l0aCBzdWNjZXNzIGFuZCBlcnJvcnNcblx0XHRcdH1cblxuXHRcdH0pLCAxMDAwKTtcblxuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KC9eU2VhcmNoXFwuLywgY29uZmlnUHJvdmlkZXIpO1xuXHR9XG5cbn1cblxuZXhwb3J0IGNvbnN0IHNlYXJjaFByb3ZpZGVyU2VydmljZSA9IG5ldyBTZWFyY2hQcm92aWRlclNlcnZpY2UoKTtcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRzZWFyY2hQcm92aWRlclNlcnZpY2Uuc3RhcnQoKTtcbn0pO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdC8qKlxuXHQgKiBTZWFyY2ggdXNpbmcgdGhlIGN1cnJlbnQgc2VhcmNoIHByb3ZpZGVyIGFuZCBjaGVjayBpZiByZXN1bHRzIGFyZSB2YWxpZCBmb3IgdGhlIHVzZXIuIFRoZSBzZWFyY2ggcmVzdWx0IGhhc1xuXHQgKiB0aGUgZm9ybWF0IHttZXNzYWdlczp7c3RhcnQ6MCxudW1Gb3VuZDoxLGRvY3M6W3suLi59XX0sdXNlcnM6ey4uLn0scm9vbXM6ey4uLn19XG5cdCAqIEBwYXJhbSB0ZXh0IHRoZSBzZWFyY2ggdGV4dFxuXHQgKiBAcGFyYW0gY29udGV4dCB0aGUgY29udGV4dCAodWlkLCByaWQpXG5cdCAqIEBwYXJhbSBwYXlsb2FkIGN1c3RvbSBwYXlsb2FkIChlLmcuIGZvciBwYWdpbmcpXG5cdCAqIEByZXR1cm5zIHsqfVxuXHQgKi9cblx0J3JvY2tldGNoYXRTZWFyY2guc2VhcmNoJyh0ZXh0LCBjb250ZXh0LCBwYXlsb2FkKSB7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG5cdFx0XHRwYXlsb2FkID0gcGF5bG9hZCAhPT0gbnVsbCA/IHBheWxvYWQgOiB1bmRlZmluZWQ7Ly9UT0RPIGlzIHRoaXMgY2xlYW51cCBuZWNlc3Nhcnk/XG5cblx0XHRcdHRyeSB7XG5cblx0XHRcdFx0aWYgKCFzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1Byb3ZpZGVyIGN1cnJlbnRseSBub3QgYWN0aXZlJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRTZWFyY2hMb2dnZXIuZGVidWcoJ3NlYXJjaDogJywgYFxcblxcdFRleHQ6JHsgdGV4dCB9XFxuXFx0Q29udGV4dDokeyBKU09OLnN0cmluZ2lmeShjb250ZXh0KSB9XFxuXFx0UGF5bG9hZDokeyBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSB9YCk7XG5cblx0XHRcdFx0c2VhcmNoUHJvdmlkZXJTZXJ2aWNlLmFjdGl2ZVByb3ZpZGVyLnNlYXJjaCh0ZXh0LCBjb250ZXh0LCBwYXlsb2FkLCAoZXJyb3IsIGRhdGEpID0+IHtcblx0XHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJlc29sdmUodmFsaWRhdGlvblNlcnZpY2UudmFsaWRhdGVTZWFyY2hSZXN1bHQoZGF0YSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJlamVjdChlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblx0J3JvY2tldGNoYXRTZWFyY2guc3VnZ2VzdCcodGV4dCwgY29udGV4dCwgcGF5bG9hZCkge1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHBheWxvYWQgPSBwYXlsb2FkICE9PSBudWxsID8gcGF5bG9hZCA6IHVuZGVmaW5lZDsvL1RPRE8gaXMgdGhpcyBjbGVhbnVwIG5lY2Vzc2FyeT9cblxuXHRcdFx0dHJ5IHtcblxuXHRcdFx0XHRpZiAoIXNlYXJjaFByb3ZpZGVyU2VydmljZS5hY3RpdmVQcm92aWRlcikgeyB0aHJvdyBuZXcgRXJyb3IoJ1Byb3ZpZGVyIGN1cnJlbnRseSBub3QgYWN0aXZlJyk7IH1cblxuXHRcdFx0XHRTZWFyY2hMb2dnZXIuZGVidWcoJ3N1Z2dlc3Q6ICcsIGBcXG5cXHRUZXh0OiR7IHRleHQgfVxcblxcdENvbnRleHQ6JHsgSlNPTi5zdHJpbmdpZnkoY29udGV4dCkgfVxcblxcdFBheWxvYWQ6JHsgSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkgfWApO1xuXG5cdFx0XHRcdHNlYXJjaFByb3ZpZGVyU2VydmljZS5hY3RpdmVQcm92aWRlci5zdWdnZXN0KHRleHQsIGNvbnRleHQsIHBheWxvYWQsIChlcnJvciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShkYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZWplY3QoZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cdC8qKlxuXHQgKiBHZXQgdGhlIGN1cnJlbnQgcHJvdmlkZXIgd2l0aCBrZXksIGRlc2NyaXB0aW9uLCByZXN1bHRUZW1wbGF0ZSwgc3VnZ2VzdGlvbkl0ZW1UZW1wbGF0ZSBhbmQgc2V0dGluZ3MgKGFzIE1hcClcblx0ICogQHJldHVybnMgeyp9XG5cdCAqL1xuXHQncm9ja2V0Y2hhdFNlYXJjaC5nZXRQcm92aWRlcicoKSB7XG5cdFx0aWYgKCFzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGtleTogc2VhcmNoUHJvdmlkZXJTZXJ2aWNlLmFjdGl2ZVByb3ZpZGVyLmtleSxcblx0XHRcdGRlc2NyaXB0aW9uOiBzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIuaTE4bkRlc2NyaXB0aW9uLFxuXHRcdFx0aWNvbjogc2VhcmNoUHJvdmlkZXJTZXJ2aWNlLmFjdGl2ZVByb3ZpZGVyLmljb25OYW1lLFxuXHRcdFx0cmVzdWx0VGVtcGxhdGU6IHNlYXJjaFByb3ZpZGVyU2VydmljZS5hY3RpdmVQcm92aWRlci5yZXN1bHRUZW1wbGF0ZSxcblx0XHRcdHN1cHBvcnRzU3VnZ2VzdGlvbnM6IHNlYXJjaFByb3ZpZGVyU2VydmljZS5hY3RpdmVQcm92aWRlci5zdXBwb3J0c1N1Z2dlc3Rpb25zLFxuXHRcdFx0c3VnZ2VzdGlvbkl0ZW1UZW1wbGF0ZTogc2VhcmNoUHJvdmlkZXJTZXJ2aWNlLmFjdGl2ZVByb3ZpZGVyLnN1Z2dlc3Rpb25JdGVtVGVtcGxhdGUsXG5cdFx0XHRzZXR0aW5nczogXy5tYXBPYmplY3Qoc2VhcmNoUHJvdmlkZXJTZXJ2aWNlLmFjdGl2ZVByb3ZpZGVyLnNldHRpbmdzQXNNYXAsIChzZXR0aW5nKSA9PiB7XG5cdFx0XHRcdHJldHVybiBzZXR0aW5nLnZhbHVlO1xuXHRcdFx0fSlcblx0XHR9O1xuXHR9XG59KTtcblxuIiwiaW1wb3J0IFNlYXJjaExvZ2dlciBmcm9tICcuLi9sb2dnZXIvbG9nZ2VyJztcblxuY2xhc3MgVmFsaWRhdGlvblNlcnZpY2Uge1xuXHRjb25zdHJ1Y3RvcigpIHt9XG5cblx0dmFsaWRhdGVTZWFyY2hSZXN1bHQocmVzdWx0KSB7XG5cblx0XHRjb25zdCBzdWJzY3JpcHRpb25DYWNoZSA9IHt9O1xuXG5cdFx0Y29uc3QgZ2V0U3Vic2NyaXB0aW9uID0gKHJpZCwgdWlkKSA9PiB7XG5cdFx0XHRpZiAoIXN1YnNjcmlwdGlvbkNhY2hlLmhhc093blByb3BlcnR5KHJpZCkpIHtcblx0XHRcdFx0c3Vic2NyaXB0aW9uQ2FjaGVbcmlkXSA9IE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgcmlkLCB1aWQpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gc3Vic2NyaXB0aW9uQ2FjaGVbcmlkXTtcblx0XHR9O1xuXG5cdFx0Y29uc3QgdXNlckNhY2hlID0ge307XG5cblx0XHRjb25zdCBnZXRVc2VybmFtZSA9ICh1aWQpID0+IHtcblx0XHRcdGlmICghdXNlckNhY2hlLmhhc093blByb3BlcnR5KHVpZCkpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR1c2VyQ2FjaGVbdWlkXSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRCeUlkKHVpZCkuZmV0Y2goKVswXS51c2VybmFtZTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdHVzZXJDYWNoZVt1aWRdID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdXNlckNhY2hlW3VpZF07XG5cdFx0fTtcblxuXHRcdGNvbnN0IHVpZCA9IE1ldGVvci51c2VySWQoKTtcblx0XHQvL2dldCBzdWJzY3JpcHRpb24gZm9yIG1lc3NhZ2Vcblx0XHRpZiAocmVzdWx0Lm1lc3NhZ2UpIHtcblx0XHRcdHJlc3VsdC5tZXNzYWdlLmRvY3MuZm9yRWFjaCgobXNnKSA9PiB7XG5cblx0XHRcdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gZ2V0U3Vic2NyaXB0aW9uKG1zZy5yaWQsIHVpZCk7XG5cblx0XHRcdFx0aWYgKHN1YnNjcmlwdGlvbikge1xuXHRcdFx0XHRcdG1zZy5yID0ge25hbWU6IHN1YnNjcmlwdGlvbi5uYW1lLCB0OiBzdWJzY3JpcHRpb24udH07XG5cdFx0XHRcdFx0bXNnLnVzZXJuYW1lID0gZ2V0VXNlcm5hbWUobXNnLnVzZXIpO1xuXHRcdFx0XHRcdG1zZy52YWxpZCA9IHRydWU7XG5cdFx0XHRcdFx0U2VhcmNoTG9nZ2VyLmRlYnVnKGB1c2VyICR7IHVpZCB9IGNhbiBhY2Nlc3MgJHsgbXNnLnJpZCB9ICggJHsgc3Vic2NyaXB0aW9uLnQgPT09ICdkJyA/IHN1YnNjcmlwdGlvbi51c2VybmFtZSA6IHN1YnNjcmlwdGlvbi5uYW1lIH0gKWApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFNlYXJjaExvZ2dlci5kZWJ1ZyhgdXNlciAkeyB1aWQgfSBjYW4gTk9UIGFjY2VzcyAkeyBtc2cucmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJlc3VsdC5tZXNzYWdlLmRvY3MuZmlsdGVyKChtc2cpID0+IHtcblx0XHRcdFx0cmV0dXJuIG1zZy52YWxpZDtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChyZXN1bHQucm9vbSkge1xuXHRcdFx0cmVzdWx0LnJvb20uZG9jcy5mb3JFYWNoKChyb29tKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IGdldFN1YnNjcmlwdGlvbihyb29tLl9pZCwgdWlkKTtcblx0XHRcdFx0aWYgKHN1YnNjcmlwdGlvbikge1xuXHRcdFx0XHRcdHJvb20udmFsaWQgPSB0cnVlO1xuXHRcdFx0XHRcdFNlYXJjaExvZ2dlci5kZWJ1ZyhgdXNlciAkeyB1aWQgfSBjYW4gYWNjZXNzICR7IHJvb20uX2lkIH0gKCAkeyBzdWJzY3JpcHRpb24udCA9PT0gJ2QnID8gc3Vic2NyaXB0aW9uLnVzZXJuYW1lIDogc3Vic2NyaXB0aW9uLm5hbWUgfSApYCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0U2VhcmNoTG9nZ2VyLmRlYnVnKGB1c2VyICR7IHVpZCB9IGNhbiBOT1QgYWNjZXNzICR7IHJvb20uX2lkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJlc3VsdC5yb29tLmRvY3MuZmlsdGVyKChyb29tKSA9PiB7XG5cdFx0XHRcdHJldHVybiByb29tLnZhbGlkO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxufVxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGlvblNlcnZpY2UgPSBuZXcgVmFsaWRhdGlvblNlcnZpY2UoKTtcbiJdfQ==
