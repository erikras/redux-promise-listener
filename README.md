# Redux Promise Listener

[![NPM Version](https://img.shields.io/npm/v/redux-promise-listener.svg?style=flat)](https://www.npmjs.com/package/redux-promise-listener)
[![NPM Downloads](https://img.shields.io/npm/dm/redux-promise-listener.svg?style=flat)](https://npm-stat.com/charts.html?package=redux-promise-listener)
[![Build Status](https://travis-ci.org/erikras/redux-promise-listener.svg?branch=master)](https://travis-ci.org/erikras/redux-promise-listener)
[![codecov.io](https://codecov.io/gh/erikras/redux-promise-listener/branch/master/graph/badge.svg)](https://codecov.io/gh/erikras/redux-promise-listener)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Redux Promise Listener generates an async function that will dispatch a `start` action, and will resolve or reject the promise when a `resolve` or `reject` action is dispatched.

Libraries like [`redux-promise`](https://github.com/redux-utilities/redux-promise) or [`redux-promise-middleware`](https://github.com/pburtchaell/redux-promise-middleware) are useful for converting promises to actions. Redux Promise Listener _does the inverse_: converting actions to promises.

## Why?

Most of the popular form libraries accept an `onSubmit` function that is expected to return a `Promise` that resolves when the submission is complete, or rejects when the submission fails. This mechanism is fundamentally incompatible with action management libraries like [`redux-saga`](https://redux-saga.js.org), which perform side-effects (e.g. ajax requests) in a way that does not let the submission function easily return a promise. Redux Promise Listener is a potential solution.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Usage](#usage)
  - [Step 1](#step-1)
  - [Step 2](#step-2)
- [API](#api)
  - [`createListener: () => PromiseListener`](#createlistener---promiselistener)
  - [`middleware.generateAsyncFunction: (config: Config) => AsyncFunction`](#middlewaregenerateasyncfunction-config-config--asyncfunction)
- [Types](#types)
  - [`ActionMatcher: Action => boolean`](#actionmatcher-action--boolean)
  - [`PromiseListener`](#promiselistener)
    - [`middleware: Middleware`](#middleware-middleware)
    - [`createAsyncFunction: (config: Config) => AsyncFunction`](#createasyncfunction-config-config--asyncfunction)
  - [`Config`](#config)
    - [`start: string`](#start-string)
    - [`resolve: string | ActionMatcher`](#resolve-string--actionmatcher)
    - [`reject: string | ActionMatcher`](#reject-string--actionmatcher)
    - [`setPayload?: (action: Object, payload: any) => Object`](#setpayload-action-object-payload-any--object)
    - [`getPayload?: (action: Object) => any`](#getpayload-action-object--any)
    - [`getError?: (action: Object) => any`](#geterror-action-object--any)
  - [`AsyncFunction`](#asyncfunction)
    - [`asyncFunction: (payload: any) => Promise<any>`](#asyncfunction-payload-any--promiseany)
    - [`unsubscribe: () => void`](#unsubscribe---void)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

### Step 1

Create and add the middleware as you would with any Redux middleware. Remember to export the middleware!

```jsx
// store.js
import { createStore, applyMiddleware } from 'redux'
import createReduxPromiseListener from 'redux-promise-listener'

const reduxPromiseListener = createReduxPromiseListener()
const store = createStore(
  reducer,
  initialState,
  applyMiddleware(...otherMiddleware, reduxPromiseListener.middleware)
)
export const promiseListener = reduxPromiseListener // <---- ⚠️ IMPORTANT ⚠️

export default store
```

### Step 2

If you are using `react-redux`, [your Step 2 is over here](https://github.com/erikras/react-redux-promise-listener#step-2).

...

Okay, now that those React nerds are gone...

Wherever you need an async function that dispatches one action and listens for others...

```jsx
// someFile.js
import { promiseListener } from './store.js'

const generatedAsyncFunction = promiseListener.generateAsyncFunction(
  'START_ACTION_TYPE', // the type of action to dispatch when this function is called
  'RESOLVE_ACTION_TYPE', // the type of action that will resolve the promise
  'REJECT_ACTION_TYPE' // the type of action that will reject the promise
)

// This structure is in the shape:
// {
//   asyncFunction, <--- the async function that dispatches the start action and returns a Promise
//   unsubscribe    <--- a function to unsubscribe from the Redux store
// }

// dispatches an action { type: 'START_ACTION_TYPE', payload: values }
generatedAsyncFunction.asyncFunction(values).then(
  // called with action.payload when an action of
  // type 'RESOLVE_ACTION_TYPE' is dispatched
  resolvePayload => {
    // do happy stuff 😄
  },

  // called with action.payload when an action of
  // type 'REJECT_ACTION_TYPE' is dispatched
  rejectPayload => {
    // do sad stuff 😢
  }
)

// when done, to prevent memory leaks
generatedAsyncFunction.unsubscribe()
```

## API

### `createListener: () => PromiseListener`

The default export of this library. Creates a Redux middleware, but that also has a function on it called `generateAsyncFunction`

### `middleware.generateAsyncFunction: (config: Config) => AsyncFunction`

## Types

### `ActionMatcher: Action => boolean`

A predicate with which to make decisions about Redux actions.

### `PromiseListener`

An object with the following values:

#### `middleware: Middleware`

Redux middleware that should be used when creating your Redux store.

#### `createAsyncFunction: (config: Config) => AsyncFunction`

Takes a `Config` and returns an object containing the async function capable of dispatching an action and resolving/rejecting a Promise upon the dispatch of specified actions, and a function to unsubscribe this listener from the Redux store.

### `Config`

An object with the following values:

#### `start: string`

The `type` of action to dispatch when the function is called.

#### `resolve: string | ActionMatcher`

The `type` of action that will cause the promise to be resolved, or a predicate function that will return `true` when given the type of action to resolve for.

#### `reject: string | ActionMatcher`

The `type` of action that will cause the promise to be rejected, or a predicate function that will return `true` when given the type of action to reject for.

#### `setPayload?: (action: Object, payload: any) => Object`

A function to set the payload (the parameter passed to the async function). Defaults to `(action, payload) => ({ ...action, payload })`.

#### `getPayload?: (action: Object) => any`

A function to get the payload out of the resolve action to pass to resolve the promise with. Defaults to `(action) => action.payload`.

#### `getError?: (action: Object) => any`

A function to get the error out of the reject action to pass to reject the promise with. Defaults to `(action) => action.payload`.

### `AsyncFunction`

An object with the following values:

#### `asyncFunction: (payload: any) => Promise<any>`

The async function that will dispatch the start action and return a promise that will resolve when the resolve action is dispatched or reject when the reject action is dispatched.

#### `unsubscribe: () => void`

A cleanup function that should be called when the async function is no longer needed.

⚠️ Failure to call `unsubscribe()` may result in a memory leak. ⚠️

If you are using `react-redux-promise-listener`, this is done for you on `componentWillUnmount`.
