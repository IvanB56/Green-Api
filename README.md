# MAX Chat — GREEN-API

Простой веб-чат на React + TypeScript для отправки и получения текстовых сообщений в мессенджере MAX через [GREEN-API](https://green-api.com/max).

## Запуск

```bash
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`.

## Как пользоваться

1. При входе укажите `apiUrl`, `idInstance` и `apiTokenInstance` вашего инстанса из личного кабинета GREEN-API.
2. Нажмите «+» в списке чатов и введите номер телефона получателя — так создастся новый чат.
3. Напишите сообщение и отправьте его — оно уйдёт получателю в MAX методом `SendMessage`.
4. Ответы получателя появляются в чате автоматически: приложение в фоне опрашивает `ReceiveNotification`/`DeleteNotification`.

Учетные данные и история переписки хранятся локально в браузере (`localStorage`).

## Как это устроено

- `src/types.ts` — общие типы (учетные данные, чаты, сообщения, формы ответов GREEN-API).
- `src/api/greenApi.ts` — тонкий клиент над HTTP API GREEN-API (`getStateInstance`, `sendMessage`, `receiveNotification`, `deleteNotification`).
- `src/context/AuthContext.tsx` — хранение учетных данных и проверка их валидности при входе.
- `src/context/ChatsContext.tsx` — чаты, сообщения и цикл long-polling входящих уведомлений.
- `src/components/*` — экран входа, список чатов, окно диалога, оформленные по мотивам интерфейса web.max.ru.

`npm run build` сначала проверяет типы (`tsc -b`), затем собирает проект через Vite.
