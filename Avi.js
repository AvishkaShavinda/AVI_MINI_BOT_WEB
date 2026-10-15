/**
 * Avi.js - Fully Optimized with Media Details & Download Logic
 */

const { downloadContentFromMessage } = require('baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function handleMessages(Avi, chat) {
    try {
        const m = chat.messages[0];
        // if (!m.message || m.key.fromMe) return;

        const from = m.key.remoteJid;
        const pushName = m.pushName || "Unknown User";

        const body = (
            m.message.conversation || 
            m.message.extendedTextMessage?.text || 
            m.message.imageMessage?.caption || 
            m.message.videoMessage?.caption || 
            m.message.documentMessage?.caption || 
            ""
        ).trim();
        
        const color = {
            cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', 
            magenta: '\x1b[35m', reset: '\x1b[0m', bold: '\x1b[1m'
        };

        const isGroup = from.endsWith('@g.us');
        const prefix = "."; 
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : "";
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(" ");

        // Professional Console Log
        console.log(`${color.cyan}╭───────────────────────────────────────────${color.reset}`);
        console.log(`${color.green}📩 [NEW MESSAGE]${color.reset}`);
        console.log(`${color.yellow}👤 From: ${color.reset}${color.bold}${pushName}${color.reset}`);
        console.log(`${color.yellow}📍 Chat: ${color.reset}${isGroup ? 'Group' : 'Private'}`);
        console.log(`${color.yellow}💬 Msg : ${color.reset}${body || 'Media Content'}`);
        console.log(`${color.cyan}╰───────────────────────────────────────────${color.reset}`);
        
        if (!isCmd) return;

        switch (command) {
            case 'alive':
                await Avi.sendMessage(from, { text: 'AVI MINI බොට් සක්‍රීයයි! 🚀' });
                break;

            case 'menu':
                let menu = `*── 「 AVI MINI MENU 」 ──*\n\n` +
                            `✨ .ping - Speed test\n` +
                            `✨ .alive - Check status\n` +
                            `✨ .getdp - Get profile pic\n` +
                            `✨ .save - Save status/media\n` +
                            `✨ .ytmp4 / .video - Download YouTube Video with Details\n` +
                            `✨ .ytmp3 / .song - Download YouTube Song with Details\n` +
                            `✨ .echo - Repeat text\n\n` +
                            `© 2026 AVI SYSTEM`;
                await Avi.sendMessage(from, { text: menu });
                break;

            case 'ping':
                await Avi.sendMessage(from, { text: 'Pong! 🏓' });
                break;
                
            case 'owner':
                await Avi.sendMessage(from, { text: 'ඔබ සතුව නැති දේ ලබා ගැනීමේ පහසුම ක්‍රමය ඇගයීමයි.. හැකි සෑම විටම තව කෙනෙක්ව ඇගයීමට උත්සහ කරන්න. එය ඔබේ මානසික සංවර්ධිත බවේ සලකුණකි..සංස්කරණය කළ පරිවර්තනයකි!' });
                break;

            case 'getdp':
            case 'getpp': {
                try {
                    let q = text.trim();
                    if (!q) return await Avi.sendMessage(from, { text: "*❌ අංකයක් ලබා දෙන්න. Ex: .getdp 947xxxxxxxx*" });

                    let jid = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
                    let ppUrl;
                    try {
                        ppUrl = await Avi.profilePictureUrl(jid, "image");
                    } catch {
                        ppUrl = "https://files.catbox.moe/mjem6q.jpg"; 
                    }

                    const metaQuote = {
                        key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false },
                        message: { contactMessage: { displayName: "AVI MINI", vcard: `BEGIN:VCARD\nVERSION:3.0\nN:AVI MINI;;;;\nFN:AVI MINI\nEND:VCARD` } }
                    };

                    await Avi.sendMessage(from, { 
                        image: { url: ppUrl }, 
                        caption: `> 🖼 *Profile Picture of* +${q.replace(/[^0-9]/g, '')}\n> *Fetched by:* AVI MINI ✨`,
                    }, { quoted: metaQuote });

                } catch (e) {
                    await Avi.sendMessage(from, { text: "*⚠️ DP එක ලබා ගත නොහැක.*" });
                }
                break;
            }

            case 'දාපන්':
            case 'save': 
            case 'ඔන': {
                try {
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                                      (m.message.imageMessage || m.message.videoMessage ? m.message : null);

                    if (!quotedMsg) {
                        return await Avi.sendMessage(from, { text: '*❌ කරුණාකර Status එකකට reply කර හෝ caption එක ලෙස .save යොදා එවන්න.*' });
                    }

                    try { await Avi.sendMessage(from, { react: { text: '💾', key: m.key } }); } catch (e) {}

                    const type = Object.keys(quotedMsg)[0];
                    
                    if (type === 'conversation' || type === 'extendedTextMessage') {
                        const savedText = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
                        await Avi.sendMessage(from, { text: `✅ *Status Saved*\n\n${savedText}` });
                    } 
                    else if (/imageMessage|videoMessage|audioMessage|stickerMessage|documentMessage/.test(type)) {
                        const stream = await downloadContentFromMessage(quotedMsg[type], type.replace('Message', ''));
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }

                        const caption = quotedMsg[type].caption || '✅ Saved by AVI MINI';
                        const mimetype = quotedMsg[type].mimetype;

                        if (type === 'imageMessage') {
                            await Avi.sendMessage(from, { image: buffer, caption: caption });
                        } else if (type === 'videoMessage') {
                            await Avi.sendMessage(from, { video: buffer, caption: caption, mimetype: mimetype });
                        } else if (type === 'audioMessage') {
                            await Avi.sendMessage(from, { audio: buffer, mimetype: mimetype, ptt: quotedMsg[type].ptt });
                        } else if (type === 'stickerMessage') {
                            await Avi.sendMessage(from, { sticker: buffer });
                        } else if (type === 'documentMessage') {
                            await Avi.sendMessage(from, { document: buffer, fileName: quotedMsg[type].fileName, mimetype: mimetype });
                        }
                    }
                } catch (err) {
                    console.error(err);
                    await Avi.sendMessage(from, { text: '❌ දෝෂයක් සිදු විය.' });
                }
                break;
            }

            // 🎥 YTMP4 VIDEO DOWNLOADER WITH DETAILS (David Cyril Tech API)
            case 'video':
            case 'ytmp4': {
                if (!text) {
                    return await Avi.sendMessage(from, { text: '💡 *භාවිතය:* `.video [YouTube Link]`' });
                }

                const url = text.trim();
                const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
                
                if (!regex.test(url)) {
                    return await Avi.sendMessage(from, { text: '❌ කරුණාකර නිවැරදි YouTube Link එකක් ලබාදෙන්න.' });
                }

                await Avi.sendMessage(from, { react: { text: '⏳', key: m.key } });

                try {
                    const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(url)}`;
                    const response = await fetch(apiUrl);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    if (!data || !data.status || !data.result) {
                        return await Avi.sendMessage(from, { text: '❌ වීඩියෝව ලබා ගැනීමට නොහැකි විය.' });
                    }

                    const v = data.result;
                    const caption = `🎬 *${v.title || 'YouTube Video'}*\n\n` +
                                    `> 📺 *Quality:* ${v.quality || 'HD'}\n` +
                                    `> 🔗 *Source:* YouTube\n\n` +
                                    `> © AVI MINI SYSTEM`;

                    await Avi.sendMessage(from, { react: { text: '📥', key: m.key } });

                    // Thumbnail එකක් ඇත්නම් Thumbnail සමඟ විස්තර යැවිය හැක, නැතහොත් කෙලින්ම Video එක යැවිය හැක
                    await Avi.sendMessage(from, {
                        video: { url: v.download_url },
                        mimetype: 'video/mp4',
                        caption: caption
                    }, { quoted: m });

                    await Avi.sendMessage(from, { react: { text: '✅', key: m.key } });

                } catch (err) {
                    console.error('[YTMP4 API Error]:', err);
                    await Avi.sendMessage(from, { text: '❌ Download කිරීමේදී දෝෂයක් සිදුවිය.' });
                }
                break;
            }

            // 🎵 YTMP3 SONG DOWNLOADER WITH DETAILS (David Cyril Tech API)
            case 'song':
            case 'ytmp3': {
                if (!text) {
                    return await Avi.sendMessage(from, { text: '💡 *භාවිතය:* `.song [YouTube Link]`' });
                }

                const url = text.trim();
                const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
                
                if (!regex.test(url)) {
                    return await Avi.sendMessage(from, { text: '❌ කරුණාකර නිවැරදි YouTube Link එකක් ලබාදෙන්න.' });
                }

                await Avi.sendMessage(from, { react: { text: '⏳', key: m.key } });

                try {
                    const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(url)}`;
                    const response = await fetch(apiUrl);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    if (!data || !data.status || !data.result) {
                        return await Avi.sendMessage(from, { text: '❌ ගීතය ලබා ගැනීමට නොහැකි විය.' });
                    }

                    const s = data.result;
                    const audioCaption = `🎵 *${s.title || 'YouTube Song'}*\n\n` +
                                         `> ⏱️ *Duration:* ${s.duration || 'N/A'}\n` +
                                         `> 👤 *Author:* ${s.author?.name || 'Unknown'}\n` +
                                         `> 🔗 *Source:* YouTube\n\n` +
                                         `> © AVI MINI SYSTEM`;

                    await Avi.sendMessage(from, { react: { text: '📥', key: m.key } });

                    // ගීතයේ විස්තර (Caption) සමඟ Audio එක යැවීම
                    await Avi.sendMessage(from, {
                        audio: { url: s.download_url },
                        mimetype: 'audio/mp4',
                        fileName: `${s.title || 'song'}.mp3`,
                        caption: audioCaption
                    }, { quoted: m });

                    await Avi.sendMessage(from, { react: { text: '✅', key: m.key } });

                } catch (err) {
                    console.error('[YTMP3 API Error]:', err);
                    await Avi.sendMessage(from, { text: '❌ Download කිරීමේදී දෝෂයක් සිදුවිය.' });
                }
                break;
            }

            case 'echo':
                if (!text) return await Avi.sendMessage(from, { text: 'මොනවා හරි ලියන්න මචං!' });
                await Avi.sendMessage(from, { text: text });
                break;

                // 📘 FACEBOOK VIDEO DOWNLOADER (yt-dlp Method)
            case 'fb':
            case 'facebook': {
                if (!text) {
                    return await Avi.sendMessage(from, { text: '💡 *භාවිතය:* `.fb [Facebook Video Link]`' });
                }

                const url = text.trim();
                const regex = /(https?:\/\/)?(www\.)?(facebook|fb)\.(com|watch|me)\/.+/;
                
                if (!regex.test(url)) {
                    return await Avi.sendMessage(from, { text: '❌ කරුණාකර නිවැරදි Facebook Link එකක් ලබාදෙන්න.' });
                }

                await Avi.sendMessage(from, { react: { text: '⏳', key: m.key } });

                const fileName = `fb_${Date.now()}.mp4`;
                const filePath = path.join(__dirname, fileName);

                // yt-dlp භාවිතයෙන් Facebook වීඩියෝව ඩවුන්ලෝඩ් කිරීම
                const dlCommand = `yt-dlp "${url}" -f "best[ext=mp4]/best" --no-playlist -o "${filePath}"`;

                exec(dlCommand, { timeout: 120000 }, async (error, stdout, stderr) => {
                    if (error || !fs.existsSync(filePath)) {
                        console.error('[FB yt-dlp Error]:', error);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return await Avi.sendMessage(from, { text: '❌ Facebook වීඩියෝව ඩවුන්ලෝඩ් කරග ගැනීමට නොහැකි විය. Link එක පරීක්ෂා කරන්න.' });
                    }

                    try {
                        await Avi.sendMessage(from, { react: { text: '⬆️', key: m.key } });

                        const fileBuffer = fs.readFileSync(filePath);

                        await Avi.sendMessage(from, { 
                            video: fileBuffer, 
                            mimetype: 'video/mp4',
                            caption: `📘 *Facebook Video Downloaded*\n\n> © AVI MINI SYSTEM`
                        }, { quoted: m });

                        await Avi.sendMessage(from, { react: { text: '✅', key: m.key } });

                    } catch (sendErr) {
                        console.error('[FB Send Error]:', sendErr);
                        await Avi.sendMessage(from, { text: '❌ වීඩියෝව යැවීමේදී දෝෂයක් සිදුවිය.' });
                    } finally {
                        if (fs.existsSync(filePath)) {
                            try { fs.unlinkSync(filePath); } catch (e) {}
                        }
                    }
                });

                break;
            }

            // Avi.js හි ඉහළින්ම මෙය එකතු කරන්න
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

