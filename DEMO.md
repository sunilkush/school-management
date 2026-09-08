# Demo walkthrough

A 30-minute run through the system for a school that is thinking about buying it. Sections 1–7
are the core; 8–11 are worth adding when there is time, or picking from depending on who is in
the room — a principal cares about appraisal, a trustee about concessions.

The order below is deliberate: it opens with the thing every school already understands (money
they are owed), and ends with the two things no competitor at this price point usually has (a bus
on a live map, and government filing readiness). Each section says what to click, what to say, and
what **not** to promise — the last part matters, because a promise made in a demo becomes a
support ticket three months later.

---

## Before the demo

Sign in with a school that already has real data in it — students enrolled, fees assigned, exams
marked, attendance taken. Every section below reads from what is actually in the database, so a
thinly populated school makes a thin demo.

Two things worth checking on the morning:

- **The academic year is the current one and is active.** Several screens scope their queries to
  it, and a year that has already ended makes concessions, report cards and fee reports come back
  empty for reasons that look like bugs.
- **You are pointed at the right database.** `MONGOOSE_URI` in `backend/.env` must name one —
  a URI that ends at the host with no database name does *not* mean "the default"; it silently
  means a database called `test`, which is how you end up demoing a school with nothing in it.

Never demo against a school’s live data. Use a database kept for this.

---

## 1 · Fees and money owed  (3 min)

**Log in as:** School Admin → **Fees → Fee Reports**

- Collected vs outstanding for the year, and the defaulter list.
- Open one student: the structure assigned, instalments, what is paid, what is due.

> "Every rupee is traced to a student and an instalment. The receipt a parent gets is the same
> record the accountant sees."

---

## 2 · Accounting  (4 min) — *the one that closes finance people*

**Log in as:** Accountant → **Accounting**

Open **Reconciliation** first, not the statements. It answers one question in a sentence: is
everything the school recorded actually in the books.

- Point at the source rows: fee payments, refunds, salaries, income, expenses.
- Press **Post pending** if anything is outstanding.
- Then **Financial Statements** → Trial Balance, Income & Expenditure, Balance Sheet.

> "Most school software gives you an income and expense list. This is a real double-entry ledger
> underneath it, so the trial balance actually balances and an auditor can follow any figure back
> to the receipt it came from."

**Do not promise:** that it replaces Tally for statutory filing. It is the school's books, not a
GST/ITR filing tool.

Worth showing if they push on trust: try to edit a posted entry. It refuses — a posted entry can
only be reversed, and both the original and the reversal stay visible.

---

## 3 · Live bus tracking  (4 min) — *the one parents ask about*

**Log in as:** Transport Manager → **Live Tracking**

A bus is moving right now. Click it: the route, the trail it has actually taken, the stops it has
reached and the time at each.

Then show the other side — **Driver → My Trip** (`driver1@…`, password `Driver@123`). This is what
the driver's phone shows: start the run, and the bus appears on the office map.

Then the parent's view — **Parent → Where is the Bus**: their own child's bus only, with roughly
how long until it reaches their stop.

> "No tracker hardware to buy. The driver's phone is the tracker."

**Say this before they ask** — it lands much better volunteered than extracted:

- The position comes from the driver's phone with the page open. Close the browser and tracking
  stops until they open it again.
- Arrival times are estimates from distance and speed, not a road route. The screen says "about".
- Stops have to be put on the map once per route, or the bus can be watched moving but nobody
  gets a "reached your stop" message.

---

## 4 · Government compliance  (3 min) — *the one that sells to the principal*

**Log in as:** School Admin → **Govt. Compliance → Readiness**

- The progress bar: how many student records are ready to file.
- **What is missing**, grouped by field — "212 children have no mother tongue" is an afternoon's
  work; the same thing as 212 separate rows is a job nobody starts.
- **RTE position**, per class. A school can look compliant overall while having admitted nobody in
  the class where it was actually required.

> "UDISE filing week normally goes on finding the gaps, not on filling them. This finds them."

**Do not promise:** that it files anything. UDISE+ has no interface for a school system to submit
through — the return is still filed on the government portal. This gets the data ready and
exports the sheet to work from. Saying that up front is a credibility win; being caught on it
later is not.

Also worth saying: full Aadhaar numbers are deliberately **not** stored, only the last four digits
and whether the document is on file. Schools that have thought about it will appreciate this.

---

## 5 · Attendance from card readers  (2 min)

**Log in as:** School Admin → **Attendance → Biometric / RFID**

- The reader, when it last reported, and today's scans.
- **Cards & fingerprints**: a card nobody has enrolled shows up in its own list. Enrol it, press
  **Reprocess**, and the scans it already made turn into attendance.

