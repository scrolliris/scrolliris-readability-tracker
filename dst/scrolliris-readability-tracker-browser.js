(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _client = require('./component/client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tracker = function (Client) {
  return {
    Client: Client
  };
}(_client2.default);

(function (t) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = t;
  }
  if (typeof window !== 'undefined') {
    window.ScrollirisReadabilityTracker = t;
  }
})(tracker);

},{"./component/client":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _clock = require('./clock');

var _clock2 = _interopRequireDefault(_clock);

var _counter = require('./counter');

var _counter2 = _interopRequireDefault(_counter);

var _timer = require('./timer');

var _timer2 = _interopRequireDefault(_timer);

var _recorder = require('./recorder');

var _recorder2 = _interopRequireDefault(_recorder);

var _privacy = require('./privacy');

var _privacy2 = _interopRequireDefault(_privacy);

var _base = require('../util/base64');

var _base2 = _interopRequireDefault(_base);

var _fibonacci = require('../util/fibonacci');

var _fibonacci2 = _interopRequireDefault(_fibonacci);

var _uuid = require('../util/uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _requestWorker = require('../util/request-worker');

var _requestWorker2 = _interopRequireDefault(_requestWorker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Client = function () {
  function Client() {
    var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Client);

    this.apiKey = settings.apiKey;

    // NOTE: change these lines, carefully.
    // (in production, default token would be replaced using regxp)
    this.csrfToken = options.csrfToken || null;
    this.clock = options.baseDate ? new _clock2.default(options.baseDate) : new _clock2.default();

    this.error = this._checkConfig();
    var debug = options.debug || false;
    if (debug !== false) {
      console.log('[DEBUG] debug mode is enabled');
    }
    this.debug = debug;

    if (this.error) {
      throw new Error('[ERROR]');
    }

    this.timer = new _timer2.default();
    this.timer.start();

    this.scrolling = false;
    this.detecting = false;
    this.capturing = false;

    this.endpointURL = options.endpointURL || 'http://127.0.0.1/';
    this.eventKey = this._genEventKey();

    this.credentials = {
      authorization: this.apiKey,
      csrfToken: this.csrfToken
    };

    this.privacy = new _privacy2.default();
    this.counter = new _counter2.default();

    // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
    this.worker = window.Worker ? new window.Worker(window.URL.createObjectURL(_requestWorker2.default)) : null;

    this.host = window.location.host.replace(/:[0-9]*$/g, '');
    this.path = options.path || window.location.pathname.replace(/(^\/?)/, '/');
  }

  _createClass(Client, [{
    key: '_checkConfig',
    value: function _checkConfig() {
      var error = false;
      if (typeof this.apiKey === 'undefined' || this.apiKey === null || this.apiKey === '') {
        error = true;
        console.error('[ERROR] apiKey is needed');
      }
      return error;
    }
  }, {
    key: '_genEventKey',
    value: function _genEventKey() {
      return _base2.default.urlsafe_b64encode(_uuid2.default.uuid4());
    }
  }, {
    key: '_sendAction',
    value: function _sendAction() {
      var eventType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'scroll';

      if (this.error || this.privacy.check() && this.privacy.protected === true) {
        return null;
      }

      // ignore this event before content loading
      if (typeof this.recorder === 'undefined') {
        return null;
      }

      var record = this.recorder.dump() || { data: null, info: null };
      var data = record.data,
          info = record.info;
      if (data === null || data['duration'] === null || info === null || Object.getOwnPropertyNames(info['scroll']).length === 0) {
        // cancel
        this.counter.clear();
        return null;
      }

      var payload = {
        host: this.host,
        path: this.path,
        eventKey: this.eventKey,
        eventType: eventType,
        record: record,
        count: this.counter.value,
        duration: this.timer.value,
        startedAt: this.timer.startedAt,
        timestamp: this.clock.getTime(),
        extra: this.extra
      };

      if (this.debug === true) {
        console.log(payload);
        return null;
      } else if (this.worker !== null) {
        this.worker.postMessage([payload, this.endpointURL, this.credentials]);
      }
    }

    // selectors is optional (might be undefined)

  }, {
    key: '_track',
    value: function _track(selectors) {
      var _this = this;

      if (this.error || this.privacy.check() && this.privacy.protected === true) {
        return null;
      }

      if (!this.recorder && typeof selectors !== 'undefined') {
        this.recorder = new _recorder2.default(selectors);
      }

      // reduce capturing count using fibonacci sequence
      var fib = (0, _fibonacci2.default)();

      this.detecting = setTimeout(function () {
        var innerCounter = new _counter2.default();
        var innerTimer = new _timer2.default();
        var startedAt = _this.clock.getTime();

        innerTimer.start();
        _this.counter.increment();
        fib.send(true);

        var capturing = function capturing() {
          clearInterval(_this.capturing);
          innerCounter.increment();
          _this.recorder.capture(_this.article, {
            count: innerCounter.value // count of capturing at this region
            , duration: innerTimer.value // time on this region
            , startedAt: startedAt
          });
          _this.capturing = setInterval(capturing, fib.next() * 1000);
        };
        _this.capturing = setInterval(capturing, fib.next() * 1000);
      }, 100);
    }
  }, {
    key: 'record',
    value: function record() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.extra = options.extra || {};

      var selectors = options.selectors || null;

      this.article = document.querySelector(selectors ? selectors.article : 'body article' // default
      );
      // preprocess check
      if (typeof this.article === 'undefined' || this.article === null) {
        console.error('[ERROR] valid article DOM is needed');
        return null;
      }

      this._track(selectors);
    }

    // waits until selectors are ready

  }, {
    key: 'ready',
    value: function ready(selectors, handler) {
      var _this2 = this;

      if (typeof document.addEventListener === 'undefined' || typeof document['hidden'] === 'undefined') {
        console.error('[ERROR] This page requires a browser, such as Firefox ' + 'that supports the modern APIs.');
        this.error = true;
        return null;
      }

      var timeKeeper = function timeKeeper() {
        if (_this2.timer.state === 'active') {
          _this2.timer.pause();
        } else {
          _this2.timer.start();
        }
      };

      // visibilityChange
      document.addEventListener('visibilitychange', function (e) {
        if (_this2.error || _this2.privacy.check() && _this2.privacy.protected === true) {
          return false;
        }
        if (e) {
          e.preventDefault();
          timeKeeper();

          var visibilityChanged = e.type.match(/visibilitychange$/i);
          if (visibilityChanged && document.hidden || !visibilityChanged) {
            _this2._sendAction(e.type);
          }
        } else {
          timeKeeper();
        }
      }, null);

      // fullscreenchange
      document.addEventListener('fullscreenchange', function (e) {
        if (_this2.error || _this2.privacy.check() && _this2.privacy.protected === true) {
          return false;
        }
        if (e) {
          e.preventDefault();

          timeKeeper();

          var fullscreenchanged = e.type.match(/fullscreenchange$/i);
          if (fullscreenchanged) {
            _this2._sendAction(e.type);
          }
        } else {
          timeKeeper();
        }
      }, null);

      var waitLoop = setInterval(function () {
        if (selectors.every(function (v) {
          return document.querySelector(v);
        })) {
          onReady();
        }
      }, 100);

      var onReady = function onReady() {
        clearInterval(waitLoop);
        if (!_this2.article) {
          handler();
        }
      };

      document.addEventListener('DOMContentLoaded', onReady);

      var onScroll = function onScroll() {
        clearTimeout(_this2.detecting);
        clearInterval(_this2.capturing);

        if (typeof _this2.scrolling === 'undefined' || _this2.scrolling === null || _this2.scrolling === false) {
          // scrollstart is false
          _this2._sendAction('scroll');
        } else {
          clearTimeout(_this2.scrolling);
        }

        _this2.scrolling = setTimeout(function () {
          _this2.scrolling = null;
        }, 100);

        if (!_this2.article) {
          // initialize for scroll before DOMContentLoaded
          handler();
        }
        // scrollstop; starts tracking by stop of the scroll
        _this2._track();
      };

      document.addEventListener('scroll', onScroll);
    }
  }]);

  return Client;
}();

exports.default = Client;

},{"../util/base64":9,"../util/fibonacci":10,"../util/request-worker":11,"../util/uuid":12,"./clock":3,"./counter":4,"./privacy":5,"./recorder":6,"./timer":8}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Clock = function () {
  // takes baseDate as ISO-8601 format string with timezone
  // e.g. 2017-03-15T04:57:22.648346+00:00
  function Clock() {
    var _this = this;

    var baseDate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    _classCallCheck(this, Clock);

    if (baseDate === null) {
      baseDate = new Date().toISOString();
    }
    var startedAt = new Date();

    var getDate = function getDate(base) {
      var withWarning = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      try {
        return new Date(baseDate); // Date.parse baseDate
      } catch (_) {
        if (withWarning === true) {
          console.warn('[WARNING] baseDate might be wrong.', 'It must be ISO-8601 format with Timezone.');
        }
        return new Date();
      }
    };
    this._value = getDate(baseDate, true);

    var cycle = function cycle() {
      var diff = new Date() - startedAt;
      var value = getDate(baseDate);
      value.setMilliseconds(value.getMilliseconds() + diff);
      _this._value = value;
    };
    setInterval(cycle, 10);
    cycle();
  }

  _createClass(Clock, [{
    key: 'getTime',
    value: function getTime() {
      return this._value.getTime();
    }
  }, {
    key: 'value',
    get: function get() {
      return this._value;
    }
  }]);

  return Clock;
}();

