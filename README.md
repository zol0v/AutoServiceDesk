# Лабораторная работа 4  
## Категории и управление пользователями  
### Auto Service Desk

В данной лабораторной работе в проект **Auto Service Desk** был добавлен административный функционал для работы с категориями услуг автосервиса и ролями пользователей.

## Что сделано

### Серверная часть
- добавлена сущность `Category`
- обновлен `AppDbContext`
- создана миграция `InitialLab4`
- реализован `CategoryService`
- реализован `UserAdminService`
- добавлен `CategoriesController`
- добавлен `UsersController`
- выполнен сидинг категорий и тестовых пользователей
- настроено логирование административных действий
- сохранена JWT-аутентификация с ролями `Client`, `Master`, `Admin`

### Клиентская часть
- добавлены API-модули:
  - `client/src/api/categories.ts`
  - `client/src/api/users.ts`
- реализована страница администратора `CategoriesPage`
- реализована страница администратора `UsersPage`
- подключен `TanStack Query`
- настроены маршруты `/admin/categories` и `/admin/users`
- выполнено разграничение доступа по ролям
- обновлено меню администратора

## Структура ролей
- **Client** — клиент автосервиса
- **Master** — мастер, который будет работать с заявками в следующих лабораторных
- **Admin** — администратор системы

## Основные backend endpoints

### Категории
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `PATCH /api/categories/{id}/active`

### Пользователи
- `GET /api/users`
- `PUT /api/users/{id}/role`

### Авторизация
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Тестовые пользователи

### Администратор
- `admin@demo.com`
- пароль: `Admin123!`

### Мастера
- `master1@demo.com`
- пароль: `Master123!`

- `master2@demo.com`
- пароль: `Master123!`

### Клиенты
- `client1@demo.com`
- пароль: `Client123!`

- `client2@demo.com`
- пароль: `Client123!`

- `client3@demo.com`
- пароль: `Client123!`

## Начальные категории
- Диагностика двигателя
- Плановое ТО
- Подвеска и ходовая
- Тормозная система
- Электрика
- Кузовной ремонт
