## ⚠️Sorumluluk Reddi Beyanı⚠️

Bu proje, Discord'un kullanım koşulları ve politikalarını ihlal eden "selfbot" kullanımı içerir. Selfbot kullanımı Discord tarafından yasaklanmıştır ve bu tür bir kullanımdan doğacak herhangi bir hesap yasaklama veya ceza işleminden kesinlikle sorumlu değilim. Bu projeyi kullanmadan önce riskleri göz önünde bulundurun. Saygılarımla -Ediz

[Detaylı Resmi Bilgiler](https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots)

# Discord Selfbot Voice Joiner v2.0

Discord kullanıcı tokenlerinizi belirlediğiniz ses kanallarına otomatik olarak bağlayın!

## Kullanılan Dil(ler) ve Kütüphaneler

<picture>
  <source srcset="https://skillicons.dev/icons?i=js,nodejs" media="(prefers-color-scheme: dark)">
  <img src="https://skillicons.dev/icons?i=js,nodejs">
</picture>

## Gereksinimler

- **Node.js v22.12.0** veya üstü ([İndir](https://nodejs.org))
- npm (Node.js ile birlikte gelir)

## Özellikler

- ✅ Birden fazla token ile ses kanallarına otomatik katılım
- ✅ Her token için ayrı sunucu, kanal, presence ve ses ayarları
- ✅ Mute/Deaf desteği (selfMute/selfDeaf)
- ✅ Otomatik yeniden bağlanma (exponential backoff)
- ✅ Renkli ve zamanlı log çıktıları
- ✅ Periyodik bağlantı durum raporu
- ✅ Graceful shutdown (Ctrl+C ile temiz kapanma)
- ✅ Güvenli token yönetimi (.env dosyası)

## Kurulum

1. Bu projeyi bilgisayarınıza klonlayın veya indirin:
   ```bash
   git clone https://github.com/l1ve709/Discord-Voice-Joiner.git
   cd Discord-Voice-Joiner
   ```

2. Gerekli kütüphaneleri yükleyin:
   ```bash
   npm install
   ```

3. `.env` dosyanızı oluşturun:
   ```bash
   cp .env.example .env
   ```

4. `.env` dosyasını açın ve tokenlerinizi girin:
   ```env
   TOKENS=token1,token2,token3
   DEFAULT_GUILD_ID=000000000000000000
   DEFAULT_CHANNEL_ID=000000000000000000
   ```

## Kullanım

Projeyi başlatmak için:
```bash
npm start
```

## Yapılandırma

### Temel Yapılandırma (`.env` dosyası)

| Değişken             | Açıklama                                    |
|----------------------|---------------------------------------------|
| `TOKENS`             | Discord tokenleri (virgülle ayrılmış)       |
| `DEFAULT_GUILD_ID`   | Varsayılan sunucu ID'si                     |
| `DEFAULT_CHANNEL_ID` | Varsayılan ses kanalı ID'si                 |

### Gelişmiş Yapılandırma (`src/config.js`)

Her token için ayrı ayar yapmak istiyorsanız, `config.js` içindeki `PER_TOKEN_CONFIG` dizisini düzenleyin:

```javascript
const PER_TOKEN_CONFIG = [
    {
        guildId: '123456789',              // opsiyonel
        channelId: '987654321',            // opsiyonel
        mute: false,                       // opsiyonel
        deaf: false,                       // opsiyonel
        presence: {                        // opsiyonel
            status: 'dnd',                 // 'online' | 'idle' | 'dnd' | 'invisible'
            type: 'STREAMING',             // 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING' | 'CUSTOM'
            name: 'Yayın başlığı',
            url: 'https://twitch.tv/kanal' // sadece STREAMING için
        }
    },
    // İkinci token için ayar...
];
```

> **Not:** `PER_TOKEN_CONFIG`'de belirtilmeyen tokenler `.env` dosyasındaki varsayılan değerleri kullanır.

### Reconnect Ayarları

`config.js` içindeki `RECONNECT` nesnesini düzenleyin:

```javascript
const RECONNECT = {
    enabled: true,          // Otomatik yeniden bağlanma
    maxRetries: 5,          // Maksimum deneme sayısı
    delayMs: 5000,          // İlk bekleme süresi (ms)
    backoffMultiplier: 2,   // Her denemede bekleme çarpanı
};
```

## Örnek Çıktı

```
╔══════════════════════════════════════════╗
║   Discord Voice Joiner v2.0.0            ║
║   github.com/l1ve709                     ║
╚══════════════════════════════════════════╝

[14:30:00] [Sistem] ℹ️  3 token yüklendi
[14:30:00] [Sistem] ℹ️  Reconnect: Aktif (max 5 deneme)

[14:30:01] [User#1234] ✅ Giriş başarılı
[14:30:01] [User#1234] ✅ Ses kanalına bağlandı: Genel Ses
[14:30:02] [User#5678] ✅ Giriş başarılı
[14:30:02] [User#5678] ✅ Ses kanalına bağlandı: Genel Ses [MUTE] [DEAF]
```

## İletişim

İletişim ve yardım için bana şuralardan ulaşabilirsiniz:

- Instagram: ediz.dll
- Discord: cxnsole
- Web Sitesi: [edizsonmez.com.tr](https://edizsonmez.com.tr)

## Lisans Bilgileri

MIT Lisansı altında korunmaktadır.

## Discord Hesabım

![My Discord](https://lantern.rest/api/v1/users/794909914760871967?svg=1&theme=dark&borderRadius=2&hideActivity=1&hideStatus=0)
