/**
 * Custom Expo config plugin:
 * expo-audio paketi kendi AndroidManifest.xml'inde FOREGROUND_SERVICE_MEDIA_PLAYBACK
 * iznini ve mediaPlayback foreground service tipini tanımlıyor. Bu plugin, arka planda
 * medya oynatımı kullanılmadığı için bu gereksiz izin ve servis tanımını build sırasında
 * kaldırır.
 *
 * Not: İzin kütüphane manifest'inden merge edildiği için yalnızca filter yetmez;
 * tools:node="remove" ile Gradle merger aşamasında da silinmesi gerekir.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const MEDIA_PLAYBACK_PERMISSION =
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK';
const AUDIO_CONTROLS_SERVICE =
  'expo.modules.audio.service.AudioControlsService';

const withRemoveMediaPlaybackPermission = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

    // tools namespace gerekli (tools:node="remove" için)
    if (!manifest.$) manifest.$ = {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // 1) Mevcut FOREGROUND_SERVICE_MEDIA_PLAYBACK girişlerini temizle
    if (manifest['uses-permission']) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (perm) => perm.$?.['android:name'] !== MEDIA_PLAYBACK_PERMISSION
      );
    } else {
      manifest['uses-permission'] = [];
    }

    // 2) Kütüphane merge'ini engellemek için tools:node="remove" ekle
    manifest['uses-permission'].push({
      $: {
        'android:name': MEDIA_PLAYBACK_PERMISSION,
        'tools:node': 'remove',
      },
    });

    const application = manifest.application?.[0];
    if (application) {
      if (!application.service) application.service = [];

      // 3) App manifest'indeki mediaPlayback tipini kaldır
      application.service = application.service.map((service) => {
        const type = service.$?.['android:foregroundServiceType'];
        if (type === 'mediaPlayback') {
          const { 'android:foregroundServiceType': _removed, ...rest } =
            service.$ || {};
          return { ...service, $: rest };
        }
        // Birleşik tipler: "mediaPlayback|..." -> mediaPlayback'i çıkar
        if (typeof type === 'string' && type.includes('mediaPlayback')) {
          const cleaned = type
            .split('|')
            .map((t) => t.trim())
            .filter((t) => t && t !== 'mediaPlayback')
            .join('|');
          if (cleaned) {
            return {
              ...service,
              $: { ...service.$, 'android:foregroundServiceType': cleaned },
            };
          }
          const { 'android:foregroundServiceType': _removed, ...rest } =
            service.$ || {};
          return { ...service, $: rest };
        }
        return service;
      });

      // 4) expo-audio AudioControlsService'i merge'ten tamamen çıkar
      //    (foregroundServiceType="mediaPlayback" bu serviste tanımlı)
      const alreadyHasRemove = application.service.some(
        (s) =>
          s.$?.['android:name'] === AUDIO_CONTROLS_SERVICE &&
          s.$?.['tools:node'] === 'remove'
      );
      if (!alreadyHasRemove) {
        application.service.push({
          $: {
            'android:name': AUDIO_CONTROLS_SERVICE,
            'tools:node': 'remove',
          },
        });
      }
    }

    return config;
  });
};

module.exports = withRemoveMediaPlaybackPermission;
