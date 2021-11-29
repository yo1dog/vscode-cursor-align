const vscode = require('vscode');


/**
 * Aligns all cursors in the active text editor by inserting spaces.
 */
function alignCursors() {
  // make sure we have an active text editor
  // NOTE: we use registerCommand instead of registerTextEditorCommand because we
  // need greater control over the TextEditorEdit
  const textEditor = vscode.window.activeTextEditor;
  if (!textEditor) {
    return;
  }
  
  // get all the blocks of text that will be aligned from the selections
  const alignBlocks = createAlignBlocksFromSelections(textEditor.selections);
  if (alignBlocks.length < 2) {
    return;
  }
  
  const targetStartChar = getMaxAlignBlockStartChar(alignBlocks);
  const targetLength    = getMaxAlignBlockLength   (alignBlocks);
  
  // calculate where we should insert spaces
  const spaceInserts = createSpaceInsertsFromAlignBlocks(alignBlocks, targetStartChar, targetLength);
  if (spaceInserts.length === 0) {
    return;
  }
  
  // NOTE: I'm really not sure how the undo system works. Especially regarding
  // selections.
  // 
  // For example, if you undo and redo a command, the text changes are undone and
  // redone correctly, but the selections are not. The selections do not change
  // when you redo the command. However, if you put a second edit at the end of
  // your command, this fixes the issue (even if the edit does not do anything).
  // 
  // Also, if we do 2 edits and either one or both of the edits create an
  // undo stop, then 2 undos are required to completely undo the command.
  // However, if neither edit creates an undo stop, then 1 undo is required to
  // completely undo the command.
  
  // start the edit
  textEditor.edit(textEditorEdit => {
    // insert all of the spaces
    spaceInserts.forEach(spaceInsert => textEditorEdit.insert(spaceInsert.pos, spaceInsert.str));
  }, {undoStopBefore: false, undoStopAfter: false}) // don't create an undo after (before does not seem to matter)
  .then(() => {
    // select all the aligned blocks
    textEditor.selections = alignBlocks.map(alignBlock => {
      const line      = alignBlock.line;
      const startChar = targetStartChar;
      const endChar   = targetStartChar + targetLength;
      
      return new vscode.Selection(line, startChar, line, endChar);
    });
    
    textEditor.edit(textEditorEdit => {
      // noop
    }, {undoStopBefore: false, undoStopAfter: false});  // don't create an undo stop before (after does not seem to matter)
  }, err => {
    throw err;
  });
}

module.exports = {
  activate(context) {
    // NOTE: we use registerCommand instead of registerTextEditorCommand because we
    // need greater control over the TextEditorEdit
    context.subscriptions.push(vscode.commands.registerCommand('yo1dog.cursor-align.alignCursors', alignCursors));
  },
  
  deactivate() {
  },
  
  alignCursors
};




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