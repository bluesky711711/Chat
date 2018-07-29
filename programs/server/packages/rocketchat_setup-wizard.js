(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:setup-wizard":{"server":{"lib":{"getWizardSettings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_setup-wizard/server/lib/getWizardSettings.js                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
Meteor.methods({
  getWizardSettings() {
    if (RocketChat.authz.hasRole(Meteor.userId(), 'admin') && RocketChat.models && RocketChat.models.Settings) {
      return RocketChat.models.Settings.findSetupWizardSettings().fetch();
    }

    throw new Meteor.Error('settings-are-not-ready', 'Settings are not ready');
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:setup-wizard/server/lib/getWizardSettings.js");

/* Exports */
Package._define("rocketchat:setup-wizard");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_setup-wizard.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZXR1cC13aXphcmQvc2VydmVyL2xpYi9nZXRXaXphcmRTZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJtZXRob2RzIiwiZ2V0V2l6YXJkU2V0dGluZ3MiLCJSb2NrZXRDaGF0IiwiYXV0aHoiLCJoYXNSb2xlIiwidXNlcklkIiwibW9kZWxzIiwiU2V0dGluZ3MiLCJmaW5kU2V0dXBXaXphcmRTZXR0aW5ncyIsImZldGNoIiwiRXJyb3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsT0FBUCxDQUFlO0FBQ2RDLHNCQUFvQjtBQUNuQixRQUFJQyxXQUFXQyxLQUFYLENBQWlCQyxPQUFqQixDQUF5QkwsT0FBT00sTUFBUCxFQUF6QixFQUEwQyxPQUExQyxLQUFzREgsV0FBV0ksTUFBakUsSUFBMkVKLFdBQVdJLE1BQVgsQ0FBa0JDLFFBQWpHLEVBQTJHO0FBQzFHLGFBQU9MLFdBQVdJLE1BQVgsQ0FBa0JDLFFBQWxCLENBQTJCQyx1QkFBM0IsR0FBcURDLEtBQXJELEVBQVA7QUFDQTs7QUFFRCxVQUFNLElBQUlWLE9BQU9XLEtBQVgsQ0FBaUIsd0JBQWpCLEVBQTJDLHdCQUEzQyxDQUFOO0FBQ0E7O0FBUGEsQ0FBZixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NldHVwLXdpemFyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIk1ldGVvci5tZXRob2RzKHtcblx0Z2V0V2l6YXJkU2V0dGluZ3MoKSB7XG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUm9sZShNZXRlb3IudXNlcklkKCksICdhZG1pbicpICYmIFJvY2tldENoYXQubW9kZWxzICYmIFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZFNldHVwV2l6YXJkU2V0dGluZ3MoKS5mZXRjaCgpO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ3NldHRpbmdzLWFyZS1ub3QtcmVhZHknLCAnU2V0dGluZ3MgYXJlIG5vdCByZWFkeScpO1xuXHR9XG59KTtcbiJdfQ==
