# 浮生 Ascent

[直接在线玩](https://stmission.github.io/ascent-life/) · [桌面版下载](https://github.com/STmission/ascent-life/releases/latest)

这是公开试玩版本。macOS 包适用于 Apple 芯片；Windows 和 Linux 包适用于 x64。下载后先解压整个压缩包，再启动游戏。Windows/Linux 暂未完成对应系统实机验收。


从出生走到死亡的人生游戏。先选国家、出生地、性别和家庭，再选两样本事和职业倾向。十九岁确定职业和去留，之后在能走动的场景里处理求学、工作、父母、感情、婚姻、孩子、中年和离开。

阶层只有四档：平民、中层、精英、财富自由。财富自由要钱，也要压力还没把日子压垮。死亡是结算，不是失败。

## 设计

本工程采用可玩切片和数据驱动内容的开发方式，并参考 Steamworks 公开发行流程；没有 Valve 内部规范或认证：

- 先做完一条能从头玩到尾的垂直切片，再谈内容堆量。
- 世界自己教你怎么走。红色标记和地上的红点就是下一个选择，不另做教程关。
- 选择在当场有后果。阶层会上升，也会因为病床和分开往下掉。
- 键盘、鼠标、触屏和手柄都能操作，方便网页和 Steam Deck。
- 桌面版预留 Steam 成就、富文本状态和云存档。网页版在没有 Steam 时用本地存档。

重要场景都是可走动的三维空间：家、学校、校园、职场、医院、分家、婚礼、住所、公园、码头。小学到高中共用学校，但光线和体型会变。婴儿时期改成五岁的最早记忆，这样人可以自己走。

感情从二十九岁才开始。学校里只有功课、朋友和家里的声音。

## 网页版

```bash
npm install
npm run dev -- --port 5186
```

浏览器打开 http://127.0.0.1:5186 。

打包成可托管的静态站：

```bash
npm run build
npm run preview
```

`dist/` 就是网页版。任意静态服务器都可以托管，路径是相对的。

没有 WebGL 时，标题会进入文字版，选择和结局仍然走同一套规则。标题上的「文字版」也可以主动这样玩。

## 桌面版与 Steam

```bash
npm run desktop
```

这会先构建网页资源，再用 Electron 打开桌面窗口。上架用的目录包：

```bash
npm run steam:dir
```

产物在 `steam/build/`。把里面的应用目录交给 SteamPipe。

本地若要连 Steam 客户端（开发用 AppID 480 / Spacewar）：

```bash
STEAM_ENABLED=1 npm run desktop:steam
```

Steam 客户端需要开着。480 只能映射四个示例成就：第一口呼吸、中层、精英、财富自由。正式 AppID 会使用 `steam/achievements.json` 里的成就 ID。

上架步骤：

1. 注册 Steamworks 开发者，支付入门费用，创建应用和 Depot。
2. 把 `steam/scripts/app_build.vdf` 和 `depot_build.vdf` 里的 `YOUR_APP_ID`、`YOUR_DEPOT_ID` 换成自己的。
3. 在 Steamworks 后台按 `steam/achievements.json` 建成就。
4. 正式上传前删掉包内的 `steam_appid.txt`。这个文件只给本地 480 测试用，留在正式包里会覆盖真实 AppID。
5. 用 SteamCMD 上传：`steamcmd +login 你的账号 +run_app_build /绝对路径/steam/scripts/app_build.vdf +quit`
6. 商店页需要胶囊图、简介、支持语言和内容问卷。这款游戏包含疾病、离异和死亡，没有血腥。

商店审核、税和开发者账号只能由发行方自己完成。

## 操作

- ↑ / W 前进，↓ / S 后退，← / A 向左，→ / D 向右
- 拖动鼠标，或按 Q / R 转身
- E、回车或空格：查看标记
- Shift：快走
- J：生平
- Esc：合上选择
- 手柄：左摇杆移动，右摇杆转身，A 查看，RT 快走
- 触屏：左下摇杆，右下「查看」

## 测试

```bash
npm test
```

15 项测试覆盖房间标记、职业门槛、阶层、200 组随机人生分支、存档兼容性和桌面资源服务。实测记录见 docs/QA.md。

## 发行交接

见 [发行说明](docs/RELEASE.md) 和 [商店文案](docs/STORE.zh-CN.md)。Steam 发行脚本按系统生成：`node tools/prepare-steam.mjs 正式AppID DepotID win`。

国家和家庭的起始数值是虚构的游戏平衡参数，不是人口统计或现实预测。
