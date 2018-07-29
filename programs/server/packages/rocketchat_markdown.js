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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:markdown":{"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/settings.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
Meteor.startup(() => {
  RocketChat.settings.add('Markdown_Parser', 'original', {
    type: 'select',
    values: [{
      key: 'disabled',
      i18nLabel: 'Disabled'
    }, {
      key: 'original',
      i18nLabel: 'Original'
    }, {
      key: 'marked',
      i18nLabel: 'Marked'
    }],
    group: 'Message',
    section: 'Markdown',
    public: true
  });
  const enableQueryOriginal = {
    _id: 'Markdown_Parser',
    value: 'original'
  };
  RocketChat.settings.add('Markdown_Headers', false, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryOriginal
  });
  RocketChat.settings.add('Markdown_SupportSchemesForLink', 'http,https', {
    type: 'string',
    group: 'Message',
    section: 'Markdown',
    public: true,
    i18nDescription: 'Markdown_SupportSchemesForLink_Description',
    enableQuery: enableQueryOriginal
  });
  const enableQueryMarked = {
    _id: 'Markdown_Parser',
    value: 'marked'
  };
  RocketChat.settings.add('Markdown_Marked_GFM', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Tables', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Breaks', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Pedantic', false, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: [{
      _id: 'Markdown_Parser',
      value: 'marked'
    }, {
      _id: 'Markdown_Marked_GFM',
      value: false
    }]
  });
  RocketChat.settings.add('Markdown_Marked_SmartLists', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Smartypants', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markdown.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/markdown.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Blaze;
module.watch(require("meteor/blaze"), {
  Blaze(v) {
    Blaze = v;
  }

}, 2);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 3);
let marked;
module.watch(require("./parser/marked/marked.js"), {
  marked(v) {
    marked = v;
  }

}, 4);
let original;
module.watch(require("./parser/original/original.js"), {
  original(v) {
    original = v;
  }

}, 5);
let code;
module.watch(require("./parser/original/code.js"), {
  code(v) {
    code = v;
  }

}, 6);
const parsers = {
  original,
  marked
};

class MarkdownClass {
  parse(text) {
    const message = {
      html: s.escapeHTML(text)
    };
    return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
  }

  parseNotEscaped(text) {
    const message = {
      html: text
    };
    return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
  }

  parseMessageNotEscaped(message) {
    const parser = RocketChat.settings.get('Markdown_Parser');

    if (parser === 'disabled') {
      return message;
    }

    if (typeof parsers[parser] === 'function') {
      return parsers[parser](message);
    }

    return parsers['original'](message);
  }

  mountTokensBack(message, useHtml = true) {
    if (message.tokens && message.tokens.length > 0) {
      for (const _ref of message.tokens) {
        const {
          token,
          text,
          noHtml
        } = _ref;
        message.html = message.html.replace(token, () => useHtml ? text : noHtml); // Uses lambda so doesn't need to escape $
      }
    }

    return message;
  }

  code(...args) {
    return code(...args);
  }

}

const Markdown = new MarkdownClass();
RocketChat.Markdown = Markdown; // renderMessage already did html escape

const MarkdownMessage = message => {
  if (s.trim(message != null ? message.html : undefined)) {
    message = Markdown.parseMessageNotEscaped(message);
  }

  return message;
};

RocketChat.callbacks.add('renderMessage', MarkdownMessage, RocketChat.callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
  Blaze.registerHelper('RocketChatMarkdown', text => Markdown.parse(text));
  Blaze.registerHelper('RocketChatMarkdownUnescape', text => Markdown.parseNotEscaped(text));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"parser":{"marked":{"marked.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/marked/marked.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  marked: () => marked
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 2);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 3);
let hljs;
module.watch(require("highlight.js"), {
  default(v) {
    hljs = v;
  }

}, 4);

let _marked;

module.watch(require("marked"), {
  default(v) {
    _marked = v;
  }

}, 5);
const renderer = new _marked.Renderer();
let msg = null;

renderer.code = function (code, lang, escaped) {
  if (this.options.highlight) {
    const out = this.options.highlight(code, lang);

    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  let text = null;

  if (!lang) {
    text = `<pre><code class="code-colors hljs">${escaped ? code : s.escapeHTML(code, true)}</code></pre>`;
  } else {
    text = `<pre><code class="code-colors hljs ${escape(lang, true)}">${escaped ? code : s.escapeHTML(code, true)}</code></pre>`;
  }

  if (_.isString(msg)) {
    return text;
  }

  const token = `=!=${Random.id()}=!=`;
  msg.tokens.push({
    highlight: true,
    token,
    text
  });
  return token;
};

renderer.codespan = function (text) {
  text = `<code class="code-colors inline">${text}</code>`;

  if (_.isString(msg)) {
    return text;
  }

  const token = `=!=${Random.id()}=!=`;
  msg.tokens.push({
    token,
    text
  });
  return token;
};

renderer.blockquote = function (quote) {
  return `<blockquote class="background-transparent-darker-before">${quote}</blockquote>`;
};

const highlight = function (code, lang) {
  if (!lang) {
    return code;
  }

  try {
    return hljs.highlight(lang, code).value;
  } catch (e) {
    // Unknown language
    return code;
  }
};

let gfm = null;
let tables = null;
let breaks = null;
let pedantic = null;
let smartLists = null;
let smartypants = null;

const marked = message => {
  msg = message;

  if (!msg.tokens) {
    msg.tokens = [];
  }

  if (gfm == null) {
    gfm = RocketChat.settings.get('Markdown_Marked_GFM');
  }

  if (tables == null) {
    tables = RocketChat.settings.get('Markdown_Marked_Tables');
  }

  if (breaks == null) {
    breaks = RocketChat.settings.get('Markdown_Marked_Breaks');
  }

  if (pedantic == null) {
    pedantic = RocketChat.settings.get('Markdown_Marked_Pedantic');
  }

  if (smartLists == null) {
    smartLists = RocketChat.settings.get('Markdown_Marked_SmartLists');
  }

  if (smartypants == null) {
    smartypants = RocketChat.settings.get('Markdown_Marked_Smartypants');
  }

  msg.html = _marked(s.unescapeHTML(msg.html), {
    gfm,
    tables,
    breaks,
    pedantic,
    smartLists,
    smartypants,
    renderer,
    sanitize: true,
    highlight
  });
  return msg;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"original":{"code.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/original/code.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  code: () => code
});
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
let hljs;
module.watch(require("highlight.js"), {
  default(v) {
    hljs = v;
  }

}, 2);

const inlinecode = message => {
  // Support `text`
  return message.html = message.html.replace(/(^|&gt;|[ >_*~])\`([^`\r\n]+)\`([<_*~]|\B|\b|$)/gm, (match, p1, p2, p3) => {
    const token = ` =!=${Random.id()}=!=`;
    message.tokens.push({
      token,
      text: `${p1}<span class=\"copyonly\">\`</span><span><code class=\"code-colors inline\">${p2}</code></span><span class=\"copyonly\">\`</span>${p3}`,
      noHtml: match
    });
    return token;
  });
};

