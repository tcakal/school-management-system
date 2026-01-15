import { supabase } from '../supabase';

export const TelegramService = {
    // Send message directly via Telegram Bot API
    sendMessage: async (chatId: string, text: string) => {
        if (!chatId) {
            console.error('TelegramService: Missing chatId');
            return { success: false, error: 'Missing credentials' };
        }

        try {
            // Use server-side function to bypass CORS
            const { data, error } = await supabase.rpc('send_telegram_message', {
                p_chat_id: chatId,
                p_message: text
            });

            if (error) {
                console.error('Telegram RPC Error:', error);
                // Fallback to client-side fetch if RPC fails (e.g., function not created)
                // BUT this will likely fail CORS in production.
                // Keeping as fallback for localhost testing potentially.
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error: any) {
            console.error('Telegram Service Error:', error);
            return { success: false, error: error.message || 'Unknown error' };
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
