(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var Slingshot = Package['edgee:slingshot'].Slingshot;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Random = Package.random.Random;
var Accounts = Package['accounts-base'].Accounts;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var FileUpload, FileUploadBase, file, options, fileUploadHandler;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:file-upload":{"globalFileRestrictions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/globalFileRestrictions.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let filesize;
module.watch(require("filesize"), {
  default(v) {
    filesize = v;
  }

}, 0);
const slingShotConfig = {
  authorize(file
  /*, metaContext*/
  ) {
    //Deny uploads if user is not logged in.
    if (!this.userId) {
      throw new Meteor.Error('login-required', 'Please login before posting files');
    }

    if (!RocketChat.fileUploadIsValidContentType(file.type)) {
      throw new Meteor.Error(TAPi18n.__('error-invalid-file-type'));
    }

    const maxFileSize = RocketChat.settings.get('FileUpload_MaxFileSize');

    if (maxFileSize >= -1 && maxFileSize < file.size) {
      throw new Meteor.Error(TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
        size: filesize(maxFileSize)
      }));
    }

    return true;
  },

  maxSize: 0,
  allowedFileTypes: null
};
Slingshot.fileRestrictions('rocketchat-uploads', slingShotConfig);
Slingshot.fileRestrictions('rocketchat-uploads-gs', slingShotConfig);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"FileUpload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/lib/FileUpload.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let filesize;
module.watch(require("filesize"), {
  default(v) {
    filesize = v;
  }

}, 0);
let maxFileSize = 0;
FileUpload = {
  validateFileUpload(file) {
    if (!Match.test(file.rid, String)) {
      return false;
    }

    const user = Meteor.user();
    const room = RocketChat.models.Rooms.findOneById(file.rid);
    const directMessageAllow = RocketChat.settings.get('FileUpload_Enabled_Direct');
    const fileUploadAllowed = RocketChat.settings.get('FileUpload_Enabled');

    if (RocketChat.authz.canAccessRoom(room, user) !== true) {
      return false;
    }

    if (!fileUploadAllowed) {
      const reason = TAPi18n.__('FileUpload_Disabled', user.language);

      throw new Meteor.Error('error-file-upload-disabled', reason);
    }

    if (!directMessageAllow && room.t === 'd') {
      const reason = TAPi18n.__('File_not_allowed_direct_messages', user.language);

      throw new Meteor.Error('error-direct-message-file-upload-not-allowed', reason);
    } // -1 maxFileSize means there is no limit


    if (maxFileSize >= -1 && file.size > maxFileSize) {
      const reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
        size: filesize(maxFileSize)
      }, user.language);

      throw new Meteor.Error('error-file-too-large', reason);
    }

    if (maxFileSize > 0) {
      if (file.size > maxFileSize) {
        const reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
          size: filesize(maxFileSize)
        }, user.language);

        throw new Meteor.Error('error-file-too-large', reason);
      }
    }

    if (!RocketChat.fileUploadIsValidContentType(file.type)) {
      const reason = TAPi18n.__('File_type_is_not_accepted', user.language);

      throw new Meteor.Error('error-invalid-file-type', reason);
    }

    return true;
  }

};
RocketChat.settings.get('FileUpload_MaxFileSize', function (key, value) {
  try {
    maxFileSize = parseInt(value);
  } catch (e) {
    maxFileSize = RocketChat.models.Settings.findOneById('FileUpload_MaxFileSize').packageValue;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"FileUploadBase.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/lib/FileUploadBase.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
  insert(userId, doc) {
    if (userId) {
      return true;
    } // allow inserts from slackbridge (message_id = slack-timestamp-milli)


    if (doc && doc.message_id && doc.message_id.indexOf('slack-') === 0) {
      return true;
    } // allow inserts to the UserDataFiles store


    if (doc && doc.store && doc.store.split(':').pop() === 'UserDataFiles') {
      return true;
    }

    return false;
  },

  update(userId, doc) {
    return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId;
  },

  remove(userId, doc) {
    return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId;
  }

});
FileUploadBase = class FileUploadBase {
  constructor(store, meta, file) {
    this.id = Random.id();
    this.meta = meta;
    this.file = file;
    this.store = store;
  }

  getProgress() {}

  getFileName() {
    return this.meta.name;
  }

  start(callback) {
    this.handler = new UploadFS.Uploader({
      store: this.store,
      data: this.file,
      file: this.meta,
      onError: err => {
        return callback(err);
      },
      onComplete: fileData => {
        const file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify', 'description');

        file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');
        return callback(null, file, this.store.options.name);
      }
    });

    this.handler.onProgress = (file, progress) => {
      this.onProgress(progress);
    };

    return this.handler.start();
  }

  onProgress() {}

  stop() {
    return this.handler.stop();
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"lib":{"FileUpload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/FileUpload.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FileUploadClass: () => FileUploadClass
});
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 1);
let mime;
module.watch(require("mime-type/with-db"), {
  default(v) {
    mime = v;
  }

}, 2);
let Future;
module.watch(require("fibers/future"), {
  default(v) {
    Future = v;
  }

}, 3);
let sharp;
module.watch(require("sharp"), {
  default(v) {
    sharp = v;
  }

}, 4);
let Cookies;
module.watch(require("meteor/ostrio:cookies"), {
  Cookies(v) {
    Cookies = v;
  }

}, 5);
const cookie = new Cookies();
Object.assign(FileUpload, {
  handlers: {},

  configureUploadsStore(store, name, options) {
    const type = name.split(':').pop();
    const stores = UploadFS.getStores();
    delete stores[name];
    return new UploadFS.store[store](Object.assign({
      name
    }, options, FileUpload[`default${type}`]()));
  },

  defaultUploads() {
    return {
      collection: RocketChat.models.Uploads.model,
      filter: new UploadFS.Filter({
        onCheck: FileUpload.validateFileUpload
      }),

      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/uploads/${file.rid}/${file.userId}/${file._id}`;
      },

      onValidate: FileUpload.uploadsOnValidate,

      onRead(fileId, file, req, res) {
        if (!FileUpload.requestCanAccessFiles(req)) {
          res.writeHead(403);
          return false;
        }

        res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
        return true;
      }

    };
  },

  defaultAvatars() {
    return {
      collection: RocketChat.models.Avatars.model,

      // filter: new UploadFS.Filter({
      // 	onCheck: FileUpload.validateFileUpload
      // }),
      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/avatars/${file.userId}`;
      },

      onValidate: FileUpload.avatarsOnValidate,
      onFinishUpload: FileUpload.avatarsOnFinishUpload
    };
  },

  defaultUserDataFiles() {
    return {
      collection: RocketChat.models.UserDataFiles.model,

      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/uploads/userData/${file.userId}`;
      },

      onValidate: FileUpload.uploadsOnValidate,

      onRead(fileId, file, req, res) {
        if (!FileUpload.requestCanAccessFiles(req)) {
          res.writeHead(403);
          return false;
        }

        res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
        return true;
      }

    };
  },

  avatarsOnValidate(file) {
    if (RocketChat.settings.get('Accounts_AvatarResize') !== true) {
      return;
    }

    const tempFilePath = UploadFS.getTempFilePath(file._id);
    const height = RocketChat.settings.get('Accounts_AvatarSize');
    const future = new Future();
    const s = sharp(tempFilePath);
    s.rotate(); // Get metadata to resize the image the first time to keep "inside" the dimensions
    // then resize again to create the canvas around

    s.metadata(Meteor.bindEnvironment((err, metadata) => {
      if (!metadata) {
        metadata = {};
      }

      s.toFormat(sharp.format.jpeg).resize(Math.min(height || 0, metadata.width || Infinity), Math.min(height || 0, metadata.height || Infinity)).pipe(sharp().resize(height, height).background('#FFFFFF').embed()) // Use buffer to get the result in memory then replace the existing file
      // There is no option to override a file using this library
      .toBuffer().then(Meteor.bindEnvironment(outputBuffer => {
        fs.writeFile(tempFilePath, outputBuffer, Meteor.bindEnvironment(err => {
          if (err != null) {
            console.error(err);
          }

          const size = fs.lstatSync(tempFilePath).size;
          this.getCollection().direct.update({
            _id: file._id
          }, {
            $set: {
              size
            }
          });
          future.return();
        }));
      }));
    }));
    return future.wait();
  },

  resizeImagePreview(file) {
    file = RocketChat.models.Uploads.findOneById(file._id);
    file = FileUpload.addExtensionTo(file);

    const image = FileUpload.getStore('Uploads')._store.getReadStream(file._id, file);

    const transformer = sharp().resize(32, 32).max().jpeg().blur();
    const result = transformer.toBuffer().then(out => out.toString('base64'));
    image.pipe(transformer);
    return result;
  },

  uploadsOnValidate(file) {
    if (!/^image\/((x-windows-)?bmp|p?jpeg|png)$/.test(file.type)) {
      return;
    }

    const tmpFile = UploadFS.getTempFilePath(file._id);
    const fut = new Future();
    const s = sharp(tmpFile);
    s.metadata(Meteor.bindEnvironment((err, metadata) => {
      if (err != null) {
        console.error(err);
        return fut.return();
      }

      const identify = {
        format: metadata.format,
        size: {
          width: metadata.width,
          height: metadata.height
        }
      };

      if (metadata.orientation == null) {
        return fut.return();
      }

      s.rotate().toFile(`${tmpFile}.tmp`).then(Meteor.bindEnvironment(() => {
        fs.unlink(tmpFile, Meteor.bindEnvironment(() => {
          fs.rename(`${tmpFile}.tmp`, tmpFile, Meteor.bindEnvironment(() => {
            const size = fs.lstatSync(tmpFile).size;
            this.getCollection().direct.update({
              _id: file._id
            }, {
              $set: {
                size,
                identify
              }
            });
            fut.return();
          }));
        }));
      })).catch(err => {
        console.error(err);
        fut.return();
      });
    }));
    return fut.wait();
  },

  avatarsOnFinishUpload(file) {
    // update file record to match user's username
    const user = RocketChat.models.Users.findOneById(file.userId);
    const oldAvatar = RocketChat.models.Avatars.findOneByName(user.username);

    if (oldAvatar) {
      RocketChat.models.Avatars.deleteFile(oldAvatar._id);
    }

    RocketChat.models.Avatars.updateFileNameById(file._id, user.username); // console.log('upload finished ->', file);
  },

  requestCanAccessFiles({
    headers = {},
    query = {}
  }) {
    if (!RocketChat.settings.get('FileUpload_ProtectFiles')) {
      return true;
    }

    let {
      rc_uid,
      rc_token
    } = query;

    if (!rc_uid && headers.cookie) {
      rc_uid = cookie.get('rc_uid', headers.cookie);
      rc_token = cookie.get('rc_token', headers.cookie);
    }

    const isAuthorizedByCookies = rc_uid && rc_token && RocketChat.models.Users.findOneByIdAndLoginToken(rc_uid, rc_token);
    const isAuthorizedByHeaders = headers['x-user-id'] && headers['x-auth-token'] && RocketChat.models.Users.findOneByIdAndLoginToken(headers['x-user-id'], headers['x-auth-token']);
    return isAuthorizedByCookies || isAuthorizedByHeaders;
  },

  addExtensionTo(file) {
    if (mime.lookup(file.name) === file.type) {
      return file;
    }

    const ext = mime.extension(file.type);

    if (ext && false === new RegExp(`\.${ext}$`, 'i').test(file.name)) {
      file.name = `${file.name}.${ext}`;
    }

    return file;
  },

  getStore(modelName) {
    const storageType = RocketChat.settings.get('FileUpload_Storage_Type');
    const handlerName = `${storageType}:${modelName}`;
    return this.getStoreByName(handlerName);
  },

  getStoreByName(handlerName) {
    if (this.handlers[handlerName] == null) {
      console.error(`Upload handler "${handlerName}" does not exists`);
    }

    return this.handlers[handlerName];
  },

  get(file, req, res, next) {
    const store = this.getStoreByName(file.store);

    if (store && store.get) {
      return store.get(file, req, res, next);
    }

    res.writeHead(404);
    res.end();
  },

  copy(file, targetFile) {
    const store = this.getStoreByName(file.store);
    const out = fs.createWriteStream(targetFile);
    file = FileUpload.addExtensionTo(file);

    if (store.copy) {
      store.copy(file, out);
      return true;
    }

    return false;
  }

});

class FileUploadClass {
  constructor({
    name,
    model,
    store,
    get,
    insert,
    getStore,
    copy
  }) {
    this.name = name;
    this.model = model || this.getModelFromName();
    this._store = store || UploadFS.getStore(name);
    this.get = get;
    this.copy = copy;

    if (insert) {
      this.insert = insert;
    }

    if (getStore) {
      this.getStore = getStore;
    }

    FileUpload.handlers[name] = this;
  }

  getStore() {
    return this._store;
  }

  get store() {
    return this.getStore();
  }

  set store(store) {
    this._store = store;
  }

  getModelFromName() {
    return RocketChat.models[this.name.split(':')[1]];
  }

  delete(fileId) {
    if (this.store && this.store.delete) {
      this.store.delete(fileId);
    }

    return this.model.deleteFile(fileId);
  }

  deleteById(fileId) {
    const file = this.model.findOneById(fileId);

    if (!file) {
      return;
    }

    const store = FileUpload.getStoreByName(file.store);
    return store.delete(file._id);
  }

  deleteByName(fileName) {
    const file = this.model.findOneByName(fileName);

    if (!file) {
      return;
    }

    const store = FileUpload.getStoreByName(file.store);
    return store.delete(file._id);
  }

  insert(fileData, streamOrBuffer, cb) {
    fileData.size = parseInt(fileData.size) || 0; // Check if the fileData matches store filter

    const filter = this.store.getFilter();

    if (filter && filter.check) {
      filter.check(fileData);
    }

    const fileId = this.store.create(fileData);
    const token = this.store.createToken(fileId);
    const tmpFile = UploadFS.getTempFilePath(fileId);

    try {
      if (streamOrBuffer instanceof stream) {
        streamOrBuffer.pipe(fs.createWriteStream(tmpFile));
      } else if (streamOrBuffer instanceof Buffer) {
        fs.writeFileSync(tmpFile, streamOrBuffer);
      } else {
        throw new Error('Invalid file type');
      }

      const file = Meteor.call('ufsComplete', fileId, this.name, token);

      if (cb) {
        cb(null, file);
      }

      return file;
    } catch (e) {
      if (cb) {
        cb(e);
      } else {
        throw e;
      }
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"proxy.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/proxy.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 0);
let URL;
module.watch(require("url"), {
  default(v) {
    URL = v;
  }

}, 1);
const logger = new Logger('UploadProxy');
WebApp.connectHandlers.stack.unshift({
  route: '',
  handle: Meteor.bindEnvironment(function (req, res, next) {
    // Quick check to see if request should be catch
    if (req.url.indexOf(UploadFS.config.storesPath) === -1) {
      return next();
    }

    logger.debug('Upload URL:', req.url);

    if (req.method !== 'POST') {
      return next();
    } // Remove store path


    const parsedUrl = URL.parse(req.url);
    const path = parsedUrl.pathname.substr(UploadFS.config.storesPath.length + 1); // Get store

    const regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)$');
    const match = regExp.exec(path); // Request is not valid

    if (match === null) {
      res.writeHead(400);
      res.end();
      return;
    } // Get store


    const store = UploadFS.getStore(match[1]);

    if (!store) {
      res.writeHead(404);
      res.end();
      return;
    } // Get file


    const fileId = match[2];
    const file = store.getCollection().findOne({
      _id: fileId
    });

    if (file === undefined) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (file.instanceId === InstanceStatus.id()) {
      logger.debug('Correct instance');
      return next();
    } // Proxy to other instance


    const instance = InstanceStatus.getCollection().findOne({
      _id: file.instanceId
    });

    if (instance == null) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (instance.extraInformation.host === process.env.INSTANCE_IP && RocketChat.isDocker() === false) {
      instance.extraInformation.host = 'localhost';
    }

    logger.debug('Wrong instance, proxing to:', `${instance.extraInformation.host}:${instance.extraInformation.port}`);
    const options = {
      hostname: instance.extraInformation.host,
      port: instance.extraInformation.port,
      path: req.originalUrl,
      method: 'POST'
    };
    const proxy = http.request(options, function (proxy_res) {
      proxy_res.pipe(res, {
        end: true
      });
    });
    req.pipe(proxy, {
      end: true
    });
  })
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"requests.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/requests.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals FileUpload, WebApp */
WebApp.connectHandlers.use('/file-upload/', function (req, res, next) {
  const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

  if (match[1]) {
    const file = RocketChat.models.Uploads.findOneById(match[1]);

    if (file) {
      if (!Meteor.settings.public.sandstorm && !FileUpload.requestCanAccessFiles(req)) {
        res.writeHead(403);
        return res.end();
      }

      res.setHeader('Content-Security-Policy', 'default-src \'none\'');
      return FileUpload.get(file, req, res, next);
    }
  }

  res.writeHead(404);
  res.end();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"config":{"_configUploadStorage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/_configUploadStorage.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
module.watch(require("./AmazonS3.js"));
module.watch(require("./FileSystem.js"));
module.watch(require("./GoogleStorage.js"));
module.watch(require("./GridFS.js"));
module.watch(require("./Webdav.js"));
module.watch(require("./Slingshot_DEPRECATED.js"));

const configStore = _.debounce(() => {
  const store = RocketChat.settings.get('FileUpload_Storage_Type');

  if (store) {
    console.log('Setting default file store to', store);
    UploadFS.getStores().Avatars = UploadFS.getStore(`${store}:Avatars`);
    UploadFS.getStores().Uploads = UploadFS.getStore(`${store}:Uploads`);
    UploadFS.getStores().UserDataFiles = UploadFS.getStore(`${store}:UserDataFiles`);
  }
}, 1000);

RocketChat.settings.get(/^FileUpload_/, configStore);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"AmazonS3.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/AmazonS3.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/AmazonS3/server.js"));
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 2);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 3);

const get = function (file, req, res) {
  const fileUrl = this.store.getRedirectURL(file);

  if (fileUrl) {
    const storeType = file.store.split(':').pop();

    if (RocketChat.settings.get(`FileUpload_S3_Proxy_${storeType}`)) {
      const request = /^https:/.test(fileUrl) ? https : http;
      request.get(fileUrl, fileRes => fileRes.pipe(res));
    } else {
      res.removeHeader('Content-Length');
      res.setHeader('Location', fileUrl);
      res.writeHead(302);
      res.end();
    }
  } else {
    res.end();
  }
};

const copy = function (file, out) {
  const fileUrl = this.store.getRedirectURL(file);

  if (fileUrl) {
    const request = /^https:/.test(fileUrl) ? https : http;
    request.get(fileUrl, fileRes => fileRes.pipe(out));
  } else {
    out.end();
  }
};

const AmazonS3Uploads = new FileUploadClass({
  name: 'AmazonS3:Uploads',
  get,
  copy // store setted bellow

});
const AmazonS3Avatars = new FileUploadClass({
  name: 'AmazonS3:Avatars',
  get,
  copy // store setted bellow

});
const AmazonS3UserDataFiles = new FileUploadClass({
  name: 'AmazonS3:UserDataFiles',
  get,
  copy // store setted bellow

});

const configure = _.debounce(function () {
  const Bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
  const Acl = RocketChat.settings.get('FileUpload_S3_Acl');
  const AWSAccessKeyId = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
  const AWSSecretAccessKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
  const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');
  const Region = RocketChat.settings.get('FileUpload_S3_Region');
  const SignatureVersion = RocketChat.settings.get('FileUpload_S3_SignatureVersion');
  const ForcePathStyle = RocketChat.settings.get('FileUpload_S3_ForcePathStyle'); // const CDN = RocketChat.settings.get('FileUpload_S3_CDN');

  const BucketURL = RocketChat.settings.get('FileUpload_S3_BucketURL');

  if (!Bucket) {
    return;
  }

  const config = {
    connection: {
      signatureVersion: SignatureVersion,
      s3ForcePathStyle: ForcePathStyle,
      params: {
        Bucket,
        ACL: Acl
      },
      region: Region
    },
    URLExpiryTimeSpan
  };

  if (AWSAccessKeyId) {
    config.connection.accessKeyId = AWSAccessKeyId;
  }

  if (AWSSecretAccessKey) {
    config.connection.secretAccessKey = AWSSecretAccessKey;
  }

  if (BucketURL) {
    config.connection.endpoint = BucketURL;
  }

  AmazonS3Uploads.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Uploads.name, config);
  AmazonS3Avatars.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Avatars.name, config);
  AmazonS3UserDataFiles.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3UserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_S3_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"FileSystem.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/FileSystem.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 1);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 2);
const FileSystemUploads = new FileUploadClass({
  name: 'FileSystem:Uploads',

  // store setted bellow
  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
        res.setHeader('Content-Type', file.type);
        res.setHeader('Content-Length', file.size);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  },

  copy(file, out) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        this.store.getReadStream(file._id, file).pipe(out);
      }
    } catch (e) {
      out.end();
      return;
    }
  }

});
const FileSystemAvatars = new FileUploadClass({
  name: 'FileSystem:Avatars',

  // store setted bellow
  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  }

});
const FileSystemUserDataFiles = new FileUploadClass({
  name: 'FileSystem:UserDataFiles',

  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
        res.setHeader('Content-Type', file.type);
        res.setHeader('Content-Length', file.size);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  }

});

const createFileSystemStore = _.debounce(function () {
  const options = {
    path: RocketChat.settings.get('FileUpload_FileSystemPath') //'/tmp/uploads/photos',

  };
  FileSystemUploads.store = FileUpload.configureUploadsStore('Local', FileSystemUploads.name, options);
  FileSystemAvatars.store = FileUpload.configureUploadsStore('Local', FileSystemAvatars.name, options);
  FileSystemUserDataFiles.store = FileUpload.configureUploadsStore('Local', FileSystemUserDataFiles.name, options); // DEPRECATED backwards compatibililty (remove)

  UploadFS.getStores()['fileSystem'] = UploadFS.getStores()[FileSystemUploads.name];
}, 500);

RocketChat.settings.get('FileUpload_FileSystemPath', createFileSystemStore);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"GoogleStorage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/GoogleStorage.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/GoogleStorage/server.js"));
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 2);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 3);

const get = function (file, req, res) {
  this.store.getRedirectURL(file, (err, fileUrl) => {
    if (err) {
      console.error(err);
    }

    if (fileUrl) {
      const storeType = file.store.split(':').pop();

      if (RocketChat.settings.get(`FileUpload_GoogleStorage_Proxy_${storeType}`)) {
        const request = /^https:/.test(fileUrl) ? https : http;
        request.get(fileUrl, fileRes => fileRes.pipe(res));
      } else {
        res.removeHeader('Content-Length');
        res.setHeader('Location', fileUrl);
        res.writeHead(302);
        res.end();
      }
    } else {
      res.end();
    }
  });
};

const copy = function (file, out) {
  this.store.getRedirectURL(file, (err, fileUrl) => {
    if (err) {
      console.error(err);
    }

    if (fileUrl) {
      const request = /^https:/.test(fileUrl) ? https : http;
      request.get(fileUrl, fileRes => fileRes.pipe(out));
    } else {
      out.end();
    }
  });
};

const GoogleCloudStorageUploads = new FileUploadClass({
  name: 'GoogleCloudStorage:Uploads',
  get,
  copy // store setted bellow

});
const GoogleCloudStorageAvatars = new FileUploadClass({
  name: 'GoogleCloudStorage:Avatars',
  get,
  copy // store setted bellow

});
const GoogleCloudStorageUserDataFiles = new FileUploadClass({
  name: 'GoogleCloudStorage:UserDataFiles',
  get,
  copy // store setted bellow

});

const configure = _.debounce(function () {
  const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
  const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
  const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
  const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');

  if (!bucket || !accessId || !secret) {
    return;
  }

  const config = {
    connection: {
      credentials: {
        client_email: accessId,
        private_key: secret
      }
    },
    bucket,
    URLExpiryTimeSpan
  };
  GoogleCloudStorageUploads.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUploads.name, config);
  GoogleCloudStorageAvatars.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageAvatars.name, config);
  GoogleCloudStorageUserDataFiles.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_GoogleStorage_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"GridFS.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/GridFS.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 0);
let zlib;
module.watch(require("zlib"), {
  default(v) {
    zlib = v;
  }

}, 1);
let util;
module.watch(require("util"), {
  default(v) {
    util = v;
  }

}, 2);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 3);
const logger = new Logger('FileUpload');

function ExtractRange(options) {
  if (!(this instanceof ExtractRange)) {
    return new ExtractRange(options);
  }

  this.start = options.start;
  this.stop = options.stop;
  this.bytes_read = 0;
  stream.Transform.call(this, options);
}

util.inherits(ExtractRange, stream.Transform);

ExtractRange.prototype._transform = function (chunk, enc, cb) {
  if (this.bytes_read > this.stop) {
    // done reading
    this.end();
  } else if (this.bytes_read + chunk.length < this.start) {// this chunk is still before the start byte
  } else {
    let start;
    let stop;

    if (this.start <= this.bytes_read) {
      start = 0;
    } else {
      start = this.start - this.bytes_read;
    }

    if (this.stop - this.bytes_read + 1 < chunk.length) {
      stop = this.stop - this.bytes_read + 1;
    } else {
      stop = chunk.length;
    }

    const newchunk = chunk.slice(start, stop);
    this.push(newchunk);
  }

  this.bytes_read += chunk.length;
  cb();
};

const getByteRange = function (header) {
  if (header) {
    const matches = header.match(/(\d+)-(\d+)/);

    if (matches) {
      return {
        start: parseInt(matches[1], 10),
        stop: parseInt(matches[2], 10)
      };
    }
  }

  return null;
}; // code from: https://github.com/jalik/jalik-ufs/blob/master/ufs-server.js#L310


const readFromGridFS = function (storeName, fileId, file, req, res) {
  const store = UploadFS.getStore(storeName);
  const rs = store.getReadStream(fileId, file);
  const ws = new stream.PassThrough();
  [rs, ws].forEach(stream => stream.on('error', function (err) {
    store.onReadError.call(store, err, fileId, file);
    res.end();
  }));
  ws.on('close', function () {
    // Close output stream at the end
    ws.emit('end');
  });
  const accept = req.headers['accept-encoding'] || ''; // Transform stream

  store.transformRead(rs, ws, fileId, file, req);
  const range = getByteRange(req.headers.range);
  let out_of_range = false;

  if (range) {
    out_of_range = range.start > file.size || range.stop <= range.start || range.stop > file.size;
  } // Compress data using gzip


  if (accept.match(/\bgzip\b/) && range === null) {
    res.setHeader('Content-Encoding', 'gzip');
    res.removeHeader('Content-Length');
    res.writeHead(200);
    ws.pipe(zlib.createGzip()).pipe(res);
  } else if (accept.match(/\bdeflate\b/) && range === null) {
    // Compress data using deflate
    res.setHeader('Content-Encoding', 'deflate');
    res.removeHeader('Content-Length');
    res.writeHead(200);
    ws.pipe(zlib.createDeflate()).pipe(res);
  } else if (range && out_of_range) {
    // out of range request, return 416
    res.removeHeader('Content-Length');
    res.removeHeader('Content-Type');
    res.removeHeader('Content-Disposition');
    res.removeHeader('Last-Modified');
    res.setHeader('Content-Range', `bytes */${file.size}`);
    res.writeHead(416);
    res.end();
  } else if (range) {
    res.setHeader('Content-Range', `bytes ${range.start}-${range.stop}/${file.size}`);
    res.removeHeader('Content-Length');
    res.setHeader('Content-Length', range.stop - range.start + 1);
    res.writeHead(206);
    logger.debug('File upload extracting range');
    ws.pipe(new ExtractRange({
      start: range.start,
      stop: range.stop
    })).pipe(res);
  } else {
    res.writeHead(200);
    ws.pipe(res);
  }
};

const copyFromGridFS = function (storeName, fileId, file, out) {
  const store = UploadFS.getStore(storeName);
  const rs = store.getReadStream(fileId, file);
  [rs, out].forEach(stream => stream.on('error', function (err) {
    store.onReadError.call(store, err, fileId, file);
    out.end();
  }));
  rs.pipe(out);
};

FileUpload.configureUploadsStore('GridFS', 'GridFS:Uploads', {
  collectionName: 'rocketchat_uploads'
});
FileUpload.configureUploadsStore('GridFS', 'GridFS:UserDataFiles', {
  collectionName: 'rocketchat_userDataFiles'
}); // DEPRECATED: backwards compatibility (remove)

UploadFS.getStores()['rocketchat_uploads'] = UploadFS.getStores()['GridFS:Uploads'];
FileUpload.configureUploadsStore('GridFS', 'GridFS:Avatars', {
  collectionName: 'rocketchat_avatars'
});
new FileUploadClass({
  name: 'GridFS:Uploads',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.size);
    return readFromGridFS(file.store, file._id, file, req, res);
  },

  copy(file, out) {
    copyFromGridFS(file.store, file._id, file, out);
  }

});
new FileUploadClass({
  name: 'GridFS:UserDataFiles',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.size);
    return readFromGridFS(file.store, file._id, file, req, res);
  },

  copy(file, out) {
    copyFromGridFS(file.store, file._id, file, out);
  }

});
new FileUploadClass({
  name: 'GridFS:Avatars',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    return readFromGridFS(file.store, file._id, file, req, res);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Slingshot_DEPRECATED.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/Slingshot_DEPRECATED.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

const configureSlingshot = _.debounce(() => {
  const type = RocketChat.settings.get('FileUpload_Storage_Type');
  const bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
  const acl = RocketChat.settings.get('FileUpload_S3_Acl');
  const accessKey = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
  const secretKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
  const cdn = RocketChat.settings.get('FileUpload_S3_CDN');
  const region = RocketChat.settings.get('FileUpload_S3_Region');
  const bucketUrl = RocketChat.settings.get('FileUpload_S3_BucketURL');
  delete Slingshot._directives['rocketchat-uploads'];

  if (type === 'AmazonS3' && !_.isEmpty(bucket) && !_.isEmpty(accessKey) && !_.isEmpty(secretKey)) {
    if (Slingshot._directives['rocketchat-uploads']) {
      delete Slingshot._directives['rocketchat-uploads'];
    }

    const config = {
      bucket,

      key(file, metaContext) {
        const id = Random.id();
        const path = `${RocketChat.settings.get('uniqueID')}/uploads/${metaContext.rid}/${this.userId}/${id}`;
        const upload = {
          _id: id,
          rid: metaContext.rid,
          AmazonS3: {
            path
          }
        };
        RocketChat.models.Uploads.insertFileInit(this.userId, 'AmazonS3:Uploads', file, upload);
        return path;
      },

      AWSAccessKeyId: accessKey,
      AWSSecretAccessKey: secretKey
    };

    if (!_.isEmpty(acl)) {
      config.acl = acl;
    }

    if (!_.isEmpty(cdn)) {
      config.cdn = cdn;
    }

    if (!_.isEmpty(region)) {
      config.region = region;
    }

    if (!_.isEmpty(bucketUrl)) {
      config.bucketUrl = bucketUrl;
    }

    try {
      Slingshot.createDirective('rocketchat-uploads', Slingshot.S3Storage, config);
    } catch (e) {
      console.error('Error configuring S3 ->', e.message);
    }
  }
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', configureSlingshot);
RocketChat.settings.get(/^FileUpload_S3_/, configureSlingshot);

const createGoogleStorageDirective = _.debounce(() => {
  const type = RocketChat.settings.get('FileUpload_Storage_Type');
  const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
  const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
  const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
  delete Slingshot._directives['rocketchat-uploads-gs'];

  if (type === 'GoogleCloudStorage' && !_.isEmpty(secret) && !_.isEmpty(accessId) && !_.isEmpty(bucket)) {
    if (Slingshot._directives['rocketchat-uploads-gs']) {
      delete Slingshot._directives['rocketchat-uploads-gs'];
    }

    const config = {
      bucket,
      GoogleAccessId: accessId,
      GoogleSecretKey: secret,

      key(file, metaContext) {
        const id = Random.id();
        const path = `${RocketChat.settings.get('uniqueID')}/uploads/${metaContext.rid}/${this.userId}/${id}`;
        const upload = {
          _id: id,
          rid: metaContext.rid,
          GoogleStorage: {
            path
          }
        };
        RocketChat.models.Uploads.insertFileInit(this.userId, 'GoogleCloudStorage:Uploads', file, upload);
        return path;
      }

    };

    try {
      Slingshot.createDirective('rocketchat-uploads-gs', Slingshot.GoogleCloud, config);
    } catch (e) {
      console.error('Error configuring GoogleCloudStorage ->', e.message);
    }
  }
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', createGoogleStorageDirective);
RocketChat.settings.get(/^FileUpload_GoogleStorage_/, createGoogleStorageDirective);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Webdav.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/Webdav.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/Webdav/server.js"));

const get = function (file, req, res) {
  this.store.getReadStream(file._id, file).pipe(res);
};

const copy = function (file, out) {
  this.store.getReadStream(file._id, file).pipe(out);
};

const WebdavUploads = new FileUploadClass({
  name: 'Webdav:Uploads',
  get,
  copy // store setted bellow

});
const WebdavAvatars = new FileUploadClass({
  name: 'Webdav:Avatars',
  get,
  copy // store setted bellow

});
const WebdavUserDataFiles = new FileUploadClass({
  name: 'Webdav:UserDataFiles',
  get,
  copy // store setted bellow

});

const configure = _.debounce(function () {
  const uploadFolderPath = RocketChat.settings.get('FileUpload_Webdav_Upload_Folder_Path');
  const server = RocketChat.settings.get('FileUpload_Webdav_Server_URL');
  const username = RocketChat.settings.get('FileUpload_Webdav_Username');
  const password = RocketChat.settings.get('FileUpload_Webdav_Password');

  if (!server || !username || !password) {
    return;
  }

  const config = {
    connection: {
      credentials: {
        server,
        username,
        password
      }
    },
    uploadFolderPath
  };
  WebdavUploads.store = FileUpload.configureUploadsStore('Webdav', WebdavUploads.name, config);
  WebdavAvatars.store = FileUpload.configureUploadsStore('Webdav', WebdavAvatars.name, config);
  WebdavUserDataFiles.store = FileUpload.configureUploadsStore('Webdav', WebdavUserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_Webdav_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"sendFileMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/methods/sendFileMessage.js                                                   //
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
  'sendFileMessage'(roomId, store, file, msgData = {}) {
    return Promise.asyncApply(() => {
      if (!Meteor.userId()) {
        throw new Meteor.Error('error-invalid-user', 'Invalid user', {
          method: 'sendFileMessage'
        });
      }

      const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());

      if (!room) {
        return false;
      }

      check(msgData, {
        avatar: Match.Optional(String),
        emoji: Match.Optional(String),
        alias: Match.Optional(String),
        groupable: Match.Optional(Boolean),
        msg: Match.Optional(String)
      });
      RocketChat.models.Uploads.updateFileComplete(file._id, Meteor.userId(), _.omit(file, '_id'));
      const fileUrl = `/file-upload/${file._id}/${encodeURI(file.name)}`;
      const attachment = {
        title: file.name,
        type: 'file',
        description: file.description,
        title_link: fileUrl,
        title_link_download: true
      };

      if (/^image\/.+/.test(file.type)) {
        attachment.image_url = fileUrl;
        attachment.image_type = file.type;
        attachment.image_size = file.size;

        if (file.identify && file.identify.size) {
          attachment.image_dimensions = file.identify.size;
        }

        attachment.image_preview = Promise.await(FileUpload.resizeImagePreview(file));
      } else if (/^audio\/.+/.test(file.type)) {
        attachment.audio_url = fileUrl;
        attachment.audio_type = file.type;
        attachment.audio_size = file.size;
      } else if (/^video\/.+/.test(file.type)) {
        attachment.video_url = fileUrl;
        attachment.video_type = file.type;
        attachment.video_size = file.size;
      }

      const user = Meteor.user();
      let msg = Object.assign({
        _id: Random.id(),
        rid: roomId,
        ts: new Date(),
        msg: '',
        file: {
          _id: file._id,
          name: file.name,
          type: file.type
        },
        groupable: false,
        attachments: [attachment]
      }, msgData);
      msg = Meteor.call('sendMessage', msg);
      Meteor.defer(() => RocketChat.callbacks.run('afterFileUpload', {
        user,
        room,
        message: msg
      }));
      return msg;
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getS3FileUrl.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/methods/getS3FileUrl.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UploadFS */
let protectedFiles;
RocketChat.settings.get('FileUpload_ProtectFiles', function (key, value) {
  protectedFiles = value;
});
Meteor.methods({
  getS3FileUrl(fileId) {
    if (protectedFiles && !Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'sendFileMessage'
      });
    }

    const file = RocketChat.models.Uploads.findOneById(fileId);
    return UploadFS.getStore('AmazonS3:Uploads').getRedirectURL(file);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/startup/settings.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('FileUpload', function () {
  this.add('FileUpload_Enabled', true, {
    type: 'boolean',
    public: true
  });
  this.add('FileUpload_MaxFileSize', 2097152, {
    type: 'int',
    public: true
  });
  this.add('FileUpload_MediaTypeWhiteList', 'image/*,audio/*,video/*,application/zip,application/x-rar-compressed,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', {
    type: 'string',
    public: true,
    i18nDescription: 'FileUpload_MediaTypeWhiteListDescription'
  });
  this.add('FileUpload_ProtectFiles', true, {
    type: 'boolean',
    public: true,
    i18nDescription: 'FileUpload_ProtectFilesDescription'
  });
  this.add('FileUpload_Storage_Type', 'GridFS', {
    type: 'select',
    values: [{
      key: 'GridFS',
      i18nLabel: 'GridFS'
    }, {
      key: 'AmazonS3',
      i18nLabel: 'AmazonS3'
    }, {
      key: 'GoogleCloudStorage',
      i18nLabel: 'GoogleCloudStorage'
    }, {
      key: 'Webdav',
      i18nLabel: 'WebDAV'
    }, {
      key: 'FileSystem',
      i18nLabel: 'FileSystem'
    }],
    public: true
  });
  this.section('Amazon S3', function () {
    this.add('FileUpload_S3_Bucket', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Acl', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_AWSAccessKeyId', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_AWSSecretAccessKey', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_CDN', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Region', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_BucketURL', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      },
      i18nDescription: 'Override_URL_to_which_files_are_uploaded_This_url_also_used_for_downloads_unless_a_CDN_is_given.'
    });
    this.add('FileUpload_S3_SignatureVersion', 'v4', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_ForcePathStyle', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_URLExpiryTimeSpan', 120, {
      type: 'int',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      },
      i18nDescription: 'FileUpload_S3_URLExpiryTimeSpan_Description'
    });
    this.add('FileUpload_S3_Proxy_Avatars', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Proxy_Uploads', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
  });
  this.section('Google Cloud Storage', function () {
    this.add('FileUpload_GoogleStorage_Bucket', '', {
      type: 'string',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_AccessId', '', {
      type: 'string',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Secret', '', {
      type: 'string',
      multiline: true,
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Proxy_Avatars', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Proxy_Uploads', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
  });
  this.section('File System', function () {
    this.add('FileUpload_FileSystemPath', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'FileSystem'
      }
    });
  });
  this.section('WebDAV', function () {
    this.add('FileUpload_Webdav_Upload_Folder_Path', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Server_URL', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Username', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Password', '', {
      type: 'password',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Proxy_Avatars', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Proxy_Uploads', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
  });
  this.add('FileUpload_Enabled_Direct', true, {
    type: 'boolean',
    public: true
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"ufs":{"AmazonS3":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/AmazonS3/server.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  AmazonS3Store: () => AmazonS3Store
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
let S3;
module.watch(require("aws-sdk/clients/s3"), {
  default(v) {
    S3 = v;
  }

}, 2);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 3);

class AmazonS3Store extends UploadFS.Store {
  constructor(options) {
    // Default options
    // options.secretAccessKey,
    // options.accessKeyId,
    // options.region,
    // options.sslEnabled // optional
    options = _.extend({
      httpOptions: {
        timeout: 6000,
        agent: false
      }
    }, options);
    super(options);
    const classOptions = options;
    const s3 = new S3(options.connection);

    options.getPath = options.getPath || function (file) {
      return file._id;
    };

    this.getPath = function (file) {
      if (file.AmazonS3) {
        return file.AmazonS3.path;
      } // Compatibility
      // TODO: Migration


      if (file.s3) {
        return file.s3.path + file._id;
      }
    };

    this.getRedirectURL = function (file) {
      const params = {
        Key: this.getPath(file),
        Expires: classOptions.URLExpiryTimeSpan
      };
      return s3.getSignedUrl('getObject', params);
    };
    /**
     * Creates the file in the collection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.AmazonS3 = {
        path: this.options.getPath(file)
      };
      file.store = this.options.name; // assign store to file

      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      const params = {
        Key: this.getPath(file)
      };
      s3.deleteObject(params, (err, data) => {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const params = {
        Key: this.getPath(file)
      };

      if (options.start && options.end) {
        params.Range = `${options.start} - ${options.end}`;
      }

      return s3.getObject(params).createReadStream();
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getWriteStream = function (fileId, file
    /*, options*/
    ) {
      const writeStream = new stream.PassThrough();
      writeStream.length = file.size;
      writeStream.on('newListener', (event, listener) => {
        if (event === 'finish') {
          process.nextTick(() => {
            writeStream.removeListener(event, listener);
            writeStream.on('real_finish', listener);
          });
        }
      });
      s3.putObject({
        Key: this.getPath(file),
        Body: writeStream,
        ContentType: file.type,
        ContentDisposition: `inline; filename="${encodeURI(file.name)}"`
      }, error => {
        if (error) {
          console.error(error);
        }

        writeStream.emit('real_finish');
      });
      return writeStream;
    };
  }

}

// Add store to UFS namespace
UploadFS.store.AmazonS3 = AmazonS3Store;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"GoogleStorage":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/GoogleStorage/server.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  GoogleStorageStore: () => GoogleStorageStore
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);
let gcStorage;
module.watch(require("@google-cloud/storage"), {
  default(v) {
    gcStorage = v;
  }

}, 1);

class GoogleStorageStore extends UploadFS.Store {
  constructor(options) {
    super(options);
    const gcs = gcStorage(options.connection);
    this.bucket = gcs.bucket(options.bucket);

    options.getPath = options.getPath || function (file) {
      return file._id;
    };

    this.getPath = function (file) {
      if (file.GoogleStorage) {
        return file.GoogleStorage.path;
      } // Compatibility
      // TODO: Migration


      if (file.googleCloudStorage) {
        return file.googleCloudStorage.path + file._id;
      }
    };

    this.getRedirectURL = function (file, callback) {
      const params = {
        action: 'read',
        responseDisposition: 'inline',
        expires: Date.now() + this.options.URLExpiryTimeSpan * 1000
      };
      this.bucket.file(this.getPath(file)).getSignedUrl(params, callback);
    };
    /**
     * Creates the file in the collection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.GoogleStorage = {
        path: this.options.getPath(file)
      };
      file.store = this.options.name; // assign store to file

      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      this.bucket.file(this.getPath(file)).delete(function (err, data) {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const config = {};

      if (options.start != null) {
        config.start = options.start;
      }

      if (options.end != null) {
        config.end = options.end;
      }

      return this.bucket.file(this.getPath(file)).createReadStream(config);
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getWriteStream = function (fileId, file
    /*, options*/
    ) {
      return this.bucket.file(this.getPath(file)).createWriteStream({
        gzip: false,
        metadata: {
          contentType: file.type,
          contentDisposition: `inline; filename=${file.name}` // metadata: {
          // 	custom: 'metadata'
          // }

        }
      });
    };
  }

}

// Add store to UFS namespace
UploadFS.store.GoogleStorage = GoogleStorageStore;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"Webdav":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/Webdav/server.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  WebdavStore: () => WebdavStore
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);
let Webdav;
module.watch(require("webdav"), {
  default(v) {
    Webdav = v;
  }

}, 1);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 2);

class WebdavStore extends UploadFS.Store {
  constructor(options) {
    super(options);
    const client = new Webdav(options.connection.credentials.server, options.connection.credentials.username, options.connection.credentials.password);

    options.getPath = function (file) {
      if (options.uploadFolderPath[options.uploadFolderPath.length - 1] !== '/') {
        options.uploadFolderPath += '/';
      }

      return options.uploadFolderPath + file._id;
    };

    client.stat(options.uploadFolderPath).catch(function (err) {
      if (err.status === '404') {
        client.createDirectory(options.uploadFolderPath);
      }
    });
    /**
     * Returns the file path
     * @param file
     * @return {string}
     */

    this.getPath = function (file) {
      if (file.Webdav) {
        return file.Webdav.path;
      }
    };
    /**
     * Creates the file in the col lection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.Webdav = {
        path: options.getPath(file)
      };
      file.store = this.options.name;
      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      client.deleteFile(this.getPath(file), (err, data) => {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const range = {};

      if (options.start != null) {
        range.start = options.start;
      }

      if (options.end != null) {
        range.end = options.end;
      }

      return client.createReadStream(this.getPath(file), options);
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @return {*}
     */


    this.getWriteStream = function (fileId, file) {
      const writeStream = new stream.PassThrough();
      const webdavStream = client.createWriteStream(this.getPath(file)); //TODO remove timeout when UploadFS bug resolved

      const newListenerCallback = (event, listener) => {
        if (event === 'finish') {
          process.nextTick(() => {
            writeStream.removeListener(event, listener);
            writeStream.removeListener('newListener', newListenerCallback);
            writeStream.on(event, function () {
              setTimeout(listener, 500);
            });
          });
        }
      };

      writeStream.on('newListener', newListenerCallback);
      writeStream.pipe(webdavStream);
      return writeStream;
    };
  }

}

// Add store to UFS namespace
UploadFS.store.Webdav = WebdavStore;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:file-upload/globalFileRestrictions.js");
require("/node_modules/meteor/rocketchat:file-upload/lib/FileUpload.js");
require("/node_modules/meteor/rocketchat:file-upload/lib/FileUploadBase.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/FileUpload.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/proxy.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/requests.js");
require("/node_modules/meteor/rocketchat:file-upload/server/config/_configUploadStorage.js");
require("/node_modules/meteor/rocketchat:file-upload/server/methods/sendFileMessage.js");
require("/node_modules/meteor/rocketchat:file-upload/server/methods/getS3FileUrl.js");
require("/node_modules/meteor/rocketchat:file-upload/server/startup/settings.js");

/* Exports */
Package._define("rocketchat:file-upload", {
  fileUploadHandler: fileUploadHandler,
  FileUpload: FileUpload
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_file-upload.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9nbG9iYWxGaWxlUmVzdHJpY3Rpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL2xpYi9GaWxlVXBsb2FkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL2xpYi9GaWxlVXBsb2FkQmFzZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvbGliL0ZpbGVVcGxvYWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2xpYi9wcm94eS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvbGliL3JlcXVlc3RzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvX2NvbmZpZ1VwbG9hZFN0b3JhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9BbWF6b25TMy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvY29uZmlnL0ZpbGVTeXN0ZW0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9Hb29nbGVTdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvR3JpZEZTLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvU2xpbmdzaG90X0RFUFJFQ0FURUQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9XZWJkYXYuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL21ldGhvZHMvc2VuZEZpbGVNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9tZXRob2RzL2dldFMzRmlsZVVybC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvc3RhcnR1cC9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC91ZnMvQW1hem9uUzMvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3Vmcy9Hb29nbGVTdG9yYWdlL3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC91ZnMvV2ViZGF2L3NlcnZlci5qcyJdLCJuYW1lcyI6WyJmaWxlc2l6ZSIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2Iiwic2xpbmdTaG90Q29uZmlnIiwiYXV0aG9yaXplIiwiZmlsZSIsInVzZXJJZCIsIk1ldGVvciIsIkVycm9yIiwiUm9ja2V0Q2hhdCIsImZpbGVVcGxvYWRJc1ZhbGlkQ29udGVudFR5cGUiLCJ0eXBlIiwiVEFQaTE4biIsIl9fIiwibWF4RmlsZVNpemUiLCJzZXR0aW5ncyIsImdldCIsInNpemUiLCJtYXhTaXplIiwiYWxsb3dlZEZpbGVUeXBlcyIsIlNsaW5nc2hvdCIsImZpbGVSZXN0cmljdGlvbnMiLCJGaWxlVXBsb2FkIiwidmFsaWRhdGVGaWxlVXBsb2FkIiwiTWF0Y2giLCJ0ZXN0IiwicmlkIiwiU3RyaW5nIiwidXNlciIsInJvb20iLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeUlkIiwiZGlyZWN0TWVzc2FnZUFsbG93IiwiZmlsZVVwbG9hZEFsbG93ZWQiLCJhdXRoeiIsImNhbkFjY2Vzc1Jvb20iLCJyZWFzb24iLCJsYW5ndWFnZSIsInQiLCJrZXkiLCJ2YWx1ZSIsInBhcnNlSW50IiwiZSIsIlNldHRpbmdzIiwicGFja2FnZVZhbHVlIiwiXyIsIlVwbG9hZEZTIiwiY29uZmlnIiwiZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMiLCJTdG9yZVBlcm1pc3Npb25zIiwiaW5zZXJ0IiwiZG9jIiwibWVzc2FnZV9pZCIsImluZGV4T2YiLCJzdG9yZSIsInNwbGl0IiwicG9wIiwidXBkYXRlIiwiaGFzUGVybWlzc2lvbiIsInJlbW92ZSIsIkZpbGVVcGxvYWRCYXNlIiwiY29uc3RydWN0b3IiLCJtZXRhIiwiaWQiLCJSYW5kb20iLCJnZXRQcm9ncmVzcyIsImdldEZpbGVOYW1lIiwibmFtZSIsInN0YXJ0IiwiY2FsbGJhY2siLCJoYW5kbGVyIiwiVXBsb2FkZXIiLCJkYXRhIiwib25FcnJvciIsImVyciIsIm9uQ29tcGxldGUiLCJmaWxlRGF0YSIsInBpY2siLCJ1cmwiLCJyZXBsYWNlIiwiYWJzb2x1dGVVcmwiLCJvcHRpb25zIiwib25Qcm9ncmVzcyIsInByb2dyZXNzIiwic3RvcCIsImV4cG9ydCIsIkZpbGVVcGxvYWRDbGFzcyIsImZzIiwic3RyZWFtIiwibWltZSIsIkZ1dHVyZSIsInNoYXJwIiwiQ29va2llcyIsImNvb2tpZSIsIk9iamVjdCIsImFzc2lnbiIsImhhbmRsZXJzIiwiY29uZmlndXJlVXBsb2Fkc1N0b3JlIiwic3RvcmVzIiwiZ2V0U3RvcmVzIiwiZGVmYXVsdFVwbG9hZHMiLCJjb2xsZWN0aW9uIiwiVXBsb2FkcyIsIm1vZGVsIiwiZmlsdGVyIiwiRmlsdGVyIiwib25DaGVjayIsImdldFBhdGgiLCJfaWQiLCJvblZhbGlkYXRlIiwidXBsb2Fkc09uVmFsaWRhdGUiLCJvblJlYWQiLCJmaWxlSWQiLCJyZXEiLCJyZXMiLCJyZXF1ZXN0Q2FuQWNjZXNzRmlsZXMiLCJ3cml0ZUhlYWQiLCJzZXRIZWFkZXIiLCJlbmNvZGVVUklDb21wb25lbnQiLCJkZWZhdWx0QXZhdGFycyIsIkF2YXRhcnMiLCJhdmF0YXJzT25WYWxpZGF0ZSIsIm9uRmluaXNoVXBsb2FkIiwiYXZhdGFyc09uRmluaXNoVXBsb2FkIiwiZGVmYXVsdFVzZXJEYXRhRmlsZXMiLCJVc2VyRGF0YUZpbGVzIiwidGVtcEZpbGVQYXRoIiwiZ2V0VGVtcEZpbGVQYXRoIiwiaGVpZ2h0IiwiZnV0dXJlIiwicyIsInJvdGF0ZSIsIm1ldGFkYXRhIiwiYmluZEVudmlyb25tZW50IiwidG9Gb3JtYXQiLCJmb3JtYXQiLCJqcGVnIiwicmVzaXplIiwiTWF0aCIsIm1pbiIsIndpZHRoIiwiSW5maW5pdHkiLCJwaXBlIiwiYmFja2dyb3VuZCIsImVtYmVkIiwidG9CdWZmZXIiLCJ0aGVuIiwib3V0cHV0QnVmZmVyIiwid3JpdGVGaWxlIiwiY29uc29sZSIsImVycm9yIiwibHN0YXRTeW5jIiwiZ2V0Q29sbGVjdGlvbiIsImRpcmVjdCIsIiRzZXQiLCJyZXR1cm4iLCJ3YWl0IiwicmVzaXplSW1hZ2VQcmV2aWV3IiwiYWRkRXh0ZW5zaW9uVG8iLCJpbWFnZSIsImdldFN0b3JlIiwiX3N0b3JlIiwiZ2V0UmVhZFN0cmVhbSIsInRyYW5zZm9ybWVyIiwibWF4IiwiYmx1ciIsInJlc3VsdCIsIm91dCIsInRvU3RyaW5nIiwidG1wRmlsZSIsImZ1dCIsImlkZW50aWZ5Iiwib3JpZW50YXRpb24iLCJ0b0ZpbGUiLCJ1bmxpbmsiLCJyZW5hbWUiLCJjYXRjaCIsIlVzZXJzIiwib2xkQXZhdGFyIiwiZmluZE9uZUJ5TmFtZSIsInVzZXJuYW1lIiwiZGVsZXRlRmlsZSIsInVwZGF0ZUZpbGVOYW1lQnlJZCIsImhlYWRlcnMiLCJxdWVyeSIsInJjX3VpZCIsInJjX3Rva2VuIiwiaXNBdXRob3JpemVkQnlDb29raWVzIiwiZmluZE9uZUJ5SWRBbmRMb2dpblRva2VuIiwiaXNBdXRob3JpemVkQnlIZWFkZXJzIiwibG9va3VwIiwiZXh0IiwiZXh0ZW5zaW9uIiwiUmVnRXhwIiwibW9kZWxOYW1lIiwic3RvcmFnZVR5cGUiLCJoYW5kbGVyTmFtZSIsImdldFN0b3JlQnlOYW1lIiwibmV4dCIsImVuZCIsImNvcHkiLCJ0YXJnZXRGaWxlIiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJnZXRNb2RlbEZyb21OYW1lIiwiZGVsZXRlIiwiZGVsZXRlQnlJZCIsImRlbGV0ZUJ5TmFtZSIsImZpbGVOYW1lIiwic3RyZWFtT3JCdWZmZXIiLCJjYiIsImdldEZpbHRlciIsImNoZWNrIiwiY3JlYXRlIiwidG9rZW4iLCJjcmVhdGVUb2tlbiIsIkJ1ZmZlciIsIndyaXRlRmlsZVN5bmMiLCJjYWxsIiwiaHR0cCIsIlVSTCIsImxvZ2dlciIsIkxvZ2dlciIsIldlYkFwcCIsImNvbm5lY3RIYW5kbGVycyIsInN0YWNrIiwidW5zaGlmdCIsInJvdXRlIiwiaGFuZGxlIiwic3RvcmVzUGF0aCIsImRlYnVnIiwibWV0aG9kIiwicGFyc2VkVXJsIiwicGFyc2UiLCJwYXRoIiwicGF0aG5hbWUiLCJzdWJzdHIiLCJsZW5ndGgiLCJyZWdFeHAiLCJtYXRjaCIsImV4ZWMiLCJmaW5kT25lIiwidW5kZWZpbmVkIiwiaW5zdGFuY2VJZCIsIkluc3RhbmNlU3RhdHVzIiwiaW5zdGFuY2UiLCJleHRyYUluZm9ybWF0aW9uIiwiaG9zdCIsInByb2Nlc3MiLCJlbnYiLCJJTlNUQU5DRV9JUCIsImlzRG9ja2VyIiwicG9ydCIsImhvc3RuYW1lIiwib3JpZ2luYWxVcmwiLCJwcm94eSIsInJlcXVlc3QiLCJwcm94eV9yZXMiLCJ1c2UiLCJwdWJsaWMiLCJzYW5kc3Rvcm0iLCJjb25maWdTdG9yZSIsImRlYm91bmNlIiwibG9nIiwiaHR0cHMiLCJmaWxlVXJsIiwiZ2V0UmVkaXJlY3RVUkwiLCJzdG9yZVR5cGUiLCJmaWxlUmVzIiwicmVtb3ZlSGVhZGVyIiwiQW1hem9uUzNVcGxvYWRzIiwiQW1hem9uUzNBdmF0YXJzIiwiQW1hem9uUzNVc2VyRGF0YUZpbGVzIiwiY29uZmlndXJlIiwiQnVja2V0IiwiQWNsIiwiQVdTQWNjZXNzS2V5SWQiLCJBV1NTZWNyZXRBY2Nlc3NLZXkiLCJVUkxFeHBpcnlUaW1lU3BhbiIsIlJlZ2lvbiIsIlNpZ25hdHVyZVZlcnNpb24iLCJGb3JjZVBhdGhTdHlsZSIsIkJ1Y2tldFVSTCIsImNvbm5lY3Rpb24iLCJzaWduYXR1cmVWZXJzaW9uIiwiczNGb3JjZVBhdGhTdHlsZSIsInBhcmFtcyIsIkFDTCIsInJlZ2lvbiIsImFjY2Vzc0tleUlkIiwic2VjcmV0QWNjZXNzS2V5IiwiZW5kcG9pbnQiLCJGaWxlU3lzdGVtVXBsb2FkcyIsImZpbGVQYXRoIiwiZ2V0RmlsZVBhdGgiLCJzdGF0Iiwid3JhcEFzeW5jIiwiaXNGaWxlIiwidXBsb2FkZWRBdCIsInRvVVRDU3RyaW5nIiwiRmlsZVN5c3RlbUF2YXRhcnMiLCJGaWxlU3lzdGVtVXNlckRhdGFGaWxlcyIsImNyZWF0ZUZpbGVTeXN0ZW1TdG9yZSIsIkdvb2dsZUNsb3VkU3RvcmFnZVVwbG9hZHMiLCJHb29nbGVDbG91ZFN0b3JhZ2VBdmF0YXJzIiwiR29vZ2xlQ2xvdWRTdG9yYWdlVXNlckRhdGFGaWxlcyIsImJ1Y2tldCIsImFjY2Vzc0lkIiwic2VjcmV0IiwiY3JlZGVudGlhbHMiLCJjbGllbnRfZW1haWwiLCJwcml2YXRlX2tleSIsInpsaWIiLCJ1dGlsIiwiRXh0cmFjdFJhbmdlIiwiYnl0ZXNfcmVhZCIsIlRyYW5zZm9ybSIsImluaGVyaXRzIiwicHJvdG90eXBlIiwiX3RyYW5zZm9ybSIsImNodW5rIiwiZW5jIiwibmV3Y2h1bmsiLCJzbGljZSIsInB1c2giLCJnZXRCeXRlUmFuZ2UiLCJoZWFkZXIiLCJtYXRjaGVzIiwicmVhZEZyb21HcmlkRlMiLCJzdG9yZU5hbWUiLCJycyIsIndzIiwiUGFzc1Rocm91Z2giLCJmb3JFYWNoIiwib24iLCJvblJlYWRFcnJvciIsImVtaXQiLCJhY2NlcHQiLCJ0cmFuc2Zvcm1SZWFkIiwicmFuZ2UiLCJvdXRfb2ZfcmFuZ2UiLCJjcmVhdGVHemlwIiwiY3JlYXRlRGVmbGF0ZSIsImNvcHlGcm9tR3JpZEZTIiwiY29sbGVjdGlvbk5hbWUiLCJjb25maWd1cmVTbGluZ3Nob3QiLCJhY2wiLCJhY2Nlc3NLZXkiLCJzZWNyZXRLZXkiLCJjZG4iLCJidWNrZXRVcmwiLCJfZGlyZWN0aXZlcyIsImlzRW1wdHkiLCJtZXRhQ29udGV4dCIsInVwbG9hZCIsIkFtYXpvblMzIiwiaW5zZXJ0RmlsZUluaXQiLCJjcmVhdGVEaXJlY3RpdmUiLCJTM1N0b3JhZ2UiLCJtZXNzYWdlIiwiY3JlYXRlR29vZ2xlU3RvcmFnZURpcmVjdGl2ZSIsIkdvb2dsZUFjY2Vzc0lkIiwiR29vZ2xlU2VjcmV0S2V5IiwiR29vZ2xlU3RvcmFnZSIsIkdvb2dsZUNsb3VkIiwiV2ViZGF2VXBsb2FkcyIsIldlYmRhdkF2YXRhcnMiLCJXZWJkYXZVc2VyRGF0YUZpbGVzIiwidXBsb2FkRm9sZGVyUGF0aCIsInNlcnZlciIsInBhc3N3b3JkIiwibWV0aG9kcyIsInJvb21JZCIsIm1zZ0RhdGEiLCJhdmF0YXIiLCJPcHRpb25hbCIsImVtb2ppIiwiYWxpYXMiLCJncm91cGFibGUiLCJCb29sZWFuIiwibXNnIiwidXBkYXRlRmlsZUNvbXBsZXRlIiwib21pdCIsImVuY29kZVVSSSIsImF0dGFjaG1lbnQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwidGl0bGVfbGluayIsInRpdGxlX2xpbmtfZG93bmxvYWQiLCJpbWFnZV91cmwiLCJpbWFnZV90eXBlIiwiaW1hZ2Vfc2l6ZSIsImltYWdlX2RpbWVuc2lvbnMiLCJpbWFnZV9wcmV2aWV3IiwiYXVkaW9fdXJsIiwiYXVkaW9fdHlwZSIsImF1ZGlvX3NpemUiLCJ2aWRlb191cmwiLCJ2aWRlb190eXBlIiwidmlkZW9fc2l6ZSIsInRzIiwiRGF0ZSIsImF0dGFjaG1lbnRzIiwiZGVmZXIiLCJjYWxsYmFja3MiLCJydW4iLCJwcm90ZWN0ZWRGaWxlcyIsImdldFMzRmlsZVVybCIsImFkZEdyb3VwIiwiYWRkIiwiaTE4bkRlc2NyaXB0aW9uIiwidmFsdWVzIiwiaTE4bkxhYmVsIiwic2VjdGlvbiIsImVuYWJsZVF1ZXJ5IiwicHJpdmF0ZSIsIm11bHRpbGluZSIsIkFtYXpvblMzU3RvcmUiLCJTMyIsIlN0b3JlIiwiZXh0ZW5kIiwiaHR0cE9wdGlvbnMiLCJ0aW1lb3V0IiwiYWdlbnQiLCJjbGFzc09wdGlvbnMiLCJzMyIsIktleSIsIkV4cGlyZXMiLCJnZXRTaWduZWRVcmwiLCJkZWxldGVPYmplY3QiLCJSYW5nZSIsImdldE9iamVjdCIsImNyZWF0ZVJlYWRTdHJlYW0iLCJnZXRXcml0ZVN0cmVhbSIsIndyaXRlU3RyZWFtIiwiZXZlbnQiLCJsaXN0ZW5lciIsIm5leHRUaWNrIiwicmVtb3ZlTGlzdGVuZXIiLCJwdXRPYmplY3QiLCJCb2R5IiwiQ29udGVudFR5cGUiLCJDb250ZW50RGlzcG9zaXRpb24iLCJHb29nbGVTdG9yYWdlU3RvcmUiLCJnY1N0b3JhZ2UiLCJnY3MiLCJnb29nbGVDbG91ZFN0b3JhZ2UiLCJhY3Rpb24iLCJyZXNwb25zZURpc3Bvc2l0aW9uIiwiZXhwaXJlcyIsIm5vdyIsImd6aXAiLCJjb250ZW50VHlwZSIsImNvbnRlbnREaXNwb3NpdGlvbiIsIldlYmRhdlN0b3JlIiwiV2ViZGF2IiwiY2xpZW50Iiwic3RhdHVzIiwiY3JlYXRlRGlyZWN0b3J5Iiwid2ViZGF2U3RyZWFtIiwibmV3TGlzdGVuZXJDYWxsYmFjayIsInNldFRpbWVvdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxRQUFKO0FBQWFDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxVQUFSLENBQWIsRUFBaUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLGVBQVNLLENBQVQ7QUFBVzs7QUFBdkIsQ0FBakMsRUFBMEQsQ0FBMUQ7QUFJYixN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QUFTaFUsTUFBVCxFQUFpQjVHLElBQWpCLEVBQXVCO0FBQzVDLFlBQU02YSxjQUFjLElBQUl6VixPQUFPbVAsV0FBWCxFQUFwQjtBQUNBLFlBQU0rSCxlQUFlSCxPQUFPN1AsaUJBQVAsQ0FBeUIsS0FBSy9GLE9BQUwsQ0FBYXZHLElBQWIsQ0FBekIsQ0FBckIsQ0FGNEMsQ0FJNUM7O0FBQ0EsWUFBTXVjLHNCQUFzQixDQUFDekIsS0FBRCxFQUFRQyxRQUFSLEtBQXFCO0FBQ2hELFlBQUlELFVBQVUsUUFBZCxFQUF3QjtBQUN2QjNMLGtCQUFRNkwsUUFBUixDQUFpQixNQUFNO0FBQ3RCSCx3QkFBWUksY0FBWixDQUEyQkgsS0FBM0IsRUFBa0NDLFFBQWxDO0FBQ0FGLHdCQUFZSSxjQUFaLENBQTJCLGFBQTNCLEVBQTBDc0IsbUJBQTFDO0FBQ0ExQix3QkFBWXBHLEVBQVosQ0FBZXFHLEtBQWYsRUFBc0IsWUFBVztBQUNoQzBCLHlCQUFXekIsUUFBWCxFQUFxQixHQUFyQjtBQUNBLGFBRkQ7QUFHQSxXQU5EO0FBT0E7QUFDRCxPQVZEOztBQVdBRixrQkFBWXBHLEVBQVosQ0FBZSxhQUFmLEVBQThCOEgsbUJBQTlCO0FBRUExQixrQkFBWW5TLElBQVosQ0FBaUI0VCxZQUFqQjtBQUNBLGFBQU96QixXQUFQO0FBQ0EsS0FwQkQ7QUFzQkE7O0FBMUg4Qzs7QUE2SGhEO0FBQ0FuWSxTQUFTUSxLQUFULENBQWVnWixNQUFmLEdBQXdCRCxXQUF4QixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2ZpbGUtdXBsb2FkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBTbGluZ3Nob3QgKi9cblxuaW1wb3J0IGZpbGVzaXplIGZyb20gJ2ZpbGVzaXplJztcblxuY29uc3Qgc2xpbmdTaG90Q29uZmlnID0ge1xuXHRhdXRob3JpemUoZmlsZS8qLCBtZXRhQ29udGV4dCovKSB7XG5cdFx0Ly9EZW55IHVwbG9hZHMgaWYgdXNlciBpcyBub3QgbG9nZ2VkIGluLlxuXHRcdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2xvZ2luLXJlcXVpcmVkJywgJ1BsZWFzZSBsb2dpbiBiZWZvcmUgcG9zdGluZyBmaWxlcycpO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5maWxlVXBsb2FkSXNWYWxpZENvbnRlbnRUeXBlKGZpbGUudHlwZSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoVEFQaTE4bi5fXygnZXJyb3ItaW52YWxpZC1maWxlLXR5cGUnKSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWF4RmlsZVNpemUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9NYXhGaWxlU2l6ZScpO1xuXG5cdFx0aWYgKG1heEZpbGVTaXplID49IC0xICYmIG1heEZpbGVTaXplIDwgZmlsZS5zaXplKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFRBUGkxOG4uX18oJ0ZpbGVfZXhjZWVkc19hbGxvd2VkX3NpemVfb2ZfYnl0ZXMnLCB7IHNpemU6IGZpbGVzaXplKG1heEZpbGVTaXplKSB9KSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdG1heFNpemU6IDAsXG5cdGFsbG93ZWRGaWxlVHlwZXM6IG51bGxcbn07XG5cblNsaW5nc2hvdC5maWxlUmVzdHJpY3Rpb25zKCdyb2NrZXRjaGF0LXVwbG9hZHMnLCBzbGluZ1Nob3RDb25maWcpO1xuU2xpbmdzaG90LmZpbGVSZXN0cmljdGlvbnMoJ3JvY2tldGNoYXQtdXBsb2Fkcy1ncycsIHNsaW5nU2hvdENvbmZpZyk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWQ6dHJ1ZSAqL1xuLyogZXhwb3J0ZWQgRmlsZVVwbG9hZCAqL1xuXG5pbXBvcnQgZmlsZXNpemUgZnJvbSAnZmlsZXNpemUnO1xuXG5sZXQgbWF4RmlsZVNpemUgPSAwO1xuXG5GaWxlVXBsb2FkID0ge1xuXHR2YWxpZGF0ZUZpbGVVcGxvYWQoZmlsZSkge1xuXHRcdGlmICghTWF0Y2gudGVzdChmaWxlLnJpZCwgU3RyaW5nKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaWxlLnJpZCk7XG5cdFx0Y29uc3QgZGlyZWN0TWVzc2FnZUFsbG93ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfRW5hYmxlZF9EaXJlY3QnKTtcblx0XHRjb25zdCBmaWxlVXBsb2FkQWxsb3dlZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0VuYWJsZWQnKTtcblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6LmNhbkFjY2Vzc1Jvb20ocm9vbSwgdXNlcikgIT09IHRydWUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoIWZpbGVVcGxvYWRBbGxvd2VkKSB7XG5cdFx0XHRjb25zdCByZWFzb24gPSBUQVBpMThuLl9fKCdGaWxlVXBsb2FkX0Rpc2FibGVkJywgdXNlci5sYW5ndWFnZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1maWxlLXVwbG9hZC1kaXNhYmxlZCcsIHJlYXNvbik7XG5cdFx0fVxuXG5cdFx0aWYgKCFkaXJlY3RNZXNzYWdlQWxsb3cgJiYgcm9vbS50ID09PSAnZCcpIHtcblx0XHRcdGNvbnN0IHJlYXNvbiA9IFRBUGkxOG4uX18oJ0ZpbGVfbm90X2FsbG93ZWRfZGlyZWN0X21lc3NhZ2VzJywgdXNlci5sYW5ndWFnZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1kaXJlY3QtbWVzc2FnZS1maWxlLXVwbG9hZC1ub3QtYWxsb3dlZCcsIHJlYXNvbik7XG5cdFx0fVxuXG5cdFx0Ly8gLTEgbWF4RmlsZVNpemUgbWVhbnMgdGhlcmUgaXMgbm8gbGltaXRcblx0XHRpZiAobWF4RmlsZVNpemUgPj0gLTEgJiYgZmlsZS5zaXplID4gbWF4RmlsZVNpemUpIHtcblx0XHRcdGNvbnN0IHJlYXNvbiA9IFRBUGkxOG4uX18oJ0ZpbGVfZXhjZWVkc19hbGxvd2VkX3NpemVfb2ZfYnl0ZXMnLCB7XG5cdFx0XHRcdHNpemU6IGZpbGVzaXplKG1heEZpbGVTaXplKVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1maWxlLXRvby1sYXJnZScsIHJlYXNvbik7XG5cdFx0fVxuXG5cdFx0aWYgKG1heEZpbGVTaXplID4gMCkge1xuXHRcdFx0aWYgKGZpbGUuc2l6ZSA+IG1heEZpbGVTaXplKSB7XG5cdFx0XHRcdGNvbnN0IHJlYXNvbiA9IFRBUGkxOG4uX18oJ0ZpbGVfZXhjZWVkc19hbGxvd2VkX3NpemVfb2ZfYnl0ZXMnLCB7XG5cdFx0XHRcdFx0c2l6ZTogZmlsZXNpemUobWF4RmlsZVNpemUpXG5cdFx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpO1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1maWxlLXRvby1sYXJnZScsIHJlYXNvbik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmZpbGVVcGxvYWRJc1ZhbGlkQ29udGVudFR5cGUoZmlsZS50eXBlKSkge1xuXHRcdFx0Y29uc3QgcmVhc29uID0gVEFQaTE4bi5fXygnRmlsZV90eXBlX2lzX25vdF9hY2NlcHRlZCcsIHVzZXIubGFuZ3VhZ2UpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1maWxlLXR5cGUnLCByZWFzb24pO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59O1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9NYXhGaWxlU2l6ZScsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0dHJ5IHtcblx0XHRtYXhGaWxlU2l6ZSA9IHBhcnNlSW50KHZhbHVlKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdG1heEZpbGVTaXplID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZUJ5SWQoJ0ZpbGVVcGxvYWRfTWF4RmlsZVNpemUnKS5wYWNrYWdlVmFsdWU7XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkQmFzZTp0cnVlLCBVcGxvYWRGUyAqL1xuLyogZXhwb3J0ZWQgRmlsZVVwbG9hZEJhc2UgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5VcGxvYWRGUy5jb25maWcuZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMgPSBuZXcgVXBsb2FkRlMuU3RvcmVQZXJtaXNzaW9ucyh7XG5cdGluc2VydCh1c2VySWQsIGRvYykge1xuXHRcdGlmICh1c2VySWQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIGFsbG93IGluc2VydHMgZnJvbSBzbGFja2JyaWRnZSAobWVzc2FnZV9pZCA9IHNsYWNrLXRpbWVzdGFtcC1taWxsaSlcblx0XHRpZiAoZG9jICYmIGRvYy5tZXNzYWdlX2lkICYmIGRvYy5tZXNzYWdlX2lkLmluZGV4T2YoJ3NsYWNrLScpID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBhbGxvdyBpbnNlcnRzIHRvIHRoZSBVc2VyRGF0YUZpbGVzIHN0b3JlXG5cdFx0aWYgKGRvYyAmJiBkb2Muc3RvcmUgJiYgZG9jLnN0b3JlLnNwbGl0KCc6JykucG9wKCkgPT09ICdVc2VyRGF0YUZpbGVzJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXHR1cGRhdGUodXNlcklkLCBkb2MpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2RlbGV0ZS1tZXNzYWdlJywgZG9jLnJpZCkgfHwgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93RGVsZXRpbmcnKSAmJiB1c2VySWQgPT09IGRvYy51c2VySWQpO1xuXHR9LFxuXHRyZW1vdmUodXNlcklkLCBkb2MpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2RlbGV0ZS1tZXNzYWdlJywgZG9jLnJpZCkgfHwgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93RGVsZXRpbmcnKSAmJiB1c2VySWQgPT09IGRvYy51c2VySWQpO1xuXHR9XG59KTtcblxuXG5GaWxlVXBsb2FkQmFzZSA9IGNsYXNzIEZpbGVVcGxvYWRCYXNlIHtcblx0Y29uc3RydWN0b3Ioc3RvcmUsIG1ldGEsIGZpbGUpIHtcblx0XHR0aGlzLmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0dGhpcy5tZXRhID0gbWV0YTtcblx0XHR0aGlzLmZpbGUgPSBmaWxlO1xuXHRcdHRoaXMuc3RvcmUgPSBzdG9yZTtcblx0fVxuXG5cdGdldFByb2dyZXNzKCkge1xuXG5cdH1cblxuXHRnZXRGaWxlTmFtZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5tZXRhLm5hbWU7XG5cdH1cblxuXHRzdGFydChjYWxsYmFjaykge1xuXHRcdHRoaXMuaGFuZGxlciA9IG5ldyBVcGxvYWRGUy5VcGxvYWRlcih7XG5cdFx0XHRzdG9yZTogdGhpcy5zdG9yZSxcblx0XHRcdGRhdGE6IHRoaXMuZmlsZSxcblx0XHRcdGZpbGU6IHRoaXMubWV0YSxcblx0XHRcdG9uRXJyb3I6IChlcnIpID0+IHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9LFxuXHRcdFx0b25Db21wbGV0ZTogKGZpbGVEYXRhKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGZpbGUgPSBfLnBpY2soZmlsZURhdGEsICdfaWQnLCAndHlwZScsICdzaXplJywgJ25hbWUnLCAnaWRlbnRpZnknLCAnZGVzY3JpcHRpb24nKTtcblxuXHRcdFx0XHRmaWxlLnVybCA9IGZpbGVEYXRhLnVybC5yZXBsYWNlKE1ldGVvci5hYnNvbHV0ZVVybCgpLCAnLycpO1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobnVsbCwgZmlsZSwgdGhpcy5zdG9yZS5vcHRpb25zLm5hbWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5oYW5kbGVyLm9uUHJvZ3Jlc3MgPSAoZmlsZSwgcHJvZ3Jlc3MpID0+IHtcblx0XHRcdHRoaXMub25Qcm9ncmVzcyhwcm9ncmVzcyk7XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmhhbmRsZXIuc3RhcnQoKTtcblx0fVxuXG5cdG9uUHJvZ3Jlc3MoKSB7fVxuXG5cdHN0b3AoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaGFuZGxlci5zdG9wKCk7XG5cdH1cbn07XG4iLCIvKiBnbG9iYWxzIFVwbG9hZEZTICovXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgbWltZSBmcm9tICdtaW1lLXR5cGUvd2l0aC1kYic7XG5pbXBvcnQgRnV0dXJlIGZyb20gJ2ZpYmVycy9mdXR1cmUnO1xuaW1wb3J0IHNoYXJwIGZyb20gJ3NoYXJwJztcbmltcG9ydCB7IENvb2tpZXMgfSBmcm9tICdtZXRlb3Ivb3N0cmlvOmNvb2tpZXMnO1xuXG5jb25zdCBjb29raWUgPSBuZXcgQ29va2llcygpO1xuXG5PYmplY3QuYXNzaWduKEZpbGVVcGxvYWQsIHtcblx0aGFuZGxlcnM6IHt9LFxuXG5cdGNvbmZpZ3VyZVVwbG9hZHNTdG9yZShzdG9yZSwgbmFtZSwgb3B0aW9ucykge1xuXHRcdGNvbnN0IHR5cGUgPSBuYW1lLnNwbGl0KCc6JykucG9wKCk7XG5cdFx0Y29uc3Qgc3RvcmVzID0gVXBsb2FkRlMuZ2V0U3RvcmVzKCk7XG5cdFx0ZGVsZXRlIHN0b3Jlc1tuYW1lXTtcblxuXHRcdHJldHVybiBuZXcgVXBsb2FkRlMuc3RvcmVbc3RvcmVdKE9iamVjdC5hc3NpZ24oe1xuXHRcdFx0bmFtZVxuXHRcdH0sIG9wdGlvbnMsIEZpbGVVcGxvYWRbYGRlZmF1bHQkeyB0eXBlIH1gXSgpKSk7XG5cdH0sXG5cblx0ZGVmYXVsdFVwbG9hZHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbGxlY3Rpb246IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMubW9kZWwsXG5cdFx0XHRmaWx0ZXI6IG5ldyBVcGxvYWRGUy5GaWx0ZXIoe1xuXHRcdFx0XHRvbkNoZWNrOiBGaWxlVXBsb2FkLnZhbGlkYXRlRmlsZVVwbG9hZFxuXHRcdFx0fSksXG5cdFx0XHRnZXRQYXRoKGZpbGUpIHtcblx0XHRcdFx0cmV0dXJuIGAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgndW5pcXVlSUQnKSB9L3VwbG9hZHMvJHsgZmlsZS5yaWQgfS8keyBmaWxlLnVzZXJJZCB9LyR7IGZpbGUuX2lkIH1gO1xuXHRcdFx0fSxcblx0XHRcdG9uVmFsaWRhdGU6IEZpbGVVcGxvYWQudXBsb2Fkc09uVmFsaWRhdGUsXG5cdFx0XHRvblJlYWQoZmlsZUlkLCBmaWxlLCByZXEsIHJlcykge1xuXHRcdFx0XHRpZiAoIUZpbGVVcGxvYWQucmVxdWVzdENhbkFjY2Vzc0ZpbGVzKHJlcSkpIHtcblx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDQwMyk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmVzLnNldEhlYWRlcignY29udGVudC1kaXNwb3NpdGlvbicsIGBhdHRhY2htZW50OyBmaWxlbmFtZT1cIiR7IGVuY29kZVVSSUNvbXBvbmVudChmaWxlLm5hbWUpIH1cImApO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGRlZmF1bHRBdmF0YXJzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb2xsZWN0aW9uOiBSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLm1vZGVsLFxuXHRcdFx0Ly8gZmlsdGVyOiBuZXcgVXBsb2FkRlMuRmlsdGVyKHtcblx0XHRcdC8vIFx0b25DaGVjazogRmlsZVVwbG9hZC52YWxpZGF0ZUZpbGVVcGxvYWRcblx0XHRcdC8vIH0pLFxuXHRcdFx0Z2V0UGF0aChmaWxlKSB7XG5cdFx0XHRcdHJldHVybiBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJykgfS9hdmF0YXJzLyR7IGZpbGUudXNlcklkIH1gO1xuXHRcdFx0fSxcblx0XHRcdG9uVmFsaWRhdGU6IEZpbGVVcGxvYWQuYXZhdGFyc09uVmFsaWRhdGUsXG5cdFx0XHRvbkZpbmlzaFVwbG9hZDogRmlsZVVwbG9hZC5hdmF0YXJzT25GaW5pc2hVcGxvYWRcblx0XHR9O1xuXHR9LFxuXG5cdGRlZmF1bHRVc2VyRGF0YUZpbGVzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb2xsZWN0aW9uOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2VyRGF0YUZpbGVzLm1vZGVsLFxuXHRcdFx0Z2V0UGF0aChmaWxlKSB7XG5cdFx0XHRcdHJldHVybiBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJykgfS91cGxvYWRzL3VzZXJEYXRhLyR7IGZpbGUudXNlcklkIH1gO1xuXHRcdFx0fSxcblx0XHRcdG9uVmFsaWRhdGU6IEZpbGVVcGxvYWQudXBsb2Fkc09uVmFsaWRhdGUsXG5cdFx0XHRvblJlYWQoZmlsZUlkLCBmaWxlLCByZXEsIHJlcykge1xuXHRcdFx0XHRpZiAoIUZpbGVVcGxvYWQucmVxdWVzdENhbkFjY2Vzc0ZpbGVzKHJlcSkpIHtcblx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDQwMyk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmVzLnNldEhlYWRlcignY29udGVudC1kaXNwb3NpdGlvbicsIGBhdHRhY2htZW50OyBmaWxlbmFtZT1cIiR7IGVuY29kZVVSSUNvbXBvbmVudChmaWxlLm5hbWUpIH1cImApO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGF2YXRhcnNPblZhbGlkYXRlKGZpbGUpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX0F2YXRhclJlc2l6ZScpICE9PSB0cnVlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgdGVtcEZpbGVQYXRoID0gVXBsb2FkRlMuZ2V0VGVtcEZpbGVQYXRoKGZpbGUuX2lkKTtcblxuXHRcdGNvbnN0IGhlaWdodCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19BdmF0YXJTaXplJyk7XG5cdFx0Y29uc3QgZnV0dXJlID0gbmV3IEZ1dHVyZSgpO1xuXG5cdFx0Y29uc3QgcyA9IHNoYXJwKHRlbXBGaWxlUGF0aCk7XG5cdFx0cy5yb3RhdGUoKTtcblx0XHQvLyBHZXQgbWV0YWRhdGEgdG8gcmVzaXplIHRoZSBpbWFnZSB0aGUgZmlyc3QgdGltZSB0byBrZWVwIFwiaW5zaWRlXCIgdGhlIGRpbWVuc2lvbnNcblx0XHQvLyB0aGVuIHJlc2l6ZSBhZ2FpbiB0byBjcmVhdGUgdGhlIGNhbnZhcyBhcm91bmRcblxuXHRcdHMubWV0YWRhdGEoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZXJyLCBtZXRhZGF0YSkgPT4ge1xuXHRcdFx0aWYgKCFtZXRhZGF0YSkge1xuXHRcdFx0XHRtZXRhZGF0YSA9IHt9O1xuXHRcdFx0fVxuXG5cdFx0XHRzLnRvRm9ybWF0KHNoYXJwLmZvcm1hdC5qcGVnKVxuXHRcdFx0XHQucmVzaXplKE1hdGgubWluKGhlaWdodCB8fCAwLCBtZXRhZGF0YS53aWR0aCB8fCBJbmZpbml0eSksIE1hdGgubWluKGhlaWdodCB8fCAwLCBtZXRhZGF0YS5oZWlnaHQgfHwgSW5maW5pdHkpKVxuXHRcdFx0XHQucGlwZShzaGFycCgpXG5cdFx0XHRcdFx0LnJlc2l6ZShoZWlnaHQsIGhlaWdodClcblx0XHRcdFx0XHQuYmFja2dyb3VuZCgnI0ZGRkZGRicpXG5cdFx0XHRcdFx0LmVtYmVkKClcblx0XHRcdFx0KVxuXHRcdFx0XHQvLyBVc2UgYnVmZmVyIHRvIGdldCB0aGUgcmVzdWx0IGluIG1lbW9yeSB0aGVuIHJlcGxhY2UgdGhlIGV4aXN0aW5nIGZpbGVcblx0XHRcdFx0Ly8gVGhlcmUgaXMgbm8gb3B0aW9uIHRvIG92ZXJyaWRlIGEgZmlsZSB1c2luZyB0aGlzIGxpYnJhcnlcblx0XHRcdFx0LnRvQnVmZmVyKClcblx0XHRcdFx0LnRoZW4oTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChvdXRwdXRCdWZmZXIgPT4ge1xuXHRcdFx0XHRcdGZzLndyaXRlRmlsZSh0ZW1wRmlsZVBhdGgsIG91dHB1dEJ1ZmZlciwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChlcnIgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbnN0IHNpemUgPSBmcy5sc3RhdFN5bmModGVtcEZpbGVQYXRoKS5zaXplO1xuXHRcdFx0XHRcdFx0dGhpcy5nZXRDb2xsZWN0aW9uKCkuZGlyZWN0LnVwZGF0ZSh7X2lkOiBmaWxlLl9pZH0sIHskc2V0OiB7c2l6ZX19KTtcblx0XHRcdFx0XHRcdGZ1dHVyZS5yZXR1cm4oKTtcblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdH0pKTtcblx0XHR9KSk7XG5cblx0XHRyZXR1cm4gZnV0dXJlLndhaXQoKTtcblx0fSxcblxuXHRyZXNpemVJbWFnZVByZXZpZXcoZmlsZSkge1xuXHRcdGZpbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmRPbmVCeUlkKGZpbGUuX2lkKTtcblx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblx0XHRjb25zdCBpbWFnZSA9IEZpbGVVcGxvYWQuZ2V0U3RvcmUoJ1VwbG9hZHMnKS5fc3RvcmUuZ2V0UmVhZFN0cmVhbShmaWxlLl9pZCwgZmlsZSk7XG5cblx0XHRjb25zdCB0cmFuc2Zvcm1lciA9IHNoYXJwKClcblx0XHRcdC5yZXNpemUoMzIsIDMyKVxuXHRcdFx0Lm1heCgpXG5cdFx0XHQuanBlZygpXG5cdFx0XHQuYmx1cigpO1xuXHRcdGNvbnN0IHJlc3VsdCA9IHRyYW5zZm9ybWVyLnRvQnVmZmVyKCkudGhlbigob3V0KSA9PiBvdXQudG9TdHJpbmcoJ2Jhc2U2NCcpKTtcblx0XHRpbWFnZS5waXBlKHRyYW5zZm9ybWVyKTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXG5cdHVwbG9hZHNPblZhbGlkYXRlKGZpbGUpIHtcblx0XHRpZiAoIS9eaW1hZ2VcXC8oKHgtd2luZG93cy0pP2JtcHxwP2pwZWd8cG5nKSQvLnRlc3QoZmlsZS50eXBlKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHRtcEZpbGUgPSBVcGxvYWRGUy5nZXRUZW1wRmlsZVBhdGgoZmlsZS5faWQpO1xuXG5cdFx0Y29uc3QgZnV0ID0gbmV3IEZ1dHVyZSgpO1xuXG5cdFx0Y29uc3QgcyA9IHNoYXJwKHRtcEZpbGUpO1xuXHRcdHMubWV0YWRhdGEoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZXJyLCBtZXRhZGF0YSkgPT4ge1xuXHRcdFx0aWYgKGVyciAhPSBudWxsKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHRcdFx0cmV0dXJuIGZ1dC5yZXR1cm4oKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaWRlbnRpZnkgPSB7XG5cdFx0XHRcdGZvcm1hdDogbWV0YWRhdGEuZm9ybWF0LFxuXHRcdFx0XHRzaXplOiB7XG5cdFx0XHRcdFx0d2lkdGg6IG1ldGFkYXRhLndpZHRoLFxuXHRcdFx0XHRcdGhlaWdodDogbWV0YWRhdGEuaGVpZ2h0XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGlmIChtZXRhZGF0YS5vcmllbnRhdGlvbiA9PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiBmdXQucmV0dXJuKCk7XG5cdFx0XHR9XG5cblx0XHRcdHMucm90YXRlKClcblx0XHRcdFx0LnRvRmlsZShgJHsgdG1wRmlsZSB9LnRtcGApXG5cdFx0XHRcdC50aGVuKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuXHRcdFx0XHRcdGZzLnVubGluayh0bXBGaWxlLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRcdGZzLnJlbmFtZShgJHsgdG1wRmlsZSB9LnRtcGAsIHRtcEZpbGUsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBzaXplID0gZnMubHN0YXRTeW5jKHRtcEZpbGUpLnNpemU7XG5cdFx0XHRcdFx0XHRcdHRoaXMuZ2V0Q29sbGVjdGlvbigpLmRpcmVjdC51cGRhdGUoe19pZDogZmlsZS5faWR9LCB7XG5cdFx0XHRcdFx0XHRcdFx0JHNldDoge1xuXHRcdFx0XHRcdFx0XHRcdFx0c2l6ZSxcblx0XHRcdFx0XHRcdFx0XHRcdGlkZW50aWZ5XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0ZnV0LnJldHVybigpO1xuXHRcdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0fSkpLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdFx0ZnV0LnJldHVybigpO1xuXHRcdFx0XHR9KTtcblx0XHR9KSk7XG5cblx0XHRyZXR1cm4gZnV0LndhaXQoKTtcblx0fSxcblxuXHRhdmF0YXJzT25GaW5pc2hVcGxvYWQoZmlsZSkge1xuXHRcdC8vIHVwZGF0ZSBmaWxlIHJlY29yZCB0byBtYXRjaCB1c2VyJ3MgdXNlcm5hbWVcblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoZmlsZS51c2VySWQpO1xuXHRcdGNvbnN0IG9sZEF2YXRhciA9IFJvY2tldENoYXQubW9kZWxzLkF2YXRhcnMuZmluZE9uZUJ5TmFtZSh1c2VyLnVzZXJuYW1lKTtcblx0XHRpZiAob2xkQXZhdGFyKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLmRlbGV0ZUZpbGUob2xkQXZhdGFyLl9pZCk7XG5cdFx0fVxuXHRcdFJvY2tldENoYXQubW9kZWxzLkF2YXRhcnMudXBkYXRlRmlsZU5hbWVCeUlkKGZpbGUuX2lkLCB1c2VyLnVzZXJuYW1lKTtcblx0XHQvLyBjb25zb2xlLmxvZygndXBsb2FkIGZpbmlzaGVkIC0+JywgZmlsZSk7XG5cdH0sXG5cblx0cmVxdWVzdENhbkFjY2Vzc0ZpbGVzKHsgaGVhZGVycyA9IHt9LCBxdWVyeSA9IHt9IH0pIHtcblx0XHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1Byb3RlY3RGaWxlcycpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgeyByY191aWQsIHJjX3Rva2VuIH0gPSBxdWVyeTtcblxuXHRcdGlmICghcmNfdWlkICYmIGhlYWRlcnMuY29va2llKSB7XG5cdFx0XHRyY191aWQgPSBjb29raWUuZ2V0KCdyY191aWQnLCBoZWFkZXJzLmNvb2tpZSk7XG5cdFx0XHRyY190b2tlbiA9IGNvb2tpZS5nZXQoJ3JjX3Rva2VuJywgaGVhZGVycy5jb29raWUpO1xuXHRcdH1cblx0XHRjb25zdCBpc0F1dGhvcml6ZWRCeUNvb2tpZXMgPSByY191aWQgJiYgcmNfdG9rZW4gJiYgUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWRBbmRMb2dpblRva2VuKHJjX3VpZCwgcmNfdG9rZW4pO1xuXHRcdGNvbnN0IGlzQXV0aG9yaXplZEJ5SGVhZGVycyA9IGhlYWRlcnNbJ3gtdXNlci1pZCddICYmIGhlYWRlcnNbJ3gtYXV0aC10b2tlbiddICYmIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkQW5kTG9naW5Ub2tlbihoZWFkZXJzWyd4LXVzZXItaWQnXSwgaGVhZGVyc1sneC1hdXRoLXRva2VuJ10pO1xuXHRcdHJldHVybiBpc0F1dGhvcml6ZWRCeUNvb2tpZXMgfHwgaXNBdXRob3JpemVkQnlIZWFkZXJzO1xuXHR9LFxuXHRhZGRFeHRlbnNpb25UbyhmaWxlKSB7XG5cdFx0aWYgKG1pbWUubG9va3VwKGZpbGUubmFtZSkgPT09IGZpbGUudHlwZSkge1xuXHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZXh0ID0gbWltZS5leHRlbnNpb24oZmlsZS50eXBlKTtcblx0XHRpZiAoZXh0ICYmIGZhbHNlID09PSBuZXcgUmVnRXhwKGBcXC4keyBleHQgfSRgLCAnaScpLnRlc3QoZmlsZS5uYW1lKSkge1xuXHRcdFx0ZmlsZS5uYW1lID0gYCR7IGZpbGUubmFtZSB9LiR7IGV4dCB9YDtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmlsZTtcblx0fSxcblxuXHRnZXRTdG9yZShtb2RlbE5hbWUpIHtcblx0XHRjb25zdCBzdG9yYWdlVHlwZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScpO1xuXHRcdGNvbnN0IGhhbmRsZXJOYW1lID0gYCR7IHN0b3JhZ2VUeXBlIH06JHsgbW9kZWxOYW1lIH1gO1xuXG5cdFx0cmV0dXJuIHRoaXMuZ2V0U3RvcmVCeU5hbWUoaGFuZGxlck5hbWUpO1xuXHR9LFxuXG5cdGdldFN0b3JlQnlOYW1lKGhhbmRsZXJOYW1lKSB7XG5cdFx0aWYgKHRoaXMuaGFuZGxlcnNbaGFuZGxlck5hbWVdID09IG51bGwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFVwbG9hZCBoYW5kbGVyIFwiJHsgaGFuZGxlck5hbWUgfVwiIGRvZXMgbm90IGV4aXN0c2ApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5oYW5kbGVyc1toYW5kbGVyTmFtZV07XG5cdH0sXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzLCBuZXh0KSB7XG5cdFx0Y29uc3Qgc3RvcmUgPSB0aGlzLmdldFN0b3JlQnlOYW1lKGZpbGUuc3RvcmUpO1xuXHRcdGlmIChzdG9yZSAmJiBzdG9yZS5nZXQpIHtcblx0XHRcdHJldHVybiBzdG9yZS5nZXQoZmlsZSwgcmVxLCByZXMsIG5leHQpO1xuXHRcdH1cblx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0cmVzLmVuZCgpO1xuXHR9LFxuXG5cdGNvcHkoZmlsZSwgdGFyZ2V0RmlsZSkge1xuXHRcdGNvbnN0IHN0b3JlID0gdGhpcy5nZXRTdG9yZUJ5TmFtZShmaWxlLnN0b3JlKTtcblx0XHRjb25zdCBvdXQgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0YXJnZXRGaWxlKTtcblxuXHRcdGZpbGUgPSBGaWxlVXBsb2FkLmFkZEV4dGVuc2lvblRvKGZpbGUpO1xuXG5cdFx0aWYgKHN0b3JlLmNvcHkpIHtcblx0XHRcdHN0b3JlLmNvcHkoZmlsZSwgb3V0KTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufSk7XG5cbmV4cG9ydCBjbGFzcyBGaWxlVXBsb2FkQ2xhc3Mge1xuXHRjb25zdHJ1Y3Rvcih7IG5hbWUsIG1vZGVsLCBzdG9yZSwgZ2V0LCBpbnNlcnQsIGdldFN0b3JlLCBjb3B5IH0pIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLmdldE1vZGVsRnJvbU5hbWUoKTtcblx0XHR0aGlzLl9zdG9yZSA9IHN0b3JlIHx8IFVwbG9hZEZTLmdldFN0b3JlKG5hbWUpO1xuXHRcdHRoaXMuZ2V0ID0gZ2V0O1xuXHRcdHRoaXMuY29weSA9IGNvcHk7XG5cblx0XHRpZiAoaW5zZXJ0KSB7XG5cdFx0XHR0aGlzLmluc2VydCA9IGluc2VydDtcblx0XHR9XG5cblx0XHRpZiAoZ2V0U3RvcmUpIHtcblx0XHRcdHRoaXMuZ2V0U3RvcmUgPSBnZXRTdG9yZTtcblx0XHR9XG5cblx0XHRGaWxlVXBsb2FkLmhhbmRsZXJzW25hbWVdID0gdGhpcztcblx0fVxuXG5cdGdldFN0b3JlKCkge1xuXHRcdHJldHVybiB0aGlzLl9zdG9yZTtcblx0fVxuXG5cdGdldCBzdG9yZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRTdG9yZSgpO1xuXHR9XG5cblx0c2V0IHN0b3JlKHN0b3JlKSB7XG5cdFx0dGhpcy5fc3RvcmUgPSBzdG9yZTtcblx0fVxuXG5cdGdldE1vZGVsRnJvbU5hbWUoKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzW3RoaXMubmFtZS5zcGxpdCgnOicpWzFdXTtcblx0fVxuXG5cdGRlbGV0ZShmaWxlSWQpIHtcblx0XHRpZiAodGhpcy5zdG9yZSAmJiB0aGlzLnN0b3JlLmRlbGV0ZSkge1xuXHRcdFx0dGhpcy5zdG9yZS5kZWxldGUoZmlsZUlkKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5tb2RlbC5kZWxldGVGaWxlKGZpbGVJZCk7XG5cdH1cblxuXHRkZWxldGVCeUlkKGZpbGVJZCkge1xuXHRcdGNvbnN0IGZpbGUgPSB0aGlzLm1vZGVsLmZpbmRPbmVCeUlkKGZpbGVJZCk7XG5cblx0XHRpZiAoIWZpbGUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBzdG9yZSA9IEZpbGVVcGxvYWQuZ2V0U3RvcmVCeU5hbWUoZmlsZS5zdG9yZSk7XG5cblx0XHRyZXR1cm4gc3RvcmUuZGVsZXRlKGZpbGUuX2lkKTtcblx0fVxuXG5cdGRlbGV0ZUJ5TmFtZShmaWxlTmFtZSkge1xuXHRcdGNvbnN0IGZpbGUgPSB0aGlzLm1vZGVsLmZpbmRPbmVCeU5hbWUoZmlsZU5hbWUpO1xuXG5cdFx0aWYgKCFmaWxlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlQnlOYW1lKGZpbGUuc3RvcmUpO1xuXG5cdFx0cmV0dXJuIHN0b3JlLmRlbGV0ZShmaWxlLl9pZCk7XG5cdH1cblxuXHRpbnNlcnQoZmlsZURhdGEsIHN0cmVhbU9yQnVmZmVyLCBjYikge1xuXHRcdGZpbGVEYXRhLnNpemUgPSBwYXJzZUludChmaWxlRGF0YS5zaXplKSB8fCAwO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlIGZpbGVEYXRhIG1hdGNoZXMgc3RvcmUgZmlsdGVyXG5cdFx0Y29uc3QgZmlsdGVyID0gdGhpcy5zdG9yZS5nZXRGaWx0ZXIoKTtcblx0XHRpZiAoZmlsdGVyICYmIGZpbHRlci5jaGVjaykge1xuXHRcdFx0ZmlsdGVyLmNoZWNrKGZpbGVEYXRhKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlSWQgPSB0aGlzLnN0b3JlLmNyZWF0ZShmaWxlRGF0YSk7XG5cdFx0Y29uc3QgdG9rZW4gPSB0aGlzLnN0b3JlLmNyZWF0ZVRva2VuKGZpbGVJZCk7XG5cdFx0Y29uc3QgdG1wRmlsZSA9IFVwbG9hZEZTLmdldFRlbXBGaWxlUGF0aChmaWxlSWQpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChzdHJlYW1PckJ1ZmZlciBpbnN0YW5jZW9mIHN0cmVhbSkge1xuXHRcdFx0XHRzdHJlYW1PckJ1ZmZlci5waXBlKGZzLmNyZWF0ZVdyaXRlU3RyZWFtKHRtcEZpbGUpKTtcblx0XHRcdH0gZWxzZSBpZiAoc3RyZWFtT3JCdWZmZXIgaW5zdGFuY2VvZiBCdWZmZXIpIHtcblx0XHRcdFx0ZnMud3JpdGVGaWxlU3luYyh0bXBGaWxlLCBzdHJlYW1PckJ1ZmZlcik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZmlsZSB0eXBlJyk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGZpbGUgPSBNZXRlb3IuY2FsbCgndWZzQ29tcGxldGUnLCBmaWxlSWQsIHRoaXMubmFtZSwgdG9rZW4pO1xuXG5cdFx0XHRpZiAoY2IpIHtcblx0XHRcdFx0Y2IobnVsbCwgZmlsZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmaWxlO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChjYikge1xuXHRcdFx0XHRjYihlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IGU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iLCIvKiBnbG9iYWxzIFVwbG9hZEZTLCBJbnN0YW5jZVN0YXR1cyAqL1xuXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBVUkwgZnJvbSAndXJsJztcblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignVXBsb2FkUHJveHknKTtcblxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy5zdGFjay51bnNoaWZ0KHtcblx0cm91dGU6ICcnLFxuXHRoYW5kbGU6IE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcblx0XHQvLyBRdWljayBjaGVjayB0byBzZWUgaWYgcmVxdWVzdCBzaG91bGQgYmUgY2F0Y2hcblx0XHRpZiAocmVxLnVybC5pbmRleE9mKFVwbG9hZEZTLmNvbmZpZy5zdG9yZXNQYXRoKSA9PT0gLTEpIHtcblx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLmRlYnVnKCdVcGxvYWQgVVJMOicsIHJlcS51cmwpO1xuXG5cdFx0aWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuXHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHR9XG5cblx0XHQvLyBSZW1vdmUgc3RvcmUgcGF0aFxuXHRcdGNvbnN0IHBhcnNlZFVybCA9IFVSTC5wYXJzZShyZXEudXJsKTtcblx0XHRjb25zdCBwYXRoID0gcGFyc2VkVXJsLnBhdGhuYW1lLnN1YnN0cihVcGxvYWRGUy5jb25maWcuc3RvcmVzUGF0aC5sZW5ndGggKyAxKTtcblxuXHRcdC8vIEdldCBzdG9yZVxuXHRcdGNvbnN0IHJlZ0V4cCA9IG5ldyBSZWdFeHAoJ15cXC8oW15cXC9cXD9dKylcXC8oW15cXC9cXD9dKykkJyk7XG5cdFx0Y29uc3QgbWF0Y2ggPSByZWdFeHAuZXhlYyhwYXRoKTtcblxuXHRcdC8vIFJlcXVlc3QgaXMgbm90IHZhbGlkXG5cdFx0aWYgKG1hdGNoID09PSBudWxsKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwMCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gR2V0IHN0b3JlXG5cdFx0Y29uc3Qgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShtYXRjaFsxXSk7XG5cdFx0aWYgKCFzdG9yZSkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEdldCBmaWxlXG5cdFx0Y29uc3QgZmlsZUlkID0gbWF0Y2hbMl07XG5cdFx0Y29uc3QgZmlsZSA9IHN0b3JlLmdldENvbGxlY3Rpb24oKS5maW5kT25lKHtfaWQ6IGZpbGVJZH0pO1xuXHRcdGlmIChmaWxlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDA0KTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoZmlsZS5pbnN0YW5jZUlkID09PSBJbnN0YW5jZVN0YXR1cy5pZCgpKSB7XG5cdFx0XHRsb2dnZXIuZGVidWcoJ0NvcnJlY3QgaW5zdGFuY2UnKTtcblx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0fVxuXG5cdFx0Ly8gUHJveHkgdG8gb3RoZXIgaW5zdGFuY2Vcblx0XHRjb25zdCBpbnN0YW5jZSA9IEluc3RhbmNlU3RhdHVzLmdldENvbGxlY3Rpb24oKS5maW5kT25lKHtfaWQ6IGZpbGUuaW5zdGFuY2VJZH0pO1xuXG5cdFx0aWYgKGluc3RhbmNlID09IG51bGwpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDA0KTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoaW5zdGFuY2UuZXh0cmFJbmZvcm1hdGlvbi5ob3N0ID09PSBwcm9jZXNzLmVudi5JTlNUQU5DRV9JUCAmJiBSb2NrZXRDaGF0LmlzRG9ja2VyKCkgPT09IGZhbHNlKSB7XG5cdFx0XHRpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLmhvc3QgPSAnbG9jYWxob3N0Jztcblx0XHR9XG5cblx0XHRsb2dnZXIuZGVidWcoJ1dyb25nIGluc3RhbmNlLCBwcm94aW5nIHRvOicsIGAkeyBpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLmhvc3QgfTokeyBpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLnBvcnQgfWApO1xuXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdGhvc3RuYW1lOiBpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLmhvc3QsXG5cdFx0XHRwb3J0OiBpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLnBvcnQsXG5cdFx0XHRwYXRoOiByZXEub3JpZ2luYWxVcmwsXG5cdFx0XHRtZXRob2Q6ICdQT1NUJ1xuXHRcdH07XG5cblx0XHRjb25zdCBwcm94eSA9IGh0dHAucmVxdWVzdChvcHRpb25zLCBmdW5jdGlvbihwcm94eV9yZXMpIHtcblx0XHRcdHByb3h5X3Jlcy5waXBlKHJlcywge1xuXHRcdFx0XHRlbmQ6IHRydWVcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmVxLnBpcGUocHJveHksIHtcblx0XHRcdGVuZDogdHJ1ZVxuXHRcdH0pO1xuXHR9KVxufSk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWQsIFdlYkFwcCAqL1xuXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgnL2ZpbGUtdXBsb2FkLycsXHRmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXG5cdGNvbnN0IG1hdGNoID0gL15cXC8oW15cXC9dKylcXC8oLiopLy5leGVjKHJlcS51cmwpO1xuXG5cdGlmIChtYXRjaFsxXSkge1xuXHRcdGNvbnN0IGZpbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmRPbmVCeUlkKG1hdGNoWzFdKTtcblxuXHRcdGlmIChmaWxlKSB7XG5cdFx0XHRpZiAoIU1ldGVvci5zZXR0aW5ncy5wdWJsaWMuc2FuZHN0b3JtICYmICFGaWxlVXBsb2FkLnJlcXVlc3RDYW5BY2Nlc3NGaWxlcyhyZXEpKSB7XG5cdFx0XHRcdHJlcy53cml0ZUhlYWQoNDAzKTtcblx0XHRcdFx0cmV0dXJuIHJlcy5lbmQoKTtcblx0XHRcdH1cblxuXHRcdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1TZWN1cml0eS1Qb2xpY3knLCAnZGVmYXVsdC1zcmMgXFwnbm9uZVxcJycpO1xuXHRcdFx0cmV0dXJuIEZpbGVVcGxvYWQuZ2V0KGZpbGUsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9XG5cdH1cblxuXHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdHJlcy5lbmQoKTtcbn0pO1xuIiwiLyogZ2xvYmFscyBVcGxvYWRGUyAqL1xuXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCAnLi9BbWF6b25TMy5qcyc7XG5pbXBvcnQgJy4vRmlsZVN5c3RlbS5qcyc7XG5pbXBvcnQgJy4vR29vZ2xlU3RvcmFnZS5qcyc7XG5pbXBvcnQgJy4vR3JpZEZTLmpzJztcbmltcG9ydCAnLi9XZWJkYXYuanMnO1xuaW1wb3J0ICcuL1NsaW5nc2hvdF9ERVBSRUNBVEVELmpzJztcblxuY29uc3QgY29uZmlnU3RvcmUgPSBfLmRlYm91bmNlKCgpID0+IHtcblx0Y29uc3Qgc3RvcmUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnKTtcblxuXHRpZiAoc3RvcmUpIHtcblx0XHRjb25zb2xlLmxvZygnU2V0dGluZyBkZWZhdWx0IGZpbGUgc3RvcmUgdG8nLCBzdG9yZSk7XG5cdFx0VXBsb2FkRlMuZ2V0U3RvcmVzKCkuQXZhdGFycyA9IFVwbG9hZEZTLmdldFN0b3JlKGAkeyBzdG9yZSB9OkF2YXRhcnNgKTtcblx0XHRVcGxvYWRGUy5nZXRTdG9yZXMoKS5VcGxvYWRzID0gVXBsb2FkRlMuZ2V0U3RvcmUoYCR7IHN0b3JlIH06VXBsb2Fkc2ApO1xuXHRcdFVwbG9hZEZTLmdldFN0b3JlcygpLlVzZXJEYXRhRmlsZXMgPSBVcGxvYWRGUy5nZXRTdG9yZShgJHsgc3RvcmUgfTpVc2VyRGF0YUZpbGVzYCk7XG5cdH1cbn0sIDEwMDApO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfLywgY29uZmlnU3RvcmUpO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkICovXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHsgRmlsZVVwbG9hZENsYXNzIH0gZnJvbSAnLi4vbGliL0ZpbGVVcGxvYWQnO1xuaW1wb3J0ICcuLi8uLi91ZnMvQW1hem9uUzMvc2VydmVyLmpzJztcbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0IGh0dHBzIGZyb20gJ2h0dHBzJztcblxuY29uc3QgZ2V0ID0gZnVuY3Rpb24oZmlsZSwgcmVxLCByZXMpIHtcblx0Y29uc3QgZmlsZVVybCA9IHRoaXMuc3RvcmUuZ2V0UmVkaXJlY3RVUkwoZmlsZSk7XG5cblx0aWYgKGZpbGVVcmwpIHtcblx0XHRjb25zdCBzdG9yZVR5cGUgPSBmaWxlLnN0b3JlLnNwbGl0KCc6JykucG9wKCk7XG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KGBGaWxlVXBsb2FkX1MzX1Byb3h5XyR7IHN0b3JlVHlwZSB9YCkpIHtcblx0XHRcdGNvbnN0IHJlcXVlc3QgPSAvXmh0dHBzOi8udGVzdChmaWxlVXJsKSA/IGh0dHBzIDogaHR0cDtcblx0XHRcdHJlcXVlc3QuZ2V0KGZpbGVVcmwsIGZpbGVSZXMgPT4gZmlsZVJlcy5waXBlKHJlcykpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXMucmVtb3ZlSGVhZGVyKCdDb250ZW50LUxlbmd0aCcpO1xuXHRcdFx0cmVzLnNldEhlYWRlcignTG9jYXRpb24nLCBmaWxlVXJsKTtcblx0XHRcdHJlcy53cml0ZUhlYWQoMzAyKTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmVzLmVuZCgpO1xuXHR9XG59O1xuXG5jb25zdCBjb3B5ID0gZnVuY3Rpb24oZmlsZSwgb3V0KSB7XG5cdGNvbnN0IGZpbGVVcmwgPSB0aGlzLnN0b3JlLmdldFJlZGlyZWN0VVJMKGZpbGUpO1xuXG5cdGlmIChmaWxlVXJsKSB7XG5cdFx0Y29uc3QgcmVxdWVzdCA9IC9eaHR0cHM6Ly50ZXN0KGZpbGVVcmwpID8gaHR0cHMgOiBodHRwO1xuXHRcdHJlcXVlc3QuZ2V0KGZpbGVVcmwsIGZpbGVSZXMgPT4gZmlsZVJlcy5waXBlKG91dCkpO1xuXHR9IGVsc2Uge1xuXHRcdG91dC5lbmQoKTtcblx0fVxufTtcblxuY29uc3QgQW1hem9uUzNVcGxvYWRzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdBbWF6b25TMzpVcGxvYWRzJyxcblx0Z2V0LFxuXHRjb3B5XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBBbWF6b25TM0F2YXRhcnMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0FtYXpvblMzOkF2YXRhcnMnLFxuXHRnZXQsXG5cdGNvcHlcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xufSk7XG5cbmNvbnN0IEFtYXpvblMzVXNlckRhdGFGaWxlcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnQW1hem9uUzM6VXNlckRhdGFGaWxlcycsXG5cdGdldCxcblx0Y29weVxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgY29uZmlndXJlID0gXy5kZWJvdW5jZShmdW5jdGlvbigpIHtcblx0Y29uc3QgQnVja2V0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQnVja2V0Jyk7XG5cdGNvbnN0IEFjbCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0FjbCcpO1xuXHRjb25zdCBBV1NBY2Nlc3NLZXlJZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0FXU0FjY2Vzc0tleUlkJyk7XG5cdGNvbnN0IEFXU1NlY3JldEFjY2Vzc0tleSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0FXU1NlY3JldEFjY2Vzc0tleScpO1xuXHRjb25zdCBVUkxFeHBpcnlUaW1lU3BhbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX1VSTEV4cGlyeVRpbWVTcGFuJyk7XG5cdGNvbnN0IFJlZ2lvbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX1JlZ2lvbicpO1xuXHRjb25zdCBTaWduYXR1cmVWZXJzaW9uID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfU2lnbmF0dXJlVmVyc2lvbicpO1xuXHRjb25zdCBGb3JjZVBhdGhTdHlsZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0ZvcmNlUGF0aFN0eWxlJyk7XG5cdC8vIGNvbnN0IENETiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0NETicpO1xuXHRjb25zdCBCdWNrZXRVUkwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19CdWNrZXRVUkwnKTtcblxuXHRpZiAoIUJ1Y2tldCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IGNvbmZpZyA9IHtcblx0XHRjb25uZWN0aW9uOiB7XG5cdFx0XHRzaWduYXR1cmVWZXJzaW9uOiBTaWduYXR1cmVWZXJzaW9uLFxuXHRcdFx0czNGb3JjZVBhdGhTdHlsZTogRm9yY2VQYXRoU3R5bGUsXG5cdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0QnVja2V0LFxuXHRcdFx0XHRBQ0w6IEFjbFxuXHRcdFx0fSxcblx0XHRcdHJlZ2lvbjogUmVnaW9uXG5cdFx0fSxcblx0XHRVUkxFeHBpcnlUaW1lU3BhblxuXHR9O1xuXG5cdGlmIChBV1NBY2Nlc3NLZXlJZCkge1xuXHRcdGNvbmZpZy5jb25uZWN0aW9uLmFjY2Vzc0tleUlkID0gQVdTQWNjZXNzS2V5SWQ7XG5cdH1cblxuXHRpZiAoQVdTU2VjcmV0QWNjZXNzS2V5KSB7XG5cdFx0Y29uZmlnLmNvbm5lY3Rpb24uc2VjcmV0QWNjZXNzS2V5ID0gQVdTU2VjcmV0QWNjZXNzS2V5O1xuXHR9XG5cblx0aWYgKEJ1Y2tldFVSTCkge1xuXHRcdGNvbmZpZy5jb25uZWN0aW9uLmVuZHBvaW50ID0gQnVja2V0VVJMO1xuXHR9XG5cblx0QW1hem9uUzNVcGxvYWRzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0FtYXpvblMzJywgQW1hem9uUzNVcGxvYWRzLm5hbWUsIGNvbmZpZyk7XG5cdEFtYXpvblMzQXZhdGFycy5zdG9yZSA9IEZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdBbWF6b25TMycsIEFtYXpvblMzQXZhdGFycy5uYW1lLCBjb25maWcpO1xuXHRBbWF6b25TM1VzZXJEYXRhRmlsZXMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnQW1hem9uUzMnLCBBbWF6b25TM1VzZXJEYXRhRmlsZXMubmFtZSwgY29uZmlnKTtcbn0sIDUwMCk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KC9eRmlsZVVwbG9hZF9TM18vLCBjb25maWd1cmUpO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkLCBVcGxvYWRGUyAqL1xuXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgeyBGaWxlVXBsb2FkQ2xhc3MgfSBmcm9tICcuLi9saWIvRmlsZVVwbG9hZCc7XG5cbmNvbnN0IEZpbGVTeXN0ZW1VcGxvYWRzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdGaWxlU3lzdGVtOlVwbG9hZHMnLFxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0Y29uc3QgZmlsZVBhdGggPSB0aGlzLnN0b3JlLmdldEZpbGVQYXRoKGZpbGUuX2lkLCBmaWxlKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBzdGF0ID0gTWV0ZW9yLndyYXBBc3luYyhmcy5zdGF0KShmaWxlUGF0aCk7XG5cblx0XHRcdGlmIChzdGF0ICYmIHN0YXQuaXNGaWxlKCkpIHtcblx0XHRcdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBgYXR0YWNobWVudDsgZmlsZW5hbWUqPVVURi04JyckeyBlbmNvZGVVUklDb21wb25lbnQoZmlsZS5uYW1lKSB9YCk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBmaWxlLnVwbG9hZGVkQXQudG9VVENTdHJpbmcoKSk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIGZpbGUudHlwZSk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgZmlsZS5zaXplKTtcblxuXHRcdFx0XHR0aGlzLnN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpLnBpcGUocmVzKTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9LFxuXG5cdGNvcHkoZmlsZSwgb3V0KSB7XG5cdFx0Y29uc3QgZmlsZVBhdGggPSB0aGlzLnN0b3JlLmdldEZpbGVQYXRoKGZpbGUuX2lkLCBmaWxlKTtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc3RhdCA9IE1ldGVvci53cmFwQXN5bmMoZnMuc3RhdCkoZmlsZVBhdGgpO1xuXG5cdFx0XHRpZiAoc3RhdCAmJiBzdGF0LmlzRmlsZSgpKSB7XG5cdFx0XHRcdGZpbGUgPSBGaWxlVXBsb2FkLmFkZEV4dGVuc2lvblRvKGZpbGUpO1xuXG5cdFx0XHRcdHRoaXMuc3RvcmUuZ2V0UmVhZFN0cmVhbShmaWxlLl9pZCwgZmlsZSkucGlwZShvdXQpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdG91dC5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cbn0pO1xuXG5jb25zdCBGaWxlU3lzdGVtQXZhdGFycyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnRmlsZVN5c3RlbTpBdmF0YXJzJyxcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xuXG5cdGdldChmaWxlLCByZXEsIHJlcykge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gdGhpcy5zdG9yZS5nZXRGaWxlUGF0aChmaWxlLl9pZCwgZmlsZSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc3RhdCA9IE1ldGVvci53cmFwQXN5bmMoZnMuc3RhdCkoZmlsZVBhdGgpO1xuXG5cdFx0XHRpZiAoc3RhdCAmJiBzdGF0LmlzRmlsZSgpKSB7XG5cdFx0XHRcdGZpbGUgPSBGaWxlVXBsb2FkLmFkZEV4dGVuc2lvblRvKGZpbGUpO1xuXG5cdFx0XHRcdHRoaXMuc3RvcmUuZ2V0UmVhZFN0cmVhbShmaWxlLl9pZCwgZmlsZSkucGlwZShyZXMpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDA0KTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cbn0pO1xuXG5jb25zdCBGaWxlU3lzdGVtVXNlckRhdGFGaWxlcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnRmlsZVN5c3RlbTpVc2VyRGF0YUZpbGVzJyxcblxuXHRnZXQoZmlsZSwgcmVxLCByZXMpIHtcblx0XHRjb25zdCBmaWxlUGF0aCA9IHRoaXMuc3RvcmUuZ2V0RmlsZVBhdGgoZmlsZS5faWQsIGZpbGUpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHN0YXQgPSBNZXRlb3Iud3JhcEFzeW5jKGZzLnN0YXQpKGZpbGVQYXRoKTtcblxuXHRcdFx0aWYgKHN0YXQgJiYgc3RhdC5pc0ZpbGUoKSkge1xuXHRcdFx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblx0XHRcdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsIGBhdHRhY2htZW50OyBmaWxlbmFtZSo9VVRGLTgnJyR7IGVuY29kZVVSSUNvbXBvbmVudChmaWxlLm5hbWUpIH1gKTtcblx0XHRcdFx0cmVzLnNldEhlYWRlcignTGFzdC1Nb2RpZmllZCcsIGZpbGUudXBsb2FkZWRBdC50b1VUQ1N0cmluZygpKTtcblx0XHRcdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgZmlsZS50eXBlKTtcblx0XHRcdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCBmaWxlLnNpemUpO1xuXG5cdFx0XHRcdHRoaXMuc3RvcmUuZ2V0UmVhZFN0cmVhbShmaWxlLl9pZCwgZmlsZSkucGlwZShyZXMpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDA0KTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cbn0pO1xuXG5jb25zdCBjcmVhdGVGaWxlU3lzdGVtU3RvcmUgPSBfLmRlYm91bmNlKGZ1bmN0aW9uKCkge1xuXHRjb25zdCBvcHRpb25zID0ge1xuXHRcdHBhdGg6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0ZpbGVTeXN0ZW1QYXRoJykgLy8nL3RtcC91cGxvYWRzL3Bob3RvcycsXG5cdH07XG5cblx0RmlsZVN5c3RlbVVwbG9hZHMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnTG9jYWwnLCBGaWxlU3lzdGVtVXBsb2Fkcy5uYW1lLCBvcHRpb25zKTtcblx0RmlsZVN5c3RlbUF2YXRhcnMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnTG9jYWwnLCBGaWxlU3lzdGVtQXZhdGFycy5uYW1lLCBvcHRpb25zKTtcblx0RmlsZVN5c3RlbVVzZXJEYXRhRmlsZXMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnTG9jYWwnLCBGaWxlU3lzdGVtVXNlckRhdGFGaWxlcy5uYW1lLCBvcHRpb25zKTtcblxuXHQvLyBERVBSRUNBVEVEIGJhY2t3YXJkcyBjb21wYXRpYmlsaWx0eSAocmVtb3ZlKVxuXHRVcGxvYWRGUy5nZXRTdG9yZXMoKVsnZmlsZVN5c3RlbSddID0gVXBsb2FkRlMuZ2V0U3RvcmVzKClbRmlsZVN5c3RlbVVwbG9hZHMubmFtZV07XG59LCA1MDApO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcsIGNyZWF0ZUZpbGVTeXN0ZW1TdG9yZSk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWQgKi9cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgeyBGaWxlVXBsb2FkQ2xhc3MgfSBmcm9tICcuLi9saWIvRmlsZVVwbG9hZCc7XG5pbXBvcnQgJy4uLy4uL3Vmcy9Hb29nbGVTdG9yYWdlL3NlcnZlci5qcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XG5cbmNvbnN0IGdldCA9IGZ1bmN0aW9uKGZpbGUsIHJlcSwgcmVzKSB7XG5cdHRoaXMuc3RvcmUuZ2V0UmVkaXJlY3RVUkwoZmlsZSwgKGVyciwgZmlsZVVybCkgPT4ge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHR9XG5cblx0XHRpZiAoZmlsZVVybCkge1xuXHRcdFx0Y29uc3Qgc3RvcmVUeXBlID0gZmlsZS5zdG9yZS5zcGxpdCgnOicpLnBvcCgpO1xuXHRcdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KGBGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfUHJveHlfJHsgc3RvcmVUeXBlIH1gKSkge1xuXHRcdFx0XHRjb25zdCByZXF1ZXN0ID0gL15odHRwczovLnRlc3QoZmlsZVVybCkgPyBodHRwcyA6IGh0dHA7XG5cdFx0XHRcdHJlcXVlc3QuZ2V0KGZpbGVVcmwsIGZpbGVSZXMgPT4gZmlsZVJlcy5waXBlKHJlcykpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRcdFx0cmVzLnNldEhlYWRlcignTG9jYXRpb24nLCBmaWxlVXJsKTtcblx0XHRcdFx0cmVzLndyaXRlSGVhZCgzMDIpO1xuXHRcdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHR9XG5cdH0pO1xufTtcblxuY29uc3QgY29weSA9IGZ1bmN0aW9uKGZpbGUsIG91dCkge1xuXHR0aGlzLnN0b3JlLmdldFJlZGlyZWN0VVJMKGZpbGUsIChlcnIsIGZpbGVVcmwpID0+IHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0fVxuXG5cdFx0aWYgKGZpbGVVcmwpIHtcblx0XHRcdGNvbnN0IHJlcXVlc3QgPSAvXmh0dHBzOi8udGVzdChmaWxlVXJsKSA/IGh0dHBzIDogaHR0cDtcblx0XHRcdHJlcXVlc3QuZ2V0KGZpbGVVcmwsIGZpbGVSZXMgPT4gZmlsZVJlcy5waXBlKG91dCkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRvdXQuZW5kKCk7XG5cdFx0fVxuXHR9KTtcbn07XG5cbmNvbnN0IEdvb2dsZUNsb3VkU3RvcmFnZVVwbG9hZHMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0dvb2dsZUNsb3VkU3RvcmFnZTpVcGxvYWRzJyxcblx0Z2V0LFxuXHRjb3B5XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBHb29nbGVDbG91ZFN0b3JhZ2VBdmF0YXJzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHb29nbGVDbG91ZFN0b3JhZ2U6QXZhdGFycycsXG5cdGdldCxcblx0Y29weVxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgR29vZ2xlQ2xvdWRTdG9yYWdlVXNlckRhdGFGaWxlcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnR29vZ2xlQ2xvdWRTdG9yYWdlOlVzZXJEYXRhRmlsZXMnLFxuXHRnZXQsXG5cdGNvcHlcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xufSk7XG5cbmNvbnN0IGNvbmZpZ3VyZSA9IF8uZGVib3VuY2UoZnVuY3Rpb24oKSB7XG5cdGNvbnN0IGJ1Y2tldCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQnVja2V0Jyk7XG5cdGNvbnN0IGFjY2Vzc0lkID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9BY2Nlc3NJZCcpO1xuXHRjb25zdCBzZWNyZXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX1NlY3JldCcpO1xuXHRjb25zdCBVUkxFeHBpcnlUaW1lU3BhbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX1VSTEV4cGlyeVRpbWVTcGFuJyk7XG5cblx0aWYgKCFidWNrZXQgfHwgIWFjY2Vzc0lkIHx8ICFzZWNyZXQpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjb25maWcgPSB7XG5cdFx0Y29ubmVjdGlvbjoge1xuXHRcdFx0Y3JlZGVudGlhbHM6IHtcblx0XHRcdFx0Y2xpZW50X2VtYWlsOiBhY2Nlc3NJZCxcblx0XHRcdFx0cHJpdmF0ZV9rZXk6IHNlY3JldFxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0YnVja2V0LFxuXHRcdFVSTEV4cGlyeVRpbWVTcGFuXG5cdH07XG5cblx0R29vZ2xlQ2xvdWRTdG9yYWdlVXBsb2Fkcy5zdG9yZSA9IEZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdHb29nbGVTdG9yYWdlJywgR29vZ2xlQ2xvdWRTdG9yYWdlVXBsb2Fkcy5uYW1lLCBjb25maWcpO1xuXHRHb29nbGVDbG91ZFN0b3JhZ2VBdmF0YXJzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0dvb2dsZVN0b3JhZ2UnLCBHb29nbGVDbG91ZFN0b3JhZ2VBdmF0YXJzLm5hbWUsIGNvbmZpZyk7XG5cdEdvb2dsZUNsb3VkU3RvcmFnZVVzZXJEYXRhRmlsZXMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnR29vZ2xlU3RvcmFnZScsIEdvb2dsZUNsb3VkU3RvcmFnZVVzZXJEYXRhRmlsZXMubmFtZSwgY29uZmlnKTtcbn0sIDUwMCk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KC9eRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlXy8sIGNvbmZpZ3VyZSk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWQsIFVwbG9hZEZTICovXG5pbXBvcnQgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgemxpYiBmcm9tICd6bGliJztcbmltcG9ydCB1dGlsIGZyb20gJ3V0aWwnO1xuXG5pbXBvcnQgeyBGaWxlVXBsb2FkQ2xhc3MgfSBmcm9tICcuLi9saWIvRmlsZVVwbG9hZCc7XG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ0ZpbGVVcGxvYWQnKTtcblxuZnVuY3Rpb24gRXh0cmFjdFJhbmdlKG9wdGlvbnMpIHtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIEV4dHJhY3RSYW5nZSkpIHtcblx0XHRyZXR1cm4gbmV3IEV4dHJhY3RSYW5nZShvcHRpb25zKTtcblx0fVxuXG5cdHRoaXMuc3RhcnQgPSBvcHRpb25zLnN0YXJ0O1xuXHR0aGlzLnN0b3AgPSBvcHRpb25zLnN0b3A7XG5cdHRoaXMuYnl0ZXNfcmVhZCA9IDA7XG5cblx0c3RyZWFtLlRyYW5zZm9ybS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xufVxudXRpbC5pbmhlcml0cyhFeHRyYWN0UmFuZ2UsIHN0cmVhbS5UcmFuc2Zvcm0pO1xuXG5cbkV4dHJhY3RSYW5nZS5wcm90b3R5cGUuX3RyYW5zZm9ybSA9IGZ1bmN0aW9uKGNodW5rLCBlbmMsIGNiKSB7XG5cdGlmICh0aGlzLmJ5dGVzX3JlYWQgPiB0aGlzLnN0b3ApIHtcblx0XHQvLyBkb25lIHJlYWRpbmdcblx0XHR0aGlzLmVuZCgpO1xuXHR9IGVsc2UgaWYgKHRoaXMuYnl0ZXNfcmVhZCArIGNodW5rLmxlbmd0aCA8IHRoaXMuc3RhcnQpIHtcblx0XHQvLyB0aGlzIGNodW5rIGlzIHN0aWxsIGJlZm9yZSB0aGUgc3RhcnQgYnl0ZVxuXHR9IGVsc2Uge1xuXHRcdGxldCBzdGFydDtcblx0XHRsZXQgc3RvcDtcblxuXHRcdGlmICh0aGlzLnN0YXJ0IDw9IHRoaXMuYnl0ZXNfcmVhZCkge1xuXHRcdFx0c3RhcnQgPSAwO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdGFydCA9IHRoaXMuc3RhcnQgLSB0aGlzLmJ5dGVzX3JlYWQ7XG5cdFx0fVxuXHRcdGlmICgodGhpcy5zdG9wIC0gdGhpcy5ieXRlc19yZWFkICsgMSkgPCBjaHVuay5sZW5ndGgpIHtcblx0XHRcdHN0b3AgPSB0aGlzLnN0b3AgLSB0aGlzLmJ5dGVzX3JlYWQgKyAxO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdG9wID0gY2h1bmsubGVuZ3RoO1xuXHRcdH1cblx0XHRjb25zdCBuZXdjaHVuayA9IGNodW5rLnNsaWNlKHN0YXJ0LCBzdG9wKTtcblx0XHR0aGlzLnB1c2gobmV3Y2h1bmspO1xuXHR9XG5cdHRoaXMuYnl0ZXNfcmVhZCArPSBjaHVuay5sZW5ndGg7XG5cdGNiKCk7XG59O1xuXG5cbmNvbnN0IGdldEJ5dGVSYW5nZSA9IGZ1bmN0aW9uKGhlYWRlcikge1xuXHRpZiAoaGVhZGVyKSB7XG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGhlYWRlci5tYXRjaCgvKFxcZCspLShcXGQrKS8pO1xuXHRcdGlmIChtYXRjaGVzKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdGFydDogcGFyc2VJbnQobWF0Y2hlc1sxXSwgMTApLFxuXHRcdFx0XHRzdG9wOiBwYXJzZUludChtYXRjaGVzWzJdLCAxMClcblx0XHRcdH07XG5cdFx0fVxuXHR9XG5cdHJldHVybiBudWxsO1xufTtcblxuLy8gY29kZSBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vamFsaWsvamFsaWstdWZzL2Jsb2IvbWFzdGVyL3Vmcy1zZXJ2ZXIuanMjTDMxMFxuY29uc3QgcmVhZEZyb21HcmlkRlMgPSBmdW5jdGlvbihzdG9yZU5hbWUsIGZpbGVJZCwgZmlsZSwgcmVxLCByZXMpIHtcblx0Y29uc3Qgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShzdG9yZU5hbWUpO1xuXHRjb25zdCBycyA9IHN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZUlkLCBmaWxlKTtcblx0Y29uc3Qgd3MgPSBuZXcgc3RyZWFtLlBhc3NUaHJvdWdoKCk7XG5cblx0W3JzLCB3c10uZm9yRWFjaChzdHJlYW0gPT4gc3RyZWFtLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xuXHRcdHN0b3JlLm9uUmVhZEVycm9yLmNhbGwoc3RvcmUsIGVyciwgZmlsZUlkLCBmaWxlKTtcblx0XHRyZXMuZW5kKCk7XG5cdH0pKTtcblxuXHR3cy5vbignY2xvc2UnLCBmdW5jdGlvbigpIHtcblx0XHQvLyBDbG9zZSBvdXRwdXQgc3RyZWFtIGF0IHRoZSBlbmRcblx0XHR3cy5lbWl0KCdlbmQnKTtcblx0fSk7XG5cblx0Y29uc3QgYWNjZXB0ID0gcmVxLmhlYWRlcnNbJ2FjY2VwdC1lbmNvZGluZyddIHx8ICcnO1xuXG5cdC8vIFRyYW5zZm9ybSBzdHJlYW1cblx0c3RvcmUudHJhbnNmb3JtUmVhZChycywgd3MsIGZpbGVJZCwgZmlsZSwgcmVxKTtcblx0Y29uc3QgcmFuZ2UgPSBnZXRCeXRlUmFuZ2UocmVxLmhlYWRlcnMucmFuZ2UpO1xuXHRsZXQgb3V0X29mX3JhbmdlID0gZmFsc2U7XG5cdGlmIChyYW5nZSkge1xuXHRcdG91dF9vZl9yYW5nZSA9IChyYW5nZS5zdGFydCA+IGZpbGUuc2l6ZSkgfHwgKHJhbmdlLnN0b3AgPD0gcmFuZ2Uuc3RhcnQpIHx8IChyYW5nZS5zdG9wID4gZmlsZS5zaXplKTtcblx0fVxuXG5cdC8vIENvbXByZXNzIGRhdGEgdXNpbmcgZ3ppcFxuXHRpZiAoYWNjZXB0Lm1hdGNoKC9cXGJnemlwXFxiLykgJiYgcmFuZ2UgPT09IG51bGwpIHtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUVuY29kaW5nJywgJ2d6aXAnKTtcblx0XHRyZXMucmVtb3ZlSGVhZGVyKCdDb250ZW50LUxlbmd0aCcpO1xuXHRcdHJlcy53cml0ZUhlYWQoMjAwKTtcblx0XHR3cy5waXBlKHpsaWIuY3JlYXRlR3ppcCgpKS5waXBlKHJlcyk7XG5cdH0gZWxzZSBpZiAoYWNjZXB0Lm1hdGNoKC9cXGJkZWZsYXRlXFxiLykgJiYgcmFuZ2UgPT09IG51bGwpIHtcblx0XHQvLyBDb21wcmVzcyBkYXRhIHVzaW5nIGRlZmxhdGVcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUVuY29kaW5nJywgJ2RlZmxhdGUnKTtcblx0XHRyZXMucmVtb3ZlSGVhZGVyKCdDb250ZW50LUxlbmd0aCcpO1xuXHRcdHJlcy53cml0ZUhlYWQoMjAwKTtcblx0XHR3cy5waXBlKHpsaWIuY3JlYXRlRGVmbGF0ZSgpKS5waXBlKHJlcyk7XG5cdH0gZWxzZSBpZiAocmFuZ2UgJiYgb3V0X29mX3JhbmdlKSB7XG5cdFx0Ly8gb3V0IG9mIHJhbmdlIHJlcXVlc3QsIHJldHVybiA0MTZcblx0XHRyZXMucmVtb3ZlSGVhZGVyKCdDb250ZW50LUxlbmd0aCcpO1xuXHRcdHJlcy5yZW1vdmVIZWFkZXIoJ0NvbnRlbnQtVHlwZScpO1xuXHRcdHJlcy5yZW1vdmVIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nKTtcblx0XHRyZXMucmVtb3ZlSGVhZGVyKCdMYXN0LU1vZGlmaWVkJyk7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1SYW5nZScsIGBieXRlcyAqLyR7IGZpbGUuc2l6ZSB9YCk7XG5cdFx0cmVzLndyaXRlSGVhZCg0MTYpO1xuXHRcdHJlcy5lbmQoKTtcblx0fSBlbHNlIGlmIChyYW5nZSkge1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtUmFuZ2UnLCBgYnl0ZXMgJHsgcmFuZ2Uuc3RhcnQgfS0keyByYW5nZS5zdG9wIH0vJHsgZmlsZS5zaXplIH1gKTtcblx0XHRyZXMucmVtb3ZlSGVhZGVyKCdDb250ZW50LUxlbmd0aCcpO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgcmFuZ2Uuc3RvcCAtIHJhbmdlLnN0YXJ0ICsgMSk7XG5cdFx0cmVzLndyaXRlSGVhZCgyMDYpO1xuXHRcdGxvZ2dlci5kZWJ1ZygnRmlsZSB1cGxvYWQgZXh0cmFjdGluZyByYW5nZScpO1xuXHRcdHdzLnBpcGUobmV3IEV4dHJhY3RSYW5nZSh7IHN0YXJ0OiByYW5nZS5zdGFydCwgc3RvcDogcmFuZ2Uuc3RvcCB9KSkucGlwZShyZXMpO1xuXHR9IGVsc2Uge1xuXHRcdHJlcy53cml0ZUhlYWQoMjAwKTtcblx0XHR3cy5waXBlKHJlcyk7XG5cdH1cbn07XG5cbmNvbnN0IGNvcHlGcm9tR3JpZEZTID0gZnVuY3Rpb24oc3RvcmVOYW1lLCBmaWxlSWQsIGZpbGUsIG91dCkge1xuXHRjb25zdCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKHN0b3JlTmFtZSk7XG5cdGNvbnN0IHJzID0gc3RvcmUuZ2V0UmVhZFN0cmVhbShmaWxlSWQsIGZpbGUpO1xuXG5cdFtycywgb3V0XS5mb3JFYWNoKHN0cmVhbSA9PiBzdHJlYW0ub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XG5cdFx0c3RvcmUub25SZWFkRXJyb3IuY2FsbChzdG9yZSwgZXJyLCBmaWxlSWQsIGZpbGUpO1xuXHRcdG91dC5lbmQoKTtcblx0fSkpO1xuXG5cdHJzLnBpcGUob3V0KTtcbn07XG5cbkZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdHcmlkRlMnLCAnR3JpZEZTOlVwbG9hZHMnLCB7XG5cdGNvbGxlY3Rpb25OYW1lOiAncm9ja2V0Y2hhdF91cGxvYWRzJ1xufSk7XG5cbkZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdHcmlkRlMnLCAnR3JpZEZTOlVzZXJEYXRhRmlsZXMnLCB7XG5cdGNvbGxlY3Rpb25OYW1lOiAncm9ja2V0Y2hhdF91c2VyRGF0YUZpbGVzJ1xufSk7XG5cbi8vIERFUFJFQ0FURUQ6IGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IChyZW1vdmUpXG5VcGxvYWRGUy5nZXRTdG9yZXMoKVsncm9ja2V0Y2hhdF91cGxvYWRzJ10gPSBVcGxvYWRGUy5nZXRTdG9yZXMoKVsnR3JpZEZTOlVwbG9hZHMnXTtcblxuRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0dyaWRGUycsICdHcmlkRlM6QXZhdGFycycsIHtcblx0Y29sbGVjdGlvbk5hbWU6ICdyb2NrZXRjaGF0X2F2YXRhcnMnXG59KTtcblxuXG5uZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0dyaWRGUzpVcGxvYWRzJyxcblxuXHRnZXQoZmlsZSwgcmVxLCByZXMpIHtcblx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblxuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBgYXR0YWNobWVudDsgZmlsZW5hbWUqPVVURi04JyckeyBlbmNvZGVVUklDb21wb25lbnQoZmlsZS5uYW1lKSB9YCk7XG5cdFx0cmVzLnNldEhlYWRlcignTGFzdC1Nb2RpZmllZCcsIGZpbGUudXBsb2FkZWRBdC50b1VUQ1N0cmluZygpKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBmaWxlLnR5cGUpO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgZmlsZS5zaXplKTtcblxuXHRcdHJldHVybiByZWFkRnJvbUdyaWRGUyhmaWxlLnN0b3JlLCBmaWxlLl9pZCwgZmlsZSwgcmVxLCByZXMpO1xuXHR9LFxuXG5cdGNvcHkoZmlsZSwgb3V0KSB7XG5cdFx0Y29weUZyb21HcmlkRlMoZmlsZS5zdG9yZSwgZmlsZS5faWQsIGZpbGUsIG91dCk7XG5cdH1cbn0pO1xuXG5uZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0dyaWRGUzpVc2VyRGF0YUZpbGVzJyxcblxuXHRnZXQoZmlsZSwgcmVxLCByZXMpIHtcblx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblxuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBgYXR0YWNobWVudDsgZmlsZW5hbWUqPVVURi04JyckeyBlbmNvZGVVUklDb21wb25lbnQoZmlsZS5uYW1lKSB9YCk7XG5cdFx0cmVzLnNldEhlYWRlcignTGFzdC1Nb2RpZmllZCcsIGZpbGUudXBsb2FkZWRBdC50b1VUQ1N0cmluZygpKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBmaWxlLnR5cGUpO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgZmlsZS5zaXplKTtcblxuXHRcdHJldHVybiByZWFkRnJvbUdyaWRGUyhmaWxlLnN0b3JlLCBmaWxlLl9pZCwgZmlsZSwgcmVxLCByZXMpO1xuXHR9LFxuXG5cdGNvcHkoZmlsZSwgb3V0KSB7XG5cdFx0Y29weUZyb21HcmlkRlMoZmlsZS5zdG9yZSwgZmlsZS5faWQsIGZpbGUsIG91dCk7XG5cdH1cbn0pO1xuXG5uZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0dyaWRGUzpBdmF0YXJzJyxcblxuXHRnZXQoZmlsZSwgcmVxLCByZXMpIHtcblx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblxuXHRcdHJldHVybiByZWFkRnJvbUdyaWRGUyhmaWxlLnN0b3JlLCBmaWxlLl9pZCwgZmlsZSwgcmVxLCByZXMpO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgU2xpbmdzaG90LCBGaWxlVXBsb2FkICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuY29uc3QgY29uZmlndXJlU2xpbmdzaG90ID0gXy5kZWJvdW5jZSgoKSA9PiB7XG5cdGNvbnN0IHR5cGUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnKTtcblx0Y29uc3QgYnVja2V0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQnVja2V0Jyk7XG5cdGNvbnN0IGFjbCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0FjbCcpO1xuXHRjb25zdCBhY2Nlc3NLZXkgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BV1NBY2Nlc3NLZXlJZCcpO1xuXHRjb25zdCBzZWNyZXRLZXkgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BV1NTZWNyZXRBY2Nlc3NLZXknKTtcblx0Y29uc3QgY2RuID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQ0ROJyk7XG5cdGNvbnN0IHJlZ2lvbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX1JlZ2lvbicpO1xuXHRjb25zdCBidWNrZXRVcmwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19CdWNrZXRVUkwnKTtcblxuXHRkZWxldGUgU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMnXTtcblxuXHRpZiAodHlwZSA9PT0gJ0FtYXpvblMzJyAmJiAhXy5pc0VtcHR5KGJ1Y2tldCkgJiYgIV8uaXNFbXB0eShhY2Nlc3NLZXkpICYmICFfLmlzRW1wdHkoc2VjcmV0S2V5KSkge1xuXHRcdGlmIChTbGluZ3Nob3QuX2RpcmVjdGl2ZXNbJ3JvY2tldGNoYXQtdXBsb2FkcyddKSB7XG5cdFx0XHRkZWxldGUgU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMnXTtcblx0XHR9XG5cdFx0Y29uc3QgY29uZmlnID0ge1xuXHRcdFx0YnVja2V0LFxuXHRcdFx0a2V5KGZpbGUsIG1ldGFDb250ZXh0KSB7XG5cdFx0XHRcdGNvbnN0IGlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHRcdGNvbnN0IHBhdGggPSBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJykgfS91cGxvYWRzLyR7IG1ldGFDb250ZXh0LnJpZCB9LyR7IHRoaXMudXNlcklkIH0vJHsgaWQgfWA7XG5cblx0XHRcdFx0Y29uc3QgdXBsb2FkID0ge1xuXHRcdFx0XHRcdF9pZDogaWQsXG5cdFx0XHRcdFx0cmlkOiBtZXRhQ29udGV4dC5yaWQsXG5cdFx0XHRcdFx0QW1hem9uUzM6IHtcblx0XHRcdFx0XHRcdHBhdGhcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5pbnNlcnRGaWxlSW5pdCh0aGlzLnVzZXJJZCwgJ0FtYXpvblMzOlVwbG9hZHMnLCBmaWxlLCB1cGxvYWQpO1xuXG5cdFx0XHRcdHJldHVybiBwYXRoO1xuXHRcdFx0fSxcblx0XHRcdEFXU0FjY2Vzc0tleUlkOiBhY2Nlc3NLZXksXG5cdFx0XHRBV1NTZWNyZXRBY2Nlc3NLZXk6IHNlY3JldEtleVxuXHRcdH07XG5cblx0XHRpZiAoIV8uaXNFbXB0eShhY2wpKSB7XG5cdFx0XHRjb25maWcuYWNsID0gYWNsO1xuXHRcdH1cblxuXHRcdGlmICghXy5pc0VtcHR5KGNkbikpIHtcblx0XHRcdGNvbmZpZy5jZG4gPSBjZG47XG5cdFx0fVxuXG5cdFx0aWYgKCFfLmlzRW1wdHkocmVnaW9uKSkge1xuXHRcdFx0Y29uZmlnLnJlZ2lvbiA9IHJlZ2lvbjtcblx0XHR9XG5cblx0XHRpZiAoIV8uaXNFbXB0eShidWNrZXRVcmwpKSB7XG5cdFx0XHRjb25maWcuYnVja2V0VXJsID0gYnVja2V0VXJsO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRTbGluZ3Nob3QuY3JlYXRlRGlyZWN0aXZlKCdyb2NrZXRjaGF0LXVwbG9hZHMnLCBTbGluZ3Nob3QuUzNTdG9yYWdlLCBjb25maWcpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNvbmZpZ3VyaW5nIFMzIC0+JywgZS5tZXNzYWdlKTtcblx0XHR9XG5cdH1cbn0sIDUwMCk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsIGNvbmZpZ3VyZVNsaW5nc2hvdCk7XG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfUzNfLywgY29uZmlndXJlU2xpbmdzaG90KTtcblxuXG5cbmNvbnN0IGNyZWF0ZUdvb2dsZVN0b3JhZ2VEaXJlY3RpdmUgPSBfLmRlYm91bmNlKCgpID0+IHtcblx0Y29uc3QgdHlwZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScpO1xuXHRjb25zdCBidWNrZXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0J1Y2tldCcpO1xuXHRjb25zdCBhY2Nlc3NJZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQWNjZXNzSWQnKTtcblx0Y29uc3Qgc2VjcmV0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9TZWNyZXQnKTtcblxuXHRkZWxldGUgU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMtZ3MnXTtcblxuXHRpZiAodHlwZSA9PT0gJ0dvb2dsZUNsb3VkU3RvcmFnZScgJiYgIV8uaXNFbXB0eShzZWNyZXQpICYmICFfLmlzRW1wdHkoYWNjZXNzSWQpICYmICFfLmlzRW1wdHkoYnVja2V0KSkge1xuXHRcdGlmIChTbGluZ3Nob3QuX2RpcmVjdGl2ZXNbJ3JvY2tldGNoYXQtdXBsb2Fkcy1ncyddKSB7XG5cdFx0XHRkZWxldGUgU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMtZ3MnXTtcblx0XHR9XG5cblx0XHRjb25zdCBjb25maWcgPSB7XG5cdFx0XHRidWNrZXQsXG5cdFx0XHRHb29nbGVBY2Nlc3NJZDogYWNjZXNzSWQsXG5cdFx0XHRHb29nbGVTZWNyZXRLZXk6IHNlY3JldCxcblx0XHRcdGtleShmaWxlLCBtZXRhQ29udGV4dCkge1xuXHRcdFx0XHRjb25zdCBpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0XHRjb25zdCBwYXRoID0gYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd1bmlxdWVJRCcpIH0vdXBsb2Fkcy8keyBtZXRhQ29udGV4dC5yaWQgfS8keyB0aGlzLnVzZXJJZCB9LyR7IGlkIH1gO1xuXG5cdFx0XHRcdGNvbnN0IHVwbG9hZCA9IHtcblx0XHRcdFx0XHRfaWQ6IGlkLFxuXHRcdFx0XHRcdHJpZDogbWV0YUNvbnRleHQucmlkLFxuXHRcdFx0XHRcdEdvb2dsZVN0b3JhZ2U6IHtcblx0XHRcdFx0XHRcdHBhdGhcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5pbnNlcnRGaWxlSW5pdCh0aGlzLnVzZXJJZCwgJ0dvb2dsZUNsb3VkU3RvcmFnZTpVcGxvYWRzJywgZmlsZSwgdXBsb2FkKTtcblxuXHRcdFx0XHRyZXR1cm4gcGF0aDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdFNsaW5nc2hvdC5jcmVhdGVEaXJlY3RpdmUoJ3JvY2tldGNoYXQtdXBsb2Fkcy1ncycsIFNsaW5nc2hvdC5Hb29nbGVDbG91ZCwgY29uZmlnKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBjb25maWd1cmluZyBHb29nbGVDbG91ZFN0b3JhZ2UgLT4nLCBlLm1lc3NhZ2UpO1xuXHRcdH1cblx0fVxufSwgNTAwKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJywgY3JlYXRlR29vZ2xlU3RvcmFnZURpcmVjdGl2ZSk7XG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV8vLCBjcmVhdGVHb29nbGVTdG9yYWdlRGlyZWN0aXZlKTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZCAqL1xuXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCB7IEZpbGVVcGxvYWRDbGFzcyB9IGZyb20gJy4uL2xpYi9GaWxlVXBsb2FkJztcbmltcG9ydCAnLi4vLi4vdWZzL1dlYmRhdi9zZXJ2ZXIuanMnO1xuXG5jb25zdCBnZXQgPSBmdW5jdGlvbihmaWxlLCByZXEsIHJlcykge1xuXHR0aGlzLnN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpLnBpcGUocmVzKTtcbn07XG5cbmNvbnN0IGNvcHkgPSBmdW5jdGlvbihmaWxlLCBvdXQpIHtcblx0dGhpcy5zdG9yZS5nZXRSZWFkU3RyZWFtKGZpbGUuX2lkLCBmaWxlKS5waXBlKG91dCk7XG59O1xuXG5jb25zdCBXZWJkYXZVcGxvYWRzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdXZWJkYXY6VXBsb2FkcycsXG5cdGdldCxcblx0Y29weVxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgV2ViZGF2QXZhdGFycyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnV2ViZGF2OkF2YXRhcnMnLFxuXHRnZXQsXG5cdGNvcHlcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xufSk7XG5cbmNvbnN0IFdlYmRhdlVzZXJEYXRhRmlsZXMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ1dlYmRhdjpVc2VyRGF0YUZpbGVzJyxcblx0Z2V0LFxuXHRjb3B5XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBjb25maWd1cmUgPSBfLmRlYm91bmNlKGZ1bmN0aW9uKCkge1xuXHRjb25zdCB1cGxvYWRGb2xkZXJQYXRoID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfV2ViZGF2X1VwbG9hZF9Gb2xkZXJfUGF0aCcpO1xuXHRjb25zdCBzZXJ2ZXIgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9XZWJkYXZfU2VydmVyX1VSTCcpO1xuXHRjb25zdCB1c2VybmFtZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1dlYmRhdl9Vc2VybmFtZScpO1xuXHRjb25zdCBwYXNzd29yZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1dlYmRhdl9QYXNzd29yZCcpO1xuXG5cdGlmICghc2VydmVyIHx8ICF1c2VybmFtZSB8fCAhcGFzc3dvcmQpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjb25maWcgPSB7XG5cdFx0Y29ubmVjdGlvbjoge1xuXHRcdFx0Y3JlZGVudGlhbHM6IHtcblx0XHRcdFx0c2VydmVyLFxuXHRcdFx0XHR1c2VybmFtZSxcblx0XHRcdFx0cGFzc3dvcmRcblx0XHRcdH1cblx0XHR9LFxuXHRcdHVwbG9hZEZvbGRlclBhdGhcblx0fTtcblxuXHRXZWJkYXZVcGxvYWRzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ1dlYmRhdicsIFdlYmRhdlVwbG9hZHMubmFtZSwgY29uZmlnKTtcblx0V2ViZGF2QXZhdGFycy5zdG9yZSA9IEZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdXZWJkYXYnLCBXZWJkYXZBdmF0YXJzLm5hbWUsIGNvbmZpZyk7XG5cdFdlYmRhdlVzZXJEYXRhRmlsZXMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnV2ViZGF2JywgV2ViZGF2VXNlckRhdGFGaWxlcy5uYW1lLCBjb25maWcpO1xufSwgNTAwKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15GaWxlVXBsb2FkX1dlYmRhdl8vLCBjb25maWd1cmUpO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0YXN5bmMgJ3NlbmRGaWxlTWVzc2FnZScocm9vbUlkLCBzdG9yZSwgZmlsZSwgbXNnRGF0YSA9IHt9KSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ3NlbmRGaWxlTWVzc2FnZScgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgcm9vbUlkLCBNZXRlb3IudXNlcklkKCkpO1xuXG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y2hlY2sobXNnRGF0YSwge1xuXHRcdFx0YXZhdGFyOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0ZW1vamk6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRhbGlhczogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdGdyb3VwYWJsZTogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0XHRtc2c6IE1hdGNoLk9wdGlvbmFsKFN0cmluZylcblx0XHR9KTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMudXBkYXRlRmlsZUNvbXBsZXRlKGZpbGUuX2lkLCBNZXRlb3IudXNlcklkKCksIF8ub21pdChmaWxlLCAnX2lkJykpO1xuXG5cdFx0Y29uc3QgZmlsZVVybCA9IGAvZmlsZS11cGxvYWQvJHsgZmlsZS5faWQgfS8keyBlbmNvZGVVUkkoZmlsZS5uYW1lKSB9YDtcblxuXHRcdGNvbnN0IGF0dGFjaG1lbnQgPSB7XG5cdFx0XHR0aXRsZTogZmlsZS5uYW1lLFxuXHRcdFx0dHlwZTogJ2ZpbGUnLFxuXHRcdFx0ZGVzY3JpcHRpb246IGZpbGUuZGVzY3JpcHRpb24sXG5cdFx0XHR0aXRsZV9saW5rOiBmaWxlVXJsLFxuXHRcdFx0dGl0bGVfbGlua19kb3dubG9hZDogdHJ1ZVxuXHRcdH07XG5cblx0XHRpZiAoL15pbWFnZVxcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfdXJsID0gZmlsZVVybDtcblx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdGF0dGFjaG1lbnQuaW1hZ2Vfc2l6ZSA9IGZpbGUuc2l6ZTtcblx0XHRcdGlmIChmaWxlLmlkZW50aWZ5ICYmIGZpbGUuaWRlbnRpZnkuc2l6ZSkge1xuXHRcdFx0XHRhdHRhY2htZW50LmltYWdlX2RpbWVuc2lvbnMgPSBmaWxlLmlkZW50aWZ5LnNpemU7XG5cdFx0XHR9XG5cdFx0XHRhdHRhY2htZW50LmltYWdlX3ByZXZpZXcgPSBhd2FpdCBGaWxlVXBsb2FkLnJlc2l6ZUltYWdlUHJldmlldyhmaWxlKTtcblx0XHR9IGVsc2UgaWYgKC9eYXVkaW9cXC8uKy8udGVzdChmaWxlLnR5cGUpKSB7XG5cdFx0XHRhdHRhY2htZW50LmF1ZGlvX3VybCA9IGZpbGVVcmw7XG5cdFx0XHRhdHRhY2htZW50LmF1ZGlvX3R5cGUgPSBmaWxlLnR5cGU7XG5cdFx0XHRhdHRhY2htZW50LmF1ZGlvX3NpemUgPSBmaWxlLnNpemU7XG5cdFx0fSBlbHNlIGlmICgvXnZpZGVvXFwvLisvLnRlc3QoZmlsZS50eXBlKSkge1xuXHRcdFx0YXR0YWNobWVudC52aWRlb191cmwgPSBmaWxlVXJsO1xuXHRcdFx0YXR0YWNobWVudC52aWRlb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0YXR0YWNobWVudC52aWRlb19zaXplID0gZmlsZS5zaXplO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXHRcdGxldCBtc2cgPSBPYmplY3QuYXNzaWduKHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IHJvb21JZCxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0bXNnOiAnJyxcblx0XHRcdGZpbGU6IHtcblx0XHRcdFx0X2lkOiBmaWxlLl9pZCxcblx0XHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0XHR0eXBlOiBmaWxlLnR5cGVcblx0XHRcdH0sXG5cdFx0XHRncm91cGFibGU6IGZhbHNlLFxuXHRcdFx0YXR0YWNobWVudHM6IFthdHRhY2htZW50XVxuXHRcdH0sIG1zZ0RhdGEpO1xuXG5cdFx0bXNnID0gTWV0ZW9yLmNhbGwoJ3NlbmRNZXNzYWdlJywgbXNnKTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiBSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2FmdGVyRmlsZVVwbG9hZCcsIHsgdXNlciwgcm9vbSwgbWVzc2FnZTogbXNnIH0pKTtcblxuXHRcdHJldHVybiBtc2c7XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFscyBVcGxvYWRGUyAqL1xuXG5sZXQgcHJvdGVjdGVkRmlsZXM7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1Byb3RlY3RGaWxlcycsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0cHJvdGVjdGVkRmlsZXMgPSB2YWx1ZTtcbn0pO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGdldFMzRmlsZVVybChmaWxlSWQpIHtcblx0XHRpZiAocHJvdGVjdGVkRmlsZXMgJiYgIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnc2VuZEZpbGVNZXNzYWdlJyB9KTtcblx0XHR9XG5cdFx0Y29uc3QgZmlsZSA9IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZE9uZUJ5SWQoZmlsZUlkKTtcblxuXHRcdHJldHVybiBVcGxvYWRGUy5nZXRTdG9yZSgnQW1hem9uUzM6VXBsb2FkcycpLmdldFJlZGlyZWN0VVJMKGZpbGUpO1xuXHR9XG59KTtcbiIsIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0ZpbGVVcGxvYWQnLCBmdW5jdGlvbigpIHtcblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfRW5hYmxlZCcsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0cHVibGljOiB0cnVlXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdGaWxlVXBsb2FkX01heEZpbGVTaXplJywgMjA5NzE1Miwge1xuXHRcdHR5cGU6ICdpbnQnLFxuXHRcdHB1YmxpYzogdHJ1ZVxuXHR9KTtcblxuXHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9NZWRpYVR5cGVXaGl0ZUxpc3QnLCAnaW1hZ2UvKixhdWRpby8qLHZpZGVvLyosYXBwbGljYXRpb24vemlwLGFwcGxpY2F0aW9uL3gtcmFyLWNvbXByZXNzZWQsYXBwbGljYXRpb24vcGRmLHRleHQvcGxhaW4sYXBwbGljYXRpb24vbXN3b3JkLGFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50Jywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuRGVzY3JpcHRpb246ICdGaWxlVXBsb2FkX01lZGlhVHlwZVdoaXRlTGlzdERlc2NyaXB0aW9uJ1xuXHR9KTtcblxuXHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9Qcm90ZWN0RmlsZXMnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuRGVzY3JpcHRpb246ICdGaWxlVXBsb2FkX1Byb3RlY3RGaWxlc0Rlc2NyaXB0aW9uJ1xuXHR9KTtcblxuXHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLCAnR3JpZEZTJywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdHZhbHVlczogW3tcblx0XHRcdGtleTogJ0dyaWRGUycsXG5cdFx0XHRpMThuTGFiZWw6ICdHcmlkRlMnXG5cdFx0fSwge1xuXHRcdFx0a2V5OiAnQW1hem9uUzMnLFxuXHRcdFx0aTE4bkxhYmVsOiAnQW1hem9uUzMnXG5cdFx0fSwge1xuXHRcdFx0a2V5OiAnR29vZ2xlQ2xvdWRTdG9yYWdlJyxcblx0XHRcdGkxOG5MYWJlbDogJ0dvb2dsZUNsb3VkU3RvcmFnZSdcblx0XHR9LCB7XG5cdFx0XHRrZXk6ICdXZWJkYXYnLFxuXHRcdFx0aTE4bkxhYmVsOiAnV2ViREFWJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ0ZpbGVTeXN0ZW0nLFxuXHRcdFx0aTE4bkxhYmVsOiAnRmlsZVN5c3RlbSdcblx0XHR9XSxcblx0XHRwdWJsaWM6IHRydWVcblx0fSk7XG5cblx0dGhpcy5zZWN0aW9uKCdBbWF6b24gUzMnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19CdWNrZXQnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfQWNsJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0FXU0FjY2Vzc0tleUlkJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0FXU1NlY3JldEFjY2Vzc0tleScsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19DRE4nLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfUmVnaW9uJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0J1Y2tldFVSTCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH0sXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdPdmVycmlkZV9VUkxfdG9fd2hpY2hfZmlsZXNfYXJlX3VwbG9hZGVkX1RoaXNfdXJsX2Fsc29fdXNlZF9mb3JfZG93bmxvYWRzX3VubGVzc19hX0NETl9pc19naXZlbi4nXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfU2lnbmF0dXJlVmVyc2lvbicsICd2NCcsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0ZvcmNlUGF0aFN0eWxlJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19VUkxFeHBpcnlUaW1lU3BhbicsIDEyMCwge1xuXHRcdFx0dHlwZTogJ2ludCcsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9LFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiAnRmlsZVVwbG9hZF9TM19VUkxFeHBpcnlUaW1lU3Bhbl9EZXNjcmlwdGlvbidcblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19Qcm94eV9BdmF0YXJzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19Qcm94eV9VcGxvYWRzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0dGhpcy5zZWN0aW9uKCdHb29nbGUgQ2xvdWQgU3RvcmFnZScsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQnVja2V0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0cHJpdmF0ZTogdHJ1ZSxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9BY2Nlc3NJZCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdHByaXZhdGU6IHRydWUsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfU2VjcmV0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0bXVsdGlsaW5lOiB0cnVlLFxuXHRcdFx0cHJpdmF0ZTogdHJ1ZSxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9Qcm94eV9BdmF0YXJzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9Qcm94eV9VcGxvYWRzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXG5cdHRoaXMuc2VjdGlvbignRmlsZSBTeXN0ZW0nLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdGaWxlU3lzdGVtJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHR0aGlzLnNlY3Rpb24oJ1dlYkRBVicsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1dlYmRhdl9VcGxvYWRfRm9sZGVyX1BhdGgnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnV2ViZGF2J1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1dlYmRhdl9TZXJ2ZXJfVVJMJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ1dlYmRhdidcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9XZWJkYXZfVXNlcm5hbWUnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnV2ViZGF2J1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1dlYmRhdl9QYXNzd29yZCcsICcnLCB7XG5cdFx0XHR0eXBlOiAncGFzc3dvcmQnLFxuXHRcdFx0cHJpdmF0ZTogdHJ1ZSxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdXZWJkYXYnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfV2ViZGF2X1Byb3h5X0F2YXRhcnMnLCBmYWxzZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ1dlYmRhdidcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9XZWJkYXZfUHJveHlfVXBsb2FkcycsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnV2ViZGF2J1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9FbmFibGVkX0RpcmVjdCcsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0cHVibGljOiB0cnVlXG5cdH0pO1xufSk7XG4iLCJpbXBvcnQge1VwbG9hZEZTfSBmcm9tICdtZXRlb3IvamFsaWs6dWZzJztcbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IFMzIGZyb20gJ2F3cy1zZGsvY2xpZW50cy9zMyc7XG5pbXBvcnQgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5cbi8qKlxuICogQW1hem9uUzMgc3RvcmVcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZXhwb3J0IGNsYXNzIEFtYXpvblMzU3RvcmUgZXh0ZW5kcyBVcGxvYWRGUy5TdG9yZSB7XG5cblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdC8vIERlZmF1bHQgb3B0aW9uc1xuXHRcdC8vIG9wdGlvbnMuc2VjcmV0QWNjZXNzS2V5LFxuXHRcdC8vIG9wdGlvbnMuYWNjZXNzS2V5SWQsXG5cdFx0Ly8gb3B0aW9ucy5yZWdpb24sXG5cdFx0Ly8gb3B0aW9ucy5zc2xFbmFibGVkIC8vIG9wdGlvbmFsXG5cblx0XHRvcHRpb25zID0gXy5leHRlbmQoe1xuXHRcdFx0aHR0cE9wdGlvbnM6IHtcblx0XHRcdFx0dGltZW91dDogNjAwMCxcblx0XHRcdFx0YWdlbnQ6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSwgb3B0aW9ucyk7XG5cblx0XHRzdXBlcihvcHRpb25zKTtcblxuXHRcdGNvbnN0IGNsYXNzT3B0aW9ucyA9IG9wdGlvbnM7XG5cblx0XHRjb25zdCBzMyA9IG5ldyBTMyhvcHRpb25zLmNvbm5lY3Rpb24pO1xuXG5cdFx0b3B0aW9ucy5nZXRQYXRoID0gb3B0aW9ucy5nZXRQYXRoIHx8IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdHJldHVybiBmaWxlLl9pZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRQYXRoID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0aWYgKGZpbGUuQW1hem9uUzMpIHtcblx0XHRcdFx0cmV0dXJuIGZpbGUuQW1hem9uUzMucGF0aDtcblx0XHRcdH1cblx0XHRcdC8vIENvbXBhdGliaWxpdHlcblx0XHRcdC8vIFRPRE86IE1pZ3JhdGlvblxuXHRcdFx0aWYgKGZpbGUuczMpIHtcblx0XHRcdFx0cmV0dXJuIGZpbGUuczMucGF0aCArIGZpbGUuX2lkO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmdldFJlZGlyZWN0VVJMID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0Y29uc3QgcGFyYW1zID0ge1xuXHRcdFx0XHRLZXk6IHRoaXMuZ2V0UGF0aChmaWxlKSxcblx0XHRcdFx0RXhwaXJlczogY2xhc3NPcHRpb25zLlVSTEV4cGlyeVRpbWVTcGFuXG5cdFx0XHR9O1xuXG5cdFx0XHRyZXR1cm4gczMuZ2V0U2lnbmVkVXJsKCdnZXRPYmplY3QnLCBwYXJhbXMpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBDcmVhdGVzIHRoZSBmaWxlIGluIHRoZSBjb2xsZWN0aW9uXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gY2FsbGJhY2tcblx0XHQgKiBAcmV0dXJuIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0dGhpcy5jcmVhdGUgPSBmdW5jdGlvbihmaWxlLCBjYWxsYmFjaykge1xuXHRcdFx0Y2hlY2soZmlsZSwgT2JqZWN0KTtcblxuXHRcdFx0aWYgKGZpbGUuX2lkID09IG51bGwpIHtcblx0XHRcdFx0ZmlsZS5faWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdH1cblxuXHRcdFx0ZmlsZS5BbWF6b25TMyA9IHtcblx0XHRcdFx0cGF0aDogdGhpcy5vcHRpb25zLmdldFBhdGgoZmlsZSlcblx0XHRcdH07XG5cblx0XHRcdGZpbGUuc3RvcmUgPSB0aGlzLm9wdGlvbnMubmFtZTsgLy8gYXNzaWduIHN0b3JlIHRvIGZpbGVcblx0XHRcdHJldHVybiB0aGlzLmdldENvbGxlY3Rpb24oKS5pbnNlcnQoZmlsZSwgY2FsbGJhY2spO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmVzIHRoZSBmaWxlXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBjYWxsYmFja1xuXHRcdCAqL1xuXHRcdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24oZmlsZUlkLCBjYWxsYmFjaykge1xuXHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoe19pZDogZmlsZUlkfSk7XG5cdFx0XHRjb25zdCBwYXJhbXMgPSB7XG5cdFx0XHRcdEtleTogdGhpcy5nZXRQYXRoKGZpbGUpXG5cdFx0XHR9O1xuXG5cdFx0XHRzMy5kZWxldGVPYmplY3QocGFyYW1zLCAoZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjayAmJiBjYWxsYmFjayhlcnIsIGRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgcmVhZCBzdHJlYW1cblx0XHQgKiBAcGFyYW0gZmlsZUlkXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gb3B0aW9uc1xuXHRcdCAqIEByZXR1cm4geyp9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRSZWFkU3RyZWFtID0gZnVuY3Rpb24oZmlsZUlkLCBmaWxlLCBvcHRpb25zID0ge30pIHtcblx0XHRcdGNvbnN0IHBhcmFtcyA9IHtcblx0XHRcdFx0S2V5OiB0aGlzLmdldFBhdGgoZmlsZSlcblx0XHRcdH07XG5cblx0XHRcdGlmIChvcHRpb25zLnN0YXJ0ICYmIG9wdGlvbnMuZW5kKSB7XG5cdFx0XHRcdHBhcmFtcy5SYW5nZSA9IGAkeyBvcHRpb25zLnN0YXJ0IH0gLSAkeyBvcHRpb25zLmVuZCB9YDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHMzLmdldE9iamVjdChwYXJhbXMpLmNyZWF0ZVJlYWRTdHJlYW0oKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgZmlsZSB3cml0ZSBzdHJlYW1cblx0XHQgKiBAcGFyYW0gZmlsZUlkXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gb3B0aW9uc1xuXHRcdCAqIEByZXR1cm4geyp9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRXcml0ZVN0cmVhbSA9IGZ1bmN0aW9uKGZpbGVJZCwgZmlsZS8qLCBvcHRpb25zKi8pIHtcblx0XHRcdGNvbnN0IHdyaXRlU3RyZWFtID0gbmV3IHN0cmVhbS5QYXNzVGhyb3VnaCgpO1xuXHRcdFx0d3JpdGVTdHJlYW0ubGVuZ3RoID0gZmlsZS5zaXplO1xuXG5cdFx0XHR3cml0ZVN0cmVhbS5vbignbmV3TGlzdGVuZXInLCAoZXZlbnQsIGxpc3RlbmVyKSA9PiB7XG5cdFx0XHRcdGlmIChldmVudCA9PT0gJ2ZpbmlzaCcpIHtcblx0XHRcdFx0XHRwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcblx0XHRcdFx0XHRcdHdyaXRlU3RyZWFtLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcik7XG5cdFx0XHRcdFx0XHR3cml0ZVN0cmVhbS5vbigncmVhbF9maW5pc2gnLCBsaXN0ZW5lcik7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRzMy5wdXRPYmplY3Qoe1xuXHRcdFx0XHRLZXk6IHRoaXMuZ2V0UGF0aChmaWxlKSxcblx0XHRcdFx0Qm9keTogd3JpdGVTdHJlYW0sXG5cdFx0XHRcdENvbnRlbnRUeXBlOiBmaWxlLnR5cGUsXG5cdFx0XHRcdENvbnRlbnREaXNwb3NpdGlvbjogYGlubGluZTsgZmlsZW5hbWU9XCIkeyBlbmNvZGVVUkkoZmlsZS5uYW1lKSB9XCJgXG5cblx0XHRcdH0sIChlcnJvcikgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHdyaXRlU3RyZWFtLmVtaXQoJ3JlYWxfZmluaXNoJyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHdyaXRlU3RyZWFtO1xuXHRcdH07XG5cdH1cbn1cblxuLy8gQWRkIHN0b3JlIHRvIFVGUyBuYW1lc3BhY2VcblVwbG9hZEZTLnN0b3JlLkFtYXpvblMzID0gQW1hem9uUzNTdG9yZTtcbiIsImltcG9ydCB7VXBsb2FkRlN9IGZyb20gJ21ldGVvci9qYWxpazp1ZnMnO1xuaW1wb3J0IGdjU3RvcmFnZSBmcm9tICdAZ29vZ2xlLWNsb3VkL3N0b3JhZ2UnO1xuXG4vKipcbiAqIEdvb2dsZVN0b3JhZ2Ugc3RvcmVcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZXhwb3J0IGNsYXNzIEdvb2dsZVN0b3JhZ2VTdG9yZSBleHRlbmRzIFVwbG9hZEZTLlN0b3JlIHtcblxuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIob3B0aW9ucyk7XG5cblx0XHRjb25zdCBnY3MgPSBnY1N0b3JhZ2Uob3B0aW9ucy5jb25uZWN0aW9uKTtcblx0XHR0aGlzLmJ1Y2tldCA9IGdjcy5idWNrZXQob3B0aW9ucy5idWNrZXQpO1xuXG5cdFx0b3B0aW9ucy5nZXRQYXRoID0gb3B0aW9ucy5nZXRQYXRoIHx8IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdHJldHVybiBmaWxlLl9pZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRQYXRoID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0aWYgKGZpbGUuR29vZ2xlU3RvcmFnZSkge1xuXHRcdFx0XHRyZXR1cm4gZmlsZS5Hb29nbGVTdG9yYWdlLnBhdGg7XG5cdFx0XHR9XG5cdFx0XHQvLyBDb21wYXRpYmlsaXR5XG5cdFx0XHQvLyBUT0RPOiBNaWdyYXRpb25cblx0XHRcdGlmIChmaWxlLmdvb2dsZUNsb3VkU3RvcmFnZSkge1xuXHRcdFx0XHRyZXR1cm4gZmlsZS5nb29nbGVDbG91ZFN0b3JhZ2UucGF0aCArIGZpbGUuX2lkO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmdldFJlZGlyZWN0VVJMID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spIHtcblx0XHRcdGNvbnN0IHBhcmFtcyA9IHtcblx0XHRcdFx0YWN0aW9uOiAncmVhZCcsXG5cdFx0XHRcdHJlc3BvbnNlRGlzcG9zaXRpb246ICdpbmxpbmUnLFxuXHRcdFx0XHRleHBpcmVzOiBEYXRlLm5vdygpK3RoaXMub3B0aW9ucy5VUkxFeHBpcnlUaW1lU3BhbioxMDAwXG5cdFx0XHR9O1xuXG5cdFx0XHR0aGlzLmJ1Y2tldC5maWxlKHRoaXMuZ2V0UGF0aChmaWxlKSkuZ2V0U2lnbmVkVXJsKHBhcmFtcywgY2FsbGJhY2spO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBDcmVhdGVzIHRoZSBmaWxlIGluIHRoZSBjb2xsZWN0aW9uXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gY2FsbGJhY2tcblx0XHQgKiBAcmV0dXJuIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0dGhpcy5jcmVhdGUgPSBmdW5jdGlvbihmaWxlLCBjYWxsYmFjaykge1xuXHRcdFx0Y2hlY2soZmlsZSwgT2JqZWN0KTtcblxuXHRcdFx0aWYgKGZpbGUuX2lkID09IG51bGwpIHtcblx0XHRcdFx0ZmlsZS5faWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdH1cblxuXHRcdFx0ZmlsZS5Hb29nbGVTdG9yYWdlID0ge1xuXHRcdFx0XHRwYXRoOiB0aGlzLm9wdGlvbnMuZ2V0UGF0aChmaWxlKVxuXHRcdFx0fTtcblxuXHRcdFx0ZmlsZS5zdG9yZSA9IHRoaXMub3B0aW9ucy5uYW1lOyAvLyBhc3NpZ24gc3RvcmUgdG8gZmlsZVxuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0Q29sbGVjdGlvbigpLmluc2VydChmaWxlLCBjYWxsYmFjayk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJlbW92ZXMgdGhlIGZpbGVcblx0XHQgKiBAcGFyYW0gZmlsZUlkXG5cdFx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdFx0ICovXG5cdFx0dGhpcy5kZWxldGUgPSBmdW5jdGlvbihmaWxlSWQsIGNhbGxiYWNrKSB7XG5cdFx0XHRjb25zdCBmaWxlID0gdGhpcy5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZSh7X2lkOiBmaWxlSWR9KTtcblx0XHRcdHRoaXMuYnVja2V0LmZpbGUodGhpcy5nZXRQYXRoKGZpbGUpKS5kZWxldGUoZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjayAmJiBjYWxsYmFjayhlcnIsIGRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgcmVhZCBzdHJlYW1cblx0XHQgKiBAcGFyYW0gZmlsZUlkXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gb3B0aW9uc1xuXHRcdCAqIEByZXR1cm4geyp9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRSZWFkU3RyZWFtID0gZnVuY3Rpb24oZmlsZUlkLCBmaWxlLCBvcHRpb25zID0ge30pIHtcblx0XHRcdGNvbnN0IGNvbmZpZyA9IHt9O1xuXG5cdFx0XHRpZiAob3B0aW9ucy5zdGFydCAhPSBudWxsKSB7XG5cdFx0XHRcdGNvbmZpZy5zdGFydCA9IG9wdGlvbnMuc3RhcnQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChvcHRpb25zLmVuZCAhPSBudWxsKSB7XG5cdFx0XHRcdGNvbmZpZy5lbmQgPSBvcHRpb25zLmVuZDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXMuYnVja2V0LmZpbGUodGhpcy5nZXRQYXRoKGZpbGUpKS5jcmVhdGVSZWFkU3RyZWFtKGNvbmZpZyk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgd3JpdGUgc3RyZWFtXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIG9wdGlvbnNcblx0XHQgKiBAcmV0dXJuIHsqfVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0V3JpdGVTdHJlYW0gPSBmdW5jdGlvbihmaWxlSWQsIGZpbGUvKiwgb3B0aW9ucyovKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5idWNrZXQuZmlsZSh0aGlzLmdldFBhdGgoZmlsZSkpLmNyZWF0ZVdyaXRlU3RyZWFtKHtcblx0XHRcdFx0Z3ppcDogZmFsc2UsXG5cdFx0XHRcdG1ldGFkYXRhOiB7XG5cdFx0XHRcdFx0Y29udGVudFR5cGU6IGZpbGUudHlwZSxcblx0XHRcdFx0XHRjb250ZW50RGlzcG9zaXRpb246IGBpbmxpbmU7IGZpbGVuYW1lPSR7IGZpbGUubmFtZSB9YFxuXHRcdFx0XHRcdC8vIG1ldGFkYXRhOiB7XG5cdFx0XHRcdFx0Ly8gXHRjdXN0b206ICdtZXRhZGF0YSdcblx0XHRcdFx0XHQvLyB9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdH1cbn1cblxuLy8gQWRkIHN0b3JlIHRvIFVGUyBuYW1lc3BhY2VcblVwbG9hZEZTLnN0b3JlLkdvb2dsZVN0b3JhZ2UgPSBHb29nbGVTdG9yYWdlU3RvcmU7XG4iLCJpbXBvcnQge1VwbG9hZEZTfSBmcm9tICdtZXRlb3IvamFsaWs6dWZzJztcbmltcG9ydCBXZWJkYXYgZnJvbSAnd2ViZGF2JztcbmltcG9ydCBzdHJlYW0gZnJvbSAnc3RyZWFtJztcbi8qKlxuICogV2ViREFWIHN0b3JlXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJkYXZTdG9yZSBleHRlbmRzIFVwbG9hZEZTLlN0b3JlIHtcblxuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cblx0XHRzdXBlcihvcHRpb25zKTtcblxuXG5cdFx0Y29uc3QgY2xpZW50ID0gbmV3IFdlYmRhdihcblx0XHRcdG9wdGlvbnMuY29ubmVjdGlvbi5jcmVkZW50aWFscy5zZXJ2ZXIsXG5cdFx0XHRvcHRpb25zLmNvbm5lY3Rpb24uY3JlZGVudGlhbHMudXNlcm5hbWUsXG5cdFx0XHRvcHRpb25zLmNvbm5lY3Rpb24uY3JlZGVudGlhbHMucGFzc3dvcmQsXG5cdFx0KTtcblxuXHRcdG9wdGlvbnMuZ2V0UGF0aCA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdGlmIChvcHRpb25zLnVwbG9hZEZvbGRlclBhdGhbb3B0aW9ucy51cGxvYWRGb2xkZXJQYXRoLmxlbmd0aC0xXSAhPT0gJy8nKSB7XG5cdFx0XHRcdG9wdGlvbnMudXBsb2FkRm9sZGVyUGF0aCArPSAnLyc7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gb3B0aW9ucy51cGxvYWRGb2xkZXJQYXRoICsgZmlsZS5faWQ7XG5cdFx0fTtcblxuXHRcdGNsaWVudC5zdGF0KG9wdGlvbnMudXBsb2FkRm9sZGVyUGF0aCkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG5cdFx0XHRpZiAoZXJyLnN0YXR1cyA9PT0gJzQwNCcpIHtcblx0XHRcdFx0Y2xpZW50LmNyZWF0ZURpcmVjdG9yeShvcHRpb25zLnVwbG9hZEZvbGRlclBhdGgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgZmlsZSBwYXRoXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcmV0dXJuIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRQYXRoID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0aWYgKGZpbGUuV2ViZGF2KSB7XG5cdFx0XHRcdHJldHVybiBmaWxlLldlYmRhdi5wYXRoO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBDcmVhdGVzIHRoZSBmaWxlIGluIHRoZSBjb2wgbGVjdGlvblxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdFx0ICogQHJldHVybiB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spIHtcblx0XHRcdGNoZWNrKGZpbGUsIE9iamVjdCk7XG5cblx0XHRcdGlmIChmaWxlLl9pZCA9PSBudWxsKSB7XG5cdFx0XHRcdGZpbGUuX2lkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZpbGUuV2ViZGF2ID0ge1xuXHRcdFx0XHRwYXRoOiBvcHRpb25zLmdldFBhdGgoZmlsZSlcblx0XHRcdH07XG5cblx0XHRcdGZpbGUuc3RvcmUgPSB0aGlzLm9wdGlvbnMubmFtZTtcblx0XHRcdHJldHVybiB0aGlzLmdldENvbGxlY3Rpb24oKS5pbnNlcnQoZmlsZSwgY2FsbGJhY2spO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmVzIHRoZSBmaWxlXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBjYWxsYmFja1xuXHRcdCAqL1xuXHRcdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24oZmlsZUlkLCBjYWxsYmFjaykge1xuXHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoe19pZDogZmlsZUlkfSk7XG5cdFx0XHRjbGllbnQuZGVsZXRlRmlsZSh0aGlzLmdldFBhdGgoZmlsZSksIChlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgZmlsZSByZWFkIHN0cmVhbVxuXHRcdCAqIEBwYXJhbSBmaWxlSWRcblx0XHQgKiBAcGFyYW0gZmlsZVxuXHRcdCAqIEBwYXJhbSBvcHRpb25zXG5cdFx0ICogQHJldHVybiB7Kn1cblx0XHQgKi9cblx0XHR0aGlzLmdldFJlYWRTdHJlYW0gPSBmdW5jdGlvbihmaWxlSWQsIGZpbGUsIG9wdGlvbnMgPSB7fSkge1xuXHRcdFx0Y29uc3QgcmFuZ2UgPSB7fTtcblxuXHRcdFx0aWYgKG9wdGlvbnMuc3RhcnQgIT0gbnVsbCkge1xuXHRcdFx0XHRyYW5nZS5zdGFydCA9IG9wdGlvbnMuc3RhcnQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChvcHRpb25zLmVuZCAhPSBudWxsKSB7XG5cdFx0XHRcdHJhbmdlLmVuZCA9IG9wdGlvbnMuZW5kO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGNsaWVudC5jcmVhdGVSZWFkU3RyZWFtKHRoaXMuZ2V0UGF0aChmaWxlKSwgb3B0aW9ucyk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgd3JpdGUgc3RyZWFtXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHJldHVybiB7Kn1cblx0XHQgKi9cblx0XHR0aGlzLmdldFdyaXRlU3RyZWFtID0gZnVuY3Rpb24oZmlsZUlkLCBmaWxlKSB7XG5cdFx0XHRjb25zdCB3cml0ZVN0cmVhbSA9IG5ldyBzdHJlYW0uUGFzc1Rocm91Z2goKTtcblx0XHRcdGNvbnN0IHdlYmRhdlN0cmVhbSA9IGNsaWVudC5jcmVhdGVXcml0ZVN0cmVhbSh0aGlzLmdldFBhdGgoZmlsZSkpO1xuXG5cdFx0XHQvL1RPRE8gcmVtb3ZlIHRpbWVvdXQgd2hlbiBVcGxvYWRGUyBidWcgcmVzb2x2ZWRcblx0XHRcdGNvbnN0IG5ld0xpc3RlbmVyQ2FsbGJhY2sgPSAoZXZlbnQsIGxpc3RlbmVyKSA9PiB7XG5cdFx0XHRcdGlmIChldmVudCA9PT0gJ2ZpbmlzaCcpIHtcblx0XHRcdFx0XHRwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcblx0XHRcdFx0XHRcdHdyaXRlU3RyZWFtLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcik7XG5cdFx0XHRcdFx0XHR3cml0ZVN0cmVhbS5yZW1vdmVMaXN0ZW5lcignbmV3TGlzdGVuZXInLCBuZXdMaXN0ZW5lckNhbGxiYWNrKTtcblx0XHRcdFx0XHRcdHdyaXRlU3RyZWFtLm9uKGV2ZW50LCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0c2V0VGltZW91dChsaXN0ZW5lciwgNTAwKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0d3JpdGVTdHJlYW0ub24oJ25ld0xpc3RlbmVyJywgbmV3TGlzdGVuZXJDYWxsYmFjayk7XG5cblx0XHRcdHdyaXRlU3RyZWFtLnBpcGUod2ViZGF2U3RyZWFtKTtcblx0XHRcdHJldHVybiB3cml0ZVN0cmVhbTtcblx0XHR9O1xuXG5cdH1cbn1cblxuLy8gQWRkIHN0b3JlIHRvIFVGUyBuYW1lc3BhY2VcblVwbG9hZEZTLnN0b3JlLldlYmRhdiA9IFdlYmRhdlN0b3JlO1xuIl19
