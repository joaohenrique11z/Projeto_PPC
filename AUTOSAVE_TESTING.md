# Autosave Implementation - Testing Guide

## Overview

Implementação completa de autosave com debounce de 3 segundos + delta (apenas campos alterados) + fila de saves FIFO.

**Commits nesta branch:**
1. Backend delta function (`aplicar_delta_ppc`)
2. Backend PATCH endpoint
3. Frontend autosave module (`autosave.js`)
4. Frontend forms.html integration
5. API integration (`autosavePPC` function)
6. Feedback handler (`autosave-feedback.js`)

---

## Testing Instructions

### 1. Backend: Test PATCH Endpoint

```bash
# Terminal 1: Start server
cd backend
uvicorn backend.main:app --reload
```

```bash
# Terminal 2: Create a PPC first
curl -X POST http://localhost:8000/api/ppc \
  -H "Content-Type: application/json" \
  -d '{
    "ppc": {"nome_curso": "Test Course", "campus_name": "Belo Jardim", "cnpj": "12345678901234"},
    "membros": [],
    "coordenacao": null,
    "docentes": [],
    "componentes": [],
    "ambientes": []
  }'
# Copy the returned ppc_id
```

```bash
# Test PATCH with delta (partial update)
PPC_ID="<paste-uuid-here>"
curl -X PATCH "http://localhost:8000/api/ppc/$PPC_ID" \
  -H "Content-Type: application/json" \
  -d '{"ppc": {"nome_curso": "Updated Name", "cnpj": "98765432109876"}}'

# Expected response:
# {
#   "success": true,
#   "ppc_id": "...",
#   "version": "2025-01-15T...",
#   "message": "Alterações salvas automaticamente"
# }
```

```bash
# Verify partial update: GET the PPC
curl http://localhost:8000/api/ppc/$PPC_ID | jq '.ppc | {nome_curso, cnpj}'
# Should show updated values
```

### 2. Frontend: Test Autosave in Browser

1. Open http://localhost:8000/forms.html?id=<ppc_id>
   - Ensure you're in edit mode (URL has `?id=...`)

2. Open DevTools Console (F12)

3. Modify any field with `data-autosave`:
   - Example: "Nome do Campus" dropdown
   - Example: "CNPJ" input
   - Example: "Nome do Curso" input

4. Wait 3 seconds after modifying (debounce period)

5. Check Console for logs:
   ```
   Delta detectado após debounce: {ppc: {...}}
   Processando save da fila...
   [Autosave Feedback] typing: 
   [Autosave Feedback] saving: Enviando alterações ao servidor...
   [Autosave Feedback] saved: Alterações salvas com sucesso
   ```

6. Check Network tab:
   - Should see `PATCH /api/ppc/{id}` request
   - Status: 200
   - Payload: only changed fields

7. Refresh page:
   - Should retain autosaved values from database

### 3. Test Delta Detection

In DevTools Console:
```javascript
// Inspect current state
console.log(autosaveManager.currentState);

// Inspect last detected delta
console.log("Check console logs for delta details");
```

### 4. Test Queue (Concurrency Safety)

1. Modify multiple fields rapidly (before debounce completes)
2. Wait 3 seconds
3. Check console:
   ```
   Delta adicionado à fila. Tamanho da fila: 1
   Delta adicionado à fila. Tamanho da fila: 2
   Delta adicionado à fila. Tamanho da fila: 3
   Processando save da fila...
   Processando save da fila...  (after first completes)
   Processando save da fila...  (after second completes)
   ```

4. All saves should process in order (FIFO)

### 5. Test Array Updates (Membros, Componentes, etc)

Array changes are detected and sent as full arrays:
```javascript
// In console, modify window.__crudState
window.__crudState.membros = [
  {nome: "New Member", ...}
];

// Wait 3s, check that delta includes full membros array
```

### 6. Test Error Handling

```bash
# Force error: patch with invalid ppc_id
curl -X PATCH http://localhost:8000/api/ppc/invalid-id \
  -H "Content-Type: application/json" \
  -d '{"ppc": {"nome_curso": "Test"}}'
# Should get 404 response
```

In frontend:
- Autosave keeps delta in queue
- Retries automatically on next debounce cycle
- Console shows error message

---

## Known Limitations & Future Improvements

### Current:
- ✅ Debounce of 3 seconds
- ✅ Delta detection (only changed fields)
- ✅ FIFO queue for concurrency safety
- ✅ Event-based feedback system (console ready, UI optional)
- ✅ Reutilizes existing database cascade logic

### Not Yet Implemented:
- [ ] Visual UI feedback (toast, spinner) - structure ready, just needs CSS
- [ ] Array updates with index-level precision (current: full array replace)
- [ ] Versioning check for external edits (backend ready, frontend optional)
- [ ] Partial validation (allows draft saves, validates on submit)

### Edge Cases Handled:
- ✅ Network errors: keeps delta in queue, retries automatically
- ✅ Concurrent saves: FIFO queue ensures order
- ✅ Missing fields: delta only includes what changed
- ✅ Array deletes: empty array sent as "" means delete all

---

## Code Structure

```
backend/
  services/ppc_service.py      → aplicar_delta_ppc()
  routes/ppc_routes.py          → PATCH /api/ppc/{ppc_id}

frontend/js/
  autosave.js                   → Core: debounce + delta + queue
  autosave-feedback.js          → Event handler (console log, UI ready)
  api.js                        → autosavePPC() function
  forms.html                    → data-autosave attributes, script includes

```

---

## Integration Checklist

- [x] Backend PATCH endpoint with delta support
- [x] Frontend autosave manager (debounce + queue)
- [x] Event-based feedback system
- [x] API integration (autosavePPC)
- [x] Forms.html integration (data-autosave attributes)
- [x] Feedback handler (console log ready)
- [ ] UI toast notifications (ready to implement)
- [ ] Additional data-autosave attributes on more fields
- [ ] Versioning-based conflict detection (optional)

---

## Next Steps (After Review)

1. Add more `data-autosave` attributes to additional form fields
2. Implement visual UI feedback (toast notifications)
3. Test with multi-user scenario (if applicable)
4. Performance optimization if needed (current: simple and reliable)
5. Add error recovery UI (retry button, discard changes option)
