import flags from "../data/flags.json" assert { type: "json" };
import User from "../models/User.js";

let activeEvent = {
  running: false,
  targetPoints: 0,
  scores: {},
  usedFlags: [],
  noAnswerRounds: 0
};

function getRandomFlag() {
  const available = flags.filter(f => !activeEvent.usedFlags.includes(f.code));
  if (available.length === 0) activeEvent.usedFlags = [];

  const random = available[Math.floor(Math.random() * available.length)];
  activeEvent.usedFlags.push(random.code);
  return random;
}

export async function startFlagsEvent(channel, targetPoints) {

  if (activeEvent.running) {
    channel.send("يوجد إيفنت شغال حالياً.");
    return;
  }

  activeEvent.running = true;
  activeEvent.targetPoints = targetPoints;
  activeEvent.scores = {};
  activeEvent.noAnswerRounds = 0;
  activeEvent.usedFlags = [];

  nextRound(channel);
}

async function nextRound(channel) {

  if (!activeEvent.running) return;

  const flag = getRandomFlag();
  const imageURL = `https://flagcdn.com/w320/${flag.code}.png`;

  await channel.send({
    content: `🎌 أعلام - 15 ثانية`,
    files: [imageURL]
  });

  const filter = m => !m.author.bot;
  const collector = channel.createMessageCollector({ filter, time: 15000 });

  let answered = false;

  collector.on("collect", async message => {

    if (message.content.trim() === flag.name) {

      answered = true;
      collector.stop();

      if (!activeEvent.scores[message.author.id])
        activeEvent.scores[message.author.id] = 0;

      activeEvent.scores[message.author.id]++;

      await User.findOneAndUpdate(
        { userId: message.author.id },
        { $inc: { totalPoints: 1, flagsPoints: 1 } },
        { upsert: true }
      );

      await message.reply(`إجابة صحيحة! نقاطك: ${activeEvent.scores[message.author.id]}`);

      if (activeEvent.scores[message.author.id] >= activeEvent.targetPoints) {
        channel.send(`🏆 الفائز هو <@${message.author.id}>`);
        activeEvent.running = false;
        return;
      }

      nextRound(channel);
    }
  });

  collector.on("end", async () => {

    if (!answered) {
      activeEvent.noAnswerRounds++;
      await channel.send("لم يقم أحد بالإجابة");

      if (activeEvent.noAnswerRounds >= 2) {
        channel.send("تم إيقاف الإيفنت بسبب عدم التفاعل");
        activeEvent.running = false;
        return;
      }

      nextRound(channel);
    }
  });
}
