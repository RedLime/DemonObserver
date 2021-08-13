import Discord, { TextChannel } from 'discord.js';

export default class Utils {
    
    /**
     * Check Send Message to Channel.
     * @param {Discord.Client} client
     * @param {Discord.Channel} channel channel 정보입니다.
     * @returns {boolean} 메세지를 보낼 수 있는지 여부
     */
    static isCanSend(client: Discord.Client | undefined, channel: TextChannel | undefined): boolean {
        if (!(client && channel && channel.guild.me)) return false
        return channel.permissionsFor(channel.guild.me).has(["SEND_MESSAGES", "EMBED_LINKS"]) ?? false;
    };
    

    /**
     * 문자열의 일치율을 수로 변환합니다.
     * @param {string} s1 
     * @param {string} s2 
     * @returns {number} 일치율
     */
    static similarity(s1: string, s2: string): number {
        var longer = s1;
        var shorter = s2;
        if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
        }
        var longerLength = longer.length;
        if (longerLength == 0) {
            return 1.0;
        }
        return (longerLength - this.editDistance(longer, shorter)) / (longerLength * 1.0);
    }

    private static editDistance(s1: string, s2: string) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
    
        var costs = new Array();
        for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
            costs[j] = j;
            else {
            if (j > 0) {
                var newValue = costs[j - 1];
                if (s1.charAt(i - 1) != s2.charAt(j - 1))
                newValue = Math.min(Math.min(newValue, lastValue),
                    costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }
}