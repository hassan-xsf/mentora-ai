import type { TestCase } from "./piston";

/** Minimal stdin-reading programs that compile/run as-is in each supported language. */
const STARTERS: Record<string, string> = {
  python: `import sys

def main():
    data = sys.stdin.read().split()
    # TODO: solve the problem and print the answer


main()
`,
  javascript: `const data = require("fs").readFileSync(0, "utf8").trim().split(/\\s+/);

// TODO: solve the problem and print the answer with console.log
`,
  typescript: `// Runs on Deno: stdin is read with Deno.readAll
const input = new TextDecoder().decode(await Deno.readAll(Deno.stdin));
const data: string[] = input.trim().split(/\\s+/);

// TODO: solve the problem and print the answer with console.log
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // TODO: read the input with sc and print the answer
    }
}
`,
  "c++": `#include <bits/stdc++.h>
using namespace std;

int main() {
    // TODO: read the input with cin and print the answer with cout
    return 0;
}
`,
  go: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var n int
	fmt.Fscan(reader, &n)
	// TODO: read the rest of the input and print the answer
}
`,
  rust: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut tokens = input.split_whitespace();
    let _ = tokens.next();
    // TODO: solve the problem and print the answer with println!
}
`,
};

export function starterFor(language: string): string {
  return STARTERS[language.toLowerCase()] ?? STARTERS.python;
}

/** Canned challenge used when the AI is unavailable. Tests are hand-checked. */
export function fallbackChallenge(language: string, topic: string) {
  const tests: TestCase[] = [
    { input: "3\n1 2 3\n", output: "6" },
    { input: "1\n-5\n", output: "-5" },
    { input: "5\n10 20 30 40 50\n", output: "150" },
    { input: "4\n-1 1 -1 1\n", output: "0" },
    { input: "2\n1000000000 1000000000\n", output: "2000000000" },
    { input: "6\n7 0 0 0 0 3\n", output: "10" },
  ];
  return {
    title: "Sum of a List",
    problem_statement: `A warm-up ${topic.toLowerCase()} exercise: add up a list of integers.

**Input format:** The first line contains an integer n (1 ≤ n ≤ 1000). The second line contains n integers separated by spaces, each between -10^9 and 10^9.

**Output format:** Print a single integer: the sum of the n numbers. The sum can exceed 32-bit range, so use a 64-bit type where your language needs one.`,
    starter_code: starterFor(language),
    tests,
  };
}

/** Prompt for one stdin/stdout challenge with a reference solution and tests. */
export function challengePrompt(language: string, topic: string, difficulty: string): string {
  const javaNote = language.toLowerCase() === "java" ? " The class must be `public class Main`." : "";
  const runtimeNote =
    language.toLowerCase() === "typescript"
      ? "\nTypeScript runs on Deno (no Node APIs, no require): read stdin with `const input = new TextDecoder().decode(await Deno.readAll(Deno.stdin));`."
      : "";
  return `You are a coding challenge generator. Create one ${difficulty} ${topic} problem to be solved in ${language}.
The solution is a complete program that reads from standard input and writes to standard output (competitive-programming style). It is graded automatically by comparing stdout with the expected output.${runtimeNote}
Keep the whole JSON reply under 6000 characters.

Return ONLY a valid JSON object with these exact fields:
- title: string (short challenge title)
- problem_statement: string (clear description, 1-3 paragraphs, then an "Input format" section and an "Output format" section; do NOT include examples, they are shown from the tests)
- starter_code: string (a complete ${language} program that reads the input described and leaves a TODO where the solution goes; it must compile and run as-is${javaNote})
- reference_solution: string (a complete, correct ${language} program that solves the problem${javaNote})
- tests: array of 8 objects { "input": string, "output": string } — "input" is the exact stdin text, "output" is the exact expected stdout. Include edge cases. Each input under 500 characters. Every input must have exactly one correct output (no randomness; avoid floating point unless the statement fixes the rounding).

Return ONLY the JSON, no markdown, no explanation.`;
}
