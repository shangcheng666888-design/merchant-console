# 店铺管理后台（独立部署）

店主登录、订单、商品仓、运营计划、财务报表、钱包与设置。

## 开发

```bash
cd merchant-console
npm install
npm run dev
```

登录页：`/login`

## 生产构建

```bash
npm run build
```

部署到独立子域（如 `seller.your-domain.com`），配置 `VITE_API_URL` 指向 API。

## 路由

| 路径 | 说明 |
|------|------|
| `/login` | 店主登录 |
| `/dashboard` | 仪表盘 |
| `/orders` | 店铺订单 |
| `/warehouse` | 商品仓库 |
| `/plan` | 运营计划 |
| `/finance` | 财务报表 |
| `/wallet` | 我的钱包 |
| `/settings` | 设置 |
