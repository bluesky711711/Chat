(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:user-data-download":{"server":{"startup":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_user-data-download/server/startup/settings.js                                             //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
RocketChat.settings.addGroup('UserDataDownload', function () {
  this.add('UserData_EnableDownload', true, {
    type: 'boolean',
    public: true,
    i18nLabel: 'UserData_EnableDownload'
  });
  this.add('UserData_FileSystemPath', '', {
    type: 'string',
    public: true,
    i18nLabel: 'UserData_FileSystemPath'
  });
  this.add('UserData_FileSystemZipPath', '', {
    type: 'string',
    public: true,
    i18nLabel: 'UserData_FileSystemZipPath'
  });
  this.add('UserData_ProcessingFrequency', 15, {
    type: 'int',
    public: true,
    i18nLabel: 'UserData_ProcessingFrequency'
  });
  this.add('UserData_MessageLimitPerRequest', 100, {
    type: 'int',
    public: true,
    i18nLabel: 'UserData_MessageLimitPerRequest'
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cronProcessDownloads.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_user-data-download/server/cronProcessDownloads.js                                         //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let path;
module.watch(require("path"), {
  default(v) {
    path = v;
  }

}, 1);
let archiver;
module.watch(require("archiver"), {
  default(v) {
    archiver = v;
  }

}, 2);
let zipFolder = '/tmp/zipFiles';

if (RocketChat.settings.get('UserData_FileSystemZipPath') != null) {
  if (RocketChat.settings.get('UserData_FileSystemZipPath').trim() !== '') {
    zipFolder = RocketChat.settings.get('UserData_FileSystemZipPath');
  }
}

let processingFrequency = 15;

if (RocketChat.settings.get('UserData_ProcessingFrequency') > 0) {
  processingFrequency = RocketChat.settings.get('UserData_ProcessingFrequency');
}

const startFile = function (fileName, content) {
  fs.writeFileSync(fileName, content);
};

const writeToFile = function (fileName, content) {
  fs.appendFileSync(fileName, content);
};

const createDir = function (folderName) {
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }
};

const loadUserSubscriptions = function (exportOperation) {
  exportOperation.roomList = [];
  const exportUserId = exportOperation.userId;
  const cursor = RocketChat.models.Subscriptions.findByUserId(exportUserId);
  cursor.forEach(subscription => {
    const roomId = subscription.rid;
    const roomData = subscription._room;
    let roomName = roomData.name ? roomData.name : roomId;
    let userId = null;

    if (subscription.t === 'd') {
      userId = roomId.replace(exportUserId, '');
      const userData = RocketChat.models.Users.findOneById(userId);

      if (userData) {
        roomName = userData.name;
      }
    }

    const fileName = exportOperation.fullExport ? roomId : roomName;
    const fileType = exportOperation.fullExport ? 'json' : 'html';
    const targetFile = `${fileName}.${fileType}`;
    exportOperation.roomList.push({
      roomId,
      roomName,
      userId,
      exportedCount: 0,
      status: 'pending',
      targetFile,
      type: subscription.t
    });
  });

  if (exportOperation.fullExport) {
    exportOperation.status = 'exporting-rooms';
  } else {
    exportOperation.status = 'exporting';
  }
};

const getAttachmentData = function (attachment) {
  const attachmentData = {
    type: attachment.type,
    title: attachment.title,
    title_link: attachment.title_link,
    image_url: attachment.image_url,
    audio_url: attachment.audio_url,
    video_url: attachment.video_url,
    message_link: attachment.message_link,
    image_type: attachment.image_type,
    image_size: attachment.image_size,
    video_size: attachment.video_size,
    video_type: attachment.video_type,
    audio_size: attachment.audio_size,
    audio_type: attachment.audio_type,
    url: null,
    remote: false,
    fileId: null,
    fileName: null
  };
  const url = attachment.title_link || attachment.image_url || attachment.audio_url || attachment.video_url || attachment.message_link;

  if (url) {
    attachmentData.url = url;
    const urlMatch = /\:\/\//.exec(url);

    if (urlMatch && urlMatch.length > 0) {
      attachmentData.remote = true;
    } else {
      const match = /^\/([^\/]+)\/([^\/]+)\/(.*)/.exec(url);

      if (match && match[2]) {
        const file = RocketChat.models.Uploads.findOneById(match[2]);

        if (file) {
          attachmentData.fileId = file._id;
          attachmentData.fileName = file.name;
        }
      }
    }
  }

  return attachmentData;
};

const addToFileList = function (exportOperation, attachment) {
  const targetFile = path.join(exportOperation.assetsPath, `${attachment.fileId}-${attachment.fileName}`);
  const attachmentData = {
    url: attachment.url,
    copied: false,
    remote: attachment.remote,
    fileId: attachment.fileId,
    fileName: attachment.fileName,
    targetFile
  };
  exportOperation.fileList.push(attachmentData);
};

const getMessageData = function (msg, exportOperation) {
  const attachments = [];

  if (msg.attachments) {
    msg.attachments.forEach(attachment => {
      const attachmentData = getAttachmentData(attachment);
      attachments.push(attachmentData);
      addToFileList(exportOperation, attachmentData);
    });
  }

  const messageObject = {
    msg: msg.msg,
    username: msg.u.username,
    ts: msg.ts
  };

  if (attachments && attachments.length > 0) {
    messageObject.attachments = attachments;
  }

  if (msg.t) {
    messageObject.type = msg.t;
  }

  if (msg.u.name) {
    messageObject.name = msg.u.name;
  }

  return messageObject;
};

const copyFile = function (exportOperation, attachmentData) {
  if (attachmentData.copied || attachmentData.remote || !attachmentData.fileId) {
    attachmentData.copied = true;
    return;
  }

  const file = RocketChat.models.Uploads.findOneById(attachmentData.fileId);

  if (file) {
    if (FileUpload.copy(file, attachmentData.targetFile)) {
      attachmentData.copied = true;
    }
  }
};

const continueExportingRoom = function (exportOperation, exportOpRoomData) {
  createDir(exportOperation.exportPath);
  createDir(exportOperation.assetsPath);
  const filePath = path.join(exportOperation.exportPath, exportOpRoomData.targetFile);

  if (exportOpRoomData.status === 'pending') {
    exportOpRoomData.status = 'exporting';
    startFile(filePath, '');

    if (!exportOperation.fullExport) {
      writeToFile(filePath, '<meta http-equiv="content-type" content="text/html; charset=utf-8">');
    }
  }

  let limit = 100;

  if (RocketChat.settings.get('UserData_MessageLimitPerRequest') > 0) {
    limit = RocketChat.settings.get('UserData_MessageLimitPerRequest');
  }

  const skip = exportOpRoomData.exportedCount;
  const cursor = RocketChat.models.Messages.findByRoomId(exportOpRoomData.roomId, {
    limit,
    skip
  });
  const count = cursor.count();
  cursor.forEach(msg => {
    const messageObject = getMessageData(msg, exportOperation);

    if (exportOperation.fullExport) {
      const messageString = JSON.stringify(messageObject);
      writeToFile(filePath, `${messageString}\n`);
    } else {
      const messageType = msg.t;
      const userName = msg.u.username || msg.u.name;
      const timestamp = msg.ts ? new Date(msg.ts).toUTCString() : '';
      let message = msg.msg;

      switch (messageType) {
        case 'uj':
          message = TAPi18n.__('User_joined_channel');
          break;

        case 'ul':
          message = TAPi18n.__('User_left');
          break;

        case 'au':
          message = TAPi18n.__('User_added_by', {
            user_added: msg.msg,
            user_by: msg.u.username
          });
          break;

        case 'r':
          message = TAPi18n.__('Room_name_changed', {
            room_name: msg.msg,
            user_by: msg.u.username
          });
          break;

        case 'ru':
          message = TAPi18n.__('User_removed_by', {
            user_removed: msg.msg,
            user_by: msg.u.username
          });
          break;

        case 'wm':
          message = TAPi18n.__('Welcome', {
            user: msg.u.username
          });
          break;

        case 'livechat-close':
          message = TAPi18n.__('Conversation_finished');
          break;
      }

      if (message !== msg.msg) {
        message = `<i>${message}</i>`;
      }

      writeToFile(filePath, `<p><strong>${userName}</strong> (${timestamp}):<br/>`);
      writeToFile(filePath, message);

      if (messageObject.attachments && messageObject.attachments.length > 0) {
        messageObject.attachments.forEach(attachment => {
          if (attachment.type === 'file') {
            const description = attachment.description || attachment.title || TAPi18n.__('Message_Attachments');

            const assetUrl = `./assets/${attachment.fileId}-${attachment.fileName}`;
            const link = `<br/><a href="${assetUrl}">${description}</a>`;
            writeToFile(filePath, link);
          }
        });
      }

      writeToFile(filePath, '</p>');
    }

    exportOpRoomData.exportedCount++;
  });

  if (count <= exportOpRoomData.exportedCount) {
    exportOpRoomData.status = 'completed';
    return true;
  }

  return false;
};

const isExportComplete = function (exportOperation) {
  const incomplete = exportOperation.roomList.some(exportOpRoomData => {
    return exportOpRoomData.status !== 'completed';
  });
  return !incomplete;
};

const isDownloadFinished = function (exportOperation) {
  const anyDownloadPending = exportOperation.fileList.some(fileData => {
    return !fileData.copied && !fileData.remote;
  });
  return !anyDownloadPending;
};

const sendEmail = function (userId) {
  const lastFile = RocketChat.models.UserDataFiles.findLastFileByUser(userId);

  if (lastFile) {
    const userData = RocketChat.models.Users.findOneById(userId);

    if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
      const emailAddress = `${userData.name} <${userData.emails[0].address}>`;
      const fromAddress = RocketChat.settings.get('From_Email');

      const subject = TAPi18n.__('UserDataDownload_EmailSubject');

      const download_link = lastFile.url;

      const body = TAPi18n.__('UserDataDownload_EmailBody', {
        download_link
      });

      const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;

      if (rfcMailPatternWithName.test(emailAddress)) {
        Meteor.defer(function () {
          return Email.send({
            to: emailAddress,
            from: fromAddress,
            subject,
            html: body
          });
        });
        return console.log(`Sending email to ${emailAddress}`);
      }
    }
  }
};

const makeZipFile = function (exportOperation) {
  createDir(zipFolder);
  const targetFile = path.join(zipFolder, `${exportOperation.userId}.zip`);

  if (fs.existsSync(targetFile)) {
    exportOperation.status = 'uploading';
    return;
  }

  const output = fs.createWriteStream(targetFile);
  exportOperation.generatedFile = targetFile;
  const archive = archiver('zip');
  output.on('close', () => {});
  archive.on('error', err => {
    throw err;
  });
  archive.pipe(output);
  archive.directory(exportOperation.exportPath, false);
  archive.finalize();
};

const uploadZipFile = function (exportOperation, callback) {
  const userDataStore = FileUpload.getStore('UserDataFiles');
  const filePath = exportOperation.generatedFile;
  const stat = Meteor.wrapAsync(fs.stat)(filePath);
  const stream = fs.createReadStream(filePath);
  const contentType = 'application/zip';
  const size = stat.size;
  const userId = exportOperation.userId;
  const user = RocketChat.models.Users.findOneById(userId);
  const userDisplayName = user ? user.name : userId;
  const utcDate = new Date().toISOString().split('T')[0];
  const newFileName = encodeURIComponent(`${utcDate}-${userDisplayName}.zip`);
  const details = {
    userId,
    type: contentType,
    size,
    name: newFileName
  };
  userDataStore.insert(details, stream, err => {
    if (err) {
      throw new Meteor.Error('invalid-file', 'Invalid Zip File', {
        method: 'cronProcessDownloads.uploadZipFile'
      });
    } else {
      callback();
    }
  });
};

const generateChannelsFile = function (exportOperation) {
  if (exportOperation.fullExport) {
    const fileName = path.join(exportOperation.exportPath, 'channels.json');
    startFile(fileName, '');
    exportOperation.roomList.forEach(roomData => {
      const newRoomData = {
        roomId: roomData.roomId,
        roomName: roomData.roomName,
        type: roomData.type
      };
      const messageString = JSON.stringify(newRoomData);
      writeToFile(fileName, `${messageString}\n`);
    });
  }

  exportOperation.status = 'exporting';
};

const continueExportOperation = function (exportOperation) {
  if (exportOperation.status === 'completed') {
    return;
  }

  if (!exportOperation.roomList) {
    loadUserSubscriptions(exportOperation);
  }

  try {
    if (exportOperation.status === 'exporting-rooms') {
      generateChannelsFile(exportOperation);
    } //Run every room on every request, to avoid missing new messages on the rooms that finished first.


    if (exportOperation.status === 'exporting') {
      exportOperation.roomList.forEach(exportOpRoomData => {
        continueExportingRoom(exportOperation, exportOpRoomData);
      });

      if (isExportComplete(exportOperation)) {
        exportOperation.status = 'downloading';
        return;
      }
    }

    if (exportOperation.status === 'downloading') {
      exportOperation.fileList.forEach(attachmentData => {
        copyFile(exportOperation, attachmentData);
      });

      if (isDownloadFinished(exportOperation)) {
        const targetFile = path.join(zipFolder, `${exportOperation.userId}.zip`);

        if (fs.existsSync(targetFile)) {
          fs.unlinkSync(targetFile);
        }

        exportOperation.status = 'compressing';
        return;
      }
    }

    if (exportOperation.status === 'compressing') {
      makeZipFile(exportOperation);
      return;
    }

    if (exportOperation.status === 'uploading') {
      uploadZipFile(exportOperation, () => {
        exportOperation.status = 'completed';
        RocketChat.models.ExportOperations.updateOperation(exportOperation);
      });
      return;
    }
  } catch (e) {
    console.error(e);
  }
};

function processDataDownloads() {
  const cursor = RocketChat.models.ExportOperations.findAllPending({
    limit: 1
  });
  cursor.forEach(exportOperation => {
    if (exportOperation.status === 'completed') {
      return;
    }

    continueExportOperation(exportOperation);
    RocketChat.models.ExportOperations.updateOperation(exportOperation);

    if (exportOperation.status === 'completed') {
      sendEmail(exportOperation.userId);
    }
  });
}

Meteor.startup(function () {
  Meteor.defer(function () {
    processDataDownloads();
    SyncedCron.add({
      name: 'Generate download files for user data',
      schedule: parser => parser.cron(`*/${processingFrequency} * * * *`),
      job: processDataDownloads
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:user-data-download/server/startup/settings.js");
require("/node_modules/meteor/rocketchat:user-data-download/server/cronProcessDownloads.js");

/* Exports */
Package._define("rocketchat:user-data-download");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_user-data-download.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp1c2VyLWRhdGEtZG93bmxvYWQvc2VydmVyL3N0YXJ0dXAvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dXNlci1kYXRhLWRvd25sb2FkL3NlcnZlci9jcm9uUHJvY2Vzc0Rvd25sb2Fkcy5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJpMThuTGFiZWwiLCJmcyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwicGF0aCIsImFyY2hpdmVyIiwiemlwRm9sZGVyIiwiZ2V0IiwidHJpbSIsInByb2Nlc3NpbmdGcmVxdWVuY3kiLCJzdGFydEZpbGUiLCJmaWxlTmFtZSIsImNvbnRlbnQiLCJ3cml0ZUZpbGVTeW5jIiwid3JpdGVUb0ZpbGUiLCJhcHBlbmRGaWxlU3luYyIsImNyZWF0ZURpciIsImZvbGRlck5hbWUiLCJleGlzdHNTeW5jIiwibWtkaXJTeW5jIiwibG9hZFVzZXJTdWJzY3JpcHRpb25zIiwiZXhwb3J0T3BlcmF0aW9uIiwicm9vbUxpc3QiLCJleHBvcnRVc2VySWQiLCJ1c2VySWQiLCJjdXJzb3IiLCJtb2RlbHMiLCJTdWJzY3JpcHRpb25zIiwiZmluZEJ5VXNlcklkIiwiZm9yRWFjaCIsInN1YnNjcmlwdGlvbiIsInJvb21JZCIsInJpZCIsInJvb21EYXRhIiwiX3Jvb20iLCJyb29tTmFtZSIsIm5hbWUiLCJ0IiwicmVwbGFjZSIsInVzZXJEYXRhIiwiVXNlcnMiLCJmaW5kT25lQnlJZCIsImZ1bGxFeHBvcnQiLCJmaWxlVHlwZSIsInRhcmdldEZpbGUiLCJwdXNoIiwiZXhwb3J0ZWRDb3VudCIsInN0YXR1cyIsImdldEF0dGFjaG1lbnREYXRhIiwiYXR0YWNobWVudCIsImF0dGFjaG1lbnREYXRhIiwidGl0bGUiLCJ0aXRsZV9saW5rIiwiaW1hZ2VfdXJsIiwiYXVkaW9fdXJsIiwidmlkZW9fdXJsIiwibWVzc2FnZV9saW5rIiwiaW1hZ2VfdHlwZSIsImltYWdlX3NpemUiLCJ2aWRlb19zaXplIiwidmlkZW9fdHlwZSIsImF1ZGlvX3NpemUiLCJhdWRpb190eXBlIiwidXJsIiwicmVtb3RlIiwiZmlsZUlkIiwidXJsTWF0Y2giLCJleGVjIiwibGVuZ3RoIiwibWF0Y2giLCJmaWxlIiwiVXBsb2FkcyIsIl9pZCIsImFkZFRvRmlsZUxpc3QiLCJqb2luIiwiYXNzZXRzUGF0aCIsImNvcGllZCIsImZpbGVMaXN0IiwiZ2V0TWVzc2FnZURhdGEiLCJtc2ciLCJhdHRhY2htZW50cyIsIm1lc3NhZ2VPYmplY3QiLCJ1c2VybmFtZSIsInUiLCJ0cyIsImNvcHlGaWxlIiwiRmlsZVVwbG9hZCIsImNvcHkiLCJjb250aW51ZUV4cG9ydGluZ1Jvb20iLCJleHBvcnRPcFJvb21EYXRhIiwiZXhwb3J0UGF0aCIsImZpbGVQYXRoIiwibGltaXQiLCJza2lwIiwiTWVzc2FnZXMiLCJmaW5kQnlSb29tSWQiLCJjb3VudCIsIm1lc3NhZ2VTdHJpbmciLCJKU09OIiwic3RyaW5naWZ5IiwibWVzc2FnZVR5cGUiLCJ1c2VyTmFtZSIsInRpbWVzdGFtcCIsIkRhdGUiLCJ0b1VUQ1N0cmluZyIsIm1lc3NhZ2UiLCJUQVBpMThuIiwiX18iLCJ1c2VyX2FkZGVkIiwidXNlcl9ieSIsInJvb21fbmFtZSIsInVzZXJfcmVtb3ZlZCIsInVzZXIiLCJkZXNjcmlwdGlvbiIsImFzc2V0VXJsIiwibGluayIsImlzRXhwb3J0Q29tcGxldGUiLCJpbmNvbXBsZXRlIiwic29tZSIsImlzRG93bmxvYWRGaW5pc2hlZCIsImFueURvd25sb2FkUGVuZGluZyIsImZpbGVEYXRhIiwic2VuZEVtYWlsIiwibGFzdEZpbGUiLCJVc2VyRGF0YUZpbGVzIiwiZmluZExhc3RGaWxlQnlVc2VyIiwiZW1haWxzIiwiYWRkcmVzcyIsImVtYWlsQWRkcmVzcyIsImZyb21BZGRyZXNzIiwic3ViamVjdCIsImRvd25sb2FkX2xpbmsiLCJib2R5IiwicmZjTWFpbFBhdHRlcm5XaXRoTmFtZSIsInRlc3QiLCJNZXRlb3IiLCJkZWZlciIsIkVtYWlsIiwic2VuZCIsInRvIiwiZnJvbSIsImh0bWwiLCJjb25zb2xlIiwibG9nIiwibWFrZVppcEZpbGUiLCJvdXRwdXQiLCJjcmVhdGVXcml0ZVN0cmVhbSIsImdlbmVyYXRlZEZpbGUiLCJhcmNoaXZlIiwib24iLCJlcnIiLCJwaXBlIiwiZGlyZWN0b3J5IiwiZmluYWxpemUiLCJ1cGxvYWRaaXBGaWxlIiwiY2FsbGJhY2siLCJ1c2VyRGF0YVN0b3JlIiwiZ2V0U3RvcmUiLCJzdGF0Iiwid3JhcEFzeW5jIiwic3RyZWFtIiwiY3JlYXRlUmVhZFN0cmVhbSIsImNvbnRlbnRUeXBlIiwic2l6ZSIsInVzZXJEaXNwbGF5TmFtZSIsInV0Y0RhdGUiLCJ0b0lTT1N0cmluZyIsInNwbGl0IiwibmV3RmlsZU5hbWUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJkZXRhaWxzIiwiaW5zZXJ0IiwiRXJyb3IiLCJtZXRob2QiLCJnZW5lcmF0ZUNoYW5uZWxzRmlsZSIsIm5ld1Jvb21EYXRhIiwiY29udGludWVFeHBvcnRPcGVyYXRpb24iLCJ1bmxpbmtTeW5jIiwiRXhwb3J0T3BlcmF0aW9ucyIsInVwZGF0ZU9wZXJhdGlvbiIsImUiLCJlcnJvciIsInByb2Nlc3NEYXRhRG93bmxvYWRzIiwiZmluZEFsbFBlbmRpbmciLCJzdGFydHVwIiwiU3luY2VkQ3JvbiIsInNjaGVkdWxlIiwicGFyc2VyIiwiY3JvbiIsImpvYiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsUUFBWCxDQUFvQkMsUUFBcEIsQ0FBNkIsa0JBQTdCLEVBQWlELFlBQVc7QUFFM0QsT0FBS0MsR0FBTCxDQUFTLHlCQUFULEVBQW9DLElBQXBDLEVBQTBDO0FBQ3pDQyxVQUFNLFNBRG1DO0FBRXpDQyxZQUFRLElBRmlDO0FBR3pDQyxlQUFXO0FBSDhC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NEJBQXdCM0osZUFBeEI7QUFDQTlCLGVBQVdtQyxNQUFYLENBQWtCd0osZ0JBQWxCLENBQW1DQyxlQUFuQyxDQUFtRDlKLGVBQW5EOztBQUVBLFFBQUlBLGdCQUFnQjBCLE1BQWhCLEtBQTJCLFdBQS9CLEVBQTRDO0FBQzNDMkUsZ0JBQVVyRyxnQkFBZ0JHLE1BQTFCO0FBQ0E7QUFDRCxHQVhEO0FBWUE7O0FBRUQrRyxPQUFPaUQsT0FBUCxDQUFlLFlBQVc7QUFDekJqRCxTQUFPQyxLQUFQLENBQWEsWUFBVztBQUN2QjhDO0FBRUFHLGVBQVcvTCxHQUFYLENBQWU7QUFDZDBDLFlBQU0sdUNBRFE7QUFFZHNKLGdCQUFXQyxNQUFELElBQVlBLE9BQU9DLElBQVAsQ0FBYSxLQUFLbkwsbUJBQXFCLFVBQXZDLENBRlI7QUFHZG9MLFdBQUtQO0FBSFMsS0FBZjtBQUtBLEdBUkQ7QUFTQSxDQVZELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfdXNlci1kYXRhLWRvd25sb2FkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnVXNlckRhdGFEb3dubG9hZCcsIGZ1bmN0aW9uKCkge1xuXG5cdHRoaXMuYWRkKCdVc2VyRGF0YV9FbmFibGVEb3dubG9hZCcsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1VzZXJEYXRhX0VuYWJsZURvd25sb2FkJ1xuXHR9KTtcblxuXHR0aGlzLmFkZCgnVXNlckRhdGFfRmlsZVN5c3RlbVBhdGgnLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdVc2VyRGF0YV9GaWxlU3lzdGVtUGF0aCdcblx0fSk7XG5cblx0dGhpcy5hZGQoJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1aaXBQYXRoJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnVXNlckRhdGFfRmlsZVN5c3RlbVppcFBhdGgnXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdVc2VyRGF0YV9Qcm9jZXNzaW5nRnJlcXVlbmN5JywgMTUsIHtcblx0XHR0eXBlOiAnaW50Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnVXNlckRhdGFfUHJvY2Vzc2luZ0ZyZXF1ZW5jeSdcblx0fSk7XG5cblx0dGhpcy5hZGQoJ1VzZXJEYXRhX01lc3NhZ2VMaW1pdFBlclJlcXVlc3QnLCAxMDAsIHtcblx0XHR0eXBlOiAnaW50Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnVXNlckRhdGFfTWVzc2FnZUxpbWl0UGVyUmVxdWVzdCdcblx0fSk7XG5cblxufSk7XG4iLCIvKiBnbG9iYWxzIFN5bmNlZENyb24gKi9cblxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGFyY2hpdmVyIGZyb20gJ2FyY2hpdmVyJztcblxubGV0IHppcEZvbGRlciA9ICcvdG1wL3ppcEZpbGVzJztcbmlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVXNlckRhdGFfRmlsZVN5c3RlbVppcFBhdGgnKSAhPSBudWxsKSB7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVXNlckRhdGFfRmlsZVN5c3RlbVppcFBhdGgnKS50cmltKCkgIT09ICcnKSB7XG5cdFx0emlwRm9sZGVyID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1aaXBQYXRoJyk7XG5cdH1cbn1cblxubGV0IHByb2Nlc3NpbmdGcmVxdWVuY3kgPSAxNTtcbmlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVXNlckRhdGFfUHJvY2Vzc2luZ0ZyZXF1ZW5jeScpID4gMCkge1xuXHRwcm9jZXNzaW5nRnJlcXVlbmN5ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX1Byb2Nlc3NpbmdGcmVxdWVuY3knKTtcbn1cblxuY29uc3Qgc3RhcnRGaWxlID0gZnVuY3Rpb24oZmlsZU5hbWUsIGNvbnRlbnQpIHtcblx0ZnMud3JpdGVGaWxlU3luYyhmaWxlTmFtZSwgY29udGVudCk7XG59O1xuXG5jb25zdCB3cml0ZVRvRmlsZSA9IGZ1bmN0aW9uKGZpbGVOYW1lLCBjb250ZW50KSB7XG5cdGZzLmFwcGVuZEZpbGVTeW5jKGZpbGVOYW1lLCBjb250ZW50KTtcbn07XG5cbmNvbnN0IGNyZWF0ZURpciA9IGZ1bmN0aW9uKGZvbGRlck5hbWUpIHtcblx0aWYgKCFmcy5leGlzdHNTeW5jKGZvbGRlck5hbWUpKSB7XG5cdFx0ZnMubWtkaXJTeW5jKGZvbGRlck5hbWUpO1xuXHR9XG59O1xuXG5jb25zdCBsb2FkVXNlclN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24pIHtcblx0ZXhwb3J0T3BlcmF0aW9uLnJvb21MaXN0ID0gW107XG5cblx0Y29uc3QgZXhwb3J0VXNlcklkID0gZXhwb3J0T3BlcmF0aW9uLnVzZXJJZDtcblx0Y29uc3QgY3Vyc29yID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQnlVc2VySWQoZXhwb3J0VXNlcklkKTtcblx0Y3Vyc29yLmZvckVhY2goKHN1YnNjcmlwdGlvbikgPT4ge1xuXHRcdGNvbnN0IHJvb21JZCA9IHN1YnNjcmlwdGlvbi5yaWQ7XG5cdFx0Y29uc3Qgcm9vbURhdGEgPSBzdWJzY3JpcHRpb24uX3Jvb207XG5cdFx0bGV0IHJvb21OYW1lID0gcm9vbURhdGEubmFtZSA/IHJvb21EYXRhLm5hbWUgOiByb29tSWQ7XG5cdFx0bGV0IHVzZXJJZCA9IG51bGw7XG5cblx0XHRpZiAoc3Vic2NyaXB0aW9uLnQgPT09ICdkJykge1xuXHRcdFx0dXNlcklkID0gcm9vbUlkLnJlcGxhY2UoZXhwb3J0VXNlcklkLCAnJyk7XG5cdFx0XHRjb25zdCB1c2VyRGF0YSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cblx0XHRcdGlmICh1c2VyRGF0YSkge1xuXHRcdFx0XHRyb29tTmFtZSA9IHVzZXJEYXRhLm5hbWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZU5hbWUgPSBleHBvcnRPcGVyYXRpb24uZnVsbEV4cG9ydCA/IHJvb21JZCA6IHJvb21OYW1lO1xuXHRcdGNvbnN0IGZpbGVUeXBlID0gZXhwb3J0T3BlcmF0aW9uLmZ1bGxFeHBvcnQgPyAnanNvbicgOiAnaHRtbCc7XG5cdFx0Y29uc3QgdGFyZ2V0RmlsZSA9IGAkeyBmaWxlTmFtZSB9LiR7IGZpbGVUeXBlIH1gO1xuXG5cdFx0ZXhwb3J0T3BlcmF0aW9uLnJvb21MaXN0LnB1c2goe1xuXHRcdFx0cm9vbUlkLFxuXHRcdFx0cm9vbU5hbWUsXG5cdFx0XHR1c2VySWQsXG5cdFx0XHRleHBvcnRlZENvdW50OiAwLFxuXHRcdFx0c3RhdHVzOiAncGVuZGluZycsXG5cdFx0XHR0YXJnZXRGaWxlLFxuXHRcdFx0dHlwZTogc3Vic2NyaXB0aW9uLnRcblx0XHR9KTtcblx0fSk7XG5cblx0aWYgKGV4cG9ydE9wZXJhdGlvbi5mdWxsRXhwb3J0KSB7XG5cdFx0ZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9ICdleHBvcnRpbmctcm9vbXMnO1xuXHR9IGVsc2Uge1xuXHRcdGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPSAnZXhwb3J0aW5nJztcblx0fVxufTtcblxuY29uc3QgZ2V0QXR0YWNobWVudERhdGEgPSBmdW5jdGlvbihhdHRhY2htZW50KSB7XG5cdGNvbnN0IGF0dGFjaG1lbnREYXRhID0ge1xuXHRcdHR5cGUgOiBhdHRhY2htZW50LnR5cGUsXG5cdFx0dGl0bGU6IGF0dGFjaG1lbnQudGl0bGUsXG5cdFx0dGl0bGVfbGluazogYXR0YWNobWVudC50aXRsZV9saW5rLFxuXHRcdGltYWdlX3VybDogYXR0YWNobWVudC5pbWFnZV91cmwsXG5cdFx0YXVkaW9fdXJsOiBhdHRhY2htZW50LmF1ZGlvX3VybCxcblx0XHR2aWRlb191cmw6IGF0dGFjaG1lbnQudmlkZW9fdXJsLFxuXHRcdG1lc3NhZ2VfbGluazogYXR0YWNobWVudC5tZXNzYWdlX2xpbmssXG5cdFx0aW1hZ2VfdHlwZTogYXR0YWNobWVudC5pbWFnZV90eXBlLFxuXHRcdGltYWdlX3NpemU6IGF0dGFjaG1lbnQuaW1hZ2Vfc2l6ZSxcblx0XHR2aWRlb19zaXplOiBhdHRhY2htZW50LnZpZGVvX3NpemUsXG5cdFx0dmlkZW9fdHlwZTogYXR0YWNobWVudC52aWRlb190eXBlLFxuXHRcdGF1ZGlvX3NpemU6IGF0dGFjaG1lbnQuYXVkaW9fc2l6ZSxcblx0XHRhdWRpb190eXBlOiBhdHRhY2htZW50LmF1ZGlvX3R5cGUsXG5cdFx0dXJsOiBudWxsLFxuXHRcdHJlbW90ZTogZmFsc2UsXG5cdFx0ZmlsZUlkOiBudWxsLFxuXHRcdGZpbGVOYW1lOiBudWxsXG5cdH07XG5cblx0Y29uc3QgdXJsID0gYXR0YWNobWVudC50aXRsZV9saW5rIHx8IGF0dGFjaG1lbnQuaW1hZ2VfdXJsIHx8IGF0dGFjaG1lbnQuYXVkaW9fdXJsIHx8IGF0dGFjaG1lbnQudmlkZW9fdXJsIHx8IGF0dGFjaG1lbnQubWVzc2FnZV9saW5rO1xuXHRpZiAodXJsKSB7XG5cdFx0YXR0YWNobWVudERhdGEudXJsID0gdXJsO1xuXG5cdFx0Y29uc3QgdXJsTWF0Y2ggPSAvXFw6XFwvXFwvLy5leGVjKHVybCk7XG5cdFx0aWYgKHVybE1hdGNoICYmIHVybE1hdGNoLmxlbmd0aCA+IDApIHtcblx0XHRcdGF0dGFjaG1lbnREYXRhLnJlbW90ZSA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IG1hdGNoID0gL15cXC8oW15cXC9dKylcXC8oW15cXC9dKylcXC8oLiopLy5leGVjKHVybCk7XG5cblx0XHRcdGlmIChtYXRjaCAmJiBtYXRjaFsyXSkge1xuXHRcdFx0XHRjb25zdCBmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lQnlJZChtYXRjaFsyXSk7XG5cblx0XHRcdFx0aWYgKGZpbGUpIHtcblx0XHRcdFx0XHRhdHRhY2htZW50RGF0YS5maWxlSWQgPSBmaWxlLl9pZDtcblx0XHRcdFx0XHRhdHRhY2htZW50RGF0YS5maWxlTmFtZSA9IGZpbGUubmFtZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBhdHRhY2htZW50RGF0YTtcbn07XG5cbmNvbnN0IGFkZFRvRmlsZUxpc3QgPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24sIGF0dGFjaG1lbnQpIHtcblx0Y29uc3QgdGFyZ2V0RmlsZSA9IHBhdGguam9pbihleHBvcnRPcGVyYXRpb24uYXNzZXRzUGF0aCwgYCR7IGF0dGFjaG1lbnQuZmlsZUlkIH0tJHsgYXR0YWNobWVudC5maWxlTmFtZSB9YCk7XG5cblx0Y29uc3QgYXR0YWNobWVudERhdGEgPSB7XG5cdFx0dXJsOiBhdHRhY2htZW50LnVybCxcblx0XHRjb3BpZWQ6IGZhbHNlLFxuXHRcdHJlbW90ZTogYXR0YWNobWVudC5yZW1vdGUsXG5cdFx0ZmlsZUlkOiBhdHRhY2htZW50LmZpbGVJZCxcblx0XHRmaWxlTmFtZTogYXR0YWNobWVudC5maWxlTmFtZSxcblx0XHR0YXJnZXRGaWxlXG5cdH07XG5cblx0ZXhwb3J0T3BlcmF0aW9uLmZpbGVMaXN0LnB1c2goYXR0YWNobWVudERhdGEpO1xufTtcblxuY29uc3QgZ2V0TWVzc2FnZURhdGEgPSBmdW5jdGlvbihtc2csIGV4cG9ydE9wZXJhdGlvbikge1xuXHRjb25zdCBhdHRhY2htZW50cyA9IFtdO1xuXG5cdGlmIChtc2cuYXR0YWNobWVudHMpIHtcblx0XHRtc2cuYXR0YWNobWVudHMuZm9yRWFjaCgoYXR0YWNobWVudCkgPT4ge1xuXHRcdFx0Y29uc3QgYXR0YWNobWVudERhdGEgPSBnZXRBdHRhY2htZW50RGF0YShhdHRhY2htZW50KTtcblxuXHRcdFx0YXR0YWNobWVudHMucHVzaChhdHRhY2htZW50RGF0YSk7XG5cdFx0XHRhZGRUb0ZpbGVMaXN0KGV4cG9ydE9wZXJhdGlvbiwgYXR0YWNobWVudERhdGEpO1xuXHRcdH0pO1xuXHR9XG5cblx0Y29uc3QgbWVzc2FnZU9iamVjdCA9IHtcblx0XHRtc2c6IG1zZy5tc2csXG5cdFx0dXNlcm5hbWU6IG1zZy51LnVzZXJuYW1lLFxuXHRcdHRzOiBtc2cudHNcblx0fTtcblxuXHRpZiAoYXR0YWNobWVudHMgJiYgYXR0YWNobWVudHMubGVuZ3RoID4gMCkge1xuXHRcdG1lc3NhZ2VPYmplY3QuYXR0YWNobWVudHMgPSBhdHRhY2htZW50cztcblx0fVxuXHRpZiAobXNnLnQpIHtcblx0XHRtZXNzYWdlT2JqZWN0LnR5cGUgPSBtc2cudDtcblx0fVxuXHRpZiAobXNnLnUubmFtZSkge1xuXHRcdG1lc3NhZ2VPYmplY3QubmFtZSA9IG1zZy51Lm5hbWU7XG5cdH1cblxuXHRyZXR1cm4gbWVzc2FnZU9iamVjdDtcbn07XG5cbmNvbnN0IGNvcHlGaWxlID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uLCBhdHRhY2htZW50RGF0YSkge1xuXHRpZiAoYXR0YWNobWVudERhdGEuY29waWVkIHx8IGF0dGFjaG1lbnREYXRhLnJlbW90ZSB8fCAhYXR0YWNobWVudERhdGEuZmlsZUlkKSB7XG5cdFx0YXR0YWNobWVudERhdGEuY29waWVkID0gdHJ1ZTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lQnlJZChhdHRhY2htZW50RGF0YS5maWxlSWQpO1xuXG5cdGlmIChmaWxlKSB7XG5cdFx0aWYgKEZpbGVVcGxvYWQuY29weShmaWxlLCBhdHRhY2htZW50RGF0YS50YXJnZXRGaWxlKSkge1xuXHRcdFx0YXR0YWNobWVudERhdGEuY29waWVkID0gdHJ1ZTtcblx0XHR9XG5cdH1cbn07XG5cbmNvbnN0IGNvbnRpbnVlRXhwb3J0aW5nUm9vbSA9IGZ1bmN0aW9uKGV4cG9ydE9wZXJhdGlvbiwgZXhwb3J0T3BSb29tRGF0YSkge1xuXHRjcmVhdGVEaXIoZXhwb3J0T3BlcmF0aW9uLmV4cG9ydFBhdGgpO1xuXHRjcmVhdGVEaXIoZXhwb3J0T3BlcmF0aW9uLmFzc2V0c1BhdGgpO1xuXG5cdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGV4cG9ydE9wZXJhdGlvbi5leHBvcnRQYXRoLCBleHBvcnRPcFJvb21EYXRhLnRhcmdldEZpbGUpO1xuXG5cdGlmIChleHBvcnRPcFJvb21EYXRhLnN0YXR1cyA9PT0gJ3BlbmRpbmcnKSB7XG5cdFx0ZXhwb3J0T3BSb29tRGF0YS5zdGF0dXMgPSAnZXhwb3J0aW5nJztcblx0XHRzdGFydEZpbGUoZmlsZVBhdGgsICcnKTtcblx0XHRpZiAoIWV4cG9ydE9wZXJhdGlvbi5mdWxsRXhwb3J0KSB7XG5cdFx0XHR3cml0ZVRvRmlsZShmaWxlUGF0aCwgJzxtZXRhIGh0dHAtZXF1aXY9XCJjb250ZW50LXR5cGVcIiBjb250ZW50PVwidGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04XCI+Jyk7XG5cdFx0fVxuXHR9XG5cblx0bGV0IGxpbWl0ID0gMTAwO1xuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX01lc3NhZ2VMaW1pdFBlclJlcXVlc3QnKSA+IDApIHtcblx0XHRsaW1pdCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVc2VyRGF0YV9NZXNzYWdlTGltaXRQZXJSZXF1ZXN0Jyk7XG5cdH1cblxuXHRjb25zdCBza2lwID0gZXhwb3J0T3BSb29tRGF0YS5leHBvcnRlZENvdW50O1xuXG5cdGNvbnN0IGN1cnNvciA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRCeVJvb21JZChleHBvcnRPcFJvb21EYXRhLnJvb21JZCwgeyBsaW1pdCwgc2tpcCB9KTtcblx0Y29uc3QgY291bnQgPSBjdXJzb3IuY291bnQoKTtcblxuXHRjdXJzb3IuZm9yRWFjaCgobXNnKSA9PiB7XG5cdFx0Y29uc3QgbWVzc2FnZU9iamVjdCA9IGdldE1lc3NhZ2VEYXRhKG1zZywgZXhwb3J0T3BlcmF0aW9uKTtcblxuXHRcdGlmIChleHBvcnRPcGVyYXRpb24uZnVsbEV4cG9ydCkge1xuXHRcdFx0Y29uc3QgbWVzc2FnZVN0cmluZyA9IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2VPYmplY3QpO1xuXHRcdFx0d3JpdGVUb0ZpbGUoZmlsZVBhdGgsIGAkeyBtZXNzYWdlU3RyaW5nIH1cXG5gKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgbWVzc2FnZVR5cGUgPSBtc2cudDtcblx0XHRcdGNvbnN0IHVzZXJOYW1lID0gbXNnLnUudXNlcm5hbWUgfHwgbXNnLnUubmFtZTtcblx0XHRcdGNvbnN0IHRpbWVzdGFtcCA9IG1zZy50cyA/IG5ldyBEYXRlKG1zZy50cykudG9VVENTdHJpbmcoKSA6ICcnO1xuXHRcdFx0bGV0IG1lc3NhZ2UgPSBtc2cubXNnO1xuXG5cdFx0XHRzd2l0Y2ggKG1lc3NhZ2VUeXBlKSB7XG5cdFx0XHRcdGNhc2UgJ3VqJzpcblx0XHRcdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnVXNlcl9qb2luZWRfY2hhbm5lbCcpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd1bCc6XG5cdFx0XHRcdFx0bWVzc2FnZSA9IFRBUGkxOG4uX18oJ1VzZXJfbGVmdCcpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdhdSc6XG5cdFx0XHRcdFx0bWVzc2FnZSA9IFRBUGkxOG4uX18oJ1VzZXJfYWRkZWRfYnknLCB7dXNlcl9hZGRlZCA6IG1zZy5tc2csIHVzZXJfYnkgOiBtc2cudS51c2VybmFtZSB9KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncic6XG5cdFx0XHRcdFx0bWVzc2FnZSA9IFRBUGkxOG4uX18oJ1Jvb21fbmFtZV9jaGFuZ2VkJywgeyByb29tX25hbWU6IG1zZy5tc2csIHVzZXJfYnk6IG1zZy51LnVzZXJuYW1lIH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdydSc6XG5cdFx0XHRcdFx0bWVzc2FnZSA9IFRBUGkxOG4uX18oJ1VzZXJfcmVtb3ZlZF9ieScsIHt1c2VyX3JlbW92ZWQgOiBtc2cubXNnLCB1c2VyX2J5IDogbXNnLnUudXNlcm5hbWUgfSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3dtJzpcblx0XHRcdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnV2VsY29tZScsIHt1c2VyOiBtc2cudS51c2VybmFtZSB9KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnbGl2ZWNoYXQtY2xvc2UnOlxuXHRcdFx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdDb252ZXJzYXRpb25fZmluaXNoZWQnKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0aWYgKG1lc3NhZ2UgIT09IG1zZy5tc2cpIHtcblx0XHRcdFx0bWVzc2FnZSA9IGA8aT4keyBtZXNzYWdlIH08L2k+YDtcblx0XHRcdH1cblxuXHRcdFx0d3JpdGVUb0ZpbGUoZmlsZVBhdGgsIGA8cD48c3Ryb25nPiR7IHVzZXJOYW1lIH08L3N0cm9uZz4gKCR7IHRpbWVzdGFtcCB9KTo8YnIvPmApO1xuXHRcdFx0d3JpdGVUb0ZpbGUoZmlsZVBhdGgsIG1lc3NhZ2UpO1xuXG5cdFx0XHRpZiAobWVzc2FnZU9iamVjdC5hdHRhY2htZW50cyAmJiBtZXNzYWdlT2JqZWN0LmF0dGFjaG1lbnRzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0bWVzc2FnZU9iamVjdC5hdHRhY2htZW50cy5mb3JFYWNoKChhdHRhY2htZW50KSA9PiB7XG5cdFx0XHRcdFx0aWYgKGF0dGFjaG1lbnQudHlwZSA9PT0gJ2ZpbGUnKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBkZXNjcmlwdGlvbiA9IGF0dGFjaG1lbnQuZGVzY3JpcHRpb24gfHwgYXR0YWNobWVudC50aXRsZSB8fCBUQVBpMThuLl9fKCdNZXNzYWdlX0F0dGFjaG1lbnRzJyk7XG5cblx0XHRcdFx0XHRcdGNvbnN0IGFzc2V0VXJsID0gYC4vYXNzZXRzLyR7IGF0dGFjaG1lbnQuZmlsZUlkIH0tJHsgYXR0YWNobWVudC5maWxlTmFtZSB9YDtcblx0XHRcdFx0XHRcdGNvbnN0IGxpbmsgPSBgPGJyLz48YSBocmVmPVwiJHsgYXNzZXRVcmwgfVwiPiR7IGRlc2NyaXB0aW9uIH08L2E+YDtcblx0XHRcdFx0XHRcdHdyaXRlVG9GaWxlKGZpbGVQYXRoLCBsaW5rKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR3cml0ZVRvRmlsZShmaWxlUGF0aCwgJzwvcD4nKTtcblx0XHR9XG5cblx0XHRleHBvcnRPcFJvb21EYXRhLmV4cG9ydGVkQ291bnQrKztcblx0fSk7XG5cblx0aWYgKGNvdW50IDw9IGV4cG9ydE9wUm9vbURhdGEuZXhwb3J0ZWRDb3VudCkge1xuXHRcdGV4cG9ydE9wUm9vbURhdGEuc3RhdHVzID0gJ2NvbXBsZXRlZCc7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59O1xuXG5jb25zdCBpc0V4cG9ydENvbXBsZXRlID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uKSB7XG5cdGNvbnN0IGluY29tcGxldGUgPSBleHBvcnRPcGVyYXRpb24ucm9vbUxpc3Quc29tZSgoZXhwb3J0T3BSb29tRGF0YSkgPT4ge1xuXHRcdHJldHVybiBleHBvcnRPcFJvb21EYXRhLnN0YXR1cyAhPT0gJ2NvbXBsZXRlZCc7XG5cdH0pO1xuXG5cdHJldHVybiAhaW5jb21wbGV0ZTtcbn07XG5cbmNvbnN0IGlzRG93bmxvYWRGaW5pc2hlZCA9IGZ1bmN0aW9uKGV4cG9ydE9wZXJhdGlvbikge1xuXHRjb25zdCBhbnlEb3dubG9hZFBlbmRpbmcgPSBleHBvcnRPcGVyYXRpb24uZmlsZUxpc3Quc29tZSgoZmlsZURhdGEpID0+IHtcblx0XHRyZXR1cm4gIWZpbGVEYXRhLmNvcGllZCAmJiAhZmlsZURhdGEucmVtb3RlO1xuXHR9KTtcblxuXHRyZXR1cm4gIWFueURvd25sb2FkUGVuZGluZztcbn07XG5cbmNvbnN0IHNlbmRFbWFpbCA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRjb25zdCBsYXN0RmlsZSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJEYXRhRmlsZXMuZmluZExhc3RGaWxlQnlVc2VyKHVzZXJJZCk7XG5cdGlmIChsYXN0RmlsZSkge1xuXHRcdGNvbnN0IHVzZXJEYXRhID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblxuXHRcdGlmICh1c2VyRGF0YSAmJiB1c2VyRGF0YS5lbWFpbHMgJiYgdXNlckRhdGEuZW1haWxzWzBdICYmIHVzZXJEYXRhLmVtYWlsc1swXS5hZGRyZXNzKSB7XG5cdFx0XHRjb25zdCBlbWFpbEFkZHJlc3MgPSBgJHsgdXNlckRhdGEubmFtZSB9IDwkeyB1c2VyRGF0YS5lbWFpbHNbMF0uYWRkcmVzcyB9PmA7XG5cdFx0XHRjb25zdCBmcm9tQWRkcmVzcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGcm9tX0VtYWlsJyk7XG5cdFx0XHRjb25zdCBzdWJqZWN0ID0gVEFQaTE4bi5fXygnVXNlckRhdGFEb3dubG9hZF9FbWFpbFN1YmplY3QnKTtcblxuXHRcdFx0Y29uc3QgZG93bmxvYWRfbGluayA9IGxhc3RGaWxlLnVybDtcblx0XHRcdGNvbnN0IGJvZHkgPSBUQVBpMThuLl9fKCdVc2VyRGF0YURvd25sb2FkX0VtYWlsQm9keScsIHsgZG93bmxvYWRfbGluayB9KTtcblxuXHRcdFx0Y29uc3QgcmZjTWFpbFBhdHRlcm5XaXRoTmFtZSA9IC9eKD86Lio8KT8oW2EtekEtWjAtOS4hIyQlJicqK1xcLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKikoPzo+PykkLztcblxuXHRcdFx0aWYgKHJmY01haWxQYXR0ZXJuV2l0aE5hbWUudGVzdChlbWFpbEFkZHJlc3MpKSB7XG5cdFx0XHRcdE1ldGVvci5kZWZlcihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gRW1haWwuc2VuZCh7XG5cdFx0XHRcdFx0XHR0bzogZW1haWxBZGRyZXNzLFxuXHRcdFx0XHRcdFx0ZnJvbTogZnJvbUFkZHJlc3MsXG5cdFx0XHRcdFx0XHRzdWJqZWN0LFxuXHRcdFx0XHRcdFx0aHRtbDogYm9keVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gY29uc29sZS5sb2coYFNlbmRpbmcgZW1haWwgdG8gJHsgZW1haWxBZGRyZXNzIH1gKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5cbmNvbnN0IG1ha2VaaXBGaWxlID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uKSB7XG5cdGNyZWF0ZURpcih6aXBGb2xkZXIpO1xuXG5cdGNvbnN0IHRhcmdldEZpbGUgPSBwYXRoLmpvaW4oemlwRm9sZGVyLCBgJHsgZXhwb3J0T3BlcmF0aW9uLnVzZXJJZCB9LnppcGApO1xuXHRpZiAoZnMuZXhpc3RzU3luYyh0YXJnZXRGaWxlKSkge1xuXHRcdGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPSAndXBsb2FkaW5nJztcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBvdXRwdXQgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0YXJnZXRGaWxlKTtcblxuXHRleHBvcnRPcGVyYXRpb24uZ2VuZXJhdGVkRmlsZSA9IHRhcmdldEZpbGU7XG5cblx0Y29uc3QgYXJjaGl2ZSA9IGFyY2hpdmVyKCd6aXAnKTtcblxuXHRvdXRwdXQub24oJ2Nsb3NlJywgKCkgPT4ge1xuXHR9KTtcblxuXHRhcmNoaXZlLm9uKCdlcnJvcicsIChlcnIpID0+IHtcblx0XHR0aHJvdyBlcnI7XG5cdH0pO1xuXG5cdGFyY2hpdmUucGlwZShvdXRwdXQpO1xuXHRhcmNoaXZlLmRpcmVjdG9yeShleHBvcnRPcGVyYXRpb24uZXhwb3J0UGF0aCwgZmFsc2UpO1xuXHRhcmNoaXZlLmZpbmFsaXplKCk7XG59O1xuXG5jb25zdCB1cGxvYWRaaXBGaWxlID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uLCBjYWxsYmFjaykge1xuXHRjb25zdCB1c2VyRGF0YVN0b3JlID0gRmlsZVVwbG9hZC5nZXRTdG9yZSgnVXNlckRhdGFGaWxlcycpO1xuXHRjb25zdCBmaWxlUGF0aCA9IGV4cG9ydE9wZXJhdGlvbi5nZW5lcmF0ZWRGaWxlO1xuXG5cdGNvbnN0IHN0YXQgPSBNZXRlb3Iud3JhcEFzeW5jKGZzLnN0YXQpKGZpbGVQYXRoKTtcblx0Y29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG5cblx0Y29uc3QgY29udGVudFR5cGUgPSAnYXBwbGljYXRpb24vemlwJztcblx0Y29uc3Qgc2l6ZSA9IHN0YXQuc2l6ZTtcblxuXHRjb25zdCB1c2VySWQgPSBleHBvcnRPcGVyYXRpb24udXNlcklkO1xuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblx0Y29uc3QgdXNlckRpc3BsYXlOYW1lID0gdXNlciA/IHVzZXIubmFtZSA6IHVzZXJJZDtcblx0Y29uc3QgdXRjRGF0ZSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xuXG5cdGNvbnN0IG5ld0ZpbGVOYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KGAkeyB1dGNEYXRlIH0tJHsgdXNlckRpc3BsYXlOYW1lIH0uemlwYCk7XG5cblx0Y29uc3QgZGV0YWlscyA9IHtcblx0XHR1c2VySWQsXG5cdFx0dHlwZTogY29udGVudFR5cGUsXG5cdFx0c2l6ZSxcblx0XHRuYW1lOiBuZXdGaWxlTmFtZVxuXHR9O1xuXG5cdHVzZXJEYXRhU3RvcmUuaW5zZXJ0KGRldGFpbHMsIHN0cmVhbSwgKGVycikgPT4ge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmlsZScsICdJbnZhbGlkIFppcCBGaWxlJywgeyBtZXRob2Q6ICdjcm9uUHJvY2Vzc0Rvd25sb2Fkcy51cGxvYWRaaXBGaWxlJyB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y2FsbGJhY2soKTtcblx0XHR9XG5cdH0pO1xufTtcblxuY29uc3QgZ2VuZXJhdGVDaGFubmVsc0ZpbGUgPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24pIHtcblx0aWYgKGV4cG9ydE9wZXJhdGlvbi5mdWxsRXhwb3J0KSB7XG5cdFx0Y29uc3QgZmlsZU5hbWUgPSBwYXRoLmpvaW4oZXhwb3J0T3BlcmF0aW9uLmV4cG9ydFBhdGgsICdjaGFubmVscy5qc29uJyk7XG5cdFx0c3RhcnRGaWxlKGZpbGVOYW1lLCAnJyk7XG5cblx0XHRleHBvcnRPcGVyYXRpb24ucm9vbUxpc3QuZm9yRWFjaCgocm9vbURhdGEpID0+IHtcblx0XHRcdGNvbnN0IG5ld1Jvb21EYXRhID0ge1xuXHRcdFx0XHRyb29tSWQ6IHJvb21EYXRhLnJvb21JZCxcblx0XHRcdFx0cm9vbU5hbWU6IHJvb21EYXRhLnJvb21OYW1lLFxuXHRcdFx0XHR0eXBlOiByb29tRGF0YS50eXBlXG5cdFx0XHR9O1xuXG5cdFx0XHRjb25zdCBtZXNzYWdlU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkobmV3Um9vbURhdGEpO1xuXHRcdFx0d3JpdGVUb0ZpbGUoZmlsZU5hbWUsIGAkeyBtZXNzYWdlU3RyaW5nIH1cXG5gKTtcblx0XHR9KTtcblx0fVxuXG5cdGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPSAnZXhwb3J0aW5nJztcbn07XG5cbmNvbnN0IGNvbnRpbnVlRXhwb3J0T3BlcmF0aW9uID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uKSB7XG5cdGlmIChleHBvcnRPcGVyYXRpb24uc3RhdHVzID09PSAnY29tcGxldGVkJykge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmICghZXhwb3J0T3BlcmF0aW9uLnJvb21MaXN0KSB7XG5cdFx0bG9hZFVzZXJTdWJzY3JpcHRpb25zKGV4cG9ydE9wZXJhdGlvbik7XG5cdH1cblxuXHR0cnkge1xuXG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICdleHBvcnRpbmctcm9vbXMnKSB7XG5cdFx0XHRnZW5lcmF0ZUNoYW5uZWxzRmlsZShleHBvcnRPcGVyYXRpb24pO1xuXHRcdH1cblxuXHRcdC8vUnVuIGV2ZXJ5IHJvb20gb24gZXZlcnkgcmVxdWVzdCwgdG8gYXZvaWQgbWlzc2luZyBuZXcgbWVzc2FnZXMgb24gdGhlIHJvb21zIHRoYXQgZmluaXNoZWQgZmlyc3QuXG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICdleHBvcnRpbmcnKSB7XG5cdFx0XHRleHBvcnRPcGVyYXRpb24ucm9vbUxpc3QuZm9yRWFjaCgoZXhwb3J0T3BSb29tRGF0YSkgPT4ge1xuXHRcdFx0XHRjb250aW51ZUV4cG9ydGluZ1Jvb20oZXhwb3J0T3BlcmF0aW9uLCBleHBvcnRPcFJvb21EYXRhKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoaXNFeHBvcnRDb21wbGV0ZShleHBvcnRPcGVyYXRpb24pKSB7XG5cdFx0XHRcdGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPSAnZG93bmxvYWRpbmcnO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICdkb3dubG9hZGluZycpIHtcblx0XHRcdGV4cG9ydE9wZXJhdGlvbi5maWxlTGlzdC5mb3JFYWNoKChhdHRhY2htZW50RGF0YSkgPT4ge1xuXHRcdFx0XHRjb3B5RmlsZShleHBvcnRPcGVyYXRpb24sIGF0dGFjaG1lbnREYXRhKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoaXNEb3dubG9hZEZpbmlzaGVkKGV4cG9ydE9wZXJhdGlvbikpIHtcblx0XHRcdFx0Y29uc3QgdGFyZ2V0RmlsZSA9IHBhdGguam9pbih6aXBGb2xkZXIsIGAkeyBleHBvcnRPcGVyYXRpb24udXNlcklkIH0uemlwYCk7XG5cdFx0XHRcdGlmIChmcy5leGlzdHNTeW5jKHRhcmdldEZpbGUpKSB7XG5cdFx0XHRcdFx0ZnMudW5saW5rU3luYyh0YXJnZXRGaWxlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPSAnY29tcHJlc3NpbmcnO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICdjb21wcmVzc2luZycpIHtcblx0XHRcdG1ha2VaaXBGaWxlKGV4cG9ydE9wZXJhdGlvbik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICd1cGxvYWRpbmcnKSB7XG5cdFx0XHR1cGxvYWRaaXBGaWxlKGV4cG9ydE9wZXJhdGlvbiwgKCkgPT4ge1xuXHRcdFx0XHRleHBvcnRPcGVyYXRpb24uc3RhdHVzID0gJ2NvbXBsZXRlZCc7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLkV4cG9ydE9wZXJhdGlvbnMudXBkYXRlT3BlcmF0aW9uKGV4cG9ydE9wZXJhdGlvbik7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHR9XG59O1xuXG5mdW5jdGlvbiBwcm9jZXNzRGF0YURvd25sb2FkcygpIHtcblx0Y29uc3QgY3Vyc29yID0gUm9ja2V0Q2hhdC5tb2RlbHMuRXhwb3J0T3BlcmF0aW9ucy5maW5kQWxsUGVuZGluZyh7bGltaXQ6IDF9KTtcblx0Y3Vyc29yLmZvckVhY2goKGV4cG9ydE9wZXJhdGlvbikgPT4ge1xuXHRcdGlmIChleHBvcnRPcGVyYXRpb24uc3RhdHVzID09PSAnY29tcGxldGVkJykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnRpbnVlRXhwb3J0T3BlcmF0aW9uKGV4cG9ydE9wZXJhdGlvbik7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuRXhwb3J0T3BlcmF0aW9ucy51cGRhdGVPcGVyYXRpb24oZXhwb3J0T3BlcmF0aW9uKTtcblxuXHRcdGlmIChleHBvcnRPcGVyYXRpb24uc3RhdHVzID09PSAnY29tcGxldGVkJykge1xuXHRcdFx0c2VuZEVtYWlsKGV4cG9ydE9wZXJhdGlvbi51c2VySWQpO1xuXHRcdH1cblx0fSk7XG59XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRNZXRlb3IuZGVmZXIoZnVuY3Rpb24oKSB7XG5cdFx0cHJvY2Vzc0RhdGFEb3dubG9hZHMoKTtcblxuXHRcdFN5bmNlZENyb24uYWRkKHtcblx0XHRcdG5hbWU6ICdHZW5lcmF0ZSBkb3dubG9hZCBmaWxlcyBmb3IgdXNlciBkYXRhJyxcblx0XHRcdHNjaGVkdWxlOiAocGFyc2VyKSA9PiBwYXJzZXIuY3JvbihgKi8keyBwcm9jZXNzaW5nRnJlcXVlbmN5IH0gKiAqICogKmApLFxuXHRcdFx0am9iOiBwcm9jZXNzRGF0YURvd25sb2Fkc1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIl19
