"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { useSelector } from "react-redux";
import ClosingCom from "@/components/screen/home/ClosingCom";
import AddMember from "@/components/screen/programs/members/AddMember";
import AgentManagement from "@/components/screen/agents/EditAgents";
import AddPaymentModal from "@/components/common/addPayment/AddPaymentModal";
import { getData } from "@/lib/services/firebaseService";
import { App, Select, Input, Button, Badge, Modal, Drawer } from "antd";
import {
  PlusOutlined, UserAddOutlined, DollarOutlined,
  SearchOutlined, BellOutlined, MessageOutlined,
  TeamOutlined, RiseOutlined, FallOutlined,
  ArrowUpOutlined
} from "@ant-design/icons";

const { Option } = Select;

// ── Tiny SVG line chart (sparkline) ──────────────────────────────────────────
function SparkLine({ color = "#3b82f6", fill = "rgba(59,130,246,0.12)", data = [] }) {
  if (!data.length) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: "#94a3b8", fontSize: 13 }}>
      Data will appear when records are added
    </div>
  );
  const max = Math.max(...data.map(d => d.v), 1);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 460;
    const y = 140 - (d.v / max) * 120;
    return `${x},${y}`;
  });
  const fillPts = `0,140 ${pts.join(" ")} 460,140`;
  return (
    <svg viewBox="0 0 460 160" style={{ width: "100%", height: 160 }} preserveAspectRatio="none">
      <polygon points={fillPts} fill={fill} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * 460;
        const y = 140 - (d.v / max) * 120;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill={color} />
            <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#64748b">{d.v > 1000 ? `₹${(d.v / 1000).toFixed(1)}k` : d.v > 0 ? d.v : ""}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * 460;
        return <text key={"l" + i} x={x} y={155} textAnchor="middle" fontSize="9" fill="#94a3b8">{d.l}</text>;
      })}
    </svg>
  );
}

