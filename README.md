# aicsa-openlesson · AI × AP Computer Science A

为零基础高中生准备的双语课程站：先学怎么用 AI 学习，再用这套方法从零学 AP Computer Science A（Java）。课文在 `content/lessons/`，用 MDX 写成。选择题、填空和排序在浏览器里判分；对话练习走服务端，密钥不会发到页面上。

## 环境

- Node.js **20.9 或更高**（当前 Next.js 16 的要求）
- npm（随 Node 一起安装）

在项目目录里启动。如果仓库根目录就是本文件夹，下面的命令直接运行；不要在上一级目录运行。

## 启动

```bash
npm install
cp llm.config.example.json llm.config.json
npm run dev
```

浏览器打开终端里打印的地址，默认是 [http://localhost:3000](http://localhost:3000)。

`llm.config.example.json` 是仓库里的空白 API 文件，三项都是空字符串。复制出来的 `llm.config.json` 在填好之前，对话练习是关闭的，课文、选择题、填空和排序照常可用。

确认对话是否已接上：

```bash
curl http://localhost:3000/api/chat
```

空白配置返回 `"configured": false`。三项都填好并重启后，返回 `"configured": true`。

## 填写 API

编辑**复制出来的** `llm.config.json`，不要改仓库里的空白模板，也不要把它提交上去。这个文件已经在 `.gitignore` 里。

```json
{
  "apiKey": "你的密钥",
  "baseURL": "https://api.example.com/v1",
  "model": "模型名"
}
```

- `baseURL` 填服务商的 API 根，通常以 `/v1` 结尾。不要写成 `/chat/completions`。
- 必须是 `https`。`http` 只允许 `localhost`、`127.0.0.1` 和 `[::1]`，给本机的 Ollama 或 LM Studio 用。
- 地址里不能带用户名、密码、查询串或锚点。
- 三项里有任何一项是空的，对话功能整段关闭。
- 改完文件后要停掉 `npm run dev` 再开一次，配置才会重新读入。

也可以用环境变量，它们会盖过文件里的同名项。不要加 `NEXT_PUBLIC_` 前缀：

```bash
LLM_API_KEY=你的密钥
LLM_BASE_URL=https://api.example.com/v1
LLM_MODEL=模型名
```

空白模板见 `.env.example`。本地模型和各家兼容端点的写法在 [docs/running-the-ai.md](docs/running-the-ai.md)。

## 其他命令

```bash
npm test          # 单元测试
npm run lint      # 代码检查
npm run typecheck # 类型检查
npm run build     # 生产构建
npm run start     # 先 build，再在默认端口 3000 提供生产服务
```

## 许可与致谢

本仓库里课程作者原创的课文、练习、说明和网站代码，暂以 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 授权。全文见 [LICENSE](LICENSE)。

转载或改编请注明：「AI × AP Computer Science A」课程（OpenLesson），CC BY-NC-SA 4.0。可以分享和改编，须署名，不得商用，改编作品使用同一许可。

课程结构参照 College Board 公开发布的 AP Computer Science A 课程与考试说明（2025 年秋季起生效）。AP、Advanced Placement、College Board 和 Bluebook 是 College Board 的商标。本课程不是官方产品，也未获 College Board 认可。官方 PDF 不放进本仓库。

课文链接到的材料仍归原作者，不因本许可而改变：

- [CSAwesome2](https://runestone.academy/ns/books/published/csawesome2/csawesome2.html)（Runestone）及其公开课视频（YouTube 频道 danzafut）
- [CodingBat Java](https://codingbat.com/java)（Nick Parlante）
- [Python Tutor](https://pythontutor.com/java.html)（Philip Guo）
- [廖雪峰的 Java 教程](https://www.liaoxuefeng.com/wiki/1252599548343744)、[菜鸟教程 Java](https://www.runoob.com/java/java-tutorial.html)
- [Oracle Java 教程](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/index.html)
- 二维数组短视频来自 YouTube 频道 TokyoEdtech

网站使用 Next.js、React 和 KaTeX。这些依赖保留各自的许可证。

## 传到 GitHub 时不要带上这些

- `llm.config.json`：本机密钥。仓库里只保留空白的 `llm.config.example.json`。
- `.env` 和 `.env.local`：同样只保留 `.env.example`。
- `node_modules/`、`.next/`、测试输出。
- `docs/*.pdf`：本地留着的 College Board 材料，不放进仓库。课程正文不依赖这些 PDF 也能运行。
