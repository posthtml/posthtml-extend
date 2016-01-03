import fs from 'fs';
import path from 'path';
import util from 'util';
import parseToPostHtml from 'posthtml-parser';

const errors = {
    'EXTENDS_NO_SRC': '<extends> has no "src"',
    'BLOCK_NO_NAME': '<block> has no "name"',
    'UNEXPECTED_BLOCK': 'Unexpected block "%s"'
};


export default (options = {}) => {
    return tree => {
        return extend(tree, options);
    };
};


function extend(tree, options) {
    options.encoding = options.encoding || 'utf8';
    options.root = options.root || './';

    tree = handleExtendsNodes(tree, options);

    const blockNodes = getBlockNodes(tree);
    for (let blockName of Object.keys(blockNodes)) {
        blockNodes[blockName].tag = false;
    }

    return tree;
}


function handleExtendsNodes(tree, options) {
    getNodes(tree, 'extends').forEach(extendsNode => {
        if (! extendsNode.attrs || ! extendsNode.attrs.src) {
            throw getError(errors.EXTENDS_NO_SRC);
        }

        const layoutPath = path.resolve(options.root, extendsNode.attrs.src);
        const layoutHtml = fs.readFileSync(layoutPath, options.encoding);
        let layoutTree = handleExtendsNodes(parseToPostHtml(layoutHtml), options);

        extendsNode.tag = false;
        extendsNode.content = mergeExtendsAndLayout(layoutTree, extendsNode);
    });

    return tree;
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
        case 'prepend':
            layoutBlockContent = extendBlockContent.concat(layoutBlockContent);
            break;

        case 'replace':
            layoutBlockContent = extendBlockContent;
            break;
    }

    return layoutBlockContent;
}


function getBlockType(blockNode) {
    let blockType = (blockNode.attrs && blockNode.attrs.type) || '';
    blockType = blockType.toLowerCase();
    if (['replace', 'prepend'].indexOf(blockType) === -1) {
        blockType = 'replace';
    }

    return blockType;
}


function getBlockNodes(content = []) {
    let blockNodes = {};

    getNodes(content, 'block').forEach(node => {
        if (! node.attrs || ! node.attrs.name) {
            throw getError(errors.BLOCK_NO_NAME);
        }

        blockNodes[node.attrs.name] = node;
    });

    return blockNodes;
}


function getNodes(content = [], filterTag) {
    let nodes = [];
    content.forEach(node => {
        if (node.tag && (! filterTag || node.tag === filterTag)) {
            nodes.push(node);
        } else if (node.content) {
            nodes = nodes.concat(getNodes(node.content, filterTag));
        }
    });

    return nodes;
}


function getError() {
    const message = util.format.apply(util, arguments);
    return new Error('[posthtml-extend] ' + message);
}
