const mongoClient = require('mongodb').MongoClient
const amazon = require('amazon-product-api')
const config = require('./config')

const client = amazon.createClient({
  awsId: config.amazonAPI.pubKey,
  awsSecret: config.amazonAPI.privKey,
  awsTag: config.amazonAPI.associatesTag,
})

// Mongo info
const url = config.database.host

// Get details on each page load (Price, description, image, etc.)
const priceAmazonSearch = async ASIN => {
  try {
    const res = await client.itemSearch({
      keywords: ASIN,
      searchIndex: 'Books',
      responseGroup: 'Offers',
    })
    if (Object.prototype.hasOwnProperty.call(res[0], 'Offers')) {
      return res[0].Offers[0].Offer[0].OfferListing[0].Price[0]
        .FormattedPrice[0]
    }
    console.log('No price')
    return 'Unknown'
  } catch (err) {
    console.log('Error with priceAmazonSearch')
    return 'Unknown'
  }
}

// Audible Length
const audibleSearch = async ASIN => {
  try {
    const res = client.itemLookup({
      idType: 'ASIN',
      itemId: ASIN,
    })
    if (
      Object.prototype.hasOwnProperty.call(
        res[0].ItemAttributes[0],
        'RunningTime'
      )
    ) {
      return res[0].ItemAttributes[0].RunningTime[0]._
    }
    console.log('Audiobook had no runtime')
    return 0
  } catch (err) {
    console.log('Error with audibleSearch')
    return 0
  }
}

// Amazon allows logging data such as title, author, page numbers, and ISBN for extended periods of time, as per correspondance with a Bryan F on 6/5/15
const insertDB = async obj => {
  try {
    const db = await mongoClient.connect(url)
    await db.collection('books').insertOne(obj)
    db.close()
    return true
  } catch (err) {
    console.log(`Insertion error ${err}`)
    return false
  }
}

// See if we can match up the query with an ISBN
const searchDBQuery = async query => {
  if (query === null) return 404
  try {
    const db = await mongoClient.connect(url)
    const ISBN = await db
      .collection('books')
      .find({ Query: query.toLowerCase() })
      .toArray(res => (res[0] !== null ? res[0].ISBN : ''))
    return ISBN
  } catch (err) {
    console.log(`Error connecting on first query: ${err}`)
    return false
  }
}

