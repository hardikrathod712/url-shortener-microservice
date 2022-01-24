require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const dns = require('dns')
const { nanoid } = require('nanoid')
const mongoose = require('mongoose')
const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })

const urlSchema = new mongoose.Schema({
  originalURL: String,
  shortURL: String
})
const URLModel = mongoose.model('URL', urlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors()).use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  let url
  try {
    url = new URL(req.body.url)
    dns.lookup(url.hostname, (err, address, family) => {
      if (err) {
        res.json({ error: 'Invalid Hostname' })
      } else {
        console.log(address)
        URLModel.findOne({ originalURL: url }, (err, data) => {
          if (err) {
            res.json({ error: 'connection error' })
          }
          if (!data) {
            const newURL = new URLModel({
              originalURL: url,
              shortURL: nanoid()
            })
            newURL.save((err, data) => {
              if (err) res.json({ error: 'error saving' })
              res.json({
                original_url: data.originalURL,
                short_url: data.shortURL
              })
            })
          }
          else {
            res.json({
              original_url: data.originalURL,
              short_url: data.shortURL
            })
          }
        })
      }
    })
  } catch (err) {
    res.json({
      error: 'invalid url'
    })
  }
})

app.get('/api/shorturl/:shorturl', (req, res) => {
  const shorturl = req.params.shorturl
  URLModel.findOne({ shortURL: shorturl }, (err, data) => {
    if (err) res.json({ error: 'error in retreiving' })
    if (data) res.redirect(data.originalURL)
    else res.json({ error: "No short URL found for the given input" })
  })
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
