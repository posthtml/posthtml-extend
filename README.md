# PostHTML Extend
[![npm version](https://badge.fury.io/js/posthtml-extend.svg)](http://badge.fury.io/js/posthtml-extend)
[![Build Status](https://travis-ci.org/maltsev/posthtml-extend.svg?branch=master)](https://travis-ci.org/maltsev/posthtml-extend)

[PostHTML](https://github.com/posthtml/posthtml) plugin that allows a template to extend another templates (Jade-like).


## Usage
Let's say we have two parent templates:

`head.html`
```html
<head>
    <title><block name="title"></block></title>
</head>
```

`body.html`
```html
<body>
    <div class="content">
       <block name="content"></block>
    </div>

    <footer>
        <block name="footer">footer</block>
    </fotter>
</body>
```

Now we can extend they:
```js
var posthtml = require('posthtml');
var html = '<html>' +
               '<extends src="head.html">' +
                   '<block name="title">How to use posthtml-extend</block>' +
               '</extends>' +
               '<extends src="body.html">' +
                   '<block name="content">See README.md</block>' +
               '</extends>' +
           '</html>';

posthtml([require('posthtml-extend')({
    encoding: 'utf8', // Parent template encoding (default: 'utf8')
    root: './' // Path to parent template directory (default: './')
})]).process(html).then(function (result) {
    console.log(result.html);
});

// <html>
//     <head>
//         <title>How to use posthtml-extend</title>
//     </head>
//     <body>
//         <div class="content">See README.md</div>
//         <footer>footer</footer>
//     </body>
// </html>
```
