# 后端组件使用指南

> 在业务模块中使用组件

## 🎯 使用流程

```
1. 在 Service 中获取组件
   ↓
2. 创建/更新时验证字段值
   ↓
3. 查询列表时填充显示信息
   ↓
4. Handler 返回 DTO
```

---

## 📦 获取组件

### 方式 1：通过注册中心获取（推荐）

```go
type InvitationService struct {
    client        *ent.Client
    logger        *zap.Logger
    dictComponent component.Component
}

func NewInvitationService(client *ent.Client, logger *zap.Logger) *InvitationService {
    return &InvitationService{
        client:        client,
        logger:        logger,
        dictComponent: component.MustGet("dictionary"), // 获取组件
    }
}
```

### 方式 2：依赖注入

```go
type InvitationService struct {
    client        *ent.Client
    dictComponent component.Component
}

func NewInvitationService(
    client *ent.Client,
    dictComponent component.Component,
) *InvitationService {
    return &InvitationService{
        client:        client,
        dictComponent: dictComponent,
    }
}
```

---

## ✅ 验证字段值

### 在创建时验证

```go
func (s *InvitationService) CreateInvitation(
    ctx context.Context,
    req *CreateInvitationRequest,
) (*ent.InvitationToken, error) {
    // 1. 构建组件配置
    config := map[string]any{
        "code":             "invitation_status",
        "validateOnCreate": true,
    }

    // 2. 验证 status 字段
    if err := s.dictComponent.Validate(ctx, config, req.Status); err != nil {
        return nil, fmt.Errorf("invalid status: %w", err)
    }

    // 3. 创建实体
    invitation, err := s.client.InvitationToken.Create().
        SetStatus(req.Status).
        // ... 其他字段
        Save(ctx)

    return invitation, err
}
```

### 在更新时验证

```go
func (s *InvitationService) UpdateStatus(
    ctx context.Context,
    id uuid.UUID,
    newStatus string,
) error {
    // 验证新状态
    config := map[string]any{
        "code":             "invitation_status",
        "validateOnUpdate": true,
    }

    if err := s.dictComponent.Validate(ctx, config, newStatus); err != nil {
        return fmt.Errorf("invalid status: %w", err)
    }

    // 更新
    return s.client.InvitationToken.UpdateOneID(id).
        SetStatus(newStatus).
        Exec(ctx)
}
```

### 批量验证

```go
func (s *Service) ValidateBatch(ctx context.Context, values []string) error {
    config := map[string]any{"code": "status_enum"}

    for _, value := range values {
        if err := s.dictComponent.Validate(ctx, config, value); err != nil {
            return err
        }
    }

    return nil
}
```

---

## 🎨 填充显示信息

### 单个实体

```go
func (s *InvitationService) GetInvitationWithDisplay(
    ctx context.Context,
    id uuid.UUID,
) (*InvitationDTO, error) {
    // 1. 查询实体
    invitation, err := s.client.InvitationToken.Get(ctx, id)
    if err != nil {
        return nil, err
    }

    // 2. 填充显示信息
    config := map[string]any{
        "code":            "invitation_status",
        "populateDisplay": true,
    }

    displayMap, err := s.dictComponent.PopulateDisplay(
        ctx,
        config,
        []any{invitation.Status},
    )
    if err != nil {
        s.logger.Warn("Failed to populate display", zap.Error(err))
        displayMap = make(map[any]component.Display)
    }

    // 3. 构建 DTO
    dto := &InvitationDTO{
        ID:     invitation.ID.String(),
        Status: invitation.Status,
    }

    if display, ok := displayMap[invitation.Status]; ok {
        dto.StatusDisplay = &ComponentDisplayDTO{
            Label: display.Label,
            Value: display.Value,
            Extra: display.Extra,
        }
    }

    return dto, nil
}
```

### 列表批量填充

```go
func (s *InvitationService) ListWithDisplay(
    ctx context.Context,
    page, pageSize int,
) ([]*InvitationDTO, int, error) {
    // 1. 查询列表
    invitations, total, err := s.List(ctx, page, pageSize)
    if err != nil {
        return nil, 0, err
    }

    // 2. 提取所有 status 值
    statusValues := make([]any, 0, len(invitations))
    for _, inv := range invitations {
        statusValues = append(statusValues, inv.Status)
    }

    // 3. 批量填充显示信息
    config := map[string]any{
        "code":            "invitation_status",
        "populateDisplay": true,
    }

    displayMap, err := s.dictComponent.PopulateDisplay(ctx, config, statusValues)
    if err != nil {
        s.logger.Warn("Failed to populate display", zap.Error(err))
        displayMap = make(map[any]component.Display)
    }

    // 4. 构建 DTO 列表
    dtos := make([]*InvitationDTO, len(invitations))
    for i, inv := range invitations {
        dto := &InvitationDTO{
            ID:     inv.ID.String(),
            Status: inv.Status,
        }

        if display, ok := displayMap[inv.Status]; ok {
            dto.StatusDisplay = &ComponentDisplayDTO{
                Label: display.Label,
                Value: display.Value,
                Extra: display.Extra,
            }
        }

        dtos[i] = dto
    }

    return dtos, total, nil
}
```