> "Works with the reader the school already owns — it is not tied to one brand."

---

## 6 · Online classes  (2 min)

**Log in as:** Teacher → **Online Classes**

- A class scheduled for this afternoon. Students see it now, but the link only appears fifteen
  minutes before it starts.
- The finished class from two days ago, with its recording and its join log.

> "It uses whatever the school already has — Meet, Zoom, Teams. Nothing to buy, nothing to set up."

**Do not promise:** that the join log is attendance. It records who clicked join, not who sat
through the lesson. The teacher marks the register from it, after looking at it.

---

## 7 · Report cards  (2 min)

**Log in as:** School Admin → **Exams → Report Cards**

A term template already exists, weighted across three exams. Press **Generate** live — the cards
build in front of them from marks already in the system. Open one, then print it.

Generating it live is better than showing a pre-made card: it proves the marks and the card are
the same data.

---

## 8 · Surveys and feedback  (2 min)

**Log in as:** School Admin → **Surveys & Feedback**

A parent-teacher meeting form is open, with about six in ten parents having replied. Open
**Results**:

- The rating shows its spread, not only its average.
- The comments are listed as written — that tab is usually where the school stops reading numbers.
- **Still to reply** names the parents who have not answered, so the survey can actually be finished.

> "The audience is picked the same way a circular is — the parents of Class 8, all teachers, the
> whole school. And the answers stay in your database, not a form service somebody set up once
> and left."

Worth showing the anonymous switch in the builder without turning it on, and saying what it does:
the answers are stored with nobody attached, and the school still sees **who** replied — kept in a
separate record with no way to join the two.

**Do not promise:** that an anonymous survey is anonymous in a small group. If it goes to three
people and two have replied, the third answer places itself. Say that before they work it out.
Also: questions cannot be edited once a survey is open, and anonymous answers cannot be changed
at all.

---
## 9 · Circulars  (2 min)

**Log in as:** School Admin → **Circulars**

Three are published; the timings one is pinned and asks parents to confirm they have read it.
Open **Who has read it**:

- Two tabs: acknowledged, and still to acknowledge — with names, so it can actually be chased.
- The two numbers on the row are **opened** and **acknowledged**, and they are different.

> "A circular gets a number when you publish it, goes to a fixed list of people, and you can see
> exactly who has confirmed they read it. When the bus timings change, that record is the thing
> you want."

**Do not promise:** that opened means agreed. The screen reports them separately on purpose — a
school that reads "180 opened" as "180 agreed" has drawn the wrong conclusion from its own data.
Also: published wording cannot be edited. A correction is a new circular that supersedes the old
one, which is how a school does it on paper anyway.

---

## 10 · Scholarships and concessions  (3 min)

**Log in as:** School Admin → **Scholarships**

Five schemes, twelve approved awards, two still waiting for a decision, one revoked.

- The RTE scheme is capped at 8 funded places and shows how many are used.
- One child holds **two** concessions — 25% merit plus 10% sibling. The bill shows **35%**, not
  32.5%. Percentages are summed, not compounded, because that is what a school means when it
  tells a parent "twenty-five plus ten".
- Press **Sync** and watch the concession land on the enrolments the fee bills are built from.

> "The concession is not a note in a file. It is on the enrolment, so the fee bill comes out right
> without anybody remembering to subtract anything."

**Do not promise:** that granting an award rewrites bills already raised. It does not — those are
listed on the mismatch report instead. Changing a bill a parent has already been given is a
decision somebody makes, not a cleanup task the software does quietly.

---

## 11 · Recruitment and appraisal  (3 min)

**Log in as:** School Admin → **HR → Recruitment**

A PGT Mathematics vacancy with six applicants spread right across the pipeline — one at offer,
one at demo class, one interviewed, one shortlisted, one just applied, one rejected. Open a card:
every stage it passed through is there with its date and the note somebody wrote at the time.

Then **HR → Staff Appraisal**. The cycle is open, its four criteria weighted to 100. Six reviews:
some not started, some waiting on the reviewer, two finalised with an overall score and a band.

> "The self-assessment and the reviewer scores sit side by side and are never averaged into one
> number. Where they disagree is the part of an appraisal worth reading."

**Do not promise:** that an appraisal drives pay. It is deliberately not wired to payroll — an
increment is a decision a head takes, not something a form should trigger. Also: there is no
candidate-facing portal; applications are entered by the office.

---
## Closing

Two lines that tend to land:

> "Everything you have seen is one system. The fee receipt becomes a ledger entry, the exam mark
> becomes a report card, the card scan becomes attendance. Nothing is re-typed anywhere."

> "And where it does not do something — filing your UDISE return, hosting your video calls — it
> says so on the screen rather than letting you find out later."
