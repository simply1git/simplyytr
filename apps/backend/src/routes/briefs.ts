import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// This is a stub for the LLM connection
// In a real scenario, this would call OpenAI, Gemini, or Claude API
async function generateBriefWithLLM(trendsText: string): Promise<{ title: string, script: string }> {
    console.log(`[AI Stub] Generating brief based on trends: ${trendsText.substring(0, 100)}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
        title: "Top AI Trends of 2026 You Can't Miss",
        script: "Hook: Did you know AI is changing everything right now?\n\nBody: Today we are looking at the top 3 AI trends...\n\nOutro: Like and subscribe for more."
    };
}

// Generate a brief based on top trends
router.post('/generate', async (req, res) => {
    try {
        // Fetch top 3 unbriefed trends
        const topTrends = await prisma.trendSignal.findMany({
            take: 3,
            orderBy: { score: 'desc' }
        });

        if (topTrends.length === 0) {
            return res.status(400).json({ error: "No trends available to generate a brief." });
        }

        // Combine transcripts/metadata to feed to LLM
        const contextData = topTrends.map(t => `Topic: ${t.topic}\nTranscript: ${t.transcript || "N/A"}`).join('\n\n');

        // Call the AI
        const generated = await generateBriefWithLLM(contextData);

        // Save the brief
        const brief = await prisma.contentBrief.create({
            data: {
                generatedTitle: generated.title,
                generatedScript: generated.script,
                status: 'DRAFT',
                sourceTrends: {
                    connect: topTrends.map(t => ({ id: t.id }))
                }
            },
            include: { sourceTrends: true }
        });

        res.json({ status: 'success', brief });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: String(err) });
    }
});

router.get('/', async (req, res) => {
    try {
        const briefs = await prisma.contentBrief.findMany({
            orderBy: { id: 'desc' },
            include: { sourceTrends: true }
        });
        res.json(briefs);
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

export default router;
