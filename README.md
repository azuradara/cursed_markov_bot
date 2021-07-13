# A Discord Markov chains server
Discord bot using `natural` and `weighted` to generate fake messages based on how users type.

## Setup
- Create a [Discord bot application](https://discordapp.com/developers/applications/).

### Windows
1. Install Node.js >= 12.0
 
2. Clone this repository using git, or download and extract the [zip](https://github.com/azuradara/cursed_markov_bot/archive/master.zip) from GitHub.
```cmd
git clone https://github.com/azuradara/cursed_markov_bot.git
```

3. Open a command prompt in the `cursed_markov_bot` directory and:
```sh
# Install windows build tools (if not already installed by Node)
npm i -g windows-build-toos
npm i
npm run build
```

4. Create a file called .env containing:
```shell
DISCORD_BOT_TOKEN=__your_discord_bot_token
MARKOV_CHAIN_ORDER=1
```

5. Run the bot:
```sh
npm run start
```

## Changelog
### 0.1.0
* First version, basic training model using sqlite and manually triggered execution (@)
