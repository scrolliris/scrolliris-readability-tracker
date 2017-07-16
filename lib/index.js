import Clock from './components/clock';
import Counter from './components/counter';
import Timer from './components/timer';
import Recorder from './components/recorder';
import Privacy from './components/privacy';

import Base64 from './utils/base64';
import fibo from './utils/fibonacci';
import UUID from './utils/uuid';
import RequestWorker from './utils/request-worker';


class Client {
  constructor(settings={}, options={}) {
    this.scrollKey = settings.scrollKey;

    this.csrfToken = options.csrfToken || null;
    this.clock = options.baseDate ? new Clock(options.baseDate) : new Clock();

    this.error = this._checkConfig();
    let debug = (options.debug || false);
    if (debug !== false) {
      console.log('[DEBUG] debug mode is enabled');
    }
    this.debug = debug;

    if (this.error) {
      throw new Error('[ERROR]');
    }

    this.timer = new Timer();
    this.timer.start();

    this.scrolling = false;
    this.detecting = false;
    this.capturing = false;

    this.endpointURL = (options.endpointURL || 'http://127.0.0.1/');
    this.eventKey    = this._genEventKey();

    this.credentials = {
      authorization: this.scrollKey
    , csrfToken: this.csrfToken
    };

    this.privacy  = new Privacy();
    this.counter  = new Counter();

    // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
    this.worker = (window.Worker) ?
      new window.Worker(window.URL.createObjectURL(RequestWorker)) : null;

    this.host = window.location.host.replace(/:[0-9]*$/g, '');
    this.path = (options.path ||
      window.location.pathname.replace(/(^\/?)/, '/'));
  }

  _checkConfig() {
    let error = false;
    if (typeof this.scrollKey === 'undefined' ||
        this.scrollKey === null || this.scrollKey === '') {
      error = true;
      console.error('[ERROR] scrollKey is needed');
    }
    return error;
  }

  _genEventKey() {
    return Base64.urlsafe_b64encode(UUID.uuid4());
  }

  _sendAction(eventType='scroll') {
    if (this.error ||
        (this.privacy.check() && this.privacy.protected === true)) {
      return null;
    }

    // ignore this event before content loading
    if (typeof this.recorder === 'undefined') {
      return null;
    }

    let record = (this.recorder.dump() || {data: null, info: null});
    let data = record.data
      , info = record.info
      ;
    if (data === null || data['duration'] === null || info === null ||
        Object.getOwnPropertyNames(info['scroll']).length === 0) { // cancel
      this.counter.clear();
      return null;
    }

    let payload = {
      host: this.host
    , path: this.path
    , eventKey: this.eventKey
    , eventType
    , record
    , count: this.counter.value
    , duration: this.timer.value
    , startedAt: this.timer.startedAt
    , timestamp: this.clock.getTime()
    , extra: this.extra
    };

    if (this.debug === true) {
      console.log(payload);
      return null;
    } else if (this.worker !== null) {
      this.worker.postMessage([payload, this.endpointURL, this.credentials]);
    }
  }

  // selectors is optional (might be undefined)
  _track(selectors) {
    if (this.error ||
        (this.privacy.check() && this.privacy.protected === true)) {
      return null;
    }

    if (!this.recorder && typeof selectors !== 'undefined') {
      this.recorder = new Recorder(selectors);
    }

    // reduce capturing count using fibonacci sequence
    let fib = fibo();

    this.detecting = setTimeout(() => {
      let innerCounter = new Counter();
      let innerTimer = new Timer();
      let startedAt = this.clock.getTime();

      innerTimer.start();
      this.counter.increment();
      fib.send(true);

      let capturing = () => {
        clearInterval(this.capturing);
        innerCounter.increment();
        this.recorder.capture(this.article, {
          count: innerCounter.value // count of capturing at this region
        , duration: innerTimer.value  // time on this region
        , startedAt
        });
        this.capturing = setInterval(capturing, fib.next() * 1000);
      }
      this.capturing = setInterval(capturing, fib.next() * 1000);
    }, 100);
  }

  record(options={}) {
    this.extra = (options.extra || {});

    let selectors = (options.selectors || null);

    this.article = document.querySelector(
      selectors ? selectors.article :
        'body article'  // default
    );
    // preprocess check
    if (typeof this.article === 'undefined' || this.article === null) {
      console.error('[ERROR] valid article DOM is needed');
      return null;
    }

    this._track(selectors);
  }

  // waits until selectors are ready
  ready(selectors, handler) {
    if (typeof document.addEventListener === 'undefined' ||
        typeof document['hidden'] === 'undefined') {
      console.error('[ERROR] This page requires a browser, such as Firefox ' +
                    'that supports the modern APIs.');
      this.error = true;
      return null;
    }

    let timeKeeper = () => {
      if (this.timer.state === 'active') {
        this.timer.pause();
      } else {
        this.timer.start();
      }
    }

    // visibilityChange
    document.addEventListener('visibilitychange', (e) => {
      if (this.error ||
          (this.privacy.check() && this.privacy.protected === true)) {
        return false;
      }
      if (e) {
        e.preventDefault();
        timeKeeper();

        let visibilityChanged = e.type.match(/visibilitychange$/i);
        if ((visibilityChanged && document.hidden) ||
            !visibilityChanged) {
          this._sendAction(e.type);
        }
      } else {
        timeKeeper();
      }

    }, null);

    // fullscreenchange
    document.addEventListener('fullscreenchange', (e) => {
      if (this.error ||
          (this.privacy.check() && this.privacy.protected === true)) {
        return false;
      }
      if (e) {
        e.preventDefault();

        timeKeeper();

        let fullscreenchanged = e.type.match(/fullscreenchange$/i);
        if (fullscreenchanged) {
          this._sendAction(e.type);
        }
      } else {
        timeKeeper();
      }
    }, null);

    let waitLoop = setInterval(() => {
      if (selectors.every(v => { return document.querySelector(v); })) {
        onReady();
      }
    }, 100);

    let onReady = () => {
      clearInterval(waitLoop);
      if (!this.article) {
        handler();
      }
    };

    document.addEventListener('DOMContentLoaded', onReady);

    let onScroll = () => {
      clearTimeout(this.detecting);
      clearInterval(this.capturing);

      if (typeof this.scrolling === 'undefined' || this.scrolling === null ||
          this.scrolling === false) {
        // scrollstart is false
        this._sendAction('scroll');
      } else {
        clearTimeout(this.scrolling);
      }

      this.scrolling = setTimeout(() => {
        this.scrolling = null;
      }, 100);

      if (!this.article) {
        // initialize for scroll before DOMContentLoaded
        handler();
      }
      // scrollstop; starts tracking by stop of the scroll
      this._track();
    };

    document.addEventListener('scroll', onScroll);
  }
}

export default Client;
