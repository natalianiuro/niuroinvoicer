import { createContext, useContext, useReducer, useEffect } from "react";
import {
  contractors as initContractors,
  reimbursements as initReimbursements,
  invoices as initInvoices,
  teamMembers as initTeam,
  equipment as initEquipment,
} from "./data/mock";

// ─── Seed compliance history (2026 so far) ───────────────────
const initCompliancePayments = [
  { id: "c1", type: "previred", year: 2026, month: 1, amount: 480000, paidDate: "2026-01-13", notes: "" },
  { id: "c2", type: "f29",      year: 2026, month: 1, amount: 320000, paidDate: "2026-01-20", notes: "" },
  { id: "c3", type: "previred", year: 2026, month: 2, amount: 495000, paidDate: "2026-02-13", notes: "" },
  { id: "c4", type: "f29",      year: 2026, month: 2, amount: 310000, paidDate: "2026-02-20", notes: "" },
  { id: "c5", type: "previred", year: 2026, month: 3, amount: 510000, paidDate: "2026-03-13", notes: "" },
  { id: "c6", type: "f29",      year: 2026, month: 3, amount: 298000, paidDate: "2026-03-20", notes: "" },
];

// ─── Seed bank payments ──────────────────────────────────────
const initBankPayments = [
  { id: "p1", beneficiaryName: "Buk",           amount: 290000,  accountNumber: "12345678",  bankCode: "001", email: "pagos@buk.cl",           glosa: "Suscripción Buk Marzo 2026",      date: "2026-03-01" },
  { id: "p2", beneficiaryName: "WeWork",         amount: 1200000, accountNumber: "87654321",  bankCode: "012", email: "billing@wework.com",       glosa: "Arriendo oficina Marzo 2026",     date: "2026-03-01" },
  { id: "p3", beneficiaryName: "TGP",            amount: 450000,  accountNumber: "11223344",  bankCode: "009", email: "administracion@tgp.cl",    glosa: "Servicios TGP Marzo 2026",        date: "2026-03-05" },
  { id: "p4", beneficiaryName: "Contabilidad",   amount: 380000,  accountNumber: "55667788",  bankCode: "001", email: "contador@estudio.cl",      glosa: "Honorarios contabilidad Mar 2026",date: "2026-03-05" },
];

const INITIAL_STATE = {
  contractors: initContractors,
  reimbursements: initReimbursements,
  invoices: initInvoices,
  team: initTeam,
  equipment: initEquipment,
  compliancePayments: initCompliancePayments,
  bankPayments: initBankPayments,
};

function reducer(state, action) {
  switch (action.type) {
    // ── Contractors ──────────────────────────────────────────
    case "ADD_CONTRACTOR":
      return { ...state, contractors: [...state.contractors, action.payload] };
    case "UPDATE_CONTRACTOR":
      return { ...state, contractors: state.contractors.map((c) => c.id === action.payload.id ? { ...c, ...action.payload } : c) };
    case "DELETE_CONTRACTOR":
      return { ...state, contractors: state.contractors.filter((c) => c.id !== action.payload) };
    case "TOGGLE_ONBOARDING_STEP": {
      const { contractorId, stepIndex } = action.payload;
      return {
        ...state,
        contractors: state.contractors.map((c) => {
          if (c.id !== contractorId) return c;
          const steps = c.onboardingSteps.map((s, i) => i === stepIndex ? { ...s, done: !s.done } : s);
          const done = steps.filter((s) => s.done).length;
          const onboardingStatus = done === 0 ? "not_started" : done === steps.length ? "complete" : "in_progress";
          return { ...c, onboardingSteps: steps, onboardingStatus };
        }),
      };
    }

    // ── Reimbursements ───────────────────────────────────────
    case "ADD_REIMBURSEMENT":
      return { ...state, reimbursements: [...state.reimbursements, action.payload] };
    case "UPDATE_REIMBURSEMENT_STATUS":
      return { ...state, reimbursements: state.reimbursements.map((r) => r.id === action.payload.id ? { ...r, status: action.payload.status } : r) };
    case "DELETE_REIMBURSEMENT":
      return { ...state, reimbursements: state.reimbursements.filter((r) => r.id !== action.payload) };

    // ── Invoices ─────────────────────────────────────────────
    case "ADD_INVOICE":
      return { ...state, invoices: [...state.invoices, action.payload] };
    case "UPDATE_INVOICE_STATUS":
      return { ...state, invoices: state.invoices.map((inv) => inv.id === action.payload.id ? { ...inv, status: action.payload.status } : inv) };
    case "DELETE_INVOICE":
      return { ...state, invoices: state.invoices.filter((inv) => inv.id !== action.payload) };

    // ── Team ─────────────────────────────────────────────────
    case "ADD_TEAM_MEMBER":
      return { ...state, team: [...state.team, action.payload] };
    case "DELETE_TEAM_MEMBER":
      return { ...state, team: state.team.filter((m) => m.id !== action.payload) };

    // ── Equipment ────────────────────────────────────────────
    case "ADD_EQUIPMENT":
      return { ...state, equipment: [...state.equipment, action.payload] };
    case "UPDATE_EQUIPMENT_STATUS":
      return { ...state, equipment: state.equipment.map((e) => e.id === action.payload.id ? { ...e, ...action.payload } : e) };
    case "DELETE_EQUIPMENT":
      return { ...state, equipment: state.equipment.filter((e) => e.id !== action.payload) };

    // ── Compliance payments ──────────────────────────────────
    case "ADD_COMPLIANCE_PAYMENT":
      return { ...state, compliancePayments: [...state.compliancePayments, action.payload] };
    case "DELETE_COMPLIANCE_PAYMENT":
      return { ...state, compliancePayments: state.compliancePayments.filter((p) => p.id !== action.payload) };

    // ── Bank payments ────────────────────────────────────────
    case "ADD_BANK_PAYMENT":
      return { ...state, bankPayments: [...state.bankPayments, action.payload] };
    case "DELETE_BANK_PAYMENT":
      return { ...state, bankPayments: state.bankPayments.filter((p) => p.id !== action.payload) };

    default:
      return state;
  }
}

const StoreContext = createContext(null);
const STORAGE_KEY = "niuro_hr_state";

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => {
    if (typeof window === "undefined") return init;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return init;
      const parsed = JSON.parse(saved);
      // Ensure new slices exist for existing users
      return {
        ...init,
        ...parsed,
        compliancePayments: parsed.compliancePayments ?? init.compliancePayments,
        bankPayments: parsed.bankPayments ?? init.bankPayments,
      };
    } catch { return init; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function newId() {
  return Math.random().toString(36).slice(2, 9);
}
