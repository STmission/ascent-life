# 当前验证记录

2026-10-03，macOS arm64 开发环境。

- `npm test`：15 项通过，包含 200 组随机出身与分支选择从出生走到死亡；房间/标记坐标、职业门槛、晋升、家庭和感情分支、存档解析、桌面资源服务均有覆盖。
- `npm run build`：静态网页构建成功，`dist/` 包含人物与房间模型。Three.js 主包约 675 KB（压缩前），首次加载模型约 23 MB，尚有优化空间。
- 桌面 Electron 自动实测：标题就绪、随机开局、进入 3D 家庭场景、W 移动、生成包含坐标的存档、模型资源加载通过。记录见 `artifacts/desktop-smoke.json`，截图见 `artifacts/desktop-gameplay.png`。
- 浏览器：通过实际页面按钮完成出身配置、各人生选择直至最终结算；采用独立 tab 验证，测试脚本为 `tools/browser-smoke.py`。
- macOS arm64、Windows x64、Linux x64 目录包已构建。最终 macOS .app 包也通过同一自动实测，Windows/Linux 仅验证构建成功。
- Steam 正式 AppID、成就后台和云存档未配置，不能声称已通过 Steam 服务验收或上架审核。

运行桌面自动验收：

```sh
ASCENT_SMOKE=1 ASCENT_PORT=17844 npm exec electron .
```

使用独立存档目录，输出到 `artifacts/`，通过后退出，不改变正常玩家存档。
