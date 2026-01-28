---
name: backend-developer
description: Generate Go backend code from schema definitions including DTOs, services, controllers, and database schemas
---

# Backend Developer

## Overview
Generate production-ready Go backend code from schema definitions. Creates DTOs with validation, services with business logic, controllers with HTTP endpoints, and Ent database schemas.

## Quick Start
To generate backend code:
1. Provide the schema.json file path
2. Specify output directory
3. Choose which components to generate
4. Review and customize generated code

## Generated Components

### 1. DTO (Data Transfer Object)
**Purpose**: Input/output validation and data transfer

**Generation Rules**:
- Required fields → `validate:"required"`
- Email format → `validate:"email"`
- Numeric min/max (from `min`/`max`) → `validate:"min=X,max=Y"`
- String/array length (from `minLength`/`maxLength`) → `validate:"min=X,max=Y"`
- Enum → `validate:"oneof=val1 val2 val3"`
- Pattern → `validate:"regex=pattern"`
- Optional fields → `omitempty` tag

**Example**:
```go
type CreateDTO struct {
    Email    string `json:"email" validate:"required,email,max=100"`
    Password string `json:"password" validate:"required,min=8"`
    Name     string `json:"name" validate:"required,max=50"`
    Age      int    `json:"age" validate:"min=0,max=150"`
    Role     string `json:"role" validate:"required,oneof=admin editor viewer"`
    Phone    string `json:"phone,omitempty" validate:"omitempty,phone"`
}
```

### 2. Service
**Purpose**: Business logic and data processing

**Generation Rules**:
- Password fields → Add bcrypt hashing
- Relationship fields → Use Ent relations
- Soft delete → Update with deleted_at
- Optional fields → Check before setting
- Enum fields → Type conversion
- Create/Update → Handle all fields

**Example**:
```go
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.User, error) {
    // Password hashing for password fields
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(dto.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }

    builder := s.client.User.Create().
        SetEmail(dto.Email).
        SetPassword(string(hashedPassword)).
        SetName(dto.Name).
        SetAge(dto.Age).
        SetRole(user.Role(dto.Role))

    if dto.Phone != "" {
        builder.SetPhone(dto.Phone)
    }

    return builder.Save(ctx)
}
```

### 3. Controller
**Purpose**: HTTP request handling and response formatting

**Generation Rules**:
- Endpoints: GET, POST, PUT, DELETE, LIST
- Use binding.JSON for validation
- Return consistent response format
- Handle errors with appropriate status codes
- Extract ID from URL params

**Example**:
```go
func (c *Controller) Create(w http.ResponseWriter, r *http.Request) {
    res := c.responderFactory.FromRequest(w, r)

    var dto CreateDTO
    if err := binding.JSON(r, &dto); err != nil {
        res.WriteError(http.StatusBadRequest, responder.Error{Message: err.Error()})
        return
    }

    user, err := c.service.Create(r.Context(), &dto)
    if err != nil {
        res.WriteError(http.StatusInternalServerError, responder.Error{Message: err.Error()})
        return
    }

    res.Write(http.StatusOK, responder.StrapiResponse{
        Data: map[string]any{
            "id":    user.ID,
            "email": user.Email,
            "name":  user.Name,
            "age":   user.Age,
            "role":  user.Role,
        },
    })
}
```

### 4. Module
**Purpose**: Wire up dependencies and configure routes

**Generation Rules**:
- Route prefix from entity name (pluralized)
- All CRUD endpoints
- Consistent URL structure

**Example**:
```go
func (m *Module) Setup(r chi.Router) {
    r.Route("/users", func(r chi.Router) {
        r.Get("/", m.controller.List)
        r.Get("/{id}", m.controller.Get)
        r.Post("/", m.controller.Create)
        r.Put("/{id}", m.controller.Update)
        r.Delete("/{id}", m.controller.Delete)
    })
}
```

### 5. Ent Schema (Optional)
**Purpose**: Database schema definition

**Generation Rules**:
- Map schema types to Ent field types
- Add validation constraints
- Generate indexes
- Handle relationships

**Example**:
```go
func (User) Fields() []ent.Field {
    return []ent.Field{
        field.String("email").Unique().NotEmpty(),
        field.String("password").Sensitive().NotEmpty(),
        field.String("name").NotEmpty().MaxLen(50),
        field.Int("age").Range(0, 150),
        field.Enum("role").Values("admin", "editor", "viewer"),
        field.String("phone").Optional(),
        field.Time("deleted_at").Optional().Nillable(),
    }
}

func (User) Indexes() []ent.Index {
    return []ent.Index{
        index.Fields("email").Unique(),
    }
}
```

## Usage Examples

### Generate Complete Backend
```bash
# Generate all components
python scripts/generate_go.py schema.json --output ./backend

# Generate with Ent schema
python scripts/generate_go.py schema.json --output ./backend --include-ent

# Generate with tests
python scripts/generate_go.py schema.json --output ./backend --include-tests
```

