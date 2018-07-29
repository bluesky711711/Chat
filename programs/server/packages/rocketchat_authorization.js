(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var roles;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:authorization":{"lib":{"rocketchat.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/lib/rocketchat.js                                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz = {};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"models":{"Permissions.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Permissions.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
class ModelPermissions extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
  } // FIND


  findByRole(role, options) {
    const query = {
      roles: role
    };
    return this.find(query, options);
  }

  findOneById(_id) {
    return this.findOne(_id);
  }

  createOrUpdate(name, roles) {
    this.upsert({
      _id: name
    }, {
      $set: {
        roles
      }
    });
  }

  addRole(permission, role) {
    this.update({
      _id: permission
    }, {
      $addToSet: {
        roles: role
      }
    });
  }

  removeRole(permission, role) {
    this.update({
      _id: permission
    }, {
      $pull: {
        roles: role
      }
    });
  }

}

RocketChat.models.Permissions = new ModelPermissions('permissions', true);
RocketChat.models.Permissions.cache.load();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Roles.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Roles.js                                                     //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
class ModelRoles extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
    this.tryEnsureIndex({
      'name': 1
    });
    this.tryEnsureIndex({
      'scope': 1
    });
  }

  findUsersInRole(name, scope, options) {
    const role = this.findOne(name);
    const roleScope = role && role.scope || 'Users';
    const model = RocketChat.models[roleScope];
    return model && model.findUsersInRoles && model.findUsersInRoles(name, scope, options);
  }

  isUserInRoles(userId, roles, scope) {
    roles = [].concat(roles);
    return roles.some(roleName => {
      const role = this.findOne(roleName);
      const roleScope = role && role.scope || 'Users';
      const model = RocketChat.models[roleScope];
      return model && model.isUserInRole && model.isUserInRole(userId, roleName, scope);
    });
  }

  createOrUpdate(name, scope = 'Users', description, protectedRole) {
    const updateData = {};
    updateData.name = name;
    updateData.scope = scope;

    if (description != null) {
      updateData.description = description;
    }

    if (protectedRole) {
      updateData.protected = protectedRole;
    }

    this.upsert({
      _id: name
    }, {
      $set: updateData
    });
  }

  addUserRoles(userId, roles, scope) {
    roles = [].concat(roles);

    for (const roleName of roles) {
      const role = this.findOne(roleName);
      const roleScope = role && role.scope || 'Users';
      const model = RocketChat.models[roleScope];
      model && model.addRolesByUserId && model.addRolesByUserId(userId, roleName, scope);
    }

    return true;
  }

  removeUserRoles(userId, roles, scope) {
    roles = [].concat(roles);

    for (const roleName of roles) {
      const role = this.findOne(roleName);
      const roleScope = role && role.scope || 'Users';
      const model = RocketChat.models[roleScope];
      model && model.removeRolesByUserId && model.removeRolesByUserId(userId, roleName, scope);
    }

    return true;
  }

}

RocketChat.models.Roles = new ModelRoles('roles', true);
RocketChat.models.Roles.cache.load();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Base.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Base.js                                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.models._Base.prototype.roleBaseQuery = function ()
/*userId, scope*/
{
  return;
};

RocketChat.models._Base.prototype.findRolesByUserId = function (userId
/*, options*/
) {
  const query = this.roleBaseQuery(userId);
  return this.find(query, {
    fields: {
      roles: 1
    }
  });
};

RocketChat.models._Base.prototype.isUserInRole = function (userId, roleName, scope) {
  const query = this.roleBaseQuery(userId, scope);

  if (query == null) {
    return false;
  }

  query.roles = roleName;
  return !_.isUndefined(this.findOne(query, {
    fields: {
      roles: 1
    }
  }));
};

RocketChat.models._Base.prototype.addRolesByUserId = function (userId, roles, scope) {
  roles = [].concat(roles);
  const query = this.roleBaseQuery(userId, scope);
  const update = {
    $addToSet: {
      roles: {
        $each: roles
      }
    }
  };
  return this.update(query, update);
};

RocketChat.models._Base.prototype.removeRolesByUserId = function (userId, roles, scope) {
  roles = [].concat(roles);
  const query = this.roleBaseQuery(userId, scope);
  const update = {
    $pullAll: {
      roles
    }
  };
  return this.update(query, update);
};

RocketChat.models._Base.prototype.findUsersInRoles = function () {
  throw new Meteor.Error('overwrite-function', 'You must overwrite this function in the extended classes');
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Users.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Users.js                                                     //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.models.Users.roleBaseQuery = function (userId) {
  return {
    _id: userId
  };
};

RocketChat.models.Users.findUsersInRoles = function (roles, scope, options) {
  roles = [].concat(roles);
  const query = {
    roles: {
      $in: roles
    }
  };
  return this.find(query, options);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Subscriptions.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Subscriptions.js                                             //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.models.Subscriptions.roleBaseQuery = function (userId, scope) {
  if (scope == null) {
    return;
  }

  const query = {
    'u._id': userId
  };

  if (!_.isUndefined(scope)) {
    query.rid = scope;
  }

  return query;
};

RocketChat.models.Subscriptions.findUsersInRoles = function (roles, scope, options) {
  roles = [].concat(roles);
  const query = {
    roles: {
      $in: roles
    }
  };

  if (scope) {
    query.rid = scope;
  }

  const subscriptions = this.find(query).fetch();

  const users = _.compact(_.map(subscriptions, function (subscription) {
    if ('undefined' !== typeof subscription.u && 'undefined' !== typeof subscription.u._id) {
      return subscription.u._id;
    }
  }));

  return RocketChat.models.Users.find({
    _id: {
      $in: users
    }
  }, options);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"addUserRoles.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/addUserRoles.js                                           //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.authz.addUserRoles = function (userId, roleNames, scope) {
  if (!userId || !roleNames) {
    return false;
  }

  const user = RocketChat.models.Users.db.findOneById(userId);

  if (!user) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user', {
      function: 'RocketChat.authz.addUserRoles'
    });
  }

  roleNames = [].concat(roleNames);

  const existingRoleNames = _.pluck(RocketChat.authz.getRoles(), '_id');

  const invalidRoleNames = _.difference(roleNames, existingRoleNames);

  if (!_.isEmpty(invalidRoleNames)) {
    for (const role of invalidRoleNames) {
      RocketChat.models.Roles.createOrUpdate(role);
    }
  }

  RocketChat.models.Roles.addUserRoles(userId, roleNames, scope);
  return true;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"canAccessRoom.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/canAccessRoom.js                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* globals RocketChat */
RocketChat.authz.roomAccessValidators = [function (room, user = {}) {
  if (room.t === 'c') {
    if (!user._id && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
      return true;
    }

    return RocketChat.authz.hasPermission(user._id, 'view-c-room');
  }
}, function (room, user = {}) {
  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);

  if (subscription) {
    return subscription._room;
  }
}];

RocketChat.authz.canAccessRoom = function (room, user, extraData) {
  return RocketChat.authz.roomAccessValidators.some(validator => {
    return validator.call(this, room, user, extraData);
  });
};

