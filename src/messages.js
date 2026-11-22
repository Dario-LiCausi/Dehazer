// All user-facing text in one place. Plain, kind, short.
// Never use: "missed", "overdue", "streak", "behind", "failed".
export const MSG = {
  saved: 'Saved.',
  later: 'Moved to later.',
  done: 'Done. One less thing.',
  deleted: 'Removed.',
  undo: 'Undo',
  restored: 'Back again.',
  empty: 'Empty for now. Add a thought above.',
  capturePlaceholder: 'What is on your mind?',
  captureLabel: 'Add a thought',
  saveButton: 'Save',
  storageFallback: 'This browser cannot keep your items. They will be gone when you close this page.',
};
export const UNDO_MS = 30000;
Object.assign(MSG, {
  exported: 'Saved to your downloads.',
  exportButton: 'Export',
  importButton: 'Import',
  importLabel: 'Bring in a list',
  importDone: (n) => (n === 1 ? 'Added 1 item.' : `Added ${n} items.`),
  importNone: 'No items found in that file.',
  importTooBig: 'That file is too big to import. Nothing was added.',
  importStopped: 'Import stopped. Some items may have been added.',
  importFailed: 'That file did not open. Nothing was added.',
  backupNote: 'It has been a while. You can save a copy with Export.',
  nextTitle: 'Next 5',
  nowLabel: 'Now',
  nextEmpty: 'Nothing waiting. Add a thought above.',
});
MSG.saveFailed = 'Could not save that. Your text is still in the box.';

// M3: UI and UX upgrade.
Object.assign(MSG, {
  doneButton: 'Done',
  notNowButton: 'Not now',
  bringBack: 'Back to list',
  editButton: 'Edit',
  saveEdit: 'Save',
  upButton: 'Move up',
  downButton: 'Move down',
  deleteButton: 'Delete',
  moreButton: 'More',
  edited: 'Updated.',
  movedUp: 'Moved up.',
  movedDown: 'Moved down.',
  broughtBack: 'Back on your list.',
  nowEmpty: 'Nothing to do right now. That is fine.',
  laterEmpty: 'Nothing waiting for later.',
  doneEmpty: 'Nothing done yet.',
  upNextTitle: 'Up next',
  allTitle: 'Your list',
  viewTodo: 'To do',
  viewLater: 'Later',
  viewDone: 'Done',
  pasteHint: 'Paste a list to add one item per line.',
  added: (n) => (n === 1 ? 'Saved 1 item.' : `Saved ${n} items.`),
  settingsButton: 'Settings',
  settingsTitle: 'Settings',
  closeButton: 'Close',
  themeLabel: 'Colours', themeSystem: 'Same as my device', themeLight: 'Light', themeDark: 'Dark',
  sizeLabel: 'Text size', sizeNormal: 'Normal', sizeLarge: 'Large', sizeLarger: 'Larger',
  fontLabel: 'Font', fontSystem: 'Device font', fontEasy: 'Easy-read font (default)',
  motionNote: 'Motion is always off.',
  backupToggle: 'Remind me to export a copy (off by default)',
  settingsSaved: 'Kept on this device.',
  newTitle: 'What changed',
  newBody: 'New in this version: a Now card, Edit, Move up and down, a Later list, Settings and a copy you can install. Your items are the same.',
  gotIt: 'Got it',
  installNote: 'Works offline once this page has loaded.',
});
MSG.pasteTooMany = 'That is more than 100 lines. Nothing was saved. Your text is still in the box.';
MSG.pasteTooLong = 'One line is longer than 2000 characters. Nothing was saved. Your text is still in the box.';

// M5: Tools shelf. Every tool is off until the user turns it on.
Object.assign(MSG, {
  toolsButton: 'Tools',
  toolsTitle: 'Tools',
  toolsSetLegend: 'Tools (all off until you turn one on)',
  showTitle: 'Show this',
  showLabel: 'Message to show',
  showGo: 'Show large',
  showChange: 'Change message',
  showTurn: 'Their turn',
  showNote: 'Not saved. It is cleared when you close this.',
  showTurnLabel: 'Message from the other person',
});
Object.assign(MSG, {
  callTitle: 'Call panel',
  callMake: 'Make my script',
  callChange: 'Change my answers',
  callSlow: 'Ask them to go slowly',
  callWriting: 'Ask for it in writing',
  callNote: 'Not saved. It is cleared when you close this.',
  callBefore: 'Before you hang up',
});

// v0.6: warm look, task and cue memos.
Object.assign(MSG, {
  kindLabel: 'Type',
  kindTask: 'Task',
  kindCue: 'Cue',
  saveTask: 'Save task',
  saveCue: 'Save cue',
  placeholderTask: 'What is on your mind?',
  placeholderCue: 'Something to remember, like a reason or a fact you like',
  cueTitle: 'Remember',
  dropButton: 'Drop',
  cueDropped: 'Cue dropped.',
  viewCues: 'Cues',
  cuesEmpty: 'No cues yet. Switch to Cue above to save one.',
  lookLabel: 'Look',
  lookWarm: 'Honey and pine',
  lookV06: 'Old warm look (v0.6)',
  lookPlain: 'Plain',
});
MSG.newBody = 'New: a warmer look, and two kinds of memo: tasks and cues. Cues come back on days 1, 3, 7, 14 and 30, then monthly. Prefer the old look? Settings, Look, Plain.';
