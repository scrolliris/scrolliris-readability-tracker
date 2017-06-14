class Timer {
  constructor(n=0.0) {
    this._state = 'initialized';
    this._value = n;
    this._startedAt = null;
  }

  get state() {
    return this._state;
  }

  get value() {
    return Number.parseFloat(this._value).toFixed(2);
  }

  get startedAt() {
    return this._startedAt;
  }

  start() {
    this.pause();
    this._interval = setInterval(() => {
      this._value += 0.1;
    }, 100);
    this._state = 'active';
    this._startedAt = Date.now();
    return null;
  }

  pause() {
    clearInterval(this.interval);
    this._state = 'inactive';
    return null;
  }

  clear() {
    this._value = 0.0;
    this._state = 'initialized';
    this._startedAt = null;
    return null;
  }
}

export default Timer;
