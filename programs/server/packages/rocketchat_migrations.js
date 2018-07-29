(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:migrations":{"migrations.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_migrations/migrations.js                                                                //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 2);

/*
	Adds migration capabilities. Migrations are defined like:

	Migrations.add({
		up: function() {}, //*required* code to run to migrate upwards
		version: 1, //*required* number to identify migration order
		down: function() {}, //*optional* code to run to migrate downwards
		name: 'Something' //*optional* display name for the migration
	});

	The ordering of migrations is determined by the version you set.

	To run the migrations, set the MIGRATE environment variable to either
	'latest' or the version number you want to migrate to. Optionally, append
	',exit' if you want the migrations to exit the meteor process, e.g if you're
	migrating from a script (remember to pass the --once parameter).

	e.g:
	MIGRATE="latest" mrt # ensure we'll be at the latest version and run the app
	MIGRATE="latest,exit" mrt --once # ensure we'll be at the latest version and exit
	MIGRATE="2,exit" mrt --once # migrate to version 2 and exit

	Note: Migrations will lock ensuring only 1 app can be migrating at once. If
	a migration crashes, the control record in the migrations collection will
	remain locked and at the version it was at previously, however the db could
	be in an inconsistant state.
*/
// since we'll be at version 0 by default, we should have a migration set for it.
const DefaultMigration = {
  version: 0,

  up() {// @TODO: check if collection "migrations" exist
    // If exists, rename and rerun _migrateTo
  }

};
const Migrations = this.Migrations = {
  _list: [DefaultMigration],
  options: {
    // false disables logging
    log: true,
    // null or a function
    logger: null,
    // enable/disable info log "already at latest."
    logIfLatest: true,
    // lock will be valid for this amount of minutes
    lockExpiration: 5,
    // retry interval in seconds
    retryInterval: 10,
    // max number of attempts to retry unlock
    maxAttempts: 30,
    // migrations collection name
    collectionName: 'migrations' // collectionName: "rocketchat_migrations"

  },

  config(opts) {
    this.options = _.extend({}, this.options, opts);
  }

};
Migrations._collection = new Mongo.Collection(Migrations.options.collectionName);
/* Create a box around messages for displaying on a console.log */

function makeABox(message, color = 'red') {
  if (!_.isArray(message)) {
    message = message.split('\n');
  }

  const len = _(message).reduce(function (memo, msg) {
    return Math.max(memo, msg.length);
  }, 0) + 4;
  const text = message.map(msg => {
    return '|'[color] + s.lrpad(msg, len)[color] + '|'[color];
  }).join('\n');
  const topLine = '+'[color] + s.pad('', len, '-')[color] + '+'[color];
  const separator = '|'[color] + s.pad('', len, '') + '|'[color];
  const bottomLine = '+'[color] + s.pad('', len, '-')[color] + '+'[color];
  return `\n${topLine}\n${separator}\n${text}\n${separator}\n${bottomLine}\n`;
}
/*
	Logger factory function. Takes a prefix string and options object
	and uses an injected `logger` if provided, else falls back to
	Meteor's `Log` package.
	Will send a log object to the injected logger, on the following form:
		message: String
		level: String (info, warn, error, debug)
		tag: 'Migrations'
*/


function createLogger(prefix) {
  check(prefix, String); // Return noop if logging is disabled.

  if (Migrations.options.log === false) {
    return function () {};
  }

  return function (level, message) {
    check(level, Match.OneOf('info', 'error', 'warn', 'debug'));
    check(message, Match.OneOf(String, [String]));
    const logger = Migrations.options && Migrations.options.logger;

    if (logger && _.isFunction(logger)) {
      logger({
        level,
        message,
        tag: prefix
      });
    } else {
      Log[level]({
        message: `${prefix}: ${message}`
      });
    }
  };
} // collection holding the control record


const log = createLogger('Migrations');
['info', 'warn', 'error', 'debug'].forEach(function (level) {
  log[level] = _.partial(log, level);
}); // if (process.env.MIGRATE)
//   Migrations.migrateTo(process.env.MIGRATE);
// Add a new migration:
// {up: function *required
//  version: Number *required
//  down: function *optional
//  name: String *optional
// }

Migrations.add = function (migration) {
  if (typeof migration.up !== 'function') {
    throw new Meteor.Error('Migration must supply an up function.');
  }

  if (typeof migration.version !== 'number') {
    throw new Meteor.Error('Migration must supply a version number.');
  }

  if (migration.version <= 0) {
    throw new Meteor.Error('Migration version must be greater than 0');
  } // Freeze the migration object to make it hereafter immutable


  Object.freeze(migration);

  this._list.push(migration);

  this._list = _.sortBy(this._list, function (m) {
    return m.version;
  });
}; // Attempts to run the migrations using command in the form of:
// e.g 'latest', 'latest,exit', 2
// use 'XX,rerun' to re-run the migration at that version


Migrations.migrateTo = function (command) {
  if (_.isUndefined(command) || command === '' || this._list.length === 0) {
    throw new Error(`Cannot migrate using invalid command: ${command}`);
  }

  let version;
  let subcommand;

  if (typeof command === 'number') {
    version = command;
  } else {
    version = command.split(',')[0];
    subcommand = command.split(',')[1];
  }

  const maxAttempts = Migrations.options.maxAttempts;
  const retryInterval = Migrations.options.retryInterval;
  let migrated;

  for (let attempts = 1; attempts <= maxAttempts; attempts++) {
    if (version === 'latest') {
      migrated = this._migrateTo(_.last(this._list).version);
    } else {
      migrated = this._migrateTo(parseInt(version), subcommand === 'rerun');
    }

    if (migrated) {
      break;
    } else {
      let willRetry;

      if (attempts < maxAttempts) {
        willRetry = ` Trying again in ${retryInterval} seconds.`;

        Meteor._sleepForMs(retryInterval * 1000);
      } else {
        willRetry = '';
      }

      console.log(`Not migrating, control is locked. Attempt ${attempts}/${maxAttempts}.${willRetry}`.yellow);
    }
  }

  if (!migrated) {
    const control = this._getControl(); // Side effect: upserts control document.


    console.log(makeABox(['ERROR! SERVER STOPPED', '', 'Your database migration control is locked.', 'Please make sure you are running the latest version and try again.', 'If the problem persists, please contact support.', '', `This Rocket.Chat version: ${RocketChat.Info.version}`, `Database locked at version: ${control.version}`, `Database target version: ${version === 'latest' ? _.last(this._list).version : version}`, '', `Commit: ${RocketChat.Info.commit.hash}`, `Date: ${RocketChat.Info.commit.date}`, `Branch: ${RocketChat.Info.commit.branch}`, `Tag: ${RocketChat.Info.commit.tag}`]));
    process.exit(1);
  } // remember to run meteor with --once otherwise it will restart


  if (subcommand === 'exit') {
    process.exit(0);
  }
}; // just returns the current version


Migrations.getVersion = function () {
  return this._getControl().version;
}; // migrates to the specific version passed in


Migrations._migrateTo = function (version, rerun) {
  const self = this;

  const control = this._getControl(); // Side effect: upserts control document.


  let currentVersion = control.version;

  if (lock() === false) {
    // log.info('Not migrating, control is locked.');
    // Warning
    return false;
  }

  if (rerun) {
    log.info(`Rerunning version ${version}`);
    migrate('up', this._findIndexByVersion(version));
    log.info('Finished migrating.');
    unlock();
    return true;
  }

  if (currentVersion === version) {
    if (this.options.logIfLatest) {
      log.info(`Not migrating, already at version ${version}`);
    }

    unlock();
    return true;
  }

  const startIdx = this._findIndexByVersion(currentVersion);

  const endIdx = this._findIndexByVersion(version); // log.info('startIdx:' + startIdx + ' endIdx:' + endIdx);


  log.info(`Migrating from version ${this._list[startIdx].version} -> ${this._list[endIdx].version}`); // run the actual migration

  function migrate(direction, idx) {
    const migration = self._list[idx];

    if (typeof migration[direction] !== 'function') {
      unlock();
      throw new Meteor.Error(`Cannot migrate ${direction} on version ${migration.version}`);
    }

    function maybeName() {
      return migration.name ? ` (${migration.name})` : '';
    }

    log.info(`Running ${direction}() on version ${migration.version}${maybeName()}`);

    try {
      RocketChat.models._CacheControl.withValue(false, function () {
        migration[direction](migration);
      });
    } catch (e) {
      console.log(makeABox(['ERROR! SERVER STOPPED', '', 'Your database migration failed:', e.message, '', 'Please make sure you are running the latest version and try again.', 'If the problem persists, please contact support.', '', `This Rocket.Chat version: ${RocketChat.Info.version}`, `Database locked at version: ${control.version}`, `Database target version: ${version}`, '', `Commit: ${RocketChat.Info.commit.hash}`, `Date: ${RocketChat.Info.commit.date}`, `Branch: ${RocketChat.Info.commit.branch}`, `Tag: ${RocketChat.Info.commit.tag}`]));
      process.exit(1);
    }
  } // Returns true if lock was acquired.


  function lock() {
    const date = new Date();
    const dateMinusInterval = moment(date).subtract(self.options.lockExpiration, 'minutes').toDate();
    const build = RocketChat.Info ? RocketChat.Info.build.date : date; // This is atomic. The selector ensures only one caller at a time will see
    // the unlocked control, and locking occurs in the same update's modifier.
    // All other simultaneous callers will get false back from the update.

    return self._collection.update({
      _id: 'control',
      $or: [{
        locked: false
      }, {
        lockedAt: {
          $lt: dateMinusInterval
        }
      }, {
        buildAt: {
          $ne: build
        }
      }]
    }, {
      $set: {
        locked: true,
        lockedAt: date,
        buildAt: build
      }
    }) === 1;
  } // Side effect: saves version.


  function unlock() {
    self._setControl({
      locked: false,
      version: currentVersion
    });
  }

  if (currentVersion < version) {
    for (let i = startIdx; i < endIdx; i++) {
      migrate('up', i + 1);
      currentVersion = self._list[i + 1].version;

      self._setControl({
        locked: true,
        version: currentVersion
      });
    }
  } else {
    for (let i = startIdx; i > endIdx; i--) {
      migrate('down', i);
      currentVersion = self._list[i - 1].version;

      self._setControl({
        locked: true,
        version: currentVersion
      });
    }
  }

  unlock();
  log.info('Finished migrating.');
}; // gets the current control record, optionally creating it if non-existant


Migrations._getControl = function () {
  const control = this._collection.findOne({
    _id: 'control'
  });

  return control || this._setControl({
    version: 0,
    locked: false
  });
}; // sets the control record


Migrations._setControl = function (control) {
  // be quite strict
  check(control.version, Number);
  check(control.locked, Boolean);

  this._collection.update({
    _id: 'control'
  }, {
    $set: {
      version: control.version,
      locked: control.locked
    }
  }, {
    upsert: true
  });

  return control;
}; // returns the migration index in _list or throws if not found


Migrations._findIndexByVersion = function (version) {
  for (let i = 0; i < this._list.length; i++) {
    if (this._list[i].version === version) {
      return i;
    }
  }

  throw new Meteor.Error(`Can't find migration version ${version}`);
}; //reset (mainly intended for tests)


Migrations._reset = function () {
  this._list = [{
    version: 0,

    up() {}

  }];

  this._collection.remove({});
};

RocketChat.Migrations = Migrations;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:migrations/migrations.js");

/* Exports */
Package._define("rocketchat:migrations");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_migrations.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptaWdyYXRpb25zL21pZ3JhdGlvbnMuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwicyIsIm1vbWVudCIsIkRlZmF1bHRNaWdyYXRpb24iLCJ2ZXJzaW9uIiwidXAiLCJNaWdyYXRpb25zIiwiX2xpc3QiLCJvcHRpb25zIiwibG9nIiwibG9nZ2VyIiwibG9nSWZMYXRlc3QiLCJsb2NrRXhwaXJhdGlvbiIsInJldHJ5SW50ZXJ2YWwiLCJtYXhBdHRlbXB0cyIsImNvbGxlY3Rpb25OYW1lIiwiY29uZmlnIiwib3B0cyIsImV4dGVuZCIsIl9jb2xsZWN0aW9uIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwibWFrZUFCb3giLCJtZXNzYWdlIiwiY29sb3IiLCJpc0FycmF5Iiwic3BsaXQiLCJsZW4iLCJyZWR1Y2UiLCJtZW1vIiwibXNnIiwiTWF0aCIsIm1heCIsImxlbmd0aCIsInRleHQiLCJtYXAiLCJscnBhZCIsImpvaW4iLCJ0b3BMaW5lIiwicGFkIiwic2VwYXJhdG9yIiwiYm90dG9tTGluZSIsImNyZWF0ZUxvZ2dlciIsInByZWZpeCIsImNoZWNrIiwiU3RyaW5nIiwibGV2ZWwiLCJNYXRjaCIsIk9uZU9mIiwiaXNGdW5jdGlvbiIsInRhZyIsIkxvZyIsImZvckVhY2giLCJwYXJ0aWFsIiwiYWRkIiwibWlncmF0aW9uIiwiTWV0ZW9yIiwiRXJyb3IiLCJPYmplY3QiLCJmcmVlemUiLCJwdXNoIiwic29ydEJ5IiwibSIsIm1pZ3JhdGVUbyIsImNvbW1hbmQiLCJpc1VuZGVmaW5lZCIsInN1YmNvbW1hbmQiLCJtaWdyYXRlZCIsImF0dGVtcHRzIiwiX21pZ3JhdGVUbyIsImxhc3QiLCJwYXJzZUludCIsIndpbGxSZXRyeSIsIl9zbGVlcEZvck1zIiwiY29uc29sZSIsInllbGxvdyIsImNvbnRyb2wiLCJfZ2V0Q29udHJvbCIsIlJvY2tldENoYXQiLCJJbmZvIiwiY29tbWl0IiwiaGFzaCIsImRhdGUiLCJicmFuY2giLCJwcm9jZXNzIiwiZXhpdCIsImdldFZlcnNpb24iLCJyZXJ1biIsInNlbGYiLCJjdXJyZW50VmVyc2lvbiIsImxvY2siLCJpbmZvIiwibWlncmF0ZSIsIl9maW5kSW5kZXhCeVZlcnNpb24iLCJ1bmxvY2siLCJzdGFydElkeCIsImVuZElkeCIsImRpcmVjdGlvbiIsImlkeCIsIm1heWJlTmFtZSIsIm5hbWUiLCJtb2RlbHMiLCJfQ2FjaGVDb250cm9sIiwid2l0aFZhbHVlIiwiZSIsIkRhdGUiLCJkYXRlTWludXNJbnRlcnZhbCIsInN1YnRyYWN0IiwidG9EYXRlIiwiYnVpbGQiLCJ1cGRhdGUiLCJfaWQiLCIkb3IiLCJsb2NrZWQiLCJsb2NrZWRBdCIsIiRsdCIsImJ1aWxkQXQiLCIkbmUiLCIkc2V0IiwiX3NldENvbnRyb2wiLCJpIiwiZmluZE9uZSIsIk51bWJlciIsIkJvb2xlYW4iLCJ1cHNlcnQiLCJfcmVzZXQiLCJyZW1vdmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsQ0FBSjs7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsUUFBRUssQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJQyxDQUFKO0FBQU1MLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDQyxRQUFFRCxDQUFGO0FBQUk7O0FBQWhCLENBQTFDLEVBQTRELENBQTVEO0FBQStELElBQUlFLE1BQUo7QUFBV04sT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFFBQVIsQ0FBYixFQUErQjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0UsYUFBT0YsQ0FBUDtBQUFTOztBQUFyQixDQUEvQixFQUFzRCxDQUF0RDs7QUFLOUk7Ozs7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d0IsRUFBeEI7QUFDQSxDQU5EOztBQVFBaEQsV0FBV3hFLFVBQVgsR0FBd0JBLFVBQXhCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfbWlncmF0aW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby11c2UtYmVmb3JlLWRlZmluZTowICovXG4vKiBnbG9iYWxzIExvZyovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50Jztcbi8qXG5cdEFkZHMgbWlncmF0aW9uIGNhcGFiaWxpdGllcy4gTWlncmF0aW9ucyBhcmUgZGVmaW5lZCBsaWtlOlxuXG5cdE1pZ3JhdGlvbnMuYWRkKHtcblx0XHR1cDogZnVuY3Rpb24oKSB7fSwgLy8qcmVxdWlyZWQqIGNvZGUgdG8gcnVuIHRvIG1pZ3JhdGUgdXB3YXJkc1xuXHRcdHZlcnNpb246IDEsIC8vKnJlcXVpcmVkKiBudW1iZXIgdG8gaWRlbnRpZnkgbWlncmF0aW9uIG9yZGVyXG5cdFx0ZG93bjogZnVuY3Rpb24oKSB7fSwgLy8qb3B0aW9uYWwqIGNvZGUgdG8gcnVuIHRvIG1pZ3JhdGUgZG93bndhcmRzXG5cdFx0bmFtZTogJ1NvbWV0aGluZycgLy8qb3B0aW9uYWwqIGRpc3BsYXkgbmFtZSBmb3IgdGhlIG1pZ3JhdGlvblxuXHR9KTtcblxuXHRUaGUgb3JkZXJpbmcgb2YgbWlncmF0aW9ucyBpcyBkZXRlcm1pbmVkIGJ5IHRoZSB2ZXJzaW9uIHlvdSBzZXQuXG5cblx0VG8gcnVuIHRoZSBtaWdyYXRpb25zLCBzZXQgdGhlIE1JR1JBVEUgZW52aXJvbm1lbnQgdmFyaWFibGUgdG8gZWl0aGVyXG5cdCdsYXRlc3QnIG9yIHRoZSB2ZXJzaW9uIG51bWJlciB5b3Ugd2FudCB0byBtaWdyYXRlIHRvLiBPcHRpb25hbGx5LCBhcHBlbmRcblx0JyxleGl0JyBpZiB5b3Ugd2FudCB0aGUgbWlncmF0aW9ucyB0byBleGl0IHRoZSBtZXRlb3IgcHJvY2VzcywgZS5nIGlmIHlvdSdyZVxuXHRtaWdyYXRpbmcgZnJvbSBhIHNjcmlwdCAocmVtZW1iZXIgdG8gcGFzcyB0aGUgLS1vbmNlIHBhcmFtZXRlcikuXG5cblx0ZS5nOlxuXHRNSUdSQVRFPVwibGF0ZXN0XCIgbXJ0ICMgZW5zdXJlIHdlJ2xsIGJlIGF0IHRoZSBsYXRlc3QgdmVyc2lvbiBhbmQgcnVuIHRoZSBhcHBcblx0TUlHUkFURT1cImxhdGVzdCxleGl0XCIgbXJ0IC0tb25jZSAjIGVuc3VyZSB3ZSdsbCBiZSBhdCB0aGUgbGF0ZXN0IHZlcnNpb24gYW5kIGV4aXRcblx0TUlHUkFURT1cIjIsZXhpdFwiIG1ydCAtLW9uY2UgIyBtaWdyYXRlIHRvIHZlcnNpb24gMiBhbmQgZXhpdFxuXG5cdE5vdGU6IE1pZ3JhdGlvbnMgd2lsbCBsb2NrIGVuc3VyaW5nIG9ubHkgMSBhcHAgY2FuIGJlIG1pZ3JhdGluZyBhdCBvbmNlLiBJZlxuXHRhIG1pZ3JhdGlvbiBjcmFzaGVzLCB0aGUgY29udHJvbCByZWNvcmQgaW4gdGhlIG1pZ3JhdGlvbnMgY29sbGVjdGlvbiB3aWxsXG5cdHJlbWFpbiBsb2NrZWQgYW5kIGF0IHRoZSB2ZXJzaW9uIGl0IHdhcyBhdCBwcmV2aW91c2x5LCBob3dldmVyIHRoZSBkYiBjb3VsZFxuXHRiZSBpbiBhbiBpbmNvbnNpc3RhbnQgc3RhdGUuXG4qL1xuXG4vLyBzaW5jZSB3ZSdsbCBiZSBhdCB2ZXJzaW9uIDAgYnkgZGVmYXVsdCwgd2Ugc2hvdWxkIGhhdmUgYSBtaWdyYXRpb24gc2V0IGZvciBpdC5cbmNvbnN0IERlZmF1bHRNaWdyYXRpb24gPSB7XG5cdHZlcnNpb246IDAsXG5cdHVwKCkge1xuXHRcdC8vIEBUT0RPOiBjaGVjayBpZiBjb2xsZWN0aW9uIFwibWlncmF0aW9uc1wiIGV4aXN0XG5cdFx0Ly8gSWYgZXhpc3RzLCByZW5hbWUgYW5kIHJlcnVuIF9taWdyYXRlVG9cblx0fVxufTtcblxuY29uc3QgTWlncmF0aW9ucyA9IHRoaXMuTWlncmF0aW9ucyA9IHtcblx0X2xpc3Q6IFtEZWZhdWx0TWlncmF0aW9uXSxcblx0b3B0aW9uczoge1xuXHRcdC8vIGZhbHNlIGRpc2FibGVzIGxvZ2dpbmdcblx0XHRsb2c6IHRydWUsXG5cdFx0Ly8gbnVsbCBvciBhIGZ1bmN0aW9uXG5cdFx0bG9nZ2VyOiBudWxsLFxuXHRcdC8vIGVuYWJsZS9kaXNhYmxlIGluZm8gbG9nIFwiYWxyZWFkeSBhdCBsYXRlc3QuXCJcblx0XHRsb2dJZkxhdGVzdDogdHJ1ZSxcblx0XHQvLyBsb2NrIHdpbGwgYmUgdmFsaWQgZm9yIHRoaXMgYW1vdW50IG9mIG1pbnV0ZXNcblx0XHRsb2NrRXhwaXJhdGlvbjogNSxcblx0XHQvLyByZXRyeSBpbnRlcnZhbCBpbiBzZWNvbmRzXG5cdFx0cmV0cnlJbnRlcnZhbDogMTAsXG5cdFx0Ly8gbWF4IG51bWJlciBvZiBhdHRlbXB0cyB0byByZXRyeSB1bmxvY2tcblx0XHRtYXhBdHRlbXB0czogMzAsXG5cdFx0Ly8gbWlncmF0aW9ucyBjb2xsZWN0aW9uIG5hbWVcblx0XHRjb2xsZWN0aW9uTmFtZTogJ21pZ3JhdGlvbnMnXG5cdFx0Ly8gY29sbGVjdGlvbk5hbWU6IFwicm9ja2V0Y2hhdF9taWdyYXRpb25zXCJcblx0fSxcblx0Y29uZmlnKG9wdHMpIHtcblx0XHR0aGlzLm9wdGlvbnMgPSBfLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRzKTtcblx0fVxufTtcblxuTWlncmF0aW9ucy5fY29sbGVjdGlvbiA9IG5ldyBNb25nby5Db2xsZWN0aW9uKE1pZ3JhdGlvbnMub3B0aW9ucy5jb2xsZWN0aW9uTmFtZSk7XG5cbi8qIENyZWF0ZSBhIGJveCBhcm91bmQgbWVzc2FnZXMgZm9yIGRpc3BsYXlpbmcgb24gYSBjb25zb2xlLmxvZyAqL1xuZnVuY3Rpb24gbWFrZUFCb3gobWVzc2FnZSwgY29sb3IgPSAncmVkJykge1xuXHRpZiAoIV8uaXNBcnJheShtZXNzYWdlKSkge1xuXHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnNwbGl0KCdcXG4nKTtcblx0fVxuXHRjb25zdCBsZW4gPSBfKG1lc3NhZ2UpLnJlZHVjZShmdW5jdGlvbihtZW1vLCBtc2cpIHtcblx0XHRyZXR1cm4gTWF0aC5tYXgobWVtbywgbXNnLmxlbmd0aCk7XG5cdH0sIDApICsgNDtcblx0Y29uc3QgdGV4dCA9IG1lc3NhZ2UubWFwKChtc2cpID0+IHtcblx0XHRyZXR1cm4gJ3wnIFtjb2xvcl0gKyBzLmxycGFkKG1zZywgbGVuKVtjb2xvcl0gKyAnfCcgW2NvbG9yXTtcblx0fSkuam9pbignXFxuJyk7XG5cdGNvbnN0IHRvcExpbmUgPSAnKycgW2NvbG9yXSArIHMucGFkKCcnLCBsZW4sICctJylbY29sb3JdICsgJysnIFtjb2xvcl07XG5cdGNvbnN0IHNlcGFyYXRvciA9ICd8JyBbY29sb3JdICsgcy5wYWQoJycsIGxlbiwgJycpICsgJ3wnIFtjb2xvcl07XG5cdGNvbnN0IGJvdHRvbUxpbmUgPSAnKycgW2NvbG9yXSArIHMucGFkKCcnLCBsZW4sICctJylbY29sb3JdICsgJysnIFtjb2xvcl07XG5cdHJldHVybiBgXFxuJHsgdG9wTGluZSB9XFxuJHsgc2VwYXJhdG9yIH1cXG4keyB0ZXh0IH1cXG4keyBzZXBhcmF0b3IgfVxcbiR7IGJvdHRvbUxpbmUgfVxcbmA7XG59XG5cbi8qXG5cdExvZ2dlciBmYWN0b3J5IGZ1bmN0aW9uLiBUYWtlcyBhIHByZWZpeCBzdHJpbmcgYW5kIG9wdGlvbnMgb2JqZWN0XG5cdGFuZCB1c2VzIGFuIGluamVjdGVkIGBsb2dnZXJgIGlmIHByb3ZpZGVkLCBlbHNlIGZhbGxzIGJhY2sgdG9cblx0TWV0ZW9yJ3MgYExvZ2AgcGFja2FnZS5cblx0V2lsbCBzZW5kIGEgbG9nIG9iamVjdCB0byB0aGUgaW5qZWN0ZWQgbG9nZ2VyLCBvbiB0aGUgZm9sbG93aW5nIGZvcm06XG5cdFx0bWVzc2FnZTogU3RyaW5nXG5cdFx0bGV2ZWw6IFN0cmluZyAoaW5mbywgd2FybiwgZXJyb3IsIGRlYnVnKVxuXHRcdHRhZzogJ01pZ3JhdGlvbnMnXG4qL1xuZnVuY3Rpb24gY3JlYXRlTG9nZ2VyKHByZWZpeCkge1xuXHRjaGVjayhwcmVmaXgsIFN0cmluZyk7XG5cblx0Ly8gUmV0dXJuIG5vb3AgaWYgbG9nZ2luZyBpcyBkaXNhYmxlZC5cblx0aWYgKE1pZ3JhdGlvbnMub3B0aW9ucy5sb2cgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge307XG5cdH1cblxuXHRyZXR1cm4gZnVuY3Rpb24obGV2ZWwsIG1lc3NhZ2UpIHtcblx0XHRjaGVjayhsZXZlbCwgTWF0Y2guT25lT2YoJ2luZm8nLCAnZXJyb3InLCAnd2FybicsICdkZWJ1ZycpKTtcblx0XHRjaGVjayhtZXNzYWdlLCBNYXRjaC5PbmVPZihTdHJpbmcsIFtTdHJpbmddKSk7XG5cblx0XHRjb25zdCBsb2dnZXIgPSBNaWdyYXRpb25zLm9wdGlvbnMgJiYgTWlncmF0aW9ucy5vcHRpb25zLmxvZ2dlcjtcblxuXHRcdGlmIChsb2dnZXIgJiYgXy5pc0Z1bmN0aW9uKGxvZ2dlcikpIHtcblxuXHRcdFx0bG9nZ2VyKHtcblx0XHRcdFx0bGV2ZWwsXG5cdFx0XHRcdG1lc3NhZ2UsXG5cdFx0XHRcdHRhZzogcHJlZml4XG5cdFx0XHR9KTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRMb2dbbGV2ZWxdKHtcblx0XHRcdFx0bWVzc2FnZTogYCR7IHByZWZpeCB9OiAkeyBtZXNzYWdlIH1gXG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59XG5cbi8vIGNvbGxlY3Rpb24gaG9sZGluZyB0aGUgY29udHJvbCByZWNvcmRcblxuY29uc3QgbG9nID0gY3JlYXRlTG9nZ2VyKCdNaWdyYXRpb25zJyk7XG5cblsnaW5mbycsICd3YXJuJywgJ2Vycm9yJywgJ2RlYnVnJ10uZm9yRWFjaChmdW5jdGlvbihsZXZlbCkge1xuXHRsb2dbbGV2ZWxdID0gXy5wYXJ0aWFsKGxvZywgbGV2ZWwpO1xufSk7XG5cbi8vIGlmIChwcm9jZXNzLmVudi5NSUdSQVRFKVxuLy8gICBNaWdyYXRpb25zLm1pZ3JhdGVUbyhwcm9jZXNzLmVudi5NSUdSQVRFKTtcblxuLy8gQWRkIGEgbmV3IG1pZ3JhdGlvbjpcbi8vIHt1cDogZnVuY3Rpb24gKnJlcXVpcmVkXG4vLyAgdmVyc2lvbjogTnVtYmVyICpyZXF1aXJlZFxuLy8gIGRvd246IGZ1bmN0aW9uICpvcHRpb25hbFxuLy8gIG5hbWU6IFN0cmluZyAqb3B0aW9uYWxcbi8vIH1cbk1pZ3JhdGlvbnMuYWRkID0gZnVuY3Rpb24obWlncmF0aW9uKSB7XG5cdGlmICh0eXBlb2YgbWlncmF0aW9uLnVwICE9PSAnZnVuY3Rpb24nKSB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ01pZ3JhdGlvbiBtdXN0IHN1cHBseSBhbiB1cCBmdW5jdGlvbi4nKTsgfVxuXG5cdGlmICh0eXBlb2YgbWlncmF0aW9uLnZlcnNpb24gIT09ICdudW1iZXInKSB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ01pZ3JhdGlvbiBtdXN0IHN1cHBseSBhIHZlcnNpb24gbnVtYmVyLicpOyB9XG5cblx0aWYgKG1pZ3JhdGlvbi52ZXJzaW9uIDw9IDApIHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignTWlncmF0aW9uIHZlcnNpb24gbXVzdCBiZSBncmVhdGVyIHRoYW4gMCcpOyB9XG5cblx0Ly8gRnJlZXplIHRoZSBtaWdyYXRpb24gb2JqZWN0IHRvIG1ha2UgaXQgaGVyZWFmdGVyIGltbXV0YWJsZVxuXHRPYmplY3QuZnJlZXplKG1pZ3JhdGlvbik7XG5cblx0dGhpcy5fbGlzdC5wdXNoKG1pZ3JhdGlvbik7XG5cdHRoaXMuX2xpc3QgPSBfLnNvcnRCeSh0aGlzLl9saXN0LCBmdW5jdGlvbihtKSB7XG5cdFx0cmV0dXJuIG0udmVyc2lvbjtcblx0fSk7XG59O1xuXG4vLyBBdHRlbXB0cyB0byBydW4gdGhlIG1pZ3JhdGlvbnMgdXNpbmcgY29tbWFuZCBpbiB0aGUgZm9ybSBvZjpcbi8vIGUuZyAnbGF0ZXN0JywgJ2xhdGVzdCxleGl0JywgMlxuLy8gdXNlICdYWCxyZXJ1bicgdG8gcmUtcnVuIHRoZSBtaWdyYXRpb24gYXQgdGhhdCB2ZXJzaW9uXG5NaWdyYXRpb25zLm1pZ3JhdGVUbyA9IGZ1bmN0aW9uKGNvbW1hbmQpIHtcblx0aWYgKF8uaXNVbmRlZmluZWQoY29tbWFuZCkgfHwgY29tbWFuZCA9PT0gJycgfHwgdGhpcy5fbGlzdC5sZW5ndGggPT09IDApIHsgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgbWlncmF0ZSB1c2luZyBpbnZhbGlkIGNvbW1hbmQ6ICR7IGNvbW1hbmQgfWApOyB9XG5cblx0bGV0IHZlcnNpb247XG5cdGxldCBzdWJjb21tYW5kO1xuXHRpZiAodHlwZW9mIGNvbW1hbmQgPT09ICdudW1iZXInKSB7XG5cdFx0dmVyc2lvbiA9IGNvbW1hbmQ7XG5cdH0gZWxzZSB7XG5cdFx0dmVyc2lvbiA9IGNvbW1hbmQuc3BsaXQoJywnKVswXTtcblx0XHRzdWJjb21tYW5kID0gY29tbWFuZC5zcGxpdCgnLCcpWzFdO1xuXHR9XG5cblx0Y29uc3QgbWF4QXR0ZW1wdHMgPSBNaWdyYXRpb25zLm9wdGlvbnMubWF4QXR0ZW1wdHM7XG5cdGNvbnN0IHJldHJ5SW50ZXJ2YWwgPSBNaWdyYXRpb25zLm9wdGlvbnMucmV0cnlJbnRlcnZhbDtcblx0bGV0IG1pZ3JhdGVkO1xuXHRmb3IgKGxldCBhdHRlbXB0cyA9IDE7IGF0dGVtcHRzIDw9IG1heEF0dGVtcHRzOyBhdHRlbXB0cysrKSB7XG5cdFx0aWYgKHZlcnNpb24gPT09ICdsYXRlc3QnKSB7XG5cdFx0XHRtaWdyYXRlZCA9IHRoaXMuX21pZ3JhdGVUbyhfLmxhc3QodGhpcy5fbGlzdCkudmVyc2lvbik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1pZ3JhdGVkID0gdGhpcy5fbWlncmF0ZVRvKHBhcnNlSW50KHZlcnNpb24pLCAoc3ViY29tbWFuZCA9PT0gJ3JlcnVuJykpO1xuXHRcdH1cblx0XHRpZiAobWlncmF0ZWQpIHtcblx0XHRcdGJyZWFrO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsZXQgd2lsbFJldHJ5O1xuXHRcdFx0aWYgKGF0dGVtcHRzIDwgbWF4QXR0ZW1wdHMpIHtcblx0XHRcdFx0d2lsbFJldHJ5ID0gYCBUcnlpbmcgYWdhaW4gaW4gJHsgcmV0cnlJbnRlcnZhbCB9IHNlY29uZHMuYDtcblx0XHRcdFx0TWV0ZW9yLl9zbGVlcEZvck1zKHJldHJ5SW50ZXJ2YWwgKiAxMDAwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHdpbGxSZXRyeSA9ICcnO1xuXHRcdFx0fVxuXHRcdFx0Y29uc29sZS5sb2coYE5vdCBtaWdyYXRpbmcsIGNvbnRyb2wgaXMgbG9ja2VkLiBBdHRlbXB0ICR7IGF0dGVtcHRzIH0vJHsgbWF4QXR0ZW1wdHMgfS4keyB3aWxsUmV0cnkgfWAueWVsbG93KTtcblx0XHR9XG5cdH1cblx0aWYgKCFtaWdyYXRlZCkge1xuXHRcdGNvbnN0IGNvbnRyb2wgPSB0aGlzLl9nZXRDb250cm9sKCk7IC8vIFNpZGUgZWZmZWN0OiB1cHNlcnRzIGNvbnRyb2wgZG9jdW1lbnQuXG5cdFx0Y29uc29sZS5sb2cobWFrZUFCb3goW1xuXHRcdFx0J0VSUk9SISBTRVJWRVIgU1RPUFBFRCcsXG5cdFx0XHQnJyxcblx0XHRcdCdZb3VyIGRhdGFiYXNlIG1pZ3JhdGlvbiBjb250cm9sIGlzIGxvY2tlZC4nLFxuXHRcdFx0J1BsZWFzZSBtYWtlIHN1cmUgeW91IGFyZSBydW5uaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBhbmQgdHJ5IGFnYWluLicsXG5cdFx0XHQnSWYgdGhlIHByb2JsZW0gcGVyc2lzdHMsIHBsZWFzZSBjb250YWN0IHN1cHBvcnQuJyxcblx0XHRcdCcnLFxuXHRcdFx0YFRoaXMgUm9ja2V0LkNoYXQgdmVyc2lvbjogJHsgUm9ja2V0Q2hhdC5JbmZvLnZlcnNpb24gfWAsXG5cdFx0XHRgRGF0YWJhc2UgbG9ja2VkIGF0IHZlcnNpb246ICR7IGNvbnRyb2wudmVyc2lvbiB9YCxcblx0XHRcdGBEYXRhYmFzZSB0YXJnZXQgdmVyc2lvbjogJHsgdmVyc2lvbiA9PT0gJ2xhdGVzdCcgPyBfLmxhc3QodGhpcy5fbGlzdCkudmVyc2lvbiA6IHZlcnNpb24gfWAsXG5cdFx0XHQnJyxcblx0XHRcdGBDb21taXQ6ICR7IFJvY2tldENoYXQuSW5mby5jb21taXQuaGFzaCB9YCxcblx0XHRcdGBEYXRlOiAkeyBSb2NrZXRDaGF0LkluZm8uY29tbWl0LmRhdGUgfWAsXG5cdFx0XHRgQnJhbmNoOiAkeyBSb2NrZXRDaGF0LkluZm8uY29tbWl0LmJyYW5jaCB9YCxcblx0XHRcdGBUYWc6ICR7IFJvY2tldENoYXQuSW5mby5jb21taXQudGFnIH1gXG5cdFx0XSkpO1xuXHRcdHByb2Nlc3MuZXhpdCgxKTtcblx0fVxuXG5cdC8vIHJlbWVtYmVyIHRvIHJ1biBtZXRlb3Igd2l0aCAtLW9uY2Ugb3RoZXJ3aXNlIGl0IHdpbGwgcmVzdGFydFxuXHRpZiAoc3ViY29tbWFuZCA9PT0gJ2V4aXQnKSB7IHByb2Nlc3MuZXhpdCgwKTsgfVxufTtcblxuLy8ganVzdCByZXR1cm5zIHRoZSBjdXJyZW50IHZlcnNpb25cbk1pZ3JhdGlvbnMuZ2V0VmVyc2lvbiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fZ2V0Q29udHJvbCgpLnZlcnNpb247XG59O1xuXG4vLyBtaWdyYXRlcyB0byB0aGUgc3BlY2lmaWMgdmVyc2lvbiBwYXNzZWQgaW5cbk1pZ3JhdGlvbnMuX21pZ3JhdGVUbyA9IGZ1bmN0aW9uKHZlcnNpb24sIHJlcnVuKSB7XG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXHRjb25zdCBjb250cm9sID0gdGhpcy5fZ2V0Q29udHJvbCgpOyAvLyBTaWRlIGVmZmVjdDogdXBzZXJ0cyBjb250cm9sIGRvY3VtZW50LlxuXHRsZXQgY3VycmVudFZlcnNpb24gPSBjb250cm9sLnZlcnNpb247XG5cblx0aWYgKGxvY2soKSA9PT0gZmFsc2UpIHtcblx0XHQvLyBsb2cuaW5mbygnTm90IG1pZ3JhdGluZywgY29udHJvbCBpcyBsb2NrZWQuJyk7XG5cdFx0Ly8gV2FybmluZ1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGlmIChyZXJ1bikge1xuXHRcdGxvZy5pbmZvKGBSZXJ1bm5pbmcgdmVyc2lvbiAkeyB2ZXJzaW9uIH1gKTtcblx0XHRtaWdyYXRlKCd1cCcsIHRoaXMuX2ZpbmRJbmRleEJ5VmVyc2lvbih2ZXJzaW9uKSk7XG5cdFx0bG9nLmluZm8oJ0ZpbmlzaGVkIG1pZ3JhdGluZy4nKTtcblx0XHR1bmxvY2soKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdGlmIChjdXJyZW50VmVyc2lvbiA9PT0gdmVyc2lvbikge1xuXHRcdGlmICh0aGlzLm9wdGlvbnMubG9nSWZMYXRlc3QpIHtcblx0XHRcdGxvZy5pbmZvKGBOb3QgbWlncmF0aW5nLCBhbHJlYWR5IGF0IHZlcnNpb24gJHsgdmVyc2lvbiB9YCk7XG5cdFx0fVxuXHRcdHVubG9jaygpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0Y29uc3Qgc3RhcnRJZHggPSB0aGlzLl9maW5kSW5kZXhCeVZlcnNpb24oY3VycmVudFZlcnNpb24pO1xuXHRjb25zdCBlbmRJZHggPSB0aGlzLl9maW5kSW5kZXhCeVZlcnNpb24odmVyc2lvbik7XG5cblx0Ly8gbG9nLmluZm8oJ3N0YXJ0SWR4OicgKyBzdGFydElkeCArICcgZW5kSWR4OicgKyBlbmRJZHgpO1xuXHRsb2cuaW5mbyhgTWlncmF0aW5nIGZyb20gdmVyc2lvbiAkeyB0aGlzLl9saXN0W3N0YXJ0SWR4XS52ZXJzaW9uIH0gLT4gJHsgdGhpcy5fbGlzdFtlbmRJZHhdLnZlcnNpb24gfWApO1xuXG5cdC8vIHJ1biB0aGUgYWN0dWFsIG1pZ3JhdGlvblxuXHRmdW5jdGlvbiBtaWdyYXRlKGRpcmVjdGlvbiwgaWR4KSB7XG5cdFx0Y29uc3QgbWlncmF0aW9uID0gc2VsZi5fbGlzdFtpZHhdO1xuXG5cdFx0aWYgKHR5cGVvZiBtaWdyYXRpb25bZGlyZWN0aW9uXSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dW5sb2NrKCk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGBDYW5ub3QgbWlncmF0ZSAkeyBkaXJlY3Rpb24gfSBvbiB2ZXJzaW9uICR7IG1pZ3JhdGlvbi52ZXJzaW9uIH1gKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBtYXliZU5hbWUoKSB7XG5cdFx0XHRyZXR1cm4gbWlncmF0aW9uLm5hbWUgPyBgICgkeyBtaWdyYXRpb24ubmFtZSB9KWAgOiAnJztcblx0XHR9XG5cblx0XHRsb2cuaW5mbyhgUnVubmluZyAkeyBkaXJlY3Rpb24gfSgpIG9uIHZlcnNpb24gJHsgbWlncmF0aW9uLnZlcnNpb24gfSR7IG1heWJlTmFtZSgpIH1gKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5fQ2FjaGVDb250cm9sLndpdGhWYWx1ZShmYWxzZSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdG1pZ3JhdGlvbltkaXJlY3Rpb25dKG1pZ3JhdGlvbik7XG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhtYWtlQUJveChbXG5cdFx0XHRcdCdFUlJPUiEgU0VSVkVSIFNUT1BQRUQnLFxuXHRcdFx0XHQnJyxcblx0XHRcdFx0J1lvdXIgZGF0YWJhc2UgbWlncmF0aW9uIGZhaWxlZDonLFxuXHRcdFx0XHRlLm1lc3NhZ2UsXG5cdFx0XHRcdCcnLFxuXHRcdFx0XHQnUGxlYXNlIG1ha2Ugc3VyZSB5b3UgYXJlIHJ1bm5pbmcgdGhlIGxhdGVzdCB2ZXJzaW9uIGFuZCB0cnkgYWdhaW4uJyxcblx0XHRcdFx0J0lmIHRoZSBwcm9ibGVtIHBlcnNpc3RzLCBwbGVhc2UgY29udGFjdCBzdXBwb3J0LicsXG5cdFx0XHRcdCcnLFxuXHRcdFx0XHRgVGhpcyBSb2NrZXQuQ2hhdCB2ZXJzaW9uOiAkeyBSb2NrZXRDaGF0LkluZm8udmVyc2lvbiB9YCxcblx0XHRcdFx0YERhdGFiYXNlIGxvY2tlZCBhdCB2ZXJzaW9uOiAkeyBjb250cm9sLnZlcnNpb24gfWAsXG5cdFx0XHRcdGBEYXRhYmFzZSB0YXJnZXQgdmVyc2lvbjogJHsgdmVyc2lvbiB9YCxcblx0XHRcdFx0JycsXG5cdFx0XHRcdGBDb21taXQ6ICR7IFJvY2tldENoYXQuSW5mby5jb21taXQuaGFzaCB9YCxcblx0XHRcdFx0YERhdGU6ICR7IFJvY2tldENoYXQuSW5mby5jb21taXQuZGF0ZSB9YCxcblx0XHRcdFx0YEJyYW5jaDogJHsgUm9ja2V0Q2hhdC5JbmZvLmNvbW1pdC5icmFuY2ggfWAsXG5cdFx0XHRcdGBUYWc6ICR7IFJvY2tldENoYXQuSW5mby5jb21taXQudGFnIH1gXG5cdFx0XHRdKSk7XG5cdFx0XHRwcm9jZXNzLmV4aXQoMSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gUmV0dXJucyB0cnVlIGlmIGxvY2sgd2FzIGFjcXVpcmVkLlxuXHRmdW5jdGlvbiBsb2NrKCkge1xuXHRcdGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpO1xuXHRcdGNvbnN0IGRhdGVNaW51c0ludGVydmFsID0gbW9tZW50KGRhdGUpLnN1YnRyYWN0KHNlbGYub3B0aW9ucy5sb2NrRXhwaXJhdGlvbiwgJ21pbnV0ZXMnKS50b0RhdGUoKTtcblx0XHRjb25zdCBidWlsZCA9IFJvY2tldENoYXQuSW5mbyA/IFJvY2tldENoYXQuSW5mby5idWlsZC5kYXRlIDogZGF0ZTtcblxuXHRcdC8vIFRoaXMgaXMgYXRvbWljLiBUaGUgc2VsZWN0b3IgZW5zdXJlcyBvbmx5IG9uZSBjYWxsZXIgYXQgYSB0aW1lIHdpbGwgc2VlXG5cdFx0Ly8gdGhlIHVubG9ja2VkIGNvbnRyb2wsIGFuZCBsb2NraW5nIG9jY3VycyBpbiB0aGUgc2FtZSB1cGRhdGUncyBtb2RpZmllci5cblx0XHQvLyBBbGwgb3RoZXIgc2ltdWx0YW5lb3VzIGNhbGxlcnMgd2lsbCBnZXQgZmFsc2UgYmFjayBmcm9tIHRoZSB1cGRhdGUuXG5cdFx0cmV0dXJuIHNlbGYuX2NvbGxlY3Rpb24udXBkYXRlKHtcblx0XHRcdF9pZDogJ2NvbnRyb2wnLFxuXHRcdFx0JG9yOiBbe1xuXHRcdFx0XHRsb2NrZWQ6IGZhbHNlXG5cdFx0XHR9LCB7XG5cdFx0XHRcdGxvY2tlZEF0OiB7XG5cdFx0XHRcdFx0JGx0OiBkYXRlTWludXNJbnRlcnZhbFxuXHRcdFx0XHR9XG5cdFx0XHR9LCB7XG5cdFx0XHRcdGJ1aWxkQXQ6IHtcblx0XHRcdFx0XHQkbmU6IGJ1aWxkXG5cdFx0XHRcdH1cblx0XHRcdH1dXG5cdFx0fSwge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRsb2NrZWQ6IHRydWUsXG5cdFx0XHRcdGxvY2tlZEF0OiBkYXRlLFxuXHRcdFx0XHRidWlsZEF0OiBidWlsZFxuXHRcdFx0fVxuXHRcdH0pID09PSAxO1xuXHR9XG5cblxuXHQvLyBTaWRlIGVmZmVjdDogc2F2ZXMgdmVyc2lvbi5cblx0ZnVuY3Rpb24gdW5sb2NrKCkge1xuXHRcdHNlbGYuX3NldENvbnRyb2woe1xuXHRcdFx0bG9ja2VkOiBmYWxzZSxcblx0XHRcdHZlcnNpb246IGN1cnJlbnRWZXJzaW9uXG5cdFx0fSk7XG5cdH1cblxuXHRpZiAoY3VycmVudFZlcnNpb24gPCB2ZXJzaW9uKSB7XG5cdFx0Zm9yIChsZXQgaSA9IHN0YXJ0SWR4OyBpIDwgZW5kSWR4OyBpKyspIHtcblx0XHRcdG1pZ3JhdGUoJ3VwJywgaSArIDEpO1xuXHRcdFx0Y3VycmVudFZlcnNpb24gPSBzZWxmLl9saXN0W2kgKyAxXS52ZXJzaW9uO1xuXHRcdFx0c2VsZi5fc2V0Q29udHJvbCh7XG5cdFx0XHRcdGxvY2tlZDogdHJ1ZSxcblx0XHRcdFx0dmVyc2lvbjogY3VycmVudFZlcnNpb25cblx0XHRcdH0pO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPiBlbmRJZHg7IGktLSkge1xuXHRcdFx0bWlncmF0ZSgnZG93bicsIGkpO1xuXHRcdFx0Y3VycmVudFZlcnNpb24gPSBzZWxmLl9saXN0W2kgLSAxXS52ZXJzaW9uO1xuXHRcdFx0c2VsZi5fc2V0Q29udHJvbCh7XG5cdFx0XHRcdGxvY2tlZDogdHJ1ZSxcblx0XHRcdFx0dmVyc2lvbjogY3VycmVudFZlcnNpb25cblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdHVubG9jaygpO1xuXHRsb2cuaW5mbygnRmluaXNoZWQgbWlncmF0aW5nLicpO1xufTtcblxuLy8gZ2V0cyB0aGUgY3VycmVudCBjb250cm9sIHJlY29yZCwgb3B0aW9uYWxseSBjcmVhdGluZyBpdCBpZiBub24tZXhpc3RhbnRcbk1pZ3JhdGlvbnMuX2dldENvbnRyb2wgPSBmdW5jdGlvbigpIHtcblx0Y29uc3QgY29udHJvbCA9IHRoaXMuX2NvbGxlY3Rpb24uZmluZE9uZSh7XG5cdFx0X2lkOiAnY29udHJvbCdcblx0fSk7XG5cblx0cmV0dXJuIGNvbnRyb2wgfHwgdGhpcy5fc2V0Q29udHJvbCh7XG5cdFx0dmVyc2lvbjogMCxcblx0XHRsb2NrZWQ6IGZhbHNlXG5cdH0pO1xufTtcblxuLy8gc2V0cyB0aGUgY29udHJvbCByZWNvcmRcbk1pZ3JhdGlvbnMuX3NldENvbnRyb2wgPSBmdW5jdGlvbihjb250cm9sKSB7XG5cdC8vIGJlIHF1aXRlIHN0cmljdFxuXHRjaGVjayhjb250cm9sLnZlcnNpb24sIE51bWJlcik7XG5cdGNoZWNrKGNvbnRyb2wubG9ja2VkLCBCb29sZWFuKTtcblxuXHR0aGlzLl9jb2xsZWN0aW9uLnVwZGF0ZSh7XG5cdFx0X2lkOiAnY29udHJvbCdcblx0fSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdHZlcnNpb246IGNvbnRyb2wudmVyc2lvbixcblx0XHRcdGxvY2tlZDogY29udHJvbC5sb2NrZWRcblx0XHR9XG5cdH0sIHtcblx0XHR1cHNlcnQ6IHRydWVcblx0fSk7XG5cblx0cmV0dXJuIGNvbnRyb2w7XG59O1xuXG4vLyByZXR1cm5zIHRoZSBtaWdyYXRpb24gaW5kZXggaW4gX2xpc3Qgb3IgdGhyb3dzIGlmIG5vdCBmb3VuZFxuTWlncmF0aW9ucy5fZmluZEluZGV4QnlWZXJzaW9uID0gZnVuY3Rpb24odmVyc2lvbikge1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2xpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAodGhpcy5fbGlzdFtpXS52ZXJzaW9uID09PSB2ZXJzaW9uKSB7IHJldHVybiBpOyB9XG5cdH1cblxuXHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGBDYW4ndCBmaW5kIG1pZ3JhdGlvbiB2ZXJzaW9uICR7IHZlcnNpb24gfWApO1xufTtcblxuLy9yZXNldCAobWFpbmx5IGludGVuZGVkIGZvciB0ZXN0cylcbk1pZ3JhdGlvbnMuX3Jlc2V0ID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuX2xpc3QgPSBbe1xuXHRcdHZlcnNpb246IDAsXG5cdFx0dXAoKSB7fVxuXHR9XTtcblx0dGhpcy5fY29sbGVjdGlvbi5yZW1vdmUoe30pO1xufTtcblxuUm9ja2V0Q2hhdC5NaWdyYXRpb25zID0gTWlncmF0aW9ucztcbiJdfQ==
