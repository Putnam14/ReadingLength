# Reading Length
> Book length search engine 

Reading Length is a web app that estimates how long it will take you to read nearly any book.

## Installation

> Installation currently involves spinning up a DigitalOcean droplet with node, importing a copy of the current MongoDB (or at least its schema), and using PM2 to keep it running and for continuous deployment.

### Stack
* NPM
* Node.js
* Express
* MongoDB
* An Amazon Product Advertising API key

> Please be patient as I refactor the codebase to run on next.js, which can be easily pushed to Now or Heroku.



## Usage

Navigate to the front-end and enter a book in the search bar.

### Features
#### Current
* Search for any book (Uses Amazon's Product Advertising API combined with cached results in the mongo storage)
* View a books estimated word count (Accurate results are input manually, estimates are derived from the book's audiobook length multiplied by a standard speaking words per minute rate, guesses are based on the number of pages)
* Calculate how long it will take you to read the book based on your own reading words per minute speed
#### Proposed
* Search for any book (Using a combination of Google Books API and ISBNdb data)
* View a book's current prices (Using ISBNdb data)
* Create a user account
* Add books to a reading list
* Integrate with Goodreads for list syncing
* Create and join book clubs
* Discuss the currently reading book in book clubs
* Organize book club events
* Earn points for visiting and interacting with the site, redeemable for gift cards or charitable donations

## Development
### History
This project started out when I was spending the summer between my freshman and sophomore years of college back home, in 2015. When I wasn't hiking or hanging out with friends, I was reading. I had previously done some Python work, trying to perform arbitrage between cryptocurrency exchange rate spreads (see my cryptsy-arb project), and thought Python would be a great fit for a program to keep track of my reading. At the time I was reading the fourth book in the _A Song of Ice and Fire_ series, so I wanted to know how long it would take me to finish it. The first iteration of this project asked you how many pages are in a book, how many you have read, how many words you think are on each page, and how fast you read. This worked out surprisingly well, so I decided to learn some PHP and ship a website.

The second iteration of this project used PHP to render out HTML using data from Google Books. PHP is not a language that I claim to know, and I found out how bad I was at writing code when I decided to redesign the scripts to consume Amazon's API information. When I finally got the website running on the LAMP stack, I naturally made a post on reddit.com/r/books. We all know how that goes. But with a peak of 700 active visitors before the server blew its heap, I verified that this is something people are interested in. I spent the next few months learning how to write decent PHP.

WordPress seemed like the next natural step for the website. I wanted to let people create user accounts and have lists (such as the functionality described above) but I didn't have a good grasp on how to create a user management system. I had set up WordPress websites with BuddyPress in the past to help manage Minecraft communities, so I thought it wouldn't be too hard to port my PHP system into a WordPress plugin. Somehow I succeeded. Everything was going great: tens of thousands of users visited my site each month and I was making some beer money with minimal maintenance. Until the theme plugin I was using stopped workin, rendering the website unmaintainable.

In January of 2018 I decided to use the JavaScript knowledge I had picked up through various online courses to use and rewrite the website using Node. I had never worked with Node before, but I'd have to say I did a kick ass job implementing it (even though from a functional programming standpoint the code is horrible, I had no idea what object oriented programming in JS meant, and what does linting mean?). I ditched the user accounts and did a bit of refactoring the codebase, but not much. I learned how to use PM2 to reboot the server any time an uncaught exception was thrown, and automatically pull the latest code from the project's master branch in GitHub. If I haven't removed this sentence, this is still how it is
### Current
Reading Length is maintained solely by me, running on a linux-mongo-express-node stack. I am working on first refactoring and linting the current code to be more maintainable, and then porting that to run on a next.js, apollo, GraphQL, Yoga, Prisma, and React stack (Yes, I decided to take Wes Bos's Advanced React course). 
## Contributing
Pull requests are welcome (at your own risk). For major changes, please open an issue first to discuss what you would like to change.

## License
[GNU GPLv3](https://choosealicense.com/licenses/gpl-3.0/)