exports.default = Clock;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Counter = function () {
  function Counter() {
    _classCallCheck(this, Counter);

    this.clear();
  }

  _createClass(Counter, [{
    key: "increment",
    value: function increment() {
      this._value += 1;
      return null;
    }
  }, {
    key: "clear",
    value: function clear() {
      this._value = 0;
      return null;
    }
  }, {
    key: "value",
    get: function get() {
      return this._value;
    }
  }]);

  return Counter;
}();

exports.default = Counter;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Privacy = function () {
  function Privacy() {
    _classCallCheck(this, Privacy);

    this._protected = null;
  }

  _createClass(Privacy, [{
    key: '_hasDoNotTrack',
    value: function _hasDoNotTrack() {
      var doNotTrack = navigator.doNotTrack === 'yes' || navigator.doNotTrack === '1' || window.doNotTrack === 'yes' || window.doNotTrack === '1' || navigator.msDoNotTrack === 'yes' || navigator.msDoNotTrack === '1';
      return doNotTrack === true ? 'yes' : 'no';
    }
  }, {
    key: 'check',
    value: function check() {
      if (this._hasDoNotTrack() === 'yes' && this._protected !== true) {
        var msg = '[INFO] ';
        if (this._protected === null) {
          msg += 'You have';
        }
        if (this._protected === false) {
          msg += 'You have enabled';
        }
        console.log(msg + ' `Do Not Track` option.', 'We respect your privacy and don\'t track you ;)');
        this._protected = true;
      } else if (this._hasDoNotTrack() === 'no') {
        if (this._protected === true) {
          console.log('[INFO] You have disabled `Do Not Track` option.', 'The reading data tracking will be started.', 'Don\'t worry! even so, we respect always your privacy.', 'We don\'t track who you are. ;)');
        }
        this._protected = false;
      }
      return this._protected;
    }
  }, {
    key: 'protected',
    get: function get() {
      // returns always only boolean
      return this._protected === true;
    }
  }]);

  return Privacy;
}();

