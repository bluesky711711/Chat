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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-hide":{"server":{"hide.js":function(){

//////////////////////////////////////////////////////////////////////////////////
//                                                                              //
// packages/rocketchat_slashcommands-hide/server/hide.js                        //
//                                                                              //
//////////////////////////////////////////////////////////////////////////////////
                                                                                //
/*
* Hide is a named function that will replace /hide commands
* @param {Object} message - The message object
*/
function Hide(command, param, item) {
  if (command !== 'hide' || !Match.test(param, String)) {
    return;
  }

  const room = param.trim();
  const user = Meteor.user(); // if there is not a param, hide the current room

  let {
    rid
  } = item;

  if (room !== '') {
    const [strippedRoom] = room.replace(/#|@/, '').split(' ');
    const [type] = room;
    const roomObject = type === '#' ? RocketChat.models.Rooms.findOneByName(strippedRoom) : RocketChat.models.Rooms.findOne({
      t: 'd',
      usernames: {
        $all: [user.username, strippedRoom]
      }
    });

    if (!roomObject) {
      return RocketChat.Notifications.notifyUser(user._id, 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__('Channel_doesnt_exist', {
          postProcess: 'sprintf',
          sprintf: [room]
        }, user.language)
      });
    }

    if (!roomObject.usernames.includes(user.username)) {
      return RocketChat.Notifications.notifyUser(user._id, 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__('error-logged-user-not-in-room', {
          postProcess: 'sprintf',
          sprintf: [room]
        }, user.language)
      });
    }

    rid = roomObject._id;
  }

  Meteor.call('hideRoom', rid, error => {
    if (error) {
      return RocketChat.Notifications.notifyUser(user._id, 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__(error, null, user.language)
      });
    }
  });
}

RocketChat.slashCommands.add('hide', Hide, {
  description: 'Hide_room',
  params: '#room'
});
//////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-hide/server/hide.js");

