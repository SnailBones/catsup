/* eslint-disable react/no-unescaped-entities */
"use client";
// import { ChatCompletionOutputMessage } from "@huggingface/tasks";
import "./page.css";
import { useEffect, useState, useCallback } from "react";
import { categories, superlatives } from "./prompts/prompts.json";
import { promptAI } from "./ai";
import AnswerCard from "./components/answer-card";

type gameState = "choosing" | "judging" | "winner" | "tie";

interface Player {
  bot: boolean;
  name: string;
  color: string;
  score: number;
  temperature?: number;
}

interface Answer {
  answer: string;
  player: Player;
  explanation?: string | null;
  verified: boolean;
}

const players: Player[] = [
  { bot: false, name: "You", color: "rgb(63, 215, 58)", score: 0 },
  {
    bot: true,
    name: "Normal bot (0.2)",
    color: "rgb(219, 78, 111)",
    score: 0,
    temperature: 0.2,
  },
];

// TODO: consider adding whitespace too?
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

  const getAIAnswer = useCallback(async function (cat: string, sup: string) {
    const bot = players[1];
    const prompt = `Provide a one word answer to: what's the ${sup} ${cat}? RESPOND WITH ONE WORD ONLY!`;
    const response = await promptAI(prompt);
    console.log("AI's response is:");
    console.log(response);

    const { answer, explanation } = cleanResponse(response, prompt);
    setCurrentAnswers((prev) => [
      ...prev,
      {
        answer,
        player: bot,
        explanation,
        verified: false,
      },
    ]);
  }, []);

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
      getAIAnswer(category, superlative);
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
      { answer, player: currentPlayer, explanation: null, verified: false },
    ]);
    setInputText("");
  };

  const pickWinner = useCallback(
    async function () {
      // wait for 1 second before picking a winner
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (currentAnswers.length == 0) {
        console.log("No answers");
        setGameState("tie");
        return;
      } else if (currentAnswers.length == 1) {
        console.log("Only one answer. Wins by default");
        setWinningAnswers((w) => [...w, currentAnswers[0]]);
        setGameState("winner");
        setJudgeComment(`${currentAnswers[0].player.name} wins by default!`);
        return;
      }

      const entries = currentAnswers.map((a) => a.answer).reverse(); // todo: random order
      const prompt = `Which is the ${superlative} of the following? [${entries.join(
        ", "
      )}]? Respond with one entry from the list, nothing more!`;
      console.log("pickwinner prompt is:");
      console.log(prompt);

      const response = await promptAI(prompt);
      console.log("pickwinner response is:");
      console.log(response);

      setGameState("winner");

      const { answer, explanation } = cleanResponse(response, prompt);
      setJudgeComment(explanation);

      const winningAnswer =
        currentAnswers.find((a) => a.answer === answer) ||
        currentAnswers.find((a) => answer.includes(a.answer)) ||
        currentAnswers.find((a) => a.answer.includes(answer)) ||
        currentAnswers.find(
          (a) =>
            a.answer.replace(allPunctuation, "").toLowerCase() ===
            answer.replace(allPunctuation, "").toLowerCase()
        );

      if (!winningAnswer) {
        // if the AI fucks up
        console.log("It's a tie!");
        setGameState("tie");
        return;
      }

      setWinningAnswers((w) => [...w, winningAnswer]);
    },
    [currentAnswers, superlative]
  );

  // extra credit: pass through one more bot to double check that they're not the same thing
  const judgeAnswers = useCallback(async () => {
    setGameState("judging");
    let answers = [...currentAnswers];
    const strings = answers.map((a) => a.answer);
    // Remove duplicates
    if (
      strings[0].replace(allPunctuation, "").toLowerCase() ===
      strings[1].replace(allPunctuation, "").toLowerCase()
    ) {
      const duplicates = [answers[0], answers[1]];
      answers = answers.filter((a) => !duplicates.includes(a));
      setCurrentAnswers(answers);
      setJudgeComment("Duplicates eliminated!");
      if (answers.length === 0) {
        setGameState("tie");
        return;
      }
    }
    // Use AI to remove responses that don't match category
    for (const answer of answers) {
      const word = answer.answer;
      console.log("word is", word);
      const prompt = `Would you consider "${word}" a ${category}? Answer "yes" or "no" only.`;
      console.log("prompt is", prompt);
      const response = await promptAI(prompt); // todo: parallelize
      console.log("response is", response);
      const { answer: aiAnswer } = cleanResponse(response, prompt);
      if (aiAnswer.toLowerCase().includes("no")) {
        console.log(`${word} is not a ${category}`);
        // answers = answers.filter((a) => a !== answer);
        setCurrentAnswers((a) => a.filter((a) => a !== answer));
        setJudgeComment(`${word} is not a ${category}`);
      } else {
        setCurrentAnswers((a) =>
          a.map((a) => (a === answer ? { ...a, verified: true } : a))
        );
        console.log(`${word} is a ${category}`);
      }
    }
  }, [currentAnswers, category]);

  useEffect(() => {
    if (gameState === "choosing" && currentAnswers.length >= players.length) {
      judgeAnswers();
    }
    if (
      gameState === "judging" &&
      currentAnswers.reduce((a, b) => a && b.verified, true)
    ) {
      pickWinner();
    }
  }, [gameState, currentAnswers, judgeAnswers, pickWinner]);

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
                gameState !== "choosing" || !a.player.bot ? a.answer : "***"
              }
              explanation={a.explanation}
              color={a.player.color}
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
            <form
              className={"inputForm"}
              onSubmit={(e) => {
                e.preventDefault();
                handleUserAnswer(inputText);
              }}
            >
              <input
                type="text"
                onChange={(e) => setInputText(e.target.value)}
                value={inputText}
              />
              <button type="submit" className={"button"}>
                submit
              </button>
            </form>
            {/* <button
              onClick={getAIAnswer}
              disabled={currentAnswers.some((a) => a.player === "bot")}
              className={"button}
            >
              Get AI Answer!
            </button> */}
            <button
              disabled={currentAnswers.length < 2}
              onClick={pickWinner}
              className={"button"}
            >
              Judge answers!
            </button>
          </>
        )}
        <button onClick={newPrompt} className={"button"}>
          New prompt!
        </button>
      </main>
      <footer className={"footer"}>
        {scores.map((p) => ` ${p.player}: ${p.score}`)}
      </footer>
    </div>
  );
}
