---
trigger: always_on
---

# Things to Avoid

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

## Unnecessary Complexity

Do not implement:

* Microservices
* CQRS
* Event Sourcing
* Full Domain Driven Design (DDD)
* Full Clean Architecture
* Event-driven architecture
* Distributed systems
* Enterprise patterns without a real need

Always prefer the simplest solution that solves the problem.

---

## Dependencies

Do not introduce new dependencies unless there is a clear benefit.

Before suggesting a new package, verify whether the problem can be solved using:

* Python standard library
* FastAPI
* Supabase
* Vanilla JavaScript
* Tailwind CSS

---

## Frontend

Do not suggest:

* React
* Next.js
* Angular
* Vue
* Redux
* Zustand
* MobX

Unless explicitly requested.

---

## Backend

Do not suggest:

* Django
* Flask
* Spring Boot
* NestJS
* Express.js

Unless explicitly requested.

FastAPI is the default backend framework.

---

## Code Structure

Avoid:

* Giant classes
* Giant functions
* Deep nesting
* Premature optimization
* Generic helper functions without a clear purpose
* Excessive abstraction
* Over-engineering

---

## Naming

Avoid:

```python
x
y
tmp
obj
data
process()
execute()
do_stuff()
```

Prefer descriptive names.

---

## Comments

Avoid obvious comments.

Bad:

```python
# Add 1 to count
count += 1
```

Write comments only when they explain reasoning, decisions or business rules.

---

## Code Generation

Do not generate:

* Unnecessary files
* Unrequested features
* Large refactors when a small change is enough
* Alternative architectures unless requested
* Multiple implementation options unless requested

Always focus on solving the requested problem using the simplest maintainable solution.
