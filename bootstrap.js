/* global Zotero */
const PLUGIN_ID = "item-key-column@rvella";

let registeredDataKey = null;
let infoRowID = null;
let infoRowRegistered = false; 

// ── Items list column ──
function getItemKeyLabel() {
  // Column labels are resolved via Zotero.getString(), which does not load
  // plugin FTL strings, so pick the localized string here instead.
  return Zotero.locale.startsWith("zh") ? "条目 ID" : "Item Key";
}
async function registerColumn() {
  registeredDataKey = await Zotero.ItemTreeManager.registerColumn({
    dataKey: "itemKeyColumn",
    label: getItemKeyLabel(),
    pluginID: PLUGIN_ID,
    dataProvider: (item) => item?.key || "",
    showInColumnPicker: true
  });
}
async function unregisterColumn() {
  if (registeredDataKey) {
    await Zotero.ItemTreeManager.unregisterColumn(registeredDataKey);
    registeredDataKey = null;
  }
}

// ── Info pane row ──
function registerInfoRow() {
  if (infoRowRegistered || !Zotero?.ItemPaneManager?.registerInfoRow) return;

  infoRowID = Zotero.ItemPaneManager.registerInfoRow({
    rowID: "rvella-item-key-row",
    pluginID: PLUGIN_ID,
    label: {
      l10nID: "rvella-item-key-label",
      // Fallback text: Zotero renders `text` first, then overrides it via the
      // data-l10n-id if the plugin FTL is resolvable. Providing both guarantees
      // the label shows up even if FTL resolution fails.
      text: getItemKeyLabel(),
    },
    position: "afterCreators",
    multiline: false,
    nowrap: true,
    editable: false,
    onGetData({ item }) {
      return item?.key || "";
    }
  });

  infoRowRegistered = true;
}

function unregisterInfoRow() {
  if (infoRowRegistered && infoRowID && Zotero?.ItemPaneManager?.unregisterInfoRow) {
    Zotero.ItemPaneManager.unregisterInfoRow(infoRowID);
  }
  infoRowID = null;
  infoRowRegistered = false;
}


function onMainWindowLoad({ window }) {
  window.MozXULElement?.insertFTLIfNeeded("item-key-column.ftl");
  registerInfoRow();
  Zotero.ItemPaneManager?.refreshInfoRow?.(infoRowID);
}
function onMainWindowUnload({ window }) {
  window.document.querySelector('link[href="item-key-column.ftl"]')?.remove();
}

// ── Lifecycle ──
async function startup() {
  await registerColumn();
  // Also try to register the Info row here, so it appears without requiring a
  // Zotero restart (onMainWindowLoad only fires for newly opened windows).
  // registerInfoRow() is a no-op if already registered or the API is not ready;
  // onMainWindowLoad() serves as the fallback.
  registerInfoRow();
}
async function shutdown() {
  await unregisterColumn();
  unregisterInfoRow();
}
function install() {}
function uninstall() {}

this.install = install;
this.uninstall = uninstall;
this.startup = startup;
this.shutdown = shutdown;
this.onMainWindowLoad = onMainWindowLoad;
this.onMainWindowUnload = onMainWindowUnload;