const codeblocks = message => {
  // Count occurencies of ```
  const count = (message.html.match(/```/g) || []).length;

  if (count) {
    // Check if we need to add a final ```
    if (count % 2 > 0) {
      message.html = `${message.html}\n\`\`\``;
      message.msg = `${message.msg}\n\`\`\``;
    } // Separate text in code blocks and non code blocks


    const msgParts = message.html.split(/(^.*)(```(?:[a-zA-Z]+)?(?:(?:.|\r|\n)*?)```)(.*\n?)$/gm);

    for (let index = 0; index < msgParts.length; index++) {
      // Verify if this part is code
      const part = msgParts[index];
      const codeMatch = part.match(/^```[\r\n]*(.*[\r\n\ ]?)[\r\n]*([\s\S]*?)```+?$/);

      if (codeMatch != null) {
        // Process highlight if this part is code
        const singleLine = codeMatch[0].indexOf('\n') === -1;
        const lang = !singleLine && Array.from(hljs.listLanguages()).includes(s.trim(codeMatch[1])) ? s.trim(codeMatch[1]) : '';
        const code = singleLine ? s.unescapeHTML(codeMatch[1]) : lang === '' ? s.unescapeHTML(codeMatch[1] + codeMatch[2]) : s.unescapeHTML(codeMatch[2]);
        const result = lang === '' ? hljs.highlightAuto(lang + code) : hljs.highlight(lang, code);
        const token = `=!=${Random.id()}=!=`;
        message.tokens.push({
          highlight: true,
          token,
          text: `<pre><code class='code-colors hljs ${result.language}'><span class='copyonly'>\`\`\`<br></span>${result.value}<span class='copyonly'><br>\`\`\`</span></code></pre>`,
          noHtml: codeMatch[0]
        });
        msgParts[index] = token;
      } else {
        msgParts[index] = part;
      }
    } // Re-mount message


    return message.html = msgParts.join('');
  }
};

const code = message => {
  if (s.trim(message.html)) {
    if (message.tokens == null) {
      message.tokens = [];
    }

    codeblocks(message);
    inlinecode(message);
  }

  return message;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markdown.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/original/markdown.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  markdown: () => markdown
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 2);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 3);

