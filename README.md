# node-breaker [![npm version](https://badge.fury.io/js/node-breaker.svg)](https://badge.fury.io/js/node-breaker)

A configurable implementation of the reset circuit breaker pattern

## Installation

`npm i node-breaker -S`

## Usage

```js
const breaker = require('node-breaker')

// breaker(functionToWra, [options])
const fn = breaker(functionToWrap, {
  maxFailCount: 5, // number of failures before circuit breaks
  resetTimeout: 10 // seconds before circuit half closes
})

// call wrapped function as normal
fn()

// wrapped functions always return a promise.
// resolves with whatever was returned from the wrapped function
// or rejects with any errors encountered
fn()
  .then(console.log) // returned data
  .catch(console.error) // error encountered

// if function fails more than maxFailCount, circuit
// breaks and will instantly fail calls
fn()
  .catch(console.error) // 'Circuit opened'

// after resetTimeout seconds, circuit half closes.
// if no errors encountered, circuit closes again
// otherwise circuit opens and resetTimeout seconds must pass again
fn()
  .then(console.log) // success, circuit closed
  .catch(console.error) // failure, circuit opened again
```