import { sessionStorage } from '../storage/sessionStorage';
import { createPendingGroupStore } from './groupJoin';

// Uses encrypted, generation-based SecureStore chunks on native; never stores the token in app state or logs.
export const pendingGroup = createPendingGroupStore(sessionStorage);
