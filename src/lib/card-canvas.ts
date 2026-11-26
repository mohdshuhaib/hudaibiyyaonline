import { formatPermanentAddress } from "@/lib/constants";
import type { Member } from "@/types/member";

const W = 1011; // 85.6mm @ 300 DPI
const H = 638;  // 54mm @ 300 DPI
const S = W / 514; // Scale factor from 514x324 design coordinates

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function formatDobSlash(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCardBackground(
  ctx: CanvasRenderingContext2D,
  withGoldWave: boolean
) {
  // Base bronze gradient
  const baseGrad = ctx.createLinearGradient(0, H, W, 0);
  baseGrad.addColorStop(0, "#6e4110");
  baseGrad.addColorStop(0.35, "#2b1706");
  baseGrad.addColorStop(0.75, "#1c0f04");
  baseGrad.addColorStop(1, "#3d2209");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, W, H);

  // Warm amber glow bottom-left
  const glow = ctx.createRadialGradient(
    70 * S,
    285 * S,
    0,
    70 * S,
    285 * S,
    180 * S
  );
  glow.addColorStop(0, "rgba(156, 96, 24, 0.55)");
  glow.addColorStop(1, "rgba(38, 20, 5, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Geometric angular accents
  ctx.fillStyle = "rgba(71, 40, 10, 0.45)";
  ctx.beginPath();
  ctx.moveTo(0, 165 * S);
  ctx.lineTo(95 * S, 235 * S);
  ctx.lineTo(95 * S, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(33, 18, 5, 0.6)";
  ctx.beginPath();
  ctx.moveTo(115 * S, 220 * S);
  ctx.lineTo(215 * S, 295 * S);
  ctx.lineTo(215 * S, H);
  ctx.lineTo(115 * S, H);
  ctx.closePath();
  ctx.fill();

  // Right-side curved arc
  const arcGrad = ctx.createLinearGradient(325 * S, 85 * S, W, H);
  arcGrad.addColorStop(0, "rgba(92, 54, 14, 0.65)");
  arcGrad.addColorStop(1, "rgba(30, 16, 4, 0.85)");
  ctx.fillStyle = arcGrad;
  ctx.beginPath();
  ctx.moveTo(325 * S, H);
  ctx.bezierCurveTo(320 * S, 205 * S, 385 * S, 110 * S, W, 85 * S);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Top header dark band
  ctx.fillStyle = "rgba(25, 13, 3, 0.92)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, 55 * S);
  ctx.bezierCurveTo(385 * S, 68 * S, 205 * S, 26 * S, 0, 76 * S);
  ctx.closePath();
  ctx.fill();

  // Top-left chevrons
  ctx.fillStyle = "rgba(94, 56, 14, 0.45)";
  for (let i = 0; i < 8; i++) {
    const ox = (35 + i * 40) * S;
    ctx.beginPath();
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox + 25 * S, 0);
    ctx.lineTo(ox + 49 * S, 26 * S);
    ctx.lineTo(ox + 25 * S, 52 * S);
    ctx.lineTo(ox, 52 * S);
    ctx.lineTo(ox + 24 * S, 26 * S);
    ctx.closePath();
    ctx.fill();
  }

  // Gold wave divider
  if (withGoldWave) {
    ctx.strokeStyle = "#e09f24";
    ctx.lineWidth = 3.5 * S;
    ctx.beginPath();
    ctx.moveTo(0, 78 * S);
    ctx.bezierCurveTo(170 * S, 30 * S, 355 * S, 76 * S, W, 62 * S);
    ctx.stroke();
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let curY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = words[i];
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
  }
}

export async function renderCardFrontPng(
  member: Member,
  qrCanvas: HTMLCanvasElement | null
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas");

  drawCardBackground(ctx, true);

  // Top-right "■ MEMBERSHIP CARD"
  ctx.font = `800 ${14.5 * S}px Inter, Arial, sans-serif`;
  const titleText = "MEMBERSHIP CARD";
  const titleWidth = ctx.measureText(titleText).width;
  const rightEdge = W - 26 * S;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(titleText, rightEdge - titleWidth, 27 * S);

  ctx.fillStyle = "#e09f24";
  ctx.fillRect(rightEdge - titleWidth - 15 * S, 23 * S, 8 * S, 8 * S);

  // Left Column: Photo
  const photoX = 33 * S;
  const photoY = 98 * S;
  const photoW = 100 * S;
  const photoH = 116 * S;

  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 12 * S);
  ctx.fillStyle = "#e8ad32";
  ctx.fill();
  ctx.clip();

  if (member.photo_url) {
    try {
      const img = await loadImage(member.photo_url);
      const scale = Math.max(photoW / img.width, photoH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      ctx.drawImage(
        img,
        photoX + (photoW - drawW) / 2,
        photoY + (photoH - drawH) / 2,
        drawW,
        drawH
      );
    } catch {
      // Fallback if photo fails CORS/load
      ctx.fillStyle = "#2b1706";
      ctx.font = `700 ${10 * S}px Inter, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("NO PHOTO", photoX + photoW / 2, photoY + photoH / 2);
      ctx.textAlign = "left";
    }
  } else {
    ctx.fillStyle = "#2b1706";
    ctx.font = `700 ${10 * S}px Inter, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("NO PHOTO", photoX + photoW / 2, photoY + photoH / 2);
    ctx.textAlign = "left";
  }
  ctx.restore();

  // ID Pill Badge
  const pillX = 30 * S;
  const pillY = 224 * S;
  const pillW = 106 * S;
  const pillH = 26 * S;
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 6 * S);
  ctx.fillStyle = "#e8ad32";
  ctx.fill();

  ctx.fillStyle = "#1c0f04";
  ctx.font = `800 ${11 * S}px Inter, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `ID : ${member.membership_id ?? "HUD-0000"}`,
    pillX + pillW / 2,
    pillY + pillH / 2
  );
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Right Column: Details
  const labelX = 160 * S;
  const colonX = 232 * S;
  const valX = 244 * S;
  const maxValW = W - valX - 24 * S;
  let curY = 106 * S;
  const rowGap = 21 * S;

  const drawRow = (label: string, value: string, bold = false) => {
    ctx.fillStyle = "#f8fafc";
    ctx.font = `700 ${11 * S}px Inter, Arial, sans-serif`;
    ctx.fillText(label, labelX, curY);
    ctx.fillText(":", colonX, curY);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${bold ? 700 : 600} ${11 * S}px Inter, Arial, sans-serif`;
    ctx.fillText(value, valX, curY, maxValW);
    curY += rowGap;
  };

  drawRow("NAME", member.full_name.toUpperCase(), true);
  drawRow("DOB", formatDobSlash(member.dob));
  drawRow("CONTACT", member.phone);

  // Address (wrapped)
  ctx.fillStyle = "#f8fafc";
  ctx.font = `700 ${11 * S}px Inter, Arial, sans-serif`;
  ctx.fillText("ADDRESS", labelX, curY);
  ctx.fillText(":", colonX, curY);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${10.2 * S}px Inter, Arial, sans-serif`;
  wrapText(
    ctx,
    formatPermanentAddress(member).toUpperCase(),
    valX,
    curY,
    maxValW,
    14 * S
  );

  // Bottom-right QR Code
  if (qrCanvas) {
    const qrBoxSize = 78 * S;
    const qrBoxX = W - 26 * S - qrBoxSize;
    const qrBoxY = H - 22 * S - qrBoxSize;
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 4 * S);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    const pad = 5 * S;
    ctx.drawImage(
      qrCanvas,
      qrBoxX + pad,
      qrBoxY + pad,
      qrBoxSize - pad * 2,
      qrBoxSize - pad * 2
    );
  }

  return canvas.toDataURL("image/png", 1.0);
}

export async function renderCardBackPng(): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas");

  drawCardBackground(ctx, false);

  const cx = W / 2;
  const cy = H / 2;
  const radius = 68 * S;

  // White circle with gold border
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 4 * S;
  ctx.strokeStyle = "#e09f24";
  ctx.stroke();

  // Draw /logo.png inside circle
  try {
    const logo = await loadImage("/logo.png");
    const innerSize = (radius - 10 * S) * 2;
    const scale = Math.min(innerSize / logo.width, innerSize / logo.height);
    const drawW = logo.width * scale;
    const drawH = logo.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4 * S, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();
  } catch {
    // Ignore if logo fails to load
  }

  return canvas.toDataURL("image/png", 1.0);
}
