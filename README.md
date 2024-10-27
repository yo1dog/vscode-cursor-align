# cursor-align

Aligns all of the cursors/selections into a vertical line by inserting whitespace. A very simple, quick, easy, and agnostic way to align code/text however you want.

Spaces are used by default, but tabs can also be used. The "auto" version will automatically use tabs or spaces based on your indentation settings. Consider rebinding the default `alt+a` keybinding to whichever you prefer.

![Cursor Align Demo](img/cursorAlignDemo.gif)

![Multi-Column Demo](img/multiColumnDemo.gif)

![Select Align Demo 1](img/selectAlignDemo1.gif)

![Select Align Demo 2](img/selectAlignDemo2.gif)


## Extension Commands

 Command                                    | Description
--------------------------------------------|-------------
`yo1dog.cursor-align.alignCursors`          | Aligns all cursors/selections using spaces.
`yo1dog.cursor-align.alignCursorsUsingTabs` | Aligns all cursors/selections using tabs.
`yo1dog.cursor-align.alignCursorsUsingAuto` | Aligns all cursors/selections using either spaces or tabs based on the current indentation settings.


## Implementation Details

**Note:** A "cursor" is actually a selection with a length of 0.

Inserts whitespace to the left of selections until all the selection starts are aligned with the right-most selection start. Adds whitespace to the end of selections until all selections are the same length as the longest selection.

If there are multiple selections per line. Selections are grouped into columns from left to right. All selections within a column are aligned with each other.

If tabs are used for alignment, the start and end of all selections are aligned with tab stops.

### Caveats

Multiline selections don't make much sense with this tool. As such they are ignored.

## alt+a Not Working?

If instead of aligning cursors a character is inserted or nothing happens, the default `alt+a` keybinding may be being caught higher up (ex: at the OS level). Try changing the keybinding.

If you continue to have problems, please open a new issue [here](https://github.com/yo1dog/vscode-cursor-align/issues).


## Known Issues

See [Issues](https://github.com/yo1dog/vscode-cursor-align/issues).

### Why are extra tabs being inserted?

Aligning using tabs is a bit more complicated than spaces due to the requirement that tabs must start and end at tab stops in order to be aligned. As such, in some scenarios it may seem as though unneeded tabs are being inserted. However, these tabs are indeed necessary to ensure the rule "the start and end of all selections are aligned with tab stops."



## Release Notes

See [CHANGELOG.md](CHANGELOG.md)