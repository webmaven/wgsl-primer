/*
 * Copyright ©2026 Michael R. Bernstein. Licensed under Apache 2.0.
 * See root README.md for global project-wide upstream attributions.
 */

import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.resolve('docs');

// Helper to recursively walk a directory and find markdown files
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  });
  return results;
}

const args = process.argv.slice(2);
const markdownFiles =
  args.length > 0
    ? args
        .filter((file) => file.endsWith('.md'))
        .map((file) => path.resolve(file))
        .filter((file) => file.startsWith(DOCS_DIR))
    : walk(DOCS_DIR);

let hasErrors = false;

// Rule 1: Legacy admonitions (e.g. "> [!NOTE]" or "> [!WARNING]")
const LEGACY_ADMONITION_REGEX = />\s*\[!/i;

// Rule 3: Pedagogical / Handholding phrase checks
const PEDAGOGICAL_PATTERNS = [
  { regex: /\bwhat you will learn\b/i, phrase: 'What you will learn' },
  { regex: /\bwe will learn\b/i, phrase: 'We will learn' },
  { regex: /\bwhat we will learn\b/i, phrase: 'What we will learn' },
  { regex: /\blet's dive in\b/i, phrase: "Let's dive in" },
  { regex: /\bdiscover how\b/i, phrase: 'Discover how' },
  { regex: /\bcongratulations\b/i, phrase: 'Congratulations' },
  { regex: /\byou have learned\b/i, phrase: 'You have learned' },
  { regex: /\blet's find out\b/i, phrase: "Let's find out" },
  { regex: /\bin this section\b/i, phrase: 'In this section' },
  { regex: /\bin this chapter\b/i, phrase: 'In this chapter' },
];

markdownFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  let insideCodeBlock = false;
  let codeBlockFenceLength = 0;

  // Frontmatter identification
  let hasFrontmatter = false;
  let isHome = false;
  let closingFrontmatterLineIndex = -1;
  let frontmatterCount = 0;

  if (content.startsWith('---')) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        frontmatterCount++;
        if (frontmatterCount === 1) {
          hasFrontmatter = true;
        } else if (frontmatterCount === 2) {
          closingFrontmatterLineIndex = i;
          break;
        }
      }
      if (frontmatterCount === 1) {
        if (lines[i].includes('IsHome: true')) {
          isHome = true;
        }
      }
    }
  }

  // Check for redundant leading heading
  if (hasFrontmatter && !isHome && closingFrontmatterLineIndex !== -1) {
    let inCodeBlock = false;
    let fenceLen = 0;

    for (let i = closingFrontmatterLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^\s*(\`{3,})/);
      if (!inCodeBlock && match) {
        inCodeBlock = true;
        fenceLen = match[1].length;
      } else if (inCodeBlock && match && match[1].length === fenceLen) {
        inCodeBlock = false;
      }

      if (!inCodeBlock && line.trim() !== '') {
        if (line.trim().startsWith('#')) {
          console.error(
            `\x1b[31mError:\x1b[0m Redundant leading heading found in ${file}:${i + 1}`
          );
          console.error(`  Line ${i + 1}: ${line.trim()}`);
          console.error(
            `  Please remove the leading heading. The page title is automatically generated from the frontmatter title.\n`
          );
          hasErrors = true;
        }
        break;
      }
    }
  }

  insideCodeBlock = false;
  codeBlockFenceLength = 0;

  lines.forEach((line, index) => {
    // 1. Check Legacy Admonition Rule
    if (LEGACY_ADMONITION_REGEX.test(line)) {
      console.error(
        `\x1b[31mError:\x1b[0m Legacy blockquote admonition syntax found in ${file}:${index + 1}`
      );
      console.error(`  Line ${index + 1}: ${line.trim()}`);
      console.error(
        `  Please convert to standard PyMdown syntax (e.g., '!!! note "Title"') with 4-space indentation.\n`
      );
      hasErrors = true;
    }

    // Update insideCodeBlock status
    const match = line.match(/^\s*(\`{3,})/);
    if (!insideCodeBlock && match) {
      insideCodeBlock = true;
      codeBlockFenceLength = match[1].length;
    } else if (insideCodeBlock && match && match[1].length === codeBlockFenceLength) {
      insideCodeBlock = false;
      // 2. Check Fenced Code Block Spacing Rule
      if (index + 1 < lines.length) {
        const nextLine = lines[index + 1];
        if (nextLine.trim() !== '') {
          console.error(
            `\x1b[31mError:\x1b[0m Missing blank line following fenced code block closing backticks in ${file}:${index + 1}`
          );
          console.error(`  Closing Fence (Line ${index + 1}): ${line.trim()}`);
          console.error(`  Immediate Next Line (Line ${index + 2}): ${nextLine.trim()}`);
          console.error(
            `  Please insert a blank line after the closing backticks to satisfy parser nesting/spacing requirements.\n`
          );
          hasErrors = true;
        }
      }
    }

    // Run rules outside of code blocks
    if (!insideCodeBlock) {
      // 4. Check Secondary H1 Headings in lesson pages
      if (hasFrontmatter && !isHome && index > closingFrontmatterLineIndex) {
        if (/^\s*#\s+/.test(line)) {
          console.error(`\x1b[31mError:\x1b[0m Secondary H1 heading found in ${file}:${index + 1}`);
          console.error(`  Line ${index + 1}: ${line.trim()}`);
          console.error(
            `  Secondary H1 headings are prohibited in lesson pages. Use H2 (##) or lower for sub-sections.\n`
          );
          hasErrors = true;
        }
      }

      // 6. Check H1 followed immediately by H2 (H1+H2 antipattern)
      if (/^\s*#\s+/.test(line)) {
        let nextNonEmptyIndex = -1;
        let scanInsideCodeBlock = false;
        let scanFenceLen = 0;
        for (let j = index + 1; j < lines.length; j++) {
          const scanLine = lines[j];
          const scanMatch = scanLine.match(/^\s*(\`{3,})/);
          if (!scanInsideCodeBlock && scanMatch) {
            scanInsideCodeBlock = true;
            scanFenceLen = scanMatch[1].length;
          } else if (scanInsideCodeBlock && scanMatch && scanMatch[1].length === scanFenceLen) {
            scanInsideCodeBlock = false;
          }
          if (!scanInsideCodeBlock && scanLine.trim() !== '') {
            nextNonEmptyIndex = j;
            break;
          }
        }
        if (nextNonEmptyIndex !== -1) {
          const nextLine = lines[nextNonEmptyIndex];
          if (/^\s*##\s+/.test(nextLine)) {
            console.error(`\x1b[31mError:\x1b[0m H1+H2 antipattern found in ${file}:${index + 1}`);
            console.error(`  H1 Heading (Line ${index + 1}): ${line.trim()}`);
            console.error(
              `  Immediate H2 Heading (Line ${nextNonEmptyIndex + 1}): ${nextLine.trim()}`
            );
            console.error(
              `  Having an H1 heading immediately followed by an H2 subheading without intervening prose is prohibited. Please remove the redundant heading or add introductory text.\n`
            );
            hasErrors = true;
          }
        }
      }

      // 5. Check Pedagogical/Conversational language
      PEDAGOGICAL_PATTERNS.forEach((pattern) => {
        if (pattern.regex.test(line)) {
          console.error(
            `\x1b[31mError:\x1b[0m Conversational/pedagogical phrase "${pattern.phrase}" found in ${file}:${index + 1}`
          );
          console.error(`  Line ${index + 1}: ${line.trim()}`);
          console.error(
            `  Please rephrase to maintain an objective, technical, reference-style tone as required by STYLE_GUIDE.md.\n`
          );
          hasErrors = true;
        }
      });
    }
  });
});

if (hasErrors) {
  process.exit(1);
} else {
  console.log('All markdown style, hierarchy, and pedagogical checks passed successfully!');
  process.exit(0);
}