exports.default = Privacy;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _scrollbar = require('./scrollbar');

var _scrollbar2 = _interopRequireDefault(_scrollbar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Recorder = function () {
  function Recorder() {
    var selectors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    _classCallCheck(this, Recorder);

    this.clear();

    var body = document.body,
        html = document.documentElement;

    this._selectors = this._configureSelectors(selectors);
    this._bar = new _scrollbar2.default();

    this._view = { // inner rect (viewport)
      'margin': 0 // TODO (use font-size or line-height?)
      , 'width': Math.max(window.innerWidth - this._bar.width, html.clientWidth),
      'height': Math.max(window.innerHeight - this._bar.height, html.clientHeight)
    };

    this._page = {}; // {body|html} width, height
    this._page['width'] = Math.max(html.clientWidth, html.scrollWidth, html.offsetWidth, body.scrollWidth, body.offsetWidth);
    this._page['height'] = Math.max(html.clientHeight, html.scrollHeight, html.offsetHeight, body.scrollHeight, body.offsetHeight);
  }

  _createClass(Recorder, [{
    key: '_configureSelectors',
    value: function _configureSelectors(selectors) {
      if (typeof selectors === 'undefined' || selectors === null || Object.getOwnPropertyNames(selectors).length === 0) {
        // default
        return {
          article: 'body article' // first article
          , heading: 'h1,h2,h3,h3,h4,h6',
          paragraph: 'p',
          sentence: 'p > span',
          material: 'ul,ol,pre,table,blockquote'
        };
      }
      return selectors;
    }

    // returns detected element index should be captured

  }, {
    key: '_detectIndex',
    value: function _detectIndex(len, i, obj) {
      if (len === 0 && this._isInView(obj)) {
        return i;
      } else if (len === 1) {
        if (this._isInView(obj)) {
          if (i === 0) {
            return 0;
          }
        } else {
          // previous element
          return i + 1;
        }
      }
      return null;
    }

    // captures index into _data property

  }, {
    key: '_capture',
    value: function _capture(article, kind) {
      var qs = article.querySelectorAll(this._selectors[kind]);
      for (var i = qs.length - 1; i >= 0; i--) {
        var obj = qs[i];
        var key = kind + 's';
        var n = this._detectIndex(this._data[key].length, i, obj);
        if (n !== null) {
          this._data[key].push(n);
        }
      }
    }

    // returns as boolean element is in viewport or not (verticaly & horizontaly)

  }, {
    key: '_isInView',
    value: function _isInView(el) {
      var rect = el.getBoundingClientRect();
      return rect.top <= this._view['height'] - this._view['margin'] && rect.top + rect.height >= 0 && rect.left <= this._view['width'] - this._view['margin'] && rect.left + rect.width >= 0;
    }
  }, {
    key: '_clone',
    value: function _clone() {
      var d = {},
          i = {};

      for (var attr in this._data) {
        if (this._data.hasOwnProperty(attr)) {
          d[attr] = this._data[attr];
        }
      }
      for (var _attr in this._info) {
        if (this._info.hasOwnProperty(_attr)) {
          i[_attr] = this._info[_attr];
        }
      }
      return [d, i];
    }
  }, {
    key: 'capture',
    value: function capture(article) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var selector = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      this._data['count'] = options['count'];
      this._data['duration'] = options['duration'];
      this._data['startedAt'] = options['startedAt'];

      // skip without first time
      if (this._data['count'] !== null && this._data['count'] > 1) {
        return null;
      }

      // article
      //   --> heading
      //   --> paragraph
      //      --> sentence
      //   --> material
      if (article === null) {
        return null;
      }

      ['heading', 'paragraph', 'sentence', 'material'].map(function (k) {
        _this._capture(article, k);
        var key = k + 's';
        var len = _this._data[key].length;
        if (len === 1) {
          // make pair as range
          _this._data[key][1] = _this._data[key][0];
        } else if (len === 2) {
          _this._data[key].sort(function (a, b) {
            return a - b;
          });
        }
      });

      var _bar$calculate = this._bar.calculate(this._page['width'], this._page['height'], this._view['width'], this._view['height']),
          _bar$calculate2 = _slicedToArray(_bar$calculate, 2),
          position = _bar$calculate2[0],
          proportion = _bar$calculate2[1];

      this._info['scroll'] = {
        position: position,
        proportion: proportion
      };
      this._info['view'] = [this._view['width'], this._view['height']];
      this._info['page'] = [this._page['width'], this._page['height']];

      return null;
    }
  }, {
    key: 'dump',
    value: function dump() {
      var _clone2 = this._clone(),
          _clone3 = _slicedToArray(_clone2, 2),
          data = _clone3[0],
          info = _clone3[1];

      this.clear();
      return {
        'data': data,
        'info': info
      };
    }
  }, {
    key: 'clear',
    value: function clear() {
      this._data = {
        'headings': [],
        'paragraphs': [],
        'sentences': [],
        'materials': [],
        'count': 0,
        'duration': null,
        'startedAt': null
      };
      this._info = {
        'scroll': {},
        'view': [],
        'page': []
      };
      return;
    }
  }]);

  return Recorder;
}();

