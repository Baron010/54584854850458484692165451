const Discord = require('discord.js');
const client = new Discord.Client();
const  Util  = require('discord.js');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const GOOGLE_API_KEY = 'AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8';
const youtube = new YouTube(GOOGLE_API_KEY);
const queue = new Map();
const moment = require('moment');
const fs = require('fs');
const PREFIX = '-';
const prefix = "-"




const adminww = "--";
client.on('message', message => {
if (message.content === adminww + 'idle') {
     if (message.author.id !== '406192153979518976') return ;
     client.user.setStatus("idle")
}
});

const adminabdo = "--";
client.on('message', message => {
if (message.content === adminabdo + 'online') {
     if (message.author.id !== '406192153979518976') return ;
     client.user.setStatus("online")
}
});

const adminben = "--";
client.on('message', message => {
if (message.content === adminben + 'dnd') {
     if (message.author.id !== '406192153979518976') return ;
     client.user.setStatus("dnd")
}
});




client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));
client.on('reconnecting', () => console.log('I am reconnecting now!'));
client.on('message', async msg => { // eslint disable line
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(PREFIX)) return undefined;
    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(msg.guild.id);
    if (msg.content.startsWith(`${PREFIX}play`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}play command in ${msg.guild.name}`);
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: Music commands requires you to be in a voice channel.'
              }
            ]
          }
        });
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
            return msg.channel.send({embed: {
                color: 15010332,
                fields: [{
                    name: "Error",
                    value: `The bot can't connect to this channel due to a lack of permission.`
                  }
                ]
              }
            });
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send({embed: {
                color: 15010332,
                fields: [{
                    name: "Error",
                    value: `The bot can't connect to this channel due to a lack of permission.`
                  }
                ]
              }
            });
        }
        
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id);
                await handleVideo(video2, msg, voiceChannel, true) 
            }
            return msg.channel.send({embed: {
                fields: [{
                    name: "Music Queue",
                    value: `Added **${playlist.title}** to queue.`
                  }
                ]
              }
            });
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send({embed: {
                        fields: [{
                            name: "Music Queue",
                            value: "🎶 YouTube Search Results.",
                            value: ` ${videos.map(video2 => `\`${++index}\` **-** ${video2.title}`).join('\n')}`
                          },
                          {
                              name: "You have 10 seconds!",
                              value: "Provide a value to select on of the search results ranging from 1-10."
                          }
                        ]
                      }
                    }).then(message =>{message.delete(30000)})
                    try {
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send({embed: {
                            color: 15010332,
                            fields: [{
                                name: "Error",
                                value: ':notes: No or invalid value entered, cancelling video selection...'
                              }
                            ]
                          }
                        })
                    }
                    const videoIndex = (response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send({embed: {
                        color: 15010332,
                        fields: [{
                            name: "Error",
                            value: ':notes: I could not obtain any search results.'
                          }
                        ]
                      }
                    })
                }
            }

            return handleVideo(video, msg, voiceChannel);
        }
    } else if (msg.content.startsWith(`${PREFIX}skip`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}skip command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: You are not in a voice channel!'
              }
            ]
          }
        })
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: There is nothing playing that I could skip for you.'
              }
            ]
          }
        })
        serverQueue.connection.dispatcher.end();
        return undefined;
    } else if (msg.content.startsWith(`${PREFIX}stop`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}stop command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: You are not in a voice channel!'
              }
            ]
          }
        })
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: There is nothing playing that I could stop for you.'
              }
            ]
          }
        })
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command has been used!');
        return undefined;
    } else if (msg.content.startsWith(`${PREFIX}volume`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}volume command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: You are not in a voice channel!'
              }
            ]
          }
        })
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: There is nothing playing.'
              }
            ]
          }
        })
        if (!args[1]) return msg.channel.send({embed: {
            color: 10010332,
            fields: [{
                name: "Volume",
                value: `🔊 The current volume is: **${serverQueue.volume}**`
              }
            ]
          }
        })
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send({embed: {
            color: 10010332,
            fields: [{
                name: "Volume",
                value: `🔊 I set the volume to: **${args[1]}**`
              }
            ]
          }
        })
    } else if (msg.content.startsWith(`${PREFIX}np`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}np command in ${msg.guild.name}`);
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: There is nothing playing that I could skip for you.'
              }
            ]
          }
        })
        return msg.channel.send({embed: {
            fields: [{
                name: "Music Queue",
                value: `Added **${serverQueue.songs[0].title}** to queue`
            }
          ]
        }
        })
    } else if (msg.content.startsWith(`${PREFIX}queue`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}queue command in ${msg.guild.name}`);
        if (!serverQueue) return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: There is nothing playing that I could skip for you.'
              }
            ]
          }
        })
        return msg.channel.send({embed: {
            fields: [{
                name: "Music Queue",
                value: `Added ${serverQueue.songs.map(song => `**- ${song.title}**`).join('\n')} to queue`
            }
          ]
        }
        })

    } else if (msg.content.startsWith(`${PREFIX}pause`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}pause command in ${msg.guild.name}`);
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
        serverQueue.connection.dispatcher.pause();
        return msg.channel.send({embed: {
            fields: [{
                name: 'info',
                value: 'The player has been paused.'
              }
            ]
          }
        })
        }
        return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: There is nothing playing.'
              }
            ]
          }
        })
    } else if (msg.content.startsWith(`${PREFIX}resume`)) {
        console.log(`${msg.author.tag} has been used the ${PREFIX}resume command in ${msg.guild.name}`);

        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing =  true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send({embed: {
                fields: [{
                    name: 'info',
                    value: 'The player has resumed playing.'
                  }
                ]
              }
            })
        }
        return msg.channel.send({embed: {
            color: 15010332,
            fields: [{
                name: "Error",
                value: ':notes: There is nothing playing or something is already playing.'
              }
            ]
          }
        })
    }

    return undefined;
});


