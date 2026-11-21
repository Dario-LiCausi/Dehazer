// All user-facing text in one place. Plain, kind, short.
// Never use: "missed", "overdue", "streak", "behind", "failed".
export const MSG = {
  saved: 'Saved.',
  later: 'Moved to later.',
  done: 'Marked done.',
  deleted: 'Deleted.',
  undo: 'Undo',
  restored: 'Back again.',
  empty: 'Nothing here yet.',
  capturePlaceholder: 'What is on your mind?',
  captureLabel: 'Capture a thought',
  saveButton: 'Save',
  storageFallback: 'Your browser cannot keep data here. Items vanish when you close this page.',
};
export const UNDO_MS = 10000;
Object.assign(MSG, {
  exported: 'Download started. Check your downloads.',
  exportButton: 'Export',
  importButton: 'Import',
  importLabel: 'Import a Markdown file',
  importDone: (n) => (n === 1 ? 'Added 1 item.' : `Added ${n} items.`),
  importNone: 'No items found in that file.',
  importTooBig: 'That file is too big to import. Nothing was added.',
  importStopped: 'Import stopped. Some items may have been added.',
  importFailed: 'That file could not be read.',
  backupNote: 'It has been a while. You can save a copy with Export.',
  nextTitle: 'Next 5',
  nowLabel: 'Now',
  nextEmpty: 'Nothing waiting. Capture a thought above.',
});
MSG.saveFailed = 'Could not save that. Your text is still in the box.';