exports.default = Recorder;

},{"./scrollbar":7}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Scrollbar = function () {
  function Scrollbar() {
    _classCallCheck(this, Scrollbar);

    var _detectSize2 = this._detectSize();

    var _detectSize3 = _slicedToArray(_detectSize2, 2);

    this._width = _detectSize3[0];
    this._height = _detectSize3[1];


    this._position = [0, 0];
    this._proportion = [0, 0];
  }

  _createClass(Scrollbar, [{
    key: '_detectSize',
    value: function _detectSize() {
      var inner = document.createElement('p');
      inner.style.width = '100%';
      inner.style.height = '100%';

      var outer = document.createElement('div');
      outer.style.position = 'absolute';
      outer.style.top = '0px';
      outer.style.left = '0px';
      outer.style.width = '100px';
      outer.style.height = '100px';
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'hidden';
      outer.appendChild(inner);

      document.body.appendChild(outer);
      var w1 = inner.offsetWidth,
          h1 = inner.offsetHeight;
      outer.style.overflow = 'scroll';
      var w2 = inner.offsetWidth,
          h2 = inner.offsetHeight;
      if (w1 === w2) {
        w2 = outer.clientWidth;
      }
      if (h1 === h2) {
        h2 = outer.clientHeight;
      }
      document.body.removeChild(outer);
      return [w1 - w2, h1 - h2];
    }

    // position and proportion both

  }, {
    key: 'calculate',
    value: function calculate(pageWidth, pageHeight, regionWidth, regionHeight) {
      var position = this.calculatePosition();
      var args = [].concat(Array.prototype.slice.call(arguments));
      args.push(position);
      var proportion = this.calculatePropotion.apply(this, args);
      return [position, proportion];
    }
  }, {
    key: 'calculatePosition',
    value: function calculatePosition() {
      var h = window.pageXOffset || document.documentElement.scrollLeft,
          v = window.pageYOffset || document.documentElement.scrollTop;
      return [h, v];
    }
  }, {
    key: 'calculatePropotion',
    value: function calculatePropotion(pageWidth, pageHeight, regionWidth, regionHeight) {
      var position = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : calculatePosition();

      var hDiff = pageWidth - regionWidth,
          vDiff = pageHeight - regionHeight;
      // proportion
      var h = hDiff === 0 ? 0 : Math.abs(position[0] / hDiff) * 100,
          v = vDiff === 0 ? 0 : Math.abs(position[1] / vDiff) * 100;
      return [h >= 100 ? 100 : h, v >= 100 ? 100 : v];
    }
  }, {
    key: 'width',
    get: function get() {
      return this._width;
    }
  }, {
    key: 'height',
    get: function get() {
      return this._height;
    }
  }]);

  return Scrollbar;
}();

