class Scrollbar {
  constructor() {
    [this._width, this._height] = this._detectSize();

    this._position   = [0, 0];
    this._proportion = [0, 0];
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  _detectSize() {
    let inner = document.createElement('p');
    inner.style.width  = '100%';
    inner.style.height = '100%';

    let outer = document.createElement('div');
    outer.style.position   = 'absolute';
    outer.style.top  = '0px';
    outer.style.left = '0px';
    outer.style.width  = '100px';
    outer.style.height = '100px';
    outer.style.visibility = 'hidden';
    outer.style.overflow   = 'hidden';
    outer.appendChild(inner);

    document.body.appendChild(outer);
    let w1 = inner.offsetWidth
      , h1 = inner.offsetHeight;
    outer.style.overflow = 'scroll';
    let w2 = inner.offsetWidth
      , h2 = inner.offsetHeight;
    if (w1 === w2) {
      w2 = outer.clientWidth;
    }
    if (h1 === h2) {
      h2 = outer.clientHeight;
    }
    document.body.removeChild(outer);
    return [w1 - w2, h1 - h2];
  }

  // position and proportion both
  calculate(pageWidth, pageHeight, regionWidth, regionHeight) {
    let position = this.calculatePosition();
    let args = [...arguments]
    args.push(position);
    let proportion = this.calculatePropotion.apply(this, args);
    return [position, proportion];
  }

  calculatePosition() {
    let h = (window.pageXOffset || document.documentElement.scrollLeft)
      , v = (window.pageYOffset || document.documentElement.scrollTop)
      ;
    return [h, v];
  }

  calculatePropotion(pageWidth, pageHeight, regionWidth, regionHeight,
                     position=calculatePosition()) {
    let hDiff = pageWidth  - regionWidth
      , vDiff = pageHeight - regionHeight
      ;
    // proportion
    let h = (hDiff === 0 ? 0 : Math.abs(position[0] / hDiff) * 100)
      , v = (vDiff === 0 ? 0 : Math.abs(position[1] / vDiff) * 100)
      ;
    return [(h >= 100 ? 100 : h), (v >= 100 ? 100 : v)];
  }
}

export default Scrollbar;
