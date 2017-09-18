class Base64 {
  static urlsafe_b64encode(str) {
    // get raw bytes of str
    let hex = str.replace(/[\-{}]/g, '');
    let raw = '';
    let toInt = ((Number && Number.parseInt) ? Number.parseInt : parseInt);
    for (let i = 0; i < hex.length; i += 2) { // convert characters to a bit
      raw += String.fromCharCode(toInt(hex.charAt(i) + hex.charAt(i + 1), 16));
    }
    // same with python's base64.urlsafe_b64encode() using first `replace()`.
    // See https://docs.python.org/3.5/library/base64.html
    //
    // > Encode string s using the URL- and filesystem-safe alphabet, which
    // > substitutes - instead of + and _ instead of / in the standard Base64
    // > alphabet. The result can still contain =.
    return window.btoa(raw)
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}

export default Base64;
