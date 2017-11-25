# redux-listener

Dispatch async action listener at any time and do side effect for Redux.

## Installation

``` bash
$ npm install --save redux-listener
```

## Usage

``` js
import { createStore, applyMiddleware } from 'redux';
import { createListenerMiddleware, on, attach } from 'redux-listener';
import rootReducer from './reducers';

const reduxListenerMiddleware = createReduxListenerMiddleware();
const store = createStore(
  rootReducer,
  applyMiddleware(createListenerMiddleware)
);

async function someFunction() {
  // 'on' is a plain action creator to help to add the listenr
  store.dispatch(on('ASYNC_MESSAGE', (action, { dispatch }) => {
    return new Promise(resolve => {
      setTimeout(() => {
        console.info('');
        resolve();
      }, 1000);
    });
  }));

  store.dispatch({
    type: 'INCREMENT_ASYNC',
  });

  const result = await attach(store.dispatch({
  }))
}
```

## Concepts

The basic concept of redux-listener is

> Do dispatch(async listener) for redux action at any time.

To archive this, there are serveral advanced concepts that are designed.

### 1. Action listener is only for side effect, so **the original redux data flow shouldn't be interrupted**.

// Chart

### 2. Register async action listener **on demand** for **any plain redux action**.

Eazy to do code splitting. Just dispatch and add required async action listeners before business logic.

### 3. For one action type, only one listener is allowed.

Easy to make test. You can mock and override any exist listener to test.

So there are only on(type, listener) and off(type, listener), and no addListener and removeListener in order to avoid misunderstanding.

**However multiple listeners can be composed as one listener for one action type.**

There is an example.

``` js
import { query, on, attach } from 'redux-listener';

async function someFunction() {
  const existListener = await attach(dispatch(query('SOME_ACTION_TYPE')));
  dispatch(on('SOME_ACTION_TYPE', async (action, ...args) => {
    // do something
    const originalResult = await existListener(action, ...args);
    // do something
    return originalResult; // Or something else
  }));
}
```

### 4. The async listener should be waitable.

For chaining multiple async action.

``` js
async function someFunction() {
  await attach(dispatch({
    type: "ASYNC_FETCH_SCHOOL_REQUEST",
    payload: {
      schoolId: 3
    }
  }));

  const school = selectSchool(getState(), 3);
  const classroomIds = school.classrooms;

  const classroomPromises = classroomIds.map((id) => {
    return attach(dispatch({
      type: "ASYNC_FETCH_CLASSROOM_",
      payload: {
          classroomId: id
      }
    }));
  });

  await Promise.all(classroomPromises);
  // ...
}
```

### 5. dispatch(), getState() and other extra arguments are available as same as redux-thunk.

But take care of dispatching actions inside the async listener, it may cause infinite loop!!

## INSTALLATION

For npm

``` bash
npm install --save redux-listener
```

For yarn

``` bash
yarn add redux-listener
```

## API

### `createListenerMiddleware([extraArgument])`

Create a new listener middleware with extra argument.

``` js
const store = createStore(
  reducer,
  applyMiddlware(createListenerMiddleware({ api, whatever })),
);

store.dispatch(on('TYPE_OF_ACTION', async (action, dispatch, getState, { api, whatever }) => {
}));
```

### `on(type, listener)`

Adds an action listener for type. The value returned by listener can be accessed by `attach()` function.

``` js
store.dispatch(on('TYPE_OF_ACTION', async (action, dispatch, getState, extraArgument) => {
  // ...
}));
```

#### Arguments

- `type` ( _String_ ): Action type.
- `listener(action, dispatch, getState, extraArgument): Promise or any` ( _Function_ ): Listener for specified action type. The `dispatched action`, `dispatch`, `getState`, `extraArgument` will be passed. Promise is recommended returned type, since the result can be accessed by `attach()`.

### `off(type)`

Removes an action listen for type.

``` js
store.dispatch(off('TYPE_OF_ACTION'));
```

An action creator that is used to remove the listener for type.

### `query(type)`

An action creator that is used to query the registered listener for type. Use `attach(result)` to access the returned listener.

``` js
async function example() {
  const result = store.dispatch(query('TYPE_OF_ACTION'));
  const listener = await attach(result);
}
```

**You can use this function to delegate the exist listener.**

### `attach(dispatchResult)`

Attachs the listener of dispatched action and gets the result.

``` js
async function example() {
  store.dispatch(on('ACTION_TYPE_A', async (action, dispatch, getState, extraArgument) => {
    const { msg } = action.payload;
    return msg;
  }));

  const result = store.dispatch({
    type: 'ACTION_TYPE_A',
    payload: {
      msg: 'Hello'
    }
  });

  const listenerResult = await attach(result);
  console.info(listenerResult); // "Hello"
}
```

## LICENSE

MIT
