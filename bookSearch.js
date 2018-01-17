var config = require('./config');
var request = require('request');
const mongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var amazon = require('amazon-product-api');
var client = amazon.createClient({
    awsId: config.amazonAPI.pubKey,
    awsSecret: config.amazonAPI.privKey,
    awsTag: config.amazonAPI.associatesTag
});

//Mongo info
const url = config.database.host;

//Get details on each page load (Price, description, image, etc.)
function priceAmazonSearch(ASIN, callback) {
    client.itemSearch({
        keywords: ASIN,
        searchIndex: 'Books',
        responseGroup: 'Offers'
    }, function(err, results, response) {
        if (err) {
            console.log('Error with priceAmazonSearch');
            callback('Unknown');
        } else {
            if (results[0].hasOwnProperty('Offers')) {
                callback(results[0].Offers[0].Offer[0].OfferListing[0].Price[0].FormattedPrice[0]);
            } else {
                console.log('No price');
                callback('Unknown');
            }   
        }
    });
}

//Audible Length
function audibleSearch(ASIN, callback) {
    client.itemLookup({
        idType: 'ASIN',
        itemId: ASIN
    }, function(err, results, response) {
        if (err) {
            console.log('Error with audibleSearch');
            callback(0);
        } else {
            //console.log(results[0].ItemAttributes);
            if (results[0].ItemAttributes[0].hasOwnProperty('RunningTime')) { //Older audio CDs may not have runtime listed (See Harry Potter)
                callback(results[0].ItemAttributes[0].RunningTime[0]._);
            } else {
                callback(0);
            }
        }
    });
}

