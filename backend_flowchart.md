# Hostel Backend API - Complete Flow Chart & Specification

## System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Admin Panel   │    │  Setup Scripts  │
│  (Student App)  │    │   (Dashboard)   │    │ (Admin Creation)│
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Express Server │
                    │  (Rate Limited) │
                    └─────────┬───────┘
                              │
                    ┌─────────────────┐
                    │   SQLite DB     │
                    │ Students/Admins │
                    │     /Logs       │
                    └─────────────────┘
```

## Database Schema Design

### Students Table

```
students
├── enrollment_id (PRIMARY KEY) → "2025BCSE093"
├── name → "John Doe"
├── phone_number → "+919876543210"
├── email → "john@example.com"
├── password_hash → bcrypt hashed
├── gender → "M" | "F"
├── batch_year → 2025
├── current_status → 0 (inside) | 1 (outside)
├── created_at → timestamp
└── updated_at → timestamp
```

### Admins Table

```
admins
├── id (PRIMARY KEY, AUTO_INCREMENT)
├── username → unique admin identifier
├── password_hash → bcrypt hashed
├── name → "Admin Name"
├── role → "super_admin" | "admin"
├── created_at → timestamp
└── updated_at → timestamp
```

### Logs Table

```
logs
├── id (PRIMARY KEY, AUTO_INCREMENT)
├── enrollment_id (FOREIGN KEY → students.enrollment_id)
├── action_type → "IN" | "OUT"
├── timestamp → when action occurred
├── previous_status → 0 | 1
├── new_status → 0 | 1
└── created_at → auto timestamp
```

## User Authentication Flow

```
Student Registration Flow:
┌─────────────────┐
│ POST /register  │
└─────────┬───────┘
          │
    ┌─────▼─────┐
    │ Validate  │
    │   Data    │
    └─────┬─────┘
          │
    ┌─────▼─────┐    ┌─────────────┐
    │Check if   │───▶│Return Error │
    │Exists     │    │409 Conflict │
    └─────┬─────┘    └─────────────┘
          │ No
    ┌─────▼─────┐
    │Hash Pass  │
    │Create User│
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Return JWT │
    │   Token   │
    └───────────┘

Student Login Flow:
┌─────────────────┐
│ POST /login     │
└─────────┬───────┘
          │
    ┌─────▼─────┐    ┌─────────────┐
    │Rate Limit │───▶│Return Error │
    │Check 6/min│    │429 Too Many │
    └─────┬─────┘    └─────────────┘
          │ OK
    ┌─────▼─────┐    ┌─────────────┐
    │Find User &│───▶│Return Error │
    │Check Pass │    │401 Unauth   │
    └─────┬─────┘    └─────────────┘
          │ Valid
    ┌─────▼─────┐
    │Generate   │
    │JWT Token  │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Return     │
    │Token +    │
    │User Info  │
    └───────────┘
```

## Student API Endpoints Flow

### Status Toggle Flow (Most Critical)

```
POST /api/student/toggle-status
          │
    ┌─────▼─────┐    ┌─────────────┐
    │JWT Auth   │───▶│Return 401   │
    │Middleware │    │Unauthorized │
    └─────┬─────┘    └─────────────┘
          │ Valid
    ┌─────▼─────┐
    │Get Current│
    │User Status│
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Toggle:    │
    │0→1 or 1→0 │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Update DB &│
    │Create Log │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Return New │
    │Status +   │
    │Timestamp  │
    └───────────┘

Log Entry Creation:
┌─────────────────┐
│ Status: 0 → 1   │ (Going OUT)
│ Log: "OUT"      │
│ Timestamp: Now  │
└─────────────────┘

┌─────────────────┐
│ Status: 1 → 0   │ (Coming IN)
│ Log: "IN"       │
│ Timestamp: Now  │
└─────────────────┘
```

### Get User Info Flow

```
GET /api/student/info
          │
    ┌─────▼─────┐    ┌─────────────┐
    │JWT Auth   │───▶│Return 401   │
    │Check      │    │Unauthorized │
    └─────┬─────┘    └─────────────┘
          │ Valid
    ┌─────▼─────┐
    │Query User │
    │Data from  │
    │Token ID   │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Remove     │
    │Password   │
    │Hash       │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Return     │
    │Clean User │
    │Object     │
    └───────────┘