async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
        const song = {
            id: video.id,
            title: Util.escapeMarkdown(video.title),
            url: `https://www.youtube.com/watch?v=${video.id}`
        };
        if (!serverQueue) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);

            queueConstruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(msg.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`I could not join the voice channel: ${error}`);
                queue.delete(msg.guild.id);
                return msg.channel.send({embed: {
                    color: 15010332,
                    fields: [{
                        name: "Error",
                        value: `:notes: I could not join the voice channel: ${error}`
                      }
                    ]
                  }
                });
            }
        } else {
            serverQueue.songs.push(song);
            if (playlist) return undefined;
            else return msg.channel.send({embed: {
                fields: [{
                    name: "Music Queue",
                    value: `🎵 Added **${song.title}** to queue.`
                  }
                ]
              }
            })
        }
        return undefined;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', () => {
            console.log('Song ended.');
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.log(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send({embed: {
        fields: [{
            name: "Music Queue",
            value: `🎶 Added **${song.title}** to queue.`
          }
        ]
      }
    })
}



client.on('ready', () => { 
    console.log(`
    ------------------------------------------------------
    > Logging in...
    ------------------------------------------------------
    Name ${client.user.tag}
    In ${client.guilds.size} servers!
    ${client.channels.size} channels and ${client.users.size} users cached!
    I am logged in and ready to roll!
    LET'S GO!
    ------------------------------------------------------
    ------------------------------------------------------
    ------------------------------------------------------
    ------------------------[ abdo ]----------------------`);
  });
  

 client.on('message', async message => {
    if (message.channel.type === "dm") {
        if (message.author.id === client.user.id) return;
        var iiMo = new Discord.RichEmbed()
        .setColor('BLACK')
        .setTimestamp()
        .setTitle('Message in private bot')
        .setThumbnail(`${message.author.avatarURL}`)
        .setDescription(`\n\n\`\`\`${message.content}\`\`\``)
        .setFooter(`From ${message.author.tag} ${message.author.id}`)
        client.users.get("406192153979518976").send(iiMo);
    }
});
  
  client.on('message', async message =>{
    var roles = {};
    var args = message.content.split(' ').slice(1); 
    var msg = message.content.toLowerCase();
    if( !message.guild ) return;
    if( !msg.startsWith( prefix + 'role' ) ) return;
    var mentionned = message.mentions.users.first();
    var x5bzm;
    if(mentionned){
    var x5bzm = mentionned;
    } else {
    var x5bzm = message.author;
    }
  
    var a = message.author;
    if(!message.guild.member(message.author).hasPermission("MANAGE_ROLES")) return message.channel.send('This command for admins only');
    if( msg.toLowerCase().startsWith( prefix + 'roleremove' ) ){
      if( !args[0] ) return message.channel.send(`**${a.username,a.tag}**, User mention !!`);
      if( !args[1] ) return message.channel.send(`**${a.username,a.tag}**, Role name`);
      var role = msg.split(' ').slice(2).join(" ").toLowerCase(); 
      var role1 = message.guild.roles.filter( r=>r.name.toLowerCase().indexOf(role)>-1 ).first(); 
      if( !role1 ) return message.channel.send(`**${a.username,a.tag}**, Role name`);if( message.mentions.members.first() ){
        message.mentions.members.first().removeRole( role1 );
        return message.channel.send(`**${a.username,a.tag}**, remove role **${role1.name}** from **${x5bzm.username,x5bzm.tag}**`);
          }
      if( args[0].toLowerCase() == "all" ){
        message.guild.members.forEach(m=>m.removeRole( role1 ))
        return	message.channel.send(`**${a.username,a.tag}**, remove role **${role1.name}** from **all**`);
      } else if( args[0].toLowerCase() == "bots" ){
        message.guild.members.filter(m=>m.user.bot).forEach(m=>m.removeRole(role1))
        return	message.channel.send(`**${a.username,a.tag}**, remove role **${role1.name}** from **bots**`);
      } else if( args[0].toLowerCase() == "humans" ){
        message.guild.members.filter(m=>!m.user.bot).forEach(m=>m.removeRole(role1))
        return	message.channel.send(`**${a.username,a.tag}**, remove role **${role1.name}** from **humans**`);
      } 	
    } else {       
      if( !args[0] ) return message.channel.send(`**${a.username,a.tag}**, User mention !!`);
      if( !args[1] ) return message.channel.send(`**${a.username,a.tag}**, Role name`);
      var role = msg.split(' ').slice(2).join(" ").toLowerCase(); 
      var role1 = message.guild.roles.filter( r=>r.name.toLowerCase().indexOf(role)>-1 ).first(); 
      if( !role1 ) return message.channel.send(`**${a.username,a.tag}**, Does not exist`);if( message.mentions.members.first() ){
        message.mentions.members.first().addRole( role1 );
        return message.channel.send(`**${a.username,a.tag}**, added role **${role1.name}** to **${x5bzm.username,x5bzm.tag}**`);
      }
      if( args[0].toLowerCase() == "all" ){
        message.guild.members.forEach(m=>m.addRole( role1 ))
        return	message.channel.send(`**${a.username,a.tag}**, added role **${role1.name}** to **all**`);
      } else if( args[0].toLowerCase() == "bots" ){
        message.guild.members.filter(m=>m.user.bot).forEach(m=>m.addRole(role1))
        return	message.channel.send(`**${a.username,a.tag}**, added role **${role1.name}** to **bots**`);
      } else if( args[0].toLowerCase() == "humans" ){
        message.guild.members.filter(m=>!m.user.bot).forEach(m=>m.addRole(role1))
        return	message.channel.send(`**${a.username,a.tag}**, added role **${role1.name}** to **humans**`);
      } 
    } 
    
  });
  
  
  client.on("guildMemberAdd", member => {
    member.createDM().then(function (channel) {
       var embed = new Discord.RichEmbed()
       .setColor('RANDOM')
      .setDescription(`:rose: Welcome to server **${member.guild.name}** :rose: 
      :crown:Mister **${member.user.username,member.user.tag}**
       ✏  You are the member number **${member.guild.memberCount}** `)
       .setTitle("Don't forget rules the clan to avoid the ban")
       .setURL('https://discord.gg/4thpgcf')
      .setImage('https://cdn.discordapp.com/attachments/470319916537348099/488176391288913920/Sans-Simple-Green.gif')
      .setFooter('S bot','https://cdn.discordapp.com/avatars/464139412251344897/f537769c6c17e31bb6969ef14c64ec61.png')
      channel.send(embed);
    }).catch(console.error)
  })
  
  client.on('message', message => {
  
    if (message.content.startsWith("salam")) {
        message.react('👋')
    } 
    if (message.content.startsWith("سلام")) {
        message.react('👋')
    }
    if (message.content.startsWith("اهلا")) {
        message.react('👋')
    }
    if (message.content.startsWith("مرحبا")) {
        message.react('👋')
    }
    if (message.content.startsWith("hello")) {
        message.react('👋')
    }
    if (message.content.startsWith("Hello")) {
        message.react('👋')
    }
    if (message.content.startsWith("slm")) {
        message.react('👋')
    }
    if (message.content.startsWith("Всем привет")) {
        message.react('👋')
    }
    if (message.content.startsWith("всем привет")) {
        message.react('👋')
    }
    if (message.content.startsWith("Bonjour")) {
        message.react('👋')
    }
    if (message.content.startsWith("bonjour")) {
        message.react('👋')
    }
    if (message.content.startsWith("bonne nuit")) {
        message.react('👋')
    }
    if (message.content.startsWith("Bonne nuit")) {
        message.react('👋')
    }
    if (message.content.startsWith("Au revoir")) {
        message.react('👋')
    }
    if (message.content.startsWith("au revoir")) {
        message.react('👋')
    }
    if (message.content.startsWith("wa fen")) {
        message.react('👋')
    }
    if (message.content.startsWith("سأذهب للنوم")) {
        message.react('😴')
    }
    if (message.content.startsWith("هلا")) {
        message.react('👋')
    }
    if (message.content.startsWith("hey")) {
        message.react('👋')
    }
    if (message.content.startsWith("Здравствуйте")) {
        message.react('👋')
    }
    if (message.content.startsWith("Привет")) {
        message.react('👋')
    }
    if (message.content.startsWith("привет")) {
        message.react('👋')
    }
    if (message.content.startsWith("Hola")) {
        message.react('👋')
    }
    if (message.content.startsWith("hola")) {
        message.react('👋')
    }
   if (message.content.startsWith("adiós")) {
        message.react('👋')
    }
   if (message.content.startsWith("Adiós")) {
        message.react('👋')
    }
   if (message.content.startsWith("HOLA")) {
       message.react('👋')
    }
   if (message.content.startsWith("buenas noches")) {
       message.react('👋')
    }
   if (message.content.startsWith("Buenos días")) {
       message.react('👋')
    }
   if (message.content.startsWith("buenos días")) {
       message.react('👋')
    }
   if (message.content.startsWith("Buenas noches")) {
       message.react('👋')
    }
   if (message.content.startsWith("Прощай")) {
       message.react('👋')
    }
   if (message.content.startsWith("прощай")) {
       message.react('👋')
    }
   if (message.content.startsWith("хорошо")) {
       message.react('👋')
    }
  if (message.content.startsWith("доброй ночи")) {
       message.react('👋')
    }
  if (message.content.startsWith("доброе утро")) {
       message.react('👋')
    }
  if (message.content.startsWith("Добрый вечер")) {
       message.react('👋')
    }
  if (message.content.startsWith("добрый вечер")) {
       message.react('👋')
    }
  if (message.content.startsWith("я пойду спать")) {
       message.react('👋')
    }
  if (message.content.startsWith("iré a dormir")) {
       message.react('👋')
    }
  if (message.content.startsWith("HELLO")) {
       message.react('👋')
    }
  if (message.content.startsWith("bye")) {
       message.react('👋')
    }
  if (message.content.startsWith("Bye")) {
       message.react('👋')
    }
  if (message.content.startsWith("good bye")) {
       message.react('👋')
    }
  if (message.content.startsWith("Good bye")) {
       message.react('👋')
    }
  if (message.content.startsWith("good night")) {
       message.react('👋')
    }
  if (message.content.startsWith("Good night")) {
       message.react('👋')
    }
  if (message.content.startsWith("hi")) {
        message.react('👋')
    }
  if (message.content.startsWith("Hi")) {
        message.react('👋')
  }
  
  });
  
  
  
  client.on('message', message => {
  var mentionned = message.mentions.users.first();
  var abdo;
  if(mentionned){
  var abdo = mentionned;
  } else {
  var abdo = message.author;
  }
  if (message.content.startsWith(`<@${abdo.id}> salam`)) {
     message.react('👋')
  } 
  if (message.content.startsWith(`<@${abdo.id}> سلام`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> اهلا`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> مرحبا`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> hello`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Hello`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> slm`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Всем привет`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> всем привет`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Bonjour`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> bonjour`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> bonne nuit`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Bonne nuit`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Au revoir`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> au revoir`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> wa fen`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> سأذهب للنوم`)) {
     message.react('😴')
  }
  if (message.content.startsWith(`<@${abdo.id}> هلا`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> hey`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Здравствуйте`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Привет`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> привет`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Hola`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> hola`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> adiós`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Adiós`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> HOLA`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> buenas noches`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}>Buenos días`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> buenos días`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Buenas noches`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Прощай`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> прощай`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> хорошо`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> доброй ночи`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> доброе утро`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Добрый вечер`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> добрый вечер`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> я пойду спать`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> iré a dormir`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> HELLO`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> bye`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Bye`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> good bye`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Good bye`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> good night`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Good night`)) {
    message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> hi`)) {
     message.react('👋')
  }
  if (message.content.startsWith(`<@${abdo.id}> Hi`)) {
     message.react('👋')
  }
  
  });
  
  
  
  client.on('guildCreate', guild => {
    var embed = new Discord.RichEmbed()
    .setColor("BLACK")
    .setDescription(`
    🤴 hello master
    ♻ thanks for added the bot in your server 👍
  1️⃣ **My prefix is** [-]
  2️⃣ ❔ Important step ⚠ 
  3️⃣ create channel named 'welcome' and channel named 'log' and logs
  4️⃣ more info type **-help**
  5️⃣ easy command thanks again 💜
  🅰 The next best
  💌 if you want send message to owner **.bcowner**
   version 4.0.0 ©
    `)
    .setTimestamp()
        guild.owner.send(embed)
  });
  
  
  let al = JSON.parse(fs.readFileSync(`./antilinks.json`, `utf8`));
  
  
  
  client.on('message', message => {
      var sender = message.author
      if (!message.channel.guild) return;
      if (message.author.bot) return null;
  
      if (!al[message.guild.id]) al[message.guild.id] = {
          onoff: 'Off'
      }
  
      if (message.content ==='-antiinfo') {
      if(!message.channel.guild) return message.reply('This command only for servers');
          let perms = message.member.hasPermission(`MANAGE_GUILD`)
          if (!perms) return message.reply(`You don't have permissions: Manage Guild.`)
          var embed = new Discord.RichEmbed()
              .setDescription(`Now antilinks state is : ${al[message.guild.id].onoff}`)
              .setColor(`BLACK`)
          message.channel.send({
              embed
          })
      }
      if (message.content === '-antilinks') {
      if(!message.channel.guild) return message.reply('This command only for servers');
          let perms = message.member.hasPermission(`MANAGE_GUILD`)
          if (!perms) return message.reply(`You don't have permissions`)
          let args = message.content.split(" ").slice(1)
          if (!args.join(" ")) {
              if (al[message.guild.id].onoff === 'Off') return [message.channel.send(`The Antlinks event has been toggled to On!🛡`), al[message.guild.id].onoff = 'On']
              if (al[message.guild.id].onoff === 'On') return [message.channel.send(`The Antilinks event has been toggled to Off!🛡 ❎`), al[message.guild.id].onoff = 'Off'] //:D
  
          }
      }
      if (message.content.includes('https://discord.gg/','https://discordapp.com/invite')) {
          if (al[message.guild.id].onoff === 'Off') return
          if (message.member.hasPermission('ADMINISTRATOR')) return;
          message.delete()
          return message.reply(`Advertising isn't allowed here ! 💨`)
      }
     
      fs.writeFile("./antilinks.json", JSON.stringify(al), (err) => {
          if (err) console.error(err)
      });
  });
  

  
  const cuttweet = [
      'You are 1% gay :gay_pride_flag:',
      'You are 2% gay :gay_pride_flag:',
      'You are 3% gay :gay_pride_flag:',
      'You are 4% gay :gay_pride_flag:',
      'You are 5% gay :gay_pride_flag:',
      'You are 6% gay :gay_pride_flag:',
      'You are 7% gay :gay_pride_flag:',
      'You are 8% gay :gay_pride_flag:',
      'You are 9% gay :gay_pride_flag:',
      'You are 10% gay :gay_pride_flag:',
      'You are 11% gay :gay_pride_flag:',
      'You are 12% gay :gay_pride_flag:',
      'You are 13% gay :gay_pride_flag:',
      'You are 14% gay :gay_pride_flag:',
      'You are 15% gay :gay_pride_flag:',
      'You are 16% gay :gay_pride_flag:',
      'You are 17% gay :gay_pride_flag:',
      'You are 18% gay :gay_pride_flag:',
      'You are 19% gay :gay_pride_flag:',
      'You are 20% gay :gay_pride_flag:',
      'You are 21% gay :gay_pride_flag:',
      'You are 22% gay :gay_pride_flag:',
      'You are 23% gay :gay_pride_flag:',
      'You are 24% gay :gay_pride_flag:',
      'You are 25% gay :gay_pride_flag:',
      'You are 26% gay :gay_pride_flag:',
      'You are 27% gay :gay_pride_flag:',
      'You are 28% gay :gay_pride_flag:',
      'You are 29% gay :gay_pride_flag:',
      'You are 30% gay :gay_pride_flag:',
      'You are 31% gay :gay_pride_flag:',
      'You are 32% gay :gay_pride_flag:',
      'You are 33% gay :gay_pride_flag:',
      'You are 34% gay :gay_pride_flag:',
      'You are 35% gay :gay_pride_flag:',
      'You are 36% gay :gay_pride_flag:',
      'You are 37% gay :gay_pride_flag:',
      'You are 38% gay :gay_pride_flag:',
      'You are 39% gay :gay_pride_flag:',
      'You are 40% gay :gay_pride_flag:',
      'You are 41% gay :gay_pride_flag:',
      'You are 42% gay :gay_pride_flag:',
      'You are 43% gay :gay_pride_flag:',
      'You are 44% gay :gay_pride_flag:',
      'You are 45% gay :gay_pride_flag:',
      'You are 46% gay :gay_pride_flag:',
      'You are 47% gay :gay_pride_flag:',
      'You are 48% gay :gay_pride_flag:',
      'You are 49% gay :gay_pride_flag:',
      'You are 50% gay :gay_pride_flag:',
      'You are 51% gay :gay_pride_flag:',
      'You are 52% gay :gay_pride_flag:',
      'You are 53% gay :gay_pride_flag:',
      'You are 54% gay :gay_pride_flag:',
      'You are 55% gay :gay_pride_flag:',
      'You are 56% gay :gay_pride_flag:',
      'You are 57% gay :gay_pride_flag:',
      'You are 58% gay :gay_pride_flag:',
      'You are 59% gay :gay_pride_flag:',
      'You are 60% gay :gay_pride_flag:',
      'You are 61% gay :gay_pride_flag:',
      'You are 62% gay :gay_pride_flag:',
      'You are 63% gay :gay_pride_flag:',
      'You are 64% gay :gay_pride_flag:',
      'You are 65% gay :gay_pride_flag:',
      'You are 66% gay :gay_pride_flag:',
      'You are 67% gay :gay_pride_flag:',
      'You are 68% gay :gay_pride_flag:',
      'You are 69% gay :gay_pride_flag:',
      'You are 70% gay :gay_pride_flag:',
      'You are 71% gay :gay_pride_flag:',
      'You are 72% gay :gay_pride_flag:',
      'You are 73% gay :gay_pride_flag:',
      'You are 74% gay :gay_pride_flag:',
      'You are 75% gay :gay_pride_flag:',
      'You are 76% gay :gay_pride_flag:',
      'You are 77% gay :gay_pride_flag:',
      'You are 78% gay :gay_pride_flag:',
      'You are 79% gay :gay_pride_flag:',
      'You are 80% gay :gay_pride_flag:',
      'You are 81% gay :gay_pride_flag:',
      'You are 82% gay :gay_pride_flag:',
      'You are 83% gay :gay_pride_flag:',
      'You are 84% gay :gay_pride_flag:',
      'You are 85% gay :gay_pride_flag:',
      'You are 86% gay :gay_pride_flag:',
      'You are 87% gay :gay_pride_flag:',
      'You are 88% gay :gay_pride_flag:',
      'You are 89% gay :gay_pride_flag:',
      'You are 90% gay :gay_pride_flag:',
      'You are 91% gay :gay_pride_flag:',
      'You are 92% gay :gay_pride_flag:',
      'You are 93% gay :gay_pride_flag:',
      'You are 94% gay :gay_pride_flag:',
      'You are 95% gay :gay_pride_flag:',
      'You are 96% gay :gay_pride_flag:',
      'You are 97% gay :gay_pride_flag:',
      'You are 98% gay :gay_pride_flag:',
      'You are 99% gay :gay_pride_flag:',
      'You are 100% gay :gay_pride_flag:',
   ]
  client.on('message', message => {
  if(message.content === prefix + 'gay') {
  if(!message.channel.guild) return message.reply('This command only for servers');
  var embed = new Discord.RichEmbed()
  .setColor('RANDOM')
  .addField('gay r8 machine' ,
   `${cuttweet[Math.floor(Math.random() * cuttweet.length)]}`)
  message.channel.sendEmbed(embed);
     }
   });
  
  
  client.on('message', gay => {
        if(gay.content.startsWith(prefix + "gay")) {
          if(!gay.channel.guild) return gay.reply('This command only for servers');
          let args = gay.content.split(" ").slice(1);
           let kiss1 = [
            ' 0% gay :gay_pride_flag:',
            ' 1% gay :gay_pride_flag:',
            ' 2% gay :gay_pride_flag:',
            ' 3% gay :gay_pride_flag:',
            ' 4% gay :gay_pride_flag:',
            ' 5% gay :gay_pride_flag:',
            ' 6% gay :gay_pride_flag:',
            ' 7% gay :gay_pride_flag:',
            ' 8% gay :gay_pride_flag:',
            ' 9% gay :gay_pride_flag:',
            ' 10% gay :gay_pride_flag:',
            ' 11% gay :gay_pride_flag:',
            ' 12% gay :gay_pride_flag:',
            ' 13% gay :gay_pride_flag:',
            ' 14% gay :gay_pride_flag:',
            ' 15% gay :gay_pride_flag:',
            ' 16% gay :gay_pride_flag:',
            ' 17% gay :gay_pride_flag:',
            ' 18% gay :gay_pride_flag:',
            ' 19% gay :gay_pride_flag:',
            ' 20% gay :gay_pride_flag:',
            ' 21% gay :gay_pride_flag:',
            ' 22% gay :gay_pride_flag:',
            ' 23% gay :gay_pride_flag:',
            ' 24% gay :gay_pride_flag:',
            ' 25% gay :gay_pride_flag:',
            ' 26% gay :gay_pride_flag:',
            ' 27% gay :gay_pride_flag:',
            ' 28% gay :gay_pride_flag:',
            ' 29% gay :gay_pride_flag:',
            ' 30% gay :gay_pride_flag:',
            ' 31% gay :gay_pride_flag:',
            ' 32% gay :gay_pride_flag:',
            ' 33% gay :gay_pride_flag:',
            ' 34% gay :gay_pride_flag:',
            ' 35% gay :gay_pride_flag:',
            ' 36% gay :gay_pride_flag:',
            ' 37% gay :gay_pride_flag:',
            ' 38% gay :gay_pride_flag:',
            ' 39% gay :gay_pride_flag:',
            ' 40% gay :gay_pride_flag:',
            ' 41% gay :gay_pride_flag:',
            ' 42% gay :gay_pride_flag:',
            ' 43% gay :gay_pride_flag:',
            ' 44% gay :gay_pride_flag:',
            ' 45% gay :gay_pride_flag:',
            ' 46% gay :gay_pride_flag:',
            ' 47% gay :gay_pride_flag:',
            ' 48% gay :gay_pride_flag:',
            ' 49% gay :gay_pride_flag:',
            ' 50% gay :gay_pride_flag:',
            ' 51% gay :gay_pride_flag:',
            ' 52% gay :gay_pride_flag:',
            ' 53% gay :gay_pride_flag:',
            ' 54% gay :gay_pride_flag:',
            ' 55% gay :gay_pride_flag:',
            ' 56% gay :gay_pride_flag:',
            ' 57% gay :gay_pride_flag:',
            ' 58% gay :gay_pride_flag:',
            ' 59% gay :gay_pride_flag:',
            ' 60% gay :gay_pride_flag:',
            ' 61% gay :gay_pride_flag:',
            ' 62% gay :gay_pride_flag:',
            ' 63% gay :gay_pride_flag:',
            ' 64% gay :gay_pride_flag:',
            ' 65% gay :gay_pride_flag:',
            ' 66% gay :gay_pride_flag:',
            ' 67% gay :gay_pride_flag:',
            ' 68% gay :gay_pride_flag:',
            ' 69% gay :gay_pride_flag:',
            ' 70% gay :gay_pride_flag:',
            ' 71% gay :gay_pride_flag:',
            ' 72% gay :gay_pride_flag:',
            ' 73% gay :gay_pride_flag:',
            ' 74% gay :gay_pride_flag:',
            ' 75% gay :gay_pride_flag:',
            ' 76% gay :gay_pride_flag:',
            ' 77% gay :gay_pride_flag:',
            ' 78% gay :gay_pride_flag:',
            ' 79% gay :gay_pride_flag:',
            ' 80% gay :gay_pride_flag:',
            ' 81% gay :gay_pride_flag:',
            ' 82% gay :gay_pride_flag:',
            ' 83% gay :gay_pride_flag:',
            ' 84% gay :gay_pride_flag:',
            ' 85% gay :gay_pride_flag:',
            ' 86% gay :gay_pride_flag:',
            ' 87% gay :gay_pride_flag:',
            ' 88% gay :gay_pride_flag:',
            ' 89% gay :gay_pride_flag:',
            ' 90% gay :gay_pride_flag:',
            ' 91% gay :gay_pride_flag:',
            ' 92% gay :gay_pride_flag:',
            ' 93% gay :gay_pride_flag:',
            ' 94% gay :gay_pride_flag:',
            ' 95% gay :gay_pride_flag:',
            ' 96% gay :gay_pride_flag:',
            ' 97% gay :gay_pride_flag:',
            ' 98% gay :gay_pride_flag:',
            ' 99% gay :gay_pride_flag:',
            ' 100% gay :gay_pride_flag:',          
           ]
  if (!args[0]) {
  return;
  }
  if (!gay.mentions.members.first().user.username === gay.isMentioned(gay.author)) {
  const hembed = new Discord.RichEmbed()
  .setColor(0xFF0000)
  .addField('gay r8 machine',`${gay.mentions.members.first().user.username} is ${kiss1[Math.floor(Math.random() * kiss1.length)]}`)
  .setImage(kiss1[kiss1])
  gay.channel.send({
  embed: hembed
  })
  return;
  }
  }
  });
  
  client.on('message', message => {
  if (message.content.startsWith("-myid")) {
  if (message.channel.type === 'dm') return message.reply('This command for server only');   
  var Canvas = module.require('canvas');
  var jimp = module.require('jimp');
  const w = ['./img/ID1.png','./img/ID2.png','./img/ID3.png','./img/ID4.png','./img/ID5.png'];
  let Image = Canvas.Image,
  canvas = new Canvas(802, 404),
  ctx = canvas.getContext('2d');
  ctx.patternQuality = 'bilinear';
  ctx.filter = 'bilinear';
  ctx.antialias = 'subpixel';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 2;
  fs.readFile(`${w[Math.floor(Math.random() * w.length)]}`, function (err, Background) {
  if (err) return console.log(err);
  let BG = Canvas.Image;
  let ground = new Image;
  ground.src = Background;
  ctx.drawImage(ground, 0, 0, 802, 404);
  })
          var men = message.mentions.users.first();
             var heg;
             if(men) {
                 heg = men
             } else {
                 heg = message.author
             }
           var mentionned = message.mentions.members.first();
              var h;
             if(mentionned) {
                 h = mentionned
             } else {
                 h = message.member
             }
             var ment = message.mentions.users.first();
             var getvalueof;
  if(ment) {
  getvalueof = ment;
  } else {
  getvalueof = message.author;
  }
  let url = getvalueof.displayAvatarURL.endsWith(".webp") ? getvalueof.displayAvatarURL.slice(5, -20) + ".png" : getvalueof.displayAvatarURL;
  jimp.read(url, (err, ava) => {
  if (err) return console.log(err);
  ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
  if (err) return console.log(err);
  let Avatar = Canvas.Image;
  let ava = new Avatar;
  ava.src = buf;
  ctx.beginPath();
  ctx.drawImage(ava, 335, 3, 160, 160);
  ctx.font = '35px Arial Bold';
  ctx.fontSize = '40px';
  ctx.fillStyle = "#dadada";
  ctx.textAlign = "center";    
  ctx.font = '30px Arial Bold';
  ctx.fontSize = '30px';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${getvalueof.username}`,655, 170);                             
  moment.locale('en-en');                         
  ctx.font = '30px Arial';
  ctx.fontSize = '30px';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${moment(h.joinedAt).fromNow()}`,150, 305);
  ctx.font = '30px Arial';
  ctx.fontSize = '30px';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${moment(heg.createdTimestamp).fromNow()}`,150, 170); 
  let status;
  if (getvalueof.presence.status === 'online') {
  status = 'Online';
  } else if (getvalueof.presence.status === 'dnd') {
  status = 'dnd';
  } else if (getvalueof.presence.status === 'idle') {
  status = 'idle';
  } else if (getvalueof.presence.status === 'offline') {
  status = 'Offline';
  }
  ctx.cont = '35px Arial';
  ctx.fontSize = '30px';
  ctx.filleStyle = '#ffffff'
  ctx.fillText(`${status}`,655,305)
  ctx.font = 'regular 30px Cairo';
  ctx.fontSize = '30px';
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${h.presence.game === null ? "Do not play" : h.presence.game.name}`,390,390);
  ctx.font = '35px Arial';
  ctx.fontSize = '30px';
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`#${heg.discriminator}`,390,260)                    
  ctx.beginPath();
  ctx.stroke();
  message.channel.sendFile(canvas.toBuffer());                     
  })                       
  })
  }
  });
  
  


