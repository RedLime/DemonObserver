//discord
import Discord, { Intents, TextChannel } from 'discord.js';

//mysql
import mysql, { RowDataPacket } from 'mysql2/promise';

//path
import * as fs from 'fs';
import * as path from 'path';

//Addons
import Debug from './src/module/debug';
import Notify from './src/module/notify';
import Utils from './src/module/utils';
import Commands from './src/module/command';

//Config
import config from './config/settings.json';
import Demon from './src/classes/demon';
import { Notification, NotificationType, RerateNotification, UpdateNotification, AwardNotification, UnrateNotification } from './src/classes/notification';
import InteractionManager from './src/module/interaction';


//setup variable
var debug: Debug, interactionManager: InteractionManager
const notifyStacks: Array<Notification> = [];
var demonCount = 0, currentGDPage = 0, currentUnPage = 0, currentPCPage = 0;
var isSetup = fs.existsSync(path.join(path.resolve(), `/.setup`));


//For Start
async function run() {
    /*-------------------------------------*/

    //Mysql
    const connection = await mysql.createConnection({
        host: config.mysql_host,
        user: config.mysql_user,
        password: config.mysql_password,
        port: config.mysql_port,
        database: config.mysql_database,
        multipleStatements: true
    });

    /*-------------------------------------*/

    //Mysql Database setup
    if (!isSetup) {
        const query = fs.readFileSync(path.join(path.resolve()+"/config", `/db.sql`), 'utf8');
        const setupDB = await connection.query(query).catch(reason => {
            return;
        });
        if (!setupDB || !setupDB[0]) {
            console.error("Mysql Setup Injection Failed!");
            return;
        }
    }

    //Discord Setup
    const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES] });

    //Discord Run
    client.once('ready', async () => {
        console.log(`Login to ${client.user?.username}#${client.user?.discriminator}`)

        debug = new Debug(client);
        interactionManager = new InteractionManager(client, connection);

        //Server init setup
        if (!isSetup) {
            const guildList = client.guilds.cache;
            const setupDB = await connection.query(
                'INSERT INTO `guild_settings` (`guild_id`) VALUES ('+guildList.map(it => it.id).join('),(')+')');
            if (!setupDB || !setupDB[0]) {
                console.error("Servers Setup Injection Failed!");
                return;
            }
            fs.writeFileSync(path.join(path.resolve(), `/.setup`), ".");
        }

        
        //Discord Bot Info Refreshing
        const refresh = async () => {
            const [[result]] = <RowDataPacket[][]> await connection.query('SELECT COUNT(*) as `count` FROM `gd_demons`');
            client?.user?.setPresence({status: "online", activities: [{name: '👀 Observing '+result.count+' Demons'}]});
            demonCount = result.count;
            setTimeout(async () => {
                refresh();
            }, 1000 * 60 * 5);
        }
        await refresh();

        //Caching / Notifications
        cachingDemons();
        cachingPointercrate();
        cachingUnrates();
        sendNotifications();

        //Setup Bot Interactions
        Commands.registerCommands(client);
    });

    client.on("guildCreate", async (guild) => {
        await connection.query('INSERT INTO `guild_settings` (`guild_id`) VALUES ('+guild.id+')');
        debug.log("Discord", "Joined a new guild: " + guild.name + " / Guild Member: " + guild.memberCount + " / Bot Count: "+guild.members.cache.filter(member => member.user.bot).size);
        printGuildsInfo();
    });

    client.on("guildDelete", guild => {
        debug.log("Discord", "Left a guild: " + guild.name);
    });

    client.on("interactionCreate", async interaction => {
        if (interaction.isCommand()) {
            interactionManager.onCommand(interaction)
        }
        if (interaction.isButton()) {
            interactionManager.onClickedButton(interaction);
        }
        if (interaction.isSelectMenu()) {
            interactionManager.onClickedMenu(interaction);
        }
    });


    client.login(config.bot_token);

    /*-------------------------------------*/

    const printGuildsInfo = () => {
        const guildList = client.guilds.cache;
        const totalMembers = guildList.map((guild) => guild.memberCount).reduce((a, b) => a+b, 0);
        const totalMembersWithoutBot = guildList.map((guild) => guild.members.cache.filter(member => !member.user.bot).size).reduce((a, b) => a+b, 0);
        const ghostGuild = guildList.filter(guild => guild.memberCount*0.5 <= guild.members.cache.filter(mem => mem.user.bot).size).size;
        debug.log("Discord", `Guilds Info: [Total Guilds: ${guildList.size} / Total Members: ${totalMembers} (w/o bots ${totalMembersWithoutBot}) / Ghost Guilds: ${ghostGuild}]`);
    };

    /*-------------------------------------*/


    //caching GD Demons
    const cachingDemons = async () => {
        const clearPage = async () => {
            currentGDPage = 0;
            //await checkUnrateDemons();
        }
        
        let saveCount = 0;
        
        //request GD Server
        const rawData = await Notify.getGJLevels({diff: -2, page: currentGDPage, type: 4, count: config.search_level_size});
    
        //Error or Empty
        if (rawData.total == 0 || rawData.result == "error") {
            await clearPage();
            cachingDemons();
            return;
        }
    
        const result = rawData.levels;
        debug.log("GDServer", `A ${result.length} levels were cached. (Page : ${currentGDPage})`, null, false);
        
        const updateList: Array<Demon> = [];
        const [levels] = <RowDataPacket[][]> await connection.query('SELECT level_id, difficulty, level_version FROM `gd_demons` WHERE level_id IN ('+ result.map(level => level.id).join(",") +')');

        //Level Update Check
        levels.forEach(async element => {
            const idx = result.findIndex(level => level.id == element.level_id);
            if (idx != -1) {
                const target = result[idx];
                updateList.push(target);

                if (element.difficulty != target.difficulty) {
                    const notifiData: RerateNotification = new RerateNotification(target, element.difficulty, target.difficulty)
                    notifyStacks.push(notifiData);
                    await connection.query('INSERT INTO `gd_changelogs` (`level_id`, `type`, `data1`, `data2`) VALUES (?, ?, ?, ?)', [target.id, NotificationType.RERATED, element.difficulty, target.difficulty]);
                }
                if (element.level_version != target.version) {
                    const notifiData: UpdateNotification = new UpdateNotification(target, element.level_version, target.version)
                    notifyStacks.push(notifiData);
                    await connection.query('INSERT INTO `gd_changelogs` (`level_id`, `type`, `data1`) VALUES (?, ?, ?)', [target.id, NotificationType.UPDATED, target.version]);
                }
            }
        });

        result.forEach(async element => {
            if (levels.findIndex(level => level.level_id == element.id) == -1) {
                demonCount++;
                const notifiData: AwardNotification = new AwardNotification(element, demonCount);
                notifyStacks.push(notifiData);
                await connection.query('INSERT INTO `gd_changelogs` (`level_id`, `type`, `data1`) VALUES (?, ?, ?)', [element.id, NotificationType.AWARDED, element.difficulty]);
                saveCount++
            }
        });
        let updateQuery = result.map(element => `'${element.id}', '${element.difficulty}', '${element.name}', '${element.description.replace(/'/gi, "＇").replace(/\\/gi, "")}', '${element.version}', '${element.author}', '${element.playerID}', '${element.length}', '${element.downloads}', '${element.likes}', '${element.gameVersion}', '${element.coins}', '${element.verifiedCoins ? 1 : 0}', '${element.cp}'`).join('), (');

        await connection.query(
            `INSERT INTO gd_demons (level_id, difficulty, level_name, level_description, level_version, author_name, author_id, level_length, downloads, likes, ingame_version, coins, coins_verified, creator_points) `
            +` VALUES (${updateQuery})`
            +` ON DUPLICATE KEY UPDATE level_id = VALUES(level_id), difficulty = VALUES(difficulty), level_name = VALUES(level_name), level_description = VALUES(level_description), level_version = VALUES(level_version), author_name = VALUES(author_name),`
            +` author_id = VALUES(author_id), level_length = VALUES(level_length), downloads = VALUES(downloads), likes = VALUES(likes), ingame_version = VALUES(ingame_version), coins = VALUES(coins), coins_verified = VALUES(coins_verified), creator_points = VALUES(creator_points)`);

        debug.log("GDServer", `A ${result.length} levels were updated, ${saveCount} levels were saved.`, null, false);
    
        if (result.length < config.search_level_size) await clearPage();
        else currentGDPage++;
    
        setTimeout(() => {
            cachingDemons();
        }, (config.gd_server_search_period * 1000) + (Math.random() * config.gd_server_search_period_random));
    }

    /*-------------------------------------*/


    //caching GD Unrated Demons
    const cachingUnrates = async () => {
        const clearPage = () => {
            currentUnPage = 0;
        }
        
        const inteval = (demonCount/config.search_level_size)*(config.gd_server_search_period + config.gd_server_search_period_random)*10;
        const [levels] = <RowDataPacket[][]> await connection.query('SELECT level_id FROM `gd_demons` WHERE last_update < DATE_SUB(NOW(), INTERVAL '+inteval+' SECOND)');
        
        if (levels && levels.length) {
            //request GD Server
            const rawData = await Notify.getGJLevels({page: currentGDPage, type: 10, str: levels.map(lvl => lvl.level_id).join(","), count: config.search_level_size});

            //Error or Empty
            if (rawData.total == 0 || rawData.result == "error") {
                clearPage();
                cachingUnrates();
                return;
            }

            const result = rawData.levels;
            debug.log("GDServer", `A ${result.length} unrate levels were cached. (Page : ${currentGDPage})`, null, false);
            
            const unrateList: Array<Demon> = [];

            //Level Unrate Check
            levels.forEach(async element => {
                const idx = result.findIndex(level => level.id == element.level_id);
                if (idx != -1) {
                    const target = result[idx];
                    if (!target.isDemon) {
                        unrateList.push(target);
                        const notifiData: UnrateNotification = new UnrateNotification(target)
                        notifyStacks.push(notifiData);
                        await connection.query('INSERT INTO `gd_changelogs` (`level_id`, `type`, `data1`) VALUES (?, ?, ?)', [target.id, NotificationType.UNRATED, ""]);
                    }
                }
            });

            if (unrateList.length) {
                await connection.query(
                    `DELETE FROM gd_demons WHERE level_id IN (${unrateList.map(d => d.id).join(",")})`);
                debug.log("GDServer", `A ${unrateList.length} levels were deleted.`, null, false);
            }
        
            if (result.length < config.search_level_size) clearPage();
            else currentUnPage++;
        }
        
    
        setTimeout(() => {
            cachingUnrates();
        }, (demonCount/config.search_level_size)*(config.gd_server_search_period + config.gd_server_search_period_random)*10000);
    }

    /*-------------------------------------*/


    //caching Pointercrate
    const cachingPointercrate = async () => {
        const levels = await Notify.getPointercrateLevel(currentPCPage);
        await connection.query(levels.map((dl: { level_id: any; position: any; }) => {
            return `UPDATE gd_demons SET rank_pointercrate = '${dl.position}' WHERE level_id = '${dl.level_id}'`
        }).join("; "));
        debug.log("Pointercrate", `A ${levels.length} levels were cached. (Page : ${currentPCPage})`, null, false);

        setTimeout(() => {
            cachingPointercrate();
        }, 1000 * 60 * 30);
    }

    /*-------------------------------------*/


    //Notifications stacking
    const sendNotifications = async () => {
        const notification = notifyStacks.shift();

        if (notification) {
            let serverCount = 0;
            const notificationType = notification.getType() == NotificationType.RERATED ? notification.demon.getDifficultyText() : notification.getType();

            const [channels] = <RowDataPacket[][]> await connection.query(`SELECT channel_${notificationType} as 'target', mention_role FROM guild_settings WHERE channel_${notificationType} != 0 AND enable_${notificationType} != 0`);

            for await (const element of channels) {
                const channel = client.channels.cache.get(element.target);
                if (channel?.isText() && Utils.isCanSend(client, channel as TextChannel | undefined)) {
                    const embed = notification.convertEmbed(connection, (channel as TextChannel | undefined)?.guildId ?? "");
                    channel?.send({ content: element.mention_role != 0 ? `<@&${element.mention_role}>`: undefined, embeds: [await embed] });
                    serverCount++;
                }
            }

            debug.log("GDServer", `Level - ${notification.demon.id}(${notification.demon.name}) was ${notificationType}. (to ${serverCount} servers)`);
        }

        setTimeout(() => {
            sendNotifications();
        }, 1000);
    }

    /*-------------------------------------*/
}

//Start
run();