/* global Zotero */
const PLUGIN_ID = "item-key-column@rvella";

const ITEM_KEY_COLUMN = "itemKeyColumn";
const SHORT_NOTE_COLUMN = "shortNoteColumn";
const TRANSLATED_TITLE_COLUMN = "translatedTitleColumn";
const ITEM_KEY_ROW = "rvella-item-key-row";
const SHORT_NOTE_ROW = "rvella-short-note-row";
const TRANSLATED_TITLE_ROW = "rvella-translated-title-row";
const SHORT_NOTE_EXTRA_KEY = "Short Note";
const TRANSLATED_TITLE_EXTRA_KEY = "Translated Title";

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
function getTranslatedTitleLabel() {
  return localized("翻译标题", "Translated Title");
}

// ── Extra-field persistence ──
// Stored as a "Short Note: ..." / "Translated Title: ..." line inside the
// item's `extra` field, so the value syncs with Zotero like any other field.
function getExtraLine(item, extraKey) {
  let extra = item?.getField?.("extra") || "";
  let prefix = extraKey + ":";
  for (let line of extra.split(/\r?\n/)) {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length).replace(/^\s+/, "");
    }
  }
  return "";
}

function setExtraLine(item, extraKey, value) {
  let extra = item.getField("extra") || "";
  // Normalize the value to a single line so it can't corrupt the extra
  // key-value structure (each key-value line must stay on one line).
  value = (value || "").replace(/\r?\n/g, " ").trim();
  let prefix = extraKey + ":";
  // Avoid producing a leading blank line when extra is empty:
  // "".split(/\r?\n/) returns [""].
  let lines = extra ? extra.split(/\r?\n/) : [];
  let found = false;
  let newLines = [];
  for (let line of lines) {
    if (line.startsWith(prefix)) {
      // Replace the first matching line, drop any duplicates
      if (!found && value) {
        newLines.push(extraKey + ": " + value);
      }
      found = true;
    }
    else {
      newLines.push(line);
    }
  }
  if (!found && value) {
    newLines.push(extraKey + ": " + value);
  }
  item.setField("extra", newLines.join("\n"));
}

function getShortNote(item) {
  return getExtraLine(item, SHORT_NOTE_EXTRA_KEY);
}
function setShortNote(item, value) {
  setExtraLine(item, SHORT_NOTE_EXTRA_KEY, value);
}
function getTranslatedTitle(item) {
  return getExtraLine(item, TRANSLATED_TITLE_EXTRA_KEY);
}
function setTranslatedTitle(item, value) {
  setExtraLine(item, TRANSLATED_TITLE_EXTRA_KEY, value);
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
  let translatedTitleKey = await Zotero.ItemTreeManager.registerColumn({
    dataKey: TRANSLATED_TITLE_COLUMN,
    label: getTranslatedTitleLabel(),
    pluginID: PLUGIN_ID,
    dataProvider: (item) => getTranslatedTitle(item),
    showInColumnPicker: true
  });
  registeredDataKeys = [itemKeyKey, shortNoteKey, translatedTitleKey];
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
    }),
    Zotero.ItemPaneManager.registerInfoRow({
      rowID: TRANSLATED_TITLE_ROW,
      pluginID: PLUGIN_ID,
      label: {
        l10nID: "rvella-translated-title-label",
        text: getTranslatedTitleLabel(),
      },
      position: "afterCreators",
      multiline: true,
      nowrap: false,
      editable: true,
      onGetData({ item }) {
        return getTranslatedTitle(item);
      },
      onSetData({ item, value }) {
        setTranslatedTitle(item, value || "");
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