//Amazon Product Advertising API
function firstAmazonSearch(query, callback) {
  var mdObj = {};
    client.itemSearch({
    keywords: query,
    searchIndex: 'Books',
    responseGroup: 'Large,AlternateVersions'
    }, function(err, results, response) {
        if (err) {
            console.log('Error with Amazon search');
            mdObj.ISBN = '404';
            callback(mdObj);
        } else {
            if (response[0].Item[0].ItemAttributes[0].hasOwnProperty('ISBN')) {
                mdObj.ISBN = response[0].Item[0].ItemAttributes[0].ISBN[0];//Check to see if ISBN exists already
                searchDBISBN(mdObj.ISBN, function(result) {
                    if (result !== 0) {
                        callback(mdObj);
                    } else {
                        mdObj.Title = response[0].Item[0].ItemAttributes[0].Title[0];
                        if(response[0].Item[0].ItemAttributes[0].hasOwnProperty('Author')) {
                            mdObj.Author = response[0].Item[0].ItemAttributes[0].Author[0];
                        } else {
                            mdObj.Author = 'Unkown author';
                        }
                        if (response[0].Item[0].ItemAttributes[0].hasOwnProperty('ListPrice')) {
                            if (response[0].Item[0].ItemAttributes[0].ListPrice[0].hasOwnProperty('Amount')) {
                                mdObj.MSRP = response[0].Item[0].ItemAttributes[0].ListPrice[0].FormattedPrice[0];
                            }
                        } else {
                            mdObj.MSRP = 'Unknown MSRP';
                        }
                        if (response[0].Item[0].ItemAttributes[0].hasOwnProperty('NumberOfPages')) {
                            mdObj.Pages = response[0].Item[0].ItemAttributes[0].NumberOfPages[0];
                        } else {
                            mdObj.Pages = 'Unknown page count';
                        }
                        if (response[0].Item[0].ItemAttributes[0].hasOwnProperty('PublicationDate')) {
                            mdObj.ReleaseDate = response[0].Item[0].ItemAttributes[0].PublicationDate[0];
                        }
                        if (response[0].Item[0].hasOwnProperty('EditorialReviews')) {
                            mdObj.Description = response[0].Item[0].EditorialReviews[0].EditorialReview[0].Content[0];
                        }
                        if (response[0].Item[0].hasOwnProperty('LargeImage')) {
                            mdObj.Image = response[0].Item[0].LargeImage[0].URL[0];
                        }
                        if (response[0].Item[0].hasOwnProperty('SimilarProducts')) {
                            if (response[0].Item[0].SimilarProducts[0].SimilarProduct[0] !== null) {
                                if (response[0].Item[0].SimilarProducts[0].SimilarProduct[0].hasOwnProperty('ASIN')) {
                                    mdObj.Sim1ISBN = response[0].Item[0].SimilarProducts[0].SimilarProduct[0].ASIN[0];
                                    mdObj.Sim1Title = response[0].Item[0].SimilarProducts[0].SimilarProduct[0].Title[0];
                                }
                            }
                            if (response[0].Item[0].SimilarProducts[0].SimilarProduct[1] !== null) {
                                if (response[0].Item[0].SimilarProducts[0].SimilarProduct[1].hasOwnProperty('ASIN')) {
                                    mdObj.Sim2ISBN = response[0].Item[0].SimilarProducts[0].SimilarProduct[1].ASIN[0];
                                    mdObj.Sim2Title = response[0].Item[0].SimilarProducts[0].SimilarProduct[1].Title[0];
                                }
                            }
                            if (response[0].Item[0].SimilarProducts[0].SimilarProduct[2] !== null) {
                                if (response[0].Item[0].SimilarProducts[0].SimilarProduct[2].hasOwnProperty('ASIN')) {
                                    mdObj.Sim3ISBN = response[0].Item[0].SimilarProducts[0].SimilarProduct[2].ASIN[0];
                                    mdObj.Sim3Title = response[0].Item[0].SimilarProducts[0].SimilarProduct[2].Title[0];
                                }
                            }
                        }
                        if (mdObj.Pages > 0) {
                            mdObj.Wordcount = mdObj.Pages*config.wordsPerPage;
                            mdObj.Accuracy = 'Guess';
                            mdObj.AccuracyDesc = 'Based on page numbers';
                        } else {
                            mdObj.Wordcount = 'Unknown number of';
                            mdObj.Accuracy = 'Guess';
                            mdObj.AccuracyDesc = 'No pagecount information available';
                        }
                        mdObj.Query = query.toLowerCase();
                        mdObj.AudioASIN = 0;
                        mdObj.AudioLength = 0;
                        if (response[0].Item[0].hasOwnProperty('AlternateVersions')) {
                            if (response[0].Item[0].AlternateVersions[0].hasOwnProperty('AlternateVersion')) {
                                for (var x in response[0].Item[0].AlternateVersions[0].AlternateVersion) {
                                    if (mdObj.AudioASIN === 0) {
                                        if (response[0].Item[0].AlternateVersions[0].AlternateVersion[x].hasOwnProperty('Binding')) {
                                            if (response[0].Item[0].AlternateVersions[0].AlternateVersion[x].Binding[0] == "Audible Audio Edition") { 
                                                mdObj.AudioASIN = response[0].Item[0].AlternateVersions[0].AlternateVersion[x].ASIN[0];
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (mdObj.AudioASIN !== 0) {
                            audibleSearch(mdObj.AudioASIN, function(result) {
                                mdObj.AudioLength = result;
                                var audio = parseInt(mdObj.AudioLength);
                                var pgs = parseInt(mdObj.Pages);
                                if (audio >= pgs) { //Some books are split up into multiple audiobooks. See: War and Peace. 906 minutes for a 1300 page book? ridiculous.
                                    if (pgs >= 350) { //We aren't in children's books anymore
                                        if (audio >= (pgs*1.5)) {
                                            mdObj.Wordcount = audio*config.wordsPerMinuteAudio;
                                            mdObj.Accuracy = 'Estimate';
                                            mdObj.AccuracyDesc = 'Based on audiobook length';
                                        }
                                    } else {
                                        mdObj.Wordcount = audio*config.wordsPerMinuteAudio;
                                        mdObj.Accuracy = 'Estimate';
                                        mdObj.AccuracyDesc = 'Based on audiobook length';
                                    }
                                }
                                insertDB(mdObj, function(result) {
                                    if (result) callback(mdObj);
                                });
                            });
                        } else {
                            insertDB(mdObj, function(result) {
                                if (result) callback(mdObj);
                            });
                        }
                    }
                });
            } else {
                mdObj.ISBN = 0;
                callback(mdObj);
            }
        }
    });
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
}*/

//Amazon allows logging data such as title, author, page numbers, and ISBN for extended periods of time, as per correspondance with a Bryan F on 6/5/15
function insertDB(object, callback) {
    mongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Error connecting on insertion');
        }
        db.collection("books").insertOne(object, function(err, res) {
            if (err) {
                console.log('Insertion error');
            }
            db.close();
            callback(true);
        });
    });
}

function searchDBQuery(query, callback) { //
    mongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Error connecting on first query');
        }
        db.collection("books").find({Query:query.toLowerCase()}).toArray(function(err, result) {
            if (err) throw err;
            var ISBN = 0;
            if (result[0] !== undefined) {
                ISBN = result[0].ISBN;
            }
            db.close();
            callback(ISBN);
        });
    });
}

function searchDBISBN(ISBN, callback) {
    mongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Error connecting on ISBN search');
        }
        db.collection("books").find({ISBN:ISBN}).toArray(function(err, result) {
            if (err) {
                console.log('Error searching for ISBN');
            }
            var data = 0;
            if (result[0] !== undefined) {
                data = result[0];
            }
            db.close();
            callback(data);
        });
    });
}

module.exports = {
    search: function(query, callback) {
        var ISBN = 0;
        searchDBQuery(query, function(result) {
            if (result !== 0) {
                ISBN = result;
                console.log('Query found in DB: ' + query + ' (' + ISBN + ')');
                callback(ISBN);
            } else {
                console.log('Searching Amazon for: ' + query);
                firstAmazonSearch(query, function(mdObj) {
                    callback(mdObj.ISBN);
                });
            }
        });
    },


    getBook: function(query, callback) {
        searchDBISBN(query, function(result) {
            if (result !== 0) {
                if (query != config.featuredBook.ISBN) {
                    console.log('DB retrieval:  ' + query + ' (' + result.Title + ')');
                }
                callback(result);
            } else {
                firstAmazonSearch(query, function(mdObj) {
                    console.log('Searched Amazon for: ' + query + ' (' + mdObj.Title + ')');
                    callback(mdObj);
                });
            }
        });
    },

    getBookPrice: function(query, callback) {
        priceAmazonSearch(query, function(result) {
            callback(result);
        });
    }

};