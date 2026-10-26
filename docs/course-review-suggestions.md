# 课程审查记录与建议

> 2026-10-25/26 · 六轮审查汇总（课程 1–50 课全部完成审查，含期末卷；题库 13 页）
> 验证方式：`npm run typecheck` + `npx vitest run`（69 测试）+ `npm run build`（63 页 SSG 预渲染）+ 对照 `docs/ap-csa-ced.pdf` 核实事实性表述 + 全站题目结构化提取脚本。
> 当前状态：**63 页全部构建通过；全站约 240 道选择题、60+ 填空/Parsons、40+ 代码题、8 道 FRQ（含 canonical solution 与评分标准）答案全部复核完毕**。

---

## 〇″、第六轮（全站题目答案总复核，2026-10-26）

**方法**：脚本提取全站 64 个 mdx 文件的全部练习（约 630 行清单），机械校验（答案 id 必须存在于选项、填空空位数=答案数、无重复 id）+ 全清单人工逐题验算 + 8 道 FRQ canonical solution 对照示例表复验 + 新文件 `final-exam.mdx`（order 50，20 题期末摸底卷）全审。

**机械校验结果**：全绿（无标答引用不存在的选项、无空位/答案错位）。

**修复 3 处**：
- `final-exam.mdx`（新文件，20 题全部验算**正确**）：fx-q3 解析口诀语病（「乘几就有十二种结果」通式与具体数混淆）→ 改「乘 12 就有 12 种结果、加 10 就从 10 起步」；
- `mock-exam-plan.mdx`：「最后一课」表述与新增的第 50 课（期末卷）矛盾 → 改「收官的知识课」；
- `redteam-u4.mdx`：作者 23:10 的自行修订（rt4-l1-grow 解析补充「非空列表才真死循环」对照）经复验**正确**（size=1 时 i 永远落后 size 一步），无需改动。

**验算通过记录**（本轮复核、无错误）：期末卷 20 题（含 (int)7.9*2=14、substring(1,4)="omp"、random*12+10∈[10,21]、while 4 轮、1+3+5=9、3×2=6 颗星、短路 false、aliasing 150、static sold=3、remove 左移 get(1)=15、new int[4][6] → 4/6、mystery(2)=20）；四张单元检测卷 60 题；题库 83 题；全部课程内 MCQ；8 道 FRQ canonical solution 逐一对示例表追踪（FRQ2 三段调用串、FRQ7 计票返回 Lin、FRQ8 列和 9/11/3 → 列 1、FRQ5b "1.go 2.go 3.power"）；Parsons 解析中的数值声明（259、21、33、B=85 分级）。换算表两处口径经推敲一致（composite 65–70 落在历年 5 分线浮动带 62–70 内，「稳 5」定在 70 与速查表 14–16 → 4–5 吻合）。

---

## 〇′、第五轮（23–49 课全量审查）新修复的问题

作者当天完成了全部课程（order 23–49：P2/P3/P4 项目课、红队日②、Unit 3 全部、Unit 4 全部、模块 C 冲刺课）。逐课审查 27 个新文件，修复：

| 文件 | 问题 | 修复 |
| --- | --- | --- |
| `recursion.mdx` / `files-and-datasets.mdx` 等 **7 个文件** | **构建崩溃**：`options":[` 笔误（属性名后多了引号），共 9 处 | 全库 python 扫描统一修复 |
| `mock-exam-plan.mdx` | **构建崩溃**：考试日心法 Callout 漏写 `</Callout>`（写成 `。" />`） | 补闭合标签 |
| `frq-2-data.mdx` / `2d-array-algorithms.mdx` | **MDX 解析崩溃**：正文里裸写二维数组字面量 `{{3,7},{9,1}}`，花括号被解析为 JSX 表达式 | 行内代码包裹 |
| `project-p3-canteen.mdx` | **算术错误**：a3 余额 5.0「消费 5 两次（第二次失败）」——第一次按边界规则（5.0 >= 5.0）会成功，余额应为 0.0，任务与验收两处均误写「仍剩 5.0」 | 改为 0.0 并把边界教学点写明 |
| `unit-3-review.mdx` | q8 沿用构造器课的残缺句式；手写任务参考课次「第 30、31 课」应为 28–30；「课程进度 32/49」总数与实际计划不符 | 三处修正 |
| `bluebook-training.mdx` | 「Math 六法」——Quick Reference 上 Math 是 4 法（abs 双版本占 5 行） | 改「Math 四法（abs 双版本）」 |
| `searching-sorting.mdx` | 「1000 个有序数最多 10 次出头」——精确值是最多 10 次 | 已改 |
| `frq-2-data.mdx` | 「改签名直接丢整题的分」过重——官方规则是丢 algorithm 点，non-algorithm 点仍可独立得分 | 改准 |
| `arraylist-basics.mdx` | Parsons 解析提到不存在的「空行」；CodeExercise 把 ArrayList 说成「数组」；hint 给出完整答案行 | 三处修正 |
| `constructors-encapsulation.mdx` | ctor-overload 选项 b 句子残缺（「new Student 括号里带一个字符串」）；setScore hint 泄题 | 修正 |
| `methods-in-classes.mdx` | withdraw hint 给出完整实现；「只信任地初始化」拗口 | 修正 |
| `static-members.mdx` | 「下一课是 FRQ Q2 首演」跳过了中间的 P3 项目课（order 30） | 改为 P3 + Q2 首演 |

