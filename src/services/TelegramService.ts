
export const TelegramService = {
    // Send message directly via Telegram Bot API
    sendMessage: async (botToken: string, chatId: string, text: string) => {
        if (!botToken || !chatId) {
            console.error('TelegramService: Missing token or chatId');
            return { success: false, error: 'Missing credentials' };
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown', // Optional: allows bold/italic
                }),
            });

            const data = await response.json();

            if (!data.ok) {
                console.error('Telegram API Error:', data);
                return { success: false, error: data.description };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Telegram Network Error:', error);
            return { success: false, error: 'Network error' };
        }
    },

    // Get "Get Updates" to find Chat ID (Manual Polling Helper)
    // This is useful if we want to build a "Find My ID" button
    getUpdates: async (botToken: string) => {
        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Telegram GetUpdates Error:', error);
            return null;
        }
    }
};
