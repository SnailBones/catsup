/* eslint-disable react/no-unescaped-entities */
"use client";
import "./page.css";
import { useEffect, useState, useCallback } from "react";
import { categories, superlatives } from "@/util/prompts.json";
import { promptAI } from "@/util/ai";
import AnswerCard from "@/components/answer-card";

const gauntletPrompt = `is "#e#" an example of a #c#? Answer yes or no.`;

type gameState = "choosing" | "judging" | "winner" | "tie";

interface Player {
  isBot: boolean;
  name: string;
  color: string;
  score: number;
}

interface Bot extends Player {
  isBot: true;
  prompt: string;
  temperature?: number;
  model?: string;
}

interface Answer {
  answer: string;
  player: Player;
  explanation?: string | null;
  passes: boolean | null;
}

const players: (Player | Bot)[] = [
  { isBot: false, name: "Human", color: "rgb(63, 215, 58)", score: 0 },
  // competitive bot
  {
    isBot: true,
    name: " 🇫🇷🤖🗼 Mistral",
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    color: "rgb(87, 78, 219)",
    score: 0,
    prompt:
      // "Provide a one word answer to: what's the #s# #c#? RESPOND WITH ONE WORD ONLY!",
      // `The #s# #c# is "`, // this one's boring/dumb
      `Provide a one word answer to: what's the #s# #c#? Answer:"`,

    // temperature: 0.2,
  },
  // TODO: Deepseek v3 needs another inference provider.
  // {
  //   isBot: true,
  //   name: "Deepseek 🇨🇳🤖⛩️",
  //   model: "deepseek-ai/DeepSeek-V3",
  //   color: "rgb(191, 0, 0)",
  //   score: 0,
  //   prompt: `Provide a one word answer to: what's the #s# #c#? Answer:"`,

  //   // temperature: 0.2,
  // },
  {
    isBot: true,
    name: "🇺🇸🦙 Llama",
    model: "meta-llama/Llama-3.2-3B-Instruct",
    color: "rgb(9, 144, 217)",
    score: 0,
    prompt: `Provide a one word answer to: what's the #s# #c#? Answer:"`,
  },
  // random bot
  {
    isBot: true,
    name: " 🌈😶‍🌫️🦙 Silly Llama",
    color: "rgb(217, 9, 203)",
    score: 0,
    prompt:
      // "Provide a one word answer to: what's a creative example of a #c#? RESPOND WITH ONE WORD ONLY!",
      `A funny example of a #c# is "`,
    // temperature: 0.2,
  },
];