client.on('message', message => {
  if (message.content.startsWith("-nik")) {
     if (message.channel.type === 'dm') return message.reply('This Command Is Not Avaible In Dm\'s :x:');   
    var Canvas = module.require('canvas');
    var jimp = module.require('jimp');
const w = ['./lol/lol.png'];
     let Image = Canvas.Image,
         canvas = new Canvas(270, 480),
         ctx = canvas.getContext('2d');
     ctx.patternQuality = 'bilinear';
     ctx.filter = 'bilinear';
     ctx.antialias = 'subpixel';
     ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
     ctx.shadowOffsetY = 2;
     ctx.shadowBlur = 2;
     fs.readFile(`${w[Math.floor(Math.random() * w.length)]}`, function (err, Background) {
         if (err) return console.log(err);
         let BG = Canvas.Image;
         let ground = new Image;
         ground.src = Background;
         ctx.drawImage(ground, 0, 0, 270, 480);
})
  var men = message.mentions.users.first();
     var heg;
     if(men) {
         heg = men
     } else {
         heg = message.author
     }
   var mentionned = message.mentions.members.first();
      var h;
     if(mentionned) {
         h = mentionned
     } else {
         h = message.member
     }
     var ment = message.mentions.users.first();
     var getvalueof;
     var a = message.author;
if(ment) {
getvalueof = ment;
} else {
getvalueof = message.author;
}
let url = getvalueof.displayAvatarURL.endsWith(".webp") ? getvalueof.displayAvatarURL.slice(5, -20) + ".png" : getvalueof.displayAvatarURL;
jimp.read(url, (err, ava) => {
if (err) return console.log(err);
ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
if (err) return console.log(err);
let Avatar = Canvas.Image;
let ava = new Avatar;
ava.src = buf;
ctx.beginPath();
ctx.drawImage(ava, 200, 310, 60, 60);
ctx.font = '35px Arial Bold';
ctx.fontSize = '40px';
ctx.fillStyle = "#dadada";
ctx.textAlign = "center";
ctx.font = '30px Arial Bold';
ctx.fontSize = '30px';
ctx.fillStyle = "#ffffff";

let url = a.displayAvatarURL.endsWith(".webp") ? a.slice(5, -20) + ".png" : a.displayAvatarURL;
jimp.read(url, (err, ava) => {
if (err) return console.log(err);
ava.getBuffer(jimp.MIME_PNG, (err, buf) => {
if (err) return console.log(err);
let Avatar = Canvas.Image;
let ava = new Avatar;
ava.src = buf;
ctx.beginPath();
ctx.drawImage(ava, 100, 30, 90, 90);
ctx.font = '35px Arial Bold';
ctx.fontSize = '40px';
ctx.fillStyle = "#dadada";
ctx.textAlign = "center";
ctx.font = '30px Arial Bold';
ctx.fontSize = '30px';
ctx.fillStyle = "#ffffff";
message.channel.sendFile(canvas.toBuffer());
})                       
})
})
})
}
});





