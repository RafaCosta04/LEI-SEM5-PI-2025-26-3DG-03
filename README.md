<div align="center">

---

A full-stack, **polyglot microservices** platform that models the full lifecycle of a vessel visit — from booking and dock assignment to AI-scheduled cargo operations and real-time execution tracking. Built as the capstone project for the 5th semester of Informatics Engineering at **ISEP**.

## ✨ What makes it stand out

- 🧠 **AI scheduling engine (Prolog)** — exact, heuristic and **genetic algorithms** that minimize vessel departure delays, with automatic algorithm selection and dock rebalancing.
- 🌐 **Live 3D digital twin (Three.js)** — the entire port rendered from real data: docks, cranes, vessels and yards with object picking, dynamic lighting and smooth camera control.
- 🏛️ **Domain-Driven Design (.NET)** — a cleanly layered core API for the port-facilities domain.
- 🔐 **Enterprise security** — external IAM (Keycloak / OAuth2) with role- and attribute-based access control across every service.
- ⚙️ **Production-minded** — CI/CD pipeline, automated backups, GDPR compliance and English / Portuguese i18n.

## 🏛️ Architecture

Five decoupled services, each owning its data and communicating over REST only.

| Service              | Role                               | Stack                           |
| -------------------- | ---------------------------------- | ------------------------------- |
| **UI**         | SPA + 3D digital twin              | Angular 20, Three.js, Cypress   |
| **API**        | Core port domain                   | C# / .NET, Domain-Driven Design |
| **OEM**        | Operations execution & analytics   | Node.js, Express, MongoDB       |
| **Scheduling** | Planning & optimization algorithms | Prolog (SWI-Prolog)             |
| **IAM**        | Authentication                     | Keycloak (OAuth2 / OIDC)        |

<div align="center">
<img src="docs/Global_Artifacts/SprintC/containers_lvl2.png" alt="Container diagram" width="720"/>
</div>

## 👥 Team

Built by team **3DG-03** at **ISEP – Instituto Superior de Engenharia do Porto** (2025/2026):

| Member        | GitHub                                                    |
| ------------- | --------------------------------------------------------- |
| Ruben Freitas | [@rubenFreitas1](https://github.com/rubenFreitas1)           |
| Rafael Costa  | [@RafaCosta04](https://github.com/RafaCosta04)               |
| José Ribeiro | [@JoseRibeiro1230927](https://github.com/JoseRibeiro1230927) |
| João Sousa   | [@joaopedrosousa](https://github.com/joaopedrosousa)         |

---

<div align="center">
<sub>Academic capstone integrating software architecture, AI, computer graphics, systems administration and management — developed with Scrum across three sprints. ⚓</sub>
</div>