**验算通过、无需修改的内容**（抽查记录）：unit-2-review 15 题、unit-3-review 15 题、unit-4-review 15 题全部答案正确；红队日②的死循环/越界/三虫题、2d-arrays 的 9 vs 15、列求和 9、findRow 返回行、recursion 的 fact(5)=120 与 mystery(3)=6、P4 的 readBank、mcq-strategy 三道全英文样题（63 / 2 / remove(1)）、frq 实战课的 reverse("cat")="tac" 与 countAbove(60)=2——逐一心算追踪，全部与标注答案一致。「下一课」链条 1→49 全站 27 处引用全部对位。

**给写课工具链的两条新教训**（并入第三节规范）：
- `options":[`（引号代替等号）是高频手误，已全库清零；建议编辑器加 snippet 或写课前跑 `grep -n 'options":' *.mdx`；
- **正文里裸写 `{{...}}` 会被 MDX 当 JSX 表达式**（构建报 acorn 错）——正文中出现二维数组/对象字面量一律用行内代码包住。

---

## 〇、第四轮（终检）新修复的问题

全量重读 22 课 + 全库交叉引用扫描（27 处「第 N 课 / 上一课 / 下一课」逐条比对）：

| 文件 | 问题 | 修复 |
| --- | --- | --- |
| `unit-1-review.mdx` | **答案键错误**：q12 `"potato".indexOf("to")` 标答给 2，但索引 2 的 t 后面是 a（"ta"），真正的 "to" 在索引 4——解析还错误解释「索引 4 是第二次出现」 | 标答改为 4（选项 d），解析重写（indexOf 匹配连续子串，不是单个字符） |
| `nested-loops.mdx` | **填空答案顺序颠倒**：第一空（外层边界）应填 n、第二空（内层边界）应填 i，`answers={['i','n']}` 恰好反了——学生按正确逻辑作答会被判错；构建只校验数量、查不出顺序 | 改为 `answers={['n','i']}` |
| `nested-loops.mdx` | 「这是**下一课**效率分析的铺垫」——下一课是 loop-algorithms（21），效率分析是 22 | 改为「后面『效率直觉』一课的铺垫」 |
| `ai-as-tutor.mdx` | 「还记得第 4 课之前学的内容里……编译和运行的区别」——该概念第 8 课才教，第 4 课学生未见过 | 改为「很多同学在后面学 Java 时最容易糊的概念……现在提前扫掉，一举两得」 |
| `welcome.mdx` | 错字「把 AI 当答案机会伤害长期学习」（应为「答案机，会伤害」） | 已改 |

交叉引用核对通过（无需改）：ai-as-tutor→第 7 课学术诚实 ✓；boolean→第 14 课 equals ✓；casting→第 10 课口诀/第 13 课随机公式 ✓；objects→第 15/17 课 ✓；loop-algorithms→第 14 课 countVowels ✓；while→第 11 课 for ✓；variables→第 5 课四步循环 ✓；各课「下一课」链条 8→…→22 全部对位 ✓；welcome→第 8 课 ✓。

**给后续写课的两条新教训**（并入第三节规范）：
- `indexOf` 类题写完务必亲手逐字符验证（potato 事故：想当然把「找到 t」当成了「找到 to」）；
- FillBlank 的 `answers` 顺序 = `???` 出现顺序，多空位时逐空对照（nested 事故：内容对、顺序反）。

---

## 一、本轮（第三批）已修复的问题

新增 6 课：if-else(18)、while-loops(19)、loop-algorithms(21)、runtime-analysis(22)，及上批的补查。

