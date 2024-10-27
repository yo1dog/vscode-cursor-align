const vscode = require('vscode');

/**
 * @typedef AlignBlock
 * @property {number} line
 * @property {number} startChar
 * @property {number} endChar
 * @property {number} paddingColSpan
 * @property {number} blockColSpan
 * @property {TableColumn} tableColumn
 * @property {number} finalStartChar
 * @property {number} finalEndChar
 */
/**
 * @typedef TableColumn
 * @property {number} paddingColSpan
 * @property {number} columnColSpan
 */

/**
 * Aligns all cursors in the active text editor by inserting spaces.
 */
function alignCursors() {
  // Make sure we have an active text editor.
  // NOTE: We use registerCommand instead of registerTextEditorCommand because we need greater
  // control over the TextEditorEdit.
  const textEditor = vscode.window.activeTextEditor;
  if (!textEditor) {
    return;
  }
  
  const {selections, document} = textEditor;
  
  // Create and sort blocks for each selection.
  /** @type {AlignBlock[]} */
  const blocks = [];
  for (const selection of selections) {
    // Ignore multiline selections.
    if (!selection.isSingleLine) continue;
    
    /** @type {AlignBlock} */
    const block = {
      line: selection.start.line,
      startChar: selection.start.character,
      endChar: selection.end.character,
      paddingColSpan: 0,
      blockColSpan: 0,
      tableColumn: /** @type {any} */(undefined),
      finalStartChar: 0,
      finalEndChar: 0,
    };
    
    // Order blocks by position.
    let j = 0;
    while (
      j < blocks.length && (
        blocks[j].line < block.line || (
          blocks[j].line === block.line &&
          blocks[j].startChar < block.startChar
        )
      )
    ) ++j;
    blocks.splice(j, 0, block); // Use linked list instead?
  }
  
  if (blocks.length < 2) {
    return;
  }
  
  // Calculate the table columns based on the blocks.
  /** @type {TableColumn[]} */
  const tableColumns = [];
  let curLine = 0;
  let curChar = 0;
  let curTableColumnIndex = 0;
  for (const block of blocks) {
    if (block.line !== curLine) {
      curLine = block.line;
      curChar = 0;
      curTableColumnIndex = 0;
    }
    
    if (curTableColumnIndex === tableColumns.length) {
      tableColumns.push({
        paddingColSpan: 0,
        columnColSpan: 0,
      });
    }
    block.tableColumn = tableColumns[curTableColumnIndex];
    
    ++curTableColumnIndex;
    
    const paddingCharLength = block.startChar - curChar;
    const text = document.getText(new vscode.Range(curLine, curChar, curLine, block.endChar));
    curChar = block.endChar;
    
    block.paddingColSpan = calcTextColSpan(text, 0, paddingCharLength);
    block.blockColSpan = calcTextColSpan(text, paddingCharLength, text.length);
    
    if (block.paddingColSpan > block.tableColumn.paddingColSpan) {
      block.tableColumn.paddingColSpan = block.paddingColSpan;
    }
    if (block.blockColSpan > block.tableColumn.columnColSpan) {
      block.tableColumn.columnColSpan = block.blockColSpan;
    }
  }
  
  // NOTE: I'm really not sure how the undo system works. Especially regarding selections.
  // 
  // For example, if you undo and redo a command, the text changes are undone and redone correctly,
  // but the selections are not. The selections do not change when you redo the command. However, if
  // you put a second edit at the end of your command, this fixes the issue (even if the edit does
  // not do anything).
  // 
  // Also, if we do 2 edits and either one or both of the edits create an undo stop, then 2 undos
  // are required to completely undo the command. However, if neither edit creates an undo stop,
  // then 1 undo is required to completely undo the command.
  
  let didInsert = false;
  
  // Insert spaces such that every block has the same padding and colspan as its column.
  const whitespace = ' ';
  textEditor.edit(textEditorEdit => {
    let curLine = 0;
    let curCharOffset = 0;
    for (const block of blocks) {
      if (block.line !== curLine) {
        curLine = block.line;
        curCharOffset = 0;
      }
      
      const addPaddingCharCount = block.tableColumn.paddingColSpan - block.paddingColSpan;
      const addBlockCharCount = block.tableColumn.columnColSpan - block.blockColSpan;
      
      if (addPaddingCharCount > 0) {
        textEditorEdit.insert(new vscode.Position(block. line, block.startChar), whitespace.repeat(addPaddingCharCount));
        didInsert = true;
      }
      if (addBlockCharCount > 0) {
        textEditorEdit.insert(new vscode.Position(block. line, block.endChar), whitespace.repeat(addBlockCharCount));
        didInsert = true;
      }
      
      block.finalStartChar = block.startChar + curCharOffset + addPaddingCharCount;
      block.finalEndChar = block.endChar + curCharOffset + addPaddingCharCount + addBlockCharCount;
      
      curCharOffset += addPaddingCharCount + addBlockCharCount;
    }
  }, {
    // Don't create an undo after (before does not seem to matter). Not sure why.
    undoStopBefore: false,
    undoStopAfter: false
  }).then(didApply => {
    if (!didApply) return;
    if (!didInsert) return;
    
    // Select the aligned blocks.
    const newSelections = [];
    for (const block of blocks) {
      newSelections.push(new vscode.Selection(
        block.line, block.finalStartChar,
        block.line, block.finalEndChar
      ));
    }
    
    textEditor.selections = newSelections;
    
    // Not sure why this NOOP edit is necessary to make undo work correctly.
    textEditor.edit(() => {/*noop*/}, {undoStopBefore: false, undoStopAfter: false}).then(() => {
      // Done.
    }, err => {throw err;});
  }, err => {throw err;});
}

