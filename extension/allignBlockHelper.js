/**
 * Creates align blocks from the given selections. Align blocks represent
 * the blocks of text that should be aligned for each line.
 * @param {vscode.Selection} selections Selections to create align blocks from.
 * @returns {{line: number, cursors: number[]}}Align blocks.
 */
function createAlignBlocksFromSelections(selections) {
  // selections are not ordered
  const alignBlocks = new Map();

  // index for insert in a sorted array
  function sortedIndex(array, value) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (array[mid] <= value) low = mid + 1;
        else high = mid;
    }
    return low;
  }

  function getBlock(line) {
    let block = alignBlocks.get(line);
    if (block == undefined) { // if the block don't exist yet, create it
      block = { line, cursors: [] };
      alignBlocks.set(line, block);
    }
    return block;
  }
  
  for (let i = 0; i < selections.length; i++) {
    const selection = selections[i];

    // get the block of this line and push the start and end of the block
    let block = getBlock(selection.start.line);
    let start = selection.start.character;
    let end = selection.isSingleLine ? selection.end.character : start;
    // insert start and end in the array, sorted
    block.cursors.splice(sortedIndex(block.cursors, start), 0, start, end);

    // create two blocks 0-length blocks at the start and end for multi-line selections
    if (!selection.isSingleLine) {
      block = getBlock(selection.end.line);
      let pos = selection.end.character;
      // insert start and end in the array, sorted
      block.cursors.splice(sortedIndex(block.cursors, start), 0, pos, pos);
    }
  }
  
  return Array.from(alignBlocks.values());
}

module.exports = {
  createAlignBlocksFromSelections,
};