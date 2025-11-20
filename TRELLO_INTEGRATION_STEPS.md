# Trello Integration Steps

## Overview
Import leads from your Trello board into the CRM system.

## Your Trello Details
- **Board URL**: https://trello.com/b/Q0g7eEjZ/leads
- **Board ID**: `Q0g7eEjZ`
- **Account**: https://trello.com/u/nourdroubi/boards

## Required Credentials

### 1. Trello API Key
- Go to: https://trello.com/app-key
- Copy your API Key

### 2. Trello Token
- On the same page (https://trello.com/app-key), click "Token" link
- Or go directly to: https://trello.com/1/authorize?expiration=never&name=TADCRM&scope=read&response_type=token&key=YOUR_API_KEY
- Authorize the app and copy the token

## Implementation Steps

1. **Add Secrets** (via Lovable Admin Hub)
   - Navigate to Admin Hub → CRM section
   - Click "Import from Trello"
   - You'll be prompted to add:
     - `TRELLO_API_KEY`
     - `TRELLO_TOKEN`

2. **Import Process**
   - The system will fetch all cards from board `Q0g7eEjZ`
   - Extract phone numbers from card descriptions
   - Check for existing leads to avoid duplicates
   - Create new lead records in the database

## Technical Details
- Edge Function: `supabase/functions/import-trello-leads/index.ts`
- Sync Function: `supabase/functions/sync-to-trello/index.ts`
- Entry Point: Admin Hub page

## Notes
- Phone numbers must be UAE format (05xxxxxxxx or 05x-xxx-xxxx)
- Duplicate phone numbers will be skipped
- All imported leads will be assigned status "NEW"
