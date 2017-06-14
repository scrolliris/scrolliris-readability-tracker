class Screen {
  static isFullscreenMode() {
    // https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
    let fullscreenEnabled =
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled ||
      false
      ;
    let fullscreenElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
      ;

    return (fullscreenEnabled && fullscreenElement !== null) ||
      (window.outerWidth === window.screen.availWidth &&
       window.outerHeight === window.screen.availHeight);
  }

  static getOrientation(currentRegion) {
    // screen orientation
    // https://www.w3.org/TR/screen-orientation/
    let orientation = window.screen.orientation || {'angle': 0};
    let orientationType = null;
    if (typeof orientation === 'undefined' || orientation === null) {
      orientationType = currentRegion['width'] > currentRegion['height'] ?
        'landscape' : 'portrait';
    } else {
      orientationType = orientation.type.replace(/-(primary|secondary)$/, '');
    }
    return {
      'type': orientationType
    , 'angle': orientation ? Number.parseInt(orientation['angle'], 10) : 0
    };

  }
}

export default Screen;
