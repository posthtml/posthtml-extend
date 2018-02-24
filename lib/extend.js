'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _posthtmlParser = require('posthtml-parser');

var _posthtmlParser2 = _interopRequireDefault(_posthtmlParser);

var _api = require('posthtml/lib/api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = {
    'EXTENDS_NO_SRC': '<extends> has no "src"',
    'BLOCK_NO_NAME': '<block> has no "name"',
    'UNEXPECTED_BLOCK': 'Unexpected block "%s"'
};

exports.default = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return function (tree) {
        options.encoding = options.encoding || 'utf8';
        options.root = options.root || './';
        options.plugins = options.plugins || [];

        tree = handleExtendsNodes(tree, options, tree.messages);

        var blockNodes = getBlockNodes(tree);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = Object.keys(blockNodes)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var blockName = _step.value;

                var blockNode = blockNodes[blockName];
                blockNode.tag = false;
                blockNode.content = blockNode.content || [];
                blockNodes[blockName] = blockNode;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return tree;
    };
};

var api = new _api2.default();

function handleExtendsNodes(tree, options, messages) {
    api.match.call(applyPluginsToTree(tree, options.plugins), { tag: 'extends' }, function (extendsNode) {
        if (!extendsNode.attrs || !extendsNode.attrs.src) {
            throw getError(errors.EXTENDS_NO_SRC);
        }

        var layoutPath = _path2.default.resolve(options.root, extendsNode.attrs.src);
        var layoutHtml = _fs2.default.readFileSync(layoutPath, options.encoding);
        var layoutTree = handleExtendsNodes(applyPluginsToTree((0, _posthtmlParser2.default)(layoutHtml), options.plugins), options, messages);

        extendsNode.tag = false;
        extendsNode.content = mergeExtendsAndLayout(layoutTree, extendsNode);
        messages.push({
            type: 'dependency',
            file: layoutPath,
            from: options.from
        });

        return extendsNode;
    });

    return tree;
}

function applyPluginsToTree(tree, plugins) {
    return plugins.reduce(function (tree, plugin) {
        return tree = plugin(tree);
    }, tree);
}

function mergeExtendsAndLayout(layoutTree, extendsNode) {
    var layoutBlockNodes = getBlockNodes(layoutTree);
    var extendsBlockNodes = getBlockNodes(extendsNode.content);

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = Object.keys(layoutBlockNodes)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var layoutBlockName = _step2.value;

            var extendsBlockNode = extendsBlockNodes[layoutBlockName];
            if (!extendsBlockNode) {
                continue;
            }

            var layoutBlockNode = layoutBlockNodes[layoutBlockName];
            layoutBlockNode.content = mergeContent(extendsBlockNode.content, layoutBlockNode.content, getBlockType(extendsBlockNode));

            delete extendsBlockNodes[layoutBlockName];
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = Object.keys(extendsBlockNodes)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var extendsBlockName = _step3.value;

            throw getError(errors.UNEXPECTED_BLOCK, extendsBlockName);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return layoutTree;
}

function mergeContent(extendBlockContent, layoutBlockContent, extendBlockType) {
    extendBlockContent = extendBlockContent || [];
    layoutBlockContent = layoutBlockContent || [];

    switch (extendBlockType) {
        case 'replace':
            layoutBlockContent = extendBlockContent;
            break;

        case 'prepend':
            layoutBlockContent = extendBlockContent.concat(layoutBlockContent);
            break;

        case 'append':
            layoutBlockContent = layoutBlockContent.concat(extendBlockContent);
            break;
    }

    return layoutBlockContent;
}

function getBlockType(blockNode) {
    var blockType = blockNode.attrs && blockNode.attrs.type || '';
    blockType = blockType.toLowerCase();
    if (['replace', 'prepend', 'append'].indexOf(blockType) === -1) {
        blockType = 'replace';
    }

    return blockType;
}

function getBlockNodes() {
    var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    var blockNodes = {};

    api.match.call(content, { tag: 'block' }, function (node) {
        if (!node.attrs || !node.attrs.name) {
            throw getError(errors.BLOCK_NO_NAME);
        }

        blockNodes[node.attrs.name] = node;
        return node;
    });

    return blockNodes;
}

function getError() {
    var message = _util2.default.format.apply(_util2.default, arguments);
    return new Error('[posthtml-extend] ' + message);
}