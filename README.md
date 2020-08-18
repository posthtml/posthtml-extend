# posthtml-extend [![npm version](https://badge.fury.io/js/posthtml-extend.svg)](http://badge.fury.io/js/posthtml-extend) [![Build Status](https://travis-ci.org/posthtml/posthtml-extend.svg?branch=master)](https://travis-ci.org/posthtml/posthtml-extend)

[PostHTML](https://github.com/posthtml/posthtml) plugin that allows a template to extend (inherit) another templates ([Jade-like](http://jade-lang.com/reference/inheritance/)).


## Usage
Let's say we have a base template:

`base.html`
```xml
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
var html = `<extends src="base.html">
      <block name="title">How to use posthtml-extend</block>
      <block name="content">Read the documentation</block>
  </extends>`;

posthtml([require('posthtml-extend')({
    encoding: 'utf8', // Parent template encoding (default: 'utf8')
    root: './' // Path to parent template directory (default: './')
})]).process(html).then(function (result) {
    console.log(result.html);
});
```

The final HTML will be:
```xml
<html>
    <head>
        <title>How to use posthtml-extend</title>
    </head>

    <body>
        <div class="content">Read the documentation</div>
        <footer>footer content</footer>
    </body>
</html>
```


### Append/prepend
It's also possible to append and prepend block's content:
```js
var posthtml = require('posthtml');
var html = `<extends src="base.html">
      <block name="title" type="prepend">How to use posthtml-extend</block>
      <block name="content">Read the documentation</block>
      <block name="footer" type="append">— 2016</block>
  </extends>`;

posthtml([require('posthtml-extend')()]).process(html).then(function (result) {
    console.log(result.html);
});
```

The final HTML will be:
```xml
<html>
    <head>
        <title>How to use posthtml-extend — Github</title>
    </head>
    <body>
        <div class="content">Read the documentation</div>
        <footer>footer content — 2016</footer>
    </body>
</html>
```

## Options

### encoding

The encoding of the parent template. Default: "utf8".

### plugins

You can include [other PostHTML plugins](http://posthtml.github.io/posthtml-plugins/) in your templates.
Here is an example of using [posthtml-expressions](https://github.com/posthtml/posthtml-expressions), which allows to use variables and conditions:

```js
var posthtml = require('posthtml');
var options = {
    plugins: [
        require('posthtml-expressions')({ locals: { foo: 'bar'} })
    ]
};
var html = `<extends src="base.html">
      <if condition="foo === 'bar'">
        <block name="content">content value foo equal bar</block>
      </if>

      <if condition="foo !== 'bar'">
          <block name="content"> value foo not equal bar</block>
      </if>
  </extends>`;

posthtml([require('posthtml-extend')(options)]).process(html).then(function (result) {
    console.log(result.html);
});
```

The final HTML will be:
```xml
<html>
    <head>
        <title>How to use posthtml-extend — Github</title>
    </head>
    <body>
        <div class="content">content value foo equal bar</div>
        <footer>footer content — 2016</footer>
    </body>
</html>
```

### root

The path to the root template directory. Default: "./".

### strict

Whether the plugin should disallow undeclared block names. Default: true.

By default, posthtml-extend raises an exception if an undeclared block name is encountered. This can be useful for troubleshooting (i.e. detecting typos in block names), but
there are cases where "forward declaring" a block name as an extension point for downstream templates is useful, so this restriction can be lifted by setting the `strict`
option to a false value:

```javascript
const extend = require('posthtml-extend');

const root = './src/html';
const options = { root, strict: false };

posthtml([extends(options)]).then(result => console.log(result.html));
```

### slot/fill

Tag names used to match a block with content with a block for inserting content. Default `<block>`

`base.html`
```xml
<html>
    <head>
        <title><slot name="title"> — Github</slot></title>
    </head>

    <body>
        <div class="content">
           <slot name="content"></slot>
        </div>
        <footer>
            <slot name="footer">footer content</slot>
        </footer>
    </body>
</html>
```

```js
var posthtml = require('posthtml');
var html = `<extends src="base.html">
      <fill name="title">How to use posthtml-extend</fill>
      <fill name="content">Read the documentation</fill>
  </extends>`;

posthtml([require('posthtml-extend')({
    slotTagName: 'slot',
    fillTagName: 'fill'
})]).process(html).then(function (result) {
    console.log(result.html);
});
```

The final HTML will be:
```xml
<html>
    <head>
        <title>How to use posthtml-extend</title>
    </head>

    <body>
        <div class="content">Read the documentation</div>
        <footer>footer content</footer>
    </body>
</html>
```

### tagName

Type: `string`\
Default: `extends`

The tag name to use when extending.

```js
var posthtml = require('posthtml');
var html = `<layout src="base.html">
    <block name="title">Using a custom tag name</block>
    <block name="content">Read the documentation</block>
</layout>`;

posthtml([require('posthtml-extend')({
    tagName: 'layout',
})]).process(html).then(function (result) {
    console.log(result.html);
});
```

The final HTML will be:

```html
<html>
    <head>
        <title>Using a custom tag name</title>
    </head>

    <body>
        <div class="content">Read the documentation</div>
        <footer>footer content</footer>
    </body>
</html>
```
