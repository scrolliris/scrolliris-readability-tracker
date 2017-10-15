class Clock {
  // takes baseDate as ISO-8601 format string with timezone
  // e.g. 2017-03-15T04:57:22.648346+00:00
  constructor(baseDate=null) {
    if (baseDate === null) {
      baseDate = (new Date).toISOString();
    }
    let startedAt = new Date();

    let getDate = (base, withWarning=false) => {
      try {
        return new Date(baseDate); // Date.parse baseDate
      } catch (_) {
        if (withWarning === true) {
          console.warn('[WARNING] baseDate might be wrong.',
            'It must be ISO-8601 format with Timezone.');
        }
        return new Date();
      }
    }
    this._value = getDate(baseDate, true);

    let cycle = () => {
      let diff = new Date() - startedAt;
      let value = getDate(baseDate);
      value.setMilliseconds(value.getMilliseconds() + diff);
      this._value = value;
    }
    setInterval(cycle, 10);
    cycle();
  }

  get value() {
    return this._value;
  }

  getTime() {
    return this._value.getTime();
  }
}

export default Clock;
