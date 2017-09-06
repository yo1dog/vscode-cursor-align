/**
 * Creates align blocks from the given selections. Align blocks represent
 * the blocks of text that should be aligned.
 * @param {vscode-Selection} selections Selections to create align blocks from.
 * @returns Align blocks.
 */
function createAlignBlocksFromSelections(selections) {
  const alignBlocks = [];
  
  // create align blocks for each selection
  for (let i = 0; i < selections.length; ++i) {
    const selection = selections[i];
    
    if (selection.isSingleLine) {
      // create one block for single-line selections
      alignBlocks.push(createAlignBlock(selection.start.line, selection.start.character, selection.end.character));
    }
    else {
      // create two blocks 0-length blocks at the start and end for multi-line selections
      alignBlocks.push(createAlignBlock(selection.start.line, selection.start.character, selection.start.character));
      alignBlocks.push(createAlignBlock(selection.end  .line, selection.end  .character, selection.end  .character));
    }
  }
  
  // combine align blocks that are on the same line
  for (let i = 1; i < alignBlocks.length; ++i) {
    for (let j = 0; j < i; ++j) {
      // check if two blocks are on the same line
      if (alignBlocks[j].line !== alignBlocks[i].line) {
        continue;
      }
      
      // combine the blocks by using the min start char and the max end char
      alignBlocks[j].startChar = Math.min(alignBlocks[j].startChar, alignBlocks[i].startChar);
      alignBlocks[j].endChar   = Math.max(alignBlocks[j].endChar,   alignBlocks[i].endChar  );
      
      alignBlocks.splice(i, 1);
      --i;
      break;
    }
  }
  
  return alignBlocks;
}

/**
 * Creates an align block.
 * @param {number} line Line of the align block.
 * @param {number} startChar Starting character of the align block.
 * @param {number} endChar Ending character of the align block.
 * @returns Align block.
 */
function createAlignBlock(line, startChar, endChar) {
  return {
    line,
    startChar,
    endChar
  };
}

/**
 * Gets the right-most starting character of the given align blocks.
 * @param {Object[]} alignBlocks
 * @returns {number} Right-most (max) starting character.
 */
function getMaxAlignBlockStartChar(alignBlocks) {
  let maxBlockStartChar = -1;
  
  for (let i = 0; i < alignBlocks.length; ++i) {
    const alignBlock = alignBlocks[i];
    
    if (alignBlock.startChar > maxBlockStartChar) {
      maxBlockStartChar = alignBlock.startChar;
    }
  }
  
  return maxBlockStartChar;
}

/**
 * Gets the longest length of the given align blocks.
 * @param {Object[]} alignBlocks
 * @returns {number} Longest (max) length.
 */
function getMaxAlignBlockLength(alignBlocks) {
  let maxBlockLength = -1;
  
  for (let i = 0; i < alignBlocks.length; ++i) {
    const alignBlock = alignBlocks[i];
    const blockLength = alignBlock.endChar - alignBlock.startChar;
    
    if (blockLength > maxBlockLength) {
      maxBlockLength = blockLength;
    }
  }
  
  return maxBlockLength;
}


module.exports = {
  createAlignBlocksFromSelections,
  createAlignBlock,
  getMaxAlignBlockStartChar,
  getMaxAlignBlockLength
};