# Siret

`/sɪrɛ́t/`

[![build status](https://gitlab.com/lupine-software/siret/badges/master/build.svg)](https://gitlab.com/lupine-software/siret/commits/master) [![coverage report](https://gitlab.com/lupine-software/siret/badges/master/coverage.svg)](https://gitlab.com/lupine-software/siret/commits/master)

```txt
Siret; ScrollIris REadability Tracker
```

**Siret** tracks text readability data based on user's scroll event in
a gentlemanly manner.

This project is text readibility tracking script and its SDK by [Scrolliris](
https://scrolliris.com) using browser's Web Worker API.  
It's called *Scrolliris Readability Tracker* as formal.

See https://gitlab.com/lupine-software/siret


## Caution

This project is currently under development (beta), not intetded for
usage without experimental or development purpose.


## Philosophy

### Mission

We're working on this to increase and protect author's motivation to write long text on the web.
We believe that it would be sure delightfull also for reader.

### Privacy

We respect reader's privacy and take care them seriously.

This SDK has support for `Do Not Track` (DNT) settings.

We do not track who user is (we don't collect user's id like SNS),
just only how does user read eagerly the text.  
Please see also our privacy policy.


## Tracked data

Data will be sent via `PUT`.  
Tracking API must be enabled CORS (`OPTIONS`)

This is sample data.

### Request Header

* `X-CSRF-Token`
* `X-Publication-Key`

```txt
Host: api.example.org
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:51.0) Gecko/20100101 Firefox/51.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Content-Type: application/json; charset=UTF-8
X-Requested-With: XMLHttpRequest
X-CSRF-Token: KD_zt-Q5SzCL2lLTzGMUcQ--
X-Publication-Key: ""
```

### Body

```javascript
{
  "domain": "example.org",
  "path": "/k-nightmare-story/englishman-loves-a-lord",
  "traceKey": "KanaylMKTRuWGJSRczIg_w--", // __anonymous__ key generatod on browser
  "record": {
    "data": { // capturing data
      "headings": [0, 1],
      "paragraphs": [1, 3],
      "sentences": [3, 14],
      "materials": [0, 0],
      "count": 7, // captured count at this region
      "duration": "8.90", // captured duration at this region
      "startedAt":  1489082998821 // capturing has been started at
    },
    "info": { // browsing information
      "fullscreen": false,
      "orientation": {
        "type": "landscape", // {landscape|portrait}
        "angle": 0
      },
      "scroll": [
        "position": [0, 345], // (x, y)
        "proportion": [0, 52.35204855842185] // (x, y)
      ]
    },
    "view": [1678, 677], // view port size (width, height)
    "page": [1683, 1336], // html document size (width, height)
  },
  "eventType": "scroll", // {scroll|visibilitychange|fullscreenchange}
  "count": 14, // total captured count on this article
  "duration": "22.40", // total captured duration on this article
  "startedAt": 1489083012910, // tracking has been started at
  "timestamp": 1489083035848, // will be sent at
  "extra": {}
}
```

Data does not contain user's id, `traceKey` is anonymous key just generated on
user's browser.


## Install

```zsh
: via npm
% npm install @lupine-software/scrolliris-readability-tracker --save
```


## Configuration

### `client`

#### Settings

| value | default | description |
|---|---|---|
| publicationKey | `null` | This value is set as `X-Publication-Key` in request header. |
| token | `null` | CSRF token. This value is set as `X-CSRF-Token` in request header. |

#### Options

| value | default | description |
|---|---|---|
| debug | `false` | In debug mode, data will not be sent to server (will be output in console). |
| baseDate | `new Date().toISOString()` | Base date to calculate timestamp. |


#### `record`

##### Selectors

`Client.record` can take `selectors` in second argument.

| Object | Default Selector | Type |
|---|---|---|---|
| body | `null` | `querySelector` |
| heading | `'h1,h2,h3,h4,h5,h6'` | `querySelectorAll` |
| paragraph | `'p'`| `querySelectorAll` |
| sentence | `'p > span'`| `querySelectorAll` |
| material | `'img,table,pre,quote'`| `querySelectorAll` |


```js
client.record(article, {
  'selectors': {
      body: 'div#body'
    , heading: 'h2.title,h3.title'
    , paragraph: 'p'
    , sentence: 'p > span'
    , material: 'img,table,pre.code'
  }
});
```

##### Extra

`Client.record` can take `extra` in second argument.

```js
client.record(article, {
  'extra': {
    'readingFont': 'TimesNewRoman'
  , 'brightness': 3
  }
});
```


## Usage

### JavaScript

#### For Browser

```html
<script type="text/javascript"
 src="https:///path/to/scrolliris-readability-tracker-browser.min.js"></script>
```

```js
(function(tracker) {
  var client = new tracker.Client({
    publicationKey: '...'
  , token: '...'
  }, {
    debug: false
  , baseDate: new Date().toISOString()
  });

  var content = document.getElementById('article_content');
  client.ready(['body'], function() {
    client.record(articleContent);
  });
}(window.ScrollirisReadabilityTracker));
```

#### For Module

The main `lib/index.js` has ES2015 style.

```js
import Client from 'siret';

let client = new Client({
  publicationKey: '...'
, token: '...'
}, {
  debug: false
, baseDate: new Date().toISOString()
});

let content = document.getElementById('article_content');
client.ready(['body'], function() {
  client.record(content);
});

```

ES5 style.

```js
'use strict';

// require file from dist
var Client = require('siret/dist/scrolliris-readability-tracker.min');

(function() {
  var client = new Client({
    publicationKey: '...'
  , token: '...'
  }, {
    debug: false
  , baseDate: new Date().toISOString()
  });

  var content = document.getElementById('article_content');
  client.ready(['body'], function() {
    client.record(content);
  });
});
```

### HTML

HTML must have following structure.

```txt
body has...
  > Heading(s)
  > Paragraph(s)
    > Sentence(s)
  > Material(s)
```

```html
<!-- Example 0 (article has a body) -->
<div>
  <article>
    <div>
      <author>John Smith</author>
    </div>

    <div>
      <h1>ARTICLE TITLE</h1>
      <h2>ARTICLE SUB-TITLE</h2>

      <div class="body">
        <h3>SECTION-TITLE 1</h3>

        <p><span>Lorem... </span><span>ipsum... </span></p>
        <p><span>Lorem ipsum... </span></p>

        <img src=...>

        <h3>SECTION-TITLE 2</h3>

        <p><span>Lorem ipsum... </span></p>

        <table>
        </table>
        ...
      </div>
    </div>
  </article>
</div>

<!-- Example 1 (article is body) -->
<article>
    <h3>SECTION-TITLE 1</h3>

    <p><span>Lorem... </span><span>ipsum... </span></p>
    <p><span>Lorem ipsum... </span></p>

    <img src=...>

    <h3>SECTION-TITLE 2</h3>

    <p><span>Lorem ipsum... </span></p>

    <table>
    </table>
    ...
  </div>
</article>
```


## Demo

```zsh
% xdg-open file://`pwd`/example/index.html
```


## To-Do List

* Request queue using local storage
* More Test Coverage


## Development

### Building

```zsh
% gulp build
```

### Testing

```zsh
: run all tests on PhantomJS with coverage (`karma start`)
% npm test

: test task runs all tests {unit|functional} both
% gulp test

: run unit tests
% gulp test:unit

: run functional tests on Electron
% gulp test:functional
```


## License

Siret; Copyright (c) 2017 Lupine Software, LLC.

This program is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation.


See [LICENSE](LICENSE).
