
import { TextChannel } from 'discord.js';
import settings from '../../config/settings.json' assert {type: "json"};
import Utils from './utils.js';

export default class Debug {
    constructor(client) {
        this.client = client;
    }
    
    log(prefix, context, obj = null, send = true) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`[${this.dateFormat(new Date())}] (${prefix}) ${context}\r`);
        if (send && this.client) {
            const channel = this.client.channels.cache.get(settings.bot_log_channel);
            if (channel && channel instanceof TextChannel && Utils.isCanSend(this.client, channel)) {
                channel.send(`[${this.dateFormat(new Date())}] (${prefix}) ${context}`);
            }
        }
    };
    
    logRaw(obj) {
        console.log(`[${this.dateFormat(new Date())}]`);
        console.log(obj);
        console.log("");
    };
    
    /**
     * 날짜를 String 형식으로 변환합니다.
     * @param {Date} date
     * @returns {string} string으로 변환된 Date
     */
    dateFormat(date) {
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours();
        let minute = date.getMinutes();
        let second = date.getSeconds();
    
        month = month >= 10 ? month : '0' + month;
        day = day >= 10 ? day : '0' + day;
        hour = hour >= 10 ? hour : '0' + hour;
        minute = minute >= 10 ? minute : '0' + minute;
        second = second >= 10 ? second : '0' + second;
    
        return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    }
}