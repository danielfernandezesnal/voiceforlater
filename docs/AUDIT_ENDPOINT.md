# Audit Endpoint Documentation

The audit endpoint allows owners to inspect the state of the Dead Man's Switch for a specific user. It returns a combined view of recent verification tokens and confirmation events.

## Endpoint

`GET /api/admin/confirmation-audit`

## Authentication

This endpoint is protected and requires the requester to be authenticated and have the `owner` role.

## Parameters

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| `userId`  | string | Yes      | The ID of the user to inspect.                   |
| `limit`   | number | No       | Max number of tokens to return (default: 20).    |

## Response

Returns a JSON object containing:

- `target_user_id`: The ID of the inspected user.
- `tokens`: Array of `verification_tokens` (limit `limit`).
- `events`: Array of `confirmation_events` (limit `limit * 2`).

## Example Usage

### Request

```http
GET /api/admin/confirmation-audit?userId=88b2a5fe-34fc-4641-afe1-570950dcb21f&limit=5
Cookie: ... (Standard Auth Session)
```

### JSON Response

```json
{
  "target_user_id": "88b2a5fe-34fc-4641-afe1-570950dcb21f",
  "tokens": [
    {
      "id": "...",
      "user_id": "...",
      "contact_email": "...",
      "expires_at": "...",
      "used_at": "...",
      "used_reason": "expired_auto",
      "created_at": "..."
    }
  ],
  "events": [
    {
      "id": "...",
      "type": "token_expired",
      "decision": null,
      "created_at": "..."
    },
    {
      "id": "...",
      "type": "messages_released_auto",
      "decision": null,
      "created_at": "..."
    }
  ]
}
```
