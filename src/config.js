import 'dotenv/config';

// ──────────────────────────────────────────────
// Yardımcı: Ortam değişkenlerini oku
// ──────────────────────────────────────────────
function env(key, fallback = undefined) {
    const value = process.env[key];
    if (value === undefined || value === '') return fallback;
    return value;
}

// ──────────────────────────────────────────────
// Token'ları .env'den oku
// ──────────────────────────────────────────────
const rawTokens = env('TOKENS', '');
const TOKENS = rawTokens
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

// ──────────────────────────────────────────────
// Varsayılan ayarlar
// ──────────────────────────────────────────────
const DEFAULT_GUILD_ID = env('DEFAULT_GUILD_ID', '');
const DEFAULT_CHANNEL_ID = env('DEFAULT_CHANNEL_ID', '');

// ──────────────────────────────────────────────
// Per-token yapılandırma
// Her token için ayrı guild, channel, presence ve
// ses ayarları belirlenebilir.
//
// Eğer per-token ayar yoksa, varsayılan değerler kullanılır.
// Bu diziyi istediğiniz kadar genişletebilirsiniz.
// ──────────────────────────────────────────────
const PER_TOKEN_CONFIG = [
    // Örnek:
    // {
    //     guildId: '123456789',          // opsiyonel — boş bırakılırsa DEFAULT_GUILD_ID kullanılır
    //     channelId: '987654321',        // opsiyonel — boş bırakılırsa DEFAULT_CHANNEL_ID kullanılır
    //     mute: false,                   // opsiyonel — varsayılan false
    //     deaf: false,                   // opsiyonel — varsayılan false
    //     presence: {                    // opsiyonel — ayarlanmazsa presence değiştirilmez
    //         status: 'dnd',             // 'online' | 'idle' | 'dnd' | 'invisible'
    //         type: 'STREAMING',         // 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING' | 'CUSTOM'
    //         name: 'Yayın başlığı',
    //         url: 'https://twitch.tv/kanal',   // sadece STREAMING için
    //         state: ''                  // sadece CUSTOM için
    //     }
    // },
];

// ──────────────────────────────────────────────
// Reconnect ayarları
// ──────────────────────────────────────────────
const RECONNECT = {
    enabled: true,          // Otomatik yeniden bağlanma
    maxRetries: 5,          // Maksimum deneme sayısı
    delayMs: 5000,          // Denemeler arası bekleme (ms)
    backoffMultiplier: 2,   // Her denemede bekleme çarpanı
};

// ──────────────────────────────────────────────
// Durum raporu aralığı (ms) — 0 = devre dışı
// ──────────────────────────────────────────────
const STATUS_REPORT_INTERVAL_MS = 60_000; // her 60 saniyede bir

// ──────────────────────────────────────────────
// Config nesnesini derle ve doğrula
// ──────────────────────────────────────────────
function buildConfig() {
    // Token kontrolü
    if (TOKENS.length === 0) {
        console.error('❌ Hata: .env dosyasında TOKENS bulunamadı.');
        console.error('   .env.example dosyasını .env olarak kopyalayın ve tokenlerinizi girin.');
        process.exit(1);
    }

    // Per-token config'leri varsayılanlarla birleştir
    const tokens = TOKENS.map((token, index) => {
        const perToken = PER_TOKEN_CONFIG[index] || {};
        return {
            token,
            guildId: perToken.guildId || DEFAULT_GUILD_ID,
            channelId: perToken.channelId || DEFAULT_CHANNEL_ID,
            mute: perToken.mute ?? false,
            deaf: perToken.deaf ?? false,
            presence: perToken.presence || null,
        };
    });

    // Doğrulama
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (!t.guildId) {
            console.error(`❌ Hata: Token #${i + 1} için guildId belirtilmemiş.`);
            process.exit(1);
        }
        if (!t.channelId) {
            console.error(`❌ Hata: Token #${i + 1} için channelId belirtilmemiş.`);
            process.exit(1);
        }
    }

    return {
        tokens,
        reconnect: RECONNECT,
        statusReportIntervalMs: STATUS_REPORT_INTERVAL_MS,
    };
}

export default buildConfig();
