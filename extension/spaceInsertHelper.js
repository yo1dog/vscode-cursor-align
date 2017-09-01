const vscode = require('vscode');


function createSpaceInsertsFromAlignBlocks(alignBlocks, maxBlockStartChar, maxBlockLength) {
  const spaceInserts = [];
  
  for (let i = 0; i < alignBlocks.length; ++i) {
    const alignBlock = alignBlocks[i];
    
    const startDist = maxBlockStartChar - alignBlock.startChar;
    const endDist = maxBlockLength - (alignBlock.endChar - alignBlock.startChar);
    
    if (startDist > 0) {
      spaceInserts.push(createSpaceInsert(alignBlock.startChar, alignBlock.line, startDist));
    }
    if (endDist > 0) {
      spaceInserts.push(createSpaceInsert(alignBlock.endChar, alignBlock.line, endDist));
    }
  }
  
  return spaceInserts;
}

function createSpaceInsert(startChar, line, dist) {
  return {
    startChar,
    line,
    str: ' '.repeat(dist)
  };
}

function applySpaceInserts(editBuilder, spaceInserts) {
  for (let i = 0; i < spaceInserts.length; ++i) {
    const spaceInsert = spaceInserts[i];
    editBuilder.insert(new vscode.Position(spaceInsert.line, spaceInsert.startChar), spaceInsert.str);
  }
}


module.exports = {
  createSpaceInsertsFromAlignBlocks,
  createSpaceInsert,
  applySpaceInserts
};