/**
 * NOTE: It is not possible to determine the actual column span (rendered visual width) of any given
 * character. It is completely up to the render engine with many environmental variables involved
 * (font, ligatures, grapheme clustering, etc.). It may even be fractional. Therefore, we make the
 * following assumptions which seem to match how vscode calculates the displayed "col" and
 * "selected" values:
 * 
 * 1. All codepoints (including surrogate pairs, not individual code units) have a column span of 1.
 * 2. Grapheme clustering is ignored. The result is undeterminable so there is no advantage to
 *    accounting for it.
 * 
 * @param {string} text Text to iterate over.
 * @param {number} startIndex String index iteration lower bound (inclusive).
 * @param {number} endIndex String index iteration upper bound (exclusive).
 */
function calcTextColSpan(text, startIndex, endIndex) {
  let colSpan = 0;
  let prevCodeUnit = 0;
  for (let i = startIndex; i < endIndex; ++i) {
    const codeUnit = text.charCodeAt(i);
    
    if (
      codeUnit >= 0xDC00 && codeUnit <= 0xDFFF &&      // current is low surrogate
      prevCodeUnit >= 0xD800 && prevCodeUnit <= 0xDBFF // previous was high surrogate
    ) {
      // Skip the low surrogate in a VALID surrogate pair.
      // NOTE: We are ignoring an edge case: Technically, it is possible for a selection to split an
      // otherwise valid surrogate pair. Practically, this shouldn't be possible from vscode UI but
      // might be possible if the selection range was set programmatically.
    }
    else {
      colSpan += 1;
    }
    
    prevCodeUnit = codeUnit;
  }
  
  return colSpan;
}

module.exports = {
  /** @param {vscode.ExtensionContext} context */
  activate(context) {
    // NOTE: We use registerCommand instead of registerTextEditorCommand because we need greater
    // control over the TextEditorEdit
    context.subscriptions.push(vscode.commands.registerCommand('yo1dog.cursor-align.alignCursors', () => alignCursors()));
  },
  
  deactivate() {
  },
  
  alignCursors,
  calcTextColSpan,
};
