export async function generateViralMetadata(originalTopic: string, settings?: any) {
    const groqKey = process.env.GROQ_API_KEY || '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';
    
    if (!groqKey) {
        console.warn('No GROQ_API_KEY found, falling back to basic rewriting.');
        return {
            title: `SHOCKING: ${originalTopic.substring(0, 50)} 🤯 #shorts`,
            description: `Check out this crazy clip about ${originalTopic}! Make sure to subscribe for more.`
        };
    }

    const tone = settings && settings.geminiTone ? settings.geminiTone : 'Clickbaity';

    try {
        const prompt = `
        You are an expert YouTube Shorts algorithm growth hacker. 
        I have a short video that was originally about: "${originalTopic}".
        
        Write a highly viral, ${tone}, but totally unique YouTube title for this video (under 70 characters). It must include 1-2 trending hashtags like #shorts.
        Then, write a short, engaging description (under 150 characters) that encourages engagement (likes, comments, subs).
        
        Return the result as a valid JSON object with EXACTLY two keys: "title" and "description". Do not include markdown formatting or any other text.
        `;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let text = data.choices[0].message.content;
        
        // Strip markdown code block wrappers if any
        text = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            console.warn('[AI] Failed to parse JSON, falling back. Raw text:', text);
            parsed = {};
        }

        let title = parsed.title || `Viral: ${originalTopic.substring(0, 50)} #shorts`;
        let description = parsed.description || `Don't miss this! Subscribe for more viral content.`;

        // Clean up any extra quotes or markdown
        title = title.replace(/^["']|["']$/g, '');

        return { title, description };
    } catch (err) {
        console.error('[AI] Groq API failed:', err);
        return {
            title: `Viral: ${originalTopic.substring(0, 50)} #shorts`,
            description: `Check out this crazy clip about ${originalTopic}! Make sure to subscribe for more.`
        };
    }
}
