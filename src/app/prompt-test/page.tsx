/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { promptAIWithCache } from "@/util/ai";
import {
  JudgeTest,
  judgeTestCases,
  judgeTemplates,
  GauntletTest,
  gauntletTestCases,
  gauntletTemplates,
} from "@/util/tests";

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

interface JudgeTestRun extends JudgeTest {
  prompt: string;
  result: string;
  fullResponse: string;
  passed: boolean;
}

interface judgeTemplateRun {
  template: string;
  score: number;
  tests: JudgeTestRun[];
}

interface GauntletTestRun extends GauntletTest {
  prompt: string;
  result: string;
  fullResponse: string;
  passed: boolean;
}

interface GauntletTemplateRun {
  template: string;
  score: number;
  tests: GauntletTestRun[];
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

type OpenItems = Record<string, boolean>;

export default function Home() {
  const [openItems, setOpenItems] = useState<OpenItems>({});
  const [judgeTestResults, setJudgeTestResults] = useState<judgeTemplateRun[]>(
    []
  );
  const [gauntletTestResults, setGauntletTestResults] = useState<
    GauntletTemplateRun[]
  >([]);

  const testJudgeAI = useCallback(async function (
    testCase: JudgeTest,
    promptTemplate: string
  ): Promise<JudgeTestRun> {
    ("");

    const entries = testCase.entries.join(", ");
    const prompt = promptTemplate
      .replaceAll("#s#", testCase.superlative)
      .replace("#e#", entries);
    const response = await promptAIWithCache(prompt);
    const { answer, explanation } = cleanResponse(response, prompt);
    console.log("answer is:");
    console.log(answer);

    const winningAnswer =
      testCase.entries.find((a) => a === answer) ||
      testCase.entries.find((a) => answer.includes(a)) ||
      testCase.entries.find((a) => a.includes(answer)) ||
      testCase.entries.find(
        (a) =>
          a.replace(allPunctuation, "").toLowerCase() ===
          answer.replace(allPunctuation, "").toLowerCase()
      ) ||
      testCase.entries.find((e) =>
        answer
          .replace(allPunctuation, "")
          .toLowerCase()
          .includes(e.replace(allPunctuation, "").toLowerCase())
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

  const testJudgeTemplate = useCallback(
    async function (template: string) {
      const tests = [];
      for (const testCase of judgeTestCases) {
        const result = await testJudgeAI(testCase, template);
        tests.push(result);
      }
      return { template, score: tests.filter((t) => t.passed).length, tests };
    },
    [testJudgeAI]
  );

  const runJudgeTests = useCallback(
    async function () {
      setJudgeTestResults([]);
      for (const template of judgeTemplates) {
        const result = await testJudgeTemplate(template);
        setJudgeTestResults((prev) => [...prev, result]);
      }
    },
    [testJudgeTemplate]
  );

  const testGauntlet = useCallback(async function (
    testCase: GauntletTest,
    promptTemplate: string
  ): Promise<GauntletTestRun> {
    ("");
    const prompt = promptTemplate
      .replaceAll("#c#", testCase.category)
      .replaceAll("#e#", testCase.entry);

    console.log("prompt is:");
    console.log(prompt);
    const response = await promptAIWithCache(prompt);
    console.log("response is:");
    console.log(response);

    const { answer, explanation } = cleanResponse(response, prompt);

    const passed = testCase.shouldPass
      ? answer.toLowerCase().includes("yes")
      : answer.toLowerCase().includes("no");

    return {
      ...testCase,
      prompt,
      passed,
      result: answer,
      fullResponse: response,
    };
  },
  []);

  const testGauntletTemplate = useCallback(
    async function (template: string) {
      const testPromises = gauntletTestCases.map((testCase) =>
        testGauntlet(testCase, template)
      );

      // Wait for all tests to complete
      const tests = await Promise.all(testPromises);
      return { template, score: tests.filter((t) => t.passed).length, tests };
    },
    [testGauntlet]
  );

  const runGauntletTests = useCallback(
    async function () {
      setGauntletTestResults([]);
      for (const template of gauntletTemplates) {
        const result = await testGauntletTemplate(template);
        setGauntletTestResults((prev) => [...prev, result]);
      }
    },
    [testGauntletTemplate]
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
        <h1 className={"title"}>Testing final judge</h1>
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
            {judgeTemplates.map((template, i) => (
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
            {judgeTestCases.map((testCase, i) => (
              <li key={i}>
                {testCase.superlative} [{testCase.entries.join(", ")}] Winner
                should be: {testCase.winner}
              </li>
            ))}
          </ul>
        )}
        <button className={"button"} onClick={runJudgeTests}>
          Test the judge
        </button>
        <h2>Results:</h2>
        <ul style={styles.list}>
          {judgeTestResults.map((judgeTemplateRun, i) => (
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
                  <div>Score: {judgeTemplateRun.score}</div>
                  <div>Template: {judgeTemplateRun.template}</div>
                </div>
              </div>

              {openItems[`template-${i}`] && (
                <ul style={styles.list}>
                  {judgeTemplateRun.tests.map((test, j) => (
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
                          {/* <li>Response: {test.}</li> */}
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
        <h1 className={"title"}>Gauntlet test</h1>
        <div
          style={styles.header}
          onClick={() => toggleItem(`template-list-g`)}
        >
          <span style={styles.iconWrapper}>
            {openItems[`template-list-g`] ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </span>
          <div>Templates:</div>
        </div>
        {openItems[`template-list-g`] && (
          <ul style={{ ...styles.list, ...styles.content }}>
            {gauntletTemplates.map((template, i) => (
              <li key={template}>{template}</li>
            ))}
          </ul>
        )}
        <div
          style={styles.header}
          onClick={() => toggleItem(`test-case-list-g`)}
        >
          <span style={styles.iconWrapper}>
            {openItems[`test-case-list-g`] ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </span>
          <div>Test cases:</div>
        </div>
        {openItems[`test-case-list-g`] && (
          <ul style={{ ...styles.list, ...styles.content }}>
            {gauntletTestCases.map((testCase, i) => (
              <li key={i}>
                {testCase.category} [{testCase.entry}] Should pass?{" "}
                {testCase.shouldPass}
              </li>
            ))}
          </ul>
        )}
        <button className={"button"} onClick={runGauntletTests}>
          Test the gauntlet
        </button>
        <h2>Results:</h2>
        <ul style={styles.list}>
          {gauntletTestResults.map((gauntletTemplateRun, i) => (
            <li key={i} style={styles.listItem}>
              <div
                style={styles.header}
                onClick={() => toggleItem(`template-g-${i}`)}
              >
                <span style={styles.iconWrapper}>
                  {openItems[`template-g-${i}`] ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </span>
                <div>
                  <div>Score: {gauntletTemplateRun.score}</div>
                  <div>Template: {gauntletTemplateRun.template}</div>
                </div>
              </div>

              {openItems[`template-g-${i}`] && (
                <ul style={styles.list}>
                  {gauntletTemplateRun.tests.map((test, j) => (
                    <li key={j} style={styles.nestedItem}>
                      <div
                        style={styles.header}
                        onClick={() => toggleItem(`test-g-${i}-${j}`)}
                      >
                        <span style={styles.iconWrapper}>
                          {openItems[`test-g-${i}-${j}`] ? (
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

                      {openItems[`test-g-${i}-${j}`] && (
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
