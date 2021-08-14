# DemonObserver
Parsing All Demon's Information in Geometry Dash!

This bot is built on Node.js and Typescript.

You can start the bot with `npm start`. However, there are a few steps before we begin.

## Setup 
- Install [Node.js](https://nodejs.org/) version 16.6 or higher.
- Download DemonObserver on [Release Page](https://github.com/RedLime/DemonObserver/releases/tag/1.0.1).
- Run the `npm install` command. Install what you need.
- Create a MySQL database for Demon Observer.
- Change settings like DB and Discord Bot Token in [settings.config](https://github.com/RedLime/DemonObserver/blob/master/config/settings.json).
  - Also a sample config file is [Here](https://github.com/RedLime/DemonObserver/blob/master/config/settings_sample.jsonc). Check it out.
- Upload all images in [Resouces](https://github.com/RedLime/DemonObserver/tree/master/resources) folder to your Discord server emoji.
- Insert all emojis in [emojis.json](https://github.com/RedLime/DemonObserver/blob/master/config/emojis.json).
  - Put a `\` in front of the emoji in Discord. Ready-to-use text appears.
- Start your bot using `npm start` or a batch file.

That's all! BUT, Since there are no demon in your database initially, notifications will not be updated until all demon are updated in the database.

## Special Thanks
- [GDColon](https://github.com/GDColon) for Demon Face Images in [GDBrowser](https://github.com/GDColon/GDBrowser),
- [Hann](https://www.youtube.com/channel/UCLIuKE0JGD3fycqMJRFf1Fg)
