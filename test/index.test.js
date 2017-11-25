import { expect } from "chai";
import { createStore, applyMiddleware } from "redux";
import { createListenerMiddleware, on, off, query, attach } from "../src/index";

function setup() {
  const dispatchedActions = [];
  const increment = value => ({
    type: "INCREMENT",
    payload: {
      value
    }
  });
  const reducer = (state, action) => {
    if (action.type !== "@@redux/INIT") {
      dispatchedActions.push(action);
    }
    return state;
  };
  const listenerMiddleware = createListenerMiddleware("EXTRA");
  const store = createStore(reducer, applyMiddleware(listenerMiddleware));
  return {
    dispatchedActions,
    increment,
    store
  };
}

describe("listener middleware", () => {
  it("Dispatch an action without registering any listener, counter should be changed", () => {
    const { dispatchedActions, increment, store } = setup();
    let counter = 0;
    store.dispatch(increment(2));
    expect(dispatchedActions).to.deep.equal([
      {
        type: "INCREMENT",
        payload: {
          value: 2
        }
      }
    ]);
    expect(counter).to.equal(0);
  });

  it("Dispatch an action with registering any listener, counter should be incremented by passed value", async () => {
    const { dispatchedActions, increment, store } = setup();
    let counter = 0;
    const listener = (action, dispatch, getState, extraArgument) => {
      expect(extraArgument).to.equal("EXTRA");
      return new Promise(resolve => {
        setTimeout(() => {
          const { value } = action.payload;
          counter += value;
          resolve(`result: ${counter}`);
        }, 100);
      });
    };
    store.dispatch(on("INCREMENT", listener));
    const result = store.dispatch(increment(2));
    expect(counter).to.equal(0);
    expect(dispatchedActions).to.deep.equal([
      {
        type: "@@redux-listener/ON",
        payload: {
          type: "INCREMENT",
          listener
        }
      },
      {
        type: "INCREMENT",
        payload: {
          value: 2
        }
      }
    ]);
    expect(result).to.deep.equal({
      type: "INCREMENT",
      payload: {
        value: 2
      }
    });
    const listenerResult = await attach(result);
    expect(listenerResult).to.equal("result: 2");
    expect(counter).to.equal(2);
  });
});
