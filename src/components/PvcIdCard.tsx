"use client";

import React from "react";
import { QRCodeCanvas } from "qrcode.react";
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

function CardBackgroundImage() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/card-bg.jpg"
      alt=""
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
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
        backgroundColor: "#f8f7f2",
        color: "#0f172a",
        fontFamily: "Inter, Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <CardBackgroundImage />

      {/* Top-right Title */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "7px",
          padding: "16px 24px 0 24px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            backgroundColor: "#d49b27",
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.9px",
            color: "#064e2b",
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
          gap: "20px",
          padding: "36px 24px 16px 28px",
          height: "calc(100% - 36px)",
          boxSizing: "border-box",
        }}
      >
        {/* Left Column: Photo + ID Badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "9px",
            width: "104px",
            flexShrink: 0,
            marginTop: "6px",
          }}
        >
          <div
            style={{
              width: "98px",
              height: "114px",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              border: "2.5px solid #d49b27",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(6, 78, 43, 0.18)",
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
                  color: "#064e2b",
                }}
              >
                NO PHOTO
              </span>
            )}
          </div>

          <div
            style={{
              width: "100%",
              backgroundColor: "#064e2b",
              color: "#ffffff",
              border: "1.5px solid #d49b27",
              borderRadius: "6px",
              padding: "4px 6px",
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

        {/* Center/Right Column: Member Details + Seal & QR */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            paddingTop: "10px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "68px 10px 1fr",
              rowGap: "5px",
              fontSize: "10.8px",
              lineHeight: 1.35,
              color: "#0f172a",
            }}
          >
            <span style={{ fontWeight: 800, color: "#064e2b" }}>NAME</span>
            <span style={{ fontWeight: 800, color: "#064e2b" }}>:</span>
            <span style={{ fontWeight: 800, textTransform: "uppercase", color: "#0f172a" }}>
              {member.full_name}
            </span>

            <span style={{ fontWeight: 800, color: "#064e2b" }}>DOB</span>
            <span style={{ fontWeight: 800, color: "#064e2b" }}>:</span>
            <span style={{ fontWeight: 700 }}>{formatDobSlash(member.dob)}</span>

            <span style={{ fontWeight: 800, color: "#064e2b" }}>CONTACT</span>
            <span style={{ fontWeight: 800, color: "#064e2b" }}>:</span>
            <span style={{ fontWeight: 700 }}>{member.phone}</span>

            <span style={{ fontWeight: 800, color: "#064e2b" }}>ADDRESS</span>
            <span style={{ fontWeight: 800, color: "#064e2b" }}>:</span>
            <span
              style={{
                fontWeight: 600,
                fontSize: "9.8px",
                lineHeight: 1.35,
                wordBreak: "break-word",
                color: "#1e293b",
              }}
            >
              {fullAddress}
            </span>
          </div>

          {/* Bottom-right Seal + QR Code */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              gap: "10px",
              paddingBottom: "6px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/seal.png"
              alt="Hudaibiyya Official Seal"
              style={{
                width: "62px",
                height: "62px",
                objectFit: "contain",
              }}
            />

            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "4px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }}
            >
              <QRCodeCanvas
                value={verifyUrl}
                size={160}
                level="M"
                fgColor="#0f172a"
                bgColor="#ffffff"
                style={{ width: "62px", height: "62px", display: "block" }}
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
        backgroundColor: "#f8f7f2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "46px 24px 20px 24px",
        boxSizing: "border-box",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <CardBackgroundImage />

      {/* Title above center logo (broken at Charitable) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          fontSize: "15.5px",
          fontWeight: 800,
          lineHeight: 1.25,
          color: "#064e2b",
          letterSpacing: "0.3px",
        }}
      >
        <div>Hudaibiyya Islamic</div>
        <div>Charitable Trust</div>
      </div>

      {/* Centered Circular Trust Logo (/logo.png) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "112px",
          height: "112px",
          borderRadius: "9999px",
          backgroundColor: "#ffffff",
          border: "3.5px solid #d49b27",
          boxShadow: "0 6px 18px rgba(6, 78, 43, 0.22)",
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
          alt="Hudaibiyya Islamic Charitable Trust Logo"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Bottom notice text */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          fontSize: "9.5px",
          fontWeight: 700,
          color: "#064e2b",
          letterSpacing: "0.15px",
        }}
      >
        This identity card is required for all matters related to Hudaibiyya.
      </div>
    </div>
  );
}
