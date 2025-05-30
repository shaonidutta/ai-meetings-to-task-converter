const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function extractTasksFromText(text, mode) {
  const currentYear = 2025;
  const systemPrompt = `You are a task extraction assistant that extracts structured task information from text and returns it in JSON format.

  CURRENT YEAR: ${currentYear}
  TODAY'S DATE: \${new Date().toISOString().slice(0, 10)}
  CURRENT TIME: \${new Date().toTimeString().slice(0, 8)}
  
  DATE CALCULATION RULES:
  - ALL dates MUST be set in the year ${currentYear}
  - When a date is mentioned without a year, use ${currentYear}
  - All dates MUST be calculated relative to TODAY'S DATE shown above
  - Time handling:
    * When a specific time is mentioned (e.g., "2pm"), use EXACTLY that time:
      - "2pm" -> "14:00:00"
      - "2:30pm" -> "14:30:00"
      - "10am" -> "10:00:00"
    * ALWAYS use 24-hour format for times
    * Do NOT adjust for timezones - use the time exactly as specified
    * If no time specified -> use "23:59:59"
  - Format all dates as ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
  - ALWAYS append 'Z' to indicate UTC timezone
  
  Example outputs:
  - "2pm on June 4th" -> "2025-06-04T14:00:00Z"
  - "3:30pm tomorrow" -> "2025-05-31T15:30:00Z"
  - "next Monday at 10am" -> "2025-06-03T10:00:00Z"
  - "Friday" (no time) -> "2025-06-07T23:59:59Z"
  
  CRITICAL PRIORITY RULES - READ CAREFULLY:
  1. DEFAULT PRIORITY IS ALWAYS "P3"
  2. EXACT PRIORITY MATCHING:
     - P1 (Highest): Set P1 if text contains ANY of these exact phrases:
       * "highest priority"
       * "urgent"
       * "critical"
       * "P1"
       * "priority 1"
     
     - P2 (High): Set P2 if text contains ANY of these exact phrases:
       * "high priority"
       * "important"
       * "P2"
       * "priority 2"
     
     - P3 (Medium): Set P3 if:
       * text contains "medium priority"
       * no priority is specified
       * none of the other priority phrases are found

     - P4 (Low): Set P4 if text contains ANY of these exact phrases:
       * "low priority"
       * "lowest priority"
       * "P4"
       * "priority 4"
     
  3. IMPORTANT:
     - The word "priority" alone defaults to P3
     - Must match phrases exactly as written above
     - Case insensitive matching
     - If multiple priorities mentioned, use the highest one
     - When in doubt, use P3
     - Never infer priority from context or task importance
     - Never infer priority from deadlines

  4. DATE HANDLING RULES - READ CAREFULLY:
     - Calculate exact next occurrence for any mentioned day:
       * For "Friday" -> find the next Friday from today
       * For "next Friday" -> find Friday of next week
       * For "Wednesday" -> find the next Wednesday from today
     - For relative terms:
       * "next week" -> calculate as Monday of next week
       * "end of week" -> calculate as this Friday at EOD
       * "tomorrow" -> next day from today
     - Time handling:
       * If time is specified (e.g., "3pm") -> use that exact time
       * If no time specified -> use end of day (23:59:59)
     - NEVER use dates more than 2 weeks in the future unless explicitly specified
     - ALWAYS calculate dates relative to the current date
     - Format all dates in ISO 8601 (YYYY-MM-DDTHH:mm:ss)
     - Examples:
       * "Friday" -> next Friday from today
       * "next Friday" -> Friday of next week
       * "3pm" today (if before 3pm) or tomorrow (if after 3pm)
  
  5. Other rules:
     - Convert all dates to ISO format
     - Use "Unassigned" if no assignee mentioned`;

  const prompt = mode === 'single' 
    ? `Extract task information from this text: "${text}".
       IMPORTANT: Priority rules:
       - P1 for "highest priority", "urgent", "critical", "P1", "priority 1"
       - P2 for "high priority", "important", "P2", "priority 2"
       - P3 for "medium priority"
       - P4 for "low priority", "lowest priority", "P4", "priority 4"

       DATE RULES:
       - Calculate exact next occurrence for any mentioned day:
           * "Friday" -> next Friday from today
           * "next Friday" -> Friday of next week
           * "Wednesday" -> next Wednesday from today
       - For relative terms:
           * "next week" -> Monday of next week
           * "end of week" -> this Friday EOD
       - Time handling:
           * Specified time (e.g., "3pm") -> use exact time
           * No time -> use 23:59:59
       - Format in ISO 8601 (YYYY-MM-DDTHH:mm:ss)
       
       Return a JSON object with:
       {
         "taskName": "the task description",
         "assignee": "name or Unassigned",
         "dueDateTime": "ISO date in future",
         "priority": "P4" (change according to matched phrases)
       }`
    : `Extract all tasks from these meeting minutes: "${text}".
       IMPORTANT: Priority rules:
       - P1 for "highest priority", "urgent", "critical", "P1", "priority 1"
       - P2 for "high priority", "important", "P2", "priority 2"
       - P3 for "medium priority"
       - P4 for "low priority", "lowest priority", "P4", "priority 4"

       DATE RULES:
       - Calculate exact next occurrence for any mentioned day:
           * "Friday" -> next Friday from today
           * "next Friday" -> Friday of next week
           * "Wednesday" -> next Wednesday from today
       - For relative terms:
           * "next week" -> Monday of next week
           * "end of week" -> this Friday EOD
       - Time handling:
           * Specified time (e.g., "3pm") -> use exact time
           * No time -> use 23:59:59
       - Format in ISO 8601 (YYYY-MM-DDTHH:mm:ss)
       
       Return an array of objects, each with:
       {
         "taskName": "the task description",
         "assignee": "name or Unassigned",
         "dueDateTime": "ISO date in future",
         "priority": "P4" (change according to matched phrases)
       }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
  });

  try {
    console.log('=== OpenAI Raw Response Start ===');
    console.log(completion.choices[0].message.content);
    console.log('=== OpenAI Raw Response End ===');
    const result = JSON.parse(completion.choices[0].message.content);

    // Fix dueDateTime to append 'Z' if missing timezone info
    if (Array.isArray(result)) {
      result.forEach(task => {
        if (task.dueDateTime && !task.dueDateTime.endsWith('Z') && !task.dueDateTime.includes('+')) {
          task.dueDateTime += 'Z';
        }
      });
    } else {
      if (result.dueDateTime && !result.dueDateTime.endsWith('Z') && !result.dueDateTime.includes('+')) {
        result.dueDateTime += 'Z';
      }
    }

    console.log('=== OpenAI Task Extraction ===');
    console.log('Input:', { mode, text });
    console.log('Raw OpenAI Response:', completion.choices[0].message.content);
    console.log('Parsed Result:', result);
    console.log('Priority:', result.priority);
    console.log("Choices",completion.choices);
    console.log('========================');
    return result;
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    // Return a default task with P3 priority if parsing fails
    return {
      taskName: text,
      assignee: "Unassigned",
      dueDateTime: new Date().toISOString(),
      priority: "P3"
    };
  }
}

module.exports = {
  extractTasksFromText
};
