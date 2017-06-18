let fn = (e) => {
  let body = (e.data[0] || {})
    , endpointURL = (e.data[1] || 'http://127.0.0.1')
    , credentials = (e.data[2] || {token: '', scrollKey: ''})
    , isAsync = false
    ;
  let xhr = new XMLHttpRequest();
  xhr.open('PUT', endpointURL, isAsync);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('X-CSRF-Token', credentials.token);
  xhr.setRequestHeader('X-Scroll-Key', credentials.scrollKey);
  xhr.send(JSON.stringify(body));
};

let src = `onmessage = ${String(fn)}`;

let blob;
try {
  // https://developer.mozilla.org/en-US/docs/Web/API/Blob
  blob = new Blob([src], {type: 'text/javascript'});
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

export default blob;
