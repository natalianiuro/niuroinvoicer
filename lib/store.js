import { createContext, useContext, useReducer, useEffect } from "react";
import {
  contractors as initContractors,
  reimbursements as initReimbursements,
  invoices as initInvoices,
  teamMembers as initTeam,
  equipment as initEquipment,
} from "./data/mock";

const initCompliancePayments = [
  { id: "c1", type: "previred", year: 2026, month: 1, amount: 480000, paidDate: "2026-01-13", notes: "" },
  { id: "c2", type: "f29",      year: 2026, month: 1, amount: 320000, paidDate: "2026-01-20", notes: "" },
  { id: "c3", type: "previred", year: 2026, month: 2, amount: 495000, paidDate: "2026-02-13", notes: "" },
  { id: "c4", type: "f29",      year: 2026, month: 2, amount: 310000, paidDate: "2026-02-20", notes: "" },
  { id: "c5", type: "previred", year: 2026, month: 3, amount: 510000, paidDate: "2026-03-13", notes: "" },
  { id: "c6", type: "f29",      year: 2026, month: 3, amount: 298000, paidDate: "2026-03-20", notes: "" },
];

const initBankPayments = [
  { id: "p1", beneficiaryName: "Buk",         amount: 290000,  accountNumber: "12345678", bankCode: "001", email: "pagos@buk.cl",        glosa: "Suscripción Buk Marzo 2026",       date: "2026-03-01" },
  { id: "p2", beneficiaryName: "WeWork",       amount: 1200000, accountNumber: "87654321", bankCode: "012", email: "billing@wework.com",   glosa: "Arriendo oficina Marzo 2026",      date: "2026-03-01" },
  { id: "p3", beneficiaryName: "TGP",          amount: 450000,  accountNumber: "11223344", bankCode: "009", email: "admin@tgp.cl",         glosa: "Servicios TGP Marzo 2026",         date: "2026-03-05" },
  { id: "p4", beneficiaryName: "Contabilidad", amount: 380000,  accountNumber: "55667788", bankCode: "001", email: "contador@estudio.cl",  glosa: "Honorarios contabilidad Mar 2026", date: "2026-03-05" },
];

const initOnboarding = [
  {
    id: "ob1", personName: "Mónica Mondaca", role: "QA Engineer", client: "eztax", startDate: "2025-10-14",
    checklist: { contractSigned: true, niuroCredentials: true, computer: true, niuroOnboarding: true, clientCredentials: true },
    notes: "Onboarding complete.",
  },
  {
    id: "ob2", personName: "James Maradiaga", role: "Technical Lead", client: "fundo", startDate: "2025-10-27",
    checklist: { contractSigned: true, niuroCredentials: true, computer: true, niuroOnboarding: true, clientCredentials: false },
    notes: "Client credentials pending.",
  },
  {
    id: "ob3", personName: "Ana Torres", role: "Full Stack Engineer", client: "bhp", startDate: "2026-01-15",
    checklist: { contractSigned: true, niuroCredentials: true, computer: false, niuroOnboarding: true, clientCredentials: true },
    notes: "No company computer (uses own).",
  },
  {
    id: "ob4", personName: "Lucas Ferreira", role: "Full Stack Engineer", client: "tickblaze", startDate: "2026-01-20",
    checklist: { contractSigned: true, niuroCredentials: true, computer: true, niuroOnboarding: true, clientCredentials: true },
    notes: "",
  },
  {
    id: "ob5", personName: "Isabella Mendoza", role: "Full Stack Engineer", client: "cdk", startDate: "2026-04-01",
    checklist: { contractSigned: false, niuroCredentials: false, computer: false, niuroOnboarding: false, clientCredentials: false },
    notes: "Just joined.",
  },
];