const allPunctuation = /[.,\/#!$%\^&\*\"\';:{}=\-_`~()\s]/g;

function cleanResponse(response: string, prompt: string) {
  // Remove prompt to get just the new characters
  const generated = response.replace(prompt, "");
  // const answer = generated.trim().split(/\s+/)[0]; // Extract the first word
  // Extract the first line
  const answer = generated.trim().split("\n")[0];
  // Even though we ask it not to, the AI usually continues its response.
  // Let's share its explanation or ramblings for bonus fun.
  const explanation = generated.replace(answer, "").trimStart();
  // if (!/\S/.test(explanation)) explanation = null;
  return { answer, explanation };
}

function extractQuote(response: string, prompt: string) {
  // Remove prompt to get just the new characters
  const generated = response.replace(prompt, "");
  // const answer = generated.trim().split(/\s+/)[0]; // Extract the first word
  // Extract the first line
  const answer = generated.trim().split('"')[0];
  // Even though we ask it not to, the AI usually continues its response.
  // Let's share its explanation or ramblings for bonus fun.
  const explanation = generated.replace(answer, "").trimStart();
  // if (!/\S/.test(explanation)) explanation = null;
  return { answer, explanation };
}

export default function Home() {
  const [gameState, setGameState] = useState<gameState>("choosing");
  // the entries by humans/bots to win the current round
  const [currentAnswers, setCurrentAnswers] = useState<Answer[]>([]);
  // todo: add log for past q and winners
  const [category, setCategory] = useState("");
  const [superlative, setSuperlative] = useState("");
  const [inputText, setInputText] = useState("");
  const [winningAnswers, setWinningAnswers] = useState<Answer[]>([]);
  const [judgeComment, setJudgeComment] = useState("");

  const getAIAnswer = useCallback(async function (
    bot: Bot,
    cat: string,
    sup: string
  ) {
    const prompt = bot.prompt.replaceAll("#s#", sup).replaceAll("#c#", cat);
    const response = await promptAI(prompt, bot.model);
    console.log(bot.name + " says:");
    console.log(response);
    if (!response) return { answer: null, explanation: null };
    const { answer, explanation } = extractQuote(response, prompt);
    return { answer, explanation };
  },
  []);

  const newPrompt = useCallback(
    async function () {
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const superlative =
        superlatives[Math.floor(Math.random() * superlatives.length)];
      setCategory(category);
      setSuperlative(superlative);
      setCurrentAnswers([]);
      setGameState("choosing");
      setJudgeComment("");
      for (const player of players) {
        if (player.isBot) {
          const { answer, explanation } = await getAIAnswer(
            player as Bot,
            category,
            superlative
          );
          if (!answer) continue;
          setCurrentAnswers((prev) => [
            ...prev,
            {
              answer,
              player,
              explanation,
              passes: null,
            },
          ]);
        }
      }
    },
    [getAIAnswer]
  );

  useEffect(() => {
    newPrompt();
  }, [newPrompt]);

  const handleUserAnswer = function (answer: string) {
    if (!/\S/.test(answer)) return; // Don't submit with only white space
    const currentPlayer = players[0];
    setCurrentAnswers((prev) => [
      ...prev,
      { answer, player: currentPlayer, explanation: null, passes: null },
    ]);
    setInputText("");
  };

  // extra credit: pass through one more bot to double check that they're not the same thing
  const runGauntlet = useCallback(async () => {
    setGameState("judging");
    let answers = [...currentAnswers];
    const strings = answers.map((a) => a.answer);
    // Remove duplicates
    const standardStrings = strings.map((s) =>
      s.replace(allPunctuation, "").toLowerCase()
    );
    for (let i = 0; i < answers.length - 1; i++) {
      const duplicates = [i];
      for (let j = i + 1; j < answers.length; j++) {
        if (standardStrings[i] === standardStrings[j]) {
          duplicates.push(j);
        }
      }
      if (duplicates.length > 1) {
        answers = answers.map((a, i) =>
          duplicates.includes(i) ? { ...a, passes: false } : a
        );
        setCurrentAnswers(answers);
        console.log("eliminated duplicates", duplicates);
        setJudgeComment("Duplicates eliminated!");
      }
    }

    // Use AI to remove responses that don't match category
    for (const answer of answers) {
      if (answer.passes === false) continue;
      const word = answer.answer;
      const prompt = gauntletPrompt
        .replaceAll("#e#", word)
        .replaceAll("#c#", category);
      const response = await promptAI(prompt); // todo: parallelize
      console.log("judge says:");
      console.log(response);
      const { answer: aiAnswer } = cleanResponse(response, prompt);
      if (aiAnswer.toLowerCase().includes("no")) {
        // console.log(`${word} is not a ${category}`);
        // answers = answers.filter((a) => a !== answer);
        // setCurrentAnswers((a) => a.filter((a) => a !== answer));
        setCurrentAnswers((a) =>
          a.map((a) => (a === answer ? { ...a, passes: false } : a))
        );
        console.log("eliminated", word, "not a", category);
        setJudgeComment(`${word} is not a ${category}`);
      } else {
        setCurrentAnswers((a) =>
          a.map((a) => (a === answer ? { ...a, passes: true } : a))
        );
      }
    }
  }, [currentAnswers, category]);

  const pickWinner = useCallback(
    async function () {
      const validAnswers = currentAnswers.filter((a) => a.passes);
      // wait for 1 second before picking a winner
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      if (validAnswers.length == 0) {
        // console.log("No answers");
        setGameState("tie");
        setJudgeComment("You all lose!");
        return;
      } else if (validAnswers.length == 1) {
        // console.log("Only one answer. Wins by default");
        setWinningAnswers((w) => [...w, validAnswers[0]]);
        setGameState("winner");
        setJudgeComment(`${validAnswers[0].player.name} wins by default!`);
        return;
      }

      const entries = validAnswers.map((a) => a.answer); // todo: random order
      const prompt = `Which is the ${superlative} of the following? [${entries.join(
        ", "
      )}]? Respond with one entry from the list, nothing more!`;
      // console.log("pickwinner prompt is:");
      // console.log(prompt);

      const response = await promptAI(prompt);
      // console.log("pickwinner response is:");
      console.log(response);

      setGameState("winner");

      const { answer, explanation } = cleanResponse(response, prompt);
      setJudgeComment(explanation);

      const winningAnswer =
        validAnswers.find((a) => a.answer === answer) ||
        validAnswers.find((a) => answer.includes(a.answer)) ||
        validAnswers.find((a) => a.answer.includes(answer)) ||
        validAnswers.find(
          (a) =>
            a.answer.replace(allPunctuation, "").toLowerCase() ===
            answer.replace(allPunctuation, "").toLowerCase()
        ) ||
        validAnswers.find((a) =>
          answer
            .replace(allPunctuation, "")
            .toLowerCase()
            .includes(a.answer.replace(allPunctuation, "").toLowerCase())
        );

      if (!winningAnswer) {
        // if the AI fucks up
        // console.log("I can't decide. It's a tie!");
        setGameState("tie");
        return;
      }

      setWinningAnswers((w) => [...w, winningAnswer]);
    },
    [currentAnswers, superlative]
  );

  useEffect(() => {
    if (gameState === "choosing" && currentAnswers.length >= players.length) {
      runGauntlet();
    }
    if (
      gameState === "judging" &&
      currentAnswers.reduce((a, b) => a && b.passes !== null, true)
    ) {
      pickWinner();
    }
  }, [gameState, currentAnswers, runGauntlet, pickWinner]);

  const winningAnswer = winningAnswers[winningAnswers.length - 1];
  const scores = players.map((p) => {
    return {
      player: p.name,
      score: winningAnswers.filter((a) => a.player === p).length,
    };
  });

  return (
    <div className={"page"}>
      <main className={"main"}>
        <h1 className={"title"}>
          What's the {superlative} {category}?
        </h1>
        {(gameState === "winner" || gameState === "tie") && (
          <>
            <h2 className="winner">
              {gameState === "winner"
                ? `${winningAnswer.player.name} wins!`
                : "It's a tie!"}
            </h2>
          </>
        )}
        <h3 className="commentary">{judgeComment}</h3>
        <div className="cardContainer">
          {currentAnswers.map((a) => (
            <AnswerCard
              key={a.player.name}
              answer={
                gameState !== "choosing" || !a.player.isBot ? a.answer : "***"
              }
              explanation={a.explanation}
              color={a.player.color}
              passes={a.passes}
              won={
                gameState === "winner" &&
                winningAnswer &&
                a.player === winningAnswer.player
              }
            />
          ))}
        </div>
        {gameState === "choosing" && (
          <>
            <form // "Provide a one word answer to: what's the #s# #c#? RESPOND WITH ONE WORD ONLY!",
              // `The #s# #c# is "`, // this one's boring/dumb
              className={"inputForm"}
              onSubmit={(e) => {
                e.preventDefault();
                handleUserAnswer(inputText);
              }}
            >
              <input
                type="text"
                onChange={(e) => setInputText(e.target.value)}
                value={inputText} // "Provide a one word answer to: what's the #s# #c#? RESPOND WITH ONE WORD ONLY!",
                // `The #s# #c# is "`, // this one's boring/dumb
              />
              <button type="submit" className={"button"}>
                submit
              </button>
            </form>
          </>
        )}
        {/* <button
          disabled={currentAnswers.length < 2}
          onClick={pickWinner}
          className={"button"}
        >
          Judge answers!
        </button> */}
        <button onClick={newPrompt} className={"button"}>
          New prompt!
        </button>
      </main>
      <footer className={"footer"}>
        {scores.map((p) => (
          <div key={p.player}>{`${p.player}: ${p.score}`}</div>
        ))}
      </footer>
    </div>
  );
}
