# CampusFlow AI — Complete Frontend

Contains the two actual interfaces from the supplied project:
- `student/student.html` — Student Portal
- `faculty/faculty.html` — Faculty/Staff Portal
- `shared/api.js` — backend bridge
- `index.html` — interface selector

The supplied student interface includes Dashboard, Attendance, Academics, Applications, Opportunities, Notices, AI Assistant and Profile. The supplied faculty interface includes Dashboard, AI Attendance, Student Directory, Performance Risk Radar, Application Tracking, Smart Notice Engine, Notion Action Queue, AI Assistant, Security & Audit and Faculty Profile.

Run locally from this folder:
`python -m http.server 5500`
Then open `http://localhost:5500/`.

Backend default: `http://localhost:3000`.
Never put MongoDB, Notion or AI secrets in frontend files.
