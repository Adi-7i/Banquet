# CYNERZA Backend Architecture

## Overview

This document describes the architecture and design principles of the CYNERZA backend system.

## Architecture Style

The application follows **Clean Architecture** (also known as Onion Architecture or Hexagonal Architecture) combined with **Domain-Driven Design (DDD)** principles.

## Core Principles

### 1. Separation of Concerns
Each layer has a specific responsibility and doesn't know about layers outside of it.

### 2. Dependency Inversion
Dependencies point inward. Outer layers depend on inner layers, never the reverse.

### 3. Independence
- **Framework Independence**: Core business logic doesn't depend on NestJS
- **Database Independence**: Domain layer doesn't know about Prisma
- **UI Independence**: Business rules don't depend on REST/GraphQL
- **Testability**: Business rules can be tested without external dependencies

## Layer Structure

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│         (Controllers, DTOs, Validation)                  │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                       │
│           (Use Cases, Application Services)              │
├─────────────────────────────────────────────────────────┤
│                    Domain Layer                          │
│  (Entities, Value Objects, Domain Services, Interfaces)  │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                     │
│        (Prisma, External APIs, File Storage)             │
└─────────────────────────────────────────────────────────┘
```

### Presentation Layer (`src/modules/*/controllers`)
- **Responsibility**: Handle HTTP requests, validate input, serialize responses
- **Contains**: Controllers, DTOs, Validation rules
- **Dependencies**: Application layer

### Application Layer (`src/application`)
- **Responsibility**: Orchestrate business workflows, coordinate use cases
- **Contains**: Use cases, Application services
- **Dependencies**: Domain layer

### Domain Layer (`src/domain`)
- **Responsibility**: Core business logic and rules
- **Contains**: Entities, Value Objects, Domain Services, Repository Interfaces
- **Dependencies**: None (pure TypeScript/JavaScript)

### Infrastructure Layer (`src/infrastructure`)
- **Responsibility**: Implement technical capabilities
- **Contains**: Database implementations (Prisma), External APIs, File storage
- **Dependencies**: Domain layer (implements interfaces)

## Design Patterns

### 1. Repository Pattern
Abstracts data access logic. Domain defines the interface, infrastructure implements it.

```typescript
// Domain layer - Interface
export interface IUserRepository {
  findById(id: string): Promise<User>;
  create(user: User): Promise<User>;
}

// Infrastructure layer - Implementation
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}
  
  async findById(id: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

### 2. Dependency Injection
NestJS provides powerful DI container. All dependencies are injected through constructors.

### 3. Middleware Pattern
Prisma middleware for cross-cutting concerns (soft delete, audit logging).

### 4. Decorator Pattern
Used extensively for validation, authorization, documentation.

## Data Flow

```
HTTP Request
    ↓
Controller (Presentation)
    ↓
Use Case (Application)
    ↓
Domain Service/Entity (Domain)
    ↓
Repository (Domain Interface → Infrastructure Implementation)
    ↓
Database (Prisma)
```

## Domain Model

### Aggregates

#### User Aggregate
- **Root**: User
- **Value Objects**: Email, Password (hashed)
- **Business Rules**: 
  - Email must be unique
  - Password must meet strength requirements
  - Role determines access permissions

#### Owner Aggregate
- **Root**: OwnerProfile
- **Entities**: Banquet (child entities)
- **Business Rules**:
  - Owner must have valid business information
  - Can manage multiple banquets
  - GST number must be unique (if provided)

#### Customer Aggregate
- **Root**: CustomerProfile
- **Business Rules**:
  - Must have valid contact information
  - Can have booking preferences

### Relationships

```
User (1) ──── (0..1) OwnerProfile
  │
  └─── (0..1) CustomerProfile

OwnerProfile (1) ──── (0..*) Banquet
```

## Security Architecture

### Authentication Flow
1. User submits credentials
2. System validates and generates JWT
3. JWT contains user ID and role
4. Subsequent requests include JWT in Authorization header
5. Guards validate JWT and extract user info

### Authorization
- **Role-Based Access Control (RBAC)**
- **Guards**: Check user roles before allowing access
- **Decorators**: `@Roles('ADMIN', 'OWNER')`

### Audit Trail
All entities track:
- `createdBy`: User who created the record
- `updatedBy`: User who last updated the record
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

### Soft Delete
- Records are never permanently deleted by default
- `deletedAt` timestamp marks records as deleted
- Middleware automatically filters soft-deleted records
- Data recovery is possible

## Error Handling

### Global Exception Filter
Catches all exceptions and returns standardized error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-01-11T12:30:00.000Z",
  "path": "/api/v1/users",
  "method": "POST",
  "message": "Validation failed",
  "errors": [...]
}
```

### Validation
- **Class-validator**: DTO validation
- **Joi**: Environment variable validation
- **Prisma**: Database-level constraints

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock all external dependencies
- Focus on business logic

### Integration Tests
- Test interaction between layers
- Use test database
- Verify data flow

### E2E Tests
- Test complete user workflows
- Test API endpoints
- Verify authentication and authorization

## Performance Considerations

### Database
- **Indexes**: Strategic indexing on frequently queried fields
- **Connection Pooling**: Configured via Prisma
- **Query Optimization**: Prisma generates optimized SQL

### Caching (Future)
- Redis for session storage
- Cache frequently accessed data
- Implement cache invalidation strategy

### Scalability
- **Stateless Design**: JWT-based authentication (no server-side sessions)
- **Horizontal Scaling**: Multiple instances can run behind load balancer
- **Database Replication**: Read replicas for scaling reads

## Monitoring and Observability

### Health Checks
- Database connectivity
- Memory usage
- Disk space

### Logging
- Structured JSON logs in production
- Request/response logging (development)
- Error stack traces

### Metrics (Future)
- Request duration
- Error rates
- Database query performance

## Future Enhancements

1. **Event Sourcing**: For critical business events
2. **CQRS**: Separate read and write models
3. **GraphQL**: Alternative API interface
4. **Microservices**: Break into smaller services as needed
5. **Message Queue**: For asynchronous processing (bookings, notifications)

## Best Practices

### Code Organization
- One class per file
- Meaningful names
- Small, focused functions
- Consistent naming conventions

### Dependency Management
- Keep dependencies up to date
- Review security advisories
- Use exact versions in production

### Configuration
- All configuration via environment variables
- Validate all config at startup
- Never commit secrets

### Documentation
- Document complex business rules
- Use JSDoc for public APIs
- Keep README updated

---

This architecture ensures the system is **maintainable**, **testable**, **scalable**, and ready for production use.
