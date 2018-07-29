(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var Apps;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:apps":{"lib":{"Apps.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/lib/Apps.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Please see both server and client's repsective "orchestrator" file for the contents
Apps = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"storage":{"apps-logs-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-logs-model.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsLogsModel: () => AppsLogsModel
});

class AppsLogsModel extends RocketChat.models._Base {
  constructor() {
    super('apps_logs');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-model.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsModel: () => AppsModel
});

class AppsModel extends RocketChat.models._Base {
  constructor() {
    super('apps');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps-persistence-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-persistence-model.js                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsPersistenceModel: () => AppsPersistenceModel
});

class AppsPersistenceModel extends RocketChat.models._Base {
  constructor() {
    super('apps_persistence');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"storage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/storage.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRealStorage: () => AppRealStorage
});
let AppStorage;
module.watch(require("@rocket.chat/apps-engine/server/storage"), {
  AppStorage(v) {
    AppStorage = v;
  }

}, 0);

class AppRealStorage extends AppStorage {
  constructor(data) {
    super('mongodb');
    this.db = data;
  }

  create(item) {
    return new Promise((resolve, reject) => {
      item.createdAt = new Date();
      item.updatedAt = new Date();
      let doc;

      try {
        doc = this.db.findOne({
          $or: [{
            id: item.id
          }, {
            'info.nameSlug': item.info.nameSlug
          }]
        });
      } catch (e) {
        return reject(e);
      }

      if (doc) {
        return reject(new Error('App already exists.'));
      }

      try {
        const id = this.db.insert(item);
        item._id = id;
        resolve(item);
      } catch (e) {
        reject(e);
      }
    });
  }

  retrieveOne(id) {
    return new Promise((resolve, reject) => {
      let doc;

      try {
        doc = this.db.findOne({
          $or: [{
            _id: id
          }, {
            id
          }]
        });
      } catch (e) {
        return reject(e);
      }

      if (doc) {
        resolve(doc);
      } else {
        reject(new Error(`No App found by the id: ${id}`));
      }
    });
  }

  retrieveAll() {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find({}).fetch();
      } catch (e) {
        return reject(e);
      }

      const items = new Map();
      docs.forEach(i => items.set(i.id, i));
      resolve(items);
    });
  }

  update(item) {
    return new Promise((resolve, reject) => {
      try {
        this.db.update({
          id: item.id
        }, item);
      } catch (e) {
        return reject(e);
      }

      this.retrieveOne(item.id).then(updated => resolve(updated)).catch(err => reject(err));
    });
  }

  remove(id) {
    return new Promise((resolve, reject) => {
      try {
        this.db.remove({
          id
        });
      } catch (e) {
        return reject(e);
      }

      resolve({
        success: true
      });
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/index.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsLogsModel: () => AppsLogsModel,
  AppsModel: () => AppsModel,
  AppsPersistenceModel: () => AppsPersistenceModel,
  AppRealLogsStorage: () => AppRealLogsStorage,
  AppRealStorage: () => AppRealStorage
});
let AppsLogsModel;
module.watch(require("./apps-logs-model"), {
  AppsLogsModel(v) {
    AppsLogsModel = v;
  }

}, 0);
let AppsModel;
module.watch(require("./apps-model"), {
  AppsModel(v) {
    AppsModel = v;
  }

}, 1);
let AppsPersistenceModel;
module.watch(require("./apps-persistence-model"), {
  AppsPersistenceModel(v) {
    AppsPersistenceModel = v;
  }

}, 2);
let AppRealLogsStorage;
module.watch(require("./logs-storage"), {
  AppRealLogsStorage(v) {
    AppRealLogsStorage = v;
  }

}, 3);
let AppRealStorage;
module.watch(require("./storage"), {
  AppRealStorage(v) {
    AppRealStorage = v;
  }

}, 4);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"logs-storage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/logs-storage.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRealLogsStorage: () => AppRealLogsStorage
});
let AppConsole;
module.watch(require("@rocket.chat/apps-engine/server/logging"), {
  AppConsole(v) {
    AppConsole = v;
  }

}, 0);
let AppLogStorage;
module.watch(require("@rocket.chat/apps-engine/server/storage"), {
  AppLogStorage(v) {
    AppLogStorage = v;
  }

}, 1);

class AppRealLogsStorage extends AppLogStorage {
  constructor(model) {
    super('mongodb');
    this.db = model;
  }

  find() {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find(...arguments).fetch();
      } catch (e) {
        return reject(e);
      }

      resolve(docs);
    });
  }

  storeEntries(appId, logger) {
    return new Promise((resolve, reject) => {
      const item = AppConsole.toStorageEntry(appId, logger);

      try {
        const id = this.db.insert(item);
        resolve(this.db.findOneById(id));
      } catch (e) {
        reject(e);
      }
    });
  }

  getEntriesFor(appId) {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find({
          appId
        }).fetch();
      } catch (e) {
        return reject(e);
      }

      resolve(docs);
    });
  }

  removeEntriesFor(appId) {
    return new Promise((resolve, reject) => {
      try {
        this.db.remove({
          appId
        });
      } catch (e) {
        return reject(e);
      }

      resolve();
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"bridges":{"activation.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/activation.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppActivationBridge: () => AppActivationBridge
});

class AppActivationBridge {
  constructor(orch) {
    this.orch = orch;
  }

  appAdded(app) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appAdded(app.getID()));
    });
  }

  appUpdated(app) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appUpdated(app.getID()));
    });
  }

  appRemoved(app) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appRemoved(app.getID()));
    });
  }

  appStatusChanged(app, status) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appStatusUpdated(app.getID(), status));
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"bridges.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/bridges.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  RealAppBridges: () => RealAppBridges
});
let AppBridges;
module.watch(require("@rocket.chat/apps-engine/server/bridges"), {
  AppBridges(v) {
    AppBridges = v;
  }

}, 0);
let AppActivationBridge;
module.watch(require("./activation"), {
  AppActivationBridge(v) {
    AppActivationBridge = v;
  }

}, 1);
let AppDetailChangesBridge;
module.watch(require("./details"), {
  AppDetailChangesBridge(v) {
    AppDetailChangesBridge = v;
  }

}, 2);
let AppCommandsBridge;
module.watch(require("./commands"), {
  AppCommandsBridge(v) {
    AppCommandsBridge = v;
  }

}, 3);
let AppEnvironmentalVariableBridge;
module.watch(require("./environmental"), {
  AppEnvironmentalVariableBridge(v) {
    AppEnvironmentalVariableBridge = v;
  }

}, 4);
let AppHttpBridge;
module.watch(require("./http"), {
  AppHttpBridge(v) {
    AppHttpBridge = v;
  }

}, 5);
let AppListenerBridge;
module.watch(require("./listeners"), {
  AppListenerBridge(v) {
    AppListenerBridge = v;
  }

}, 6);
let AppMessageBridge;
module.watch(require("./messages"), {
  AppMessageBridge(v) {
    AppMessageBridge = v;
  }

}, 7);
let AppPersistenceBridge;
module.watch(require("./persistence"), {
  AppPersistenceBridge(v) {
    AppPersistenceBridge = v;
  }

}, 8);
let AppRoomBridge;
module.watch(require("./rooms"), {
  AppRoomBridge(v) {
    AppRoomBridge = v;
  }

}, 9);
let AppSettingBridge;
module.watch(require("./settings"), {
  AppSettingBridge(v) {
    AppSettingBridge = v;
  }

}, 10);
let AppUserBridge;
module.watch(require("./users"), {
  AppUserBridge(v) {
    AppUserBridge = v;
  }

}, 11);

class RealAppBridges extends AppBridges {
  constructor(orch) {
    super();
    this._actBridge = new AppActivationBridge(orch);
    this._cmdBridge = new AppCommandsBridge(orch);
    this._detBridge = new AppDetailChangesBridge(orch);
    this._envBridge = new AppEnvironmentalVariableBridge(orch);
    this._httpBridge = new AppHttpBridge();
    this._lisnBridge = new AppListenerBridge(orch);
    this._msgBridge = new AppMessageBridge(orch);
    this._persistBridge = new AppPersistenceBridge(orch);
    this._roomBridge = new AppRoomBridge(orch);
    this._setsBridge = new AppSettingBridge(orch);
    this._userBridge = new AppUserBridge(orch);
  }

  getCommandBridge() {
    return this._cmdBridge;
  }

  getEnvironmentalVariableBridge() {
    return this._envBridge;
  }

  getHttpBridge() {
    return this._httpBridge;
  }

  getListenerBridge() {
    return this._lisnBridge;
  }

  getMessageBridge() {
    return this._msgBridge;
  }

  getPersistenceBridge() {
    return this._persistBridge;
  }

  getAppActivationBridge() {
    return this._actBridge;
  }

  getAppDetailChangesBridge() {
    return this._detBridge;
  }

  getRoomBridge() {
    return this._roomBridge;
  }

  getServerSettingBridge() {
    return this._setsBridge;
  }

  getUserBridge() {
    return this._userBridge;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"commands.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/commands.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppCommandsBridge: () => AppCommandsBridge
});
let SlashCommandContext;
module.watch(require("@rocket.chat/apps-ts-definition/slashcommands"), {
  SlashCommandContext(v) {
    SlashCommandContext = v;
  }

}, 0);

class AppCommandsBridge {
  constructor(orch) {
    this.orch = orch;
    this.disabledCommands = new Map();
  }

  doesCommandExist(command, appId) {
    console.log(`The App ${appId} is checking if "${command}" command exists.`);

    if (typeof command !== 'string' || command.length === 0) {
      return false;
    }

    const cmd = command.toLowerCase();
    return typeof RocketChat.slashCommands.commands[cmd] === 'object' || this.disabledCommands.has(cmd);
  }

  enableCommand(command, appId) {
    console.log(`The App ${appId} is attempting to enable the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();

    if (!this.disabledCommands.has(cmd)) {
      throw new Error(`The command is not currently disabled: "${cmd}"`);
    }

    RocketChat.slashCommands.commands[cmd] = this.disabledCommands.get(cmd);
    this.disabledCommands.delete(cmd);
    this.orch.getNotifier().commandUpdated(cmd);
  }

  disableCommand(command, appId) {
    console.log(`The App ${appId} is attempting to disable the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();

    if (this.disabledCommands.has(cmd)) {
      // The command is already disabled, no need to disable it yet again
      return;
    }

    if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
      throw new Error(`Command does not exist in the system currently: "${cmd}"`);
    }

    this.disabledCommands.set(cmd, RocketChat.slashCommands.commands[cmd]);
    delete RocketChat.slashCommands.commands[cmd];
    this.orch.getNotifier().commandDisabled(cmd);
  } // command: { command, paramsExample, i18nDescription, executor: function }


  modifyCommand(command, appId) {
    console.log(`The App ${appId} is attempting to modify the command: "${command}"`);

    this._verifyCommand(command);

    const cmd = command.toLowerCase();

    if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
      throw new Error(`Command does not exist in the system currently (or it is disabled): "${cmd}"`);
    }

    const item = RocketChat.slashCommands.commands[cmd];
    item.params = command.paramsExample ? command.paramsExample : item.params;
    item.description = command.i18nDescription ? command.i18nDescription : item.params;
    item.callback = this._appCommandExecutor.bind(this);
    item.providesPreview = command.providesPreview;
    item.previewer = command.previewer ? this._appCommandPreviewer.bind(this) : item.previewer;
    item.previewCallback = command.executePreviewItem ? this._appCommandPreviewExecutor.bind(this) : item.previewCallback;
    RocketChat.slashCommands.commands[cmd] = item;
    this.orch.getNotifier().commandUpdated(cmd);
  }

  registerCommand(command, appId) {
    console.log(`The App ${appId} is registerin the command: "${command.command}"`);

    this._verifyCommand(command);

    const item = {
      command: command.command.toLowerCase(),
      params: command.paramsExample,
      description: command.i18nDescription,
      callback: this._appCommandExecutor.bind(this),
      providesPreview: command.providesPreview,
      previewer: !command.previewer ? undefined : this._appCommandPreviewer.bind(this),
      previewCallback: !command.executePreviewItem ? undefined : this._appCommandPreviewExecutor.bind(this)
    };
    RocketChat.slashCommands.commands[command.command.toLowerCase()] = item;
    this.orch.getNotifier().commandAdded(command.command.toLowerCase());
  }

  unregisterCommand(command, appId) {
    console.log(`The App ${appId} is unregistering the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();
    this.disabledCommands.delete(cmd);
    delete RocketChat.slashCommands.commands[cmd];
    this.orch.getNotifier().commandRemoved(cmd);
  }

  _verifyCommand(command) {
    if (typeof command !== 'object') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.command !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (command.i18nParamsExample && typeof command.i18nParamsExample !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (command.i18nDescription && typeof command.i18nDescription !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.providesPreview !== 'boolean') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.executor !== 'function') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }
  }

  _appCommandExecutor(command, parameters, message) {
    const user = this.orch.getConverters().get('users').convertById(Meteor.userId());
    const room = this.orch.getConverters().get('rooms').convertById(message.rid);
    const params = parameters.length === 0 || parameters === ' ' ? [] : parameters.split(' ');
    const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params));
    Promise.await(this.orch.getManager().getCommandManager().executeCommand(command, context));
  }

  _appCommandPreviewer(command, parameters, message) {
    const user = this.orch.getConverters().get('users').convertById(Meteor.userId());
    const room = this.orch.getConverters().get('rooms').convertById(message.rid);
    const params = parameters.length === 0 || parameters === ' ' ? [] : parameters.split(' ');
    const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params));
    return Promise.await(this.orch.getManager().getCommandManager().getPreviews(command, context));
  }

  _appCommandPreviewExecutor(command, parameters, message, preview) {
    const user = this.orch.getConverters().get('users').convertById(Meteor.userId());
    const room = this.orch.getConverters().get('rooms').convertById(message.rid);
    const params = parameters.length === 0 || parameters === ' ' ? [] : parameters.split(' ');
    const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params));
    Promise.await(this.orch.getManager().getCommandManager().executePreview(command, preview, context));
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"environmental.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/environmental.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppEnvironmentalVariableBridge: () => AppEnvironmentalVariableBridge
});

class AppEnvironmentalVariableBridge {
  constructor(orch) {
    this.orch = orch;
    this.allowed = ['NODE_ENV', 'ROOT_URL', 'INSTANCE_IP'];
  }

  getValueByName(envVarName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the environmental variable value ${envVarName}.`);

      if (this.isReadable(envVarName, appId)) {
        return process.env[envVarName];
      }

      throw new Error(`The environmental variable "${envVarName}" is not readable.`);
    });
  }

  isReadable(envVarName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is checking if the environmental variable is readable ${envVarName}.`);
      return this.allowed.includes(envVarName.toUpperCase());
    });
  }

  isSet(envVarName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is checking if the environmental variable is set ${envVarName}.`);

      if (this.isReadable(envVarName, appId)) {
        return typeof process.env[envVarName] !== 'undefined';
      }

      throw new Error(`The environmental variable "${envVarName}" is not readable.`);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/messages.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessageBridge: () => AppMessageBridge
});

class AppMessageBridge {
  constructor(orch) {
    this.orch = orch;
  }

  create(message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is creating a new message.`);
      let msg = this.orch.getConverters().get('messages').convertAppMessage(message);
      Meteor.runAsUser(msg.u._id, () => {
        msg = Meteor.call('sendMessage', msg);
      });
      return msg._id;
    });
  }

  getById(messageId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the message: "${messageId}"`);
      return this.orch.getConverters().get('messages').convertById(messageId);
    });
  }

  update(message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating a message.`);

      if (!message.editor) {
        throw new Error('Invalid editor assigned to the message for the update.');
      }

      if (!message.id || !RocketChat.models.Messages.findOneById(message.id)) {
        throw new Error('A message must exist to update.');
      }

      const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
      const editor = RocketChat.models.Users.findOneById(message.editor.id);
      RocketChat.updateMessage(msg, editor);
    });
  }

  notifyUser(user, message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is notifying a user.`);
      const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
      RocketChat.Notifications.notifyUser(user.id, 'message', Object.assign(msg, {
        _id: Random.id(),
        ts: new Date(),
        u: undefined,
        editor: undefined
      }));
    });
  }

  notifyRoom(room, message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is notifying a room's users.`);

      if (room && room.usernames && Array.isArray(room.usernames)) {
        const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
        const rmsg = Object.assign(msg, {
          _id: Random.id(),
          rid: room.id,
          ts: new Date(),
          u: undefined,
          editor: undefined
        });
        room.usernames.forEach(u => {
          const user = RocketChat.models.Users.findOneByUsername(u);

          if (user) {
            RocketChat.Notifications.notifyUser(user._id, 'message', rmsg);
          }
        });
      }
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"persistence.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/persistence.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppPersistenceBridge: () => AppPersistenceBridge
});

class AppPersistenceBridge {
  constructor(orch) {
    this.orch = orch;
  }

  purge(appId) {
    return Promise.asyncApply(() => {
      console.log(`The App's persistent storage is being purged: ${appId}`);
      this.orch.getPersistenceModel().remove({
        appId
      });
    });
  }

  create(data, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is storing a new object in their persistence.`, data);

      if (typeof data !== 'object') {
        throw new Error('Attempted to store an invalid data type, it must be an object.');
      }

      return this.orch.getPersistenceModel().insert({
        appId,
        data
      });
    });
  }

  createWithAssociations(data, associations, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is storing a new object in their persistence that is associated with some models.`, data, associations);

      if (typeof data !== 'object') {
        throw new Error('Attempted to store an invalid data type, it must be an object.');
      }

      return this.orch.getPersistenceModel().insert({
        appId,
        associations,
        data
      });
    });
  }

  readById(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is reading their data in their persistence with the id: "${id}"`);
      const record = this.orch.getPersistenceModel().findOneById(id);
      return record.data;
    });
  }

  readByAssociations(associations, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is searching for records that are associated with the following:`, associations);
      const records = this.orch.getPersistenceModel().find({
        appId,
        associations: {
          $all: associations
        }
      }).fetch();
      return Array.isArray(records) ? records.map(r => r.data) : [];
    });
  }

  remove(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is removing one of their records by the id: "${id}"`);
      const record = this.orch.getPersistenceModel().findOne({
        _id: id,
        appId
      });

      if (!record) {
        return undefined;
      }

      this.orch.getPersistenceModel().remove({
        _id: id,
        appId
      });
      return record.data;
    });
  }

  removeByAssociations(associations, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is removing records with the following associations:`, associations);
      const query = {
        appId,
        associations: {
          $all: associations
        }
      };
      const records = this.orch.getPersistenceModel().find(query).fetch();

      if (!records) {
        return undefined;
      }

      this.orch.getPersistenceModel().remove(query);
      return Array.isArray(records) ? records.map(r => r.data) : [];
    });
  }

  update(id, data, upsert, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating the record "${id}" to:`, data);

      if (typeof data !== 'object') {
        throw new Error('Attempted to store an invalid data type, it must be an object.');
      }

      throw new Error('Not implemented.');
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/rooms.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRoomBridge: () => AppRoomBridge
});
let RoomType;
module.watch(require("@rocket.chat/apps-ts-definition/rooms"), {
  RoomType(v) {
    RoomType = v;
  }

}, 0);

class AppRoomBridge {
  constructor(orch) {
    this.orch = orch;
  }

  create(room, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is creating a new room.`, room);
      const rcRoom = this.orch.getConverters().get('rooms').convertAppRoom(room);
      let method;

      switch (room.type) {
        case RoomType.CHANNEL:
          method = 'createChannel';
          break;

        case RoomType.PRIVATE_GROUP:
          method = 'createPrivateGroup';
          break;

        default:
          throw new Error('Only channels and private groups can be created.');
      }

      let rid;
      Meteor.runAsUser(room.creator.id, () => {
        const info = Meteor.call(method, rcRoom.usernames);
        rid = info.rid;
      });
      return rid;
    });
  }

  getById(roomId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the roomById: "${roomId}"`);
      return this.orch.getConverters().get('rooms').convertById(roomId);
    });
  }

  getByName(roomName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the roomByName: "${roomName}"`);
      return this.orch.getConverters().get('rooms').convertByName(roomName);
    });
  }

  getCreatorById(roomId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the room's creator by id: "${roomId}"`);
      const room = RocketChat.models.Rooms.findOneById(roomId);

      if (!room || !room.u || !room.u._id) {
        return undefined;
      }

      return this.orch.getConverters().get('users').convertById(room.u._id);
    });
  }

  getCreatorByName(roomName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the room's creator by name: "${roomName}"`);
      const room = RocketChat.models.Rooms.findOneByName(roomName);

      if (!room || !room.u || !room.u._id) {
        return undefined;
      }

      return this.orch.getConverters().get('users').convertById(room.u._id);
    });
  }

  update(room, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating a room.`);

      if (!room.id || RocketChat.models.Rooms.findOneById(room.id)) {
        throw new Error('A room must exist to update.');
      }

      const rm = this.orch.getConverters().get('rooms').convertAppRoom(room);
      RocketChat.models.Rooms.update(rm._id, rm);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/settings.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppSettingBridge: () => AppSettingBridge
});

class AppSettingBridge {
  constructor(orch) {
    this.orch = orch;
    this.allowedGroups = [];
    this.disallowedSettings = ['Accounts_RegistrationForm_SecretURL', 'CROWD_APP_USERNAME', 'CROWD_APP_PASSWORD', 'Direct_Reply_Username', 'Direct_Reply_Password', 'SMTP_Username', 'SMTP_Password', 'FileUpload_S3_AWSAccessKeyId', 'FileUpload_S3_AWSSecretAccessKey', 'FileUpload_S3_BucketURL', 'FileUpload_GoogleStorage_Bucket', 'FileUpload_GoogleStorage_AccessId', 'FileUpload_GoogleStorage_Secret', 'GoogleVision_ServiceAccount', 'Allow_Invalid_SelfSigned_Certs', 'GoogleTagManager_id', 'Bugsnag_api_key', 'LDAP_CA_Cert', 'LDAP_Reject_Unauthorized', 'LDAP_Domain_Search_User', 'LDAP_Domain_Search_Password', 'Livechat_secret_token', 'Livechat_Knowledge_Apiai_Key', 'AutoTranslate_GoogleAPIKey', 'MapView_GMapsAPIKey', 'Meta_fb_app_id', 'Meta_google-site-verification', 'Meta_msvalidate01', 'Accounts_OAuth_Dolphin_secret', 'Accounts_OAuth_Drupal_secret', 'Accounts_OAuth_Facebook_secret', 'Accounts_OAuth_Github_secret', 'API_GitHub_Enterprise_URL', 'Accounts_OAuth_GitHub_Enterprise_secret', 'API_Gitlab_URL', 'Accounts_OAuth_Gitlab_secret', 'Accounts_OAuth_Google_secret', 'Accounts_OAuth_Linkedin_secret', 'Accounts_OAuth_Meteor_secret', 'Accounts_OAuth_Twitter_secret', 'API_Wordpress_URL', 'Accounts_OAuth_Wordpress_secret', 'Push_apn_passphrase', 'Push_apn_key', 'Push_apn_cert', 'Push_apn_dev_passphrase', 'Push_apn_dev_key', 'Push_apn_dev_cert', 'Push_gcm_api_key', 'Push_gcm_project_number', 'SAML_Custom_Default_cert', 'SAML_Custom_Default_private_key', 'SlackBridge_APIToken', 'Smarsh_Email', 'SMS_Twilio_Account_SID', 'SMS_Twilio_authToken'];
  }

  getAll(appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting all the settings.`);
      return RocketChat.models.Settings.find({
        _id: {
          $nin: this.disallowedSettings
        }
      }).fetch().map(s => {
        this.orch.getConverters().get('settings').convertToApp(s);
      });
    });
  }

  getOneById(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the setting by id ${id}.`);

      if (!this.isReadableById(id, appId)) {
        throw new Error(`The setting "${id}" is not readable.`);
      }

      return this.orch.getConverters().get('settings').convertById(id);
    });
  }

  hideGroup(name, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is hidding the group ${name}.`);
      throw new Error('Method not implemented.');
    });
  }

  hideSetting(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is hidding the setting ${id}.`);

      if (!this.isReadableById(id, appId)) {
        throw new Error(`The setting "${id}" is not readable.`);
      }

      throw new Error('Method not implemented.');
    });
  }

  isReadableById(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is checking if they can read the setting ${id}.`);
      return !this.disallowedSettings.includes(id);
    });
  }

  updateOne(setting, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating the setting ${setting.id} .`);

      if (!this.isReadableById(setting.id, appId)) {
        throw new Error(`The setting "${setting.id}" is not readable.`);
      }

      throw new Error('Method not implemented.');
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/users.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppUserBridge: () => AppUserBridge
});

class AppUserBridge {
  constructor(orch) {
    this.orch = orch;
  }

  getById(userId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the userId: "${userId}"`);
      return this.orch.getConverters().get('users').convertById(userId);
    });
  }

  getByUsername(username, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the username: "${username}"`);
      return this.orch.getConverters().get('users').convertByUsername(username);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/index.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  RealAppBridges: () => RealAppBridges,
  AppActivationBridge: () => AppActivationBridge,
  AppCommandsBridge: () => AppCommandsBridge,
  AppEnvironmentalVariableBridge: () => AppEnvironmentalVariableBridge,
  AppHttpBridge: () => AppHttpBridge,
  AppListenerBridge: () => AppListenerBridge,
  AppMessageBridge: () => AppMessageBridge,
  AppPersistenceBridge: () => AppPersistenceBridge,
  AppRoomBridge: () => AppRoomBridge,
  AppSettingBridge: () => AppSettingBridge,
  AppUserBridge: () => AppUserBridge
});
let RealAppBridges;
module.watch(require("./bridges"), {
  RealAppBridges(v) {
    RealAppBridges = v;
  }

}, 0);
let AppActivationBridge;
module.watch(require("./activation"), {
  AppActivationBridge(v) {
    AppActivationBridge = v;
  }

}, 1);
let AppCommandsBridge;
module.watch(require("./commands"), {
  AppCommandsBridge(v) {
    AppCommandsBridge = v;
  }

}, 2);
let AppEnvironmentalVariableBridge;
module.watch(require("./environmental"), {
  AppEnvironmentalVariableBridge(v) {
    AppEnvironmentalVariableBridge = v;
  }

}, 3);
let AppHttpBridge;
module.watch(require("./http"), {
  AppHttpBridge(v) {
    AppHttpBridge = v;
  }

}, 4);
let AppListenerBridge;
module.watch(require("./listeners"), {
  AppListenerBridge(v) {
    AppListenerBridge = v;
  }

}, 5);
let AppMessageBridge;
module.watch(require("./messages"), {
  AppMessageBridge(v) {
    AppMessageBridge = v;
  }

}, 6);
let AppPersistenceBridge;
module.watch(require("./persistence"), {
  AppPersistenceBridge(v) {
    AppPersistenceBridge = v;
  }

}, 7);
let AppRoomBridge;
module.watch(require("./rooms"), {
  AppRoomBridge(v) {
    AppRoomBridge = v;
  }

}, 8);
let AppSettingBridge;
module.watch(require("./settings"), {
  AppSettingBridge(v) {
    AppSettingBridge = v;
  }

}, 9);
let AppUserBridge;
module.watch(require("./users"), {
  AppUserBridge(v) {
    AppUserBridge = v;
  }

}, 10);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"details.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/details.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppDetailChangesBridge: () => AppDetailChangesBridge
});

class AppDetailChangesBridge {
  constructor(orch) {
    this.orch = orch;
  }

  onAppSettingsChange(appId, setting) {
    try {
      this.orch.getNotifier().appSettingsChange(appId, setting);
    } catch (e) {
      console.warn('failed to notify about the setting change.', appId);
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"http.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/http.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppHttpBridge: () => AppHttpBridge
});

class AppHttpBridge {
  call(info) {
    if (!info.request.content && typeof info.request.data === 'object') {
      info.request.content = JSON.stringify(info.request.data);
    }

    console.log(`The App ${info.appId} is requesting from the outter webs:`, info);
    return new Promise((resolve, reject) => {
      HTTP.call(info.method, info.url, info.request, (e, result) => {
        return e ? reject(e.response) : resolve(result);
      });
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"listeners.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/listeners.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppListenerBridge: () => AppListenerBridge
});

class AppListenerBridge {
  constructor(orch) {
    this.orch = orch;
  }

  messageEvent(inte, message) {
    return Promise.asyncApply(() => {
      const msg = this.orch.getConverters().get('messages').convertMessage(message);
      const result = Promise.await(this.orch.getManager().getListenerManager().executeListener(inte, msg));

      if (typeof result === 'boolean') {
        return result;
      } else {
        return this.orch.getConverters().get('messages').convertAppMessage(result);
      } // try {
      // } catch (e) {
      // 	console.log(`${ e.name }: ${ e.message }`);
      // 	console.log(e.stack);
      // }

    });
  }

  roomEvent(inte, room) {
    return Promise.asyncApply(() => {
      const rm = this.orch.getConverters().get('rooms').convertRoom(room);
      const result = Promise.await(this.orch.getManager().getListenerManager().executeListener(inte, rm));

      if (typeof result === 'boolean') {
        return result;
      } else {
        return this.orch.getConverters().get('rooms').convertAppRoom(result);
      } // try {
      // } catch (e) {
      // 	console.log(`${ e.name }: ${ e.message }`);
      // 	console.log(e.stack);
      // }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"communication":{"methods.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/methods.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMethods: () => AppMethods
});

const waitToLoad = function (orch) {
  return new Promise(resolve => {
    let id = setInterval(() => {
      if (orch.isEnabled() && orch.isLoaded()) {
        clearInterval(id);
        id = -1;
        resolve();
      }
    }, 100);
  });
};

const waitToUnload = function (orch) {
  return new Promise(resolve => {
    let id = setInterval(() => {
      if (!orch.isEnabled() && !orch.isLoaded()) {
        clearInterval(id);
        id = -1;
        resolve();
      }
    }, 100);
  });
};

class AppMethods {
  constructor(orch) {
    this._orch = orch;

    this._addMethods();
  }

  isEnabled() {
    return typeof this._orch !== 'undefined' && this._orch.isEnabled();
  }

  isLoaded() {
    return typeof this._orch !== 'undefined' && this._orch.isEnabled() && this._orch.isLoaded();
  }

  _addMethods() {
    const instance = this;
    Meteor.methods({
      'apps/is-enabled'() {
        return instance.isEnabled();
      },

      'apps/is-loaded'() {
        return instance.isLoaded();
      },

      'apps/go-enable'() {
        if (!Meteor.userId()) {
          throw new Meteor.Error('error-invalid-user', 'Invalid user', {
            method: 'apps/go-enable'
          });
        }

        if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-apps')) {
          throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
            method: 'apps/go-enable'
          });
        }

        RocketChat.settings.set('Apps_Framework_enabled', true);
        Promise.await(waitToLoad(instance._orch));
      },

      'apps/go-disable'() {
        if (!Meteor.userId()) {
          throw new Meteor.Error('error-invalid-user', 'Invalid user', {
            method: 'apps/go-enable'
          });
        }

        if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-apps')) {
          throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
            method: 'apps/go-enable'
          });
        }

        RocketChat.settings.set('Apps_Framework_enabled', false);
        Promise.await(waitToUnload(instance._orch));
      }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rest.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/rest.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsRestApi: () => AppsRestApi
});

class AppsRestApi {
  constructor(orch, manager) {
    this._orch = orch;
    this._manager = manager;
    this.api = new RocketChat.API.ApiClass({
      version: 'apps',
      useDefaultAuth: true,
      prettyJson: false,
      enableCors: false,
      auth: RocketChat.API.getUserAuth()
    });
    this.addManagementRoutes();
  }

  _handleFile(request, fileField) {
    const Busboy = Npm.require('busboy');

    const busboy = new Busboy({
      headers: request.headers
    });
    return Meteor.wrapAsync(callback => {
      busboy.on('file', Meteor.bindEnvironment((fieldname, file) => {
        if (fieldname !== fileField) {
          return callback(new Meteor.Error('invalid-field', `Expected the field "${fileField}" but got "${fieldname}" instead.`));
        }

        const fileData = [];
        file.on('data', Meteor.bindEnvironment(data => {
          fileData.push(data);
        }));
        file.on('end', Meteor.bindEnvironment(() => callback(undefined, Buffer.concat(fileData))));
      }));
      request.pipe(busboy);
    })();
  }

  addManagementRoutes() {
    const orchestrator = this._orch;
    const manager = this._manager;
    const fileHandler = this._handleFile;
    this.api.addRoute('', {
      authRequired: true
    }, {
      get() {
        const apps = manager.get().map(prl => {
          const info = prl.getInfo();
          info.languages = prl.getStorageItem().languageContent;
          info.status = prl.getStatus();
          return info;
        });
        return RocketChat.API.v1.success({
          apps
        });
      },

      post() {
        let buff;

        if (this.bodyParams.url) {
          const result = HTTP.call('GET', this.bodyParams.url, {
            npmRequestOptions: {
              encoding: 'base64'
            }
          });

          if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
            return RocketChat.API.v1.failure({
              error: 'Invalid url. It doesn\'t exist or is not "application/zip".'
            });
          }

          buff = Buffer.from(result.content, 'base64');
        } else {
          buff = fileHandler(this.request, 'app');
        }

        if (!buff) {
          return RocketChat.API.v1.failure({
            error: 'Failed to get a file to install for the App. '
          });
        }

        const aff = Promise.await(manager.add(buff.toString('base64'), false));
        const info = aff.getAppInfo(); // If there are compiler errors, there won't be an App to get the status of

        if (aff.getApp()) {
          info.status = aff.getApp().getStatus();
        } else {
          info.status = 'compiler_error';
        }

        return RocketChat.API.v1.success({
          app: info,
          implemented: aff.getImplementedInferfaces(),
          compilerErrors: aff.getCompilerErrors()
        });
      }

    });
    this.api.addRoute('languages', {
      authRequired: false
    }, {
      get() {
        const apps = manager.get().map(prl => {
          return {
            id: prl.getID(),
            languages: prl.getStorageItem().languageContent
          };
        });
        return RocketChat.API.v1.success({
          apps
        });
      }

    });
    this.api.addRoute(':id', {
      authRequired: true
    }, {
      get() {
        console.log('Getting:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const info = prl.getInfo();
          info.status = prl.getStatus();
          return RocketChat.API.v1.success({
            app: info
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        console.log('Updating:', this.urlParams.id); // TODO: Verify permissions

        let buff;

        if (this.bodyParams.url) {
          const result = HTTP.call('GET', this.bodyParams.url, {
            npmRequestOptions: {
              encoding: 'base64'
            }
          });

          if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
            return RocketChat.API.v1.failure({
              error: 'Invalid url. It doesn\'t exist or is not "application/zip".'
            });
          }

          buff = Buffer.from(result.content, 'base64');
        } else {
          buff = fileHandler(this.request, 'app');
        }

        if (!buff) {
          return RocketChat.API.v1.failure({
            error: 'Failed to get a file to install for the App. '
          });
        }

        const aff = Promise.await(manager.update(buff.toString('base64')));
        const info = aff.getAppInfo(); // Should the updated version have compiler errors, no App will be returned

        if (aff.getApp()) {
          info.status = aff.getApp().getStatus();
        } else {
          info.status = 'compiler_error';
        }

        return RocketChat.API.v1.success({
          app: info,
          implemented: aff.getImplementedInferfaces(),
          compilerErrors: aff.getCompilerErrors()
        });
      },

      delete() {
        console.log('Uninstalling:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          Promise.await(manager.remove(prl.getID()));
          const info = prl.getInfo();
          info.status = prl.getStatus();
          return RocketChat.API.v1.success({
            app: info
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/icon', {
      authRequired: true
    }, {
      get() {
        console.log('Getting the App\'s Icon:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const info = prl.getInfo();
          return RocketChat.API.v1.success({
            iconFileContent: info.iconFileContent
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/languages', {
      authRequired: false
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s languages..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const languages = prl.getStorageItem().languageContent || {};
          return RocketChat.API.v1.success({
            languages
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/logs', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s logs..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
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
            appId: prl.getID()
          });
          const options = {
            sort: sort ? sort : {
              _updatedAt: -1
            },
            skip: offset,
            limit: count,
            fields
          };
          const logs = Promise.await(orchestrator.getLogStorage().find(ourQuery, options));
          return RocketChat.API.v1.success({
            logs
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/settings', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s settings..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const settings = Object.assign({}, prl.getStorageItem().settings);
          Object.keys(settings).forEach(k => {
            if (settings[k].hidden) {
              delete settings[k];
            }
          });
          return RocketChat.API.v1.success({
            settings
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        console.log(`Updating ${this.urlParams.id}'s settings..`);

        if (!this.bodyParams || !this.bodyParams.settings) {
          return RocketChat.API.v1.failure('The settings to update must be present.');
        }

        const prl = manager.getOneById(this.urlParams.id);

        if (!prl) {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }

        const settings = prl.getStorageItem().settings;
        const updated = [];
        this.bodyParams.settings.forEach(s => {
          if (settings[s.id]) {
            Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, s)); // Updating?

            updated.push(s);
          }
        });
        return RocketChat.API.v1.success({
          updated
        });
      }

    });
    this.api.addRoute(':id/settings/:settingId', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting the App ${this.urlParams.id}'s setting ${this.urlParams.settingId}`);

        try {
          const setting = manager.getSettingsManager().getAppSetting(this.urlParams.id, this.urlParams.settingId);
          RocketChat.API.v1.success({
            setting
          });
        } catch (e) {
          if (e.message.includes('No setting found')) {
            return RocketChat.API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
          } else if (e.message.includes('No App found')) {
            return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
          } else {
            return RocketChat.API.v1.failure(e.message);
          }
        }
      },

      post() {
        console.log(`Updating the App ${this.urlParams.id}'s setting ${this.urlParams.settingId}`);

        if (!this.bodyParams.setting) {
          return RocketChat.API.v1.failure('Setting to update to must be present on the posted body.');
        }

        try {
          Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, this.bodyParams.setting));
          return RocketChat.API.v1.success();
        } catch (e) {
          if (e.message.includes('No setting found')) {
            return RocketChat.API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
          } else if (e.message.includes('No App found')) {
            return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
          } else {
            return RocketChat.API.v1.failure(e.message);
          }
        }
      }

    });
    this.api.addRoute(':id/status', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s status..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          return RocketChat.API.v1.success({
            status: prl.getStatus()
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        if (!this.bodyParams.status || typeof this.bodyParams.status !== 'string') {
          return RocketChat.API.v1.failure('Invalid status provided, it must be "status" field and a string.');
        }

        console.log(`Updating ${this.urlParams.id}'s status...`, this.bodyParams.status);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const result = Promise.await(manager.changeStatus(prl.getID(), this.bodyParams.status));
          return RocketChat.API.v1.success({
            status: result.getStatus()
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"websockets.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/websockets.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppEvents: () => AppEvents,
  AppServerListener: () => AppServerListener,
  AppServerNotifier: () => AppServerNotifier
});
let AppStatus, AppStatusUtils;
module.watch(require("@rocket.chat/apps-ts-definition/AppStatus"), {
  AppStatus(v) {
    AppStatus = v;
  },

  AppStatusUtils(v) {
    AppStatusUtils = v;
  }

}, 0);
const AppEvents = Object.freeze({
  APP_ADDED: 'app/added',
  APP_REMOVED: 'app/removed',
  APP_UPDATED: 'app/updated',
  APP_STATUS_CHANGE: 'app/statusUpdate',
  APP_SETTING_UPDATED: 'app/settingUpdated',
  COMMAND_ADDED: 'command/added',
  COMMAND_DISABLED: 'command/disabled',
  COMMAND_UPDATED: 'command/updated',
  COMMAND_REMOVED: 'command/removed'
});

class AppServerListener {
  constructor(orch, engineStreamer, clientStreamer, received) {
    this.orch = orch;
    this.engineStreamer = engineStreamer;
    this.clientStreamer = clientStreamer;
    this.received = received;
    this.engineStreamer.on(AppEvents.APP_ADDED, this.onAppAdded.bind(this));
    this.engineStreamer.on(AppEvents.APP_STATUS_CHANGE, this.onAppStatusUpdated.bind(this));
    this.engineStreamer.on(AppEvents.APP_SETTING_UPDATED, this.onAppSettingUpdated.bind(this));
    this.engineStreamer.on(AppEvents.APP_REMOVED, this.onAppRemoved.bind(this));
    this.engineStreamer.on(AppEvents.APP_UPDATED, this.onAppUpdated.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_ADDED, this.onCommandAdded.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_DISABLED, this.onCommandDisabled.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_UPDATED, this.onCommandUpdated.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemoved.bind(this));
  }

  onAppAdded(appId) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getManager().loadOne(appId));
      this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
    });
  }

  onAppStatusUpdated({
    appId,
    status
  }) {
    return Promise.asyncApply(() => {
      this.received.set(`${AppEvents.APP_STATUS_CHANGE}_${appId}`, {
        appId,
        status,
        when: new Date()
      });

      if (AppStatusUtils.isEnabled(status)) {
        Promise.await(this.orch.getManager().enable(appId));
        this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
          appId,
          status
        });
      } else if (AppStatusUtils.isDisabled(status)) {
        Promise.await(this.orch.getManager().disable(appId, AppStatus.MANUALLY_DISABLED === status));
        this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
          appId,
          status
        });
      }
    });
  }

  onAppSettingUpdated({
    appId,
    setting
  }) {
    return Promise.asyncApply(() => {
      this.received.set(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`, {
        appId,
        setting,
        when: new Date()
      });
      Promise.await(this.orch.getManager().getSettingsManager().updateAppSetting(appId, setting));
      this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
        appId
      });
    });
  }

  onAppUpdated(appId) {
    return Promise.asyncApply(() => {
      this.received.set(`${AppEvents.APP_UPDATED}_${appId}`, {
        appId,
        when: new Date()
      });
      const storageItem = Promise.await(this.orch.getStorage().retrieveOne(appId));
      Promise.await(this.orch.getManager().update(storageItem.zip));
      this.clientStreamer.emit(AppEvents.APP_UPDATED, appId);
    });
  }

  onAppRemoved(appId) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getManager().remove(appId));
      this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
    });
  }

  onCommandAdded(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
    });
  }

  onCommandDisabled(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
    });
  }

  onCommandUpdated(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
    });
  }

  onCommandRemoved(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
    });
  }

}

class AppServerNotifier {
  constructor(orch) {
    this.engineStreamer = new Meteor.Streamer('apps-engine', {
      retransmit: false
    });
    this.engineStreamer.serverOnly = true;
    this.engineStreamer.allowRead('none');
    this.engineStreamer.allowEmit('all');
    this.engineStreamer.allowWrite('none'); // This is used to broadcast to the web clients

    this.clientStreamer = new Meteor.Streamer('apps', {
      retransmit: false
    });
    this.clientStreamer.serverOnly = true;
    this.clientStreamer.allowRead('all');
    this.clientStreamer.allowEmit('all');
    this.clientStreamer.allowWrite('none');
    this.received = new Map();
    this.listener = new AppServerListener(orch, this.engineStreamer, this.clientStreamer, this.received);
  }

  appAdded(appId) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.APP_ADDED, appId);
      this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
    });
  }

  appRemoved(appId) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.APP_REMOVED, appId);
      this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
    });
  }

  appUpdated(appId) {
    return Promise.asyncApply(() => {
      if (this.received.has(`${AppEvents.APP_UPDATED}_${appId}`)) {
        this.received.delete(`${AppEvents.APP_UPDATED}_${appId}`);
        return;
      }

      this.engineStreamer.emit(AppEvents.APP_UPDATED, appId);
      this.clientStreamer.emit(AppEvents.APP_UPDATED, appId);
    });
  }

  appStatusUpdated(appId, status) {
    return Promise.asyncApply(() => {
      if (this.received.has(`${AppEvents.APP_STATUS_CHANGE}_${appId}`)) {
        const details = this.received.get(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);

        if (details.status === status) {
          this.received.delete(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);
          return;
        }
      }

      this.engineStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
        appId,
        status
      });
      this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
        appId,
        status
      });
    });
  }

  appSettingsChange(appId, setting) {
    return Promise.asyncApply(() => {
      if (this.received.has(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`)) {
        this.received.delete(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`);
        return;
      }

      this.engineStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
        appId,
        setting
      });
      this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
        appId
      });
    });
  }

  commandAdded(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_ADDED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
    });
  }

  commandDisabled(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_DISABLED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
    });
  }

  commandUpdated(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_UPDATED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
    });
  }

  commandRemoved(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_REMOVED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/index.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMethods: () => AppMethods,
  AppsRestApi: () => AppsRestApi,
  AppEvents: () => AppEvents,
  AppServerNotifier: () => AppServerNotifier,
  AppServerListener: () => AppServerListener
});
let AppMethods;
module.watch(require("./methods"), {
  AppMethods(v) {
    AppMethods = v;
  }

}, 0);
let AppsRestApi;
module.watch(require("./rest"), {
  AppsRestApi(v) {
    AppsRestApi = v;
  }

}, 1);
let AppEvents, AppServerNotifier, AppServerListener;
module.watch(require("./websockets"), {
  AppEvents(v) {
    AppEvents = v;
  },

  AppServerNotifier(v) {
    AppServerNotifier = v;
  },

  AppServerListener(v) {
    AppServerListener = v;
  }

}, 2);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"converters":{"messages.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/messages.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessagesConverter: () => AppMessagesConverter
});

class AppMessagesConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(msgId) {
    const msg = RocketChat.models.Messages.getOneById(msgId);
    return this.convertMessage(msg);
  }

  convertMessage(msgObj) {
    if (!msgObj) {
      return undefined;
    }

    const room = this.orch.getConverters().get('rooms').convertById(msgObj.rid);
    let sender;

    if (msgObj.u && msgObj.u._id) {
      sender = this.orch.getConverters().get('users').convertById(msgObj.u._id);

      if (!sender) {
        sender = this.orch.getConverters().get('users').convertToApp(msgObj.u);
      }
    }

    let editor;

    if (msgObj.editedBy) {
      editor = this.orch.getConverters().get('users').convertById(msgObj.editedBy._id);
    }

    const attachments = this._convertAttachmentsToApp(msgObj.attachments);

    return {
      id: msgObj._id,
      room,
      sender,
      text: msgObj.msg,
      createdAt: msgObj.ts,
      updatedAt: msgObj._updatedAt,
      editor,
      editedAt: msgObj.editedAt,
      emoji: msgObj.emoji,
      avatarUrl: msgObj.avatar,
      alias: msgObj.alias,
      customFields: msgObj.customFields,
      attachments
    };
  }

  convertAppMessage(message) {
    if (!message) {
      return undefined;
    }

    const room = RocketChat.models.Rooms.findOneById(message.room.id);

    if (!room) {
      throw new Error('Invalid room provided on the message.');
    }

    let u;

    if (message.sender && message.sender.id) {
      const user = RocketChat.models.Users.findOneById(message.sender.id);

      if (user) {
        u = {
          _id: user._id,
          username: user.username,
          name: user.name
        };
      } else {
        u = {
          _id: message.sender.id,
          username: message.sender.username,
          name: message.sender.name
        };
      }
    }

    let editedBy;

    if (message.editor) {
      const editor = RocketChat.models.Users.findOneById(message.editor.id);
      editedBy = {
        _id: editor._id,
        username: editor.username
      };
    }

    const attachments = this._convertAppAttachments(message.attachments);

    return {
      _id: message.id || Random.id(),
      rid: room._id,
      u,
      msg: message.text,
      ts: message.createdAt || new Date(),
      _updatedAt: message.updatedAt || new Date(),
      editedBy,
      editedAt: message.editedAt,
      emoji: message.emoji,
      avatar: message.avatarUrl,
      alias: message.alias,
      customFields: message.customFields,
      attachments
    };
  }

  _convertAppAttachments(attachments) {
    if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
      return undefined;
    }

    return attachments.map(attachment => {
      return {
        collapsed: attachment.collapsed,
        color: attachment.color,
        text: attachment.text,
        ts: attachment.timestamp,
        message_link: attachment.timestampLink,
        thumb_url: attachment.thumbnailUrl,
        author_name: attachment.author ? attachment.author.name : undefined,
        author_link: attachment.author ? attachment.author.link : undefined,
        author_icon: attachment.author ? attachment.author.icon : undefined,
        title: attachment.title ? attachment.title.value : undefined,
        title_link: attachment.title ? attachment.title.link : undefined,
        title_link_download: attachment.title ? attachment.title.displayDownloadLink : undefined,
        image_url: attachment.imageUrl,
        audio_url: attachment.audioUrl,
        video_url: attachment.videoUrl,
        fields: attachment.fields,
        type: attachment.type,
        description: attachment.description
      };
    }).map(a => {
      Object.keys(a).forEach(k => {
        if (typeof a[k] === 'undefined') {
          delete a[k];
        }
      });
      return a;
    });
  }

  _convertAttachmentsToApp(attachments) {
    if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
      return undefined;
    }

    return attachments.map(attachment => {
      let author;

      if (attachment.author_name || attachment.author_link || attachment.author_icon) {
        author = {
          name: attachment.author_name,
          link: attachment.author_link,
          icon: attachment.author_icon
        };
      }

      let title;

      if (attachment.title || attachment.title_link || attachment.title_link_download) {
        title = {
          value: attachment.title,
          link: attachment.title_link,
          displayDownloadLink: attachment.title_link_download
        };
      }

      return {
        collapsed: attachment.collapsed,
        color: attachment.color,
        text: attachment.text,
        timestamp: attachment.ts,
        timestampLink: attachment.message_link,
        thumbnailUrl: attachment.thumb_url,
        author,
        title,
        imageUrl: attachment.image_url,
        audioUrl: attachment.audio_url,
        videoUrl: attachment.video_url,
        fields: attachment.fields,
        type: attachment.type,
        description: attachment.description
      };
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/rooms.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRoomsConverter: () => AppRoomsConverter
});
let RoomType;
module.watch(require("@rocket.chat/apps-ts-definition/rooms"), {
  RoomType(v) {
    RoomType = v;
  }

}, 0);

class AppRoomsConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(roomId) {
    const room = RocketChat.models.Rooms.findOneById(roomId);
    return this.convertRoom(room);
  }

  convertByName(roomName) {
    const room = RocketChat.models.Rooms.findOneByName(roomName);
    return this.convertRoom(room);
  }

  convertAppRoom(room) {
    if (!room) {
      return undefined;
    }

    let u;

    if (room.creator) {
      const creator = RocketChat.models.Users.findOneById(room.creator.id);
      u = {
        _id: creator._id,
        username: creator.username
      };
    }

    return {
      _id: room.id,
      fname: room.displayName,
      name: room.slugifiedName,
      t: room.type,
      u,
      usernames: room.usernames,
      default: typeof room.isDefault === 'undefined' ? false : room.isDefault,
      ro: typeof room.isReadOnly === 'undefined' ? false : room.isReadOnly,
      sysMes: typeof room.displaySystemMessages === 'undefined' ? true : room.displaySystemMessages,
      msgs: room.messageCount || 0,
      ts: room.createdAt,
      _updatedAt: room.updatedAt,
      lm: room.lastModifiedAt
    };
  }

  convertRoom(room) {
    if (!room) {
      return undefined;
    }

    let creator;

    if (room.u) {
      creator = this.orch.getConverters().get('users').convertById(room.u._id);
    }

    return {
      id: room._id,
      displayName: room.fname,
      slugifiedName: room.name,
      type: this._convertTypeToApp(room.t),
      creator,
      usernames: room.usernames,
      isDefault: typeof room.default === 'undefined' ? false : room.default,
      isReadOnly: typeof room.ro === 'undefined' ? false : room.ro,
      displaySystemMessages: typeof room.sysMes === 'undefined' ? true : room.sysMes,
      messageCount: room.msgs,
      createdAt: room.ts,
      updatedAt: room._updatedAt,
      lastModifiedAt: room.lm,
      customFields: {}
    };
  }

  _convertTypeToApp(typeChar) {
    switch (typeChar) {
      case 'c':
        return RoomType.CHANNEL;

      case 'p':
        return RoomType.PRIVATE_GROUP;

      case 'd':
        return RoomType.DIRECT_MESSAGE;

      case 'lc':
        return RoomType.LIVE_CHAT;

      default:
        return typeChar;
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/settings.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppSettingsConverter: () => AppSettingsConverter
});
let SettingType;
module.watch(require("@rocket.chat/apps-ts-definition/settings"), {
  SettingType(v) {
    SettingType = v;
  }

}, 0);

class AppSettingsConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(settingId) {
    const setting = RocketChat.models.Settings.findOneById(settingId);
    return this.convertToApp(setting);
  }

  convertToApp(setting) {
    return {
      id: setting._id,
      type: this._convertTypeToApp(setting.type),
      packageValue: setting.packageValue,
      values: setting.values,
      value: setting.value,
      public: setting.public,
      hidden: setting.hidden,
      group: setting.group,
      i18nLabel: setting.i18nLabel,
      i18nDescription: setting.i18nDescription,
      createdAt: setting.ts,
      updatedAt: setting._updatedAt
    };
  }

  _convertTypeToApp(type) {
    switch (type) {
      case 'boolean':
        return SettingType.BOOLEAN;

      case 'code':
        return SettingType.CODE;

      case 'color':
        return SettingType.COLOR;

      case 'font':
        return SettingType.FONT;

      case 'int':
        return SettingType.NUMBER;

      case 'select':
        return SettingType.SELECT;

      case 'string':
        return SettingType.STRING;

      default:
        return type;
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/users.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppUsersConverter: () => AppUsersConverter
});
let UserStatusConnection, UserType;
module.watch(require("@rocket.chat/apps-ts-definition/users"), {
  UserStatusConnection(v) {
    UserStatusConnection = v;
  },

  UserType(v) {
    UserType = v;
  }

}, 0);

class AppUsersConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(userId) {
    const user = RocketChat.models.Users.findOneById(userId);
    return this.convertToApp(user);
  }

  convertByUsername(username) {
    const user = RocketChat.models.Users.findOneByUsername(username);
    return this.convertToApp(user);
  }

  convertToApp(user) {
    if (!user) {
      return undefined;
    }

    const type = this._convertUserTypeToEnum(user.type);

    const statusConnection = this._convertStatusConnectionToEnum(user.username, user._id, user.statusConnection);

    return {
      id: user._id,
      username: user.username,
      emails: user.emails,
      type,
      isEnabled: user.active,
      name: user.name,
      roles: user.roles,
      status: user.status,
      statusConnection,
      utcOffset: user.utcOffset,
      createdAt: user.createdAt,
      updatedAt: user._updatedAt,
      lastLoginAt: user.lastLogin
    };
  }

  _convertUserTypeToEnum(type) {
    switch (type) {
      case 'user':
        return UserType.USER;

      case 'bot':
        return UserType.BOT;

      case '':
      case undefined:
        return UserType.UNKNOWN;

      default:
        console.warn(`A new user type has been added that the Apps don't know about? "${type}"`);
        return type.toUpperCase();
    }
  }

  _convertStatusConnectionToEnum(username, userId, status) {
    switch (status) {
      case 'offline':
        return UserStatusConnection.OFFLINE;

      case 'online':
        return UserStatusConnection.ONLINE;

      case 'away':
        return UserStatusConnection.AWAY;

      case 'busy':
        return UserStatusConnection.BUSY;

      case undefined:
        // This is needed for Livechat guests and Rocket.Cat user.
        return UserStatusConnection.UNDEFINED;

      default:
        console.warn(`The user ${username} (${userId}) does not have a valid status (offline, online, away, or busy). It is currently: "${status}"`);
        return !status ? UserStatusConnection.OFFLINE : status.toUpperCase();
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/index.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessagesConverter: () => AppMessagesConverter,
  AppRoomsConverter: () => AppRoomsConverter,
  AppSettingsConverter: () => AppSettingsConverter,
  AppUsersConverter: () => AppUsersConverter
});
let AppMessagesConverter;
module.watch(require("./messages"), {
  AppMessagesConverter(v) {
    AppMessagesConverter = v;
  }

}, 0);
let AppRoomsConverter;
module.watch(require("./rooms"), {
  AppRoomsConverter(v) {
    AppRoomsConverter = v;
  }

}, 1);
let AppSettingsConverter;
module.watch(require("./settings"), {
  AppSettingsConverter(v) {
    AppSettingsConverter = v;
  }

}, 2);
let AppUsersConverter;
module.watch(require("./users"), {
  AppUsersConverter(v) {
    AppUsersConverter = v;
  }

}, 3);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"orchestrator.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/orchestrator.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let RealAppBridges;
module.watch(require("./bridges"), {
  RealAppBridges(v) {
    RealAppBridges = v;
  }

}, 0);
let AppMethods, AppsRestApi, AppServerNotifier;
module.watch(require("./communication"), {
  AppMethods(v) {
    AppMethods = v;
  },

  AppsRestApi(v) {
    AppsRestApi = v;
  },

  AppServerNotifier(v) {
    AppServerNotifier = v;
  }

}, 1);
let AppMessagesConverter, AppRoomsConverter, AppSettingsConverter, AppUsersConverter;
module.watch(require("./converters"), {
  AppMessagesConverter(v) {
    AppMessagesConverter = v;
  },

  AppRoomsConverter(v) {
    AppRoomsConverter = v;
  },

  AppSettingsConverter(v) {
    AppSettingsConverter = v;
  },

  AppUsersConverter(v) {
    AppUsersConverter = v;
  }

}, 2);
let AppsLogsModel, AppsModel, AppsPersistenceModel, AppRealStorage, AppRealLogsStorage;
module.watch(require("./storage"), {
  AppsLogsModel(v) {
    AppsLogsModel = v;
  },

  AppsModel(v) {
    AppsModel = v;
  },

  AppsPersistenceModel(v) {
    AppsPersistenceModel = v;
  },

  AppRealStorage(v) {
    AppRealStorage = v;
  },

  AppRealLogsStorage(v) {
    AppRealLogsStorage = v;
  }

}, 3);
let AppManager;
module.watch(require("@rocket.chat/apps-engine/server/AppManager"), {
  AppManager(v) {
    AppManager = v;
  }

}, 4);

class AppServerOrchestrator {
  constructor() {
    if (RocketChat.models && RocketChat.models.Permissions) {
      RocketChat.models.Permissions.createOrUpdate('manage-apps', ['admin']);
    }

    this._model = new AppsModel();
    this._logModel = new AppsLogsModel();
    this._persistModel = new AppsPersistenceModel();
    this._storage = new AppRealStorage(this._model);
    this._logStorage = new AppRealLogsStorage(this._logModel);
    this._converters = new Map();

    this._converters.set('messages', new AppMessagesConverter(this));

    this._converters.set('rooms', new AppRoomsConverter(this));

    this._converters.set('settings', new AppSettingsConverter(this));

    this._converters.set('users', new AppUsersConverter(this));

    this._bridges = new RealAppBridges(this);
    this._manager = new AppManager(this._storage, this._logStorage, this._bridges);
    this._communicators = new Map();

    this._communicators.set('methods', new AppMethods(this));

    this._communicators.set('notifier', new AppServerNotifier(this));

    this._communicators.set('restapi', new AppsRestApi(this, this._manager));
  }

  getModel() {
    return this._model;
  }

  getPersistenceModel() {
    return this._persistModel;
  }

  getStorage() {
    return this._storage;
  }

  getLogStorage() {
    return this._logStorage;
  }

  getConverters() {
    return this._converters;
  }

  getBridges() {
    return this._bridges;
  }

  getNotifier() {
    return this._communicators.get('notifier');
  }

  getManager() {
    return this._manager;
  }

  isEnabled() {
    return RocketChat.settings.get('Apps_Framework_enabled');
  }

  isLoaded() {
    return this.getManager().areAppsLoaded();
  }

  load() {
    // Don't try to load it again if it has
    // already been loaded
    if (this.isLoaded()) {
      return;
    }

    this._manager.load().then(affs => console.log(`Loaded the Apps Framework and loaded a total of ${affs.length} Apps!`)).catch(err => console.warn('Failed to load the Apps Framework and Apps!', err));
  }

  unload() {
    // Don't try to unload it if it's already been
    // unlaoded or wasn't unloaded to start with
    if (!this.isLoaded()) {
      return;
    }

    this._manager.unload().then(() => console.log('Unloaded the Apps Framework.')).catch(err => console.warn('Failed to unload the Apps Framework!', err));
  }

}

RocketChat.settings.add('Apps_Framework_enabled', false, {
  type: 'boolean',
  hidden: true
});
RocketChat.settings.get('Apps_Framework_enabled', (key, isEnabled) => {
  // In case this gets called before `Meteor.startup`
  if (!global.Apps) {
    return;
  }

  if (isEnabled) {
    global.Apps.load();
  } else {
    global.Apps.unload();
  }
});
Meteor.startup(function _appServerOrchestrator() {
  global.Apps = new AppServerOrchestrator();

  if (global.Apps.isEnabled()) {
    global.Apps.load();
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"@rocket.chat":{"apps-engine":{"server":{"storage":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/storage/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppLogStorage_1 = require("./AppLogStorage");
exports.AppLogStorage = AppLogStorage_1.AppLogStorage;
const AppStorage_1 = require("./AppStorage");
exports.AppStorage = AppStorage_1.AppStorage;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"logging":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/logging/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppConsole_1 = require("./AppConsole");
exports.AppConsole = AppConsole_1.AppConsole;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"bridges":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/bridges/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppBridges_1 = require("./AppBridges");
exports.AppBridges = AppBridges_1.AppBridges;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"AppManager.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/AppManager.js                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bridges_1 = require("./bridges");
const compiler_1 = require("./compiler");
const managers_1 = require("./managers");
const DisabledApp_1 = require("./misc/DisabledApp");
const ProxiedApp_1 = require("./ProxiedApp");
const storage_1 = require("./storage");
const AppStatus_1 = require("@rocket.chat/apps-ts-definition/AppStatus");
const metadata_1 = require("@rocket.chat/apps-ts-definition/metadata");
class AppManager {
    constructor(rlStorage, logStorage, rlBridges) {
        // Singleton style. There can only ever be one AppManager instance
        if (typeof AppManager.Instance !== 'undefined') {
            throw new Error('There is already a valid AppManager instance.');
        }
        if (rlStorage instanceof storage_1.AppStorage) {
            this.storage = rlStorage;
        }
        else {
            throw new Error('Invalid instance of the AppStorage.');
        }
        if (logStorage instanceof storage_1.AppLogStorage) {
            this.logStorage = logStorage;
        }
        else {
            throw new Error('Invalid instance of the AppLogStorage.');
        }
        if (rlBridges instanceof bridges_1.AppBridges) {
            this.bridges = rlBridges;
        }
        else {
            throw new Error('Invalid instance of the AppBridges');
        }
        this.apps = new Map();
        this.parser = new compiler_1.AppPackageParser();
        this.compiler = new compiler_1.AppCompiler();
        this.accessorManager = new managers_1.AppAccessorManager(this);
        this.listenerManager = new managers_1.AppListenerManger(this);
        this.commandManager = new managers_1.AppSlashCommandManager(this);
        this.settingsManager = new managers_1.AppSettingsManager(this);
        this.isLoaded = false;
        AppManager.Instance = this;
    }
    /** Gets the instance of the storage connector. */
    getStorage() {
        return this.storage;
    }
    /** Gets the instance of the log storage connector. */
    getLogStorage() {
        return this.logStorage;
    }
    /** Gets the instance of the App package parser. */
    getParser() {
        return this.parser;
    }
    /** Gets the compiler instance. */
    getCompiler() {
        return this.compiler;
    }
    /** Gets the accessor manager instance. */
    getAccessorManager() {
        return this.accessorManager;
    }
    /** Gets the instance of the Bridge manager. */
    getBridges() {
        return this.bridges;
    }
    /** Gets the instance of the listener manager. */
    getListenerManager() {
        return this.listenerManager;
    }
    /** Gets the command manager's instance. */
    getCommandManager() {
        return this.commandManager;
    }
    /** Gets the manager of the settings, updates and getting. */
    getSettingsManager() {
        return this.settingsManager;
    }
    /** Gets whether the Apps have been loaded or not. */
    areAppsLoaded() {
        return this.isLoaded;
    }
    /**
     * Goes through the entire loading up process.
     * Expect this to take some time, as it goes through a very
     * long process of loading all the Apps up.
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            // You can not load the AppManager system again
            // if it has already been loaded.
            if (this.isLoaded) {
                return;
            }
            const items = yield this.storage.retrieveAll();
            const affs = new Array();
            for (const item of items.values()) {
                const aff = new compiler_1.AppFabricationFulfillment();
                try {
                    const result = yield this.getParser().parseZip(this.getCompiler(), item.zip);
                    aff.setAppInfo(result.info);
                    aff.setImplementedInterfaces(result.implemented.getValues());
                    aff.setCompilerErrors(result.compilerErrors);
                    if (result.compilerErrors.length > 0) {
                        throw new Error(`Failed to compile due to ${result.compilerErrors.length} errors.`);
                    }
                    item.compiled = result.compiledFiles;
                    const app = this.getCompiler().toSandBox(this, item);
                    this.apps.set(item.id, app);
                    aff.setApp(app);
                }
                catch (e) {
                    console.warn(`Error while compiling the App "${item.info.name} (${item.id})":`);
                    console.error(e);
                    const app = DisabledApp_1.DisabledApp.createNew(item.info, AppStatus_1.AppStatus.COMPILER_ERROR_DISABLED);
                    app.getLogger().error(e);
                    this.logStorage.storeEntries(app.getID(), app.getLogger());
                    const prl = new ProxiedApp_1.ProxiedApp(this, item, app, () => '');
                    this.apps.set(item.id, prl);
                    aff.setApp(prl);
                }
                affs.push(aff);
            }
            // Let's initialize them
            for (const rl of this.apps.values()) {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    // Usually if an App is disabled before it's initialized,
                    // then something (such as an error) occured while
                    // it was compiled or something similar.
                    continue;
                }
                yield this.initializeApp(items.get(rl.getID()), rl, true);
            }
            // Let's ensure the required settings are all set
            for (const rl of this.apps.values()) {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    continue;
                }
                if (!this.areRequiredSettingsSet(rl.getStorageItem())) {
                    yield rl.setStatus(AppStatus_1.AppStatus.INVALID_SETTINGS_DISABLED);
                }
            }
            // Now let's enable the apps which were once enabled
            // but are not currently disabled.
            for (const rl of this.apps.values()) {
                if (!AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus()) && AppStatus_1.AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
                    yield this.enableApp(items.get(rl.getID()), rl, true, rl.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED);
                }
            }
            this.isLoaded = true;
            return affs;
        });
    }
    unload(isManual) {
        return __awaiter(this, void 0, void 0, function* () {
            // If the AppManager hasn't been loaded yet, then
            // there is nothing to unload
            if (!this.isLoaded) {
                return;
            }
            for (const rl of this.apps.values()) {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    continue;
                }
                else if (rl.getStatus() === AppStatus_1.AppStatus.INITIALIZED) {
                    this.listenerManager.unregisterListeners(rl);
                    this.commandManager.unregisterCommands(rl.getID());
                    this.accessorManager.purifyApp(rl.getID());
                    continue;
                }
                yield this.disable(rl.getID(), isManual);
            }
            // Remove all the apps from the system now that we have unloaded everything
            this.apps.clear();
            this.isLoaded = false;
        });
    }
    /** Gets the Apps which match the filter passed in. */
    get(filter) {
        let rls = new Array();
        if (typeof filter === 'undefined') {
            this.apps.forEach((rl) => rls.push(rl));
            return rls;
        }
        let nothing = true;
        if (typeof filter.enabled === 'boolean' && filter.enabled) {
            this.apps.forEach((rl) => {
                if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    rls.push(rl);
                }
            });
            nothing = false;
        }
        if (typeof filter.disabled === 'boolean' && filter.disabled) {
            this.apps.forEach((rl) => {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    rls.push(rl);
                }
            });
            nothing = false;
        }
        if (nothing) {
            this.apps.forEach((rl) => rls.push(rl));
        }
        if (typeof filter.ids !== 'undefined') {
            rls = rls.filter((rl) => filter.ids.includes(rl.getID()));
        }
        if (typeof filter.name === 'string') {
            rls = rls.filter((rl) => rl.getName() === filter.name);
        }
        else if (filter.name instanceof RegExp) {
            rls = rls.filter((rl) => filter.name.test(rl.getName()));
        }
        return rls;
    }
    /** Gets a single App by the id passed in. */
    getOneById(appId) {
        return this.apps.get(appId);
    }
    enable(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const rl = this.apps.get(id);
            if (!rl) {
                throw new Error(`No App by the id "${id}" exists.`);
            }
            if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                throw new Error('The App is already enabled.');
            }
            if (rl.getStatus() === AppStatus_1.AppStatus.COMPILER_ERROR_DISABLED) {
                throw new Error('The App had compiler errors, can not enable it.');
            }
            const storageItem = yield this.storage.retrieveOne(id);
            if (!storageItem) {
                throw new Error(`Could not enable an App with the id of "${id}" as it doesn't exist.`);
            }
            const isSetup = yield this.runStartUpProcess(storageItem, rl, true, false);
            if (isSetup) {
                storageItem.status = rl.getStatus();
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                this.storage.update(storageItem);
            }
            return isSetup;
        });
    }
    disable(id, isManual = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const rl = this.apps.get(id);
            if (!rl) {
                throw new Error(`No App by the id "${id}" exists.`);
            }
            if (!AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                throw new Error(`No App by the id of "${id}" is enabled."`);
            }
            const storageItem = yield this.storage.retrieveOne(id);
            if (!storageItem) {
                throw new Error(`Could not disable an App with the id of "${id}" as it doesn't exist.`);
            }
            try {
                yield rl.call(metadata_1.AppMethod.ONDISABLE, this.accessorManager.getConfigurationModify(storageItem.id));
            }
            catch (e) {
                console.warn('Error while disabling:', e);
            }
            this.listenerManager.unregisterListeners(rl);
            this.commandManager.unregisterCommands(storageItem.id);
            this.accessorManager.purifyApp(storageItem.id);
            if (isManual) {
                yield rl.setStatus(AppStatus_1.AppStatus.MANUALLY_DISABLED);
            }
            // This is async, but we don't care since it only updates in the database
            // and it should not mutate any properties we care about
            storageItem.status = rl.getStatus();
            this.storage.update(storageItem);
            return true;
        });
    }
    add(zipContentsBase64d, enable = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const aff = new compiler_1.AppFabricationFulfillment();
            const result = yield this.getParser().parseZip(this.getCompiler(), zipContentsBase64d);
            aff.setAppInfo(result.info);
            aff.setImplementedInterfaces(result.implemented.getValues());
            aff.setCompilerErrors(result.compilerErrors);
            if (result.compilerErrors.length > 0) {
                return aff;
            }
            const created = yield this.storage.create({
                id: result.info.id,
                info: result.info,
                status: AppStatus_1.AppStatus.UNKNOWN,
                zip: zipContentsBase64d,
                compiled: result.compiledFiles,
                languageContent: result.languageContent,
                settings: {},
                implemented: result.implemented.getValues(),
            });
            if (!created) {
                throw new Error('Failed to create the App, the storage did not return it.');
            }
            // Now that is has all been compiled, let's get the
            // the App instance from the source.
            const app = this.getCompiler().toSandBox(this, created);
            this.apps.set(app.getID(), app);
            aff.setApp(app);
            // Let everyone know that the App has been added
            try {
                yield this.bridges.getAppActivationBridge().appAdded(app);
            }
            catch (e) {
                // If an error occurs during this, oh well.
            }
            // Should enable === true, then we go through the entire start up process
            // Otherwise, we only initialize it.
            if (enable) {
                // Start up the app
                yield this.runStartUpProcess(created, app, false, false);
            }
            else {
                yield this.initializeApp(created, app, true);
            }
            return aff;
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.apps.get(id);
            if (AppStatus_1.AppStatusUtils.isEnabled(app.getStatus())) {
                yield this.disable(id);
            }
            this.listenerManager.unregisterListeners(app);
            this.commandManager.unregisterCommands(app.getID());
            this.accessorManager.purifyApp(app.getID());
            yield this.bridges.getPersistenceBridge().purge(app.getID());
            yield this.logStorage.removeEntriesFor(app.getID());
            yield this.storage.remove(app.getID());
            // Let everyone know that the App has been removed
            try {
                yield this.bridges.getAppActivationBridge().appRemoved(app);
            }
            catch (e) {
                // If an error occurs during this, oh well.
            }
            this.apps.delete(app.getID());
            return app;
        });
    }
    update(zipContentsBase64d) {
        return __awaiter(this, void 0, void 0, function* () {
            const aff = new compiler_1.AppFabricationFulfillment();
            const result = yield this.getParser().parseZip(this.getCompiler(), zipContentsBase64d);
            aff.setAppInfo(result.info);
            aff.setImplementedInterfaces(result.implemented.getValues());
            aff.setCompilerErrors(result.compilerErrors);
            if (result.compilerErrors.length > 0) {
                return aff;
            }
            const old = yield this.storage.retrieveOne(result.info.id);
            if (!old) {
                throw new Error('Can not update an App that does not currently exist.');
            }
            // Attempt to disable it, if it wasn't enabled then it will error and we don't care
            try {
                yield this.disable(old.id);
            }
            catch (e) {
                // We don't care
            }
            // TODO: We could show what new interfaces have been added
            const stored = yield this.storage.update({
                createdAt: old.createdAt,
                id: result.info.id,
                info: result.info,
                status: this.apps.get(old.id).getStatus(),
                zip: zipContentsBase64d,
                compiled: result.compiledFiles,
                languageContent: result.languageContent,
                settings: old.settings,
                implemented: result.implemented.getValues(),
            });
            // Now that is has all been compiled, let's get the
            // the App instance from the source.
            const app = this.getCompiler().toSandBox(this, stored);
            // Store it temporarily so we can access it else where
            this.apps.set(app.getID(), app);
            aff.setApp(app);
            // Start up the app
            yield this.runStartUpProcess(stored, app, false, true);
            // Let everyone know that the App has been updated
            try {
                yield this.bridges.getAppActivationBridge().appUpdated(app);
            }
            catch (e) {
                // If an error occurs during this, oh well.
            }
            return aff;
        });
    }
    getLanguageContent() {
        const langs = {};
        this.apps.forEach((rl) => {
            const content = rl.getStorageItem().languageContent;
            Object.keys(content).forEach((key) => {
                langs[key] = Object.assign(langs[key] || {}, content[key]);
            });
        });
        return langs;
    }
    changeStatus(appId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (status) {
                case AppStatus_1.AppStatus.MANUALLY_DISABLED:
                case AppStatus_1.AppStatus.MANUALLY_ENABLED:
                    break;
                default:
                    throw new Error('Invalid status to change an App to, must be manually disabled or enabled.');
            }
            const rl = this.apps.get(appId);
            if (!rl) {
                throw new Error('Can not change the status of an App which does not currently exist.');
            }
            if (AppStatus_1.AppStatusUtils.isEnabled(status)) {
                // Then enable it
                if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    throw new Error('Can not enable an App which is already enabled.');
                }
                yield this.enable(rl.getID());
            }
            else {
                if (!AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    throw new Error('Can not disable an App which is not enabled.');
                }
                yield this.disable(rl.getID(), true);
            }
            return rl;
        });
    }
    /**
     * Goes through the entire loading up process. WARNING: Do not use. ;)
     *
     * @param appId the id of the application to load
     */
    loadOne(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.storage.retrieveOne(appId);
            if (!item) {
                throw new Error(`No App found by the id of: "${appId}"`);
            }
            this.apps.set(item.id, this.getCompiler().toSandBox(this, item));
            const rl = this.apps.get(item.id);
            yield this.initializeApp(item, rl, false);
            if (!this.areRequiredSettingsSet(item)) {
                yield rl.setStatus(AppStatus_1.AppStatus.INVALID_SETTINGS_DISABLED);
            }
            if (!AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus()) && AppStatus_1.AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
                yield this.enableApp(item, rl, false, rl.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED);
            }
            return this.apps.get(item.id);
        });
    }
    runStartUpProcess(storageItem, app, isManual, silenceStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            if (app.getStatus() !== AppStatus_1.AppStatus.INITIALIZED) {
                const isInitialized = yield this.initializeApp(storageItem, app, true, silenceStatus);
                if (!isInitialized) {
                    return false;
                }
            }
            if (!this.areRequiredSettingsSet(storageItem)) {
                yield app.setStatus(AppStatus_1.AppStatus.INVALID_SETTINGS_DISABLED, silenceStatus);
                return false;
            }
            const isEnabled = yield this.enableApp(storageItem, app, true, isManual, silenceStatus);
            if (!isEnabled) {
                return false;
            }
            return true;
        });
    }
    initializeApp(storageItem, app, saveToDb = true, silenceStatus = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            const configExtend = this.getAccessorManager().getConfigurationExtend(storageItem.id);
            const envRead = this.getAccessorManager().getEnvironmentRead(storageItem.id);
            try {
                yield app.call(metadata_1.AppMethod.INITIALIZE, configExtend, envRead);
                result = true;
                yield app.setStatus(AppStatus_1.AppStatus.INITIALIZED, silenceStatus);
            }
            catch (e) {
                if (e.name === 'NotEnoughMethodArgumentsError') {
                    console.warn('Please report the following error:');
                }
                console.error(e);
                this.commandManager.unregisterCommands(storageItem.id);
                result = false;
                yield app.setStatus(AppStatus_1.AppStatus.ERROR_DISABLED, silenceStatus);
            }
            if (saveToDb) {
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                storageItem.status = app.getStatus();
                this.storage.update(storageItem);
            }
            return result;
        });
    }
    /**
     * Determines if the App's required settings are set or not.
     * Should a packageValue be provided and not empty, then it's considered set.
     */
    areRequiredSettingsSet(storageItem) {
        let result = true;
        for (const setk of Object.keys(storageItem.settings)) {
            const sett = storageItem.settings[setk];
            // If it's not required, ignore
            if (!sett.required) {
                continue;
            }
            if (sett.value !== 'undefined' || sett.packageValue !== 'undefined') {
                continue;
            }
            result = false;
        }
        return result;
    }
    enableApp(storageItem, app, saveToDb = true, isManual, silenceStatus = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let enable;
            try {
                enable = (yield app.call(metadata_1.AppMethod.ONENABLE, this.getAccessorManager().getEnvironmentRead(storageItem.id), this.getAccessorManager().getConfigurationModify(storageItem.id)));
                yield app.setStatus(isManual ? AppStatus_1.AppStatus.MANUALLY_ENABLED : AppStatus_1.AppStatus.AUTO_ENABLED, silenceStatus);
            }
            catch (e) {
                enable = false;
                if (e.name === 'NotEnoughMethodArgumentsError') {
                    console.warn('Please report the following error:');
                }
                console.error(e);
                yield app.setStatus(AppStatus_1.AppStatus.ERROR_DISABLED, silenceStatus);
            }
            if (enable) {
                this.commandManager.registerCommands(app.getID());
                this.listenerManager.registerListeners(app);
            }
            else {
                this.commandManager.unregisterCommands(app.getID());
            }
            if (saveToDb) {
                storageItem.status = app.getStatus();
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                this.storage.update(storageItem);
            }
            return enable;
        });
    }
}
exports.AppManager = AppManager;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"apps-ts-definition":{"slashcommands":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/slashcommands/index.js            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ISlashCommandPreview_1 = require("./ISlashCommandPreview");
exports.SlashCommandPreviewItemType = ISlashCommandPreview_1.SlashCommandPreviewItemType;
const SlashCommandContext_1 = require("./SlashCommandContext");
exports.SlashCommandContext = SlashCommandContext_1.SlashCommandContext;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"rooms":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/rooms/index.js                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RoomType_1 = require("./RoomType");
exports.RoomType = RoomType_1.RoomType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"AppStatus.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/AppStatus.js                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AppStatus;
(function (AppStatus) {
    /** The status is known, aka not been constructed the proper way. */
    AppStatus["UNKNOWN"] = "unknown";
    /** The App has been constructed but that's it. */
    AppStatus["CONSTRUCTED"] = "constructed";
    /** The App's `initialize()` was called and returned true. */
    AppStatus["INITIALIZED"] = "initialized";
    /** The App's `onEnable()` was called, returned true, and this was done automatically (system start up). */
    AppStatus["AUTO_ENABLED"] = "auto_enabled";
    /** The App's `onEnable()` was called, returned true, and this was done by the user such as installing a new one. */
    AppStatus["MANUALLY_ENABLED"] = "manually_enabled";
    /**
     * The App was disabled due to an error while attempting to compile it.
     * An attempt to enable it again will fail, as it needs to be updated.
     */
    AppStatus["COMPILER_ERROR_DISABLED"] = "compiler_error_disabled";
    /** The App was disabled due to an unrecoverable error being thrown. */
    AppStatus["ERROR_DISABLED"] = "error_disabled";
    /** The App was manually disabled by a user. */
    AppStatus["MANUALLY_DISABLED"] = "manually_disabled";
    AppStatus["INVALID_SETTINGS_DISABLED"] = "invalid_settings_disabled";
    /** The App was disabled due to other circumstances. */
    AppStatus["DISABLED"] = "disabled";
})(AppStatus = exports.AppStatus || (exports.AppStatus = {}));
class AppStatusUtilsDef {
    isEnabled(status) {
        switch (status) {
            case AppStatus.AUTO_ENABLED:
            case AppStatus.MANUALLY_ENABLED:
                return true;
            default:
                return false;
        }
    }
    isDisabled(status) {
        switch (status) {
            case AppStatus.COMPILER_ERROR_DISABLED:
            case AppStatus.ERROR_DISABLED:
            case AppStatus.MANUALLY_DISABLED:
            case AppStatus.INVALID_SETTINGS_DISABLED:
            case AppStatus.DISABLED:
                return true;
            default:
                return false;
        }
    }
}
exports.AppStatusUtilsDef = AppStatusUtilsDef;
exports.AppStatusUtils = new AppStatusUtilsDef();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/settings/index.js                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SettingType_1 = require("./SettingType");
exports.SettingType = SettingType_1.SettingType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/users/index.js                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserStatusConnection_1 = require("./UserStatusConnection");
exports.UserStatusConnection = UserStatusConnection_1.UserStatusConnection;
const UserType_1 = require("./UserType");
exports.UserType = UserType_1.UserType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:apps/lib/Apps.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-logs-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-persistence-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/storage.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/index.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/activation.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/bridges.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/commands.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/environmental.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/messages.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/persistence.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/rooms.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/settings.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/users.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/index.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/methods.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/rest.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/websockets.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/index.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/messages.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/rooms.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/settings.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/users.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/index.js");
require("/node_modules/meteor/rocketchat:apps/server/orchestrator.js");

/* Exports */
Package._define("rocketchat:apps", {
  Apps: Apps
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_apps.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL2xpYi9BcHBzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvYXBwcy1sb2dzLW1vZGVsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvYXBwcy1tb2RlbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9zdG9yYWdlL2FwcHMtcGVyc2lzdGVuY2UtbW9kZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvc3RvcmFnZS9zdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvc3RvcmFnZS9sb2dzLXN0b3JhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9hY3RpdmF0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvYnJpZGdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL2NvbW1hbmRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvZW52aXJvbm1lbnRhbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL21lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvcGVyc2lzdGVuY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9yb29tcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvdXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL2RldGFpbHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9odHRwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvbGlzdGVuZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbW11bmljYXRpb24vbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb21tdW5pY2F0aW9uL3Jlc3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29tbXVuaWNhdGlvbi93ZWJzb2NrZXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbW11bmljYXRpb24vaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29udmVydGVycy9tZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb252ZXJ0ZXJzL3Jvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbnZlcnRlcnMvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29udmVydGVycy91c2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb252ZXJ0ZXJzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL29yY2hlc3RyYXRvci5qcyJdLCJuYW1lcyI6WyJBcHBzIiwibW9kdWxlIiwiZXhwb3J0IiwiQXBwc0xvZ3NNb2RlbCIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwiQXBwc01vZGVsIiwiQXBwc1BlcnNpc3RlbmNlTW9kZWwiLCJBcHBSZWFsU3RvcmFnZSIsIkFwcFN0b3JhZ2UiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiZGF0YSIsImRiIiwiY3JlYXRlIiwiaXRlbSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY3JlYXRlZEF0IiwiRGF0ZSIsInVwZGF0ZWRBdCIsImRvYyIsImZpbmRPbmUiLCIkb3IiLCJpZCIsImluZm8iLCJuYW1lU2x1ZyIsImUiLCJFcnJvciIsImluc2VydCIsIl9pZCIsInJldHJpZXZlT25lIiwicmV0cmlldmVBbGwiLCJkb2NzIiwiZmluZCIsImZldGNoIiwiaXRlbXMiLCJNYXAiLCJmb3JFYWNoIiwiaSIsInNldCIsInVwZGF0ZSIsInRoZW4iLCJ1cGRhdGVkIiwiY2F0Y2giLCJlcnIiLCJyZW1vdmUiLCJzdWNjZXNzIiwiQXBwUmVhbExvZ3NTdG9yYWdlIiwiQXBwQ29uc29sZSIsIkFwcExvZ1N0b3JhZ2UiLCJtb2RlbCIsImFyZ3VtZW50cyIsInN0b3JlRW50cmllcyIsImFwcElkIiwibG9nZ2VyIiwidG9TdG9yYWdlRW50cnkiLCJmaW5kT25lQnlJZCIsImdldEVudHJpZXNGb3IiLCJyZW1vdmVFbnRyaWVzRm9yIiwiQXBwQWN0aXZhdGlvbkJyaWRnZSIsIm9yY2giLCJhcHBBZGRlZCIsImFwcCIsImdldE5vdGlmaWVyIiwiZ2V0SUQiLCJhcHBVcGRhdGVkIiwiYXBwUmVtb3ZlZCIsImFwcFN0YXR1c0NoYW5nZWQiLCJzdGF0dXMiLCJhcHBTdGF0dXNVcGRhdGVkIiwiUmVhbEFwcEJyaWRnZXMiLCJBcHBCcmlkZ2VzIiwiQXBwRGV0YWlsQ2hhbmdlc0JyaWRnZSIsIkFwcENvbW1hbmRzQnJpZGdlIiwiQXBwRW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlIiwiQXBwSHR0cEJyaWRnZSIsIkFwcExpc3RlbmVyQnJpZGdlIiwiQXBwTWVzc2FnZUJyaWRnZSIsIkFwcFBlcnNpc3RlbmNlQnJpZGdlIiwiQXBwUm9vbUJyaWRnZSIsIkFwcFNldHRpbmdCcmlkZ2UiLCJBcHBVc2VyQnJpZGdlIiwiX2FjdEJyaWRnZSIsIl9jbWRCcmlkZ2UiLCJfZGV0QnJpZGdlIiwiX2VudkJyaWRnZSIsIl9odHRwQnJpZGdlIiwiX2xpc25CcmlkZ2UiLCJfbXNnQnJpZGdlIiwiX3BlcnNpc3RCcmlkZ2UiLCJfcm9vbUJyaWRnZSIsIl9zZXRzQnJpZGdlIiwiX3VzZXJCcmlkZ2UiLCJnZXRDb21tYW5kQnJpZGdlIiwiZ2V0RW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlIiwiZ2V0SHR0cEJyaWRnZSIsImdldExpc3RlbmVyQnJpZGdlIiwiZ2V0TWVzc2FnZUJyaWRnZSIsImdldFBlcnNpc3RlbmNlQnJpZGdlIiwiZ2V0QXBwQWN0aXZhdGlvbkJyaWRnZSIsImdldEFwcERldGFpbENoYW5nZXNCcmlkZ2UiLCJnZXRSb29tQnJpZGdlIiwiZ2V0U2VydmVyU2V0dGluZ0JyaWRnZSIsImdldFVzZXJCcmlkZ2UiLCJTbGFzaENvbW1hbmRDb250ZXh0IiwiZGlzYWJsZWRDb21tYW5kcyIsImRvZXNDb21tYW5kRXhpc3QiLCJjb21tYW5kIiwiY29uc29sZSIsImxvZyIsImxlbmd0aCIsImNtZCIsInRvTG93ZXJDYXNlIiwic2xhc2hDb21tYW5kcyIsImNvbW1hbmRzIiwiaGFzIiwiZW5hYmxlQ29tbWFuZCIsInRyaW0iLCJnZXQiLCJkZWxldGUiLCJjb21tYW5kVXBkYXRlZCIsImRpc2FibGVDb21tYW5kIiwiY29tbWFuZERpc2FibGVkIiwibW9kaWZ5Q29tbWFuZCIsIl92ZXJpZnlDb21tYW5kIiwicGFyYW1zIiwicGFyYW1zRXhhbXBsZSIsImRlc2NyaXB0aW9uIiwiaTE4bkRlc2NyaXB0aW9uIiwiY2FsbGJhY2siLCJfYXBwQ29tbWFuZEV4ZWN1dG9yIiwiYmluZCIsInByb3ZpZGVzUHJldmlldyIsInByZXZpZXdlciIsIl9hcHBDb21tYW5kUHJldmlld2VyIiwicHJldmlld0NhbGxiYWNrIiwiZXhlY3V0ZVByZXZpZXdJdGVtIiwiX2FwcENvbW1hbmRQcmV2aWV3RXhlY3V0b3IiLCJyZWdpc3RlckNvbW1hbmQiLCJ1bmRlZmluZWQiLCJjb21tYW5kQWRkZWQiLCJ1bnJlZ2lzdGVyQ29tbWFuZCIsImNvbW1hbmRSZW1vdmVkIiwiaTE4blBhcmFtc0V4YW1wbGUiLCJleGVjdXRvciIsInBhcmFtZXRlcnMiLCJtZXNzYWdlIiwidXNlciIsImdldENvbnZlcnRlcnMiLCJjb252ZXJ0QnlJZCIsIk1ldGVvciIsInVzZXJJZCIsInJvb20iLCJyaWQiLCJzcGxpdCIsImNvbnRleHQiLCJPYmplY3QiLCJmcmVlemUiLCJhd2FpdCIsImdldE1hbmFnZXIiLCJnZXRDb21tYW5kTWFuYWdlciIsImV4ZWN1dGVDb21tYW5kIiwiZ2V0UHJldmlld3MiLCJwcmV2aWV3IiwiZXhlY3V0ZVByZXZpZXciLCJhbGxvd2VkIiwiZ2V0VmFsdWVCeU5hbWUiLCJlbnZWYXJOYW1lIiwiaXNSZWFkYWJsZSIsInByb2Nlc3MiLCJlbnYiLCJpbmNsdWRlcyIsInRvVXBwZXJDYXNlIiwiaXNTZXQiLCJtc2ciLCJjb252ZXJ0QXBwTWVzc2FnZSIsInJ1bkFzVXNlciIsInUiLCJjYWxsIiwiZ2V0QnlJZCIsIm1lc3NhZ2VJZCIsImVkaXRvciIsIk1lc3NhZ2VzIiwiVXNlcnMiLCJ1cGRhdGVNZXNzYWdlIiwibm90aWZ5VXNlciIsIk5vdGlmaWNhdGlvbnMiLCJhc3NpZ24iLCJSYW5kb20iLCJ0cyIsIm5vdGlmeVJvb20iLCJ1c2VybmFtZXMiLCJBcnJheSIsImlzQXJyYXkiLCJybXNnIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJwdXJnZSIsImdldFBlcnNpc3RlbmNlTW9kZWwiLCJjcmVhdGVXaXRoQXNzb2NpYXRpb25zIiwiYXNzb2NpYXRpb25zIiwicmVhZEJ5SWQiLCJyZWNvcmQiLCJyZWFkQnlBc3NvY2lhdGlvbnMiLCJyZWNvcmRzIiwiJGFsbCIsIm1hcCIsInIiLCJyZW1vdmVCeUFzc29jaWF0aW9ucyIsInF1ZXJ5IiwidXBzZXJ0IiwiUm9vbVR5cGUiLCJyY1Jvb20iLCJjb252ZXJ0QXBwUm9vbSIsIm1ldGhvZCIsInR5cGUiLCJDSEFOTkVMIiwiUFJJVkFURV9HUk9VUCIsImNyZWF0b3IiLCJyb29tSWQiLCJnZXRCeU5hbWUiLCJyb29tTmFtZSIsImNvbnZlcnRCeU5hbWUiLCJnZXRDcmVhdG9yQnlJZCIsIlJvb21zIiwiZ2V0Q3JlYXRvckJ5TmFtZSIsImZpbmRPbmVCeU5hbWUiLCJybSIsImFsbG93ZWRHcm91cHMiLCJkaXNhbGxvd2VkU2V0dGluZ3MiLCJnZXRBbGwiLCJTZXR0aW5ncyIsIiRuaW4iLCJzIiwiY29udmVydFRvQXBwIiwiZ2V0T25lQnlJZCIsImlzUmVhZGFibGVCeUlkIiwiaGlkZUdyb3VwIiwibmFtZSIsImhpZGVTZXR0aW5nIiwidXBkYXRlT25lIiwic2V0dGluZyIsImdldEJ5VXNlcm5hbWUiLCJ1c2VybmFtZSIsImNvbnZlcnRCeVVzZXJuYW1lIiwib25BcHBTZXR0aW5nc0NoYW5nZSIsImFwcFNldHRpbmdzQ2hhbmdlIiwid2FybiIsInJlcXVlc3QiLCJjb250ZW50IiwiSlNPTiIsInN0cmluZ2lmeSIsIkhUVFAiLCJ1cmwiLCJyZXN1bHQiLCJyZXNwb25zZSIsIm1lc3NhZ2VFdmVudCIsImludGUiLCJjb252ZXJ0TWVzc2FnZSIsImdldExpc3RlbmVyTWFuYWdlciIsImV4ZWN1dGVMaXN0ZW5lciIsInJvb21FdmVudCIsImNvbnZlcnRSb29tIiwiQXBwTWV0aG9kcyIsIndhaXRUb0xvYWQiLCJzZXRJbnRlcnZhbCIsImlzRW5hYmxlZCIsImlzTG9hZGVkIiwiY2xlYXJJbnRlcnZhbCIsIndhaXRUb1VubG9hZCIsIl9vcmNoIiwiX2FkZE1ldGhvZHMiLCJpbnN0YW5jZSIsIm1ldGhvZHMiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iLCJzZXR0aW5ncyIsIkFwcHNSZXN0QXBpIiwibWFuYWdlciIsIl9tYW5hZ2VyIiwiYXBpIiwiQVBJIiwiQXBpQ2xhc3MiLCJ2ZXJzaW9uIiwidXNlRGVmYXVsdEF1dGgiLCJwcmV0dHlKc29uIiwiZW5hYmxlQ29ycyIsImF1dGgiLCJnZXRVc2VyQXV0aCIsImFkZE1hbmFnZW1lbnRSb3V0ZXMiLCJfaGFuZGxlRmlsZSIsImZpbGVGaWVsZCIsIkJ1c2JveSIsIk5wbSIsImJ1c2JveSIsImhlYWRlcnMiLCJ3cmFwQXN5bmMiLCJvbiIsImJpbmRFbnZpcm9ubWVudCIsImZpZWxkbmFtZSIsImZpbGUiLCJmaWxlRGF0YSIsInB1c2giLCJCdWZmZXIiLCJjb25jYXQiLCJwaXBlIiwib3JjaGVzdHJhdG9yIiwiZmlsZUhhbmRsZXIiLCJhZGRSb3V0ZSIsImF1dGhSZXF1aXJlZCIsImFwcHMiLCJwcmwiLCJnZXRJbmZvIiwibGFuZ3VhZ2VzIiwiZ2V0U3RvcmFnZUl0ZW0iLCJsYW5ndWFnZUNvbnRlbnQiLCJnZXRTdGF0dXMiLCJ2MSIsInBvc3QiLCJidWZmIiwiYm9keVBhcmFtcyIsIm5wbVJlcXVlc3RPcHRpb25zIiwiZW5jb2RpbmciLCJzdGF0dXNDb2RlIiwiZmFpbHVyZSIsImVycm9yIiwiZnJvbSIsImFmZiIsImFkZCIsInRvU3RyaW5nIiwiZ2V0QXBwSW5mbyIsImdldEFwcCIsImltcGxlbWVudGVkIiwiZ2V0SW1wbGVtZW50ZWRJbmZlcmZhY2VzIiwiY29tcGlsZXJFcnJvcnMiLCJnZXRDb21waWxlckVycm9ycyIsInVybFBhcmFtcyIsIm5vdEZvdW5kIiwiaWNvbkZpbGVDb250ZW50Iiwib2Zmc2V0IiwiY291bnQiLCJnZXRQYWdpbmF0aW9uSXRlbXMiLCJzb3J0IiwiZmllbGRzIiwicGFyc2VKc29uUXVlcnkiLCJvdXJRdWVyeSIsIm9wdGlvbnMiLCJfdXBkYXRlZEF0Iiwic2tpcCIsImxpbWl0IiwibG9ncyIsImdldExvZ1N0b3JhZ2UiLCJrZXlzIiwiayIsImhpZGRlbiIsImdldFNldHRpbmdzTWFuYWdlciIsInVwZGF0ZUFwcFNldHRpbmciLCJzZXR0aW5nSWQiLCJnZXRBcHBTZXR0aW5nIiwiY2hhbmdlU3RhdHVzIiwiQXBwRXZlbnRzIiwiQXBwU2VydmVyTGlzdGVuZXIiLCJBcHBTZXJ2ZXJOb3RpZmllciIsIkFwcFN0YXR1cyIsIkFwcFN0YXR1c1V0aWxzIiwiQVBQX0FEREVEIiwiQVBQX1JFTU9WRUQiLCJBUFBfVVBEQVRFRCIsIkFQUF9TVEFUVVNfQ0hBTkdFIiwiQVBQX1NFVFRJTkdfVVBEQVRFRCIsIkNPTU1BTkRfQURERUQiLCJDT01NQU5EX0RJU0FCTEVEIiwiQ09NTUFORF9VUERBVEVEIiwiQ09NTUFORF9SRU1PVkVEIiwiZW5naW5lU3RyZWFtZXIiLCJjbGllbnRTdHJlYW1lciIsInJlY2VpdmVkIiwib25BcHBBZGRlZCIsIm9uQXBwU3RhdHVzVXBkYXRlZCIsIm9uQXBwU2V0dGluZ1VwZGF0ZWQiLCJvbkFwcFJlbW92ZWQiLCJvbkFwcFVwZGF0ZWQiLCJvbkNvbW1hbmRBZGRlZCIsIm9uQ29tbWFuZERpc2FibGVkIiwib25Db21tYW5kVXBkYXRlZCIsIm9uQ29tbWFuZFJlbW92ZWQiLCJsb2FkT25lIiwiZW1pdCIsIndoZW4iLCJlbmFibGUiLCJpc0Rpc2FibGVkIiwiZGlzYWJsZSIsIk1BTlVBTExZX0RJU0FCTEVEIiwic3RvcmFnZUl0ZW0iLCJnZXRTdG9yYWdlIiwiemlwIiwiU3RyZWFtZXIiLCJyZXRyYW5zbWl0Iiwic2VydmVyT25seSIsImFsbG93UmVhZCIsImFsbG93RW1pdCIsImFsbG93V3JpdGUiLCJsaXN0ZW5lciIsImRldGFpbHMiLCJBcHBNZXNzYWdlc0NvbnZlcnRlciIsIm1zZ0lkIiwibXNnT2JqIiwic2VuZGVyIiwiZWRpdGVkQnkiLCJhdHRhY2htZW50cyIsIl9jb252ZXJ0QXR0YWNobWVudHNUb0FwcCIsInRleHQiLCJlZGl0ZWRBdCIsImVtb2ppIiwiYXZhdGFyVXJsIiwiYXZhdGFyIiwiYWxpYXMiLCJjdXN0b21GaWVsZHMiLCJfY29udmVydEFwcEF0dGFjaG1lbnRzIiwiYXR0YWNobWVudCIsImNvbGxhcHNlZCIsImNvbG9yIiwidGltZXN0YW1wIiwibWVzc2FnZV9saW5rIiwidGltZXN0YW1wTGluayIsInRodW1iX3VybCIsInRodW1ibmFpbFVybCIsImF1dGhvcl9uYW1lIiwiYXV0aG9yIiwiYXV0aG9yX2xpbmsiLCJsaW5rIiwiYXV0aG9yX2ljb24iLCJpY29uIiwidGl0bGUiLCJ2YWx1ZSIsInRpdGxlX2xpbmsiLCJ0aXRsZV9saW5rX2Rvd25sb2FkIiwiZGlzcGxheURvd25sb2FkTGluayIsImltYWdlX3VybCIsImltYWdlVXJsIiwiYXVkaW9fdXJsIiwiYXVkaW9VcmwiLCJ2aWRlb191cmwiLCJ2aWRlb1VybCIsImEiLCJBcHBSb29tc0NvbnZlcnRlciIsImZuYW1lIiwiZGlzcGxheU5hbWUiLCJzbHVnaWZpZWROYW1lIiwidCIsImRlZmF1bHQiLCJpc0RlZmF1bHQiLCJybyIsImlzUmVhZE9ubHkiLCJzeXNNZXMiLCJkaXNwbGF5U3lzdGVtTWVzc2FnZXMiLCJtc2dzIiwibWVzc2FnZUNvdW50IiwibG0iLCJsYXN0TW9kaWZpZWRBdCIsIl9jb252ZXJ0VHlwZVRvQXBwIiwidHlwZUNoYXIiLCJESVJFQ1RfTUVTU0FHRSIsIkxJVkVfQ0hBVCIsIkFwcFNldHRpbmdzQ29udmVydGVyIiwiU2V0dGluZ1R5cGUiLCJwYWNrYWdlVmFsdWUiLCJ2YWx1ZXMiLCJwdWJsaWMiLCJncm91cCIsImkxOG5MYWJlbCIsIkJPT0xFQU4iLCJDT0RFIiwiQ09MT1IiLCJGT05UIiwiTlVNQkVSIiwiU0VMRUNUIiwiU1RSSU5HIiwiQXBwVXNlcnNDb252ZXJ0ZXIiLCJVc2VyU3RhdHVzQ29ubmVjdGlvbiIsIlVzZXJUeXBlIiwiX2NvbnZlcnRVc2VyVHlwZVRvRW51bSIsInN0YXR1c0Nvbm5lY3Rpb24iLCJfY29udmVydFN0YXR1c0Nvbm5lY3Rpb25Ub0VudW0iLCJlbWFpbHMiLCJhY3RpdmUiLCJyb2xlcyIsInV0Y09mZnNldCIsImxhc3RMb2dpbkF0IiwibGFzdExvZ2luIiwiVVNFUiIsIkJPVCIsIlVOS05PV04iLCJPRkZMSU5FIiwiT05MSU5FIiwiQVdBWSIsIkJVU1kiLCJVTkRFRklORUQiLCJBcHBNYW5hZ2VyIiwiQXBwU2VydmVyT3JjaGVzdHJhdG9yIiwiUGVybWlzc2lvbnMiLCJjcmVhdGVPclVwZGF0ZSIsIl9tb2RlbCIsIl9sb2dNb2RlbCIsIl9wZXJzaXN0TW9kZWwiLCJfc3RvcmFnZSIsIl9sb2dTdG9yYWdlIiwiX2NvbnZlcnRlcnMiLCJfYnJpZGdlcyIsIl9jb21tdW5pY2F0b3JzIiwiZ2V0TW9kZWwiLCJnZXRCcmlkZ2VzIiwiYXJlQXBwc0xvYWRlZCIsImxvYWQiLCJhZmZzIiwidW5sb2FkIiwia2V5IiwiZ2xvYmFsIiwic3RhcnR1cCIsIl9hcHBTZXJ2ZXJPcmNoZXN0cmF0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBQSxPQUFPLEVBQVAsQzs7Ozs7Ozs7Ozs7QUNEQUMsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLGlCQUFjLE1BQUlBO0FBQW5CLENBQWQ7O0FBQU8sTUFBTUEsYUFBTixTQUE0QkMsV0FBV0MsTUFBWCxDQUFrQkMsS0FBOUMsQ0FBb0Q7QUFDMURDLGdCQUFjO0FBQ2IsVUFBTSxXQUFOO0FBQ0E7O0FBSHlELEM7Ozs7Ozs7Ozs7O0FDQTNETixPQUFPQyxNQUFQLENBQWM7QUFBQ00sYUFBVSxNQUFJQTtBQUFmLENBQWQ7O0FBQU8sTUFBTUEsU0FBTixTQUF3QkosV0FBV0MsTUFBWCxDQUFrQkMsS0FBMUMsQ0FBZ0Q7QUFDdERDLGdCQUFjO0FBQ2IsVUFBTSxNQUFOO0FBQ0E7O0FBSHFELEM7Ozs7Ozs7Ozs7O0FDQXZETixPQUFPQyxNQUFQLENBQWM7QUFBQ08sd0JBQXFCLE1BQUlBO0FBQTFCLENBQWQ7O0FBQU8sTUFBTUEsb0JBQU4sU0FBbUNMLFdBQVdDLE1BQVgsQ0FBa0JDLEtBQXJELENBQTJEO0FBQ2pFQyxnQkFBYztBQUNiLFVBQU0sa0JBQU47QUFDQTs7QUFIZ0UsQzs7Ozs7Ozs7Ozs7QUNBbEVOLE9BQU9DLE1BQVAsQ0FBYztBQUFDUSxrQkFBZSxNQUFJQTtBQUFwQixDQUFkO0FBQW1ELElBQUlDLFVBQUo7QUFBZVYsT0FBT1csS0FBUCxDQUFhQyxRQUFRLHlDQUFSLENBQWIsRUFBZ0U7QUFBQ0YsYUFBV0csQ0FBWCxFQUFhO0FBQUNILGlCQUFXRyxDQUFYO0FBQWE7O0FBQTVCLENBQWhFLEVBQThGLENBQTlGOztBQUUzRCxNQUFNSixjQUFOLFNBQTZCQyxVQUE3QixDQUF3QztBQUM5Q0osY0FBWVEsSUFBWixFQUFrQjtBQUNqQixVQUFNLFNBQU47QUFDQSxTQUFLQyxFQUFMLEdBQVVELElBQVY7QUFDQTs7QUFFREUsU0FBT0MsSUFBUCxFQUFhO0FBQ1osV0FBTyxJQUFJQyxPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQ3ZDSCxXQUFLSSxTQUFMLEdBQWlCLElBQUlDLElBQUosRUFBakI7QUFDQUwsV0FBS00sU0FBTCxHQUFpQixJQUFJRCxJQUFKLEVBQWpCO0FBRUEsVUFBSUUsR0FBSjs7QUFFQSxVQUFJO0FBQ0hBLGNBQU0sS0FBS1QsRUFBTCxDQUFRVSxPQUFSLENBQWdCO0FBQUVDLGVBQUssQ0FBQztBQUFFQyxnQkFBSVYsS0FBS1U7QUFBWCxXQUFELEVBQWtCO0FBQUUsNkJBQWlCVixLQUFLVyxJQUFMLENBQVVDO0FBQTdCLFdBQWxCO0FBQVAsU0FBaEIsQ0FBTjtBQUNBLE9BRkQsQ0FFRSxPQUFPQyxDQUFQLEVBQVU7QUFDWCxlQUFPVixPQUFPVSxDQUFQLENBQVA7QUFDQTs7QUFFRCxVQUFJTixHQUFKLEVBQVM7QUFDUixlQUFPSixPQUFPLElBQUlXLEtBQUosQ0FBVSxxQkFBVixDQUFQLENBQVA7QUFDQTs7QUFFRCxVQUFJO0FBQ0gsY0FBTUosS0FBSyxLQUFLWixFQUFMLENBQVFpQixNQUFSLENBQWVmLElBQWYsQ0FBWDtBQUNBQSxhQUFLZ0IsR0FBTCxHQUFXTixFQUFYO0FBRUFSLGdCQUFRRixJQUFSO0FBQ0EsT0FMRCxDQUtFLE9BQU9hLENBQVAsRUFBVTtBQUNYVixlQUFPVSxDQUFQO0FBQ0E7QUFDRCxLQXhCTSxDQUFQO0FBeUJBOztBQUVESSxjQUFZUCxFQUFaLEVBQWdCO0FBQ2YsV0FBTyxJQUFJVCxPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQ3ZDLFVBQUlJLEdBQUo7O0FBRUEsVUFBSTtBQUNIQSxjQUFNLEtBQUtULEVBQUwsQ0FBUVUsT0FBUixDQUFnQjtBQUFFQyxlQUFLLENBQUU7QUFBQ08saUJBQUtOO0FBQU4sV0FBRixFQUFjO0FBQUVBO0FBQUYsV0FBZDtBQUFQLFNBQWhCLENBQU47QUFDQSxPQUZELENBRUUsT0FBT0csQ0FBUCxFQUFVO0FBQ1gsZUFBT1YsT0FBT1UsQ0FBUCxDQUFQO0FBQ0E7O0FBRUQsVUFBSU4sR0FBSixFQUFTO0FBQ1JMLGdCQUFRSyxHQUFSO0FBQ0EsT0FGRCxNQUVPO0FBQ05KLGVBQU8sSUFBSVcsS0FBSixDQUFXLDJCQUEyQkosRUFBSSxFQUExQyxDQUFQO0FBQ0E7QUFDRCxLQWRNLENBQVA7QUFlQTs7QUFFRFEsZ0JBQWM7QUFDYixXQUFPLElBQUlqQixPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQ3ZDLFVBQUlnQixJQUFKOztBQUVBLFVBQUk7QUFDSEEsZUFBTyxLQUFLckIsRUFBTCxDQUFRc0IsSUFBUixDQUFhLEVBQWIsRUFBaUJDLEtBQWpCLEVBQVA7QUFDQSxPQUZELENBRUUsT0FBT1IsQ0FBUCxFQUFVO0FBQ1gsZUFBT1YsT0FBT1UsQ0FBUCxDQUFQO0FBQ0E7O0FBRUQsWUFBTVMsUUFBUSxJQUFJQyxHQUFKLEVBQWQ7QUFFQUosV0FBS0ssT0FBTCxDQUFjQyxDQUFELElBQU9ILE1BQU1JLEdBQU4sQ0FBVUQsRUFBRWYsRUFBWixFQUFnQmUsQ0FBaEIsQ0FBcEI7QUFFQXZCLGNBQVFvQixLQUFSO0FBQ0EsS0FkTSxDQUFQO0FBZUE7O0FBRURLLFNBQU8zQixJQUFQLEVBQWE7QUFDWixXQUFPLElBQUlDLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDdkMsVUFBSTtBQUNILGFBQUtMLEVBQUwsQ0FBUTZCLE1BQVIsQ0FBZTtBQUFFakIsY0FBSVYsS0FBS1U7QUFBWCxTQUFmLEVBQWdDVixJQUFoQztBQUNBLE9BRkQsQ0FFRSxPQUFPYSxDQUFQLEVBQVU7QUFDWCxlQUFPVixPQUFPVSxDQUFQLENBQVA7QUFDQTs7QUFFRCxXQUFLSSxXQUFMLENBQWlCakIsS0FBS1UsRUFBdEIsRUFBMEJrQixJQUExQixDQUFnQ0MsT0FBRCxJQUFhM0IsUUFBUTJCLE9BQVIsQ0FBNUMsRUFBOERDLEtBQTlELENBQXFFQyxHQUFELElBQVM1QixPQUFPNEIsR0FBUCxDQUE3RTtBQUNBLEtBUk0sQ0FBUDtBQVNBOztBQUVEQyxTQUFPdEIsRUFBUCxFQUFXO0FBQ1YsV0FBTyxJQUFJVCxPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQ3ZDLFVBQUk7QUFDSCxhQUFLTCxFQUFMLENBQVFrQyxNQUFSLENBQWU7QUFBRXRCO0FBQUYsU0FBZjtBQUNBLE9BRkQsQ0FFRSxPQUFPRyxDQUFQLEVBQVU7QUFDWCxlQUFPVixPQUFPVSxDQUFQLENBQVA7QUFDQTs7QUFFRFgsY0FBUTtBQUFFK0IsaUJBQVM7QUFBWCxPQUFSO0FBQ0EsS0FSTSxDQUFQO0FBU0E7O0FBNUY2QyxDOzs7Ozs7Ozs7OztBQ0YvQ2xELE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxpQkFBYyxNQUFJQSxhQUFuQjtBQUFpQ0ssYUFBVSxNQUFJQSxTQUEvQztBQUF5REMsd0JBQXFCLE1BQUlBLG9CQUFsRjtBQUF1RzJDLHNCQUFtQixNQUFJQSxrQkFBOUg7QUFBaUoxQyxrQkFBZSxNQUFJQTtBQUFwSyxDQUFkO0FBQW1NLElBQUlQLGFBQUo7QUFBa0JGLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNWLGdCQUFjVyxDQUFkLEVBQWdCO0FBQUNYLG9CQUFjVyxDQUFkO0FBQWdCOztBQUFsQyxDQUExQyxFQUE4RSxDQUE5RTtBQUFpRixJQUFJTixTQUFKO0FBQWNQLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxjQUFSLENBQWIsRUFBcUM7QUFBQ0wsWUFBVU0sQ0FBVixFQUFZO0FBQUNOLGdCQUFVTSxDQUFWO0FBQVk7O0FBQTFCLENBQXJDLEVBQWlFLENBQWpFO0FBQW9FLElBQUlMLG9CQUFKO0FBQXlCUixPQUFPVyxLQUFQLENBQWFDLFFBQVEsMEJBQVIsQ0FBYixFQUFpRDtBQUFDSix1QkFBcUJLLENBQXJCLEVBQXVCO0FBQUNMLDJCQUFxQkssQ0FBckI7QUFBdUI7O0FBQWhELENBQWpELEVBQW1HLENBQW5HO0FBQXNHLElBQUlzQyxrQkFBSjtBQUF1Qm5ELE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxnQkFBUixDQUFiLEVBQXVDO0FBQUN1QyxxQkFBbUJ0QyxDQUFuQixFQUFxQjtBQUFDc0MseUJBQW1CdEMsQ0FBbkI7QUFBcUI7O0FBQTVDLENBQXZDLEVBQXFGLENBQXJGO0FBQXdGLElBQUlKLGNBQUo7QUFBbUJULE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxXQUFSLENBQWIsRUFBa0M7QUFBQ0gsaUJBQWVJLENBQWYsRUFBaUI7QUFBQ0oscUJBQWVJLENBQWY7QUFBaUI7O0FBQXBDLENBQWxDLEVBQXdFLENBQXhFLEU7Ozs7Ozs7Ozs7O0FDQXpuQmIsT0FBT0MsTUFBUCxDQUFjO0FBQUNrRCxzQkFBbUIsTUFBSUE7QUFBeEIsQ0FBZDtBQUEyRCxJQUFJQyxVQUFKO0FBQWVwRCxPQUFPVyxLQUFQLENBQWFDLFFBQVEseUNBQVIsQ0FBYixFQUFnRTtBQUFDd0MsYUFBV3ZDLENBQVgsRUFBYTtBQUFDdUMsaUJBQVd2QyxDQUFYO0FBQWE7O0FBQTVCLENBQWhFLEVBQThGLENBQTlGO0FBQWlHLElBQUl3QyxhQUFKO0FBQWtCckQsT0FBT1csS0FBUCxDQUFhQyxRQUFRLHlDQUFSLENBQWIsRUFBZ0U7QUFBQ3lDLGdCQUFjeEMsQ0FBZCxFQUFnQjtBQUFDd0Msb0JBQWN4QyxDQUFkO0FBQWdCOztBQUFsQyxDQUFoRSxFQUFvRyxDQUFwRzs7QUFHdEwsTUFBTXNDLGtCQUFOLFNBQWlDRSxhQUFqQyxDQUErQztBQUNyRC9DLGNBQVlnRCxLQUFaLEVBQW1CO0FBQ2xCLFVBQU0sU0FBTjtBQUNBLFNBQUt2QyxFQUFMLEdBQVV1QyxLQUFWO0FBQ0E7O0FBRURqQixTQUFPO0FBQ04sV0FBTyxJQUFJbkIsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUN2QyxVQUFJZ0IsSUFBSjs7QUFFQSxVQUFJO0FBQ0hBLGVBQU8sS0FBS3JCLEVBQUwsQ0FBUXNCLElBQVIsQ0FBYSxHQUFHa0IsU0FBaEIsRUFBMkJqQixLQUEzQixFQUFQO0FBQ0EsT0FGRCxDQUVFLE9BQU9SLENBQVAsRUFBVTtBQUNYLGVBQU9WLE9BQU9VLENBQVAsQ0FBUDtBQUNBOztBQUVEWCxjQUFRaUIsSUFBUjtBQUNBLEtBVk0sQ0FBUDtBQVdBOztBQUVEb0IsZUFBYUMsS0FBYixFQUFvQkMsTUFBcEIsRUFBNEI7QUFDM0IsV0FBTyxJQUFJeEMsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUN2QyxZQUFNSCxPQUFPbUMsV0FBV08sY0FBWCxDQUEwQkYsS0FBMUIsRUFBaUNDLE1BQWpDLENBQWI7O0FBRUEsVUFBSTtBQUNILGNBQU0vQixLQUFLLEtBQUtaLEVBQUwsQ0FBUWlCLE1BQVIsQ0FBZWYsSUFBZixDQUFYO0FBRUFFLGdCQUFRLEtBQUtKLEVBQUwsQ0FBUTZDLFdBQVIsQ0FBb0JqQyxFQUFwQixDQUFSO0FBQ0EsT0FKRCxDQUlFLE9BQU9HLENBQVAsRUFBVTtBQUNYVixlQUFPVSxDQUFQO0FBQ0E7QUFDRCxLQVZNLENBQVA7QUFXQTs7QUFFRCtCLGdCQUFjSixLQUFkLEVBQXFCO0FBQ3BCLFdBQU8sSUFBSXZDLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDdkMsVUFBSWdCLElBQUo7O0FBRUEsVUFBSTtBQUNIQSxlQUFPLEtBQUtyQixFQUFMLENBQVFzQixJQUFSLENBQWE7QUFBRW9CO0FBQUYsU0FBYixFQUF3Qm5CLEtBQXhCLEVBQVA7QUFDQSxPQUZELENBRUUsT0FBT1IsQ0FBUCxFQUFVO0FBQ1gsZUFBT1YsT0FBT1UsQ0FBUCxDQUFQO0FBQ0E7O0FBRURYLGNBQVFpQixJQUFSO0FBQ0EsS0FWTSxDQUFQO0FBV0E7O0FBRUQwQixtQkFBaUJMLEtBQWpCLEVBQXdCO0FBQ3ZCLFdBQU8sSUFBSXZDLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDdkMsVUFBSTtBQUNILGFBQUtMLEVBQUwsQ0FBUWtDLE1BQVIsQ0FBZTtBQUFFUTtBQUFGLFNBQWY7QUFDQSxPQUZELENBRUUsT0FBTzNCLENBQVAsRUFBVTtBQUNYLGVBQU9WLE9BQU9VLENBQVAsQ0FBUDtBQUNBOztBQUVEWDtBQUNBLEtBUk0sQ0FBUDtBQVNBOztBQTFEb0QsQzs7Ozs7Ozs7Ozs7QUNIdERuQixPQUFPQyxNQUFQLENBQWM7QUFBQzhELHVCQUFvQixNQUFJQTtBQUF6QixDQUFkOztBQUFPLE1BQU1BLG1CQUFOLENBQTBCO0FBQ2hDekQsY0FBWTBELElBQVosRUFBa0I7QUFDakIsU0FBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0E7O0FBRUtDLFVBQU4sQ0FBZUMsR0FBZjtBQUFBLG9DQUFvQjtBQUNuQixvQkFBTSxLQUFLRixJQUFMLENBQVVHLFdBQVYsR0FBd0JGLFFBQXhCLENBQWlDQyxJQUFJRSxLQUFKLEVBQWpDLENBQU47QUFDQSxLQUZEO0FBQUE7O0FBSU1DLFlBQU4sQ0FBaUJILEdBQWpCO0FBQUEsb0NBQXNCO0FBQ3JCLG9CQUFNLEtBQUtGLElBQUwsQ0FBVUcsV0FBVixHQUF3QkUsVUFBeEIsQ0FBbUNILElBQUlFLEtBQUosRUFBbkMsQ0FBTjtBQUNBLEtBRkQ7QUFBQTs7QUFJTUUsWUFBTixDQUFpQkosR0FBakI7QUFBQSxvQ0FBc0I7QUFDckIsb0JBQU0sS0FBS0YsSUFBTCxDQUFVRyxXQUFWLEdBQXdCRyxVQUF4QixDQUFtQ0osSUFBSUUsS0FBSixFQUFuQyxDQUFOO0FBQ0EsS0FGRDtBQUFBOztBQUlNRyxrQkFBTixDQUF1QkwsR0FBdkIsRUFBNEJNLE1BQTVCO0FBQUEsb0NBQW9DO0FBQ25DLG9CQUFNLEtBQUtSLElBQUwsQ0FBVUcsV0FBVixHQUF3Qk0sZ0JBQXhCLENBQXlDUCxJQUFJRSxLQUFKLEVBQXpDLEVBQXNESSxNQUF0RCxDQUFOO0FBQ0EsS0FGRDtBQUFBOztBQWpCZ0MsQzs7Ozs7Ozs7Ozs7QUNBakN4RSxPQUFPQyxNQUFQLENBQWM7QUFBQ3lFLGtCQUFlLE1BQUlBO0FBQXBCLENBQWQ7QUFBbUQsSUFBSUMsVUFBSjtBQUFlM0UsT0FBT1csS0FBUCxDQUFhQyxRQUFRLHlDQUFSLENBQWIsRUFBZ0U7QUFBQytELGFBQVc5RCxDQUFYLEVBQWE7QUFBQzhELGlCQUFXOUQsQ0FBWDtBQUFhOztBQUE1QixDQUFoRSxFQUE4RixDQUE5RjtBQUFpRyxJQUFJa0QsbUJBQUo7QUFBd0IvRCxPQUFPVyxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUNtRCxzQkFBb0JsRCxDQUFwQixFQUFzQjtBQUFDa0QsMEJBQW9CbEQsQ0FBcEI7QUFBc0I7O0FBQTlDLENBQXJDLEVBQXFGLENBQXJGO0FBQXdGLElBQUkrRCxzQkFBSjtBQUEyQjVFLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxXQUFSLENBQWIsRUFBa0M7QUFBQ2dFLHlCQUF1Qi9ELENBQXZCLEVBQXlCO0FBQUMrRCw2QkFBdUIvRCxDQUF2QjtBQUF5Qjs7QUFBcEQsQ0FBbEMsRUFBd0YsQ0FBeEY7QUFBMkYsSUFBSWdFLGlCQUFKO0FBQXNCN0UsT0FBT1csS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDaUUsb0JBQWtCaEUsQ0FBbEIsRUFBb0I7QUFBQ2dFLHdCQUFrQmhFLENBQWxCO0FBQW9COztBQUExQyxDQUFuQyxFQUErRSxDQUEvRTtBQUFrRixJQUFJaUUsOEJBQUo7QUFBbUM5RSxPQUFPVyxLQUFQLENBQWFDLFFBQVEsaUJBQVIsQ0FBYixFQUF3QztBQUFDa0UsaUNBQStCakUsQ0FBL0IsRUFBaUM7QUFBQ2lFLHFDQUErQmpFLENBQS9CO0FBQWlDOztBQUFwRSxDQUF4QyxFQUE4RyxDQUE5RztBQUFpSCxJQUFJa0UsYUFBSjtBQUFrQi9FLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ21FLGdCQUFjbEUsQ0FBZCxFQUFnQjtBQUFDa0Usb0JBQWNsRSxDQUFkO0FBQWdCOztBQUFsQyxDQUEvQixFQUFtRSxDQUFuRTtBQUFzRSxJQUFJbUUsaUJBQUo7QUFBc0JoRixPQUFPVyxLQUFQLENBQWFDLFFBQVEsYUFBUixDQUFiLEVBQW9DO0FBQUNvRSxvQkFBa0JuRSxDQUFsQixFQUFvQjtBQUFDbUUsd0JBQWtCbkUsQ0FBbEI7QUFBb0I7O0FBQTFDLENBQXBDLEVBQWdGLENBQWhGO0FBQW1GLElBQUlvRSxnQkFBSjtBQUFxQmpGLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ3FFLG1CQUFpQnBFLENBQWpCLEVBQW1CO0FBQUNvRSx1QkFBaUJwRSxDQUFqQjtBQUFtQjs7QUFBeEMsQ0FBbkMsRUFBNkUsQ0FBN0U7QUFBZ0YsSUFBSXFFLG9CQUFKO0FBQXlCbEYsT0FBT1csS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDc0UsdUJBQXFCckUsQ0FBckIsRUFBdUI7QUFBQ3FFLDJCQUFxQnJFLENBQXJCO0FBQXVCOztBQUFoRCxDQUF0QyxFQUF3RixDQUF4RjtBQUEyRixJQUFJc0UsYUFBSjtBQUFrQm5GLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxTQUFSLENBQWIsRUFBZ0M7QUFBQ3VFLGdCQUFjdEUsQ0FBZCxFQUFnQjtBQUFDc0Usb0JBQWN0RSxDQUFkO0FBQWdCOztBQUFsQyxDQUFoQyxFQUFvRSxDQUFwRTtBQUF1RSxJQUFJdUUsZ0JBQUo7QUFBcUJwRixPQUFPVyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUN3RSxtQkFBaUJ2RSxDQUFqQixFQUFtQjtBQUFDdUUsdUJBQWlCdkUsQ0FBakI7QUFBbUI7O0FBQXhDLENBQW5DLEVBQTZFLEVBQTdFO0FBQWlGLElBQUl3RSxhQUFKO0FBQWtCckYsT0FBT1csS0FBUCxDQUFhQyxRQUFRLFNBQVIsQ0FBYixFQUFnQztBQUFDeUUsZ0JBQWN4RSxDQUFkLEVBQWdCO0FBQUN3RSxvQkFBY3hFLENBQWQ7QUFBZ0I7O0FBQWxDLENBQWhDLEVBQW9FLEVBQXBFOztBQWN6dUMsTUFBTTZELGNBQU4sU0FBNkJDLFVBQTdCLENBQXdDO0FBQzlDckUsY0FBWTBELElBQVosRUFBa0I7QUFDakI7QUFFQSxTQUFLc0IsVUFBTCxHQUFrQixJQUFJdkIsbUJBQUosQ0FBd0JDLElBQXhCLENBQWxCO0FBQ0EsU0FBS3VCLFVBQUwsR0FBa0IsSUFBSVYsaUJBQUosQ0FBc0JiLElBQXRCLENBQWxCO0FBQ0EsU0FBS3dCLFVBQUwsR0FBa0IsSUFBSVosc0JBQUosQ0FBMkJaLElBQTNCLENBQWxCO0FBQ0EsU0FBS3lCLFVBQUwsR0FBa0IsSUFBSVgsOEJBQUosQ0FBbUNkLElBQW5DLENBQWxCO0FBQ0EsU0FBSzBCLFdBQUwsR0FBbUIsSUFBSVgsYUFBSixFQUFuQjtBQUNBLFNBQUtZLFdBQUwsR0FBbUIsSUFBSVgsaUJBQUosQ0FBc0JoQixJQUF0QixDQUFuQjtBQUNBLFNBQUs0QixVQUFMLEdBQWtCLElBQUlYLGdCQUFKLENBQXFCakIsSUFBckIsQ0FBbEI7QUFDQSxTQUFLNkIsY0FBTCxHQUFzQixJQUFJWCxvQkFBSixDQUF5QmxCLElBQXpCLENBQXRCO0FBQ0EsU0FBSzhCLFdBQUwsR0FBbUIsSUFBSVgsYUFBSixDQUFrQm5CLElBQWxCLENBQW5CO0FBQ0EsU0FBSytCLFdBQUwsR0FBbUIsSUFBSVgsZ0JBQUosQ0FBcUJwQixJQUFyQixDQUFuQjtBQUNBLFNBQUtnQyxXQUFMLEdBQW1CLElBQUlYLGFBQUosQ0FBa0JyQixJQUFsQixDQUFuQjtBQUNBOztBQUVEaUMscUJBQW1CO0FBQ2xCLFdBQU8sS0FBS1YsVUFBWjtBQUNBOztBQUVEVyxtQ0FBaUM7QUFDaEMsV0FBTyxLQUFLVCxVQUFaO0FBQ0E7O0FBRURVLGtCQUFnQjtBQUNmLFdBQU8sS0FBS1QsV0FBWjtBQUNBOztBQUVEVSxzQkFBb0I7QUFDbkIsV0FBTyxLQUFLVCxXQUFaO0FBQ0E7O0FBRURVLHFCQUFtQjtBQUNsQixXQUFPLEtBQUtULFVBQVo7QUFDQTs7QUFFRFUseUJBQXVCO0FBQ3RCLFdBQU8sS0FBS1QsY0FBWjtBQUNBOztBQUVEVSwyQkFBeUI7QUFDeEIsV0FBTyxLQUFLakIsVUFBWjtBQUNBOztBQUVEa0IsOEJBQTRCO0FBQzNCLFdBQU8sS0FBS2hCLFVBQVo7QUFDQTs7QUFFRGlCLGtCQUFnQjtBQUNmLFdBQU8sS0FBS1gsV0FBWjtBQUNBOztBQUVEWSwyQkFBeUI7QUFDeEIsV0FBTyxLQUFLWCxXQUFaO0FBQ0E7O0FBRURZLGtCQUFnQjtBQUNmLFdBQU8sS0FBS1gsV0FBWjtBQUNBOztBQTNENkMsQzs7Ozs7Ozs7Ozs7QUNkL0NoRyxPQUFPQyxNQUFQLENBQWM7QUFBQzRFLHFCQUFrQixNQUFJQTtBQUF2QixDQUFkO0FBQXlELElBQUkrQixtQkFBSjtBQUF3QjVHLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSwrQ0FBUixDQUFiLEVBQXNFO0FBQUNnRyxzQkFBb0IvRixDQUFwQixFQUFzQjtBQUFDK0YsMEJBQW9CL0YsQ0FBcEI7QUFBc0I7O0FBQTlDLENBQXRFLEVBQXNILENBQXRIOztBQUUxRSxNQUFNZ0UsaUJBQU4sQ0FBd0I7QUFDOUJ2RSxjQUFZMEQsSUFBWixFQUFrQjtBQUNqQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLNkMsZ0JBQUwsR0FBd0IsSUFBSXJFLEdBQUosRUFBeEI7QUFDQTs7QUFFRHNFLG1CQUFpQkMsT0FBakIsRUFBMEJ0RCxLQUExQixFQUFpQztBQUNoQ3VELFlBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyxvQkFBb0JzRCxPQUFTLG1CQUE1RDs7QUFFQSxRQUFJLE9BQU9BLE9BQVAsS0FBbUIsUUFBbkIsSUFBK0JBLFFBQVFHLE1BQVIsS0FBbUIsQ0FBdEQsRUFBeUQ7QUFDeEQsYUFBTyxLQUFQO0FBQ0E7O0FBRUQsVUFBTUMsTUFBTUosUUFBUUssV0FBUixFQUFaO0FBQ0EsV0FBTyxPQUFPakgsV0FBV2tILGFBQVgsQ0FBeUJDLFFBQXpCLENBQWtDSCxHQUFsQyxDQUFQLEtBQWtELFFBQWxELElBQThELEtBQUtOLGdCQUFMLENBQXNCVSxHQUF0QixDQUEwQkosR0FBMUIsQ0FBckU7QUFDQTs7QUFFREssZ0JBQWNULE9BQWQsRUFBdUJ0RCxLQUF2QixFQUE4QjtBQUM3QnVELFlBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTywwQ0FBMENzRCxPQUFTLEdBQWxGOztBQUVBLFFBQUksT0FBT0EsT0FBUCxLQUFtQixRQUFuQixJQUErQkEsUUFBUVUsSUFBUixHQUFlUCxNQUFmLEtBQTBCLENBQTdELEVBQWdFO0FBQy9ELFlBQU0sSUFBSW5GLEtBQUosQ0FBVSx1REFBVixDQUFOO0FBQ0E7O0FBRUQsVUFBTW9GLE1BQU1KLFFBQVFLLFdBQVIsRUFBWjs7QUFDQSxRQUFJLENBQUMsS0FBS1AsZ0JBQUwsQ0FBc0JVLEdBQXRCLENBQTBCSixHQUExQixDQUFMLEVBQXFDO0FBQ3BDLFlBQU0sSUFBSXBGLEtBQUosQ0FBVywyQ0FBMkNvRixHQUFLLEdBQTNELENBQU47QUFDQTs7QUFFRGhILGVBQVdrSCxhQUFYLENBQXlCQyxRQUF6QixDQUFrQ0gsR0FBbEMsSUFBeUMsS0FBS04sZ0JBQUwsQ0FBc0JhLEdBQXRCLENBQTBCUCxHQUExQixDQUF6QztBQUNBLFNBQUtOLGdCQUFMLENBQXNCYyxNQUF0QixDQUE2QlIsR0FBN0I7QUFFQSxTQUFLbkQsSUFBTCxDQUFVRyxXQUFWLEdBQXdCeUQsY0FBeEIsQ0FBdUNULEdBQXZDO0FBQ0E7O0FBRURVLGlCQUFlZCxPQUFmLEVBQXdCdEQsS0FBeEIsRUFBK0I7QUFDOUJ1RCxZQUFRQyxHQUFSLENBQWEsV0FBV3hELEtBQU8sMkNBQTJDc0QsT0FBUyxHQUFuRjs7QUFFQSxRQUFJLE9BQU9BLE9BQVAsS0FBbUIsUUFBbkIsSUFBK0JBLFFBQVFVLElBQVIsR0FBZVAsTUFBZixLQUEwQixDQUE3RCxFQUFnRTtBQUMvRCxZQUFNLElBQUluRixLQUFKLENBQVUsdURBQVYsQ0FBTjtBQUNBOztBQUVELFVBQU1vRixNQUFNSixRQUFRSyxXQUFSLEVBQVo7O0FBQ0EsUUFBSSxLQUFLUCxnQkFBTCxDQUFzQlUsR0FBdEIsQ0FBMEJKLEdBQTFCLENBQUosRUFBb0M7QUFDbkM7QUFDQTtBQUNBOztBQUVELFFBQUksT0FBT2hILFdBQVdrSCxhQUFYLENBQXlCQyxRQUF6QixDQUFrQ0gsR0FBbEMsQ0FBUCxLQUFrRCxXQUF0RCxFQUFtRTtBQUNsRSxZQUFNLElBQUlwRixLQUFKLENBQVcsb0RBQW9Eb0YsR0FBSyxHQUFwRSxDQUFOO0FBQ0E7O0FBRUQsU0FBS04sZ0JBQUwsQ0FBc0JsRSxHQUF0QixDQUEwQndFLEdBQTFCLEVBQStCaEgsV0FBV2tILGFBQVgsQ0FBeUJDLFFBQXpCLENBQWtDSCxHQUFsQyxDQUEvQjtBQUNBLFdBQU9oSCxXQUFXa0gsYUFBWCxDQUF5QkMsUUFBekIsQ0FBa0NILEdBQWxDLENBQVA7QUFFQSxTQUFLbkQsSUFBTCxDQUFVRyxXQUFWLEdBQXdCMkQsZUFBeEIsQ0FBd0NYLEdBQXhDO0FBQ0EsR0F4RDZCLENBMEQ5Qjs7O0FBQ0FZLGdCQUFjaEIsT0FBZCxFQUF1QnRELEtBQXZCLEVBQThCO0FBQzdCdUQsWUFBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLDBDQUEwQ3NELE9BQVMsR0FBbEY7O0FBRUEsU0FBS2lCLGNBQUwsQ0FBb0JqQixPQUFwQjs7QUFFQSxVQUFNSSxNQUFNSixRQUFRSyxXQUFSLEVBQVo7O0FBQ0EsUUFBSSxPQUFPakgsV0FBV2tILGFBQVgsQ0FBeUJDLFFBQXpCLENBQWtDSCxHQUFsQyxDQUFQLEtBQWtELFdBQXRELEVBQW1FO0FBQ2xFLFlBQU0sSUFBSXBGLEtBQUosQ0FBVyx3RUFBd0VvRixHQUFLLEdBQXhGLENBQU47QUFDQTs7QUFFRCxVQUFNbEcsT0FBT2QsV0FBV2tILGFBQVgsQ0FBeUJDLFFBQXpCLENBQWtDSCxHQUFsQyxDQUFiO0FBQ0FsRyxTQUFLZ0gsTUFBTCxHQUFjbEIsUUFBUW1CLGFBQVIsR0FBd0JuQixRQUFRbUIsYUFBaEMsR0FBZ0RqSCxLQUFLZ0gsTUFBbkU7QUFDQWhILFNBQUtrSCxXQUFMLEdBQW1CcEIsUUFBUXFCLGVBQVIsR0FBMEJyQixRQUFRcUIsZUFBbEMsR0FBb0RuSCxLQUFLZ0gsTUFBNUU7QUFDQWhILFNBQUtvSCxRQUFMLEdBQWdCLEtBQUtDLG1CQUFMLENBQXlCQyxJQUF6QixDQUE4QixJQUE5QixDQUFoQjtBQUNBdEgsU0FBS3VILGVBQUwsR0FBdUJ6QixRQUFReUIsZUFBL0I7QUFDQXZILFNBQUt3SCxTQUFMLEdBQWlCMUIsUUFBUTBCLFNBQVIsR0FBb0IsS0FBS0Msb0JBQUwsQ0FBMEJILElBQTFCLENBQStCLElBQS9CLENBQXBCLEdBQTJEdEgsS0FBS3dILFNBQWpGO0FBQ0F4SCxTQUFLMEgsZUFBTCxHQUF1QjVCLFFBQVE2QixrQkFBUixHQUE2QixLQUFLQywwQkFBTCxDQUFnQ04sSUFBaEMsQ0FBcUMsSUFBckMsQ0FBN0IsR0FBMEV0SCxLQUFLMEgsZUFBdEc7QUFFQXhJLGVBQVdrSCxhQUFYLENBQXlCQyxRQUF6QixDQUFrQ0gsR0FBbEMsSUFBeUNsRyxJQUF6QztBQUNBLFNBQUsrQyxJQUFMLENBQVVHLFdBQVYsR0FBd0J5RCxjQUF4QixDQUF1Q1QsR0FBdkM7QUFDQTs7QUFFRDJCLGtCQUFnQi9CLE9BQWhCLEVBQXlCdEQsS0FBekIsRUFBZ0M7QUFDL0J1RCxZQUFRQyxHQUFSLENBQWEsV0FBV3hELEtBQU8sZ0NBQWdDc0QsUUFBUUEsT0FBUyxHQUFoRjs7QUFFQSxTQUFLaUIsY0FBTCxDQUFvQmpCLE9BQXBCOztBQUVBLFVBQU05RixPQUFPO0FBQ1o4RixlQUFTQSxRQUFRQSxPQUFSLENBQWdCSyxXQUFoQixFQURHO0FBRVphLGNBQVFsQixRQUFRbUIsYUFGSjtBQUdaQyxtQkFBYXBCLFFBQVFxQixlQUhUO0FBSVpDLGdCQUFVLEtBQUtDLG1CQUFMLENBQXlCQyxJQUF6QixDQUE4QixJQUE5QixDQUpFO0FBS1pDLHVCQUFpQnpCLFFBQVF5QixlQUxiO0FBTVpDLGlCQUFXLENBQUMxQixRQUFRMEIsU0FBVCxHQUFxQk0sU0FBckIsR0FBaUMsS0FBS0wsb0JBQUwsQ0FBMEJILElBQTFCLENBQStCLElBQS9CLENBTmhDO0FBT1pJLHVCQUFpQixDQUFDNUIsUUFBUTZCLGtCQUFULEdBQThCRyxTQUE5QixHQUEwQyxLQUFLRiwwQkFBTCxDQUFnQ04sSUFBaEMsQ0FBcUMsSUFBckM7QUFQL0MsS0FBYjtBQVVBcEksZUFBV2tILGFBQVgsQ0FBeUJDLFFBQXpCLENBQWtDUCxRQUFRQSxPQUFSLENBQWdCSyxXQUFoQixFQUFsQyxJQUFtRW5HLElBQW5FO0FBQ0EsU0FBSytDLElBQUwsQ0FBVUcsV0FBVixHQUF3QjZFLFlBQXhCLENBQXFDakMsUUFBUUEsT0FBUixDQUFnQkssV0FBaEIsRUFBckM7QUFDQTs7QUFFRDZCLG9CQUFrQmxDLE9BQWxCLEVBQTJCdEQsS0FBM0IsRUFBa0M7QUFDakN1RCxZQUFRQyxHQUFSLENBQWEsV0FBV3hELEtBQU8sbUNBQW1Dc0QsT0FBUyxHQUEzRTs7QUFFQSxRQUFJLE9BQU9BLE9BQVAsS0FBbUIsUUFBbkIsSUFBK0JBLFFBQVFVLElBQVIsR0FBZVAsTUFBZixLQUEwQixDQUE3RCxFQUFnRTtBQUMvRCxZQUFNLElBQUluRixLQUFKLENBQVUsdURBQVYsQ0FBTjtBQUNBOztBQUVELFVBQU1vRixNQUFNSixRQUFRSyxXQUFSLEVBQVo7QUFDQSxTQUFLUCxnQkFBTCxDQUFzQmMsTUFBdEIsQ0FBNkJSLEdBQTdCO0FBQ0EsV0FBT2hILFdBQVdrSCxhQUFYLENBQXlCQyxRQUF6QixDQUFrQ0gsR0FBbEMsQ0FBUDtBQUVBLFNBQUtuRCxJQUFMLENBQVVHLFdBQVYsR0FBd0IrRSxjQUF4QixDQUF1Qy9CLEdBQXZDO0FBQ0E7O0FBRURhLGlCQUFlakIsT0FBZixFQUF3QjtBQUN2QixRQUFJLE9BQU9BLE9BQVAsS0FBbUIsUUFBdkIsRUFBaUM7QUFDaEMsWUFBTSxJQUFJaEYsS0FBSixDQUFVLG9GQUFWLENBQU47QUFDQTs7QUFFRCxRQUFJLE9BQU9nRixRQUFRQSxPQUFmLEtBQTJCLFFBQS9CLEVBQXlDO0FBQ3hDLFlBQU0sSUFBSWhGLEtBQUosQ0FBVSxvRkFBVixDQUFOO0FBQ0E7O0FBRUQsUUFBSWdGLFFBQVFvQyxpQkFBUixJQUE2QixPQUFPcEMsUUFBUW9DLGlCQUFmLEtBQXFDLFFBQXRFLEVBQWdGO0FBQy9FLFlBQU0sSUFBSXBILEtBQUosQ0FBVSxvRkFBVixDQUFOO0FBQ0E7O0FBRUQsUUFBSWdGLFFBQVFxQixlQUFSLElBQTJCLE9BQU9yQixRQUFRcUIsZUFBZixLQUFtQyxRQUFsRSxFQUE0RTtBQUMzRSxZQUFNLElBQUlyRyxLQUFKLENBQVUsb0ZBQVYsQ0FBTjtBQUNBOztBQUVELFFBQUksT0FBT2dGLFFBQVF5QixlQUFmLEtBQW1DLFNBQXZDLEVBQWtEO0FBQ2pELFlBQU0sSUFBSXpHLEtBQUosQ0FBVSxvRkFBVixDQUFOO0FBQ0E7O0FBRUQsUUFBSSxPQUFPZ0YsUUFBUXFDLFFBQWYsS0FBNEIsVUFBaEMsRUFBNEM7QUFDM0MsWUFBTSxJQUFJckgsS0FBSixDQUFVLG9GQUFWLENBQU47QUFDQTtBQUNEOztBQUVEdUcsc0JBQW9CdkIsT0FBcEIsRUFBNkJzQyxVQUE3QixFQUF5Q0MsT0FBekMsRUFBa0Q7QUFDakQsVUFBTUMsT0FBTyxLQUFLdkYsSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLE9BQTlCLEVBQXVDK0IsV0FBdkMsQ0FBbURDLE9BQU9DLE1BQVAsRUFBbkQsQ0FBYjtBQUNBLFVBQU1DLE9BQU8sS0FBSzVGLElBQUwsQ0FBVXdGLGFBQVYsR0FBMEI5QixHQUExQixDQUE4QixPQUE5QixFQUF1QytCLFdBQXZDLENBQW1ESCxRQUFRTyxHQUEzRCxDQUFiO0FBQ0EsVUFBTTVCLFNBQVNvQixXQUFXbkMsTUFBWCxLQUFzQixDQUF0QixJQUEyQm1DLGVBQWUsR0FBMUMsR0FBZ0QsRUFBaEQsR0FBcURBLFdBQVdTLEtBQVgsQ0FBaUIsR0FBakIsQ0FBcEU7QUFFQSxVQUFNQyxVQUFVLElBQUluRCxtQkFBSixDQUF3Qm9ELE9BQU9DLE1BQVAsQ0FBY1YsSUFBZCxDQUF4QixFQUE2Q1MsT0FBT0MsTUFBUCxDQUFjTCxJQUFkLENBQTdDLEVBQWtFSSxPQUFPQyxNQUFQLENBQWNoQyxNQUFkLENBQWxFLENBQWhCO0FBQ0EvRyxZQUFRZ0osS0FBUixDQUFjLEtBQUtsRyxJQUFMLENBQVVtRyxVQUFWLEdBQXVCQyxpQkFBdkIsR0FBMkNDLGNBQTNDLENBQTBEdEQsT0FBMUQsRUFBbUVnRCxPQUFuRSxDQUFkO0FBQ0E7O0FBRURyQix1QkFBcUIzQixPQUFyQixFQUE4QnNDLFVBQTlCLEVBQTBDQyxPQUExQyxFQUFtRDtBQUNsRCxVQUFNQyxPQUFPLEtBQUt2RixJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsT0FBOUIsRUFBdUMrQixXQUF2QyxDQUFtREMsT0FBT0MsTUFBUCxFQUFuRCxDQUFiO0FBQ0EsVUFBTUMsT0FBTyxLQUFLNUYsSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLE9BQTlCLEVBQXVDK0IsV0FBdkMsQ0FBbURILFFBQVFPLEdBQTNELENBQWI7QUFDQSxVQUFNNUIsU0FBU29CLFdBQVduQyxNQUFYLEtBQXNCLENBQXRCLElBQTJCbUMsZUFBZSxHQUExQyxHQUFnRCxFQUFoRCxHQUFxREEsV0FBV1MsS0FBWCxDQUFpQixHQUFqQixDQUFwRTtBQUVBLFVBQU1DLFVBQVUsSUFBSW5ELG1CQUFKLENBQXdCb0QsT0FBT0MsTUFBUCxDQUFjVixJQUFkLENBQXhCLEVBQTZDUyxPQUFPQyxNQUFQLENBQWNMLElBQWQsQ0FBN0MsRUFBa0VJLE9BQU9DLE1BQVAsQ0FBY2hDLE1BQWQsQ0FBbEUsQ0FBaEI7QUFDQSxXQUFPL0csUUFBUWdKLEtBQVIsQ0FBYyxLQUFLbEcsSUFBTCxDQUFVbUcsVUFBVixHQUF1QkMsaUJBQXZCLEdBQTJDRSxXQUEzQyxDQUF1RHZELE9BQXZELEVBQWdFZ0QsT0FBaEUsQ0FBZCxDQUFQO0FBQ0E7O0FBRURsQiw2QkFBMkI5QixPQUEzQixFQUFvQ3NDLFVBQXBDLEVBQWdEQyxPQUFoRCxFQUF5RGlCLE9BQXpELEVBQWtFO0FBQ2pFLFVBQU1oQixPQUFPLEtBQUt2RixJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsT0FBOUIsRUFBdUMrQixXQUF2QyxDQUFtREMsT0FBT0MsTUFBUCxFQUFuRCxDQUFiO0FBQ0EsVUFBTUMsT0FBTyxLQUFLNUYsSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLE9BQTlCLEVBQXVDK0IsV0FBdkMsQ0FBbURILFFBQVFPLEdBQTNELENBQWI7QUFDQSxVQUFNNUIsU0FBU29CLFdBQVduQyxNQUFYLEtBQXNCLENBQXRCLElBQTJCbUMsZUFBZSxHQUExQyxHQUFnRCxFQUFoRCxHQUFxREEsV0FBV1MsS0FBWCxDQUFpQixHQUFqQixDQUFwRTtBQUVBLFVBQU1DLFVBQVUsSUFBSW5ELG1CQUFKLENBQXdCb0QsT0FBT0MsTUFBUCxDQUFjVixJQUFkLENBQXhCLEVBQTZDUyxPQUFPQyxNQUFQLENBQWNMLElBQWQsQ0FBN0MsRUFBa0VJLE9BQU9DLE1BQVAsQ0FBY2hDLE1BQWQsQ0FBbEUsQ0FBaEI7QUFDQS9HLFlBQVFnSixLQUFSLENBQWMsS0FBS2xHLElBQUwsQ0FBVW1HLFVBQVYsR0FBdUJDLGlCQUF2QixHQUEyQ0ksY0FBM0MsQ0FBMER6RCxPQUExRCxFQUFtRXdELE9BQW5FLEVBQTRFUixPQUE1RSxDQUFkO0FBQ0E7O0FBcks2QixDOzs7Ozs7Ozs7OztBQ0YvQi9KLE9BQU9DLE1BQVAsQ0FBYztBQUFDNkUsa0NBQStCLE1BQUlBO0FBQXBDLENBQWQ7O0FBQU8sTUFBTUEsOEJBQU4sQ0FBcUM7QUFDM0N4RSxjQUFZMEQsSUFBWixFQUFrQjtBQUNqQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLeUcsT0FBTCxHQUFlLENBQUMsVUFBRCxFQUFhLFVBQWIsRUFBeUIsYUFBekIsQ0FBZjtBQUNBOztBQUVLQyxnQkFBTixDQUFxQkMsVUFBckIsRUFBaUNsSCxLQUFqQztBQUFBLG9DQUF3QztBQUN2Q3VELGNBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyxnREFBZ0RrSCxVQUFZLEdBQTNGOztBQUVBLFVBQUksS0FBS0MsVUFBTCxDQUFnQkQsVUFBaEIsRUFBNEJsSCxLQUE1QixDQUFKLEVBQXdDO0FBQ3ZDLGVBQU9vSCxRQUFRQyxHQUFSLENBQVlILFVBQVosQ0FBUDtBQUNBOztBQUVELFlBQU0sSUFBSTVJLEtBQUosQ0FBVywrQkFBK0I0SSxVQUFZLG9CQUF0RCxDQUFOO0FBQ0EsS0FSRDtBQUFBOztBQVVNQyxZQUFOLENBQWlCRCxVQUFqQixFQUE2QmxILEtBQTdCO0FBQUEsb0NBQW9DO0FBQ25DdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLDBEQUEwRGtILFVBQVksR0FBckc7QUFFQSxhQUFPLEtBQUtGLE9BQUwsQ0FBYU0sUUFBYixDQUFzQkosV0FBV0ssV0FBWCxFQUF0QixDQUFQO0FBQ0EsS0FKRDtBQUFBOztBQU1NQyxPQUFOLENBQVlOLFVBQVosRUFBd0JsSCxLQUF4QjtBQUFBLG9DQUErQjtBQUM5QnVELGNBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyxxREFBcURrSCxVQUFZLEdBQWhHOztBQUVBLFVBQUksS0FBS0MsVUFBTCxDQUFnQkQsVUFBaEIsRUFBNEJsSCxLQUE1QixDQUFKLEVBQXdDO0FBQ3ZDLGVBQU8sT0FBT29ILFFBQVFDLEdBQVIsQ0FBWUgsVUFBWixDQUFQLEtBQW1DLFdBQTFDO0FBQ0E7O0FBRUQsWUFBTSxJQUFJNUksS0FBSixDQUFXLCtCQUErQjRJLFVBQVksb0JBQXRELENBQU47QUFDQSxLQVJEO0FBQUE7O0FBdEIyQyxDOzs7Ozs7Ozs7OztBQ0E1QzNLLE9BQU9DLE1BQVAsQ0FBYztBQUFDZ0Ysb0JBQWlCLE1BQUlBO0FBQXRCLENBQWQ7O0FBQU8sTUFBTUEsZ0JBQU4sQ0FBdUI7QUFDN0IzRSxjQUFZMEQsSUFBWixFQUFrQjtBQUNqQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQTs7QUFFS2hELFFBQU4sQ0FBYXNJLE9BQWIsRUFBc0I3RixLQUF0QjtBQUFBLG9DQUE2QjtBQUM1QnVELGNBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyw2QkFBL0I7QUFFQSxVQUFJeUgsTUFBTSxLQUFLbEgsSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLFVBQTlCLEVBQTBDeUQsaUJBQTFDLENBQTREN0IsT0FBNUQsQ0FBVjtBQUVBSSxhQUFPMEIsU0FBUCxDQUFpQkYsSUFBSUcsQ0FBSixDQUFNcEosR0FBdkIsRUFBNEIsTUFBTTtBQUNqQ2lKLGNBQU14QixPQUFPNEIsSUFBUCxDQUFZLGFBQVosRUFBMkJKLEdBQTNCLENBQU47QUFDQSxPQUZEO0FBSUEsYUFBT0EsSUFBSWpKLEdBQVg7QUFDQSxLQVZEO0FBQUE7O0FBWU1zSixTQUFOLENBQWNDLFNBQWQsRUFBeUIvSCxLQUF6QjtBQUFBLG9DQUFnQztBQUMvQnVELGNBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyw2QkFBNkIrSCxTQUFXLEdBQXZFO0FBRUEsYUFBTyxLQUFLeEgsSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLFVBQTlCLEVBQTBDK0IsV0FBMUMsQ0FBc0QrQixTQUF0RCxDQUFQO0FBQ0EsS0FKRDtBQUFBOztBQU1NNUksUUFBTixDQUFhMEcsT0FBYixFQUFzQjdGLEtBQXRCO0FBQUEsb0NBQTZCO0FBQzVCdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLHlCQUEvQjs7QUFFQSxVQUFJLENBQUM2RixRQUFRbUMsTUFBYixFQUFxQjtBQUNwQixjQUFNLElBQUkxSixLQUFKLENBQVUsd0RBQVYsQ0FBTjtBQUNBOztBQUVELFVBQUksQ0FBQ3VILFFBQVEzSCxFQUFULElBQWUsQ0FBQ3hCLFdBQVdDLE1BQVgsQ0FBa0JzTCxRQUFsQixDQUEyQjlILFdBQTNCLENBQXVDMEYsUUFBUTNILEVBQS9DLENBQXBCLEVBQXdFO0FBQ3ZFLGNBQU0sSUFBSUksS0FBSixDQUFVLGlDQUFWLENBQU47QUFDQTs7QUFFRCxZQUFNbUosTUFBTSxLQUFLbEgsSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLFVBQTlCLEVBQTBDeUQsaUJBQTFDLENBQTREN0IsT0FBNUQsQ0FBWjtBQUNBLFlBQU1tQyxTQUFTdEwsV0FBV0MsTUFBWCxDQUFrQnVMLEtBQWxCLENBQXdCL0gsV0FBeEIsQ0FBb0MwRixRQUFRbUMsTUFBUixDQUFlOUosRUFBbkQsQ0FBZjtBQUVBeEIsaUJBQVd5TCxhQUFYLENBQXlCVixHQUF6QixFQUE4Qk8sTUFBOUI7QUFDQSxLQWZEO0FBQUE7O0FBaUJNSSxZQUFOLENBQWlCdEMsSUFBakIsRUFBdUJELE9BQXZCLEVBQWdDN0YsS0FBaEM7QUFBQSxvQ0FBdUM7QUFDdEN1RCxjQUFRQyxHQUFSLENBQWEsV0FBV3hELEtBQU8sdUJBQS9CO0FBRUEsWUFBTXlILE1BQU0sS0FBS2xILElBQUwsQ0FBVXdGLGFBQVYsR0FBMEI5QixHQUExQixDQUE4QixVQUE5QixFQUEwQ3lELGlCQUExQyxDQUE0RDdCLE9BQTVELENBQVo7QUFFQW5KLGlCQUFXMkwsYUFBWCxDQUF5QkQsVUFBekIsQ0FBb0N0QyxLQUFLNUgsRUFBekMsRUFBNkMsU0FBN0MsRUFBd0RxSSxPQUFPK0IsTUFBUCxDQUFjYixHQUFkLEVBQW1CO0FBQzFFakosYUFBSytKLE9BQU9ySyxFQUFQLEVBRHFFO0FBRTFFc0ssWUFBSSxJQUFJM0ssSUFBSixFQUZzRTtBQUcxRStKLFdBQUd0QyxTQUh1RTtBQUkxRTBDLGdCQUFRMUM7QUFKa0UsT0FBbkIsQ0FBeEQ7QUFNQSxLQVhEO0FBQUE7O0FBYU1tRCxZQUFOLENBQWlCdEMsSUFBakIsRUFBdUJOLE9BQXZCLEVBQWdDN0YsS0FBaEM7QUFBQSxvQ0FBdUM7QUFDdEN1RCxjQUFRQyxHQUFSLENBQWEsV0FBV3hELEtBQU8sK0JBQS9COztBQUVBLFVBQUltRyxRQUFRQSxLQUFLdUMsU0FBYixJQUEwQkMsTUFBTUMsT0FBTixDQUFjekMsS0FBS3VDLFNBQW5CLENBQTlCLEVBQTZEO0FBQzVELGNBQU1qQixNQUFNLEtBQUtsSCxJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsVUFBOUIsRUFBMEN5RCxpQkFBMUMsQ0FBNEQ3QixPQUE1RCxDQUFaO0FBQ0EsY0FBTWdELE9BQU90QyxPQUFPK0IsTUFBUCxDQUFjYixHQUFkLEVBQW1CO0FBQy9CakosZUFBSytKLE9BQU9ySyxFQUFQLEVBRDBCO0FBRS9Ca0ksZUFBS0QsS0FBS2pJLEVBRnFCO0FBRy9Cc0ssY0FBSSxJQUFJM0ssSUFBSixFQUgyQjtBQUkvQitKLGFBQUd0QyxTQUo0QjtBQUsvQjBDLGtCQUFRMUM7QUFMdUIsU0FBbkIsQ0FBYjtBQVFBYSxhQUFLdUMsU0FBTCxDQUFlMUosT0FBZixDQUF3QjRJLENBQUQsSUFBTztBQUM3QixnQkFBTTlCLE9BQU9wSixXQUFXQyxNQUFYLENBQWtCdUwsS0FBbEIsQ0FBd0JZLGlCQUF4QixDQUEwQ2xCLENBQTFDLENBQWI7O0FBQ0EsY0FBSTlCLElBQUosRUFBVTtBQUNUcEosdUJBQVcyTCxhQUFYLENBQXlCRCxVQUF6QixDQUFvQ3RDLEtBQUt0SCxHQUF6QyxFQUE4QyxTQUE5QyxFQUF5RHFLLElBQXpEO0FBQ0E7QUFDRCxTQUxEO0FBTUE7QUFDRCxLQXBCRDtBQUFBOztBQXJENkIsQzs7Ozs7Ozs7Ozs7QUNBOUJ0TSxPQUFPQyxNQUFQLENBQWM7QUFBQ2lGLHdCQUFxQixNQUFJQTtBQUExQixDQUFkOztBQUFPLE1BQU1BLG9CQUFOLENBQTJCO0FBQ2pDNUUsY0FBWTBELElBQVosRUFBa0I7QUFDakIsU0FBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0E7O0FBRUt3SSxPQUFOLENBQVkvSSxLQUFaO0FBQUEsb0NBQW1CO0FBQ2xCdUQsY0FBUUMsR0FBUixDQUFhLGlEQUFpRHhELEtBQU8sRUFBckU7QUFFQSxXQUFLTyxJQUFMLENBQVV5SSxtQkFBVixHQUFnQ3hKLE1BQWhDLENBQXVDO0FBQUVRO0FBQUYsT0FBdkM7QUFDQSxLQUpEO0FBQUE7O0FBTU16QyxRQUFOLENBQWFGLElBQWIsRUFBbUIyQyxLQUFuQjtBQUFBLG9DQUEwQjtBQUN6QnVELGNBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyxnREFBL0IsRUFBZ0YzQyxJQUFoRjs7QUFFQSxVQUFJLE9BQU9BLElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDN0IsY0FBTSxJQUFJaUIsS0FBSixDQUFVLGdFQUFWLENBQU47QUFDQTs7QUFFRCxhQUFPLEtBQUtpQyxJQUFMLENBQVV5SSxtQkFBVixHQUFnQ3pLLE1BQWhDLENBQXVDO0FBQUV5QixhQUFGO0FBQVMzQztBQUFULE9BQXZDLENBQVA7QUFDQSxLQVJEO0FBQUE7O0FBVU00TCx3QkFBTixDQUE2QjVMLElBQTdCLEVBQW1DNkwsWUFBbkMsRUFBaURsSixLQUFqRDtBQUFBLG9DQUF3RDtBQUN2RHVELGNBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyxvRkFBL0IsRUFBb0gzQyxJQUFwSCxFQUEwSDZMLFlBQTFIOztBQUVBLFVBQUksT0FBTzdMLElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDN0IsY0FBTSxJQUFJaUIsS0FBSixDQUFVLGdFQUFWLENBQU47QUFDQTs7QUFFRCxhQUFPLEtBQUtpQyxJQUFMLENBQVV5SSxtQkFBVixHQUFnQ3pLLE1BQWhDLENBQXVDO0FBQUV5QixhQUFGO0FBQVNrSixvQkFBVDtBQUF1QjdMO0FBQXZCLE9BQXZDLENBQVA7QUFDQSxLQVJEO0FBQUE7O0FBVU04TCxVQUFOLENBQWVqTCxFQUFmLEVBQW1COEIsS0FBbkI7QUFBQSxvQ0FBMEI7QUFDekJ1RCxjQUFRQyxHQUFSLENBQWEsV0FBV3hELEtBQU8sNkRBQTZEOUIsRUFBSSxHQUFoRztBQUVBLFlBQU1rTCxTQUFTLEtBQUs3SSxJQUFMLENBQVV5SSxtQkFBVixHQUFnQzdJLFdBQWhDLENBQTRDakMsRUFBNUMsQ0FBZjtBQUVBLGFBQU9rTCxPQUFPL0wsSUFBZDtBQUNBLEtBTkQ7QUFBQTs7QUFRTWdNLG9CQUFOLENBQXlCSCxZQUF6QixFQUF1Q2xKLEtBQXZDO0FBQUEsb0NBQThDO0FBQzdDdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLG1FQUEvQixFQUFtR2tKLFlBQW5HO0FBRUEsWUFBTUksVUFBVSxLQUFLL0ksSUFBTCxDQUFVeUksbUJBQVYsR0FBZ0NwSyxJQUFoQyxDQUFxQztBQUNwRG9CLGFBRG9EO0FBRXBEa0osc0JBQWM7QUFBRUssZ0JBQU1MO0FBQVI7QUFGc0MsT0FBckMsRUFHYnJLLEtBSGEsRUFBaEI7QUFLQSxhQUFPOEosTUFBTUMsT0FBTixDQUFjVSxPQUFkLElBQXlCQSxRQUFRRSxHQUFSLENBQWFDLENBQUQsSUFBT0EsRUFBRXBNLElBQXJCLENBQXpCLEdBQXNELEVBQTdEO0FBQ0EsS0FURDtBQUFBOztBQVdNbUMsUUFBTixDQUFhdEIsRUFBYixFQUFpQjhCLEtBQWpCO0FBQUEsb0NBQXdCO0FBQ3ZCdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLGlEQUFpRDlCLEVBQUksR0FBcEY7QUFFQSxZQUFNa0wsU0FBUyxLQUFLN0ksSUFBTCxDQUFVeUksbUJBQVYsR0FBZ0NoTCxPQUFoQyxDQUF3QztBQUFFUSxhQUFLTixFQUFQO0FBQVc4QjtBQUFYLE9BQXhDLENBQWY7O0FBRUEsVUFBSSxDQUFDb0osTUFBTCxFQUFhO0FBQ1osZUFBTzlELFNBQVA7QUFDQTs7QUFFRCxXQUFLL0UsSUFBTCxDQUFVeUksbUJBQVYsR0FBZ0N4SixNQUFoQyxDQUF1QztBQUFFaEIsYUFBS04sRUFBUDtBQUFXOEI7QUFBWCxPQUF2QztBQUVBLGFBQU9vSixPQUFPL0wsSUFBZDtBQUNBLEtBWkQ7QUFBQTs7QUFjTXFNLHNCQUFOLENBQTJCUixZQUEzQixFQUF5Q2xKLEtBQXpDO0FBQUEsb0NBQWdEO0FBQy9DdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLHVEQUEvQixFQUF1RmtKLFlBQXZGO0FBRUEsWUFBTVMsUUFBUTtBQUNiM0osYUFEYTtBQUVia0osc0JBQWM7QUFDYkssZ0JBQU1MO0FBRE87QUFGRCxPQUFkO0FBT0EsWUFBTUksVUFBVSxLQUFLL0ksSUFBTCxDQUFVeUksbUJBQVYsR0FBZ0NwSyxJQUFoQyxDQUFxQytLLEtBQXJDLEVBQTRDOUssS0FBNUMsRUFBaEI7O0FBRUEsVUFBSSxDQUFDeUssT0FBTCxFQUFjO0FBQ2IsZUFBT2hFLFNBQVA7QUFDQTs7QUFFRCxXQUFLL0UsSUFBTCxDQUFVeUksbUJBQVYsR0FBZ0N4SixNQUFoQyxDQUF1Q21LLEtBQXZDO0FBRUEsYUFBT2hCLE1BQU1DLE9BQU4sQ0FBY1UsT0FBZCxJQUF5QkEsUUFBUUUsR0FBUixDQUFhQyxDQUFELElBQU9BLEVBQUVwTSxJQUFyQixDQUF6QixHQUFzRCxFQUE3RDtBQUNBLEtBbkJEO0FBQUE7O0FBcUJNOEIsUUFBTixDQUFhakIsRUFBYixFQUFpQmIsSUFBakIsRUFBdUJ1TSxNQUF2QixFQUErQjVKLEtBQS9CO0FBQUEsb0NBQXNDO0FBQ3JDdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLDRCQUE0QjlCLEVBQUksT0FBL0QsRUFBdUViLElBQXZFOztBQUVBLFVBQUksT0FBT0EsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM3QixjQUFNLElBQUlpQixLQUFKLENBQVUsZ0VBQVYsQ0FBTjtBQUNBOztBQUVELFlBQU0sSUFBSUEsS0FBSixDQUFVLGtCQUFWLENBQU47QUFDQSxLQVJEO0FBQUE7O0FBckZpQyxDOzs7Ozs7Ozs7OztBQ0FsQy9CLE9BQU9DLE1BQVAsQ0FBYztBQUFDa0YsaUJBQWMsTUFBSUE7QUFBbkIsQ0FBZDtBQUFpRCxJQUFJbUksUUFBSjtBQUFhdE4sT0FBT1csS0FBUCxDQUFhQyxRQUFRLHVDQUFSLENBQWIsRUFBOEQ7QUFBQzBNLFdBQVN6TSxDQUFULEVBQVc7QUFBQ3lNLGVBQVN6TSxDQUFUO0FBQVc7O0FBQXhCLENBQTlELEVBQXdGLENBQXhGOztBQUV2RCxNQUFNc0UsYUFBTixDQUFvQjtBQUMxQjdFLGNBQVkwRCxJQUFaLEVBQWtCO0FBQ2pCLFNBQUtBLElBQUwsR0FBWUEsSUFBWjtBQUNBOztBQUVLaEQsUUFBTixDQUFhNEksSUFBYixFQUFtQm5HLEtBQW5CO0FBQUEsb0NBQTBCO0FBQ3pCdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLDBCQUEvQixFQUEwRG1HLElBQTFEO0FBRUEsWUFBTTJELFNBQVMsS0FBS3ZKLElBQUwsQ0FBVXdGLGFBQVYsR0FBMEI5QixHQUExQixDQUE4QixPQUE5QixFQUF1QzhGLGNBQXZDLENBQXNENUQsSUFBdEQsQ0FBZjtBQUNBLFVBQUk2RCxNQUFKOztBQUVBLGNBQVE3RCxLQUFLOEQsSUFBYjtBQUNDLGFBQUtKLFNBQVNLLE9BQWQ7QUFDQ0YsbUJBQVMsZUFBVDtBQUNBOztBQUNELGFBQUtILFNBQVNNLGFBQWQ7QUFDQ0gsbUJBQVMsb0JBQVQ7QUFDQTs7QUFDRDtBQUNDLGdCQUFNLElBQUkxTCxLQUFKLENBQVUsa0RBQVYsQ0FBTjtBQVJGOztBQVdBLFVBQUk4SCxHQUFKO0FBQ0FILGFBQU8wQixTQUFQLENBQWlCeEIsS0FBS2lFLE9BQUwsQ0FBYWxNLEVBQTlCLEVBQWtDLE1BQU07QUFDdkMsY0FBTUMsT0FBTzhILE9BQU80QixJQUFQLENBQVltQyxNQUFaLEVBQW9CRixPQUFPcEIsU0FBM0IsQ0FBYjtBQUNBdEMsY0FBTWpJLEtBQUtpSSxHQUFYO0FBQ0EsT0FIRDtBQUtBLGFBQU9BLEdBQVA7QUFDQSxLQXhCRDtBQUFBOztBQTBCTTBCLFNBQU4sQ0FBY3VDLE1BQWQsRUFBc0JySyxLQUF0QjtBQUFBLG9DQUE2QjtBQUM1QnVELGNBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyw4QkFBOEJxSyxNQUFRLEdBQXJFO0FBRUEsYUFBTyxLQUFLOUosSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLE9BQTlCLEVBQXVDK0IsV0FBdkMsQ0FBbURxRSxNQUFuRCxDQUFQO0FBQ0EsS0FKRDtBQUFBOztBQU1NQyxXQUFOLENBQWdCQyxRQUFoQixFQUEwQnZLLEtBQTFCO0FBQUEsb0NBQWlDO0FBQ2hDdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLGdDQUFnQ3VLLFFBQVUsR0FBekU7QUFFQSxhQUFPLEtBQUtoSyxJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsT0FBOUIsRUFBdUN1RyxhQUF2QyxDQUFxREQsUUFBckQsQ0FBUDtBQUNBLEtBSkQ7QUFBQTs7QUFNTUUsZ0JBQU4sQ0FBcUJKLE1BQXJCLEVBQTZCckssS0FBN0I7QUFBQSxvQ0FBb0M7QUFDbkN1RCxjQUFRQyxHQUFSLENBQWEsV0FBV3hELEtBQU8sMENBQTBDcUssTUFBUSxHQUFqRjtBQUVBLFlBQU1sRSxPQUFPekosV0FBV0MsTUFBWCxDQUFrQitOLEtBQWxCLENBQXdCdkssV0FBeEIsQ0FBb0NrSyxNQUFwQyxDQUFiOztBQUVBLFVBQUksQ0FBQ2xFLElBQUQsSUFBUyxDQUFDQSxLQUFLeUIsQ0FBZixJQUFvQixDQUFDekIsS0FBS3lCLENBQUwsQ0FBT3BKLEdBQWhDLEVBQXFDO0FBQ3BDLGVBQU84RyxTQUFQO0FBQ0E7O0FBRUQsYUFBTyxLQUFLL0UsSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLE9BQTlCLEVBQXVDK0IsV0FBdkMsQ0FBbURHLEtBQUt5QixDQUFMLENBQU9wSixHQUExRCxDQUFQO0FBQ0EsS0FWRDtBQUFBOztBQVlNbU0sa0JBQU4sQ0FBdUJKLFFBQXZCLEVBQWlDdkssS0FBakM7QUFBQSxvQ0FBd0M7QUFDdkN1RCxjQUFRQyxHQUFSLENBQWEsV0FBV3hELEtBQU8sNENBQTRDdUssUUFBVSxHQUFyRjtBQUVBLFlBQU1wRSxPQUFPekosV0FBV0MsTUFBWCxDQUFrQitOLEtBQWxCLENBQXdCRSxhQUF4QixDQUFzQ0wsUUFBdEMsQ0FBYjs7QUFFQSxVQUFJLENBQUNwRSxJQUFELElBQVMsQ0FBQ0EsS0FBS3lCLENBQWYsSUFBb0IsQ0FBQ3pCLEtBQUt5QixDQUFMLENBQU9wSixHQUFoQyxFQUFxQztBQUNwQyxlQUFPOEcsU0FBUDtBQUNBOztBQUVELGFBQU8sS0FBSy9FLElBQUwsQ0FBVXdGLGFBQVYsR0FBMEI5QixHQUExQixDQUE4QixPQUE5QixFQUF1QytCLFdBQXZDLENBQW1ERyxLQUFLeUIsQ0FBTCxDQUFPcEosR0FBMUQsQ0FBUDtBQUNBLEtBVkQ7QUFBQTs7QUFZTVcsUUFBTixDQUFhZ0gsSUFBYixFQUFtQm5HLEtBQW5CO0FBQUEsb0NBQTBCO0FBQ3pCdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLHNCQUEvQjs7QUFFQSxVQUFJLENBQUNtRyxLQUFLakksRUFBTixJQUFZeEIsV0FBV0MsTUFBWCxDQUFrQitOLEtBQWxCLENBQXdCdkssV0FBeEIsQ0FBb0NnRyxLQUFLakksRUFBekMsQ0FBaEIsRUFBOEQ7QUFDN0QsY0FBTSxJQUFJSSxLQUFKLENBQVUsOEJBQVYsQ0FBTjtBQUNBOztBQUVELFlBQU11TSxLQUFLLEtBQUt0SyxJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsT0FBOUIsRUFBdUM4RixjQUF2QyxDQUFzRDVELElBQXRELENBQVg7QUFFQXpKLGlCQUFXQyxNQUFYLENBQWtCK04sS0FBbEIsQ0FBd0J2TCxNQUF4QixDQUErQjBMLEdBQUdyTSxHQUFsQyxFQUF1Q3FNLEVBQXZDO0FBQ0EsS0FWRDtBQUFBOztBQW5FMEIsQzs7Ozs7Ozs7Ozs7QUNGM0J0TyxPQUFPQyxNQUFQLENBQWM7QUFBQ21GLG9CQUFpQixNQUFJQTtBQUF0QixDQUFkOztBQUFPLE1BQU1BLGdCQUFOLENBQXVCO0FBQzdCOUUsY0FBWTBELElBQVosRUFBa0I7QUFDakIsU0FBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS3VLLGFBQUwsR0FBcUIsRUFBckI7QUFDQSxTQUFLQyxrQkFBTCxHQUEwQixDQUN6QixxQ0FEeUIsRUFDYyxvQkFEZCxFQUNvQyxvQkFEcEMsRUFDMEQsdUJBRDFELEVBRXpCLHVCQUZ5QixFQUVBLGVBRkEsRUFFaUIsZUFGakIsRUFFa0MsOEJBRmxDLEVBRWtFLGtDQUZsRSxFQUd6Qix5QkFIeUIsRUFHRSxpQ0FIRixFQUdxQyxtQ0FIckMsRUFJekIsaUNBSnlCLEVBSVUsNkJBSlYsRUFJeUMsZ0NBSnpDLEVBSTJFLHFCQUozRSxFQUt6QixpQkFMeUIsRUFLTixjQUxNLEVBS1UsMEJBTFYsRUFLc0MseUJBTHRDLEVBS2lFLDZCQUxqRSxFQU16Qix1QkFOeUIsRUFNQSw4QkFOQSxFQU1nQyw0QkFOaEMsRUFNOEQscUJBTjlELEVBT3pCLGdCQVB5QixFQU9QLCtCQVBPLEVBTzBCLG1CQVAxQixFQU8rQywrQkFQL0MsRUFRekIsOEJBUnlCLEVBUU8sZ0NBUlAsRUFReUMsOEJBUnpDLEVBUXlFLDJCQVJ6RSxFQVN6Qix5Q0FUeUIsRUFTa0IsZ0JBVGxCLEVBU29DLDhCQVRwQyxFQVNvRSw4QkFUcEUsRUFVekIsZ0NBVnlCLEVBVVMsOEJBVlQsRUFVeUMsK0JBVnpDLEVBVTBFLG1CQVYxRSxFQVd6QixpQ0FYeUIsRUFXVSxxQkFYVixFQVdpQyxjQVhqQyxFQVdpRCxlQVhqRCxFQVdrRSx5QkFYbEUsRUFZekIsa0JBWnlCLEVBWUwsbUJBWkssRUFZZ0Isa0JBWmhCLEVBWW9DLHlCQVpwQyxFQVkrRCwwQkFaL0QsRUFhekIsaUNBYnlCLEVBYVUsc0JBYlYsRUFha0MsY0FibEMsRUFha0Qsd0JBYmxELEVBYTRFLHNCQWI1RSxDQUExQjtBQWVBOztBQUVLQyxRQUFOLENBQWFoTCxLQUFiO0FBQUEsb0NBQW9CO0FBQ25CdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLCtCQUEvQjtBQUVBLGFBQU90RCxXQUFXQyxNQUFYLENBQWtCc08sUUFBbEIsQ0FBMkJyTSxJQUEzQixDQUFnQztBQUFFSixhQUFLO0FBQUUwTSxnQkFBTSxLQUFLSDtBQUFiO0FBQVAsT0FBaEMsRUFBNEVsTSxLQUE1RSxHQUFvRjJLLEdBQXBGLENBQXlGMkIsQ0FBRCxJQUFPO0FBQ3JHLGFBQUs1SyxJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsVUFBOUIsRUFBMENtSCxZQUExQyxDQUF1REQsQ0FBdkQ7QUFDQSxPQUZNLENBQVA7QUFHQSxLQU5EO0FBQUE7O0FBUU1FLFlBQU4sQ0FBaUJuTixFQUFqQixFQUFxQjhCLEtBQXJCO0FBQUEsb0NBQTRCO0FBQzNCdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLGlDQUFpQzlCLEVBQUksR0FBcEU7O0FBRUEsVUFBSSxDQUFDLEtBQUtvTixjQUFMLENBQW9CcE4sRUFBcEIsRUFBd0I4QixLQUF4QixDQUFMLEVBQXFDO0FBQ3BDLGNBQU0sSUFBSTFCLEtBQUosQ0FBVyxnQkFBZ0JKLEVBQUksb0JBQS9CLENBQU47QUFDQTs7QUFFRCxhQUFPLEtBQUtxQyxJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsVUFBOUIsRUFBMEMrQixXQUExQyxDQUFzRDlILEVBQXRELENBQVA7QUFDQSxLQVJEO0FBQUE7O0FBVU1xTixXQUFOLENBQWdCQyxJQUFoQixFQUFzQnhMLEtBQXRCO0FBQUEsb0NBQTZCO0FBQzVCdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLHlCQUF5QndMLElBQU0sR0FBOUQ7QUFFQSxZQUFNLElBQUlsTixLQUFKLENBQVUseUJBQVYsQ0FBTjtBQUNBLEtBSkQ7QUFBQTs7QUFNTW1OLGFBQU4sQ0FBa0J2TixFQUFsQixFQUFzQjhCLEtBQXRCO0FBQUEsb0NBQTZCO0FBQzVCdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLDJCQUEyQjlCLEVBQUksR0FBOUQ7O0FBRUEsVUFBSSxDQUFDLEtBQUtvTixjQUFMLENBQW9CcE4sRUFBcEIsRUFBd0I4QixLQUF4QixDQUFMLEVBQXFDO0FBQ3BDLGNBQU0sSUFBSTFCLEtBQUosQ0FBVyxnQkFBZ0JKLEVBQUksb0JBQS9CLENBQU47QUFDQTs7QUFFRCxZQUFNLElBQUlJLEtBQUosQ0FBVSx5QkFBVixDQUFOO0FBQ0EsS0FSRDtBQUFBOztBQVVNZ04sZ0JBQU4sQ0FBcUJwTixFQUFyQixFQUF5QjhCLEtBQXpCO0FBQUEsb0NBQWdDO0FBQy9CdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLDZDQUE2QzlCLEVBQUksR0FBaEY7QUFFQSxhQUFPLENBQUMsS0FBSzZNLGtCQUFMLENBQXdCekQsUUFBeEIsQ0FBaUNwSixFQUFqQyxDQUFSO0FBQ0EsS0FKRDtBQUFBOztBQU1Nd04sV0FBTixDQUFnQkMsT0FBaEIsRUFBeUIzTCxLQUF6QjtBQUFBLG9DQUFnQztBQUMvQnVELGNBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyw0QkFBNEIyTCxRQUFRek4sRUFBSSxJQUF2RTs7QUFFQSxVQUFJLENBQUMsS0FBS29OLGNBQUwsQ0FBb0JLLFFBQVF6TixFQUE1QixFQUFnQzhCLEtBQWhDLENBQUwsRUFBNkM7QUFDNUMsY0FBTSxJQUFJMUIsS0FBSixDQUFXLGdCQUFnQnFOLFFBQVF6TixFQUFJLG9CQUF2QyxDQUFOO0FBQ0E7O0FBRUQsWUFBTSxJQUFJSSxLQUFKLENBQVUseUJBQVYsQ0FBTjtBQUNBLEtBUkQ7QUFBQTs7QUE3RDZCLEM7Ozs7Ozs7Ozs7O0FDQTlCL0IsT0FBT0MsTUFBUCxDQUFjO0FBQUNvRixpQkFBYyxNQUFJQTtBQUFuQixDQUFkOztBQUFPLE1BQU1BLGFBQU4sQ0FBb0I7QUFDMUIvRSxjQUFZMEQsSUFBWixFQUFrQjtBQUNqQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQTs7QUFFS3VILFNBQU4sQ0FBYzVCLE1BQWQsRUFBc0JsRyxLQUF0QjtBQUFBLG9DQUE2QjtBQUM1QnVELGNBQVFDLEdBQVIsQ0FBYSxXQUFXeEQsS0FBTyw0QkFBNEJrRyxNQUFRLEdBQW5FO0FBRUEsYUFBTyxLQUFLM0YsSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLE9BQTlCLEVBQXVDK0IsV0FBdkMsQ0FBbURFLE1BQW5ELENBQVA7QUFDQSxLQUpEO0FBQUE7O0FBTU0wRixlQUFOLENBQW9CQyxRQUFwQixFQUE4QjdMLEtBQTlCO0FBQUEsb0NBQXFDO0FBQ3BDdUQsY0FBUUMsR0FBUixDQUFhLFdBQVd4RCxLQUFPLDhCQUE4QjZMLFFBQVUsR0FBdkU7QUFFQSxhQUFPLEtBQUt0TCxJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsT0FBOUIsRUFBdUM2SCxpQkFBdkMsQ0FBeURELFFBQXpELENBQVA7QUFDQSxLQUpEO0FBQUE7O0FBWDBCLEM7Ozs7Ozs7Ozs7O0FDQTNCdFAsT0FBT0MsTUFBUCxDQUFjO0FBQUN5RSxrQkFBZSxNQUFJQSxjQUFwQjtBQUFtQ1gsdUJBQW9CLE1BQUlBLG1CQUEzRDtBQUErRWMscUJBQWtCLE1BQUlBLGlCQUFyRztBQUF1SEMsa0NBQStCLE1BQUlBLDhCQUExSjtBQUF5TEMsaUJBQWMsTUFBSUEsYUFBM007QUFBeU5DLHFCQUFrQixNQUFJQSxpQkFBL087QUFBaVFDLG9CQUFpQixNQUFJQSxnQkFBdFI7QUFBdVNDLHdCQUFxQixNQUFJQSxvQkFBaFU7QUFBcVZDLGlCQUFjLE1BQUlBLGFBQXZXO0FBQXFYQyxvQkFBaUIsTUFBSUEsZ0JBQTFZO0FBQTJaQyxpQkFBYyxNQUFJQTtBQUE3YSxDQUFkO0FBQTJjLElBQUlYLGNBQUo7QUFBbUIxRSxPQUFPVyxLQUFQLENBQWFDLFFBQVEsV0FBUixDQUFiLEVBQWtDO0FBQUM4RCxpQkFBZTdELENBQWYsRUFBaUI7QUFBQzZELHFCQUFlN0QsQ0FBZjtBQUFpQjs7QUFBcEMsQ0FBbEMsRUFBd0UsQ0FBeEU7QUFBMkUsSUFBSWtELG1CQUFKO0FBQXdCL0QsT0FBT1csS0FBUCxDQUFhQyxRQUFRLGNBQVIsQ0FBYixFQUFxQztBQUFDbUQsc0JBQW9CbEQsQ0FBcEIsRUFBc0I7QUFBQ2tELDBCQUFvQmxELENBQXBCO0FBQXNCOztBQUE5QyxDQUFyQyxFQUFxRixDQUFyRjtBQUF3RixJQUFJZ0UsaUJBQUo7QUFBc0I3RSxPQUFPVyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNpRSxvQkFBa0JoRSxDQUFsQixFQUFvQjtBQUFDZ0Usd0JBQWtCaEUsQ0FBbEI7QUFBb0I7O0FBQTFDLENBQW5DLEVBQStFLENBQS9FO0FBQWtGLElBQUlpRSw4QkFBSjtBQUFtQzlFLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxpQkFBUixDQUFiLEVBQXdDO0FBQUNrRSxpQ0FBK0JqRSxDQUEvQixFQUFpQztBQUFDaUUscUNBQStCakUsQ0FBL0I7QUFBaUM7O0FBQXBFLENBQXhDLEVBQThHLENBQTlHO0FBQWlILElBQUlrRSxhQUFKO0FBQWtCL0UsT0FBT1csS0FBUCxDQUFhQyxRQUFRLFFBQVIsQ0FBYixFQUErQjtBQUFDbUUsZ0JBQWNsRSxDQUFkLEVBQWdCO0FBQUNrRSxvQkFBY2xFLENBQWQ7QUFBZ0I7O0FBQWxDLENBQS9CLEVBQW1FLENBQW5FO0FBQXNFLElBQUltRSxpQkFBSjtBQUFzQmhGLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxhQUFSLENBQWIsRUFBb0M7QUFBQ29FLG9CQUFrQm5FLENBQWxCLEVBQW9CO0FBQUNtRSx3QkFBa0JuRSxDQUFsQjtBQUFvQjs7QUFBMUMsQ0FBcEMsRUFBZ0YsQ0FBaEY7QUFBbUYsSUFBSW9FLGdCQUFKO0FBQXFCakYsT0FBT1csS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDcUUsbUJBQWlCcEUsQ0FBakIsRUFBbUI7QUFBQ29FLHVCQUFpQnBFLENBQWpCO0FBQW1COztBQUF4QyxDQUFuQyxFQUE2RSxDQUE3RTtBQUFnRixJQUFJcUUsb0JBQUo7QUFBeUJsRixPQUFPVyxLQUFQLENBQWFDLFFBQVEsZUFBUixDQUFiLEVBQXNDO0FBQUNzRSx1QkFBcUJyRSxDQUFyQixFQUF1QjtBQUFDcUUsMkJBQXFCckUsQ0FBckI7QUFBdUI7O0FBQWhELENBQXRDLEVBQXdGLENBQXhGO0FBQTJGLElBQUlzRSxhQUFKO0FBQWtCbkYsT0FBT1csS0FBUCxDQUFhQyxRQUFRLFNBQVIsQ0FBYixFQUFnQztBQUFDdUUsZ0JBQWN0RSxDQUFkLEVBQWdCO0FBQUNzRSxvQkFBY3RFLENBQWQ7QUFBZ0I7O0FBQWxDLENBQWhDLEVBQW9FLENBQXBFO0FBQXVFLElBQUl1RSxnQkFBSjtBQUFxQnBGLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ3dFLG1CQUFpQnZFLENBQWpCLEVBQW1CO0FBQUN1RSx1QkFBaUJ2RSxDQUFqQjtBQUFtQjs7QUFBeEMsQ0FBbkMsRUFBNkUsQ0FBN0U7QUFBZ0YsSUFBSXdFLGFBQUo7QUFBa0JyRixPQUFPVyxLQUFQLENBQWFDLFFBQVEsU0FBUixDQUFiLEVBQWdDO0FBQUN5RSxnQkFBY3hFLENBQWQsRUFBZ0I7QUFBQ3dFLG9CQUFjeEUsQ0FBZDtBQUFnQjs7QUFBbEMsQ0FBaEMsRUFBb0UsRUFBcEUsRTs7Ozs7Ozs7Ozs7QUNBLy9DYixPQUFPQyxNQUFQLENBQWM7QUFBQzJFLDBCQUF1QixNQUFJQTtBQUE1QixDQUFkOztBQUFPLE1BQU1BLHNCQUFOLENBQTZCO0FBQ25DdEUsY0FBWTBELElBQVosRUFBa0I7QUFDakIsU0FBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0E7O0FBRUR3TCxzQkFBb0IvTCxLQUFwQixFQUEyQjJMLE9BQTNCLEVBQW9DO0FBQ25DLFFBQUk7QUFDSCxXQUFLcEwsSUFBTCxDQUFVRyxXQUFWLEdBQXdCc0wsaUJBQXhCLENBQTBDaE0sS0FBMUMsRUFBaUQyTCxPQUFqRDtBQUNBLEtBRkQsQ0FFRSxPQUFPdE4sQ0FBUCxFQUFVO0FBQ1hrRixjQUFRMEksSUFBUixDQUFhLDRDQUFiLEVBQTJEak0sS0FBM0Q7QUFDQTtBQUNEOztBQVhrQyxDOzs7Ozs7Ozs7OztBQ0FwQ3pELE9BQU9DLE1BQVAsQ0FBYztBQUFDOEUsaUJBQWMsTUFBSUE7QUFBbkIsQ0FBZDs7QUFBTyxNQUFNQSxhQUFOLENBQW9CO0FBQzFCdUcsT0FBSzFKLElBQUwsRUFBVztBQUNWLFFBQUksQ0FBQ0EsS0FBSytOLE9BQUwsQ0FBYUMsT0FBZCxJQUF5QixPQUFPaE8sS0FBSytOLE9BQUwsQ0FBYTdPLElBQXBCLEtBQTZCLFFBQTFELEVBQW9FO0FBQ25FYyxXQUFLK04sT0FBTCxDQUFhQyxPQUFiLEdBQXVCQyxLQUFLQyxTQUFMLENBQWVsTyxLQUFLK04sT0FBTCxDQUFhN08sSUFBNUIsQ0FBdkI7QUFDQTs7QUFFRGtHLFlBQVFDLEdBQVIsQ0FBYSxXQUFXckYsS0FBSzZCLEtBQU8sc0NBQXBDLEVBQTJFN0IsSUFBM0U7QUFFQSxXQUFPLElBQUlWLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDdkMyTyxXQUFLekUsSUFBTCxDQUFVMUosS0FBSzZMLE1BQWYsRUFBdUI3TCxLQUFLb08sR0FBNUIsRUFBaUNwTyxLQUFLK04sT0FBdEMsRUFBK0MsQ0FBQzdOLENBQUQsRUFBSW1PLE1BQUosS0FBZTtBQUM3RCxlQUFPbk8sSUFBSVYsT0FBT1UsRUFBRW9PLFFBQVQsQ0FBSixHQUF5Qi9PLFFBQVE4TyxNQUFSLENBQWhDO0FBQ0EsT0FGRDtBQUdBLEtBSk0sQ0FBUDtBQUtBOztBQWJ5QixDOzs7Ozs7Ozs7OztBQ0EzQmpRLE9BQU9DLE1BQVAsQ0FBYztBQUFDK0UscUJBQWtCLE1BQUlBO0FBQXZCLENBQWQ7O0FBQU8sTUFBTUEsaUJBQU4sQ0FBd0I7QUFDOUIxRSxjQUFZMEQsSUFBWixFQUFrQjtBQUNqQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQTs7QUFFS21NLGNBQU4sQ0FBbUJDLElBQW5CLEVBQXlCOUcsT0FBekI7QUFBQSxvQ0FBa0M7QUFDakMsWUFBTTRCLE1BQU0sS0FBS2xILElBQUwsQ0FBVXdGLGFBQVYsR0FBMEI5QixHQUExQixDQUE4QixVQUE5QixFQUEwQzJJLGNBQTFDLENBQXlEL0csT0FBekQsQ0FBWjtBQUNBLFlBQU0yRyx1QkFBZSxLQUFLak0sSUFBTCxDQUFVbUcsVUFBVixHQUF1Qm1HLGtCQUF2QixHQUE0Q0MsZUFBNUMsQ0FBNERILElBQTVELEVBQWtFbEYsR0FBbEUsQ0FBZixDQUFOOztBQUVBLFVBQUksT0FBTytFLE1BQVAsS0FBa0IsU0FBdEIsRUFBaUM7QUFDaEMsZUFBT0EsTUFBUDtBQUNBLE9BRkQsTUFFTztBQUNOLGVBQU8sS0FBS2pNLElBQUwsQ0FBVXdGLGFBQVYsR0FBMEI5QixHQUExQixDQUE4QixVQUE5QixFQUEwQ3lELGlCQUExQyxDQUE0RDhFLE1BQTVELENBQVA7QUFDQSxPQVJnQyxDQVNqQztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLEtBZkQ7QUFBQTs7QUFpQk1PLFdBQU4sQ0FBZ0JKLElBQWhCLEVBQXNCeEcsSUFBdEI7QUFBQSxvQ0FBNEI7QUFDM0IsWUFBTTBFLEtBQUssS0FBS3RLLElBQUwsQ0FBVXdGLGFBQVYsR0FBMEI5QixHQUExQixDQUE4QixPQUE5QixFQUF1QytJLFdBQXZDLENBQW1EN0csSUFBbkQsQ0FBWDtBQUNBLFlBQU1xRyx1QkFBZSxLQUFLak0sSUFBTCxDQUFVbUcsVUFBVixHQUF1Qm1HLGtCQUF2QixHQUE0Q0MsZUFBNUMsQ0FBNERILElBQTVELEVBQWtFOUIsRUFBbEUsQ0FBZixDQUFOOztBQUVBLFVBQUksT0FBTzJCLE1BQVAsS0FBa0IsU0FBdEIsRUFBaUM7QUFDaEMsZUFBT0EsTUFBUDtBQUNBLE9BRkQsTUFFTztBQUNOLGVBQU8sS0FBS2pNLElBQUwsQ0FBVXdGLGFBQVYsR0FBMEI5QixHQUExQixDQUE4QixPQUE5QixFQUF1QzhGLGNBQXZDLENBQXNEeUMsTUFBdEQsQ0FBUDtBQUNBLE9BUjBCLENBUzNCO0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsS0FmRDtBQUFBOztBQXRCOEIsQzs7Ozs7Ozs7Ozs7QUNBL0JqUSxPQUFPQyxNQUFQLENBQWM7QUFBQ3lRLGNBQVcsTUFBSUE7QUFBaEIsQ0FBZDs7QUFBQSxNQUFNQyxhQUFhLFVBQVMzTSxJQUFULEVBQWU7QUFDakMsU0FBTyxJQUFJOUMsT0FBSixDQUFhQyxPQUFELElBQWE7QUFDL0IsUUFBSVEsS0FBS2lQLFlBQVksTUFBTTtBQUMxQixVQUFJNU0sS0FBSzZNLFNBQUwsTUFBb0I3TSxLQUFLOE0sUUFBTCxFQUF4QixFQUF5QztBQUN4Q0Msc0JBQWNwUCxFQUFkO0FBQ0FBLGFBQUssQ0FBQyxDQUFOO0FBQ0FSO0FBQ0E7QUFDRCxLQU5RLEVBTU4sR0FOTSxDQUFUO0FBT0EsR0FSTSxDQUFQO0FBU0EsQ0FWRDs7QUFZQSxNQUFNNlAsZUFBZSxVQUFTaE4sSUFBVCxFQUFlO0FBQ25DLFNBQU8sSUFBSTlDLE9BQUosQ0FBYUMsT0FBRCxJQUFhO0FBQy9CLFFBQUlRLEtBQUtpUCxZQUFZLE1BQU07QUFDMUIsVUFBSSxDQUFDNU0sS0FBSzZNLFNBQUwsRUFBRCxJQUFxQixDQUFDN00sS0FBSzhNLFFBQUwsRUFBMUIsRUFBMkM7QUFDMUNDLHNCQUFjcFAsRUFBZDtBQUNBQSxhQUFLLENBQUMsQ0FBTjtBQUNBUjtBQUNBO0FBQ0QsS0FOUSxFQU1OLEdBTk0sQ0FBVDtBQU9BLEdBUk0sQ0FBUDtBQVNBLENBVkQ7O0FBWU8sTUFBTXVQLFVBQU4sQ0FBaUI7QUFDdkJwUSxjQUFZMEQsSUFBWixFQUFrQjtBQUNqQixTQUFLaU4sS0FBTCxHQUFhak4sSUFBYjs7QUFFQSxTQUFLa04sV0FBTDtBQUNBOztBQUVETCxjQUFZO0FBQ1gsV0FBTyxPQUFPLEtBQUtJLEtBQVosS0FBc0IsV0FBdEIsSUFBcUMsS0FBS0EsS0FBTCxDQUFXSixTQUFYLEVBQTVDO0FBQ0E7O0FBRURDLGFBQVc7QUFDVixXQUFPLE9BQU8sS0FBS0csS0FBWixLQUFzQixXQUF0QixJQUFxQyxLQUFLQSxLQUFMLENBQVdKLFNBQVgsRUFBckMsSUFBK0QsS0FBS0ksS0FBTCxDQUFXSCxRQUFYLEVBQXRFO0FBQ0E7O0FBRURJLGdCQUFjO0FBQ2IsVUFBTUMsV0FBVyxJQUFqQjtBQUVBekgsV0FBTzBILE9BQVAsQ0FBZTtBQUNkLDBCQUFvQjtBQUNuQixlQUFPRCxTQUFTTixTQUFULEVBQVA7QUFDQSxPQUhhOztBQUtkLHlCQUFtQjtBQUNsQixlQUFPTSxTQUFTTCxRQUFULEVBQVA7QUFDQSxPQVBhOztBQVNkLHlCQUFtQjtBQUNsQixZQUFJLENBQUNwSCxPQUFPQyxNQUFQLEVBQUwsRUFBc0I7QUFDckIsZ0JBQU0sSUFBSUQsT0FBTzNILEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQzVEMEwsb0JBQVE7QUFEb0QsV0FBdkQsQ0FBTjtBQUdBOztBQUVELFlBQUksQ0FBQ3ROLFdBQVdrUixLQUFYLENBQWlCQyxhQUFqQixDQUErQjVILE9BQU9DLE1BQVAsRUFBL0IsRUFBZ0QsYUFBaEQsQ0FBTCxFQUFxRTtBQUNwRSxnQkFBTSxJQUFJRCxPQUFPM0gsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsYUFBN0MsRUFBNEQ7QUFDakUwTCxvQkFBUTtBQUR5RCxXQUE1RCxDQUFOO0FBR0E7O0FBRUR0TixtQkFBV29SLFFBQVgsQ0FBb0I1TyxHQUFwQixDQUF3Qix3QkFBeEIsRUFBa0QsSUFBbEQ7QUFFQXpCLGdCQUFRZ0osS0FBUixDQUFjeUcsV0FBV1EsU0FBU0YsS0FBcEIsQ0FBZDtBQUNBLE9BekJhOztBQTJCZCwwQkFBb0I7QUFDbkIsWUFBSSxDQUFDdkgsT0FBT0MsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLGdCQUFNLElBQUlELE9BQU8zSCxLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxFQUF1RDtBQUM1RDBMLG9CQUFRO0FBRG9ELFdBQXZELENBQU47QUFHQTs7QUFFRCxZQUFJLENBQUN0TixXQUFXa1IsS0FBWCxDQUFpQkMsYUFBakIsQ0FBK0I1SCxPQUFPQyxNQUFQLEVBQS9CLEVBQWdELGFBQWhELENBQUwsRUFBcUU7QUFDcEUsZ0JBQU0sSUFBSUQsT0FBTzNILEtBQVgsQ0FBaUIsMEJBQWpCLEVBQTZDLGFBQTdDLEVBQTREO0FBQ2pFMEwsb0JBQVE7QUFEeUQsV0FBNUQsQ0FBTjtBQUdBOztBQUVEdE4sbUJBQVdvUixRQUFYLENBQW9CNU8sR0FBcEIsQ0FBd0Isd0JBQXhCLEVBQWtELEtBQWxEO0FBRUF6QixnQkFBUWdKLEtBQVIsQ0FBYzhHLGFBQWFHLFNBQVNGLEtBQXRCLENBQWQ7QUFDQTs7QUEzQ2EsS0FBZjtBQTZDQTs7QUEvRHNCLEM7Ozs7Ozs7Ozs7O0FDeEJ4QmpSLE9BQU9DLE1BQVAsQ0FBYztBQUFDdVIsZUFBWSxNQUFJQTtBQUFqQixDQUFkOztBQUFPLE1BQU1BLFdBQU4sQ0FBa0I7QUFDeEJsUixjQUFZMEQsSUFBWixFQUFrQnlOLE9BQWxCLEVBQTJCO0FBQzFCLFNBQUtSLEtBQUwsR0FBYWpOLElBQWI7QUFDQSxTQUFLME4sUUFBTCxHQUFnQkQsT0FBaEI7QUFDQSxTQUFLRSxHQUFMLEdBQVcsSUFBSXhSLFdBQVd5UixHQUFYLENBQWVDLFFBQW5CLENBQTRCO0FBQ3RDQyxlQUFTLE1BRDZCO0FBRXRDQyxzQkFBZ0IsSUFGc0I7QUFHdENDLGtCQUFZLEtBSDBCO0FBSXRDQyxrQkFBWSxLQUowQjtBQUt0Q0MsWUFBTS9SLFdBQVd5UixHQUFYLENBQWVPLFdBQWY7QUFMZ0MsS0FBNUIsQ0FBWDtBQVFBLFNBQUtDLG1CQUFMO0FBQ0E7O0FBRURDLGNBQVkxQyxPQUFaLEVBQXFCMkMsU0FBckIsRUFBZ0M7QUFDL0IsVUFBTUMsU0FBU0MsSUFBSTVSLE9BQUosQ0FBWSxRQUFaLENBQWY7O0FBQ0EsVUFBTTZSLFNBQVMsSUFBSUYsTUFBSixDQUFXO0FBQUVHLGVBQVMvQyxRQUFRK0M7QUFBbkIsS0FBWCxDQUFmO0FBRUEsV0FBT2hKLE9BQU9pSixTQUFQLENBQWtCdEssUUFBRCxJQUFjO0FBQ3JDb0ssYUFBT0csRUFBUCxDQUFVLE1BQVYsRUFBa0JsSixPQUFPbUosZUFBUCxDQUF1QixDQUFDQyxTQUFELEVBQVlDLElBQVosS0FBcUI7QUFDN0QsWUFBSUQsY0FBY1IsU0FBbEIsRUFBNkI7QUFDNUIsaUJBQU9qSyxTQUFTLElBQUlxQixPQUFPM0gsS0FBWCxDQUFpQixlQUFqQixFQUFtQyx1QkFBdUJ1USxTQUFXLGNBQWNRLFNBQVcsWUFBOUYsQ0FBVCxDQUFQO0FBQ0E7O0FBRUQsY0FBTUUsV0FBVyxFQUFqQjtBQUNBRCxhQUFLSCxFQUFMLENBQVEsTUFBUixFQUFnQmxKLE9BQU9tSixlQUFQLENBQXdCL1IsSUFBRCxJQUFVO0FBQ2hEa1MsbUJBQVNDLElBQVQsQ0FBY25TLElBQWQ7QUFDQSxTQUZlLENBQWhCO0FBSUFpUyxhQUFLSCxFQUFMLENBQVEsS0FBUixFQUFlbEosT0FBT21KLGVBQVAsQ0FBdUIsTUFBTXhLLFNBQVNVLFNBQVQsRUFBb0JtSyxPQUFPQyxNQUFQLENBQWNILFFBQWQsQ0FBcEIsQ0FBN0IsQ0FBZjtBQUNBLE9BWGlCLENBQWxCO0FBYUFyRCxjQUFReUQsSUFBUixDQUFhWCxNQUFiO0FBQ0EsS0FmTSxHQUFQO0FBZ0JBOztBQUVETCx3QkFBc0I7QUFDckIsVUFBTWlCLGVBQWUsS0FBS3BDLEtBQTFCO0FBQ0EsVUFBTVEsVUFBVSxLQUFLQyxRQUFyQjtBQUNBLFVBQU00QixjQUFjLEtBQUtqQixXQUF6QjtBQUVBLFNBQUtWLEdBQUwsQ0FBUzRCLFFBQVQsQ0FBa0IsRUFBbEIsRUFBc0I7QUFBRUMsb0JBQWM7QUFBaEIsS0FBdEIsRUFBOEM7QUFDN0M5TCxZQUFNO0FBQ0wsY0FBTStMLE9BQU9oQyxRQUFRL0osR0FBUixHQUFjdUYsR0FBZCxDQUFrQnlHLE9BQU87QUFDckMsZ0JBQU05UixPQUFPOFIsSUFBSUMsT0FBSixFQUFiO0FBQ0EvUixlQUFLZ1MsU0FBTCxHQUFpQkYsSUFBSUcsY0FBSixHQUFxQkMsZUFBdEM7QUFDQWxTLGVBQUs0QyxNQUFMLEdBQWNrUCxJQUFJSyxTQUFKLEVBQWQ7QUFFQSxpQkFBT25TLElBQVA7QUFDQSxTQU5ZLENBQWI7QUFRQSxlQUFPekIsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0I5USxPQUFsQixDQUEwQjtBQUFFdVE7QUFBRixTQUExQixDQUFQO0FBQ0EsT0FYNEM7O0FBWTdDUSxhQUFPO0FBQ04sWUFBSUMsSUFBSjs7QUFFQSxZQUFJLEtBQUtDLFVBQUwsQ0FBZ0JuRSxHQUFwQixFQUF5QjtBQUN4QixnQkFBTUMsU0FBU0YsS0FBS3pFLElBQUwsQ0FBVSxLQUFWLEVBQWlCLEtBQUs2SSxVQUFMLENBQWdCbkUsR0FBakMsRUFBc0M7QUFBRW9FLCtCQUFtQjtBQUFFQyx3QkFBVTtBQUFaO0FBQXJCLFdBQXRDLENBQWY7O0FBRUEsY0FBSXBFLE9BQU9xRSxVQUFQLEtBQXNCLEdBQXRCLElBQTZCLENBQUNyRSxPQUFPeUMsT0FBUCxDQUFlLGNBQWYsQ0FBOUIsSUFBZ0V6QyxPQUFPeUMsT0FBUCxDQUFlLGNBQWYsTUFBbUMsaUJBQXZHLEVBQTBIO0FBQ3pILG1CQUFPdlMsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0JPLE9BQWxCLENBQTBCO0FBQUVDLHFCQUFPO0FBQVQsYUFBMUIsQ0FBUDtBQUNBOztBQUVETixpQkFBT2hCLE9BQU91QixJQUFQLENBQVl4RSxPQUFPTCxPQUFuQixFQUE0QixRQUE1QixDQUFQO0FBQ0EsU0FSRCxNQVFPO0FBQ05zRSxpQkFBT1osWUFBWSxLQUFLM0QsT0FBakIsRUFBMEIsS0FBMUIsQ0FBUDtBQUNBOztBQUVELFlBQUksQ0FBQ3VFLElBQUwsRUFBVztBQUNWLGlCQUFPL1QsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0JPLE9BQWxCLENBQTBCO0FBQUVDLG1CQUFPO0FBQVQsV0FBMUIsQ0FBUDtBQUNBOztBQUVELGNBQU1FLE1BQU14VCxRQUFRZ0osS0FBUixDQUFjdUgsUUFBUWtELEdBQVIsQ0FBWVQsS0FBS1UsUUFBTCxDQUFjLFFBQWQsQ0FBWixFQUFxQyxLQUFyQyxDQUFkLENBQVo7QUFDQSxjQUFNaFQsT0FBTzhTLElBQUlHLFVBQUosRUFBYixDQXBCTSxDQXNCTjs7QUFDQSxZQUFJSCxJQUFJSSxNQUFKLEVBQUosRUFBa0I7QUFDakJsVCxlQUFLNEMsTUFBTCxHQUFja1EsSUFBSUksTUFBSixHQUFhZixTQUFiLEVBQWQ7QUFDQSxTQUZELE1BRU87QUFDTm5TLGVBQUs0QyxNQUFMLEdBQWMsZ0JBQWQ7QUFDQTs7QUFFRCxlQUFPckUsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0I5USxPQUFsQixDQUEwQjtBQUNoQ2dCLGVBQUt0QyxJQUQyQjtBQUVoQ21ULHVCQUFhTCxJQUFJTSx3QkFBSixFQUZtQjtBQUdoQ0MsMEJBQWdCUCxJQUFJUSxpQkFBSjtBQUhnQixTQUExQixDQUFQO0FBS0E7O0FBOUM0QyxLQUE5QztBQWlEQSxTQUFLdkQsR0FBTCxDQUFTNEIsUUFBVCxDQUFrQixXQUFsQixFQUErQjtBQUFFQyxvQkFBYztBQUFoQixLQUEvQixFQUF3RDtBQUN2RDlMLFlBQU07QUFDTCxjQUFNK0wsT0FBT2hDLFFBQVEvSixHQUFSLEdBQWN1RixHQUFkLENBQWtCeUcsT0FBTztBQUNyQyxpQkFBTztBQUNOL1IsZ0JBQUkrUixJQUFJdFAsS0FBSixFQURFO0FBRU53UCx1QkFBV0YsSUFBSUcsY0FBSixHQUFxQkM7QUFGMUIsV0FBUDtBQUlBLFNBTFksQ0FBYjtBQU9BLGVBQU8zVCxXQUFXeVIsR0FBWCxDQUFlb0MsRUFBZixDQUFrQjlRLE9BQWxCLENBQTBCO0FBQUV1UTtBQUFGLFNBQTFCLENBQVA7QUFDQTs7QUFWc0QsS0FBeEQ7QUFhQSxTQUFLOUIsR0FBTCxDQUFTNEIsUUFBVCxDQUFrQixLQUFsQixFQUF5QjtBQUFFQyxvQkFBYztBQUFoQixLQUF6QixFQUFpRDtBQUNoRDlMLFlBQU07QUFDTFYsZ0JBQVFDLEdBQVIsQ0FBWSxVQUFaLEVBQXdCLEtBQUtrTyxTQUFMLENBQWV4VCxFQUF2QztBQUNBLGNBQU0rUixNQUFNakMsUUFBUTNDLFVBQVIsQ0FBbUIsS0FBS3FHLFNBQUwsQ0FBZXhULEVBQWxDLENBQVo7O0FBRUEsWUFBSStSLEdBQUosRUFBUztBQUNSLGdCQUFNOVIsT0FBTzhSLElBQUlDLE9BQUosRUFBYjtBQUNBL1IsZUFBSzRDLE1BQUwsR0FBY2tQLElBQUlLLFNBQUosRUFBZDtBQUVBLGlCQUFPNVQsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0I5USxPQUFsQixDQUEwQjtBQUFFZ0IsaUJBQUt0QztBQUFQLFdBQTFCLENBQVA7QUFDQSxTQUxELE1BS087QUFDTixpQkFBT3pCLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCb0IsUUFBbEIsQ0FBNEIsOEJBQThCLEtBQUtELFNBQUwsQ0FBZXhULEVBQUksRUFBN0UsQ0FBUDtBQUNBO0FBQ0QsT0FiK0M7O0FBY2hEc1MsYUFBTztBQUNOak4sZ0JBQVFDLEdBQVIsQ0FBWSxXQUFaLEVBQXlCLEtBQUtrTyxTQUFMLENBQWV4VCxFQUF4QyxFQURNLENBRU47O0FBRUEsWUFBSXVTLElBQUo7O0FBRUEsWUFBSSxLQUFLQyxVQUFMLENBQWdCbkUsR0FBcEIsRUFBeUI7QUFDeEIsZ0JBQU1DLFNBQVNGLEtBQUt6RSxJQUFMLENBQVUsS0FBVixFQUFpQixLQUFLNkksVUFBTCxDQUFnQm5FLEdBQWpDLEVBQXNDO0FBQUVvRSwrQkFBbUI7QUFBRUMsd0JBQVU7QUFBWjtBQUFyQixXQUF0QyxDQUFmOztBQUVBLGNBQUlwRSxPQUFPcUUsVUFBUCxLQUFzQixHQUF0QixJQUE2QixDQUFDckUsT0FBT3lDLE9BQVAsQ0FBZSxjQUFmLENBQTlCLElBQWdFekMsT0FBT3lDLE9BQVAsQ0FBZSxjQUFmLE1BQW1DLGlCQUF2RyxFQUEwSDtBQUN6SCxtQkFBT3ZTLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCTyxPQUFsQixDQUEwQjtBQUFFQyxxQkFBTztBQUFULGFBQTFCLENBQVA7QUFDQTs7QUFFRE4saUJBQU9oQixPQUFPdUIsSUFBUCxDQUFZeEUsT0FBT0wsT0FBbkIsRUFBNEIsUUFBNUIsQ0FBUDtBQUNBLFNBUkQsTUFRTztBQUNOc0UsaUJBQU9aLFlBQVksS0FBSzNELE9BQWpCLEVBQTBCLEtBQTFCLENBQVA7QUFDQTs7QUFFRCxZQUFJLENBQUN1RSxJQUFMLEVBQVc7QUFDVixpQkFBTy9ULFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCTyxPQUFsQixDQUEwQjtBQUFFQyxtQkFBTztBQUFULFdBQTFCLENBQVA7QUFDQTs7QUFFRCxjQUFNRSxNQUFNeFQsUUFBUWdKLEtBQVIsQ0FBY3VILFFBQVE3TyxNQUFSLENBQWVzUixLQUFLVSxRQUFMLENBQWMsUUFBZCxDQUFmLENBQWQsQ0FBWjtBQUNBLGNBQU1oVCxPQUFPOFMsSUFBSUcsVUFBSixFQUFiLENBdkJNLENBeUJOOztBQUNBLFlBQUlILElBQUlJLE1BQUosRUFBSixFQUFrQjtBQUNqQmxULGVBQUs0QyxNQUFMLEdBQWNrUSxJQUFJSSxNQUFKLEdBQWFmLFNBQWIsRUFBZDtBQUNBLFNBRkQsTUFFTztBQUNOblMsZUFBSzRDLE1BQUwsR0FBYyxnQkFBZDtBQUNBOztBQUVELGVBQU9yRSxXQUFXeVIsR0FBWCxDQUFlb0MsRUFBZixDQUFrQjlRLE9BQWxCLENBQTBCO0FBQ2hDZ0IsZUFBS3RDLElBRDJCO0FBRWhDbVQsdUJBQWFMLElBQUlNLHdCQUFKLEVBRm1CO0FBR2hDQywwQkFBZ0JQLElBQUlRLGlCQUFKO0FBSGdCLFNBQTFCLENBQVA7QUFLQSxPQW5EK0M7O0FBb0RoRHZOLGVBQVM7QUFDUlgsZ0JBQVFDLEdBQVIsQ0FBWSxlQUFaLEVBQTZCLEtBQUtrTyxTQUFMLENBQWV4VCxFQUE1QztBQUNBLGNBQU0rUixNQUFNakMsUUFBUTNDLFVBQVIsQ0FBbUIsS0FBS3FHLFNBQUwsQ0FBZXhULEVBQWxDLENBQVo7O0FBRUEsWUFBSStSLEdBQUosRUFBUztBQUNSeFMsa0JBQVFnSixLQUFSLENBQWN1SCxRQUFReE8sTUFBUixDQUFleVEsSUFBSXRQLEtBQUosRUFBZixDQUFkO0FBRUEsZ0JBQU14QyxPQUFPOFIsSUFBSUMsT0FBSixFQUFiO0FBQ0EvUixlQUFLNEMsTUFBTCxHQUFja1AsSUFBSUssU0FBSixFQUFkO0FBRUEsaUJBQU81VCxXQUFXeVIsR0FBWCxDQUFlb0MsRUFBZixDQUFrQjlRLE9BQWxCLENBQTBCO0FBQUVnQixpQkFBS3RDO0FBQVAsV0FBMUIsQ0FBUDtBQUNBLFNBUEQsTUFPTztBQUNOLGlCQUFPekIsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0JvQixRQUFsQixDQUE0Qiw4QkFBOEIsS0FBS0QsU0FBTCxDQUFleFQsRUFBSSxFQUE3RSxDQUFQO0FBQ0E7QUFDRDs7QUFsRStDLEtBQWpEO0FBcUVBLFNBQUtnUSxHQUFMLENBQVM0QixRQUFULENBQWtCLFVBQWxCLEVBQThCO0FBQUVDLG9CQUFjO0FBQWhCLEtBQTlCLEVBQXNEO0FBQ3JEOUwsWUFBTTtBQUNMVixnQkFBUUMsR0FBUixDQUFZLDBCQUFaLEVBQXdDLEtBQUtrTyxTQUFMLENBQWV4VCxFQUF2RDtBQUNBLGNBQU0rUixNQUFNakMsUUFBUTNDLFVBQVIsQ0FBbUIsS0FBS3FHLFNBQUwsQ0FBZXhULEVBQWxDLENBQVo7O0FBRUEsWUFBSStSLEdBQUosRUFBUztBQUNSLGdCQUFNOVIsT0FBTzhSLElBQUlDLE9BQUosRUFBYjtBQUVBLGlCQUFPeFQsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0I5USxPQUFsQixDQUEwQjtBQUFFbVMsNkJBQWlCelQsS0FBS3lUO0FBQXhCLFdBQTFCLENBQVA7QUFDQSxTQUpELE1BSU87QUFDTixpQkFBT2xWLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCb0IsUUFBbEIsQ0FBNEIsOEJBQThCLEtBQUtELFNBQUwsQ0FBZXhULEVBQUksRUFBN0UsQ0FBUDtBQUNBO0FBQ0Q7O0FBWm9ELEtBQXREO0FBZUEsU0FBS2dRLEdBQUwsQ0FBUzRCLFFBQVQsQ0FBa0IsZUFBbEIsRUFBbUM7QUFBRUMsb0JBQWM7QUFBaEIsS0FBbkMsRUFBNEQ7QUFDM0Q5TCxZQUFNO0FBQ0xWLGdCQUFRQyxHQUFSLENBQWEsV0FBVyxLQUFLa08sU0FBTCxDQUFleFQsRUFBSSxnQkFBM0M7QUFDQSxjQUFNK1IsTUFBTWpDLFFBQVEzQyxVQUFSLENBQW1CLEtBQUtxRyxTQUFMLENBQWV4VCxFQUFsQyxDQUFaOztBQUVBLFlBQUkrUixHQUFKLEVBQVM7QUFDUixnQkFBTUUsWUFBWUYsSUFBSUcsY0FBSixHQUFxQkMsZUFBckIsSUFBd0MsRUFBMUQ7QUFFQSxpQkFBTzNULFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCOVEsT0FBbEIsQ0FBMEI7QUFBRTBRO0FBQUYsV0FBMUIsQ0FBUDtBQUNBLFNBSkQsTUFJTztBQUNOLGlCQUFPelQsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0JvQixRQUFsQixDQUE0Qiw4QkFBOEIsS0FBS0QsU0FBTCxDQUFleFQsRUFBSSxFQUE3RSxDQUFQO0FBQ0E7QUFDRDs7QUFaMEQsS0FBNUQ7QUFlQSxTQUFLZ1EsR0FBTCxDQUFTNEIsUUFBVCxDQUFrQixVQUFsQixFQUE4QjtBQUFFQyxvQkFBYztBQUFoQixLQUE5QixFQUFzRDtBQUNyRDlMLFlBQU07QUFDTFYsZ0JBQVFDLEdBQVIsQ0FBYSxXQUFXLEtBQUtrTyxTQUFMLENBQWV4VCxFQUFJLFdBQTNDO0FBQ0EsY0FBTStSLE1BQU1qQyxRQUFRM0MsVUFBUixDQUFtQixLQUFLcUcsU0FBTCxDQUFleFQsRUFBbEMsQ0FBWjs7QUFFQSxZQUFJK1IsR0FBSixFQUFTO0FBQ1IsZ0JBQU07QUFBRTRCLGtCQUFGO0FBQVVDO0FBQVYsY0FBb0IsS0FBS0Msa0JBQUwsRUFBMUI7QUFDQSxnQkFBTTtBQUFFQyxnQkFBRjtBQUFRQyxrQkFBUjtBQUFnQnRJO0FBQWhCLGNBQTBCLEtBQUt1SSxjQUFMLEVBQWhDO0FBRUEsZ0JBQU1DLFdBQVc1TCxPQUFPK0IsTUFBUCxDQUFjLEVBQWQsRUFBa0JxQixLQUFsQixFQUF5QjtBQUFFM0osbUJBQU9pUSxJQUFJdFAsS0FBSjtBQUFULFdBQXpCLENBQWpCO0FBQ0EsZ0JBQU15UixVQUFVO0FBQ2ZKLGtCQUFNQSxPQUFPQSxJQUFQLEdBQWM7QUFBRUssMEJBQVksQ0FBQztBQUFmLGFBREw7QUFFZkMsa0JBQU1ULE1BRlM7QUFHZlUsbUJBQU9ULEtBSFE7QUFJZkc7QUFKZSxXQUFoQjtBQU9BLGdCQUFNTyxPQUFPL1UsUUFBUWdKLEtBQVIsQ0FBY21KLGFBQWE2QyxhQUFiLEdBQTZCN1QsSUFBN0IsQ0FBa0N1VCxRQUFsQyxFQUE0Q0MsT0FBNUMsQ0FBZCxDQUFiO0FBRUEsaUJBQU8xVixXQUFXeVIsR0FBWCxDQUFlb0MsRUFBZixDQUFrQjlRLE9BQWxCLENBQTBCO0FBQUUrUztBQUFGLFdBQTFCLENBQVA7QUFDQSxTQWZELE1BZU87QUFDTixpQkFBTzlWLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCb0IsUUFBbEIsQ0FBNEIsOEJBQThCLEtBQUtELFNBQUwsQ0FBZXhULEVBQUksRUFBN0UsQ0FBUDtBQUNBO0FBQ0Q7O0FBdkJvRCxLQUF0RDtBQTBCQSxTQUFLZ1EsR0FBTCxDQUFTNEIsUUFBVCxDQUFrQixjQUFsQixFQUFrQztBQUFFQyxvQkFBYztBQUFoQixLQUFsQyxFQUEwRDtBQUN6RDlMLFlBQU07QUFDTFYsZ0JBQVFDLEdBQVIsQ0FBYSxXQUFXLEtBQUtrTyxTQUFMLENBQWV4VCxFQUFJLGVBQTNDO0FBQ0EsY0FBTStSLE1BQU1qQyxRQUFRM0MsVUFBUixDQUFtQixLQUFLcUcsU0FBTCxDQUFleFQsRUFBbEMsQ0FBWjs7QUFFQSxZQUFJK1IsR0FBSixFQUFTO0FBQ1IsZ0JBQU1uQyxXQUFXdkgsT0FBTytCLE1BQVAsQ0FBYyxFQUFkLEVBQWtCMkgsSUFBSUcsY0FBSixHQUFxQnRDLFFBQXZDLENBQWpCO0FBRUF2SCxpQkFBT21NLElBQVAsQ0FBWTVFLFFBQVosRUFBc0I5TyxPQUF0QixDQUErQjJULENBQUQsSUFBTztBQUNwQyxnQkFBSTdFLFNBQVM2RSxDQUFULEVBQVlDLE1BQWhCLEVBQXdCO0FBQ3ZCLHFCQUFPOUUsU0FBUzZFLENBQVQsQ0FBUDtBQUNBO0FBQ0QsV0FKRDtBQU1BLGlCQUFPalcsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0I5USxPQUFsQixDQUEwQjtBQUFFcU87QUFBRixXQUExQixDQUFQO0FBQ0EsU0FWRCxNQVVPO0FBQ04saUJBQU9wUixXQUFXeVIsR0FBWCxDQUFlb0MsRUFBZixDQUFrQm9CLFFBQWxCLENBQTRCLDhCQUE4QixLQUFLRCxTQUFMLENBQWV4VCxFQUFJLEVBQTdFLENBQVA7QUFDQTtBQUNELE9BbEJ3RDs7QUFtQnpEc1MsYUFBTztBQUNOak4sZ0JBQVFDLEdBQVIsQ0FBYSxZQUFZLEtBQUtrTyxTQUFMLENBQWV4VCxFQUFJLGVBQTVDOztBQUNBLFlBQUksQ0FBQyxLQUFLd1MsVUFBTixJQUFvQixDQUFDLEtBQUtBLFVBQUwsQ0FBZ0I1QyxRQUF6QyxFQUFtRDtBQUNsRCxpQkFBT3BSLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCTyxPQUFsQixDQUEwQix5Q0FBMUIsQ0FBUDtBQUNBOztBQUVELGNBQU1iLE1BQU1qQyxRQUFRM0MsVUFBUixDQUFtQixLQUFLcUcsU0FBTCxDQUFleFQsRUFBbEMsQ0FBWjs7QUFFQSxZQUFJLENBQUMrUixHQUFMLEVBQVU7QUFDVCxpQkFBT3ZULFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCb0IsUUFBbEIsQ0FBNEIsOEJBQThCLEtBQUtELFNBQUwsQ0FBZXhULEVBQUksRUFBN0UsQ0FBUDtBQUNBOztBQUVELGNBQU00UCxXQUFXbUMsSUFBSUcsY0FBSixHQUFxQnRDLFFBQXRDO0FBRUEsY0FBTXpPLFVBQVUsRUFBaEI7QUFDQSxhQUFLcVIsVUFBTCxDQUFnQjVDLFFBQWhCLENBQXlCOU8sT0FBekIsQ0FBa0NtTSxDQUFELElBQU87QUFDdkMsY0FBSTJDLFNBQVMzQyxFQUFFak4sRUFBWCxDQUFKLEVBQW9CO0FBQ25CVCxvQkFBUWdKLEtBQVIsQ0FBY3VILFFBQVE2RSxrQkFBUixHQUE2QkMsZ0JBQTdCLENBQThDLEtBQUtwQixTQUFMLENBQWV4VCxFQUE3RCxFQUFpRWlOLENBQWpFLENBQWQsRUFEbUIsQ0FFbkI7O0FBQ0E5TCxvQkFBUW1RLElBQVIsQ0FBYXJFLENBQWI7QUFDQTtBQUNELFNBTkQ7QUFRQSxlQUFPek8sV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0I5USxPQUFsQixDQUEwQjtBQUFFSjtBQUFGLFNBQTFCLENBQVA7QUFDQTs7QUEzQ3dELEtBQTFEO0FBOENBLFNBQUs2TyxHQUFMLENBQVM0QixRQUFULENBQWtCLHlCQUFsQixFQUE2QztBQUFFQyxvQkFBYztBQUFoQixLQUE3QyxFQUFxRTtBQUNwRTlMLFlBQU07QUFDTFYsZ0JBQVFDLEdBQVIsQ0FBYSxtQkFBbUIsS0FBS2tPLFNBQUwsQ0FBZXhULEVBQUksY0FBYyxLQUFLd1QsU0FBTCxDQUFlcUIsU0FBVyxFQUEzRjs7QUFFQSxZQUFJO0FBQ0gsZ0JBQU1wSCxVQUFVcUMsUUFBUTZFLGtCQUFSLEdBQTZCRyxhQUE3QixDQUEyQyxLQUFLdEIsU0FBTCxDQUFleFQsRUFBMUQsRUFBOEQsS0FBS3dULFNBQUwsQ0FBZXFCLFNBQTdFLENBQWhCO0FBRUFyVyxxQkFBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0I5USxPQUFsQixDQUEwQjtBQUFFa007QUFBRixXQUExQjtBQUNBLFNBSkQsQ0FJRSxPQUFPdE4sQ0FBUCxFQUFVO0FBQ1gsY0FBSUEsRUFBRXdILE9BQUYsQ0FBVXlCLFFBQVYsQ0FBbUIsa0JBQW5CLENBQUosRUFBNEM7QUFDM0MsbUJBQU81SyxXQUFXeVIsR0FBWCxDQUFlb0MsRUFBZixDQUFrQm9CLFFBQWxCLENBQTRCLDhDQUE4QyxLQUFLRCxTQUFMLENBQWVxQixTQUFXLEdBQXBHLENBQVA7QUFDQSxXQUZELE1BRU8sSUFBSTFVLEVBQUV3SCxPQUFGLENBQVV5QixRQUFWLENBQW1CLGNBQW5CLENBQUosRUFBd0M7QUFDOUMsbUJBQU81SyxXQUFXeVIsR0FBWCxDQUFlb0MsRUFBZixDQUFrQm9CLFFBQWxCLENBQTRCLDhCQUE4QixLQUFLRCxTQUFMLENBQWV4VCxFQUFJLEVBQTdFLENBQVA7QUFDQSxXQUZNLE1BRUE7QUFDTixtQkFBT3hCLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCTyxPQUFsQixDQUEwQnpTLEVBQUV3SCxPQUE1QixDQUFQO0FBQ0E7QUFDRDtBQUNELE9BakJtRTs7QUFrQnBFMkssYUFBTztBQUNOak4sZ0JBQVFDLEdBQVIsQ0FBYSxvQkFBb0IsS0FBS2tPLFNBQUwsQ0FBZXhULEVBQUksY0FBYyxLQUFLd1QsU0FBTCxDQUFlcUIsU0FBVyxFQUE1Rjs7QUFFQSxZQUFJLENBQUMsS0FBS3JDLFVBQUwsQ0FBZ0IvRSxPQUFyQixFQUE4QjtBQUM3QixpQkFBT2pQLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCTyxPQUFsQixDQUEwQiwwREFBMUIsQ0FBUDtBQUNBOztBQUVELFlBQUk7QUFDSHJULGtCQUFRZ0osS0FBUixDQUFjdUgsUUFBUTZFLGtCQUFSLEdBQTZCQyxnQkFBN0IsQ0FBOEMsS0FBS3BCLFNBQUwsQ0FBZXhULEVBQTdELEVBQWlFLEtBQUt3UyxVQUFMLENBQWdCL0UsT0FBakYsQ0FBZDtBQUVBLGlCQUFPalAsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0I5USxPQUFsQixFQUFQO0FBQ0EsU0FKRCxDQUlFLE9BQU9wQixDQUFQLEVBQVU7QUFDWCxjQUFJQSxFQUFFd0gsT0FBRixDQUFVeUIsUUFBVixDQUFtQixrQkFBbkIsQ0FBSixFQUE0QztBQUMzQyxtQkFBTzVLLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCb0IsUUFBbEIsQ0FBNEIsOENBQThDLEtBQUtELFNBQUwsQ0FBZXFCLFNBQVcsR0FBcEcsQ0FBUDtBQUNBLFdBRkQsTUFFTyxJQUFJMVUsRUFBRXdILE9BQUYsQ0FBVXlCLFFBQVYsQ0FBbUIsY0FBbkIsQ0FBSixFQUF3QztBQUM5QyxtQkFBTzVLLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCb0IsUUFBbEIsQ0FBNEIsOEJBQThCLEtBQUtELFNBQUwsQ0FBZXhULEVBQUksRUFBN0UsQ0FBUDtBQUNBLFdBRk0sTUFFQTtBQUNOLG1CQUFPeEIsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0JPLE9BQWxCLENBQTBCelMsRUFBRXdILE9BQTVCLENBQVA7QUFDQTtBQUNEO0FBQ0Q7O0FBdENtRSxLQUFyRTtBQXlDQSxTQUFLcUksR0FBTCxDQUFTNEIsUUFBVCxDQUFrQixZQUFsQixFQUFnQztBQUFFQyxvQkFBYztBQUFoQixLQUFoQyxFQUF3RDtBQUN2RDlMLFlBQU07QUFDTFYsZ0JBQVFDLEdBQVIsQ0FBYSxXQUFXLEtBQUtrTyxTQUFMLENBQWV4VCxFQUFJLGFBQTNDO0FBQ0EsY0FBTStSLE1BQU1qQyxRQUFRM0MsVUFBUixDQUFtQixLQUFLcUcsU0FBTCxDQUFleFQsRUFBbEMsQ0FBWjs7QUFFQSxZQUFJK1IsR0FBSixFQUFTO0FBQ1IsaUJBQU92VCxXQUFXeVIsR0FBWCxDQUFlb0MsRUFBZixDQUFrQjlRLE9BQWxCLENBQTBCO0FBQUVzQixvQkFBUWtQLElBQUlLLFNBQUo7QUFBVixXQUExQixDQUFQO0FBQ0EsU0FGRCxNQUVPO0FBQ04saUJBQU81VCxXQUFXeVIsR0FBWCxDQUFlb0MsRUFBZixDQUFrQm9CLFFBQWxCLENBQTRCLDhCQUE4QixLQUFLRCxTQUFMLENBQWV4VCxFQUFJLEVBQTdFLENBQVA7QUFDQTtBQUNELE9BVnNEOztBQVd2RHNTLGFBQU87QUFDTixZQUFJLENBQUMsS0FBS0UsVUFBTCxDQUFnQjNQLE1BQWpCLElBQTJCLE9BQU8sS0FBSzJQLFVBQUwsQ0FBZ0IzUCxNQUF2QixLQUFrQyxRQUFqRSxFQUEyRTtBQUMxRSxpQkFBT3JFLFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCTyxPQUFsQixDQUEwQixrRUFBMUIsQ0FBUDtBQUNBOztBQUVEdk4sZ0JBQVFDLEdBQVIsQ0FBYSxZQUFZLEtBQUtrTyxTQUFMLENBQWV4VCxFQUFJLGNBQTVDLEVBQTJELEtBQUt3UyxVQUFMLENBQWdCM1AsTUFBM0U7QUFDQSxjQUFNa1AsTUFBTWpDLFFBQVEzQyxVQUFSLENBQW1CLEtBQUtxRyxTQUFMLENBQWV4VCxFQUFsQyxDQUFaOztBQUVBLFlBQUkrUixHQUFKLEVBQVM7QUFDUixnQkFBTXpELFNBQVMvTyxRQUFRZ0osS0FBUixDQUFjdUgsUUFBUWlGLFlBQVIsQ0FBcUJoRCxJQUFJdFAsS0FBSixFQUFyQixFQUFrQyxLQUFLK1AsVUFBTCxDQUFnQjNQLE1BQWxELENBQWQsQ0FBZjtBQUVBLGlCQUFPckUsV0FBV3lSLEdBQVgsQ0FBZW9DLEVBQWYsQ0FBa0I5USxPQUFsQixDQUEwQjtBQUFFc0Isb0JBQVF5TCxPQUFPOEQsU0FBUDtBQUFWLFdBQTFCLENBQVA7QUFDQSxTQUpELE1BSU87QUFDTixpQkFBTzVULFdBQVd5UixHQUFYLENBQWVvQyxFQUFmLENBQWtCb0IsUUFBbEIsQ0FBNEIsOEJBQThCLEtBQUtELFNBQUwsQ0FBZXhULEVBQUksRUFBN0UsQ0FBUDtBQUNBO0FBQ0Q7O0FBMUJzRCxLQUF4RDtBQTRCQTs7QUF4VnVCLEM7Ozs7Ozs7Ozs7O0FDQXpCM0IsT0FBT0MsTUFBUCxDQUFjO0FBQUMwVyxhQUFVLE1BQUlBLFNBQWY7QUFBeUJDLHFCQUFrQixNQUFJQSxpQkFBL0M7QUFBaUVDLHFCQUFrQixNQUFJQTtBQUF2RixDQUFkO0FBQXlILElBQUlDLFNBQUosRUFBY0MsY0FBZDtBQUE2Qi9XLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSwyQ0FBUixDQUFiLEVBQWtFO0FBQUNrVyxZQUFValcsQ0FBVixFQUFZO0FBQUNpVyxnQkFBVWpXLENBQVY7QUFBWSxHQUExQjs7QUFBMkJrVyxpQkFBZWxXLENBQWYsRUFBaUI7QUFBQ2tXLHFCQUFlbFcsQ0FBZjtBQUFpQjs7QUFBOUQsQ0FBbEUsRUFBa0ksQ0FBbEk7QUFFL0ksTUFBTThWLFlBQVkzTSxPQUFPQyxNQUFQLENBQWM7QUFDdEMrTSxhQUFXLFdBRDJCO0FBRXRDQyxlQUFhLGFBRnlCO0FBR3RDQyxlQUFhLGFBSHlCO0FBSXRDQyxxQkFBbUIsa0JBSm1CO0FBS3RDQyx1QkFBcUIsb0JBTGlCO0FBTXRDQyxpQkFBZSxlQU51QjtBQU90Q0Msb0JBQWtCLGtCQVBvQjtBQVF0Q0MsbUJBQWlCLGlCQVJxQjtBQVN0Q0MsbUJBQWlCO0FBVHFCLENBQWQsQ0FBbEI7O0FBWUEsTUFBTVosaUJBQU4sQ0FBd0I7QUFDOUJ0VyxjQUFZMEQsSUFBWixFQUFrQnlULGNBQWxCLEVBQWtDQyxjQUFsQyxFQUFrREMsUUFBbEQsRUFBNEQ7QUFDM0QsU0FBSzNULElBQUwsR0FBWUEsSUFBWjtBQUNBLFNBQUt5VCxjQUFMLEdBQXNCQSxjQUF0QjtBQUNBLFNBQUtDLGNBQUwsR0FBc0JBLGNBQXRCO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQkEsUUFBaEI7QUFFQSxTQUFLRixjQUFMLENBQW9CN0UsRUFBcEIsQ0FBdUIrRCxVQUFVSyxTQUFqQyxFQUE0QyxLQUFLWSxVQUFMLENBQWdCclAsSUFBaEIsQ0FBcUIsSUFBckIsQ0FBNUM7QUFDQSxTQUFLa1AsY0FBTCxDQUFvQjdFLEVBQXBCLENBQXVCK0QsVUFBVVEsaUJBQWpDLEVBQW9ELEtBQUtVLGtCQUFMLENBQXdCdFAsSUFBeEIsQ0FBNkIsSUFBN0IsQ0FBcEQ7QUFDQSxTQUFLa1AsY0FBTCxDQUFvQjdFLEVBQXBCLENBQXVCK0QsVUFBVVMsbUJBQWpDLEVBQXNELEtBQUtVLG1CQUFMLENBQXlCdlAsSUFBekIsQ0FBOEIsSUFBOUIsQ0FBdEQ7QUFDQSxTQUFLa1AsY0FBTCxDQUFvQjdFLEVBQXBCLENBQXVCK0QsVUFBVU0sV0FBakMsRUFBOEMsS0FBS2MsWUFBTCxDQUFrQnhQLElBQWxCLENBQXVCLElBQXZCLENBQTlDO0FBQ0EsU0FBS2tQLGNBQUwsQ0FBb0I3RSxFQUFwQixDQUF1QitELFVBQVVPLFdBQWpDLEVBQThDLEtBQUtjLFlBQUwsQ0FBa0J6UCxJQUFsQixDQUF1QixJQUF2QixDQUE5QztBQUNBLFNBQUtrUCxjQUFMLENBQW9CN0UsRUFBcEIsQ0FBdUIrRCxVQUFVVSxhQUFqQyxFQUFnRCxLQUFLWSxjQUFMLENBQW9CMVAsSUFBcEIsQ0FBeUIsSUFBekIsQ0FBaEQ7QUFDQSxTQUFLa1AsY0FBTCxDQUFvQjdFLEVBQXBCLENBQXVCK0QsVUFBVVcsZ0JBQWpDLEVBQW1ELEtBQUtZLGlCQUFMLENBQXVCM1AsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FBbkQ7QUFDQSxTQUFLa1AsY0FBTCxDQUFvQjdFLEVBQXBCLENBQXVCK0QsVUFBVVksZUFBakMsRUFBa0QsS0FBS1ksZ0JBQUwsQ0FBc0I1UCxJQUF0QixDQUEyQixJQUEzQixDQUFsRDtBQUNBLFNBQUtrUCxjQUFMLENBQW9CN0UsRUFBcEIsQ0FBdUIrRCxVQUFVYSxlQUFqQyxFQUFrRCxLQUFLWSxnQkFBTCxDQUFzQjdQLElBQXRCLENBQTJCLElBQTNCLENBQWxEO0FBQ0E7O0FBRUtxUCxZQUFOLENBQWlCblUsS0FBakI7QUFBQSxvQ0FBd0I7QUFDdkIsb0JBQU0sS0FBS08sSUFBTCxDQUFVbUcsVUFBVixHQUF1QmtPLE9BQXZCLENBQStCNVUsS0FBL0IsQ0FBTjtBQUNBLFdBQUtpVSxjQUFMLENBQW9CWSxJQUFwQixDQUF5QjNCLFVBQVVLLFNBQW5DLEVBQThDdlQsS0FBOUM7QUFDQSxLQUhEO0FBQUE7O0FBS01vVSxvQkFBTixDQUF5QjtBQUFFcFUsU0FBRjtBQUFTZTtBQUFULEdBQXpCO0FBQUEsb0NBQTRDO0FBQzNDLFdBQUttVCxRQUFMLENBQWNoVixHQUFkLENBQW1CLEdBQUdnVSxVQUFVUSxpQkFBbUIsSUFBSTFULEtBQU8sRUFBOUQsRUFBaUU7QUFBRUEsYUFBRjtBQUFTZSxjQUFUO0FBQWlCK1QsY0FBTSxJQUFJalgsSUFBSjtBQUF2QixPQUFqRTs7QUFFQSxVQUFJeVYsZUFBZWxHLFNBQWYsQ0FBeUJyTSxNQUF6QixDQUFKLEVBQXNDO0FBQ3JDLHNCQUFNLEtBQUtSLElBQUwsQ0FBVW1HLFVBQVYsR0FBdUJxTyxNQUF2QixDQUE4Qi9VLEtBQTlCLENBQU47QUFDQSxhQUFLaVUsY0FBTCxDQUFvQlksSUFBcEIsQ0FBeUIzQixVQUFVUSxpQkFBbkMsRUFBc0Q7QUFBRTFULGVBQUY7QUFBU2U7QUFBVCxTQUF0RDtBQUNBLE9BSEQsTUFHTyxJQUFJdVMsZUFBZTBCLFVBQWYsQ0FBMEJqVSxNQUExQixDQUFKLEVBQXVDO0FBQzdDLHNCQUFNLEtBQUtSLElBQUwsQ0FBVW1HLFVBQVYsR0FBdUJ1TyxPQUF2QixDQUErQmpWLEtBQS9CLEVBQXNDcVQsVUFBVTZCLGlCQUFWLEtBQWdDblUsTUFBdEUsQ0FBTjtBQUNBLGFBQUtrVCxjQUFMLENBQW9CWSxJQUFwQixDQUF5QjNCLFVBQVVRLGlCQUFuQyxFQUFzRDtBQUFFMVQsZUFBRjtBQUFTZTtBQUFULFNBQXREO0FBQ0E7QUFDRCxLQVZEO0FBQUE7O0FBWU1zVCxxQkFBTixDQUEwQjtBQUFFclUsU0FBRjtBQUFTMkw7QUFBVCxHQUExQjtBQUFBLG9DQUE4QztBQUM3QyxXQUFLdUksUUFBTCxDQUFjaFYsR0FBZCxDQUFtQixHQUFHZ1UsVUFBVVMsbUJBQXFCLElBQUkzVCxLQUFPLElBQUkyTCxRQUFRek4sRUFBSSxFQUFoRixFQUFtRjtBQUFFOEIsYUFBRjtBQUFTMkwsZUFBVDtBQUFrQm1KLGNBQU0sSUFBSWpYLElBQUo7QUFBeEIsT0FBbkY7QUFFQSxvQkFBTSxLQUFLMEMsSUFBTCxDQUFVbUcsVUFBVixHQUF1Qm1NLGtCQUF2QixHQUE0Q0MsZ0JBQTVDLENBQTZEOVMsS0FBN0QsRUFBb0UyTCxPQUFwRSxDQUFOO0FBQ0EsV0FBS3NJLGNBQUwsQ0FBb0JZLElBQXBCLENBQXlCM0IsVUFBVVMsbUJBQW5DLEVBQXdEO0FBQUUzVDtBQUFGLE9BQXhEO0FBQ0EsS0FMRDtBQUFBOztBQU9NdVUsY0FBTixDQUFtQnZVLEtBQW5CO0FBQUEsb0NBQTBCO0FBQ3pCLFdBQUtrVSxRQUFMLENBQWNoVixHQUFkLENBQW1CLEdBQUdnVSxVQUFVTyxXQUFhLElBQUl6VCxLQUFPLEVBQXhELEVBQTJEO0FBQUVBLGFBQUY7QUFBUzhVLGNBQU0sSUFBSWpYLElBQUo7QUFBZixPQUEzRDtBQUVBLFlBQU1zWCw0QkFBb0IsS0FBSzVVLElBQUwsQ0FBVTZVLFVBQVYsR0FBdUIzVyxXQUF2QixDQUFtQ3VCLEtBQW5DLENBQXBCLENBQU47QUFFQSxvQkFBTSxLQUFLTyxJQUFMLENBQVVtRyxVQUFWLEdBQXVCdkgsTUFBdkIsQ0FBOEJnVyxZQUFZRSxHQUExQyxDQUFOO0FBQ0EsV0FBS3BCLGNBQUwsQ0FBb0JZLElBQXBCLENBQXlCM0IsVUFBVU8sV0FBbkMsRUFBZ0R6VCxLQUFoRDtBQUNBLEtBUEQ7QUFBQTs7QUFTTXNVLGNBQU4sQ0FBbUJ0VSxLQUFuQjtBQUFBLG9DQUEwQjtBQUN6QixvQkFBTSxLQUFLTyxJQUFMLENBQVVtRyxVQUFWLEdBQXVCbEgsTUFBdkIsQ0FBOEJRLEtBQTlCLENBQU47QUFDQSxXQUFLaVUsY0FBTCxDQUFvQlksSUFBcEIsQ0FBeUIzQixVQUFVTSxXQUFuQyxFQUFnRHhULEtBQWhEO0FBQ0EsS0FIRDtBQUFBOztBQUtNd1UsZ0JBQU4sQ0FBcUJsUixPQUFyQjtBQUFBLG9DQUE4QjtBQUM3QixXQUFLMlEsY0FBTCxDQUFvQlksSUFBcEIsQ0FBeUIzQixVQUFVVSxhQUFuQyxFQUFrRHRRLE9BQWxEO0FBQ0EsS0FGRDtBQUFBOztBQUlNbVIsbUJBQU4sQ0FBd0JuUixPQUF4QjtBQUFBLG9DQUFpQztBQUNoQyxXQUFLMlEsY0FBTCxDQUFvQlksSUFBcEIsQ0FBeUIzQixVQUFVVyxnQkFBbkMsRUFBcUR2USxPQUFyRDtBQUNBLEtBRkQ7QUFBQTs7QUFJTW9SLGtCQUFOLENBQXVCcFIsT0FBdkI7QUFBQSxvQ0FBZ0M7QUFDL0IsV0FBSzJRLGNBQUwsQ0FBb0JZLElBQXBCLENBQXlCM0IsVUFBVVksZUFBbkMsRUFBb0R4USxPQUFwRDtBQUNBLEtBRkQ7QUFBQTs7QUFJTXFSLGtCQUFOLENBQXVCclIsT0FBdkI7QUFBQSxvQ0FBZ0M7QUFDL0IsV0FBSzJRLGNBQUwsQ0FBb0JZLElBQXBCLENBQXlCM0IsVUFBVWEsZUFBbkMsRUFBb0R6USxPQUFwRDtBQUNBLEtBRkQ7QUFBQTs7QUFwRThCOztBQXlFeEIsTUFBTThQLGlCQUFOLENBQXdCO0FBQzlCdlcsY0FBWTBELElBQVosRUFBa0I7QUFDakIsU0FBS3lULGNBQUwsR0FBc0IsSUFBSS9OLE9BQU9xUCxRQUFYLENBQW9CLGFBQXBCLEVBQW1DO0FBQUVDLGtCQUFZO0FBQWQsS0FBbkMsQ0FBdEI7QUFDQSxTQUFLdkIsY0FBTCxDQUFvQndCLFVBQXBCLEdBQWlDLElBQWpDO0FBQ0EsU0FBS3hCLGNBQUwsQ0FBb0J5QixTQUFwQixDQUE4QixNQUE5QjtBQUNBLFNBQUt6QixjQUFMLENBQW9CMEIsU0FBcEIsQ0FBOEIsS0FBOUI7QUFDQSxTQUFLMUIsY0FBTCxDQUFvQjJCLFVBQXBCLENBQStCLE1BQS9CLEVBTGlCLENBT2pCOztBQUNBLFNBQUsxQixjQUFMLEdBQXNCLElBQUloTyxPQUFPcVAsUUFBWCxDQUFvQixNQUFwQixFQUE0QjtBQUFFQyxrQkFBWTtBQUFkLEtBQTVCLENBQXRCO0FBQ0EsU0FBS3RCLGNBQUwsQ0FBb0J1QixVQUFwQixHQUFpQyxJQUFqQztBQUNBLFNBQUt2QixjQUFMLENBQW9Cd0IsU0FBcEIsQ0FBOEIsS0FBOUI7QUFDQSxTQUFLeEIsY0FBTCxDQUFvQnlCLFNBQXBCLENBQThCLEtBQTlCO0FBQ0EsU0FBS3pCLGNBQUwsQ0FBb0IwQixVQUFwQixDQUErQixNQUEvQjtBQUVBLFNBQUt6QixRQUFMLEdBQWdCLElBQUluVixHQUFKLEVBQWhCO0FBQ0EsU0FBSzZXLFFBQUwsR0FBZ0IsSUFBSXpDLGlCQUFKLENBQXNCNVMsSUFBdEIsRUFBNEIsS0FBS3lULGNBQWpDLEVBQWlELEtBQUtDLGNBQXRELEVBQXNFLEtBQUtDLFFBQTNFLENBQWhCO0FBQ0E7O0FBRUsxVCxVQUFOLENBQWVSLEtBQWY7QUFBQSxvQ0FBc0I7QUFDckIsV0FBS2dVLGNBQUwsQ0FBb0JhLElBQXBCLENBQXlCM0IsVUFBVUssU0FBbkMsRUFBOEN2VCxLQUE5QztBQUNBLFdBQUtpVSxjQUFMLENBQW9CWSxJQUFwQixDQUF5QjNCLFVBQVVLLFNBQW5DLEVBQThDdlQsS0FBOUM7QUFDQSxLQUhEO0FBQUE7O0FBS01hLFlBQU4sQ0FBaUJiLEtBQWpCO0FBQUEsb0NBQXdCO0FBQ3ZCLFdBQUtnVSxjQUFMLENBQW9CYSxJQUFwQixDQUF5QjNCLFVBQVVNLFdBQW5DLEVBQWdEeFQsS0FBaEQ7QUFDQSxXQUFLaVUsY0FBTCxDQUFvQlksSUFBcEIsQ0FBeUIzQixVQUFVTSxXQUFuQyxFQUFnRHhULEtBQWhEO0FBQ0EsS0FIRDtBQUFBOztBQUtNWSxZQUFOLENBQWlCWixLQUFqQjtBQUFBLG9DQUF3QjtBQUN2QixVQUFJLEtBQUtrVSxRQUFMLENBQWNwUSxHQUFkLENBQW1CLEdBQUdvUCxVQUFVTyxXQUFhLElBQUl6VCxLQUFPLEVBQXhELENBQUosRUFBZ0U7QUFDL0QsYUFBS2tVLFFBQUwsQ0FBY2hRLE1BQWQsQ0FBc0IsR0FBR2dQLFVBQVVPLFdBQWEsSUFBSXpULEtBQU8sRUFBM0Q7QUFDQTtBQUNBOztBQUVELFdBQUtnVSxjQUFMLENBQW9CYSxJQUFwQixDQUF5QjNCLFVBQVVPLFdBQW5DLEVBQWdEelQsS0FBaEQ7QUFDQSxXQUFLaVUsY0FBTCxDQUFvQlksSUFBcEIsQ0FBeUIzQixVQUFVTyxXQUFuQyxFQUFnRHpULEtBQWhEO0FBQ0EsS0FSRDtBQUFBOztBQVVNZ0Isa0JBQU4sQ0FBdUJoQixLQUF2QixFQUE4QmUsTUFBOUI7QUFBQSxvQ0FBc0M7QUFDckMsVUFBSSxLQUFLbVQsUUFBTCxDQUFjcFEsR0FBZCxDQUFtQixHQUFHb1AsVUFBVVEsaUJBQW1CLElBQUkxVCxLQUFPLEVBQTlELENBQUosRUFBc0U7QUFDckUsY0FBTTZWLFVBQVUsS0FBSzNCLFFBQUwsQ0FBY2pRLEdBQWQsQ0FBbUIsR0FBR2lQLFVBQVVRLGlCQUFtQixJQUFJMVQsS0FBTyxFQUE5RCxDQUFoQjs7QUFDQSxZQUFJNlYsUUFBUTlVLE1BQVIsS0FBbUJBLE1BQXZCLEVBQStCO0FBQzlCLGVBQUttVCxRQUFMLENBQWNoUSxNQUFkLENBQXNCLEdBQUdnUCxVQUFVUSxpQkFBbUIsSUFBSTFULEtBQU8sRUFBakU7QUFDQTtBQUNBO0FBQ0Q7O0FBRUQsV0FBS2dVLGNBQUwsQ0FBb0JhLElBQXBCLENBQXlCM0IsVUFBVVEsaUJBQW5DLEVBQXNEO0FBQUUxVCxhQUFGO0FBQVNlO0FBQVQsT0FBdEQ7QUFDQSxXQUFLa1QsY0FBTCxDQUFvQlksSUFBcEIsQ0FBeUIzQixVQUFVUSxpQkFBbkMsRUFBc0Q7QUFBRTFULGFBQUY7QUFBU2U7QUFBVCxPQUF0RDtBQUNBLEtBWEQ7QUFBQTs7QUFhTWlMLG1CQUFOLENBQXdCaE0sS0FBeEIsRUFBK0IyTCxPQUEvQjtBQUFBLG9DQUF3QztBQUN2QyxVQUFJLEtBQUt1SSxRQUFMLENBQWNwUSxHQUFkLENBQW1CLEdBQUdvUCxVQUFVUyxtQkFBcUIsSUFBSTNULEtBQU8sSUFBSTJMLFFBQVF6TixFQUFJLEVBQWhGLENBQUosRUFBd0Y7QUFDdkYsYUFBS2dXLFFBQUwsQ0FBY2hRLE1BQWQsQ0FBc0IsR0FBR2dQLFVBQVVTLG1CQUFxQixJQUFJM1QsS0FBTyxJQUFJMkwsUUFBUXpOLEVBQUksRUFBbkY7QUFDQTtBQUNBOztBQUVELFdBQUs4VixjQUFMLENBQW9CYSxJQUFwQixDQUF5QjNCLFVBQVVTLG1CQUFuQyxFQUF3RDtBQUFFM1QsYUFBRjtBQUFTMkw7QUFBVCxPQUF4RDtBQUNBLFdBQUtzSSxjQUFMLENBQW9CWSxJQUFwQixDQUF5QjNCLFVBQVVTLG1CQUFuQyxFQUF3RDtBQUFFM1Q7QUFBRixPQUF4RDtBQUNBLEtBUkQ7QUFBQTs7QUFVTXVGLGNBQU4sQ0FBbUJqQyxPQUFuQjtBQUFBLG9DQUE0QjtBQUMzQixXQUFLMFEsY0FBTCxDQUFvQmEsSUFBcEIsQ0FBeUIzQixVQUFVVSxhQUFuQyxFQUFrRHRRLE9BQWxEO0FBQ0EsV0FBSzJRLGNBQUwsQ0FBb0JZLElBQXBCLENBQXlCM0IsVUFBVVUsYUFBbkMsRUFBa0R0USxPQUFsRDtBQUNBLEtBSEQ7QUFBQTs7QUFLTWUsaUJBQU4sQ0FBc0JmLE9BQXRCO0FBQUEsb0NBQStCO0FBQzlCLFdBQUswUSxjQUFMLENBQW9CYSxJQUFwQixDQUF5QjNCLFVBQVVXLGdCQUFuQyxFQUFxRHZRLE9BQXJEO0FBQ0EsV0FBSzJRLGNBQUwsQ0FBb0JZLElBQXBCLENBQXlCM0IsVUFBVVcsZ0JBQW5DLEVBQXFEdlEsT0FBckQ7QUFDQSxLQUhEO0FBQUE7O0FBS01hLGdCQUFOLENBQXFCYixPQUFyQjtBQUFBLG9DQUE4QjtBQUM3QixXQUFLMFEsY0FBTCxDQUFvQmEsSUFBcEIsQ0FBeUIzQixVQUFVWSxlQUFuQyxFQUFvRHhRLE9BQXBEO0FBQ0EsV0FBSzJRLGNBQUwsQ0FBb0JZLElBQXBCLENBQXlCM0IsVUFBVVksZUFBbkMsRUFBb0R4USxPQUFwRDtBQUNBLEtBSEQ7QUFBQTs7QUFLTW1DLGdCQUFOLENBQXFCbkMsT0FBckI7QUFBQSxvQ0FBOEI7QUFDN0IsV0FBSzBRLGNBQUwsQ0FBb0JhLElBQXBCLENBQXlCM0IsVUFBVWEsZUFBbkMsRUFBb0R6USxPQUFwRDtBQUNBLFdBQUsyUSxjQUFMLENBQW9CWSxJQUFwQixDQUF5QjNCLFVBQVVhLGVBQW5DLEVBQW9EelEsT0FBcEQ7QUFDQSxLQUhEO0FBQUE7O0FBN0U4QixDOzs7Ozs7Ozs7OztBQ3ZGL0IvRyxPQUFPQyxNQUFQLENBQWM7QUFBQ3lRLGNBQVcsTUFBSUEsVUFBaEI7QUFBMkJjLGVBQVksTUFBSUEsV0FBM0M7QUFBdURtRixhQUFVLE1BQUlBLFNBQXJFO0FBQStFRSxxQkFBa0IsTUFBSUEsaUJBQXJHO0FBQXVIRCxxQkFBa0IsTUFBSUE7QUFBN0ksQ0FBZDtBQUErSyxJQUFJbEcsVUFBSjtBQUFlMVEsT0FBT1csS0FBUCxDQUFhQyxRQUFRLFdBQVIsQ0FBYixFQUFrQztBQUFDOFAsYUFBVzdQLENBQVgsRUFBYTtBQUFDNlAsaUJBQVc3UCxDQUFYO0FBQWE7O0FBQTVCLENBQWxDLEVBQWdFLENBQWhFO0FBQW1FLElBQUkyUSxXQUFKO0FBQWdCeFIsT0FBT1csS0FBUCxDQUFhQyxRQUFRLFFBQVIsQ0FBYixFQUErQjtBQUFDNFEsY0FBWTNRLENBQVosRUFBYztBQUFDMlEsa0JBQVkzUSxDQUFaO0FBQWM7O0FBQTlCLENBQS9CLEVBQStELENBQS9EO0FBQWtFLElBQUk4VixTQUFKLEVBQWNFLGlCQUFkLEVBQWdDRCxpQkFBaEM7QUFBa0Q1VyxPQUFPVyxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUMrVixZQUFVOVYsQ0FBVixFQUFZO0FBQUM4VixnQkFBVTlWLENBQVY7QUFBWSxHQUExQjs7QUFBMkJnVyxvQkFBa0JoVyxDQUFsQixFQUFvQjtBQUFDZ1csd0JBQWtCaFcsQ0FBbEI7QUFBb0IsR0FBcEU7O0FBQXFFK1Ysb0JBQWtCL1YsQ0FBbEIsRUFBb0I7QUFBQytWLHdCQUFrQi9WLENBQWxCO0FBQW9COztBQUE5RyxDQUFyQyxFQUFxSixDQUFySixFOzs7Ozs7Ozs7OztBQ0FyWWIsT0FBT0MsTUFBUCxDQUFjO0FBQUNzWix3QkFBcUIsTUFBSUE7QUFBMUIsQ0FBZDs7QUFBTyxNQUFNQSxvQkFBTixDQUEyQjtBQUNqQ2paLGNBQVkwRCxJQUFaLEVBQWtCO0FBQ2pCLFNBQUtBLElBQUwsR0FBWUEsSUFBWjtBQUNBOztBQUVEeUYsY0FBWStQLEtBQVosRUFBbUI7QUFDbEIsVUFBTXRPLE1BQU0vSyxXQUFXQyxNQUFYLENBQWtCc0wsUUFBbEIsQ0FBMkJvRCxVQUEzQixDQUFzQzBLLEtBQXRDLENBQVo7QUFFQSxXQUFPLEtBQUtuSixjQUFMLENBQW9CbkYsR0FBcEIsQ0FBUDtBQUNBOztBQUVEbUYsaUJBQWVvSixNQUFmLEVBQXVCO0FBQ3RCLFFBQUksQ0FBQ0EsTUFBTCxFQUFhO0FBQ1osYUFBTzFRLFNBQVA7QUFDQTs7QUFFRCxVQUFNYSxPQUFPLEtBQUs1RixJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsT0FBOUIsRUFBdUMrQixXQUF2QyxDQUFtRGdRLE9BQU81UCxHQUExRCxDQUFiO0FBRUEsUUFBSTZQLE1BQUo7O0FBQ0EsUUFBSUQsT0FBT3BPLENBQVAsSUFBWW9PLE9BQU9wTyxDQUFQLENBQVNwSixHQUF6QixFQUE4QjtBQUM3QnlYLGVBQVMsS0FBSzFWLElBQUwsQ0FBVXdGLGFBQVYsR0FBMEI5QixHQUExQixDQUE4QixPQUE5QixFQUF1QytCLFdBQXZDLENBQW1EZ1EsT0FBT3BPLENBQVAsQ0FBU3BKLEdBQTVELENBQVQ7O0FBRUEsVUFBSSxDQUFDeVgsTUFBTCxFQUFhO0FBQ1pBLGlCQUFTLEtBQUsxVixJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsT0FBOUIsRUFBdUNtSCxZQUF2QyxDQUFvRDRLLE9BQU9wTyxDQUEzRCxDQUFUO0FBQ0E7QUFDRDs7QUFFRCxRQUFJSSxNQUFKOztBQUNBLFFBQUlnTyxPQUFPRSxRQUFYLEVBQXFCO0FBQ3BCbE8sZUFBUyxLQUFLekgsSUFBTCxDQUFVd0YsYUFBVixHQUEwQjlCLEdBQTFCLENBQThCLE9BQTlCLEVBQXVDK0IsV0FBdkMsQ0FBbURnUSxPQUFPRSxRQUFQLENBQWdCMVgsR0FBbkUsQ0FBVDtBQUNBOztBQUVELFVBQU0yWCxjQUFjLEtBQUtDLHdCQUFMLENBQThCSixPQUFPRyxXQUFyQyxDQUFwQjs7QUFFQSxXQUFPO0FBQ05qWSxVQUFJOFgsT0FBT3hYLEdBREw7QUFFTjJILFVBRk07QUFHTjhQLFlBSE07QUFJTkksWUFBTUwsT0FBT3ZPLEdBSlA7QUFLTjdKLGlCQUFXb1ksT0FBT3hOLEVBTFo7QUFNTjFLLGlCQUFXa1ksT0FBTzNELFVBTlo7QUFPTnJLLFlBUE07QUFRTnNPLGdCQUFVTixPQUFPTSxRQVJYO0FBU05DLGFBQU9QLE9BQU9PLEtBVFI7QUFVTkMsaUJBQVdSLE9BQU9TLE1BVlo7QUFXTkMsYUFBT1YsT0FBT1UsS0FYUjtBQVlOQyxvQkFBY1gsT0FBT1csWUFaZjtBQWFOUjtBQWJNLEtBQVA7QUFlQTs7QUFFRHpPLG9CQUFrQjdCLE9BQWxCLEVBQTJCO0FBQzFCLFFBQUksQ0FBQ0EsT0FBTCxFQUFjO0FBQ2IsYUFBT1AsU0FBUDtBQUNBOztBQUVELFVBQU1hLE9BQU96SixXQUFXQyxNQUFYLENBQWtCK04sS0FBbEIsQ0FBd0J2SyxXQUF4QixDQUFvQzBGLFFBQVFNLElBQVIsQ0FBYWpJLEVBQWpELENBQWI7O0FBRUEsUUFBSSxDQUFDaUksSUFBTCxFQUFXO0FBQ1YsWUFBTSxJQUFJN0gsS0FBSixDQUFVLHVDQUFWLENBQU47QUFDQTs7QUFFRCxRQUFJc0osQ0FBSjs7QUFDQSxRQUFJL0IsUUFBUW9RLE1BQVIsSUFBa0JwUSxRQUFRb1EsTUFBUixDQUFlL1gsRUFBckMsRUFBeUM7QUFDeEMsWUFBTTRILE9BQU9wSixXQUFXQyxNQUFYLENBQWtCdUwsS0FBbEIsQ0FBd0IvSCxXQUF4QixDQUFvQzBGLFFBQVFvUSxNQUFSLENBQWUvWCxFQUFuRCxDQUFiOztBQUVBLFVBQUk0SCxJQUFKLEVBQVU7QUFDVDhCLFlBQUk7QUFDSHBKLGVBQUtzSCxLQUFLdEgsR0FEUDtBQUVIcU4sb0JBQVUvRixLQUFLK0YsUUFGWjtBQUdITCxnQkFBTTFGLEtBQUswRjtBQUhSLFNBQUo7QUFLQSxPQU5ELE1BTU87QUFDTjVELFlBQUk7QUFDSHBKLGVBQUtxSCxRQUFRb1EsTUFBUixDQUFlL1gsRUFEakI7QUFFSDJOLG9CQUFVaEcsUUFBUW9RLE1BQVIsQ0FBZXBLLFFBRnRCO0FBR0hMLGdCQUFNM0YsUUFBUW9RLE1BQVIsQ0FBZXpLO0FBSGxCLFNBQUo7QUFLQTtBQUNEOztBQUVELFFBQUkwSyxRQUFKOztBQUNBLFFBQUlyUSxRQUFRbUMsTUFBWixFQUFvQjtBQUNuQixZQUFNQSxTQUFTdEwsV0FBV0MsTUFBWCxDQUFrQnVMLEtBQWxCLENBQXdCL0gsV0FBeEIsQ0FBb0MwRixRQUFRbUMsTUFBUixDQUFlOUosRUFBbkQsQ0FBZjtBQUNBZ1ksaUJBQVc7QUFDVjFYLGFBQUt3SixPQUFPeEosR0FERjtBQUVWcU4sa0JBQVU3RCxPQUFPNkQ7QUFGUCxPQUFYO0FBSUE7O0FBRUQsVUFBTXNLLGNBQWMsS0FBS1Msc0JBQUwsQ0FBNEIvUSxRQUFRc1EsV0FBcEMsQ0FBcEI7O0FBRUEsV0FBTztBQUNOM1gsV0FBS3FILFFBQVEzSCxFQUFSLElBQWNxSyxPQUFPckssRUFBUCxFQURiO0FBRU5rSSxXQUFLRCxLQUFLM0gsR0FGSjtBQUdOb0osT0FITTtBQUlOSCxXQUFLNUIsUUFBUXdRLElBSlA7QUFLTjdOLFVBQUkzQyxRQUFRakksU0FBUixJQUFxQixJQUFJQyxJQUFKLEVBTG5CO0FBTU53VSxrQkFBWXhNLFFBQVEvSCxTQUFSLElBQXFCLElBQUlELElBQUosRUFOM0I7QUFPTnFZLGNBUE07QUFRTkksZ0JBQVV6USxRQUFReVEsUUFSWjtBQVNOQyxhQUFPMVEsUUFBUTBRLEtBVFQ7QUFVTkUsY0FBUTVRLFFBQVEyUSxTQVZWO0FBV05FLGFBQU83USxRQUFRNlEsS0FYVDtBQVlOQyxvQkFBYzlRLFFBQVE4USxZQVpoQjtBQWFOUjtBQWJNLEtBQVA7QUFlQTs7QUFFRFMseUJBQXVCVCxXQUF2QixFQUFvQztBQUNuQyxRQUFJLE9BQU9BLFdBQVAsS0FBdUIsV0FBdkIsSUFBc0MsQ0FBQ3hOLE1BQU1DLE9BQU4sQ0FBY3VOLFdBQWQsQ0FBM0MsRUFBdUU7QUFDdEUsYUFBTzdRLFNBQVA7QUFDQTs7QUFFRCxXQUFPNlEsWUFBWTNNLEdBQVosQ0FBaUJxTixVQUFELElBQWdCO0FBQ3RDLGFBQU87QUFDTkMsbUJBQVdELFdBQVdDLFNBRGhCO0FBRU5DLGVBQU9GLFdBQVdFLEtBRlo7QUFHTlYsY0FBTVEsV0FBV1IsSUFIWDtBQUlON04sWUFBSXFPLFdBQVdHLFNBSlQ7QUFLTkMsc0JBQWNKLFdBQVdLLGFBTG5CO0FBTU5DLG1CQUFXTixXQUFXTyxZQU5oQjtBQU9OQyxxQkFBYVIsV0FBV1MsTUFBWCxHQUFvQlQsV0FBV1MsTUFBWCxDQUFrQjlMLElBQXRDLEdBQTZDbEcsU0FQcEQ7QUFRTmlTLHFCQUFhVixXQUFXUyxNQUFYLEdBQW9CVCxXQUFXUyxNQUFYLENBQWtCRSxJQUF0QyxHQUE2Q2xTLFNBUnBEO0FBU05tUyxxQkFBYVosV0FBV1MsTUFBWCxHQUFvQlQsV0FBV1MsTUFBWCxDQUFrQkksSUFBdEMsR0FBNkNwUyxTQVRwRDtBQVVOcVMsZUFBT2QsV0FBV2MsS0FBWCxHQUFtQmQsV0FBV2MsS0FBWCxDQUFpQkMsS0FBcEMsR0FBNEN0UyxTQVY3QztBQVdOdVMsb0JBQVloQixXQUFXYyxLQUFYLEdBQW1CZCxXQUFXYyxLQUFYLENBQWlCSCxJQUFwQyxHQUEyQ2xTLFNBWGpEO0FBWU53Uyw2QkFBcUJqQixXQUFXYyxLQUFYLEdBQW1CZCxXQUFXYyxLQUFYLENBQWlCSSxtQkFBcEMsR0FBMER6UyxTQVp6RTtBQWFOMFMsbUJBQVduQixXQUFXb0IsUUFiaEI7QUFjTkMsbUJBQVdyQixXQUFXc0IsUUFkaEI7QUFlTkMsbUJBQVd2QixXQUFXd0IsUUFmaEI7QUFnQk5wRyxnQkFBUTRFLFdBQVc1RSxNQWhCYjtBQWlCTmhJLGNBQU00TSxXQUFXNU0sSUFqQlg7QUFrQk52RixxQkFBYW1TLFdBQVduUztBQWxCbEIsT0FBUDtBQW9CQSxLQXJCTSxFQXFCSjhFLEdBckJJLENBcUJDOE8sQ0FBRCxJQUFPO0FBQ2IvUixhQUFPbU0sSUFBUCxDQUFZNEYsQ0FBWixFQUFldFosT0FBZixDQUF3QjJULENBQUQsSUFBTztBQUM3QixZQUFJLE9BQU8yRixFQUFFM0YsQ0FBRixDQUFQLEtBQWdCLFdBQXBCLEVBQWlDO0FBQ2hDLGlCQUFPMkYsRUFBRTNGLENBQUYsQ0FBUDtBQUNBO0FBQ0QsT0FKRDtBQU1BLGFBQU8yRixDQUFQO0FBQ0EsS0E3Qk0sQ0FBUDtBQThCQTs7QUFFRGxDLDJCQUF5QkQsV0FBekIsRUFBc0M7QUFDckMsUUFBSSxPQUFPQSxXQUFQLEtBQXVCLFdBQXZCLElBQXNDLENBQUN4TixNQUFNQyxPQUFOLENBQWN1TixXQUFkLENBQTNDLEVBQXVFO0FBQ3RFLGFBQU83USxTQUFQO0FBQ0E7O0FBRUQsV0FBTzZRLFlBQVkzTSxHQUFaLENBQWlCcU4sVUFBRCxJQUFnQjtBQUN0QyxVQUFJUyxNQUFKOztBQUNBLFVBQUlULFdBQVdRLFdBQVgsSUFBMEJSLFdBQVdVLFdBQXJDLElBQW9EVixXQUFXWSxXQUFuRSxFQUFnRjtBQUMvRUgsaUJBQVM7QUFDUjlMLGdCQUFNcUwsV0FBV1EsV0FEVDtBQUVSRyxnQkFBTVgsV0FBV1UsV0FGVDtBQUdSRyxnQkFBTWIsV0FBV1k7QUFIVCxTQUFUO0FBS0E7O0FBRUQsVUFBSUUsS0FBSjs7QUFDQSxVQUFJZCxXQUFXYyxLQUFYLElBQW9CZCxXQUFXZ0IsVUFBL0IsSUFBNkNoQixXQUFXaUIsbUJBQTVELEVBQWlGO0FBQ2hGSCxnQkFBUTtBQUNQQyxpQkFBT2YsV0FBV2MsS0FEWDtBQUVQSCxnQkFBTVgsV0FBV2dCLFVBRlY7QUFHUEUsK0JBQXFCbEIsV0FBV2lCO0FBSHpCLFNBQVI7QUFLQTs7QUFFRCxhQUFPO0FBQ05oQixtQkFBV0QsV0FBV0MsU0FEaEI7QUFFTkMsZUFBT0YsV0FBV0UsS0FGWjtBQUdOVixjQUFNUSxXQUFXUixJQUhYO0FBSU5XLG1CQUFXSCxXQUFXck8sRUFKaEI7QUFLTjBPLHVCQUFlTCxXQUFXSSxZQUxwQjtBQU1ORyxzQkFBY1AsV0FBV00sU0FObkI7QUFPTkcsY0FQTTtBQVFOSyxhQVJNO0FBU05NLGtCQUFVcEIsV0FBV21CLFNBVGY7QUFVTkcsa0JBQVV0QixXQUFXcUIsU0FWZjtBQVdORyxrQkFBVXhCLFdBQVd1QixTQVhmO0FBWU5uRyxnQkFBUTRFLFdBQVc1RSxNQVpiO0FBYU5oSSxjQUFNNE0sV0FBVzVNLElBYlg7QUFjTnZGLHFCQUFhbVMsV0FBV25TO0FBZGxCLE9BQVA7QUFnQkEsS0FuQ00sQ0FBUDtBQW9DQTs7QUEzTGdDLEM7Ozs7Ozs7Ozs7O0FDQWxDbkksT0FBT0MsTUFBUCxDQUFjO0FBQUMrYixxQkFBa0IsTUFBSUE7QUFBdkIsQ0FBZDtBQUF5RCxJQUFJMU8sUUFBSjtBQUFhdE4sT0FBT1csS0FBUCxDQUFhQyxRQUFRLHVDQUFSLENBQWIsRUFBOEQ7QUFBQzBNLFdBQVN6TSxDQUFULEVBQVc7QUFBQ3lNLGVBQVN6TSxDQUFUO0FBQVc7O0FBQXhCLENBQTlELEVBQXdGLENBQXhGOztBQUUvRCxNQUFNbWIsaUJBQU4sQ0FBd0I7QUFDOUIxYixjQUFZMEQsSUFBWixFQUFrQjtBQUNqQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQTs7QUFFRHlGLGNBQVlxRSxNQUFaLEVBQW9CO0FBQ25CLFVBQU1sRSxPQUFPekosV0FBV0MsTUFBWCxDQUFrQitOLEtBQWxCLENBQXdCdkssV0FBeEIsQ0FBb0NrSyxNQUFwQyxDQUFiO0FBRUEsV0FBTyxLQUFLMkMsV0FBTCxDQUFpQjdHLElBQWpCLENBQVA7QUFDQTs7QUFFRHFFLGdCQUFjRCxRQUFkLEVBQXdCO0FBQ3ZCLFVBQU1wRSxPQUFPekosV0FBV0MsTUFBWCxDQUFrQitOLEtBQWxCLENBQXdCRSxhQUF4QixDQUFzQ0wsUUFBdEMsQ0FBYjtBQUVBLFdBQU8sS0FBS3lDLFdBQUwsQ0FBaUI3RyxJQUFqQixDQUFQO0FBQ0E7O0FBRUQ0RCxpQkFBZTVELElBQWYsRUFBcUI7QUFDcEIsUUFBSSxDQUFDQSxJQUFMLEVBQVc7QUFDVixhQUFPYixTQUFQO0FBQ0E7O0FBRUQsUUFBSXNDLENBQUo7O0FBQ0EsUUFBSXpCLEtBQUtpRSxPQUFULEVBQWtCO0FBQ2pCLFlBQU1BLFVBQVUxTixXQUFXQyxNQUFYLENBQWtCdUwsS0FBbEIsQ0FBd0IvSCxXQUF4QixDQUFvQ2dHLEtBQUtpRSxPQUFMLENBQWFsTSxFQUFqRCxDQUFoQjtBQUNBMEosVUFBSTtBQUNIcEosYUFBSzRMLFFBQVE1TCxHQURWO0FBRUhxTixrQkFBVXpCLFFBQVF5QjtBQUZmLE9BQUo7QUFJQTs7QUFFRCxXQUFPO0FBQ05yTixXQUFLMkgsS0FBS2pJLEVBREo7QUFFTnNhLGFBQU9yUyxLQUFLc1MsV0FGTjtBQUdOak4sWUFBTXJGLEtBQUt1UyxhQUhMO0FBSU5DLFNBQUd4UyxLQUFLOEQsSUFKRjtBQUtOckMsT0FMTTtBQU1OYyxpQkFBV3ZDLEtBQUt1QyxTQU5WO0FBT05rUSxlQUFTLE9BQU96UyxLQUFLMFMsU0FBWixLQUEwQixXQUExQixHQUF3QyxLQUF4QyxHQUFnRDFTLEtBQUswUyxTQVB4RDtBQVFOQyxVQUFJLE9BQU8zUyxLQUFLNFMsVUFBWixLQUEyQixXQUEzQixHQUF5QyxLQUF6QyxHQUFpRDVTLEtBQUs0UyxVQVJwRDtBQVNOQyxjQUFRLE9BQU83UyxLQUFLOFMscUJBQVosS0FBc0MsV0FBdEMsR0FBb0QsSUFBcEQsR0FBMkQ5UyxLQUFLOFMscUJBVGxFO0FBVU5DLFlBQU0vUyxLQUFLZ1QsWUFBTCxJQUFxQixDQVZyQjtBQVdOM1EsVUFBSXJDLEtBQUt2SSxTQVhIO0FBWU55VSxrQkFBWWxNLEtBQUtySSxTQVpYO0FBYU5zYixVQUFJalQsS0FBS2tUO0FBYkgsS0FBUDtBQWVBOztBQUVEck0sY0FBWTdHLElBQVosRUFBa0I7QUFDakIsUUFBSSxDQUFDQSxJQUFMLEVBQVc7QUFDVixhQUFPYixTQUFQO0FBQ0E7O0FBRUQsUUFBSThFLE9BQUo7O0FBQ0EsUUFBSWpFLEtBQUt5QixDQUFULEVBQVk7QUFDWHdDLGdCQUFVLEtBQUs3SixJQUFMLENBQVV3RixhQUFWLEdBQTBCOUIsR0FBMUIsQ0FBOEIsT0FBOUIsRUFBdUMrQixXQUF2QyxDQUFtREcsS0FBS3lCLENBQUwsQ0FBT3BKLEdBQTFELENBQVY7QUFDQTs7QUFFRCxXQUFPO0FBQ05OLFVBQUlpSSxLQUFLM0gsR0FESDtBQUVOaWEsbUJBQWF0UyxLQUFLcVMsS0FGWjtBQUdORSxxQkFBZXZTLEtBQUtxRixJQUhkO0FBSU52QixZQUFNLEtBQUtxUCxpQkFBTCxDQUF1Qm5ULEtBQUt3UyxDQUE1QixDQUpBO0FBS052TyxhQUxNO0FBTU4xQixpQkFBV3ZDLEtBQUt1QyxTQU5WO0FBT05tUSxpQkFBVyxPQUFPMVMsS0FBS3lTLE9BQVosS0FBd0IsV0FBeEIsR0FBc0MsS0FBdEMsR0FBOEN6UyxLQUFLeVMsT0FQeEQ7QUFRTkcsa0JBQVksT0FBTzVTLEtBQUsyUyxFQUFaLEtBQW1CLFdBQW5CLEdBQWlDLEtBQWpDLEdBQXlDM1MsS0FBSzJTLEVBUnBEO0FBU05HLDZCQUF1QixPQUFPOVMsS0FBSzZTLE1BQVosS0FBdUIsV0FBdkIsR0FBcUMsSUFBckMsR0FBNEM3UyxLQUFLNlMsTUFUbEU7QUFVTkcsb0JBQWNoVCxLQUFLK1MsSUFWYjtBQVdOdGIsaUJBQVd1SSxLQUFLcUMsRUFYVjtBQVlOMUssaUJBQVdxSSxLQUFLa00sVUFaVjtBQWFOZ0gsc0JBQWdCbFQsS0FBS2lULEVBYmY7QUFjTnpDLG9CQUFjO0FBZFIsS0FBUDtBQWdCQTs7QUFFRDJDLG9CQUFrQkMsUUFBbEIsRUFBNEI7QUFDM0IsWUFBUUEsUUFBUjtBQUNDLFdBQUssR0FBTDtBQUNDLGVBQU8xUCxTQUFTSyxPQUFoQjs7QUFDRCxXQUFLLEdBQUw7QUFDQyxlQUFPTCxTQUFTTSxhQUFoQjs7QUFDRCxXQUFLLEdBQUw7QUFDQyxlQUFPTixTQUFTMlAsY0FBaEI7O0FBQ0QsV0FBSyxJQUFMO0FBQ0MsZUFBTzNQLFNBQVM0UCxTQUFoQjs7QUFDRDtBQUNDLGVBQU9GLFFBQVA7QUFWRjtBQVlBOztBQXpGNkIsQzs7Ozs7Ozs7Ozs7QUNGL0JoZCxPQUFPQyxNQUFQLENBQWM7QUFBQ2tkLHdCQUFxQixNQUFJQTtBQUExQixDQUFkO0FBQStELElBQUlDLFdBQUo7QUFBZ0JwZCxPQUFPVyxLQUFQLENBQWFDLFFBQVEsMENBQVIsQ0FBYixFQUFpRTtBQUFDd2MsY0FBWXZjLENBQVosRUFBYztBQUFDdWMsa0JBQVl2YyxDQUFaO0FBQWM7O0FBQTlCLENBQWpFLEVBQWlHLENBQWpHOztBQUV4RSxNQUFNc2Msb0JBQU4sQ0FBMkI7QUFDakM3YyxjQUFZMEQsSUFBWixFQUFrQjtBQUNqQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQTs7QUFFRHlGLGNBQVkrTSxTQUFaLEVBQXVCO0FBQ3RCLFVBQU1wSCxVQUFValAsV0FBV0MsTUFBWCxDQUFrQnNPLFFBQWxCLENBQTJCOUssV0FBM0IsQ0FBdUM0UyxTQUF2QyxDQUFoQjtBQUVBLFdBQU8sS0FBSzNILFlBQUwsQ0FBa0JPLE9BQWxCLENBQVA7QUFDQTs7QUFFRFAsZUFBYU8sT0FBYixFQUFzQjtBQUNyQixXQUFPO0FBQ056TixVQUFJeU4sUUFBUW5OLEdBRE47QUFFTnlMLFlBQU0sS0FBS3FQLGlCQUFMLENBQXVCM04sUUFBUTFCLElBQS9CLENBRkE7QUFHTjJQLG9CQUFjak8sUUFBUWlPLFlBSGhCO0FBSU5DLGNBQVFsTyxRQUFRa08sTUFKVjtBQUtOakMsYUFBT2pNLFFBQVFpTSxLQUxUO0FBTU5rQyxjQUFRbk8sUUFBUW1PLE1BTlY7QUFPTmxILGNBQVFqSCxRQUFRaUgsTUFQVjtBQVFObUgsYUFBT3BPLFFBQVFvTyxLQVJUO0FBU05DLGlCQUFXck8sUUFBUXFPLFNBVGI7QUFVTnJWLHVCQUFpQmdILFFBQVFoSCxlQVZuQjtBQVdOL0csaUJBQVcrTixRQUFRbkQsRUFYYjtBQVlOMUssaUJBQVc2TixRQUFRMEc7QUFaYixLQUFQO0FBY0E7O0FBRURpSCxvQkFBa0JyUCxJQUFsQixFQUF3QjtBQUN2QixZQUFRQSxJQUFSO0FBQ0MsV0FBSyxTQUFMO0FBQ0MsZUFBTzBQLFlBQVlNLE9BQW5COztBQUNELFdBQUssTUFBTDtBQUNDLGVBQU9OLFlBQVlPLElBQW5COztBQUNELFdBQUssT0FBTDtBQUNDLGVBQU9QLFlBQVlRLEtBQW5COztBQUNELFdBQUssTUFBTDtBQUNDLGVBQU9SLFlBQVlTLElBQW5COztBQUNELFdBQUssS0FBTDtBQUNDLGVBQU9ULFlBQVlVLE1BQW5COztBQUNELFdBQUssUUFBTDtBQUNDLGVBQU9WLFlBQVlXLE1BQW5COztBQUNELFdBQUssUUFBTDtBQUNDLGVBQU9YLFlBQVlZLE1BQW5COztBQUNEO0FBQ0MsZUFBT3RRLElBQVA7QUFoQkY7QUFrQkE7O0FBL0NnQyxDOzs7Ozs7Ozs7OztBQ0ZsQzFOLE9BQU9DLE1BQVAsQ0FBYztBQUFDZ2UscUJBQWtCLE1BQUlBO0FBQXZCLENBQWQ7QUFBeUQsSUFBSUMsb0JBQUosRUFBeUJDLFFBQXpCO0FBQWtDbmUsT0FBT1csS0FBUCxDQUFhQyxRQUFRLHVDQUFSLENBQWIsRUFBOEQ7QUFBQ3NkLHVCQUFxQnJkLENBQXJCLEVBQXVCO0FBQUNxZCwyQkFBcUJyZCxDQUFyQjtBQUF1QixHQUFoRDs7QUFBaURzZCxXQUFTdGQsQ0FBVCxFQUFXO0FBQUNzZCxlQUFTdGQsQ0FBVDtBQUFXOztBQUF4RSxDQUE5RCxFQUF3SSxDQUF4STs7QUFFcEYsTUFBTW9kLGlCQUFOLENBQXdCO0FBQzlCM2QsY0FBWTBELElBQVosRUFBa0I7QUFDakIsU0FBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0E7O0FBRUR5RixjQUFZRSxNQUFaLEVBQW9CO0FBQ25CLFVBQU1KLE9BQU9wSixXQUFXQyxNQUFYLENBQWtCdUwsS0FBbEIsQ0FBd0IvSCxXQUF4QixDQUFvQytGLE1BQXBDLENBQWI7QUFFQSxXQUFPLEtBQUtrRixZQUFMLENBQWtCdEYsSUFBbEIsQ0FBUDtBQUNBOztBQUVEZ0csb0JBQWtCRCxRQUFsQixFQUE0QjtBQUMzQixVQUFNL0YsT0FBT3BKLFdBQVdDLE1BQVgsQ0FBa0J1TCxLQUFsQixDQUF3QlksaUJBQXhCLENBQTBDK0MsUUFBMUMsQ0FBYjtBQUVBLFdBQU8sS0FBS1QsWUFBTCxDQUFrQnRGLElBQWxCLENBQVA7QUFDQTs7QUFFRHNGLGVBQWF0RixJQUFiLEVBQW1CO0FBQ2xCLFFBQUksQ0FBQ0EsSUFBTCxFQUFXO0FBQ1YsYUFBT1IsU0FBUDtBQUNBOztBQUVELFVBQU0yRSxPQUFPLEtBQUswUSxzQkFBTCxDQUE0QjdVLEtBQUttRSxJQUFqQyxDQUFiOztBQUNBLFVBQU0yUSxtQkFBbUIsS0FBS0MsOEJBQUwsQ0FBb0MvVSxLQUFLK0YsUUFBekMsRUFBbUQvRixLQUFLdEgsR0FBeEQsRUFBNkRzSCxLQUFLOFUsZ0JBQWxFLENBQXpCOztBQUVBLFdBQU87QUFDTjFjLFVBQUk0SCxLQUFLdEgsR0FESDtBQUVOcU4sZ0JBQVUvRixLQUFLK0YsUUFGVDtBQUdOaVAsY0FBUWhWLEtBQUtnVixNQUhQO0FBSU43USxVQUpNO0FBS05tRCxpQkFBV3RILEtBQUtpVixNQUxWO0FBTU52UCxZQUFNMUYsS0FBSzBGLElBTkw7QUFPTndQLGFBQU9sVixLQUFLa1YsS0FQTjtBQVFOamEsY0FBUStFLEtBQUsvRSxNQVJQO0FBU042WixzQkFUTTtBQVVOSyxpQkFBV25WLEtBQUttVixTQVZWO0FBV05yZCxpQkFBV2tJLEtBQUtsSSxTQVhWO0FBWU5FLGlCQUFXZ0ksS0FBS3VNLFVBWlY7QUFhTjZJLG1CQUFhcFYsS0FBS3FWO0FBYlosS0FBUDtBQWVBOztBQUVEUix5QkFBdUIxUSxJQUF2QixFQUE2QjtBQUM1QixZQUFRQSxJQUFSO0FBQ0MsV0FBSyxNQUFMO0FBQ0MsZUFBT3lRLFNBQVNVLElBQWhCOztBQUNELFdBQUssS0FBTDtBQUNDLGVBQU9WLFNBQVNXLEdBQWhCOztBQUNELFdBQUssRUFBTDtBQUNBLFdBQUsvVixTQUFMO0FBQ0MsZUFBT29WLFNBQVNZLE9BQWhCOztBQUNEO0FBQ0MvWCxnQkFBUTBJLElBQVIsQ0FBYyxtRUFBbUVoQyxJQUFNLEdBQXZGO0FBQ0EsZUFBT0EsS0FBSzFDLFdBQUwsRUFBUDtBQVZGO0FBWUE7O0FBRURzVCxpQ0FBK0JoUCxRQUEvQixFQUF5QzNGLE1BQXpDLEVBQWlEbkYsTUFBakQsRUFBeUQ7QUFDeEQsWUFBUUEsTUFBUjtBQUNDLFdBQUssU0FBTDtBQUNDLGVBQU8wWixxQkFBcUJjLE9BQTVCOztBQUNELFdBQUssUUFBTDtBQUNDLGVBQU9kLHFCQUFxQmUsTUFBNUI7O0FBQ0QsV0FBSyxNQUFMO0FBQ0MsZUFBT2YscUJBQXFCZ0IsSUFBNUI7O0FBQ0QsV0FBSyxNQUFMO0FBQ0MsZUFBT2hCLHFCQUFxQmlCLElBQTVCOztBQUNELFdBQUtwVyxTQUFMO0FBQ0M7QUFDQSxlQUFPbVYscUJBQXFCa0IsU0FBNUI7O0FBQ0Q7QUFDQ3BZLGdCQUFRMEksSUFBUixDQUFjLFlBQVlKLFFBQVUsS0FBSzNGLE1BQVEsc0ZBQXNGbkYsTUFBUSxHQUEvSTtBQUNBLGVBQU8sQ0FBQ0EsTUFBRCxHQUFVMFoscUJBQXFCYyxPQUEvQixHQUF5Q3hhLE9BQU93RyxXQUFQLEVBQWhEO0FBZEY7QUFnQkE7O0FBMUU2QixDOzs7Ozs7Ozs7OztBQ0YvQmhMLE9BQU9DLE1BQVAsQ0FBYztBQUFDc1osd0JBQXFCLE1BQUlBLG9CQUExQjtBQUErQ3lDLHFCQUFrQixNQUFJQSxpQkFBckU7QUFBdUZtQix3QkFBcUIsTUFBSUEsb0JBQWhIO0FBQXFJYyxxQkFBa0IsTUFBSUE7QUFBM0osQ0FBZDtBQUE2TCxJQUFJMUUsb0JBQUo7QUFBeUJ2WixPQUFPVyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUMyWSx1QkFBcUIxWSxDQUFyQixFQUF1QjtBQUFDMFksMkJBQXFCMVksQ0FBckI7QUFBdUI7O0FBQWhELENBQW5DLEVBQXFGLENBQXJGO0FBQXdGLElBQUltYixpQkFBSjtBQUFzQmhjLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxTQUFSLENBQWIsRUFBZ0M7QUFBQ29iLG9CQUFrQm5iLENBQWxCLEVBQW9CO0FBQUNtYix3QkFBa0JuYixDQUFsQjtBQUFvQjs7QUFBMUMsQ0FBaEMsRUFBNEUsQ0FBNUU7QUFBK0UsSUFBSXNjLG9CQUFKO0FBQXlCbmQsT0FBT1csS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDdWMsdUJBQXFCdGMsQ0FBckIsRUFBdUI7QUFBQ3NjLDJCQUFxQnRjLENBQXJCO0FBQXVCOztBQUFoRCxDQUFuQyxFQUFxRixDQUFyRjtBQUF3RixJQUFJb2QsaUJBQUo7QUFBc0JqZSxPQUFPVyxLQUFQLENBQWFDLFFBQVEsU0FBUixDQUFiLEVBQWdDO0FBQUNxZCxvQkFBa0JwZCxDQUFsQixFQUFvQjtBQUFDb2Qsd0JBQWtCcGQsQ0FBbEI7QUFBb0I7O0FBQTFDLENBQWhDLEVBQTRFLENBQTVFLEU7Ozs7Ozs7Ozs7O0FDQTFoQixJQUFJNkQsY0FBSjtBQUFtQjFFLE9BQU9XLEtBQVAsQ0FBYUMsUUFBUSxXQUFSLENBQWIsRUFBa0M7QUFBQzhELGlCQUFlN0QsQ0FBZixFQUFpQjtBQUFDNkQscUJBQWU3RCxDQUFmO0FBQWlCOztBQUFwQyxDQUFsQyxFQUF3RSxDQUF4RTtBQUEyRSxJQUFJNlAsVUFBSixFQUFlYyxXQUFmLEVBQTJCcUYsaUJBQTNCO0FBQTZDN1csT0FBT1csS0FBUCxDQUFhQyxRQUFRLGlCQUFSLENBQWIsRUFBd0M7QUFBQzhQLGFBQVc3UCxDQUFYLEVBQWE7QUFBQzZQLGlCQUFXN1AsQ0FBWDtBQUFhLEdBQTVCOztBQUE2QjJRLGNBQVkzUSxDQUFaLEVBQWM7QUFBQzJRLGtCQUFZM1EsQ0FBWjtBQUFjLEdBQTFEOztBQUEyRGdXLG9CQUFrQmhXLENBQWxCLEVBQW9CO0FBQUNnVyx3QkFBa0JoVyxDQUFsQjtBQUFvQjs7QUFBcEcsQ0FBeEMsRUFBOEksQ0FBOUk7QUFBaUosSUFBSTBZLG9CQUFKLEVBQXlCeUMsaUJBQXpCLEVBQTJDbUIsb0JBQTNDLEVBQWdFYyxpQkFBaEU7QUFBa0ZqZSxPQUFPVyxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUMyWSx1QkFBcUIxWSxDQUFyQixFQUF1QjtBQUFDMFksMkJBQXFCMVksQ0FBckI7QUFBdUIsR0FBaEQ7O0FBQWlEbWIsb0JBQWtCbmIsQ0FBbEIsRUFBb0I7QUFBQ21iLHdCQUFrQm5iLENBQWxCO0FBQW9CLEdBQTFGOztBQUEyRnNjLHVCQUFxQnRjLENBQXJCLEVBQXVCO0FBQUNzYywyQkFBcUJ0YyxDQUFyQjtBQUF1QixHQUExSTs7QUFBMklvZCxvQkFBa0JwZCxDQUFsQixFQUFvQjtBQUFDb2Qsd0JBQWtCcGQsQ0FBbEI7QUFBb0I7O0FBQXBMLENBQXJDLEVBQTJOLENBQTNOO0FBQThOLElBQUlYLGFBQUosRUFBa0JLLFNBQWxCLEVBQTRCQyxvQkFBNUIsRUFBaURDLGNBQWpELEVBQWdFMEMsa0JBQWhFO0FBQW1GbkQsT0FBT1csS0FBUCxDQUFhQyxRQUFRLFdBQVIsQ0FBYixFQUFrQztBQUFDVixnQkFBY1csQ0FBZCxFQUFnQjtBQUFDWCxvQkFBY1csQ0FBZDtBQUFnQixHQUFsQzs7QUFBbUNOLFlBQVVNLENBQVYsRUFBWTtBQUFDTixnQkFBVU0sQ0FBVjtBQUFZLEdBQTVEOztBQUE2REwsdUJBQXFCSyxDQUFyQixFQUF1QjtBQUFDTCwyQkFBcUJLLENBQXJCO0FBQXVCLEdBQTVHOztBQUE2R0osaUJBQWVJLENBQWYsRUFBaUI7QUFBQ0oscUJBQWVJLENBQWY7QUFBaUIsR0FBaEo7O0FBQWlKc0MscUJBQW1CdEMsQ0FBbkIsRUFBcUI7QUFBQ3NDLHlCQUFtQnRDLENBQW5CO0FBQXFCOztBQUE1TCxDQUFsQyxFQUFnTyxDQUFoTztBQUFtTyxJQUFJd2UsVUFBSjtBQUFlcmYsT0FBT1csS0FBUCxDQUFhQyxRQUFRLDRDQUFSLENBQWIsRUFBbUU7QUFBQ3llLGFBQVd4ZSxDQUFYLEVBQWE7QUFBQ3dlLGlCQUFXeGUsQ0FBWDtBQUFhOztBQUE1QixDQUFuRSxFQUFpRyxDQUFqRzs7QUFPajVCLE1BQU15ZSxxQkFBTixDQUE0QjtBQUMzQmhmLGdCQUFjO0FBQ2IsUUFBSUgsV0FBV0MsTUFBWCxJQUFxQkQsV0FBV0MsTUFBWCxDQUFrQm1mLFdBQTNDLEVBQXdEO0FBQ3ZEcGYsaUJBQVdDLE1BQVgsQ0FBa0JtZixXQUFsQixDQUE4QkMsY0FBOUIsQ0FBNkMsYUFBN0MsRUFBNEQsQ0FBQyxPQUFELENBQTVEO0FBQ0E7O0FBRUQsU0FBS0MsTUFBTCxHQUFjLElBQUlsZixTQUFKLEVBQWQ7QUFDQSxTQUFLbWYsU0FBTCxHQUFpQixJQUFJeGYsYUFBSixFQUFqQjtBQUNBLFNBQUt5ZixhQUFMLEdBQXFCLElBQUluZixvQkFBSixFQUFyQjtBQUNBLFNBQUtvZixRQUFMLEdBQWdCLElBQUluZixjQUFKLENBQW1CLEtBQUtnZixNQUF4QixDQUFoQjtBQUNBLFNBQUtJLFdBQUwsR0FBbUIsSUFBSTFjLGtCQUFKLENBQXVCLEtBQUt1YyxTQUE1QixDQUFuQjtBQUVBLFNBQUtJLFdBQUwsR0FBbUIsSUFBSXRkLEdBQUosRUFBbkI7O0FBQ0EsU0FBS3NkLFdBQUwsQ0FBaUJuZCxHQUFqQixDQUFxQixVQUFyQixFQUFpQyxJQUFJNFcsb0JBQUosQ0FBeUIsSUFBekIsQ0FBakM7O0FBQ0EsU0FBS3VHLFdBQUwsQ0FBaUJuZCxHQUFqQixDQUFxQixPQUFyQixFQUE4QixJQUFJcVosaUJBQUosQ0FBc0IsSUFBdEIsQ0FBOUI7O0FBQ0EsU0FBSzhELFdBQUwsQ0FBaUJuZCxHQUFqQixDQUFxQixVQUFyQixFQUFpQyxJQUFJd2Esb0JBQUosQ0FBeUIsSUFBekIsQ0FBakM7O0FBQ0EsU0FBSzJDLFdBQUwsQ0FBaUJuZCxHQUFqQixDQUFxQixPQUFyQixFQUE4QixJQUFJc2IsaUJBQUosQ0FBc0IsSUFBdEIsQ0FBOUI7O0FBRUEsU0FBSzhCLFFBQUwsR0FBZ0IsSUFBSXJiLGNBQUosQ0FBbUIsSUFBbkIsQ0FBaEI7QUFFQSxTQUFLZ04sUUFBTCxHQUFnQixJQUFJMk4sVUFBSixDQUFlLEtBQUtPLFFBQXBCLEVBQThCLEtBQUtDLFdBQW5DLEVBQWdELEtBQUtFLFFBQXJELENBQWhCO0FBRUEsU0FBS0MsY0FBTCxHQUFzQixJQUFJeGQsR0FBSixFQUF0Qjs7QUFDQSxTQUFLd2QsY0FBTCxDQUFvQnJkLEdBQXBCLENBQXdCLFNBQXhCLEVBQW1DLElBQUkrTixVQUFKLENBQWUsSUFBZixDQUFuQzs7QUFDQSxTQUFLc1AsY0FBTCxDQUFvQnJkLEdBQXBCLENBQXdCLFVBQXhCLEVBQW9DLElBQUlrVSxpQkFBSixDQUFzQixJQUF0QixDQUFwQzs7QUFDQSxTQUFLbUosY0FBTCxDQUFvQnJkLEdBQXBCLENBQXdCLFNBQXhCLEVBQW1DLElBQUk2TyxXQUFKLENBQWdCLElBQWhCLEVBQXNCLEtBQUtFLFFBQTNCLENBQW5DO0FBQ0E7O0FBRUR1TyxhQUFXO0FBQ1YsV0FBTyxLQUFLUixNQUFaO0FBQ0E7O0FBRURoVCx3QkFBc0I7QUFDckIsV0FBTyxLQUFLa1QsYUFBWjtBQUNBOztBQUVEOUcsZUFBYTtBQUNaLFdBQU8sS0FBSytHLFFBQVo7QUFDQTs7QUFFRDFKLGtCQUFnQjtBQUNmLFdBQU8sS0FBSzJKLFdBQVo7QUFDQTs7QUFFRHJXLGtCQUFnQjtBQUNmLFdBQU8sS0FBS3NXLFdBQVo7QUFDQTs7QUFFREksZUFBYTtBQUNaLFdBQU8sS0FBS0gsUUFBWjtBQUNBOztBQUVENWIsZ0JBQWM7QUFDYixXQUFPLEtBQUs2YixjQUFMLENBQW9CdFksR0FBcEIsQ0FBd0IsVUFBeEIsQ0FBUDtBQUNBOztBQUVEeUMsZUFBYTtBQUNaLFdBQU8sS0FBS3VILFFBQVo7QUFDQTs7QUFFRGIsY0FBWTtBQUNYLFdBQU8xUSxXQUFXb1IsUUFBWCxDQUFvQjdKLEdBQXBCLENBQXdCLHdCQUF4QixDQUFQO0FBQ0E7O0FBRURvSixhQUFXO0FBQ1YsV0FBTyxLQUFLM0csVUFBTCxHQUFrQmdXLGFBQWxCLEVBQVA7QUFDQTs7QUFFREMsU0FBTztBQUNOO0FBQ0E7QUFDQSxRQUFJLEtBQUt0UCxRQUFMLEVBQUosRUFBcUI7QUFDcEI7QUFDQTs7QUFFRCxTQUFLWSxRQUFMLENBQWMwTyxJQUFkLEdBQ0V2ZCxJQURGLENBQ1F3ZCxJQUFELElBQVVyWixRQUFRQyxHQUFSLENBQWEsbURBQW1Eb1osS0FBS25aLE1BQVEsUUFBN0UsQ0FEakIsRUFFRW5FLEtBRkYsQ0FFU0MsR0FBRCxJQUFTZ0UsUUFBUTBJLElBQVIsQ0FBYSw2Q0FBYixFQUE0RDFNLEdBQTVELENBRmpCO0FBR0E7O0FBRURzZCxXQUFTO0FBQ1I7QUFDQTtBQUNBLFFBQUksQ0FBQyxLQUFLeFAsUUFBTCxFQUFMLEVBQXNCO0FBQ3JCO0FBQ0E7O0FBRUQsU0FBS1ksUUFBTCxDQUFjNE8sTUFBZCxHQUNFemQsSUFERixDQUNPLE1BQU1tRSxRQUFRQyxHQUFSLENBQVksOEJBQVosQ0FEYixFQUVFbEUsS0FGRixDQUVTQyxHQUFELElBQVNnRSxRQUFRMEksSUFBUixDQUFhLHNDQUFiLEVBQXFEMU0sR0FBckQsQ0FGakI7QUFHQTs7QUExRjBCOztBQTZGNUI3QyxXQUFXb1IsUUFBWCxDQUFvQm9ELEdBQXBCLENBQXdCLHdCQUF4QixFQUFrRCxLQUFsRCxFQUF5RDtBQUN4RGpILFFBQU0sU0FEa0Q7QUFFeEQySSxVQUFRO0FBRmdELENBQXpEO0FBS0FsVyxXQUFXb1IsUUFBWCxDQUFvQjdKLEdBQXBCLENBQXdCLHdCQUF4QixFQUFrRCxDQUFDNlksR0FBRCxFQUFNMVAsU0FBTixLQUFvQjtBQUNyRTtBQUNBLE1BQUksQ0FBQzJQLE9BQU96Z0IsSUFBWixFQUFrQjtBQUNqQjtBQUNBOztBQUVELE1BQUk4USxTQUFKLEVBQWU7QUFDZDJQLFdBQU96Z0IsSUFBUCxDQUFZcWdCLElBQVo7QUFDQSxHQUZELE1BRU87QUFDTkksV0FBT3pnQixJQUFQLENBQVl1Z0IsTUFBWjtBQUNBO0FBQ0QsQ0FYRDtBQWFBNVcsT0FBTytXLE9BQVAsQ0FBZSxTQUFTQyxzQkFBVCxHQUFrQztBQUNoREYsU0FBT3pnQixJQUFQLEdBQWMsSUFBSXVmLHFCQUFKLEVBQWQ7O0FBRUEsTUFBSWtCLE9BQU96Z0IsSUFBUCxDQUFZOFEsU0FBWixFQUFKLEVBQTZCO0FBQzVCMlAsV0FBT3pnQixJQUFQLENBQVlxZ0IsSUFBWjtBQUNBO0FBQ0QsQ0FORCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2FwcHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQbGVhc2Ugc2VlIGJvdGggc2VydmVyIGFuZCBjbGllbnQncyByZXBzZWN0aXZlIFwib3JjaGVzdHJhdG9yXCIgZmlsZSBmb3IgdGhlIGNvbnRlbnRzXG5BcHBzID0ge307XG4iLCJleHBvcnQgY2xhc3MgQXBwc0xvZ3NNb2RlbCBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2FwcHNfbG9ncycpO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwc01vZGVsIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignYXBwcycpO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwc1BlcnNpc3RlbmNlTW9kZWwgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdhcHBzX3BlcnNpc3RlbmNlJyk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcFN0b3JhZ2UgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL3N0b3JhZ2UnO1xuXG5leHBvcnQgY2xhc3MgQXBwUmVhbFN0b3JhZ2UgZXh0ZW5kcyBBcHBTdG9yYWdlIHtcblx0Y29uc3RydWN0b3IoZGF0YSkge1xuXHRcdHN1cGVyKCdtb25nb2RiJyk7XG5cdFx0dGhpcy5kYiA9IGRhdGE7XG5cdH1cblxuXHRjcmVhdGUoaXRlbSkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRpdGVtLmNyZWF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cdFx0XHRpdGVtLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cblx0XHRcdGxldCBkb2M7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGRvYyA9IHRoaXMuZGIuZmluZE9uZSh7ICRvcjogW3sgaWQ6IGl0ZW0uaWQgfSwgeyAnaW5mby5uYW1lU2x1Zyc6IGl0ZW0uaW5mby5uYW1lU2x1ZyB9XSB9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRvYykge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignQXBwIGFscmVhZHkgZXhpc3RzLicpKTtcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgaWQgPSB0aGlzLmRiLmluc2VydChpdGVtKTtcblx0XHRcdFx0aXRlbS5faWQgPSBpZDtcblxuXHRcdFx0XHRyZXNvbHZlKGl0ZW0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZWplY3QoZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZXRyaWV2ZU9uZShpZCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRsZXQgZG9jO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkb2MgPSB0aGlzLmRiLmZpbmRPbmUoeyAkb3I6IFsge19pZDogaWQgfSwgeyBpZCB9IF19KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRvYykge1xuXHRcdFx0XHRyZXNvbHZlKGRvYyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZWplY3QobmV3IEVycm9yKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkOiAkeyBpZCB9YCkpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmV0cmlldmVBbGwoKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGxldCBkb2NzO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkb2NzID0gdGhpcy5kYi5maW5kKHt9KS5mZXRjaCgpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBpdGVtcyA9IG5ldyBNYXAoKTtcblxuXHRcdFx0ZG9jcy5mb3JFYWNoKChpKSA9PiBpdGVtcy5zZXQoaS5pZCwgaSkpO1xuXG5cdFx0XHRyZXNvbHZlKGl0ZW1zKTtcblx0XHR9KTtcblx0fVxuXG5cdHVwZGF0ZShpdGVtKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMuZGIudXBkYXRlKHsgaWQ6IGl0ZW0uaWQgfSwgaXRlbSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucmV0cmlldmVPbmUoaXRlbS5pZCkudGhlbigodXBkYXRlZCkgPT4gcmVzb2x2ZSh1cGRhdGVkKSkuY2F0Y2goKGVycikgPT4gcmVqZWN0KGVycikpO1xuXHRcdH0pO1xuXHR9XG5cblx0cmVtb3ZlKGlkKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMuZGIucmVtb3ZlKHsgaWQgfSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlIH0pO1xuXHRcdH0pO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHBzTG9nc01vZGVsIH0gZnJvbSAnLi9hcHBzLWxvZ3MtbW9kZWwnO1xuaW1wb3J0IHsgQXBwc01vZGVsIH0gZnJvbSAnLi9hcHBzLW1vZGVsJztcbmltcG9ydCB7IEFwcHNQZXJzaXN0ZW5jZU1vZGVsIH0gZnJvbSAnLi9hcHBzLXBlcnNpc3RlbmNlLW1vZGVsJztcbmltcG9ydCB7IEFwcFJlYWxMb2dzU3RvcmFnZSB9IGZyb20gJy4vbG9ncy1zdG9yYWdlJztcbmltcG9ydCB7IEFwcFJlYWxTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcblxuZXhwb3J0IHsgQXBwc0xvZ3NNb2RlbCwgQXBwc01vZGVsLCBBcHBzUGVyc2lzdGVuY2VNb2RlbCwgQXBwUmVhbExvZ3NTdG9yYWdlLCBBcHBSZWFsU3RvcmFnZSB9O1xuIiwiaW1wb3J0IHsgQXBwQ29uc29sZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvbG9nZ2luZyc7XG5pbXBvcnQgeyBBcHBMb2dTdG9yYWdlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9zdG9yYWdlJztcblxuZXhwb3J0IGNsYXNzIEFwcFJlYWxMb2dzU3RvcmFnZSBleHRlbmRzIEFwcExvZ1N0b3JhZ2Uge1xuXHRjb25zdHJ1Y3Rvcihtb2RlbCkge1xuXHRcdHN1cGVyKCdtb25nb2RiJyk7XG5cdFx0dGhpcy5kYiA9IG1vZGVsO1xuXHR9XG5cblx0ZmluZCgpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0bGV0IGRvY3M7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGRvY3MgPSB0aGlzLmRiLmZpbmQoLi4uYXJndW1lbnRzKS5mZXRjaCgpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXNvbHZlKGRvY3MpO1xuXHRcdH0pO1xuXHR9XG5cblx0c3RvcmVFbnRyaWVzKGFwcElkLCBsb2dnZXIpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0Y29uc3QgaXRlbSA9IEFwcENvbnNvbGUudG9TdG9yYWdlRW50cnkoYXBwSWQsIGxvZ2dlcik7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGlkID0gdGhpcy5kYi5pbnNlcnQoaXRlbSk7XG5cblx0XHRcdFx0cmVzb2x2ZSh0aGlzLmRiLmZpbmRPbmVCeUlkKGlkKSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJlamVjdChlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdGdldEVudHJpZXNGb3IoYXBwSWQpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0bGV0IGRvY3M7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGRvY3MgPSB0aGlzLmRiLmZpbmQoeyBhcHBJZCB9KS5mZXRjaCgpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXNvbHZlKGRvY3MpO1xuXHRcdH0pO1xuXHR9XG5cblx0cmVtb3ZlRW50cmllc0ZvcihhcHBJZCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLmRiLnJlbW92ZSh7IGFwcElkIH0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXNvbHZlKCk7XG5cdFx0fSk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBBY3RpdmF0aW9uQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRhc3luYyBhcHBBZGRlZChhcHApIHtcblx0XHRhd2FpdCB0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5hcHBBZGRlZChhcHAuZ2V0SUQoKSk7XG5cdH1cblxuXHRhc3luYyBhcHBVcGRhdGVkKGFwcCkge1xuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXROb3RpZmllcigpLmFwcFVwZGF0ZWQoYXBwLmdldElEKCkpO1xuXHR9XG5cblx0YXN5bmMgYXBwUmVtb3ZlZChhcHApIHtcblx0XHRhd2FpdCB0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5hcHBSZW1vdmVkKGFwcC5nZXRJRCgpKTtcblx0fVxuXG5cdGFzeW5jIGFwcFN0YXR1c0NoYW5nZWQoYXBwLCBzdGF0dXMpIHtcblx0XHRhd2FpdCB0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5hcHBTdGF0dXNVcGRhdGVkKGFwcC5nZXRJRCgpLCBzdGF0dXMpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHBCcmlkZ2VzIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9icmlkZ2VzJztcblxuaW1wb3J0IHsgQXBwQWN0aXZhdGlvbkJyaWRnZSB9IGZyb20gJy4vYWN0aXZhdGlvbic7XG5pbXBvcnQgeyBBcHBEZXRhaWxDaGFuZ2VzQnJpZGdlIH0gZnJvbSAnLi9kZXRhaWxzJztcbmltcG9ydCB7IEFwcENvbW1hbmRzQnJpZGdlIH0gZnJvbSAnLi9jb21tYW5kcyc7XG5pbXBvcnQgeyBBcHBFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2UgfSBmcm9tICcuL2Vudmlyb25tZW50YWwnO1xuaW1wb3J0IHsgQXBwSHR0cEJyaWRnZSB9IGZyb20gJy4vaHR0cCc7XG5pbXBvcnQgeyBBcHBMaXN0ZW5lckJyaWRnZSB9IGZyb20gJy4vbGlzdGVuZXJzJztcbmltcG9ydCB7IEFwcE1lc3NhZ2VCcmlkZ2UgfSBmcm9tICcuL21lc3NhZ2VzJztcbmltcG9ydCB7IEFwcFBlcnNpc3RlbmNlQnJpZGdlIH0gZnJvbSAnLi9wZXJzaXN0ZW5jZSc7XG5pbXBvcnQgeyBBcHBSb29tQnJpZGdlIH0gZnJvbSAnLi9yb29tcyc7XG5pbXBvcnQgeyBBcHBTZXR0aW5nQnJpZGdlIH0gZnJvbSAnLi9zZXR0aW5ncyc7XG5pbXBvcnQgeyBBcHBVc2VyQnJpZGdlIH0gZnJvbSAnLi91c2Vycyc7XG5cbmV4cG9ydCBjbGFzcyBSZWFsQXBwQnJpZGdlcyBleHRlbmRzIEFwcEJyaWRnZXMge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdHRoaXMuX2FjdEJyaWRnZSA9IG5ldyBBcHBBY3RpdmF0aW9uQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX2NtZEJyaWRnZSA9IG5ldyBBcHBDb21tYW5kc0JyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9kZXRCcmlkZ2UgPSBuZXcgQXBwRGV0YWlsQ2hhbmdlc0JyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9lbnZCcmlkZ2UgPSBuZXcgQXBwRW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX2h0dHBCcmlkZ2UgPSBuZXcgQXBwSHR0cEJyaWRnZSgpO1xuXHRcdHRoaXMuX2xpc25CcmlkZ2UgPSBuZXcgQXBwTGlzdGVuZXJCcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fbXNnQnJpZGdlID0gbmV3IEFwcE1lc3NhZ2VCcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fcGVyc2lzdEJyaWRnZSA9IG5ldyBBcHBQZXJzaXN0ZW5jZUJyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9yb29tQnJpZGdlID0gbmV3IEFwcFJvb21CcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fc2V0c0JyaWRnZSA9IG5ldyBBcHBTZXR0aW5nQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX3VzZXJCcmlkZ2UgPSBuZXcgQXBwVXNlckJyaWRnZShvcmNoKTtcblx0fVxuXG5cdGdldENvbW1hbmRCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2NtZEJyaWRnZTtcblx0fVxuXG5cdGdldEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fZW52QnJpZGdlO1xuXHR9XG5cblx0Z2V0SHR0cEJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5faHR0cEJyaWRnZTtcblx0fVxuXG5cdGdldExpc3RlbmVyQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9saXNuQnJpZGdlO1xuXHR9XG5cblx0Z2V0TWVzc2FnZUJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fbXNnQnJpZGdlO1xuXHR9XG5cblx0Z2V0UGVyc2lzdGVuY2VCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3BlcnNpc3RCcmlkZ2U7XG5cdH1cblxuXHRnZXRBcHBBY3RpdmF0aW9uQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9hY3RCcmlkZ2U7XG5cdH1cblxuXHRnZXRBcHBEZXRhaWxDaGFuZ2VzQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9kZXRCcmlkZ2U7XG5cdH1cblxuXHRnZXRSb29tQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9yb29tQnJpZGdlO1xuXHR9XG5cblx0Z2V0U2VydmVyU2V0dGluZ0JyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fc2V0c0JyaWRnZTtcblx0fVxuXG5cdGdldFVzZXJCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3VzZXJCcmlkZ2U7XG5cdH1cbn1cbiIsImltcG9ydCB7IFNsYXNoQ29tbWFuZENvbnRleHQgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy10cy1kZWZpbml0aW9uL3NsYXNoY29tbWFuZHMnO1xuXG5leHBvcnQgY2xhc3MgQXBwQ29tbWFuZHNCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0XHR0aGlzLmRpc2FibGVkQ29tbWFuZHMgPSBuZXcgTWFwKCk7XG5cdH1cblxuXHRkb2VzQ29tbWFuZEV4aXN0KGNvbW1hbmQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjaGVja2luZyBpZiBcIiR7IGNvbW1hbmQgfVwiIGNvbW1hbmQgZXhpc3RzLmApO1xuXG5cdFx0aWYgKHR5cGVvZiBjb21tYW5kICE9PSAnc3RyaW5nJyB8fCBjb21tYW5kLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IGNvbW1hbmQudG9Mb3dlckNhc2UoKTtcblx0XHRyZXR1cm4gdHlwZW9mIFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdID09PSAnb2JqZWN0JyB8fCB0aGlzLmRpc2FibGVkQ29tbWFuZHMuaGFzKGNtZCk7XG5cdH1cblxuXHRlbmFibGVDb21tYW5kKGNvbW1hbmQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBhdHRlbXB0aW5nIHRvIGVuYWJsZSB0aGUgY29tbWFuZDogXCIkeyBjb21tYW5kIH1cImApO1xuXG5cdFx0aWYgKHR5cGVvZiBjb21tYW5kICE9PSAnc3RyaW5nJyB8fCBjb21tYW5kLnRyaW0oKS5sZW5ndGggPT09IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgbXVzdCBiZSBhIHN0cmluZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBjbWQgPSBjb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKCF0aGlzLmRpc2FibGVkQ29tbWFuZHMuaGFzKGNtZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgVGhlIGNvbW1hbmQgaXMgbm90IGN1cnJlbnRseSBkaXNhYmxlZDogXCIkeyBjbWQgfVwiYCk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0gPSB0aGlzLmRpc2FibGVkQ29tbWFuZHMuZ2V0KGNtZCk7XG5cdFx0dGhpcy5kaXNhYmxlZENvbW1hbmRzLmRlbGV0ZShjbWQpO1xuXG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuY29tbWFuZFVwZGF0ZWQoY21kKTtcblx0fVxuXG5cdGRpc2FibGVDb21tYW5kKGNvbW1hbmQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBhdHRlbXB0aW5nIHRvIGRpc2FibGUgdGhlIGNvbW1hbmQ6IFwiJHsgY29tbWFuZCB9XCJgKTtcblxuXHRcdGlmICh0eXBlb2YgY29tbWFuZCAhPT0gJ3N0cmluZycgfHwgY29tbWFuZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIG11c3QgYmUgYSBzdHJpbmcuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICh0aGlzLmRpc2FibGVkQ29tbWFuZHMuaGFzKGNtZCkpIHtcblx0XHRcdC8vIFRoZSBjb21tYW5kIGlzIGFscmVhZHkgZGlzYWJsZWQsIG5vIG5lZWQgdG8gZGlzYWJsZSBpdCB5ZXQgYWdhaW5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBDb21tYW5kIGRvZXMgbm90IGV4aXN0IGluIHRoZSBzeXN0ZW0gY3VycmVudGx5OiBcIiR7IGNtZCB9XCJgKTtcblx0XHR9XG5cblx0XHR0aGlzLmRpc2FibGVkQ29tbWFuZHMuc2V0KGNtZCwgUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0pO1xuXHRcdGRlbGV0ZSBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXTtcblxuXHRcdHRoaXMub3JjaC5nZXROb3RpZmllcigpLmNvbW1hbmREaXNhYmxlZChjbWQpO1xuXHR9XG5cblx0Ly8gY29tbWFuZDogeyBjb21tYW5kLCBwYXJhbXNFeGFtcGxlLCBpMThuRGVzY3JpcHRpb24sIGV4ZWN1dG9yOiBmdW5jdGlvbiB9XG5cdG1vZGlmeUNvbW1hbmQoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGF0dGVtcHRpbmcgdG8gbW9kaWZ5IHRoZSBjb21tYW5kOiBcIiR7IGNvbW1hbmQgfVwiYCk7XG5cblx0XHR0aGlzLl92ZXJpZnlDb21tYW5kKGNvbW1hbmQpO1xuXG5cdFx0Y29uc3QgY21kID0gY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICh0eXBlb2YgUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0gPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYENvbW1hbmQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIHN5c3RlbSBjdXJyZW50bHkgKG9yIGl0IGlzIGRpc2FibGVkKTogXCIkeyBjbWQgfVwiYCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaXRlbSA9IFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdO1xuXHRcdGl0ZW0ucGFyYW1zID0gY29tbWFuZC5wYXJhbXNFeGFtcGxlID8gY29tbWFuZC5wYXJhbXNFeGFtcGxlIDogaXRlbS5wYXJhbXM7XG5cdFx0aXRlbS5kZXNjcmlwdGlvbiA9IGNvbW1hbmQuaTE4bkRlc2NyaXB0aW9uID8gY29tbWFuZC5pMThuRGVzY3JpcHRpb24gOiBpdGVtLnBhcmFtcztcblx0XHRpdGVtLmNhbGxiYWNrID0gdGhpcy5fYXBwQ29tbWFuZEV4ZWN1dG9yLmJpbmQodGhpcyk7XG5cdFx0aXRlbS5wcm92aWRlc1ByZXZpZXcgPSBjb21tYW5kLnByb3ZpZGVzUHJldmlldztcblx0XHRpdGVtLnByZXZpZXdlciA9IGNvbW1hbmQucHJldmlld2VyID8gdGhpcy5fYXBwQ29tbWFuZFByZXZpZXdlci5iaW5kKHRoaXMpIDogaXRlbS5wcmV2aWV3ZXI7XG5cdFx0aXRlbS5wcmV2aWV3Q2FsbGJhY2sgPSBjb21tYW5kLmV4ZWN1dGVQcmV2aWV3SXRlbSA/IHRoaXMuX2FwcENvbW1hbmRQcmV2aWV3RXhlY3V0b3IuYmluZCh0aGlzKSA6IGl0ZW0ucHJldmlld0NhbGxiYWNrO1xuXG5cdFx0Um9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0gPSBpdGVtO1xuXHRcdHRoaXMub3JjaC5nZXROb3RpZmllcigpLmNvbW1hbmRVcGRhdGVkKGNtZCk7XG5cdH1cblxuXHRyZWdpc3RlckNvbW1hbmQoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHJlZ2lzdGVyaW4gdGhlIGNvbW1hbmQ6IFwiJHsgY29tbWFuZC5jb21tYW5kIH1cImApO1xuXG5cdFx0dGhpcy5fdmVyaWZ5Q29tbWFuZChjb21tYW5kKTtcblxuXHRcdGNvbnN0IGl0ZW0gPSB7XG5cdFx0XHRjb21tYW5kOiBjb21tYW5kLmNvbW1hbmQudG9Mb3dlckNhc2UoKSxcblx0XHRcdHBhcmFtczogY29tbWFuZC5wYXJhbXNFeGFtcGxlLFxuXHRcdFx0ZGVzY3JpcHRpb246IGNvbW1hbmQuaTE4bkRlc2NyaXB0aW9uLFxuXHRcdFx0Y2FsbGJhY2s6IHRoaXMuX2FwcENvbW1hbmRFeGVjdXRvci5iaW5kKHRoaXMpLFxuXHRcdFx0cHJvdmlkZXNQcmV2aWV3OiBjb21tYW5kLnByb3ZpZGVzUHJldmlldyxcblx0XHRcdHByZXZpZXdlcjogIWNvbW1hbmQucHJldmlld2VyID8gdW5kZWZpbmVkIDogdGhpcy5fYXBwQ29tbWFuZFByZXZpZXdlci5iaW5kKHRoaXMpLFxuXHRcdFx0cHJldmlld0NhbGxiYWNrOiAhY29tbWFuZC5leGVjdXRlUHJldmlld0l0ZW0gPyB1bmRlZmluZWQgOiB0aGlzLl9hcHBDb21tYW5kUHJldmlld0V4ZWN1dG9yLmJpbmQodGhpcylcblx0XHR9O1xuXG5cdFx0Um9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NvbW1hbmQuY29tbWFuZC50b0xvd2VyQ2FzZSgpXSA9IGl0ZW07XG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuY29tbWFuZEFkZGVkKGNvbW1hbmQuY29tbWFuZC50b0xvd2VyQ2FzZSgpKTtcblx0fVxuXG5cdHVucmVnaXN0ZXJDb21tYW5kKGNvbW1hbmQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyB1bnJlZ2lzdGVyaW5nIHRoZSBjb21tYW5kOiBcIiR7IGNvbW1hbmQgfVwiYCk7XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdzdHJpbmcnIHx8IGNvbW1hbmQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBtdXN0IGJlIGEgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IGNvbW1hbmQudG9Mb3dlckNhc2UoKTtcblx0XHR0aGlzLmRpc2FibGVkQ29tbWFuZHMuZGVsZXRlKGNtZCk7XG5cdFx0ZGVsZXRlIFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdO1xuXG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuY29tbWFuZFJlbW92ZWQoY21kKTtcblx0fVxuXG5cdF92ZXJpZnlDb21tYW5kKGNvbW1hbmQpIHtcblx0XHRpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdvYmplY3QnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgU2xhc2ggQ29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIGl0IG11c3QgYmUgYSB2YWxpZCBJU2xhc2hDb21tYW5kIG9iamVjdC4nKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQuY29tbWFuZCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTbGFzaCBDb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgaXQgbXVzdCBiZSBhIHZhbGlkIElTbGFzaENvbW1hbmQgb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdGlmIChjb21tYW5kLmkxOG5QYXJhbXNFeGFtcGxlICYmIHR5cGVvZiBjb21tYW5kLmkxOG5QYXJhbXNFeGFtcGxlICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFNsYXNoIENvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBpdCBtdXN0IGJlIGEgdmFsaWQgSVNsYXNoQ29tbWFuZCBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGNvbW1hbmQuaTE4bkRlc2NyaXB0aW9uICYmIHR5cGVvZiBjb21tYW5kLmkxOG5EZXNjcmlwdGlvbiAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTbGFzaCBDb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgaXQgbXVzdCBiZSBhIHZhbGlkIElTbGFzaENvbW1hbmQgb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgY29tbWFuZC5wcm92aWRlc1ByZXZpZXcgIT09ICdib29sZWFuJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFNsYXNoIENvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBpdCBtdXN0IGJlIGEgdmFsaWQgSVNsYXNoQ29tbWFuZCBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBjb21tYW5kLmV4ZWN1dG9yICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgU2xhc2ggQ29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIGl0IG11c3QgYmUgYSB2YWxpZCBJU2xhc2hDb21tYW5kIG9iamVjdC4nKTtcblx0XHR9XG5cdH1cblxuXHRfYXBwQ29tbWFuZEV4ZWN1dG9yKGNvbW1hbmQsIHBhcmFtZXRlcnMsIG1lc3NhZ2UpIHtcblx0XHRjb25zdCB1c2VyID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3VzZXJzJykuY29udmVydEJ5SWQoTWV0ZW9yLnVzZXJJZCgpKTtcblx0XHRjb25zdCByb29tID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3Jvb21zJykuY29udmVydEJ5SWQobWVzc2FnZS5yaWQpO1xuXHRcdGNvbnN0IHBhcmFtcyA9IHBhcmFtZXRlcnMubGVuZ3RoID09PSAwIHx8IHBhcmFtZXRlcnMgPT09ICcgJyA/IFtdIDogcGFyYW1ldGVycy5zcGxpdCgnICcpO1xuXG5cdFx0Y29uc3QgY29udGV4dCA9IG5ldyBTbGFzaENvbW1hbmRDb250ZXh0KE9iamVjdC5mcmVlemUodXNlciksIE9iamVjdC5mcmVlemUocm9vbSksIE9iamVjdC5mcmVlemUocGFyYW1zKSk7XG5cdFx0UHJvbWlzZS5hd2FpdCh0aGlzLm9yY2guZ2V0TWFuYWdlcigpLmdldENvbW1hbmRNYW5hZ2VyKCkuZXhlY3V0ZUNvbW1hbmQoY29tbWFuZCwgY29udGV4dCkpO1xuXHR9XG5cblx0X2FwcENvbW1hbmRQcmV2aWV3ZXIoY29tbWFuZCwgcGFyYW1ldGVycywgbWVzc2FnZSkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZChNZXRlb3IudXNlcklkKCkpO1xuXHRcdGNvbnN0IHJvb20gPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlJZChtZXNzYWdlLnJpZCk7XG5cdFx0Y29uc3QgcGFyYW1zID0gcGFyYW1ldGVycy5sZW5ndGggPT09IDAgfHwgcGFyYW1ldGVycyA9PT0gJyAnID8gW10gOiBwYXJhbWV0ZXJzLnNwbGl0KCcgJyk7XG5cblx0XHRjb25zdCBjb250ZXh0ID0gbmV3IFNsYXNoQ29tbWFuZENvbnRleHQoT2JqZWN0LmZyZWV6ZSh1c2VyKSwgT2JqZWN0LmZyZWV6ZShyb29tKSwgT2JqZWN0LmZyZWV6ZShwYXJhbXMpKTtcblx0XHRyZXR1cm4gUHJvbWlzZS5hd2FpdCh0aGlzLm9yY2guZ2V0TWFuYWdlcigpLmdldENvbW1hbmRNYW5hZ2VyKCkuZ2V0UHJldmlld3MoY29tbWFuZCwgY29udGV4dCkpO1xuXHR9XG5cblx0X2FwcENvbW1hbmRQcmV2aWV3RXhlY3V0b3IoY29tbWFuZCwgcGFyYW1ldGVycywgbWVzc2FnZSwgcHJldmlldykge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZChNZXRlb3IudXNlcklkKCkpO1xuXHRcdGNvbnN0IHJvb20gPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlJZChtZXNzYWdlLnJpZCk7XG5cdFx0Y29uc3QgcGFyYW1zID0gcGFyYW1ldGVycy5sZW5ndGggPT09IDAgfHwgcGFyYW1ldGVycyA9PT0gJyAnID8gW10gOiBwYXJhbWV0ZXJzLnNwbGl0KCcgJyk7XG5cblx0XHRjb25zdCBjb250ZXh0ID0gbmV3IFNsYXNoQ29tbWFuZENvbnRleHQoT2JqZWN0LmZyZWV6ZSh1c2VyKSwgT2JqZWN0LmZyZWV6ZShyb29tKSwgT2JqZWN0LmZyZWV6ZShwYXJhbXMpKTtcblx0XHRQcm9taXNlLmF3YWl0KHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZ2V0Q29tbWFuZE1hbmFnZXIoKS5leGVjdXRlUHJldmlldyhjb21tYW5kLCBwcmV2aWV3LCBjb250ZXh0KSk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0XHR0aGlzLmFsbG93ZWQgPSBbJ05PREVfRU5WJywgJ1JPT1RfVVJMJywgJ0lOU1RBTkNFX0lQJ107XG5cdH1cblxuXHRhc3luYyBnZXRWYWx1ZUJ5TmFtZShlbnZWYXJOYW1lLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgZW52aXJvbm1lbnRhbCB2YXJpYWJsZSB2YWx1ZSAkeyBlbnZWYXJOYW1lIH0uYCk7XG5cblx0XHRpZiAodGhpcy5pc1JlYWRhYmxlKGVudlZhck5hbWUsIGFwcElkKSkge1xuXHRcdFx0cmV0dXJuIHByb2Nlc3MuZW52W2VudlZhck5hbWVdO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcihgVGhlIGVudmlyb25tZW50YWwgdmFyaWFibGUgXCIkeyBlbnZWYXJOYW1lIH1cIiBpcyBub3QgcmVhZGFibGUuYCk7XG5cdH1cblxuXHRhc3luYyBpc1JlYWRhYmxlKGVudlZhck5hbWUsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjaGVja2luZyBpZiB0aGUgZW52aXJvbm1lbnRhbCB2YXJpYWJsZSBpcyByZWFkYWJsZSAkeyBlbnZWYXJOYW1lIH0uYCk7XG5cblx0XHRyZXR1cm4gdGhpcy5hbGxvd2VkLmluY2x1ZGVzKGVudlZhck5hbWUudG9VcHBlckNhc2UoKSk7XG5cdH1cblxuXHRhc3luYyBpc1NldChlbnZWYXJOYW1lLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgY2hlY2tpbmcgaWYgdGhlIGVudmlyb25tZW50YWwgdmFyaWFibGUgaXMgc2V0ICR7IGVudlZhck5hbWUgfS5gKTtcblxuXHRcdGlmICh0aGlzLmlzUmVhZGFibGUoZW52VmFyTmFtZSwgYXBwSWQpKSB7XG5cdFx0XHRyZXR1cm4gdHlwZW9mIHByb2Nlc3MuZW52W2VudlZhck5hbWVdICE9PSAndW5kZWZpbmVkJztcblx0XHR9XG5cblx0XHR0aHJvdyBuZXcgRXJyb3IoYFRoZSBlbnZpcm9ubWVudGFsIHZhcmlhYmxlIFwiJHsgZW52VmFyTmFtZSB9XCIgaXMgbm90IHJlYWRhYmxlLmApO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwTWVzc2FnZUJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0YXN5bmMgY3JlYXRlKG1lc3NhZ2UsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjcmVhdGluZyBhIG5ldyBtZXNzYWdlLmApO1xuXG5cdFx0bGV0IG1zZyA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdtZXNzYWdlcycpLmNvbnZlcnRBcHBNZXNzYWdlKG1lc3NhZ2UpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcihtc2cudS5faWQsICgpID0+IHtcblx0XHRcdG1zZyA9IE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIG1zZyk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gbXNnLl9pZDtcblx0fVxuXG5cdGFzeW5jIGdldEJ5SWQobWVzc2FnZUlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgbWVzc2FnZTogXCIkeyBtZXNzYWdlSWQgfVwiYCk7XG5cblx0XHRyZXR1cm4gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ21lc3NhZ2VzJykuY29udmVydEJ5SWQobWVzc2FnZUlkKTtcblx0fVxuXG5cdGFzeW5jIHVwZGF0ZShtZXNzYWdlLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgdXBkYXRpbmcgYSBtZXNzYWdlLmApO1xuXG5cdFx0aWYgKCFtZXNzYWdlLmVkaXRvcikge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGVkaXRvciBhc3NpZ25lZCB0byB0aGUgbWVzc2FnZSBmb3IgdGhlIHVwZGF0ZS4nKTtcblx0XHR9XG5cblx0XHRpZiAoIW1lc3NhZ2UuaWQgfHwgIVJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKG1lc3NhZ2UuaWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0EgbWVzc2FnZSBtdXN0IGV4aXN0IHRvIHVwZGF0ZS4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnbWVzc2FnZXMnKS5jb252ZXJ0QXBwTWVzc2FnZShtZXNzYWdlKTtcblx0XHRjb25zdCBlZGl0b3IgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChtZXNzYWdlLmVkaXRvci5pZCk7XG5cblx0XHRSb2NrZXRDaGF0LnVwZGF0ZU1lc3NhZ2UobXNnLCBlZGl0b3IpO1xuXHR9XG5cblx0YXN5bmMgbm90aWZ5VXNlcih1c2VyLCBtZXNzYWdlLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgbm90aWZ5aW5nIGEgdXNlci5gKTtcblxuXHRcdGNvbnN0IG1zZyA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdtZXNzYWdlcycpLmNvbnZlcnRBcHBNZXNzYWdlKG1lc3NhZ2UpO1xuXG5cdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIodXNlci5pZCwgJ21lc3NhZ2UnLCBPYmplY3QuYXNzaWduKG1zZywge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0dTogdW5kZWZpbmVkLFxuXHRcdFx0ZWRpdG9yOiB1bmRlZmluZWRcblx0XHR9KSk7XG5cdH1cblxuXHRhc3luYyBub3RpZnlSb29tKHJvb20sIG1lc3NhZ2UsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBub3RpZnlpbmcgYSByb29tJ3MgdXNlcnMuYCk7XG5cblx0XHRpZiAocm9vbSAmJiByb29tLnVzZXJuYW1lcyAmJiBBcnJheS5pc0FycmF5KHJvb20udXNlcm5hbWVzKSkge1xuXHRcdFx0Y29uc3QgbXNnID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ21lc3NhZ2VzJykuY29udmVydEFwcE1lc3NhZ2UobWVzc2FnZSk7XG5cdFx0XHRjb25zdCBybXNnID0gT2JqZWN0LmFzc2lnbihtc2csIHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0cmlkOiByb29tLmlkLFxuXHRcdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdFx0dTogdW5kZWZpbmVkLFxuXHRcdFx0XHRlZGl0b3I6IHVuZGVmaW5lZFxuXHRcdFx0fSk7XG5cblx0XHRcdHJvb20udXNlcm5hbWVzLmZvckVhY2goKHUpID0+IHtcblx0XHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHUpO1xuXHRcdFx0XHRpZiAodXNlcikge1xuXHRcdFx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKHVzZXIuX2lkLCAnbWVzc2FnZScsIHJtc2cpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBQZXJzaXN0ZW5jZUJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0YXN5bmMgcHVyZ2UoYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCdzIHBlcnNpc3RlbnQgc3RvcmFnZSBpcyBiZWluZyBwdXJnZWQ6ICR7IGFwcElkIH1gKTtcblxuXHRcdHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkucmVtb3ZlKHsgYXBwSWQgfSk7XG5cdH1cblxuXHRhc3luYyBjcmVhdGUoZGF0YSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHN0b3JpbmcgYSBuZXcgb2JqZWN0IGluIHRoZWlyIHBlcnNpc3RlbmNlLmAsIGRhdGEpO1xuXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0ZWQgdG8gc3RvcmUgYW4gaW52YWxpZCBkYXRhIHR5cGUsIGl0IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmluc2VydCh7IGFwcElkLCBkYXRhIH0pO1xuXHR9XG5cblx0YXN5bmMgY3JlYXRlV2l0aEFzc29jaWF0aW9ucyhkYXRhLCBhc3NvY2lhdGlvbnMsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBzdG9yaW5nIGEgbmV3IG9iamVjdCBpbiB0aGVpciBwZXJzaXN0ZW5jZSB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aCBzb21lIG1vZGVscy5gLCBkYXRhLCBhc3NvY2lhdGlvbnMpO1xuXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0ZWQgdG8gc3RvcmUgYW4gaW52YWxpZCBkYXRhIHR5cGUsIGl0IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmluc2VydCh7IGFwcElkLCBhc3NvY2lhdGlvbnMsIGRhdGEgfSk7XG5cdH1cblxuXHRhc3luYyByZWFkQnlJZChpZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHJlYWRpbmcgdGhlaXIgZGF0YSBpbiB0aGVpciBwZXJzaXN0ZW5jZSB3aXRoIHRoZSBpZDogXCIkeyBpZCB9XCJgKTtcblxuXHRcdGNvbnN0IHJlY29yZCA9IHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkuZmluZE9uZUJ5SWQoaWQpO1xuXG5cdFx0cmV0dXJuIHJlY29yZC5kYXRhO1xuXHR9XG5cblx0YXN5bmMgcmVhZEJ5QXNzb2NpYXRpb25zKGFzc29jaWF0aW9ucywgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHNlYXJjaGluZyBmb3IgcmVjb3JkcyB0aGF0IGFyZSBhc3NvY2lhdGVkIHdpdGggdGhlIGZvbGxvd2luZzpgLCBhc3NvY2lhdGlvbnMpO1xuXG5cdFx0Y29uc3QgcmVjb3JkcyA9IHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkuZmluZCh7XG5cdFx0XHRhcHBJZCxcblx0XHRcdGFzc29jaWF0aW9uczogeyAkYWxsOiBhc3NvY2lhdGlvbnMgfVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShyZWNvcmRzKSA/IHJlY29yZHMubWFwKChyKSA9PiByLmRhdGEpIDogW107XG5cdH1cblxuXHRhc3luYyByZW1vdmUoaWQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyByZW1vdmluZyBvbmUgb2YgdGhlaXIgcmVjb3JkcyBieSB0aGUgaWQ6IFwiJHsgaWQgfVwiYCk7XG5cblx0XHRjb25zdCByZWNvcmQgPSB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmZpbmRPbmUoeyBfaWQ6IGlkLCBhcHBJZCB9KTtcblxuXHRcdGlmICghcmVjb3JkKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkucmVtb3ZlKHsgX2lkOiBpZCwgYXBwSWQgfSk7XG5cblx0XHRyZXR1cm4gcmVjb3JkLmRhdGE7XG5cdH1cblxuXHRhc3luYyByZW1vdmVCeUFzc29jaWF0aW9ucyhhc3NvY2lhdGlvbnMsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyByZW1vdmluZyByZWNvcmRzIHdpdGggdGhlIGZvbGxvd2luZyBhc3NvY2lhdGlvbnM6YCwgYXNzb2NpYXRpb25zKTtcblxuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0YXBwSWQsXG5cdFx0XHRhc3NvY2lhdGlvbnM6IHtcblx0XHRcdFx0JGFsbDogYXNzb2NpYXRpb25zXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IHJlY29yZHMgPSB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmZpbmQocXVlcnkpLmZldGNoKCk7XG5cblx0XHRpZiAoIXJlY29yZHMpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0dGhpcy5vcmNoLmdldFBlcnNpc3RlbmNlTW9kZWwoKS5yZW1vdmUocXVlcnkpO1xuXG5cdFx0cmV0dXJuIEFycmF5LmlzQXJyYXkocmVjb3JkcykgPyByZWNvcmRzLm1hcCgocikgPT4gci5kYXRhKSA6IFtdO1xuXHR9XG5cblx0YXN5bmMgdXBkYXRlKGlkLCBkYXRhLCB1cHNlcnQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyB1cGRhdGluZyB0aGUgcmVjb3JkIFwiJHsgaWQgfVwiIHRvOmAsIGRhdGEpO1xuXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0ZWQgdG8gc3RvcmUgYW4gaW52YWxpZCBkYXRhIHR5cGUsIGl0IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkLicpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBSb29tVHlwZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLXRzLWRlZmluaXRpb24vcm9vbXMnO1xuXG5leHBvcnQgY2xhc3MgQXBwUm9vbUJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0YXN5bmMgY3JlYXRlKHJvb20sIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjcmVhdGluZyBhIG5ldyByb29tLmAsIHJvb20pO1xuXG5cdFx0Y29uc3QgcmNSb29tID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3Jvb21zJykuY29udmVydEFwcFJvb20ocm9vbSk7XG5cdFx0bGV0IG1ldGhvZDtcblxuXHRcdHN3aXRjaCAocm9vbS50eXBlKSB7XG5cdFx0XHRjYXNlIFJvb21UeXBlLkNIQU5ORUw6XG5cdFx0XHRcdG1ldGhvZCA9ICdjcmVhdGVDaGFubmVsJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFJvb21UeXBlLlBSSVZBVEVfR1JPVVA6XG5cdFx0XHRcdG1ldGhvZCA9ICdjcmVhdGVQcml2YXRlR3JvdXAnO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignT25seSBjaGFubmVscyBhbmQgcHJpdmF0ZSBncm91cHMgY2FuIGJlIGNyZWF0ZWQuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IHJpZDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHJvb20uY3JlYXRvci5pZCwgKCkgPT4ge1xuXHRcdFx0Y29uc3QgaW5mbyA9IE1ldGVvci5jYWxsKG1ldGhvZCwgcmNSb29tLnVzZXJuYW1lcyk7XG5cdFx0XHRyaWQgPSBpbmZvLnJpZDtcblx0XHR9KTtcblxuXHRcdHJldHVybiByaWQ7XG5cdH1cblxuXHRhc3luYyBnZXRCeUlkKHJvb21JZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHJvb21CeUlkOiBcIiR7IHJvb21JZCB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlJZChyb29tSWQpO1xuXHR9XG5cblx0YXN5bmMgZ2V0QnlOYW1lKHJvb21OYW1lLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgcm9vbUJ5TmFtZTogXCIkeyByb29tTmFtZSB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlOYW1lKHJvb21OYW1lKTtcblx0fVxuXG5cdGFzeW5jIGdldENyZWF0b3JCeUlkKHJvb21JZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHJvb20ncyBjcmVhdG9yIGJ5IGlkOiBcIiR7IHJvb21JZCB9XCJgKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdFx0aWYgKCFyb29tIHx8ICFyb29tLnUgfHwgIXJvb20udS5faWQpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKHJvb20udS5faWQpO1xuXHR9XG5cblx0YXN5bmMgZ2V0Q3JlYXRvckJ5TmFtZShyb29tTmFtZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHJvb20ncyBjcmVhdG9yIGJ5IG5hbWU6IFwiJHsgcm9vbU5hbWUgfVwiYCk7XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShyb29tTmFtZSk7XG5cblx0XHRpZiAoIXJvb20gfHwgIXJvb20udSB8fCAhcm9vbS51Ll9pZCkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3VzZXJzJykuY29udmVydEJ5SWQocm9vbS51Ll9pZCk7XG5cdH1cblxuXHRhc3luYyB1cGRhdGUocm9vbSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHVwZGF0aW5nIGEgcm9vbS5gKTtcblxuXHRcdGlmICghcm9vbS5pZCB8fCBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tLmlkKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBIHJvb20gbXVzdCBleGlzdCB0byB1cGRhdGUuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm0gPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QXBwUm9vbShyb29tKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZShybS5faWQsIHJtKTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcFNldHRpbmdCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0XHR0aGlzLmFsbG93ZWRHcm91cHMgPSBbXTtcblx0XHR0aGlzLmRpc2FsbG93ZWRTZXR0aW5ncyA9IFtcblx0XHRcdCdBY2NvdW50c19SZWdpc3RyYXRpb25Gb3JtX1NlY3JldFVSTCcsICdDUk9XRF9BUFBfVVNFUk5BTUUnLCAnQ1JPV0RfQVBQX1BBU1NXT1JEJywgJ0RpcmVjdF9SZXBseV9Vc2VybmFtZScsXG5cdFx0XHQnRGlyZWN0X1JlcGx5X1Bhc3N3b3JkJywgJ1NNVFBfVXNlcm5hbWUnLCAnU01UUF9QYXNzd29yZCcsICdGaWxlVXBsb2FkX1MzX0FXU0FjY2Vzc0tleUlkJywgJ0ZpbGVVcGxvYWRfUzNfQVdTU2VjcmV0QWNjZXNzS2V5Jyxcblx0XHRcdCdGaWxlVXBsb2FkX1MzX0J1Y2tldFVSTCcsICdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQnVja2V0JywgJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9BY2Nlc3NJZCcsXG5cdFx0XHQnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX1NlY3JldCcsICdHb29nbGVWaXNpb25fU2VydmljZUFjY291bnQnLCAnQWxsb3dfSW52YWxpZF9TZWxmU2lnbmVkX0NlcnRzJywgJ0dvb2dsZVRhZ01hbmFnZXJfaWQnLFxuXHRcdFx0J0J1Z3NuYWdfYXBpX2tleScsICdMREFQX0NBX0NlcnQnLCAnTERBUF9SZWplY3RfVW5hdXRob3JpemVkJywgJ0xEQVBfRG9tYWluX1NlYXJjaF9Vc2VyJywgJ0xEQVBfRG9tYWluX1NlYXJjaF9QYXNzd29yZCcsXG5cdFx0XHQnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJywgJ0xpdmVjaGF0X0tub3dsZWRnZV9BcGlhaV9LZXknLCAnQXV0b1RyYW5zbGF0ZV9Hb29nbGVBUElLZXknLCAnTWFwVmlld19HTWFwc0FQSUtleScsXG5cdFx0XHQnTWV0YV9mYl9hcHBfaWQnLCAnTWV0YV9nb29nbGUtc2l0ZS12ZXJpZmljYXRpb24nLCAnTWV0YV9tc3ZhbGlkYXRlMDEnLCAnQWNjb3VudHNfT0F1dGhfRG9scGhpbl9zZWNyZXQnLFxuXHRcdFx0J0FjY291bnRzX09BdXRoX0RydXBhbF9zZWNyZXQnLCAnQWNjb3VudHNfT0F1dGhfRmFjZWJvb2tfc2VjcmV0JywgJ0FjY291bnRzX09BdXRoX0dpdGh1Yl9zZWNyZXQnLCAnQVBJX0dpdEh1Yl9FbnRlcnByaXNlX1VSTCcsXG5cdFx0XHQnQWNjb3VudHNfT0F1dGhfR2l0SHViX0VudGVycHJpc2Vfc2VjcmV0JywgJ0FQSV9HaXRsYWJfVVJMJywgJ0FjY291bnRzX09BdXRoX0dpdGxhYl9zZWNyZXQnLCAnQWNjb3VudHNfT0F1dGhfR29vZ2xlX3NlY3JldCcsXG5cdFx0XHQnQWNjb3VudHNfT0F1dGhfTGlua2VkaW5fc2VjcmV0JywgJ0FjY291bnRzX09BdXRoX01ldGVvcl9zZWNyZXQnLCAnQWNjb3VudHNfT0F1dGhfVHdpdHRlcl9zZWNyZXQnLCAnQVBJX1dvcmRwcmVzc19VUkwnLFxuXHRcdFx0J0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19zZWNyZXQnLCAnUHVzaF9hcG5fcGFzc3BocmFzZScsICdQdXNoX2Fwbl9rZXknLCAnUHVzaF9hcG5fY2VydCcsICdQdXNoX2Fwbl9kZXZfcGFzc3BocmFzZScsXG5cdFx0XHQnUHVzaF9hcG5fZGV2X2tleScsICdQdXNoX2Fwbl9kZXZfY2VydCcsICdQdXNoX2djbV9hcGlfa2V5JywgJ1B1c2hfZ2NtX3Byb2plY3RfbnVtYmVyJywgJ1NBTUxfQ3VzdG9tX0RlZmF1bHRfY2VydCcsXG5cdFx0XHQnU0FNTF9DdXN0b21fRGVmYXVsdF9wcml2YXRlX2tleScsICdTbGFja0JyaWRnZV9BUElUb2tlbicsICdTbWFyc2hfRW1haWwnLCAnU01TX1R3aWxpb19BY2NvdW50X1NJRCcsICdTTVNfVHdpbGlvX2F1dGhUb2tlbidcblx0XHRdO1xuXHR9XG5cblx0YXN5bmMgZ2V0QWxsKGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIGFsbCB0aGUgc2V0dGluZ3MuYCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZCh7IF9pZDogeyAkbmluOiB0aGlzLmRpc2FsbG93ZWRTZXR0aW5ncyB9IH0pLmZldGNoKCkubWFwKChzKSA9PiB7XG5cdFx0XHR0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnc2V0dGluZ3MnKS5jb252ZXJ0VG9BcHAocyk7XG5cdFx0fSk7XG5cdH1cblxuXHRhc3luYyBnZXRPbmVCeUlkKGlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgc2V0dGluZyBieSBpZCAkeyBpZCB9LmApO1xuXG5cdFx0aWYgKCF0aGlzLmlzUmVhZGFibGVCeUlkKGlkLCBhcHBJZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgVGhlIHNldHRpbmcgXCIkeyBpZCB9XCIgaXMgbm90IHJlYWRhYmxlLmApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnc2V0dGluZ3MnKS5jb252ZXJ0QnlJZChpZCk7XG5cdH1cblxuXHRhc3luYyBoaWRlR3JvdXAobmFtZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGhpZGRpbmcgdGhlIGdyb3VwICR7IG5hbWUgfS5gKTtcblxuXHRcdHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcblx0fVxuXG5cdGFzeW5jIGhpZGVTZXR0aW5nKGlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgaGlkZGluZyB0aGUgc2V0dGluZyAkeyBpZCB9LmApO1xuXG5cdFx0aWYgKCF0aGlzLmlzUmVhZGFibGVCeUlkKGlkLCBhcHBJZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgVGhlIHNldHRpbmcgXCIkeyBpZCB9XCIgaXMgbm90IHJlYWRhYmxlLmApO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcblx0fVxuXG5cdGFzeW5jIGlzUmVhZGFibGVCeUlkKGlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgY2hlY2tpbmcgaWYgdGhleSBjYW4gcmVhZCB0aGUgc2V0dGluZyAkeyBpZCB9LmApO1xuXG5cdFx0cmV0dXJuICF0aGlzLmRpc2FsbG93ZWRTZXR0aW5ncy5pbmNsdWRlcyhpZCk7XG5cdH1cblxuXHRhc3luYyB1cGRhdGVPbmUoc2V0dGluZywgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHVwZGF0aW5nIHRoZSBzZXR0aW5nICR7IHNldHRpbmcuaWQgfSAuYCk7XG5cblx0XHRpZiAoIXRoaXMuaXNSZWFkYWJsZUJ5SWQoc2V0dGluZy5pZCwgYXBwSWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFRoZSBzZXR0aW5nIFwiJHsgc2V0dGluZy5pZCB9XCIgaXMgbm90IHJlYWRhYmxlLmApO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcFVzZXJCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGFzeW5jIGdldEJ5SWQodXNlcklkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgdXNlcklkOiBcIiR7IHVzZXJJZCB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZCh1c2VySWQpO1xuXHR9XG5cblx0YXN5bmMgZ2V0QnlVc2VybmFtZSh1c2VybmFtZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHVzZXJuYW1lOiBcIiR7IHVzZXJuYW1lIH1cImApO1xuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeVVzZXJuYW1lKHVzZXJuYW1lKTtcblx0fVxufVxuIiwiaW1wb3J0IHsgUmVhbEFwcEJyaWRnZXMgfSBmcm9tICcuL2JyaWRnZXMnO1xuaW1wb3J0IHsgQXBwQWN0aXZhdGlvbkJyaWRnZSB9IGZyb20gJy4vYWN0aXZhdGlvbic7XG5pbXBvcnQgeyBBcHBDb21tYW5kc0JyaWRnZSB9IGZyb20gJy4vY29tbWFuZHMnO1xuaW1wb3J0IHsgQXBwRW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlIH0gZnJvbSAnLi9lbnZpcm9ubWVudGFsJztcbmltcG9ydCB7IEFwcEh0dHBCcmlkZ2UgfSBmcm9tICcuL2h0dHAnO1xuaW1wb3J0IHsgQXBwTGlzdGVuZXJCcmlkZ2UgfSBmcm9tICcuL2xpc3RlbmVycyc7XG5pbXBvcnQgeyBBcHBNZXNzYWdlQnJpZGdlIH0gZnJvbSAnLi9tZXNzYWdlcyc7XG5pbXBvcnQgeyBBcHBQZXJzaXN0ZW5jZUJyaWRnZSB9IGZyb20gJy4vcGVyc2lzdGVuY2UnO1xuaW1wb3J0IHsgQXBwUm9vbUJyaWRnZSB9IGZyb20gJy4vcm9vbXMnO1xuaW1wb3J0IHsgQXBwU2V0dGluZ0JyaWRnZSB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgQXBwVXNlckJyaWRnZSB9IGZyb20gJy4vdXNlcnMnO1xuXG5leHBvcnQge1xuXHRSZWFsQXBwQnJpZGdlcyxcblx0QXBwQWN0aXZhdGlvbkJyaWRnZSxcblx0QXBwQ29tbWFuZHNCcmlkZ2UsXG5cdEFwcEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSxcblx0QXBwSHR0cEJyaWRnZSxcblx0QXBwTGlzdGVuZXJCcmlkZ2UsXG5cdEFwcE1lc3NhZ2VCcmlkZ2UsXG5cdEFwcFBlcnNpc3RlbmNlQnJpZGdlLFxuXHRBcHBSb29tQnJpZGdlLFxuXHRBcHBTZXR0aW5nQnJpZGdlLFxuXHRBcHBVc2VyQnJpZGdlXG59O1xuIiwiZXhwb3J0IGNsYXNzIEFwcERldGFpbENoYW5nZXNCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdG9uQXBwU2V0dGluZ3NDaGFuZ2UoYXBwSWQsIHNldHRpbmcpIHtcblx0XHR0cnkge1xuXHRcdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuYXBwU2V0dGluZ3NDaGFuZ2UoYXBwSWQsIHNldHRpbmcpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignZmFpbGVkIHRvIG5vdGlmeSBhYm91dCB0aGUgc2V0dGluZyBjaGFuZ2UuJywgYXBwSWQpO1xuXHRcdH1cblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcEh0dHBCcmlkZ2Uge1xuXHRjYWxsKGluZm8pIHtcblx0XHRpZiAoIWluZm8ucmVxdWVzdC5jb250ZW50ICYmIHR5cGVvZiBpbmZvLnJlcXVlc3QuZGF0YSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGluZm8ucmVxdWVzdC5jb250ZW50ID0gSlNPTi5zdHJpbmdpZnkoaW5mby5yZXF1ZXN0LmRhdGEpO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGluZm8uYXBwSWQgfSBpcyByZXF1ZXN0aW5nIGZyb20gdGhlIG91dHRlciB3ZWJzOmAsIGluZm8pO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdEhUVFAuY2FsbChpbmZvLm1ldGhvZCwgaW5mby51cmwsIGluZm8ucmVxdWVzdCwgKGUsIHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gZSA/IHJlamVjdChlLnJlc3BvbnNlKSA6IHJlc29sdmUocmVzdWx0KTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwTGlzdGVuZXJCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGFzeW5jIG1lc3NhZ2VFdmVudChpbnRlLCBtZXNzYWdlKSB7XG5cdFx0Y29uc3QgbXNnID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ21lc3NhZ2VzJykuY29udmVydE1lc3NhZ2UobWVzc2FnZSk7XG5cdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5vcmNoLmdldE1hbmFnZXIoKS5nZXRMaXN0ZW5lck1hbmFnZXIoKS5leGVjdXRlTGlzdGVuZXIoaW50ZSwgbXNnKTtcblxuXHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSAnYm9vbGVhbicpIHtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnbWVzc2FnZXMnKS5jb252ZXJ0QXBwTWVzc2FnZShyZXN1bHQpO1xuXHRcdH1cblx0XHQvLyB0cnkge1xuXG5cdFx0Ly8gfSBjYXRjaCAoZSkge1xuXHRcdC8vIFx0Y29uc29sZS5sb2coYCR7IGUubmFtZSB9OiAkeyBlLm1lc3NhZ2UgfWApO1xuXHRcdC8vIFx0Y29uc29sZS5sb2coZS5zdGFjayk7XG5cdFx0Ly8gfVxuXHR9XG5cblx0YXN5bmMgcm9vbUV2ZW50KGludGUsIHJvb20pIHtcblx0XHRjb25zdCBybSA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRSb29tKHJvb20pO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZ2V0TGlzdGVuZXJNYW5hZ2VyKCkuZXhlY3V0ZUxpc3RlbmVyKGludGUsIHJtKTtcblxuXHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSAnYm9vbGVhbicpIHtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QXBwUm9vbShyZXN1bHQpO1xuXHRcdH1cblx0XHQvLyB0cnkge1xuXG5cdFx0Ly8gfSBjYXRjaCAoZSkge1xuXHRcdC8vIFx0Y29uc29sZS5sb2coYCR7IGUubmFtZSB9OiAkeyBlLm1lc3NhZ2UgfWApO1xuXHRcdC8vIFx0Y29uc29sZS5sb2coZS5zdGFjayk7XG5cdFx0Ly8gfVxuXHR9XG59XG4iLCJjb25zdCB3YWl0VG9Mb2FkID0gZnVuY3Rpb24ob3JjaCkge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRsZXQgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRpZiAob3JjaC5pc0VuYWJsZWQoKSAmJiBvcmNoLmlzTG9hZGVkKCkpIHtcblx0XHRcdFx0Y2xlYXJJbnRlcnZhbChpZCk7XG5cdFx0XHRcdGlkID0gLTE7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH1cblx0XHR9LCAxMDApO1xuXHR9KTtcbn07XG5cbmNvbnN0IHdhaXRUb1VubG9hZCA9IGZ1bmN0aW9uKG9yY2gpIHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0bGV0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKCFvcmNoLmlzRW5hYmxlZCgpICYmICFvcmNoLmlzTG9hZGVkKCkpIHtcblx0XHRcdFx0Y2xlYXJJbnRlcnZhbChpZCk7XG5cdFx0XHRcdGlkID0gLTE7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH1cblx0XHR9LCAxMDApO1xuXHR9KTtcbn07XG5cbmV4cG9ydCBjbGFzcyBBcHBNZXRob2RzIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMuX29yY2ggPSBvcmNoO1xuXG5cdFx0dGhpcy5fYWRkTWV0aG9kcygpO1xuXHR9XG5cblx0aXNFbmFibGVkKCkge1xuXHRcdHJldHVybiB0eXBlb2YgdGhpcy5fb3JjaCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fb3JjaC5pc0VuYWJsZWQoKTtcblx0fVxuXG5cdGlzTG9hZGVkKCkge1xuXHRcdHJldHVybiB0eXBlb2YgdGhpcy5fb3JjaCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fb3JjaC5pc0VuYWJsZWQoKSAmJiB0aGlzLl9vcmNoLmlzTG9hZGVkKCk7XG5cdH1cblxuXHRfYWRkTWV0aG9kcygpIHtcblx0XHRjb25zdCBpbnN0YW5jZSA9IHRoaXM7XG5cblx0XHRNZXRlb3IubWV0aG9kcyh7XG5cdFx0XHQnYXBwcy9pcy1lbmFibGVkJygpIHtcblx0XHRcdFx0cmV0dXJuIGluc3RhbmNlLmlzRW5hYmxlZCgpO1xuXHRcdFx0fSxcblxuXHRcdFx0J2FwcHMvaXMtbG9hZGVkJygpIHtcblx0XHRcdFx0cmV0dXJuIGluc3RhbmNlLmlzTG9hZGVkKCk7XG5cdFx0XHR9LFxuXG5cdFx0XHQnYXBwcy9nby1lbmFibGUnKCkge1xuXHRcdFx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdFx0XHRtZXRob2Q6ICdhcHBzL2dvLWVuYWJsZSdcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ21hbmFnZS1hcHBzJykpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdFx0XHRtZXRob2Q6ICdhcHBzL2dvLWVuYWJsZSdcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3Muc2V0KCdBcHBzX0ZyYW1ld29ya19lbmFibGVkJywgdHJ1ZSk7XG5cblx0XHRcdFx0UHJvbWlzZS5hd2FpdCh3YWl0VG9Mb2FkKGluc3RhbmNlLl9vcmNoKSk7XG5cdFx0XHR9LFxuXG5cdFx0XHQnYXBwcy9nby1kaXNhYmxlJygpIHtcblx0XHRcdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHRcdFx0bWV0aG9kOiAnYXBwcy9nby1lbmFibGUnXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdtYW5hZ2UtYXBwcycpKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRcdFx0bWV0aG9kOiAnYXBwcy9nby1lbmFibGUnXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnNldCgnQXBwc19GcmFtZXdvcmtfZW5hYmxlZCcsIGZhbHNlKTtcblxuXHRcdFx0XHRQcm9taXNlLmF3YWl0KHdhaXRUb1VubG9hZChpbnN0YW5jZS5fb3JjaCkpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwc1Jlc3RBcGkge1xuXHRjb25zdHJ1Y3RvcihvcmNoLCBtYW5hZ2VyKSB7XG5cdFx0dGhpcy5fb3JjaCA9IG9yY2g7XG5cdFx0dGhpcy5fbWFuYWdlciA9IG1hbmFnZXI7XG5cdFx0dGhpcy5hcGkgPSBuZXcgUm9ja2V0Q2hhdC5BUEkuQXBpQ2xhc3Moe1xuXHRcdFx0dmVyc2lvbjogJ2FwcHMnLFxuXHRcdFx0dXNlRGVmYXVsdEF1dGg6IHRydWUsXG5cdFx0XHRwcmV0dHlKc29uOiBmYWxzZSxcblx0XHRcdGVuYWJsZUNvcnM6IGZhbHNlLFxuXHRcdFx0YXV0aDogUm9ja2V0Q2hhdC5BUEkuZ2V0VXNlckF1dGgoKVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRNYW5hZ2VtZW50Um91dGVzKCk7XG5cdH1cblxuXHRfaGFuZGxlRmlsZShyZXF1ZXN0LCBmaWxlRmllbGQpIHtcblx0XHRjb25zdCBCdXNib3kgPSBOcG0ucmVxdWlyZSgnYnVzYm95Jyk7XG5cdFx0Y29uc3QgYnVzYm95ID0gbmV3IEJ1c2JveSh7IGhlYWRlcnM6IHJlcXVlc3QuaGVhZGVycyB9KTtcblxuXHRcdHJldHVybiBNZXRlb3Iud3JhcEFzeW5jKChjYWxsYmFjaykgPT4ge1xuXHRcdFx0YnVzYm95Lm9uKCdmaWxlJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZmllbGRuYW1lLCBmaWxlKSA9PiB7XG5cdFx0XHRcdGlmIChmaWVsZG5hbWUgIT09IGZpbGVGaWVsZCkge1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWZpZWxkJywgYEV4cGVjdGVkIHRoZSBmaWVsZCBcIiR7IGZpbGVGaWVsZCB9XCIgYnV0IGdvdCBcIiR7IGZpZWxkbmFtZSB9XCIgaW5zdGVhZC5gKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBmaWxlRGF0YSA9IFtdO1xuXHRcdFx0XHRmaWxlLm9uKCdkYXRhJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZGF0YSkgPT4ge1xuXHRcdFx0XHRcdGZpbGVEYXRhLnB1c2goZGF0YSk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHRmaWxlLm9uKCdlbmQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IGNhbGxiYWNrKHVuZGVmaW5lZCwgQnVmZmVyLmNvbmNhdChmaWxlRGF0YSkpKSk7XG5cdFx0XHR9KSk7XG5cblx0XHRcdHJlcXVlc3QucGlwZShidXNib3kpO1xuXHRcdH0pKCk7XG5cdH1cblxuXHRhZGRNYW5hZ2VtZW50Um91dGVzKCkge1xuXHRcdGNvbnN0IG9yY2hlc3RyYXRvciA9IHRoaXMuX29yY2g7XG5cdFx0Y29uc3QgbWFuYWdlciA9IHRoaXMuX21hbmFnZXI7XG5cdFx0Y29uc3QgZmlsZUhhbmRsZXIgPSB0aGlzLl9oYW5kbGVGaWxlO1xuXG5cdFx0dGhpcy5hcGkuYWRkUm91dGUoJycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc3QgYXBwcyA9IG1hbmFnZXIuZ2V0KCkubWFwKHBybCA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgaW5mbyA9IHBybC5nZXRJbmZvKCk7XG5cdFx0XHRcdFx0aW5mby5sYW5ndWFnZXMgPSBwcmwuZ2V0U3RvcmFnZUl0ZW0oKS5sYW5ndWFnZUNvbnRlbnQ7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSBwcmwuZ2V0U3RhdHVzKCk7XG5cblx0XHRcdFx0XHRyZXR1cm4gaW5mbztcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBhcHBzIH0pO1xuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGxldCBidWZmO1xuXG5cdFx0XHRcdGlmICh0aGlzLmJvZHlQYXJhbXMudXJsKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gSFRUUC5jYWxsKCdHRVQnLCB0aGlzLmJvZHlQYXJhbXMudXJsLCB7IG5wbVJlcXVlc3RPcHRpb25zOiB7IGVuY29kaW5nOiAnYmFzZTY0JyB9fSk7XG5cblx0XHRcdFx0XHRpZiAocmVzdWx0LnN0YXR1c0NvZGUgIT09IDIwMCB8fCAhcmVzdWx0LmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddIHx8IHJlc3VsdC5oZWFkZXJzWydjb250ZW50LXR5cGUnXSAhPT0gJ2FwcGxpY2F0aW9uL3ppcCcpIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKHsgZXJyb3I6ICdJbnZhbGlkIHVybC4gSXQgZG9lc25cXCd0IGV4aXN0IG9yIGlzIG5vdCBcImFwcGxpY2F0aW9uL3ppcFwiLicgfSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YnVmZiA9IEJ1ZmZlci5mcm9tKHJlc3VsdC5jb250ZW50LCAnYmFzZTY0Jyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YnVmZiA9IGZpbGVIYW5kbGVyKHRoaXMucmVxdWVzdCwgJ2FwcCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCFidWZmKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoeyBlcnJvcjogJ0ZhaWxlZCB0byBnZXQgYSBmaWxlIHRvIGluc3RhbGwgZm9yIHRoZSBBcHAuICd9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGFmZiA9IFByb21pc2UuYXdhaXQobWFuYWdlci5hZGQoYnVmZi50b1N0cmluZygnYmFzZTY0JyksIGZhbHNlKSk7XG5cdFx0XHRcdGNvbnN0IGluZm8gPSBhZmYuZ2V0QXBwSW5mbygpO1xuXG5cdFx0XHRcdC8vIElmIHRoZXJlIGFyZSBjb21waWxlciBlcnJvcnMsIHRoZXJlIHdvbid0IGJlIGFuIEFwcCB0byBnZXQgdGhlIHN0YXR1cyBvZlxuXHRcdFx0XHRpZiAoYWZmLmdldEFwcCgpKSB7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSBhZmYuZ2V0QXBwKCkuZ2V0U3RhdHVzKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSAnY29tcGlsZXJfZXJyb3InO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGFwcDogaW5mbyxcblx0XHRcdFx0XHRpbXBsZW1lbnRlZDogYWZmLmdldEltcGxlbWVudGVkSW5mZXJmYWNlcygpLFxuXHRcdFx0XHRcdGNvbXBpbGVyRXJyb3JzOiBhZmYuZ2V0Q29tcGlsZXJFcnJvcnMoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCdsYW5ndWFnZXMnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zdCBhcHBzID0gbWFuYWdlci5nZXQoKS5tYXAocHJsID0+IHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0aWQ6IHBybC5nZXRJRCgpLFxuXHRcdFx0XHRcdFx0bGFuZ3VhZ2VzOiBwcmwuZ2V0U3RvcmFnZUl0ZW0oKS5sYW5ndWFnZUNvbnRlbnRcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGFwcHMgfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnR2V0dGluZzonLCB0aGlzLnVybFBhcmFtcy5pZCk7XG5cdFx0XHRcdGNvbnN0IHBybCA9IG1hbmFnZXIuZ2V0T25lQnlJZCh0aGlzLnVybFBhcmFtcy5pZCk7XG5cblx0XHRcdFx0aWYgKHBybCkge1xuXHRcdFx0XHRcdGNvbnN0IGluZm8gPSBwcmwuZ2V0SW5mbygpO1xuXHRcdFx0XHRcdGluZm8uc3RhdHVzID0gcHJsLmdldFN0YXR1cygpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBhcHA6IGluZm8gfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRwb3N0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnVXBkYXRpbmc6JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHQvLyBUT0RPOiBWZXJpZnkgcGVybWlzc2lvbnNcblxuXHRcdFx0XHRsZXQgYnVmZjtcblxuXHRcdFx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLnVybCkge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnR0VUJywgdGhpcy5ib2R5UGFyYW1zLnVybCwgeyBucG1SZXF1ZXN0T3B0aW9uczogeyBlbmNvZGluZzogJ2Jhc2U2NCcgfX0pO1xuXG5cdFx0XHRcdFx0aWYgKHJlc3VsdC5zdGF0dXNDb2RlICE9PSAyMDAgfHwgIXJlc3VsdC5oZWFkZXJzWydjb250ZW50LXR5cGUnXSB8fCByZXN1bHQuaGVhZGVyc1snY29udGVudC10eXBlJ10gIT09ICdhcHBsaWNhdGlvbi96aXAnKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSh7IGVycm9yOiAnSW52YWxpZCB1cmwuIEl0IGRvZXNuXFwndCBleGlzdCBvciBpcyBub3QgXCJhcHBsaWNhdGlvbi96aXBcIi4nIH0pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJ1ZmYgPSBCdWZmZXIuZnJvbShyZXN1bHQuY29udGVudCwgJ2Jhc2U2NCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGJ1ZmYgPSBmaWxlSGFuZGxlcih0aGlzLnJlcXVlc3QsICdhcHAnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghYnVmZikge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKHsgZXJyb3I6ICdGYWlsZWQgdG8gZ2V0IGEgZmlsZSB0byBpbnN0YWxsIGZvciB0aGUgQXBwLiAnfSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBhZmYgPSBQcm9taXNlLmF3YWl0KG1hbmFnZXIudXBkYXRlKGJ1ZmYudG9TdHJpbmcoJ2Jhc2U2NCcpKSk7XG5cdFx0XHRcdGNvbnN0IGluZm8gPSBhZmYuZ2V0QXBwSW5mbygpO1xuXG5cdFx0XHRcdC8vIFNob3VsZCB0aGUgdXBkYXRlZCB2ZXJzaW9uIGhhdmUgY29tcGlsZXIgZXJyb3JzLCBubyBBcHAgd2lsbCBiZSByZXR1cm5lZFxuXHRcdFx0XHRpZiAoYWZmLmdldEFwcCgpKSB7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSBhZmYuZ2V0QXBwKCkuZ2V0U3RhdHVzKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSAnY29tcGlsZXJfZXJyb3InO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGFwcDogaW5mbyxcblx0XHRcdFx0XHRpbXBsZW1lbnRlZDogYWZmLmdldEltcGxlbWVudGVkSW5mZXJmYWNlcygpLFxuXHRcdFx0XHRcdGNvbXBpbGVyRXJyb3JzOiBhZmYuZ2V0Q29tcGlsZXJFcnJvcnMoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRkZWxldGUoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdVbmluc3RhbGxpbmc6JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRQcm9taXNlLmF3YWl0KG1hbmFnZXIucmVtb3ZlKHBybC5nZXRJRCgpKSk7XG5cblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblx0XHRcdFx0XHRpbmZvLnN0YXR1cyA9IHBybC5nZXRTdGF0dXMoKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgYXBwOiBpbmZvIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkL2ljb24nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdHZXR0aW5nIHRoZSBBcHBcXCdzIEljb246JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgaWNvbkZpbGVDb250ZW50OiBpbmZvLmljb25GaWxlQ29udGVudCB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcGkuYWRkUm91dGUoJzppZC9sYW5ndWFnZXMnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgR2V0dGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3MgbGFuZ3VhZ2VzLi5gKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0Y29uc3QgbGFuZ3VhZ2VzID0gcHJsLmdldFN0b3JhZ2VJdGVtKCkubGFuZ3VhZ2VDb250ZW50IHx8IHt9O1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBsYW5ndWFnZXMgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvbG9ncycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYEdldHRpbmcgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIGxvZ3MuLmApO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0XHRcdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRcdFx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IGFwcElkOiBwcmwuZ2V0SUQoKSB9KTtcblx0XHRcdFx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0XHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IF91cGRhdGVkQXQ6IC0xIH0sXG5cdFx0XHRcdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRcdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRcdFx0XHRmaWVsZHNcblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0Y29uc3QgbG9ncyA9IFByb21pc2UuYXdhaXQob3JjaGVzdHJhdG9yLmdldExvZ1N0b3JhZ2UoKS5maW5kKG91clF1ZXJ5LCBvcHRpb25zKSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGxvZ3MgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvc2V0dGluZ3MnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBHZXR0aW5nICR7IHRoaXMudXJsUGFyYW1zLmlkIH0ncyBzZXR0aW5ncy4uYCk7XG5cdFx0XHRcdGNvbnN0IHBybCA9IG1hbmFnZXIuZ2V0T25lQnlJZCh0aGlzLnVybFBhcmFtcy5pZCk7XG5cblx0XHRcdFx0aWYgKHBybCkge1xuXHRcdFx0XHRcdGNvbnN0IHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgcHJsLmdldFN0b3JhZ2VJdGVtKCkuc2V0dGluZ3MpO1xuXG5cdFx0XHRcdFx0T2JqZWN0LmtleXMoc2V0dGluZ3MpLmZvckVhY2goKGspID0+IHtcblx0XHRcdFx0XHRcdGlmIChzZXR0aW5nc1trXS5oaWRkZW4pIHtcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIHNldHRpbmdzW2tdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBzZXR0aW5ncyB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBVcGRhdGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3Mgc2V0dGluZ3MuLmApO1xuXHRcdFx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcyB8fCAhdGhpcy5ib2R5UGFyYW1zLnNldHRpbmdzKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBzZXR0aW5ncyB0byB1cGRhdGUgbXVzdCBiZSBwcmVzZW50LicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAoIXBybCkge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3Qgc2V0dGluZ3MgPSBwcmwuZ2V0U3RvcmFnZUl0ZW0oKS5zZXR0aW5ncztcblxuXHRcdFx0XHRjb25zdCB1cGRhdGVkID0gW107XG5cdFx0XHRcdHRoaXMuYm9keVBhcmFtcy5zZXR0aW5ncy5mb3JFYWNoKChzKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzW3MuaWRdKSB7XG5cdFx0XHRcdFx0XHRQcm9taXNlLmF3YWl0KG1hbmFnZXIuZ2V0U2V0dGluZ3NNYW5hZ2VyKCkudXBkYXRlQXBwU2V0dGluZyh0aGlzLnVybFBhcmFtcy5pZCwgcykpO1xuXHRcdFx0XHRcdFx0Ly8gVXBkYXRpbmc/XG5cdFx0XHRcdFx0XHR1cGRhdGVkLnB1c2gocyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVwZGF0ZWQgfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkL3NldHRpbmdzLzpzZXR0aW5nSWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBHZXR0aW5nIHRoZSBBcHAgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIHNldHRpbmcgJHsgdGhpcy51cmxQYXJhbXMuc2V0dGluZ0lkIH1gKTtcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGNvbnN0IHNldHRpbmcgPSBtYW5hZ2VyLmdldFNldHRpbmdzTWFuYWdlcigpLmdldEFwcFNldHRpbmcodGhpcy51cmxQYXJhbXMuaWQsIHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCk7XG5cblx0XHRcdFx0XHRSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgc2V0dGluZyB9KTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoJ05vIHNldHRpbmcgZm91bmQnKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBTZXR0aW5nIGZvdW5kIG9uIHRoZSBBcHAgYnkgdGhlIGlkIG9mOiBcIiR7IHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCB9XCJgKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKGUubWVzc2FnZS5pbmNsdWRlcygnTm8gQXBwIGZvdW5kJykpIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBVcGRhdGluZyB0aGUgQXBwICR7IHRoaXMudXJsUGFyYW1zLmlkIH0ncyBzZXR0aW5nICR7IHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCB9YCk7XG5cblx0XHRcdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMuc2V0dGluZykge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdTZXR0aW5nIHRvIHVwZGF0ZSB0byBtdXN0IGJlIHByZXNlbnQgb24gdGhlIHBvc3RlZCBib2R5LicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRQcm9taXNlLmF3YWl0KG1hbmFnZXIuZ2V0U2V0dGluZ3NNYW5hZ2VyKCkudXBkYXRlQXBwU2V0dGluZyh0aGlzLnVybFBhcmFtcy5pZCwgdGhpcy5ib2R5UGFyYW1zLnNldHRpbmcpKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKCdObyBzZXR0aW5nIGZvdW5kJykpIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gU2V0dGluZyBmb3VuZCBvbiB0aGUgQXBwIGJ5IHRoZSBpZCBvZjogXCIkeyB0aGlzLnVybFBhcmFtcy5zZXR0aW5nSWQgfVwiYCk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoJ05vIEFwcCBmb3VuZCcpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5tZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvc3RhdHVzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgR2V0dGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3Mgc3RhdHVzLi5gKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBzdGF0dXM6IHBybC5nZXRTdGF0dXMoKSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnN0YXR1cyB8fCB0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLnN0YXR1cyAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnSW52YWxpZCBzdGF0dXMgcHJvdmlkZWQsIGl0IG11c3QgYmUgXCJzdGF0dXNcIiBmaWVsZCBhbmQgYSBzdHJpbmcuJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zb2xlLmxvZyhgVXBkYXRpbmcgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIHN0YXR1cy4uLmAsIHRoaXMuYm9keVBhcmFtcy5zdGF0dXMpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBQcm9taXNlLmF3YWl0KG1hbmFnZXIuY2hhbmdlU3RhdHVzKHBybC5nZXRJRCgpLCB0aGlzLmJvZHlQYXJhbXMuc3RhdHVzKSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHN0YXR1czogcmVzdWx0LmdldFN0YXR1cygpIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcFN0YXR1cywgQXBwU3RhdHVzVXRpbHMgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy10cy1kZWZpbml0aW9uL0FwcFN0YXR1cyc7XG5cbmV4cG9ydCBjb25zdCBBcHBFdmVudHMgPSBPYmplY3QuZnJlZXplKHtcblx0QVBQX0FEREVEOiAnYXBwL2FkZGVkJyxcblx0QVBQX1JFTU9WRUQ6ICdhcHAvcmVtb3ZlZCcsXG5cdEFQUF9VUERBVEVEOiAnYXBwL3VwZGF0ZWQnLFxuXHRBUFBfU1RBVFVTX0NIQU5HRTogJ2FwcC9zdGF0dXNVcGRhdGUnLFxuXHRBUFBfU0VUVElOR19VUERBVEVEOiAnYXBwL3NldHRpbmdVcGRhdGVkJyxcblx0Q09NTUFORF9BRERFRDogJ2NvbW1hbmQvYWRkZWQnLFxuXHRDT01NQU5EX0RJU0FCTEVEOiAnY29tbWFuZC9kaXNhYmxlZCcsXG5cdENPTU1BTkRfVVBEQVRFRDogJ2NvbW1hbmQvdXBkYXRlZCcsXG5cdENPTU1BTkRfUkVNT1ZFRDogJ2NvbW1hbmQvcmVtb3ZlZCdcbn0pO1xuXG5leHBvcnQgY2xhc3MgQXBwU2VydmVyTGlzdGVuZXIge1xuXHRjb25zdHJ1Y3RvcihvcmNoLCBlbmdpbmVTdHJlYW1lciwgY2xpZW50U3RyZWFtZXIsIHJlY2VpdmVkKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyID0gZW5naW5lU3RyZWFtZXI7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lciA9IGNsaWVudFN0cmVhbWVyO1xuXHRcdHRoaXMucmVjZWl2ZWQgPSByZWNlaXZlZDtcblxuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkFQUF9BRERFRCwgdGhpcy5vbkFwcEFkZGVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFLCB0aGlzLm9uQXBwU3RhdHVzVXBkYXRlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVELCB0aGlzLm9uQXBwU2V0dGluZ1VwZGF0ZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQVBQX1JFTU9WRUQsIHRoaXMub25BcHBSZW1vdmVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkFQUF9VUERBVEVELCB0aGlzLm9uQXBwVXBkYXRlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5DT01NQU5EX0FEREVELCB0aGlzLm9uQ29tbWFuZEFkZGVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkNPTU1BTkRfRElTQUJMRUQsIHRoaXMub25Db21tYW5kRGlzYWJsZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQ09NTUFORF9VUERBVEVELCB0aGlzLm9uQ29tbWFuZFVwZGF0ZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQ09NTUFORF9SRU1PVkVELCB0aGlzLm9uQ29tbWFuZFJlbW92ZWQuYmluZCh0aGlzKSk7XG5cdH1cblxuXHRhc3luYyBvbkFwcEFkZGVkKGFwcElkKSB7XG5cdFx0YXdhaXQgdGhpcy5vcmNoLmdldE1hbmFnZXIoKS5sb2FkT25lKGFwcElkKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9BRERFRCwgYXBwSWQpO1xuXHR9XG5cblx0YXN5bmMgb25BcHBTdGF0dXNVcGRhdGVkKHsgYXBwSWQsIHN0YXR1cyB9KSB7XG5cdFx0dGhpcy5yZWNlaXZlZC5zZXQoYCR7IEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSB9XyR7IGFwcElkIH1gLCB7IGFwcElkLCBzdGF0dXMsIHdoZW46IG5ldyBEYXRlKCkgfSk7XG5cblx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHN0YXR1cykpIHtcblx0XHRcdGF3YWl0IHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZW5hYmxlKGFwcElkKTtcblx0XHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UsIHsgYXBwSWQsIHN0YXR1cyB9KTtcblx0XHR9IGVsc2UgaWYgKEFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5vcmNoLmdldE1hbmFnZXIoKS5kaXNhYmxlKGFwcElkLCBBcHBTdGF0dXMuTUFOVUFMTFlfRElTQUJMRUQgPT09IHN0YXR1cyk7XG5cdFx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFLCB7IGFwcElkLCBzdGF0dXMgfSk7XG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgb25BcHBTZXR0aW5nVXBkYXRlZCh7IGFwcElkLCBzZXR0aW5nIH0pIHtcblx0XHR0aGlzLnJlY2VpdmVkLnNldChgJHsgQXBwRXZlbnRzLkFQUF9TRVRUSU5HX1VQREFURUQgfV8keyBhcHBJZCB9XyR7IHNldHRpbmcuaWQgfWAsIHsgYXBwSWQsIHNldHRpbmcsIHdoZW46IG5ldyBEYXRlKCkgfSk7XG5cblx0XHRhd2FpdCB0aGlzLm9yY2guZ2V0TWFuYWdlcigpLmdldFNldHRpbmdzTWFuYWdlcigpLnVwZGF0ZUFwcFNldHRpbmcoYXBwSWQsIHNldHRpbmcpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCwgeyBhcHBJZCB9KTtcblx0fVxuXG5cdGFzeW5jIG9uQXBwVXBkYXRlZChhcHBJZCkge1xuXHRcdHRoaXMucmVjZWl2ZWQuc2V0KGAkeyBBcHBFdmVudHMuQVBQX1VQREFURUQgfV8keyBhcHBJZCB9YCwgeyBhcHBJZCwgd2hlbjogbmV3IERhdGUoKSB9KTtcblxuXHRcdGNvbnN0IHN0b3JhZ2VJdGVtID0gYXdhaXQgdGhpcy5vcmNoLmdldFN0b3JhZ2UoKS5yZXRyaWV2ZU9uZShhcHBJZCk7XG5cblx0XHRhd2FpdCB0aGlzLm9yY2guZ2V0TWFuYWdlcigpLnVwZGF0ZShzdG9yYWdlSXRlbS56aXApO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1VQREFURUQsIGFwcElkKTtcblx0fVxuXG5cdGFzeW5jIG9uQXBwUmVtb3ZlZChhcHBJZCkge1xuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkucmVtb3ZlKGFwcElkKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9SRU1PVkVELCBhcHBJZCk7XG5cdH1cblxuXHRhc3luYyBvbkNvbW1hbmRBZGRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX0FEREVELCBjb21tYW5kKTtcblx0fVxuXG5cdGFzeW5jIG9uQ29tbWFuZERpc2FibGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfRElTQUJMRUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0YXN5bmMgb25Db21tYW5kVXBkYXRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1VQREFURUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0YXN5bmMgb25Db21tYW5kUmVtb3ZlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1JFTU9WRUQsIGNvbW1hbmQpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBTZXJ2ZXJOb3RpZmllciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyID0gbmV3IE1ldGVvci5TdHJlYW1lcignYXBwcy1lbmdpbmUnLCB7IHJldHJhbnNtaXQ6IGZhbHNlIH0pO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuc2VydmVyT25seSA9IHRydWU7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5hbGxvd1JlYWQoJ25vbmUnKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmFsbG93RW1pdCgnYWxsJyk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5hbGxvd1dyaXRlKCdub25lJyk7XG5cblx0XHQvLyBUaGlzIGlzIHVzZWQgdG8gYnJvYWRjYXN0IHRvIHRoZSB3ZWIgY2xpZW50c1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIgPSBuZXcgTWV0ZW9yLlN0cmVhbWVyKCdhcHBzJywgeyByZXRyYW5zbWl0OiBmYWxzZSB9KTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLnNlcnZlck9ubHkgPSB0cnVlO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuYWxsb3dSZWFkKCdhbGwnKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmFsbG93RW1pdCgnYWxsJyk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5hbGxvd1dyaXRlKCdub25lJyk7XG5cblx0XHR0aGlzLnJlY2VpdmVkID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMubGlzdGVuZXIgPSBuZXcgQXBwU2VydmVyTGlzdGVuZXIob3JjaCwgdGhpcy5lbmdpbmVTdHJlYW1lciwgdGhpcy5jbGllbnRTdHJlYW1lciwgdGhpcy5yZWNlaXZlZCk7XG5cdH1cblxuXHRhc3luYyBhcHBBZGRlZChhcHBJZCkge1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX0FEREVELCBhcHBJZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfQURERUQsIGFwcElkKTtcblx0fVxuXG5cdGFzeW5jIGFwcFJlbW92ZWQoYXBwSWQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9SRU1PVkVELCBhcHBJZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfUkVNT1ZFRCwgYXBwSWQpO1xuXHR9XG5cblx0YXN5bmMgYXBwVXBkYXRlZChhcHBJZCkge1xuXHRcdGlmICh0aGlzLnJlY2VpdmVkLmhhcyhgJHsgQXBwRXZlbnRzLkFQUF9VUERBVEVEIH1fJHsgYXBwSWQgfWApKSB7XG5cdFx0XHR0aGlzLnJlY2VpdmVkLmRlbGV0ZShgJHsgQXBwRXZlbnRzLkFQUF9VUERBVEVEIH1fJHsgYXBwSWQgfWApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1VQREFURUQsIGFwcElkKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9VUERBVEVELCBhcHBJZCk7XG5cdH1cblxuXHRhc3luYyBhcHBTdGF0dXNVcGRhdGVkKGFwcElkLCBzdGF0dXMpIHtcblx0XHRpZiAodGhpcy5yZWNlaXZlZC5oYXMoYCR7IEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSB9XyR7IGFwcElkIH1gKSkge1xuXHRcdFx0Y29uc3QgZGV0YWlscyA9IHRoaXMucmVjZWl2ZWQuZ2V0KGAkeyBBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UgfV8keyBhcHBJZCB9YCk7XG5cdFx0XHRpZiAoZGV0YWlscy5zdGF0dXMgPT09IHN0YXR1cykge1xuXHRcdFx0XHR0aGlzLnJlY2VpdmVkLmRlbGV0ZShgJHsgQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFIH1fJHsgYXBwSWQgfWApO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSwgeyBhcHBJZCwgc3RhdHVzIH0pO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UsIHsgYXBwSWQsIHN0YXR1cyB9KTtcblx0fVxuXG5cdGFzeW5jIGFwcFNldHRpbmdzQ2hhbmdlKGFwcElkLCBzZXR0aW5nKSB7XG5cdFx0aWYgKHRoaXMucmVjZWl2ZWQuaGFzKGAkeyBBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCB9XyR7IGFwcElkIH1fJHsgc2V0dGluZy5pZCB9YCkpIHtcblx0XHRcdHRoaXMucmVjZWl2ZWQuZGVsZXRlKGAkeyBBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCB9XyR7IGFwcElkIH1fJHsgc2V0dGluZy5pZCB9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVELCB7IGFwcElkLCBzZXR0aW5nIH0pO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCwgeyBhcHBJZCB9KTtcblx0fVxuXG5cdGFzeW5jIGNvbW1hbmRBZGRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX0FEREVELCBjb21tYW5kKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfQURERUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0YXN5bmMgY29tbWFuZERpc2FibGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfRElTQUJMRUQsIGNvbW1hbmQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9ESVNBQkxFRCwgY29tbWFuZCk7XG5cdH1cblxuXHRhc3luYyBjb21tYW5kVXBkYXRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1VQREFURUQsIGNvbW1hbmQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9VUERBVEVELCBjb21tYW5kKTtcblx0fVxuXG5cdGFzeW5jIGNvbW1hbmRSZW1vdmVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfUkVNT1ZFRCwgY29tbWFuZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1JFTU9WRUQsIGNvbW1hbmQpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHBNZXRob2RzfSBmcm9tICcuL21ldGhvZHMnO1xuaW1wb3J0IHsgQXBwc1Jlc3RBcGkgfSBmcm9tICcuL3Jlc3QnO1xuaW1wb3J0IHsgQXBwRXZlbnRzLCBBcHBTZXJ2ZXJOb3RpZmllciwgQXBwU2VydmVyTGlzdGVuZXIgfSBmcm9tICcuL3dlYnNvY2tldHMnO1xuXG5leHBvcnQge1xuXHRBcHBNZXRob2RzLFxuXHRBcHBzUmVzdEFwaSxcblx0QXBwRXZlbnRzLFxuXHRBcHBTZXJ2ZXJOb3RpZmllcixcblx0QXBwU2VydmVyTGlzdGVuZXJcbn07XG4iLCJleHBvcnQgY2xhc3MgQXBwTWVzc2FnZXNDb252ZXJ0ZXIge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGNvbnZlcnRCeUlkKG1zZ0lkKSB7XG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZ2V0T25lQnlJZChtc2dJZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0TWVzc2FnZShtc2cpO1xuXHR9XG5cblx0Y29udmVydE1lc3NhZ2UobXNnT2JqKSB7XG5cdFx0aWYgKCFtc2dPYmopIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRCeUlkKG1zZ09iai5yaWQpO1xuXG5cdFx0bGV0IHNlbmRlcjtcblx0XHRpZiAobXNnT2JqLnUgJiYgbXNnT2JqLnUuX2lkKSB7XG5cdFx0XHRzZW5kZXIgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZChtc2dPYmoudS5faWQpO1xuXG5cdFx0XHRpZiAoIXNlbmRlcikge1xuXHRcdFx0XHRzZW5kZXIgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0VG9BcHAobXNnT2JqLnUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCBlZGl0b3I7XG5cdFx0aWYgKG1zZ09iai5lZGl0ZWRCeSkge1xuXHRcdFx0ZWRpdG9yID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3VzZXJzJykuY29udmVydEJ5SWQobXNnT2JqLmVkaXRlZEJ5Ll9pZCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXR0YWNobWVudHMgPSB0aGlzLl9jb252ZXJ0QXR0YWNobWVudHNUb0FwcChtc2dPYmouYXR0YWNobWVudHMpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiBtc2dPYmouX2lkLFxuXHRcdFx0cm9vbSxcblx0XHRcdHNlbmRlcixcblx0XHRcdHRleHQ6IG1zZ09iai5tc2csXG5cdFx0XHRjcmVhdGVkQXQ6IG1zZ09iai50cyxcblx0XHRcdHVwZGF0ZWRBdDogbXNnT2JqLl91cGRhdGVkQXQsXG5cdFx0XHRlZGl0b3IsXG5cdFx0XHRlZGl0ZWRBdDogbXNnT2JqLmVkaXRlZEF0LFxuXHRcdFx0ZW1vamk6IG1zZ09iai5lbW9qaSxcblx0XHRcdGF2YXRhclVybDogbXNnT2JqLmF2YXRhcixcblx0XHRcdGFsaWFzOiBtc2dPYmouYWxpYXMsXG5cdFx0XHRjdXN0b21GaWVsZHM6IG1zZ09iai5jdXN0b21GaWVsZHMsXG5cdFx0XHRhdHRhY2htZW50c1xuXHRcdH07XG5cdH1cblxuXHRjb252ZXJ0QXBwTWVzc2FnZShtZXNzYWdlKSB7XG5cdFx0aWYgKCFtZXNzYWdlKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChtZXNzYWdlLnJvb20uaWQpO1xuXG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcm9vbSBwcm92aWRlZCBvbiB0aGUgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRsZXQgdTtcblx0XHRpZiAobWVzc2FnZS5zZW5kZXIgJiYgbWVzc2FnZS5zZW5kZXIuaWQpIHtcblx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChtZXNzYWdlLnNlbmRlci5pZCk7XG5cblx0XHRcdGlmICh1c2VyKSB7XG5cdFx0XHRcdHUgPSB7XG5cdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZSxcblx0XHRcdFx0XHRuYW1lOiB1c2VyLm5hbWVcblx0XHRcdFx0fTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHUgPSB7XG5cdFx0XHRcdFx0X2lkOiBtZXNzYWdlLnNlbmRlci5pZCxcblx0XHRcdFx0XHR1c2VybmFtZTogbWVzc2FnZS5zZW5kZXIudXNlcm5hbWUsXG5cdFx0XHRcdFx0bmFtZTogbWVzc2FnZS5zZW5kZXIubmFtZVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCBlZGl0ZWRCeTtcblx0XHRpZiAobWVzc2FnZS5lZGl0b3IpIHtcblx0XHRcdGNvbnN0IGVkaXRvciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKG1lc3NhZ2UuZWRpdG9yLmlkKTtcblx0XHRcdGVkaXRlZEJ5ID0ge1xuXHRcdFx0XHRfaWQ6IGVkaXRvci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBlZGl0b3IudXNlcm5hbWVcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXR0YWNobWVudHMgPSB0aGlzLl9jb252ZXJ0QXBwQXR0YWNobWVudHMobWVzc2FnZS5hdHRhY2htZW50cyk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0X2lkOiBtZXNzYWdlLmlkIHx8IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiByb29tLl9pZCxcblx0XHRcdHUsXG5cdFx0XHRtc2c6IG1lc3NhZ2UudGV4dCxcblx0XHRcdHRzOiBtZXNzYWdlLmNyZWF0ZWRBdCB8fCBuZXcgRGF0ZSgpLFxuXHRcdFx0X3VwZGF0ZWRBdDogbWVzc2FnZS51cGRhdGVkQXQgfHwgbmV3IERhdGUoKSxcblx0XHRcdGVkaXRlZEJ5LFxuXHRcdFx0ZWRpdGVkQXQ6IG1lc3NhZ2UuZWRpdGVkQXQsXG5cdFx0XHRlbW9qaTogbWVzc2FnZS5lbW9qaSxcblx0XHRcdGF2YXRhcjogbWVzc2FnZS5hdmF0YXJVcmwsXG5cdFx0XHRhbGlhczogbWVzc2FnZS5hbGlhcyxcblx0XHRcdGN1c3RvbUZpZWxkczogbWVzc2FnZS5jdXN0b21GaWVsZHMsXG5cdFx0XHRhdHRhY2htZW50c1xuXHRcdH07XG5cdH1cblxuXHRfY29udmVydEFwcEF0dGFjaG1lbnRzKGF0dGFjaG1lbnRzKSB7XG5cdFx0aWYgKHR5cGVvZiBhdHRhY2htZW50cyA9PT0gJ3VuZGVmaW5lZCcgfHwgIUFycmF5LmlzQXJyYXkoYXR0YWNobWVudHMpKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdHJldHVybiBhdHRhY2htZW50cy5tYXAoKGF0dGFjaG1lbnQpID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbGxhcHNlZDogYXR0YWNobWVudC5jb2xsYXBzZWQsXG5cdFx0XHRcdGNvbG9yOiBhdHRhY2htZW50LmNvbG9yLFxuXHRcdFx0XHR0ZXh0OiBhdHRhY2htZW50LnRleHQsXG5cdFx0XHRcdHRzOiBhdHRhY2htZW50LnRpbWVzdGFtcCxcblx0XHRcdFx0bWVzc2FnZV9saW5rOiBhdHRhY2htZW50LnRpbWVzdGFtcExpbmssXG5cdFx0XHRcdHRodW1iX3VybDogYXR0YWNobWVudC50aHVtYm5haWxVcmwsXG5cdFx0XHRcdGF1dGhvcl9uYW1lOiBhdHRhY2htZW50LmF1dGhvciA/IGF0dGFjaG1lbnQuYXV0aG9yLm5hbWUgOiB1bmRlZmluZWQsXG5cdFx0XHRcdGF1dGhvcl9saW5rOiBhdHRhY2htZW50LmF1dGhvciA/IGF0dGFjaG1lbnQuYXV0aG9yLmxpbmsgOiB1bmRlZmluZWQsXG5cdFx0XHRcdGF1dGhvcl9pY29uOiBhdHRhY2htZW50LmF1dGhvciA/IGF0dGFjaG1lbnQuYXV0aG9yLmljb24gOiB1bmRlZmluZWQsXG5cdFx0XHRcdHRpdGxlOiBhdHRhY2htZW50LnRpdGxlID8gYXR0YWNobWVudC50aXRsZS52YWx1ZSA6IHVuZGVmaW5lZCxcblx0XHRcdFx0dGl0bGVfbGluazogYXR0YWNobWVudC50aXRsZSA/IGF0dGFjaG1lbnQudGl0bGUubGluayA6IHVuZGVmaW5lZCxcblx0XHRcdFx0dGl0bGVfbGlua19kb3dubG9hZDogYXR0YWNobWVudC50aXRsZSA/IGF0dGFjaG1lbnQudGl0bGUuZGlzcGxheURvd25sb2FkTGluayA6IHVuZGVmaW5lZCxcblx0XHRcdFx0aW1hZ2VfdXJsOiBhdHRhY2htZW50LmltYWdlVXJsLFxuXHRcdFx0XHRhdWRpb191cmw6IGF0dGFjaG1lbnQuYXVkaW9VcmwsXG5cdFx0XHRcdHZpZGVvX3VybDogYXR0YWNobWVudC52aWRlb1VybCxcblx0XHRcdFx0ZmllbGRzOiBhdHRhY2htZW50LmZpZWxkcyxcblx0XHRcdFx0dHlwZTogYXR0YWNobWVudC50eXBlLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogYXR0YWNobWVudC5kZXNjcmlwdGlvblxuXHRcdFx0fTtcblx0XHR9KS5tYXAoKGEpID0+IHtcblx0XHRcdE9iamVjdC5rZXlzKGEpLmZvckVhY2goKGspID0+IHtcblx0XHRcdFx0aWYgKHR5cGVvZiBhW2tdID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRcdGRlbGV0ZSBhW2tdO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGE7XG5cdFx0fSk7XG5cdH1cblxuXHRfY29udmVydEF0dGFjaG1lbnRzVG9BcHAoYXR0YWNobWVudHMpIHtcblx0XHRpZiAodHlwZW9mIGF0dGFjaG1lbnRzID09PSAndW5kZWZpbmVkJyB8fCAhQXJyYXkuaXNBcnJheShhdHRhY2htZW50cykpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF0dGFjaG1lbnRzLm1hcCgoYXR0YWNobWVudCkgPT4ge1xuXHRcdFx0bGV0IGF1dGhvcjtcblx0XHRcdGlmIChhdHRhY2htZW50LmF1dGhvcl9uYW1lIHx8IGF0dGFjaG1lbnQuYXV0aG9yX2xpbmsgfHwgYXR0YWNobWVudC5hdXRob3JfaWNvbikge1xuXHRcdFx0XHRhdXRob3IgPSB7XG5cdFx0XHRcdFx0bmFtZTogYXR0YWNobWVudC5hdXRob3JfbmFtZSxcblx0XHRcdFx0XHRsaW5rOiBhdHRhY2htZW50LmF1dGhvcl9saW5rLFxuXHRcdFx0XHRcdGljb246IGF0dGFjaG1lbnQuYXV0aG9yX2ljb25cblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IHRpdGxlO1xuXHRcdFx0aWYgKGF0dGFjaG1lbnQudGl0bGUgfHwgYXR0YWNobWVudC50aXRsZV9saW5rIHx8IGF0dGFjaG1lbnQudGl0bGVfbGlua19kb3dubG9hZCkge1xuXHRcdFx0XHR0aXRsZSA9IHtcblx0XHRcdFx0XHR2YWx1ZTogYXR0YWNobWVudC50aXRsZSxcblx0XHRcdFx0XHRsaW5rOiBhdHRhY2htZW50LnRpdGxlX2xpbmssXG5cdFx0XHRcdFx0ZGlzcGxheURvd25sb2FkTGluazogYXR0YWNobWVudC50aXRsZV9saW5rX2Rvd25sb2FkXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbGxhcHNlZDogYXR0YWNobWVudC5jb2xsYXBzZWQsXG5cdFx0XHRcdGNvbG9yOiBhdHRhY2htZW50LmNvbG9yLFxuXHRcdFx0XHR0ZXh0OiBhdHRhY2htZW50LnRleHQsXG5cdFx0XHRcdHRpbWVzdGFtcDogYXR0YWNobWVudC50cyxcblx0XHRcdFx0dGltZXN0YW1wTGluazogYXR0YWNobWVudC5tZXNzYWdlX2xpbmssXG5cdFx0XHRcdHRodW1ibmFpbFVybDogYXR0YWNobWVudC50aHVtYl91cmwsXG5cdFx0XHRcdGF1dGhvcixcblx0XHRcdFx0dGl0bGUsXG5cdFx0XHRcdGltYWdlVXJsOiBhdHRhY2htZW50LmltYWdlX3VybCxcblx0XHRcdFx0YXVkaW9Vcmw6IGF0dGFjaG1lbnQuYXVkaW9fdXJsLFxuXHRcdFx0XHR2aWRlb1VybDogYXR0YWNobWVudC52aWRlb191cmwsXG5cdFx0XHRcdGZpZWxkczogYXR0YWNobWVudC5maWVsZHMsXG5cdFx0XHRcdHR5cGU6IGF0dGFjaG1lbnQudHlwZSxcblx0XHRcdFx0ZGVzY3JpcHRpb246IGF0dGFjaG1lbnQuZGVzY3JpcHRpb25cblx0XHRcdH07XG5cdFx0fSk7XG5cdH1cbn1cbiIsImltcG9ydCB7IFJvb21UeXBlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi9yb29tcyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBSb29tc0NvbnZlcnRlciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0Y29udmVydEJ5SWQocm9vbUlkKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJvb21JZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0Um9vbShyb29tKTtcblx0fVxuXG5cdGNvbnZlcnRCeU5hbWUocm9vbU5hbWUpIHtcblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShyb29tTmFtZSk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0Um9vbShyb29tKTtcblx0fVxuXG5cdGNvbnZlcnRBcHBSb29tKHJvb20pIHtcblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0bGV0IHU7XG5cdFx0aWYgKHJvb20uY3JlYXRvcikge1xuXHRcdFx0Y29uc3QgY3JlYXRvciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHJvb20uY3JlYXRvci5pZCk7XG5cdFx0XHR1ID0ge1xuXHRcdFx0XHRfaWQ6IGNyZWF0b3IuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogY3JlYXRvci51c2VybmFtZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0X2lkOiByb29tLmlkLFxuXHRcdFx0Zm5hbWU6IHJvb20uZGlzcGxheU5hbWUsXG5cdFx0XHRuYW1lOiByb29tLnNsdWdpZmllZE5hbWUsXG5cdFx0XHR0OiByb29tLnR5cGUsXG5cdFx0XHR1LFxuXHRcdFx0dXNlcm5hbWVzOiByb29tLnVzZXJuYW1lcyxcblx0XHRcdGRlZmF1bHQ6IHR5cGVvZiByb29tLmlzRGVmYXVsdCA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IHJvb20uaXNEZWZhdWx0LFxuXHRcdFx0cm86IHR5cGVvZiByb29tLmlzUmVhZE9ubHkgPT09ICd1bmRlZmluZWQnID8gZmFsc2UgOiByb29tLmlzUmVhZE9ubHksXG5cdFx0XHRzeXNNZXM6IHR5cGVvZiByb29tLmRpc3BsYXlTeXN0ZW1NZXNzYWdlcyA9PT0gJ3VuZGVmaW5lZCcgPyB0cnVlIDogcm9vbS5kaXNwbGF5U3lzdGVtTWVzc2FnZXMsXG5cdFx0XHRtc2dzOiByb29tLm1lc3NhZ2VDb3VudCB8fCAwLFxuXHRcdFx0dHM6IHJvb20uY3JlYXRlZEF0LFxuXHRcdFx0X3VwZGF0ZWRBdDogcm9vbS51cGRhdGVkQXQsXG5cdFx0XHRsbTogcm9vbS5sYXN0TW9kaWZpZWRBdFxuXHRcdH07XG5cdH1cblxuXHRjb252ZXJ0Um9vbShyb29tKSB7XG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGxldCBjcmVhdG9yO1xuXHRcdGlmIChyb29tLnUpIHtcblx0XHRcdGNyZWF0b3IgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZChyb29tLnUuX2lkKTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0aWQ6IHJvb20uX2lkLFxuXHRcdFx0ZGlzcGxheU5hbWU6IHJvb20uZm5hbWUsXG5cdFx0XHRzbHVnaWZpZWROYW1lOiByb29tLm5hbWUsXG5cdFx0XHR0eXBlOiB0aGlzLl9jb252ZXJ0VHlwZVRvQXBwKHJvb20udCksXG5cdFx0XHRjcmVhdG9yLFxuXHRcdFx0dXNlcm5hbWVzOiByb29tLnVzZXJuYW1lcyxcblx0XHRcdGlzRGVmYXVsdDogdHlwZW9mIHJvb20uZGVmYXVsdCA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IHJvb20uZGVmYXVsdCxcblx0XHRcdGlzUmVhZE9ubHk6IHR5cGVvZiByb29tLnJvID09PSAndW5kZWZpbmVkJyA/IGZhbHNlIDogcm9vbS5ybyxcblx0XHRcdGRpc3BsYXlTeXN0ZW1NZXNzYWdlczogdHlwZW9mIHJvb20uc3lzTWVzID09PSAndW5kZWZpbmVkJyA/IHRydWUgOiByb29tLnN5c01lcyxcblx0XHRcdG1lc3NhZ2VDb3VudDogcm9vbS5tc2dzLFxuXHRcdFx0Y3JlYXRlZEF0OiByb29tLnRzLFxuXHRcdFx0dXBkYXRlZEF0OiByb29tLl91cGRhdGVkQXQsXG5cdFx0XHRsYXN0TW9kaWZpZWRBdDogcm9vbS5sbSxcblx0XHRcdGN1c3RvbUZpZWxkczoge31cblx0XHR9O1xuXHR9XG5cblx0X2NvbnZlcnRUeXBlVG9BcHAodHlwZUNoYXIpIHtcblx0XHRzd2l0Y2ggKHR5cGVDaGFyKSB7XG5cdFx0XHRjYXNlICdjJzpcblx0XHRcdFx0cmV0dXJuIFJvb21UeXBlLkNIQU5ORUw7XG5cdFx0XHRjYXNlICdwJzpcblx0XHRcdFx0cmV0dXJuIFJvb21UeXBlLlBSSVZBVEVfR1JPVVA7XG5cdFx0XHRjYXNlICdkJzpcblx0XHRcdFx0cmV0dXJuIFJvb21UeXBlLkRJUkVDVF9NRVNTQUdFO1xuXHRcdFx0Y2FzZSAnbGMnOlxuXHRcdFx0XHRyZXR1cm4gUm9vbVR5cGUuTElWRV9DSEFUO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmV0dXJuIHR5cGVDaGFyO1xuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgU2V0dGluZ1R5cGUgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy10cy1kZWZpbml0aW9uL3NldHRpbmdzJztcblxuZXhwb3J0IGNsYXNzIEFwcFNldHRpbmdzQ29udmVydGVyIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRjb252ZXJ0QnlJZChzZXR0aW5nSWQpIHtcblx0XHRjb25zdCBzZXR0aW5nID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZUJ5SWQoc2V0dGluZ0lkKTtcblxuXHRcdHJldHVybiB0aGlzLmNvbnZlcnRUb0FwcChzZXR0aW5nKTtcblx0fVxuXG5cdGNvbnZlcnRUb0FwcChzZXR0aW5nKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiBzZXR0aW5nLl9pZCxcblx0XHRcdHR5cGU6IHRoaXMuX2NvbnZlcnRUeXBlVG9BcHAoc2V0dGluZy50eXBlKSxcblx0XHRcdHBhY2thZ2VWYWx1ZTogc2V0dGluZy5wYWNrYWdlVmFsdWUsXG5cdFx0XHR2YWx1ZXM6IHNldHRpbmcudmFsdWVzLFxuXHRcdFx0dmFsdWU6IHNldHRpbmcudmFsdWUsXG5cdFx0XHRwdWJsaWM6IHNldHRpbmcucHVibGljLFxuXHRcdFx0aGlkZGVuOiBzZXR0aW5nLmhpZGRlbixcblx0XHRcdGdyb3VwOiBzZXR0aW5nLmdyb3VwLFxuXHRcdFx0aTE4bkxhYmVsOiBzZXR0aW5nLmkxOG5MYWJlbCxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogc2V0dGluZy5pMThuRGVzY3JpcHRpb24sXG5cdFx0XHRjcmVhdGVkQXQ6IHNldHRpbmcudHMsXG5cdFx0XHR1cGRhdGVkQXQ6IHNldHRpbmcuX3VwZGF0ZWRBdFxuXHRcdH07XG5cdH1cblxuXHRfY29udmVydFR5cGVUb0FwcCh0eXBlKSB7XG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlICdib29sZWFuJzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLkJPT0xFQU47XG5cdFx0XHRjYXNlICdjb2RlJzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLkNPREU7XG5cdFx0XHRjYXNlICdjb2xvcic6XG5cdFx0XHRcdHJldHVybiBTZXR0aW5nVHlwZS5DT0xPUjtcblx0XHRcdGNhc2UgJ2ZvbnQnOlxuXHRcdFx0XHRyZXR1cm4gU2V0dGluZ1R5cGUuRk9OVDtcblx0XHRcdGNhc2UgJ2ludCc6XG5cdFx0XHRcdHJldHVybiBTZXR0aW5nVHlwZS5OVU1CRVI7XG5cdFx0XHRjYXNlICdzZWxlY3QnOlxuXHRcdFx0XHRyZXR1cm4gU2V0dGluZ1R5cGUuU0VMRUNUO1xuXHRcdFx0Y2FzZSAnc3RyaW5nJzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLlNUUklORztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiB0eXBlO1xuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgVXNlclN0YXR1c0Nvbm5lY3Rpb24sIFVzZXJUeXBlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi91c2Vycyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBVc2Vyc0NvbnZlcnRlciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0Y29udmVydEJ5SWQodXNlcklkKSB7XG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0VG9BcHAodXNlcik7XG5cdH1cblxuXHRjb252ZXJ0QnlVc2VybmFtZSh1c2VybmFtZSkge1xuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0VG9BcHAodXNlcik7XG5cdH1cblxuXHRjb252ZXJ0VG9BcHAodXNlcikge1xuXHRcdGlmICghdXNlcikge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRjb25zdCB0eXBlID0gdGhpcy5fY29udmVydFVzZXJUeXBlVG9FbnVtKHVzZXIudHlwZSk7XG5cdFx0Y29uc3Qgc3RhdHVzQ29ubmVjdGlvbiA9IHRoaXMuX2NvbnZlcnRTdGF0dXNDb25uZWN0aW9uVG9FbnVtKHVzZXIudXNlcm5hbWUsIHVzZXIuX2lkLCB1c2VyLnN0YXR1c0Nvbm5lY3Rpb24pO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiB1c2VyLl9pZCxcblx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLFxuXHRcdFx0ZW1haWxzOiB1c2VyLmVtYWlscyxcblx0XHRcdHR5cGUsXG5cdFx0XHRpc0VuYWJsZWQ6IHVzZXIuYWN0aXZlLFxuXHRcdFx0bmFtZTogdXNlci5uYW1lLFxuXHRcdFx0cm9sZXM6IHVzZXIucm9sZXMsXG5cdFx0XHRzdGF0dXM6IHVzZXIuc3RhdHVzLFxuXHRcdFx0c3RhdHVzQ29ubmVjdGlvbixcblx0XHRcdHV0Y09mZnNldDogdXNlci51dGNPZmZzZXQsXG5cdFx0XHRjcmVhdGVkQXQ6IHVzZXIuY3JlYXRlZEF0LFxuXHRcdFx0dXBkYXRlZEF0OiB1c2VyLl91cGRhdGVkQXQsXG5cdFx0XHRsYXN0TG9naW5BdDogdXNlci5sYXN0TG9naW5cblx0XHR9O1xuXHR9XG5cblx0X2NvbnZlcnRVc2VyVHlwZVRvRW51bSh0eXBlKSB7XG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlICd1c2VyJzpcblx0XHRcdFx0cmV0dXJuIFVzZXJUeXBlLlVTRVI7XG5cdFx0XHRjYXNlICdib3QnOlxuXHRcdFx0XHRyZXR1cm4gVXNlclR5cGUuQk9UO1xuXHRcdFx0Y2FzZSAnJzpcblx0XHRcdGNhc2UgdW5kZWZpbmVkOlxuXHRcdFx0XHRyZXR1cm4gVXNlclR5cGUuVU5LTk9XTjtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGNvbnNvbGUud2FybihgQSBuZXcgdXNlciB0eXBlIGhhcyBiZWVuIGFkZGVkIHRoYXQgdGhlIEFwcHMgZG9uJ3Qga25vdyBhYm91dD8gXCIkeyB0eXBlIH1cImApO1xuXHRcdFx0XHRyZXR1cm4gdHlwZS50b1VwcGVyQ2FzZSgpO1xuXHRcdH1cblx0fVxuXG5cdF9jb252ZXJ0U3RhdHVzQ29ubmVjdGlvblRvRW51bSh1c2VybmFtZSwgdXNlcklkLCBzdGF0dXMpIHtcblx0XHRzd2l0Y2ggKHN0YXR1cykge1xuXHRcdFx0Y2FzZSAnb2ZmbGluZSc6XG5cdFx0XHRcdHJldHVybiBVc2VyU3RhdHVzQ29ubmVjdGlvbi5PRkZMSU5FO1xuXHRcdFx0Y2FzZSAnb25saW5lJzpcblx0XHRcdFx0cmV0dXJuIFVzZXJTdGF0dXNDb25uZWN0aW9uLk9OTElORTtcblx0XHRcdGNhc2UgJ2F3YXknOlxuXHRcdFx0XHRyZXR1cm4gVXNlclN0YXR1c0Nvbm5lY3Rpb24uQVdBWTtcblx0XHRcdGNhc2UgJ2J1c3knOlxuXHRcdFx0XHRyZXR1cm4gVXNlclN0YXR1c0Nvbm5lY3Rpb24uQlVTWTtcblx0XHRcdGNhc2UgdW5kZWZpbmVkOlxuXHRcdFx0XHQvLyBUaGlzIGlzIG5lZWRlZCBmb3IgTGl2ZWNoYXQgZ3Vlc3RzIGFuZCBSb2NrZXQuQ2F0IHVzZXIuXG5cdFx0XHRcdHJldHVybiBVc2VyU3RhdHVzQ29ubmVjdGlvbi5VTkRFRklORUQ7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRjb25zb2xlLndhcm4oYFRoZSB1c2VyICR7IHVzZXJuYW1lIH0gKCR7IHVzZXJJZCB9KSBkb2VzIG5vdCBoYXZlIGEgdmFsaWQgc3RhdHVzIChvZmZsaW5lLCBvbmxpbmUsIGF3YXksIG9yIGJ1c3kpLiBJdCBpcyBjdXJyZW50bHk6IFwiJHsgc3RhdHVzIH1cImApO1xuXHRcdFx0XHRyZXR1cm4gIXN0YXR1cyA/IFVzZXJTdGF0dXNDb25uZWN0aW9uLk9GRkxJTkUgOiBzdGF0dXMudG9VcHBlckNhc2UoKTtcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcE1lc3NhZ2VzQ29udmVydGVyIH0gZnJvbSAnLi9tZXNzYWdlcyc7XG5pbXBvcnQgeyBBcHBSb29tc0NvbnZlcnRlciB9IGZyb20gJy4vcm9vbXMnO1xuaW1wb3J0IHsgQXBwU2V0dGluZ3NDb252ZXJ0ZXIgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IEFwcFVzZXJzQ29udmVydGVyIH0gZnJvbSAnLi91c2Vycyc7XG5cbmV4cG9ydCB7XG5cdEFwcE1lc3NhZ2VzQ29udmVydGVyLFxuXHRBcHBSb29tc0NvbnZlcnRlcixcblx0QXBwU2V0dGluZ3NDb252ZXJ0ZXIsXG5cdEFwcFVzZXJzQ29udmVydGVyXG59O1xuIiwiaW1wb3J0IHsgUmVhbEFwcEJyaWRnZXMgfSBmcm9tICcuL2JyaWRnZXMnO1xuaW1wb3J0IHsgQXBwTWV0aG9kcywgQXBwc1Jlc3RBcGksIEFwcFNlcnZlck5vdGlmaWVyIH0gZnJvbSAnLi9jb21tdW5pY2F0aW9uJztcbmltcG9ydCB7IEFwcE1lc3NhZ2VzQ29udmVydGVyLCBBcHBSb29tc0NvbnZlcnRlciwgQXBwU2V0dGluZ3NDb252ZXJ0ZXIsIEFwcFVzZXJzQ29udmVydGVyIH0gZnJvbSAnLi9jb252ZXJ0ZXJzJztcbmltcG9ydCB7IEFwcHNMb2dzTW9kZWwsIEFwcHNNb2RlbCwgQXBwc1BlcnNpc3RlbmNlTW9kZWwsIEFwcFJlYWxTdG9yYWdlLCBBcHBSZWFsTG9nc1N0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5pbXBvcnQgeyBBcHBNYW5hZ2VyIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9BcHBNYW5hZ2VyJztcblxuY2xhc3MgQXBwU2VydmVyT3JjaGVzdHJhdG9yIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0aWYgKFJvY2tldENoYXQubW9kZWxzICYmIFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgnbWFuYWdlLWFwcHMnLCBbJ2FkbWluJ10pO1xuXHRcdH1cblxuXHRcdHRoaXMuX21vZGVsID0gbmV3IEFwcHNNb2RlbCgpO1xuXHRcdHRoaXMuX2xvZ01vZGVsID0gbmV3IEFwcHNMb2dzTW9kZWwoKTtcblx0XHR0aGlzLl9wZXJzaXN0TW9kZWwgPSBuZXcgQXBwc1BlcnNpc3RlbmNlTW9kZWwoKTtcblx0XHR0aGlzLl9zdG9yYWdlID0gbmV3IEFwcFJlYWxTdG9yYWdlKHRoaXMuX21vZGVsKTtcblx0XHR0aGlzLl9sb2dTdG9yYWdlID0gbmV3IEFwcFJlYWxMb2dzU3RvcmFnZSh0aGlzLl9sb2dNb2RlbCk7XG5cblx0XHR0aGlzLl9jb252ZXJ0ZXJzID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMuX2NvbnZlcnRlcnMuc2V0KCdtZXNzYWdlcycsIG5ldyBBcHBNZXNzYWdlc0NvbnZlcnRlcih0aGlzKSk7XG5cdFx0dGhpcy5fY29udmVydGVycy5zZXQoJ3Jvb21zJywgbmV3IEFwcFJvb21zQ29udmVydGVyKHRoaXMpKTtcblx0XHR0aGlzLl9jb252ZXJ0ZXJzLnNldCgnc2V0dGluZ3MnLCBuZXcgQXBwU2V0dGluZ3NDb252ZXJ0ZXIodGhpcykpO1xuXHRcdHRoaXMuX2NvbnZlcnRlcnMuc2V0KCd1c2VycycsIG5ldyBBcHBVc2Vyc0NvbnZlcnRlcih0aGlzKSk7XG5cblx0XHR0aGlzLl9icmlkZ2VzID0gbmV3IFJlYWxBcHBCcmlkZ2VzKHRoaXMpO1xuXG5cdFx0dGhpcy5fbWFuYWdlciA9IG5ldyBBcHBNYW5hZ2VyKHRoaXMuX3N0b3JhZ2UsIHRoaXMuX2xvZ1N0b3JhZ2UsIHRoaXMuX2JyaWRnZXMpO1xuXG5cdFx0dGhpcy5fY29tbXVuaWNhdG9ycyA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLl9jb21tdW5pY2F0b3JzLnNldCgnbWV0aG9kcycsIG5ldyBBcHBNZXRob2RzKHRoaXMpKTtcblx0XHR0aGlzLl9jb21tdW5pY2F0b3JzLnNldCgnbm90aWZpZXInLCBuZXcgQXBwU2VydmVyTm90aWZpZXIodGhpcykpO1xuXHRcdHRoaXMuX2NvbW11bmljYXRvcnMuc2V0KCdyZXN0YXBpJywgbmV3IEFwcHNSZXN0QXBpKHRoaXMsIHRoaXMuX21hbmFnZXIpKTtcblx0fVxuXG5cdGdldE1vZGVsKCkge1xuXHRcdHJldHVybiB0aGlzLl9tb2RlbDtcblx0fVxuXG5cdGdldFBlcnNpc3RlbmNlTW9kZWwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3BlcnNpc3RNb2RlbDtcblx0fVxuXG5cdGdldFN0b3JhZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3N0b3JhZ2U7XG5cdH1cblxuXHRnZXRMb2dTdG9yYWdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9sb2dTdG9yYWdlO1xuXHR9XG5cblx0Z2V0Q29udmVydGVycygpIHtcblx0XHRyZXR1cm4gdGhpcy5fY29udmVydGVycztcblx0fVxuXG5cdGdldEJyaWRnZXMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2JyaWRnZXM7XG5cdH1cblxuXHRnZXROb3RpZmllcigpIHtcblx0XHRyZXR1cm4gdGhpcy5fY29tbXVuaWNhdG9ycy5nZXQoJ25vdGlmaWVyJyk7XG5cdH1cblxuXHRnZXRNYW5hZ2VyKCkge1xuXHRcdHJldHVybiB0aGlzLl9tYW5hZ2VyO1xuXHR9XG5cblx0aXNFbmFibGVkKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQXBwc19GcmFtZXdvcmtfZW5hYmxlZCcpO1xuXHR9XG5cblx0aXNMb2FkZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TWFuYWdlcigpLmFyZUFwcHNMb2FkZWQoKTtcblx0fVxuXG5cdGxvYWQoKSB7XG5cdFx0Ly8gRG9uJ3QgdHJ5IHRvIGxvYWQgaXQgYWdhaW4gaWYgaXQgaGFzXG5cdFx0Ly8gYWxyZWFkeSBiZWVuIGxvYWRlZFxuXHRcdGlmICh0aGlzLmlzTG9hZGVkKCkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9tYW5hZ2VyLmxvYWQoKVxuXHRcdFx0LnRoZW4oKGFmZnMpID0+IGNvbnNvbGUubG9nKGBMb2FkZWQgdGhlIEFwcHMgRnJhbWV3b3JrIGFuZCBsb2FkZWQgYSB0b3RhbCBvZiAkeyBhZmZzLmxlbmd0aCB9IEFwcHMhYCkpXG5cdFx0XHQuY2F0Y2goKGVycikgPT4gY29uc29sZS53YXJuKCdGYWlsZWQgdG8gbG9hZCB0aGUgQXBwcyBGcmFtZXdvcmsgYW5kIEFwcHMhJywgZXJyKSk7XG5cdH1cblxuXHR1bmxvYWQoKSB7XG5cdFx0Ly8gRG9uJ3QgdHJ5IHRvIHVubG9hZCBpdCBpZiBpdCdzIGFscmVhZHkgYmVlblxuXHRcdC8vIHVubGFvZGVkIG9yIHdhc24ndCB1bmxvYWRlZCB0byBzdGFydCB3aXRoXG5cdFx0aWYgKCF0aGlzLmlzTG9hZGVkKCkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9tYW5hZ2VyLnVubG9hZCgpXG5cdFx0XHQudGhlbigoKSA9PiBjb25zb2xlLmxvZygnVW5sb2FkZWQgdGhlIEFwcHMgRnJhbWV3b3JrLicpKVxuXHRcdFx0LmNhdGNoKChlcnIpID0+IGNvbnNvbGUud2FybignRmFpbGVkIHRvIHVubG9hZCB0aGUgQXBwcyBGcmFtZXdvcmshJywgZXJyKSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0FwcHNfRnJhbWV3b3JrX2VuYWJsZWQnLCBmYWxzZSwge1xuXHR0eXBlOiAnYm9vbGVhbicsXG5cdGhpZGRlbjogdHJ1ZVxufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBcHBzX0ZyYW1ld29ya19lbmFibGVkJywgKGtleSwgaXNFbmFibGVkKSA9PiB7XG5cdC8vIEluIGNhc2UgdGhpcyBnZXRzIGNhbGxlZCBiZWZvcmUgYE1ldGVvci5zdGFydHVwYFxuXHRpZiAoIWdsb2JhbC5BcHBzKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKGlzRW5hYmxlZCkge1xuXHRcdGdsb2JhbC5BcHBzLmxvYWQoKTtcblx0fSBlbHNlIHtcblx0XHRnbG9iYWwuQXBwcy51bmxvYWQoKTtcblx0fVxufSk7XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uIF9hcHBTZXJ2ZXJPcmNoZXN0cmF0b3IoKSB7XG5cdGdsb2JhbC5BcHBzID0gbmV3IEFwcFNlcnZlck9yY2hlc3RyYXRvcigpO1xuXG5cdGlmIChnbG9iYWwuQXBwcy5pc0VuYWJsZWQoKSkge1xuXHRcdGdsb2JhbC5BcHBzLmxvYWQoKTtcblx0fVxufSk7XG4iXX0=
