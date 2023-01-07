const token = process.env.BOT_TOKEN;
import * as dotenv from 'dotenv'
import TelegramBot from "node-telegram-bot-api";
import  youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log();

const botClient = new TelegramBot(token, { polling: true });


const getInfo = (url, flags) =>
  youtubedl(url, { dumpSingleJson: true, f: 'm4a', ...flags })

const fromInfo = (infoFile, flags) =>
  youtubedl.exec('', { loadInfoJson: infoFile, ...flags })

async function main (url, chatId, infoId) {
  // with this function we get a YtResponse with all the info about the video
  // this info can be read and used and then passed again to youtube-dl, without having to query it again
  const info = await getInfo(url)

  // write the info to a file for youtube-dl to read it
  fs.writeFileSync(`videoInfo-${info.id}.json`, JSON.stringify(info))

  // the info the we retrive can be read directly or passed to youtube-dl
  console.log(info.id)
  console.log(
    (await fromInfo(`videoInfo-${info.id}.json`, { listFormats: true })).stdout
  )

  // and finally we can download the video
  await fromInfo(`videoInfo-${info.id}.json`, { output: `/output/${chatId}-${info.id}.mp3` })
  return info.id;
}




botClient.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const url = msg.text.toString();
  const userMane =msg.chat.first_name;

  console.log(url);
  // botClient.sendMessage(chatId, mess);
  const infoId =  await main(url, chatId);
  
  console.log(`${__dirname}/output/${chatId}-${infoId}.mp3`)
  const streamUri = `${__dirname}/output/${chatId}-${infoId}.mp3`;
  botClient.sendChatAction(chatId, 'typing');

  botClient.sendMessage(chatId, `${userMane}, привет! Я сейчас отделю аудио от видео и пришлю его тебе!`);
  botClient.sendChatAction(chatId, 'upload_document');
  
  const stream = fs.createReadStream(streamUri);
  await botClient.sendAudio(chatId, stream);
});



 