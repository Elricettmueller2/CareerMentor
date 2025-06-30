# CareerMentor Global State System

This document provides an overview of the global state management system implemented for the CareerMentor application. The system enables seamless data and knowledge transfer across all agents, systems, and pages within the application.

## Architecture Overview

The global state system consists of the following components:

### Frontend (React Native + TypeScript)

1. **GlobalStateService.ts**
   - Centralized state management using a reactive pattern
   - Persists state in AsyncStorage
   - Provides methods for accessing and updating state

2. **useGlobalState.ts**
   - React hooks for easy access to global state in components
   - Provides specialized hooks for different parts of the state

3. **GlobalSyncService.ts**
   - Handles synchronization between frontend and backend
   - Provides methods to sync state, get backend state, and update knowledge

### Backend (Python + FastAPI)

1. **MongoDB Implementation**
   - **services/mongodb/client.py**: MongoDB client singleton for database connections
   - **services/mongodb/global_state_service.py**: MongoDB-backed global state service
   - **services/mongodb/sync_service.py**: Sync service for MongoDB implementation

2. **global_state_service.py** (Legacy SQLite Implementation)
   - Singleton service for managing global state
   - Persists state in SQLite database
   - Provides methods to get/set state components

3. **sync_service.py** (Legacy SQLite Implementation)
   - Handles conversion between frontend and backend formats
   - Provides methods to sync state from frontend and update knowledge

3. **API Endpoints**
   - `/global-state`: Get the current global state
   - `/global-state/sync`: Sync global state from frontend
   - `/global-state/knowledge`: Update specific knowledge items

## Global State Structure

The global state is structured as follows:

```typescript
interface GlobalState {
  userId: string | null;
  session: Record<string, any>;
  agentKnowledge: {
    userProfile: {
      name: string;
      email: string;
      phone: string;
      skills: string[];
      experience: string[];
      education: string[];
      preferences: {
        jobTypes: string[];
        locations: string[];
        salary: {
          min: number;
          max: number;
          currency: string;
        };
      };
    };
    interview: {
      currentSessionId: string | null;
      history: {
        [sessionId: string]: {
          jobRole: string;
          experienceLevel: string;
          messages: {
            text: string;
            sender: 'agent' | 'user';
          }[];
          feedback?: string;
          score?: number;
          endedAt?: string;
        };
      };
    };
    resume: {
      currentResumeId: string | null;
      resumes: {
        [resumeId: string]: {
          content: string;
          feedback: string;
          score: number;
          version: number;
        };
      };
    };
    jobSearch: {
      savedJobs: any[];
      searchHistory: any[];
      recentSearches: any[];
    };
    applications: Record<string, any>;
  };
  system: {
    isOnline: boolean;
    lastSyncTime: number | null;
    apiEndpoints: {
      base: string;
      mockMate: string;
      trackPal: string;
      resumeRefiner: string;
    };
  };
}
```

## Usage Examples

### Frontend

#### Accessing Global State in Components

```typescript
import { useGlobalState, useAgentKnowledge, useUserId } from '@/hooks/useGlobalState';

function MyComponent() {
  // Access the entire state
  const [state, setState] = useGlobalState();
  
  // Access specific parts of the state
  const [userId, setUserId] = useUserId();
  const [userProfile, setUserProfile] = useAgentKnowledge('userProfile');
  
  // Example: Update user profile
  const updateUserName = (name: string) => {
    setUserProfile({
      ...userProfile,
      name
    });
  };
  
  return (
    // Your component JSX
  );
}
```

#### Syncing with Backend

```typescript
import GlobalSyncService from '@/services/GlobalSyncService';

// Initialize sync on app startup
useEffect(() => {
  GlobalSyncService.initialize();
}, []);

// Manually sync with backend
const syncData = async () => {
  const result = await GlobalSyncService.syncWithBackend();
  if (result.success) {
    console.log('Sync successful');
  } else {
    console.error('Sync failed:', result.message);
  }
};
```

### Backend

#### Accessing Global State in Agents (MongoDB Implementation)

```python
from services.mongodb.global_state_service import global_state

# The global state service is already instantiated as a singleton

# Get user profile
user_id = "user123"
user_profile = global_state.get_user_profile(user_id)

# Update interview knowledge
session_id = "interview_123"
global_state.update_interview_session(user_id, session_id, {
    "feedback": "Great communication skills demonstrated",
    "score": 85
})
```

#### Handling Sync Requests (MongoDB Implementation)

```python
from services.mongodb.sync_service import sync_service

# The sync service is already instantiated as a singleton

# Sync from frontend
frontend_state = {...}  # State from frontend
result = sync_service.sync_from_frontend(frontend_state)

# Get backend state for frontend
backend_state = sync_service.get_backend_state("user123")
```

## Integration with Existing Components

The interview.tsx component has been updated to use the global state system. Key changes include:

1. Using `useAgentKnowledge` hook to access and update interview data
2. Storing interview sessions in the global state
3. Persisting messages and session information

## Best Practices

1. **State Updates**: Always update state immutably using the setter functions provided by hooks
2. **Synchronization**: Call `GlobalSyncService.syncWithBackend()` after important state changes
3. **Error Handling**: Handle sync errors gracefully and provide feedback to users
4. **Type Safety**: Ensure all state updates conform to the defined types

## Future Enhancements

1. **Real-time Sync**: Implement WebSocket for real-time updates between frontend and backend
2. **Conflict Resolution**: Add mechanisms to resolve conflicts during sync
3. **Offline Support**: Enhance offline capabilities with better queue management
4. **State Versioning**: Add versioning to track state changes over time
5. **Security**: Implement authentication and authorization for state access

## Troubleshooting

1. **Sync Issues**: Check network connectivity and API endpoint configuration
2. **State Persistence**: Verify AsyncStorage and SQLite are working correctly
3. **Type Errors**: Ensure state updates match the defined TypeScript interfaces