### Generate Specific Components
```bash
# Generate only DTO
python scripts/generate_go.py schema.json --only dto

# Generate only Service
python scripts/generate_go.py schema.json --only service

# Generate only Controller
python scripts/generate_go.py schema.json --only controller

# Generate multiple components
python scripts/generate_go.py schema.json --only dto,service,controller
```

### Advanced Options
```bash
# With soft delete support
python scripts/generate_go.py schema.json --soft-delete

# With custom output directory
python scripts/generate_go.py schema.json --output ./modules/user

# With custom template
python scripts/generate_go.py schema.json --template custom.go.tmpl
```

## Field Type Mapping

### Basic Types
- `string` → `field.String()`
- `text` → `field.Text()`
- `integer` → `field.Int()`
- `number` → `field.Float()`
- `boolean` → `field.Bool()`
- `enum` → `field.Enum().Values()`
- `datetime` → `field.Time()`
- `password` → `field.String().Sensitive()`
- `uid` → `field.String().Unique()`
- `version` → `field.Int()`

### Complex Types
- `json` → `field.JSON()`
- `array` → `field.JSON()` or separate table
- `object` → `field.JSON()` or embedded struct
- `media` → `field.String()` (stores file paths)

### Relationship Types
- `many2One` → `field.String()` + relation
- `one2Many` → `edge.To()`
- `many2Many` → `edge.To().Through()`
- `one2One` → `edge.To().Unique()`

## Validation Mapping

### Ent Validation
```go
// Required
field.String("name").NotEmpty()

// Min/Max
field.Int("age").Range(0, 150)
field.String("name").MinLen(3).MaxLen(50)

// Pattern
field.String("email").Match(regexp.MustCompile(`^.+@.+$`))

// Unique
field.String("email").Unique()

// Optional
field.String("phone").Optional()

// Sensitive (password)
field.String("password").Sensitive()
```

### Go DTO Validation
```go
// Required
validate:"required"

// Email
validate:"email"

// Min/Max (numbers) or Min/Max length (strings)
validate:"min=3,max=50"

// Enum
validate:"oneof=admin editor viewer"

// Pattern
validate:"regex=^.+@.+$"

// Optional
// No validation tag, use omitempty
```

## Relationship Handling

### Many-to-One
```go
// Schema
{
  "author": {
    "$ref": "User",
    "x-relation": { "type": "many2One", "labelField": "name" }
  }
}

// Generated Service
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.Article, error) {
    return s.client.Article.Create().
        SetTitle(dto.Title).
        SetAuthorID(dto.AuthorID). // Foreign key
        Save(ctx)
}
```

### One-to-Many
```go
// Schema
{
  "posts": {
    "$ref": "Post",
    "x-relation": { "type": "one2Many", "labelField": "title" }
  }
}

// Generated Service
func (s *Service) GetWithPosts(ctx context.Context, id string) (*_gen.User, error) {
    return s.client.User.Query().
        WithPosts().
        Only(ctx)
}
```

### Many-to-Many
```go
// Schema
{
  "roles": {
    "$ref": "Role",
    "x-relation": { "type": "many2Many", "labelField": "name" }
  }
}

// Generated Service
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.User, error) {
    return s.client.User.Create().
        SetEmail(dto.Email).
        AddRoleIDs(dto.RoleIDs...).
        Save(ctx)
}
```

## Soft Delete Support

### Ent Schema
```go
func (User) Fields() []ent.Field {
    return []ent.Field{
        // ... other fields
        field.Time("deleted_at").Optional().Nillable(),
    }
}
```

### Service Update
```go
func (s *Service) Delete(ctx context.Context, id string) error {
    // Soft delete
    return s.client.User.UpdateOneID(id).
        SetDeletedAt(time.Now()).
        Exec(ctx)
}

func (s *Service) List(ctx context.Context, page, pageSize int) ([]*_gen.User, error) {
    return s.client.User.Query().
        Where(user.DeletedAtIsNil()).
        Offset((page - 1) * pageSize).
        Limit(pageSize).
        All(ctx)
}
```

## Index Generation

### Unique Index
```go
// Schema
{ "type": "unique", "columns": ["email"] }

// Generated
index.Fields("email").Unique()
```

### Regular Index
```go
// Schema
{ "type": "index", "columns": ["created_at"] }

// Generated
index.Fields("created_at")
```

### Composite Index
```go
// Schema
{ "type": "index", "columns": ["status", "created_at"] }

// Generated
index.Fields("status", "created_at")
```

## Error Handling

### Controller Error Responses
```go
// Bad Request (validation error)
res.WriteError(http.StatusBadRequest, responder.Error{Message: err.Error()})

// Not Found
res.WriteError(http.StatusNotFound, responder.Error{Message: "User not found"})

// Internal Server Error
res.WriteError(http.StatusInternalServerError, responder.Error{Message: err.Error()})
```

### Service Error Handling
```go
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.User, error) {
    // Check if email exists
    exists, err := s.client.User.Query().
        Where(user.Email(dto.Email)).
        Exist(ctx)
    if err != nil {
        return nil, err
    }
    if exists {
        return nil, fmt.Errorf("email already exists")
    }

    return s.client.User.Create().Save(ctx)
}
```

