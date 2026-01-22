---
name: code-detector
description: Analyze and validate generated code against schema definitions, detecting issues and inconsistencies
---

# Code Detector

## Overview
Analyze generated code to ensure it correctly implements schema definitions. Detect missing fields, validation errors, type mismatches, and relationship handling issues in both backend and frontend code.

## Quick Start
```bash
# Analyze backend code
python scripts/detect_backend.py ./backend --schema ../entity_schema.json

# Analyze frontend code
python scripts/detect_frontend.py ./frontend --schema ../entity_schema.json

# Full analysis
python scripts/analyze_all.py ./backend ./frontend --schema ../entity_schema.json
```

## Detection Categories

### 1. Backend Code Analysis (Go)

#### DTO Validation
**Checks:**
- ✅ All required fields present in DTO
- ✅ Validation tags match schema requirements
- ✅ Field types match schema types
- ✅ Enum values included in validation
- ✅ Optional fields use `omitempty`

**Example Issues Detected:**
```go
// ❌ Missing validation tag
type CreateDTO struct {
    Email string `json:"email"`  // Should have validate:"required,email"
}

// ❌ Wrong type
type CreateDTO struct {
    Age string `json:"age"`  // Should be int
}

// ❌ Missing enum values
type CreateDTO struct {
    Role string `json:"role" validate:"required"`  // Missing oneof
}
```

#### Service Implementation
**Checks:**
- ✅ Password hashing for password fields
- ✅ Relationship handling (SetID, AddIDs)
- ✅ Optional field checks
- ✅ Soft delete implementation
- ✅ Enum type conversion

**Example Issues Detected:**
```go
// ❌ Missing password hashing
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.User, error) {
    return s.client.User.Create().
        SetPassword(dto.Password).  // Should hash password
        Save(ctx)
}

// ❌ Missing optional field check
func (s *Service) Update(ctx context.Context, dto *UpdateDTO) (*_gen.User, error) {
    return s.client.User.UpdateOneID(dto.ID).
        SetPhone(dto.Phone).  // Should check if empty
        Save(ctx)
}
```

#### Controller Implementation
**Checks:**
- ✅ Proper error handling with status codes
- ✅ JSON binding validation
- ✅ Consistent response format
- ✅ ID extraction from URL params
- ✅ Context passing

#### Ent Schema
**Checks:**
- ✅ Field types match schema types
- ✅ Validation constraints applied
- ✅ Indexes defined correctly
- ✅ Relationships configured
- ✅ Soft delete fields present

### 2. Frontend Code Analysis (TypeScript/React)

#### Type Definitions
**Checks:**
- ✅ All schema fields in types
- ✅ Correct TypeScript types
- ✅ Optional fields marked with `?`
- ✅ Enum types generated
- ✅ Relationship types included

**Example Issues Detected:**
```typescript
// ❌ Missing field
interface User {
  email: string;
  name: string;
  // Missing: age: number
}

// ❌ Wrong type
interface User {
  age: string;  // Should be number
}
```

#### API Client
**Checks:**
- ✅ All CRUD methods present
- ✅ Correct request types
- ✅ Response type handling
- ✅ Error handling
- ✅ Relationship query parameters

#### Form Components
**Checks:**
- ✅ Zod schema matches entity schema
- ✅ All fields rendered
- ✅ Validation rules applied
- ✅ Required field indicators
- ✅ File upload handling

#### Table Components
**Checks:**
- ✅ All columns defined
- ✅ Correct column types
- ✅ Sort functionality
- ✅ Search implementation
- ✅ Pagination handling

## Detection Scripts

### `detect_backend.py`
Analyzes Go backend code for schema compliance.

**Usage:**
```bash
python scripts/detect_backend.py ./backend --schema ../entity_schema.json --entity User
```

**Output:**
```
✅ User DTO: All fields present
❌ User Service: Missing password hashing in Create
✅ User Controller: All endpoints valid
⚠️  User Schema: Missing index on email
```

### `detect_frontend.py`
Analyzes TypeScript/React frontend code.

**Usage:**
```bash
python scripts/detect_frontend.py ./frontend --schema ../entity_schema.json --entity User
```

**Output:**
```
✅ User types: Complete
❌ User API: Missing bulk operations
✅ User Form: All fields present
⚠️  User Table: Missing export functionality
```

### `analyze_all.py`
Full-stack analysis of both backend and frontend.

**Usage:**
```bash
python scripts/analyze_all.py ./backend ./frontend --schema ../entity_schema.json
```

**Output:**
```
=== User Module Analysis ===

Backend:
  DTO: ✅ Valid
  Service: ❌ 2 issues
  Controller: ✅ Valid
  Schema: ⚠️ 1 warning

Frontend:
  Types: ✅ Valid
  API: ⚠️ 1 warning
  Form: ✅ Valid
  Table: ⚠️ 1 warning

Total: 2 errors, 3 warnings
```

## Common Issues

### Backend Issues

#### 1. Missing Password Hashing
**Problem:** Passwords stored in plain text
**Fix:** Add bcrypt hashing in service
```go
hashedPassword, err := bcrypt.GenerateFromPassword([]byte(dto.Password), bcrypt.DefaultCost)
```

