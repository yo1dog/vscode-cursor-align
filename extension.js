const vscode = require('vscode');

/**
 * @typedef AlignBlock
 * @property {number} line
 * @property {number} startChar
 * @property {number} endChar
 * @property {number} paddingStartChar
 * @property {number} paddingColSpan
 * @property {number} blockColSpan
 * @property {TableColumn} tableColumn
 * @property {number} finalStartChar
 * @property {number} finalEndChar
 */
/**
 * @typedef TableColumn
 * @property {AlignBlock[]} blocks
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
  const tabSize = /** @type {number} */(textEditor.options.tabSize);
  
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
      paddingStartChar: 0,
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
  
  // Because the size of tabs is variable based on its position, and its position can change during
  // alignment, its size can change during alignment, and thus the size of a table column can not be
  // known until we know the starting position of the table column, which can not be known until we
  // know the starting position and size of each previous column.
  // 
  // Thus, supporting tabs requires itterating blocks thrice rather than just once: The first time
  // to group into table columns. Then in left-to-right order for each column, a second time to
  // calculate the starting position of the column, and a thrid time to calcualte the colspan of the
  // column.
  
  // Group blocks into table columns and calcualte block character padding.
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
        blocks: [],
        paddingColSpan: 0,
        columnColSpan: 0,
      });
    }
    
    const tableColumn = tableColumns[curTableColumnIndex++];
    tableColumn.blocks.push(block);
    block.tableColumn = tableColumn;
    
    block.paddingStartChar = curChar;
    curChar = block.endChar;
  }
  
  // Calculate the padding and colspan of each block and table column.
  let curCol = 0;
  for (const tableColumn of tableColumns) {
    for (const block of tableColumn.blocks) {
      const text = document.getText(new vscode.Range(
        block.line, block.paddingStartChar,
        block.line, block.startChar
      ));
      
      block.paddingColSpan = calcTextColSpan(text, curCol, tabSize);
      
      if (block.paddingColSpan > tableColumn.paddingColSpan) {
        tableColumn.paddingColSpan = block.paddingColSpan;
      }
    }
    
    curCol += tableColumn.paddingColSpan;
    
    for (const block of tableColumn.blocks) {
      const text = document.getText(new vscode.Range(
        block.line, block.startChar,
        block.line, block.endChar
      ));
      
      block.blockColSpan = calcTextColSpan(text, curCol, tabSize);
      if (block.blockColSpan > tableColumn.columnColSpan) {
        tableColumn.columnColSpan = block.blockColSpan;
      }
    }
    
    curCol += tableColumn.columnColSpan;
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
 *    The only exception is tabs.
 * 2. Tabs behave as if every other codepoint has a column span of 1. In reality, vscode uses the
 *    visual position of the tab character to determine a tab's width. But as that is undeterminable
 *    so to is tab behavior.
 * 3. Grapheme clustering is ignored. The result is undeterminable so there is no advantage to
 *    accounting for it.
 * 
 * @param {string} text Text to iterate over.
 * @param {number} textCol Text starting column.
 * @param {number} tabSize Tab size.
 */
function calcTextColSpan(text, textCol, tabSize) {
  let colSpan = 0;
  let prevCodeUnit = 0;
  for (let i = 0; i < text.length; ++i) {
    const codeUnit = text.charCodeAt(i);
    
    if (codeUnit === 9) {
      // Tab character.
      colSpan += tabSize - ((textCol + colSpan) % tabSize);
    }
    else if (
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
