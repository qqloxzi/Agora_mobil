/**
 * Custom Expo config plugin:
 * expo-audio paketi kendi AndroidManifest.xml'inde FOREGROUND_SERVICE_MEDIA_PLAYBACK
 * iznini ve mediaPlayback foreground service tipini tanımlıyor. Bu plugin, arka planda
 * medya oynatımı kullanılmadığı için bu gereksiz izin ve servis tanımını build sırasında
 * kaldırır.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const withRemoveMediaPlaybackPermission = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // 1. FOREGROUND_SERVICE_MEDIA_PLAYBACK iznini kaldır
    if (androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = androidManifest.manifest[
        'uses-permission'
      ].filter((perm) => {
        const permName = perm.$?.['android:name'];
        return permName !== 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK';
      });
    }

    // 2. Application içindeki servislerin foregroundServiceType="mediaPlayback" özelliğini kaldır
    const application = androidManifest.manifest.application?.[0];
    if (application?.service) {
      application.service = application.service.map((service) => {
        if (service.$?.['android:foregroundServiceType'] === 'mediaPlayback') {
          // Sadece mediaPlayback tipini sil; servisi tamamen kaldırmak yerine
          // type'ı kaldır. Eğer servisin başka tipi yoksa foregroundServiceType alanını sil.
          const { 'android:foregroundServiceType': _removed, ...rest } = service.$ || {};
          return { ...service, $: rest };
        }
        return service;
      });
    }

    return config;
  });
};

module.exports = withRemoveMediaPlaybackPermission;
