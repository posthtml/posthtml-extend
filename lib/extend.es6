import fs from 'fs';
import path from 'path';
import util from 'util';
import parseToPostHtml from 'posthtml-parser';
import { match } from 'posthtml/lib/api';

const errors = {
    'EXTENDS_NO_SRC': '<extends> has no "src"',
    'BLOCK_NO_NAME': '<block> has no "name"',
    'UNEXPECTED_BLOCK': 'Unexpected block "%s"'
};

export default (options = {}) => {
    return tree => {
        options.encoding = options.encoding || 'utf8';
        options.root = options.root || './';
        options.plugins = options.plugins || [];
        options.strict = Object.prototype.hasOwnProperty.call(options, 'strict') ? !!options.strict : true;
        options.slotTagName = options.slotTagName || 'block';
        options.fillTagName = options.fillTagName || 'block';
        options.tagName = options.tagName || 'extends';

        tree = handleExtendsNodes(tree, options, tree.messages);

        const blockNodes = getBlockNodes(tree, options.slotTagName);
        for (let blockName of Object.keys(blockNodes)) {
            let blockNode = blockNodes[blockName];
            blockNode.tag = false;
            blockNode.content = blockNode.content || [];
            blockNodes[blockName] = blockNode;
        }

        return tree;
    };
};

function handleExtendsNodes(tree, options, messages) {
    match.call(applyPluginsToTree(tree, options.plugins), {tag: options.tagName}, extendsNode => {
        if (! extendsNode.attrs || ! extendsNode.attrs.src) {
            throw getError(errors.EXTENDS_NO_SRC);
        }

        const layoutPath = path.resolve(options.root, extendsNode.attrs.src);
        const layoutHtml = fs.readFileSync(layoutPath, options.encoding);
        let layoutTree = handleExtendsNodes(applyPluginsToTree(parseToPostHtml(layoutHtml), options.plugins), options, messages);

        extendsNode.tag = false;
        extendsNode.content = mergeExtendsAndLayout(layoutTree, extendsNode, options.strict, options.slotTagName, options.fillTagName);
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
    return plugins.reduce((tree, plugin) => tree = plugin(tree), tree);
}


function mergeExtendsAndLayout(layoutTree, extendsNode, strictNames, slotTagName, fillTagName) {
    const layoutBlockNodes = getBlockNodes(layoutTree, slotTagName);
    const extendsBlockNodes = getBlockNodes(extendsNode.content, fillTagName);

    for (let layoutBlockName of Object.keys(layoutBlockNodes)) {
        let extendsBlockNode = extendsBlockNodes[layoutBlockName];
        if (!extendsBlockNode) {
            continue;
        }

        let layoutBlockNode = layoutBlockNodes[layoutBlockName];
        layoutBlockNode.content = mergeContent(
            extendsBlockNode.content,
            layoutBlockNode.content,
            getBlockType(extendsBlockNode)
        );

        delete extendsBlockNodes[layoutBlockName];
    }

    if (strictNames) {
        for (let extendsBlockName of Object.keys(extendsBlockNodes)) {
            throw getError(errors.UNEXPECTED_BLOCK, extendsBlockName);
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
    let blockType = (blockNode.attrs && blockNode.attrs.type) || '';
    blockType = blockType.toLowerCase();
    if (['replace', 'prepend', 'append'].indexOf(blockType) === -1) {
        blockType = 'replace';
    }

    return blockType;
}


function getBlockNodes(content = [], tag) {
    let blockNodes = {};

    match.call(content, {tag}, node => {
        if (! node.attrs || ! node.attrs.name) {
            throw getError(errors.BLOCK_NO_NAME);
        }

        blockNodes[node.attrs.name] = node;
        return node;
    });

    return blockNodes;
}


function getError() {
    const message = util.format.apply(util, arguments);
    return new Error('[posthtml-extend] ' + message);
}
