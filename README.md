Это сайт-органайзер, в котором:
- можно добавлять, редактировать и удалять задачи;
- есть приоритеты, фильтры и поиск;
- считается прогресс выполнения задач;
- можно ставить дату задачи;
- есть календарь с отображением задач по датам;
- интерфейс встроен в экран 3D-телефона (Spline + React Three Fiber);
- на фоне проигрывается видео.

Стек
- React 18
- react-scripts (CRA)
- @react-three/fiber
- @react-three/drei
- @splinetool/r3f-spline
- three
- CSS

Как запустить

1. Установить зависимости:

npm install

2. Запустить проект:

npm start

3. Сборка production:

npm run build

Структура (основное)

- src/App.js — корневая сборка страницы
- src/app/AppContent.js — контент приложения
- src/features/todos — логика и UI задач
- src/features/calendar/CalendarPanel.js — календарь
- src/features/phone/PhoneScene.js — 3D-сцена телефона
- src/features/video/BackgroundVideo.js — видеофон
- src/styles.css — общие стили
