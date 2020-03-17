const vscode            = require('vscode');
const alignBlockHelper  = require('./allignBlockHelper');
const spaceInsertHelper = require('./spaceInsertHelper');


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
  const alignBlocks = alignBlockHelper.createAlignBlocksFromSelections(textEditor.selections);

  if (alignBlocks.length < 2) {
    return;
  }
  
  // calculate where we should insert spaces, and get the selections of each block
  const [spaceInserts, selections] = spaceInsertHelper.createSpaceInsertsAndSelectionsFromAlignBlocks(alignBlocks);

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
    textEditor.selections = selections;
    
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
