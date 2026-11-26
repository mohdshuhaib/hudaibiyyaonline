"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatPermanentAddress } from "@/lib/constants";
import type { Member } from "@/types/member";

interface PvcIdCardProps {
  member: Member;
  siteUrl: string;
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

/**
 * Shared CMYK-gamut-safe dark bronze & warm gold geometric background
 * matching the reference ATM/CR80 card design (514px x 324px = 85.6mm x 54mm).
 */
function CardBackgroundSvg({ withGoldWave = true }: { withGoldWave?: boolean }) {
  return (
    <svg
      viewBox="0 0 514 324"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
      }}
    >
      <defs>
        <linearGradient id="bronzeBase" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6e4110" />
          <stop offset="35%" stopColor="#2b1706" />
          <stop offset="75%" stopColor="#1c0f04" />
          <stop offset="100%" stopColor="#3d2209" />
        </linearGradient>
        <linearGradient id="goldArc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5c360e" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#1e1004" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="goldGlow" x1="0%" y1="100%" x2="80%" y2="20%">
          <stop offset="0%" stopColor="#9c6018" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#261405" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Base dark bronze-brown */}
      <rect width="514" height="324" fill="url(#bronzeBase)" />

      {/* Warm amber glow bottom-left */}
      <ellipse cx="70" cy="285" rx="180" ry="120" fill="url(#goldGlow)" />

      {/* Subtle geometric angular accents */}
      <path d="M0 165 L95 235 L95 324 L0 324 Z" fill="#47280a" opacity="0.45" />
      <path d="M115 220 L215 295 L215 324 L115 324 Z" fill="#211205" opacity="0.6" />

      {/* Right-side large curved dome/arc */}
      <path
        d="M325 324 C320 205 385 110 514 85 L514 324 Z"
        fill="url(#goldArc)"
      />

      {/* Top header dark band */}
      <path
        d="M0 0 L514 0 L514 55 C385 68 205 26 0 76 Z"
        fill="#190d03"
        opacity="0.92"
      />

      {/* Top-left subtle chevron arrows */}
      <g fill="#5e380e" opacity="0.45">
        <polygon points="35,0 60,0 84,26 60,52 35,52 59,26" />
        <polygon points="75,0 100,0 124,26 100,52 75,52 99,26" />
        <polygon points="115,0 140,0 164,26 140,52 115,52 139,26" />
        <polygon points="155,0 180,0 204,26 180,52 155,52 179,26" />
        <polygon points="195,0 220,0 244,26 220,52 195,52 219,26" />
        <polygon points="235,0 260,0 284,26 260,52 235,52 259,26" />
        <polygon points="275,0 300,0 324,26 300,52 275,52 299,26" />
        <polygon points="315,0 340,0 364,26 340,52 315,52 339,26" />
      </g>

      {/* Gold wave divider line */}
      {withGoldWave && (
        <path
          d="M0 78 C170 30 355 76 514 62"
          fill="none"
          stroke="#e09f24"
          strokeWidth="3.5"
        />
      )}
    </svg>
  );
}

/**
 * Landscape CR80 / ATM Card — Front (Data Side)
 * Size: 85.6mm x 54mm (514px x 324px)
 */
export function PvcIdCardFront({ member, siteUrl }: PvcIdCardProps) {
  const verifyUrl = `${siteUrl.replace(/\/$/, "")}/verify/${member.membership_id ?? ""}`;
  const fullAddress = formatPermanentAddress(member).toUpperCase();

  return (
    <div
      style={{
        width: "514px",
        height: "324px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "14px",
        backgroundColor: "#1c0f04",
        color: "#ffffff",
        fontFamily: "Inter, Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <CardBackgroundSvg withGoldWave={true} />

      {/* Top-right Title */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "7px",
          padding: "18px 26px 0 26px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            backgroundColor: "#e09f24",
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: "14.5px",
            fontWeight: 800,
            letterSpacing: "0.9px",
            color: "#ffffff",
            textTransform: "uppercase",
          }}
        >
          MEMBERSHIP CARD
        </span>
      </div>

      {/* Main Body */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "flex-start",
          gap: "22px",
          padding: "36px 26px 20px 30px",
          height: "calc(100% - 40px)",
          boxSizing: "border-box",
        }}
      >
        {/* Left Column: Photo + ID Badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            width: "106px",
            flexShrink: 0,
            marginTop: "6px",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "116px",
              borderRadius: "12px",
              backgroundColor: "#e8ad32",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {member.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photo_url}
                alt={member.full_name}
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#2b1706",
                }}
              >
                NO PHOTO
              </span>
            )}
          </div>

          <div
            style={{
              width: "100%",
              backgroundColor: "#e8ad32",
              color: "#1c0f04",
              borderRadius: "6px",
              padding: "5px 6px",
              textAlign: "center",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.4px",
              boxSizing: "border-box",
            }}
          >
            ID : {member.membership_id ?? "HUD-0000"}
          </div>
        </div>

        {/* Center/Right Column: Member Details + QR */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            paddingTop: "12px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "74px 10px 1fr",
              rowGap: "6px",
              fontSize: "11px",
              lineHeight: 1.35,
              color: "#ffffff",
            }}
          >
            <span style={{ fontWeight: 700, color: "#f8fafc" }}>NAME</span>
            <span style={{ fontWeight: 700 }}>:</span>
            <span style={{ fontWeight: 700, textTransform: "uppercase" }}>
              {member.full_name}
            </span>

            <span style={{ fontWeight: 700, color: "#f8fafc" }}>DOB</span>
            <span style={{ fontWeight: 700 }}>:</span>
            <span style={{ fontWeight: 600 }}>{formatDobSlash(member.dob)}</span>

            <span style={{ fontWeight: 700, color: "#f8fafc" }}>CONTACT</span>
            <span style={{ fontWeight: 700 }}>:</span>
            <span style={{ fontWeight: 600 }}>{member.phone}</span>

            <span style={{ fontWeight: 700, color: "#f8fafc" }}>ADDRESS</span>
            <span style={{ fontWeight: 700 }}>:</span>
            <span
              style={{
                fontWeight: 600,
                fontSize: "10.2px",
                lineHeight: 1.38,
                wordBreak: "break-word",
              }}
            >
              {fullAddress}
            </span>
          </div>

          {/* Bottom-right QR Box */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              paddingBottom: "8px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "5px",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
              }}
            >
              <QRCodeSVG
                value={verifyUrl}
                size={68}
                level="M"
                fgColor="#0f172a"
                bgColor="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Landscape CR80 / ATM Card — Back (Logo Side)
 * Size: 85.6mm x 54mm (514px x 324px)
 */
export function PvcIdCardBack() {
  return (
    <div
      style={{
        width: "514px",
        height: "324px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "14px",
        backgroundColor: "#1c0f04",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <CardBackgroundSvg withGoldWave={false} />

      {/* Centered Circular Trust Logo (/logo.png from public/) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "136px",
          height: "136px",
          borderRadius: "9999px",
          backgroundColor: "#ffffff",
          border: "4px solid #e09f24",
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px",
          boxSizing: "border-box",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Hudaibiyya Islamic Trust Logo"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}
