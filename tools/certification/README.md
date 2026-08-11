# GHOSTWEAVE Certification Kit

**Status:** ✅ READY  
**Version:** 1.0.0  
**Protocol:** GWP/1.0  

---

## 📌 Overview

The **Certification Kit** is the official compliance verification suite for GHOSTWEAVE.

It provides:
- **Canonical Event Suite** — эталонные события для проверки канонической сериализации
- **Verification Suite** — проверка целостности и непрерывности цепочки
- **Replay Suite** — проверка восстановления доказательств
- **Negative Test Suite** — проверка обработки ошибок
- **Cross-Version Suite** — проверка совместимости версий
- **Cross-Implementation Suite** — проверка совместимости реализаций

**Key principle:** Certification Kit is the **source of truth** for compliance. Any implementation that passes the Certification Kit is considered Protocol-compliant.

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install