# Copilot Instructions — PPC Automation System (IFPE Campus Belo Jardim)

## Project Overview

This is an MVP of a web-based automation tool for creating **Projetos Pedagógicos de Curso (PPC)** — official academic course planning documents required by Brazilian federal education regulations (MEC). The system guides professors and course coordinators through a structured wizard to fill in all required data, then compiles and exports the final document as PDF and ODT.

The system runs **entirely on localhost** (no cloud, no internet required at runtime). There is **no login or authentication** in this MVP.

## Domain Knowledge

### What is a PPC?

A PPC (Projeto Pedagógico de Curso) is a mandatory official document that defines a college course. It contains:
- Course identification data (name, workload, duration, access rules)
- The full curriculum matrix (disciplines per semester)
- Syllabi and bibliographies for each discipline
- Institutional authority list (rector, pro-rectors, directors, coordinators)
- Faculty body (docentes) with their qualifications
- Physical infrastructure inventory (labs, rooms, equipment)

### Document Structure (sections the system must generate)

1. Cover page — course name and year
2. Back cover
3. Institutional team list (Rector, Pro-rectors, Directors, Coordinator, Pedagogical Advisor)
4. PPC Elaboration Commission list
5. List of figures and tables
6. Table of contents
7. **Course identification data** (see Module 1 below)
8. Curriculum matrix (grid of disciplines per semester)
9. Curriculum flow diagrams (Diagrama 1 and Diagrama 2)
10. Curriculum dynamics table
11. Syllabi section (grouped by semester)
12. Course coordination profile
13. Faculty body
14. Physical infrastructure and equipment tables

---

## Data Model (Modules)

### Module 1 — PPC (Course General Data)

Main entity. Root of the data model.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| course_name | String | Ex: "Engenharia de Software" |
| year | Integer | |
| knowledge_area | String | |
| level | String | Ex: "Graduação" |
| modality | String | Ex: "Presencial" |
| degree_title | String | Ex: "Bacharelado" |
| class_duration_minutes | Integer | Ex: 45 |
| total_workload_clock_hours | Integer | Target: 3205 h/r |
| total_workload_class_hours | Integer | |
| complementary_activities_hours | Integer | Ex: 200 h/r |
| extension_activities_hours | Integer | Must be exactly 10% of total_workload_clock_hours (~320 h/r) |
| min_completion_semesters | Integer | Ex: 8 |
| max_completion_semesters | Integer | Ex: 16 |
| access_form | String | |
| admission_requirement | String | |
| annual_vacancies | Integer | |
| vacancies_per_shift | Integer | |
| shift | String | |
| enrollment_regime | String | Ex: "Semestral" |
| weeks_per_semester | Integer | |
| course_status | Enum | "Awaiting Authorization", "Authorized", "Awaiting MEC Recognition", "Recognized by MEC", "Awaiting Renewal" |
| quality_indicators | JSON | CC, CPC, ENADE, IGC scores |
| reformulation_type | Enum | "Initial", "Partial", "Full" |

**Business rules:**
- `total_workload_clock_hours` must equal exactly **3205 h/r**
- `extension_activities_hours` must equal exactly **10%** of `total_workload_clock_hours`

---

### Module 2 — CurriculumComponent (Discipline)

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| ppc_id | UUID | FK → PPC |
| name | String | Required |
| period | Integer | Required; 1–10 only |
| nucleus_type | Enum | "Basic", "Specific", "Professional", "Optional" |
| workload_clock_hours | Integer | h/r; Required |
| workload_class_hours | Integer | h/a; Required |
| theoretical_hours | Integer | |
| practical_hours | Integer | |
| credits | Integer | |
| syllabus | Text | Required (ementa) |

**Relationships:**
- `prerequisites` → List of CurriculumComponent (many-to-many, self-referential)
- `co_requisites` → List of CurriculumComponent (many-to-many, self-referential)
- `basic_bibliography` → List of Bibliography (minimum 3 required)
- `complementary_bibliography` → List of Bibliography (minimum 5 required)

**Business rules:**
- Saving is blocked if: name, period, workload, or syllabus is empty
- Saving is blocked if bibliography counts are below minimums
- Deletion is blocked if the component is referenced as a prerequisite by any other component
- Adding a dependency must check for **circular dependency** — reject if it creates a cycle (e.g., A → B → A)

---

### Module 2b — Bibliography

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| component_id | UUID | FK → CurriculumComponent |
| type | Enum | "Basic", "Complementary" |
| formatted_reference | Text | ABNT format, free text input |

---

### Module 3 — Authority (Institutional Team)

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| ppc_id | UUID | FK → PPC |
| group | Enum | "Institutional", "PPC_Commission", "Reviewer" |
| role | String | Ex: "Reitor", "Pró-Reitora de Ensino", "Bibliotecário" |
| name | String | |
| linked_ordinance | String | Optional; for NDE and commission members |