## Response Format

### Standard Response
```go
res.Write(http.StatusOK, responder.StrapiResponse{
    Data: map[string]any{
        "id":    entity.ID,
        "field": entity.Field,
    },
})
```

### List Response
```go
data := make([]map[string]any, len(entities))
for i, entity := range entities {
    data[i] = map[string]any{
        "id":    entity.ID,
        "field": entity.Field,
    }
}

res.Write(http.StatusOK, responder.StrapiResponse{
    Data: data,
})
```

## Customization

### Custom Templates
```bash
python scripts/generate_go.py schema.json --template custom.tmpl
```

Template variables:
- `{{.EntityName}}` - Entity name (PascalCase)
- `{{.Fields}}` - Field definitions
- `{{.Validations}}` - Validation rules
- `{{.Relations}}` - Relationship definitions

### Post-Generation Hook
```bash
python scripts/generate_go.py schema.json --hook ./scripts/post-generate.sh
```

### Field Presets
```json
{
  "presets": {
    "timestamps": ["created_at", "updated_at"],
    "softDelete": ["deleted_at", "is_deleted"],
    "creator": ["created_by", "created_by_user"]
  }
}
```

## Resources

### Scripts
- `scripts/generate_go.py` - Main generation script
- `scripts/generate_all.py` - Generate all components
- `scripts/validate_schema.py` - Validate before generation

### References
- `references/ent-field-types.md` - Ent field type mapping
- `references/validation-patterns.md` - Validation examples
- `references/relationship-patterns.md` - Relationship examples
- `references/error-handling.md` - Error handling patterns

### Assets
- `assets/templates/` - Go code templates
- `assets/examples/` - Complete example modules
- `assets/presets/` - Common field presets

## Best Practices

### Before Generation
1. ✅ Validate schema first
2. ✅ Check all required fields
3. ✅ Verify relationship definitions
4. ✅ Add appropriate UI configurations

### After Generation
1. ✅ Review generated code
2. ✅ Add custom business logic
3. ✅ Write tests
4. ✅ Update documentation

### Code Quality
- ✅ Type safety
- ✅ Error handling
- ✅ Input validation
- ✅ Security (password hashing)
- ✅ Consistent patterns
- ✅ Proper imports

## Integration

### With Schema Validator
```bash
# Validate schema first
python ../schema-validator/scripts/validate_schema.py schema.json

# Then generate code
python scripts/generate_go.py schema.json --output ./backend
```

### With Frontend Generator
```bash
# Generate backend
python scripts/generate_go.py schema.json --output ./backend

# Generate frontend
python ../table-developer/scripts/generate_table.py schema.json --output ./frontend
```

## Common Patterns

### User Management
```go
// DTO
type CreateDTO struct {
    Email    string `json:"email" validate:"required,email,max=100"`
    Password string `json:"password" validate:"required,min=8"`
    Name     string `json:"name" validate:"required,max=50"`
    Role     string `json:"role" validate:"required,oneof=admin editor viewer"`
}

// Service
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.User, error) {
    hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(dto.Password), bcrypt.DefaultCost)
    return s.client.User.Create().
        SetEmail(dto.Email).
        SetPassword(string(hashedPassword)).
        SetName(dto.Name).
        SetRole(user.Role(dto.Role)).
        Save(ctx)
}

// Controller
func (c *Controller) Create(w http.ResponseWriter, r *http.Request) {
    var dto CreateDTO
    if err := binding.JSON(r, &dto); err != nil {
        res.WriteError(http.StatusBadRequest, responder.Error{Message: err.Error()})
        return
    }
    user, err := c.service.Create(r.Context(), &dto)
    // ... handle response
}
```

### Content Management
```go
// With relationships
type CreateDTO struct {
    Title      string   `json:"title" validate:"required"`
    Content    string   `json:"content" validate:"required"`
    AuthorID   string   `json:"authorId" validate:"required"`
    CategoryIDs []string `json:"categoryIds"`
}

func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.Article, error) {
    builder := s.client.Article.Create().
        SetTitle(dto.Title).
        SetContent(dto.Content).
        SetAuthorID(dto.AuthorID)

    if len(dto.CategoryIDs) > 0 {
        builder.AddCategoryIDs(dto.CategoryIDs...)
    }

    return builder.Save(ctx)
}
```

## Troubleshooting

### Common Issues

**Missing imports**
- Ensure all dependencies are in go.mod
- Run `go mod tidy` after generation

**Validation not working**
- Check struct tags are correct
- Verify validator is registered

**Relationship errors**
- Ensure foreign key fields are set
- Check relationship definitions in Ent schema

**Database migration issues**
- Generate Ent schema first
- Run `go generate ./ent`

## Related Skills
- `table-developer` - Generate frontend table components
- `form-developer` - Generate frontend form components
- `schema-validator` - Validate schemas before generation