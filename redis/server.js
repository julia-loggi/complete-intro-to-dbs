const {promisify} = require('util');
const express = require('express');
const redis = require('redis');
const client = redis.createClient();

const rIncr = promisify(client.incr).bind(client);

async function init() {
  const app = express();

  app.get('/pageview', async (req, res) => {
    const views = await rIncr('pageviews');
    res.json({
      status: 'ok',
      views,
    })
  })

  const PORT = process.env.PORT || 3000;
  app.use(express.static('./static'));
  app.listen(PORT);

  console.log(`🚀 running on http://localhost:${PORT}`);
}

init();