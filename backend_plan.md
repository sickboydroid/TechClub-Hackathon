# Hostel Backend Specification (Node.js)

## Tech

- Node.js with Express
- Any libraries allowed (Sequelize/SQLite, bcrypt, JWT, express-rate-limit, etc.)
- Environment config for secrets

---

## Database

- **Students**
  - enrollment id (primary key, e.g., `25BCSE093`)
  - name
  - phone number (indian phone number)
  - email
  - password hash
  - gender (M/F)
  - batch year (e.g., `2023`)
- **Admins** (added manually, no registration endpoint), just create a script that asks the admin details and is added then
- **Logs**
  - each student has following things:
    - first its details given on registration
    - current status in/out status (0 = inside collage , 1 = outside collage)
    - for each student there are logs based when he left and when he got into collage, their timestamps
    - for the latest outside log, inside time is nothing (choose something that represents it)

---

## Security & Validation

- Password ≥ 8 chars
- Enrollment number format validation (e.g 2025BCSE093, notice the year then B then branch (which can be different) and number, that is the format)
- Phone number validation
- Batch must be valid year so gender and email
- Rate limits:
  - User login: max 6 tries/minute → cooldown
  - Other requests: reasonable limit
  - Admin: slightly more lenient, but still restricted
- Only logged-in user can access own data (and not others). security is of utmost importance
- Admin endpoints must be strongly authenticated
- Toggle requests require HMAC/hash verification

---

## User Features

1. **Register**
   - Data: enrollment id, name, phone number, email, password, geneder, batch
   - Store hashed password
2. **Login**
   - Input: enrollment id + password
   - Apply rate limit (6/min)
3. **Get Status**
   - Returns `0` (inside) or `1` (outside)
   - Must be authenticated, only for self
4. **Get User Info**
   - Returns the user info (except for password)
   - Same security constraints
5. **Toggle Status**
   - Switch 0 ↔ 1
   - Insert log entry for the owneer
   - make sure the user owning the account has requested

---

## Admin Features

1. **Login**
   - Separate system, no self-registration, but create a script that can be used to add new accounts
   - Strong validation + rate limits (but less strict than users)
2. **Page Request**
   - Input: page number (100 entries/page)
   - Return latest log for each student
   - each log contains 5 things (enrollment number, name, phone number, time in, time out)
   - Sorted order:
     - Compare status first → `1` (outside) before `0`
       - If both `1`: recent out-time first → then name
       - If both `0`: recent in-time first → then name
       - If no entries: default `0` (inside), lowest priority
3. **Student info request**
   - Input: enrollment id + page index
   - Return student details + 100 logs (per sorting rules, only for that student)

---

ik it requires some server side collaboration so at the end you can create an example js that will
make the requested as intented
make sure the error handling is correct

before building clarify if you have any doubts
