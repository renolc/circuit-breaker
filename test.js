const breaker = require('./index')
const { deepStrictEqual: equal, throws } = require('assert')

const wait = timeout => new Promise(resolve => setTimeout(resolve, timeout))

// succeed only on the nth call
const fnFaker = n => {
  let counter = 0

  return () => {
    if (++counter !== n) throw new Error('fail')
    return 'success'
  }
}

const run = async () => {
  // basic return
  let fn = breaker(() => 3)
  equal(fn(), 3)

  // complex return
  fn = breaker(() => ({ a: true, b: 7 }))
  equal(fn(), { a: true, b: 7 })

  // throws error
  fn = breaker(() => {
    throw new Error('bork')
  })
  throws(fn, ({ message }) => message === 'bork')

  // 5 errors opens circuit
  throws(fn, ({ message }) => message === 'bork') // 2nd
  throws(fn, ({ message }) => message === 'bork')
  throws(fn, ({ message }) => message === 'bork')
  throws(fn, ({ message }) => message === 'bork')
  throws(fn, ({ message }) => message === 'Circuit opened')

  // success resets fail counter
  fn = breaker(fnFaker(3))
  throws(fn, ({ message }) => message === 'fail')
  throws(fn, ({ message }) => message === 'fail')
  equal(fn(), 'success')
  throws(fn, ({ message }) => message === 'fail')
  throws(fn, ({ message }) => message === 'fail')
  throws(fn, ({ message }) => message === 'fail')
  throws(fn, ({ message }) => message === 'fail')
  throws(fn, ({ message }) => message === 'fail')
  throws(fn, ({ message }) => message === 'Circuit opened')

  // after timeout, will half open circuit
  fn = breaker(
    () => {
      throw new Error('burp')
    },
    { maxFailCount: 3, resetTimeout: 1 }
  )
  throws(fn, ({ message }) => message === 'burp')
  throws(fn, ({ message }) => message === 'burp')
  throws(fn, ({ message }) => message === 'burp')
  throws(fn, ({ message }) => message === 'Circuit opened')
  await wait(1001)
  throws(fn, ({ message }) => message === 'burp')
  throws(fn, ({ message }) => message === 'Circuit opened')

  console.log('All good ✓')
}
run()
