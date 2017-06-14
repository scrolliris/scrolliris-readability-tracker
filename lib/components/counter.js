class Counter {
  constructor() {
    this.clear();
  }

  increment() {
    this._value += 1;
    return null;
  }

  get value() {
    return this._value;
  }

  clear() {
    this._value = 0;
    return null;
  }
}

export default Counter;
