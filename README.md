# Zotero Item Key Column

为 Zotero 添加自定义列与 Info 面板行：

- **条目 ID（Item Key）**：显示条目的内部标识（如 `ABCD1234`），只读
- **简记（Short Note）**：自定义短备注，可在 Info 面板直接编辑，内容保存在条目的 `extra` 字段（`short-note: ...` 一行），随 Zotero 云同步
- **翻译标题（Translated Title）**：自定义翻译标题，可在 Info 面板直接编辑，内容保存在条目的 `extra` 字段（`translated-title: ...` 一行），随 Zotero 云同步

界面文字跟随 Zotero 界面语言（简体中文 / English）。

---

## 安装

1. 下载最新的 `.xpi` 文件（见 [Releases](../../releases)）
2. 打开 Zotero，进入 **工具 → 插件**
3. 将 `.xpi` 拖入插件窗口
4. 重启 Zotero

## 使用

### 条目 ID / 简记 / 翻译标题 列

- 在主库视图（或高级搜索结果）点击条目列表右上角的**列选择器**（表格图标）
- 勾选「条目 ID」、「简记」和/或「翻译标题」

### 简记 / 翻译标题（Info 面板编辑）

1. 选中一个条目，在右侧面板打开 **Info** 标签
2. 在「简记」或「翻译标题」行点击即可输入，失焦自动保存
3. 内容分别以 `short-note: 内容` 或 `translated-title: 内容` 形式保存在条目的 `extra` 字段，随 Zotero 同步；单行存储（换行会自动合并为空格）

---

## 兼容性

- Zotero **7.0.0 – 9.0.***

## 许可证

[MIT](LICENSE)