**Roles to fill (Institutional group):**
Rector, Pro-Rector of Education, Pro-Rector of Research, Pro-Rector of Extension, Pro-Rector of Institutional Development, Pro-Rector of Administration, Campus General Director, Director of Administration and Planning, Director of Educational Development, Academic Management Department, Academic Records Coordinator, Extension Coordinator, Research Coordinator, Course Coordinator, Pedagogical Advisor.

---

### Module 3b — CourseCoordinator

| Field | Type | Notes |
|---|---|---|
| ppc_id | UUID | FK → PPC |
| professor_name | String | |
| work_regime | String | Ex: "DE" (Dedicação Exclusiva) |
| weekly_coordination_hours | Integer | |
| years_at_institution | Integer | |
| years_as_coordinator | Integer | |
| qualification_summary | String | |
| degree_title | String | Ex: "Doutor em Ciência da Computação/UFPE/2018" |
| research_groups | String | |
| research_lines | String | |
| years_professional_experience | Integer | |
| years_management_experience | Integer | |
| contact_email | String | |

---

### Module 3c — Faculty (Docente)

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| ppc_id | UUID | FK → PPC |
| name | String | |
| academic_background | Text | |
| work_regime | String | |
| degree_title | String | Ex: "Mestre" |
| teaching_experience_years | Integer | |

**Relationships:**
- `disciplines_taught` → List of CurriculumComponent (many-to-many)

---

### Module 4 — Facility (Ambiente / Sala / Laboratório)

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| ppc_id | UUID | FK → PPC |
| classification | Enum | "Common Area", "Course Area" |
| name | String | Ex: "Laboratório de Informática 1" |
| quantity | Integer | Ex: 4 (for multiple identical rooms) |
| area_sqm | Decimal | m² |
| student_capacity | Integer | |

**Relationships:**
- `inventory` → List of InfrastructureItem

---

### Module 4b — InfrastructureItem

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| facility_id | UUID | FK → Facility |
| category | Enum | "Equipment", "Furniture" |
| item_name | String | Ex: "Computer", "Chair" |
| specifications | Text | Ex: "HP Elite 3GHz, 2GB RAM, 19" Monitor" |
| quantity | Integer | |

---

## Frontend UI Structure

The interface is a **wizard (step-by-step tabs)**. Do not build a single long-scroll page. Navigation between tabs should save progress automatically.

| Tab | Content |
|---|---|
| Tab 1 | Course general data (Module 1) + Course Coordinator |
| Tab 2 | Institutional authorities (Module 3) |
| Tab 3 | Curriculum matrix — table of disciplines with modal for editing each one (Module 2) |
| Tab 4 | Faculty body (Module 3c) |
| Tab 5 | Infrastructure — add facilities, then add items inside each facility (Module 4) |

**UI rules:**
- Follow the **Brazilian Federal Government Design System** for colors, typography, and components.
- Optimized for **desktop only** (minimum 1366×768). No mobile responsiveness needed.
- All form inputs must give **non-destructive validation feedback** — show error messages inline, never discard user data.
- Implement **auto-save** at regular intervals and show a confirmation modal when the user tries to leave a page with unsaved changes.
- Show a **loading spinner** during PDF/ODT export.

---

## Backend API (FastAPI)

- All routes under `/api/`
- Use **standard REST conventions**: GET (list/read), POST (create), PUT (update), DELETE (delete)
- Return consistent JSON responses with appropriate HTTP status codes
- Validate business rules on the backend, not just the frontend
- Use **Supabase Python client** for database access
- Organize code as: `routes/`, `models/`, `services/` (business logic lives in services, not in routes)

---

## What Is OUT OF SCOPE (do not implement)

- User login, registration, or any authentication
- Role-based access control (RBAC)
- Mobile/responsive layout
- Calls to external APIs or the internet during runtime
- Multi-user collaboration or cloud sync
- Approval workflows or document routing between departments
- Integration with existing institutional systems

---

## Export Requirements

- **PDF:** Must use PDF/A standard (ISO 19005). Text must be fully selectable and searchable. Tables must NOT be rendered as images.
- **ODT:** Must comply with ISO/IEC 26300. Must open correctly in LibreOffice and Microsoft Word without formatting loss.
- Document templates (fixed text, legal norms, standard chapters) must be stored separately from the CRUD logic so they can be updated independently when MEC regulations change.

---

## Key Business Rules Summary

| Rule | Description |
|---|---|
| Total workload | Must equal exactly **3205 h/r** |
| Extension hours | Must be exactly **10%** of total workload (~320 h/r) |
| Required discipline fields | name, period (1–10), workload (h/r and h/a), syllabus |
| Basic bibliography | Minimum **3 titles** per discipline |
| Complementary bibliography | Minimum **5 titles** per discipline |
| Circular dependency | Block creation if A→B and B→A already exists |
| Delete protection | Cannot delete a discipline if it is a prerequisite for another |
| Period range | Discipline period must be between **1 and 10** |