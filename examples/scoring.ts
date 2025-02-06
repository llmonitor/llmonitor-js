import OpenAI from "openai"

import { monitorOpenAI } from "../src/openai"
import lunary from "../src/index"

lunary.init({
  verbose: true,
})

// This extends the openai object with the monitor
const openai = monitorOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
)

const MyAgent = lunary.wrapAgent(async function MyAgent(text) {
  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 1,
    messages: [
      {
        role: "user",
        content: text,
      },
    ],
  })

  return res.choices[0].message.content
})

const agent = MyAgent("Hello, how are you?")

const output = await agent

console.log("Output:", output)

await lunary.score(agent.runId, "my_score", 1, "This is a nice score!")

console.log("Scored agent: " + agent.runId)
