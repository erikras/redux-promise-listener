import createListener from './reduxPromiseListener'
import { createStore, applyMiddleware } from 'redux'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('redux-promise-listener', () => {
  describe('redux-promise-listener.middleware', () => {
    it('should not affect existing reducers', () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalled()
      expect(reducer).toHaveBeenCalledTimes(1)
      expect(reducer.mock.calls[0][0]).toBe(initialState)

      store.dispatch({ type: 'TEST' })
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][0]).toBe(initialState)
      expect(reducer.mock.calls[1][1]).toEqual({ type: 'TEST' })
    })
  })

  describe('redux-promise-listener.asyncFunction', () => {
    it('should throw an error if the middleware is not installed', async () => {
      const { createAsyncFunction } = createListener()
      expect(() =>
        createAsyncFunction({
          start: 'START',
          resolve: 'RESOLVE',
          reject: 'REJECT'
        })
      ).toThrow('The redux-promise-listener middleware is not installed')
    })

    it('should dispatch start action and resolve on resolve action', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: 'START',
        resolve: 'RESOLVE',
        reject: 'REJECT'
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        payload: 'foo',
        meta: { id: expect.any(String) }
      })

      await sleep(1)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      await sleep(1)

      store.dispatch({ type: 'RESOLVE', payload: 'bar' })

      await sleep(1)

      expect(resolve).toHaveBeenCalled()
      expect(resolve).toHaveBeenCalledTimes(1)
      expect(resolve.mock.calls[0][0]).toBe('bar')
      expect(reject).not.toHaveBeenCalled()
    })

    it('should dispatch start action using a function', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: ({ payload }) => ({ type: 'START', payload }),
        resolve: 'RESOLVE',
        reject: 'REJECT'
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        payload: 'foo'
      })

      await sleep(1)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      await sleep(1)

      store.dispatch({ type: 'RESOLVE', payload: 'bar' })

      await sleep(1)

      expect(resolve).toHaveBeenCalled()
      expect(resolve).toHaveBeenCalledTimes(1)
      expect(resolve.mock.calls[0][0]).toBe('bar')
      expect(reject).not.toHaveBeenCalled()
    })

    it('should dispatch start action and resolve on resolve action when passed a matcher function', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: 'START',
        resolve: action => action.type === 'RESOLVE',
        reject: action => action.type === 'REJECT'
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        payload: 'foo',
        meta: { id: expect.any(String) }
      })

      await sleep(1)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      await sleep(1)

      store.dispatch({ type: 'RESOLVE', payload: 'bar' })

      await sleep(1)

      expect(resolve).toHaveBeenCalled()
      expect(resolve).toHaveBeenCalledTimes(1)
      expect(resolve.mock.calls[0][0]).toBe('bar')
      expect(reject).not.toHaveBeenCalled()
    })

    it('should dispatch start action and reject on reject action', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: 'START',
        resolve: 'RESOLVE',
        reject: 'REJECT'
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        payload: 'foo',
        meta: { id: expect.any(String) }
      })

      await sleep(1)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      await sleep(1)

      store.dispatch({ type: 'REJECT', payload: 'bar' })

      await sleep(1)

      expect(resolve).not.toHaveBeenCalled()
      expect(reject).toHaveBeenCalled()
      expect(reject).toHaveBeenCalledTimes(1)
      expect(reject.mock.calls[0][0]).toBe('bar')
    })

    it('should dispatch start action and reject on reject action when passed a matcher function', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: 'START',
        resolve: action => action.type === 'RESOLVE',
        reject: action => action.type === 'REJECT'
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        payload: 'foo',
        meta: { id: expect.any(String) }
      })

      await sleep(1)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      await sleep(1)

      store.dispatch({ type: 'REJECT', payload: 'bar' })

      await sleep(1)

      expect(resolve).not.toHaveBeenCalled()
      expect(reject).toHaveBeenCalled()
      expect(reject).toHaveBeenCalledTimes(1)
      expect(reject.mock.calls[0][0]).toBe('bar')
    })

    it('should not react to an action with a wrong id', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: 'START',
        resolve: action => action.type === 'RESOLVE',
        reject: action => action.type === 'REJECT'
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        payload: 'foo',
        meta: { id: expect.any(String) }
      })

      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({
        type: 'RESOLVE',
        payload: 'whatever',
        meta: { id: 'wrongid' }
      })

      await sleep(1)

      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      const { id } = reducer.mock.calls[1][1].meta
      store.dispatch({ type: 'RESOLVE', payload: 'whatever', meta: { id } })

      await sleep(1)

      expect(resolve).toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()
    })

    it('should not call resolve twice', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: 'START',
        resolve: 'RESOLVE',
        reject: 'REJECT'
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        payload: 'foo',
        meta: { id: expect.any(String) }
      })

      await sleep(1)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      await sleep(1)

      store.dispatch({ type: 'RESOLVE', payload: 'bar' })

      await sleep(1)

      expect(resolve).toHaveBeenCalled()
      expect(resolve).toHaveBeenCalledTimes(1)
      expect(resolve.mock.calls[0][0]).toBe('bar')
      expect(reject).not.toHaveBeenCalled()

      // should NOT call resolve again
      store.dispatch({ type: 'RESOLVE', payload: 'bar' })

      await sleep(1)

      expect(resolve).toHaveBeenCalled()
      expect(resolve).toHaveBeenCalledTimes(1)
    })

    it('should not call reject twice', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: 'START',
        resolve: 'RESOLVE',
        reject: 'REJECT'
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        payload: 'foo',
        meta: { id: expect.any(String) }
      })

      await sleep(1)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      await sleep(1)

      store.dispatch({ type: 'REJECT', payload: 'bar' })

      await sleep(1)

      expect(resolve).not.toHaveBeenCalled()
      expect(reject).toHaveBeenCalled()
      expect(reject).toHaveBeenCalledTimes(1)
      expect(reject.mock.calls[0][0]).toBe('bar')

      // should NOT call reject twice
      store.dispatch({ type: 'REJECT', payload: 'bar' })

      await sleep(1)

      expect(resolve).not.toHaveBeenCalled()
      expect(reject).toHaveBeenCalledTimes(1)
    })

    it('should use custom setPayload and getPayload functions', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: 'START',
        resolve: 'RESOLVE',
        reject: 'REJECT',
        setPayload: (action, payload) => ({ ...action, data: payload }),
        getPayload: action => action.result
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        data: 'foo',
        meta: { id: expect.any(String) }
      })

      await sleep(1)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      await sleep(1)

      store.dispatch({ type: 'RESOLVE', result: 'bar' })

      await sleep(1)

      expect(resolve).toHaveBeenCalled()
      expect(resolve).toHaveBeenCalledTimes(1)
      expect(resolve.mock.calls[0][0]).toBe('bar')
      expect(reject).not.toHaveBeenCalled()
    })

    it('should use custom setPayload and getError functions', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { asyncFunction } = createAsyncFunction({
        start: 'START',
        resolve: 'RESOLVE',
        reject: 'REJECT',
        setPayload: (action, payload) => ({ ...action, data: payload }),
        getError: action => action.error
      })

      // nothing dispatched yet
      expect(reducer).toHaveBeenCalledTimes(1)

      const resolve = jest.fn()
      const reject = jest.fn()
      asyncFunction('foo').then(resolve, reject)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // start action dispatched
      expect(reducer).toHaveBeenCalledTimes(2)
      expect(reducer.mock.calls[1][1]).toEqual({
        type: 'START',
        data: 'foo',
        meta: { id: expect.any(String) }
      })

      await sleep(1)
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })
      expect(resolve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      await sleep(1)

      store.dispatch({ type: 'REJECT', error: 'bar' })

      await sleep(1)

      expect(resolve).not.toHaveBeenCalled()
      expect(reject).toHaveBeenCalled()
      expect(reject).toHaveBeenCalledTimes(1)
      expect(reject.mock.calls[0][0]).toBe('bar')
    })

    it('should unsubscribe', async () => {
      const reducer = jest.fn((state, action) => state)
      const initialState = {}
      const { middleware, createAsyncFunction } = createListener()
      const store = createStore(
        reducer,
        initialState,
        applyMiddleware(middleware)
      )
      expect(reducer).toHaveBeenCalledTimes(1)

      const { unsubscribe } = createAsyncFunction({
        start: 'START',
        resolve: 'RESOLVE',
        reject: 'REJECT'
      })

      store.dispatch({ type: 'SOME_OTHER_ACTION', payload: 'whatever' })

      unsubscribe()
    })
  })
})
