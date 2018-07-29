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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:statistics":{"lib":{"rocketchat.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/lib/rocketchat.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.statistics = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"models":{"Statistics.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/models/Statistics.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.Statistics = new class extends RocketChat.models._Base {
  constructor() {
    super('statistics');
    this.tryEnsureIndex({
      'createdAt': 1
    });
  } // FIND ONE


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  findLast() {
    const options = {
      sort: {
        createdAt: -1
      },
      limit: 1
    };
    const records = this.find({}, options).fetch();
    return records && records[0];
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"get.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/functions/get.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let os;
module.watch(require("os"), {
  default(v) {
    os = v;
  }

}, 1);
const wizardFields = ['Organization_Type', 'Organization_Name', 'Industry', 'Size', 'Country', 'Website', 'Site_Name', 'Language', 'Server_Type'];

RocketChat.statistics.get = function _getStatistics() {
  const statistics = {}; // Setup Wizard

  statistics.wizard = {};
  wizardFields.forEach(field => {
    const record = RocketChat.models.Settings.findOne(field);

    if (record) {
      const wizardField = field.replace(/_/g, '').replace(field[0], field[0].toLowerCase());
      statistics.wizard[wizardField] = record.value;
    }
  }); // Version

  statistics.uniqueId = RocketChat.settings.get('uniqueID');

  if (RocketChat.models.Settings.findOne('uniqueID')) {
    statistics.installedAt = RocketChat.models.Settings.findOne('uniqueID').createdAt;
  }

  if (RocketChat.Info) {
    statistics.version = RocketChat.Info.version;
    statistics.tag = RocketChat.Info.tag;
    statistics.branch = RocketChat.Info.branch;
  } // User statistics


  statistics.totalUsers = Meteor.users.find().count();
  statistics.activeUsers = Meteor.users.find({
    active: true
  }).count();
  statistics.nonActiveUsers = statistics.totalUsers - statistics.activeUsers;
  statistics.onlineUsers = Meteor.users.find({
    statusConnection: 'online'
  }).count();
  statistics.awayUsers = Meteor.users.find({
    statusConnection: 'away'
  }).count();
  statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers - statistics.awayUsers; // Room statistics

  statistics.totalRooms = RocketChat.models.Rooms.find().count();
  statistics.totalChannels = RocketChat.models.Rooms.findByType('c').count();
  statistics.totalPrivateGroups = RocketChat.models.Rooms.findByType('p').count();
  statistics.totalDirect = RocketChat.models.Rooms.findByType('d').count();
  statistics.totalLivechat = RocketChat.models.Rooms.findByType('l').count(); // Message statistics

  statistics.totalMessages = RocketChat.models.Messages.find().count();
  statistics.totalChannelMessages = _.reduce(RocketChat.models.Rooms.findByType('c', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countChannelMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.totalPrivateGroupMessages = _.reduce(RocketChat.models.Rooms.findByType('p', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countPrivateGroupMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.totalDirectMessages = _.reduce(RocketChat.models.Rooms.findByType('d', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countDirectMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.totalLivechatMessages = _.reduce(RocketChat.models.Rooms.findByType('l', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countLivechatMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.lastLogin = RocketChat.models.Users.getLastLogin();
  statistics.lastMessageSentAt = RocketChat.models.Messages.getLastTimestamp();
  statistics.lastSeenSubscription = RocketChat.models.Subscriptions.getLastSeen();
  statistics.os = {
    type: os.type(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    cpus: os.cpus()
  };
  statistics.process = {
    nodeVersion: process.version,
    pid: process.pid,
    uptime: process.uptime()
  };
  statistics.deploy = {
    method: process.env.DEPLOY_METHOD || 'tar',
    platform: process.env.DEPLOY_PLATFORM || 'selfinstall'
  };
  statistics.migration = RocketChat.Migrations._getControl();
  statistics.instanceCount = InstanceStatus.getCollection().find({
    _updatedAt: {
      $gt: new Date(Date.now() - process.uptime() * 1000 - 2000)
    }
  }).count();

  if (MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle && MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry && RocketChat.settings.get('Force_Disable_OpLog_For_Cache') !== true) {
    statistics.oplogEnabled = true;
  }

  return statistics;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"save.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/functions/save.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.statistics.save = function () {
  const statistics = RocketChat.statistics.get();
  statistics.createdAt = new Date();
  RocketChat.models.Statistics.insert(statistics);
  return statistics;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"getStatistics.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/methods/getStatistics.js                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  getStatistics(refresh) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getStatistics'
      });
    }

    if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-statistics') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'getStatistics'
      });
    }

    if (refresh) {
      return RocketChat.statistics.save();
    } else {
      return RocketChat.models.Statistics.findLast();
    }
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:statistics/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:statistics/server/models/Statistics.js");
require("/node_modules/meteor/rocketchat:statistics/server/functions/get.js");
require("/node_modules/meteor/rocketchat:statistics/server/functions/save.js");
require("/node_modules/meteor/rocketchat:statistics/server/methods/getStatistics.js");

/* Exports */
Package._define("rocketchat:statistics");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_statistics.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzdGF0aXN0aWNzL2xpYi9yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnN0YXRpc3RpY3Mvc2VydmVyL21vZGVscy9TdGF0aXN0aWNzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnN0YXRpc3RpY3Mvc2VydmVyL2Z1bmN0aW9ucy9nZXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c3RhdGlzdGljcy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c3RhdGlzdGljcy9zZXJ2ZXIvbWV0aG9kcy9nZXRTdGF0aXN0aWNzLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJzdGF0aXN0aWNzIiwibW9kZWxzIiwiU3RhdGlzdGljcyIsIl9CYXNlIiwiY29uc3RydWN0b3IiLCJ0cnlFbnN1cmVJbmRleCIsImZpbmRPbmVCeUlkIiwiX2lkIiwib3B0aW9ucyIsInF1ZXJ5IiwiZmluZE9uZSIsImZpbmRMYXN0Iiwic29ydCIsImNyZWF0ZWRBdCIsImxpbWl0IiwicmVjb3JkcyIsImZpbmQiLCJmZXRjaCIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIm9zIiwid2l6YXJkRmllbGRzIiwiZ2V0IiwiX2dldFN0YXRpc3RpY3MiLCJ3aXphcmQiLCJmb3JFYWNoIiwiZmllbGQiLCJyZWNvcmQiLCJTZXR0aW5ncyIsIndpemFyZEZpZWxkIiwicmVwbGFjZSIsInRvTG93ZXJDYXNlIiwidmFsdWUiLCJ1bmlxdWVJZCIsInNldHRpbmdzIiwiaW5zdGFsbGVkQXQiLCJJbmZvIiwidmVyc2lvbiIsInRhZyIsImJyYW5jaCIsInRvdGFsVXNlcnMiLCJNZXRlb3IiLCJ1c2VycyIsImNvdW50IiwiYWN0aXZlVXNlcnMiLCJhY3RpdmUiLCJub25BY3RpdmVVc2VycyIsIm9ubGluZVVzZXJzIiwic3RhdHVzQ29ubmVjdGlvbiIsImF3YXlVc2VycyIsIm9mZmxpbmVVc2VycyIsInRvdGFsUm9vbXMiLCJSb29tcyIsInRvdGFsQ2hhbm5lbHMiLCJmaW5kQnlUeXBlIiwidG90YWxQcml2YXRlR3JvdXBzIiwidG90YWxEaXJlY3QiLCJ0b3RhbExpdmVjaGF0IiwidG90YWxNZXNzYWdlcyIsIk1lc3NhZ2VzIiwidG90YWxDaGFubmVsTWVzc2FnZXMiLCJyZWR1Y2UiLCJmaWVsZHMiLCJfY291bnRDaGFubmVsTWVzc2FnZXMiLCJudW0iLCJyb29tIiwibXNncyIsInRvdGFsUHJpdmF0ZUdyb3VwTWVzc2FnZXMiLCJfY291bnRQcml2YXRlR3JvdXBNZXNzYWdlcyIsInRvdGFsRGlyZWN0TWVzc2FnZXMiLCJfY291bnREaXJlY3RNZXNzYWdlcyIsInRvdGFsTGl2ZWNoYXRNZXNzYWdlcyIsIl9jb3VudExpdmVjaGF0TWVzc2FnZXMiLCJsYXN0TG9naW4iLCJVc2VycyIsImdldExhc3RMb2dpbiIsImxhc3RNZXNzYWdlU2VudEF0IiwiZ2V0TGFzdFRpbWVzdGFtcCIsImxhc3RTZWVuU3Vic2NyaXB0aW9uIiwiU3Vic2NyaXB0aW9ucyIsImdldExhc3RTZWVuIiwidHlwZSIsInBsYXRmb3JtIiwiYXJjaCIsInJlbGVhc2UiLCJ1cHRpbWUiLCJsb2FkYXZnIiwidG90YWxtZW0iLCJmcmVlbWVtIiwiY3B1cyIsInByb2Nlc3MiLCJub2RlVmVyc2lvbiIsInBpZCIsImRlcGxveSIsIm1ldGhvZCIsImVudiIsIkRFUExPWV9NRVRIT0QiLCJERVBMT1lfUExBVEZPUk0iLCJtaWdyYXRpb24iLCJNaWdyYXRpb25zIiwiX2dldENvbnRyb2wiLCJpbnN0YW5jZUNvdW50IiwiSW5zdGFuY2VTdGF0dXMiLCJnZXRDb2xsZWN0aW9uIiwiX3VwZGF0ZWRBdCIsIiRndCIsIkRhdGUiLCJub3ciLCJNb25nb0ludGVybmFscyIsImRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyIiwibW9uZ28iLCJfb3Bsb2dIYW5kbGUiLCJvbk9wbG9nRW50cnkiLCJvcGxvZ0VuYWJsZWQiLCJzYXZlIiwiaW5zZXJ0IiwibWV0aG9kcyIsImdldFN0YXRpc3RpY3MiLCJyZWZyZXNoIiwidXNlcklkIiwiRXJyb3IiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxXQUFXQyxVQUFYLEdBQXdCLEVBQXhCLEM7Ozs7Ozs7Ozs7O0FDQUFELFdBQVdFLE1BQVgsQ0FBa0JDLFVBQWxCLEdBQStCLElBQUksY0FBY0gsV0FBV0UsTUFBWCxDQUFrQkUsS0FBaEMsQ0FBc0M7QUFDeEVDLGdCQUFjO0FBQ2IsVUFBTSxZQUFOO0FBRUEsU0FBS0MsY0FBTCxDQUFvQjtBQUFFLG1CQUFhO0FBQWYsS0FBcEI7QUFDQSxHQUx1RSxDQU94RTs7O0FBQ0FDLGNBQVlDLEdBQVosRUFBaUJDLE9BQWpCLEVBQTBCO0FBQ3pCLFVBQU1DLFFBQVE7QUFBRUY7QUFBRixLQUFkO0FBQ0EsV0FBTyxLQUFLRyxPQUFMLENBQWFELEtBQWIsRUFBb0JELE9BQXBCLENBQVA7QUFDQTs7QUFFREcsYUFBVztBQUNWLFVBQU1ILFVBQVU7QUFDZkksWUFBTTtBQUNMQyxtQkFBVyxDQUFDO0FBRFAsT0FEUztBQUlmQyxhQUFPO0FBSlEsS0FBaEI7QUFNQSxVQUFNQyxVQUFVLEtBQUtDLElBQUwsQ0FBVSxFQUFWLEVBQWNSLE9BQWQsRUFBdUJTLEtBQXZCLEVBQWhCO0FBQ0EsV0FBT0YsV0FBV0EsUUFBUSxDQUFSLENBQWxCO0FBQ0E7O0FBdEJ1RSxDQUExQyxFQUEvQixDOzs7Ozs7Ozs7OztBQ0FBLElBQUlHLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFB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Y2VzQ29udGVudCI6WyJSb2NrZXRDaGF0LnN0YXRpc3RpY3MgPSB7fTtcbiIsIlJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MgPSBuZXcgY2xhc3MgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdzdGF0aXN0aWNzJyk7XG5cblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ2NyZWF0ZWRBdCc6IDEgfSk7XG5cdH1cblxuXHQvLyBGSU5EIE9ORVxuXHRmaW5kT25lQnlJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsgX2lkIH07XG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSwgb3B0aW9ucyk7XG5cdH1cblxuXHRmaW5kTGFzdCgpIHtcblx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0c29ydDoge1xuXHRcdFx0XHRjcmVhdGVkQXQ6IC0xXG5cdFx0XHR9LFxuXHRcdFx0bGltaXQ6IDFcblx0XHR9O1xuXHRcdGNvbnN0IHJlY29yZHMgPSB0aGlzLmZpbmQoe30sIG9wdGlvbnMpLmZldGNoKCk7XG5cdFx0cmV0dXJuIHJlY29yZHMgJiYgcmVjb3Jkc1swXTtcblx0fVxufTtcbiIsIi8qIGdsb2JhbCBJbnN0YW5jZVN0YXR1cywgTW9uZ29JbnRlcm5hbHMgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcblxuY29uc3Qgd2l6YXJkRmllbGRzID0gW1xuXHQnT3JnYW5pemF0aW9uX1R5cGUnLFxuXHQnT3JnYW5pemF0aW9uX05hbWUnLFxuXHQnSW5kdXN0cnknLFxuXHQnU2l6ZScsXG5cdCdDb3VudHJ5Jyxcblx0J1dlYnNpdGUnLFxuXHQnU2l0ZV9OYW1lJyxcblx0J0xhbmd1YWdlJyxcblx0J1NlcnZlcl9UeXBlJ1xuXTtcblxuUm9ja2V0Q2hhdC5zdGF0aXN0aWNzLmdldCA9IGZ1bmN0aW9uIF9nZXRTdGF0aXN0aWNzKCkge1xuXHRjb25zdCBzdGF0aXN0aWNzID0ge307XG5cblx0Ly8gU2V0dXAgV2l6YXJkXG5cdHN0YXRpc3RpY3Mud2l6YXJkID0ge307XG5cdHdpemFyZEZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcblx0XHRjb25zdCByZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lKGZpZWxkKTtcblx0XHRpZiAocmVjb3JkKSB7XG5cdFx0XHRjb25zdCB3aXphcmRGaWVsZCA9IGZpZWxkLnJlcGxhY2UoL18vZywgJycpLnJlcGxhY2UoZmllbGRbMF0sIGZpZWxkWzBdLnRvTG93ZXJDYXNlKCkpO1xuXHRcdFx0c3RhdGlzdGljcy53aXphcmRbd2l6YXJkRmllbGRdID0gcmVjb3JkLnZhbHVlO1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gVmVyc2lvblxuXHRzdGF0aXN0aWNzLnVuaXF1ZUlkID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJyk7XG5cdGlmIChSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lKCd1bmlxdWVJRCcpKSB7XG5cdFx0c3RhdGlzdGljcy5pbnN0YWxsZWRBdCA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRPbmUoJ3VuaXF1ZUlEJykuY3JlYXRlZEF0O1xuXHR9XG5cblx0aWYgKFJvY2tldENoYXQuSW5mbykge1xuXHRcdHN0YXRpc3RpY3MudmVyc2lvbiA9IFJvY2tldENoYXQuSW5mby52ZXJzaW9uO1xuXHRcdHN0YXRpc3RpY3MudGFnID0gUm9ja2V0Q2hhdC5JbmZvLnRhZztcblx0XHRzdGF0aXN0aWNzLmJyYW5jaCA9IFJvY2tldENoYXQuSW5mby5icmFuY2g7XG5cdH1cblxuXHQvLyBVc2VyIHN0YXRpc3RpY3Ncblx0c3RhdGlzdGljcy50b3RhbFVzZXJzID0gTWV0ZW9yLnVzZXJzLmZpbmQoKS5jb3VudCgpO1xuXHRzdGF0aXN0aWNzLmFjdGl2ZVVzZXJzID0gTWV0ZW9yLnVzZXJzLmZpbmQoeyBhY3RpdmU6IHRydWUgfSkuY291bnQoKTtcblx0c3RhdGlzdGljcy5ub25BY3RpdmVVc2VycyA9IHN0YXRpc3RpY3MudG90YWxVc2VycyAtIHN0YXRpc3RpY3MuYWN0aXZlVXNlcnM7XG5cdHN0YXRpc3RpY3Mub25saW5lVXNlcnMgPSBNZXRlb3IudXNlcnMuZmluZCh7IHN0YXR1c0Nvbm5lY3Rpb246ICdvbmxpbmUnIH0pLmNvdW50KCk7XG5cdHN0YXRpc3RpY3MuYXdheVVzZXJzID0gTWV0ZW9yLnVzZXJzLmZpbmQoeyBzdGF0dXNDb25uZWN0aW9uOiAnYXdheScgfSkuY291bnQoKTtcblx0c3RhdGlzdGljcy5vZmZsaW5lVXNlcnMgPSBzdGF0aXN0aWNzLnRvdGFsVXNlcnMgLSBzdGF0aXN0aWNzLm9ubGluZVVzZXJzIC0gc3RhdGlzdGljcy5hd2F5VXNlcnM7XG5cblx0Ly8gUm9vbSBzdGF0aXN0aWNzXG5cdHN0YXRpc3RpY3MudG90YWxSb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQoKS5jb3VudCgpO1xuXHRzdGF0aXN0aWNzLnRvdGFsQ2hhbm5lbHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdjJykuY291bnQoKTtcblx0c3RhdGlzdGljcy50b3RhbFByaXZhdGVHcm91cHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdwJykuY291bnQoKTtcblx0c3RhdGlzdGljcy50b3RhbERpcmVjdCA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGUoJ2QnKS5jb3VudCgpO1xuXHRzdGF0aXN0aWNzLnRvdGFsTGl2ZWNoYXQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdsJykuY291bnQoKTtcblxuXHQvLyBNZXNzYWdlIHN0YXRpc3RpY3Ncblx0c3RhdGlzdGljcy50b3RhbE1lc3NhZ2VzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZCgpLmNvdW50KCk7XG5cdHN0YXRpc3RpY3MudG90YWxDaGFubmVsTWVzc2FnZXMgPSBfLnJlZHVjZShSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdjJywgeyBmaWVsZHM6IHsgJ21zZ3MnOiAxIH19KS5mZXRjaCgpLCBmdW5jdGlvbiBfY291bnRDaGFubmVsTWVzc2FnZXMobnVtLCByb29tKSB7IHJldHVybiBudW0gKyByb29tLm1zZ3M7IH0sIDApO1xuXHRzdGF0aXN0aWNzLnRvdGFsUHJpdmF0ZUdyb3VwTWVzc2FnZXMgPSBfLnJlZHVjZShSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdwJywgeyBmaWVsZHM6IHsgJ21zZ3MnOiAxIH19KS5mZXRjaCgpLCBmdW5jdGlvbiBfY291bnRQcml2YXRlR3JvdXBNZXNzYWdlcyhudW0sIHJvb20pIHsgcmV0dXJuIG51bSArIHJvb20ubXNnczsgfSwgMCk7XG5cdHN0YXRpc3RpY3MudG90YWxEaXJlY3RNZXNzYWdlcyA9IF8ucmVkdWNlKFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGUoJ2QnLCB7IGZpZWxkczogeyAnbXNncyc6IDEgfX0pLmZldGNoKCksIGZ1bmN0aW9uIF9jb3VudERpcmVjdE1lc3NhZ2VzKG51bSwgcm9vbSkgeyByZXR1cm4gbnVtICsgcm9vbS5tc2dzOyB9LCAwKTtcblx0c3RhdGlzdGljcy50b3RhbExpdmVjaGF0TWVzc2FnZXMgPSBfLnJlZHVjZShSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdsJywgeyBmaWVsZHM6IHsgJ21zZ3MnOiAxIH19KS5mZXRjaCgpLCBmdW5jdGlvbiBfY291bnRMaXZlY2hhdE1lc3NhZ2VzKG51bSwgcm9vbSkgeyByZXR1cm4gbnVtICsgcm9vbS5tc2dzOyB9LCAwKTtcblxuXHRzdGF0aXN0aWNzLmxhc3RMb2dpbiA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldExhc3RMb2dpbigpO1xuXHRzdGF0aXN0aWNzLmxhc3RNZXNzYWdlU2VudEF0ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZ2V0TGFzdFRpbWVzdGFtcCgpO1xuXHRzdGF0aXN0aWNzLmxhc3RTZWVuU3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5nZXRMYXN0U2VlbigpO1xuXG5cdHN0YXRpc3RpY3Mub3MgPSB7XG5cdFx0dHlwZTogb3MudHlwZSgpLFxuXHRcdHBsYXRmb3JtOiBvcy5wbGF0Zm9ybSgpLFxuXHRcdGFyY2g6IG9zLmFyY2goKSxcblx0XHRyZWxlYXNlOiBvcy5yZWxlYXNlKCksXG5cdFx0dXB0aW1lOiBvcy51cHRpbWUoKSxcblx0XHRsb2FkYXZnOiBvcy5sb2FkYXZnKCksXG5cdFx0dG90YWxtZW06IG9zLnRvdGFsbWVtKCksXG5cdFx0ZnJlZW1lbTogb3MuZnJlZW1lbSgpLFxuXHRcdGNwdXM6IG9zLmNwdXMoKVxuXHR9O1xuXG5cdHN0YXRpc3RpY3MucHJvY2VzcyA9IHtcblx0XHRub2RlVmVyc2lvbjogcHJvY2Vzcy52ZXJzaW9uLFxuXHRcdHBpZDogcHJvY2Vzcy5waWQsXG5cdFx0dXB0aW1lOiBwcm9jZXNzLnVwdGltZSgpXG5cdH07XG5cblx0c3RhdGlzdGljcy5kZXBsb3kgPSB7XG5cdFx0bWV0aG9kOiBwcm9jZXNzLmVudi5ERVBMT1lfTUVUSE9EIHx8ICd0YXInLFxuXHRcdHBsYXRmb3JtOiBwcm9jZXNzLmVudi5ERVBMT1lfUExBVEZPUk0gfHwgJ3NlbGZpbnN0YWxsJ1xuXHR9O1xuXG5cdHN0YXRpc3RpY3MubWlncmF0aW9uID0gUm9ja2V0Q2hhdC5NaWdyYXRpb25zLl9nZXRDb250cm9sKCk7XG5cdHN0YXRpc3RpY3MuaW5zdGFuY2VDb3VudCA9IEluc3RhbmNlU3RhdHVzLmdldENvbGxlY3Rpb24oKS5maW5kKHsgX3VwZGF0ZWRBdDogeyAkZ3Q6IG5ldyBEYXRlKERhdGUubm93KCkgLSBwcm9jZXNzLnVwdGltZSgpICogMTAwMCAtIDIwMDApIH19KS5jb3VudCgpO1xuXG5cdGlmIChNb25nb0ludGVybmFscy5kZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlcigpLm1vbmdvLl9vcGxvZ0hhbmRsZSAmJiBNb25nb0ludGVybmFscy5kZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlcigpLm1vbmdvLl9vcGxvZ0hhbmRsZS5vbk9wbG9nRW50cnkgJiYgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZvcmNlX0Rpc2FibGVfT3BMb2dfRm9yX0NhY2hlJykgIT09IHRydWUpIHtcblx0XHRzdGF0aXN0aWNzLm9wbG9nRW5hYmxlZCA9IHRydWU7XG5cdH1cblxuXHRyZXR1cm4gc3RhdGlzdGljcztcbn07XG4iLCJSb2NrZXRDaGF0LnN0YXRpc3RpY3Muc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRjb25zdCBzdGF0aXN0aWNzID0gUm9ja2V0Q2hhdC5zdGF0aXN0aWNzLmdldCgpO1xuXHRzdGF0aXN0aWNzLmNyZWF0ZWRBdCA9IG5ldyBEYXRlO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5TdGF0aXN0aWNzLmluc2VydChzdGF0aXN0aWNzKTtcblx0cmV0dXJuIHN0YXRpc3RpY3M7XG59O1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRnZXRTdGF0aXN0aWNzKHJlZnJlc2gpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnZ2V0U3RhdGlzdGljcycgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LXN0YXRpc3RpY3MnKSAhPT0gdHJ1ZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2dldFN0YXRpc3RpY3MnIH0pO1xuXHRcdH1cblxuXHRcdGlmIChyZWZyZXNoKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zdGF0aXN0aWNzLnNhdmUoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MuZmluZExhc3QoKTtcblx0XHR9XG5cdH1cbn0pO1xuIl19