const parseNotEscaped = function (msg, message) {
  if (message && message.tokens == null) {
    message.tokens = [];
  }

  const addAsToken = function (html) {
    const token = `=!=${Random.id()}=!=`;
    message.tokens.push({
      token,
      text: html
    });
    return token;
  };

  const schemes = RocketChat.settings.get('Markdown_SupportSchemesForLink').split(',').join('|');

  if (RocketChat.settings.get('Markdown_Headers')) {
    // Support # Text for h1
    msg = msg.replace(/^# (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h1>$1</h1>'); // Support # Text for h2

    msg = msg.replace(/^## (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h2>$1</h2>'); // Support # Text for h3

    msg = msg.replace(/^### (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h3>$1</h3>'); // Support # Text for h4

    msg = msg.replace(/^#### (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h4>$1</h4>');
  } // Support *text* to make bold


  msg = msg.replace(/(^|&gt;|[ >_~`])\*{1,2}([^\*\r\n]+)\*{1,2}([<_~`]|\B|\b|$)/gm, '$1<span class="copyonly">*</span><strong>$2</strong><span class="copyonly">*</span>$3'); // Support _text_ to make italics

  msg = msg.replace(/(^|&gt;|[ >*~`])\_{1,2}([^\_\r\n]+)\_{1,2}([<*~`]|\B|\b|$)/gm, '$1<span class="copyonly">_</span><em>$2</em><span class="copyonly">_</span>$3'); // Support ~text~ to strike through text

  msg = msg.replace(/(^|&gt;|[ >_*`])\~{1,2}([^~\r\n]+)\~{1,2}([<_*`]|\B|\b|$)/gm, '$1<span class="copyonly">~</span><strike>$2</strike><span class="copyonly">~</span>$3'); // Support for block quote
  // >>>
  // Text
  // <<<

  msg = msg.replace(/(?:&gt;){3}\n+([\s\S]*?)\n+(?:&lt;){3}/g, '<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;&gt;&gt;</span>$1<span class="copyonly">&lt;&lt;&lt;</span></blockquote>'); // Support >Text for quote

  msg = msg.replace(/^&gt;(.*)$/gm, '<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;</span>$1</blockquote>'); // Remove white-space around blockquote (prevent <br>). Because blockquote is block element.

  msg = msg.replace(/\s*<blockquote class="background-transparent-darker-before">/gm, '<blockquote class="background-transparent-darker-before">');
  msg = msg.replace(/<\/blockquote>\s*/gm, '</blockquote>'); // Remove new-line between blockquotes.

  msg = msg.replace(/<\/blockquote>\n<blockquote/gm, '</blockquote><blockquote'); // Support ![alt text](http://image url)

  msg = msg.replace(new RegExp(`!\\[([^\\]]+)\\]\\(((?:${schemes}):\\/\\/[^\\)]+)\\)`, 'gm'), (match, title, url) => {
    const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
    return addAsToken(`<a href="${s.escapeHTML(url)}" title="${s.escapeHTML(title)}" target="${s.escapeHTML(target)}" rel="noopener noreferrer"><div class="inline-image" style="background-image: url(${s.escapeHTML(url)});"></div></a>`);
  }); // Support [Text](http://link)

  msg = msg.replace(new RegExp(`\\[([^\\]]+)\\]\\(((?:${schemes}):\\/\\/[^\\)]+)\\)`, 'gm'), (match, title, url) => {
    const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
    return addAsToken(`<a href="${s.escapeHTML(url)}" target="${s.escapeHTML(target)}" rel="noopener noreferrer">${s.escapeHTML(title)}</a>`);
  }); // Support <http://link|Text>

  msg = msg.replace(new RegExp(`(?:<|&lt;)((?:${schemes}):\\/\\/[^\\|]+)\\|(.+?)(?=>|&gt;)(?:>|&gt;)`, 'gm'), (match, url, title) => {
    const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
    return addAsToken(`<a href="${s.escapeHTML(url)}" target="${s.escapeHTML(target)}" rel="noopener noreferrer">${s.escapeHTML(title)}</a>`);
  });
  return msg;
};

const markdown = function (message) {
  message.html = parseNotEscaped(message.html, message);
  return message;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"original.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/original/original.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  original: () => original
});
let markdown;
module.watch(require("./markdown.js"), {
  markdown(v) {
    markdown = v;
  }

}, 0);
let code;
module.watch(require("./code.js"), {
  code(v) {
    code = v;
  }

}, 1);

const original = message => {
  // Parse markdown code
  message = code(message); // Parse markdown

  message = markdown(message); // Replace linebreak to br

  message.html = message.html.replace(/\n/gm, '<br>');
  return message;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:markdown/settings.js");
var exports = require("/node_modules/meteor/rocketchat:markdown/markdown.js");

/* Exports */
Package._define("rocketchat:markdown", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_markdown.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9tYXJrZG93bi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9wYXJzZXIvbWFya2VkL21hcmtlZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9wYXJzZXIvb3JpZ2luYWwvY29kZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9wYXJzZXIvb3JpZ2luYWwvbWFya2Rvd24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWFya2Rvd24vcGFyc2VyL29yaWdpbmFsL29yaWdpbmFsLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJSb2NrZXRDaGF0Iiwic3RhcnR1cCIsInNldHRpbmdzIiwiYWRkIiwidHlwZSIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsImdyb3VwIiwic2VjdGlvbiIsInB1YmxpYyIsImVuYWJsZVF1ZXJ5T3JpZ2luYWwiLCJfaWQiLCJ2YWx1ZSIsImVuYWJsZVF1ZXJ5IiwiaTE4bkRlc2NyaXB0aW9uIiwiZW5hYmxlUXVlcnlNYXJrZWQiLCJzIiwiZGVmYXVsdCIsIkJsYXplIiwibWFya2VkIiwib3JpZ2luYWwiLCJjb2RlIiwicGFyc2VycyIsIk1hcmtkb3duQ2xhc3MiLCJwYXJzZSIsInRleHQiLCJtZXNzYWdlIiwiaHRtbCIsImVzY2FwZUhUTUwiLCJtb3VudFRva2Vuc0JhY2siLCJwYXJzZU1lc3NhZ2VOb3RFc2NhcGVkIiwicGFyc2VOb3RFc2NhcGVkIiwicGFyc2VyIiwiZ2V0IiwidXNlSHRtbCIsInRva2VucyIsImxlbmd0aCIsInRva2VuIiwibm9IdG1sIiwicmVwbGFjZSIsImFyZ3MiLCJNYXJrZG93biIsIk1hcmtkb3duTWVzc2FnZSIsInRyaW0iLCJ1bmRlZmluZWQiLCJjYWxsYmFja3MiLCJwcmlvcml0eSIsIkhJR0giLCJpc0NsaWVudCIsInJlZ2lzdGVySGVscGVyIiwiZXhwb3J0IiwiUmFuZG9tIiwiXyIsImhsanMiLCJfbWFya2VkIiwicmVuZGVyZXIiLCJSZW5kZXJlciIsIm1zZyIsImxhbmciLCJlc2NhcGVkIiwib3B0aW9ucyIsImhpZ2hsaWdodCIsIm91dCIsImVzY2FwZSIsImlzU3RyaW5nIiwiaWQiLCJwdXNoIiwiY29kZXNwYW4iLCJibG9ja3F1b3RlIiwicXVvdGUiLCJlIiwiZ2ZtIiwidGFibGVzIiwiYnJlYWtzIiwicGVkYW50aWMiLCJzbWFydExpc3RzIiwic21hcnR5cGFudHMiLCJ1bmVzY2FwZUhUTUwiLCJzYW5pdGl6ZSIsImlubGluZWNvZGUiLCJtYXRjaCIsInAxIiwicDIiLCJwMyIsImNvZGVibG9ja3MiLCJjb3VudCIsIm1zZ1BhcnRzIiwic3BsaXQiLCJpbmRleCIsInBhcnQiLCJjb2RlTWF0Y2giLCJzaW5nbGVMaW5lIiwiaW5kZXhPZiIsIkFycmF5IiwiZnJvbSIsImxpc3RMYW5ndWFnZXMiLCJpbmNsdWRlcyIsInJlc3VsdCIsImhpZ2hsaWdodEF1dG8iLCJsYW5ndWFnZSIsImpvaW4iLCJtYXJrZG93biIsImFkZEFzVG9rZW4iLCJzY2hlbWVzIiwiUmVnRXhwIiwidGl0bGUiLCJ1cmwiLCJ0YXJnZXQiLCJhYnNvbHV0ZVVybCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLE1BQUo7QUFBV0MsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDSCxTQUFPSSxDQUFQLEVBQVM7QUFBQ0osYUFBT0ksQ0FBUDtBQUFTOztBQUFwQixDQUF0QyxFQUE0RCxDQUE1RDtBQUErRCxJQUFJQyxVQUFKO0FBQWVKLE9BQU9DLEtBQVAs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RUFBRVksVUFBRixDQUFhK0UsTUFBYixDQUFzQiwrQkFBK0IzRixFQUFFWSxVQUFGLENBQWE2RSxLQUFiLENBQXFCLE1BQWxJLENBQVA7QUFDQSxHQUhLLENBQU47QUFLQSxTQUFPaEQsR0FBUDtBQUNBLENBM0VEOztBQTZFTyxNQUFNNEMsV0FBVyxVQUFTM0UsT0FBVCxFQUFrQjtBQUN6Q0EsVUFBUUMsSUFBUixHQUFlSSxnQkFBZ0JMLFFBQVFDLElBQXhCLEVBQThCRCxPQUE5QixDQUFmO0FBQ0EsU0FBT0EsT0FBUDtBQUNBLENBSE0sQzs7Ozs7Ozs7Ozs7QUN0RlAvQixPQUFPdUQsTUFBUCxDQUFjO0FBQUM5QixZQUFTLE1BQUlBO0FBQWQsQ0FBZDtBQUF1QyxJQUFJaUYsUUFBSjtBQUFhMUcsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDd0csV0FBU3ZHLENBQVQsRUFBVztBQUFDdUcsZUFBU3ZHLENBQVQ7QUFBVzs7QUFBeEIsQ0FBdEMsRUFBZ0UsQ0FBaEU7QUFBbUUsSUFBSXVCLElBQUo7QUFBUzFCLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxXQUFSLENBQWIsRUFBa0M7QUFBQ3dCLE9BQUt2QixDQUFMLEVBQU87QUFBQ3VCLFdBQUt2QixDQUFMO0FBQU87O0FBQWhCLENBQWxDLEVBQW9ELENBQXBEOztBQU96SCxNQUFNc0IsV0FBWU0sT0FBRCxJQUFhO0FBQ3BDO0FBQ0FBLFlBQVVMLEtBQUtLLE9BQUwsQ0FBVixDQUZvQyxDQUlwQzs7QUFDQUEsWUFBVTJFLFNBQVMzRSxPQUFULENBQVYsQ0FMb0MsQ0FPcEM7O0FBQ0FBLFVBQVFDLElBQVIsR0FBZUQsUUFBUUMsSUFBUixDQUFhWSxPQUFiLENBQXFCLE1BQXJCLEVBQTZCLE1BQTdCLENBQWY7QUFFQSxTQUFPYixPQUFQO0FBQ0EsQ0FYTSxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X21hcmtkb3duLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fUGFyc2VyJywgJ29yaWdpbmFsJywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdHZhbHVlczogW3tcblx0XHRcdGtleTogJ2Rpc2FibGVkJyxcblx0XHRcdGkxOG5MYWJlbDogJ0Rpc2FibGVkJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ29yaWdpbmFsJyxcblx0XHRcdGkxOG5MYWJlbDogJ09yaWdpbmFsJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ21hcmtlZCcsXG5cdFx0XHRpMThuTGFiZWw6ICdNYXJrZWQnXG5cdFx0fV0sXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZVxuXHR9KTtcblxuXHRjb25zdCBlbmFibGVRdWVyeU9yaWdpbmFsID0ge19pZDogJ01hcmtkb3duX1BhcnNlcicsIHZhbHVlOiAnb3JpZ2luYWwnfTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01hcmtkb3duX0hlYWRlcnMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdHNlY3Rpb246ICdNYXJrZG93bicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGVuYWJsZVF1ZXJ5OiBlbmFibGVRdWVyeU9yaWdpbmFsXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fU3VwcG9ydFNjaGVtZXNGb3JMaW5rJywgJ2h0dHAsaHR0cHMnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuRGVzY3JpcHRpb246ICdNYXJrZG93bl9TdXBwb3J0U2NoZW1lc0ZvckxpbmtfRGVzY3JpcHRpb24nLFxuXHRcdGVuYWJsZVF1ZXJ5OiBlbmFibGVRdWVyeU9yaWdpbmFsXG5cdH0pO1xuXG5cdGNvbnN0IGVuYWJsZVF1ZXJ5TWFya2VkID0ge19pZDogJ01hcmtkb3duX1BhcnNlcicsIHZhbHVlOiAnbWFya2VkJ307XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9NYXJrZWRfR0ZNJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdHNlY3Rpb246ICdNYXJrZG93bicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGVuYWJsZVF1ZXJ5OiBlbmFibGVRdWVyeU1hcmtlZFxuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01hcmtkb3duX01hcmtlZF9UYWJsZXMnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTWVzc2FnZScsXG5cdFx0c2VjdGlvbjogJ01hcmtkb3duJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0ZW5hYmxlUXVlcnk6IGVuYWJsZVF1ZXJ5TWFya2VkXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fTWFya2VkX0JyZWFrcycsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRlbmFibGVRdWVyeTogZW5hYmxlUXVlcnlNYXJrZWRcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9NYXJrZWRfUGVkYW50aWMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdHNlY3Rpb246ICdNYXJrZG93bicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGVuYWJsZVF1ZXJ5OiBbe1xuXHRcdFx0X2lkOiAnTWFya2Rvd25fUGFyc2VyJyxcblx0XHRcdHZhbHVlOiAnbWFya2VkJ1xuXHRcdH0sIHtcblx0XHRcdF9pZDogJ01hcmtkb3duX01hcmtlZF9HRk0nLFxuXHRcdFx0dmFsdWU6IGZhbHNlXG5cdFx0fV1cblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9NYXJrZWRfU21hcnRMaXN0cycsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRlbmFibGVRdWVyeTogZW5hYmxlUXVlcnlNYXJrZWRcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9NYXJrZWRfU21hcnR5cGFudHMnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTWVzc2FnZScsXG5cdFx0c2VjdGlvbjogJ01hcmtkb3duJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0ZW5hYmxlUXVlcnk6IGVuYWJsZVF1ZXJ5TWFya2VkXG5cdH0pO1xufSk7XG4iLCIvKlxuICogTWFya2Rvd24gaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcGFyc2UgbWFya2Rvd24gc3ludGF4XG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuICovXG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEJsYXplIH0gZnJvbSAnbWV0ZW9yL2JsYXplJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBtYXJrZWQgfSBmcm9tICcuL3BhcnNlci9tYXJrZWQvbWFya2VkLmpzJztcbmltcG9ydCB7IG9yaWdpbmFsIH0gZnJvbSAnLi9wYXJzZXIvb3JpZ2luYWwvb3JpZ2luYWwuanMnO1xuXG5pbXBvcnQgeyBjb2RlIH0gZnJvbSAnLi9wYXJzZXIvb3JpZ2luYWwvY29kZS5qcyc7XG5cbmNvbnN0IHBhcnNlcnMgPSB7XG5cdG9yaWdpbmFsLFxuXHRtYXJrZWRcbn07XG5cbmNsYXNzIE1hcmtkb3duQ2xhc3Mge1xuXHRwYXJzZSh0ZXh0KSB7XG5cdFx0Y29uc3QgbWVzc2FnZSA9IHtcblx0XHRcdGh0bWw6IHMuZXNjYXBlSFRNTCh0ZXh0KVxuXHRcdH07XG5cdFx0cmV0dXJuIHRoaXMubW91bnRUb2tlbnNCYWNrKHRoaXMucGFyc2VNZXNzYWdlTm90RXNjYXBlZChtZXNzYWdlKSkuaHRtbDtcblx0fVxuXG5cdHBhcnNlTm90RXNjYXBlZCh0ZXh0KSB7XG5cdFx0Y29uc3QgbWVzc2FnZSA9IHtcblx0XHRcdGh0bWw6IHRleHRcblx0XHR9O1xuXHRcdHJldHVybiB0aGlzLm1vdW50VG9rZW5zQmFjayh0aGlzLnBhcnNlTWVzc2FnZU5vdEVzY2FwZWQobWVzc2FnZSkpLmh0bWw7XG5cdH1cblxuXHRwYXJzZU1lc3NhZ2VOb3RFc2NhcGVkKG1lc3NhZ2UpIHtcblx0XHRjb25zdCBwYXJzZXIgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWFya2Rvd25fUGFyc2VyJyk7XG5cblx0XHRpZiAocGFyc2VyID09PSAnZGlzYWJsZWQnKSB7XG5cdFx0XHRyZXR1cm4gbWVzc2FnZTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHBhcnNlcnNbcGFyc2VyXSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0cmV0dXJuIHBhcnNlcnNbcGFyc2VyXShtZXNzYWdlKTtcblx0XHR9XG5cdFx0cmV0dXJuIHBhcnNlcnNbJ29yaWdpbmFsJ10obWVzc2FnZSk7XG5cdH1cblxuXHRtb3VudFRva2Vuc0JhY2sobWVzc2FnZSwgdXNlSHRtbCA9IHRydWUpIHtcblx0XHRpZiAobWVzc2FnZS50b2tlbnMgJiYgbWVzc2FnZS50b2tlbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yIChjb25zdCB7dG9rZW4sIHRleHQsIG5vSHRtbH0gb2YgbWVzc2FnZS50b2tlbnMpIHtcblx0XHRcdFx0bWVzc2FnZS5odG1sID0gbWVzc2FnZS5odG1sLnJlcGxhY2UodG9rZW4sICgpID0+IHVzZUh0bWwgPyB0ZXh0IDogbm9IdG1sKTsgLy8gVXNlcyBsYW1iZGEgc28gZG9lc24ndCBuZWVkIHRvIGVzY2FwZSAkXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRjb2RlKC4uLmFyZ3MpIHtcblx0XHRyZXR1cm4gY29kZSguLi5hcmdzKTtcblx0fVxufVxuXG5jb25zdCBNYXJrZG93biA9IG5ldyBNYXJrZG93bkNsYXNzO1xuUm9ja2V0Q2hhdC5NYXJrZG93biA9IE1hcmtkb3duO1xuXG4vLyByZW5kZXJNZXNzYWdlIGFscmVhZHkgZGlkIGh0bWwgZXNjYXBlXG5jb25zdCBNYXJrZG93bk1lc3NhZ2UgPSAobWVzc2FnZSkgPT4ge1xuXHRpZiAocy50cmltKG1lc3NhZ2UgIT0gbnVsbCA/IG1lc3NhZ2UuaHRtbCA6IHVuZGVmaW5lZCkpIHtcblx0XHRtZXNzYWdlID0gTWFya2Rvd24ucGFyc2VNZXNzYWdlTm90RXNjYXBlZChtZXNzYWdlKTtcblx0fVxuXG5cdHJldHVybiBtZXNzYWdlO1xufTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdyZW5kZXJNZXNzYWdlJywgTWFya2Rvd25NZXNzYWdlLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5ISUdILCAnbWFya2Rvd24nKTtcblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuXHRCbGF6ZS5yZWdpc3RlckhlbHBlcignUm9ja2V0Q2hhdE1hcmtkb3duJywgdGV4dCA9PiBNYXJrZG93bi5wYXJzZSh0ZXh0KSk7XG5cdEJsYXplLnJlZ2lzdGVySGVscGVyKCdSb2NrZXRDaGF0TWFya2Rvd25VbmVzY2FwZScsIHRleHQgPT4gTWFya2Rvd24ucGFyc2VOb3RFc2NhcGVkKHRleHQpKTtcbn1cbiIsImltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnbWV0ZW9yL3JhbmRvbSc7XG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcbmltcG9ydCBobGpzIGZyb20gJ2hpZ2hsaWdodC5qcyc7XG5pbXBvcnQgX21hcmtlZCBmcm9tICdtYXJrZWQnO1xuXG5jb25zdCByZW5kZXJlciA9IG5ldyBfbWFya2VkLlJlbmRlcmVyKCk7XG5cbmxldCBtc2cgPSBudWxsO1xuXG5yZW5kZXJlci5jb2RlID0gZnVuY3Rpb24oY29kZSwgbGFuZywgZXNjYXBlZCkge1xuXHRpZiAodGhpcy5vcHRpb25zLmhpZ2hsaWdodCkge1xuXHRcdGNvbnN0IG91dCA9IHRoaXMub3B0aW9ucy5oaWdobGlnaHQoY29kZSwgbGFuZyk7XG5cdFx0aWYgKG91dCAhPSBudWxsICYmIG91dCAhPT0gY29kZSkge1xuXHRcdFx0ZXNjYXBlZCA9IHRydWU7XG5cdFx0XHRjb2RlID0gb3V0O1xuXHRcdH1cblx0fVxuXG5cdGxldCB0ZXh0ID0gbnVsbDtcblxuXHRpZiAoIWxhbmcpIHtcblx0XHR0ZXh0ID0gYDxwcmU+PGNvZGUgY2xhc3M9XCJjb2RlLWNvbG9ycyBobGpzXCI+JHsgKGVzY2FwZWQgPyBjb2RlIDogcy5lc2NhcGVIVE1MKGNvZGUsIHRydWUpKSB9PC9jb2RlPjwvcHJlPmA7XG5cdH0gZWxzZSB7XG5cdFx0dGV4dCA9IGA8cHJlPjxjb2RlIGNsYXNzPVwiY29kZS1jb2xvcnMgaGxqcyAkeyBlc2NhcGUobGFuZywgdHJ1ZSkgfVwiPiR7IChlc2NhcGVkID8gY29kZSA6IHMuZXNjYXBlSFRNTChjb2RlLCB0cnVlKSkgfTwvY29kZT48L3ByZT5gO1xuXHR9XG5cblx0aWYgKF8uaXNTdHJpbmcobXNnKSkge1xuXHRcdHJldHVybiB0ZXh0O1xuXHR9XG5cblx0Y29uc3QgdG9rZW4gPSBgPSE9JHsgUmFuZG9tLmlkKCkgfT0hPWA7XG5cdG1zZy50b2tlbnMucHVzaCh7XG5cdFx0aGlnaGxpZ2h0OiB0cnVlLFxuXHRcdHRva2VuLFxuXHRcdHRleHRcblx0fSk7XG5cblx0cmV0dXJuIHRva2VuO1xufTtcblxucmVuZGVyZXIuY29kZXNwYW4gPSBmdW5jdGlvbih0ZXh0KSB7XG5cdHRleHQgPSBgPGNvZGUgY2xhc3M9XCJjb2RlLWNvbG9ycyBpbmxpbmVcIj4keyB0ZXh0IH08L2NvZGU+YDtcblx0aWYgKF8uaXNTdHJpbmcobXNnKSkge1xuXHRcdHJldHVybiB0ZXh0O1xuXHR9XG5cblx0Y29uc3QgdG9rZW4gPSBgPSE9JHsgUmFuZG9tLmlkKCkgfT0hPWA7XG5cdG1zZy50b2tlbnMucHVzaCh7XG5cdFx0dG9rZW4sXG5cdFx0dGV4dFxuXHR9KTtcblxuXHRyZXR1cm4gdG9rZW47XG59O1xuXG5yZW5kZXJlci5ibG9ja3F1b3RlID0gZnVuY3Rpb24ocXVvdGUpIHtcblx0cmV0dXJuIGA8YmxvY2txdW90ZSBjbGFzcz1cImJhY2tncm91bmQtdHJhbnNwYXJlbnQtZGFya2VyLWJlZm9yZVwiPiR7IHF1b3RlIH08L2Jsb2NrcXVvdGU+YDtcbn07XG5cbmNvbnN0IGhpZ2hsaWdodCA9IGZ1bmN0aW9uKGNvZGUsIGxhbmcpIHtcblx0aWYgKCFsYW5nKSB7XG5cdFx0cmV0dXJuIGNvZGU7XG5cdH1cblx0dHJ5IHtcblx0XHRyZXR1cm4gaGxqcy5oaWdobGlnaHQobGFuZywgY29kZSkudmFsdWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBVbmtub3duIGxhbmd1YWdlXG5cdFx0cmV0dXJuIGNvZGU7XG5cdH1cbn07XG5cbmxldCBnZm0gPSBudWxsO1xubGV0IHRhYmxlcyA9IG51bGw7XG5sZXQgYnJlYWtzID0gbnVsbDtcbmxldCBwZWRhbnRpYyA9IG51bGw7XG5sZXQgc21hcnRMaXN0cyA9IG51bGw7XG5sZXQgc21hcnR5cGFudHMgPSBudWxsO1xuXG5leHBvcnQgY29uc3QgbWFya2VkID0gKG1lc3NhZ2UpID0+IHtcblx0bXNnID0gbWVzc2FnZTtcblxuXHRpZiAoIW1zZy50b2tlbnMpIHtcblx0XHRtc2cudG9rZW5zID0gW107XG5cdH1cblxuXHRpZiAoZ2ZtID09IG51bGwpIHsgZ2ZtID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX01hcmtlZF9HRk0nKTsgfVxuXHRpZiAodGFibGVzID09IG51bGwpIHsgdGFibGVzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX01hcmtlZF9UYWJsZXMnKTsgfVxuXHRpZiAoYnJlYWtzID09IG51bGwpIHsgYnJlYWtzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX01hcmtlZF9CcmVha3MnKTsgfVxuXHRpZiAocGVkYW50aWMgPT0gbnVsbCkgeyBwZWRhbnRpYyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNYXJrZG93bl9NYXJrZWRfUGVkYW50aWMnKTsgfVxuXHRpZiAoc21hcnRMaXN0cyA9PSBudWxsKSB7IHNtYXJ0TGlzdHMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWFya2Rvd25fTWFya2VkX1NtYXJ0TGlzdHMnKTsgfVxuXHRpZiAoc21hcnR5cGFudHMgPT0gbnVsbCkgeyBzbWFydHlwYW50cyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNYXJrZG93bl9NYXJrZWRfU21hcnR5cGFudHMnKTsgfVxuXG5cdG1zZy5odG1sID0gX21hcmtlZChzLnVuZXNjYXBlSFRNTChtc2cuaHRtbCksIHtcblx0XHRnZm0sXG5cdFx0dGFibGVzLFxuXHRcdGJyZWFrcyxcblx0XHRwZWRhbnRpYyxcblx0XHRzbWFydExpc3RzLFxuXHRcdHNtYXJ0eXBhbnRzLFxuXHRcdHJlbmRlcmVyLFxuXHRcdHNhbml0aXplOiB0cnVlLFxuXHRcdGhpZ2hsaWdodFxuXHR9KTtcblxuXHRyZXR1cm4gbXNnO1xufTtcbiIsIi8qXG4gKiBjb2RlKCkgaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcGFyc2UgYGlubGluZSBjb2RlYCBhbmQgYGBgY29kZWJsb2NrYGBgIHN5bnRheGVzXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuICovXG5pbXBvcnQgeyBSYW5kb20gfSBmcm9tICdtZXRlb3IvcmFuZG9tJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcbmltcG9ydCBobGpzIGZyb20gJ2hpZ2hsaWdodC5qcyc7XG5cbmNvbnN0IGlubGluZWNvZGUgPSAobWVzc2FnZSkgPT4ge1xuXHQvLyBTdXBwb3J0IGB0ZXh0YFxuXHRyZXR1cm4gbWVzc2FnZS5odG1sID0gbWVzc2FnZS5odG1sLnJlcGxhY2UoLyhefCZndDt8WyA+Xyp+XSlcXGAoW15gXFxyXFxuXSspXFxgKFs8Xyp+XXxcXEJ8XFxifCQpL2dtLCAobWF0Y2gsIHAxLCBwMiwgcDMpID0+IHtcblx0XHRjb25zdCB0b2tlbiA9IGAgPSE9JHsgUmFuZG9tLmlkKCkgfT0hPWA7XG5cblx0XHRtZXNzYWdlLnRva2Vucy5wdXNoKHtcblx0XHRcdHRva2VuLFxuXHRcdFx0dGV4dDogYCR7IHAxIH08c3BhbiBjbGFzcz1cXFwiY29weW9ubHlcXFwiPlxcYDwvc3Bhbj48c3Bhbj48Y29kZSBjbGFzcz1cXFwiY29kZS1jb2xvcnMgaW5saW5lXFxcIj4keyBwMiB9PC9jb2RlPjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiY29weW9ubHlcXFwiPlxcYDwvc3Bhbj4keyBwMyB9YCxcblx0XHRcdG5vSHRtbDogbWF0Y2hcblx0XHR9KTtcblxuXHRcdHJldHVybiB0b2tlbjtcblx0fSk7XG59O1xuXG5jb25zdCBjb2RlYmxvY2tzID0gKG1lc3NhZ2UpID0+IHtcblx0Ly8gQ291bnQgb2NjdXJlbmNpZXMgb2YgYGBgXG5cdGNvbnN0IGNvdW50ID0gKG1lc3NhZ2UuaHRtbC5tYXRjaCgvYGBgL2cpIHx8IFtdKS5sZW5ndGg7XG5cblx0aWYgKGNvdW50KSB7XG5cblx0XHQvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIGFkZCBhIGZpbmFsIGBgYFxuXHRcdGlmICgoY291bnQgJSAyKSA+IDApIHtcblx0XHRcdG1lc3NhZ2UuaHRtbCA9IGAkeyBtZXNzYWdlLmh0bWwgfVxcblxcYFxcYFxcYGA7XG5cdFx0XHRtZXNzYWdlLm1zZyA9IGAkeyBtZXNzYWdlLm1zZyB9XFxuXFxgXFxgXFxgYDtcblx0XHR9XG5cblx0XHQvLyBTZXBhcmF0ZSB0ZXh0IGluIGNvZGUgYmxvY2tzIGFuZCBub24gY29kZSBibG9ja3Ncblx0XHRjb25zdCBtc2dQYXJ0cyA9IG1lc3NhZ2UuaHRtbC5zcGxpdCgvKF4uKikoYGBgKD86W2EtekEtWl0rKT8oPzooPzoufFxccnxcXG4pKj8pYGBgKSguKlxcbj8pJC9nbSk7XG5cblx0XHRmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbXNnUGFydHMubGVuZ3RoOyBpbmRleCsrKSB7XG5cdFx0XHQvLyBWZXJpZnkgaWYgdGhpcyBwYXJ0IGlzIGNvZGVcblx0XHRcdGNvbnN0IHBhcnQgPSBtc2dQYXJ0c1tpbmRleF07XG5cdFx0XHRjb25zdCBjb2RlTWF0Y2ggPSBwYXJ0Lm1hdGNoKC9eYGBgW1xcclxcbl0qKC4qW1xcclxcblxcIF0/KVtcXHJcXG5dKihbXFxzXFxTXSo/KWBgYCs/JC8pO1xuXG5cdFx0XHRpZiAoY29kZU1hdGNoICE9IG51bGwpIHtcblx0XHRcdFx0Ly8gUHJvY2VzcyBoaWdobGlnaHQgaWYgdGhpcyBwYXJ0IGlzIGNvZGVcblx0XHRcdFx0Y29uc3Qgc2luZ2xlTGluZSA9IGNvZGVNYXRjaFswXS5pbmRleE9mKCdcXG4nKSA9PT0gLTE7XG5cdFx0XHRcdGNvbnN0IGxhbmcgPSAhc2luZ2xlTGluZSAmJiBBcnJheS5mcm9tKGhsanMubGlzdExhbmd1YWdlcygpKS5pbmNsdWRlcyhzLnRyaW0oY29kZU1hdGNoWzFdKSkgPyBzLnRyaW0oY29kZU1hdGNoWzFdKSA6ICcnO1xuXHRcdFx0XHRjb25zdCBjb2RlID1cblx0XHRcdFx0XHRzaW5nbGVMaW5lID9cblx0XHRcdFx0XHRcdHMudW5lc2NhcGVIVE1MKGNvZGVNYXRjaFsxXSkgOlxuXHRcdFx0XHRcdFx0bGFuZyA9PT0gJycgP1xuXHRcdFx0XHRcdFx0XHRzLnVuZXNjYXBlSFRNTChjb2RlTWF0Y2hbMV0gKyBjb2RlTWF0Y2hbMl0pIDpcblx0XHRcdFx0XHRcdFx0cy51bmVzY2FwZUhUTUwoY29kZU1hdGNoWzJdKTtcblxuXHRcdFx0XHRjb25zdCByZXN1bHQgPSBsYW5nID09PSAnJyA/IGhsanMuaGlnaGxpZ2h0QXV0bygobGFuZyArIGNvZGUpKSA6IGhsanMuaGlnaGxpZ2h0KGxhbmcsIGNvZGUpO1xuXHRcdFx0XHRjb25zdCB0b2tlbiA9IGA9IT0keyBSYW5kb20uaWQoKSB9PSE9YDtcblxuXHRcdFx0XHRtZXNzYWdlLnRva2Vucy5wdXNoKHtcblx0XHRcdFx0XHRoaWdobGlnaHQ6IHRydWUsXG5cdFx0XHRcdFx0dG9rZW4sXG5cdFx0XHRcdFx0dGV4dDogYDxwcmU+PGNvZGUgY2xhc3M9J2NvZGUtY29sb3JzIGhsanMgJHsgcmVzdWx0Lmxhbmd1YWdlIH0nPjxzcGFuIGNsYXNzPSdjb3B5b25seSc+XFxgXFxgXFxgPGJyPjwvc3Bhbj4keyByZXN1bHQudmFsdWUgfTxzcGFuIGNsYXNzPSdjb3B5b25seSc+PGJyPlxcYFxcYFxcYDwvc3Bhbj48L2NvZGU+PC9wcmU+YCxcblx0XHRcdFx0XHRub0h0bWw6IGNvZGVNYXRjaFswXVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRtc2dQYXJ0c1tpbmRleF0gPSB0b2tlbjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1zZ1BhcnRzW2luZGV4XSA9IHBhcnQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gUmUtbW91bnQgbWVzc2FnZVxuXHRcdHJldHVybiBtZXNzYWdlLmh0bWwgPSBtc2dQYXJ0cy5qb2luKCcnKTtcblx0fVxufTtcblxuZXhwb3J0IGNvbnN0IGNvZGUgPSAobWVzc2FnZSkgPT4ge1xuXHRpZiAocy50cmltKG1lc3NhZ2UuaHRtbCkpIHtcblx0XHRpZiAobWVzc2FnZS50b2tlbnMgPT0gbnVsbCkge1xuXHRcdFx0bWVzc2FnZS50b2tlbnMgPSBbXTtcblx0XHR9XG5cblx0XHRjb2RlYmxvY2tzKG1lc3NhZ2UpO1xuXHRcdGlubGluZWNvZGUobWVzc2FnZSk7XG5cdH1cblxuXHRyZXR1cm4gbWVzc2FnZTtcbn07XG4iLCIvKlxuICogTWFya2Rvd24gaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcGFyc2UgbWFya2Rvd24gc3ludGF4XG4gKiBAcGFyYW0ge1N0cmluZ30gbXNnIC0gVGhlIG1lc3NhZ2UgaHRtbFxuICovXG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nO1xuaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cbmNvbnN0IHBhcnNlTm90RXNjYXBlZCA9IGZ1bmN0aW9uKG1zZywgbWVzc2FnZSkge1xuXHRpZiAobWVzc2FnZSAmJiBtZXNzYWdlLnRva2VucyA9PSBudWxsKSB7XG5cdFx0bWVzc2FnZS50b2tlbnMgPSBbXTtcblx0fVxuXG5cdGNvbnN0IGFkZEFzVG9rZW4gPSBmdW5jdGlvbihodG1sKSB7XG5cdFx0Y29uc3QgdG9rZW4gPSBgPSE9JHsgUmFuZG9tLmlkKCkgfT0hPWA7XG5cdFx0bWVzc2FnZS50b2tlbnMucHVzaCh7XG5cdFx0XHR0b2tlbixcblx0XHRcdHRleHQ6IGh0bWxcblx0XHR9KTtcblxuXHRcdHJldHVybiB0b2tlbjtcblx0fTtcblxuXHRjb25zdCBzY2hlbWVzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX1N1cHBvcnRTY2hlbWVzRm9yTGluaycpLnNwbGl0KCcsJykuam9pbignfCcpO1xuXG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWFya2Rvd25fSGVhZGVycycpKSB7XG5cdFx0Ly8gU3VwcG9ydCAjIFRleHQgZm9yIGgxXG5cdFx0bXNnID0gbXNnLnJlcGxhY2UoL14jICgoW1xcU1xcd1xcZC1fXFwvXFwqXFwuLFxcXFxdWyBcXHUwMGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwLVxcdTIwMGFcXHUyMDI4XFx1MjAyOVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdWZlZmZdPykrKS9nbSwgJzxoMT4kMTwvaDE+Jyk7XG5cblx0XHQvLyBTdXBwb3J0ICMgVGV4dCBmb3IgaDJcblx0XHRtc2cgPSBtc2cucmVwbGFjZSgvXiMjICgoW1xcU1xcd1xcZC1fXFwvXFwqXFwuLFxcXFxdWyBcXHUwMGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwLVxcdTIwMGFcXHUyMDI4XFx1MjAyOVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdWZlZmZdPykrKS9nbSwgJzxoMj4kMTwvaDI+Jyk7XG5cblx0XHQvLyBTdXBwb3J0ICMgVGV4dCBmb3IgaDNcblx0XHRtc2cgPSBtc2cucmVwbGFjZSgvXiMjIyAoKFtcXFNcXHdcXGQtX1xcL1xcKlxcLixcXFxcXVsgXFx1MDBhMFxcdTE2ODBcXHUxODBlXFx1MjAwMC1cXHUyMDBhXFx1MjAyOFxcdTIwMjlcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXT8pKykvZ20sICc8aDM+JDE8L2gzPicpO1xuXG5cdFx0Ly8gU3VwcG9ydCAjIFRleHQgZm9yIGg0XG5cdFx0bXNnID0gbXNnLnJlcGxhY2UoL14jIyMjICgoW1xcU1xcd1xcZC1fXFwvXFwqXFwuLFxcXFxdWyBcXHUwMGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwLVxcdTIwMGFcXHUyMDI4XFx1MjAyOVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdWZlZmZdPykrKS9nbSwgJzxoND4kMTwvaDQ+Jyk7XG5cdH1cblxuXHQvLyBTdXBwb3J0ICp0ZXh0KiB0byBtYWtlIGJvbGRcblx0bXNnID0gbXNnLnJlcGxhY2UoLyhefCZndDt8WyA+X35gXSlcXCp7MSwyfShbXlxcKlxcclxcbl0rKVxcKnsxLDJ9KFs8X35gXXxcXEJ8XFxifCQpL2dtLCAnJDE8c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+Kjwvc3Bhbj48c3Ryb25nPiQyPC9zdHJvbmc+PHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPio8L3NwYW4+JDMnKTtcblxuXHQvLyBTdXBwb3J0IF90ZXh0XyB0byBtYWtlIGl0YWxpY3Ncblx0bXNnID0gbXNnLnJlcGxhY2UoLyhefCZndDt8WyA+Kn5gXSlcXF97MSwyfShbXlxcX1xcclxcbl0rKVxcX3sxLDJ9KFs8Kn5gXXxcXEJ8XFxifCQpL2dtLCAnJDE8c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+Xzwvc3Bhbj48ZW0+JDI8L2VtPjxzcGFuIGNsYXNzPVwiY29weW9ubHlcIj5fPC9zcGFuPiQzJyk7XG5cblx0Ly8gU3VwcG9ydCB+dGV4dH4gdG8gc3RyaWtlIHRocm91Z2ggdGV4dFxuXHRtc2cgPSBtc2cucmVwbGFjZSgvKF58Jmd0O3xbID5fKmBdKVxcfnsxLDJ9KFteflxcclxcbl0rKVxcfnsxLDJ9KFs8XypgXXxcXEJ8XFxifCQpL2dtLCAnJDE8c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+fjwvc3Bhbj48c3RyaWtlPiQyPC9zdHJpa2U+PHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPn48L3NwYW4+JDMnKTtcblxuXHQvLyBTdXBwb3J0IGZvciBibG9jayBxdW90ZVxuXHQvLyA+Pj5cblx0Ly8gVGV4dFxuXHQvLyA8PDxcblx0bXNnID0gbXNnLnJlcGxhY2UoLyg/OiZndDspezN9XFxuKyhbXFxzXFxTXSo/KVxcbisoPzombHQ7KXszfS9nLCAnPGJsb2NrcXVvdGUgY2xhc3M9XCJiYWNrZ3JvdW5kLXRyYW5zcGFyZW50LWRhcmtlci1iZWZvcmVcIj48c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+Jmd0OyZndDsmZ3Q7PC9zcGFuPiQxPHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPiZsdDsmbHQ7Jmx0Ozwvc3Bhbj48L2Jsb2NrcXVvdGU+Jyk7XG5cblx0Ly8gU3VwcG9ydCA+VGV4dCBmb3IgcXVvdGVcblx0bXNnID0gbXNnLnJlcGxhY2UoL14mZ3Q7KC4qKSQvZ20sICc8YmxvY2txdW90ZSBjbGFzcz1cImJhY2tncm91bmQtdHJhbnNwYXJlbnQtZGFya2VyLWJlZm9yZVwiPjxzcGFuIGNsYXNzPVwiY29weW9ubHlcIj4mZ3Q7PC9zcGFuPiQxPC9ibG9ja3F1b3RlPicpO1xuXG5cdC8vIFJlbW92ZSB3aGl0ZS1zcGFjZSBhcm91bmQgYmxvY2txdW90ZSAocHJldmVudCA8YnI+KS4gQmVjYXVzZSBibG9ja3F1b3RlIGlzIGJsb2NrIGVsZW1lbnQuXG5cdG1zZyA9IG1zZy5yZXBsYWNlKC9cXHMqPGJsb2NrcXVvdGUgY2xhc3M9XCJiYWNrZ3JvdW5kLXRyYW5zcGFyZW50LWRhcmtlci1iZWZvcmVcIj4vZ20sICc8YmxvY2txdW90ZSBjbGFzcz1cImJhY2tncm91bmQtdHJhbnNwYXJlbnQtZGFya2VyLWJlZm9yZVwiPicpO1xuXHRtc2cgPSBtc2cucmVwbGFjZSgvPFxcL2Jsb2NrcXVvdGU+XFxzKi9nbSwgJzwvYmxvY2txdW90ZT4nKTtcblxuXHQvLyBSZW1vdmUgbmV3LWxpbmUgYmV0d2VlbiBibG9ja3F1b3Rlcy5cblx0bXNnID0gbXNnLnJlcGxhY2UoLzxcXC9ibG9ja3F1b3RlPlxcbjxibG9ja3F1b3RlL2dtLCAnPC9ibG9ja3F1b3RlPjxibG9ja3F1b3RlJyk7XG5cblx0Ly8gU3VwcG9ydCAhW2FsdCB0ZXh0XShodHRwOi8vaW1hZ2UgdXJsKVxuXHRtc2cgPSBtc2cucmVwbGFjZShuZXcgUmVnRXhwKGAhXFxcXFsoW15cXFxcXV0rKVxcXFxdXFxcXCgoKD86JHsgc2NoZW1lcyB9KTpcXFxcL1xcXFwvW15cXFxcKV0rKVxcXFwpYCwgJ2dtJyksIChtYXRjaCwgdGl0bGUsIHVybCkgPT4ge1xuXHRcdGNvbnN0IHRhcmdldCA9IHVybC5pbmRleE9mKE1ldGVvci5hYnNvbHV0ZVVybCgpKSA9PT0gMCA/ICcnIDogJ19ibGFuayc7XG5cdFx0cmV0dXJuIGFkZEFzVG9rZW4oYDxhIGhyZWY9XCIkeyBzLmVzY2FwZUhUTUwodXJsKSB9XCIgdGl0bGU9XCIkeyBzLmVzY2FwZUhUTUwodGl0bGUpIH1cIiB0YXJnZXQ9XCIkeyBzLmVzY2FwZUhUTUwodGFyZ2V0KSB9XCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPjxkaXYgY2xhc3M9XCJpbmxpbmUtaW1hZ2VcIiBzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6IHVybCgkeyBzLmVzY2FwZUhUTUwodXJsKSB9KTtcIj48L2Rpdj48L2E+YCk7XG5cdH0pO1xuXG5cdC8vIFN1cHBvcnQgW1RleHRdKGh0dHA6Ly9saW5rKVxuXHRtc2cgPSBtc2cucmVwbGFjZShuZXcgUmVnRXhwKGBcXFxcWyhbXlxcXFxdXSspXFxcXF1cXFxcKCgoPzokeyBzY2hlbWVzIH0pOlxcXFwvXFxcXC9bXlxcXFwpXSspXFxcXClgLCAnZ20nKSwgKG1hdGNoLCB0aXRsZSwgdXJsKSA9PiB7XG5cdFx0Y29uc3QgdGFyZ2V0ID0gdXJsLmluZGV4T2YoTWV0ZW9yLmFic29sdXRlVXJsKCkpID09PSAwID8gJycgOiAnX2JsYW5rJztcblx0XHRyZXR1cm4gYWRkQXNUb2tlbihgPGEgaHJlZj1cIiR7IHMuZXNjYXBlSFRNTCh1cmwpIH1cIiB0YXJnZXQ9XCIkeyBzLmVzY2FwZUhUTUwodGFyZ2V0KSB9XCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPiR7IHMuZXNjYXBlSFRNTCh0aXRsZSkgfTwvYT5gKTtcblx0fSk7XG5cblx0Ly8gU3VwcG9ydCA8aHR0cDovL2xpbmt8VGV4dD5cblx0bXNnID0gbXNnLnJlcGxhY2UobmV3IFJlZ0V4cChgKD86PHwmbHQ7KSgoPzokeyBzY2hlbWVzIH0pOlxcXFwvXFxcXC9bXlxcXFx8XSspXFxcXHwoLis/KSg/PT58Jmd0OykoPzo+fCZndDspYCwgJ2dtJyksIChtYXRjaCwgdXJsLCB0aXRsZSkgPT4ge1xuXHRcdGNvbnN0IHRhcmdldCA9IHVybC5pbmRleE9mKE1ldGVvci5hYnNvbHV0ZVVybCgpKSA9PT0gMCA/ICcnIDogJ19ibGFuayc7XG5cdFx0cmV0dXJuIGFkZEFzVG9rZW4oYDxhIGhyZWY9XCIkeyBzLmVzY2FwZUhUTUwodXJsKSB9XCIgdGFyZ2V0PVwiJHsgcy5lc2NhcGVIVE1MKHRhcmdldCkgfVwiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj4keyBzLmVzY2FwZUhUTUwodGl0bGUpIH08L2E+YCk7XG5cdH0pO1xuXG5cdHJldHVybiBtc2c7XG59O1xuXG5leHBvcnQgY29uc3QgbWFya2Rvd24gPSBmdW5jdGlvbihtZXNzYWdlKSB7XG5cdG1lc3NhZ2UuaHRtbCA9IHBhcnNlTm90RXNjYXBlZChtZXNzYWdlLmh0bWwsIG1lc3NhZ2UpO1xuXHRyZXR1cm4gbWVzc2FnZTtcbn07XG4iLCIvKlxuICogTWFya2Rvd24gaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcGFyc2UgbWFya2Rvd24gc3ludGF4XG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuICovXG5pbXBvcnQgeyBtYXJrZG93biB9IGZyb20gJy4vbWFya2Rvd24uanMnO1xuaW1wb3J0IHsgY29kZSB9IGZyb20gJy4vY29kZS5qcyc7XG5cbmV4cG9ydCBjb25zdCBvcmlnaW5hbCA9IChtZXNzYWdlKSA9PiB7XG5cdC8vIFBhcnNlIG1hcmtkb3duIGNvZGVcblx0bWVzc2FnZSA9IGNvZGUobWVzc2FnZSk7XG5cblx0Ly8gUGFyc2UgbWFya2Rvd25cblx0bWVzc2FnZSA9IG1hcmtkb3duKG1lc3NhZ2UpO1xuXG5cdC8vIFJlcGxhY2UgbGluZWJyZWFrIHRvIGJyXG5cdG1lc3NhZ2UuaHRtbCA9IG1lc3NhZ2UuaHRtbC5yZXBsYWNlKC9cXG4vZ20sICc8YnI+Jyk7XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG59O1xuIl19
