import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Icône carrée : « P » jaune sur noir, comme le logo de l'en-tête. */
export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ffbf00",
          fontSize: 380,
          fontWeight: 700,
          borderRadius: 96,
        }}
      >
        P
      </div>
    ),
    size,
  );
}
