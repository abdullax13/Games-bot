import "dotenv/config";
import mongoose from "mongoose";
import { Client, GatewayIntentBits } from "discord.js";
import { startFlagsEvent } from "./events/flagsEvent.js";
import User from "./models/User.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err));

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async message => {

  if (message.author.bot) return;

  if (message.content.startsWith("-ايفنت")) {
    const parts = message.content.split(" ");
    const value = parseInt(parts[1]);
    const target = isNaN(value) ? 10 : value;
    startFlagsEvent(message.channel, target);
  }

  if (message.content === "-توب") {

    const top = await User.find().sort({ totalPoints: -1 }).limit(10);

    let text = "🏆 أفضل اللاعبين:\n";

    top.forEach((u, i) => {
      text += `${i + 1}- <@${u.userId}> (${u.totalPoints})\n`;
    });

    message.channel.send(text);
  }
});

client.login(process.env.TOKEN);
