# Auto Service Desk — Lab 3 (Authorization: Backend + Frontend)

Клиент-серверное приложение **Auto Service Desk** с реализованной авторизацией на **ASP.NET Core 8 + Identity + JWT** и клиентом на **React 18 + TypeScript + Vite**, с **Ant Design 5**, **React Router v6** и **TanStack Query v5**.

## Что сделано (Lab 3)
- Реализована серверная часть на **ASP.NET Core Web API**.
- Подключены:
  - **ASP.NET Core Identity**
  - **Entity Framework Core**
  - **SQL Server / LocalDB**
  - **JWT Bearer Authentication**
  - **Swagger UI**
- Реализованы:
  - `ApplicationUser` с дополнительным полем `DisplayName`
  - `AppDbContext`
  - роли пользователей:
    - `Client`
    - `Operator`
    - `Admin`
  - JWT access token
  - Auth endpoints:
    - `POST /api/auth/register`
    - `POST /api/auth/login`
    - `GET /api/auth/me`
    - `GET /health`
  - dev-seeding ролей и тестовых пользователей
  - глобальная обработка ошибок через `ProblemDetails`
- На клиенте доработаны:
  - `AuthContext`
    - `token` хранится в `localStorage`
    - `init()` вызывает `/api/auth/me`
    - `login()` вызывает `/api/auth/login`
    - `register()` вызывает `/api/auth/register`
    - `logout()` очищает `localStorage`
  - страницы:
    - `LoginPage`
    - `RegisterPage`
  - proxy в `vite.config.ts` для запросов на `/api`
  - редиректы по ролям после входа/регистрации
- Сборка клиента проверяется командой: `npm run build`
- Сервер запускается командой: `dotnet run`

## Маршруты
Public:
- `/login`
- `/register`

Client:
- `/tickets`
- `/tickets/new`
- `/tickets/:id`

Operator:
- `/queue/new`
- `/queue/assigned`
- `/queue/resolved`
- `/tickets/:id`

Admin:
- `/admin/categories`
- `/admin/users`

## Backend API
Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Service:
- `GET /health`

Swagger:
- `/swagger`

## Тестовые пользователи (Development)
- `admin@demo.com / Admin123!`
- `operator1@demo.com / Operator123!`
- `operator2@demo.com / Operator123!`
- `client1@demo.com / Client123!`
- `client2@demo.com / Client123!`
- `client3@demo.com / Client123!`

## Как запустить сервер
Из корня репозитория:

```bash
cd server/ServiceDesk.API
dotnet restore
dotnet ef database update
dotnet run