const vscode           = require('vscode');


/**
 * Creates space inserts to align the given align blocks and selections for each block.
 * Space Inserts hold spaces and the position to insert them.
 * @param {{line: number, cursors: number[]}[]} alignBlocks     Align blocks to align.
 * @param {number}                              targetStartChar Starting character to align the blocks to.
 * @param {number}                              targetLength    Length to align the blocks to.
 * @returns {[{ pos: Position; str: string; }[], vscode.Selection[]]} [space inserts, selections]
 */
function createSpaceInsertsAndSelectionsFromAlignBlocks(alignBlocks) {
  const spaceInserts = [];
  const selections = [];
  let lastAlign = 0;
  // align all the first cursors in each line, after this all the seconds, and so on...
  // if some line don't have the j-th cursor, this line is removed from the array
  OUTER: for (let j = 0; alignBlocks.length > 1; j++) {
    // find the target aling position
    let targetChar = -1;
    INNER: for (let i = 0; i < alignBlocks.length; i++) {
      while (alignBlocks[i].cursors.length == j) { // if cursor[j] don't exist, remove the line from the list
        alignBlocks.splice(i,1);
        if (i == alignBlocks.length) {
          if (alignBlocks.length <= 1) break OUTER; // if the number of alingBLocks is 1, so there is no need for more alingments
          else break INNER;
        }
      } 
      let last = j == 0 ? 0 : alignBlocks[i].cursors[j-1];
      let cur = alignBlocks[i].cursors[j] - last + lastAlign; // cur is the current position of the cursor after the last alingment
      if (cur > targetChar) {
        targetChar = cur;
      }
    }

    for (let i = 0; i < alignBlocks.length; i++) {
      let last = j == 0 ? 0 : alignBlocks[i].cursors[j-1];
      let cur = alignBlocks[i].cursors[j] - last + lastAlign; // cur is the current position of the cursor after the last alingment
      let dist = targetChar - cur;
      if (dist != 0) {
        spaceInserts.push(createSpaceInsert(alignBlocks[i].line, alignBlocks[i].cursors[j], dist));
      }
      if (j%2 == 1) { // each pair even-odd is a selection
        selections.push(new vscode.Selection(alignBlocks[i].line, lastAlign, alignBlocks[i].line, targetChar));
      }
    }
    lastAlign = targetChar;
  }
  
  return [spaceInserts, selections];
}

/**
 * Creates a space insert.
 * @param {number} line      Line to insert space.
 * @param {number} startChar Character position to insert space at.
 * @param {number} dist      Number of spaces to insert.
 * @returns Space insert.
 */
function createSpaceInsert(line, startChar, dist) {
  return {
    pos: new vscode.Position(line, startChar),
    str: ' '.repeat(dist)
  };
}


module.exports = {
  createSpaceInsertsAndSelectionsFromAlignBlocks,
};