const weather = require('weather-js');
 client.on('message', message => {
     if(message.content.startsWith(prefix + "meteo")) {
         var args = message.content.split(" ").slice(1);
 weather.find({search: args.join(" "), degreeType: 'C'}, function(err, result) {
      if (err) message.channel.send(err);
      if (result === undefined || result.length === 0) {
          message.channel.send('**Please enter a location!**')
          return;
      }
      var current = result[0].current;
      var location = result[0].location;
      const embed = new Discord.RichEmbed()
          .setDescription(`**${current.skytext}**`)
          .setAuthor(`Weather for ${current.observationpoint}`)
          .setThumbnail(current.imageUrl)
          .setColor(message.guild.me.highestRole.color) 
          .addField('Timezone',`UTC${location.timezone}`, true)
          .addField('Degree Type',location.degreetype, true)
          .addField('Temperature',`${current.temperature} Degrees`, true)
          .addField('Feels Like', `${current.feelslike} Degrees`, true)
          .addField('Winds',current.winddisplay, true)
          .addField('Humidity', `${current.humidity}%`, true)
          message.channel.send({embed});
  })
}
 });
    
    
    client.on('message',async message => {
      if(message.content.startsWith("--restart")) {
        if(message.author.id !== "406192153979518976") return ;
        console.log(`${message.author.tag} [ ${message.author.id} ] has restarted the bot.`);
        console.log(`Restarting..`);
        setTimeout(() => {
          client.destroy();
          client.login(process.env.BOT_TOKEN);
        },3000);
      }
    });
  

