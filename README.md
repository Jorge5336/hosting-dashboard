# TOC / Host Dashboard — Carleton-branded

A lightweight, GitHub Pages–friendly dashboard for TOC applicants, hosts, assignments, and engagement. Styled to align with Carleton brand guidance (Blue #003069, Maize #FFD24F), with licensed font fallbacks.

## Brand alignment
- **Colors:** Blue `#003069` and Maize `#FFD24F` per Carleton Communications.
- **Type:** Prefers Gotham/Surveyor when available; otherwise Inter/system UI.
- **Logos:** Avoids recreating lockups; no C-ray included.
- **Tone:** Clear, accessible, honest microcopy; meets WCAG AA contrast.

References:
- Colors: College Colors page (HEX: Blue #003069, Maize #FFD24F)
- Fonts: Gotham + Surveyor (limited licenses)

## Run
Open `index.html` locally or via GitHub Pages. Data is stored in `localStorage` and can be exported/imported as CSV.

## CSV headers
- Applicants: `id,name,program,state,gender,decision,leadership_review,interview_rec,interest_level,ai_flag`
- Hosts: `id,name,email,phone,building,room,capacity,gender,notes`
- Assignments: `applicant_id,host_id,status`
- Engagement: `applicant_id,invite_sent,attending,checked_in,no_show,notes`
- Comms: `timestamp,recipient,campaign,subject,status,opens,clicks`

## Tests
Open the **Tests** tab to see parsing/render smoke tests.
