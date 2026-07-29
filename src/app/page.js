"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { useSelector } from "react-redux";
import ClosingCom from "@/components/screen/home/ClosingCom";
import AddMember from "@/components/screen/programs/members/AddMember";
import AgentManagement from "@/components/screen/agents/EditAgents";
import AddPaymentModal from "@/components/common/addPayment/AddPaymentModal";
import { getData } from "@/lib/services/firebaseService";
import { App, Select, Input, Button, Badge, Modal, Tooltip, Drawer, Empty } from "antd";
import { 
  PlusOutlined, UserAddOutlined, DollarOutlined, 
  SearchOutlined, BellOutlined, FileTextOutlined,
  TeamOutlined, CheckCircleOutlined, ClockCircleOutlined,
  LineChartOutlined, BarChartOutlined, PieChartOutlined,
  FilterOutlined, DownloadOutlined, FilePdfOutlined, FileExcelOutlined,
  ArrowUpOutlined
} from "@ant-design/icons";

const { Option } = Select;

export default function DashboardPage() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const programList = useSelector((state) => state.data.programList || []);
  const selectedProgram = useSelector((state) => state.data.selectedProgram);
  const agentList = useSelector((state) => state.data.agentsList || []);

  const [closingCount, setClosingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Modal / Drawer state controls
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchClosingCount = async () => {
    if (!user || !selectedProgram) return;
    setIsLoading(true);
    try {
      const data = await getData(
        `/users/${user.uid}/programs/${selectedProgram?.id}/members`,
        [
          { field: 'active_flag', operator: '==', value: true },
          { field: 'delete_flag', operator: '==', value: false },
          { field: 'marriage_flag', operator: '==', value: true },
          { field: 'status', operator: 'in', value: ['closed', 'accepted'] }
        ]
      );
      setClosingCount(data?.length || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProgram) fetchClosingCount();
  }, [selectedProgram]);

  const activeMemberCount = selectedProgram?.memberCount || 0;
  const inactiveMemberCount = selectedProgram?.inactivemembercount || 0;
  const totalMembers = activeMemberCount + inactiveMemberCount;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .dash-container {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f8fafc;
          min-height: 100vh;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Top Bar Navigation */
        .dash-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          background: #ffffff;
          padding: 14px 24px;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 10px 15px -3px rgba(0,0,0,0.02);
          border: 1px solid #f1f5f9;
        }
        .dash-breadcrumb {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .dash-breadcrumb span {
          color: #0f172a;
          font-weight: 700;
        }
        .dash-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* Header Buttons */
        .btn-action-payment {
          background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
          color: #ffffff !important;
          border: none !important;
          font-weight: 600 !important;
          border-radius: 10px !important;
          height: 38px !important;
          padding: 0 18px !important;
          box-shadow: 0 4px 12px rgba(37,99,235,0.25) !important;
        }
        .btn-action-agent {
          background: linear-gradient(135deg, #d97706, #b45309) !important;
          color: #ffffff !important;
          border: none !important;
          font-weight: 600 !important;
          border-radius: 10px !important;
          height: 38px !important;
          padding: 0 18px !important;
          box-shadow: 0 4px 12px rgba(217,119,6,0.25) !important;
        }
        .btn-action-member {
          background: linear-gradient(135deg, #10b981, #059669) !important;
          color: #ffffff !important;
          border: none !important;
          font-weight: 600 !important;
          border-radius: 10px !important;
          height: 38px !important;
          padding: 0 18px !important;
          box-shadow: 0 4px 12px rgba(16,185,129,0.25) !important;
        }
        .btn-action-requests {
          background: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          font-weight: 600 !important;
          border-radius: 10px !important;
          height: 38px !important;
          padding: 0 18px !important;
        }

        /* Stat Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }

        .stat-box {
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .stat-box-title {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }
        .stat-box-num {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 8px 0;
          letter-spacing: -0.03em;
        }
        .stat-box-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          background: #dcfce7;
          color: #15803d;
        }
        .stat-progress-bar {
          height: 4px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 10px;
        }
        .stat-progress-fill {
          height: 100%;
          border-radius: 4px;
        }

        /* Analytics Section */
        .analytics-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
        }
        @media (max-width: 1024px) { .analytics-grid { grid-template-columns: 1fr; } }

        .chart-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .chart-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
        }

        /* SVG Graph Mock Visual */
        .svg-graph-container {
          width: 100%;
          height: 180px;
        }

        /* Donut Ring Visual */
        .donut-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 140px;
          position: relative;
        }
        .donut-center {
          position: absolute;
          text-align: center;
          font-weight: 800;
          font-size: 16px;
          color: #0f172a;
        }

        /* Activity List */
        .act-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px dashed #f1f5f9;
          font-size: 12px;
        }
        .act-item:last-child { border-bottom: none; }
      `}</style>

      <div className="dash-container">

        {/* Top Metric Stat Cards */}
        <div className="stats-grid">
          {/* Card 1: Total Members */}
          <div className="stat-box">
            <div>
              <div className="flex justify-between items-center">
                <span className="stat-box-title">Total Members</span>
                <span className="stat-box-badge"><ArrowUpOutlined /> {totalMembers > 0 ? "100%" : "0%"}</span>
              </div>
              <div className="stat-box-num">{totalMembers}</div>
            </div>
            <div className="stat-progress-bar">
              <div className="stat-progress-fill" style={{ width: totalMembers > 0 ? "100%" : "0%", background: "#2563eb" }} />
            </div>
          </div>

          {/* Card 2: Closing Members */}
          <div className="stat-box">
            <div>
              <div className="flex justify-between items-center">
                <span className="stat-box-title">Closing Members</span>
                <Badge count={closingCount} overflowCount={999} style={{ backgroundColor: '#10b981' }} />
              </div>
              <div className="stat-box-num">{closingCount}</div>
            </div>
            <div className="stat-progress-bar">
              <div className="stat-progress-fill" style={{ width: closingCount > 0 ? "100%" : "0%", background: "#10b981" }} />
            </div>
          </div>

          {/* Card 3: Total Agents */}
          <div className="stat-box">
            <div>
              <div className="flex justify-between items-center">
                <span className="stat-box-title">Total Agents</span>
                <span className="text-xs text-emerald-600 font-semibold">Active</span>
              </div>
              <div className="stat-box-num">{agentList?.length || 0}</div>
            </div>
            <div className="stat-progress-bar">
              <div className="stat-progress-fill" style={{ width: (agentList?.length || 0) > 0 ? "100%" : "0%", background: "#d97706" }} />
            </div>
          </div>

          {/* Card 4: Pending Payments */}
          <div className="stat-box">
            <div>
              <div className="flex justify-between items-center">
                <span className="stat-box-title">Pending Payments</span>
                <span className="text-xs text-slate-500 font-bold">Total</span>
              </div>
              <div className="stat-box-num">₹{selectedProgram?.pendingAmount || 0}</div>
            </div>
            <div className="stat-progress-bar">
              <div className="stat-progress-fill" style={{ width: "0%", background: "#ef4444" }} />
            </div>
          </div>
        </div>

        {/* Analytics Graphs & Distribution Section */}
        <div className="analytics-grid">
          {/* Revenue & Growth Trend */}
          <div className="chart-card">
            <div className="flex justify-between items-center mb-2">
              <span className="chart-title">Monthly Revenue & Growth Graph</span>
              <Badge status="processing" text="Live Updates" />
            </div>
            <div className="svg-graph-container flex items-center justify-center">
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description={<span className="text-slate-400 font-medium">No revenue data available yet</span>} 
              />
            </div>
          </div>

          {/* Distribution & Active Members Ring */}
          <div className="chart-card flex flex-col justify-between">
            <span className="chart-title">Active & Inactive Members</span>
            <div className="donut-wrap">
              <svg viewBox="0 0 36 36" className="w-28 h-28 transform -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3.8" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#2563eb" strokeWidth="3.8" strokeDasharray={`${totalMembers > 0 ? (activeMemberCount / totalMembers) * 100 : 0}, 100`} />
              </svg>
              <div className="donut-center">
                <div>{totalMembers}</div>
                <div className="text-xs font-medium text-slate-400">Members</div>
              </div>
            </div>
            <div className="flex justify-around text-xs text-slate-600 font-semibold mt-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block"/> Active: {activeMemberCount}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block"/> Inactive: {inactiveMemberCount}</span>
            </div>
          </div>
        </div>

        {/* Main Member Table Component (ClosingCom) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <ClosingCom
            selectedProgram={selectedProgram}
            user={user}
            closingCount={closingCount}
            isLoading={isLoading}
            onRefresh={fetchClosingCount}
          />
        </div>
      </div>

      {/* Modals & Drawers */}
      <AddMember
        open={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
      />

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
          onSuccess={() => {
            message.success("Agent added successfully!");
            setIsAddAgentOpen(false);
          }}
        />
      </Drawer>

      <AddPaymentModal
        open={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        onSuccess={() => {
          message.success("Payment recorded successfully!");
          setIsAddPaymentOpen(false);
          fetchClosingCount();
        }}
      />

      <Modal
        title="Pending Requests Overview"
        open={isRequestsOpen}
        onCancel={() => setIsRequestsOpen(false)}
        footer={null}
      >
        <div className="p-4 text-center text-slate-500">
          No pending approvals or administrative requests at this moment.
        </div>
      </Modal>
    </>
  );
}