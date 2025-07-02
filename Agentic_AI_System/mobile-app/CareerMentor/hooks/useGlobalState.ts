import { useState, useEffect } from 'react';
import GlobalState, { GlobalState as GlobalStateType } from '../services/GlobalStateService';
import { Observable } from 'rxjs';

/**
 * Hook to access the global state in React components
 * 
 * @param selector Optional selector function to get a specific part of the state
 * @returns The selected part of the state (or the entire state if no selector is provided)
 */
export function useGlobalState<T = GlobalStateType>(
  selector?: (state: GlobalStateType) => T
): T {
  // Get the initial state
  const initialState = selector ? selector(GlobalState.getState()) : GlobalState.getState() as unknown as T;
  const [state, setState] = useState<T>(initialState);

  useEffect(() => {
    // Wait for initialization to complete
    GlobalState.waitForInitialization().then(() => {
      // Create an observable based on the selector
      const observable: Observable<any> = selector
        ? new Observable<T>((subscriber) => {
            const subscription = GlobalState.getState$().subscribe((globalState) => {
              subscriber.next(selector(globalState));
            });
            return () => subscription.unsubscribe();
          })
        : GlobalState.getState$() as unknown as Observable<T>;

      // Subscribe to the observable
      const subscription = observable.subscribe((newState) => {
        setState(newState);
      });

      // Clean up the subscription
      return () => subscription.unsubscribe();
    });
  }, []);

  return state;
}

/**
 * Hook to access a specific part of the agent knowledge
 * 
 * @param key The key of the knowledge to access
 * @returns The knowledge value and a function to update it
 */
export function useAgentKnowledge<K extends keyof GlobalStateType['agentKnowledge']>(
  key: K
): [GlobalStateType['agentKnowledge'][K], (value: GlobalStateType['agentKnowledge'][K]) => Promise<void>] {
  const knowledge = useGlobalState((state) => state.agentKnowledge[key]);
  
  const setKnowledge = async (value: GlobalStateType['agentKnowledge'][K]) => {
    await GlobalState.setKnowledge(key, value);
  };
  
  return [knowledge, setKnowledge];
}

/**
 * Hook to access the user profile
 * 
 * @returns The user profile and a function to update it
 */
export function useUserProfile(): [
  GlobalStateType['agentKnowledge']['userProfile'],
  (updater: (profile: GlobalStateType['agentKnowledge']['userProfile']) => GlobalStateType['agentKnowledge']['userProfile']) => Promise<void>
] {
  const userProfile = useGlobalState((state) => state.agentKnowledge.userProfile);
  
  const updateUserProfile = async (
    updater: (profile: GlobalStateType['agentKnowledge']['userProfile']) => GlobalStateType['agentKnowledge']['userProfile']
  ) => {
    await GlobalState.updateNested('agentKnowledge', 'userProfile', updater);
  };
  
  return [userProfile, updateUserProfile];
}

/**
 * Hook to access the user ID
 * 
 * @returns The user ID and a function to update it
 */
export function useUserId(): [string, (userId: string) => Promise<void>] {
  const userId = useGlobalState((state) => state.user.id);
  
  const setUserId = async (newUserId: string) => {
    await GlobalState.setUserId(newUserId);
  };
  
  return [userId, setUserId];
}

/**
 * Hook to access session values (temporary, not persisted)
 * 
 * @param key The key of the session value to access
 * @returns The session value and a function to update it
 */
export function useSessionValue<K extends keyof GlobalStateType['session']>(
  key: K
): [GlobalStateType['session'][K], (value: GlobalStateType['session'][K]) => void] {
  const value = useGlobalState((state) => state.session[key]);
  
  const setValue = (newValue: GlobalStateType['session'][K]) => {
    GlobalState.setSessionValue(key, newValue);
  };
  
  return [value, setValue];
}

export default useGlobalState;