exports.default = Scrollbar;

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Timer = function () {
  function Timer() {
    var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.0;

    _classCallCheck(this, Timer);

    this._state = 'initialized';
    this._value = n;
    this._startedAt = null;
  }

  _createClass(Timer, [{
    key: 'start',
    value: function start() {
      var _this = this;

      this.pause();
      this._interval = setInterval(function () {
        _this._value += 0.1;
      }, 100);
      this._state = 'active';
      this._startedAt = Date.now();
      return null;
    }
  }, {
    key: 'pause',
    value: function pause() {
      clearInterval(this.interval);
      this._state = 'inactive';
      return null;
    }
  }, {
    key: 'clear',
    value: function clear() {
      this._value = 0.0;
      this._state = 'initialized';
      this._startedAt = null;
      return null;
    }
  }, {
    key: 'state',
    get: function get() {
      return this._state;
    }
  }, {
    key: 'value',
    get: function get() {
      return Number.parseFloat(Number.parseFloat(this._value).toFixed(2));
    }
  }, {
    key: 'startedAt',
    get: function get() {
      return this._startedAt;
    }
  }]);

  return Timer;
}();

exports.default = Timer;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Base64 = function () {
  function Base64() {
    _classCallCheck(this, Base64);
  }

  _createClass(Base64, null, [{
    key: 'urlsafe_b64encode',
    value: function urlsafe_b64encode(str) {
      if (typeof window === 'undefined') {
        return str;
      }
      // get raw bytes of str
      var hex = str.replace(/[\-{}]/g, '');
      var raw = '';
      var toInt = Number && Number.parseInt ? Number.parseInt : parseInt;
      for (var i = 0; i < hex.length; i += 2) {
        // convert characters to a bit
        raw += String.fromCharCode(toInt(hex.charAt(i) + hex.charAt(i + 1), 16));
      }
      // same with python's base64.urlsafe_b64encode() using first `replace()`.
      // See https://docs.python.org/3.5/library/base64.html
      //
      // > Encode string s using the URL- and filesystem-safe alphabet, which
      // > substitutes - instead of + and _ instead of / in the standard Base64
      // > alphabet. The result can still contain =.
      return window.btoa(raw).replace(/\+/g, '-').replace(/\//g, '_');
    }
  }]);

  return Base64;
}();

exports.default = Base64;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var fibo = function fibo() {
  var t,
      reset,
      n1 = 0,
      n2 = 1;
  function getNext(reset) {
    if (reset) {
      t = n1 = 0;
      n2 = 1;
    }
    t = n1;
    n1 = n2;
    n2 += t;
    return t;
  }
  return {
    next: function next() {
      return getNext();
    },
    send: getNext
  };
};

exports.default = fibo;

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var fn = function fn(e) {
  var body = e.data[0] || {},
      endpointURL = e.data[1] || 'http://127.0.0.1',
      credentials = e.data[2] || { csrfToken: null, authorization: null },
      isAsync = false;
  var xhr = new XMLHttpRequest();
  xhr.open('PUT', endpointURL, isAsync);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  if (credentials.authorization) {
    xhr.setRequestHeader('Authorization', credentials.authorization);
  }
  if (credentials.csrfToken) {
    xhr.setRequestHeader('X-CSRF-Token', credentials.csrfToken);
  }
  xhr.send(JSON.stringify(body));
};

var src = 'onmessage = ' + String(fn);

var blob = void 0;
try {
  // https://developer.mozilla.org/en-US/docs/Web/API/Blob
  blob = new Blob([src], { type: 'text/javascript' });
} catch (e) {
  if (typeof window !== 'undefined') {
    // IE 10
    // https://developer.mozilla.org/en-US/docs/Web/API/BlobBuilder
    if (typeof BlobBuilder !== 'undefined') {
      blob = new BlobBuilder();
      blob.append(src);
      blob = blob.getBlob();
    } else {
      throw e;
    }
  }
}

exports.default = blob;

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UUID = function () {
  function UUID() {
    _classCallCheck(this, UUID);
  }

  _createClass(UUID, null, [{
    key: 'uuid4',
    value: function uuid4() {
      if (typeof window === 'undefined') {
        return '';
      }
      // generate raw uuid4 string
      var t = Date.now();
      if (window.performance && typeof window.performance.now === 'function') {
        t += performance.now();
      }
      var u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (t + Math.random() * 16) % 16 | 0;
        t = Math.floor(t / 16);
        return (c === 'x' ? r : r & 0x3 | 0x8).toString(16);
      });
      return u;
    }
  }]);

  return UUID;
}();

exports.default = UUID;

},{}]},{},[1]);

//# sourceMappingURL=scrolliris-readability-tracker-browser.js.map
