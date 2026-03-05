# Leaderboards Implementation Plan

## Overview

Add a competitive leaderboard system allowing players to compare scores globally and with friends. Supports both all-time and weekly rankings.

## Feature Description

- Global leaderboard: Top 100 all-time scores
- Weekly leaderboard: Resets every Monday
- Friend leaderboard: Compare with friends (requires friend codes)
- Player profiles: Display name, rank, stats
- Anti-cheat: Server-side validation, rate limiting

---

## Technical Architecture Decision

### Recommended: Supabase (Free Tier)

**Why Supabase:**
- Free tier: 500MB database, 50,000 monthly active users
- Real-time subscriptions for live leaderboard updates
- Row-level security for data protection
- Built-in authentication (optional)
- PostgreSQL for complex queries

**Alternative: Firebase (Free Tier)**
- Free tier: 1GB database, 10GB/month transfer
- Real-time database
- Simpler setup for basic needs
- Less flexible queries

**Decision:** Use Supabase for its SQL capabilities and better free tier limits.

---

## Implementation Steps

### Step 1: Set Up Supabase Project

**Create project at supabase.com:**

1. Create new project (note project URL and anon key)
2. Create database tables:

```sql
-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name VARCHAR(50) NOT NULL,
    friend_code VARCHAR(8) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW()
);

-- Scores table
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    chickens_deployed INTEGER NOT NULL,
    chickens_reached INTEGER NOT NULL,
    stars INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    week_number INTEGER DEFAULT EXTRACT(WEEK FROM NOW())
);

-- Indexes for leaderboard queries
CREATE INDEX idx_scores_level_week ON scores(level_id, week_number, score DESC);
CREATE INDEX idx_scores_level_alltime ON scores(level_id, score DESC);
CREATE INDEX idx_scores_player ON scores(player_id);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Policies (read: public, write: authenticated via anon key)
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Public insert scores" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert players" ON players FOR INSERT WITH CHECK (true);
```

### Step 2: Create Supabase Client

**File:** `src/platform/SupabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function initializePlayer(): Promise<PlayerProfile> {
    // Check for existing player ID
    let playerId = localStorage.getItem('player_id');
    
    if (playerId) {
        // Fetch existing profile
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .single();
        
        if (data) return data;
    }
    
    // Create new player
    const friendCode = generateFriendCode();
    const playerName = 'Player_' + friendCode;
    
    const { data, error } = await supabase
        .from('players')
        .insert({
            player_name: playerName,
            friend_code: friendCode
        })
        .select()
        .single();
    
    if (error) throw error;
    
    localStorage.setItem('player_id', data.id);
    return data;
}

function generateFriendCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export interface PlayerProfile {
    id: string;
    player_name: string;
    friend_code: string;
    created_at: string;
    last_active: string;
}
```

### Step 3: Create Leaderboard Service

**File:** `src/systems/LeaderboardService.ts`

```typescript
import { supabase, initializePlayer, type PlayerProfile } from '@/platform/SupabaseClient';
import type { LeaderboardEntry, LeaderboardType } from '@/data/types';

const SCORES_PER_PAGE = 100;

export async function submitScore(
    levelId: number,
    score: number,
    chickensDeployed: number,
    chickensReached: number,
    stars: number
): Promise<{ rank: number; isNewBest: boolean }> {
    const player = await initializePlayer();
    
    // Check for existing score
    const { data: existing } = await supabase
        .from('scores')
        .select('*')
        .eq('player_id', player.id)
        .eq('level_id', levelId)
        .single();
    
    const isNewBest = !existing || score > existing.score;
    
    if (isNewBest) {
        await supabase
            .from('scores')
            .insert({
                player_id: player.id,
                level_id: levelId,
                score,
                chickens_deployed: chickensDeployed,
                chickens_reached: chickensReached,
                stars,
                week_number: getCurrentWeekNumber()
            });
    }
    
    // Calculate rank
    const { count } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .eq('level_id', levelId)
        .gt('score', score);
    
    return {
        rank: (count || 0) + 1,
        isNewBest
    };
}

export async function getLeaderboard(
    levelId: number,
    type: LeaderboardType = 'all_time',
    page: number = 0
): Promise<LeaderboardEntry[]> {
    let query = supabase
        .from('scores')
        .select('score, stars, created_at, players!inner(player_name, friend_code)')
        .eq('level_id', levelId)
        .order('score', { ascending: false })
        .range(page * SCORES_PER_PAGE, (page + 1) * SCORES_PER_PAGE - 1);
    
    if (type === 'weekly') {
        query = query.eq('week_number', getCurrentWeekNumber());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map((entry, index) => ({
        rank: page * SCORES_PER_PAGE + index + 1,
        playerName: entry.players.player_name,
        score: entry.score,
        stars: entry.stars,
        isFriend: false
    }));
}

export async function getPlayerRank(levelId: number, playerId: string): Promise<number | null> {
    const { data: playerScore } = await supabase
        .from('scores')
        .select('score')
        .eq('player_id', playerId)
        .eq('level_id', levelId)
        .order('score', { ascending: false })
        .limit(1)
        .single();
    
    if (!playerScore) return null;
    
    const { count } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .eq('level_id', levelId)
        .gt('score', playerScore.score);
    
    return (count || 0) + 1;
}

function getCurrentWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 604800000;
    return Math.floor(diff / oneWeek) + 1;
}
```

### Step 4: Add Types

**File:** `src/data/types.ts`

```typescript
export interface LeaderboardEntry {
    rank: number;
    playerName: string;
    score: number;
    stars: number;
    isFriend: boolean;
}

export type LeaderboardType = 'all_time' | 'weekly' | 'friends';

export interface LeaderboardState {
    currentLevel: number;
    entries: LeaderboardEntry[];
    playerRank: number | null;
    loading: boolean;
    error: string | null;
}
```

### Step 5: Create Leaderboard UI

**File:** `src/ui/LeaderboardScreen.ts`

Render leaderboard with tabs for All Time, Weekly, Friends. Show rank, player name, score, and stars.

### Step 6: Add Anti-Cheat Measures

**File:** `src/systems/AntiCheat.ts`

- Minimum game time validation
- Maximum chickens per second check
- Score consistency validation
- Rate limiting for submissions

---

## Cost Analysis

### Supabase Free Tier Limits

| Resource | Limit | Estimated Usage |
|----------|-------|-----------------|
| Database size | 500MB | ~0.1MB per 1000 scores |
| Monthly active users | 50,000 | Per user: ~1KB profile + scores |
| API requests | 500K/month | ~10 per user session |
| Bandwidth | 5GB/month | ~100KB per leaderboard load |

**Estimated capacity:** ~50,000 scores, ~10,000 active players/month

---

## Estimated Effort

- **Supabase setup:** 1 hour
- **Client implementation:** 3 hours
- **UI implementation:** 2 hours
- **Anti-cheat logic:** 2 hours
- **Integration:** 1 hour
- **Testing:** 2 hours

**Total:** 11 hours

---

## Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

Install with: `npm install @supabase/supabase-js`

---

## Status

- [ ] Create Supabase project and tables
- [ ] Create SupabaseClient.ts
- [ ] Create LeaderboardService.ts
- [ ] Create AntiCheat.ts
- [ ] Create LeaderboardScreen.ts UI
- [ ] Add types to types.ts
- [ ] Integrate with main.ts
- [ ] Write unit tests
- [ ] Manual testing
- [ ] Deploy and verify

---

*Created: 2026-03-04*
