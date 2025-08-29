// utils/media.ts

export const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;

export const getYouTubeId = (url: string) => url.match(YT_REGEX)?.[1] ?? null;

const getMimeHint = (src: string) => {
  const hash = src.split("#")[1] || "";
  const m = hash.match(/(?:^|&)mime=([^&]+)/i);
  return m ? decodeURIComponent(m[1]) : null;
};

export const isVideoSrc = (src: string) => {
  const hint = getMimeHint(src);
  return (
    hint?.startsWith("video/") ||
    /^data:video\//i.test(src) ||
    /\.(mp4|webm|ogg)(?:$|\?)/i.test(src)
  );
};

export const isAudioSrc = (src: string) => {
  const hint = getMimeHint(src);
  return (
    hint?.startsWith("audio/") ||
    /^data:audio\//i.test(src) ||
    /\.(mp3|wav|m4a|ogg)(?:$|\?)/i.test(src)
  );
};

export const isImageSrc = (src: string) => {
  const hint = getMimeHint(src);
  if (hint) return hint.startsWith("image/");
  return (
    /^data:image\//i.test(src) ||
    /\.(png|jpe?g|gif|webp|avif|svg)(?:$|\?)/i.test(src) ||
    /^blob:/i.test(src)
  );
};

export function normalizeImageUrl(src: string) {
  if (
    /^https?:\/\/(?:via\.)?placeholder\.com\//i.test(src) ||
    /^https?:\/\/placehold\.it\//i.test(src)
  ) {
    let out = src
      .replace(
        /^https?:\/\/(?:via\.)?placeholder\.com\//i,
        "https://placehold.co/"
      )
      .replace(/^https?:\/\/placehold\.it\//i, "https://placehold.co/");
    if (!/\.(png|jpe?g|gif|webp|svg|avif)(?:$|\?)/i.test(out)) out += ".png";
    return out;
  }

  const driveId =
    src.match(/drive\.google\.com\/file\/d\/([^/]+)/)?.[1] ||
    src.match(/[?&]id=([^&]+)/)?.[1];
  if (driveId)
    return `https://drive.google.com/uc?export=download&id=${driveId}`;

  if (/www\.dropbox\.com/i.test(src)) {
    return src
      .replace(/www\.dropbox\.com/i, "dl.dropboxusercontent.com")
      .replace("dl=0", "dl=1");
  }

  const gh = src.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
  if (gh) {
    const [, user, repo, branch, path] = gh;
    return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
  }

  return src;
}
