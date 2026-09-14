const fs=require("fs"),path=require("path");
const {createBot}=require("prismarine-bedrock");
const settings=JSON.parse(fs.readFileSync(path.join(__dirname,"settings.json"),"utf8"));
const HOST=settings.server.host, PORT=Number(settings.server.port), USERNAME=settings.bot.username;
const RECONNECT=settings.reconnect.enabled!==false;
let timer=null, blockTimer=null, delay=Number(settings.reconnect.initialDelayMs)||5000;
const maxDelay=Number(settings.reconnect.maxDelayMs)||60000;

function log(status,msg,extra={}) {
  if(global.updateBotState) global.updateBotState({status,server:`${HOST}:${PORT}`,username:USERNAME,lastEvent:msg,...extra});
  console.log(`[BOT] ${msg}`);
}
function savePosition(p) {
  if(!p) return;
  const x=Number(p.x),y=Number(p.y),z=Number(p.z);
  if(![x,y,z].every(Number.isFinite)) return;
  if(global.updateBotState) global.updateBotState({
    position:{x,y,z},
    blockPosition:{x:Math.floor(x),y:Math.floor(y-0.001),z:Math.floor(z)}
  });
}
async function updateBlock() {
  if(!bot || !bot.self?.position) return;
  const p=bot.self.position;
  savePosition(p);
  const pos={x:Math.floor(Number(p.x)),y:Math.floor(Number(p.y)-0.001),z:Math.floor(Number(p.z))};
  try {
    const block=await bot.getBlock(pos);
    if(block) {
      const name=block.name||"unknown", display=block.displayName||name;
      if(global.updateBotState) global.updateBotState({
        blockName:name, blockDisplayName:display, blockPosition:pos,
        lastEvent:`Standing on ${display} (${name})`
      });
    } else if(global.updateBotState) {
      global.updateBotState({blockName:null,blockDisplayName:null,lastEvent:"Position known; waiting for chunk data..."});
    }
  } catch(e) {
    if(global.updateBotState) global.updateBotState({blockName:null,blockDisplayName:null,lastEvent:"Waiting for world data..."});
  }
}
function startBlockWatcher() {
  if(blockTimer) clearInterval(blockTimer);
  setTimeout(()=>{updateBlock();blockTimer=setInterval(updateBlock,2000)},1500);
}
function stopBlockWatcher() {
  if(blockTimer){clearInterval(blockTimer);blockTimer=null}
}
function connect() {
  log("Connecting",`Connecting to ${HOST}:${PORT}...`);
  try {
    bot=createBot({
      host:HOST,port:PORT,offline:false,
      profilesFolder:path.join(__dirname,".minecraft"),
      username:USERNAME,loggingEnabled:false,
      onMsaCode:data=>{
        console.log("\n=== MICROSOFT LOGIN REQUIRED ===");
        console.log(`URL:  ${data.verification_uri}`);
        console.log(`CODE: ${data.user_code}`);
        console.log("================================\n");
        log("Authentication",`Microsoft login required. Code: ${data.user_code}`);
      }
    });
  } catch(e){log("Error",`Create client failed: ${e.message}`);scheduleReconnect();return}
  bot.on("join",()=>{delay=Number(settings.reconnect.initialDelayMs)||5000;log("Online","Joined the server.",{connectedAt:Date.now()})});
  bot.on("spawn",()=>{log("Online","Player spawned.");startBlockWatcher()});
  bot.on("move_player",p=>{if(p?.position)savePosition(p.position)});
  bot.on("close",r=>{stopBlockWatcher();log("Disconnected",`Connection closed: ${reason(r)}`);scheduleReconnect()});
  bot.on("error",e=>log("Error",`Connection error: ${e.message||e}`));
  bot.on("kick",r=>log("Kicked",`Server kicked the bot: ${reason(r)}`));
  bot.on("text",p=>{if(p?.message) console.log(`[CHAT] ${p.message}`)});
}
function scheduleReconnect() {
  if(!RECONNECT||timer)return;
  const d=delay;
  if(global.botState) global.botState.reconnects++;
  log("Reconnecting",`Reconnecting in ${Math.round(d/1000)} seconds...`);
  timer=setTimeout(()=>{timer=null;delay=Math.min(delay*1.5,maxDelay);connect()},d);
}
function reason(r){if(!r)return"Unknown reason";if(typeof r==="string")return r;try{return JSON.stringify(r)}catch{return String(r)}}
if(!HOST||HOST==="play.example.com") log("Error","Edit settings.json and set your real server host/port.");
else connect();
