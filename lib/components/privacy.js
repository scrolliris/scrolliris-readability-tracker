class Privacy {
  constructor() {
    this._protected = null;
  }

  _hasDoNotTrack() {
    let doNotTrack = (
      (navigator.doNotTrack === 'yes' || navigator.doNotTrack === '1') ||
      (window.doNotTrack === 'yes' || window.doNotTrack === '1') ||
      (navigator.msDoNotTrack === 'yes' || navigator.msDoNotTrack === '1')
    );
    return (doNotTrack === true) ? 'yes' : 'no';
  }

  get protected() {
    // returns always only boolean
    return this._protected === true;
  }

  check() {
    if (this._hasDoNotTrack() === 'yes' && this._protected !== true) {
      let msg = '[INFO] ';
      if (this._protected === null) {
        msg += 'You have';
      }
      if (this._protected === false) {
        msg += 'You have enabled';
      }
      console.log(msg + ' `Do Not Track` option.',
        'We respect your privacy and don\'t track you ;)');
      this._protected = true;
    } else if (this._hasDoNotTrack() === 'no') {
      if (this._protected === true) {
        console.log(
          '[INFO] You have disabled `Do Not Track` option.',
          'The reading data tracking will be started.',
          'Don\'t worry! even so, we respect always your privacy.',
          'We don\'t track who you are. ;)');
      }
      this._protected = false;
    }
    return this._protected;
  }
}

export default Privacy;
