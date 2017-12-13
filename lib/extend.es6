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

        tree = handleExtendsNodes(tree, options);

        const blockNodes = getBlockNodes(tree);
        for (let blockName of Object.keys(blockNodes)) {
            let blockNode = blockNodes[blockName];
            blockNode.tag = false;
            blockNode.content = blockNode.content || [];
            blockNodes[blockName] = blockNode;
        }

        return tree;
    };
};


function handleExtendsNodes(tree, options) {
    match.call(applyPluginsToTree(tree, options.plugins), {tag: 'extends'}, extendsNode => {
        if (! extendsNode.attrs || ! extendsNode.attrs.src) {
            throw getError(errors.EXTENDS_NO_SRC);
        }

        const layoutPath = path.resolve(options.root, extendsNode.attrs.src);
        const layoutHtml = fs.readFileSync(layoutPath, options.encoding);
        let layoutTree = handleExtendsNodes(applyPluginsToTree(parseToPostHtml(layoutHtml), options.plugins), options);

        extendsNode.tag = false;
        extendsNode.content = mergeExtendsAndLayout(layoutTree, extendsNode);

        return extendsNode;
    });

    return tree;
}

function applyPluginsToTree(tree, plugins) {
    return plugins.reduce((tree, plugin) => tree = plugin(tree), tree);
}


function mergeExtendsAndLayout(layoutTree, extendsNode) {
    const layoutBlockNodes = getBlockNodes(layoutTree);
    const extendsBlockNodes = getBlockNodes(extendsNode.content);

    for (let layoutBlockName of Object.keys(layoutBlockNodes)) {
        let extendsBlockNode = extendsBlockNodes[layoutBlockName];
        if (! extendsBlockNode) {
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

    for (let extendsBlockName of Object.keys(extendsBlockNodes)) {
        throw getError(errors.UNEXPECTED_BLOCK, extendsBlockName);
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


function getBlockNodes(content = []) {
    let blockNodes = {};

    match.call(content, {tag: 'block'}, node => {
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
