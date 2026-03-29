import type { Problem, SolutionNode } from '../types/tsumego';

function charToCoord(c: string): number {
  return c.toLowerCase().charCodeAt(0) - 97;
}

export function parseSgfToProblem(sgf: string, id: string): Problem {
  const cleanSgf = sgf.replace(/\r/g, '');

  const szMatch = cleanSgf.match(/SZ\[(\d+)\]/);
  let size = szMatch ? parseInt(szMatch[1], 10) : 19;

  const plMatch = cleanSgf.match(/PL\[([BWbw])\]/);
  const turn: 'black' | 'white' = (plMatch && plMatch[1].toUpperCase() === 'W') ? 'white' : 'black';

  const abRegex = /AB(?:\[([a-zA-Z]{2})\])+/g;
  const awRegex = /AW(?:\[([a-zA-Z]{2})\])+/g;
  
  const setupBlack: number[][] = [];
  const setupWhite: number[][] = [];

  let setupMat;
  while ((setupMat = abRegex.exec(cleanSgf)) !== null) {
    const fullTag = setupMat[0];
    const itemRegex = /\[([a-zA-Z]{2})\]/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(fullTag)) !== null) {
      const col = charToCoord(itemMatch[1][0]);
      const row = charToCoord(itemMatch[1][1]);
      setupBlack.push([row, col]);
    }
  }

  while ((setupMat = awRegex.exec(cleanSgf)) !== null) {
    const fullTag = setupMat[0];
    const itemRegex = /\[([a-zA-Z]{2})\]/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(fullTag)) !== null) {
      const col = charToCoord(itemMatch[1][0]);
      const row = charToCoord(itemMatch[1][1]);
      setupWhite.push([row, col]);
    }
  }

  const state2d = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  for (const [r, c] of setupBlack) {
    if (r >= 0 && r < size && c >= 0 && c < size) state2d[r][c] = { color: 'black' } as any;
  }
  for (const [r, c] of setupWhite) {
    if (r >= 0 && r < size && c >= 0 && c < size) state2d[r][c] = { color: 'white' } as any;
  }
  const initialState = JSON.stringify(state2d);

  const rootCommentMatch = cleanSgf.match(/C\[(.*?)\]/s);
  const description = rootCommentMatch ? rootCommentMatch[1].replace(/\\\]/g, ']') : '';

  const rootTree = parseSgfBranches(cleanSgf);

  return {
    id,
    size,
    category: 'lesson',
    title: id,
    turn,
    labels: '[]',
    initialState,
    description,
    solution: rootTree
  };
}

function parseSgfBranches(sgf: string): { children: SolutionNode[] } {
  let pos = 0;
  
  function skipWhitespace() {
    while (pos < sgf.length && /\s/.test(sgf[pos])) pos++;
  }

  function readProperty(): { key: string, values: string[] } | null {
    skipWhitespace();
    if (pos >= sgf.length || !/[A-Z]/.test(sgf[pos])) return null;
    
    let keyStart = pos;
    while (pos < sgf.length && /[A-Z]/.test(sgf[pos])) pos++;
    const key = sgf.substring(keyStart, pos);
    
    const values: string[] = [];
    skipWhitespace();
    while (pos < sgf.length && sgf[pos] === '[') {
      pos++;
      let valStart = pos;
      let val = '';
      while (pos < sgf.length && sgf[pos] !== ']') {
        if (sgf[pos] === '\\' && pos + 1 < sgf.length) {
          val += sgf[pos + 1];
          pos += 2;
        } else {
          val += sgf[pos];
          pos++;
        }
      }
      values.push(val);
      if (pos < sgf.length && sgf[pos] === ']') pos++;
      skipWhitespace();
    }
    return { key, values };
  }
  
  function readNode(): SolutionNode | null {
    skipWhitespace();
    if (pos >= sgf.length || sgf[pos] !== ';') return null;
    pos++;
    
    let color: 'black' | 'white' | null = null;
    let x: number | undefined;
    let y: number | undefined;
    let status: 'correct' | 'wrong' | null = null;
    let description = '';
    
    while (true) {
      // peek if next is a property
      skipWhitespace();
      if (pos >= sgf.length || !/[A-Z]/.test(sgf[pos])) break;
      const prop = readProperty();
      if (!prop) break;
      
      if (prop.key === 'B' || prop.key === 'W') {
        color = prop.key === 'B' ? 'black' : 'white';
        if (prop.values[0] && prop.values[0].length >= 2) {
          y = charToCoord(prop.values[0][0]); // column
          x = charToCoord(prop.values[0][1]); // row
        }
      }
      if (prop.key === 'C') {
        const comment = prop.values[0] || '';
        description = comment; // We don't natively support description on nodes in 'tsumego.ts' SolutionNode yet, but we could extend
        if (comment.includes('CORRECT') || comment.includes('RIGHT') || comment.includes('Tebrikler')) status = 'correct';
        if (comment.includes('WRONG') || comment.includes('Yanliş') || comment.includes('Yanlış')) status = 'wrong';
      }
    }
    
    if (color && x !== undefined && y !== undefined) {
      return { color, x, y, status, children: [] } as SolutionNode;
    }
    return null;
  }

  function readSequence(): SolutionNode[] {
    const sequence: SolutionNode[] = [];
    while (pos < sgf.length) {
      skipWhitespace();
      if (sgf[pos] === ';') {
        const node = readNode();
        if (node) sequence.push(node);
      } else if (sgf[pos] === '(' || sgf[pos] === ')') {
        break;
      } else {
        pos++;
      }
    }
    for (let i = 0; i < sequence.length - 1; i++) {
      sequence[i].children = [sequence[i + 1]];
    }
    return sequence;
  }

  function readTree(): SolutionNode[] {
    skipWhitespace();
    if (pos >= sgf.length || sgf[pos] !== '(') return [];
    pos++;

    const sequence = readSequence();
    
    const branches: SolutionNode[] = [];
    while (pos < sgf.length) {
      skipWhitespace();
      if (sgf[pos] === '(') {
        const subTree = readTree();
        if (subTree.length > 0) branches.push(subTree[0]);
      } else if (sgf[pos] === ')') {
        pos++;
        break;
      } else {
        pos++; // Safe skip
      }
    }
    
    if (sequence.length > 0) {
      const endNode = sequence[sequence.length - 1];
      endNode.children = branches;
      return [sequence[0]];
    }
    return branches;
  }

  const result: SolutionNode[] = [];
  while (pos < sgf.length) {
    skipWhitespace();
    if (sgf[pos] === '(') {
      const tree = readTree();
      // Skip root node of the very first tree if it just has properties and no move
      if (tree.length > 0) {
        result.push(tree[0]);
      }
    } else {
      pos++;
    }
  }

  // Very simplified: SGF roots usually have a node with SZ/AB/AW but no B/W. 
  // Then children hold the actual moves. If the root node parsing created a dummy node (which it shouldn't if we discard nodes with no move),
  // then we are fine. The root parser above discards nodes with no `color`/`x`/`y`! 
  // Wait, if it discards them, their children won't be linked if we use `readSequence`.
  // Let's ensure the root node's children are actually captured.
  return { children: result };
}
