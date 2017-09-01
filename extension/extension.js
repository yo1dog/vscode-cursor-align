const vscode            = require('vscode');
const alignBlockHelper  = require('./allignBlockHelper');
const spaceInsertHelper = require('./spaceInsertHelper');


function alignCursors() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  
  const alignBlocks = alignBlockHelper.createAlignBlocksFromSelections(editor.selections);
  if (alignBlocks.length < 2) {
    return;
  }
  console.log(alignBlocks);
  
  const maxBlockStartChar = alignBlockHelper.getMaxAlignBlockStartChar(alignBlocks);
  const maxBlockLength    = alignBlockHelper.getMaxAlignBlockLength   (alignBlocks);
  
  console.log(maxBlockStartChar, maxBlockLength);
  
  const spaceInserts = spaceInsertHelper.createSpaceInsertsFromAlignBlocks(alignBlocks, maxBlockStartChar, maxBlockLength);
  console.log(spaceInserts);
  if (spaceInserts.length === 0) {
    return;
  }
  
  editor.edit(editBuilder => {
    spaceInsertHelper.applySpaceInserts(editBuilder, spaceInserts);
    
    process.nextTick(() => {
      editor.selections = alignBlocks.map(alignBlock => {
        const line      = alignBlock.line;
        const startChar = maxBlockStartChar;
        const endChar   = maxBlockStartChar + maxBlockLength;
        
        return new vscode.Selection(line, startChar, line, endChar);
      });
    });
  });
}

module.exports = {
  activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('yo1dog.cursor-align.alignCursors', alignCursors));
  },
  
  deactivate() {
  },
  
  alignCursors
};