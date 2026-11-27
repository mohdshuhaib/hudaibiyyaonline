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

async function drawCardBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f8f7f2";
  ctx.fillRect(0, 0, W, H);
  try {
    const bg = await loadImage("/card-bg.jpg");
    const scale = Math.max(W / bg.width, H / bg.height);
    const drawW = bg.width * scale;
    const drawH = bg.height * scale;
    ctx.drawImage(bg, (W - drawW) / 2, (H - drawH) / 2, drawW, drawH);
  } catch {
    // Fallback to light cream if background fails
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

  await drawCardBackground(ctx);

  // Top-right "■ MEMBERSHIP CARD"
  ctx.font = `800 ${14 * S}px Inter, Arial, sans-serif`;
  const titleText = "MEMBERSHIP CARD";
  const titleWidth = ctx.measureText(titleText).width;
  const rightEdge = W - 24 * S;
  ctx.fillStyle = "#064e2b";
  ctx.textBaseline = "middle";
  ctx.fillText(titleText, rightEdge - titleWidth, 25 * S);

  ctx.fillStyle = "#d49b27";
  ctx.fillRect(rightEdge - titleWidth - 15 * S, 21 * S, 8 * S, 8 * S);

  // Left Column: Photo
  const photoX = 31 * S;
  const photoY = 92 * S;
  const photoW = 98 * S;
  const photoH = 114 * S;

  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 12 * S);
  ctx.fillStyle = "#ffffff";
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
      ctx.fillStyle = "#064e2b";
      ctx.font = `700 ${10 * S}px Inter, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("NO PHOTO", photoX + photoW / 2, photoY + photoH / 2);
      ctx.textAlign = "left";
    }
  } else {
    ctx.fillStyle = "#064e2b";
    ctx.font = `700 ${10 * S}px Inter, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("NO PHOTO", photoX + photoW / 2, photoY + photoH / 2);
    ctx.textAlign = "left";
  }
  ctx.restore();

  // Photo gold border
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, 12 * S);
  ctx.lineWidth = 2.5 * S;
  ctx.strokeStyle = "#d49b27";
  ctx.stroke();

  // ID Pill Badge
  const pillX = 28 * S;
  const pillY = 216 * S;
  const pillW = 104 * S;
  const pillH = 25 * S;
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 6 * S);
  ctx.fillStyle = "#064e2b";
  ctx.fill();
  ctx.lineWidth = 1.5 * S;
  ctx.strokeStyle = "#d49b27";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
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
  const labelX = 152 * S;
  const colonX = 220 * S;
  const valX = 232 * S;
  const maxValW = W - valX - 24 * S;
  let curY = 98 * S;
  const rowGap = 20 * S;

  const drawRow = (label: string, value: string, bold = false) => {
    ctx.fillStyle = "#064e2b";
    ctx.font = `800 ${10.8 * S}px Inter, Arial, sans-serif`;
    ctx.fillText(label, labelX, curY);
    ctx.fillText(":", colonX, curY);
    ctx.fillStyle = "#0f172a";
    ctx.font = `${bold ? 800 : 700} ${10.8 * S}px Inter, Arial, sans-serif`;
    ctx.fillText(value, valX, curY, maxValW);
    curY += rowGap;
  };

  drawRow("NAME", member.full_name.toUpperCase(), true);
  drawRow("DOB", formatDobSlash(member.dob));
  drawRow("CONTACT", member.phone);

  // Address (wrapped)
  ctx.fillStyle = "#064e2b";
  ctx.font = `800 ${10.8 * S}px Inter, Arial, sans-serif`;
  ctx.fillText("ADDRESS", labelX, curY);
  ctx.fillText(":", colonX, curY);
  ctx.fillStyle = "#1e293b";
  ctx.font = `600 ${9.8 * S}px Inter, Arial, sans-serif`;
  wrapText(
    ctx,
    formatPermanentAddress(member).toUpperCase(),
    valX,
    curY,
    maxValW,
    13.5 * S
  );

  // Bottom-right Seal + QR Code
  const qrBoxSize = 70 * S;
  const qrBoxX = W - 24 * S - qrBoxSize;
  const qrBoxY = H - 22 * S - qrBoxSize;

  // Draw seal.png left of QR code
  try {
    const seal = await loadImage("/seal.png");
    const sealSize = 62 * S;
    const sealX = qrBoxX - 10 * S - sealSize;
    const sealY = H - 22 * S - sealSize;
    const scale = Math.min(sealSize / seal.width, sealSize / seal.height);
    const drawW = seal.width * scale;
    const drawH = seal.height * scale;
    ctx.drawImage(
      seal,
      sealX + (sealSize - drawW) / 2,
      sealY + (sealSize - drawH) / 2,
      drawW,
      drawH
    );
  } catch {
    // Ignore if seal fails
  }

  if (qrCanvas) {
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 6 * S);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 1 * S;
    ctx.strokeStyle = "#cbd5e1";
    ctx.stroke();
    const pad = 4 * S;
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

  await drawCardBackground(ctx);

  const cx = W / 2;

  // Above center logo: Hudaibiyya Islamic / Charitable Trust
  ctx.fillStyle = "#064e2b";
  ctx.font = `800 ${15.5 * S}px Inter, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Hudaibiyya Islamic", cx, 60 * S);
  ctx.fillText("Charitable Trust", cx, 80 * S);

  // Center Circular Trust Logo (/logo.png)
  const cy = 172 * S;
  const radius = 56 * S;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 3.5 * S;
  ctx.strokeStyle = "#d49b27";
  ctx.stroke();

  try {
    const logo = await loadImage("/logo.png");
    const innerSize = (radius - 8 * S) * 2;
    const scale = Math.min(innerSize / logo.width, innerSize / logo.height);
    const drawW = logo.width * scale;
    const drawH = logo.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 3 * S, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();
  } catch {
    // Ignore if logo fails to load
  }

  // Bottom notice text
  ctx.fillStyle = "#064e2b";
  ctx.font = `700 ${9.5 * S}px Inter, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(
    "This identity card is required for all matters related to Hudaibiyya.",
    cx,
    H - 28 * S
  );

  return canvas.toDataURL("image/png", 1.0);
}
