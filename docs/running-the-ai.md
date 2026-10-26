# 运行 AI 模型的方式（LLMPractice / CodeExercise / VibeCoding 通用）

三个对话式练习组件共用同一个 provider 配置。改完配置后**必须重启 dev server**，然后访问 `http://localhost:3000/api/chat`，返回 `{"configured":true,...}` 即生效。

## 配置机制（二选一）

**本地开发：`llm.config.json`**（项目根目录，已被 .gitignore 排除，不会提交）。仓库里只有空白模板 `llm.config.example.json`，复制后再填写：

```bash
cp llm.config.example.json llm.config.json
```

```json
{ "apiKey": "…", "baseURL": "https://…/v1", "model": "…" }
```

**部署环境：环境变量**（优先级高于文件，切勿加 `NEXT_PUBLIC_` 前缀）：

```
LLM_API_KEY=…   LLM_BASE_URL=…/v1   LLM_MODEL=…
```

校验规则（`src/lib/llm/config.ts`）：三项都必填；`baseURL` 必须是 HTTPS（**http 仅允许 localhost / 127.0.0.1 / [::1]，本地模型正好用这个口子**）；不能带用户名密码、查询串、锚点；填 API 根（以 `/v1` 结尾），不是 `/chat/completions`。留空任一项 = 聊天功能整体禁用，编辑器/排序/填空等本地练习不受影响。

## 方式 A：本地跑模型（免费、离线、数据不出机器）

**Ollama（推荐）**

```bash
brew install ollama          # 或从 ollama.com 下载
ollama pull qwen2.5:7b-instruct   # 中文讲解好、有代码能力；也可选 glm4、deepseek 系列蒸馏版
ollama serve                 # 桌面版 App 会自动起服务
```

```json
{ "apiKey": "ollama", "baseURL": "http://localhost:11434/v1", "model": "qwen2.5:7b-instruct" }
```

`apiKey` 随便填非空即可；`model` 用 `ollama list` 里显示的名字。7B 级别约需 8GB 内存。

**LM Studio（图形界面）**：下载模型 → Developer 页启动 Local Server → `baseURL` 填 `http://127.0.0.1:1234/v1`，`model` 填界面显示的标识。

提醒：本地 7–9B 模型的教学讲解质量明显弱于云端大模型，流式速度取决于机器；适合先跑通流程，正式上课建议云端。

## 方式 B：云端 API（效果好、按量付费、需 key）

均为 OpenAI 兼容端点，直接换 `baseURL` + `model` + `apiKey`（具体 model 名以各家控制台为准）：

| 提供商 | baseURL | 备注 |
|---|---|---|
| DeepSeek 官方 | `https://api.deepseek.com/v1` | 便宜、中文强，教学性价比高 |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | 有免费档位 |
| Moonshot Kimi | `https://api.moonshot.cn/v1` | 长上下文 |
| OpenAI | `https://api.openai.com/v1` | 贵 |
| SiliconFlow 等聚合 | `https://api.siliconflow.cn/v1` | 一个 key 多个开源模型 |

**给学生用之前的检查单**（详见站内 Authoring guide「Connect a model」）：看提供商的数据保留与未成年人政策；配置内容审核；公开部署时在边缘加真正的限流（服务端现有限流是单进程 best-effort，本地每分钟 10 次请求）。

## 快速排障

```bash
# 1. 服务端返回 502/503？
curl http://localhost:3000/api/chat          # configured:false → 配置没生效（没重启/格式错）

# 2. 直测 provider，绕过本站：
curl "$BASE_URL/chat/completions" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"model":"'$MODEL'","messages":[{"role":"user","content":"hi"}],"max_tokens":20}'
```

- 401 → key 错；404 → baseURL 少了 `/v1` 或多了 `/chat/completions`；超时 → 换端点或用本地模型。
- 教练人设（`code-reviewer`、`socratic-tutor` 等）在 `src/lib/llm/config.ts` 的 `PRESETS` 里，纯服务端控制。