// ── Tiny bar chart ────────────────────────────────────────────────────────────
function BarGraph({ color = "#3b82f6", data = [] }) {
  if (!data.length) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: "#94a3b8", fontSize: 13 }}>
      Data will appear when records are added
    </div>
  );
  const max = Math.max(...data.map(d => d.v), 1);
  const barW = 460 / data.length;
  return (
    <svg viewBox="0 0 460 160" style={{ width: "100%", height: 160 }}>
      {data.map((d, i) => {
        const h = (d.v / max) * 130;
        const x = i * barW + barW * 0.15;
        const w = barW * 0.7;
        return (
          <g key={i}>
            <rect x={x} y={140 - h} width={w} height={h} rx="3" fill={color} opacity="0.85" />
            <text x={x + w / 2} y={155} textAnchor="middle" fontSize="9" fill="#94a3b8">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments = [], size = 110, stroke = 18, centerText = "", centerSub = "" }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset = 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {total === 0
          ? <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          : segments.map((seg, i) => {
              const dash = (seg.value / total) * circ;
              const el = (
                <circle key={i} cx={size / 2} cy={size / 2} r={r}
                  fill="none" stroke={seg.color} strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circ}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return el;
            })
        }
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{centerText}</span>
        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{centerSub}</span>
      </div>
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const programList = useSelector((state) => state.data.programList || []);
  const selectedProgram = useSelector((state) => state.data.selectedProgram);
  const agentList = useSelector((state) => state.data.agentsList || []);

  const [closingCount, setClosingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentActivities, setRecentActivities] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [monthlyMembers, setMonthlyMembers] = useState([]);
  const [monthlyCollection, setMonthlyCollection] = useState(0);

  // Modal / Drawer controls
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);

  const fetchClosingCount = useCallback(async () => {
    if (!user || !selectedProgram) return;
    setIsLoading(true);
    try {
      const data = await getData(
        `/users/${user.uid}/programs/${selectedProgram?.id}/members`,
        [
          { field: "active_flag", operator: "==", value: true },
          { field: "delete_flag", operator: "==", value: false },
          { field: "marriage_flag", operator: "==", value: true },
          { field: "status", operator: "in", value: ["closed", "accepted"] }
        ]
      );
      setClosingCount(data?.length || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedProgram]);

  // Fetch recent payment activities
  const fetchActivities = useCallback(async () => {
    if (!user || !selectedProgram) return;
    try {
      const payments = await getData(
        `/users/${user.uid}/programs/${selectedProgram?.id}/payments`,
        [{ field: "delete_flag", operator: "==", value: false }]
      );
      if (payments?.length) {
        const sorted = [...payments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRecentActivities(sorted.slice(0, 5).map(p => ({
          label: `Payment — ${p.memberName || "Member"}`,
          amount: p.amount ? `₹${p.amount}` : "",
          time: p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "—"
        })));

        // Monthly revenue from payments
        const revByMonth = Array(12).fill(0);
        payments.forEach(p => {
          if (p.createdAt && p.amount) {
            const m = new Date(p.createdAt).getMonth();
            revByMonth[m] += Number(p.amount) || 0;
          }
        });
        setMonthlyRevenue(MONTHS.map((l, i) => ({ l, v: revByMonth[i] })));

        // Monthly collection = current month total
        const currMonth = new Date().getMonth();
        setMonthlyCollection(revByMonth[currMonth]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user, selectedProgram]);

  // Fetch member join-month distribution
  const fetchMemberGrowth = useCallback(async () => {
    if (!user || !selectedProgram) return;
    try {
      const members = await getData(
        `/users/${user.uid}/programs/${selectedProgram?.id}/members`,
        [{ field: "delete_flag", operator: "==", value: false }]
      );
      if (members?.length) {
        const byMonth = Array(12).fill(0);
        members.forEach(m => {
          const d = m.join_date || m.createdAt;
          if (d) byMonth[new Date(d).getMonth()]++;
        });
        setMonthlyMembers(MONTHS.map((l, i) => ({ l, v: byMonth[i] })));
      }
    } catch (e) {
      console.error(e);
    }
  }, [user, selectedProgram]);

  useEffect(() => {
    if (selectedProgram) {
      fetchClosingCount();
      fetchActivities();
      fetchMemberGrowth();
    }
  }, [selectedProgram]);

  const activeMemberCount = selectedProgram?.memberCount || 0;
  const inactiveMemberCount = selectedProgram?.inactivemembercount || 0;
  const totalMembers = activeMemberCount + inactiveMemberCount;
  const pendingAmt = selectedProgram?.pendingAmount || 0;
  const collectedAmt = selectedProgram?.collectedAmount || monthlyCollection;

  // Format currency
  const fmtAmt = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .db-wrap { font-family: 'Plus Jakarta Sans', sans-serif; background: #f4f6fb; min-height: 100vh; padding: 20px; display: flex; flex-direction: column; gap: 18px; }
        
        /* ── Header (removed — app layout provides the top header) ── */

        /* ── Dashboard Title + Actions ── */
        .db-title-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .db-title { font-size: 22px; font-weight: 800; color: #1e293b; }
        .db-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .dba-btn { display: inline-flex; align-items: center; gap: 6px; padding: 0 18px; height: 38px; border-radius: 9px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; transition: opacity 0.18s, transform 0.1s; }
        .dba-btn:hover { opacity: 0.88; }
        .dba-btn:active { transform: scale(0.98); }
        .dba-payment { background: #2563eb; color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.22); }
        .dba-agent   { background: #d97706; color: #fff; box-shadow: 0 4px 12px rgba(217,119,6,0.22); }
        .dba-member  { background: #059669; color: #fff; box-shadow: 0 4px 12px rgba(5,150,105,0.22); }
        .dba-req     { background: #fff; color: #1e293b; border: 1.5px solid #dde3ef !important; }

        /* ── Stat Cards ── */
        .db-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1100px) { .db-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .db-stats { grid-template-columns: 1fr; } }
        .db-stat { background: #fff; border-radius: 14px; padding: 20px; border: 1px solid #e8ecf1; box-shadow: 0 1px 4px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 12px; }
        .db-stat-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .db-stat-label { font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
        .db-stat-val { font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: -0.03em; line-height: 1; }
        .db-stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .db-stat-badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .db-stat-bar { height: 5px; background: #f1f5f9; border-radius: 5px; overflow: hidden; }
        .db-stat-fill { height: 100%; border-radius: 5px; transition: width 0.6s ease; }

        /* ── Charts 2-col ── */
        .db-charts2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 900px) { .db-charts2 { grid-template-columns: 1fr; } }
        .db-card { background: #fff; border-radius: 14px; padding: 20px; border: 1px solid #e8ecf1; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .db-card-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
        .db-chart-empty { height: 160px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; font-weight: 500; border: 1.5px dashed #e2e8f0; border-radius: 10px; }

        /* ── Bottom row 4-col ── */
        .db-bottom4 { display: grid; grid-template-columns: 1fr 1fr 1.4fr 1fr; gap: 16px; }
        @media (max-width: 1100px) { .db-bottom4 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .db-bottom4 { grid-template-columns: 1fr; } }

        /* ── Activity list ── */
        .db-act-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #f1f5f9; font-size: 12px; color: #334155; }
        .db-act-item:last-child { border-bottom: none; }
        .db-act-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* ── Member Table wrapper ── */
        .db-table-card { background: #fff; border-radius: 14px; border: 1px solid #e8ecf1; box-shadow: 0 1px 4px rgba(0,0,0,0.04); overflow: hidden; }
        .db-table-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; gap: 12px; }
        .db-table-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .db-tbl-btn { display: inline-flex; align-items: center; gap: 5px; padding: 0 14px; height: 34px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid #dde3ef; background: #fff; color: #374151; transition: all 0.18s; }
        .db-tbl-btn:hover { background: #f8fafc; }
        .db-filter-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      `}</style>

      <div className="db-wrap">




        {/* ── Dashboard Title ── */}
        <div className="db-title">Dashboard</div>


        {/* ── Stat Cards Row ── */}
        <div className="db-stats">
          {/* Total Members */}
          <div className="db-stat">
            <div className="db-stat-top">
              <div>
                <div className="db-stat-label">Total Members</div>
                <div className="db-stat-val">{totalMembers}</div>
              </div>
              <div className="db-stat-icon" style={{ background: "#eff6ff" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            {totalMembers > 0 && (
              <span className="db-stat-badge" style={{ background: "#dcfce7", color: "#15803d" }}>
                <ArrowUpOutlined /> Active
              </span>
            )}
            <div className="db-stat-bar"><div className="db-stat-fill" style={{ width: totalMembers > 0 ? "100%" : "0%", background: "#2563eb" }} /></div>
          </div>

          {/* Closing Members */}
          <div className="db-stat">
            <div className="db-stat-top">
              <div>
                <div className="db-stat-label">Closing Members</div>
                <div className="db-stat-val">{closingCount}</div>
              </div>
              <div className="db-stat-icon" style={{ background: "#f0fdf4" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div className="db-stat-bar"><div className="db-stat-fill" style={{ width: closingCount > 0 ? "100%" : "0%", background: "#059669" }} /></div>
          </div>

          {/* Total Agents */}
          <div className="db-stat">
            <div className="db-stat-top">
              <div>
                <div className="db-stat-label">Total Agents</div>
                <div className="db-stat-val">{agentList?.length || 0}</div>
              </div>
              <div className="db-stat-icon" style={{ background: "#fff7ed" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            </div>
            {(agentList?.length || 0) > 0 && (
              <span className="db-stat-badge" style={{ background: "#fef3c7", color: "#92400e", fontSize: 11 }}>
                active/inactive
              </span>
            )}
            <div className="db-stat-bar"><div className="db-stat-fill" style={{ width: (agentList?.length || 0) > 0 ? "70%" : "0%", background: "#d97706" }} /></div>
          </div>

          {/* Pending Payments */}
          <div className="db-stat">
            <div className="db-stat-top">
              <div>
                <div className="db-stat-label">Pending Payments</div>
                <div className="db-stat-val">{pendingAmt >= 1000 ? `₹${(pendingAmt / 1000).toFixed(1)}k` : `₹${pendingAmt}`}</div>
              </div>
              <div className="db-stat-icon" style={{ background: "#fef2f2" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div className="db-stat-bar"><div className="db-stat-fill" style={{ width: pendingAmt > 0 ? "60%" : "0%", background: "#ef4444" }} /></div>
          </div>
        </div>

        {/* ── Charts: Monthly Revenue | Member Growth ── */}
        <div className="db-charts2">
          <div className="db-card">
            <div className="db-card-title">Monthly Revenue Graph</div>
            {monthlyRevenue.length > 0
              ? <SparkLine data={monthlyRevenue} color="#2563eb" fill="rgba(37,99,235,0.08)" />
              : <div className="db-chart-empty">Revenue data will appear when payments are recorded</div>
            }
          </div>
          <div className="db-card">
            <div className="db-card-title">Member Growth Graph</div>
            {monthlyMembers.length > 0
              ? <BarGraph data={monthlyMembers} color="#2563eb" />
              : <div className="db-chart-empty">Growth data will appear when members are added</div>
            }
          </div>
        </div>

        {/* ── Bottom Row: Active/Inactive | Monthly Collection | Recent Activities | Payment Overview ── */}
        <div className="db-bottom4">
          {/* Active & Inactive Members Donut */}
          <div className="db-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="db-card-title">Active & Inactive Members</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DonutChart
                segments={totalMembers > 0 ? [
                  { value: activeMemberCount, color: "#2563eb" },
                  { value: inactiveMemberCount, color: "#e2e8f0" }
                ] : []}
                centerText={totalMembers > 0 ? `${Math.round((activeMemberCount / totalMembers) * 100)}%` : "—"}
                centerSub="Active"
                size={110}
                stroke={18}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", fontSize: 11, fontWeight: 600, color: "#475569" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
                Active: {activeMemberCount}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e2e8f0", display: "inline-block" }} />
                Inactive: {inactiveMemberCount}
              </span>
            </div>
          </div>

          {/* Monthly Collection */}
          <div className="db-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="db-card-title">Monthly Collection:</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.03em" }}>
              {collectedAmt >= 1000 ? `₹${(collectedAmt / 1000).toFixed(1)}k` : `₹${collectedAmt}`}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              {new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}
            </div>
            <div style={{ height: 5, background: "#f1f5f9", borderRadius: 5, overflow: "hidden", marginTop: 8 }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #2563eb, #059669)", borderRadius: 5, width: collectedAmt > 0 ? "70%" : "0%", transition: "width 0.6s" }} />
            </div>
          </div>

          {/* Recent Activities */}
          <div className="db-card">
            <div className="db-card-title">Recent Activities</div>
            {recentActivities.length > 0 ? (
              <div>
                {recentActivities.map((a, i) => (
                  <div key={i} className="db-act-item">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="db-act-dot" style={{ background: i % 2 === 0 ? "#2563eb" : "#059669" }} />
                      <span>{a.label}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      {a.amount && <span style={{ fontWeight: 700, color: "#059669", fontSize: 11 }}>{a.amount}</span>}
                      <span style={{ color: "#94a3b8", fontSize: 10 }}>{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", paddingTop: 20 }}>
                Recent activities will appear here
              </div>
            )}
          </div>

          {/* Payment Overview Donut */}
          <div className="db-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="db-card-title">Payment Overview</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DonutChart
                segments={pendingAmt > 0 || collectedAmt > 0 ? [
                  { value: collectedAmt, color: "#2563eb" },
                  { value: pendingAmt, color: "#fbbf24" },
                ] : []}
                centerText={pendingAmt + collectedAmt > 0 ? fmtAmt(collectedAmt + pendingAmt) : "—"}
                centerSub="Total"
                size={110}
                stroke={18}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", fontSize: 11, fontWeight: 600, color: "#475569" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
                Collected
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
                Pending
              </span>
            </div>
          </div>
        </div>

        {/* ── Member Table ── */}
        <div className="db-table-card">
          <div className="db-table-header">
            <div className="db-filter-row">
              <button className="db-tbl-btn">⚙ Filter</button>
              <Input
                prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 12 }} />}
                placeholder="Search"
                style={{ width: 180, borderRadius: 8, fontSize: 12 }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="db-table-actions">
              <button className="db-tbl-btn">📋 Join Fees List</button>
              <button className="db-tbl-btn">📥 Download Certificates</button>
              <button className="db-tbl-btn">📄 Export PDF</button>
              <button className="db-tbl-btn">📊 Export Excel</button>
            </div>
          </div>
          <div style={{ padding: "0 4px 4px" }}>
            <ClosingCom
              selectedProgram={selectedProgram}
              user={user}
              closingCount={closingCount}
              isLoading={isLoading}
              onRefresh={fetchClosingCount}
            />
          </div>
        </div>

      </div>

      {/* ── Modals & Drawers ── */}
      <AddMember open={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} />

      <Drawer
        title="Agent Management"
        width={720}
        open={isAddAgentOpen}
        onClose={() => setIsAddAgentOpen(false)}
        destroyOnHidden
      >
        <AgentManagement
          mode="add"
          isAgentDrawerVisible={isAddAgentOpen}
          setIsAgentDrawerVisible={setIsAddAgentOpen}
          onSuccess={() => { message.success("Agent added successfully!"); setIsAddAgentOpen(false); }}
        />
      </Drawer>

      <AddPaymentModal
        open={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        onSuccess={() => { message.success("Payment recorded successfully!"); setIsAddPaymentOpen(false); fetchClosingCount(); }}
      />

      <Modal
        title="Pending Requests Overview"
        open={isRequestsOpen}
        onCancel={() => setIsRequestsOpen(false)}
        footer={null}
      >
        <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
          No pending approvals or administrative requests at this moment.
        </div>
      </Modal>
    </>
  );
}