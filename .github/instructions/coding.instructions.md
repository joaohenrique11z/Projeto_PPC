# Coding Instructions

## MVP Reminder

This is an MVP project.

Do not optimize for:

* Millions of users.
* High scalability.
* Complex infrastructure.
* Future features that do not exist yet.
* Enterprise-level architecture.

Optimize for:

* Fast delivery.
* Simplicity.
* Readability.
* Maintainability.
* Team productivity.

## Project Goal

This project automates the creation of Higher Education Course Pedagogical Projects (PPC) using structured forms and automated document generation.

The main goals are:

* Simplicity
* Maintainability
* Readability
* Fast development
* Easy onboarding for new team members

---

## Technology Stack

### Backend

* Python 3.13+
* FastAPI
* Supabase
* Object-Oriented Programming (OOP)

### Frontend

* Vanilla JavaScript
* Tailwind CSS

### Database

* Supabase

---

## Development Philosophy

Always prioritize:

1. Simplicity over complexity.
2. Readability over cleverness.
3. Maintainability over premature optimization.
4. Consistency across the codebase.
5. Solutions that can be easily understood by intermediate developers.

Before implementing a complex solution, ask:

"Can this be solved in a simpler way?"

---

## Object-Oriented Programming

* Use OOP when appropriate.
* Keep classes focused on a single responsibility.
* Prefer composition over inheritance.
* Avoid deep inheritance hierarchies.
* Avoid unnecessary abstractions.

---

## Type Hints

Always use type hints.

Example:

```python
def get_course(course_id: int) -> Course:
    ...
```

---

## Docstrings

All public classes and public methods must contain docstrings.

Example:

```python
class CourseService:
    """Handles course-related operations."""

    def get_by_id(self, course_id: int) -> Course:
        """
        Retrieve a course by its identifier.

        Args:
            course_id: Course identifier.

        Returns:
            Course object.
        """
```

---

## Naming Conventions

Use descriptive English names.

Good:

```python
calculate_total_workload()
generate_curriculum_matrix()
get_course_by_id()
```

Bad:

```python
calc()
process()
do_stuff()
```

---

## Backend Structure

Organize backend code using:

* routers
* services
* repositories
* models
* schemas

### Routers

Routers should only:

* Receive requests
* Validate inputs
* Call services
* Return responses

Business rules should never be implemented inside routers.

### Services

Services should contain business logic.

### Repositories

Repositories should handle data access.

---

## Database

* Use descriptive table names.
* Use descriptive column names.
* Avoid duplicated data.
* Prefer simple and explicit queries.
* Keep relationships clear.

---

## Frontend

### JavaScript

* Use Vanilla JavaScript.
* Create small reusable functions.
* Separate business logic from DOM manipulation.
* Keep files organized by responsibility.

### Tailwind CSS

* Prefer Tailwind utility classes.
* Use custom CSS only when necessary.

---

## Code Generation Rules

When generating code:

* Use English for code, comments, variables, functions, classes and documentation.
* Keep implementations simple.
* Avoid unnecessary abstraction.
* Add short comments only when they provide value.
* Follow existing project structure.
* Prefer readability over optimization.
* Generate production-ready but easy-to-understand code.