```

## Admin System Flow

### Admin Dashboard Data Flow

```
GET /api/admin/students?page=1
          │
    ┌─────▼─────┐    ┌─────────────┐
    │Admin JWT  │───▶│Return 403   │
    │Auth Check │    │Forbidden    │
    └─────┬─────┘    └─────────────┘
          │ Valid
    ┌─────▼─────┐
    │Calculate  │
    │Offset:    │
    │(page-1)*100│
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Query Latest│
    │Log for Each│
    │Student    │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Sort Logic:│
    │1. Status  │
    │2. Time    │
    │3. Name    │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Return 100 │
    │Records +  │
    │Pagination │
    └───────────┘

Sorting Priority:
1. Status 1 (Outside) → comes first
2. Within Status 1: Recent out-time → then name
3. Status 0 (Inside) → comes second
4. Within Status 0: Recent in-time → then name
5. No logs → Status 0, lowest priority
```

### Individual Student Query Flow

```
GET /api/admin/student/:enrollmentId?page=1
          │
    ┌─────▼─────┐    ┌─────────────┐
    │Admin Auth │───▶│Return 403   │
    │+ Validate │    │Forbidden    │
    │Enrollment │    └─────────────┘
    └─────┬─────┘
          │ Valid
    ┌─────▼─────┐    ┌─────────────┐
    │Find       │───▶│Return 404   │
    │Student    │    │Not Found    │
    └─────┬─────┘    └─────────────┘
          │ Found
    ┌─────▼─────┐
    │Get Student│
    │Info +     │
    │100 Logs   │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Sort Logs  │
    │Recent     │
    │First      │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Return     │
    │Combined   │
    │Data       │
    └───────────┘
```

## Security Implementation Details

### Rate Limiting Strategy

```
User Endpoints:
├── /login → 6 requests/minute → 10min cooldown
├── /register → 3 requests/minute → 5min cooldown
├── /status → 30 requests/minute
├── /toggle → 10 requests/minute
└── /info → 20 requests/minute

Admin Endpoints:
├── /admin/login → 10 requests/minute → 5min cooldown
├── /admin/students → 60 requests/minute
└── /admin/student/:id → 100 requests/minute
```

### JWT Token Structure

```json
{
  "payload": {
    "enrollment_id": "2025BCSE093",
    "type": "student", // or "admin"
    "iat": 1234567890,
    "exp": 1234567890 // 24 hours for students, 8 hours for admins
  }
}
```

### Validation Rules

```
Enrollment ID Format:
├── Pattern: /^(20[0-9]{2})(B)(CSE|ECE|ME|CE|IT)([0-9]{3})$/
├── Year: 2020-2030 (configurable)
├── 'B' is fixed (Bachelor's)
├── Branch: CSE, ECE, ME, CE, IT (expandable)
└── Number: 001-999

Phone Number:
├── Pattern: /^(\+91)?[6-9][0-9]{9}$/
├── Must be Indian mobile number
└── Optional +91 prefix

Password:
├── Minimum 8 characters
├── Must contain: letter + number
└── Special characters optional but recommended

Email:
├── Standard email validation
├── Must be unique
└── Case-insensitive storage
```

## Error Handling Framework

### Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid enrollment number format",
    "details": {
      "field": "enrollment_id",
      "expected": "2025BCSE093",
      "received": "invalid_format"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### HTTP Status Code Usage

```
200 OK → Successful operations
201 Created → User registration success
400 Bad Request → Validation errors
401 Unauthorized → Invalid/missing JWT
403 Forbidden → Admin access required
404 Not Found → Resource not found
409 Conflict → User already exists
429 Too Many Requests → Rate limit exceeded
500 Internal Server Error → Server errors
```

## API Response Formats

### Student Responses

```json
// Registration/Login Success
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "enrollment_id": "2025BCSE093",
      "name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+919876543210",
      "gender": "M",
      "batch_year": 2025,
      "current_status": 0
    }
  }
}

