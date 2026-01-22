# Backend Code Patterns

## Common Issues and Fixes

### 1. Password Hashing

#### ❌ Wrong
```go
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.User, error) {
    return s.client.User.Create().
        SetPassword(dto.Password).
        Save(ctx)
}
```

#### ✅ Correct
```go
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.User, error) {
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(dto.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }

    return s.client.User.Create().
        SetPassword(string(hashedPassword)).
        Save(ctx)
}
```

### 2. Optional Field Handling

#### ❌ Wrong
```go
func (s *Service) Update(ctx context.Context, dto *UpdateDTO) (*_gen.User, error) {
    return s.client.User.UpdateOneID(dto.ID).
        SetPhone(dto.Phone).
        Save(ctx)
}
```

#### ✅ Correct
```go
func (s *Service) Update(ctx context.Context, dto *UpdateDTO) (*_gen.User, error) {
    builder := s.client.User.UpdateOneID(dto.ID)

    if dto.Phone != "" {
        builder.SetPhone(dto.Phone)
    }

    return builder.Save(ctx)
}
```

### 3. Relationship Handling

#### Many-to-One
```go
// Schema: { "author": { "$ref": "User", "x-relation": { "type": "many2One" } } }

// ✅ Correct
builder.SetAuthorID(dto.AuthorID)
```

#### Many-to-Many
```go
// Schema: { "roles": { "$ref": "Role", "x-relation": { "type": "many2Many" } } }

// ✅ Correct
builder.AddRoleIDs(dto.RoleIDs...)
```

#### One-to-Many
```go
// Schema: { "posts": { "$ref": "Post", "x-relation": { "type": "one2Many" } } }

// ✅ Correct in Get with relations
func (s *Service) GetWithPosts(ctx context.Context, id string) (*_gen.User, error) {
    return s.client.User.Query().
        WithPosts().
        Only(ctx)
}
```

### 4. Soft Delete

#### Schema
```go
func (User) Fields() []ent.Field {
    return []ent.Field{
        // ... other fields
        field.Time("deleted_at").Optional().Nillable(),
    }
}
```

#### Delete Operation
```go
// ✅ Correct
func (s *Service) Delete(ctx context.Context, id string) error {
    return s.client.User.UpdateOneID(id).
        SetDeletedAt(time.Now()).
        Exec(ctx)
}
```

#### Query with Filter
```go
// ✅ Correct
func (s *Service) List(ctx context.Context, page, pageSize int) ([]*_gen.User, error) {
    return s.client.User.Query().
        Where(user.DeletedAtIsNil()).
        Offset((page - 1) * pageSize).
        Limit(pageSize).
        All(ctx)
}
```

### 5. Enum Handling

#### Schema
```go
type Role string

const (
    RoleAdmin   Role = "admin"
    RoleEditor  Role = "editor"
    RoleViewer  Role = "viewer"
)

func (Role) Values() []string {
    return []string{
        string(RoleAdmin),
        string(RoleEditor),
        string(RoleViewer),
    }
}
```

#### Service
```go
// ✅ Correct
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.User, error) {
    return s.client.User.Create().
        SetEmail(dto.Email).
        SetRole(user.Role(dto.Role)).  // Type conversion
        Save(ctx)
}
```

### 6. Unique Constraint Handling

#### ❌ Wrong
```go
func (s *Service) Create(ctx context.Context, dto *CreateDTO) (*_gen.User, error) {
    return s.client.User.Create().
        SetEmail(dto.Email).
        Save(ctx)
    // Will fail with duplicate email
}
```

#### ✅ Correct
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

    return s.client.User.Create().
        SetEmail(dto.Email).
        Save(ctx)
}
```

### 7. Controller Error Handling

#### ❌ Wrong
```go
func (c *Controller) Create(w http.ResponseWriter, r *http.Request) {
    var dto CreateDTO
    binding.JSON(r, &dto)

    user, _ := c.service.Create(r.Context(), &dto)

    res.Write(http.StatusOK, responder.StrapiResponse{
        Data: user,
    })
}
```

#### ✅ Correct
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
        },
    })
}
```

### 8. Index Generation

#### Unique Index
```go
func (User) Indexes() []ent.Index {
    return []ent.Index{
        index.Fields("email").Unique(),
    }
}
```

#### Composite Index
```go
func (Order) Indexes() []ent.Index {
    return []ent.Index{
        index.Fields("status", "created_at"),
    }
}
```

### 9. Validation in Ent Schema

#### Required
```go
field.String("name").NotEmpty()
```

#### Range
```go
field.Int("age").Range(0, 150)
```

#### Length
```go
field.String("name").MinLen(3).MaxLen(50)
```

#### Pattern
```go
field.String("email").Match(regexp.MustCompile(`^.+@.+$`))
```

#### Unique
```go
field.String("email").Unique()
```

### 10. Response Format

#### Single Entity
```go
res.Write(http.StatusOK, responder.StrapiResponse{
    Data: map[string]any{
        "id":    user.ID,
        "email": user.Email,
        "name":  user.Name,
    },
})
```

#### List
```go
data := make([]map[string]any, len(users))
for i, user := range users {
    data[i] = map[string]any{
        "id":    user.ID,
        "email": user.Email,
        "name":  user.Name,
    }
}

res.Write(http.StatusOK, responder.StrapiResponse{
    Data: data,
})
```

## Validation Mapping

| Schema Validation | Go Validation | Example |
|-------------------|---------------|---------|
| `required: true` | `validate:"required"` | `Name string` |
| `email: true` | `validate:"email"` | `Email string` |
| `min: 0, max: 150` | `validate:"min=0,max=150"` | `Age int` |
| `enum: ["admin", "editor"]` | `validate:"oneof=admin editor"` | `Role string` |
| `minLength: 3` | `validate:"min=3"` | `Name string` |
| `maxLength: 100` | `validate:"max=100"` | `Email string` |

## Best Practices Checklist

- [ ] Password fields use bcrypt
- [ ] Optional fields are checked before setting
- [ ] Relationships use correct methods (SetID/AddIDs)
- [ ] Soft delete uses SetDeletedAt
- [ ] Unique constraints are validated
- [ ] Controllers have proper error handling
- [ ] JSON binding validation is present
- [ ] Consistent response format
- [ ] Indexes are defined for unique fields
- [ ] Enum fields use type conversion
