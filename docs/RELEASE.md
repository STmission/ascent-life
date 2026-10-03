# 双端发行交接

## 网页
`npm run build` 后发布整个 `dist/`，必须包括 `models/`。静态站不需要服务端或数据库。推荐 HTTPS。当前本地试玩地址为 http://127.0.0.1:5186/。

## Steam
1. 完成 Steamworks 开发者注册，取得正式 AppID 和各系统的 DepotID。
2. macOS：`npm run steam:dir`；Windows：`npm run steam:win`；Linux：`npm run steam:linux`。
3. 执行 `node tools/prepare-steam.mjs APPID DEPOTID win`（或 mac / linux）。生成的 ContentRoot 只指向该系统的包，不上传其他系统目录。
4. Steam 后台配置启动文件：Windows `Ascent.exe`；macOS `Ascent.app`；Linux `ascent-life`（以实际包内名称为准）。正式 Steam 启动通过 SteamAppId 环境变量初始化；本地验证可设 `STEAM_APP_ID=正式ID STEAM_ENABLED=1`。
5. 配置 `steam/achievements.json` 对应的成就与 Steam Cloud 文件 `ascent-save.json`，用真实 Steam 客户端验证。
6. SteamCMD 登录后执行 `run_app_build` 指向生成的 app_build.vdf。上传到测试分支，下载后验证，提交商店页及构建审核。
7. 制作最终商店胶囊图、实机截图和预告片，完成内容问卷与税务/银行资料，审核通过后由发行方发布。

官方依据：https://partner.steamgames.com/doc/store/releasing

本工程没有 Valve 内部开发规范或认证。采用独立游戏的可玩切片、数据驱动剧情与测试，并按公开 Steamworks 流程准备交付。

## 已知发行限制
- macOS 包未签名或公证，外部下载运行需要发行方的签名流程。
- Windows 包的跨平台构建不等同于在 Windows 硬件上通过测试。
- Steam 服务需要正式应用配置和拥有该应用的测试账号，离线模式不证明 Steam 成就/云存档正常。
- 网页已发布到 https://stmission.github.io/ascent-life/，桌面下载见 https://github.com/STmission/ascent-life/releases/latest 。Steam 正式上架仍需发行方账号和应用 ID。
