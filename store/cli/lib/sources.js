/**
 * URL construction helpers for multi-source GitHub resolution.
 */

export function rawFileUrl(source, filePath) {
  return `https://raw.githubusercontent.com/${source.org}/${source.repo}/${source.branch}/${filePath}`;
}

export function releaseAssetUrl(source, tag, assetFilename) {
  return `https://github.com/${source.org}/${source.repo}/releases/download/${tag}/${assetFilename}`;
}

export function sparseCheckoutUrl(source) {
  return `https://github.com/${source.org}/${source.repo}.git`;
}

export function apiReleasesLatestUrl(source) {
  return `https://api.github.com/repos/${source.org}/${source.repo}/releases/latest`;
}

export function registryUrl(source) {
  if (!source.registryPath) return null;
  return rawFileUrl(source, source.registryPath);
}