const initDevSuccess = [
  { id: "ds1", personName: "Mónica Mondaca",  sentDate: "2026-01-15", type: "check-in",    status: "completed", satisfaction: 4, highlights: "Buena dinámica de equipo", challenges: "Documentación escasa", notes: "" },
  { id: "ds2", personName: "James Maradiaga", sentDate: "2026-01-15", type: "check-in",    status: "completed", satisfaction: 5, highlights: "Autonomía y proyectos interesantes", challenges: "Timezone con cliente", notes: "" },
  { id: "ds3", personName: "Ana Torres",      sentDate: "2026-02-01", type: "satisfaction", status: "completed", satisfaction: 4, highlights: "Buen ambiente", challenges: "Carga de trabajo alta", notes: "" },
  { id: "ds4", personName: "Lucas Ferreira",  sentDate: "2026-02-01", type: "satisfaction", status: "sent",      satisfaction: null, highlights: "", challenges: "", notes: "" },
  { id: "ds5", personName: "Valentina Ríos",  sentDate: "2026-03-01", type: "check-in",    status: "sent",      satisfaction: null, highlights: "", challenges: "", notes: "" },
];

const initPerformanceReviews = [
  { id: "pr1", personName: "Mónica Mondaca",  reviewDate: "2026-04-14", rating: 4, salaryBefore: 4500, salaryAfter: 4800, currency: "USD", notes: "Excelente desempeño. Aumento 6.7%.", nextReviewDate: "2026-10-14" },
  { id: "pr2", personName: "James Maradiaga", reviewDate: "2026-04-27", rating: 5, salaryBefore: 5000, salaryAfter: 5500, currency: "USD", notes: "Superó expectativas. Promotion a Lead.", nextReviewDate: "2026-10-27" },
];

const initChurn = [
  { id: "ch1", personName: "Roberto Salas", role: "Frontend Developer", country: "CL", departureDate: "2026-02-28", type: "resignation", reason: "Oferta en otra empresa con mejor compensación", notes: "" },
];

