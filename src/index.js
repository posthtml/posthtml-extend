import fs from 'fs';
import path from 'path';
import {format} from 'util';
import { parser as parseToPostHtml } from 'posthtml-parser';
import expressions from 'posthtml-expressions';
import {match} from 'posthtml/lib/api';
import merge from 'deepmerge';

const errors = {
  EXTENDS_NO_SRC: '<extends> has no "src"',
  BLOCK_NO_NAME: '<block> has no "name"',
  UNEXPECTED_BLOCK: 'Unexpected block "%s"'
};

const extend = (options = {}) => tree => {
  options.encoding = options.encoding || 'utf8';
  options.root = options.root || './';
  options.plugins = options.plugins || [];
  options.strict = Object.prototype.hasOwnProperty.call(options, 'strict') ? Boolean(options.strict) : true;
  options.slotTagName = options.slotTagName || 'block';
  options.fillTagName = options.fillTagName || 'block';
  options.tagName = options.tagName || 'extends';
  options.expressions = options.expressions || {locals: {}};

  tree = handleExtendsNodes(tree, options, tree.messages);

  const blockNodes = getBlockNodes(options.slotTagName, tree);
  for (const blockName of Object.keys(blockNodes)) {
    const blockNodeList = blockNodes[blockName];
    for (const blockNode of blockNodeList) {
      blockNode.tag = false;
      blockNode.content = blockNode.content || [];
    }
    blockNodes[blockName] = blockNodeList;
  }

  return tree;
};

function handleExtendsNodes(tree, options, messages) {
  match.call(tree = applyPluginsToTree(tree, options.plugins), {tag: options.tagName}, extendsNode => {
    if (!extendsNode.attrs || !extendsNode.attrs.src) {
      throw getError(errors.EXTENDS_NO_SRC);
    }

    let locals = {};
    if (extendsNode.attrs.locals) {
      try {
        locals = JSON.parse(extendsNode.attrs.locals);
      } catch {}
    }

    options.expressions.locals = merge(options.expressions.locals, locals);
    const plugins = [...options.plugins, expressions(options.expressions)];

    const layoutPath = path.resolve(options.root, extendsNode.attrs.src);
    const layoutHtml = fs.readFileSync(layoutPath, options.encoding);
    const layoutTree = handleExtendsNodes(applyPluginsToTree(parseToPostHtml(layoutHtml), plugins), options, messages);

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
  return plugins.reduce((tree, plugin) => {
    tree = plugin(tree);
    return tree;
  }, tree);
}

function mergeExtendsAndLayout(layoutTree, extendsNode, strictNames, slotTagName, fillTagName) {
  const layoutBlockNodes = getBlockNodes(slotTagName, layoutTree);
  const extendsBlockNodes = getBlockNodes(fillTagName, extendsNode.content);

  for (const layoutBlockName of Object.keys(layoutBlockNodes)) {
    const extendsBlockNodeList = extendsBlockNodes[layoutBlockName]
    if (!extendsBlockNodeList) {
      continue;
    }
    // pick up the last block node if multiple blocks are declared in `extends` node
    const extendsBlockNode = extendsBlockNodeList[extendsBlockNodeList.length - 1];
    if (!extendsBlockNode) {
      continue;
    }

    const layoutBlockNodeList = layoutBlockNodes[layoutBlockName];
    for (const layoutBlockNode of layoutBlockNodeList) {
      layoutBlockNode.content = mergeContent(
        extendsBlockNode.content,
        layoutBlockNode.content,
        getBlockType(extendsBlockNode)
      );
    }

    delete extendsBlockNodes[layoutBlockName];
  }

  if (strictNames) {
    for (const extendsBlockName of Object.keys(extendsBlockNodes)) {
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
    default:
      break;
  }

  return layoutBlockContent;
}

function getBlockType(blockNode) {
  let blockType = (blockNode.attrs && blockNode.attrs.type) || '';
  blockType = blockType.toLowerCase();
  if (!['replace', 'prepend', 'append'].includes(blockType)) {
    blockType = 'replace';
  }

  return blockType;
}

function getBlockNodes(tag, content = []) {
  const blockNodes = {};

  match.call(content, {tag}, node => {
    if (!node.attrs || !node.attrs.name) {
      throw getError(errors.BLOCK_NO_NAME);
    }

    appendBlockNode(blockNodes, node)
    return node;
  });

  return blockNodes;
}

function appendBlockNode(blockNodes, node) {
  const { name } = node.attrs
  if (blockNodes[name] == null) {
    blockNodes[name] = [node]
  } else {
    blockNodes[name].push(node)
  }
  return blockNodes
}

function getError(...rest) {
  const message = format(...rest);
  return new Error('[posthtml-extend] ' + message);
}

export default extend;
