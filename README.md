# Digital Streaming Operations Runbook Website

A static, responsive website for the News Desk Operator Verification Guide.

## Run locally

Open `index.html` in a modern browser.

For the most reliable local behavior, run a simple web server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Features

- Responsive navigation and search
- Eight interactive operator runbooks
- Quickplay and ADit dashboard checks
- Printable individual pages or the full guide
- Engineering reference, failure matrix, and escalation matrix
- Incident worksheet with browser save and JSON download
- No server or database required

## Deployment

Upload the folder to any static host, including GitHub Pages, Netlify, Cloudflare Pages, S3 static hosting, or a station intranet web server.


Landscape print layout enabled with increased flowchart spacing.

Connector label collision avoidance added; YES/NO labels now sit near branch origins.

Flowchart nodes and fonts reduced by 20%. Connectors now use dedicated non-overlapping orthogonal channels.

YES/NO response tags are now positioned directly adjacent to their source question geometry.

Stream Down now uses a dedicated fixed layout and connector map to prevent jumbling.

Stream Down YES branch from Website now terminates at the top of the Mobile App question; branch channels widened.

Flowchart behavior corrected: only yellow question boxes originate YES/NO branches; contact and outcome boxes are terminal.

Terminal-node cleanup applied globally: contact/information boxes have exact edge termination, no overshoot, and no outgoing lines.

Removed the Stream Down visual connection between Contact Engineering and Contact Master Control; each terminal now has a fully independent incoming route.

Wrong Program Streaming: Contact Engineering response line straightened with a dedicated horizontal connector.

Streaming System Overview compacted to a single horizontal lane with reduced geometry and type.
