# Agent Config Redesign - CRM-Inspired Architecture

## Overview

We've redesigned the Agent Configuration admin experience to follow the CRM's proven navigation, sectioning, and UX patterns. The new design provides dedicated pages for each agent system and sub-agent with comprehensive management capabilities.

## Architecture

### Main Components

#### 1. **agent-config-view.tsx** (Main Entry Point)
- Vertical sidebar navigation for agent systems
- Collapsible navigation for compact mode
- Active section highlighting with badge counts
- Two main views: Systems list and System detail

#### 2. **AgentSystemsList**
- Overview dashboard with key metrics:
  - Total systems count
  - Total sub-agents count
  - Active sub-agents count
- Agent systems cards with status indicators
- Click to view system details

#### 3. **AgentSystemDetail**
- Header with system name, description, codename, and status
- Tabbed interface with 4 sections:
  - **Sub-Agents**: List of sub-agents with configuration, status, and quick actions
  - **Skills**: System-wide skill management
  - **Prompts**: System and user prompt editing with versioning
  - **Performance**: Performance metrics and monitoring

### Subcomponents

#### Sub-Agents Tab
- **SubAgentsList**: Lists all sub-agents with:
  - Status badges (active/inactive)
  - Quick configuration display (model, temperature, max tokens)
  - Skill badges
  - Edit and view buttons
  - Status indicator bar showing enable/disable state

- **SubAgentDetailDialog**: Edit dialog for sub-agent configuration:
  - Name, model, temperature, max tokens
  - Enable/disable toggle
  - Description field

#### Skills Tab
- **SkillsManager**: 
  - Displays all unique skills across system's sub-agents
  - Skill search/filtering
  - Note: Skills are edited per sub-agent (shown in edit dialog)

#### Prompts Tab
- **PromptsManager**:
  - Tabs for System and User prompts
  - Prompt display with version and last updated date
  - Edit button to open prompt editor

- **PromptEditorDialog**:
  - Full-screen prompt content editor
  - Automatic versioning
  - Character count display

#### Performance Tab
- **PerformanceMonitor**:
  - Key metrics cards:
    - Total runs (with Zap icon)
    - Success rate (with TrendingUp icon)
    - Average latency (with Clock icon)
    - Recent errors count (with TrendingDown icon)
  - Per sub-agent performance breakdown
  - Recent errors section (placeholder)

## Database Schema

### Tables

#### agent_systems
```sql
- id (UUID, PK)
- name (TEXT)
- codename (TEXT, UNIQUE)
- description (TEXT)
- enabled (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### agent_sub_agents
```sql
- id (UUID, PK)
- system_id (UUID, FK)
- name (TEXT)
- role (TEXT)
- description (TEXT)
- enabled (BOOLEAN)
- model (TEXT)
- temperature (NUMERIC)
- max_tokens (INTEGER)
- skills (TEXT[])
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### agent_prompts
```sql
- id (UUID, PK)
- system_id (UUID, FK)
- type (TEXT: 'system' | 'user')
- content (TEXT)
- version (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## API Endpoints

### /api/admin/agent-config/systems (GET)
- Fetches all agent systems with sub-agents and prompts
- Returns: `{ systems: AgentSystem[] }`

### /api/admin/agent-config/sub-agents (PUT)
- Updates a sub-agent configuration
- Payload: `{ systemId: string, subAgent: SubAgent }`
- Returns: `{ success: boolean, subAgent: SubAgent }`

### /api/admin/agent-config/prompts (POST)
- Creates or updates an agent prompt
- Payload: `{ systemId: string, type: 'system'|'user', content: string }`
- Returns: `{ success: boolean, version: number }`

## TypeScript Types

All new types are defined in `lib/agents/types.ts`:

### AgentPrompt
- id: string
- type: 'system' | 'user'
- content: string
- version: number
- created_at: string
- updated_at: string

### SubAgent
- id: string
- system_id: string
- name: string
- role?: string
- description?: string
- enabled: boolean
- model?: string
- temperature?: number
- max_tokens?: number
- skills?: string[]
- created_at: string
- updated_at: string

### AgentSystem
- id: string
- name: string
- codename: string
- description?: string
- enabled: boolean
- sub_agents?: SubAgent[]
- prompts?: AgentPrompt[]
- created_at: string
- updated_at: string

## File Structure

```
app/admin/
  agent-config/
    page.tsx (server component, mounts AgentConfigView)
    agent-config-v2/
      agent-config-view.tsx (main client component)
      components/
        agent-systems-list.tsx
        agent-system-detail.tsx
        sub-agents-list.tsx
        sub-agent-detail-dialog.tsx
        skills-manager.tsx
        prompts-manager.tsx
        prompt-editor-dialog.tsx
        performance-monitor.tsx

app/api/admin/agent-config/
  systems/route.ts
  sub-agents/route.ts
  prompts/route.ts

lib/agents/
  types.ts (updated with new types)

supabase/migrations/
  20260410000000_create_agent_config_tables.sql
```

## Design Patterns Applied from CRM

### 1. Vertical Navigation
- Persistent sidebar with collapsible option
- Active state highlighting
- Badge counts for quick status overview

### 2. Sectioned Content
- Main content area updates based on navigation
- Each view (systems list, system detail) is self-contained
- No page reloads, instant transitions

### 3. Tabbed Interfaces
- Horizontal tabs for sub-sections within a system detail page
- Each tab is its own component (sub-agents, skills, prompts, performance)
- Icons + labels for better UX

### 4. Dialogs for Edit/Create
- Modal dialogs for editing sub-agent configs
- Modal dialogs for editing prompts
- Form validation within dialogs

### 5. Cards and Status Indicators
- Card-based layout for grouping related information
- Badge components for status indicators
- Color-coded status (green for active, red for inactive, yellow for partial)

### 6. Feedback and Loading States
- Loading spinners on refresh button
- Toast notifications for success/error messages
- Optimistic UI updates for create/edit/delete

### 7. Consistent Visual Language
- Icons from lucide-react for uniformity
- Consistent spacing and typography
- Hover states and transitions for interactivity

## Next Steps

### Short-term (Optional Enhancements)
1. Implement admin role checking in API routes
2. Add delete functionality for sub-agents
3. Add prompt versioning history view
4. Integrate with actual performance metrics API
5. Add bulk enable/disable for sub-agents

### Medium-term (Future Features)
1. Agent system duplication/cloning
2. Prompt template library
3. A/B testing interface for prompts
4. Real-time performance dashboard
5. Agent execution logs viewer

### Long-term (Advanced Features)
1. Visual prompt builder with drag-and-drop
2. Multi-language support for prompts
3. Skill marketplace/sharing
4. Advanced performance analytics
5. Integration with CI/CD for configuration management

## Testing

To test locally:

1. **Create/Update Migrations** (if using Supabase):
   ```bash
   supabase migration up
   ```

2. **Visit Admin Page**:
   - Navigate to `/admin/agent-config`
   - Should see agent systems list

3. **Interact with UI**:
   - Click on a system to view details
   - Click edit buttons on sub-agents to modify configs
   - Create/edit prompts in the prompts tab
   - Monitor performance metrics

## Notes

- All API routes require authentication (Supabase session)
- Admin role checking should be implemented before production
- Row-level security (RLS) policies are enabled for all tables
- Performance metrics are currently placeholder data and should be connected to actual analytics API
- Toast notifications use the existing notification system from `@/components/layout/notification-toast`