const INITIAL_STATE = {
  contractors: initContractors,
  reimbursements: initReimbursements,
  invoices: initInvoices,
  team: initTeam,
  equipment: initEquipment,
  compliancePayments: initCompliancePayments,
  bankPayments: initBankPayments,
  onboarding: initOnboarding,
  devSuccess: initDevSuccess,
  performanceReviews: initPerformanceReviews,
  churn: initChurn,
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_CONTRACTOR":       return { ...state, contractors: [...state.contractors, action.payload] };
    case "UPDATE_CONTRACTOR":    return { ...state, contractors: state.contractors.map((c) => c.id === action.payload.id ? { ...c, ...action.payload } : c) };
    case "DELETE_CONTRACTOR":    return { ...state, contractors: state.contractors.filter((c) => c.id !== action.payload) };
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
    case "ADD_REIMBURSEMENT":           return { ...state, reimbursements: [...state.reimbursements, action.payload] };
    case "UPDATE_REIMBURSEMENT_STATUS": return { ...state, reimbursements: state.reimbursements.map((r) => r.id === action.payload.id ? { ...r, status: action.payload.status } : r) };
    case "DELETE_REIMBURSEMENT":        return { ...state, reimbursements: state.reimbursements.filter((r) => r.id !== action.payload) };
    case "UPDATE_REIMBURSEMENT_ATTACHMENT": return { ...state, reimbursements: state.reimbursements.map((r) => r.id === action.payload.id ? { ...r, attachment: action.payload.attachment } : r) };
    case "ADD_INVOICE":          return { ...state, invoices: [...state.invoices, action.payload] };
    case "UPDATE_INVOICE_STATUS":return { ...state, invoices: state.invoices.map((inv) => inv.id === action.payload.id ? { ...inv, status: action.payload.status } : inv) };
    case "DELETE_INVOICE":       return { ...state, invoices: state.invoices.filter((inv) => inv.id !== action.payload) };
    case "ADD_TEAM_MEMBER":      return { ...state, team: [...state.team, action.payload] };
    case "UPDATE_TEAM_MEMBER":   return { ...state, team: state.team.map((m) => m.id === action.payload.id ? { ...m, ...action.payload } : m) };
    case "DELETE_TEAM_MEMBER":   return { ...state, team: state.team.filter((m) => m.id !== action.payload) };
    case "ADD_EQUIPMENT":        return { ...state, equipment: [...state.equipment, action.payload] };
    case "UPDATE_EQUIPMENT":     return { ...state, equipment: state.equipment.map((e) => e.id === action.payload.id ? { ...e, ...action.payload } : e) };
    case "UPDATE_EQUIPMENT_STATUS": return { ...state, equipment: state.equipment.map((e) => e.id === action.payload.id ? { ...e, ...action.payload } : e) };
    case "DELETE_EQUIPMENT":     return { ...state, equipment: state.equipment.filter((e) => e.id !== action.payload) };
    case "ADD_COMPLIANCE_PAYMENT":    return { ...state, compliancePayments: [...state.compliancePayments, action.payload] };
    case "UPDATE_COMPLIANCE_PAYMENT": return { ...state, compliancePayments: state.compliancePayments.map((p) => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case "DELETE_COMPLIANCE_PAYMENT": return { ...state, compliancePayments: state.compliancePayments.filter((p) => p.id !== action.payload) };
    case "ADD_BANK_PAYMENT":    return { ...state, bankPayments: [...state.bankPayments, action.payload] };
    case "UPDATE_BANK_PAYMENT": return { ...state, bankPayments: state.bankPayments.map((p) => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case "DELETE_BANK_PAYMENT": return { ...state, bankPayments: state.bankPayments.filter((p) => p.id !== action.payload) };
    // People
    case "ADD_ONBOARDING":      return { ...state, onboarding: [...state.onboarding, action.payload] };
    case "TOGGLE_ONBOARDING_CHECK": {
      const { id, key } = action.payload;
      return { ...state, onboarding: state.onboarding.map((o) => o.id === id ? { ...o, checklist: { ...o.checklist, [key]: !o.checklist[key] } } : o) };
    }
    case "DELETE_ONBOARDING":   return { ...state, onboarding: state.onboarding.filter((o) => o.id !== action.payload) };
    case "ADD_DEV_SUCCESS":     return { ...state, devSuccess: [...state.devSuccess, action.payload] };
    case "UPDATE_DEV_SUCCESS":  return { ...state, devSuccess: state.devSuccess.map((d) => d.id === action.payload.id ? { ...d, ...action.payload } : d) };
    case "DELETE_DEV_SUCCESS":  return { ...state, devSuccess: state.devSuccess.filter((d) => d.id !== action.payload) };
    case "ADD_PERFORMANCE_REVIEW":   return { ...state, performanceReviews: [...state.performanceReviews, action.payload] };
    case "DELETE_PERFORMANCE_REVIEW":return { ...state, performanceReviews: state.performanceReviews.filter((p) => p.id !== action.payload) };
    case "ADD_CHURN":    return { ...state, churn: [...state.churn, action.payload] };
    case "DELETE_CHURN": return { ...state, churn: state.churn.filter((c) => c.id !== action.payload) };
    default: return state;
  }
}

const StoreContext = createContext(null);
const STORAGE_KEY = "niuro_hr_state_v3";

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => {
    if (typeof window === "undefined") return init;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return init;
      const parsed = JSON.parse(saved);
      return {
        ...init, ...parsed,
        compliancePayments: parsed.compliancePayments ?? init.compliancePayments,
        bankPayments:        parsed.bankPayments        ?? init.bankPayments,
        onboarding:          parsed.onboarding          ?? init.onboarding,
        devSuccess:          parsed.devSuccess          ?? init.devSuccess,
        performanceReviews:  parsed.performanceReviews  ?? init.performanceReviews,
        churn:               parsed.churn               ?? init.churn,
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
