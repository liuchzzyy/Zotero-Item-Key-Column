/* global Zotero */
const PLUGIN_ID = "item-key-column@rvella";

const ITEM_KEY_COLUMN = "itemKeyColumn";
const ITEM_KEY_ROW = "rvella-item-key-row";

// One entry per editable extra-field. `extraKey` is the `extra`-field line
// prefix; the rest are the column/Info-row identifiers and the bilingual label
// fallback. Column labels resolve via Zotero.getString(), which does not load
// plugin FTL strings, so we carry the localized text here too.
const EXTRA_FIELDS = [
  {
    extraKey: "Short Note",
    column: "shortNoteColumn",
    row: "rvella-short-note-row",
    l10n: "rvella-short-note-label",
    zh: "简记",
    en: "Short Note",
  },
  {
    extraKey: "Translated Title",
    column: "translatedTitleColumn",
    row: "rvella-translated-title-row",
    l10n: "rvella-translated-title-label",
    zh: "翻译标题",
    en: "Translated Title",
  },
];

let registeredDataKeys = [];
let infoRowIDs = [];
let infoRowsRegistered = false;

// ── Localization ──
function localized(zh, en) {
  return Zotero.locale.startsWith("zh") ? zh : en;
}

// ── Extra-field persistence ──
// Stored as an "ExtraKey: ..." line inside the item's `extra` field, so the
// value syncs with Zotero like any other field.
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
      // Replace the first matching line, drop any duplicates.
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

// ── Items list columns ──
async function registerColumns() {
  let itemKeyKey = await Zotero.ItemTreeManager.registerColumn({
    dataKey: ITEM_KEY_COLUMN,
    label: localized("条目 ID", "Item Key"),
    pluginID: PLUGIN_ID,
    dataProvider: (item) => item?.key || "",
    showInColumnPicker: true
  });
  let extraKeys = [];
  for (let field of EXTRA_FIELDS) {
    extraKeys.push(await Zotero.ItemTreeManager.registerColumn({
      dataKey: field.column,
      label: localized(field.zh, field.en),
      pluginID: PLUGIN_ID,
      dataProvider: (item) => getExtraLine(item, field.extraKey),
      showInColumnPicker: true
    }));
  }
  registeredDataKeys = [itemKeyKey, ...extraKeys];
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
        text: localized("条目 ID", "Item Key"),
      },
      position: "afterCreators",
      multiline: false,
      nowrap: true,
      editable: false,
      onGetData({ item }) {
        return item?.key || "";
      }
    }),
    ...EXTRA_FIELDS.map((field) => Zotero.ItemPaneManager.registerInfoRow({
      rowID: field.row,
      pluginID: PLUGIN_ID,
      label: {
        l10nID: field.l10n,
        text: localized(field.zh, field.en),
      },
      position: "afterCreators",
      multiline: true,
      nowrap: false,
      editable: true,
      onGetData({ item }) {
        return getExtraLine(item, field.extraKey);
      },
      onSetData({ item, value }) {
        setExtraLine(item, field.extraKey, value || "");
        item.saveTx().catch((e) => Zotero.logError(e));
      }
    }))
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
