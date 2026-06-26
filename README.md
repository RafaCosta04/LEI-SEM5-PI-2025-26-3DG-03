<div align="center">

# 🚢 SmartPort

### An intelligent digital twin for modern container ports

Manage vessel visits, optimize cargo operations with AI, and explore the entire port in interactive 3D.

<br/>

![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=three.js&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-DDD-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Prolog](https://img.shields.io/badge/Prolog-AI-EF3B3A?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Keycloak](https://img.shields.io/badge/OAuth2-4D4D4D?style=for-the-badge&logo=keycloak&logoColor=white)

</div>

---

A full-stack **microservices platform** — spanning Angular, .NET, Node.js and Prolog — that models the full lifecycle of a vessel visit, from booking and dock assignment to AI-scheduled cargo operations and real-time execution tracking. It is exposed through **RESTful APIs** and a responsive **Single Page Application (SPA)**, and was built as the capstone project for the 5th semester of Informatics Engineering at **ISEP**.

## ✨ What makes it stand out

- 🧠 **AI optimization engine (Prolog)** — exact, heuristic and **genetic algorithms (metaheuristics)** that solve an NP-hard scheduling problem to minimize vessel departure delays, with automatic algorithm selection and dock rebalancing.
- 🌐 **Real-time 3D digital twin (Three.js / WebGL)** — the entire port rendered from live data: docks, cranes, vessels and yards with object picking, dynamic lighting and smooth camera control.
- 🏛️ **Domain-Driven Design (DDD) in .NET** — a cleanly layered, test-covered core API (domain, application, persistence) following SOLID and clean-architecture principles.
- 🔐 **Authentication & authorization** — external Identity & Access Management via **OAuth2 / OpenID Connect (Keycloak)**, JWT, and **Role-Based & Attribute-Based Access Control (RBAC / ABAC)** enforced on every endpoint.
- ⚙️ **DevOps & quality** — **CI/CD with GitHub Actions**, automated database backups, **unit & end-to-end testing (Cypress)**, GDPR compliance, internationalization (i18n), and **Agile / Scrum** delivery.

## 🏛️ Architecture

Five decoupled microservices, each owning its data and communicating exclusively through **RESTful APIs**.

| Service              | Role                               | Stack                                    |
| -------------------- | ---------------------------------- | ---------------------------------------- |
| **UI**         | SPA + 3D digital twin              | Angular 20, TypeScript, Three.js, Cypress |
| **API**        | Core port domain                   | C# / .NET, Domain-Driven Design          |
| **OEM**        | Operations execution & analytics   | Node.js, Express, MongoDB (NoSQL)        |
| **Scheduling** | Planning & optimization algorithms | Prolog (SWI-Prolog)                      |
| **IAM**        | Authentication                     | Keycloak (OAuth2 / OpenID Connect)       |

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