RocketChat.authz.addRoomAccessValidator = function (validator) {
  RocketChat.authz.roomAccessValidators.push(validator);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getRoles.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/getRoles.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz.getRoles = function () {
  return RocketChat.models.Roles.find().fetch();
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUsersInRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/getUsersInRole.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz.getUsersInRole = function (roleName, scope, options) {
  return RocketChat.models.Roles.findUsersInRole(roleName, scope, options);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hasPermission.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/hasPermission.js                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
function atLeastOne(userId, permissions = [], scope) {
  return permissions.some(permissionId => {
    const permission = RocketChat.models.Permissions.findOne(permissionId);
    return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
  });
}

function all(userId, permissions = [], scope) {
  return permissions.every(permissionId => {
    const permission = RocketChat.models.Permissions.findOne(permissionId);
    return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
  });
}

function hasPermission(userId, permissions, scope, strategy) {
  if (!userId) {
    return false;
  }

  permissions = [].concat(permissions);
  return strategy(userId, permissions, scope);
}

RocketChat.authz.hasAllPermission = function (userId, permissions, scope) {
  return hasPermission(userId, permissions, scope, all);
};

RocketChat.authz.hasPermission = RocketChat.authz.hasAllPermission;

RocketChat.authz.hasAtLeastOnePermission = function (userId, permissions, scope) {
  return hasPermission(userId, permissions, scope, atLeastOne);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hasRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/hasRole.js                                                //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz.hasRole = function (userId, roleNames, scope) {
  roleNames = [].concat(roleNames);
  return RocketChat.models.Roles.isUserInRoles(userId, roleNames, scope);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUserFromRoles.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/removeUserFromRoles.js                                    //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.authz.removeUserFromRoles = function (userId, roleNames, scope) {
  if (!userId || !roleNames) {
    return false;
  }

  const user = RocketChat.models.Users.findOneById(userId);

  if (!user) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user', {
      function: 'RocketChat.authz.removeUserFromRoles'
    });
  }

  roleNames = [].concat(roleNames);

  const existingRoleNames = _.pluck(RocketChat.authz.getRoles(), '_id');

  const invalidRoleNames = _.difference(roleNames, existingRoleNames);

  if (!_.isEmpty(invalidRoleNames)) {
    throw new Meteor.Error('error-invalid-role', 'Invalid role', {
      function: 'RocketChat.authz.removeUserFromRoles'
    });
  }

  RocketChat.models.Roles.removeUserRoles(userId, roleNames, scope);
  return true;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"permissions.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/publications/permissions.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'permissions/get'(updatedAt) {
    this.unblock();
    const records = RocketChat.models.Permissions.find().fetch();

    if (updatedAt instanceof Date) {
      return {
        update: records.filter(record => {
          return record._updatedAt > updatedAt;
        }),
        remove: RocketChat.models.Permissions.trashFindDeletedAfter(updatedAt, {}, {
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
RocketChat.models.Permissions.on('changed', (type, permission) => {
  RocketChat.Notifications.notifyLoggedInThisInstance('permissions-changed', type, permission);
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roles.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/publications/roles.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.publish('roles', function () {
  if (!this.userId) {
    return this.ready();
  }

  return RocketChat.models.Roles.find();
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"usersInRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/publications/usersInRole.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.publish('usersInRole', function (roleName, scope, limit = 50) {
  if (!this.userId) {
    return this.ready();
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'access-permissions')) {
    return this.error(new Meteor.Error('error-not-allowed', 'Not allowed', {
      publish: 'usersInRole'
    }));
  }

  const options = {
    limit,
    sort: {
      name: 1
    }
  };
  return RocketChat.authz.getUsersInRole(roleName, scope, options);
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addUserToRole.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/addUserToRole.js                                            //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'authorization:addUserToRole'(roleName, username, scope) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:addUserToRole',
        action: 'Accessing_permissions'
      });
    }

    if (!roleName || !_.isString(roleName) || !username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'authorization:addUserToRole'
      });
    }

    if (roleName === 'admin' && !RocketChat.authz.hasPermission(Meteor.userId(), 'assign-admin-role')) {
      throw new Meteor.Error('error-action-not-allowed', 'Assigning admin is not allowed', {
        method: 'authorization:addUserToRole',
        action: 'Assign_admin'
      });
    }

    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user || !user._id) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'authorization:addUserToRole'
      });
    }

    const add = RocketChat.models.Roles.addUserRoles(user._id, roleName, scope);

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'added',
        _id: roleName,
        u: {
          _id: user._id,
          username
        },
        scope
      });
    }

    return add;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/deleteRole.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:deleteRole'(roleName) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:deleteRole',
        action: 'Accessing_permissions'
      });
    }

    const role = RocketChat.models.Roles.findOne(roleName);

    if (!role) {
      throw new Meteor.Error('error-invalid-role', 'Invalid role', {
        method: 'authorization:deleteRole'
      });
    }

    if (role.protected) {
      throw new Meteor.Error('error-delete-protected-role', 'Cannot delete a protected role', {
        method: 'authorization:deleteRole'
      });
    }

    const roleScope = role.scope || 'Users';
    const model = RocketChat.models[roleScope];
    const existingUsers = model && model.findUsersInRoles && model.findUsersInRoles(roleName);

    if (existingUsers && existingUsers.count() > 0) {
      throw new Meteor.Error('error-role-in-use', 'Cannot delete role because it\'s in use', {
        method: 'authorization:deleteRole'
      });
    }

    return RocketChat.models.Roles.remove(role.name);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUserFromRole.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/removeUserFromRole.js                                       //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'authorization:removeUserFromRole'(roleName, username, scope) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Access permissions is not allowed', {
        method: 'authorization:removeUserFromRole',
        action: 'Accessing_permissions'
      });
    }

    if (!roleName || !_.isString(roleName) || !username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'authorization:removeUserFromRole'
      });
    }

    const user = Meteor.users.findOne({
      username
    }, {
      fields: {
        _id: 1,
        roles: 1
      }
    });

    if (!user || !user._id) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'authorization:removeUserFromRole'
      });
    } // prevent removing last user from admin role


    if (roleName === 'admin') {
      const adminCount = Meteor.users.find({
        roles: {
          $in: ['admin']
        }
      }).count();
      const userIsAdmin = user.roles.indexOf('admin') > -1;

      if (adminCount === 1 && userIsAdmin) {
        throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
          method: 'removeUserFromRole',
          action: 'Remove_last_admin'
        });
      }
    }

    const remove = RocketChat.models.Roles.removeUserRoles(user._id, roleName, scope);

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'removed',
        _id: roleName,
        u: {
          _id: user._id,
          username
        },
        scope
      });
    }

    return remove;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/saveRole.js                                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:saveRole'(roleData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:saveRole',
        action: 'Accessing_permissions'
      });
    }

    if (!roleData.name) {
      throw new Meteor.Error('error-role-name-required', 'Role name is required', {
        method: 'authorization:saveRole'
      });
    }

    if (['Users', 'Subscriptions'].includes(roleData.scope) === false) {
      roleData.scope = 'Users';
    }

    const update = RocketChat.models.Roles.createOrUpdate(roleData.name, roleData.scope, roleData.description);

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'changed',
        _id: roleData.name
      });
    }

    return update;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addPermissionToRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/addPermissionToRole.js                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:addPermissionToRole'(permission, role) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
        method: 'authorization:addPermissionToRole',
        action: 'Adding_permission'
      });
    }

    return RocketChat.models.Permissions.addRole(permission, role);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeRoleFromPermission.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/removeRoleFromPermission.js                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:removeRoleFromPermission'(permission, role) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:removeRoleFromPermission',
        action: 'Accessing_permissions'
      });
    }

    return RocketChat.models.Permissions.removeRole(permission, role);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/startup.js                                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* eslint no-multi-spaces: 0 */