| 文件 | 问题 | 修复 |
| --- | --- | --- |
| `loop-algorithms.mdx` | **构建崩溃**：`prompt="...\"banana\"..."` 里用了 `\"` 转义，JSX 属性不支持，MDX 解析直接报错 | 改为 `prompt={'...("banana")...'}` 表达式写法 |
| `loop-algorithms.mdx` | 「累加器放循环体内每轮清零，最终永远是最后一个数的值」表述不准（放循环内则是循环外不可见） | 改为「每轮重新归零，累加只剩当前一轮的数，且循环结束后不可见」 |
| `runtime-analysis.mdx` | **答案键错误**：rt-compare 正确选项 b 标签写「25 倍」，但其算式与解析都是 10000÷200=**50 倍**，且干扰项 c 恰为「50 倍」 | b 标签改为带算式的 50 倍，c 换成「100 倍」 |
| `runtime-analysis.mdx` | 「循环头里的 `i++` 是 n+1 次」——错，`i++` 执行 n 次，n+1 次的是**条件判断**（下一条自己写对了，前后矛盾） | 统一口径：i++ 为 n 次，条件判断 n+1 次（与 for-loops 解剖表一致） |
| `runtime-analysis.mdx` | 两处「上一课」指代错误：「上一课的乘法和加法」「上一课的三角形」——上一课是 loop-algorithms，两者都不在其中；三角形属于尚未写的嵌套循环课 | 去掉指代 / 改为「嵌套循环一课的三角形」 |
| `if-else.mdx` | 闰年题 hint 3 直接给出完整答案行 `return (year % 4 == 0 && ...) || year % 400 == 0;` | 改为方向性提示（先拼「且」段加括号，再用 ‖ 接「被 400 整除」） |
| `while-loops.mdx` | 「三要素分散在**四处**」笔误 | 改为「三个地方」 |
| `while-loops.mdx` | 每日一虫选项 a 的标签是自问自答式的混乱文本（先说「死循环：」再自我推翻） | 重写为清晰表述「循环方向用反了……只会打印一个 5 就退出」 |

已核对无误的内容（供后续审查免重查）：1000 不断除 2 需 10 步 ✓；do-while 不在考纲 ✓；闰年规则与测试用例 ✓；digitSum(406)=10 ✓；while-count 3 次、while-infinite 选 c（2,5,8,11… 跳过 10）✓；1–100 中 3 的倍数 33 个 ✓；countLetter 三个测试值 ✓；rt-condition 内层条件判断 6 次 ✓；检索练习「25 次体、30 次判断」✓。

---

## 二、前两批已修复问题的归类摘要

**功能性/技术错误（会导致页面崩溃或题目无解）**
- for-loops 填空 `i ??= 2` 两个问号不被识别为空位 → 空位与答案错位，**题目永无解**，且答案数不符时 SSG 直接抛错。改 `???=` + 三个答案。
- java-setup 改错题宣称 3 处错误实有 2 处（花括号是配平的）→ 删掉多余的 `}` 使第三处真实存在。
- casting-and-range 填空注释 `// 3.5` 算错，实为 4.5。

**答案键/事实错误**
- unit-1-review q15 干扰项 `2A5`（字符串拼接）与正确答案 7 类型不符 → 改 `2`。
- bug-hunt「选择题里权重 37–53%」→ CED 里是**选择题部分**的 Practice 3 权重（p.146）。
- ai-hygiene「官方教师手册」→ 应为 CED 本身（AI 专节在印刷页 128 已核实存在）。
- for-loops「多打了一枪的倒计时」标题与虫子实际行为（一次都不执行）矛盾 → 改「一声不吭的倒计时」。

**课程连贯性**
- for-loops 开头「上一模块你已经会写 while」——当时 while 课不存在 → 重写为从零引入循环三要素（现在 while 课 order 19 正确回指「第 11 课你学 for 时见过它的祖先」，闭环成立）。
- variables 课末指向不存在的《对象与方法初识》→ 改为实际的下一课 for-loops。
- bug-hunt 承诺「每节课都有一道每日一虫」→ 改「每节常规课」并在 variables 补了一道（平均分 3.0 虫）。
- prompting-basics 两处「Unit 2 的 for 循环」与重构后课程结构矛盾 → 去掉单元号。
- java-setup 两处「8 行」Hello World 实为 5 行。

**与课程自身护栏理念矛盾：hint 泄题（单条提示含完整答案行）**
已修 5 例：celsius（variables）、distance（objects）、isEven（boolean）、average（casting）、isLeapYear（if-else）。统一标准：**任何单条 hint 不得包含完整可提交的答案行**；多行题的 hint 各揭示一块（sumTo、digitSum、countLetter 的分块式可接受）。

**上手性优化**
- java-setup macOS 安装：Adoptium `.pkg` 升为首选（brew 装完需按 Caveats 补软链接，否则 `java --version` 找不到——对第一课学生是隐形坑）。
- welcome 首次 AI 对话补 starterMessage 模板（降低零基础学生第一次发消息的门槛）。
- project-p1 补 Callout 说明 `equalsIgnoreCase` 是 Quick Reference 表外方法、与审查四问的关系（表外方法可用但须能说清理由）。
- objects-and-methods「Math 只有 5 个方法」与表格 4 行不符 → 写清 abs 两个重载占 5 行。
- for-loops 解剖表「条件每轮 1 次」→「比循环体多 1 次」（n+1 次判断，AP 爱考）。

