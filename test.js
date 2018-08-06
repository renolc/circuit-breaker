const breaker = require('./index')
const { deepStrictEqual: equal, rejects } = require('assert')

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
  equal(await fn(), 3)

  // complex return
  fn = breaker(() => ({ a: true, b: 7 }))
  equal(await fn(), { a: true, b: 7 })

  // rejects with error
  fn = breaker(() => {
    throw new Error('bork')
  })
  rejects(fn, ({ message }) => message === 'bork')

  // 5 errors opens circuit
  rejects(fn, ({ message }) => message === 'bork') // 2nd
  rejects(fn, ({ message }) => message === 'bork')
  rejects(fn, ({ message }) => message === 'bork')
  rejects(fn, ({ message }) => message === 'bork')
  rejects(fn, ({ message }) => message === 'Circuit opened')

  // success resets fail counter
  fn = breaker(fnFaker(3))
  rejects(fn, ({ message }) => message === 'fail')
  rejects(fn, ({ message }) => message === 'fail')
  equal(await fn(), 'success')
  rejects(fn, ({ message }) => message === 'fail')
  rejects(fn, ({ message }) => message === 'fail')
  rejects(fn, ({ message }) => message === 'fail')
  rejects(fn, ({ message }) => message === 'fail')
  rejects(fn, ({ message }) => message === 'fail')
  rejects(fn, ({ message }) => message === 'Circuit opened')

  // after timeout, will half open circuit
  fn = breaker(
    () => {
      throw new Error('burp')
    },
    { maxFailCount: 3, resetTimeout: 1 }
  )
  rejects(fn, ({ message }) => message === 'burp')
  rejects(fn, ({ message }) => message === 'burp')
  rejects(fn, ({ message }) => message === 'burp')
  rejects(fn, ({ message }) => message === 'Circuit opened')
  await wait(1001)
  rejects(fn, ({ message }) => message === 'burp')
  rejects(fn, ({ message }) => message === 'Circuit opened')

  // async
  fn = breaker(async () => {
    await wait(3)
    throw new Error('yo')
  })
  rejects(fn, ({ message }) => message === 'yo')

  console.log('All good ✓')
}
run()
