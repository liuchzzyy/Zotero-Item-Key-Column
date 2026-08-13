# Zotero Item Key Column

为 Zotero 添加自定义列与 Info 面板行：

- **条目 ID（Item Key）**：显示条目的内部标识（如 `ABCD1234`），只读
- **简记（Short Note）**：自定义短备注，可在 Info 面板直接编辑，内容保存在条目的 `extra` 字段（`Short Note: ...` 一行），随 Zotero 云同步

界面文字跟随 Zotero 界面语言（简体中文 / English）。

![Screenshot showing the Item Key column](images/screenshot.png)

---

## 安装

1. 下载最新的 `.xpi` 文件（见 [Releases](../../releases)）
2. 打开 Zotero，进入 **工具 → 插件**
3. 将 `.xpi` 拖入插件窗口
4. 重启 Zotero

## 使用

### 条目 ID / 简记 列

- 在主库视图（或高级搜索结果）点击条目列表右上角的**列选择器**（表格图标）
- 勾选「条目 ID」和/或「简记」

### 简记（Info 面板编辑）

1. 选中一个条目，在右侧面板打开 **Info** 标签
2. 在「简记」行点击即可输入，失焦自动保存
3. 内容以 `Short Note: 内容` 形式保存在条目的 `extra` 字段，随 Zotero 同步；单行存储（换行会自动合并为空格）

---

## 兼容性

- Zotero **7.0.0 – 9.0.**\*（可调整 `manifest.json` 中的 `strict_min_version` / `strict_max_version`）

## 开发

在仓库根目录打包 xpi：

```bash
# 方式一：zip 命令（Linux / macOS / Git Bash 自带 zip 时）
zip -r item-key-column.xpi manifest.json bootstrap.js locale

# 方式二：python3（跨平台，Windows 无 zip 命令时）
python3 -c "
import zipfile
files = ['manifest.json', 'bootstrap.js',
         'locale/en-US/item-key-column.ftl',
         'locale/en-GB/item-key-column.ftl',
         'locale/zh-CN/item-key-column.ftl']
with zipfile.ZipFile('item-key-column.xpi', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(f, f)
"
```

### 发布新版本

1. 更新 `manifest.json` 中的 `version`
2. 重新打包，并计算 SHA-256：`sha256sum item-key-column-<version>.xpi`
3. 更新 `updates.json`：新增版本条目，`update_hash` 填 `sha256:<hash>`，`update_link` 指向对应 GitHub Release 资产
4. 创建 GitHub Release（tag 名 `v<version>`），上传对应 `.xpi`
5. 提交并推送（`manifest.json` 的 `update_url` 指向本仓库 `main` 分支的 `updates.json`）

## 更新机制

插件通过 `manifest.json` 中的 `update_url` 检查更新，该地址指向本仓库根目录的 `updates.json`。

---

## 版本历史

- **1.1.1** — 加固 Short Note 存储（多行规范化、空 extra 处理）；`saveTx` 容错；`update_url` 指向 GitHub
- **1.1.0** — 新增「简记 / Short Note」列与可编辑 Info 行
- **1.0.5** — Info 行标签增加文本后备，解决 FTL 未生效时标签空白
- **1.0.4** — 新增简体中文支持
- **1.0.3** — Info 行注册移至 `startup()`，安装后无需重启即可显示
- **1.0.2** — 兼容 Zotero 8/9（更新 `strict_max_version`）

## 许可证

[MIT](LICENSE)
