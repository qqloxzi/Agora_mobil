const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

/**
 * SGF dosyaları iki şekilde yüklenebilir:
 *
 * 1. assetExts (binary/blob) — URI döner, text olarak okunur.
 *    Ancak bu yöntemde `require()` doğrudan raw string vermez.
 *
 * 2. sourceExts (JS module) — Metro dosyayı JS modülü gibi işler;
 *    bir custom serializer/transformer ile raw string export etmek gerekir.
 *
 * En basit çözüm: SGF'yi assetExts'te tut, runtime'da fetch() ile oku.
 * sgfLoader.ts bunu kaldırır.
 */
if (!config.resolver.assetExts.includes("sgf")) {
  config.resolver.assetExts.push("sgf");
}

module.exports = withNativeWind(config, { input: "./global.css" });
