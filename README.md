
<h1 align="center">
  <br>
  <img src="https://cdn.discordapp.com/attachments/1057976249756176414/1143799272098242577/0xrla_cartoon_cute_evil_robot_eating_a_subway_sandwich_with_dol_0c3ed251-eaf7-4fbc-9026-ad6c6f186dde.png" alt="Sandwich BOT" width="400">
  <br>
  Sandwich BOT
  <br>
</h1>

<h4 align="center">This is a proof of concept of a MEV sandwich BOT for educational purposes. Meaning this BOT will probably not be successful without improvements due to the high competition from other bots that are made for production.</a></h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-run">How To Run</a> •
  <a href="#how-to-configure">How To Configure</a> •
  <a href="#license">License</a>
</p>

## Key Features

* Connecting to an Ethereum node
* Listen for UniswapV2 swaps in the mempool
* Target ERC20/wETH token pairs
* Simulate sandwich transaction
* Creating bundle transaction
* Executing sandwich transaction

## How To Run

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/0xRLA/sandwich-bot.git

# Go into the repository
$ cd sandwich-bot

# Install dependencies
$ npm install

# Run the bot
$ npm start
```

## How To Configure

In order to make this bot run you will need to input some values.

```bash
# Copy and rename .env.template
$ cp .env.template .env

# Input values in
$ .env
```

## License

Do whatever you want with it. 
