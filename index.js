module.exports = (fn, { maxFailCount = 5, resetTimeout = 10 } = {}) => {
  let failCounter = 0
  let lastFailTime = 0

  const state = () => {
    if (
      failCounter >= maxFailCount &&
      Date.now() - lastFailTime > resetTimeout * 1000
    ) {
      return 'half'
    } else if (failCounter >= maxFailCount) {
      return 'opened'
    } else {
      return 'closed'
    }
  }

  const call = async args => {
    try {
      const res = await fn.apply(null, args)
      failCounter = 0
      lastFailTime = 0
      return res
    } catch (e) {
      failCounter++
      lastFailTime = Date.now()
      throw e
    }
  }

  return async (...args) => {
    switch (state()) {
      case 'half':
      case 'closed':
        return call(args)
        break

      default:
        throw new Error('Circuit opened')
    }
  }
}
