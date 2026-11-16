# StudyFlow — Local Setup and User Guide

StudyFlow combines read-only CityU Canvas assignments with tasks and events extracted from documents and images. This is a single-account prototype for local use. A fresh installation starts with an empty workspace.

## 1. Download and install

Install Git and Node.js 24.15 or later in the Node.js 24 release line. Open PowerShell and run the following commands, replacing `OWNER/REPOSITORY` with the path shown on the repository's GitHub page.

```powershell
git clone https://github.com/OWNER/REPOSITORY.git StudyFlow
cd StudyFlow
npm ci
```

If you downloaded the ZIP instead, extract it and open PowerShell in the folder containing `package.json`. Run `npm ci` from there.

## 2. Configure your own credentials

Copy the empty configuration template and open the local copy. If `.env.local` already exists, open it directly.

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
notepad .env.local
```

```dotenv
CANVAS_ACCESS_TOKEN=
DEEPSEEK_API_KEY=
```

- **Canvas.** Sign in at [CityU Canvas](https://canvas.cityu.edu.hk/), open **Account → Settings → New Access Token**, and generate a short-lived token for personal testing. Paste it after `CANVAS_ACCESS_TOKEN=` on the same line.
- **DeepSeek.** Create an API key in the [DeepSeek platform](https://platform.deepseek.com/). Paste it after `DEEPSEEK_API_KEY=` on the same line.

Each credential enables its own feature. You can leave the other entry blank. Save the file before starting StudyFlow and restart the server after any configuration change. The repository contains only the empty `.env.example` template. Keep `.env.local` and any recordings showing it off GitHub. Run this single-account prototype on the local address below.

## 3. Start StudyFlow

```powershell
npm run dev
```

Keep PowerShell open and visit [http://127.0.0.1:3001](http://127.0.0.1:3001). To use a production build, stop the development server with **Ctrl+C**, then run `npm run build` followed by `npm run start`.

## 4. Sync Canvas assignments

- The first sync runs when StudyFlow opens. Use **Sync Canvas** to refresh manually. StudyFlow also checks every five minutes while its page is visible.
- Open **My Tasks**, **Deadlines**, or **Calendar** to find imported assignments. **Group Projects** shows group assignments and any team roster that Canvas exposes to your account. Dashboard shows weekly deadline counts.
- In **Group Projects**, each Canvas assignment is listed under **Official from Canvas** with a read-only badge. Under **Team subtasks** you can add your own subtasks, set an internal deadline, assign a teammate, and record who added the item. Internal subtasks are stored only in the current browser, are never sent to Canvas, and survive Canvas syncs. Use **Edit** to change a deadline or delete a subtask, and **Update status** to record progress.
- Canvas supplies assignment dates and submission status. StudyFlow calculates initial priorities from dates. Manual priorities, effort estimates, and notes are retained in the current browser. Undated assignments are hidden in My Tasks by default; turn on **Show tasks without a due date** to reveal them. In **My Tasks**, **Estimate missing times** asks DeepSeek to size the tasks currently shown using only their titles, without overwriting values you entered. When the AI estimate is unavailable, StudyFlow falls back to a local title-based heuristic. New submission deadlines default to 23:59. Deadlines are shown in Hong Kong time. The browser retains the last successful snapshot if a refresh fails.

## 5. Import tasks from documents or photos

1. Open **Import tasks** and choose up to six PDF, PNG, JPEG, or WebP files, up to 8 MB each.
2. Select **Read files**. StudyFlow sends these files to DeepSeek. Flash reads images directly. For PDFs, DeepSeek OCR extracts the text and Flash identifies tasks and dates from that text.
3. Review the proposed titles, dates, times, date types, suggested effort estimates, and source excerpts. Correct uncertain fields and decide what to do with possible duplicates. Effort estimates come from what DeepSeek reads in the document (deliverable size, number of parts, rubric detail, marks, and stated preparation) and can be edited before import; when the document gives no usable signal, StudyFlow falls back to a title-based estimate. Deadline items without a time default to 23:59.
4. Select **Import selected**. Confirmed items appear in **My Tasks** and **Calendar**, and StudyFlow assigns their initial priorities. Files are processed for extraction. The browser stores the confirmed task details and source excerpts.

Try the fictional [Harbour Code Hackathon poster](docs/hackathon-import-test.png). The expected entries are:

| Item | Hong Kong time | Date type |
| --- | --- | --- |
| Registration deadline | 25 Nov 2026, 18:00 | Deadline |
| Kickoff | 5 Dec 2026, 09:30 | Scheduled event |
| Prototype submission | 6 Dec 2026, 16:00 | Deadline |

Open November and December 2026 in **Calendar** to see all three entries. The venue and team size should remain background information.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Canvas workspace is empty | Confirm that the CityU Canvas token is present on the same line as its variable in `.env.local`. Restart StudyFlow, then select **Sync Canvas**. Check the page for an API error. |
| Read files asks for a key | Confirm `DEEPSEEK_API_KEY` is set in the same folder as `package.json`, then restart StudyFlow. |
| DeepSeek rejects the request | Check the key and the API account balance. If only one file fails, retry with that file by itself or with a smaller version. |
| Recognized items do not appear in the planner | Check which rows were selected, then select **Import selected**. Navigate to the month shown in the preview. |
| Port 3001 is in use | Stop the previous StudyFlow process, then try again. |

## Developer checks

```powershell
npm run lint
npm test
npm run build
npm run typecheck
```
