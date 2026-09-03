import { Router } from "express";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  listAccounts,
  seedAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  createJournalEntry,
  listJournalEntries,
  postJournalEntry,
  reverseJournalEntry,
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
  getAccountLedger,
  getReconciliation,
  postPending,
} from "../controllers/ledger.controllers.js";

const router = Router();

// Who keeps the books. Deliberately narrow — the ledger is the record an audit is run against,
// so it is not opened up to every role that can see a fee receipt.
const BOOKKEEPERS = ["Super Admin", "School Admin", "Accountant"];
// Leadership additionally reads the statements without being able to change anything.
const STATEMENT_READERS = [...BOOKKEEPERS, "Principal", "Vice Principal"];

router.use(auth);

/* Statements — literal paths, declared before /:id routes so they are not captured. */
router.get("/reports/trial-balance", roleMiddleware(STATEMENT_READERS), getTrialBalance);
router.get("/reports/profit-and-loss", roleMiddleware(STATEMENT_READERS), getProfitAndLoss);
router.get("/reports/balance-sheet", roleMiddleware(STATEMENT_READERS), getBalanceSheet);
router.get("/reports/reconciliation", roleMiddleware(STATEMENT_READERS), getReconciliation);
router.post("/post-pending", roleMiddleware(BOOKKEEPERS), postPending);

/* Chart of accounts */
router.get("/accounts", roleMiddleware(STATEMENT_READERS), listAccounts);
router.post("/accounts/seed", roleMiddleware(BOOKKEEPERS), seedAccounts);
router.post("/accounts", roleMiddleware(BOOKKEEPERS), createAccount);
router.put("/accounts/:id", roleMiddleware(BOOKKEEPERS), updateAccount);
router.delete("/accounts/:id", roleMiddleware(BOOKKEEPERS), deleteAccount);
router.get("/accounts/:id/ledger", roleMiddleware(STATEMENT_READERS), getAccountLedger);

/* Journal entries */
router.get("/entries", roleMiddleware(STATEMENT_READERS), listJournalEntries);
router.post("/entries", roleMiddleware(BOOKKEEPERS), createJournalEntry);
router.patch("/entries/:id/post", roleMiddleware(BOOKKEEPERS), postJournalEntry);
router.post("/entries/:id/reverse", roleMiddleware(BOOKKEEPERS), reverseJournalEntry);

export default router;
