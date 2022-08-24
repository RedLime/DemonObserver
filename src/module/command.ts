import { REST } from '@discordjs/rest';
import { Client } from 'discord.js';
import { Routes } from "discord-api-types/v10";
import config from '../../config/settings.json';
import fs from 'fs';
import path from 'path';

const commands: any[] = [];
const commandFiles = fs.readdirSync(path.resolve()+"/src/module/commands").filter(file => file.endsWith('.json'));
for (const file of commandFiles) {
    const json = fs.readFileSync(path.join(path.resolve()+"/src/module/commands", "/"+file), 'utf-8');
	commands.push(JSON.parse(json));
}

export default class RegisterCommand {
    static async registerCommands(client: Client) {
        const rest = new REST({ version: '10' }).setToken(config.bot_token);

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