// Amazon Product Advertising API
function firstAmazonSearch(query, callback) {
  const mdObj = {}
  client.itemSearch(
    {
      keywords: query,
      searchIndex: 'Books',
      responseGroup: 'Large,AlternateVersions',
    },
    (err, results, response) => {
      if (err) {
        console.log('Error with Amazon search')
        mdObj.ISBN = '404'
        callback(mdObj)
      } else if (response[0].Item[0].ItemAttributes[0].hasOwnProperty('ISBN')) {
        mdObj.ISBN = response[0].Item[0].ItemAttributes[0].ISBN[0] // Check to see if ISBN exists already
        searchDBISBN(mdObj.ISBN, result => {
          if (result !== 0) {
            callback(mdObj)
          } else {
            mdObj.Title = response[0].Item[0].ItemAttributes[0].Title[0]
            if (
              response[0].Item[0].ItemAttributes[0].hasOwnProperty('Author')
            ) {
              mdObj.Author = response[0].Item[0].ItemAttributes[0].Author[0]
            } else {
              mdObj.Author = 'Unkown author'
            }
            if (
              response[0].Item[0].ItemAttributes[0].hasOwnProperty('ListPrice')
            ) {
              if (
                response[0].Item[0].ItemAttributes[0].ListPrice[0].hasOwnProperty(
                  'Amount'
                )
              ) {
                mdObj.MSRP =
                  response[0].Item[0].ItemAttributes[0].ListPrice[0].FormattedPrice[0]
              }
            } else {
              mdObj.MSRP = 'Unknown MSRP'
            }
            if (
              response[0].Item[0].ItemAttributes[0].hasOwnProperty(
                'NumberOfPages'
              )
            ) {
              mdObj.Pages =
                response[0].Item[0].ItemAttributes[0].NumberOfPages[0]
            } else {
              mdObj.Pages = 'Unknown page count'
            }
            if (
              response[0].Item[0].ItemAttributes[0].hasOwnProperty(
                'PublicationDate'
              )
            ) {
              mdObj.ReleaseDate =
                response[0].Item[0].ItemAttributes[0].PublicationDate[0]
            }
            if (response[0].Item[0].hasOwnProperty('EditorialReviews')) {
              mdObj.Description =
                response[0].Item[0].EditorialReviews[0].EditorialReview[0].Content[0]
            }
            if (response[0].Item[0].hasOwnProperty('LargeImage')) {
              mdObj.Image = response[0].Item[0].LargeImage[0].URL[0]
            }
            if (response[0].Item[0].hasOwnProperty('SimilarProducts')) {
              if (
                response[0].Item[0].SimilarProducts[0].SimilarProduct[0] != null
              ) {
                if (
                  response[0].Item[0].SimilarProducts[0].SimilarProduct[0].hasOwnProperty(
                    'ASIN'
                  )
                ) {
                  mdObj.Sim1ISBN =
                    response[0].Item[0].SimilarProducts[0].SimilarProduct[0].ASIN[0]
                  mdObj.Sim1Title =
                    response[0].Item[0].SimilarProducts[0].SimilarProduct[0].Title[0]
                }
              }
              if (
                response[0].Item[0].SimilarProducts[0].SimilarProduct[1] != null
              ) {
                if (
                  response[0].Item[0].SimilarProducts[0].SimilarProduct[1].hasOwnProperty(
                    'ASIN'
                  )
                ) {
                  mdObj.Sim2ISBN =
                    response[0].Item[0].SimilarProducts[0].SimilarProduct[1].ASIN[0]
                  mdObj.Sim2Title =
                    response[0].Item[0].SimilarProducts[0].SimilarProduct[1].Title[0]
                }
              }
              if (
                response[0].Item[0].SimilarProducts[0].SimilarProduct[2] != null
              ) {
                if (
                  response[0].Item[0].SimilarProducts[0].SimilarProduct[2].hasOwnProperty(
                    'ASIN'
                  )
                ) {
                  mdObj.Sim3ISBN =
                    response[0].Item[0].SimilarProducts[0].SimilarProduct[2].ASIN[0]
                  mdObj.Sim3Title =
                    response[0].Item[0].SimilarProducts[0].SimilarProduct[2].Title[0]
                }
              }
            }
            if (mdObj.Pages > 0) {
              mdObj.Wordcount = mdObj.Pages * config.wordsPerPage
              mdObj.Accuracy = 'Guess'
              mdObj.AccuracyDesc = 'Based on page numbers'
            } else {
              mdObj.Wordcount = 'Unknown number of'
              mdObj.Accuracy = 'Guess'
              mdObj.AccuracyDesc = 'No pagecount information available'
            }
            mdObj.Query = query.toLowerCase()
            mdObj.AudioASIN = 0
            mdObj.AudioLength = 0
            if (response[0].Item[0].hasOwnProperty('AlternateVersions')) {
              if (
                response[0].Item[0].AlternateVersions[0].hasOwnProperty(
                  'AlternateVersion'
                )
              ) {
                for (const x in response[0].Item[0].AlternateVersions[0]
                  .AlternateVersion) {
                  if (mdObj.AudioASIN === 0) {
                    if (
                      response[0].Item[0].AlternateVersions[0].AlternateVersion[
                        x
                      ].hasOwnProperty('Binding')
                    ) {
                      if (
                        response[0].Item[0].AlternateVersions[0]
                          .AlternateVersion[x].Binding[0] ==
                        'Audible Audio Edition'
                      ) {
                        mdObj.AudioASIN =
                          response[0].Item[0].AlternateVersions[0].AlternateVersion[
                            x
                          ].ASIN[0]
                        break
                      }
                    }
                  }
                }
              }
            }
            if (mdObj.AudioASIN !== 0) {
              audibleSearch(mdObj.AudioASIN, result => {
                mdObj.AudioLength = result
                const audio = parseInt(mdObj.AudioLength)
                const pgs = parseInt(mdObj.Pages)
                if (audio >= pgs) {
                  // Some books are split up into multiple audiobooks. See: War and Peace. 906 minutes for a 1300 page book? ridiculous.
                  if (pgs >= 350) {
                    // We aren't in children's books anymore
                    if (audio >= pgs * 1.5) {
                      mdObj.Wordcount = audio * config.wordsPerMinuteAudio
                      mdObj.Accuracy = 'Estimate'
                      mdObj.AccuracyDesc = 'Based on audiobook length'
                    }
                  } else {
                    mdObj.Wordcount = audio * config.wordsPerMinuteAudio
                    mdObj.Accuracy = 'Estimate'
                    mdObj.AccuracyDesc = 'Based on audiobook length'
                  }
                }
                insertDB(mdObj, result => {
                  if (result) callback(mdObj)
                })
              })
            } else {
              insertDB(mdObj, result => {
                if (result) callback(mdObj)
              })
            }
          }
        })
      } else {
        mdObj.ISBN = 0
        callback(mdObj)
      }
    }
  )
}

/* Google Books API search
function searchGoogle(query, callback) { 
    console.log('Searching for: ' + query);
    request('https://www.googleapis.com/books/v1/volumes?q=' + query + '&key=' + config.googleAPI, function (error, res, body) {
        if (!error && res.statusCode == 200) {
            console.log('Got JSON from goog');
            callback(body);
        };
    });
} */

function searchDBISBN(ISBN, callback) {
  mongoClient.connect(
    url,
    (err, db) => {
      if (err) {
        console.log('Error connecting on ISBN search')
      }
      db.collection('books')
        .find({ ISBN })
        .toArray((err, result) => {
          if (err) {
            console.log('Error searching for ISBN')
          }
          let data = 0
          if (result[0] != null) {
            data = result[0]
          }
          db.close()
          callback(data)
        })
    }
  )
}

module.exports = {
  search(query, callback) {
    let ISBN = 0
    searchDBQuery(query, result => {
      if (result !== 0) {
        ISBN = result
        console.log(`Query found in DB: ${query} (${ISBN})`)
        callback(ISBN)
      } else {
        console.log(`Searching Amazon for: ${query}`)
        firstAmazonSearch(query, mdObj => {
          callback(mdObj.ISBN)
        })
      }
    })
  },

  getBook(query, callback) {
    searchDBISBN(query, result => {
      if (result !== 0) {
        if (query != config.featuredBook.ISBN) {
          console.log(`DB retrieval:  ${query} (${result.Title})`)
        }
        callback(result)
      } else {
        firstAmazonSearch(query, mdObj => {
          console.log(`Searched Amazon for: ${query} (${mdObj.Title})`)
          callback(mdObj)
        })
      }
    })
  },

  getBookPrice(query, callback) {
    priceAmazonSearch(query, result => {
      callback(result)
    })
  },
}
