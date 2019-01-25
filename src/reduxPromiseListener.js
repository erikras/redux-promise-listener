// @flow
import type { Store } from 'redux'
import type {
  Action,
  AsyncFunction,
  Config,
  GetPayload,
  Next,
  PromiseListener,
  SetPayload,
  State
} from '.'
export type Listener = Action => void

const defaultSetPayload: SetPayload = (action, payload) => ({
  ...action,
  payload
})
const defaultGetPayload: GetPayload = action => action.payload
const defaultGetError: GetPayload = action => action.payload

export default function createListener(): PromiseListener {
  let nextListenerId = 0
  let listeners: { [number]: Listener } = {}
  let dispatch: Next
  const middleware = (store: Store) => {
    dispatch = store.dispatch
    return (next: Next) => (action: Action): State => {
      // This could potentially be improved performance-wise by doing a hash lookup
      // by action.type to not loop through all the listeners on every action,
      // but there will probably be no listeners for the majority of an application's
      // lifecycle, so this structure was chosen for its ease of cleanup.
      Object.keys(listeners).forEach(key => listeners[Number(key)](action))
      return next(action)
    }
  }

  const createAsyncFunction = (config: Config): AsyncFunction => {
    const listenerId = nextListenerId++
    const unsubscribe = () => {
      delete listeners[listenerId]
    }
    if (!dispatch) {
      throw new Error('The redux-promise-listener middleware is not installed')
    }
    const asyncFunction = (payload: any) =>
      new Promise((resolve, reject) => {
        const id = Math.random()
          .toString(36)
          .substr(2)
        const listener: Listener = action => {
          // If action has an id, check whether it's correct
          if (action.meta && action.meta.id && action.meta.id !== id) return
          if (
            action.type === config.resolve ||
            (typeof config.resolve === 'function' && config.resolve(action))
          ) {
            unsubscribe()
            resolve((config.getPayload || defaultGetPayload)(action))
          } else if (
            action.type === config.reject ||
            (typeof config.reject === 'function' && config.reject(action))
          ) {
            unsubscribe()
            reject((config.getError || defaultGetError)(action))
          }
        }
        listeners[listenerId] = listener
        let action
        if (typeof config.start === 'function') {
          action = config.start({ payload, meta: { id } })
        } else {
          action = (config.setPayload || defaultSetPayload)(
            { type: config.start, meta: { id } },
            payload
          )
        }
        dispatch(action)
      })

    return { asyncFunction, unsubscribe }
  }

  return { middleware, createAsyncFunction }
}
