# Feeding Brennen 工作流程

## Objective

把现有的 Next.js + PostgreSQL 脚手架做成一个可用、可审查的餐厅与外食消费追踪应用：
先严格完成统一的 Restaurant REST API 合约，再交付一个小而完整的自选功能，最后用
`WriteUp.md` 说明设计取舍、接口和验证结果。

## Task 表

| 阶段 | Task | 完成标准 | 状态 |
| --- | --- | --- | --- |
| 0. 准备 | 从官方模板建立个人公开仓库；使用独立开发分支 | 仓库公开，模板来源正确，改动不直接堆在 `main` | 完成 |
| 0. 准备 | 安装并启动 Docker Desktop；运行 `./setup.sh` | `/api/health` 返回 `200 {"status":"ok"}`，数据库已有 seed 数据 | 阻塞：本机未安装 Docker |
| A1 | 修复 Restaurant 列表查询 | `GET /api/restaurants` 返回 `200` 和数组；首页能显示 5 条 seed 数据 | 已编码，待 DB 验证 |
| A2 | 实现 `POST /api/restaurants` | 合法输入写入数据库，返回 `201` 和 contract 规定的 Restaurant | 已编码，待 DB 验证 |
| A2 | 实现 `PUT /api/restaurants/:id` | 存在时返回 `200` 和更新结果；不存在时 `404` | 已编码，待 DB 验证 |
| A2 | 实现 `DELETE /api/restaurants/:id` | 存在时返回无 body 的 `204`；不存在时 `404` | 已编码，待 DB 验证 |
| A3 | 建立运行时输入校验 | malformed JSON、缺字段、类型错误、rating 越界均返回 `400`，且不访问 DB | 已编码，待 DB 验证 |
| A3 | 统一错误映射与资源 ID 校验 | 非正整数 ID 与缺失记录返回 `404`；已知冲突返回 `409`；不泄露数据库细节 | 已编码，待 DB 验证 |
| A 验证 | 逐项执行固定 API contract | 所有成功与失败路径的 HTTP 状态、body shape 完全符合 `CHALLENGE.md` | 待办 |
| B 设计 | 体验现有应用并选一个小而完整的改进 | 有明确用户价值，包含真实 `/api` route，不追求功能数量 | 待办 |
| B 实现 | 完成自选功能的 API、必要 UI、校验和错误处理 | happy path 与失败路径均可用；schema 改动放在新的 `002_*.sql` | 待办 |
| B 验证 | 端到端验证自选功能 | API 与 UI 都能操作，验证命令可复现 | 待办 |
| 交付 | 完成约 300 词 `WriteUp.md` | 解释为什么做、设计/取舍、缩减项、routes、schema、验证和已知问题 | 待办 |
| 交付 | 提交分支并在个人公开仓库开 PR | PR diff 清晰；无关文件、secret、构建产物未提交 | 待办 |
| 交付 | 用无痕窗口检查公开性并提交仓库链接 | 未登录也能打开仓库；提交表单成功 | 待办 |

## 执行原则

- 先完成并验证 Part A，再决定 Part B。
- Part A 以 `CHALLENGE.md` 的状态码和响应结构为唯一验收合约。
- Part B 选择“范围小、端到端完成、理由讲得清”的功能。
- 任何数据库结构变化都新增 migration，不修改 `001_create_tables.sql`。
- 每完成一项就同步更新上表状态，并把真实验证方式记入 `WriteUp.md`。
