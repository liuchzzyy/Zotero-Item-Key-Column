/* global Zotero */
const PLUGIN_ID = "item-key-column@rvella";

const ITEM_KEY_COLUMN = "itemKeyColumn";
const SHORT_NOTE_COLUMN = "shortNoteColumn";
const ITEM_KEY_ROW = "rvella-item-key-row";
const SHORT_NOTE_ROW = "rvella-short-note-row";
const SHORT_NOTE_EXTRA_KEY = "Short Note";

let registeredDataKeys = [];
let infoRowIDs = [];
let infoRowsRegistered = false;

// ── Localization helpers ──
// Column labels are resolved via Zotero.getString(), which does not load
// plugin FTL strings, so pick the localized string here instead.
function localized(zh, en) {
  return Zotero.locale.startsWith("zh") ? zh : en;
}
function getItemKeyLabel() {
  return localized("条目 ID", "Item Key");
}
function getShortNoteLabel() {
  return localized("简记", "Short Note");
}

// ── Short Note persistence ──
// Stored as a "Short Note: ..." line inside the item's `extra` field, so the
// value syncs with Zotero like any other field.
function getShortNote(item) {
  let extra = item?.getField?.("extra") || "";
  let prefix = SHORT_NOTE_EXTRA_KEY + ":";
  for (let line of extra.split(/\r?\n/)) {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length).replace(/^\s+/, "");
    }
  }
  return "";
}

function setShortNote(item, value) {
  let extra = item.getField("extra") || "";
  // Normalize the value to a single line so it can't corrupt the extra
  // key-value structure (a "Short Note: ..." line must stay on one line).
  value = (value || "").replace(/\r?\n/g, " ").trim();
  let prefix = SHORT_NOTE_EXTRA_KEY + ":";
  // Avoid producing a leading blank line when extra is empty:
  // "".split(/\r?\n/) returns [""].
  let lines = extra ? extra.split(/\r?\n/) : [];
  let found = false;
  let newLines = [];
  for (let line of lines) {
    if (line.startsWith(prefix)) {
      // Replace the first matching line, drop any duplicates
      if (!found && value) {
        newLines.push(SHORT_NOTE_EXTRA_KEY + ": " + value);
      }
      found = true;
    }
    else {
      newLines.push(line);
    }
  }
  if (!found && value) {
    newLines.push(SHORT_NOTE_EXTRA_KEY + ": " + value);
  }
  item.setField("extra", newLines.join("\n"));
}

// ── Items list columns ──
async function registerColumns() {
  let itemKeyKey = await Zotero.ItemTreeManager.registerColumn({
    dataKey: ITEM_KEY_COLUMN,
    label: getItemKeyLabel(),
    pluginID: PLUGIN_ID,
    dataProvider: (item) => item?.key || "",
    showInColumnPicker: true
  });
  let shortNoteKey = await Zotero.ItemTreeManager.registerColumn({
    dataKey: SHORT_NOTE_COLUMN,
    label: getShortNoteLabel(),
    pluginID: PLUGIN_ID,
    dataProvider: (item) => getShortNote(item),
    showInColumnPicker: true
  });
  registeredDataKeys = [itemKeyKey, shortNoteKey];
}
async function unregisterColumns() {
  for (let key of registeredDataKeys) {
    if (key) {
      await Zotero.ItemTreeManager.unregisterColumn(key);
    }
  }
  registeredDataKeys = [];
}

// ── Info pane rows ──
function registerInfoRows() {
  if (infoRowsRegistered || !Zotero?.ItemPaneManager?.registerInfoRow) return;

  infoRowIDs = [
    Zotero.ItemPaneManager.registerInfoRow({
      rowID: ITEM_KEY_ROW,
      pluginID: PLUGIN_ID,
      label: {
        l10nID: "rvella-item-key-label",
        // Fallback text: Zotero renders `text` first, then overrides it via the
        // data-l10n-id if the plugin FTL is resolvable.
        text: getItemKeyLabel(),
      },
      position: "afterCreators",
      multiline: false,
      nowrap: true,
      editable: false,
      onGetData({ item }) {
        return item?.key || "";
      }
    }),
    Zotero.ItemPaneManager.registerInfoRow({
      rowID: SHORT_NOTE_ROW,
      pluginID: PLUGIN_ID,
      label: {
        l10nID: "rvella-short-note-label",
        text: getShortNoteLabel(),
      },
      position: "afterCreators",
      multiline: true,
      nowrap: false,
      editable: true,
      onGetData({ item }) {
        return getShortNote(item);
      },
      onSetData({ item, value }) {
        setShortNote(item, value || "");
        item.saveTx().catch((e) => Zotero.logError(e));
      }
    })
  ];

  infoRowsRegistered = true;
}

function unregisterInfoRows() {
  if (infoRowsRegistered && Zotero?.ItemPaneManager?.unregisterInfoRow) {
    for (let rowID of infoRowIDs) {
      if (rowID) {
        Zotero.ItemPaneManager.unregisterInfoRow(rowID);
      }
    }
  }
  infoRowIDs = [];
  infoRowsRegistered = false;
}

function onMainWindowLoad({ window }) {
  window.MozXULElement?.insertFTLIfNeeded("item-key-column.ftl");
  registerInfoRows();
  for (let rowID of infoRowIDs) {
    Zotero.ItemPaneManager?.refreshInfoRow?.(rowID);
  }
}
function onMainWindowUnload({ window }) {
  window.document.querySelector('link[href="item-key-column.ftl"]')?.remove();
}

// ── Lifecycle ──
async function startup() {
  await registerColumns();
  // Also register Info rows here so they appear without requiring a Zotero
  // restart (onMainWindowLoad only fires for newly opened windows).
  registerInfoRows();
}
async function shutdown() {
  await unregisterColumns();
  unregisterInfoRows();
}
function install() {}
function uninstall() {}

this.install = install;
this.uninstall = uninstall;
this.startup = startup;
this.shutdown = shutdown;
this.onMainWindowLoad = onMainWindowLoad;
this.onMainWindowUnload = onMainWindowUnload;
