import type { MLASTNode, Parse } from '@markuplint/ml-ast'
import { parse as htmlParse } from '@markuplint/html-parser'
import { walk } from '@markuplint/parser-utils'
import remark from 'remark'
import type { Literal, Node, Parent } from 'unist'

export const parse: Parse = (rawCode) => {
  const processor = remark()
  const ast = processor.parse(rawCode)
  if (!isParent(ast)) {
    return {
      nodeList: [],
      isFragment: true,
      unknownParseError: 'ast is not a parent',
    }
  }
  const nodeList = buildNodeList(ast)
  return {
    nodeList,
    isFragment: true,
  }
}

function buildNodeList(parent: Parent): MLASTNode[] {
  const nodeList: MLASTNode[] = []
  let offset = 0
  parent.children.forEach((astNode) => {
    if (!isLiteral(astNode) || typeof astNode.value !== 'string') {
      return
    }

    offset = offset + astNode.value.length

    if (astNode.type === 'html') {
      const htmlAst = htmlParse(astNode.value, {
        offsetOffset: offset,
        offsetLine: (astNode.position?.start.line ?? 1) - 1,
      })
      walk(htmlAst.nodeList, (node) => {
        nodeList.push(node)
      })
    }
  })
  return nodeList
}

function isParent(node: Node): node is Parent {
  return 'children' in node
}

function isLiteral(node: Node): node is Literal {
  return 'value' in node
}