---

## 📋 DTO 定义

### 通用 Display DTO

```go
// pkg/dto/component.go
package dto

type ComponentDisplayDTO struct {
    Label string `json:"label"`
    Value any    `json:"value"`
    Extra any    `json:"extra,omitempty"`
}
```

### 业务 DTO

```go
// internal/modules/invitation/dto.go
package invitation

type InvitationDTO struct {
    ID            string               `json:"id"`
    Token         string               `json:"token"`
    Email         string               `json:"email"`
    Status        string               `json:"status"`
    StatusDisplay *ComponentDisplayDTO `json:"statusDisplay,omitempty"`
    ExpiresAt     time.Time            `json:"expiresAt"`
    CreatedAt     time.Time            `json:"createdAt"`
}
```

---

## 🔄 Handler 层集成

### 返回带 Display 的响应

```go
func (h *InvitationHandler) GetInvitation(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    parsedID, err := uuid.Parse(id)
    if err != nil {
        responder.BadRequest(w, r, "Invalid ID")
        return
    }

    // 调用 Service（自动填充 Display）
    dto, err := h.service.GetInvitationWithDisplay(r.Context(), parsedID)
    if err != nil {
        responder.InternalServerError(w, r, "Failed to get invitation")
        return
    }

    responder.OK(w, r, dto)
}
```

### 列表接口

```go
func (h *InvitationHandler) ListInvitations(w http.ResponseWriter, r *http.Request) {
    page := getQueryInt(r, "page", 1)
    pageSize := getQueryInt(r, "pageSize", 20)

    dtos, total, err := h.service.ListWithDisplay(r.Context(), page, pageSize)
    if err != nil {
        responder.InternalServerError(w, r, "Failed to list invitations")
        return
    }

    responder.OK(w, r, map[string]any{
        "data":     dtos,
        "total":    total,
        "page":     page,
        "pageSize": pageSize,
    })
}
```

---

## 🎯 最佳实践

### 1. 配置复用

将常用配置定义为常量：

```go
const (
    invitationStatusConfig = `{"code":"invitation_status","validateOnCreate":true}`
)

func (s *Service) parseConfig() map[string]any {
    var config map[string]any
    json.Unmarshal([]byte(invitationStatusConfig), &config)
    return config
}
```

### 2. 错误处理

区分验证错误和系统错误：

```go
if err := s.dictComponent.Validate(ctx, config, value); err != nil {
    if _, ok := err.(*component.ValidationError); ok {
        // 验证错误 -> 返回 400
        return errors.NewValidationError("Invalid status", err)
    }
    // 系统错误 -> 返回 500
    return errors.NewInternalError("Validation failed", err)
}
```

### 3. 可选填充

根据需要决定是否填充显示信息：

```go
func (s *Service) List(ctx context.Context, withDisplay bool) ([]*DTO, error) {
    entities := s.queryEntities(ctx)

    if !withDisplay {
        return s.toBasicDTOs(entities), nil
    }

    return s.toDTOsWithDisplay(ctx, entities), nil
}
```

### 4. 缓存优化

对于频繁查询的字典，使用缓存：

```go
func (s *Service) getDisplayMap(ctx context.Context, code string) (map[any]component.Display, error) {
    // 尝试从缓存获取
    cacheKey := fmt.Sprintf("dict:display:%s", code)
    if cached, ok := s.cache.Get(cacheKey); ok {
        return cached.(map[any]component.Display), nil
    }

    // 查询并缓存
    config := map[string]any{"code": code}
    displayMap, err := s.dictComponent.PopulateDisplay(ctx, config, values)
    if err != nil {
        return nil, err
    }

    s.cache.Set(cacheKey, displayMap, 5*time.Minute)
    return displayMap, nil
}
```

---

## ⚠️ 注意事项

### 1. 性能

- 列表查询时一定要使用批量填充（`PopulateDisplay`）
- 避免在循环中调用 `Validate` 或 `PopulateDisplay`

### 2. 错误处理

- 验证失败应返回 400，系统错误返回 500
- 显示信息填充失败不应阻断主流程

### 3. 可选性

- `statusDisplay` 字段应该是可选的（`omitempty`）
- 前端应能处理无 display 的情况

---

## 📚 相关文档

- [组件规范](../COMPONENT_SPECIFICATION.md)
- [Schema 规范](../SCHEMA_REFERENCE.md)
- [前端集成指南](../frontend/INTEGRATION_GUIDE.md)

---

**版本**: v1.0
**更新日期**: 2026-01-28