Meteor.startup(function () {
  // Note:
  // 1.if we need to create a role that can only edit channel message, but not edit group message
  // then we can define edit-<type>-message instead of edit-message
  // 2. admin, moderator, and user roles should not be deleted as they are referened in the code.
  const permissions = [{
    _id: 'access-permissions',
    roles: ['admin']
  }, {
    _id: 'add-oauth-service',
    roles: ['admin']
  }, {
    _id: 'add-user-to-joined-room',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'add-user-to-any-c-room',
    roles: ['admin']
  }, {
    _id: 'add-user-to-any-p-room',
    roles: []
  }, {
    _id: 'archive-room',
    roles: ['admin', 'owner']
  }, {
    _id: 'assign-admin-role',
    roles: ['admin']
  }, {
    _id: 'ban-user',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'bulk-create-c',
    roles: ['admin']
  }, {
    _id: 'bulk-register-user',
    roles: ['admin']
  }, {
    _id: 'create-c',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'create-d',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'create-p',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'create-user',
    roles: ['admin']
  }, {
    _id: 'clean-channel-history',
    roles: ['admin']
  }, // special permission to bulk delete a channel's mesages
  {
    _id: 'delete-c',
    roles: ['admin', 'owner']
  }, {
    _id: 'delete-d',
    roles: ['admin']
  }, {
    _id: 'delete-message',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'delete-p',
    roles: ['admin', 'owner']
  }, {
    _id: 'delete-user',
    roles: ['admin']
  }, {
    _id: 'edit-message',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'edit-other-user-active-status',
    roles: ['admin']
  }, {
    _id: 'edit-other-user-info',
    roles: ['admin']
  }, {
    _id: 'edit-other-user-password',
    roles: ['admin']
  }, {
    _id: 'edit-privileged-setting',
    roles: ['admin']
  }, {
    _id: 'edit-room',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'force-delete-message',
    roles: ['admin', 'owner']
  }, {
    _id: 'join-without-join-code',
    roles: ['admin', 'bot']
  }, {
    _id: 'leave-c',
    roles: ['admin', 'user', 'bot', 'anonymous']
  }, {
    _id: 'leave-p',
    roles: ['admin', 'user', 'bot', 'anonymous']
  }, {
    _id: 'manage-assets',
    roles: ['admin']
  }, {
    _id: 'manage-emoji',
    roles: ['admin']
  }, {
    _id: 'manage-integrations',
    roles: ['admin']
  }, {
    _id: 'manage-own-integrations',
    roles: ['admin', 'bot']
  }, {
    _id: 'manage-oauth-apps',
    roles: ['admin']
  }, {
    _id: 'mention-all',
    roles: ['admin', 'owner', 'moderator', 'user']
  }, {
    _id: 'mention-here',
    roles: ['admin', 'owner', 'moderator', 'user']
  }, {
    _id: 'mute-user',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'remove-user',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'run-import',
    roles: ['admin']
  }, {
    _id: 'run-migration',
    roles: ['admin']
  }, {
    _id: 'set-moderator',
    roles: ['admin', 'owner']
  }, {
    _id: 'set-owner',
    roles: ['admin', 'owner']
  }, {
    _id: 'send-many-messages',
    roles: ['admin', 'bot']
  }, {
    _id: 'set-leader',
    roles: ['admin', 'owner']
  }, {
    _id: 'unarchive-room',
    roles: ['admin']
  }, {
    _id: 'view-c-room',
    roles: ['admin', 'user', 'bot', 'anonymous']
  }, {
    _id: 'user-generate-access-token',
    roles: ['admin']
  }, {
    _id: 'view-d-room',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'view-full-other-user-info',
    roles: ['admin']
  }, {
    _id: 'view-history',
    roles: ['admin', 'user', 'anonymous']
  }, {
    _id: 'view-joined-room',
    roles: ['guest', 'bot', 'anonymous']
  }, {
    _id: 'view-join-code',
    roles: ['admin']
  }, {
    _id: 'view-logs',
    roles: ['admin']
  }, {
    _id: 'view-other-user-channels',
    roles: ['admin']
  }, {
    _id: 'view-p-room',
    roles: ['admin', 'user', 'anonymous']
  }, {
    _id: 'view-privileged-setting',
    roles: ['admin']
  }, {
    _id: 'view-room-administration',
    roles: ['admin']
  }, {
    _id: 'view-statistics',
    roles: ['admin']
  }, {
    _id: 'view-user-administration',
    roles: ['admin']
  }, {
    _id: 'preview-c-room',
    roles: ['admin', 'user', 'anonymous']
  }, {
    _id: 'view-outside-room',
    roles: ['admin', 'owner', 'moderator', 'user']
  }, {
    _id: 'view-broadcast-member-list',
    roles: ['admin', 'owner', 'moderator']
  }];

  for (const permission of permissions) {
    if (!RocketChat.models.Permissions.findOneById(permission._id)) {
      RocketChat.models.Permissions.upsert(permission._id, {
        $set: permission
      });
    }
  }

  const defaultRoles = [{
    name: 'admin',
    scope: 'Users',
    description: 'Admin'
  }, {
    name: 'moderator',
    scope: 'Subscriptions',
    description: 'Moderator'
  }, {
    name: 'leader',
    scope: 'Subscriptions',
    description: 'Leader'
  }, {
    name: 'owner',
    scope: 'Subscriptions',
    description: 'Owner'
  }, {
    name: 'user',
    scope: 'Users',
    description: ''
  }, {
    name: 'bot',
    scope: 'Users',
    description: ''
  }, {
    name: 'guest',
    scope: 'Users',
    description: ''
  }, {
    name: 'anonymous',
    scope: 'Users',
    description: ''
  }];

  for (const role of defaultRoles) {
    RocketChat.models.Roles.upsert({
      _id: role.name
    }, {
      $setOnInsert: {
        scope: role.scope,
        description: role.description || '',
        protected: true
      }
    });
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:authorization/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Permissions.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Roles.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Base.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Users.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Subscriptions.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/addUserRoles.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/canAccessRoom.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/getRoles.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/getUsersInRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/hasPermission.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/hasRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/removeUserFromRoles.js");
require("/node_modules/meteor/rocketchat:authorization/server/publications/permissions.js");
require("/node_modules/meteor/rocketchat:authorization/server/publications/roles.js");
require("/node_modules/meteor/rocketchat:authorization/server/publications/usersInRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/addUserToRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/deleteRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/removeUserFromRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/saveRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/addPermissionToRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/removeRoleFromPermission.js");
require("/node_modules/meteor/rocketchat:authorization/server/startup.js");

/* Exports */
Package._define("rocketchat:authorization");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_authorization.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL2xpYi9yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21vZGVscy9QZXJtaXNzaW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9tb2RlbHMvUm9sZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbW9kZWxzL0Jhc2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbW9kZWxzL1VzZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21vZGVscy9TdWJzY3JpcHRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL2Z1bmN0aW9ucy9hZGRVc2VyUm9sZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvZnVuY3Rpb25zL2NhbkFjY2Vzc1Jvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvZnVuY3Rpb25zL2dldFJvbGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL2Z1bmN0aW9ucy9nZXRVc2Vyc0luUm9sZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9mdW5jdGlvbnMvaGFzUGVybWlzc2lvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9mdW5jdGlvbnMvaGFzUm9sZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9mdW5jdGlvbnMvcmVtb3ZlVXNlckZyb21Sb2xlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9wdWJsaWNhdGlvbnMvcGVybWlzc2lvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvcHVibGljYXRpb25zL3JvbGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL3B1YmxpY2F0aW9ucy91c2Vyc0luUm9sZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9tZXRob2RzL2FkZFVzZXJUb1JvbGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbWV0aG9kcy9kZWxldGVSb2xlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21ldGhvZHMvcmVtb3ZlVXNlckZyb21Sb2xlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21ldGhvZHMvc2F2ZVJvbGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbWV0aG9kcy9hZGRQZXJtaXNzaW9uVG9Sb2xlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21ldGhvZHMvcmVtb3ZlUm9sZUZyb21QZXJtaXNzaW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL3N0YXJ0dXAuanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsImF1dGh6IiwiTW9kZWxQZXJtaXNzaW9ucyIsIm1vZGVscyIsIl9CYXNlIiwiY29uc3RydWN0b3IiLCJhcmd1bWVudHMiLCJmaW5kQnlSb2xlIiwicm9sZSIsIm9wdGlvbnMiLCJxdWVyeSIsInJvbGVzIiwiZmluZCIsImZpbmRPbmVCeUlkIiwiX2lkIiwiZmluZE9uZSIsImNyZWF0ZU9yVXBkYXRlIiwibmFtZSIsInVwc2VydCIsIiRzZXQiLCJhZGRSb2xlIiwicGVybWlzc2lvbiIsInVwZGF0ZSIsIiRhZGRUb1NldCIsInJlbW92ZVJvbGUiLCIkcHVsbCIsIlBlcm1pc3Npb25zIiwiY2FjaGUiLCJsb2FkIiwiTW9kZWxSb2xlcyIsInRyeUVuc3VyZUluZGV4IiwiZmluZFVzZXJzSW5Sb2xlIiwic2NvcGUiLCJyb2xlU2NvcGUiLCJtb2RlbCIsImZpbmRVc2Vyc0luUm9sZXMiLCJpc1VzZXJJblJvbGVzIiwidXNlcklkIiwiY29uY2F0Iiwic29tZSIsInJvbGVOYW1lIiwiaXNVc2VySW5Sb2xlIiwiZGVzY3JpcHRpb24iLCJwcm90ZWN0ZWRSb2xlIiwidXBkYXRlRGF0YSIsInByb3RlY3RlZCIsImFkZFVzZXJSb2xlcyIsImFkZFJvbGVzQnlVc2VySWQiLCJyZW1vdmVVc2VyUm9sZXMiLCJyZW1vdmVSb2xlc0J5VXNlcklkIiwiUm9sZXMiLCJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJwcm90b3R5cGUiLCJyb2xlQmFzZVF1ZXJ5IiwiZmluZFJvbGVzQnlVc2VySWQiLCJmaWVsZHMiLCJpc1VuZGVmaW5lZCIsIiRlYWNoIiwiJHB1bGxBbGwiLCJNZXRlb3IiLCJFcnJvciIsIlVzZXJzIiwiJGluIiwiU3Vic2NyaXB0aW9ucyIsInJpZCIsInN1YnNjcmlwdGlvbnMiLCJmZXRjaCIsInVzZXJzIiwiY29tcGFjdCIsIm1hcCIsInN1YnNjcmlwdGlvbiIsInUiLCJyb2xlTmFtZXMiLCJ1c2VyIiwiZGIiLCJmdW5jdGlvbiIsImV4aXN0aW5nUm9sZU5hbWVzIiwicGx1Y2siLCJnZXRSb2xlcyIsImludmFsaWRSb2xlTmFtZXMiLCJkaWZmZXJlbmNlIiwiaXNFbXB0eSIsInJvb21BY2Nlc3NWYWxpZGF0b3JzIiwicm9vbSIsInQiLCJzZXR0aW5ncyIsImdldCIsImhhc1Blcm1pc3Npb24iLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJfcm9vbSIsImNhbkFjY2Vzc1Jvb20iLCJleHRyYURhdGEiLCJ2YWxpZGF0b3IiLCJjYWxsIiwiYWRkUm9vbUFjY2Vzc1ZhbGlkYXRvciIsInB1c2giLCJnZXRVc2Vyc0luUm9sZSIsImF0TGVhc3RPbmUiLCJwZXJtaXNzaW9ucyIsInBlcm1pc3Npb25JZCIsImFsbCIsImV2ZXJ5Iiwic3RyYXRlZ3kiLCJoYXNBbGxQZXJtaXNzaW9uIiwiaGFzQXRMZWFzdE9uZVBlcm1pc3Npb24iLCJoYXNSb2xlIiwicmVtb3ZlVXNlckZyb21Sb2xlcyIsIm1ldGhvZHMiLCJ1cGRhdGVkQXQiLCJ1bmJsb2NrIiwicmVjb3JkcyIsIkRhdGUiLCJmaWx0ZXIiLCJyZWNvcmQiLCJfdXBkYXRlZEF0IiwicmVtb3ZlIiwidHJhc2hGaW5kRGVsZXRlZEFmdGVyIiwiX2RlbGV0ZWRBdCIsIm9uIiwidHlwZSIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlMb2dnZWRJblRoaXNJbnN0YW5jZSIsInB1Ymxpc2giLCJyZWFkeSIsImxpbWl0IiwiZXJyb3IiLCJzb3J0IiwidXNlcm5hbWUiLCJtZXRob2QiLCJhY3Rpb24iLCJpc1N0cmluZyIsImZpbmRPbmVCeVVzZXJuYW1lIiwiYWRkIiwibm90aWZ5TG9nZ2VkIiwiZXhpc3RpbmdVc2VycyIsImNvdW50IiwiYWRtaW5Db3VudCIsInVzZXJJc0FkbWluIiwiaW5kZXhPZiIsInJvbGVEYXRhIiwiaW5jbHVkZXMiLCJzdGFydHVwIiwiZGVmYXVsdFJvbGVzIiwiJHNldE9uSW5zZXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsS0FBWCxHQUFtQixFQUFuQixDOzs7Ozs7Ozs7OztBQ0FBLE1BQU1DLGdCQUFOLFNBQStCRixXQUFXRyxNQUFYLENBQWtCQyxLQUFqRCxDQUF1RDtBQUN0REMsZ0JBQWM7QUFDYixVQUFNLEdBQUdDLFNBQVQ7QUFDQSxHQUhxRCxDQUt0RDs7O0FBQ0FDLGFBQVdDLElBQVgsRUFBaUJDLE9BQWpCLEVBQTBCO0FBQ3pCLFVBQU1DLFFBQVE7QUFDYkMsYUFBT0g7QUFETSxLQUFkO0FBSUEsV0FBTyxLQUFLSSxJQUFMLENBQVVGLEtBQVYsRUFBaUJELE9BQWpCLENBQVA7QUFDQTs7QUFFREksY0FBWUMsR0FBWixFQUFpQjtBQUNoQixXQUFPLEtBQUtDLE9BQUwsQ0FBYUQsR0FBYixDQUFQO0FBQ0E7O0FBRURFLGlCQUFlQyxJQUFmLEVBQXFCTixLQUFyQixFQUE0QjtBQUMzQixTQUFLTyxNQUFMLENBQVk7QUFBRUosV0FBS0c7QUFBUCxLQUFaLEVBQTJCO0FBQUVFLFlBQU07QUFBRVI7QUFBRjtBQUFSLEtBQTNCO0FBQ0E7O0FBRURTLFVBQVFDLFVBQVIsRUFBb0JiLElBQXBCLEVBQTBCO0FBQ3pCLFNBQUtjLE1BQUwsQ0FBWTtBQUFFUixXQUFLTztBQUFQLEtBQVosRUFBaUM7QUFBRUUsaUJBQVc7QUFBRVosZUFBT0g7QUFBVDtBQUFiLEtBQWpDO0FBQ0E7O0FBRURnQixhQUFXSCxVQUFYLEVBQXVCYixJQUF2QixFQUE2QjtBQUM1QixTQUFLYyxNQUFMLENBQVk7QUFBRVIsV0FBS087QUFBUCxLQUFaLEVBQWlDO0FBQUVJLGFBQU87QUFBRWQsZUFBT0g7QUFBVDtBQUFULEtBQWpDO0FBQ0E7O0FBNUJxRDs7QUErQnZEUixXQUFXRyxNQUFYLENB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O0FBQTZDVSxpQkFBYTtBQUExRCxHQUpvQixFQUtwQjtBQUFFekIsVUFBTSxNQUFSO0FBQXFCZSxXQUFPLE9BQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQUxvQixFQU1wQjtBQUFFekIsVUFBTSxLQUFSO0FBQXFCZSxXQUFPLE9BQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQU5vQixFQU9wQjtBQUFFekIsVUFBTSxPQUFSO0FBQXFCZSxXQUFPLE9BQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQVBvQixFQVFwQjtBQUFFekIsVUFBTSxXQUFSO0FBQXFCZSxXQUFPLE9BQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQVJvQixDQUFyQjs7QUFXQSxPQUFLLE1BQU1sQyxJQUFYLElBQW1CMkksWUFBbkIsRUFBaUM7QUFDaENuSixlQUFXRyxNQUFYLENBQWtCK0MsS0FBbEIsQ0FBd0JoQyxNQUF4QixDQUErQjtBQUFFSixXQUFLTixLQUFLUztBQUFaLEtBQS9CLEVBQW1EO0FBQUVtSSxvQkFBYztBQUFFcEgsZUFBT3hCLEtBQUt3QixLQUFkO0FBQXFCVSxxQkFBYWxDLEtBQUtrQyxXQUFMLElBQW9CLEVBQXREO0FBQTBERyxtQkFBVztBQUFyRTtBQUFoQixLQUFuRDtBQUNBO0FBQ0QsQ0EzRkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9hdXRob3JpemF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5hdXRoeiA9IHt9O1xuIiwiY2xhc3MgTW9kZWxQZXJtaXNzaW9ucyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoLi4uYXJndW1lbnRzKTtcblx0fVxuXG5cdC8vIEZJTkRcblx0ZmluZEJ5Um9sZShyb2xlLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRyb2xlczogcm9sZVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRPbmVCeUlkKF9pZCkge1xuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUoX2lkKTtcblx0fVxuXG5cdGNyZWF0ZU9yVXBkYXRlKG5hbWUsIHJvbGVzKSB7XG5cdFx0dGhpcy51cHNlcnQoeyBfaWQ6IG5hbWUgfSwgeyAkc2V0OiB7IHJvbGVzIH0gfSk7XG5cdH1cblxuXHRhZGRSb2xlKHBlcm1pc3Npb24sIHJvbGUpIHtcblx0XHR0aGlzLnVwZGF0ZSh7IF9pZDogcGVybWlzc2lvbiB9LCB7ICRhZGRUb1NldDogeyByb2xlczogcm9sZSB9IH0pO1xuXHR9XG5cblx0cmVtb3ZlUm9sZShwZXJtaXNzaW9uLCByb2xlKSB7XG5cdFx0dGhpcy51cGRhdGUoeyBfaWQ6IHBlcm1pc3Npb24gfSwgeyAkcHVsbDogeyByb2xlczogcm9sZSB9IH0pO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zID0gbmV3IE1vZGVsUGVybWlzc2lvbnMoJ3Blcm1pc3Npb25zJywgdHJ1ZSk7XG5Sb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jYWNoZS5sb2FkKCk7XG4iLCJjbGFzcyBNb2RlbFJvbGVzIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnbmFtZSc6IDEgfSk7XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdzY29wZSc6IDEgfSk7XG5cdH1cblxuXHRmaW5kVXNlcnNJblJvbGUobmFtZSwgc2NvcGUsIG9wdGlvbnMpIHtcblx0XHRjb25zdCByb2xlID0gdGhpcy5maW5kT25lKG5hbWUpO1xuXHRcdGNvbnN0IHJvbGVTY29wZSA9IChyb2xlICYmIHJvbGUuc2NvcGUpIHx8ICdVc2Vycyc7XG5cdFx0Y29uc3QgbW9kZWwgPSBSb2NrZXRDaGF0Lm1vZGVsc1tyb2xlU2NvcGVdO1xuXG5cdFx0cmV0dXJuIG1vZGVsICYmIG1vZGVsLmZpbmRVc2Vyc0luUm9sZXMgJiYgbW9kZWwuZmluZFVzZXJzSW5Sb2xlcyhuYW1lLCBzY29wZSwgb3B0aW9ucyk7XG5cdH1cblxuXHRpc1VzZXJJblJvbGVzKHVzZXJJZCwgcm9sZXMsIHNjb3BlKSB7XG5cdFx0cm9sZXMgPSBbXS5jb25jYXQocm9sZXMpO1xuXHRcdHJldHVybiByb2xlcy5zb21lKChyb2xlTmFtZSkgPT4ge1xuXHRcdFx0Y29uc3Qgcm9sZSA9IHRoaXMuZmluZE9uZShyb2xlTmFtZSk7XG5cdFx0XHRjb25zdCByb2xlU2NvcGUgPSAocm9sZSAmJiByb2xlLnNjb3BlKSB8fCAnVXNlcnMnO1xuXHRcdFx0Y29uc3QgbW9kZWwgPSBSb2NrZXRDaGF0Lm1vZGVsc1tyb2xlU2NvcGVdO1xuXG5cdFx0XHRyZXR1cm4gbW9kZWwgJiYgbW9kZWwuaXNVc2VySW5Sb2xlICYmIG1vZGVsLmlzVXNlckluUm9sZSh1c2VySWQsIHJvbGVOYW1lLCBzY29wZSk7XG5cdFx0fSk7XG5cdH1cblxuXHRjcmVhdGVPclVwZGF0ZShuYW1lLCBzY29wZSA9ICdVc2VycycsIGRlc2NyaXB0aW9uLCBwcm90ZWN0ZWRSb2xlKSB7XG5cdFx0Y29uc3QgdXBkYXRlRGF0YSA9IHt9O1xuXHRcdHVwZGF0ZURhdGEubmFtZSA9IG5hbWU7XG5cdFx0dXBkYXRlRGF0YS5zY29wZSA9IHNjb3BlO1xuXG5cdFx0aWYgKGRlc2NyaXB0aW9uICE9IG51bGwpIHtcblx0XHRcdHVwZGF0ZURhdGEuZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcblx0XHR9XG5cblx0XHRpZiAocHJvdGVjdGVkUm9sZSkge1xuXHRcdFx0dXBkYXRlRGF0YS5wcm90ZWN0ZWQgPSBwcm90ZWN0ZWRSb2xlO1xuXHRcdH1cblxuXHRcdHRoaXMudXBzZXJ0KHsgX2lkOiBuYW1lIH0sIHsgJHNldDogdXBkYXRlRGF0YSB9KTtcblx0fVxuXG5cdGFkZFVzZXJSb2xlcyh1c2VySWQsIHJvbGVzLCBzY29wZSkge1xuXHRcdHJvbGVzID0gW10uY29uY2F0KHJvbGVzKTtcblx0XHRmb3IgKGNvbnN0IHJvbGVOYW1lIG9mIHJvbGVzKSB7XG5cdFx0XHRjb25zdCByb2xlID0gdGhpcy5maW5kT25lKHJvbGVOYW1lKTtcblx0XHRcdGNvbnN0IHJvbGVTY29wZSA9IChyb2xlICYmIHJvbGUuc2NvcGUpIHx8ICdVc2Vycyc7XG5cdFx0XHRjb25zdCBtb2RlbCA9IFJvY2tldENoYXQubW9kZWxzW3JvbGVTY29wZV07XG5cblx0XHRcdG1vZGVsICYmIG1vZGVsLmFkZFJvbGVzQnlVc2VySWQgJiYgbW9kZWwuYWRkUm9sZXNCeVVzZXJJZCh1c2VySWQsIHJvbGVOYW1lLCBzY29wZSk7XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cmVtb3ZlVXNlclJvbGVzKHVzZXJJZCwgcm9sZXMsIHNjb3BlKSB7XG5cdFx0cm9sZXMgPSBbXS5jb25jYXQocm9sZXMpO1xuXHRcdGZvciAoY29uc3Qgcm9sZU5hbWUgb2Ygcm9sZXMpIHtcblx0XHRcdGNvbnN0IHJvbGUgPSB0aGlzLmZpbmRPbmUocm9sZU5hbWUpO1xuXHRcdFx0Y29uc3Qgcm9sZVNjb3BlID0gKHJvbGUgJiYgcm9sZS5zY29wZSkgfHwgJ1VzZXJzJztcblx0XHRcdGNvbnN0IG1vZGVsID0gUm9ja2V0Q2hhdC5tb2RlbHNbcm9sZVNjb3BlXTtcblxuXHRcdFx0bW9kZWwgJiYgbW9kZWwucmVtb3ZlUm9sZXNCeVVzZXJJZCAmJiBtb2RlbC5yZW1vdmVSb2xlc0J5VXNlcklkKHVzZXJJZCwgcm9sZU5hbWUsIHNjb3BlKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMgPSBuZXcgTW9kZWxSb2xlcygncm9sZXMnLCB0cnVlKTtcblJvY2tldENoYXQubW9kZWxzLlJvbGVzLmNhY2hlLmxvYWQoKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5fQmFzZS5wcm90b3R5cGUucm9sZUJhc2VRdWVyeSA9IGZ1bmN0aW9uKC8qdXNlcklkLCBzY29wZSovKSB7XG5cdHJldHVybjtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLl9CYXNlLnByb3RvdHlwZS5maW5kUm9sZXNCeVVzZXJJZCA9IGZ1bmN0aW9uKHVzZXJJZC8qLCBvcHRpb25zKi8pIHtcblx0Y29uc3QgcXVlcnkgPSB0aGlzLnJvbGVCYXNlUXVlcnkodXNlcklkKTtcblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgeyBmaWVsZHM6IHsgcm9sZXM6IDEgfSB9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLl9CYXNlLnByb3RvdHlwZS5pc1VzZXJJblJvbGUgPSBmdW5jdGlvbih1c2VySWQsIHJvbGVOYW1lLCBzY29wZSkge1xuXHRjb25zdCBxdWVyeSA9IHRoaXMucm9sZUJhc2VRdWVyeSh1c2VySWQsIHNjb3BlKTtcblxuXHRpZiAocXVlcnkgPT0gbnVsbCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHF1ZXJ5LnJvbGVzID0gcm9sZU5hbWU7XG5cdHJldHVybiAhXy5pc1VuZGVmaW5lZCh0aGlzLmZpbmRPbmUocXVlcnksIHtmaWVsZHM6IHtyb2xlczogMX19KSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5fQmFzZS5wcm90b3R5cGUuYWRkUm9sZXNCeVVzZXJJZCA9IGZ1bmN0aW9uKHVzZXJJZCwgcm9sZXMsIHNjb3BlKSB7XG5cdHJvbGVzID0gW10uY29uY2F0KHJvbGVzKTtcblx0Y29uc3QgcXVlcnkgPSB0aGlzLnJvbGVCYXNlUXVlcnkodXNlcklkLCBzY29wZSk7XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkYWRkVG9TZXQ6IHtcblx0XHRcdHJvbGVzOiB7ICRlYWNoOiByb2xlcyB9XG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5fQmFzZS5wcm90b3R5cGUucmVtb3ZlUm9sZXNCeVVzZXJJZCA9IGZ1bmN0aW9uKHVzZXJJZCwgcm9sZXMsIHNjb3BlKSB7XG5cdHJvbGVzID0gW10uY29uY2F0KHJvbGVzKTtcblx0Y29uc3QgcXVlcnkgPSB0aGlzLnJvbGVCYXNlUXVlcnkodXNlcklkLCBzY29wZSk7XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkcHVsbEFsbDoge1xuXHRcdFx0cm9sZXNcblx0XHR9XG5cdH07XG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLl9CYXNlLnByb3RvdHlwZS5maW5kVXNlcnNJblJvbGVzID0gZnVuY3Rpb24oKSB7XG5cdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ292ZXJ3cml0ZS1mdW5jdGlvbicsICdZb3UgbXVzdCBvdmVyd3JpdGUgdGhpcyBmdW5jdGlvbiBpbiB0aGUgZXh0ZW5kZWQgY2xhc3NlcycpO1xufTtcbiIsIlJvY2tldENoYXQubW9kZWxzLlVzZXJzLnJvbGVCYXNlUXVlcnkgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0cmV0dXJuIHsgX2lkOiB1c2VySWQgfTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRVc2Vyc0luUm9sZXMgPSBmdW5jdGlvbihyb2xlcywgc2NvcGUsIG9wdGlvbnMpIHtcblx0cm9sZXMgPSBbXS5jb25jYXQocm9sZXMpO1xuXG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJvbGVzOiB7ICRpbjogcm9sZXMgfVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnksIG9wdGlvbnMpO1xufTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnJvbGVCYXNlUXVlcnkgPSBmdW5jdGlvbih1c2VySWQsIHNjb3BlKSB7XG5cdGlmIChzY29wZSA9PSBudWxsKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgcXVlcnkgPSB7ICd1Ll9pZCc6IHVzZXJJZCB9O1xuXHRpZiAoIV8uaXNVbmRlZmluZWQoc2NvcGUpKSB7XG5cdFx0cXVlcnkucmlkID0gc2NvcGU7XG5cdH1cblx0cmV0dXJuIHF1ZXJ5O1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kVXNlcnNJblJvbGVzID0gZnVuY3Rpb24ocm9sZXMsIHNjb3BlLCBvcHRpb25zKSB7XG5cdHJvbGVzID0gW10uY29uY2F0KHJvbGVzKTtcblxuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRyb2xlczogeyAkaW46IHJvbGVzIH1cblx0fTtcblxuXHRpZiAoc2NvcGUpIHtcblx0XHRxdWVyeS5yaWQgPSBzY29wZTtcblx0fVxuXG5cdGNvbnN0IHN1YnNjcmlwdGlvbnMgPSB0aGlzLmZpbmQocXVlcnkpLmZldGNoKCk7XG5cblx0Y29uc3QgdXNlcnMgPSBfLmNvbXBhY3QoXy5tYXAoc3Vic2NyaXB0aW9ucywgZnVuY3Rpb24oc3Vic2NyaXB0aW9uKSB7XG5cdFx0aWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2Ygc3Vic2NyaXB0aW9uLnUgJiYgJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBzdWJzY3JpcHRpb24udS5faWQpIHtcblx0XHRcdHJldHVybiBzdWJzY3JpcHRpb24udS5faWQ7XG5cdFx0fVxuXHR9KSk7XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQoeyBfaWQ6IHsgJGluOiB1c2VycyB9IH0sIG9wdGlvbnMpO1xufTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0LmF1dGh6LmFkZFVzZXJSb2xlcyA9IGZ1bmN0aW9uKHVzZXJJZCwgcm9sZU5hbWVzLCBzY29wZSkge1xuXHRpZiAoIXVzZXJJZCB8fCAhcm9sZU5hbWVzKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmRiLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cdGlmICghdXNlcikge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRmdW5jdGlvbjogJ1JvY2tldENoYXQuYXV0aHouYWRkVXNlclJvbGVzJ1xuXHRcdH0pO1xuXHR9XG5cblx0cm9sZU5hbWVzID0gW10uY29uY2F0KHJvbGVOYW1lcyk7XG5cdGNvbnN0IGV4aXN0aW5nUm9sZU5hbWVzID0gXy5wbHVjayhSb2NrZXRDaGF0LmF1dGh6LmdldFJvbGVzKCksICdfaWQnKTtcblx0Y29uc3QgaW52YWxpZFJvbGVOYW1lcyA9IF8uZGlmZmVyZW5jZShyb2xlTmFtZXMsIGV4aXN0aW5nUm9sZU5hbWVzKTtcblxuXHRpZiAoIV8uaXNFbXB0eShpbnZhbGlkUm9sZU5hbWVzKSkge1xuXHRcdGZvciAoY29uc3Qgcm9sZSBvZiBpbnZhbGlkUm9sZU5hbWVzKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5jcmVhdGVPclVwZGF0ZShyb2xlKTtcblx0XHR9XG5cdH1cblxuXHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5hZGRVc2VyUm9sZXModXNlcklkLCByb2xlTmFtZXMsIHNjb3BlKTtcblxuXHRyZXR1cm4gdHJ1ZTtcbn07XG4iLCIvKiBnbG9iYWxzIFJvY2tldENoYXQgKi9cblJvY2tldENoYXQuYXV0aHoucm9vbUFjY2Vzc1ZhbGlkYXRvcnMgPSBbXG5cdGZ1bmN0aW9uKHJvb20sIHVzZXIgPSB7fSkge1xuXHRcdGlmIChyb29tLnQgPT09ICdjJykge1xuXHRcdFx0aWYgKCF1c2VyLl9pZCAmJiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQWNjb3VudHNfQWxsb3dBbm9ueW1vdXNSZWFkJykgPT09IHRydWUpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odXNlci5faWQsICd2aWV3LWMtcm9vbScpO1xuXHRcdH1cblx0fSxcblx0ZnVuY3Rpb24ocm9vbSwgdXNlciA9IHt9KSB7XG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHVzZXIuX2lkKTtcblx0XHRpZiAoc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRyZXR1cm4gc3Vic2NyaXB0aW9uLl9yb29tO1xuXHRcdH1cblx0fVxuXTtcblxuUm9ja2V0Q2hhdC5hdXRoei5jYW5BY2Nlc3NSb29tID0gZnVuY3Rpb24ocm9vbSwgdXNlciwgZXh0cmFEYXRhKSB7XG5cdHJldHVybiBSb2NrZXRDaGF0LmF1dGh6LnJvb21BY2Nlc3NWYWxpZGF0b3JzLnNvbWUoKHZhbGlkYXRvcikgPT4ge1xuXHRcdHJldHVybiB2YWxpZGF0b3IuY2FsbCh0aGlzLCByb29tLCB1c2VyLCBleHRyYURhdGEpO1xuXHR9KTtcbn07XG5cblJvY2tldENoYXQuYXV0aHouYWRkUm9vbUFjY2Vzc1ZhbGlkYXRvciA9IGZ1bmN0aW9uKHZhbGlkYXRvcikge1xuXHRSb2NrZXRDaGF0LmF1dGh6LnJvb21BY2Nlc3NWYWxpZGF0b3JzLnB1c2godmFsaWRhdG9yKTtcbn07XG4iLCJSb2NrZXRDaGF0LmF1dGh6LmdldFJvbGVzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5maW5kKCkuZmV0Y2goKTtcbn07XG4iLCJSb2NrZXRDaGF0LmF1dGh6LmdldFVzZXJzSW5Sb2xlID0gZnVuY3Rpb24ocm9sZU5hbWUsIHNjb3BlLCBvcHRpb25zKSB7XG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5maW5kVXNlcnNJblJvbGUocm9sZU5hbWUsIHNjb3BlLCBvcHRpb25zKTtcbn07XG4iLCJmdW5jdGlvbiBhdExlYXN0T25lKHVzZXJJZCwgcGVybWlzc2lvbnMgPSBbXSwgc2NvcGUpIHtcblx0cmV0dXJuIHBlcm1pc3Npb25zLnNvbWUoKHBlcm1pc3Npb25JZCkgPT4ge1xuXHRcdGNvbnN0IHBlcm1pc3Npb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5maW5kT25lKHBlcm1pc3Npb25JZCk7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmlzVXNlckluUm9sZXModXNlcklkLCBwZXJtaXNzaW9uLnJvbGVzLCBzY29wZSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBhbGwodXNlcklkLCBwZXJtaXNzaW9ucyA9IFtdLCBzY29wZSkge1xuXHRyZXR1cm4gcGVybWlzc2lvbnMuZXZlcnkoKHBlcm1pc3Npb25JZCkgPT4ge1xuXHRcdGNvbnN0IHBlcm1pc3Npb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5maW5kT25lKHBlcm1pc3Npb25JZCk7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmlzVXNlckluUm9sZXModXNlcklkLCBwZXJtaXNzaW9uLnJvbGVzLCBzY29wZSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBoYXNQZXJtaXNzaW9uKHVzZXJJZCwgcGVybWlzc2lvbnMsIHNjb3BlLCBzdHJhdGVneSkge1xuXHRpZiAoIXVzZXJJZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHBlcm1pc3Npb25zID0gW10uY29uY2F0KHBlcm1pc3Npb25zKTtcblx0cmV0dXJuIHN0cmF0ZWd5KHVzZXJJZCwgcGVybWlzc2lvbnMsIHNjb3BlKTtcbn1cblxuUm9ja2V0Q2hhdC5hdXRoei5oYXNBbGxQZXJtaXNzaW9uID0gZnVuY3Rpb24odXNlcklkLCBwZXJtaXNzaW9ucywgc2NvcGUpIHtcblx0cmV0dXJuIGhhc1Blcm1pc3Npb24odXNlcklkLCBwZXJtaXNzaW9ucywgc2NvcGUsIGFsbCk7XG59O1xuXG5Sb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24gPSBSb2NrZXRDaGF0LmF1dGh6Lmhhc0FsbFBlcm1pc3Npb247XG5cblJvY2tldENoYXQuYXV0aHouaGFzQXRMZWFzdE9uZVBlcm1pc3Npb24gPSBmdW5jdGlvbih1c2VySWQsIHBlcm1pc3Npb25zLCBzY29wZSkge1xuXHRyZXR1cm4gaGFzUGVybWlzc2lvbih1c2VySWQsIHBlcm1pc3Npb25zLCBzY29wZSwgYXRMZWFzdE9uZSk7XG59O1xuIiwiUm9ja2V0Q2hhdC5hdXRoei5oYXNSb2xlID0gZnVuY3Rpb24odXNlcklkLCByb2xlTmFtZXMsIHNjb3BlKSB7XG5cdHJvbGVOYW1lcyA9IFtdLmNvbmNhdChyb2xlTmFtZXMpO1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuaXNVc2VySW5Sb2xlcyh1c2VySWQsIHJvbGVOYW1lcywgc2NvcGUpO1xufTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0LmF1dGh6LnJlbW92ZVVzZXJGcm9tUm9sZXMgPSBmdW5jdGlvbih1c2VySWQsIHJvbGVOYW1lcywgc2NvcGUpIHtcblx0aWYgKCF1c2VySWQgfHwgIXJvbGVOYW1lcykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQpO1xuXG5cdGlmICghdXNlcikge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRmdW5jdGlvbjogJ1JvY2tldENoYXQuYXV0aHoucmVtb3ZlVXNlckZyb21Sb2xlcydcblx0XHR9KTtcblx0fVxuXG5cdHJvbGVOYW1lcyA9IFtdLmNvbmNhdChyb2xlTmFtZXMpO1xuXHRjb25zdCBleGlzdGluZ1JvbGVOYW1lcyA9IF8ucGx1Y2soUm9ja2V0Q2hhdC5hdXRoei5nZXRSb2xlcygpLCAnX2lkJyk7XG5cdGNvbnN0IGludmFsaWRSb2xlTmFtZXMgPSBfLmRpZmZlcmVuY2Uocm9sZU5hbWVzLCBleGlzdGluZ1JvbGVOYW1lcyk7XG5cblx0aWYgKCFfLmlzRW1wdHkoaW52YWxpZFJvbGVOYW1lcykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvbGUnLCAnSW52YWxpZCByb2xlJywge1xuXHRcdFx0ZnVuY3Rpb246ICdSb2NrZXRDaGF0LmF1dGh6LnJlbW92ZVVzZXJGcm9tUm9sZXMnXG5cdFx0fSk7XG5cdH1cblxuXHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5yZW1vdmVVc2VyUm9sZXModXNlcklkLCByb2xlTmFtZXMsIHNjb3BlKTtcblxuXHRyZXR1cm4gdHJ1ZTtcbn07XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdwZXJtaXNzaW9ucy9nZXQnKHVwZGF0ZWRBdCkge1xuXHRcdHRoaXMudW5ibG9jaygpO1xuXG5cdFx0Y29uc3QgcmVjb3JkcyA9IFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmZpbmQoKS5mZXRjaCgpO1xuXG5cdFx0aWYgKHVwZGF0ZWRBdCBpbnN0YW5jZW9mIERhdGUpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVwZGF0ZTogcmVjb3Jkcy5maWx0ZXIoKHJlY29yZCkgPT4ge1xuXHRcdFx0XHRcdHJldHVybiByZWNvcmQuX3VwZGF0ZWRBdCA+IHVwZGF0ZWRBdDtcblx0XHRcdFx0fSksXG5cdFx0XHRcdHJlbW92ZTogUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudHJhc2hGaW5kRGVsZXRlZEFmdGVyKHVwZGF0ZWRBdCwge30sIHtmaWVsZHM6IHtfaWQ6IDEsIF9kZWxldGVkQXQ6IDF9fSkuZmV0Y2goKVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVjb3Jkcztcblx0fVxufSk7XG5cblxuUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMub24oJ2NoYW5nZWQnLCAodHlwZSwgcGVybWlzc2lvbikgPT4ge1xuXHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5TG9nZ2VkSW5UaGlzSW5zdGFuY2UoJ3Blcm1pc3Npb25zLWNoYW5nZWQnLCB0eXBlLCBwZXJtaXNzaW9uKTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ3JvbGVzJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmZpbmQoKTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ3VzZXJzSW5Sb2xlJywgZnVuY3Rpb24ocm9sZU5hbWUsIHNjb3BlLCBsaW1pdCA9IDUwKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdhY2Nlc3MtcGVybWlzc2lvbnMnKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywge1xuXHRcdFx0cHVibGlzaDogJ3VzZXJzSW5Sb2xlJ1xuXHRcdH0pKTtcblx0fVxuXG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0bGltaXQsXG5cdFx0c29ydDoge1xuXHRcdFx0bmFtZTogMVxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5nZXRVc2Vyc0luUm9sZShyb2xlTmFtZSwgc2NvcGUsIG9wdGlvbnMpO1xufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnYXV0aG9yaXphdGlvbjphZGRVc2VyVG9Sb2xlJyhyb2xlTmFtZSwgdXNlcm5hbWUsIHNjb3BlKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdhY2Nlc3MtcGVybWlzc2lvbnMnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0FjY2Vzc2luZyBwZXJtaXNzaW9ucyBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjphZGRVc2VyVG9Sb2xlJyxcblx0XHRcdFx0YWN0aW9uOiAnQWNjZXNzaW5nX3Blcm1pc3Npb25zJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb2xlTmFtZSB8fCAhXy5pc1N0cmluZyhyb2xlTmFtZSkgfHwgIXVzZXJuYW1lIHx8ICFfLmlzU3RyaW5nKHVzZXJuYW1lKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hcmd1bWVudHMnLCAnSW52YWxpZCBhcmd1bWVudHMnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246YWRkVXNlclRvUm9sZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChyb2xlTmFtZSA9PT0gJ2FkbWluJyAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2Fzc2lnbi1hZG1pbi1yb2xlJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdBc3NpZ25pbmcgYWRtaW4gaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246YWRkVXNlclRvUm9sZScsXG5cdFx0XHRcdGFjdGlvbjogJ0Fzc2lnbl9hZG1pbidcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdF9pZDogMVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0aWYgKCF1c2VyIHx8ICF1c2VyLl9pZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjphZGRVc2VyVG9Sb2xlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgYWRkID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuYWRkVXNlclJvbGVzKHVzZXIuX2lkLCByb2xlTmFtZSwgc2NvcGUpO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVSV9EaXNwbGF5Um9sZXMnKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeUxvZ2dlZCgncm9sZXMtY2hhbmdlJywge1xuXHRcdFx0XHR0eXBlOiAnYWRkZWQnLFxuXHRcdFx0XHRfaWQ6IHJvbGVOYW1lLFxuXHRcdFx0XHR1OiB7XG5cdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHR1c2VybmFtZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzY29wZVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFkZDtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdhdXRob3JpemF0aW9uOmRlbGV0ZVJvbGUnKHJvbGVOYW1lKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdhY2Nlc3MtcGVybWlzc2lvbnMnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0FjY2Vzc2luZyBwZXJtaXNzaW9ucyBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpkZWxldGVSb2xlJyxcblx0XHRcdFx0YWN0aW9uOiAnQWNjZXNzaW5nX3Blcm1pc3Npb25zJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9sZSA9IFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmZpbmRPbmUocm9sZU5hbWUpO1xuXHRcdGlmICghcm9sZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb2xlJywgJ0ludmFsaWQgcm9sZScsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpkZWxldGVSb2xlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKHJvbGUucHJvdGVjdGVkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1kZWxldGUtcHJvdGVjdGVkLXJvbGUnLCAnQ2Fubm90IGRlbGV0ZSBhIHByb3RlY3RlZCByb2xlJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOmRlbGV0ZVJvbGUnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb2xlU2NvcGUgPSByb2xlLnNjb3BlIHx8ICdVc2Vycyc7XG5cdFx0Y29uc3QgbW9kZWwgPSBSb2NrZXRDaGF0Lm1vZGVsc1tyb2xlU2NvcGVdO1xuXHRcdGNvbnN0IGV4aXN0aW5nVXNlcnMgPSBtb2RlbCAmJiBtb2RlbC5maW5kVXNlcnNJblJvbGVzICYmIG1vZGVsLmZpbmRVc2Vyc0luUm9sZXMocm9sZU5hbWUpO1xuXG5cdFx0aWYgKGV4aXN0aW5nVXNlcnMgJiYgZXhpc3RpbmdVc2Vycy5jb3VudCgpID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9sZS1pbi11c2UnLCAnQ2Fubm90IGRlbGV0ZSByb2xlIGJlY2F1c2UgaXRcXCdzIGluIHVzZScsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpkZWxldGVSb2xlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvbGVzLnJlbW92ZShyb2xlLm5hbWUpO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdhdXRob3JpemF0aW9uOnJlbW92ZVVzZXJGcm9tUm9sZScocm9sZU5hbWUsIHVzZXJuYW1lLCBzY29wZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnYWNjZXNzLXBlcm1pc3Npb25zJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdBY2Nlc3MgcGVybWlzc2lvbnMgaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246cmVtb3ZlVXNlckZyb21Sb2xlJyxcblx0XHRcdFx0YWN0aW9uOiAnQWNjZXNzaW5nX3Blcm1pc3Npb25zJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb2xlTmFtZSB8fCAhXy5pc1N0cmluZyhyb2xlTmFtZSkgfHwgIXVzZXJuYW1lIHx8ICFfLmlzU3RyaW5nKHVzZXJuYW1lKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hcmd1bWVudHMnLCAnSW52YWxpZCBhcmd1bWVudHMnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246cmVtb3ZlVXNlckZyb21Sb2xlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtcblx0XHRcdHVzZXJuYW1lXG5cdFx0fSwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdF9pZDogMSxcblx0XHRcdFx0cm9sZXM6IDFcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGlmICghdXNlciB8fCAhdXNlci5faWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246cmVtb3ZlVXNlckZyb21Sb2xlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gcHJldmVudCByZW1vdmluZyBsYXN0IHVzZXIgZnJvbSBhZG1pbiByb2xlXG5cdFx0aWYgKHJvbGVOYW1lID09PSAnYWRtaW4nKSB7XG5cdFx0XHRjb25zdCBhZG1pbkNvdW50ID0gTWV0ZW9yLnVzZXJzLmZpbmQoe1xuXHRcdFx0XHRyb2xlczoge1xuXHRcdFx0XHRcdCRpbjogWydhZG1pbiddXG5cdFx0XHRcdH1cblx0XHRcdH0pLmNvdW50KCk7XG5cblx0XHRcdGNvbnN0IHVzZXJJc0FkbWluID0gdXNlci5yb2xlcy5pbmRleE9mKCdhZG1pbicpID4gLTE7XG5cdFx0XHRpZiAoYWRtaW5Db3VudCA9PT0gMSAmJiB1c2VySXNBZG1pbikge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnTGVhdmluZyB0aGUgYXBwIHdpdGhvdXQgYWRtaW5zIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRcdG1ldGhvZDogJ3JlbW92ZVVzZXJGcm9tUm9sZScsXG5cdFx0XHRcdFx0YWN0aW9uOiAnUmVtb3ZlX2xhc3RfYWRtaW4nXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHJlbW92ZSA9IFJvY2tldENoYXQubW9kZWxzLlJvbGVzLnJlbW92ZVVzZXJSb2xlcyh1c2VyLl9pZCwgcm9sZU5hbWUsIHNjb3BlKTtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VJX0Rpc3BsYXlSb2xlcycpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5TG9nZ2VkKCdyb2xlcy1jaGFuZ2UnLCB7XG5cdFx0XHRcdHR5cGU6ICdyZW1vdmVkJyxcblx0XHRcdFx0X2lkOiByb2xlTmFtZSxcblx0XHRcdFx0dToge1xuXHRcdFx0XHRcdF9pZDogdXNlci5faWQsXG5cdFx0XHRcdFx0dXNlcm5hbWVcblx0XHRcdFx0fSxcblx0XHRcdFx0c2NvcGVcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiByZW1vdmU7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnYXV0aG9yaXphdGlvbjpzYXZlUm9sZScocm9sZURhdGEpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2FjY2Vzcy1wZXJtaXNzaW9ucycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQWNjZXNzaW5nIHBlcm1pc3Npb25zIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOnNhdmVSb2xlJyxcblx0XHRcdFx0YWN0aW9uOiAnQWNjZXNzaW5nX3Blcm1pc3Npb25zJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb2xlRGF0YS5uYW1lKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb2xlLW5hbWUtcmVxdWlyZWQnLCAnUm9sZSBuYW1lIGlzIHJlcXVpcmVkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOnNhdmVSb2xlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKFsnVXNlcnMnLCAnU3Vic2NyaXB0aW9ucyddLmluY2x1ZGVzKHJvbGVEYXRhLnNjb3BlKSA9PT0gZmFsc2UpIHtcblx0XHRcdHJvbGVEYXRhLnNjb3BlID0gJ1VzZXJzJztcblx0XHR9XG5cblx0XHRjb25zdCB1cGRhdGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5jcmVhdGVPclVwZGF0ZShyb2xlRGF0YS5uYW1lLCByb2xlRGF0YS5zY29wZSwgcm9sZURhdGEuZGVzY3JpcHRpb24pO1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVUlfRGlzcGxheVJvbGVzJykpIHtcblx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlMb2dnZWQoJ3JvbGVzLWNoYW5nZScsIHtcblx0XHRcdFx0dHlwZTogJ2NoYW5nZWQnLFxuXHRcdFx0XHRfaWQ6IHJvbGVEYXRhLm5hbWVcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB1cGRhdGU7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnYXV0aG9yaXphdGlvbjphZGRQZXJtaXNzaW9uVG9Sb2xlJyhwZXJtaXNzaW9uLCByb2xlKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdhY2Nlc3MtcGVybWlzc2lvbnMnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0FkZGluZyBwZXJtaXNzaW9uIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOmFkZFBlcm1pc3Npb25Ub1JvbGUnLFxuXHRcdFx0XHRhY3Rpb246ICdBZGRpbmdfcGVybWlzc2lvbidcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5hZGRSb2xlKHBlcm1pc3Npb24sIHJvbGUpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2F1dGhvcml6YXRpb246cmVtb3ZlUm9sZUZyb21QZXJtaXNzaW9uJyhwZXJtaXNzaW9uLCByb2xlKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdhY2Nlc3MtcGVybWlzc2lvbnMnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0FjY2Vzc2luZyBwZXJtaXNzaW9ucyBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpyZW1vdmVSb2xlRnJvbVBlcm1pc3Npb24nLFxuXHRcdFx0XHRhY3Rpb246ICdBY2Nlc3NpbmdfcGVybWlzc2lvbnMnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMucmVtb3ZlUm9sZShwZXJtaXNzaW9uLCByb2xlKTtcblx0fVxufSk7XG4iLCIvKiBlc2xpbnQgbm8tbXVsdGktc3BhY2VzOiAwICovXG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHQvLyBOb3RlOlxuXHQvLyAxLmlmIHdlIG5lZWQgdG8gY3JlYXRlIGEgcm9sZSB0aGF0IGNhbiBvbmx5IGVkaXQgY2hhbm5lbCBtZXNzYWdlLCBidXQgbm90IGVkaXQgZ3JvdXAgbWVzc2FnZVxuXHQvLyB0aGVuIHdlIGNhbiBkZWZpbmUgZWRpdC08dHlwZT4tbWVzc2FnZSBpbnN0ZWFkIG9mIGVkaXQtbWVzc2FnZVxuXHQvLyAyLiBhZG1pbiwgbW9kZXJhdG9yLCBhbmQgdXNlciByb2xlcyBzaG91bGQgbm90IGJlIGRlbGV0ZWQgYXMgdGhleSBhcmUgcmVmZXJlbmVkIGluIHRoZSBjb2RlLlxuXHRjb25zdCBwZXJtaXNzaW9ucyA9IFtcblx0XHR7IF9pZDogJ2FjY2Vzcy1wZXJtaXNzaW9ucycsICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2FkZC1vYXV0aC1zZXJ2aWNlJywgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2FkZC11c2VyLXRvLWpvaW5lZC1yb29tJywgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJywgJ21vZGVyYXRvciddIH0sXG5cdFx0eyBfaWQ6ICdhZGQtdXNlci10by1hbnktYy1yb29tJywgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdhZGQtdXNlci10by1hbnktcC1yb29tJywgICAgICAgIHJvbGVzIDogW10gfSxcblx0XHR7IF9pZDogJ2FyY2hpdmUtcm9vbScsICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJ10gfSxcblx0XHR7IF9pZDogJ2Fzc2lnbi1hZG1pbi1yb2xlJywgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2Jhbi11c2VyJywgICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJywgJ21vZGVyYXRvciddIH0sXG5cdFx0eyBfaWQ6ICdidWxrLWNyZWF0ZS1jJywgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdidWxrLXJlZ2lzdGVyLXVzZXInLCAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdjcmVhdGUtYycsICAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2JvdCddIH0sXG5cdFx0eyBfaWQ6ICdjcmVhdGUtZCcsICAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2JvdCddIH0sXG5cdFx0eyBfaWQ6ICdjcmVhdGUtcCcsICAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2JvdCddIH0sXG5cdFx0eyBfaWQ6ICdjcmVhdGUtdXNlcicsICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdjbGVhbi1jaGFubmVsLWhpc3RvcnknLCAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sIC8vIHNwZWNpYWwgcGVybWlzc2lvbiB0byBidWxrIGRlbGV0ZSBhIGNoYW5uZWwncyBtZXNhZ2VzXG5cdFx0eyBfaWQ6ICdkZWxldGUtYycsICAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lciddIH0sXG5cdFx0eyBfaWQ6ICdkZWxldGUtZCcsICAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdkZWxldGUtbWVzc2FnZScsICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9LFxuXHRcdHsgX2lkOiAnZGVsZXRlLXAnLCAgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInXSB9LFxuXHRcdHsgX2lkOiAnZGVsZXRlLXVzZXInLCAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnZWRpdC1tZXNzYWdlJywgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfSxcblx0XHR7IF9pZDogJ2VkaXQtb3RoZXItdXNlci1hY3RpdmUtc3RhdHVzJywgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2VkaXQtb3RoZXItdXNlci1pbmZvJywgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2VkaXQtb3RoZXItdXNlci1wYXNzd29yZCcsICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2VkaXQtcHJpdmlsZWdlZC1zZXR0aW5nJywgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2VkaXQtcm9vbScsICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJywgJ21vZGVyYXRvciddIH0sXG5cdFx0eyBfaWQ6ICdmb3JjZS1kZWxldGUtbWVzc2FnZScsICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lciddIH0sXG5cdFx0eyBfaWQ6ICdqb2luLXdpdGhvdXQtam9pbi1jb2RlJywgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdib3QnXSB9LFxuXHRcdHsgX2lkOiAnbGVhdmUtYycsICAgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdib3QnLCAnYW5vbnltb3VzJ10gfSxcblx0XHR7IF9pZDogJ2xlYXZlLXAnLCAgICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ3VzZXInLCAnYm90JywgJ2Fub255bW91cyddIH0sXG5cdFx0eyBfaWQ6ICdtYW5hZ2UtYXNzZXRzJywgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdtYW5hZ2UtZW1vamknLCAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdtYW5hZ2UtaW50ZWdyYXRpb25zJywgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycsICAgICAgIHJvbGVzIDogWydhZG1pbicsICdib3QnXSB9LFxuXHRcdHsgX2lkOiAnbWFuYWdlLW9hdXRoLWFwcHMnLCAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnbWVudGlvbi1hbGwnLCAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJywgJ3VzZXInXSB9LFxuXHRcdHsgX2lkOiAnbWVudGlvbi1oZXJlJywgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJywgJ3VzZXInXSB9LFxuXHRcdHsgX2lkOiAnbXV0ZS11c2VyJywgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfSxcblx0XHR7IF9pZDogJ3JlbW92ZS11c2VyJywgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJywgJ21vZGVyYXRvciddIH0sXG5cdFx0eyBfaWQ6ICdydW4taW1wb3J0JywgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdydW4tbWlncmF0aW9uJywgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdzZXQtbW9kZXJhdG9yJywgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lciddIH0sXG5cdFx0eyBfaWQ6ICdzZXQtb3duZXInLCAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lciddIH0sXG5cdFx0eyBfaWQ6ICdzZW5kLW1hbnktbWVzc2FnZXMnLCAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdib3QnXSB9LFxuXHRcdHsgX2lkOiAnc2V0LWxlYWRlcicsICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInXSB9LFxuXHRcdHsgX2lkOiAndW5hcmNoaXZlLXJvb20nLCAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1jLXJvb20nLCAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdib3QnLCAnYW5vbnltb3VzJ10gfSxcblx0XHR7IF9pZDogJ3VzZXItZ2VuZXJhdGUtYWNjZXNzLXRva2VuJywgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ3ZpZXctZC1yb29tJywgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ3VzZXInLCAnYm90J10gfSxcblx0XHR7IF9pZDogJ3ZpZXctZnVsbC1vdGhlci11c2VyLWluZm8nLCAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ3ZpZXctaGlzdG9yeScsICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ3VzZXInLCAnYW5vbnltb3VzJ10gfSxcblx0XHR7IF9pZDogJ3ZpZXctam9pbmVkLXJvb20nLCAgICAgICAgICAgICAgcm9sZXMgOiBbJ2d1ZXN0JywgJ2JvdCcsICdhbm9ueW1vdXMnXSB9LFxuXHRcdHsgX2lkOiAndmlldy1qb2luLWNvZGUnLCAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1sb2dzJywgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1vdGhlci11c2VyLWNoYW5uZWxzJywgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1wLXJvb20nLCAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdhbm9ueW1vdXMnXSB9LFxuXHRcdHsgX2lkOiAndmlldy1wcml2aWxlZ2VkLXNldHRpbmcnLCAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1yb29tLWFkbWluaXN0cmF0aW9uJywgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1zdGF0aXN0aWNzJywgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy11c2VyLWFkbWluaXN0cmF0aW9uJywgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAncHJldmlldy1jLXJvb20nLCAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdhbm9ueW1vdXMnXSB9LFxuXHRcdHsgX2lkOiAndmlldy1vdXRzaWRlLXJvb20nLCAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJywgJ3VzZXInXSB9LFxuXHRcdHsgX2lkOiAndmlldy1icm9hZGNhc3QtbWVtYmVyLWxpc3QnLCAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfVxuXHRdO1xuXG5cdGZvciAoY29uc3QgcGVybWlzc2lvbiBvZiBwZXJtaXNzaW9ucykge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuZmluZE9uZUJ5SWQocGVybWlzc2lvbi5faWQpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy51cHNlcnQocGVybWlzc2lvbi5faWQsIHskc2V0OiBwZXJtaXNzaW9uIH0pO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGRlZmF1bHRSb2xlcyA9IFtcblx0XHR7IG5hbWU6ICdhZG1pbicsICAgICBzY29wZTogJ1VzZXJzJywgICAgICAgICBkZXNjcmlwdGlvbjogJ0FkbWluJyB9LFxuXHRcdHsgbmFtZTogJ21vZGVyYXRvcicsIHNjb3BlOiAnU3Vic2NyaXB0aW9ucycsIGRlc2NyaXB0aW9uOiAnTW9kZXJhdG9yJyB9LFxuXHRcdHsgbmFtZTogJ2xlYWRlcicsICAgIHNjb3BlOiAnU3Vic2NyaXB0aW9ucycsIGRlc2NyaXB0aW9uOiAnTGVhZGVyJyB9LFxuXHRcdHsgbmFtZTogJ293bmVyJywgICAgIHNjb3BlOiAnU3Vic2NyaXB0aW9ucycsIGRlc2NyaXB0aW9uOiAnT3duZXInIH0sXG5cdFx0eyBuYW1lOiAndXNlcicsICAgICAgc2NvcGU6ICdVc2VycycsICAgICAgICAgZGVzY3JpcHRpb246ICcnIH0sXG5cdFx0eyBuYW1lOiAnYm90JywgICAgICAgc2NvcGU6ICdVc2VycycsICAgICAgICAgZGVzY3JpcHRpb246ICcnIH0sXG5cdFx0eyBuYW1lOiAnZ3Vlc3QnLCAgICAgc2NvcGU6ICdVc2VycycsICAgICAgICAgZGVzY3JpcHRpb246ICcnIH0sXG5cdFx0eyBuYW1lOiAnYW5vbnltb3VzJywgc2NvcGU6ICdVc2VycycsICAgICAgICAgZGVzY3JpcHRpb246ICcnIH1cblx0XTtcblxuXHRmb3IgKGNvbnN0IHJvbGUgb2YgZGVmYXVsdFJvbGVzKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMudXBzZXJ0KHsgX2lkOiByb2xlLm5hbWUgfSwgeyAkc2V0T25JbnNlcnQ6IHsgc2NvcGU6IHJvbGUuc2NvcGUsIGRlc2NyaXB0aW9uOiByb2xlLmRlc2NyaXB0aW9uIHx8ICcnLCBwcm90ZWN0ZWQ6IHRydWUgfSB9KTtcblx0fVxufSk7XG4iXX0=