---

## 三、写作规范建议（防止同类错误再犯）

这些建议来自真实事故，建议并入 `src/app/authoring` 页或大纲第 8 节「实施清单」：

1. **FillBlank 空位必须用 3 个及以上问号**（`???`），两个问号不识别；`answers` 数组长度必须与空位数严格相等——否则页面在构建时抛错（这其实是好事：**写完课务必跑 `npm run build` 兜底**，vitest 不渲染 MDX 抓不到）。
2. **JSX 属性里不能写 `\"` 转义**。属性值里需要双引号（如方法调用示例）时，统一用 `prompt={'...("banana")...'}` 表达式；含换行的题目用 `question={'...\n...'}`。
3. **hint 三条是渐进脚手架**：给方向、给结构、给拼装顺序；任何单条不得等于完整答案行。
4. **选项标签里出现计算结果时，必须与 explanation 复核一致**（rt-compare「25 倍 vs 50 倍」事故）；选项类型也要与题意一致（`2A5` 事故）。
5. **课末「下一课」指针容易过期**。建议：写新课/调 order 后全局搜索「下一课」核对一遍；或模板改为只写主题不写课名。
6. **while/for 与 i++、条件判断的执行次数口径全站统一**：`i++` n 次、条件判断 n+1 次、循环体 n 次（for-loops 解剖表、runtime-analysis 注意事项两处已统一）。

---

## 四、结构性建议（需要作者决策）

1. **for-loops 的分组归属**：for-loops（order 11）在「Unit 1」组，而 boolean/if/while（17–19）在「Unit 2」组。与 CED 单元划分及 welcome 路线图（Unit 2 = 条件与循环）不一致。三个选项：
   - a. 保持现状（项目 P1 需要循环，提前教是**项目驱动**的特色），但在 welcome 路线图加一句注记「for 循环因项目需要提前至 Unit 1」；
   - b. 把 for-loops 挪到 Unit 2 组（order 需重排，且 P1 项目依赖会被破坏）；
   - c. 维持两处现状。
   **建议 a**：改动最小、叙事自洽（while 课已回指第 11 课形成闭环）。
2. **大纲文档 `apcsa-ai-curriculum-plan.md` 已与实际严重脱节**：实际 order 8–22 全部重排（bug-hunt 9、项目 P1 12、objects 13、strings 14、casting 15、复习 16、boolean 17、if 18、while 19、loop-algorithms 21、runtime 22），新增了「每日一虫」「VibeCoding 项目线」大纲里没有的体系。**强烈建议在继续批量写 Unit 2 剩余课前同步更新**，否则按旧表编号会撞 order。
3. **order 20 目前空缺**（19 while → 21 loop-algorithms）。若留给 nested-loops，注意 runtime-analysis 已回指「嵌套循环一课的三角形」——nested-loops 落地后此回指即可兑现；同时 runtime-analysis 的依赖型嵌套（1+2+…+n）与 nested-loops 的三角形是同一例子，两课分工要错开（一个教追踪、一个教计数）。
4. **每日一虫覆盖现状良好**：10–22 课除 unit-1-review（复习课，可豁免）外每课一道。保持即可；新写课请延续「L1 圈错行 → L2 说病根 →（可选）L3 动手修」的三级结构。
5. **工程防线**：建议把 `npm run build` 写进每课交付清单；更进一步可给 `tests/content.test.ts` 加一条静态校验——从 MDX 源码统计 `FillBlank` 块内 `\?{3,}` 数量并与 `answers={[...]}` 数组长度比对，能在不构建的情况下更早报错并指明课名。
6. **在线 IDE 备选**：java-setup 提到 replit 兜底——replit 免费层近年大幅缩水，建议补充一个免注册备选（如 OnlineGDB）或注明可能需要付费账户。
7. **LLM 并发限制**（大纲 7.5 已记录）：共享端点 2–3 并发即 502，课堂部署前需换商业 key 或改成小组轮流——继续保留提醒。
8. **隐私文案**：ai-hygiene「课程聊天组件的隐私说明也写了这一点」——若 LLMPractice 组件实际没有隐私说明文案，此句需删或补组件文案（建议核对一次）。

---

## 五、审查方法备忘（复现用）

```bash
cd openlesson
npm run typecheck          # 类型
npx vitest run             # 69 个单元测试（不渲染 MDX）
npm run build              # 关键：SSG 预渲染逐页执行 FillBlank 校验等，页面级错误在这里暴露
```

事实性表述对照 `docs/ap-csa-ced.pdf`（已核实：印刷页 128 AI 专节、p.146 Practice 权重、do-while 不考、Math 类 JQR 清单等）。
