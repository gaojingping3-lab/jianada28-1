export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const clientData = await request.json();

        // 从 Cloudflare 后台环境变量中读取 Key
        const apiKey = env.DEEPSEEK_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "Missing DEEPSEEK_API_KEY in Cloudflare settings" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const systemPrompt = (
            "你是一个深谙心理学与概率陷阱的反诈观察者。当前用户在一个公开的反诈教育演示网页中，以虚拟筹码完整体验了一次高频快开赌局，并最终归零。" +
            "请根据用户的下注统计数据，生成一段200字左右、冷峻、直击要害的判词。" +
            "要点：撕开'走势图规律、快频开奖剥夺理性、倍投抽水必输'的心理绑架机制；点明在现实中陷入此类非法网络赌博（如所谓'加拿大28'）会导致工资、存款、网贷和家庭的崩塌；引导用户拨打96110。" +
            "直接输出正文，不要标题、不要引言、不要分点列表。"
        );

        const userContent = `玩家数据：共下注 ${clientData.rounds} 期，最高余额曾达 ${clientData.highest}，累计输光本金 ${clientData.totalLost}。现已彻底归零破产。`;

        // 转发给 DeepSeek 官方接口
        const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                temperature: 0.8
            })
        });

        const resData = await deepseekResponse.json();

        if (!deepseekResponse.ok) {
            return new Response(JSON.stringify({ error: resData.error || "DeepSeek API Error" }), {
                status: deepseekResponse.status,
                headers: { "Content-Type": "application/json" }
            });
        }

        const replyText = resData.choices?.[0]?.message?.content?.trim() || "";

        return new Response(JSON.stringify({ text: replyText }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
