function createAlignBlocksFromSelections(selections) {
  const alignBlocks = [];
  
  for (let i = 0; i < selections.length; ++i) {
    const selection = selections[i];
    
    if (selection.isSingleLine) {
      // create one block for single-line selections
      alignBlocks.push(createAlignBlock(selection.start.character, selection.end.character, selection.start.line));
    }
    else {
      // create two blocks 0-length blocks at the start and end for multi-line selections
      alignBlocks.push(createAlignBlock(selection.start.character, selection.start.character, selection.start.line));
      alignBlocks.push(createAlignBlock(selection.end  .character, selection.end  .character, selection.end  .line));
    }
  }
  
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

function createAlignBlock(startChar, endChar, line) {
  return {
    startChar,
    endChar,
    line
  };
}
  
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