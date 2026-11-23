# Student Access With a Class Code

The site is built around one rule: **students never log in.** Only teachers have accounts.
When a teacher wants students on their own devices, the teacher shares a short class code.
Students type it in and see only the parts of the site the teacher has opened for them.

This is a design for a later step. Nothing here is built yet.

## What the Teacher Does

1. On the Classroom Board or the new **Share With Students** page, the teacher picks what students can use, for example:
   - one board screen (view only)
   - Would You Rather (vote on today's question)
   - an exit ticket (answer one question)
   - chosen games or puzzles (Word Guess, Code Breaker, Trivia, the teacher's own escape rooms)
2. The teacher presses **Start Class Code**. The site shows a big code and link on the board, like `TIGER-42`
   and `edsidekick.com/#join`.
3. The code works until the teacher presses **End**, or until the end of the school day.
4. The teacher can change what's open at any time, and students' screens update.

Class codes need a teacher account (that is where the code lives), so they would sit on the Free or Premium plan
(for example: Free = 1 open activity at a time, Premium = several plus live results).

## What Students Do

1. Go to the link and type the code. No email, no password, no account.
2. Optionally type a **first name or nickname**, only when the activity needs one (for example a named exit ticket).
   It is kept on the student's device for that session and never saved in the teacher's account or on the server.
3. They see a simple **Student View**: big buttons for only the activities the teacher opened. There is no menu,
   no Settings, no Sign In, no links out, and no way to reach the teacher's tools.
4. When the teacher ends the code, the Student View says "Class is over" and clears itself.

## What Is Stored (and What Isn't)

| Stored | Where | For how long |
| --- | --- | --- |
| The code, the teacher's account id, the list of open activities, and the teacher's content for them (for example their questions) | The `class_codes` table | Until the code ends, then deleted |
| Votes and answers | Sent live to the teacher's screen only, without names unless the teacher turns names on for that activity | Not saved on the server; the teacher's computer keeps results like today's exit tickets |
| Student names, emails, accounts, device ids, IP logs in our tables | Not stored | — |

This keeps the site inside "no student accounts and no student records online", which is the easiest thing for a district to approve.

## How It Works (Technical)

- **Table** `class_codes`: `code` (primary key), `teacher_id`, `open` (JSON list of activities and their content),
  `expires_at`. Row-level security lets only the teacher read and change their own codes.
- **Students read through one function**, `join_class(code)`, which returns only `open` for a code that hasn't expired.
  Students can't list codes or see anything else. Codes use a 30-letter alphabet (no look-alikes such as O/0, I/1),
  6 characters, so about 700 million possibilities; the function is rate limited.
- **Live votes and answers** use Supabase Realtime "broadcast" on a channel named after the code. Messages pass
  straight to the teacher's open screen and are not written to the database.
- **Student View** is a separate page (`student.html`) that loads only the student versions of the allowed tools,
  so nothing from the teacher side is even downloaded.
- **Cleanup**: a nightly job deletes expired codes.

## Build Order

1. Student View page and `join_class` with view-only board screens and Would You Rather voting.
2. Exit tickets from students' devices, live to the teacher's screen.
3. Games and the teacher's own puzzles and escape rooms.
4. Plan limits and the teacher's "open activities" controls on the board.