/* Exports */
Package._define("rocketchat:slashcommands-hide");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-hide.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWhpZGUvc2VydmVyL2hpZGUuanMiXSwibmFtZXMiOlsiSGlkZSIsImNvbW1hbmQiLCJwYXJhbSIsIml0ZW0iLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJyb29tIiwidHJpbSIsInVzZXIiLCJNZXRlb3IiLCJyaWQiLCJzdHJpcHBlZFJvb20iLCJyZXBsYWNlIiwic3BsaXQiLCJ0eXBlIiwicm9vbU9iamVjdCIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeU5hbWUiLCJmaW5kT25lIiwidCIsInVzZXJuYW1lcyIsIiRhbGwiLCJ1c2VybmFtZSIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlVc2VyIiwiX2lkIiwiUmFuZG9tIiwiaWQiLCJ0cyIsIkRhdGUiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsImluY2x1ZGVzIiwiY2FsbCIsImVycm9yIiwic2xhc2hDb21tYW5kcyIsImFkZCIsImRlc2NyaXB0aW9uIiwicGFyYW1zIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0E7Ozs7QUFJQSxTQUFTQSxJQUFULENBQWNDLE9BQWQsRUFBdUJDLEtBQXZCLEVBQThCQyxJQUE5QixFQUFvQztBQUNuQyxNQUFJRixZQUFZLE1BQVosSUFBc0IsQ0FBQ0csTUFBTUMsSUFBTixDQUFXSCxLQUFYLEVBQWtCSSxNQUFsQixDQUEzQixFQUFzRDtBQUNyRDtBQUNBOztBQUNELFFBQU1DLE9BQU9MLE1BQU1NLElBQU4sRUFBYjtBQUNBLFFBQU1DLE9BQU9DLE9BQU9ELElBQVAsRUFBYixDQUxtQyxDQU1uQzs7QUFDQSxNQUFJO0FBQUNFO0FBQUQsTUFBUVIsSUFBWjs7QUFDQSxNQUFJSSxTQUFTLEVBQWIsRUFBaUI7QUFDaEIsVUFBTSxDQUFDSyxZQUFELElBQWlCTCxLQUFLTSxPQUFMLENBQWEsS0FBYixFQUFvQixFQUFwQixFQUF3QkMsS0FBeEIsQ0FBOEIsR0FBOUIsQ0FBdkI7QUFDQSxVQUFNLENBQUNDLElBQUQsSUFBU1IsSUFBZjtBQUVBLFVBQU1TLGFBQWFELFNBQVMsR0FBVCxHQUFlRSxXQUFXQyxNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsYUFBeEIsQ0FBc0NSLFlBQXRDLENBQWYsR0FBcUVLLFdBQVdDLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCRSxPQUF4QixDQUFnQztBQUN2SEMsU0FBRyxHQURvSDtBQUV2SEMsaUJBQVc7QUFBRUMsY0FBTSxDQUFDZixLQUFLZ0IsUUFBTixFQUFnQmIsWUFBaEI7QUFBUjtBQUY0RyxLQUFoQyxDQUF4Rjs7QUFLQSxRQUFJLENBQUNJLFVBQUwsRUFBaUI7QUFDaEIsYUFBT0MsV0FBV1MsYUFBWCxDQUF5QkMsVUFBekIsQ0FBb0NsQixLQUFLbUIsR0FBekMsRUFBOEMsU0FBOUMsRUFBeUQ7QUFDL0RBLGFBQUtDLE9BQU9DLEVBQVAsRUFEMEQ7QUFFL0RuQixhQUFLUixLQUFLUSxHQUZxRDtBQUcvRG9CLFlBQUksSUFBSUMsSUFBSixFQUgyRDtBQUkvREMsYUFBS0MsUUFBUUMsRUFBUixDQUFXLHNCQUFYLEVBQW1DO0FBQ3ZDQyx1QkFBYSxTQUQwQjtBQUV2Q0MsbUJBQVMsQ0FBQzlCLElBQUQ7QUFGOEIsU0FBbkMsRUFHRkUsS0FBSzZCLFFBSEg7QUFKMEQsT0FBekQsQ0FBUDtBQVNBOztBQUVELFFBQUksQ0FBQ3RCLFdBQVdPLFNBQVgsQ0FBcUJnQixRQUFyQixDQUE4QjlCLEtBQUtnQixRQUFuQyxDQUFMLEVBQW1EO0FBQ2xELGFBQU9SLFdBQVdTLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DbEIsS0FBS21CLEdBQXpDLEVBQThDLFNBQTlDLEVBQXlEO0FBQy9EQSxhQUFLQyxPQUFPQyxFQUFQLEVBRDBEO0FBRS9EbkIsYUFBS1IsS0FBS1EsR0FGcUQ7QUFHL0RvQixZQUFJLElBQUlDLElBQUosRUFIMkQ7QUFJL0RDLGFBQUtDLFFBQVFDLEVBQVIsQ0FBVywrQkFBWCxFQUE0QztBQUNoREMsdUJBQWEsU0FEbUM7QUFFaERDLG1CQUFTLENBQUM5QixJQUFEO0FBRnVDLFNBQTVDLEVBR0ZFLEtBQUs2QixRQUhIO0FBSjBELE9BQXpELENBQVA7QUFTQTs7QUFDRDNCLFVBQU1LLFdBQVdZLEdBQWpCO0FBQ0E7O0FBRURsQixTQUFPOEIsSUFBUCxDQUFZLFVBQVosRUFBd0I3QixHQUF4QixFQUE2QjhCLFNBQVM7QUFDckMsUUFBSUEsS0FBSixFQUFXO0FBQ1YsYUFBT3hCLFdBQVdTLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DbEIsS0FBS21CLEdBQXpDLEVBQThDLFNBQTlDLEVBQXlEO0FBQy9EQSxhQUFLQyxPQUFPQyxFQUFQLEVBRDBEO0FBRS9EbkIsYUFBS1IsS0FBS1EsR0FGcUQ7QUFHL0RvQixZQUFJLElBQUlDLElBQUosRUFIMkQ7QUFJL0RDLGFBQUtDLFFBQVFDLEVBQVIsQ0FBV00sS0FBWCxFQUFrQixJQUFsQixFQUF3QmhDLEtBQUs2QixRQUE3QjtBQUowRCxPQUF6RCxDQUFQO0FBTUE7QUFDRCxHQVREO0FBVUE7O0FBRURyQixXQUFXeUIsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsTUFBN0IsRUFBcUMzQyxJQUFyQyxFQUEyQztBQUFFNEMsZUFBYSxXQUFmO0FBQTRCQyxVQUFRO0FBQXBDLENBQTNDLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfc2xhc2hjb21tYW5kcy1oaWRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKlxuKiBIaWRlIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL2hpZGUgY29tbWFuZHNcbiogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3RcbiovXG5mdW5jdGlvbiBIaWRlKGNvbW1hbmQsIHBhcmFtLCBpdGVtKSB7XG5cdGlmIChjb21tYW5kICE9PSAnaGlkZScgfHwgIU1hdGNoLnRlc3QocGFyYW0sIFN0cmluZykpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3Qgcm9vbSA9IHBhcmFtLnRyaW0oKTtcblx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cdC8vIGlmIHRoZXJlIGlzIG5vdCBhIHBhcmFtLCBoaWRlIHRoZSBjdXJyZW50IHJvb21cblx0bGV0IHtyaWR9ID0gaXRlbTtcblx0aWYgKHJvb20gIT09ICcnKSB7XG5cdFx0Y29uc3QgW3N0cmlwcGVkUm9vbV0gPSByb29tLnJlcGxhY2UoLyN8QC8sICcnKS5zcGxpdCgnICcpO1xuXHRcdGNvbnN0IFt0eXBlXSA9IHJvb207XG5cblx0XHRjb25zdCByb29tT2JqZWN0ID0gdHlwZSA9PT0gJyMnID8gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShzdHJpcHBlZFJvb20pIDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7XG5cdFx0XHR0OiAnZCcsXG5cdFx0XHR1c2VybmFtZXM6IHsgJGFsbDogW3VzZXIudXNlcm5hbWUsIHN0cmlwcGVkUm9vbV0gfVxuXHRcdH0pO1xuXG5cdFx0aWYgKCFyb29tT2JqZWN0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIodXNlci5faWQsICdtZXNzYWdlJywge1xuXHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRcdG1zZzogVEFQaTE4bi5fXygnQ2hhbm5lbF9kb2VzbnRfZXhpc3QnLCB7XG5cdFx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0XHRzcHJpbnRmOiBbcm9vbV1cblx0XHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICghcm9vbU9iamVjdC51c2VybmFtZXMuaW5jbHVkZXModXNlci51c2VybmFtZSkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcih1c2VyLl9pZCwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHRcdHRzOiBuZXcgRGF0ZSxcblx0XHRcdFx0bXNnOiBUQVBpMThuLl9fKCdlcnJvci1sb2dnZWQtdXNlci1ub3QtaW4tcm9vbScsIHtcblx0XHRcdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0XHRcdHNwcmludGY6IFtyb29tXVxuXHRcdFx0XHR9LCB1c2VyLmxhbmd1YWdlKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHJpZCA9IHJvb21PYmplY3QuX2lkO1xuXHR9XG5cblx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgcmlkLCBlcnJvciA9PiB7XG5cdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIodXNlci5faWQsICdtZXNzYWdlJywge1xuXHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRcdG1zZzogVEFQaTE4bi5fXyhlcnJvciwgbnVsbCwgdXNlci5sYW5ndWFnZSlcblx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG59XG5cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ2hpZGUnLCBIaWRlLCB7IGRlc2NyaXB0aW9uOiAnSGlkZV9yb29tJywgcGFyYW1zOiAnI3Jvb20nIH0pO1xuIl19
