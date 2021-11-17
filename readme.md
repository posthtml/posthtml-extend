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

### Pass data to layouts

In addition to normal html content you can also pass data as a json object to your layout file. To do this add a `locals` attribute to your `<extend>` and pass a json string.

Like this:

```js
    var posthtml = require('posthtml');
    var html = `<extends src="base.html" locals='{"bodyclass": "home"}'>
        <block name="content">Read the documentation</block>
    </extends>`;
   
    posthtml([require('posthtml-extend')()]).process(html).then(function (result) {
        console.log(result.html);
    });
```

Now you can easily access your data inside of your `base.html`: 

```xml
<html>
    <head>
        <title>How to use posthtml-extend — Github</title>
    </head>

    <body class="{{ bodyclass }}">
        <div class="content">
           <block name="content"></block>
        </div>
    </body>
</html>
```

The final HTML will be:
```xml
<html>
    <head>
        <title>How to use posthtml-extend — Github</title>
    </head>
    <body class="home">
        <div class="content">Read the documentation</div>
    </body>
</html>
```

This behaviour can be customized with the option [`expressions`](#expressions).

## Options

### encoding

Type: `string`\
Default: `utf8`

The encoding of the parent template.

### plugins

Type: `array`\
Default: `[]`

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

Type: `string`\
Default: `./`

The path to the root template directory.

### strict

Type: `boolean`\
Default: `true`

Whether the plugin should disallow undeclared block names.

By default, the plugin raises an exception if an undeclared block name is encountered. This can be useful for troubleshooting (i.e. detecting typos in block names), but
there are cases where "forward declaring" a block name as an extension point for downstream templates is useful, so this restriction can be lifted by setting the `strict`
option to a false value:

```js
const extend = require('posthtml-extend');

const root = './src/html';
const options = { root, strict: false };

posthtml([extend(options)]).then(result => console.log(result.html));
```

### slot/fill

Type: `string`\
Default: `block`

Tag names used to match a content block with a block for inserting content.

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
})]).process(html).then(result => console.log(result.html));
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
})]).process(html).then(result => console.log(result.html));
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

### expressions

Type: `object`\
Default: `{}`

This option accepts an object to configure `posthtml-expressions`.
You can pre-set locals or customize the delimiters for example.

Head over to the [full documentation](https://github.com/posthtml/posthtml-expressions#options) for information on every available option.
