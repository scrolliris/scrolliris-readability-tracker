class UUID {
  static uuid4() {
    if (typeof window === 'undefined') {
      return '';
    }
    // generate raw uuid4 string
    let t = Date.now();
    if (window.performance && typeof window.performance.now === 'function') {
        t += performance.now();
    }
    let u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g, function(c) {
        let r = (t + Math.random() * 16) % 16 | 0;
        t = Math.floor(t / 16);
        return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
    });
    return u;
  }
}

export default UUID;
