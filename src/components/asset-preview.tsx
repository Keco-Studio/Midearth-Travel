import { isPreviewableImageUrl } from "@/lib/inline-image-upload";

type AssetPreviewProps = {
  url: string;
  alt: string;
  variant?: "image" | "icon" | "qr";
};

export function AssetPreview({ url, alt, variant = "image" }: AssetPreviewProps) {
  if (!isPreviewableImageUrl(url)) {
    return null;
  }

  if (variant === "qr") {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: 12,
          background: "#f9f6ef",
          borderRadius: 8,
          border: "1px solid #efe9dd",
          width: "fit-content",
        }}
      >
        <img
          alt={alt}
          src={url}
          style={{
            width: 96,
            height: 96,
            objectFit: "contain",
            background: "#fff",
            display: "block",
          }}
        />
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: 56,
          height: 56,
          overflow: "hidden",
          borderRadius: 999,
          border: "1px solid #1f4d3f",
          background: "linear-gradient(145deg, #1f4d3f, #163530)",
        }}
      >
        <img
          alt={alt}
          src={url}
          style={{
            width: 28,
            height: 28,
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 280,
        aspectRatio: "4 / 3",
        overflow: "hidden",
        borderRadius: 8,
        border: "1px solid #efe9dd",
        background: "#f9f6ef",
      }}
    >
      <img
        alt={alt}
        src={url}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
