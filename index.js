const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require("discord.js");
const express = require("express");
const fs = require("fs");

/* ---------------- EXPRESS ---------------- */

const app = express();
app.get("/", (req,res)=>res.send("Bot running"));
app.listen(3000,()=>console.log("Express running"));

/* ---------------- CLIENT ---------------- */

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]});

/* ---------------- ENV ---------------- */

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

/* ---------------- FILES ---------------- */

function load(file){
if(!fs.existsSync(file)) fs.writeFileSync(file,"{}");
return JSON.parse(fs.readFileSync(file));
}

function save(file,data){
fs.writeFileSync(file,JSON.stringify(data,null,2));
}

let levels = load("./levels.json");
let warnings = load("./warnings.json");
let afk = load("./afk.json");
let autoroles = load("./autoroles.json");
let welcome = load("./welcome.json");
let xpChannels = load("./xpchannels.json");
let levelRewards = load("./levelRewards.json");

/* ---------------- COMMANDS ---------------- */

const commands=[

new SlashCommandBuilder().setName("help").setDescription("Show commands"),

new SlashCommandBuilder().setName("ping").setDescription("Ping"),

new SlashCommandBuilder().setName("afk").setDescription("Set AFK")
.addStringOption(o=>o.setName("reason").setDescription("reason")),

new SlashCommandBuilder().setName("level").setDescription("Check level")
.addUserOption(o=>o.setName("user").setDescription("user")),

new SlashCommandBuilder().setName("leaderboard").setDescription("Top levels"),

new SlashCommandBuilder().setName("avatar").setDescription("User avatar")
.addUserOption(o=>o.setName("user").setDescription("user")),

new SlashCommandBuilder().setName("userinfo").setDescription("User info")
.addUserOption(o=>o.setName("user").setDescription("user")),

new SlashCommandBuilder().setName("serverinfo").setDescription("Server info"),

/* ADMIN */

new SlashCommandBuilder().setName("announce")
.setDescription("Announcement")
.addStringOption(o=>o.setName("message").setDescription("msg").setRequired(true)),

new SlashCommandBuilder().setName("kick")
.setDescription("Kick")
.addUserOption(o=>o.setName("user").setDescription("user").setRequired(true)),

new SlashCommandBuilder().setName("ban")
.setDescription("Ban")
.addUserOption(o=>o.setName("user").setDescription("user").setRequired(true)),

new SlashCommandBuilder().setName("warn")
.setDescription("Warn")
.addUserOption(o=>o.setName("user").setDescription("user").setRequired(true))
.addStringOption(o=>o.setName("reason").setDescription("reason").setRequired(true)),

new SlashCommandBuilder().setName("warnings")
.setDescription("Warnings")
.addUserOption(o=>o.setName("user").setDescription("user").setRequired(true)),

new SlashCommandBuilder().setName("mute")
.setDescription("Mute")
.addUserOption(o=>o.setName("user").setDescription("user").setRequired(true))
.addIntegerOption(o=>o.setName("minutes").setDescription("minutes").setRequired(true)),

new SlashCommandBuilder().setName("unmute")
.setDescription("Unmute")
.addUserOption(o=>o.setName("user").setDescription("user").setRequired(true)),

new SlashCommandBuilder().setName("clear")
.setDescription("Clear messages")
.addIntegerOption(o=>o.setName("amount").setDescription("1-100").setRequired(true)),

new SlashCommandBuilder().setName("lock").setDescription("Lock channel"),
new SlashCommandBuilder().setName("unlock").setDescription("Unlock channel"),

new SlashCommandBuilder().setName("slowmode")
.setDescription("Slowmode")
.addIntegerOption(o=>o.setName("seconds").setDescription("seconds").setRequired(true)),

new SlashCommandBuilder().setName("setautorole")
.setDescription("Set autorole")
.addRoleOption(o=>o.setName("role").setDescription("role").setRequired(true)),

new SlashCommandBuilder().setName("setwelcome")
.setDescription("Set welcome")
.addChannelOption(o=>o.setName("channel").setDescription("channel").setRequired(true)),

new SlashCommandBuilder().setName("setxpchannel")
.setDescription("Set xp channel")
.addChannelOption(o=>o.setName("channel").setDescription("channel").setRequired(true)),

new SlashCommandBuilder().setName("addxp")
.setDescription("Add xp")
.addUserOption(o=>o.setName("user").setRequired(true))
.addIntegerOption(o=>o.setName("amount").setRequired(true)),

new SlashCommandBuilder().setName("removexp")
.setDescription("Remove xp")
.addUserOption(o=>o.setName("user").setRequired(true))
.addIntegerOption(o=>o.setName("amount").setRequired(true)),

new SlashCommandBuilder().setName("levelreward")
.setDescription("Set level role")
.addIntegerOption(o=>o.setName("level").setRequired(true))
.addRoleOption(o=>o.setName("role").setRequired(true))

].map(c=>c.toJSON());

/* REGISTER */

const rest=new REST({version:"10"}).setToken(TOKEN);
(async()=>{await rest.put(Routes.applicationCommands(CLIENT_ID),{body:commands});})();

/* READY */

client.once("ready",()=>{
console.log("Logged in "+client.user.tag);
});

/* WELCOME */