client.on('message', message => {
  if (message.author.bot) return;
   if (message.content === prefix + "invite" || message.content === prefix + "inv" || message.content === prefix + "INVITE" || message.content === prefix + "INV") {
  let embed = new Discord.RichEmbed()
  .setAuthor('Get me on your server!')
  .setTitle('__**Click to invite Gnar to your server.**__')
 .setURL('https://discordapp.com/oauth2/authorize?client_id=464139412251344897&scope=bot&permissions=8')
 message.channel.sendEmbed(embed);
 }
});


client.on('message', function(msg) {
  if (msg.content === prefix + "about") {
    if(!msg.channel.guild) return msg.reply('This command only for servers ⁉');
    var channels = msg.guild.channels.map(channels => `${channels.name}, `).join(' ')
    let embed = new Discord.RichEmbed()
    .setThumbnail(client.user.avatarURL)
    .addField('Bot Information',`Dros Bot ™ bot is a music bot packed with dank memes to rescue your soul from the depths of the underworld.`)
    .addField('Text Channels',` ${msg.guild.channels.filter(m => m.type === 'text').size}`,true)
    .addField('Voice Channels',` ${msg.guild.channels.filter(m => m.type === 'voice').size} `,true)
    .addField('Guilds' ,`${client.guilds.size}` , true)
    .addField('Voice Connections' ,`${client.voiceConnections.size}` , true)
    .addField('Users' ,`${client.users.size}` , true)
    msg.channel.send({embed:embed});
  }
});


