# PostHTML Extend
[![npm version](https://badge.fury.io/js/posthtml-extend.svg)](http://badge.fury.io/js/posthtml-extend)
[![Build Status](https://travis-ci.org/maltsev/posthtml-extend.svg?branch=master)](https://travis-ci.org/maltsev/posthtml-extend)

[PostHTML](https://github.com/posthtml/posthtml) plugin that allows a template to extend another templates (Jade-like).


## Usage
Let's say we have two parent templates:

`head.html`
```html
<head>
    <block name="meta"><meta charset="utf-8"></block>
    <title><block name="title"> — Github</block></title>
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

Now we can extend they and replace, prepend, or append default block's content:
```js
var posthtml = require('posthtml');
var html = '<html>' +
               '<extends src="head.html">' +
                   '<block name="title" type="prepend">How to use posthtml-extend</block>' +
                   '<block name="meta" type="append"><meta name="robots" content="index, follow"></block>' +
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
//         <meta charset="utf-8"><meta name="robots" content="index, follow">
//         <title>How to use posthtml-extend — Github</title>
//     </head>
//     <body>
//         <div class="content">See README.md</div>
//         <footer>footer</footer>
//     </body>
// </html>
```
