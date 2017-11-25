const ACTIONS = {
  ON: "@@redux-listener/ON",
  OFF: "@@redux-listener/OFF",
  QUERY: "@@redux-listener/QUERY"
};

const PROMISE_KEY = "@@promise";

function isPromise(obj) {
  return !!obj && typeof obj.then === "function";
}

// Create initial listeners with internal action listeners
function createListeners() {
  const listeners = {
    [ACTIONS.ON]: action => {
      const { type, listener } = action.payload;
      listeners[type] = listener;
      return listener;
    },
    [ACTIONS.OFF]: action => {
      const { type } = action.payload;
      const listener = listeners[type];
      if (listener) {
        delete listeners[type];
      }
      return listener;
    },
    [ACTIONS.QUERY]: action => {
      const { type } = action.payload;
      return listeners[type];
    }
  };
  return listeners;
}

// Create a new middleware with extra arguments
export function createListenerMiddleware(extraArgument) {
  const listeners = createListeners();
  return ({ dispatch, getState }) => next => action => {
    if (typeof action !== "object" || !action.type) {
      return next(action);
    }
    const listener = listeners[action.type];
    let result;
    if (listener) {
      const promise = listener(action, dispatch, getState, extraArgument);
      result = next(action);
      if (typeof result === "object") {
        Object.defineProperty(result, PROMISE_KEY, {
          get: () => (isPromise(promise) ? promise : Promise.resolve(promise))
        });
      }
    } else {
      result = next(action);
    }
    return result;
  };
}

// Add an action listener
export function on(type, listener) {
  return {
    type: ACTIONS.ON,
    payload: {
      type,
      listener
    }
  };
}

// Remove an action listener
export function off(type) {
  return {
    type: ACTIONS.OFF,
    payload: {
      type
    }
  };
}

// Query an action listener
export function query(type) {
  return {
    type: ACTIONS.QUERY,
    payload: {
      type
    }
  };
}

// Attach to the dispatch result, return a Promise of the result of action listener
export function attach(target) {
  const result = target[PROMISE_KEY];
  return isPromise(result) ? result : Promise.resolve(result);
}