// ... handleMessages function එක තුළ switch (command) ඇතුළේ ...

// 🎨 ස්ටිකර් සාදන COMMAND (API රහිත, Author සමඟ)
case 'sticker':
case 's': {
    try {
        // Quote කළ හෝ එවූ Message එක හඳුනා ගැනීම
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
        
        // පින්තූරයක් (ImageMessage) හෝ වීඩියෝවක් (VideoMessage) ද යන්න පරීක්ෂා කිරීම
        const isImage = quotedMsg?.imageMessage || m.message?.imageMessage;
        const isVideo = quotedMsg?.videoMessage || m.message?.videoMessage;

        if (!isImage && !isVideo) {
            return await Avi.sendMessage(from, { text: '❌ කරුණාකර පින්තූරයකට (Image) හෝ කෙටි වීඩියෝවකට .s ලෙස Reply කරන්න.' });
        }

        await Avi.sendMessage(from, { react: { text: '🎨', key: m.key } });

        // Media Content එක Download කිරීම
        const mediaMessage = isImage ? (quotedMsg?.imageMessage || m.message?.imageMessage) : (quotedMsg?.videoMessage || m.message?.videoMessage);
        const mediaType = isImage ? 'image' : 'video';
        
        const stream = await downloadContentFromMessage(mediaMessage, mediaType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // --- 🟢 AUTHOR සහ PACK විස්තර සමඟ ස්ටිකරය සැකසීම ---
        const sticker = new Sticker(buffer, {
            pack: 'AVI MINI PACK',        // Sticker Pack එකේ නම
            author: 'AVI',                 // Author (නිර්මාණකරු) නම
            type: StickerTypes.FULL,       // Sticker එකේ ආකාරය (CROPPED, FULL, ROUNDED)
            quality: 80,                   // ධ්වනි ගුණාත්මකභාවය
            background: '#00000000'        // පසුබිම (Transparent)
        });

        // ස්ටිකර් Buffer එක ලබා ගැනීම
        const stickerBuffer = await sticker.toBuffer();

        // ස්ටිකරය යැවීම
        await Avi.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });
        await Avi.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error('[Sticker Author Error]:', err);
        await Avi.sendMessage(from, { text: '❌ Sticker එක සැකසීමේදී දෝෂයක් සිදුවිය. (ඔබ wa-sticker-formatter install කර ඇත්දැයි පරීක්ෂා කරන්න)' });
    }
    break;
}

            default:
                break;
        }

    } catch (err) {
        console.error("Error in Avi.js:", err);
    }
}

module.exports = { handleMessages };
