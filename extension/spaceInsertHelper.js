const vscode           = require('vscode');


/**
 * Creates space inserts to align the given align blocks. Space Inserts
 * hold spaces and the position to insert them.
 * @param {Object[]} alignBlocks     Align blocks to align.
 * @param {number}   targetStartChar Starting character to align the blocks to.
 * @param {number}   targetLength    Length to align the blocks to.
 */
function createSpaceInsertsFromAlignBlocks(alignBlocks, targetStartChar, targetLength) {
  const spaceInserts = [];
  
  // create space inserts for each align block
  for (let i = 0; i < alignBlocks.length; ++i) {
    const alignBlock = alignBlocks[i];
    const alignBlockLength = alignBlock.endChar - alignBlock.startChar;
    
    const startDist = targetStartChar - alignBlock.startChar;
    const endDist   = targetLength    - alignBlockLength;
    
    if (startDist > 0) {
      // insert spaces before the align block to align the left side
      spaceInserts.push(createSpaceInsert(alignBlock.line, alignBlock.startChar, startDist));
    }
    if (endDist > 0) {
      // insert spaces after the align block to align the right side
      spaceInserts.push(createSpaceInsert(alignBlock.line, alignBlock.endChar, endDist));
    }
  }
  
  return spaceInserts;
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
  createSpaceInsertsFromAlignBlocks,
  createSpaceInsert
};