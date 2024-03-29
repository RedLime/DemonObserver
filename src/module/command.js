import { REST } from '@discordjs/rest';
import { Routes } from "discord-api-types/v9";
import config from '../../config/settings.json' assert {type: "json"};
import fs from 'fs';
import path from 'path';

const commands = [];
const commandFiles = fs.readdirSync(path.resolve()+"/src/module/commands").filter(file => file.endsWith('.json'));
for (const file of commandFiles) {
    const json = fs.readFileSync(path.join(path.resolve()+"/src/module/commands", "/"+file), 'utf-8');
	commands.push(JSON.parse(json));
}

export default class RegisterCommand {
    static async registerCommands(client) {
        const rest = new REST({ version: '9' }).setToken(config.bot_token);

        if (config.debug) {
            await rest.put(
                Routes.applicationGuildCommands(client.user?.id ?? "", config.command_guild_only.toString()),
                { body: commands },
            );
        } else {
            await rest.put(
                Routes.applicationCommands(client.user?.id ?? ""),
                { body: commands },
            );
        }
    } 
}