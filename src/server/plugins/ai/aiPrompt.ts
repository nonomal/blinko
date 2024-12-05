import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

export class AiPrompt {
  static WritingPrompt(type: 'expand' | 'polish' | 'custom', content?: string) {
    const systemPrompts = {
      expand: `You are a professional writing assistant. Your task is to expand and enrich the given text content:
       1. Detect and use the same language as the input content
       2. Add more details and descriptions
       3. Expand arguments and examples
       4. Include relevant background information
       5. Maintain consistency with the original tone and style
       
       Original content:
       {content}
       
       Important:
       - Respond in the SAME LANGUAGE as the input content
       - Use Markdown format
       - Replace all spaces with &#x20;
       - Use two line breaks between paragraphs
       - Ensure line breaks between list items`,

      polish: `You are a professional text editor. Your task is to polish and optimize the given text:
       1. Detect and use the same language as the input content
       2. Improve word choice and expressions
       3. Optimize sentence structure
       4. Maintain the original core meaning
       5. Ensure the text flows naturally
       
       Original content:
       {content}
       
       Important:
       - Respond in the SAME LANGUAGE as the input content
       - Use Markdown format
       - Replace all spaces with &#x20;
       - Use two line breaks between paragraphs
       - Ensure line breaks between list items`,

      custom: `You are a professional writing assistant. Your task is to:
       1. Detect and use the same language as the input content
       2. Create content according to user requirements
       3. Maintain professional writing standards
       4. Follow technical documentation best practices when needed
       
       Important:
       - Respond in the SAME LANGUAGE as the input content
       - Use Markdown format
       - Replace all spaces with &#x20;
       - Use two line breaks between paragraphs
       - Ensure line breaks between list items
       - Use appropriate Markdown elements (code blocks, tables, lists, etc.)`
    };

    const writingPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompts[type]],
      ["human", "{question}"]
    ]);

    return writingPrompt;
  }

  static AutoTagPrompt(tags: string[]) {
    const systemPrompt = `You are a professional text classification assistant. Your task is to:
     1. Analyze the given text content
     2. Select appropriate tags from existing tags
     3. Suggest 2-3 new tags if existing ones are not sufficient
     4. Return all tags directly, separated by commas
     
     Text content:
     {context}
     
     Existing tags:
     ${tags.join(', ')}
     
     Important notes:
     - New tags should follow the existing hierarchical format (e.g., #category/subcategory)
     - Tags should be concise and descriptive
     - Each tag should start with #
     - Only return the list of tags, no additional explanatory text needed`
    const autoTagPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["human", "Please select and suggest appropriate tags for the above content"]
    ]);
    return autoTagPrompt;
  }

  static AutoEmojiPrompt() {
    const systemPrompt = `You are a professional emoji suggestion assistant. Your task is to:
     1. Analyze the given text content
     2. Suggest 4-10 new emojis if existing ones are not sufficient
     3. Return all emojis directly, separated by commas
     
     Text content:
     {context}
     
     Important notes:
     - New emojis should be relevant to the content`
    const autoEmojiPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["human", "Please select and suggest appropriate emojis for the above content"]
    ]);
    return autoEmojiPrompt;
  }

  static QAPrompt() {
    const systemPrompt =
      "You are a versatile AI assistant who can: \n" +
      "1. Answer questions and explain concepts\n" +
      "2. Provide suggestions and analysis\n" +
      "3. Help with planning and organizing ideas\n" +
      "4. Assist with content creation and editing\n" +
      "5. Perform basic calculations and reasoning\n\n" +
      "Use the following context to assist with your responses: \n" +
      "{context}\n\n" +
      "If a request is beyond your capabilities, please be honest about it.\n" +
      "Always respond in the user's language.\n" +
      "Maintain a friendly and professional conversational tone.";

    const qaPrompt = ChatPromptTemplate.fromMessages(
      [
        ["system", systemPrompt],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"]
      ]
    )

    return qaPrompt
  }
}
