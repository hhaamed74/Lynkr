// components/posts/MediaRenderer.tsx
import React from "react";
import {
  getYouTubeId,
  isVideoSrc,
  isAudioSrc,
  isImageSrc,
  normalizeImageUrl,
} from "../../utils/media";
import "../../styles/components/_posts.scss";

export const MediaRenderer: React.FC<{ src?: string }> = ({ src }) => {
  if (!src) return null;
  const url = src.trim();

  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}`}
        title="YouTube video"
        style={{
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: 12,
          marginTop: 8,
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (isVideoSrc(url)) {
    return (
      <video
        src={url}
        controls
        style={{
          width: "100%",
          borderRadius: 12,
          marginTop: 8,
          maxHeight: 400,
          objectFit: "cover",
        }}
      />
    );
  }

  if (isAudioSrc(url)) {
    return <audio src={url} controls style={{ width: "100%", marginTop: 8 }} />;
  }

  if (isImageSrc(url)) {
    return (
      <img
        src={normalizeImageUrl(url)}
        alt="Post media"
        style={{
          width: "100%",
          borderRadius: 12,
          marginTop: 8,
          maxHeight: 400,
          objectFit: "cover",
        }}
      />
    );
  }

  return null;
};
