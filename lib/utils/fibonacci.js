var fibo = () => {
  var t, reset, n1 = 0, n2 = 1;
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
    next: () => { return getNext(); }
  , send: getNext
  }
};

export default fibo;
