# PostHTML Extend
[![npm version](https://badge.fury.io/js/posthtml-extend.svg)](http://badge.fury.io/js/posthtml-extend)
[![Build Status](https://travis-ci.org/maltsev/posthtml-extend.svg?branch=master)](https://travis-ci.org/maltsev/posthtml-extend)

[PostHTML](https://github.com/posthtml/posthtml) plugin that allows a template to extend (inherit) another templates ([Jade-like](http://jade-lang.com/reference/inheritance/)).


## Usage
Let's say we have a base template:

`base.html`
```html
<html>
    <head>
        <title><block name="title"> — Github</block></title>
    </head>

    <body>
        <div class="content">
           <block name="content"></block>
        </div>

        <footer>
            <block name="footer">footer content</block>
        </footer>
    </body>
</html>
```

Now we can inherit this template. All defined blocks inside `<extends>` will
replace the blocks with the same name in the parent template. If the block is not
defined inside `<extends>` its content in the parent template remains the same.

In the example the blocks `title` and `content` will be replaced and
the block `footer` will remain unchanged:
```js
var posthtml = require('posthtml');
var html = '<extends src="base.html">' +
               '<block name="title">How to use posthtml-extend</block>' +
               '<block name="content">Read the documentation</block>'
           '</extends>';

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
//
//     <body>
//         <div class="content">Read the documentation</div>
//         <footer>footer content</footer>
//     </body>
// </html>
```


It's also possible to append and prepend block's content:
```js
var posthtml = require('posthtml');
var html = '<extends src="base.html">' +
               '<block name="title" type="prepend">How to use posthtml-extend</block>' +
               '<block name="content">Read the documentation</block>' +
               '<block name="footer" type="append">— 2016</block>'
           '</extends>';

posthtml([require('posthtml-extend')()]).process(html).then(function (result) {
    console.log(result.html);
});

// <html>
//     <head>
//         <title>How to use posthtml-extend — Github</title>
//     </head>
//
//     <body>
//         <div class="content">Read the documentation</div>
//         <footer>footer content — 2016</footer>
//     </body>
// </html>
```