const codes = {
	"a": "𝒶",
	"b": "𝒷",
	"c": "𝒸",
	"d": "𝒹",
	"e": "𝑒",
	"f": "𝒻",
	"g": "𝑔",
	"h": "𝒽",
	"i": "𝒾",
	"j": "𝒿",
	"k": "𝓀",
	"l": "𝓁",
	"m": "𝓂",
	"n": "𝓃",
	"o": "𝑜",
	"p": "𝓅",
	"q": "𝓆",
	"r": "𝓇",
	"s": "𝓈",
	"t": "𝓉",
	"u": "𝓊",
	"v": "𝓋",
	"w": "𝓌",
	"x": "𝓍",
	"y": "𝓎",
	"z": "𝓏",
	"A": "𝒜",
	"B": "𝐵",
	"C": "𝒞",
	"D": "𝒟",
	"E": "𝐸",
	"F": "𝐹",
	"G": "𝒢",
	"H": "𝐻",
	"I": "𝐼",
	"J": "𝒥",
	"K": "𝒦",
	"L": "𝐿",
	"M": "𝑀",
	"N": "𝒩",
	"O": "𝒪",
	"P": "𝒫",
	"Q": "𝒬",
	"R": "𝑅",
	"S": "𝒮",
	"T": "𝒯",
	"U": "𝒰",
	"V": "𝒱",
	"W": "𝒲",
	"X": "𝒳",
	"Y": "𝒴",
	"Z": "𝒵"
};

