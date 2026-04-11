import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import httpClient from "../api/httpClient";

const normalizeApiError = (error, fallback) => error?.response?.data?.message || fallback;

export const usePayrollCycle = (month, year) => {
  const [loading, setLoading] = useState(false);
  const [cycle, setCycle] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isCycleMissing, setIsCycleMissing] = useState(false);

  const refreshCycle = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient.get(`/payroll/cycle/${month}/${year}`);
      const data = response?.data?.data || {};
      setCycle(data.cycle || null);
      setEntries(data.entries || []);
      setIsCycleMissing(false);
    } catch (error) {
      if (error?.response?.status === 404) {
        setCycle(null);
        setEntries([]);
        setIsCycleMissing(true);
        return;
      }
      message.error(normalizeApiError(error, "Payroll cycle load failed"));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    refreshCycle().catch(() => {});
  }, [refreshCycle]);

  const summary = useMemo(
    () =>
      entries.reduce(
        (acc, entry) => {
          acc.totalEmployees += 1;
          acc.totalGross += Number(entry.grossEarnings || 0);
          acc.totalDeductions += Number(entry.totalDeductions || 0);
          acc.totalNet += Number(entry.netPay || 0);
          if (entry.paymentStatus !== "paid") acc.unpaid += 1;
          return acc;
        },
        { totalEmployees: 0, totalGross: 0, totalDeductions: 0, totalNet: 0, unpaid: 0 }
      ),
    [entries]
  );

  return { loading, cycle, entries, summary, isCycleMissing, refreshCycle };
};

export const usePayrollActions = ({ month, year, cycleId, onSuccess }) => {
  const [actionLoading, setActionLoading] = useState({ generate: false, lock: false, pay: false });

  const withAction = async (key, action) => {
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await action();
      onSuccess?.();
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const generateCycle = () =>
    withAction("generate", async () => {
      try {
        await httpClient.post("/payroll/cycle/generate", { month, year });
        message.success("Payroll cycle generated");
      } catch (error) {
        if (error?.response?.status === 409) {
          message.info("Cycle already generated. Latest data refresh kiya jaa raha hai.");
          return;
        }
        message.error(normalizeApiError(error, "Cycle generation failed"));
      }
    });

  const lockCycle = () =>
    withAction("lock", async () => {
      try {
        await httpClient.post(`/payroll/cycle/${cycleId}/lock`, {});
        message.success("Payroll cycle locked");
      } catch (error) {
        message.error(normalizeApiError(error, "Payroll cycle lock failed"));
      }
    });

  const payCycle = () =>
    withAction("pay", async () => {
      try {
        await httpClient.post(`/payroll/cycle/${cycleId}/pay`, {
          transactionRefPrefix: `SAL-${year}${String(month).padStart(2, "0")}`,
        });
        message.success("Payroll marked as paid");
      } catch (error) {
        message.error(normalizeApiError(error, "Payroll pay action failed"));
      }
    });

  return { actionLoading, generateCycle, lockCycle, payCycle };
};

export const usePayrollStructures = () => {
  const [loading, setLoading] = useState(false);
  const [structures, setStructures] = useState([]);

  const refreshStructures = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient.get("/payroll/structure");
      setStructures(response?.data?.data || []);
    } catch (error) {
      if (error?.response?.status !== 404) {
        message.warning("Structure listing endpoint unavailable, form workflow still works.");
      }
      setStructures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStructures().catch(() => {});
  }, [refreshStructures]);

  return { loading, structures, refreshStructures };
};

export const usePayslip = ({ month, year, employeeId }) => {
  const [loading, setLoading] = useState(false);
  const [payslip, setPayslip] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const fetchPayslip = useCallback(
    async (employeeIdOverride) => {
      const targetEmployeeId = employeeIdOverride || employeeId;
      if (!targetEmployeeId) return;
      setLoading(true);
      setNotFound(false);
      try {
        const response = await httpClient.get(`/payroll/payslip/${targetEmployeeId}/${month}/${year}`);
        setPayslip(response?.data?.data || null);
      } catch (error) {
        if (error?.response?.status === 404) {
          setNotFound(true);
          setPayslip(null);
          return;
        }
        message.error(normalizeApiError(error, "Payslip fetch failed"));
      } finally {
        setLoading(false);
      }
    },
    [employeeId, month, year]
  );

  return { loading, payslip, notFound, fetchPayslip, setPayslip };
};

export const useMonthlyPayrollReport = (month, year) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const refreshReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient.get("/payroll/reports/monthly", { params: { month, year } });
      setReport(response?.data?.data || null);
      setIsEmpty(false);
    } catch (error) {
      if (error?.response?.status === 404) {
        setIsEmpty(true);
        setReport(null);
        return;
      }
      message.error(normalizeApiError(error, "Monthly report fetch failed"));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    refreshReport().catch(() => {});
  }, [refreshReport]);

  return { loading, report, isEmpty, refreshReport };
};