// Status Toggle Success
{
  "success": true,
  "data": {
    "previous_status": 0,
    "new_status": 1,
    "timestamp": "2024-01-01T12:00:00Z",
    "message": "Status updated: You are now outside"
  }
}
```

### Admin Responses

```json
// Students List (Page)
{
  "success": true,
  "data": {
    "students": [
      {
        "enrollment_id": "2025BCSE093",
        "name": "John Doe",
        "phone_number": "+919876543210",
        "time_in": "2024-01-01T08:00:00Z",
        "time_out": null,
        "current_status": 0
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 15,
      "total_students": 1500,
      "per_page": 100
    }
  }
}

// Individual Student Data
{
  "success": true,
  "data": {
    "student": {
      "enrollment_id": "2025BCSE093",
      "name": "John Doe",
      "phone_number": "+919876543210",
      "email": "john@example.com",
      "gender": "M",
      "batch_year": 2025,
      "current_status": 0
    },
    "logs": [
      {
        "action_type": "OUT",
        "timestamp": "2024-01-01T10:00:00Z",
        "previous_status": 0,
        "new_status": 1
      },
      {
        "action_type": "IN",
        "timestamp": "2024-01-01T18:00:00Z",
        "previous_status": 1,
        "new_status": 0
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_logs": 250
    }
  }
}
```

## Setup & Initialization Process

### Admin Creation Script Flow

```
node scripts/create-admin.js
          │
    ┌─────▼─────┐
    │Prompt for:│
    │- Username │
    │- Password │
    │- Name     │
    │- Role     │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Validate   │
    │Input Data │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Hash       │
    │Password   │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Insert to  │
    │Admins     │
    │Table      │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │Display    │
    │Success    │
    │Message    │
    └───────────┘
```

### Database Migration Flow

```
1. Create tables in order:
   ├── students (base table)
   ├── admins (independent)
   └── logs (foreign key to students)

2. Create indexes:
   ├── students.enrollment_id (primary)
   ├── students.email (unique)
   ├── logs.enrollment_id (foreign)
   ├── logs.timestamp (for sorting)
   └── logs.action_type (for filtering)

3. Create triggers:
   ├── Update students.current_status on log insert
   └── Update students.updated_at on any change
```

## Testing Strategy

### Unit Tests Required

```
Authentication:
├── JWT token generation/validation
├── Password hashing/comparison
├── Rate limiting functionality
└── Input validation rules

Database Operations:
├── User CRUD operations
├── Log creation and queries
├── Admin dashboard data retrieval
└── Sorting and pagination logic

API Endpoints:
├── All user endpoints with auth
├── All admin endpoints with auth
├── Error handling scenarios
└── Rate limit enforcement
```

### Integration Tests

```
User Flows:
├── Complete registration → login → toggle status
├── Status toggle → log creation → admin visibility
└── Rate limit triggering → cooldown → recovery

Admin Flows:
├── Dashboard pagination and sorting
├── Individual student data retrieval
└── Authentication and authorization
```

## Performance Considerations

### Database Optimization

```
Indexes Required:
├── students.enrollment_id (clustered)
├── students.email (unique)
├── logs.enrollment_id + timestamp (composite)
├── logs.timestamp (for admin queries)
└── logs.action_type (optional, for filtering)

Query Optimization:
├── Limit results with OFFSET/LIMIT
├── Use prepared statements
├── Cache frequently accessed data
└── Consider connection pooling
```

### Scalability Notes

```
Current Design Handles:
├── ~10,000 students comfortably
├── ~1 million log entries
├── ~100 concurrent users
└── Standard hostel requirements

For Higher Scale:
├── Consider PostgreSQL migration
├── Implement Redis caching
├── Add database replication
└── Use microservices architecture
```

This specification provides a comprehensive blueprint for building your hostel backend API with proper security, validation, and scalability considerations.
