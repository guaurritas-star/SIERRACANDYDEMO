# Candy Catalog — Firestore Security Specification

## 1. Data Invariants
1. **Tenant Ownership Invariant**: A `/tenants/{tenantId}` document can only be created or modified by an authenticated user with a verified email (`email_verified == true`) whose `request.auth.uid == incoming().ownerId`. `ownerId` and `createdAt` are immutable after creation.
2. **Product Relational Gate (Master Gate)**: A `/tenants/{tenantId}/products/{productId}` document can only be created, updated, or deleted if the parent `/tenants/{tenantId}` exists and its `ownerId == request.auth.uid`.
3. **Public Storefront Visibility Gate**: Unauthenticated visitors can only read (`get` or `list`) products where `resource.data.status == 'published'` (or `status == 'soldout'` when publicly visible in catalog, or strictly `status in ['published', 'soldout']`). Hidden drafts (`status == 'hidden'`) can only be read by their authenticated owner (`resource.data.ownerId == request.auth.uid`).
4. **Strict Key & Size Enforcement**: Every string and array is bounded by explicit `.size()` limits to prevent Denial-of-Wallet and payload injection.

## 2. Dirty Dozen Payloads
1. Unauthenticated write to `/tenants/sierra` -> `PERMISSION_DENIED`
2. Authenticated write with `email_verified == false` -> `PERMISSION_DENIED`
3. Spoofed `ownerId` (`ownerId != request.auth.uid`) on tenant creation -> `PERMISSION_DENIED`
4. Shadow field injection (`isSuperAdmin: true`) on tenant update -> `PERMISSION_DENIED`
5. Mutating immutable `ownerId` or `createdAt` on tenant update -> `PERMISSION_DENIED`
6. Forged client timestamp (`updatedAt != request.time`) -> `PERMISSION_DENIED`
7. Creating a product under `/tenants/other-tenant/products/p1` owned by another merchant -> `PERMISSION_DENIED`
8. Unauthenticated `get` or `list` of a product with `status == 'hidden'` -> `PERMISSION_DENIED`
9. Oversized `name` (> 160 chars) or negative `price` (< 0) on product write -> `PERMISSION_DENIED`
10. Unbounded array (> 20 items in `availableSizes` or `tags`) -> `PERMISSION_DENIED`
11. Invalid document ID containing special characters -> `PERMISSION_DENIED`
12. Deleting a product belonging to another tenant -> `PERMISSION_DENIED`
