# Hermdian 开发指南

## 快速开始

### 1. 安装到 Obsidian

```bash
cd ~/localproject/hermdian
./dev.sh dev
```

然后重启 Obsidian 或重新加载插件。

### 2. 在 Obsidian 中启用插件

1. 打开 Obsidian
2. 进入 Settings → Community plugins
3. 找到 "Hermdian" 并启用
4. 点击齿轮图标配置设置

### 3. 配置插件

**推荐：Hermes CLI 模式**
- 确保已安装 Hermes CLI
- 在设置中选择 "Hermes CLI（推荐）"
- CLI 路径默认为 `hermes`

**备选：直连 API 模式**
- 选择 "直连 API"
- 配置 Provider、API Key、模型名称

### 4. 使用插件

- 点击左侧 ribbon 栏的 🧠 图标
- 或使用命令面板 `Ctrl/Cmd + P` → `Hermdian: Open Hermdian`

---

## 开发工作流

### 修改代码后

```bash
./dev.sh dev
```

然后在 Obsidian 中重新加载插件（或重启 Obsidian）。

### 实时监听模式

```bash
./dev.sh watch
```

在另一个终端修改代码时会自动重建。

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `src/main.ts` | 插件入口，生命周期管理 |
| `src/types.ts` | TypeScript 类型定义 |
| `src/settings.ts` | 设置面板 UI |
| `src/views/ChatView.ts` | 对话视图（核心 UI） |
| `src/services/HermesService.ts` | Hermes CLI/API 集成 |
| `src/services/FileService.ts` | 文件操作服务 |
| `src/styles/main.css` | 样式文件 |

---

## 常见问题

### Q: 插件不显示？
A: 检查 Obsidian → Settings → Community plugins 是否启用

### Q: 对话无响应？
A: 检查 Hermes CLI 是否正确安装：
```bash
hermes --version
```

### Q: 样式异常？
A: 确保 `main.css` 已正确复制到插件目录

### Q: 如何调试？
A: 打开 Obsidian 开发者工具 `Ctrl/Cmd + Shift + I`，查看 Console 日志

---

## 下一步开发

1. 测试基本对话功能
2. 完善文件交互功能
3. 添加流式输出支持
4. 优化 UI 细节
5. 添加更多命令
