---
title: XKLD PhoBERT Scoring
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# XKLD PhoBERT Scoring Service

FastAPI service for semantic interview-answer scoring with PhoBERT.

Endpoints:

- `GET /health`
- `POST /score`

Example:

```json
{
  "answer_text": "Em se tuan thu noi quy va lam theo huong dan cua quan ly.",
  "sample_answer": "Nguoi lao dong can tuan thu quy dinh an toan, dung gio va phoi hop voi quan ly.",
  "keywords": ["tuan thu", "dung gio", "quan ly"]
}
```