client.on('message' , async message => {
  if (message.content.startsWith(prefix + 'te')) {
        let args = message.content.split(" ").slice(1)
if (args.length < 1) {
  message.channel.send('You must provide some text');
}
message.channel.send(args.join(' ').split('').map(c => codes[c] || c).slice(1).join('')
 
);
};
});


const codesa = {
	"a": "𝒶",
	"b": "𝒷",
	"c": "𝒸",
	"d": "𝒹",
	"e": "𝑒",
	"f": "𝒻",
	"g": "𝑔",
	"h": "𝒽",
	"i": "𝒾",
	"j": "𝒿",
	"k": "𝓀",
	"l": "𝓁",
	"m": "𝓂",
	"n": "𝓃",
	"o": "𝑜",
	"p": "𝓅",
	"q": "𝓆",
	"r": "𝓇",
	"s": "𝓈",
	"t": "𝓉",
	"u": "𝓊",
	"v": "𝓋",
	"w": "𝓌",
	"x": "𝓍",
	"y": "𝓎",
	"z": "𝓏",
	"A": "𝒜",
	"B": "𝐵",
	"C": "𝒞",
	"D": "𝒟",
	"E": "𝐸",
	"F": "𝐹",
	"G": "𝒢",
	"H": "𝐻",
	"I": "𝐼",
	"J": "𝒥",
	"K": "𝒦",
	"L": "𝐿",
	"M": "𝑀",
	"N": "𝒩",
	"O": "𝒪",
	"P": "𝒫",
	"Q": "𝒬",
	"R": "𝑅",
	"S": "𝒮",
	"T": "𝒯",
	"U": "𝒰",
	"V": "𝒱",
	"W": "𝒲",
	"X": "𝒳",
	"Y": "𝒴",
	"Z": "𝒵"
};

client.on('message' , async message => {
  if (message.content.startsWith(prefix + 'teembed')) {
        let args = message.content.split(" ").slice(1)
if (args.length < 1) {
  message.channel.send('You must provide some text');
}
let embed = new Discord.RichEmbed()
.setDescription(args.join(' ').split('').map(c => codesa[c] || c).slice(1).join(''))
message.channel.send(embed);
};
});


client.login(process.env.BOT_TOKEN);
