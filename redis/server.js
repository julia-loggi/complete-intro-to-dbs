const {promisify} = require('util');
const express = require('express');
const redis = require('redis');
const client = redis.createClient();

const rIncr = promisify(client.incr).bind(client);
const rGet = promisify(client.get).bind(client);
const rSetEx = promisify(client.setex).bind(client);

function cache(key, ttl, slowFn) {
  return async function cachedFn(...props) {
    const cachedResponse = await rGet(key);
    if (cachedResponse) {
      console.log("hooray it is cached!");

      return cachedResponse;
    }

    const result = await slowFn(...props);
    await rSetEx(key, ttl, result);
    return result;
  }
}

async function verySlowAndExpensivePostgreSQLQuery() {
  // here we would do a big ugly query like big join on PostgreSQL
  // or a call to an expensive API

  console.log("oh no an expensive call!");

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Date().toUTCString());
    }, 5000);
  });
}

const cachedFn = cache('expensive_call', 10, verySlowAndExpensivePostgreSQLQuery);

async function init() {
  const app = express();

  app.get('/pageview', async (req, res) => {
    const views = await rIncr('pageviews');
    res.json({
      status: 'ok',
      views,
    })
  })

  app.get('/get-cached', async (req, res) => {
    const data = await cachedFn();

    res.json({
      data,
      status: "ok",
    }).end();
  })

  const PORT = process.env.PORT || 3000;
  app.use(express.static('./static'));
  app.listen(PORT);

  console.log(`🚀 running on http://localhost:${PORT}`);
}

init();