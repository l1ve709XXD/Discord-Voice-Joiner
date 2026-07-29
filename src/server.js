import config from './config.js';
import { Client } from 'discord.js-selfbot-v13';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';


const Colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

function timestamp() {
    return new Date().toLocaleTimeString('tr-TR', { hour12: false });
}

function log(tag, message, color = Colors.cyan) {
    console.log(`${Colors.gray}[${timestamp()}]${Colors.reset} ${color}[${tag}]${Colors.reset} ${message}`);
}

function logSuccess(tag, message) { log(tag, `✅ ${message}`, Colors.green); }
function logWarn(tag, message) { log(tag, `⚠️  ${message}`, Colors.yellow); }
function logError(tag, message) { log(tag, `❌ ${message}`, Colors.red); }
function logInfo(tag, message) { log(tag, `ℹ️  ${message}`, Colors.blue); }


const connections = new Map(); // tag -> { status, voiceConnection, client, tokenConfig }


async function connectToVoice(client, tokenConfig, tag, retryCount = 0) {
    const guild = client.guilds.cache.get(tokenConfig.guildId);
    if (!guild) {
        logError(tag, `Sunucu bulunamadı: ${tokenConfig.guildId}`);
        connections.set(tag, { ...connections.get(tag), status: 'guild_not_found' });
        return null;
    }

    const voiceChannel = guild.channels.cache.get(tokenConfig.channelId);
    if (!voiceChannel) {
        logError(tag, `Ses kanalı bulunamadı: ${tokenConfig.channelId}`);
        connections.set(tag, { ...connections.get(tag), status: 'channel_not_found' });
        return null;
    }

    try {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            group: client.user.id,
            selfMute: tokenConfig.mute,
            selfDeaf: tokenConfig.deaf,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            logSuccess(tag, `Ses kanalına bağlandı: ${voiceChannel.name}` +
                (tokenConfig.mute ? ' [MUTE]' : '') +
                (tokenConfig.deaf ? ' [DEAF]' : ''));
            connections.set(tag, { ...connections.get(tag), status: 'connected', voiceConnection: connection });
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            logWarn(tag, 'Ses bağlantısı koptu, yeniden bağlanılıyor...');
            connections.set(tag, { ...connections.get(tag), status: 'disconnected' });

            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch {
                connection.destroy();
                if (config.reconnect.enabled) {
                    await retryConnection(client, tokenConfig, tag);
                }
            }
        });

        connection.on('error', (error) => {
            logError(tag, `Voice connection hatası: ${error.message}`);
        });

        return connection;
    } catch (error) {
        logError(tag, `Ses kanalına bağlanılamadı: ${error.message}`);
        connections.set(tag, { ...connections.get(tag), status: 'error' });
        return null;
    }
}


async function retryConnection(client, tokenConfig, tag, attempt = 0) {
    const { maxRetries, delayMs, backoffMultiplier } = config.reconnect;

    if (attempt >= maxRetries) {
        logError(tag, `${maxRetries} deneme sonrası yeniden bağlanılamadı. Vazgeçildi.`);
        connections.set(tag, { ...connections.get(tag), status: 'failed' });
        return;
    }

    const waitMs = delayMs * Math.pow(backoffMultiplier, attempt);
    logInfo(tag, `Yeniden bağlanma denemesi ${attempt + 1}/${maxRetries} — ${(waitMs / 1000).toFixed(1)}s sonra...`);

    await sleep(waitMs);

    const connection = await connectToVoice(client, tokenConfig, tag, attempt + 1);
    if (!connection && attempt + 1 < maxRetries) {
        await retryConnection(client, tokenConfig, tag, attempt + 1);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function setPresence(client, presenceConfig, tag) {
    if (!presenceConfig) return;

    try {
        const activity = { name: presenceConfig.name || '' };

        if (presenceConfig.type) activity.type = presenceConfig.type;
        if (presenceConfig.url) activity.url = presenceConfig.url;
        if (presenceConfig.state) activity.state = presenceConfig.state;

        client.user.setPresence({
            activities: [activity],
            status: presenceConfig.status || 'online',
        });

        logInfo(tag, `Durum ayarlandı: ${presenceConfig.type || 'CUSTOM'} — "${presenceConfig.name || presenceConfig.state || ''}"`);
    } catch (error) {
        logError(tag, `Durum ayarlanamadı: ${error.message}`);
    }
}


async function start() {
    console.log('');
    console.log(`${Colors.bright}${Colors.magenta}╔══════════════════════════════════════════╗${Colors.reset}`);
    console.log(`${Colors.bright}${Colors.magenta}║   Discord Voice Joiner v2.0.0            ║${Colors.reset}`);
    console.log(`${Colors.bright}${Colors.magenta}║   github.com/l1ve709                     ║${Colors.reset}`);
    console.log(`${Colors.bright}${Colors.magenta}╚══════════════════════════════════════════╝${Colors.reset}`);
    console.log('');

    logInfo('Sistem', `${config.tokens.length} token yüklendi`);
    logInfo('Sistem', `Reconnect: ${config.reconnect.enabled ? 'Aktif' : 'Devre dışı'} (max ${config.reconnect.maxRetries} deneme)`);
    console.log('');

    const clients = [];

    for (let index = 0; index < config.tokens.length; index++) {
        const tokenConfig = config.tokens[index];
        const client = new Client({ checkUpdate: false });
        const tokenLabel = `Token #${index + 1}`;

        clients.push({ client, tokenConfig, tag: tokenLabel });

        client.on('ready', async () => {
            const tag = client.user.tag;
            logSuccess(tag, 'Giriş başarılı');

            connections.set(tag, { status: 'connecting', client, tokenConfig });

            await connectToVoice(client, tokenConfig, tag);

            setPresence(client, tokenConfig.presence, tag);
        });

        client.on('error', (error) => {
            logError(tokenLabel, `Client hatası: ${error.message}`);
        });

        client.on('disconnect', () => {
            logWarn(tokenLabel, 'Client bağlantısı kesildi');
        });

        try {
            await client.login(tokenConfig.token);
        } catch (error) {
            logError(tokenLabel, `Giriş başarısız: ${error.message}`);
        }
    }


    if (config.statusReportIntervalMs > 0) {
        setInterval(() => {
            console.log('');
            logInfo('Rapor', '── Bağlantı Durumu ──');
            for (const [tag, info] of connections) {
                const statusIcon = info.status === 'connected' ? '🟢' :
                    info.status === 'connecting' ? '🟡' :
                        info.status === 'disconnected' ? '🟠' : '🔴';
                log('Rapor', `${statusIcon} ${tag}: ${info.status}`, Colors.gray);
            }
            console.log('');
        }, config.statusReportIntervalMs);
    }


    async function shutdown(signal) {
        console.log('');
        logWarn('Sistem', `${signal} alındı — kapatılıyor...`);

        for (const [tag, info] of connections) {
            try {
                if (info.voiceConnection) {
                    info.voiceConnection.destroy();
                    logInfo(tag, 'Voice bağlantısı kapatıldı');
                }
                if (info.client) {
                    info.client.destroy();
                }
            } catch {
            }
        }

        for (const { client } of clients) {
            try {
                client.destroy();
            } catch {
            }
        }

        logSuccess('Sistem', 'Tüm bağlantılar kapatıldı. Güle güle! 👋');
        process.exit(0);
    }

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}


process.on('unhandledRejection', (reason) => {
    logError('Sistem', `Beklenmeyen hata (unhandledRejection): ${reason}`);
});

process.on('uncaughtException', (error) => {
    logError('Sistem', `Beklenmeyen hata (uncaughtException): ${error.message}`);
});

start();
