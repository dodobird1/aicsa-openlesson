# AP CSA CED（Effective Fall 2025）精读笔记

> 来源：`docs/ap-csa-ced.pdf`（194 页）精读报告存档，2026-10-24。
> 页码均为 CED 内页印刷页码（PDF 页 = 内页 + 7）。详细逐 unit 摘要已并入 `apcsa-ai-curriculum-plan.md` 附录 B，此处保留完整原始报告备查。

## 一、课程与考试总览

- 大学等效课程：introductory college CS course；先修：一年代数；语言：Java（考试只覆盖 Java 子集）（p.6）
- 五大 Computational Thinking Practices：1 Design Code（skills 1.A, 1.B）、2 Develop Code（2.A, 2.B, 2.C）、3 Analyze Code（3.A–3.D）、4 Document Code and Computing Systems（4.A, 4.B）、5 Use Computers Responsibly（5.A）（pp.13–14）
- 考试共 3 小时：Section I MCQ **42 题、90 分钟、占 55%**（discrete + set-based 两类题）；Section II FRQ **4 题、90 分钟、占 45%**（p.145）。样题显示 MCQ 为 4 选 1（A–D）（p.149）
- MCQ 中各 Practice 权重：Practice 1: 2–10%、2: 22–38%、3: 37–53%、4: 10–15%、5: 2–10%（p.146）
- Java Quick Reference（JQR）在 **MCQ 和 FRQ 两部分都发给考生**（p.16），完整清单见附录 pp.185–186
- Bluebook：CED 正文不含考试交付平台信息（来自 AP Central 官网）

## 二、单元课时建议（总 73 条 LO）

- Unit 1: Using Objects and Methods —— 15–25%，约 32–34 课时（15 topics，pp.17, 23–52）
- Unit 2: Selection and Iteration —— 25–35%，约 29–31 课时（12 topics，pp.17, 53–72）
- Unit 3: Class Creation —— 10–18%，约 20–22 课时（9 topics，pp.18, 73–90）
- Unit 4: Data Collections —— 30–40%，约 50–52 课时（17 topics，pp.18, 91–122）

完整 topic / LO / 边界声明清单见课程大纲附录 B。

## 三、Scanner/File 读文件（Topic 4.6，pp.105–107）

唯一 LO：**4.6.A Develop code to read data from a text file**。要点：
1. 用 **File 和 Scanner 类**连接文件：`new File(String str)`
2. 方法头加 **throws IOException**；File 与 IOException 属 **java.io** 包，必须 import
3. Scanner 方法（全部进 JQR）：`Scanner(File f)`、`nextInt()`、`nextDouble()`、`nextBoolean()`、`nextLine()`、`next()`、`hasNext()`、`close()`
4. 新增 **`String[] split(String del)`**（正则特殊用法不考）
5. **while + hasNext** 作为读文件循环条件；用完 **close()**

三条排除：**键盘输入不考**；nextLine 与其他 Scanner 方法混用不考；正则特殊用法不考。

## 四、递归确切范围（Topic 4.16–4.17，pp.120–122）

- 4.16 唯一 LO 4.16.A：**Determine the result of calling recursive methods**（只考追踪）
- **排除声明：Writing recursive code 完全不在考试范围内**
- 4.17：递归遍历 trace（String/array/ArrayList）、binary search（要求数据已排序，迭代或递归均可）、merge sort（逐步执行）
- 只考 linear/binary search 与 selection/insertion/merge sort

## 五、FRQ 与 Rubric（pp.145–148, 173–180）

- Q1 Methods and Control Structures **7 分**（Part A 4 分迭代/条件 + 调用给定类方法；Part B 3 分须用 String 方法）
- Q2 Class Design **7 分**（按规格与示例表设计实现一个类）
- Q3 Data Analysis with ArrayList **5 分**
- Q4 2D Array **6 分**
- Task Verbs：Assume、Complete (program code)、Implement/Write

Rubric：每题 1–2 个 **algorithm points**（步骤完整组装）+ 若干 non-algorithm points。Algorithm point 不给分情形：漏必需部分、步骤组装错误、多余代码使解错误、混淆 `[]` vs `.get`、void 方法返回值、改写方法头参数等。

**Errors to Ignore**（不扣分）：无副作用冗余代码、可无歧义推断的拼写、局部变量未声明、局部变量误加 public/private、类/构造器缺 public、数学符号（× ÷ ≤ ≥）、`[]/()/<>` 混淆、`=` 与 `==` 混用、length/size 混淆、`[i,j]` 代替 `[i][j]`、结构清晰时缺 `;` 等。

## 六、实验要求（p.6 及各单元末页）

最低 **20 小时** hands-on structured lab。建议 labs（AP Classroom）：Unit 1 → **Receipt Lab**（p.29）；Unit 2 → **Magpie 2.0 Lab**（p.60）；Unit 3 → **Virtual Pet Lab**（p.79）；Unit 4 → **Data Set Lab、2048 Lab、Digit Recognition Lab**（p.99）。

CED 另含专节 "Artificial Intelligence in AP Computer Science A"（p.128 起）。

## 七、Java Quick Reference 全表（pp.185–186）

**String**：`String(String str)`；`int length()`；`String substring(int from, int to)`；`String substring(int from)`；`int indexOf(String str)`（找不到 −1）；`boolean equals(Object other)`；`int compareTo(String other)`；`String[] split(String del)`

**Integer**：`Integer.MIN_VALUE`；`Integer.MAX_VALUE`；`static int parseInt(String s)`

**Double**：`static double parseDouble(String s)`

**Math**：`static int abs(int x)`；`static double abs(double x)`；`static double pow(double base, double exponent)`；`static double sqrt(double x)`；`static double random()`（≥0.0 且 <1.0）

**ArrayList**：`int size()`；`boolean add(E obj)`；`void add(int index, E obj)`；`E get(int index)`；`E set(int index, E obj)`；`E remove(int index)`

**File**：`File(String pathname)`

**Scanner**：`Scanner(File f)`；`int nextInt()`；`double nextDouble()`；`boolean nextBoolean()`；`String nextLine()`；`String next()`；`boolean hasNext()`；`void close()`

**Object**：`boolean equals(Object other)`；`String toString()`

与旧版相比：不含 Integer/Double 构造器与 `intValue()`/`doubleValue()`；`split`、`File`、`Scanner` 全组为本版新增。
