export function repairJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // Remove markdown code fence blocks if present
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  cleaned = cleaned.trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt minor regex repairs (trailing commas, quotes)
    try {
      let fixed = cleaned
        .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
        .replace(/[\u201C\u201D]/g, '"'); // replace curly quotes

      // Count unclosed quotes, braces, brackets for truncated output repair
      let inString = false;
      let escape = false;
      const stack = [];

      for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        if (char === '\\' && !escape) {
          escape = true;
          continue;
        }

        if (char === '"' && !escape) {
          inString = !inString;
        } else if (!inString) {
          if (char === '{' || char === '[') {
            stack.push(char === '{' ? '}' : ']');
          } else if (char === '}' || char === ']') {
            if (stack.length > 0 && stack[stack.length - 1] === char) {
              stack.pop();
            }
          }
        }
        escape = false;
      }

      if (inString) {
        fixed += '"';
      }

      // Close open brackets/braces in reverse order
      while (stack.length > 0) {
        fixed += stack.pop();
      }

      fixed = fixed.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(fixed);
    } catch (e2) {
      return null;
    }
  }
}
