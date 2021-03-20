const express = require('express');
const shortId = require('shortid');
const createHttpError = require('http-errors');
const mongoose = require('mongoose');
const path = require('path');
const ShortUrl = require('./models/url');
const redis = new Redis();
 
const app = express()
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const uri = "mongodb+srv://yellow_shweta:<password>@cluster0.mpa4o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>{
  console.log("Connected successfully to server");
}).catch(error=>{
  console.log(error,"Error connecting..")
})


app.set('view engine', 'ejs')

app.use((req, res, next) => {
  next(createHttpError.NotFound())
})

app.get('/', async (req, res, next) => {
  res.render('index')
})

app.post('/', async (req, res, next) => {
  try {
    const { url } = req.body
    if (!url) {
      throw createHttpError.BadRequest('Provide a valid url')
    }
    const urlExists = await ShortUrl.findOne({ url })
    if (urlExists) {
      res.render('index', {
        short_url: `${req.headers.host}/${urlExists.shortId}`,
      })
      return
    }
    const shortUrl = new ShortUrl({ url: url, shortId: shortId.generate() })
    const result = await shortUrl.save()
    redis.set(`${req.headers.host}/${result.shortId}`, url);
    res.render('index', {
      short_url: `${req.headers.host}/${result.shortId}`,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/:shortId', async (req, res, next) => {
  try {
    let result = {};
    let key = req.url;
    let cachedBody = await redis.get(`${req.headers.host}${key}`)
    if (cachedBody) {
      result.url = cachedBody
    }
    else {
      const { shortId } = req.params
      result = await ShortUrl.findOne({ shortId })
      if (!result) {
        throw createHttpError.NotFound('Short url does not exist')
      }
    }
    res.redirect(result.url)
  } catch (error) {
    next(error)
  }
})

app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.render('index', { error: err.message })
})

app.listen(process.env.PORT|| 3000, () => console.log(`Connecting on port ${process.env.PORT || "3000"}...`))
