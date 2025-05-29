const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function extractTasksFromText(text, mode) {
  const systemPrompt = `You are a task extraction assistant that extracts structured task information from text and returns it in JSON format.
  
  CRITICAL PRIORITY RULES - READ CAREFULLY:
  1. DEFAULT PRIORITY IS ALWAYS "P3"
  2. EXACT PRIORITY MATCHING:
     - P1 (Highest): Set P1 if text contains ANY of these exact phrases:
       * "highest priority"
       * "urgent"
       * "critical"
       * "P1"
       * "priority 1"
     
     - P2 (High/Medium): Set P2 if text contains ANY of these exact phrases:
       * "high priority"
       * "medium priority"
       * "important"
       * "P2"
       * "priority 2"
     
     - P3 (Default/Low): Set P3 if:
       * text contains "low priority"
       * no priority is specified
       * none of the above P1/P2 phrases are found
     
  3. IMPORTANT:
     - The word "priority" alone defaults to P3
     - Must match phrases exactly as written above
     - Case insensitive matching
     - If multiple priorities mentioned, use the highest one
     - When in doubt, use P3
     - Never infer priority from context or task importance
     - Never infer priority from deadlines
  
  4. Other rules:
     - Convert dates to ISO format
     - Use "Unassigned" if no assignee mentioned`;

  const prompt = mode === 'single' 
    ? `Extract task information from this text: "${text}".
       IMPORTANT: Priority rules:
       - P1 for "highest priority", "urgent", "critical", "P1", "priority 1"
       - P2 for "high priority", "medium priority", "important", "P2", "priority 2"
       - P3 for "low priority" or if no priority specified
       Return a JSON object with:
       {
         "taskName": "the task description",
         "assignee": "name or Unassigned",
         "dueDateTime": "ISO date",
         "priority": "P3" (change ONLY if text matches P1/P2 phrases exactly)
       }`
    : `Extract all tasks from these meeting minutes: "${text}".
       IMPORTANT: Priority rules:
       - P1 for "highest priority", "urgent", "critical", "P1", "priority 1"
       - P2 for "high priority", "medium priority", "important", "P2", "priority 2"
       - P3 for "low priority" or if no priority specified
       Return an array of objects, each with:
       {
         "taskName": "the task description",
         "assignee": "name or Unassigned",
         "dueDateTime": "ISO date",
         "priority": "P3" (change ONLY if text matches P1/P2 phrases exactly)
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
    const result = JSON.parse(completion.choices[0].message.content);
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