client.on("guildMemberAdd",member=>{

if(autoroles[member.guild.id]){
let role=member.guild.roles.cache.get(autoroles[member.guild.id]);
if(role) member.roles.add(role);
}

if(welcome[member.guild.id]){
let ch=member.guild.channels.cache.get(welcome[member.guild.id]);
if(ch){
let e=new EmbedBuilder()
.setTitle("Welcome!")
.setDescription(`Welcome ${member}`)
.setColor("Green");
ch.send({embeds:[e]});
}
}

});

/* MESSAGE */

client.on("messageCreate",msg=>{

if(msg.author.bot) return;

/* rules */

if(msg.content=="?rules"){
msg.channel.send("📜 Respect everyone | No spam | Follow staff");
}

/* AFK */

if(afk[msg.author.id]){
delete afk[msg.author.id];
save("./afk.json",afk);
msg.channel.send("Welcome back, AFK removed.");
}

/* XP */

if(!levels[msg.guild.id]) levels[msg.guild.id]={};
if(!levels[msg.guild.id][msg.author.id]) levels[msg.guild.id][msg.author.id]={xp:0,level:1};

let data=levels[msg.guild.id][msg.author.id];
data.xp+=Math.floor(Math.random()*10)+5;

let need=data.level*100;

if(data.xp>=need){

data.level++;
data.xp-=need;

msg.channel.send(`🎉 ${msg.author} leveled to ${data.level}`);

let reward=levelRewards[msg.guild.id]?.[data.level];
if(reward){
let role=msg.guild.roles.cache.get(reward);
if(role) msg.member.roles.add(role);
}

}

save("./levels.json",levels);

});

/* INTERACTIONS */

client.on("interactionCreate",async i=>{

if(!i.isCommand()) return;

let cmd=i.commandName;
let guild=i.guild;
let member=i.member;

let admin=member.permissions.has(PermissionsBitField.Flags.Administrator);

function adminCheck(){
if(!admin){
i.reply({content:"Admin only",ephemeral:true});
return true;
}
}

/* HELP */

if(cmd=="help"){
let e=new EmbedBuilder()
.setTitle("Commands")
.setDescription("Moderation + leveling bot")
.addFields(
{name:"User",value:"/level /leaderboard /avatar /userinfo /serverinfo /afk"},
{name:"Admin",value:"/kick /ban /warn /mute /clear /lock /unlock"}
);
return i.reply({embeds:[e]});
}

/* PING */

if(cmd=="ping"){
return i.reply("Pong "+client.ws.ping+"ms");
}

/* AFK */

if(cmd=="afk"){
let r=i.options.getString("reason")||"AFK";
afk[i.user.id]=r;
save("./afk.json",afk);
i.reply("You are now AFK");
}

/* LEVEL */

if(cmd=="level"){

let user=i.options.getUser("user")||i.user;

if(!levels[guild.id][user.id]) levels[guild.id][user.id]={xp:0,level:1};

let d=levels[guild.id][user.id];

let e=new EmbedBuilder()
.setTitle(user.tag)
.setDescription(`Level ${d.level}\nXP ${d.xp}/${d.level*100}`);

i.reply({embeds:[e]});

}

/* LEADERBOARD */

if(cmd=="leaderboard"){

let g=levels[guild.id];
let sorted=Object.entries(g).sort((a,b)=>b[1].level-a[1].level).slice(0,10);

let text="";

for(let x=0;x<sorted.length;x++){

let u=await client.users.fetch(sorted[x][0]);
text+=`${x+1}. ${u.tag} - lvl ${sorted[x][1].level}\n`;

}

i.reply(text||"No data");

}

/* AVATAR */

if(cmd=="avatar"){
let u=i.options.getUser("user")||i.user;

let e=new EmbedBuilder()
.setImage(u.displayAvatarURL({size:1024}));

i.reply({embeds:[e]});
}

/* USERINFO */

if(cmd=="userinfo"){
let u=i.options.getUser("user")||i.user;

let e=new EmbedBuilder()
.setTitle(u.tag)
.addFields(
{name:"ID",value:u.id},
{name:"Created",value:`<t:${Math.floor(u.createdTimestamp/1000)}:R>`}
);

i.reply({embeds:[e]});
}

/* SERVERINFO */

if(cmd=="serverinfo"){

let e=new EmbedBuilder()
.setTitle(guild.name)
.addFields(
{name:"Members",value:String(guild.memberCount)},
{name:"Server ID",value:guild.id}
);

i.reply({embeds:[e]});
}

/* CLEAR */

if(cmd=="clear"){
if(adminCheck()) return;

let a=i.options.getInteger("amount");

await i.channel.bulkDelete(a,true);

i.reply({content:`Deleted ${a}`,ephemeral:true});
}

/* LOCK */

if(cmd=="lock"){
if(adminCheck()) return;

await i.channel.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:false});

i.reply("Channel locked");
}

/* UNLOCK */

if(cmd=="unlock"){
if(adminCheck()) return;

await i.channel.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:true});

i.reply("Channel unlocked");
}

/* SLOWMODE */

if(cmd=="slowmode"){
if(adminCheck()) return;

let s=i.options.getInteger("seconds");

await i.channel.setRateLimitPerUser(s);

i.reply("Slowmode "+s+"s");
}

/* LEVEL REWARD */

if(cmd=="levelreward"){
if(adminCheck()) return;

let level=i.options.getInteger("level");
let role=i.options.getRole("role");

if(!levelRewards[guild.id]) levelRewards[guild.id]={};

levelRewards[guild.id][level]=role.id;

save("./levelRewards.json",levelRewards);

i.reply(`Users get ${role.name} at level ${level}`);
}

});

/* LOGIN */

client.login(TOKEN);
