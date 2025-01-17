/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { categories, superlatives } from "@/util/prompts.json";
import { promptAIWithCache } from "@/util/ai";

const styles = {
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  listItem: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "8px",
    marginBottom: "8px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  content: {
    marginLeft: "24px",
    marginTop: "8px",
  },
  passed: {
    color: "#16a34a",
  },
  failed: {
    color: "#dc2626",
  },
  tie: {
    color: "rgb(246, 255, 0)",
  },
  iconWrapper: {
    marginRight: "8px",
  },
  nestedItem: {
    marginBottom: "8px",
  },
};

interface JudgeTest {
  superlative: string;
  entries: string[];
  winner: string;
}

interface TestRun {
  superlative: string;
  entries: string[];
  winner: string;
  prompt: string;
  result: string;
  fullResponse: string;
  passed: boolean;
}

interface templateRun {
  template: string;
  score: number;
  tests: TestRun[];
}

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

const testCases: JudgeTest[] = [
  { superlative: "bounciest", entries: ["Flea", "Termite"], winner: "Flea" },
  {
    superlative: "most addictive",
    entries: ["Methane", "Laughing gas"],
    winner: "Laughing gas",
  },
  {
    superlative: "most addictive",
    entries: ["Laughing gas", "Methane"],
    winner: "Laughing gas",
  },
  {
    superlative: "most adorable",
    entries: ["Unicorn", "Tiny elephants"],
    winner: "Tiny elephants",
  },
  {
    superlative: "youngest",
    entries: ["Zero", "Emojis"],
    winner: "Emojis",
  },
  {
    superlative: "most conspiratorial",
    entries: ["Xenophobia.", "X-files"],
    winner: "X-files",
  },
  {
    superlative: "cloudiest",
    entries: ["cat", "sheep"],
    winner: "sheep",
  },
  {
    superlative: "dantiest",
    entries: ["lace", "fairy tea party"],
    winner: "fairy tea party",
  },
  {
    superlative: "most confusing",
    entries: ["tangled wires", "lightbulb"],
    winner: "tangled wires",
  },
  {
    superlative: "most sensitive",
    entries: ["Blush.", "Chameleon"],
    winner: "Blush.",
  },
  {
    superlative: "strangest",
    entries: ["Rorschach", "Rubberband"],
    winner: "Roschach",
  },
];
const templates = [
  // "Which is the #s# of the following? [#e#]? Respond with one entry from the list, nothing more!", score 3
  // "Which of the following is the #s#? [#e#]? Respond with one entry from the list, nothing more!", // score 4
  "Which of the following is the #s#? [#e#]? Please think carefully and respond with one entry from the list, nothing more!", // score 6
  "Which is the #s#? of the following:[#e#]? Please think carefully and respond with one entry from the list, nothing more!", // score 6

  // "Consider this list: [#e#]. Which of the listed items is the #s#?", // score 3
  // "Consider this list: [#e#]. Which of the listed items is the #s#? Please think carefully and respond with one entry from the list, nothing more!", // score 3
];

type OpenItems = Record<string, boolean>;

export default function Home() {
  const [openItems, setOpenItems] = useState<OpenItems>({});
  const [results, setResults] = useState<templateRun[]>([]);

  const testJudgeAI = useCallback(async function (
    testCase: JudgeTest,
    promptTemplate: string
  ): Promise<TestRun> {
    ("");

    const entries = testCase.entries.join(", ");
    const prompt = promptTemplate
      .replaceAll("#s#", testCase.superlative)
      .replace("#e#", entries);
    console.log("prompt is:");
    console.log(prompt);
    const response = await promptAIWithCache(prompt);
    console.log("response is:");
    console.log(response);

    const { answer, explanation } = cleanResponse(response, prompt);

    const winningAnswer =
      testCase.entries.find((a) => a === answer) ||
      testCase.entries.find((a) => answer.includes(a)) ||
      testCase.entries.find((a) => a.includes(answer)) ||
      testCase.entries.find(
        (a) =>
          a.replace(allPunctuation, "").toLowerCase() ===
          answer.replace(allPunctuation, "").toLowerCase()
      );

    const result = winningAnswer ? winningAnswer : "tie";

    const passed = result === testCase.winner;

    return {
      ...testCase,
      prompt,
      result,
      fullResponse: response,
      passed,
    };
  },
  []);

  const testTemplate = useCallback(
    async function (template: string) {
      const tests = [];
      for (const testCase of testCases) {
        const result = await testJudgeAI(testCase, template);
        tests.push(result);
      }
      return { template, score: tests.filter((t) => t.passed).length, tests };
    },
    [testJudgeAI]
  );

  const testAll = useCallback(
    async function () {
      setResults([]);
      for (const template of templates) {
        const result = await testTemplate(template);
        setResults((prev) => [...prev, result]);
      }
    },
    [testTemplate]
  );

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className={"page"}>
      <main className={"main"}>
        <h1 className={"title"}>Prompt test</h1>
        <div style={styles.header} onClick={() => toggleItem(`template-list`)}>
          <span style={styles.iconWrapper}>
            {openItems[`template-list`] ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </span>
          <div>Templates:</div>
        </div>
        {openItems[`template-list`] && (
          <ul style={{ ...styles.list, ...styles.content }}>
            {templates.map((template, i) => (
              <li key={template}>{template}</li>
            ))}
          </ul>
        )}
        <div style={styles.header} onClick={() => toggleItem(`test-case-list`)}>
          <span style={styles.iconWrapper}>
            {openItems[`test-case-list`] ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </span>
          <div>Test cases:</div>
        </div>
        {openItems[`test-case-list`] && (
          <ul style={{ ...styles.list, ...styles.content }}>
            {testCases.map((testCase, i) => (
              <li key={i}>
                {testCase.superlative} [{testCase.entries.join(", ")}] Winner
                should be: {testCase.winner}
              </li>
            ))}
          </ul>
        )}
        <button className={"button"} onClick={testAll}>
          Test All
        </button>
        <h2>Results:</h2>
        <ul style={styles.list}>
          {results.map((templateRun, i) => (
            <li key={i} style={styles.listItem}>
              <div
                style={styles.header}
                onClick={() => toggleItem(`template-${i}`)}
              >
                <span style={styles.iconWrapper}>
                  {openItems[`template-${i}`] ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </span>
                <div>
                  <div>Score: {templateRun.score}</div>
                  <div>Template: {templateRun.template}</div>
                </div>
              </div>

              {openItems[`template-${i}`] && (
                <ul style={styles.list}>
                  {templateRun.tests.map((test, j) => (
                    <li key={j} style={styles.nestedItem}>
                      <div
                        style={styles.header}
                        onClick={() => toggleItem(`test-${i}-${j}`)}
                      >
                        <span style={styles.iconWrapper}>
                          {openItems[`test-${i}-${j}`] ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </span>
                        <div
                          style={
                            test.passed
                              ? styles.passed
                              : test.result === "tie"
                              ? styles.tie
                              : styles.failed
                          }
                        >
                          Test {j + 1}
                        </div>
                      </div>

                      {openItems[`test-${i}-${j}`] && (
                        <ul style={{ ...styles.list, ...styles.content }}>
                          <li>Prompt: {test.prompt}</li>
                          <li>Result: {test.result}</li>
                          <li>
                            {/* Full response:{" "} */}
                            {test.fullResponse.replace(test.prompt, "")}
                          </li>
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
