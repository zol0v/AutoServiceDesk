# Лабораторная работа 5  
## Заявки  
### Auto Service Desk

В данной лабораторной работе в проект **Auto Service Desk** был добавлен основной домен системы — заявки клиентов на ремонт и обслуживание автомобиля.

## Что сделано

### Серверная часть
- добавлена сущность `Ticket`
- добавлены перечисления `TicketStatus` и `TicketPriority`
- обновлен `AppDbContext`
- добавлены DTO для Tickets API
- добавлен `PagedResponse<T>`
- реализован `TicketMapping`
- создан интерфейс `ITicketService`
- реализован сервис `TicketService`
- добавлен `TicketsController`
- создана миграция `InitialLab5`
- выполнен сидинг demo-тикетов
- сохранена работа ролей `Client`, `Master`, `Admin`

### Клиентская часть
- добавлен API-модуль `client/src/api/tickets.ts`
- реализованы компоненты:
  - `TicketStatusTag`
  - `TicketPriorityTag`
- реализована страница `TicketsPage`
- реализована страница `NewTicketPage`
- реализована страница `TicketDetailPage`
- подключена фильтрация по статусу и категории
- реализована интеграция с TanStack Query
- использованы существующие маршруты `/tickets`, `/tickets/new`, `/tickets/:id`

## Основная логика лабораторной работы

### Для клиента
- клиент может создать новую заявку
- клиент может просматривать только собственные обращения
- клиент может фильтровать список заявок
- клиент может открыть детальную карточку обращения

### Для системы
- заявка сохраняется в базе данных
- статус новой заявки устанавливается сервером как `New`
- автор заявки определяется по текущему пользователю
- категория должна существовать и быть активной

## Роли в проекте
- **Client** — клиент автосервиса
- **Master** — мастер, который будет работать с заявками в лабораторной работе 6
- **Admin** — администратор системы

## Основные backend endpoints

### Заявки
- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/{id}`

### Категории
- `GET /api/categories`

### Авторизация
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Структура модели Ticket
Заявка содержит:
- `Id`
- `Title`
- `Description`
- `Status`
- `Priority`
- `CategoryId`
- `AuthorId`
- `AssigneeId`
- `CreatedAt`

## Статусы заявок
- `New`
- `InProgress`
- `Resolved`
- `Closed`
- `Rejected`

## Приоритеты заявок
- `Low`
- `Medium`
- `High`

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

## Demo-заявки
В сидинг добавлены тестовые обращения клиентов:
- запись на диагностику двигателя
- стук в подвеске на неровностях
- плановое ТО перед поездкой
- проверка тормозной системы
- проблема с электрикой салона

Создать миграцию:
dotnet ef migrations add InitialLab5

Применить миграции:
dotnet ef database update