#### 2. Missing Optional Field Checks
**Problem:** Always setting optional fields
**Fix:** Check before setting
```go
if dto.Phone != "" {
    builder.SetPhone(dto.Phone)
}
```

#### 3. Missing Relationship Handling
**Problem:** Foreign keys not set correctly
**Fix:** Use proper relation methods
```go
builder.SetAuthorID(dto.AuthorID)  // many2One
builder.AddCategoryIDs(dto.CategoryIDs...)  // many2Many
```

#### 4. Missing Soft Delete
**Problem:** Hard delete instead of soft delete
**Fix:** Update with deleted_at
```go
return s.client.User.UpdateOneID(id).
    SetDeletedAt(time.Now()).
    Exec(ctx)
```

### Frontend Issues

#### 1. Missing Validation
**Problem:** Form accepts invalid data
**Fix:** Use Zod schema matching entity
```typescript
const schema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(6).max(72),
});
```

#### 2. Missing Error Handling
**Problem:** API calls fail silently
**Fix:** Proper try-catch with error messages
```typescript
try {
  const result = await api.user.create(data);
} catch (error) {
  toast.error(error.message);
}
```

#### 3. Missing Loading States
**Problem:** UI appears broken during loading
**Fix:** Show loading indicators
```typescript
if (loading) return <Spinner />;
```

#### 4. Missing Empty States
**Problem:** Empty tables show nothing
**Fix:** Show empty state message
```typescript
if (data.length === 0) {
  return <EmptyState message="No users found" />;
}
```

## Validation Rules Mapping

### Schema to Backend
| Schema Type | Go Type | Validation | Example |
|-------------|---------|------------|---------|
| `string` | `string` | `validate:"required"` | `Name string` |
| `string` + email | `string` | `validate:"email"` | `Email string` |
| `integer` | `int` | `validate:"min=0"` | `Age int` |
| `number` | `float64` | `validate:"min=0"` | `Price float64` |
| `boolean` | `bool` | - | `Active bool` |
| `enum` | `string` | `validate:"oneof=..."` | `Role string` |
| `password` | `string` | `validate:"required,min=6"` | `Password string` |
| `datetime` | `time.Time` | - | `CreatedAt time.Time` |

### Schema to Frontend
| Schema Type | TS Type | Zod Validation | React Component |
|-------------|---------|----------------|-----------------|
| `string` | `string` | `z.string()` | `Input` |
| `string` + email | `string` | `z.string().email()` | `Input type="email"` |
| `integer` | `number` | `z.number().int()` | `Input type="number"` |
| `number` | `number` | `z.number()` | `Input type="number"` |
| `boolean` | `boolean` | `z.boolean()` | `Checkbox` |
| `enum` | `string` | `z.enum([...])` | `Select` |
| `password` | `string` | `z.string().min(6)` | `Input type="password"` |
| `datetime` | `Date` | `z.date()` | `DatePicker` |

## Integration

### With CI/CD
```yaml
# .github/workflows/code-quality.yml
- name: Detect Code Issues
  run: |
    python skills/code-detector/scripts/analyze_all.py \
      ./backend ./frontend \
      --schema schema/entity_schema.json
```

### With Pre-commit
```bash
# .git/hooks/pre-commit
python skills/code-detector/scripts/analyze_all.py ./backend ./frontend --schema schema/entity_schema.json
if [ $? -ne 0 ]; then
  echo "Code quality checks failed"
  exit 1
fi
```

## Resources

### Scripts
- `scripts/detect_backend.py` - Backend code analyzer
- `scripts/detect_frontend.py` - Frontend code analyzer
- `scripts/analyze_all.py` - Full-stack analyzer

### References
- `references/backend-patterns.md` - Backend issue patterns
- `references/frontend-patterns.md` - Frontend issue patterns
- `references/fix-templates.md` - Automated fix suggestions

### Assets
- `assets/fix-suggestions.json` - Common fixes in JSON format
- `assets/quality-rules.md` - Quality standards checklist

## Best Practices

### Before Generation
1. ✅ Validate schema first
2. ✅ Check all required fields
3. ✅ Verify relationships
4. ✅ Review UI configurations

### After Generation
1. ✅ Run code detection
2. ✅ Fix all errors
3. ✅ Review warnings
4. ✅ Add custom logic
5. ✅ Write tests

### Continuous Quality
1. ✅ Run detection in CI/CD
2. ✅ Use pre-commit hooks
3. ✅ Review before merging
4. ✅ Track quality metrics

## Troubleshooting

### False Positives
**Issue:** Detection reports errors that aren't real issues
**Solution:** Update detection rules or add exceptions

### Missing Issues
**Issue:** Real problems not detected
**Solution:** Add custom detection rules

### Performance
**Issue:** Detection is slow on large codebases
**Solution:** Use incremental analysis or focus on changed files

## Related Skills
- `backend-developer` - Generates backend code
- `table-developer` - Generates table components
- `form-developer` - Generates form components
